import * as MainModel from '../../models/financial_Insurance_form.model.js';
import * as ActuarialModel from '../../models/actuarial_api/actuarial.model.js';
import * as User from '../../models/user/user_model.js';
import { success, error } from '../../utils/response.js';
import sanitizeHtml from 'sanitize-html';
import { buildApplicationResponse, sanitizeOptions, updateActuarialStatus, formatDbRatesForTemplate, ensureCompanyDir, getFileTimestamp } from '../../middlewares/helper.js';
import fs from 'fs';
import path from 'path';
import { io } from '../../socket-io/socket_setup.js';
import XLSX from 'xlsx-js-style';

const compareRiderArrays = (oldRiders, newRiders, pathLabel) => {
    const changes = [];
    const formatVal = (v) => {
        if (v === null || v === undefined || v === '') return '0.000';
        const num = parseFloat(String(v).replace(/,/g, ''));
        return isNaN(num) ? String(v) : num.toFixed(3);
    };

    const oldMap = {};
    oldRiders.forEach(r => { if (r.rider_id) oldMap[r.rider_id] = r; });
    const newMap = {};
    newRiders.forEach(r => { if (r.rider_id) newMap[r.rider_id] = r; });

    const allRiderIds = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);

    allRiderIds.forEach(rId => {
        const oldR = oldMap[rId] || {};
        const newR = newMap[rId] || {};

        const oldRate = formatVal(oldR.rider_rate || oldR.rate || '0');
        const newRate = formatVal(newR.rider_rate || newR.rate || '0');

        const acronym = newR.acronym || oldR.acronym || `Rider ID ${rId}`;

        if (oldRate !== newRate) {
            changes.push(`${pathLabel} Rider ${acronym}: ${oldRate} -> ${newRate}`);
        }
    });

    return changes;
};

const compareRates = (oldData, newData, planId) => {
    const diff = [];
    const brackets = ['18-65', '66-70', '71-75', '76-80'];

    const formatVal = (v) => {
        if (v === null || v === undefined || v === '') return '0.000';
        const num = parseFloat(String(v).replace(/,/g, ''));
        return isNaN(num) ? String(v) : num.toFixed(3);
    };

    brackets.forEach(bracket => {
        const oldBr = oldData[bracket] || {};
        const newBr = newData[bracket] || newData[bracket === '18-65' ? '18-64' : ''] || {};

        // Compare keys (like 'basic_plan', 'rates', 'age_35', etc.)
        const allKeys = new Set([
            ...Object.keys(oldBr).filter(k => k !== 'basic_plan_id' && k !== 'basic_plan_name' && k !== 'basic_plan_acronym'),
            ...Object.keys(newBr).filter(k => k !== 'basic_plan_id' && k !== 'basic_plan_name' && k !== 'basic_plan_acronym')
        ]);

        allKeys.forEach(key => {
            const oldItems = Array.isArray(oldBr[key]) ? oldBr[key] : [];
            const newItems = Array.isArray(newBr[key]) ? newBr[key] : [];

            // GCLI (Plan 1) has arrays of months
            if (planId === 1) {
                // Map by month
                const oldByMonth = {};
                oldItems.forEach(item => { oldByMonth[item.term_of_months] = item; });
                const newByMonth = {};
                newItems.forEach(item => { newByMonth[item.term_of_months] = item; });

                const allMonths = new Set([...Object.keys(oldByMonth), ...Object.keys(newByMonth)].map(Number).sort((a, b) => a - b));
                allMonths.forEach(m => {
                    const oldItem = oldByMonth[m] || {};
                    const newItem = newByMonth[m] || {};

                    const oldBasic = formatVal(oldItem.basic_rate || oldItem.rate || '0');
                    const newBasic = formatVal(newItem.basic_rate || newItem.rate || '0');

                    if (oldBasic !== newBasic) {
                        diff.push(`[${bracket}] ${key} Month ${m} Basic Rate: ${oldBasic} -> ${newBasic}`);
                    }

                    // Compare riders
                    const oldRiders = Array.isArray(oldItem.riders) ? oldItem.riders : [];
                    const newRiders = Array.isArray(newItem.riders) ? newItem.riders : [];
                    compareRiderArrays(oldRiders, newRiders, `[${bracket}] ${key} Month ${m}`).forEach(c => diff.push(c));
                });
            } else {
                // GYRT/GPA (Plan 2/3) - items in array (usually 1 item per age/band key)
                const maxLength = Math.max(oldItems.length, newItems.length);
                for (let idx = 0; idx < maxLength; idx++) {
                    const oldItem = oldItems[idx] || {};
                    const newItem = newItems[idx] || {};

                    const oldBasic = formatVal(oldItem.basic_rate || oldItem.rate || '0');
                    const newBasic = formatVal(newItem.basic_rate || newItem.rate || '0');

                    const label = key.startsWith('age_') ? `Age ${key.replace('age_', '').replace('_', '-')}` : key;

                    if (oldBasic !== newBasic) {
                        diff.push(`[${bracket}] ${label} Basic Rate: ${oldBasic} -> ${newBasic}`);
                    }

                    // Compare riders
                    const oldRiders = Array.isArray(oldItem.riders) ? oldItem.riders : [];
                    const newRiders = Array.isArray(newItem.riders) ? newItem.riders : [];
                    compareRiderArrays(oldRiders, newRiders, `[${bracket}] ${label}`).forEach(c => diff.push(c));
                }
            }
        });
    });

    return diff;
};

export const saveRates = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const application_id = req.params.id;
        const ratesData = req.body;
        const existingApplication = await MainModel.getApplicationById(application_id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        const existingRates = await ActuarialModel.getApplicationRates(application_id);

        // Prevent multiple POST submissions if rates already exist (except for Excel uploads)
        if (req.method === 'POST' && !req.isExcelUpload) {
            if (existingRates && existingRates.length > 0) {
                return error(res, 'Rates have already been defined for this application. Please use the PUT method to update existing rates.', 400);
            }
        }

        const planId = Number(existingApplication.plan_id);
        const oldRatesFormatted = {
            "18-65": formatDbRatesForTemplate(existingRates, '18_65', planId, existingApplication),
            "66-70": formatDbRatesForTemplate(existingRates, '66_70', planId, existingApplication),
            "71-75": formatDbRatesForTemplate(existingRates, '71_75', planId, existingApplication),
            "76-80": formatDbRatesForTemplate(existingRates, '76_80', planId, existingApplication)
        };

        const diff = compareRates(oldRatesFormatted, ratesData, planId);

        await ActuarialModel.saveApplicationRates(application_id, ratesData, userId, req.ip, diff);

        await updateActuarialStatus(application_id, userId);
        
        const updatedApp = await MainModel.getApplicationById(application_id);
        const response = await buildApplicationResponse(updatedApp);

        io.emit('saveRates', response);

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

        io.emit('saveEvidenceNotes', response);

        return success(res, response, 'Evidence of insurability notes saved successfully.');
    } catch (err) {
        console.error('Save Evidence Notes Error:', err);
        return error(res, err.message);
    }
};

export const saveNotes = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;
        let { actuarial_notes, show_in_pdf } = req.body;

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        if (actuarial_notes) {
            actuarial_notes = sanitizeHtml(actuarial_notes, sanitizeOptions);
        }

        const showPdf = show_in_pdf !== undefined ? show_in_pdf : true;
        await ActuarialModel.saveActuarialNotes(id, actuarial_notes, userId, showPdf);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        io.emit('saveNotes', response);

        return success(res, response, 'Notes saved successfully.');
    } catch (err) {
        console.error('Save Notes Error:', err);
        return error(res, err.message);
    }
};

// Save notes to CFE
export const saveActuarialToCfeNotes = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const id = req.params.id;
        let { notes } = req.body;

        const existingApplication = await MainModel.getApplicationById(id);
        if (!existingApplication) return error(res, 'Application not found', 404);

        if (notes) {
            notes = sanitizeHtml(notes, sanitizeOptions);
        }

        await ActuarialModel.saveActuarialToCfeNotes(id, notes, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        io.emit('saveActuarialToCfeNotes', response);

        return success(res, response, 'Notes to CFE saved successfully.');
    } catch (err) {
        console.error('Save Notes to CFE Error:', err);
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

        io.emit('saveTotalAnnualPremium', response);

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
        const STATUS_AMEND = 16;

        // if (
        //     Number(existingApplication.status_id) !== STATUS_APPROVED &&
        //     Number(existingApplication.status_id) !== STATUS_AMEND
        // ) {
        // return error(res, 'Only applications with "Approved" or "Amend" status can be finalized and released.', 400);
        // }

        if (Number(existingApplication.status_id) === STATUS_AMEND) {
            return error(
                res,
                'Applications with "Amend" status cannot be finalized and released.',
                400
            );
        }

        if (Number(existingApplication.status_id) !== STATUS_APPROVED) {
            return error(
                res,
                'Only applications with "Approved" status can be finalized and released.',
                400
            );
        }

        await MainModel.updateApplication(id, { status_id: STATUS_RELEASED }, userId);

        const updatedApp = await MainModel.getApplicationById(id);
        const response = await buildApplicationResponse(updatedApp);

        io.emit('releaseApplication', response);

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

        io.emit('rejectApplication', response);

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

        io.emit('unrejectApplication', response);

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

        if (Number(app.type_of_proposal_id) === 30) {
            return error(res, 'Rates templates can only be downloaded for customized proposals and not for in prototype proposals.', 400);
        }

        const planId = Number(app.plan_id);
        const numLives = Number(app.number_of_lives);

        const selectedRiders = await MainModel.getApplicationRiders(applicationId);
        const existingRates = await ActuarialModel.getApplicationRates(applicationId);

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

        // Helper to find existing rate from DB to prefill the Excel sheet
        const findExistingRate = (bracket, ageOrBand, term, riderId) => {
            if (!existingRates || existingRates.length === 0) return '';

            const isBase = bracket === '18-65';
            
            // For GCLI base bracket, basic rate and rider rates are split into separate rows in template
            if (planId === 1 && isBase) {
                if (ageOrBand === 'basic_plan' && riderId !== null) return '';
                if (ageOrBand === 'rates' && riderId === null) return '';
            }

            const matchedRow = existingRates.find(row => {
                // 1. Bracket check
                const rowCat = (row.borrower_category || '').replace(/[-_]/g, '');
                const targetCat = bracket.replace(/[-_]/g, '');
                if (rowCat !== targetCat) return false;

                // 2. Basic vs Rider check
                const isBasicQuery = riderId === null || riderId === 0 || riderId === '0';
                const isRowBasic = row.rider_id === null || row.rider_id === 0 || row.rider_id === '0';
                if (isBasicQuery !== isRowBasic) return false;
                if (!isBasicQuery) {
                    if (String(row.rider_id) !== String(riderId)) return false;
                }

                // 3. Plan-specific checks
                if (planId === 1) { // GCLI
                    // Check term
                    if (Number(row.term_months) !== Number(term)) return false;
                    
                    if (isBase) {
                        return true; // Category, basic/rider, and term already matched
                    } else {
                        // Senior bracket: attained age check
                        const ageNum = parseInt(ageOrBand.replace('age_', ''), 10);
                        return Number(row.attained_age) === ageNum;
                    }
                } else { // GYRT/GPA
                    // Check attained age / band
                    if (ageOrBand === 'rates') {
                        const isRowRates = !row.attained_age && (!row.age_band || row.age_band.toLowerCase() === 'rates' || row.age_band.toLowerCase() === 'basic');
                        return isRowRates;
                    } else if (ageOrBand.startsWith('age_')) {
                        const ageNum = parseInt(ageOrBand.replace('age_', ''), 10);
                        return Number(row.attained_age) === ageNum;
                    } else {
                        // Age band (e.g. '18-24', '25-29')
                        const normalizedBand = ageOrBand.replace(/[\s_()/-]+/g, '');
                        const normalizedRowBand = (row.age_band || '').replace(/[\s_()/-]+/g, '');
                        return normalizedBand === normalizedRowBand;
                    }
                }
            });

            if (matchedRow) {
                const val = matchedRow.premium_rate !== null && matchedRow.premium_rate !== undefined 
                    ? matchedRow.premium_rate 
                    : matchedRow.premium_amount;
                if (val !== null && val !== undefined) {
                    const num = parseFloat(String(val).replace(/,/g, ''));
                    return isNaN(num) ? String(val) : num.toFixed(3);
                }
            }
            return '';
        };

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
            row[basicHeader] = findExistingRate(bracket, ageOrBand, term, null);
            
            const isSeniorBracket = bracket !== '18-65';
            selectedRiders.forEach(r => {
                const acronym = r.acronym || `Rider_${r.rider_id}`;
                const colName = `Rider_${acronym.trim()}`;
                
                if (isSeniorBracket) {
                    // For senior brackets, only allow ALCR (rider_id 10 for GYRT, rider_id 30 for GCI) to be editable.
                    // GCLI (plan_id 1) senior brackets don't allow riders at all.
                    if ((planId === 2 && r.rider_id.toString() === '10') || (planId === 4 && r.rider_id.toString() === '30')) {
                        row[colName] = findExistingRate(bracket, ageOrBand, term, r.rider_id);
                    } else {
                        row[colName] = 'N/A';
                    }
                } else {
                    row[colName] = findExistingRate(bracket, ageOrBand, term, r.rider_id);
                }
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
                // Bracket 18-65: flat rates row (or split brackets if customized age range)
                const minAge = app.minimum_age || 18;
                const maxAge = app.maximum_age || 65;
                if (minAge !== 18 || maxAge !== 65) {
                    addRow(`${minAge}-${maxAge}`, 'rates');
                    if (maxAge < 65) {
                        addRow(`${maxAge + 1}-65`, 'rates');
                    }
                } else {
                    addRow('18-65', 'rates');
                }
            }

            // Active Senior Brackets: individual ages (active in GYRT and GCI)
            if (planId === 2 || planId === 4) {
                const seniorBrackets = ['66-70', '71-75', '76-80'];
                seniorBrackets.forEach(bracket => {
                    const bracketFlag = `borrower_age_${bracket.replace('-', '_')}`;
                    if (app[bracketFlag]) {
                        const [startAge, endAge] = bracket.split('-').map(Number);
                        for (let age = startAge; age <= endAge; age++) {
                            if (planId === 4 && age >= 70) continue;
                            addRow(bracket, `age_${age}`);
                        }
                    }
                });
            }
        }

        // Generate worksheet and workbook using XLSX
        const worksheet = XLSX.utils.json_to_sheet(rows, { header: columns });

        // Helper to convert column index to letter (0 -> A, 1 -> B, ...)
        const getColumnLetter = (colIdx) => {
            let letter = '';
            let temp = colIdx;
            while (temp >= 0) {
                letter = String.fromCharCode((temp % 26) + 65) + letter;
                temp = Math.floor(temp / 26) - 1;
            }
            return letter;
        };

        // Identify input column letters (basicHeader column and all columns starting with Rider_)
        const inputColLetters = [];
        columns.forEach((col, idx) => {
            if (col === basicHeader || col.startsWith('Rider_')) {
                inputColLetters.push(getColumnLetter(idx));
            }
        });

        // Apply borders to cells that require input (non-'N/A' cells in data rows)
        // Rows in worksheet are 1-indexed. Row 1 is header, data rows start at row 2.
        for (let rIdx = 2; rIdx <= rows.length + 1; rIdx++) {
            inputColLetters.forEach(colLetter => {
                const cellKey = `${colLetter}${rIdx}`;
                const cell = worksheet[cellKey];
                if (cell && cell.v !== 'N/A') {
                    cell.s = {
                        border: {
                            top: { style: 'medium', color: { rgb: '000000' } },
                            bottom: { style: 'medium', color: { rgb: '000000' } },
                            left: { style: 'medium', color: { rgb: '000000' } },
                            right: { style: 'medium', color: { rgb: '000000' } }
                        }
                    };
                }
            });
        }

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

export const getRatesHistory = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const history = await ActuarialModel.getRatesHistoryByApplicationId(applicationId);
        return success(res, history, 'Rates history fetched successfully.');
    } catch (err) {
        console.error('Get Rates History Error:', err);
        return error(res, err.message);
    }
};

// Upload Actuarial Files
export const uploadActuarialFiles = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const appId = req.params.id;
        const rawFiles = req.files?.file || req.files?.excel_file;

        const app = await MainModel.getApplicationById(appId);
        if (!app) return error(res, 'Application not found.', 404);

        const targetDir = ensureCompanyDir(app.group_name, 'actuarial_files');

        const filesToProcess = Array.isArray(rawFiles) ? rawFiles : [rawFiles];
        const newFilePaths = [];

        for (const file of filesToProcess) {
            const uniqueFilename = `APP-${appId}-ACT-v${getFileTimestamp()}-${file.originalFilename}`;
            const newFilePath = path.join(targetDir, uniqueFilename).replace(/\\/g, '/');

            await fs.promises.rename(file.filepath, newFilePath);
            newFilePaths.push({ filePath: newFilePath, originalName: file.originalFilename });
        }

        await ActuarialModel.saveActuarialFiles(appId, newFilePaths, userId);

        const updatedApp = await MainModel.getApplicationById(appId);
        const response = await buildApplicationResponse(updatedApp);

        io.emit('uploadActuarialFiles', response);

        return success(res, response, 'Actuarial files uploaded successfully.');
    } catch (err) {
        console.error('Actuarial Upload Error:', err);
        return error(res, err.message);
    }
};

// Download Actuarial Files
export const downloadActuarialFiles = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const appId = req.params.id;

        const app = await MainModel.getApplicationById(appId);
        if (!app) return error(res, 'Application not found.', 404);

        const rawFiles = await ActuarialModel.getActuarialFiles(appId);
        if (!rawFiles || rawFiles.length === 0) {
            return error(res, 'No actuarial files found for this application.', 404);
        }

        let targetFilePath = rawFiles[0];
        const indexParam = req.query.index || req.body?.index;
        if (indexParam !== undefined) {
            const index = parseInt(indexParam, 10);
            if (isNaN(index) || index < 0 || index >= rawFiles.length) {
                return error(res, `Invalid file index. This application has ${rawFiles.length} uploaded actuarial files (valid index range: 0 to ${rawFiles.length - 1}).`, 400);
            }
            targetFilePath = rawFiles[index];
        }

        if (!fs.existsSync(targetFilePath)) {
            // Fallback: resolve path under the current project's uploads folder
            const uploadsIdx = targetFilePath.replace(/\\/g, '/').indexOf('/uploads/');
            if (uploadsIdx !== -1) {
                const relativePart = targetFilePath.substring(uploadsIdx + 1);
                const fallbackPath = path.join(process.cwd(), relativePart);
                if (fs.existsSync(fallbackPath)) {
                    targetFilePath = fallbackPath;
                }
            }
        }

        if (!fs.existsSync(targetFilePath)) {
            console.error(`[downloadActuarialFiles] File not found at: ${targetFilePath}`);
            return error(res, 'File not found on server.', 404);
        }

        const originalName = path.basename(targetFilePath).replace(/^APP-\d+-ACT-v?\d{8}-\d{6}-/, '');
        return res.download(targetFilePath, originalName);
    } catch (err) {
        console.error('Actuarial File Download Error:', err);
        return error(res, err.message);
    }
};

// Get Pending Amendment Requests Queue for Actuarial
export const getApplicationsPendingAmendments = async (req, res) => {
    try {
        const list = await MainModel.getPendingAmendmentRequests(18); // 18 = Actuarial Dept
        return success(res, list, 'Pending amendment requests fetched successfully.');
    } catch (err) {
        console.error('Actuarial Amendment Queue Error:', err);
        return error(res, err.message);
    }
};

// Approve Amendment Request (Actuarial)
export const approveAmendment = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const applicationId = Number(req.params.id);
        const { response_notes } = req.body || {};
        const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

        await MainModel.approveAmendment({
            applicationId,
            responseNotes: response_notes || null,
            ipAddress
        }, userId);

        const updatedApp = await MainModel.getApplicationById(applicationId);
        const response = await buildApplicationResponse(updatedApp);

        io.emit('approveAmendment', response);

        return success(res, response, 'Amendment request approved. Application is now open for Actuarial rate/file updates.');
    } catch (err) {
        console.error('Actuarial Approve Amendment Error:', err);
        return error(res, err.message);
    }
};

// Decline Amendment Request (Actuarial)
export const declineAmendment = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const applicationId = Number(req.params.id);
        const { response_notes } = req.body || {};
        const ipAddress = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

        await MainModel.declineAmendment({
            applicationId,
            responseNotes: response_notes || null,
            ipAddress
        }, userId);

        const updatedApp = await MainModel.getApplicationById(applicationId);
        const response = await buildApplicationResponse(updatedApp);

        io.emit('declineAmendment', response);

        return success(res, response, 'Amendment request declined. Application status restored to Released.');
    } catch (err) {
        console.error('Actuarial Decline Amendment Error:', err);
        return error(res, err.message);
    }
};
