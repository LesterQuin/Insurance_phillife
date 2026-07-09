import * as MainModel from '../../models/financial_Insurance_form.model.js';
import * as ActuarialModel from '../../models/actuarial_api/actuarial.model.js';
import * as User from '../../models/user/user_model.js';
import { success, error } from '../../utils/response.js';
import sanitizeHtml from 'sanitize-html';
import { buildApplicationResponse, sanitizeOptions, updateActuarialStatus } from '../../middlewares/helper.js';
import { broadcastApplicationUpdate } from '../../websocket.js';
import XLSX from 'xlsx';

export const saveRates = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const application_id = req.params.id;
        const ratesData = req.body;
        const existingApplication = await MainModel.getApplicationById(application_id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        // Prevent multiple POST submissions if rates already exist
        if (req.method === 'POST') {
            const existingRates = await ActuarialModel.getApplicationRates(application_id);
            if (existingRates && existingRates.length > 0) {
                return error(res, 'Rates have already been defined for this application. Please use the PUT method to update existing rates.', 400);
            }
        }

        await ActuarialModel.saveApplicationRates(application_id, ratesData, userId);

        await updateActuarialStatus(application_id, userId);
        
        const updatedApp = await MainModel.getApplicationById(application_id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify all users viewing this application that rates/status changed
        broadcastApplicationUpdate(application_id, response);

        return success(res, response, 'Rates saved successfully.');
    } catch (err) {
        console.error('Save Rates Error:', err);
        return error(res, err.message);
    }
};

export const saveEvidenceNotes = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;
        let { evidence_notes } = req.body;

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        if (evidence_notes) {
            evidence_notes = sanitizeHtml(evidence_notes, sanitizeOptions);
        }

        await MainModel.updateApplication(id, { evidence_notes }, userId);

        await updateActuarialStatus(id, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify users of updated evidence notes
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Evidence of insurability notes saved successfully.');
    } catch (err) {
        console.error('Save Evidence Notes Error:', err);
        return error(res, err.message);
    }
};

export const saveTotalAnnualPremium = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;
        const { total_annual_premium } = req.body;

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        if (req.method === 'POST' && existingApplication.total_annual_premium !== null) {
            return error(res, 'Total annual premium already exists. Use PUT to update.', 400);
        }

        await MainModel.updateApplication(id, { total_annual_premium }, userId);

        await updateActuarialStatus(id, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify users of updated total premium
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Total Annual Premium saved successfully.');
    } catch (err) {
        console.error('Save Total Premium Error:', err);
        return error(res, err.message);
    }
};

export const releaseApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;

        // 1. Authorization check: Only Actuarial (Dept 18) or Super Admin
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;
        const isActuarial = loggedInUser && Number(loggedInUser.department_id) === DEPT_ACTUARIAL_ID;
        const isSuperAdmin = loggedInUser && loggedInUser.roleName === 'Super Admin';

        if (!isActuarial && !isSuperAdmin) {
            return error(res, 'Access Denied: Only users from the Actuarial department or Super Admins are authorized to release applications.', 403);
        }

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        const STATUS_APPROVED = 14;
        const STATUS_RELEASED = 15;

        if (Number(existingApplication.status_id) !== STATUS_APPROVED) {
            return error(res, 'Only applications with "Approved" status can be finalized and released.', 400);
        }

        await MainModel.updateApplication(id, { status_id: STATUS_RELEASED }, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Critical for the UI to show the "Released" state immediately
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Application has been successfully finalized and released.');
    } catch (err) {
        console.error('Release Application Error:', err);
        return error(res, err.message);
    }
};

export const rejectApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;

        // 1. Authorization check: Only Actuarial (Dept 18) or Super Admin
        const loggedInUser = await User.getUserById(userId);
        const DEPT_ACTUARIAL_ID = 18;
        const isActuarial = loggedInUser && Number(loggedInUser.department_id) === DEPT_ACTUARIAL_ID;
        const isSuperAdmin = loggedInUser && loggedInUser.roleName === 'Super Admin';

        if (!isActuarial && !isSuperAdmin) {
            return error(res, 'Access Denied: Only users from the Actuarial department or Super Admins are authorized to reject applications.', 403);
        }

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        // Terminal or Draft states cannot be rejected (17 = Rejected, 15 = Released, 6 = Closed)
        if ([17, 15, 6].includes(Number(existingApplication.status_id))) {
            return error(res, 'Applications that are already Rejected, Released, or in Draft cannot be updated to Rejected status.', 400);
        }

        const STATUS_REJECTED = 17;
        await MainModel.updateApplication(id, { status_id: STATUS_REJECTED }, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify users that the application was rejected
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Application has been successfully rejected.');
    } catch (err) {
        console.error('Reject Application Error:', err);
        return error(res, err.message);
    }
};

export const unrejectApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;

        // 1. Authorization check: Strictly Super Admin only for un-rejecting
        const loggedInUser = await User.getUserById(userId);
        const isSuperAdmin = loggedInUser && loggedInUser.roleName === 'Super Admin';

        if (!isSuperAdmin) {
            return error(res, 'Access Denied: Only Super Admins are authorized to un-reject applications.', 403);
        }

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        // Check if the application is actually rejected
        if (Number(existingApplication.status_id) !== 17) {
            return error(res, 'Only applications with "Rejected" status can be un-rejected.', 400);
        }

        const STATUS_PENDING = 8;
        await MainModel.updateApplication(id, { status_id: STATUS_PENDING }, userId);
        await updateActuarialStatus(id, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        // Real-time sync: Notify users that the rejection was reversed
        broadcastApplicationUpdate(id, response);

        return success(res, response, 'Application has been successfully un-rejected and set to Pending.');
    } catch (err) {
        console.error('Un-reject Application Error:', err);
        return error(res, err.message);
    }
};

export const getApplicationsPendingRates = async (req, res) => {
    try {
        const list = await ActuarialModel.getApplicationsPendingRates();
        return success(res, list, 'Applications pending rates fetched successfully.');
    } catch (err) {
        console.error('Pending Rates Queue Error:', err);
        return error(res, err.message);
    }
};

export const getApplicationsPendingTotalPremium = async (req, res) => {
    try {
        const list = await ActuarialModel.getApplicationsPendingTotalPremium();
        return success(res, list, 'Applications pending total annual premium fetched successfully.');
    } catch (err) {
        console.error('Pending Total Premium Queue Error:', err);
        return error(res, err.message);
    }
};

export const downloadRatesTemplate = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const app = await MainModel.getApplicationById(applicationId);
        if (!app) return error(res, 'Application not found', 404);

        const planId = Number(app.plan_id);
        const numLives = Number(app.number_of_lives);

        const selectedRiders = await MainModel.getApplicationRiders(applicationId);

        const basicHeader = app.basic_plan_name || 'Base Premium Rate';

        // Build Excel columns: Age Bracket, Attained Age / Band, [Loan Term (Months) (if planId === 1)], basic plan name, Rider_<acronyms...>
        const columns = ['Age Bracket', 'Attained Age / Band'];
        if (planId === 1) {
            columns.push('Loan Term (Months)');
        }
        columns.push(basicHeader);

        selectedRiders.forEach(r => {
            const acronym = r.acronym || `Rider_${r.rider_id}`;
            columns.push(`Rider_${acronym.trim()}`);
        });

        const rows = [];

        // Helper to add a row
        const addRow = (bracket, ageOrBand, term = null) => {
            const row = {
                'Age Bracket': bracket,
                'Attained Age / Band': ageOrBand
            };
            if (planId === 1) {
                row['Loan Term (Months)'] = term;
            }
            row[basicHeader] = ''; // Pre-fill blank for rate input
            selectedRiders.forEach(r => {
                const acronym = r.acronym || `Rider_${r.rider_id}`;
                row[`Rider_${acronym.trim()}`] = '';
            });
            rows.push(row);
        };

        const maturity = planId === 1 ? Number(app.sub_payment_term_id) : 0;

        // Generate rows based on plan
        if (planId === 1) { // GCLI
            // 1. Bracket 18-65 Basic Plan: month 1 to maturity
            if (maturity > 0) {
                for (let m = 1; m <= maturity; m++) {
                    addRow('18-65', 'basic_plan', m);
                }
                // Optional: add rows for rates if separate (but basic_plan is standard)
                if (selectedRiders.length > 0) {
                    for (let m = 1; m <= maturity; m++) {
                        addRow('18-65', 'rates', m);
                    }
                }
            }

            // 2. Active Senior Brackets for GCLI: individual ages and month 1 to Math.min(maturity, 12)
            const seniorBrackets = ['66-70', '71-75', '76-80'];
            seniorBrackets.forEach(bracket => {
                const bracketFlag = `borrower_age_${bracket.replace('-', '_')}`;
                if (app[bracketFlag]) {
                    const [startAge, endAge] = bracket.split('-').map(Number);
                    const seniorMaturity = Math.min(maturity, 12);
                    for (let age = startAge; age <= endAge; age++) {
                        for (let m = 1; m <= seniorMaturity; m++) {
                            addRow(bracket, `age_${age}`, m);
                        }
                    }
                }
            });
        } else { // GYRT (2) or GPA (3)
            const isDetailed = numLives <= 30; // Scale 1

            if (isDetailed) {
                // Bracket 18-65: age bands and individual ages 35-65
                addRow('18-65', '18-24');
                addRow('18-65', '25-29');
                addRow('18-65', '30-34');
                for (let age = 35; age <= 65; age++) {
                    addRow('18-65', `age_${age}`);
                }
            } else {
                // Bracket 18-65: flat rates row
                addRow('18-65', 'rates');
            }

            // Active Senior Brackets: individual ages (only active in GYRT)
            if (planId === 2) {
                const seniorBrackets = ['66-70', '71-75', '76-80'];
                seniorBrackets.forEach(bracket => {
                    const bracketFlag = `borrower_age_${bracket.replace('-', '_')}`;
                    if (app[bracketFlag]) {
                        const [startAge, endAge] = bracket.split('-').map(Number);
                        for (let age = startAge; age <= endAge; age++) {
                            addRow(bracket, `age_${age}`);
                        }
                    }
                });
            }
        }

        // Generate worksheet and workbook using XLSX
        const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Rates');

        // Add App Metadata sheet for import validation
        const metadataRows = [
            { 'Metadata Key': 'Application ID', 'Value': applicationId },
            { 'Metadata Key': 'Company Name', 'Value': app.group_name || '' },
            { 'Metadata Key': 'Generated At', 'Value': new Date().toISOString().split('T')[0] }
        ];
        const metadataWorksheet = XLSX.utils.json_to_sheet(metadataRows);
        XLSX.utils.book_append_sheet(workbook, metadataWorksheet, 'App Metadata');

        // Fetch all plan riders to build a reference sheet
        const allPlanRiders = await MainModel.getRidersByProductId(app.plan_id);
        const appRiderIds = new Set(selectedRiders.map(r => r.rider_id.toString()));

        const riderRows = allPlanRiders.map(r => ({
            'Rider ID': r.rider_id,
            'Acronym': r.acronym || '',
            'Rider Name': r.rider_name || '',
            'Selected Riders': appRiderIds.has(r.rider_id.toString()) ? 'Yes' : 'No'
        }));

        const riderWorksheet = XLSX.utils.json_to_sheet(riderRows, { header: ['Rider ID', 'Acronym', 'Rider Name', 'Selected Riders'] });
        XLSX.utils.book_append_sheet(workbook, riderWorksheet, 'Rider Reference');

        // Write to buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Rates_Template_App_${applicationId}.xlsx`);
        res.send(buffer);
    } catch (err) {
        console.error('Download Rates Template Error:', err);
        return error(res, err.message);
    }
};

export const parseRatesOnly = async (req, res) => {
    try {
        // Return the parsed and validated rates (populated by middlewares)
        return success(res, req.body, 'Excel template parsed successfully.');
    } catch (err) {
        console.error('Parse Excel Error:', err);
        return error(res, err.message);
    }
};