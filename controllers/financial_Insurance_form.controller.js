import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Model from '../models/financial_Insurance_form.model.js';
import * as ActuarialModel from '../models/actuarial_api/actuarial.model.js';
import * as User from '../models/user/user_model.js';
import { success, error } from '../utils/response.js';
import { auditLog, AuditStatus, AuditActions, normalizeIp } from '../utils/logger.js';
import sanitizeHtml from 'sanitize-html';
import * as Helper from '../middlewares/helper.js';
import { io } from '../socket-io/socket_setup.js';
import { transporter } from './user/user_controller.js';
import { expirationNotificationTemplate } from '../templates/expirationNotificationTemplate.js';
import { bookedNotificationTemplate } from '../templates/bookedNotificationTemplate.js';
import { closedNotificationTemplate } from '../templates/closedNotificationTemplate.js';
// Constants for extension request statuses
const EXTENSION_STATUS_APPROVED = 62;
const EXTENSION_STATUS_DECLINED = 63;
import { INSTALLATION_REQUIREMENTS_METADATA } from './requirements/installation_requirements.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Helper to identify missing installation requirements
const getPendingRequirements = (app) => {
    return INSTALLATION_REQUIREMENTS_METADATA.filter(m => {
        // Handle specific naming discrepancies found in the model's column selection
        const keyToColMap = {
            'masterlist': 'masterlist_file_path',
            'auth_id': 'authorized_id_path'
        };
        const dbCol = m.dbColumn || keyToColMap[m.key] || `${m.key}_path`;
        const val = app[dbCol];
        return val === null || val === undefined || (typeof val === 'string' && val.trim() === '');
    }).map(m => m.label);
};

// Create Application
export const createApplication = async (req, res) => {
    try {
        const userId = req.user.user_id;
        let dataToSave = { ...req.body };

        // Determine initial status: Booked (7) for Prototypes (30), Pending (8) otherwise
        const STATUS_PENDING = 8;
        const STATUS_BOOKED = 7;
        const PROTOTYPE_TYPE_ID = 30;

        if (Number(dataToSave.type_of_proposal_id) === PROTOTYPE_TYPE_ID) {
            dataToSave.status_id = STATUS_BOOKED;
            const oneYearLater = new Date();
            // oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
            oneYearLater.setDate(oneYearLater.getDate() + 1); // Testing: Valid for 1 day
            dataToSave.expiry_date = oneYearLater;
        } else {
            dataToSave.status_id = STATUS_PENDING;
        }

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

        io.emit('createApplication', response);

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

// Fetch statuses allowed for the user's department
// export const getAvailableStatuses = async (req, res) => {
//     try {
//         const allStatuses = await Model.getStatusLookups();
//         const userDeptId = Number(req.user.department_id);
//         const isSuperAdmin = req.user.roleName === 'Super Admin' || Number(req.user.role_id) === 15;

//         // Mapping: User Dept ID -> Status Parent ID
//         const deptMapping = { 12: 4, 18: 2 }; // 12=GMS(Parent 4), 18=Actuarial(Parent 2)
//         const allowedParentId = deptMapping[userDeptId];

//         const filtered = isSuperAdmin 
//             ? allStatuses 
//             : allStatuses.filter(s => Number(s.parent_id) === allowedParentId);

//         return success(res, filtered, 'Available statuses fetched successfully.');
//     } catch (err) {
//         return error(res, err.message);
//     }
// };
export const getAvailableStatuses = async (req, res) => {
    try {
        const allStatuses = await Model.getStatusLookups();
        const userDeptId = Number(req.user.department_id);

        // Mapping: User Dept ID -> Status Parent ID
        const deptMapping = {
        12: 4, // GMS
        18: 2, // Actuarial
        };

        const allowedParentId = deptMapping[userDeptId];

        const filtered = allStatuses.filter(
        (s) => Number(s.parent_id) === allowedParentId,
        );

        return success(res, filtered, "Available statuses fetched successfully.");
    } catch (err) {
        return error(res, err.message);
    }
};

// Generic Status Update with Department Validation
export const updateApplicationStatus = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const appId = req.params.id;
        const { status_id } = req.body;

        if (!status_id) return error(res, 'status_id is required.', 400);

        const [app, allStatuses] = await Promise.all([
            Model.getApplicationById(appId),
            Model.getStatusLookups()
        ]);

        if (!app) return error(res, 'Application not found.', 404);

        // Business Rule: Update expiry_date based on finalized status.
        if (Number(status_id) === 7) { // Booked: Policy is valid for 1 year
            const oneYearLater = new Date();
            // oneYearLater.setFullYear(oneYearLater.getFullYear() + 1); 
            oneYearLater.setDate(oneYearLater.getDate() + 1); // Testing: Valid for 1 day
            req.body.expiry_date = oneYearLater;
        } else if (Number(status_id) === 6) { // Closed: Proposal expired today
            req.body.expiry_date = new Date();
        }

        const targetStatus = allStatuses.find(s => s.status_id === Number(status_id));
        if (!targetStatus) return error(res, 'Invalid status_id.', 400);

        const loggedInUser = req.user;
        const userRoleName = loggedInUser.roleName?.trim();
        const userRoleId = Number(loggedInUser.role_id);

        // Bypass Logic: Super Admin (15) and Team Leader (2)
        const isSuperAdmin = userRoleName === 'Super Admin' || userRoleId === 15;
        const isTeamLeader = userRoleName === 'Team Leader' || userRoleId === 2;
        const canBypass = isSuperAdmin || isTeamLeader;

        const isOwner = Number(app.user_id) === Number(userId);
        if (!isOwner && !canBypass) {
            return error(res, 'Access Denied: Only the original creator, a Team Leader, or a Super Admin can update application status.', 403);
        }

        // Department Authorization Check
        const deptMapping = { 12: 4, 18: 2 }; 
        
        const isAuthorized = canBypass || (deptMapping[Number(loggedInUser.department_id)] === Number(targetStatus.parent_id));

        if (!isAuthorized) {
            return error(res, `Access Denied: Your department is not authorized to set the "${targetStatus.status_name}" status.`, 403);
        }

        // Enforce Business Rules for Booked (7)
        if (Number(status_id) === 7) {
            const isCFE = userRoleName === 'Corporate Financial Executive' || userRoleId === 3;

            if (!canBypass && (!isOwner || !isCFE)) {
                return error(res, 'Access Denied: Only the original CFE creator, a Team Leader, or a Super Admin can mark a proposal as Booked.', 403);
            }

            if (!canBypass) {
                const pendingRequirements = getPendingRequirements(app);

                if (pendingRequirements.length > 0) {
                    return error(res, `Cannot mark as BOOKED. The following requirements are still pending: ${pendingRequirements.join(', ')}`, 400);
                }
            }

            // Release Check: Customized Proposals must be Released (15) by Actuarial before booking
            const PROTOTYPE_TYPE_ID = 30;
            if (Number(app.type_of_proposal_id) !== PROTOTYPE_TYPE_ID) {
                if (Number(app.status_id) !== 15) {
                    return error(res, 'Cannot mark as BOOKED. Only proposals that have been Released by the Actuarial department can be booked.', 400);
                }
            }

            // Validity Check: Use stored expiry_date if available (e.g., from an extension), otherwise default to 30 days from creation
            const expiryDate = app.expiry_date ? new Date(app.expiry_date) : new Date(new Date(app.created_at).getTime() + 30 * 24 * 60 * 60 * 1000);
            if (!canBypass && new Date() > expiryDate) {
                return error(res, `Proposal expired on ${expiryDate.toLocaleDateString()}. Cannot Book.`, 400);
            }
        }

        const updated = await Model.updateApplication(appId, { status_id, expiry_date: req.body.expiry_date }, userId);
        const response = await Helper.buildApplicationResponse(updated);

        // Notify via email if status is manually set to Booked (7)
        if (Number(status_id) === 7) {
            try {
                const creator = await User.getUserById(app.user_id);
                const bookedDate = new Date().toLocaleDateString();
                const proposalNumber = `PRO-${app.application_id.toString().padStart(6, '0')}`;
                const clientName = `${app.contact_person_firstname} ${app.contact_person_lastname}`;
                const internalSalutation = "Sir MMC, John Kwong, Team Lead, and EBAM Team";
                const clientSalutation = `Mr./Ms. ${app.contact_person_lastname}`;

                // Notify CFE (Creator)
                if (creator && creator.email) {
                    await transporter.sendMail({
                        from: `"Insurance System" <${process.env.SMTP_USER}>`,
                        to: creator.email,
                        subject: `Account BOOKED: ${app.group_name}`,
                        html: bookedNotificationTemplate(
                            internalSalutation,
                            app.group_name,
                            clientName,
                            proposalNumber,
                            bookedDate,
                            `${creator.firstname} ${creator.lastname}`
                        )
                    });
                }

                // Notify Applicant (Registered Email on the form)
                if (app.email) {
                    await transporter.sendMail({
                        from: `"Insurance System" <${process.env.SMTP_USER}>`,
                        to: app.email,
                        subject: `Proposal Booked Successfully: ${app.group_name}`,
                        html: bookedNotificationTemplate(
                            clientSalutation,
                            app.group_name,
                            clientName,
                            proposalNumber,
                            bookedDate,
                            creator ? `${creator.firstname} ${creator.lastname}` : 'System'
                        )
                    });
                }
            } catch (emailErr) {
                console.error('Manual Booking Notification Error:', emailErr);
            }
        }

        // Notify via email if status is manually set to Closed (6)
        if (Number(status_id) === 6) {
            try {
                const creator = await User.getUserById(app.user_id);
                const closedDate = new Date().toLocaleDateString();
                const proposalNumber = `PRO-${app.application_id.toString().padStart(6, '0')}`;
                const clientName = `${app.contact_person_firstname} ${app.contact_person_lastname}`;

                const emailHtml = closedNotificationTemplate(
                    app.group_name,
                    clientName,
                    proposalNumber,
                    closedDate,
                    creator ? `${creator.firstname} ${creator.lastname}` : 'System'
                );

                // Notify CFE (Creator)
                if (creator && creator.email) {
                    await transporter.sendMail({
                        from: `"Insurance System" <${process.env.SMTP_USER}>`,
                        to: creator.email,
                        subject: `Account CLOSED: ${app.group_name}`,
                        html: emailHtml
                    });
                }

                // Notify Applicant (Registered Email on the form)
                if (app.email) {
                    await transporter.sendMail({
                        from: `"Insurance System" <${process.env.SMTP_USER}>`,
                        to: app.email,
                        subject: `Notice of Proposal Closure: ${app.group_name}`,
                        html: emailHtml
                    });
                }
            } catch (emailErr) {
                console.error('Manual Closure Notification Error:', emailErr);
            }
        }

        io.emit('updateApplicationStatus', response);

        return success(res, response, `Status successfully updated to ${response.status.name}.`);
    } catch (err) {
        return error(res, err.message);
    }
};

// View all applications with pending extension requests
export const getExtensionRequests = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const loggedInUser = req.user;
        const isSuperAdmin = loggedInUser.roleName === 'Super Admin' || Number(loggedInUser.role_id) === 15;

        let filterUserIds = null;
        if (!isSuperAdmin) {
            // Fetch only subordinate IDs so that heads (TLs/Managers) only see requests from their team (e.g., CFEs)
            filterUserIds = await User.getSubordinateIds(userId);
            if (filterUserIds.length === 0) return success(res, [], 'No pending extension requests from your subordinates.');
        }

        const pendingIds = await Model.getExtensionRequests(filterUserIds);
        if (pendingIds.length === 0) return success(res, [], 'No pending extension requests.');

        const requests = await Promise.all(pendingIds.map(id => Model.getApplicationById(id)));
        const response = await Promise.all(requests.map(app => Helper.buildApplicationResponse(app)));

        return success(res, response, 'Pending extension requests fetched successfully.');
    } catch (err) {
        return error(res, err.message);
    }
};

// Approve or Reject a 30-day extension
export const approveExtension = async (req, res) => {
    try {
        const appId = req.params.id;
        const userId = req.user.user_id;

        const app = await Model.getApplicationById(appId);
        if (!app) return error(res, 'Application not found', 404);

        const loggedInUser = req.user;
        const isSuperAdmin = loggedInUser.roleName === 'Super Admin' || Number(loggedInUser.role_id) === 15;

        // Enforce Hierarchy: Only Super Admins or the actual superior (Head/TL) of the creator can approve
        if (!isSuperAdmin) {
            const subordinates = await User.getSubordinateIds(userId);
            if (!subordinates.includes(Number(app.user_id))) {
                return error(res, 'Access Denied: You do not have the capacity to approve this extension request. Only a Team Leader or Super Admin overseeing the CFE can perform this action.', 403);
            }
        }

        if (!app.extension_requested) {
            return error(res, 'This application does not have a pending extension request.', 400);
        }

        // Calculate new expiry: Current expiry + 30 days
        const currentExpiry = app.expiry_date ? new Date(app.expiry_date) : new Date(new Date(app.created_at).getTime() + 30 * 24 * 60 * 60 * 1000);
        const newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + 30);

        await Model.updateApplication(appId, {
            extension_requested: 0,
            extension_request_status_id: EXTENSION_STATUS_APPROVED,
            expiry_date: newExpiry
        }, userId);

        const updated = await Model.getApplicationById(appId);
        const response = await Helper.buildApplicationResponse(updated);

        io.emit('approveExtension', response);

        return success(res, response, 'Extension approved successfully.');
    } catch (err) {
        return error(res, err.message);
    }
};

// Reject a 30-day extension request
export const rejectExtension = async (req, res) => {
    try {
        const appId = req.params.id;
        const userId = req.user.user_id;

        const app = await Model.getApplicationById(appId);
        if (!app) return error(res, 'Application not found', 404);

        const loggedInUser = req.user;
        const isSuperAdmin = loggedInUser.roleName === 'Super Admin' || Number(loggedInUser.role_id) === 15;

        // Enforce Hierarchy: Only Super Admins or the actual superior (Head/TL) of the creator can reject
        if (!isSuperAdmin) {
            const subordinates = await User.getSubordinateIds(userId);
            if (!subordinates.includes(Number(app.user_id))) {
                return error(res, 'Access Denied: You do not have the capacity to decline this extension request. Only a Team Leader or Super Admin overseeing the CFE can perform this action.', 403);
            }
        }

        if (!app.extension_requested) {
            return error(res, 'This application does not have a pending extension request.', 400);
        }

        // Clear the request flag. Expiry date remains unchanged.
        await Model.updateApplication(appId, {
            extension_requested: 0,
            extension_request_status_id: EXTENSION_STATUS_DECLINED
        }, userId);
        
        const updated = await Model.getApplicationById(appId);
        const response = await Helper.buildApplicationResponse(updated);

        io.emit('rejectExtension', response);

        return success(res, response, 'Extension request denied.');
    } catch (err) {
        return error(res, err.message);
    }
};

// Request 30-day extension - Only for CFEs and the original creator
export const requestExtension = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const appId = req.params.id;

        // Validations (existence, role, ownership, status, timing window) are handled in validateRequestExtension middleware
        await Model.updateApplication(appId, { extension_requested: 1 }, userId);

        const updated = await Model.getApplicationById(appId);
        const response = await Helper.buildApplicationResponse(updated);

        io.emit('requestExtension', response);

        return success(res, response, 'Extension request submitted to your Team Leader/Admin.');
    } catch (err) {
        console.error('Request Extension Error:', err);
        return error(res, err.message);
    }
};

// Logic for a daily task to notify CFEs about expiring applications (at 5 and 3 days)
export const notifyExpiringProposals = async (req, res) => {
    try {
        const result = await Model.getAllApplications(); // Adjusted for internal logic
        const now = new Date();

        for (const app of result) {
            const currentStatus = Number(app.status_id);
            if (currentStatus === 7 || currentStatus === 6) continue; // Skip Booked or already Closed

            const createdAt = new Date(app.created_at);
            const expiryDate = app.expiry_date ? new Date(app.expiry_date) : new Date(createdAt);
            if (!app.expiry_date) expiryDate.setDate(expiryDate.getDate() + 30);

            const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

            // 1. Automatic Closure Logic
            if (diffDays <= 0) {
                await Model.updateApplication(app.application_id, { status_id: 6, expiry_date: now }, app.user_id);
                
                const creator = await User.getUserById(app.user_id);
                const closedDate = new Date().toLocaleDateString();
                const proposalNumber = `PRO-${app.application_id.toString().padStart(6, '0')}`;
                const clientName = `${app.contact_person_firstname} ${app.contact_person_lastname}`;

                const emailHtml = closedNotificationTemplate(
                    app.group_name,
                    clientName,
                    proposalNumber,
                    closedDate,
                    creator ? `${creator.firstname} ${creator.lastname}` : 'System'
                );

                // Notify CFE
                if (creator && creator.email) {
                    await transporter.sendMail({
                        from: `"Insurance System" <${process.env.SMTP_USER}>`,
                        to: creator.email,
                        subject: `Account Automatically CLOSED: ${app.group_name}`,
                        html: emailHtml
                    });
                }

                // Notify Registered Client Email
                if (app.email) {
                    await transporter.sendMail({
                        from: `"Insurance System" <${process.env.SMTP_USER}>`,
                        to: app.email,
                        subject: `Notice of Proposal Closure: ${app.group_name}`,
                        html: emailHtml
                    });
                }

                continue; // Move to next application
            }

            if ([5, 3, 1].includes(diffDays)) {
                const creator = await User.getUserById(app.user_id);
                
                // Notify CFE (Creator)
                if (creator && creator.email) {
                    await transporter.sendMail({
                        from: `"Insurance System" <${process.env.SMTP_USER}>`,
                        to: creator.email,
                        subject: `Urgent: Proposal for ${app.group_name} expires in ${diffDays} days`,
                        html: expirationNotificationTemplate(creator.lastname, app.group_name, diffDays, `${process.env.APP_BASE_URL}/applications/${app.application_id}`)
                    });
                }

                // Notify Registered Client Email
                if (app.email) {
                    await transporter.sendMail({
                        from: `"Insurance System" <${process.env.SMTP_USER}>`,
                        to: app.email,
                        subject: `Urgent: Your proposal for ${app.group_name} expires in ${diffDays} days`,
                        html: expirationNotificationTemplate(app.contact_person_lastname, app.group_name, diffDays, `${process.env.APP_BASE_URL}/applications/${app.application_id}`)
                    });
                }
            }
        }
        if (res) return success(res, null, 'Expiration checks completed and notifications sent.');
    } catch (err) {
        console.error('Notification Task Error:', err);
        if (res) return error(res, err.message);
    }
};

// Helper function for role-based authorization for renewing inactive user's applications
const isUserAuthorizedForInactiveRenewal = (user) => {
    const roleId = Number(user.role_id);
    const roleName = user.roleName?.trim();
    return roleName === 'Super Admin' || roleId === 15 || roleName === 'Team Leader' || roleId === 2 || 
           ['Assistant Vice President', 'Group Sales & Marketing Head'].includes(roleName);
};

// Renewal Lookup
export const getRenewalLookup = async (req, res) => {
    try {
        const { group_name, id } = req.query;
        const userId = req.user.user_id;
        const loggedInUser = req.user;

        // 1. Search/List Mode: If no specific ID is provided, return a list of eligible renewals
        if (!id) {
            // If group_name is provided, search by it. Otherwise, fetch all applications to filter for renewals.
            const matches = group_name 
                ? await Model.searchApplicationsByGroupName(group_name)
                : await Model.getAllApplications(); 

            if (!matches || matches.length === 0) {
                return error(res, group_name ? `No records found matching "${group_name}".` : "No applications found in the system.", 404);
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const filtered = [];
            for (const m of matches) {
                // Check Renewal Timing Eligibility
                const canRenewDate = new Date(m.expiry_date || m.created_at);
                // If no expiry_date (legacy), fallback to 1 year after creation
                if (!m.expiry_date) canRenewDate.setFullYear(canRenewDate.getFullYear() + 1);
                canRenewDate.setHours(0, 0, 0, 0);

                const gracePeriodDate = new Date(canRenewDate);
                gracePeriodDate.setMonth(gracePeriodDate.getMonth() + 1);

                // Eligibility check: Within grace period and not too early
                if (today < canRenewDate || today > gracePeriodDate) continue;

                // Authorization check: Show only own applications or authorized inactive ones
                const isOwner = Number(m.user_id) === Number(userId);
                let isAuthorized = isOwner;

                if (!isOwner) {
                    // Handle property name differences between Model.search... and Model.getAll...
                    const creatorIsActive = m.creator_is_active !== undefined ? m.creator_is_active : m.is_active;

                    if (creatorIsActive === false) { // Only check if the original creator is inactive
                        // Use the helper function for role-based authorization
                        if (isUserAuthorizedForInactiveRenewal(loggedInUser)) {
                            isAuthorized = true;
                        }
                    }
                }

                if (isAuthorized) {
                    const creatorName = m.creator_firstname 
                        ? `${m.creator_firstname} ${m.creator_lastname}` 
                        : `${m.firstname} ${m.lastname}`;
                    const agentCode = m.creator_agent_code || m.agent_code;

                    filtered.push({
                        application_id: m.application_id,
                        group_name: m.group_name,
                        created_at: m.created_at,
                        expiry_date: m.expiry_date,
                        created_by: creatorName,
                        agent_code: agentCode,
                        is_owner: isOwner
                    });
                }
            }

            if (filtered.length === 0) {
                const msg = group_name 
                    ? `No records matching "${group_name}" are currently eligible for renewal by you.` 
                    : "You currently have no applications eligible for renewal.";
                return success(res, [], msg);
            }

            return success(res, filtered, `Found ${filtered.length} record(s) eligible for renewal.`);
        }

        // 2. Action Mode: If an ID is provided, proceed with detailed renewal logic for that specific application
        const app = await Model.getApplicationById(id);

        if (!app) {
            return error(res, 'The requested application record does not exist.', 404);
        }

        const owner = await User.getUserById(app.user_id);
        const isOwnerActive = owner && owner.is_active;
        const isOwner = Number(app.user_id) === Number(userId);

        if (!isOwner) {
            if (isOwnerActive) {
                return error(res, `Renewal lookup failed. The original creator ("${owner.firstname} ${owner.lastname}") is still an active user. Only they can initiate this renewal.`, 403);
            }

            // Use the helper function for role-based authorization
            const isAuthorizedRole = isUserAuthorizedForInactiveRenewal(loggedInUser);
            
            if (!isAuthorizedRole) {
                return error(res, `Renewal lookup failed. You are not authorized to renew this inactive user's application.`, 403);
            }
        }

        // Renewal Timing Logic
        const canRenewDate = new Date(app.expiry_date || app.created_at);
        // If no expiry_date (legacy), fallback to 1 year after creation
        if (!app.expiry_date) canRenewDate.setFullYear(canRenewDate.getFullYear() + 1);
        canRenewDate.setHours(0, 0, 0, 0);

        const gracePeriodDate = new Date(canRenewDate);
        gracePeriodDate.setMonth(gracePeriodDate.getMonth() + 1);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (today < canRenewDate) {
            return error(res, `Renewal is not applicable yet. This policy is active until ${canRenewDate.toLocaleDateString()}. You can initiate the renewal starting on that date.`, 400);
        }

        if (today > gracePeriodDate) {
            if (Number(app.status_id) !== 6) {
                await Model.updateApplication(app.application_id, { status_id: 6 }, userId);
                const updatedApp = await Model.getApplicationById(app.application_id);
                const response = await Helper.buildApplicationResponse(updatedApp);
                io.emit('checkRenewalEligibility', response);
            }
            return error(res, `Renewal period has expired. The 1-month grace period ended on ${gracePeriodDate.toLocaleDateString()}. This application is now Closed.`, 400);
        }

        const response = await Helper.buildApplicationResponse(app);
        return success(res, response, 'Application found and eligible for renewal.');
    } catch (err) {
        console.error('Renewal Lookup Error:', err);
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
        const STATUS_DRAFT = 11;
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

        io.emit('saveDraft', response);

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

        let filterUserId = userId;
        if (isSuperAdmin || isActuarial) {
            filterUserId = null; // Sees everything
        } else if (isTeamLeader || ['Assistant Vice President', 'Group Sales & Marketing Head', 'Corporate Financial Executive'].includes(loggedInUser.roleName)) {
            // Get IDs of all subordinates in the hierarchy
            const subordinates = await User.getSubordinateIds(userId);
            filterUserId = [userId, ...subordinates];
        }

        const rawPrototypes = await Model.getPrototypes(filterUserId);

        if (rawPrototypes.length === 0) {
            return success(res, [], 'No prototypes found.');
        }

        const formattedPrototypes = await Promise.all(rawPrototypes.map(app => Helper.buildApplicationResponse(app)));
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

        let filterUserId = userId;
        if (isSuperAdmin || isActuarial) {
            filterUserId = null; // See everything
        } else if (isTeamLeader || loggedInUser.roleName === 'Supervisor') {
            // Get IDs of all subordinates to include in the view
            const subordinates = await User.getSubordinateIds(userId);
            filterUserId = [userId, ...subordinates];
        }

        const rawApplications = await Model.getAllApplications(filterUserId); // Fetch raw data
        if (rawApplications.length === 0) { // Check if any applications were found
            return success(res, [], 'Applications fetched successfully.');
        }

        // Use Promise.all with map to build responses concurrently
        const formattedApplications = await Promise.all(rawApplications.map(app => Helper.buildApplicationResponse(app)));
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
        
        // Automatically transition from Draft: Booked (7) for Prototypes (30), Pending (8) otherwise
        const STATUS_DRAFT = 11;
        const STATUS_PENDING = 8;
        const STATUS_BOOKED = 7;
        const PROTOTYPE_TYPE_ID = 30;

        if (Number(existingApplication.status_id) === STATUS_DRAFT) {
            const typeId = updateData.type_of_proposal_id !== undefined 
                ? Number(updateData.type_of_proposal_id) 
                : Number(existingApplication.type_of_proposal_id);
            
            if (typeId === PROTOTYPE_TYPE_ID) {
                updateData.status_id = STATUS_BOOKED;
                const oneYearLater = new Date();
                // oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                oneYearLater.setDate(oneYearLater.getDate() + 1); // Testing: Valid for 1 day
                updateData.expiry_date = oneYearLater;
            } else {
                updateData.status_id = STATUS_PENDING;
            }
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

        io.emit('updateApplication', response);

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

        // Fetch application to get group_name for folder structure
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

        const oldFilePath = app.excel_file_path;

        // Create the new structured directory: uploads/requirements/{group_name}/excel_files/
        const targetDir = Helper.ensureRequirementsDir(app.group_name, 'excel_files');

        const uniqueFilename = `APP-${appId}-v${Helper.getFileTimestamp()}-${excelFile.originalFilename}`;
        const newFilePath = path.join(targetDir, uniqueFilename);

        // Move the uploaded temporary file to its permanent structured location
        await fs.promises.rename(excelFile.filepath, newFilePath);

        await Model.updateApplication(appId, { excel_file_path: newFilePath }, userId);

        // Cleanup old file
        if (oldFilePath && fs.existsSync(oldFilePath)) {
            fs.promises.unlink(oldFilePath).catch(e => console.error("Old file cleanup failed:", e));
        }

        const updated = await Model.getApplicationById(appId);
        const response = await Helper.buildApplicationResponse(updated);

        io.emit('uploadExcelFile', response);

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

        io.emit('deleteApplication', { application_id: appId });

        return success(res, null, 'Application deleted successfully.');
    } catch (err) {
        console.error('Service Error:', err);
        return error(res, err.message);
    }
};

// Change status to Checking (5) - No body required
export const setStatusChecking = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const appId = req.params.id;
        const STATUS_CHECKING = 5;

        const loggedInUser = await User.getUserById(userId);
        const isAuthorized = loggedInUser && (Number(loggedInUser.role_id) === 15 || Number(loggedInUser.role_id) === 2);

        if (!isAuthorized) {
            return error(res, 'Access Denied: Unauthorized to change status. Only Super Admins and Team Leaders are authorized to change prototype statuses.', 403);
        }

        const app = await Model.getApplicationById(appId);
        if (!app) return error(res, 'Application not found', 404);

        const isOwner = Number(app.user_id) === Number(userId);
        if (!isOwner) {
            return error(res, 'Access Denied: Only the original creator of this application can update its status.', 403);
        }

        const PROTOTYPE_TYPE_ID = 30;
        if (Number(app.type_of_proposal_id) !== PROTOTYPE_TYPE_ID) {
            return error(res, 'Action Denied: This operation is strictly for Prototype applications.', 400);
        }

        const updated = await Model.updateApplication(appId, { status_id: STATUS_CHECKING }, userId);
        const response = await Helper.buildApplicationResponse(updated);

        io.emit('setStatusChecking', response);

        return success(res, response, 'Status successfully updated to Checking.');
    } catch (err) {
        console.error('Set Status Checking Error:', err);
        return error(res, err.message);
    }
};

// Change status to Booked (7) for Prototypes - No body required
export const setStatusApproved = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const appId = req.params.id;
        const STATUS_BOOKED = 7;

        const loggedInUser = await User.getUserById(userId);
        const isAuthorized = loggedInUser && (Number(loggedInUser.role_id) === 15 || Number(loggedInUser.role_id) === 2);

        if (!isAuthorized) {
            return error(res, 'Access Denied: Unauthorized to change status.', 403);
        }

        const app = await Model.getApplicationById(appId);
        if (!app) return error(res, 'Application not found', 404);

        const isOwner = Number(app.user_id) === Number(userId);
        if (!isOwner) {
            return error(res, 'Access Denied: Only the original creator of this application can update its status.', 403);
        }

        const PROTOTYPE_TYPE_ID = 30;
        if (Number(app.type_of_proposal_id) !== PROTOTYPE_TYPE_ID) {
            return error(res, 'Action Denied: This operation is strictly for Prototype applications.', 400);
        }

        const oneYearLater = new Date();
        // oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        oneYearLater.setDate(oneYearLater.getDate() + 1); // Testing: Valid for 1 day
        const updated = await Model.updateApplication(appId, { status_id: STATUS_BOOKED, expiry_date: oneYearLater }, userId);
        const response = await Helper.buildApplicationResponse(updated);

        io.emit('setStatusApproved', response);

        return success(res, response, 'Status successfully updated to Booked.');
    } catch (err) {
        console.error('Set Status Booked Error:', err);
        return error(res, err.message);
    }
};

// Change status to Booked (7) - Stops the 30-day countdown
export const setStatusBooked = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const appId = req.params.id;
        const STATUS_BOOKED = 7;

        const app = await Model.getApplicationById(appId);
        if (!app) return error(res, 'Application not found', 404);

        // 1. Authorization & Bypass Logic: Super Admin (15) and Team Leader (2) bypass requirements
        const userRoleName = req.user.roleName?.trim();
        const userRoleId = Number(req.user.role_id);

        const isSuperAdmin = userRoleName === 'Super Admin' || userRoleId === 15;
        const isTeamLeader = userRoleName === 'Team Leader' || userRoleId === 2;
        const canBypass = isSuperAdmin || isTeamLeader;
        
        const isCFE = userRoleName === 'Corporate Financial Executive' || userRoleId === 3;
        const isOwner = Number(app.user_id) === Number(userId);

        if (!canBypass && (!isOwner || !isCFE)) {
            return error(res, 'Access Denied: Only the original CFE creator, a Team Leader, or a Super Admin can mark a proposal as Booked.', 403);
        }

        // 2. Requirements Validation (CFE Only)
        if (!canBypass) {
            const pendingRequirements = getPendingRequirements(app);

            if (pendingRequirements.length > 0) {
                return error(res, `Cannot mark as BOOKED. The following requirements are still pending: ${pendingRequirements.join(', ')}`, 400);
            }
        }

        // Rate Check: Customized Proposals must have actuarial rates defined
        const PROTOTYPE_TYPE_ID = 30;
        // Release Check: Customized Proposals must be Released (15) by Actuarial before booking
        if (Number(app.type_of_proposal_id) !== PROTOTYPE_TYPE_ID) {
            if (Number(app.status_id) !== 15) {
                return error(res, 'Cannot mark as BOOKED. Only proposals that have been Released by the Actuarial department can be booked.', 400);
            }
        }

        // 3. Expiry Check
        // Use stored expiry_date if available (e.g., from an extension), otherwise default to 30 days from creation
        const expiryDate = app.expiry_date ? new Date(app.expiry_date) : new Date(new Date(app.created_at).getTime() + 30 * 24 * 60 * 60 * 1000);
        if (!canBypass && new Date() > expiryDate) {
            return error(res, `Action Denied: This proposal expired on ${expiryDate.toLocaleDateString()}. You cannot book an expired proposal.`, 400);
        }

        // 4. Update Status (Status ID 7)
        const oneYearLater = new Date();
        // oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        oneYearLater.setDate(oneYearLater.getDate() + 1); // Testing: Valid for 1 day
        const updated = await Model.updateApplication(appId, { status_id: STATUS_BOOKED, expiry_date: oneYearLater }, userId);
        
        // 4. Return updated data (the validity object will now show as stopped)
        const response = await Helper.buildApplicationResponse(updated);

        // 5. Send Notification Email
        try {
            const creator = await User.getUserById(app.user_id);
            const bookedDate = new Date().toLocaleDateString();
            const proposalNumber = `PRO-${app.application_id.toString().padStart(6, '0')}`;
            const clientName = `${app.contact_person_firstname} ${app.contact_person_lastname}`;
            const internalSalutation = "Sir MMC, John Kwong, Team Lead, and EBAM Team";
            const clientSalutation = `Mr./Ms. ${app.contact_person_lastname}`;

            // Notify CFE (Creator)
            if (creator && creator.email) {
                await transporter.sendMail({
                    from: `"Insurance System" <${process.env.SMTP_USER}>`,
                    to: creator.email,
                    subject: `Account Successfully BOOKED: ${app.group_name}`,
                    html: bookedNotificationTemplate(
                        internalSalutation,
                        app.group_name,
                        clientName,
                        proposalNumber,
                        bookedDate,
                        `${creator.firstname} ${creator.lastname}`
                    )
                });
            }

            // Notify Applicant (Registered Email on the form)
            if (app.email) {
                await transporter.sendMail({
                    from: `"Insurance System" <${process.env.SMTP_USER}>`,
                    to: app.email,
                    subject: `Congratulations! Your proposal for ${app.group_name} is now Booked`,
                    html: bookedNotificationTemplate(
                        clientSalutation,
                        app.group_name,
                        clientName,
                        proposalNumber,
                        bookedDate,
                        creator ? `${creator.firstname} ${creator.lastname}` : 'System'
                    )
                });
            }
        } catch (emailErr) {
            console.error('Booked Notification Error:', emailErr);
        }

        io.emit('setStatusBooked', response);

        return success(res, response, 'Application successfully marked as Booked. The 30-day window is now closed.');
    } catch (err) {
        console.error('Set Status Booked Error:', err);
        return error(res, err.message);
    }
};
