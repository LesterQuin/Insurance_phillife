import * as ApplicationModel from '../../models/financial_Insurance_form.model.js';
import * as Model from '../../models/requirements/installation_requirements.model.js';
import { success, error } from '../../utils/response.js';
import { ensureRequirementsDir } from '../../middlewares/helper.js';
import fs from 'fs';
import path from 'path';

export const INSTALLATION_REQUIREMENTS_METADATA = [
    { id: 1, key: 'signed_proposal', label: 'SIGNED PROPOSAL/CONFORME', dbColumn: 'signed_proposal_path' },
    { id: 2, key: 'group_app', label: 'APPLICATION FOR GROUP INSURANCE', dbColumn: 'group_app_path' },
    { id: 3, key: 'dti', label: 'DTI (FOR SOLE PROPRIETORSHIP)', dbColumn: 'dti_path' },
    { id: 4, key: 'sec_reg', label: 'SEC CERTIFICATE OF REGISTRATION', dbColumn: 'sec_reg_path' },
    { id: 5, key: 'articles_of_inc', label: 'ARTICLES OF INCORPORATION', dbColumn: 'articles_of_inc_path' },
    { id: 6, key: 'by_laws', label: 'BY-LAWS', dbColumn: 'by_laws_path' },
    { id: 7, key: 'business_permit', label: 'BUSINESS PERMIT', dbColumn: 'business_permit_path' },
    { id: 8, key: 'masterlist', label: 'MASTERLIST (PDF & Excel Copy)', dbColumn: 'masterlist_file_path' },
    { id: 9, key: 'auth_id', label: 'Copy of ID of the Authorized Signatory', dbColumn: 'authorized_id_path' }
];

export const getRequirementsList = (req, res) => {
    // Return only the public fields (id, key, label)
    const list = INSTALLATION_REQUIREMENTS_METADATA.map(({ id, key, label }) => ({ id, key, label }));
    return res.status(200).json({ 
        status: true, 
        data: list 
    });
};

export const uploadInstallationRequirements = async (req, res) => {

    const applicationId = req.params.id;
    const userId = req.user.user_id;

    try {
        // 1. Fetch application details to get the Group Name
        const app = await ApplicationModel.getApplicationById(applicationId);
        if (!app) {
            return res.status(404).json({ status: false, message: 'Application not found.' });
        }

        // Authorization Check: Only the creator can upload requirements
        const isOwner = Number(app.user_id) === Number(userId);
        if (!isOwner) {
            return res.status(403).json({ status: false, message: 'Unauthorized: Only the creator of this application can upload requirements.' });
        }

        const groupName = app.group_name;
        const updateData = {};

        // 2. Process only the files provided in the request
        if (req.files) {
            for (const reqInfo of INSTALLATION_REQUIREMENTS_METADATA) {
                // Check if user provided the file by Key or by ID (as field name)
                const file = req.files[reqInfo.key] || req.files[reqInfo.id];
                if (file) {
                    const key = reqInfo.key;
                    
                    // Create specific folder: uploads/requirements/{group_name}/{key}/
                    const targetDir = ensureRequirementsDir(groupName, key);
                    
                    const fileName = `${Date.now()}_${file.originalFilename.replace(/\s+/g, '_')}`;
                    const newPath = path.join(targetDir, fileName);

                    fs.renameSync(file.filepath, newPath);

                    const sanitizedGroup = groupName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    updateData[reqInfo.dbColumn] = path.join('uploads/requirements', sanitizedGroup, key, fileName);
                }
            }
        }

        // 3. Update the database with the paths (without changing status)
        if (Object.keys(updateData).length > 0) {
            await Model.upsertInstallationRequirements(applicationId, updateData, userId);
        }

        return res.status(200).json({
            status: true,
            message: `Requirements uploaded successfully for Application #${applicationId}.`,
            uploaded: Object.keys(updateData)
        });

    } catch (err) {
        console.error('Upload requirements error:', err);
        return error(res, 'Failed to upload requirements.', 500);
    }
};

export const updateInstallationRequirements = async (req, res) => {
    const applicationId = req.params.id;
    const userId = req.user.user_id;

    try {
        // 1. Fetch application details to get the Group Name and existing requirement file paths
        const app = await ApplicationModel.getApplicationById(applicationId);
        if (!app) {
            return res.status(404).json({ status: false, message: 'Application not found.' });
        }

        // Authorization Check: Only the creator can update requirements
        const isOwner = Number(app.user_id) === Number(userId);
        if (!isOwner) {
            return res.status(403).json({ status: false, message: 'Unauthorized: Only the creator of this application can update requirements.' });
        }

        const groupName = app.group_name;
        const updateData = {};

        // 2. Process only the files provided in the request
        if (req.files) {
            for (const reqInfo of INSTALLATION_REQUIREMENTS_METADATA) {
                // Check if user provided the file by Key or by ID (as field name)
                const file = req.files[reqInfo.key] || req.files[reqInfo.id];
                if (file) {
                    const key = reqInfo.key;

                    // Delete the old file if it exists on disk
                    const oldPath = app[reqInfo.dbColumn];
                    if (oldPath) {
                        const oldAbsolutePath = path.join(process.cwd(), oldPath);
                        if (fs.existsSync(oldAbsolutePath)) {
                            try {
                                fs.unlinkSync(oldAbsolutePath);
                            } catch (err) {
                                console.error(`Failed to delete old requirement file: ${oldAbsolutePath}`, err);
                            }
                        }
                    }

                    // Create specific folder: uploads/requirements/{group_name}/{key}/
                    const targetDir = ensureRequirementsDir(groupName, key);
                    
                    const fileName = `${Date.now()}_${file.originalFilename.replace(/\s+/g, '_')}`;
                    const newPath = path.join(targetDir, fileName);

                    fs.renameSync(file.filepath, newPath);

                    const sanitizedGroup = groupName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                    updateData[reqInfo.dbColumn] = path.join('uploads/requirements', sanitizedGroup, key, fileName);
                }
            }
        }

        // 3. Update the database with the paths
        if (Object.keys(updateData).length > 0) {
            await Model.upsertInstallationRequirements(applicationId, updateData, userId);
        }

        return res.status(200).json({
            status: true,
            message: `Requirements updated successfully for Application #${applicationId}.`,
            updated: Object.keys(updateData)
        });

    } catch (err) {
        console.error('Update requirements error:', err);
        return error(res, 'Failed to update requirements.', 500);
    }
};


export const getInstallationRequirementsStatus = async (req, res) => {
    const applicationId = req.params.id;

    try {
        const app = await ApplicationModel.getApplicationById(applicationId);
        if (!app) return res.status(404).json({ status: false, message: 'Application not found.' });

        const requirementsStatus = INSTALLATION_REQUIREMENTS_METADATA.map(reqInfo => ({
            id: reqInfo.id,
            key: reqInfo.key,
            label: reqInfo.label,
            is_uploaded: !!app[reqInfo.dbColumn],
            file_path: app[reqInfo.dbColumn] || null,
            file_name: app[reqInfo.dbColumn] ? path.basename(app[reqInfo.dbColumn]) : null
        }));

        return res.status(200).json({ status: true, data: requirementsStatus });
    } catch (err) {
        console.error('Get requirements status error:', err);
        return error(res, err.message, 500);
    }
};

export const updateApplicationStatus = async (req, res) => {
    const applicationId = req.params.id;
    const { status_id } = req.body;
    const userId = req.user.user_id;

    try {
        const app = await ApplicationModel.getApplicationById(applicationId);
        if (!app) return res.status(404).json({ status: false, message: 'Application not found.' });

        // Check requirements if attempting to set status to BOOKED (7)
        if (Number(status_id) === 7) {
            // This filters the list to keep ONLY the ones that are still empty in the database
            const requiredFields = INSTALLATION_REQUIREMENTS_METADATA.map(m => m.dbColumn);
            const missing = requiredFields.filter(field => !app[field]);

            // Only the items left in the 'missing' array are mapped to labels for the message
            if (missing.length > 0) {
                const missingLabels = INSTALLATION_REQUIREMENTS_METADATA
                    .filter(m => missing.includes(m.dbColumn))
                    .map(m => m.label);
                
                return error(res, `Cannot mark as BOOKED. Missing requirements: ${missingLabels.join(', ')}`, 400);
            }
        }

        await ApplicationModel.updateApplication(applicationId, { status_id }, userId);
        return success(res, null, 'Status updated successfully.');
    } catch (err) {
        return error(res, err.message, 500);
    }
};