import XLSX from 'xlsx';
import fs from 'fs';
import * as MainModel from '../models/financial_Insurance_form.model.js';

const validateRateValue = (val, label, rowNum) => {
    if (val === null || val === undefined || val === '') {
        throw new Error(`Row ${rowNum}: Missing '${label}' value.`);
    }
    const strVal = String(val).trim();
    
    // Check if it's a number
    const parsed = parseFloat(strVal);
    if (!isNaN(parsed)) {
        if (parsed < 0) {
            throw new Error(`Row ${rowNum}: Invalid '${label}' value: "${val}". Negative rates are not allowed.`);
        }
        // If it is numeric, ensure it only contains digits and a dot (no special symbols like $, %, etc.)
        if (!/^\d+(\.\d+)?$/.test(strVal)) {
            // Check if it is purely alphanumeric (letters, numbers, and spaces)
            if (!/^[a-zA-Z0-9\s]+$/.test(strVal)) {
                throw new Error(`Row ${rowNum}: Invalid '${label}' value: "${val}". Only letters, numbers, and spaces are allowed.`);
            }
        }
        return parsed;
    }
    
    // If it's a non-numeric string, it must be alphanumeric only (no special characters)
    if (!/^[a-zA-Z0-9\s]+$/.test(strVal)) {
        throw new Error(`Row ${rowNum}: Invalid '${label}' value: "${val}". Only letters, numbers, and spaces are allowed.`);
    }
    
    return strVal;
};

export const parseExcelToRatesJSON = async (filePath, app, selectedRiders) => {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: null });

    // Build rider lookup maps
    const riderMap = new Map();
    selectedRiders.forEach(r => {
        const idStr = r.rider_id.toString();
        riderMap.set(idStr, idStr);
        if (r.acronym) riderMap.set(r.acronym.trim().toLowerCase(), idStr);
        if (r.rider_name) riderMap.set(r.rider_name.trim().toLowerCase(), idStr);
    });

    const planId = Number(app.plan_id);

    // Initialize ratesData structure
    const ratesData = {
        '18-65': {
            basic_plan_id: app.basic_plan_id
        }
    };

    // Initialize senior brackets if enabled in application
    const seniorBrackets = ['66-70', '71-75', '76-80'];
    seniorBrackets.forEach(bracket => {
        const bracketFlag = `borrower_age_${bracket.replace('-', '_')}`;
        if (app[bracketFlag]) {
            ratesData[bracket] = {
                basic_plan_id: app.basic_plan_id
            };
        }
    });

    for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i];
        const rowNum = i + 2; // Row number in Excel sheet (1-based + 1 for header)

        // Normalize keys
        const normRow = {};
        for (const [key, val] of Object.entries(row)) {
            const normKey = key.trim().toLowerCase().replace(/[\s_()/-]+/g, '');
            normRow[normKey] = val;
        }

        // 1. Get and normalize bracket
        const rawBracket = normRow['bracket'] || normRow['agebracket'] || normRow['borrowerbracket'] || normRow['agecategory'];
        let bracketStr = rawBracket ? String(rawBracket).trim() : null;
        if (!bracketStr) {
            // Default to 18-65 if not specified
            bracketStr = '18-65';
        }
        if (bracketStr === '18-64') {
            bracketStr = '18-65';
        }

        // If the bracket is not active or invalid, skip it
        if (!ratesData[bracketStr]) {
            continue;
        }

        // 2. Get and normalize age or band or term
        const ageOrBandVal = normRow['ageorband'] || normRow['ageorterm'] || normRow['age'] || normRow['term'] || normRow['month'] || normRow['ageband'] || normRow['attainedage'] || normRow['attainedageband'] || normRow['attainedageorband'] || normRow['ridertype'];
        if (ageOrBandVal === null || ageOrBandVal === undefined) {
            throw new Error(`Row ${rowNum}: Missing 'Age_or_Band' or 'Age_or_Term' value.`);
        }

        const ageOrBandStr = String(ageOrBandVal).trim().toLowerCase();

        // 3. Get basic rate
        const normBasicPlanName = app.basic_plan_name ? app.basic_plan_name.trim().toLowerCase().replace(/[\s_()/-]+/g, '') : null;
        const normBasicPlanAcronym = app.basic_plan_acronym ? app.basic_plan_acronym.trim().toLowerCase().replace(/[\s_()/-]+/g, '') : null;

        let basicRateVal = null;
        const basicRateKeys = [
            'basicrate', 'rate', 'basic', 'basepremiumrate', 'basicplanrate', 'gclirate', 'gtliprate', 'basicplan',
            normBasicPlanName, normBasicPlanAcronym
        ].filter(Boolean);

        for (const k of basicRateKeys) {
            if (normRow[k] !== undefined && normRow[k] !== null && normRow[k] !== '') {
                basicRateVal = normRow[k];
                break;
            }
        }

        if (basicRateVal === null || basicRateVal === undefined || basicRateVal === '') {
            throw new Error(`Row ${rowNum}: Missing 'Basic_Rate' or 'Rate' value.`);
        }
        const basicRate = validateRateValue(basicRateVal, 'Basic_Rate', rowNum);

        // 4. Gather riders from other columns
        const riders = [];
        for (const [key, val] of Object.entries(row)) {
            if (val === null || val === undefined || val === '') continue;

            if (typeof val === 'string' && val.trim().toUpperCase() === 'N/A') {
                continue;
            }

            const normKey = key.trim().toLowerCase();
            let riderSearchKey = normKey;
            if (normKey.startsWith('rider_')) {
                riderSearchKey = normKey.substring(6);
            } else if (normKey.startsWith('rider')) {
                riderSearchKey = normKey.substring(5);
            }

            if (riderMap.has(riderSearchKey)) {
                const riderId = riderMap.get(riderSearchKey);
                const rRate = validateRateValue(val, key, rowNum);
                riders.push({
                    rider_id: riderId,
                    rider_rate: rRate,
                    rate: rRate // Include for compatibility with duplicate keys check
                });
            }
        }

        // 5. Structure based on plan
        if (planId === 1) { // GCLI
            const termVal = normRow['termmonths'] || normRow['term'] || normRow['month'] || normRow['loanterm'] || normRow['loantermmonths'] || ageOrBandStr;
            const term = parseInt(termVal, 10);
            if (isNaN(term)) {
                throw new Error(`Row ${rowNum}: Invalid term value for GCLI: "${termVal}".`);
            }

            if (bracketStr === '18-65') {
                if (ageOrBandStr === 'basic_plan' || !isNaN(parseInt(ageOrBandStr, 10))) {
                    if (!ratesData['18-65'].basic_plan) {
                        ratesData['18-65'].basic_plan = [];
                    }
                    ratesData['18-65'].basic_plan.push({
                        term_of_months: term,
                        basic_rate: basicRate,
                        riders: riders
                    });
                } else if (ageOrBandStr === 'rates') {
                    if (!ratesData['18-65'].rates) {
                        ratesData['18-65'].rates = [];
                    }
                    ratesData['18-65'].rates.push({
                        term_of_months: term,
                        rate: basicRate,
                        riders: riders
                    });
                }
            } else {
                // Senior bracket in GCLI: age-specific monthly lists
                let ageStr = ageOrBandStr;
                if (!ageStr.startsWith('age_') && !isNaN(parseInt(ageStr, 10))) {
                    ageStr = 'age_' + parseInt(ageStr, 10);
                }
                if (!ratesData[bracketStr][ageStr]) {
                    ratesData[bracketStr][ageStr] = [];
                }
                ratesData[bracketStr][ageStr].push({
                    term_of_months: term,
                    basic_rate: basicRate
                });
            }
        } else { // GYRT (2) or GPA (3)
            let ageKey = ageOrBandStr;
            if (ageKey === 'rates') {
                ageKey = 'rates';
            } else {
                // Normalize age bands (e.g. 18-24, 18_to_24 -> age_18_24)
                if (ageKey.includes('-')) {
                    ageKey = 'age_' + ageKey.replace('-', '_');
                } else if (ageKey.includes('_')) {
                    if (!ageKey.startsWith('age_')) ageKey = 'age_' + ageKey;
                } else if (!isNaN(parseInt(ageKey, 10))) {
                    ageKey = 'age_' + parseInt(ageKey, 10);
                } else if (ageKey === 'basic_plan') {
                    ageKey = 'basic_plan';
                }
            }

            if (!ratesData[bracketStr][ageKey]) {
                ratesData[bracketStr][ageKey] = [];
            }

            ratesData[bracketStr][ageKey].push({
                basic_rate: basicRate,
                riders: riders
            });
        }
    }

    // Sort GCLI arrays by term_of_months
    if (planId === 1) {
        if (ratesData['18-65'].basic_plan) {
            ratesData['18-65'].basic_plan.sort((a, b) => a.term_of_months - b.term_of_months);
        }
        if (ratesData['18-65'].rates) {
            ratesData['18-65'].rates.sort((a, b) => a.term_of_months - b.term_of_months);
        }
        seniorBrackets.forEach(bracket => {
            if (ratesData[bracket]) {
                Object.keys(ratesData[bracket]).forEach(key => {
                    if (key.startsWith('age_') && Array.isArray(ratesData[bracket][key])) {
                        ratesData[bracket][key].sort((a, b) => a.term_of_months - b.term_of_months);
                    }
                });
            }
        });
    }

    return ratesData;
};

export const parseExcelRatesMiddleware = async (req, res, next) => {
    let excelFile = req.files?.excel_file;
    if (Array.isArray(excelFile)) {
        excelFile = excelFile[0];
    }
    if (!excelFile) {
        return res.status(400).json({ status: false, message: 'No Excel file provided. Please upload a file with the key "excel_file".' });
    }

    try {
        const applicationId = req.params.id;
        const app = await MainModel.getApplicationById(applicationId);
        if (!app) return res.status(404).json({ status: false, message: 'Application not found' });

        // Load the workbook to check the metadata sheet first
        const workbook = XLSX.readFile(excelFile.filepath);
        const metaSheet = workbook.Sheets['App Metadata'];
        if (!metaSheet) {
            // Cleanup temp file in case of validation error
            if (excelFile.filepath && fs.existsSync(excelFile.filepath)) {
                fs.promises.unlink(excelFile.filepath).catch(e => console.error("Temp file cleanup failed:", e));
            }
            return res.status(400).json({
                status: false,
                message: "Failed to parse Excel file: Invalid template. The 'App Metadata' sheet is missing."
            });
        }

        const metaRows = XLSX.utils.sheet_to_json(metaSheet);
        const appIdEntry = metaRows.find(row => row['Metadata Key'] === 'Application ID');
        const parsedAppId = appIdEntry ? String(appIdEntry['Value']).trim() : null;

        if (!parsedAppId || parsedAppId !== String(applicationId)) {
            // Cleanup temp file in case of validation error
            if (excelFile.filepath && fs.existsSync(excelFile.filepath)) {
                fs.promises.unlink(excelFile.filepath).catch(e => console.error("Temp file cleanup failed:", e));
            }
            return res.status(400).json({
                status: false,
                message: `Failed to parse Excel file: Template mismatch. This template was generated for Application ID ${parsedAppId || 'unknown'}, but you are trying to upload it to Application ID ${applicationId}.`
            });
        }

        const selectedRiders = await MainModel.getApplicationRiders(applicationId);

        const ratesData = await parseExcelToRatesJSON(excelFile.filepath, app, selectedRiders);

        // Clean up the temp file uploaded by parseMultipartForm
        if (excelFile.filepath && fs.existsSync(excelFile.filepath)) {
            fs.promises.unlink(excelFile.filepath).catch(e => console.error("Temp file cleanup failed:", e));
        }

        // Set req.body to match standard validateRates input format
        req.body = {
            ...ratesData,
            application_id: parseInt(applicationId, 10)
        };
        req.isExcelUpload = true;

        next();
    } catch (err) {
        // Clean up the temp file uploaded by parseMultipartForm in case of error
        if (excelFile.filepath && fs.existsSync(excelFile.filepath)) {
            fs.promises.unlink(excelFile.filepath).catch(e => console.error("Temp file cleanup failed:", e));
        }
        console.error('Excel Parsing Error:', err);
        return res.status(400).json({ status: false, message: `Failed to parse Excel file: ${err.message}` });
    }
};
