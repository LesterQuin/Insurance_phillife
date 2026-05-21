import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Model from '../models/financial_Insurance_form.model.js';
import * as User from '../models/user/user_model.js';
import { success, error } from '../utils/response.js';
import { auditLog, AuditStatus, AuditActions, normalizeIp } from '../utils/logger.js';
import sanitizeHtml from 'sanitize-html';
import * as Helper from '../middlewares/helper.js';
import { broadcastApplicationUpdate, broadcastApplicationDelete } from '../websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
// Create Application
export const createApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        let dataToSave = { ...req.body };

        // // Check if group name already exists to prevent duplicate registration
        if (dataToSave.group_name) {
            const existingGroup = await Model.getApplicationByGroupName(dataToSave.group_name);
            if (existingGroup) {
                return error(res, `An application for "${dataToSave.group_name}" (or a company with a similar name) already exists in the system.`, 400);
            }
        }
        
        // Determine initial status: Approved (2) for Prototypes (30), Checking (5) otherwise
        const STATUS_CHECKING = 5;
        const STATUS_APPROVED = 2;
        const PROTOTYPE_TYPE_ID = 30;

        dataToSave.status_id = Number(dataToSave.type_of_proposal_id) === PROTOTYPE_TYPE_ID 
            ? STATUS_APPROVED 
            : STATUS_CHECKING;

        dataToSave = Helper.cleanProposalFields(dataToSave);
        const cleanedData = await Helper.cleanupOtherFields(dataToSave);
        const channelData = Helper.handleChannelType(cleanedData, req.user);
        const processedData = Helper.preprocessRiders(channelData);
        processedData.ip_address = normalizeIp(req.ip);

        // Sanitize notes if they exist
        if (processedData.notes) {
            processedData.notes = sanitizeHtml(processedData.notes, Helper.sanitizeOptions);
        }
        if (processedData.evidence_notes) {
            processedData.evidence_notes = sanitizeHtml(processedData.evidence_notes, Helper.sanitizeOptions);
        }

        const newRecord = await Model.createApplication(processedData, userId);

        if (!newRecord || !newRecord.application_id) {
            return error(res, 'Failed to create the application.', 500);
        }

        const appId = newRecord.application_id;

        // Handle Excel file after ID is generated to include it in the filename
        const excelFile = req.files?.excel_file; 
        if (excelFile) {
            const tempFilePath = excelFile.filepath;
            const originalFilename = excelFile.originalFilename;
            
            if (!fs.existsSync(UPLOAD_DIR)) {
                fs.mkdirSync(UPLOAD_DIR, { recursive: true });
            }

            // Add application_id to the filename
            const uniqueFilename = `APP-${appId}-v${Helper.getFileTimestamp()}-${originalFilename}`;
            const newFilePath = path.join(UPLOAD_DIR, uniqueFilename);

            await fs.promises.rename(tempFilePath, newFilePath);
            
            // Update the record with the file path
            await Model.updateApplication(appId, { excel_file_path: newFilePath }, userId);
        }

        // Fetch the raw application data
        const app = await Model.getApplicationById(newRecord.application_id);
        
        // Format it to match the standard response structure
        const response = await Helper.buildApplicationResponse(app);

        // Real-time sync: Notify any listeners that a new application was created
        broadcastApplicationUpdate(appId, response);

        return success(res, response, 'Application submitted successfully', 201);
    } catch (err) {
        await auditLog(req, {
            action: AuditActions.CREATE_APPLICATION,
            entity: 'FinancialApplication',
            status: AuditStatus.ERROR,
            metadata: { error: err.message }
        });
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Check if Group Name exists
export const checkGroupName = async (req, res) => {
    try {
        const groupName = req.query.group_name;
        
        if (!groupName) {
            return error(res, 'Group name is required in the query parameters.', 400);
        }

        const existingGroup = await Model.getApplicationByGroupName(groupName);

        return success(res, { 
            exists: !!existingGroup,
            group_name: groupName 
        }, existingGroup 
            ? `An application for "${groupName}" (or a company with a similar name) already have record in the system.` 
            : `Group name "${groupName}" is available.`
        );
    } catch (err) {
        console.error('Check Group Name Error:', err);
        return error(res, err.message);
    }
};

// Download Excel File
export const downloadExcelFile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const appId = req.params.id;
        const agentCode = req.body?.agent_code || req.query?.agent_code;

        const app = await Model.getApplicationById(appId);
        if (!app) return error(res, 'Application not found', 404);

        if (!app.excel_file_path) {
            return error(res, 'No Excel file associated with this application.', 404);
        }

        const loggedInId = Number(userId);
        const creatorId = Number(app.user_id);
        
        // Authorization check: Only Creator, matching agent code, Actuarial Dept, or Super Admin
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;
        const ROLE_TL_ID = 2;
        const ROLE_SA_ID = 15;
        const ROLE_CFE_ID = 3;

        const isActuarial = loggedInUser && Number(loggedInUser.department_id) === DEPT_ACTUARIAL_ID;
        const isSuperAdmin = loggedInUser && (Number(loggedInUser.role_id) === ROLE_SA_ID || loggedInUser.roleName === 'Super Admin');
        const isTeamLeader = loggedInUser && (Number(loggedInUser.role_id) === ROLE_TL_ID || loggedInUser.roleName === 'Team Leader');
        const isCFE = loggedInUser && (Number(loggedInUser.role_id) === ROLE_CFE_ID || loggedInUser.roleName === 'Corporate Financial Executive');

        let isAuthorized = isSuperAdmin || isTeamLeader || isActuarial || (loggedInId === creatorId);
        if (!isAuthorized && agentCode) {
            const creatorUser = await User.getUserById(app.user_id);
            if (creatorUser && creatorUser.agent_code === agentCode.trim()) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return error(res, 'You are not authorized to download files for this application.', 403);
        }

        if (!fs.existsSync(app.excel_file_path)) {
            console.error(`[downloadExcelFile] File not found at: ${app.excel_file_path}`);
            return error(res, 'Excel file not found on server.', 404);
        }

        return res.download(app.excel_file_path, path.basename(app.excel_file_path));
    } catch (err) {
        console.error('Excel Download Error:', err);
        return error(res, err.message);
    }
};

// Save Application as Draft
export const saveDraft = async (req, res) => {
    try {
        const userId = req.user.user_id;
        let dataToSave = { ...req.body };
        const agentCodeFromBody = req.body.agent_code;
        const applicationId = dataToSave.application_id;

        // Set status to Draft. 
        const STATUS_DRAFT = 4;
        dataToSave.status_id = STATUS_DRAFT;

        dataToSave = Helper.cleanProposalFields(dataToSave);
        const cleanedData = await Helper.cleanupOtherFields(dataToSave);
        const channelData = Helper.handleChannelType(cleanedData, req.user);
        const processedData = Helper.preprocessRiders(channelData);
        processedData.ip_address = normalizeIp(req.ip);

        if (processedData.notes) {
            // Sanitize notes if they exist
            processedData.notes = sanitizeHtml(processedData.notes, Helper.sanitizeOptions);
        }
        if (processedData.evidence_notes) {
            processedData.evidence_notes = sanitizeHtml(processedData.evidence_notes, Helper.sanitizeOptions);
        }

        let app, finalAppId;
        if (applicationId) {
            // If an ID exists, we update the existing draft (Auto-save mode)
            const existingDraft = await Model.getApplicationById(applicationId);
            if (!existingDraft) return error(res, 'Draft not found', 404);
            
            const loggedInId = Number(userId);
            const creatorId = Number(existingDraft.user_id);
            let isAuthorized = false;

            if (loggedInId === creatorId) {
                isAuthorized = true;
            } else if (agentCodeFromBody) {
                const creatorUser = await User.getUserById(existingDraft.user_id);
                if (creatorUser && creatorUser.agent_code === agentCodeFromBody.trim()) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized) {
                return error(res, 'You are not authorized to update this draft.', 403);
            }

            const { agent_code, ...finalData } = processedData;
            finalAppId = applicationId;

            // Handle Excel file for existing draft
            const excelFile = req.files?.excel_file;
            if (excelFile) {
                if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
                const oldFilePath = existingDraft.excel_file_path;

                // Added 'v' prefix to denote a version/revision during update
                const uniqueFilename = `APP-${finalAppId}-v${Helper.getFileTimestamp()}-${excelFile.originalFilename}`;
                const newFilePath = path.join(UPLOAD_DIR, uniqueFilename);
                await fs.promises.rename(excelFile.filepath, newFilePath);
                finalData.excel_file_path = newFilePath;

                // Cleanup old file
                if (oldFilePath && fs.existsSync(oldFilePath)) {
                    fs.promises.unlink(oldFilePath).catch(e => console.error("Old file cleanup failed:", e));
                }
            }

            await Model.updateApplication(applicationId, finalData, userId);
        } else {
            // If no ID exists, create a new draft entry
            const newRecord = await Model.createApplication(processedData, userId);
            finalAppId = newRecord.application_id;

            // Handle Excel file for new draft
            const excelFile = req.files?.excel_file;
            if (excelFile) {
                if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
                const uniqueFilename = `APP-${finalAppId}-${Helper.getFileTimestamp()}-${excelFile.originalFilename}`;
                const newFilePath = path.join(UPLOAD_DIR, uniqueFilename);
                await fs.promises.rename(excelFile.filepath, newFilePath);
                
                await Model.updateApplication(finalAppId, { excel_file_path: newFilePath }, userId);
            }
        }

        app = await Model.getApplicationById(finalAppId);
        
        const response = await Helper.buildApplicationResponse(app);

        // Real-time sync: Update UI for anyone viewing this draft
        broadcastApplicationUpdate(finalAppId, response);

        return success(res, response, 'Application saved as draft successfully', applicationId ? 200 : 201);
    } catch (err) {
        console.error('Draft Save Error:', err);
        return error(res, err.message);
    }
};
// Get Template By ID (View HTML)
export const getTemplateById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const htmlContent = await Helper.generateProposalHtml(id);
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (err) {
        console.error("Proposal Generation Error:", err);
        return error(res, err.message, 500);
    }
};

// Download Template as PDF
export const downloadTemplatePDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const htmlContent = await Helper.generateProposalHtml(id);
        const pdfBuffer = await Helper.generatePDFBuffer(htmlContent);

        // Using res.writeHead to set multiple headers clearly
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=Proposal_${id}.pdf`,
            'Content-Length': pdfBuffer.length,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("PDF Download Error:", err);
        return error(res, err.message, 500);
    }
};

// View Template as PDF (inline in browser)
export const viewTemplatePDF = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return error(res, "Invalid ID format.", 400);

        const htmlContent = await Helper.generateProposalHtml(id);
        const pdfBuffer = await Helper.generatePDFBuffer(htmlContent);

        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename=Proposal_${id}.pdf`,
            'Content-Length': pdfBuffer.length,
        });

        res.end(pdfBuffer);
    } catch (err) {
        console.error("PDF View Error:", err);
        return error(res, err.message, 500);
    }
};

// Get Prototype Plan View (HTML)
export const getPrototypePlanView = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        let filename = '';

        // Map IDs to static HTML files (IDs based on seed order)
        switch (id) {
            case 1: filename = 'prototype_StudentsGroupTermLifeInsurancePlan.js'; break;
            case 2: filename = 'prototype_StudentsGroupPersonalAccidentPlan.js'; break;
            case 3: filename = 'prototype_GroupAssociationsPlan.js'; break;
            case 4: filename = 'prototype_SecurityGuardsProtectionPlan.js'; break;
            case 5: filename = 'prototype_GroupCreditLifePrototypePlanInitialLoan.js'; break;
            case 6: filename = 'prototype_GroupCreditLifeInsuranceOutstandingLoanBalance.js'; break;
            case 7: filename = 'prototype_HotelEmployeesGroupTermLifeInsurancePlan.js'; break;
            case 8: filename = 'prototype_PlanforSmallGroups.js'; break;
            case 9: filename = 'prototype_BarangayProtectPlan.js'; break;
            default: return error(res, 'Prototype plan view not found.', 404);
        }

        const filePath = path.join(__dirname, '../templates', filename);
        if (!fs.existsSync(filePath)) {
            console.error(`[getPrototypePlanView] File not found at: ${filePath}`);
            return error(res, 'Template file not found on server.', 404);
        }

        const html = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    } catch (err) {
        return error(res, err.message);
    }
};

// Get List of Prototype Plan Definitions (Dropdown List)
export const getPrototypePlans = async (req, res) => {
    try {
        const list = await Model.getPrototypePlans();
        return success(res, list, 'Prototype plans fetched successfully.');
    } catch (err) {
        return error(res, err.message);
    }
};

// Get List of Prototypes
export const getPrototypes = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const loggedInUser = await User.getUserById(userId);
        
        const DEPT_ACTUARIAL_ID = 18;
        const ROLE_TL_ID = 2;
        const ROLE_SA_ID = 15;
        const ROLE_CFE_ID = 3;

        const isActuarial = loggedInUser && Number(loggedInUser.department_id) === DEPT_ACTUARIAL_ID;
        const isSuperAdmin = loggedInUser && (Number(loggedInUser.role_id) === ROLE_SA_ID || loggedInUser.roleName === 'Super Admin');
        const isTeamLeader = loggedInUser && (Number(loggedInUser.role_id) === ROLE_TL_ID || loggedInUser.roleName === 'Team Leader');
        const isCFE = loggedInUser && (Number(loggedInUser.role_id) === ROLE_CFE_ID || loggedInUser.roleName === 'Corporate Financial Executive');

        const filterUserId = (isSuperAdmin || isTeamLeader || isActuarial) ? null : userId;

        const prototypes = await Model.getPrototypes(filterUserId);

        if (prototypes.length === 0) {
            return success(res, [], 'No prototypes found.');
        }

        // --- Bulk fetch related data ---
        const appIds = prototypes.map(app => app.application_id);

        const allRiders = await Model.getBulkApplicationRiders(appIds);
        const ridersByAppId = allRiders.reduce((acc, rider) => {
            (acc[rider.application_id] = acc[rider.application_id] || []).push(rider);
            return acc;
        }, {});
        
        const allSubGroups = await Model.getBulkApplicationSubGroups(appIds);
        const subGroupsByAppId = allSubGroups.reduce((acc, sg) => {
            (acc[sg.application_id] = acc[sg.application_id] || []).push({ id: sg.id, name: sg.name });
            return acc;
        }, {});

        const allPayments = await Model.getBulkApplicationPaymentTerms(appIds);
        const paymentsByAppId = allPayments.reduce((acc, p) => {
            (acc[p.application_id] = acc[p.application_id] || []).push({
                payment_term: { id: p.payment_term_id, name: p.payment_term_name },
                sub_payment_term: { 
                    id: p.sub_payment_term_id, 
                    name: p.sub_payment_term_name || (p.sub_payment_term_id ? p.sub_payment_term_id.toString() : null)
                }
            });
            return acc;
        }, {});

        const allRankings = await Model.getBulkCoverageRankings(appIds);
        const rankingsByAppId = allRankings.reduce((acc, r) => {
            (acc[r.application_id] = acc[r.application_id] || []).push(r);
            return acc;
        }, {});

        const allRankingRiders = await Model.getBulkCoverageRankingRiders(appIds);
        const rankingRidersByAppId = allRankingRiders.reduce((acc, rr) => {
            (acc[rr.application_id] = acc[rr.application_id] || []).push(rr);
            return acc;
        }, {});

        // --- Map the bulk-fetched data back to each application ---
        const formattedPrototypes = prototypes.map(app => {
            const rankings = rankingsByAppId[app.application_id] || [];
            const appRiders = ridersByAppId[app.application_id] || [];
            const appRankingRiders = rankingRidersByAppId[app.application_id] || [];

            // Map ranking-specific riders back to the riders array
            if ((app.coverage_type_id === 32 || app.coverage_type_id === 34) && appRankingRiders.length > 0) {
                appRiders.forEach(mainRider => {
                    const riderValues = appRankingRiders
                        .filter(rr => rr.rider_id === mainRider.rider_id)
                        .map(rr => ({ designation: rr.designation, acronym: rr.acronym, amount: rr.rider_amount, unit: rr.rider_unit }));
                    if (riderValues.length > 0) mainRider.values = riderValues;
                });
            }

            let levelRanking = null;
            let salaryRanking = null;
            if (app.coverage_type_id === 32) { 
                levelRanking = rankings.map(({ salary_multiplier, uniform_coverage_amount, application_id, ...rest }) => rest);
            } else if (app.coverage_type_id === 34) { 
                salaryRanking = rankings.map(({ uniform_coverage_amount, application_id, ...rest }) => rest);
            }

            let coverage_totals = [];
            if (app.coverage_type_id !== 34) {
                coverage_totals = rankings.map(r => ({
                    designation: r.designation,
                    total_coverage_amount: r.total_coverage_amount
                }));
            }

            return {
                application_id: app.application_id,
                user_id: app.user_id,
                user_full_name: [app.creator_firstname, app.creator_middlename, app.creator_lastname, app.creator_suffix].filter(Boolean).join(' '),
                group_name: app.group_name,
                business_nature_id: app.business_nature_id,
                sub_business_nature_id: app.sub_business_nature_id,
                business_nature: app.business_nature_id ? {
                    id: app.business_nature_id,
                    name: app.business_nature_name,
                    sub_nature: app.sub_business_nature_id ? {
                        id: app.sub_business_nature_id,
                        name: app.sub_business_nature_name
                    } : null
                } : null,
                number_of_lives: app.number_of_lives,
                contact_person: {
                    full_name: [app.contact_person_salutation, app.contact_person_firstname, app.contact_person_mi, app.contact_person_lastname].filter(Boolean).join(' '),
                    salutation: app.contact_person_salutation,
                    firstname: app.contact_person_firstname,
                    mi: app.contact_person_mi,
                    lastname: app.contact_person_lastname
                },
                status: { id: app.status_id, name: app.status_name },
                group_classification: { 
                    id: app.group_classification_id, 
                    name: app.group_classification_name,
                    other_value: app.other_group_classification
                },
                business_type: {
                    id: app.business_type_id,
                    name: app.business_type_name,
                    other_value: app.other_business_type
                },
                group_type: { 
                    id: app.group_type_id, 
                    name: app.group_type_name,
                    other_value: app.other_group_type
                },
                sub_group_types: subGroupsByAppId[app.application_id] || [],
                payment: paymentsByAppId[app.application_id] || [],
                coverage_type: {
                    id: app.coverage_type_id,
                    name: app.coverage_type_name,
                    details: app.coverage_type_id === 32 ? levelRanking : 
                            app.coverage_type_id === 34 ? salaryRanking :
                            app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null
                },
                channel_type: { 
                    id: app.channel_type_id,
                    name: app.channel_type_name,
                    channel_name: app.channel_name || null
                },
                commission_rate: app.commission_rate || null,
                service_fee: app.service_fee || null,
                level_ranking: levelRanking,
                salary_ranking: salaryRanking,
                uniform_coverage_amount: app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null,
                coverage_totals: coverage_totals,
                amount_loans: app.amount_loans_id ? { id: app.amount_loans_id, name: app.amount_loans_name } : null,
                max_loan_amount: app.max_loan_amount,
                min_loan_amount: app.min_loan_amount,
                loan_portfolio_amount: app.loan_portfolio_amount,
                loans_amount: app.loans_amount,
                borrower_age_66_70: app.borrower_age_66_70,
                borrower_age_71_75: app.borrower_age_71_75,
                borrower_age_76_80: app.borrower_age_76_80,
                type_of_proposal: {
                    id: app.type_of_proposal_id,
                    name: app.type_of_proposal_name
                },
                prototype_plan: { 
                    id: app.prototype_id, 
                    name: app.prototype_plan_name && app.prototype_plan_acronym ? `${app.prototype_plan_name} (${app.prototype_plan_acronym})` : app.prototype_plan_name 
                },
                plan: { 
                    id: app.plan_id, 
                    name: app.plan_name && app.plan_acronym ? `${app.plan_name} (${app.plan_acronym})` : app.plan_name 
                },
                basic_plan: { id: app.basic_plan_id, name: app.basic_plan_name },
                riders: appRiders,
                excel_file_path: app.excel_file_path ? path.basename(app.excel_file_path) : null,
                notes: app.notes,
                created_at: app.created_at,
                updated_at: app.updated_at,
            };
        });

        return success(res, formattedPrototypes, 'Prototypes fetched successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Get All Applications
export const getAllApplications = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const loggedInUser = await User.getUserById(userId);
        
        const DEPT_ACTUARIAL_ID = 18;
        const ROLE_TL_ID = 2;
        const ROLE_SA_ID = 15;
        const ROLE_CFE_ID = 3;

        const isActuarial = loggedInUser && Number(loggedInUser.department_id) === DEPT_ACTUARIAL_ID;
        const isSuperAdmin = loggedInUser && (Number(loggedInUser.role_id) === ROLE_SA_ID || loggedInUser.roleName === 'Super Admin');
        const isTeamLeader = loggedInUser && (Number(loggedInUser.role_id) === ROLE_TL_ID || loggedInUser.roleName === 'Team Leader');
        const isCFE = loggedInUser && (Number(loggedInUser.role_id) === ROLE_CFE_ID || loggedInUser.roleName === 'Corporate Financial Executive');

        const filterUserId = (isSuperAdmin || isTeamLeader || isActuarial) ? null : userId;

        const rawApplications = await Model.getAllApplications(filterUserId);
        if (rawApplications.length === 0) {
            return success(res, [], 'Applications fetched successfully.');
        }

        // --- Bulk fetch related data ---
        const appIds = rawApplications.map(app => app.application_id);

        const allRiders = await Model.getBulkApplicationRiders(appIds);
        const ridersByAppId = allRiders.reduce((acc, rider) => {
            (acc[rider.application_id] = acc[rider.application_id] || []).push(rider);
            return acc;
        }, {});
        
        const allSubGroups = await Model.getBulkApplicationSubGroups(appIds);
        const subGroupsByAppId = allSubGroups.reduce((acc, sg) => {
            (acc[sg.application_id] = acc[sg.application_id] || []).push({ id: sg.id, name: sg.name });
            return acc;
        }, {});

        const allPayments = await Model.getBulkApplicationPaymentTerms(appIds);
        const paymentsByAppId = allPayments.reduce((acc, p) => {
            (acc[p.application_id] = acc[p.application_id] || []).push({
                payment_term: { id: p.payment_term_id, name: p.payment_term_name },
                sub_payment_term: { 
                    id: p.sub_payment_term_id, 
                    name: p.sub_payment_term_name || (p.sub_payment_term_id ? p.sub_payment_term_id.toString() : null)
                }
            });
            return acc;
        }, {});

        const allRankings = await Model.getBulkCoverageRankings(appIds);
        const rankingsByAppId = allRankings.reduce((acc, r) => {
            (acc[r.application_id] = acc[r.application_id] || []).push(r);
            return acc;
        }, {});

        const allRankingRiders = await Model.getBulkCoverageRankingRiders(appIds);
        const rankingRidersByAppId = allRankingRiders.reduce((acc, rr) => {
            (acc[rr.application_id] = acc[rr.application_id] || []).push(rr);
            return acc;
        }, {});

        // --- Map the bulk-fetched data back to each application ---
        const formattedApplications = rawApplications.map(app => {
            const rankings = rankingsByAppId[app.application_id] || [];
            const appRiders = ridersByAppId[app.application_id] || [];
            const appRankingRiders = rankingRidersByAppId[app.application_id] || [];

            // Map ranking-specific riders back to the riders array
            if ((app.coverage_type_id === 32 || app.coverage_type_id === 34) && appRankingRiders.length > 0) {
                appRiders.forEach(mainRider => {
                    const riderValues = appRankingRiders
                        .filter(rr => rr.rider_id === mainRider.rider_id)
                        .map(rr => ({ designation: rr.designation, acronym: rr.acronym, amount: rr.rider_amount, unit: rr.rider_unit }));
                    if (riderValues.length > 0) mainRider.values = riderValues;
                });
            }

            let levelRanking = null;
            let salaryRanking = null;
            if (app.coverage_type_id === 32) { 
                levelRanking = rankings.map(({ salary_multiplier, uniform_coverage_amount, application_id, ...rest }) => rest);
            } else if (app.coverage_type_id === 34) { 
                salaryRanking = rankings.map(({ uniform_coverage_amount, application_id, ...rest }) => rest);
            }

            let coverage_totals = [];
            if (app.coverage_type_id !== 34) {
                coverage_totals = rankings.map(r => ({
                    designation: r.designation,
                    total_coverage_amount: r.total_coverage_amount
                }));
            }

            return {
                application_id: app.application_id,
                user_id: app.user_id,
                user_full_name: [app.creator_firstname, app.creator_middlename, app.creator_lastname, app.creator_suffix].filter(Boolean).join(' '),
                group_name: app.group_name,
                business_nature_id: app.business_nature_id,
                sub_business_nature_id: app.sub_business_nature_id,
                business_nature: app.business_nature_id ? {
                    id: app.business_nature_id,
                    name: app.business_nature_name,
                    sub_nature: app.sub_business_nature_id ? {
                        id: app.sub_business_nature_id,
                        name: app.sub_business_nature_name
                    } : null
                } : null,
                number_of_lives: app.number_of_lives,
                business_address: app.business_address,
                contact_number: app.contact_number,
                fax_number: app.fax_number,
                email: app.email,
                contact_person: {
                    full_name: [app.contact_person_salutation, app.contact_person_firstname, app.contact_person_mi, app.contact_person_lastname].filter(Boolean).join(' '),
                    salutation: app.contact_person_salutation,
                    firstname: app.contact_person_firstname,
                    mi: app.contact_person_mi,
                    lastname: app.contact_person_lastname
                },
                designation: app.designation,
                proposal_addressee: app.proposal_addressee,
                addressee_designation: app.addressee_designation,
                minimum_age: app.minimum_age,
                maximum_age: app.maximum_age,
                status: { id: app.status_id, name: app.status_name },
                group_classification: { 
                    id: app.group_classification_id, 
                    name: app.group_classification_name,
                    other_value: app.other_group_classification
                },
                business_type: {
                    id: app.business_type_id,
                    name: app.business_type_name,
                    other_value: app.other_business_type
                },
                group_type: { 
                    id: app.group_type_id, 
                    name: app.group_type_name,
                    other_value: app.other_group_type
                },
                sub_group_types: subGroupsByAppId[app.application_id] || [],
                payment_mode: { id: app.payment_mode_id, name: app.payment_mode_name },
                coverage_type: {
                    id: app.coverage_type_id,
                    name: app.coverage_type_name,
                    details: app.coverage_type_id === 32 ? levelRanking : 
                            app.coverage_type_id === 34 ? salaryRanking :
                            app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null
                },
                channel_type: {
                    id: app.channel_type_id,
                    name: app.channel_type_name,
                    channel_name: app.channel_name || null
                },
                commission_rate: app.commission_rate || null,
                service_fee: app.service_fee || null,
                payment: paymentsByAppId[app.application_id] || [],
                type_of_proposal: {
                    id: app.type_of_proposal_id,
                    name: app.type_of_proposal_name
                },
                prototype_plan: { 
                    id: app.prototype_id, 
                    name: app.prototype_plan_name && app.prototype_plan_acronym ? `${app.prototype_plan_name} (${app.prototype_plan_acronym})` : app.prototype_plan_name 
                },
                plan: { 
                    id: app.plan_id, 
                    name: app.plan_name && app.plan_acronym ? `${app.plan_name} (${app.plan_acronym})` : app.plan_name 
                },
                basic_plan: { id: app.basic_plan_id, name: app.basic_plan_name },
                amount_loans: app.amount_loans_id ? { id: app.amount_loans_id, name: app.amount_loans_name } : null,
                loans_amount: app.loans_amount,
                max_loan_amount: app.max_loan_amount,
                min_loan_amount: app.min_loan_amount,
                loan_portfolio_amount: app.loan_portfolio_amount,
                level_ranking: levelRanking,
                salary_ranking: salaryRanking,
                uniform_coverage_amount: app.coverage_type_id === 33 ? (rankings[0]?.uniform_coverage_amount || null) : null,
                borrower_age_66_70: app.borrower_age_66_70,
                borrower_age_71_75: app.borrower_age_71_75,
                borrower_age_76_80: app.borrower_age_76_80,
                coverage_totals: coverage_totals,
                riders: appRiders,
                excel_file_path: app.excel_file_path ? path.basename(app.excel_file_path) : null,
                notes: app.notes,
                created_at: app.created_at,
                updated_at: app.updated_at,
            };
        });

        return success(res, formattedApplications, 'Applications fetched successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Save/Update Rates for Application
export const saveRates = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        // 1. Department Check: Only Actuarial (ID 18) can set or update rates
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;

        if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            return error(res, 'Access Denied: Only users from the Actuarial department are authorized to input or update rates.', 403);
        }

        const application_id = req.params.id;
        const ratesData = req.body;

        const existingApplication = await Model.getApplicationById(application_id);
        if (!existingApplication) {
            return error(res, 'Application not found', 404);
        }

        // 2. Save Rates to Normalized Table
        await Model.saveApplicationRates(application_id, ratesData);

        await Helper.updateActuarialStatus(application_id, userId);

        const updatedApp = await Model.getApplicationById(application_id);
        const response = await Helper.buildApplicationResponse(updatedApp);
        return success(res, response, 'Rates saved successfully.');

    } catch (err) {
        console.error('Save Rates Error:', err);
        return error(res, err.message);
    }
};

// Save/Update Evidence Notes for Application (Actuarial only)
export const saveEvidenceNotes = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;
        let { evidence_notes } = req.body;

        // Department Check: Only Actuarial (ID 18) can input or update evidence notes
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;

        if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            return error(res, 'Access Denied: Only users from the Actuarial department are authorized to input the evidence of insurability notes.', 403);
        }

        const existingApplication = await Model.getApplicationById(id);
        if (!existingApplication) {
            return error(res, 'Application not found', 404);
        }

        if (evidence_notes) {
            evidence_notes = sanitizeHtml(evidence_notes, Helper.sanitizeOptions);
        }

        await Model.updateApplication(id, { evidence_notes }, userId);

        await Helper.updateActuarialStatus(id, userId);

        const updatedApp = await Model.getApplicationById(id);
        const response = await Helper.buildApplicationResponse(updatedApp);
        return success(res, response, 'Evidence of insurability notes saved successfully.');
    } catch (err) {
        console.error('Save Evidence Notes Error:', err);
        return error(res, err.message);
    }
};

// Save/Update Total Annual Premium for Application
export const saveTotalAnnualPremium = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;
        const { total_annual_premium } = req.body;

        // Department Check: Only Actuarial (ID 18) can input or update total premium
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;

        if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            return error(res, 'Access Denied: Only users from the Actuarial department are authorized to input the total annual premium.', 403);
        }

        const existingApplication = await Model.getApplicationById(id);
        if (!existingApplication) {
            return error(res, 'Application not found', 404);
        }

        // Validation: If total annual premium is already set, POST should fail
        if (req.method === 'POST' && existingApplication.total_annual_premium !== null) {
            return error(res, 'Total annual premium already exists for this application. Please use PUT to update existing data.', 400);
        }

        await Model.updateApplication(id, { total_annual_premium }, userId);

        await Helper.updateActuarialStatus(id, userId);

        const updatedApp = await Model.getApplicationById(id);
        const response = await Helper.buildApplicationResponse(updatedApp);
        return success(res, response, 'Total Annual Premium saved successfully.');
    } catch (err) {
        console.error('Save Total Premium Error:', err);
        return error(res, err.message);
    }
};

// Save/Update Max Loan Amounts for Application
// export const saveMaxAmounts = async (req, res) => {
//     try {
//         const userId = req.user.user_id;
//         const id = req.params.id;
//         const { max_amount_18_64, max_amount_66_70, max_amount_71_75, max_amount_76_80 } = req.body;

//         const loggedInUser = await User.getUserById(userId);
//         const DEPT_ACTUARIAL_ID = 18;

//         if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
//             return error(res, 'Access Denied: Only users from the Actuarial department are authorized to input maximum amounts.', 403);
//         }

//         const existingApplication = await Model.getApplicationById(id);
//         if (!existingApplication) {
//             return error(res, 'Application not found', 404);
//         }

//         // Validation: If any max amount is already set, POST should fail
//         const hasExistingMaxAmounts = [
//             existingApplication.max_amount_18_64, existingApplication.max_amount_66_70,
//             existingApplication.max_amount_71_75, existingApplication.max_amount_76_80
//         ].some(val => val !== null);

//         if (req.method === 'POST' && hasExistingMaxAmounts) {
//             return error(res, 'Maximum amounts already exist for this application. Please use PUT to update existing data.', 400);
//         }

//         await Model.updateApplication(id, { max_amount_18_64, max_amount_66_70, max_amount_71_75, max_amount_76_80 }, userId);

//         const updatedApp = await Model.getApplicationById(id);
//         const response = await buildApplicationResponse(updatedApp);
//         return success(res, response, 'Maximum amounts saved successfully.');
//     } catch (err) {
//         console.error('Save Max Amounts Error:', err);
//         return error(res, err.message);
//     }
// };

// Get applications pending actuarial rate input
export const getApplicationsPendingRates = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;

        if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            return error(res, 'Access Denied: Only users from the Actuarial department can view the rate input queue.', 403);
        }

        const list = await Model.getApplicationsPendingRates();
        return success(res, list, 'Applications pending rates fetched successfully.');
    } catch (err) {
        console.error('Pending Rates Queue Error:', err);
        return error(res, err.message);
    }
};

// Get applications pending total annual premium input
export const getApplicationsPendingTotalPremium = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;

        if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            return error(res, 'Access Denied: Only users from the Actuarial department can view the total annual premium input queue.', 403);
        }

        const list = await Model.getApplicationsPendingTotalPremium();
        return success(res, list, 'Applications pending total annual premium fetched successfully.');
    } catch (err) {
        console.error('Pending Total Premium Queue Error:', err);
        return error(res, err.message);
    }
};

// Get applications pending max amounts input
// export const getApplicationsPendingMaxAmounts = async (req, res) => {
//     try {
//         const userId = req.user.user_id;
//         const loggedInUser = await User.getUserById(userId);
//         const DEPT_ACTUARIAL_ID = 18;

//         if (!loggedInUser || Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
//             return error(res, 'Access Denied: Only users from the Actuarial department can view the maximum amounts input queue.', 403);
//         }

//         const list = await Model.getApplicationsPendingMaxAmounts();
//         return success(res, list, 'Applications pending maximum amounts fetched successfully.');
//     } catch (err) {
//         console.error('Pending Max Amounts Queue Error:', err);
//         return error(res, err.message);
//     }
// };

// Get Application History Logs
export const getApplicationHistory = async (req, res) => {
    try {
        const history = await Model.getApplicationHistory(req.params.id);
        return success(res, history, 'Application history fetched successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Get Application by ID
export const getApplicationById = async (req, res) => {
    try {
        const app = await Model.getApplicationById(req.params.id);
        if (!app) return error(res, 'Application not found', 404);

        const userId = req.user.user_id;
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;
        const ROLE_TL_ID = 2;
        const ROLE_SA_ID = 15;
        const ROLE_CFE_ID = 3;
        
        const isOwner = Number(app.user_id) === Number(userId);
        const isActuarial = loggedInUser && Number(loggedInUser.department_id) === DEPT_ACTUARIAL_ID;
        const isSuperAdmin = loggedInUser && (Number(loggedInUser.role_id) === ROLE_SA_ID || loggedInUser.roleName === 'Super Admin');
        const isTeamLeader = loggedInUser && (Number(loggedInUser.role_id) === ROLE_TL_ID || loggedInUser.roleName === 'Team Leader');
        const isCFE = loggedInUser && (Number(loggedInUser.role_id) === ROLE_CFE_ID || loggedInUser.roleName === 'Corporate Financial Executive');

        if (!isOwner && !isActuarial && !isSuperAdmin && !isTeamLeader && !isCFE) {
            return error(res, 'You are not authorized to view this application.', 403);
        }

        const response = await Helper.buildApplicationResponse(app);

        return success(res, response);
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Update Application
export const updateApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        
        console.log('=== UPDATE DEBUG ===');
        console.log('Logged in userId:', userId, 'Type:', typeof userId);
        const agentCodeFromBody = req.body.agent_code;
        
        // Get the existing application to check ownership
        const existingApplication = await Model.getApplicationById(req.params.id);
        if (!existingApplication) {
            return error(res, 'Application not found', 404);
        }
        
        console.log('Application user_id:', existingApplication.user_id, 'Type:', typeof existingApplication.user_id);

        const loggedInId = Number(userId);
        const creatorId = Number(existingApplication.user_id);
        
        console.log('Comparing:', loggedInId, '===', creatorId);
        
        let isAuthorized = false;
        
        if (loggedInId === creatorId) {
            console.log('User is the creator - authorized');
            isAuthorized = true;
        } else if (agentCodeFromBody) {
            const creatorUser = await User.getUserById(existingApplication.user_id);
            console.log('Creator user agent_code:', creatorUser?.agent_code, 'Provided:', agentCodeFromBody);
            if (creatorUser && creatorUser.agent_code === agentCodeFromBody.trim()) {
                isAuthorized = true;
            }
        }
        
        if (!isAuthorized) {
            return error(res, 'You are not authorized to update this application. Only the original agent can update it.', 403);
        }

        // Prevent non-actuarial from updating evidence_notes via general update
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;
        
        if (Number(loggedInUser.department_id) !== DEPT_ACTUARIAL_ID) {
            delete req.body.evidence_notes;
        }
        
        const { agent_code, ...updateData } = req.body;
        
        // Automatically transition from Draft: Approved (2) for Prototypes (30), Checking (5) otherwise
        const STATUS_DRAFT = 4;
        const STATUS_CHECKING = 5;
        const STATUS_APPROVED = 2;
        const PROTOTYPE_TYPE_ID = 30;

        if (Number(existingApplication.status_id) === STATUS_DRAFT) {
            const typeId = updateData.type_of_proposal_id !== undefined 
                ? Number(updateData.type_of_proposal_id) 
                : Number(existingApplication.type_of_proposal_id);
            
            updateData.status_id = typeId === PROTOTYPE_TYPE_ID ? STATUS_APPROVED : STATUS_CHECKING;
        }

        const cleanedProposal = Helper.cleanProposalFields(updateData);
        const cleanedData = await Helper.cleanupOtherFields(cleanedProposal);
        const channelData = Helper.handleChannelType(cleanedData, req.user);
        const processedData = Helper.preprocessRiders(channelData);
        processedData.ip_address = normalizeIp(req.ip);

        // Sanitize notes if they exist
        if (processedData.notes) {
            processedData.notes = sanitizeHtml(processedData.notes, Helper.sanitizeOptions);
        }
        if (processedData.evidence_notes) {
            processedData.evidence_notes = sanitizeHtml(processedData.evidence_notes, Helper.sanitizeOptions);
        }

        const appId = req.params.id;

        // Handle Excel file during update with application_id in filename
        const excelFile = req.files?.excel_file; // Assuming req.files is populated by formidable
        if (excelFile) {
            const tempFilePath = excelFile.filepath;
            const originalFilename = excelFile.originalFilename;
            const oldFilePath = existingApplication.excel_file_path;
            
            if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

            // Added 'v' prefix to denote a version/revision during update
            const uniqueFilename = `APP-${appId}-v${Helper.getFileTimestamp()}-${originalFilename}`;
            const newFilePath = path.join(UPLOAD_DIR, uniqueFilename);

            await fs.promises.rename(tempFilePath, newFilePath);
            console.log(`File saved permanently to: ${newFilePath}`);
            
            processedData.excel_file_path = newFilePath;

            // Cleanup old file if it exists
            if (oldFilePath && fs.existsSync(oldFilePath)) {
                fs.promises.unlink(oldFilePath).catch(e => console.error("Old file cleanup failed:", e));
            }
        }

        const updated = await Model.updateApplication(req.params.id, processedData, userId);
        const response = await Helper.buildApplicationResponse(updated);

        // Real-time sync: Critical for the UI to show the updated data (status, amounts, etc.) immediately
        broadcastApplicationUpdate(req.params.id, response);

        await auditLog(req, {
            userId: userId,
            action: AuditActions.UPDATE_APPLICATION,
            entity: 'FinancialApplication',
            entityId: req.params.id,
            status: AuditStatus.INFO
        });

        return success(res, response, 'Application updated successfully.');
    } catch (err) {
        await auditLog(req, {
            action: AuditActions.UPDATE_APPLICATION,
            entity: 'FinancialApplication',
            entityId: req.params.id,
            status: AuditStatus.ERROR,
            metadata: { error: err.message }
        });
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Upload Excel File separately
export const uploadExcelFile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const appId = req.params.id;
        const excelFile = req.files?.excel_file;

        const app = await Model.getApplicationById(appId);
        if (!app) return error(res, 'Application not found', 404);

        const loggedInId = Number(userId);
        const creatorId = Number(app.user_id);
        const agentCodeFromBody = req.body.agent_code;
        let isAuthorized = false;

        if (loggedInId === creatorId) {
            isAuthorized = true;
        } else if (agentCodeFromBody) {
            const creatorUser = await User.getUserById(app.user_id);
            if (creatorUser && creatorUser.agent_code === agentCodeFromBody.trim()) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return error(res, 'You are not authorized to upload files for this application.', 403);
        }

        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

        const oldFilePath = app.excel_file_path;

        const uniqueFilename = `APP-${appId}-v${Helper.getFileTimestamp()}-${excelFile.originalFilename}`;
        const newFilePath = path.join(UPLOAD_DIR, uniqueFilename);

        await fs.promises.rename(excelFile.filepath, newFilePath);

        await Model.updateApplication(appId, { excel_file_path: newFilePath }, userId);

        // Cleanup old file
        if (oldFilePath && fs.existsSync(oldFilePath)) {
            fs.promises.unlink(oldFilePath).catch(e => console.error("Old file cleanup failed:", e));
        }

        const updated = await Model.getApplicationById(appId);
        const response = await Helper.buildApplicationResponse(updated);

        // Real-time sync: Notify that the Excel file is now available for download
        broadcastApplicationUpdate(appId, response);

        await auditLog(req, {
            userId: userId,
            action: AuditActions.UPDATE_APPLICATION,
            entity: 'FinancialApplication',
            entityId: appId,
            status: AuditStatus.INFO,
            metadata: { info: 'Excel file uploaded separately' }
        });

        return success(res, response, 'Excel file uploaded successfully.');
    } catch (err) {
        console.error('File Upload Error:', err);
        return error(res, err.message);
    }
};

// Delete Application
export const deleteApplication = async (req, res) => {
    try {
        const appId = req.params.id;
        const app = await Model.getApplicationById(appId);
        if (!app) return error(res, 'Application not found', 404);

        const isOwner = Number(app.user_id) === Number(req.user.user_id);
        const isSuperAdmin = req.user.roleName === 'Super Admin';

        if (!isOwner && !isSuperAdmin) {
            return error(res, 'You are not authorized to delete this application.', 403);
        }

        await Model.deleteApplication(appId);

        // Real-time sync: Notify users that this application no longer exists
        broadcastApplicationDelete(appId);

        return success(res, null, 'Application deleted successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};
