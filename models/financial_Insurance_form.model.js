import { poolPromise, sql } from '../config/db.js';
import path from 'path';

const valueOrNull = (val) => (val !== undefined && val !== null && val !== '') ? val : null;

// Helper to log application actions
const logApplicationAction = async (transaction, { applicationId, userId, actionType, changes, ipAddress }) => {
    const request = new sql.Request(transaction);
    await request
        .input('application_id', sql.Int, applicationId)
        .input('user_id', sql.Int, userId)
        .input('action_type', sql.NVarChar, actionType)
        .input('changes', sql.NVarChar(sql.MAX), JSON.stringify(changes))
        .input('ip_address', sql.NVarChar, ipAddress || null)
        .query(`
            INSERT INTO DHUB_UAT.sg.financial_insurance_application_history_logs (application_id, user_id, action_type, changes, ip_address)
            VALUES (@application_id, @user_id, @action_type, @changes, @ip_address)
        `);
};

export const createApplication = async (data, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const paymentTerm = (data.payment && Array.isArray(data.payment) && data.payment.length > 0) ? data.payment[0] : null;


        const appRequest = new sql.Request(transaction);
        const appResult = await appRequest
            .input('user_id', sql.Int, userId)
            .input('group_name', sql.NVarChar, data.group_name)
            .input('business_nature', sql.NVarChar, valueOrNull(data.business_nature))
            .input('business_nature_id', sql.Int, valueOrNull(data.business_nature_id))
            .input('sub_business_nature_id', sql.Int, data.sub_business_nature_id ? Number(data.sub_business_nature_id) : null)
            .input('number_of_lives', sql.Int, data.number_of_lives)
            .input('business_address', sql.NVarChar, data.business_address)
            .input('contact_number', sql.NVarChar, valueOrNull(data.contact_number))
            .input('fax_number', sql.NVarChar, valueOrNull(data.fax_number))
            .input('email', sql.NVarChar, data.email)
            .input('contact_person_salutation', sql.NVarChar, data.contact_person_salutation)
            .input('contact_person_firstname', sql.NVarChar, data.contact_person_firstname)
            .input('contact_person_mi', sql.NVarChar, valueOrNull(data.contact_person_mi))
            .input('contact_person_lastname', sql.NVarChar, data.contact_person_lastname)
            .input('designation', sql.NVarChar, data.designation)
            .input('proposal_addressee', sql.NVarChar, data.proposal_addressee)
            .input('addressee_designation', sql.NVarChar, data.addressee_designation)
            .input('group_classification_id', sql.Int, data.group_classification_id)
            .input('other_group_classification', sql.NVarChar, valueOrNull(data.other_group_classification))
            .input('business_type_id', sql.Int, data.business_type_id)
            .input('other_business_type', sql.NVarChar, valueOrNull(data.other_business_type))
            .input('group_type_id', sql.Int, data.group_type_id)
            .input('other_group_type', sql.NVarChar, valueOrNull(data.other_group_type))
            .input('minimum_age', sql.Int, data.minimum_age)
            .input('maximum_age', sql.Int, data.maximum_age)
            .input('payment_mode_id', sql.Int, data.payment_mode_id)
            .input('plan_id', sql.Int, valueOrNull(data.plan_id))
            .input('basic_plan_id', sql.Int, valueOrNull(data.basic_plan_id))
            .input('type_of_proposal_id', sql.Int, data.type_of_proposal_id)
            .input('prototype_id', sql.Int, valueOrNull(data.prototype_id))
            .input('status_id', sql.Int, data.status_id || 8)
            .input('amount_loans_id', sql.Int, valueOrNull(data.amount_loans_id))
            .input('max_loan_amount', sql.Decimal(18, 2), valueOrNull(data.max_loan_amount))
            .input('min_loan_amount', sql.Decimal(18, 2), valueOrNull(data.min_loan_amount))
            .input('loan_portfolio_amount', sql.Decimal(18, 2), valueOrNull(data.loan_portfolio_amount))
            .input('loans_amount', sql.Decimal(18, 2), valueOrNull(data.loans_amount))
            .input('coverage_type_id', sql.Int, valueOrNull(data.coverage_type_id))
            .input('payment_term_id', sql.Int, paymentTerm ? paymentTerm.payment_term_id : null)
            .input('sub_payment_term_id', sql.Int, paymentTerm ? paymentTerm.sub_payment_term_id : null)
            .input('borrower_age_66_70', sql.Bit, data.borrower_age_66_70 || false)
            .input('borrower_amount_66_70', sql.Decimal(18, 2), valueOrNull(data.borrower_amount_66_70))
            .input('borrower_age_71_75', sql.Bit, data.borrower_age_71_75 || false)
            .input('borrower_amount_71_75', sql.Decimal(18, 2), valueOrNull(data.borrower_amount_71_75))
            .input('borrower_age_76_80', sql.Bit, data.borrower_age_76_80 || false)
            .input('borrower_amount_76_80', sql.Decimal(18, 2), valueOrNull(data.borrower_amount_76_80))
            .input('borrower_amount_18_65', sql.Decimal(18, 2), valueOrNull(data.borrower_amount_18_65))
            .input('borrower_amount_under_min', sql.Decimal(18, 2), valueOrNull(data.borrower_amount_under_min))
            .input('borrower_amount_over_max', sql.Decimal(18, 2), valueOrNull(data.borrower_amount_over_max))
            .input('channel_type_id', sql.Int, valueOrNull(data.channel_type_id))
            .input('channel_name', sql.NVarChar, valueOrNull(data.channel_name))
            .input('channel_number', sql.NVarChar, valueOrNull(data.channel_number))
            .input('channel_email', sql.NVarChar, valueOrNull(data.channel_email))
            .input('commission_rate', sql.NVarChar, valueOrNull(data.commission_rate))
            .input('service_fee', sql.NVarChar, valueOrNull(data.service_fee))
            .input('total_annual_premium', sql.Decimal(18, 2), valueOrNull(data.total_annual_premium))
            .input('proposal_status_id', sql.Int, valueOrNull(data.proposal_status_id))
            .input('notes', sql.NVarChar(sql.MAX), valueOrNull(data.notes))
            .input('evidence_notes', sql.NVarChar(sql.MAX), valueOrNull(data.evidence_notes))
            .input('expiry_date', sql.DateTime, valueOrNull(data.expiry_date))
            .input('excel_file_path', sql.NVarChar(sql.MAX), valueOrNull(data.excel_file_path))
            .input('company_tin', sql.NVarChar(50), valueOrNull(data.company_tin))
            .query(`
                INSERT INTO DHUB_UAT.sg.financial_insurance_application (
                    user_id, group_name, business_nature, business_nature_id, sub_business_nature_id, number_of_lives, business_address, contact_number, fax_number, email,
                    contact_person_salutation, contact_person_firstname, contact_person_mi, contact_person_lastname, designation, proposal_addressee, addressee_designation, group_classification_id,
                    other_group_classification, business_type_id, other_business_type, group_type_id, other_group_type,
                    minimum_age, maximum_age, payment_mode_id, plan_id, basic_plan_id, type_of_proposal_id, prototype_id, status_id,
                    amount_loans_id, max_loan_amount, min_loan_amount, loan_portfolio_amount, loans_amount, coverage_type_id, payment_term_id, sub_payment_term_id, excel_file_path,
                    borrower_age_66_70, borrower_amount_66_70, borrower_age_71_75, borrower_amount_71_75, borrower_age_76_80, borrower_amount_76_80, borrower_amount_18_65, borrower_amount_under_min, borrower_amount_over_max, channel_type_id, channel_name, channel_number, channel_email, commission_rate, service_fee, total_annual_premium, proposal_status_id, notes, evidence_notes, expiry_date, company_tin
                ) VALUES (
                    @user_id, @group_name, @business_nature, @business_nature_id, @sub_business_nature_id, @number_of_lives, @business_address, @contact_number, @fax_number, @email,
                    @contact_person_salutation, @contact_person_firstname, @contact_person_mi, @contact_person_lastname, @designation, @proposal_addressee, @addressee_designation, @group_classification_id,
                    @other_group_classification, @business_type_id, @other_business_type, @group_type_id, @other_group_type,
                    @minimum_age, @maximum_age, @payment_mode_id, @plan_id, @basic_plan_id, @type_of_proposal_id, @prototype_id, @status_id,
                    @amount_loans_id, @max_loan_amount, @min_loan_amount, @loan_portfolio_amount, @loans_amount, @coverage_type_id, @payment_term_id, @sub_payment_term_id, @excel_file_path,
                    @borrower_age_66_70, @borrower_amount_66_70, @borrower_age_71_75, @borrower_amount_71_75, @borrower_age_76_80, @borrower_amount_76_80, @borrower_amount_18_65, @borrower_amount_under_min, @borrower_amount_over_max, @channel_type_id, @channel_name, @channel_number, @channel_email, @commission_rate, @service_fee, @total_annual_premium, @proposal_status_id, @notes, @evidence_notes, @expiry_date, @company_tin
                );
                SELECT SCOPE_IDENTITY() AS application_id;
            `);

        const applicationId = appResult.recordset[0].application_id;

        // Log the creation action
        await logApplicationAction(transaction, {
            applicationId,
            userId,
            actionType: 'CREATE',
            changes: data,
            ipAddress: data.ip_address
        });

        // Insert sub_group_type_ids into the new table
        if (data.sub_group_type_id) {
            const subGroupIds = Array.isArray(data.sub_group_type_id) ? data.sub_group_type_id : [data.sub_group_type_id];
            if (subGroupIds.length > 0) {
                for (const subGroupId of subGroupIds) {
                    const subGroupRequest = new sql.Request(transaction);
                    await subGroupRequest
                        .input('application_id', sql.Int, applicationId)
                        .input('sub_group_type_id', sql.Int, subGroupId)
                        .query(`
                            INSERT INTO DHUB_UAT.sg.financial_insurance_application_subgroup (application_id, sub_group_type_id)
                            VALUES (@application_id, @sub_group_type_id);
                        `);
                }
            }
        }

        // Insert coverage ranking details if applicable
        const coverageTypeId = data.coverage_type_id;
        const levelRanking = data.level_ranking;
        const salaryRanking = data.salary_ranking;
        const uniformAmount = data.uniform_coverage_amount;

        // Helper to insert ranking-specific riders (scoped to transaction)
        const insertRankingRiders = async (rankingId, designation, riders) => {
            if (riders && Array.isArray(riders) && riders.length > 0) {
                for (const rider of riders) {
                    const riderValue = rider.values && Array.isArray(rider.values) 
                        ? rider.values.find(v => v.designation === designation) 
                        : null;

                    // Fallback: If no specific value found (e.g. during partial update), use the base values
                    const finalValue = riderValue || (rider.amount !== undefined || rider.unit !== undefined ? { amount: rider.amount, unit: rider.unit } : null);

                    if (finalValue) {
                        await new sql.Request(transaction)
                            .input('coverage_ranking_id', sql.Int, rankingId)
                            .input('rider_id', sql.Int, rider.rider_id)
                            .input('rider_amount', sql.Decimal(18, 2), valueOrNull(finalValue.amount))
                            .input('rider_unit', sql.Int, valueOrNull(finalValue.unit))
                            .query(`INSERT INTO DHUB_UAT.sg.financial_insurance_coverage_ranking_rider (coverage_ranking_id, rider_id, rider_amount, rider_unit) VALUES (@coverage_ranking_id, @rider_id, @rider_amount, @rider_unit);`);
                    }
                }
            }
        };

        if (coverageTypeId === 32 && levelRanking && levelRanking.length > 0) { 
            for (const rank of levelRanking) {
                const rankRequest = new sql.Request(transaction);
                const rankResult = await rankRequest
                    .input('application_id', sql.Int, applicationId)
                    .input('designation', sql.NVarChar, rank.designation)
                    .input('amount', sql.Decimal(18, 2), rank.amount)
                    .input('total_coverage_amount', sql.Decimal(18, 2), rank.amount) 
                    .query(`INSERT INTO DHUB_UAT.sg.financial_insurance_coverage_ranking (application_id, designation, amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @total_coverage_amount); SELECT SCOPE_IDENTITY() AS id;`);
                
                const rankingId = rankResult.recordset[0].id;
                await insertRankingRiders(rankingId, rank.designation, data.riders);
            }
        } else if (coverageTypeId === 34 && salaryRanking && salaryRanking.length > 0) { 
            for (const rank of salaryRanking) {
                const multiplier = parseInt(rank.salary_multiplier.replace(/x/i, ''), 10) || 1;
                const totalAmount = parseFloat(rank.amount) * multiplier;

                const rankRequest = new sql.Request(transaction);
                const rankResult = await rankRequest
                    .input('application_id', sql.Int, applicationId)
                    .input('designation', sql.NVarChar, rank.designation)
                    .input('amount', sql.Decimal(18, 2), rank.amount)
                    .input('salary_multiplier', sql.NVarChar, rank.salary_multiplier)
                    .input('total_coverage_amount', sql.Decimal(18, 2), totalAmount)
                    .query(`INSERT INTO DHUB_UAT.sg.financial_insurance_coverage_ranking (application_id, designation, amount, salary_multiplier, total_coverage_amount) VALUES (@application_id, @designation, @amount, @salary_multiplier, @total_coverage_amount); SELECT SCOPE_IDENTITY() AS id;`);
                
                const rankingId = rankResult.recordset[0].id;
                await insertRankingRiders(rankingId, rank.designation, data.riders);
            }
        } else if (coverageTypeId === 33 && uniformAmount != null) {
            const rankRequest = new sql.Request(transaction);
            await rankRequest
                .input('application_id', sql.Int, applicationId)
                .input('designation', sql.NVarChar, 'All Rank')
                .input('amount', sql.Decimal(18, 2), uniformAmount)
                .input('uniform_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                .input('total_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                .query(`INSERT INTO DHUB_UAT.sg.financial_insurance_coverage_ranking (application_id, designation, amount, uniform_coverage_amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @uniform_coverage_amount, @total_coverage_amount);`);
        }

        if (data.riders && Array.isArray(data.riders) && data.riders.length > 0) {
            for (const rider of data.riders) {
                const riderRequest = new sql.Request(transaction);
                await riderRequest
                    .input('application_id', sql.Int, applicationId)
                    .input('rider_id', sql.Int, rider.rider_id)
                    .input('rider_amount', sql.Decimal(18, 2), valueOrNull(rider.amount))
                    .input('rider_unit', sql.Int, valueOrNull(rider.unit))
                    .query(`
                        INSERT INTO DHUB_UAT.sg.financial_insurance_application_rider
                        (application_id, rider_id, rider_amount, rider_unit)
                        VALUES (@application_id, @rider_id, @rider_amount, @rider_unit);
                    `);
            }
        }

        // Insert affiliates if applicable
        if (data.affiliates && Array.isArray(data.affiliates) && data.affiliates.length > 0) {
            for (const affiliate of data.affiliates) {
                if (affiliate.company_name) {
                    await new sql.Request(transaction)
                        .input('application_id', sql.Int, applicationId)
                        .input('company_name', sql.NVarChar(255), affiliate.company_name)
                        .input('tin_number', sql.NVarChar(50), valueOrNull(affiliate.tin_number))
                        .input('address', sql.NVarChar(500), valueOrNull(affiliate.address))
                        .query(`
                            INSERT INTO DHUB_UAT.sg.financial_insurance_application_affiliate (application_id, company_name, tin_number, address)
                            VALUES (@application_id, @company_name, @tin_number, @address);
                        `);
                }
            }
        }

        // Insert files if applicable
        if (data.excel_file_path) {
            let paths = [];
            try {
                paths = JSON.parse(data.excel_file_path);
                if (!Array.isArray(paths)) paths = [data.excel_file_path];
            } catch (e) {
                paths = data.excel_file_path.split(',').map(p => p.trim());
            }

            for (const p of paths) {
                if (p) {
                    await new sql.Request(transaction)
                        .input('application_id', sql.Int, applicationId)
                        .input('file_path', sql.NVarChar(500), p)
                        .input('file_name', sql.NVarChar(255), path.basename(p))
                        .query('INSERT INTO DHUB_UAT.sg.financial_insurance_application_files (application_id, file_path, file_name) VALUES (@application_id, @file_path, @file_name)');
                }
            }
        }

        await transaction.commit();
        return { application_id: applicationId };
    } catch (err) {
        await transaction.rollback();
        throw err; 
    }
};

// Get coverage rankings for multiple applications in bulk
export const getBulkCoverageRankings = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT application_id, designation, amount, salary_multiplier, uniform_coverage_amount, total_coverage_amount
        FROM DHUB_UAT.sg.financial_insurance_coverage_ranking
        WHERE application_id IN (${idParams})`);
    return result.recordset ?? [];
};

// Get nested riders for coverage rankings in bulk
export const getBulkCoverageRankingRiders = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT 
            cr.application_id,
            crr.rider_id,
            r.rider_name,
            r.acronym,
            cr.designation,
            crr.rider_amount,
            crr.rider_unit
        FROM DHUB_UAT.sg.financial_insurance_coverage_ranking_rider crr
        JOIN DHUB_UAT.sg.financial_insurance_coverage_ranking cr ON crr.coverage_ranking_id = cr.ranking_id
        JOIN DHUB_UAT.sg.financial_insurance_riders r ON crr.rider_id = r.rider_id
        WHERE cr.application_id IN (${idParams})
    `);
    return result.recordset ?? [];
};

// Get all applications
export const getAllApplications = async (userId = null, excludeDrafts = false) => {
    const pool = await poolPromise;
    const request = pool.request();

    let whereCondition = '(@user_id IS NULL OR fia.user_id = @user_id)';
    
    if (Array.isArray(userId)) {
        const idParams = userId.map((id, i) => {
            request.input(`uId${i}`, sql.Int, id);
            return `@uId${i}`;
        }).join(',');
        whereCondition = `fia.user_id IN (${idParams})`;
    } else {
        request.input('user_id', sql.Int, userId);
    }

    if (excludeDrafts) {
        whereCondition += ' AND fia.status_id <> 11';
    }

    const res = await request
        .query(`
            SELECT
                fia.application_id,
                fia.user_id,
                fia.group_name,
                fia.business_nature,
                fia.business_nature_id,
                fia.sub_business_nature_id,
                fia.number_of_lives,
                fia.business_address,
                fia.contact_number,
                fia.fax_number,
                fia.email,
                fia.contact_person_salutation,
                fia.contact_person_firstname,
                fia.contact_person_mi,
                fia.contact_person_lastname,
                fia.designation,
                fia.proposal_addressee,
                fia.addressee_designation,
                fia.minimum_age,
                fia.maximum_age,
                fia.payment_mode_id,
                fia.status_id,
                fia.group_classification_id,
                fia.other_group_classification,
                fia.business_type_id,
                fia.other_business_type,
                fia.group_type_id,
                fia.other_group_type,
                fia.plan_id,
                fia.basic_plan_id,
                fia.prototype_id,
                fia.type_of_proposal_id,
                fia.amount_loans_id,
                fia.max_loan_amount,
                fia.min_loan_amount,
                fia.loan_portfolio_amount,
                fia.loans_amount,
                fia.coverage_type_id,
                fia.borrower_age_66_70,
                fia.borrower_amount_66_70,
                fia.borrower_age_71_75,
                fia.borrower_amount_71_75,
                fia.borrower_age_76_80,
                fia.borrower_amount_76_80,
                fia.borrower_amount_18_65,
                fia.borrower_amount_under_min,
                fia.borrower_amount_over_max,
                fia.proposal_status_id,
                fia.channel_type_id,
                fia.channel_name,
                fia.channel_number,
                fia.channel_email,
                fia.commission_rate,
                fia.service_fee,
                fia.total_annual_premium,
                fia.notes,
                fia.excel_file_path,
                fia.evidence_notes,
                fia.created_at,
                fia.updated_at,
                fia.expiry_date,
                fia.extension_requested,
                fia.extension_request_status_id,
                ext.name AS extension_request_status_name,
                fis.status_name,
                ps.name AS proposal_status_name,
                gc.name AS group_classification_name,
                bt.name AS business_type_name,
                gt.name AS group_type_name,
                pm.name AS payment_mode_name,
                topl.name AS type_of_proposal_name,
                p.product_name AS plan_name,
                p.acronym AS plan_acronym,
                bp.basic_plan_name,
                bp.acronym AS basic_plan_acronym,
                pp.name AS prototype_plan_name,
                pp.acronym AS prototype_plan_acronym,
                ind.name AS business_nature_name,
                subind.name AS sub_business_nature_name,
                al.name AS amount_loans_name,
                ct.name AS coverage_type_name,
                ml.month_name AS loan_maturity_month_name,
                chant.name AS channel_type_name,
                u.firstname AS creator_firstname,
                u.middlename AS creator_middlename,
                u.lastname AS creator_lastname,
                u.suffix AS creator_suffix,
                req.signed_proposal_path,
                req.group_app_path,
                req.dti_path,
                req.sec_reg_path,
                req.articles_of_inc_path,
                req.by_laws_path,
                req.business_permit_path,
                req.masterlist_file_path,
                req.authorized_id_path,
                req.booking_date
            FROM DHUB_UAT.sg.financial_insurance_application fia
            LEFT JOIN DHUB_UAT.sg.financial_insurance_status_lookup fis
                ON fia.status_id = fis.status_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups gc
                ON fia.group_classification_id = gc.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups bt
                ON fia.business_type_id = bt.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups gt
                ON fia.group_type_id = gt.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups pm
                ON fia.payment_mode_id = pm.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups topl
                ON fia.type_of_proposal_id = topl.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_product p
                ON fia.plan_id = p.product_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_basic_plan bp
                ON fia.basic_plan_id = bp.basic_plan_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_prototype_plans pp
                ON fia.prototype_id = pp.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups al
                ON fia.amount_loans_id = al.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups ct
                ON fia.coverage_type_id = ct.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups chant
                ON fia.channel_type_id = chant.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_industries ind
                ON fia.business_nature_id = ind.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_month_lookups ml
                ON fia.sub_payment_term_id = ml.month_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_industries subind
                ON fia.sub_business_nature_id = subind.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u
                ON fia.user_id = u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups ps
                ON fia.proposal_status_id = ps.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups ext
                ON fia.extension_request_status_id = ext.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_installation_requirements req
                ON fia.application_id = req.application_id
            WHERE ${whereCondition}
            ORDER BY fia.created_at DESC;
        `);

    const apps = res.recordset ?? [];
    if (apps.length > 0) {
        const appIds = apps.map(a => a.application_id);
        const filesRes = await pool.request().query(`
            SELECT application_id, file_path 
            FROM DHUB_UAT.sg.financial_insurance_application_files 
            WHERE application_id IN (${appIds.join(',')})
        `);
        const filesMap = {};
        (filesRes.recordset || []).forEach(f => {
            if (!filesMap[f.application_id]) {
                filesMap[f.application_id] = [];
            }
            filesMap[f.application_id].push(f.file_path);
        });

        // Bulk load actuarial notes
        const notesRes = await pool.request().query(`
            SELECT application_id, notes, show_in_pdf 
            FROM DHUB_UAT.sg.financial_insurance_application_notes 
            WHERE application_id IN (${appIds.join(',')}) AND department = 'actuarial'
        `);
        const notesMap = {};
        const showMap = {};
        (notesRes.recordset || []).forEach(n => {
            notesMap[n.application_id] = n.notes;
            showMap[n.application_id] = n.show_in_pdf;
        });

        // Bulk load actuarial to CFE notes
        const toCfeNotesRes = await pool.request().query(`
            SELECT application_id, notes 
            FROM DHUB_UAT.sg.financial_insurance_application_notes 
            WHERE application_id IN (${appIds.join(',')}) AND department = 'actuarial_to_cfe'
        `);
        const toCfeNotesMap = {};
        (toCfeNotesRes.recordset || []).forEach(n => {
            toCfeNotesMap[n.application_id] = n.notes;
        });

        // Bulk load actuarial files
        const actFilesRes = await pool.request().query(`
            SELECT application_id, file_path 
            FROM DHUB_UAT.sg.financial_insurance_application_department_files 
            WHERE application_id IN (${appIds.join(',')}) AND department = 'actuarial'
        `);
        const actFilesMap = {};
        (actFilesRes.recordset || []).forEach(f => {
            if (!actFilesMap[f.application_id]) {
                actFilesMap[f.application_id] = [];
            }
            actFilesMap[f.application_id].push(f.file_path);
        });

        // Bulk load all department files (supporting details)
        const deptFilesRes = await pool.request().query(`
            SELECT f.application_id, f.file_path, f.file_name, f.department, f.created_at, f.uploaded_by_user_id, u.firstname, u.lastname, dept.name AS uploader_department
            FROM DHUB_UAT.sg.financial_insurance_application_department_files f
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON f.uploaded_by_user_id = u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_system_lookups dept ON u.department_id = dept.id AND dept.category = 'DEPARTMENT'
            WHERE f.application_id IN (${appIds.join(',')})
        `);
        const deptFilesMap = {};
        (deptFilesRes.recordset || []).forEach(f => {
            if (!deptFilesMap[f.application_id]) {
                deptFilesMap[f.application_id] = [];
            }
            deptFilesMap[f.application_id].push({
                file_path: f.file_path,
                file_name: f.file_name,
                department: f.department,
                created_at: f.created_at,
                uploaded_by_user_id: f.uploaded_by_user_id,
                firstname: f.firstname,
                lastname: f.lastname,
                uploader_department: f.uploader_department
            });
        });

        apps.forEach(app => {
            const appFiles = filesMap[app.application_id];
            app.excel_file_path = appFiles ? JSON.stringify(appFiles) : null;
            app.actuarial_notes = notesMap[app.application_id] ?? null;
            app.actuarial_notes_show_in_pdf = showMap[app.application_id] !== false;
            app.actuarial_to_cfe_notes = toCfeNotesMap[app.application_id] ?? null;
            
            const appActFiles = actFilesMap[app.application_id];
            app.actuarial_files = appActFiles ? JSON.stringify(appActFiles) : null;

            app.department_files = deptFilesMap[app.application_id] || [];
        });
    }
    return apps;
};

export const getExtensionRequests = async (userIds = null) => {
    const pool = await poolPromise;
    const request = pool.request();

    let query = `SELECT application_id FROM DHUB_UAT.sg.financial_insurance_application WHERE extension_requested = 1`;

    if (userIds) {
        if (Array.isArray(userIds)) {
            const idParams = userIds.map((id, i) => {
                request.input(`uId${i}`, sql.Int, id);
                return `@uId${i}`;
            }).join(',');
            query += ` AND user_id IN (${idParams})`;
        } else {
            request.input('user_id', sql.Int, userIds);
            query += ` AND user_id = @user_id`;
        }
    }

    const result = await request.query(query);
    return result.recordset.map(r => r.application_id);
};

// Get prototypes (type 30)
export const getPrototypes = async (userId = null) => {
    const pool = await poolPromise;
    const request = pool.request();

    let userCondition = '(@user_id IS NULL OR fia.user_id = @user_id)';
    
    if (Array.isArray(userId)) {
        const idParams = userId.map((id, i) => {
            request.input(`uId${i}`, sql.Int, id);
            return `@uId${i}`;
        }).join(',');
        userCondition = `fia.user_id IN (${idParams})`;
    } else {
        request.input('user_id', sql.Int, userId);
    }

    const res = await request
        .query(`
            SELECT
                fia.application_id, fia.user_id, fia.group_name, fia.number_of_lives,
                fia.contact_person_salutation, fia.contact_person_firstname, fia.contact_person_mi, fia.contact_person_lastname,
                fia.status_id, fia.group_classification_id, fia.other_group_classification,
                fia.business_type_id, fia.other_business_type, fia.group_type_id, fia.other_group_type,
                fia.plan_id, fia.basic_plan_id, fia.prototype_id,
                fia.type_of_proposal_id,
                fia.amount_loans_id,
                fia.max_loan_amount,
                fia.min_loan_amount,
                fia.loan_portfolio_amount,
                fia.loans_amount,
                fia.coverage_type_id,
                fia.borrower_age_66_70,
                fia.borrower_amount_66_70,
                fia.borrower_age_71_75,
                fia.borrower_amount_71_75,
                fia.borrower_age_76_80,
                fia.borrower_amount_76_80,
                fia.borrower_amount_18_65,
                fia.borrower_amount_under_min,
                fia.borrower_amount_over_max,
                fia.proposal_status_id,
                fia.channel_type_id,
                fia.channel_name,
                fia.channel_number,
                fia.channel_email,
                fia.commission_rate,
                fia.service_fee,
                fia.total_annual_premium,
                fia.notes,
                fia.excel_file_path,
                fia.evidence_notes,
                fia.created_at, fia.updated_at,
                fis.status_name,
                ps.name AS proposal_status_name,
                gc.name AS group_classification_name,
                bt.name AS business_type_name,
                gt.name AS group_type_name,
                topl.name AS type_of_proposal_name,
                p.product_name AS plan_name,
                p.acronym AS plan_acronym,
                bp.basic_plan_name,
                bp.acronym AS basic_plan_acronym,
                pp.name as prototype_plan_name,
                pp.acronym AS prototype_plan_acronym,
                al.name AS amount_loans_name,
                ct.name AS coverage_type_name,
                ml.month_name AS loan_maturity_month_name,
                chant.name AS channel_type_name,
                u.firstname AS creator_firstname,
                u.middlename AS creator_middlename,
                u.lastname AS creator_lastname,
                u.suffix AS creator_suffix,
                req.signed_proposal_path,
                req.group_app_path,
                req.dti_path,
                req.sec_reg_path,
                req.articles_of_inc_path,
                req.by_laws_path,
                req.business_permit_path,
                req.masterlist_file_path,
                req.authorized_id_path,
                req.booking_date
            FROM DHUB_UAT.sg.financial_insurance_application fia
            LEFT JOIN DHUB_UAT.sg.financial_insurance_status_lookup fis ON fia.status_id = fis.status_id
            LEFT JOIN sg.financial_insurance_group_lookups gc ON fia.group_classification_id = gc.id
            LEFT JOIN sg.financial_insurance_group_lookups bt ON fia.business_type_id = bt.id
            LEFT JOIN sg.financial_insurance_group_lookups gt ON fia.group_type_id = gt.id
            LEFT JOIN sg.financial_insurance_group_lookups topl ON fia.type_of_proposal_id = topl.id
            LEFT JOIN sg.financial_insurance_product p ON fia.plan_id = p.product_id
            LEFT JOIN sg.financial_insurance_basic_plan bp ON fia.basic_plan_id = bp.basic_plan_id
            LEFT JOIN sg.financial_insurance_prototype_plans pp ON fia.prototype_id = pp.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups al ON fia.amount_loans_id = al.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_month_lookups ml
                ON fia.sub_payment_term_id = ml.month_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups ct ON fia.coverage_type_id = ct.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON fia.user_id = u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups chant
                ON fia.channel_type_id = chant.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups ps
                ON fia.proposal_status_id = ps.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_installation_requirements req
                ON fia.application_id = req.application_id
            WHERE fia.type_of_proposal_id = 30 AND ${userCondition}
            ORDER BY fia.created_at DESC
        `);

    const apps = res.recordset ?? [];
    if (apps.length > 0) {
        const appIds = apps.map(a => a.application_id);
        const filesRes = await pool.request().query(`
            SELECT application_id, file_path 
            FROM DHUB_UAT.sg.financial_insurance_application_files 
            WHERE application_id IN (${appIds.join(',')})
        `);
        const filesMap = {};
        (filesRes.recordset || []).forEach(f => {
            if (!filesMap[f.application_id]) {
                filesMap[f.application_id] = [];
            }
            filesMap[f.application_id].push(f.file_path);
        });

        // Bulk load actuarial notes
        const notesRes = await pool.request().query(`
            SELECT application_id, notes, show_in_pdf 
            FROM DHUB_UAT.sg.financial_insurance_application_notes 
            WHERE application_id IN (${appIds.join(',')}) AND department = 'actuarial'
        `);
        const notesMap = {};
        const showMap = {};
        (notesRes.recordset || []).forEach(n => {
            notesMap[n.application_id] = n.notes;
            showMap[n.application_id] = n.show_in_pdf;
        });

        // Bulk load actuarial files
        const actFilesRes = await pool.request().query(`
            SELECT application_id, file_path 
            FROM DHUB_UAT.sg.financial_insurance_application_department_files 
            WHERE application_id IN (${appIds.join(',')}) AND department = 'actuarial'
        `);
        const actFilesMap = {};
        (actFilesRes.recordset || []).forEach(f => {
            if (!actFilesMap[f.application_id]) {
                actFilesMap[f.application_id] = [];
            }
            actFilesMap[f.application_id].push(f.file_path);
        });

        // Bulk load all department files (supporting details)
        const deptFilesRes = await pool.request().query(`
            SELECT f.application_id, f.file_path, f.file_name, f.department, f.created_at, f.uploaded_by_user_id, u.firstname, u.lastname, dept.name AS uploader_department
            FROM DHUB_UAT.sg.financial_insurance_application_department_files f
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON f.uploaded_by_user_id = u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_system_lookups dept ON u.department_id = dept.id AND dept.category = 'DEPARTMENT'
            WHERE f.application_id IN (${appIds.join(',')})
        `);
        const deptFilesMap = {};
        (deptFilesRes.recordset || []).forEach(f => {
            if (!deptFilesMap[f.application_id]) {
                deptFilesMap[f.application_id] = [];
            }
            deptFilesMap[f.application_id].push({
                file_path: f.file_path,
                file_name: f.file_name,
                department: f.department,
                created_at: f.created_at,
                uploaded_by_user_id: f.uploaded_by_user_id,
                firstname: f.firstname,
                lastname: f.lastname,
                uploader_department: f.uploader_department
            });
        });

        apps.forEach(app => {
            const appFiles = filesMap[app.application_id];
            app.excel_file_path = appFiles ? JSON.stringify(appFiles) : null;
            app.actuarial_notes = notesMap[app.application_id] ?? null;
            app.actuarial_notes_show_in_pdf = showMap[app.application_id] !== false;
            
            const appActFiles = actFilesMap[app.application_id];
            app.actuarial_files = appActFiles ? JSON.stringify(appActFiles) : null;

            app.department_files = deptFilesMap[app.application_id] || [];
        });
    }
    return apps;
};

// Get application by ID
export const getApplicationById = async (id) => {
    const pool = await poolPromise;

    const res = await pool.request()
        .input('id', sql.Int, id)
        .query(`
            SELECT 
                fia.*,
                fis.status_name,
                ps.name AS proposal_status_name,
                gc.name AS group_classification_name,
                bt.name AS business_type_name,
                gt.name AS group_type_name,
                pm.name AS payment_mode_name,
                topl.name AS type_of_proposal_name,
                p.product_name AS plan_name,
                p.acronym AS plan_acronym,
                bp.basic_plan_name,
                bp.acronym AS basic_plan_acronym,
                pp.name as prototype_plan_name,
                pp.acronym AS prototype_plan_acronym,
                ind.name AS business_nature_name,
                subind.name AS sub_business_nature_name,
                al.name as amount_loans_name,
                ct.name AS coverage_type_name,
                ml.month_name AS loan_maturity_month_name,
                chant.name AS channel_type_name,
                u.firstname AS creator_firstname,
                u.middlename AS creator_middlename,
                u.lastname AS creator_lastname,
                u.suffix AS creator_suffix,
                u.is_active AS creator_is_active,
                u.agent_code AS creator_agent_code,
                ext.name AS extension_request_status_name,
                req.signed_proposal_path,
                req.group_app_path,
                req.dti_path,
                req.sec_reg_path,
                req.articles_of_inc_path,
                req.by_laws_path,
                req.business_permit_path,
                req.masterlist_file_path,
                req.authorized_id_path,
                req.booking_date
            FROM DHUB_UAT.sg.financial_insurance_application fia
            LEFT JOIN DHUB_UAT.sg.financial_insurance_status_lookup fis
                ON fia.status_id = fis.status_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups gc
                ON fia.group_classification_id = gc.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups bt
                ON fia.business_type_id = bt.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups gt
                ON fia.group_type_id = gt.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups pm
                ON fia.payment_mode_id = pm.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups topl
                ON fia.type_of_proposal_id = topl.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_product p
                ON fia.plan_id = p.product_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_basic_plan bp
                ON fia.basic_plan_id = bp.basic_plan_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_prototype_plans pp
                ON fia.prototype_id = pp.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups al
                ON fia.amount_loans_id = al.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups ct
                ON fia.coverage_type_id = ct.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups chant
                ON fia.channel_type_id = chant.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_industries ind
                ON fia.business_nature_id = ind.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_industries subind
                ON fia.sub_business_nature_id = subind.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_month_lookups ml
                ON fia.sub_payment_term_id = ml.month_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u
                ON fia.user_id = u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups ps
                ON fia.proposal_status_id = ps.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups ext
                ON fia.extension_request_status_id = ext.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_installation_requirements req
                ON fia.application_id = req.application_id
            WHERE fia.application_id = @id
        `);

    const app = res.recordset?.[0] ?? null;
    if (app) {
        const filesRes = await pool.request().input('appId', sql.Int, id).query(`
            SELECT file_path FROM DHUB_UAT.sg.financial_insurance_application_files WHERE application_id = @appId
        `);
        const files = filesRes.recordset || [];
        app.excel_file_path = files.length > 0 ? JSON.stringify(files.map(f => f.file_path)) : null;

        // Load actuarial notes
        const actuarialNotesRes = await pool.request().input('appId', sql.Int, id).query(`
            SELECT notes, show_in_pdf FROM DHUB_UAT.sg.financial_insurance_application_notes WHERE application_id = @appId AND department = 'actuarial'
        `);
        app.actuarial_notes = actuarialNotesRes.recordset?.[0]?.notes ?? null;
        app.actuarial_notes_show_in_pdf = actuarialNotesRes.recordset?.[0]?.show_in_pdf !== false;

        // Load actuarial to CFE notes
        const toCfeNotesRes = await pool.request().input('appId', sql.Int, id).query(`
            SELECT notes FROM DHUB_UAT.sg.financial_insurance_application_notes WHERE application_id = @appId AND department = 'actuarial_to_cfe'
        `);
        app.actuarial_to_cfe_notes = toCfeNotesRes.recordset?.[0]?.notes ?? null;

        // Load actuarial files
        const actuarialFilesRes = await pool.request().input('appId', sql.Int, id).query(`
            SELECT file_path FROM DHUB_UAT.sg.financial_insurance_application_department_files WHERE application_id = @appId AND department = 'actuarial'
        `);
        const actFiles = actuarialFilesRes.recordset || [];
        app.actuarial_files = actFiles.length > 0 ? JSON.stringify(actFiles.map(f => f.file_path)) : null;

        // Load all department files (supporting details)
        const departmentFilesRes = await pool.request().input('appId', sql.Int, id).query(`
            SELECT f.file_path, f.file_name, f.department, f.created_at, f.uploaded_by_user_id, u.firstname, u.lastname, dept.name AS uploader_department
            FROM DHUB_UAT.sg.financial_insurance_application_department_files f
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON f.uploaded_by_user_id = u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_system_lookups dept ON u.department_id = dept.id AND dept.category = 'DEPARTMENT'
            WHERE f.application_id = @appId
        `);
        app.department_files = departmentFilesRes.recordset || [];
    }
    return app;
};

// Save department files (supporting details)
export const saveDepartmentFiles = async (applicationId, department, files, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();
        for (const file of files) {
            if (file.filePath) {
                const insertRequest = new sql.Request(transaction);
                await insertRequest
                    .input('appId', sql.Int, applicationId)
                    .input('department', sql.NVarChar(100), department.toLowerCase())
                    .input('file_path', sql.NVarChar(500), file.filePath)
                    .input('file_name', sql.NVarChar(255), file.originalName)
                    .input('userId', sql.Int, userId)
                    .query(`
                        INSERT INTO DHUB_UAT.sg.financial_insurance_application_department_files 
                        (application_id, department, file_path, file_name, uploaded_by_user_id, created_at)
                        VALUES (@appId, @department, @file_path, @file_name, @userId, GETDATE())
                    `);
            }
        }
        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

// Retrieve department files (supporting details)
export const getDepartmentFiles = async (applicationId, department = null) => {
    const pool = await poolPromise;
    const request = pool.request().input('appId', sql.Int, applicationId);
    let query = `
        SELECT f.file_path, f.file_name, f.department, f.created_at, u.firstname, u.lastname
        FROM DHUB_UAT.sg.financial_insurance_application_department_files f
        LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON f.uploaded_by_user_id = u.user_id
        WHERE f.application_id = @appId
    `;
    if (department) {
        request.input('department', sql.NVarChar(100), department.toLowerCase());
        query += ` AND f.department = @department`;
    }
    const res = await request.query(query);
    return res.recordset || [];
};

// Check if group name exists
export const getApplicationByGroupName = async (groupName) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('group_name', sql.NVarChar, groupName)
        .query(`
            SELECT TOP 1 application_id, user_id, created_at, status_id
            FROM DHUB_UAT.sg.financial_insurance_application
            WHERE REPLACE(UPPER(group_name), ' ', '') = REPLACE(UPPER(@group_name), ' ', '')
        `);
    return res.recordset[0] || null;
};

// Search applications by partial group name for renewal lookup
export const searchApplicationsByGroupName = async (groupName) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('group_name', sql.NVarChar, groupName)
        .query(`
            SELECT fia.application_id, fia.group_name, fia.created_at, fia.status_id, fia.user_id, fia.expiry_date,
                   u.firstname, u.lastname, u.is_active, u.agent_code
            FROM DHUB_UAT.sg.financial_insurance_application fia
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON fia.user_id = u.user_id
            WHERE fia.group_name LIKE '%' + @group_name + '%'
            ORDER BY fia.created_at DESC
        `);
    return res.recordset ?? [];
};

// Update application - handles partial updates
export const updateApplication = async (id, data, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Helper to insert ranking-specific riders (scoped to transaction)
        const insertRankingRiders = async (rankingId, designation, riders) => {
            if (riders && Array.isArray(riders) && riders.length > 0) {
                for (const rider of riders) {
                    let riderValue = rider.values && Array.isArray(rider.values) 
                        ? rider.values.find(v => v.designation === designation) 
                        : null;

                    // Fallback: Check for generic value in values[0] (if single item & no designation) or root-level amount
                    const finalValue = riderValue 
                        || (rider.values && rider.values.length === 1 && !rider.values[0].designation ? rider.values[0] : null)
                        || (rider.amount !== undefined || rider.unit !== undefined ? { amount: rider.amount, unit: rider.unit } : null);

                    if (finalValue) {
                        await new sql.Request(transaction)
                            .input('coverage_ranking_id', sql.Int, rankingId)
                            .input('rider_id', sql.Int, rider.rider_id)
                            .input('rider_amount', sql.Decimal(18, 2), valueOrNull(finalValue.amount))
                            .input('rider_unit', sql.Int, valueOrNull(finalValue.unit))
                            .query(`INSERT INTO DHUB_UAT.sg.financial_insurance_coverage_ranking_rider (coverage_ranking_id, rider_id, rider_amount, rider_unit) VALUES (@coverage_ranking_id, @rider_id, @rider_amount, @rider_unit);`);
                    }
                }
            }
        };

        // Handle sub_group_type_id update
        if (data.sub_group_type_id !== undefined) {
            const deleteSubGroupsRequest = new sql.Request(transaction);
            await deleteSubGroupsRequest
                .input('application_id', sql.Int, id)
                .query('DELETE FROM DHUB_UAT.sg.financial_insurance_application_subgroup WHERE application_id = @application_id');
            
            if (data.sub_group_type_id) {
                const subGroupIds = Array.isArray(data.sub_group_type_id) ? data.sub_group_type_id : [data.sub_group_type_id];
                if (subGroupIds.length > 0) {
                    for (const subGroupId of subGroupIds) {
                        const insertSubGroupRequest = new sql.Request(transaction);
                        await insertSubGroupRequest
                            .input('application_id', sql.Int, id)
                            .input('sub_group_type_id', sql.Int, subGroupId)
                            .query('INSERT INTO DHUB_UAT.sg.financial_insurance_application_subgroup (application_id, sub_group_type_id) VALUES (@application_id, @sub_group_type_id);');
                    }
                }
            }
        }

        // --- Handle Coverage, Ranking, and Rider Updates ---
        const isRankingStructureUpdate = (data.level_ranking !== undefined || data.salary_ranking !== undefined || data.coverage_type_id !== undefined || data.uniform_coverage_amount !== undefined);
        const areRidersUpdated = data.riders !== undefined;

        if (isRankingStructureUpdate) {
            const deleteRankingsRequest = new sql.Request(transaction);
            await deleteRankingsRequest
                .input('application_id', sql.Int, id)
                .query('DELETE FROM DHUB_UAT.sg.financial_insurance_coverage_ranking WHERE application_id = @application_id');

            let coverageTypeId = data.coverage_type_id;
            
            if (coverageTypeId === undefined) {
                const currentApp = await new sql.Request(transaction)
                    .input('id', sql.Int, id)
                    .query('SELECT coverage_type_id FROM DHUB_UAT.sg.financial_insurance_application WHERE application_id = @id');
                coverageTypeId = currentApp.recordset[0]?.coverage_type_id;
            }

            const levelRanking = data.level_ranking;
            const salaryRanking = data.salary_ranking;
            const uniformAmount = data.uniform_coverage_amount;

            if (coverageTypeId === 32 && levelRanking && levelRanking.length > 0) {
                for (const rank of levelRanking) {
                    const rankRequest = new sql.Request(transaction);
                    const rankResult = await rankRequest
                        .input('application_id', sql.Int, id)
                        .input('designation', sql.NVarChar, rank.designation)
                        .input('amount', sql.Decimal(18, 2), rank.amount)
                        .input('total_coverage_amount', sql.Decimal(18, 2), rank.amount)
                        .query(`INSERT INTO DHUB_UAT.sg.financial_insurance_coverage_ranking (application_id, designation, amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @total_coverage_amount); SELECT SCOPE_IDENTITY() AS id;`);
                    const rankingId = rankResult.recordset[0].id;
                    // Use new riders if provided, otherwise this will use undefined which is handled by insertRankingRiders
                    await insertRankingRiders(rankingId, rank.designation, data.riders); 
                }
            } else if (coverageTypeId === 34 && salaryRanking && salaryRanking.length > 0) { 
                for (const rank of salaryRanking) {
                    const multiplier = parseInt(rank.salary_multiplier.replace(/x/i, ''), 10) || 1;
                    const totalAmount = parseFloat(rank.amount) * multiplier;

                    const rankRequest = new sql.Request(transaction);
                    const rankResult = await rankRequest
                        .input('application_id', sql.Int, id)
                        .input('designation', sql.NVarChar, rank.designation)
                        .input('amount', sql.Decimal(18, 2), rank.amount)
                        .input('salary_multiplier', sql.NVarChar, rank.salary_multiplier)
                        .input('total_coverage_amount', sql.Decimal(18, 2), totalAmount)
                        .query(`INSERT INTO DHUB_UAT.sg.financial_insurance_coverage_ranking (application_id, designation, amount, salary_multiplier, total_coverage_amount) VALUES (@application_id, @designation, @amount, @salary_multiplier, @total_coverage_amount); SELECT SCOPE_IDENTITY() AS id;`);
                    const rankingId = rankResult.recordset[0].id;
                    await insertRankingRiders(rankingId, rank.designation, data.riders);
                }
            } else if (coverageTypeId === 33 && uniformAmount != null) {
                const rankRequest = new sql.Request(transaction);
                await rankRequest
                    .input('application_id', sql.Int, id)
                    .input('designation', sql.NVarChar, 'All Rank')
                    .input('amount', sql.Decimal(18, 2), uniformAmount)
                    .input('uniform_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                    .input('total_coverage_amount', sql.Decimal(18, 2), uniformAmount)
                    .query(`INSERT INTO DHUB_UAT.sg.financial_insurance_coverage_ranking (application_id, designation, amount, uniform_coverage_amount, total_coverage_amount) VALUES (@application_id, @designation, @amount, @uniform_coverage_amount, @total_coverage_amount);`);
            }
        } else if (areRidersUpdated) {
            // This block handles the case where ONLY riders are updated, but the ranking structure is not.
            // We need to update the nested riders for the existing ranks.
            let currentCoverageTypeId;
            const typeRes = await new sql.Request(transaction)
                .input('appId', sql.Int, id)
                .query('SELECT coverage_type_id FROM DHUB_UAT.sg.financial_insurance_application WHERE application_id = @appId');
            currentCoverageTypeId = typeRes.recordset[0]?.coverage_type_id;

            if (currentCoverageTypeId === 32 || currentCoverageTypeId === 34) {
                const existingRankingsRes = await new sql.Request(transaction)
                    .input('appId', sql.Int, id)
                    .query('SELECT ranking_id, designation FROM DHUB_UAT.sg.financial_insurance_coverage_ranking WHERE application_id = @appId');
                
                const existingRankings = existingRankingsRes.recordset || [];

                if (existingRankings.length > 0) {
                    // Delete existing ranking riders and re-insert new ones based on the updated rider list
                    await new sql.Request(transaction).input('appId', sql.Int, id).query(`DELETE crr FROM DHUB_UAT.sg.financial_insurance_coverage_ranking_rider crr JOIN DHUB_UAT.sg.financial_insurance_coverage_ranking cr ON crr.coverage_ranking_id = cr.ranking_id WHERE cr.application_id = @appId`);

                    for (const rank of existingRankings) {
                        await insertRankingRiders(rank.ranking_id, rank.designation, data.riders);
                    }
                }
            }
        }

        // Always update the main rider table if riders are provided
        if (areRidersUpdated) {
            const deleteRidersRequest = new sql.Request(transaction);
            await deleteRidersRequest
                .input('application_id', sql.Int, id)
                .query('DELETE FROM DHUB_UAT.sg.financial_insurance_application_rider WHERE application_id = @application_id');

            if (Array.isArray(data.riders) && data.riders.length > 0) {
                for (const rider of data.riders) {
                    const insertRiderRequest = new sql.Request(transaction);
                    await insertRiderRequest
                        .input('application_id', sql.Int, id)
                        .input('rider_id', sql.Int, rider.rider_id)
                        .input('rider_amount', sql.Decimal(18, 2), valueOrNull(rider.amount))
                        .input('rider_unit', sql.Int, valueOrNull(rider.unit))
                        .query(`
                            INSERT INTO DHUB_UAT.sg.financial_insurance_application_rider
                            (application_id, rider_id, rider_amount, rider_unit)
                            VALUES (@application_id, @rider_id, @rider_amount, @rider_unit);
                        `);
                }
            }
        }

        // Handle affiliates update
        if (data.affiliates !== undefined) {
            const deleteAffiliatesRequest = new sql.Request(transaction);
            await deleteAffiliatesRequest
                .input('application_id', sql.Int, id)
                .query('DELETE FROM DHUB_UAT.sg.financial_insurance_application_affiliate WHERE application_id = @application_id');
            
            if (data.affiliates && Array.isArray(data.affiliates) && data.affiliates.length > 0) {
                for (const affiliate of data.affiliates) {
                    if (affiliate.company_name) {
                        const insertAffiliateRequest = new sql.Request(transaction);
                        await insertAffiliateRequest
                            .input('application_id', sql.Int, id)
                            .input('company_name', sql.NVarChar(255), affiliate.company_name)
                            .input('tin_number', sql.NVarChar(50), valueOrNull(affiliate.tin_number))
                            .input('address', sql.NVarChar(500), valueOrNull(affiliate.address))
                            .query(`
                                INSERT INTO DHUB_UAT.sg.financial_insurance_application_affiliate (application_id, company_name, tin_number, address)
                                VALUES (@application_id, @company_name, @tin_number, @address);
                            `);
                    }
                }
            }
        }

        const setClauses = [];
        const inputs = [];

        const addClause = (field, value, type = sql.NVarChar) => {
            if (value !== undefined) {
                setClauses.push(`${field} = @${field}`);
                inputs.push({ name: field, value: value, type: type });
            }
        };

        addClause('group_name', data.group_name);
        addClause('business_nature', data.business_nature);
        addClause('business_nature_id', data.business_nature_id, sql.Int);
        addClause('sub_business_nature_id', data.sub_business_nature_id, sql.Int);
        addClause('number_of_lives', data.number_of_lives, sql.Int);
        addClause('business_address', data.business_address);
        addClause('contact_number', data.contact_number || null);
        addClause('fax_number', data.fax_number || null);
        addClause('email', data.email);
        addClause('contact_person_salutation', data.contact_person_salutation);
        addClause('contact_person_firstname', data.contact_person_firstname);
        addClause('contact_person_mi', data.contact_person_mi);
        addClause('contact_person_lastname', data.contact_person_lastname);
        addClause('designation', data.designation);
        addClause('proposal_addressee', data.proposal_addressee);
        addClause('addressee_designation', data.addressee_designation);
        addClause('group_classification_id', data.group_classification_id, sql.Int);
        addClause('other_group_classification', data.other_group_classification);
        addClause('business_type_id', data.business_type_id, sql.Int);
        addClause('other_business_type', data.other_business_type);
        addClause('group_type_id', data.group_type_id, sql.Int);
        addClause('other_group_type', data.other_group_type);
        addClause('minimum_age', data.minimum_age, sql.Int);
        addClause('maximum_age', data.maximum_age, sql.Int);
        addClause('payment_mode_id', data.payment_mode_id, sql.Int);
        addClause('type_of_proposal_id', data.type_of_proposal_id, sql.Int);
        addClause('prototype_id', data.prototype_id, sql.Int);
        addClause('plan_id', data.plan_id, sql.Int);
        addClause('basic_plan_id', data.basic_plan_id, sql.Int);
        addClause('status_id', data.status_id, sql.Int);

        // New product-specific fields
        addClause('amount_loans_id', data.amount_loans_id, sql.Int);
        addClause('max_loan_amount', data.max_loan_amount, sql.Decimal(18, 2));
        addClause('min_loan_amount', data.min_loan_amount, sql.Decimal(18, 2));
        addClause('loan_portfolio_amount', data.loan_portfolio_amount, sql.Decimal(18, 2));
        addClause('loans_amount', data.loans_amount, sql.Decimal(18, 2));
        addClause('coverage_type_id', data.coverage_type_id, sql.Int);

        // Borrower age selections
        addClause('borrower_age_66_70', data.borrower_age_66_70, sql.Bit);
        addClause('borrower_amount_66_70', data.borrower_amount_66_70, sql.Decimal(18, 2));
        addClause('borrower_age_71_75', data.borrower_age_71_75, sql.Bit);
        addClause('borrower_amount_71_75', data.borrower_amount_71_75, sql.Decimal(18, 2));
        addClause('borrower_age_76_80', data.borrower_age_76_80, sql.Bit);
        addClause('borrower_amount_76_80', data.borrower_amount_76_80, sql.Decimal(18, 2));
        addClause('borrower_amount_18_65', data.borrower_amount_18_65, sql.Decimal(18, 2));
        addClause('borrower_amount_under_min', data.borrower_amount_under_min, sql.Decimal(18, 2));
        addClause('borrower_amount_over_max', data.borrower_amount_over_max, sql.Decimal(18, 2));
        addClause('notes', data.notes, sql.NVarChar(sql.MAX));

        // Channel fields
        addClause('channel_type_id', data.channel_type_id, sql.Int);
        addClause('channel_name', data.channel_name);
        addClause('channel_number', data.channel_number);
        addClause('channel_email', data.channel_email);

        // New fields
        addClause('commission_rate', data.commission_rate);
        addClause('service_fee', data.service_fee);
        addClause('total_annual_premium', data.total_annual_premium, sql.Decimal(18, 2));
        addClause('extension_requested', data.extension_requested, sql.Bit);
        addClause('extension_request_status_id', data.extension_request_status_id, sql.Int);
        addClause('expiry_date', data.expiry_date, sql.DateTime);
        addClause('evidence_notes', data.evidence_notes, sql.NVarChar(sql.MAX));

        // Add excel_file_path to update clause
        addClause('excel_file_path', data.excel_file_path, sql.NVarChar(sql.MAX));
        addClause('company_tin', data.company_tin);

        if (data.excel_file_path !== undefined) {
            // Delete existing files in files table first
            const deleteFilesRequest = new sql.Request(transaction);
            await deleteFilesRequest
                .input('application_id', sql.Int, id)
                .query('DELETE FROM DHUB_UAT.sg.financial_insurance_application_files WHERE application_id = @application_id');

            if (data.excel_file_path) {
                let paths = [];
                try {
                    paths = JSON.parse(data.excel_file_path);
                    if (!Array.isArray(paths)) paths = [data.excel_file_path];
                } catch (e) {
                    paths = data.excel_file_path.split(',').map(p => p.trim());
                }

                for (const p of paths) {
                    if (p) {
                        const insertFileRequest = new sql.Request(transaction);
                        await insertFileRequest
                            .input('application_id', sql.Int, id)
                            .input('file_path', sql.NVarChar(500), p)
                            .input('file_name', sql.NVarChar(255), path.basename(p))
                            .query('INSERT INTO DHUB_UAT.sg.financial_insurance_application_files (application_id, file_path, file_name) VALUES (@application_id, @file_path, @file_name)');
                    }
                }
            }
        }

        if (data.payment !== undefined) {
            const paymentTerm = (Array.isArray(data.payment) && data.payment.length > 0) ? data.payment[0] : null;
            addClause('payment_term_id', paymentTerm ? paymentTerm.payment_term_id : null, sql.Int);
            addClause('sub_payment_term_id', paymentTerm ? paymentTerm.sub_payment_term_id : null, sql.Int);
        }

        if (setClauses.length > 0) {
            setClauses.push('updated_at = GETDATE()');
            const request = new sql.Request(transaction);
            request.input('id', sql.Int, id);
            for (const input of inputs) {
                request.input(input.name, input.type, input.value);
            }
            const query = `UPDATE DHUB_UAT.sg.financial_insurance_application SET ${setClauses.join(', ')} WHERE application_id = @id`;
            await request.query(query);
        }

        // Log the update action
        await logApplicationAction(transaction, {
            applicationId: id,
            userId,
            actionType: 'UPDATE',
            changes: data,
            ipAddress: data.ip_address
        });

        await transaction.commit();
        return getApplicationById(id);
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

// Delete application
export const deleteApplication = async (id) => {
    const pool = await poolPromise;
    await pool.request()
        .input('id', sql.Int, id)
        .query(`
            DELETE FROM DHUB_UAT.sg.financial_insurance_application
            WHERE application_id = @id
        `);
    return { deleted: true };
};

export const getStatusLookups = async () => {
    const pool = await poolPromise;
    const result = await pool.request()
        .query(`SELECT status_id, status_name, group_type, parent_id FROM DHUB_UAT.sg.financial_insurance_status_lookup WHERE is_active = 1`);
    
    return result.recordset;
};

// Lookup list by category
export const getLookupListByCategory = async (category) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('category', sql.NVarChar, category)
        .query(`
            SELECT id, name, parent_id
            FROM DHUB_UAT.sg.financial_insurance_group_lookups
            WHERE category=@category AND is_active=1
        `);
    return res.recordset ?? [];
};

// Get all top-level plans
export const getAllPlans = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT product_id AS plan_id, product_name AS plan_name, acronym, is_active
            FROM DHUB_UAT.sg.financial_insurance_product
            WHERE is_active = 1
        `);
    return res.recordset ?? [];
};

// Get list of prototype plans (definitions)
export const getPrototypePlans = async () => {
    const pool = await poolPromise;
    const res = await pool.request()
        .query(`
            SELECT id, name, acronym FROM DHUB_UAT.sg.financial_insurance_prototype_plans WHERE is_active = 1
        `);
    return res.recordset ?? [];
};

// Get basic plans for a specific top-level plan
export const getBasicPlansByPlanId = async (planId) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('planId', sql.Int, planId)
        .query(`
            SELECT basic_plan_id, basic_plan_name, acronym, is_active
            FROM DHUB_UAT.sg.financial_insurance_basic_plan
            WHERE product_id = @planId AND is_active = 1
        `);
    return res.recordset ?? [];
};

// Get attachable riders for a specific product (plan)
export const getRidersByProductId = async (productId) => {
    const pool = await poolPromise;
    const res = await pool.request()
        .input('productId', sql.Int, productId)
        .query(`
            SELECT rider_id, rider_name, acronym, is_active
            FROM DHUB_UAT.sg.financial_insurance_riders
            WHERE product_id = @productId AND is_active = 1
        `);
    return res.recordset ?? [];
};

// Get lookup names by a list of IDs
export const getLookupNamesByIds = async (ids) => {
    if (!ids || ids.length === 0) return new Map();

    const pool = await poolPromise;
    const request = pool.request();
    const parameters = [];

    const uniqueIds = [...new Set(ids.filter(id => id != null))];

    if (uniqueIds.length === 0) return new Map();

    uniqueIds.forEach((id, index) => {
        const paramName = `id${index}`;
        request.input(paramName, sql.Int, id);
        parameters.push(`@${paramName}`);
    });

    const result = await request.query(`
        SELECT id, name FROM DHUB_UAT.sg.financial_insurance_group_lookups 
        WHERE id IN (${parameters.join(',')})
    `);

    const namesMap = new Map();
    result.recordset.forEach(row => {
        namesMap.set(row.id, row.name);
    });
    return namesMap;
};

// Get lookups by a list of IDs
export const getLookupsByIds = async (ids) => {
    if (!ids || ids.length === 0) return new Map();
    const pool = await poolPromise;
    const subGroupRes = await pool.request()
        .query(`SELECT id, name FROM DHUB_UAT.sg.financial_insurance_group_lookups WHERE id IN (${ids.join(',')})`);
    const lookupsMap = new Map();
    subGroupRes.recordset.forEach(sg => lookupsMap.set(sg.id, sg.name));
    return lookupsMap;
};

// Get riders for a single application
export const getApplicationRiders = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                r.rider_id,
                r.rider_name,
                r.input_type,
                r.acronym,
                r.unit_value,
                ar.rider_amount as amount,
                ar.rider_unit as unit
            FROM DHUB_UAT.sg.financial_insurance_application_rider ar
            JOIN DHUB_UAT.sg.financial_insurance_riders r ON ar.rider_id = r.rider_id
            WHERE ar.application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get application history logs
export const getApplicationHistory = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                l.log_id, l.application_id, l.user_id, l.action_type, l.changes, l.ip_address, l.created_at,
                u.firstname, u.lastname, u.email
            FROM DHUB_UAT.sg.financial_insurance_application_history_logs l
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users u ON l.user_id = u.user_id
            WHERE l.application_id = @application_id
            ORDER BY l.created_at DESC
        `);
    return result.recordset ?? [];
};

// Get sub_group_types for a single application
export const getApplicationSubGroups = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT l.id, l.name FROM DHUB_UAT.sg.financial_insurance_application_subgroup s
            JOIN DHUB_UAT.sg.financial_insurance_group_lookups l ON s.sub_group_type_id = l.id
            WHERE s.application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get payment terms for a single application
export const getApplicationPaymentTerms = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                pt.id as payment_term_id, 
                pt.name as payment_term_name,
                p.sub_payment_term_id,
                ml.month_name as loan_maturity_month_name
            FROM DHUB_UAT.sg.financial_insurance_application p
            JOIN DHUB_UAT.sg.financial_insurance_group_lookups pt ON p.payment_term_id = pt.id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_month_lookups ml ON p.sub_payment_term_id = ml.month_id
            WHERE p.application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get coverage rankings for a single application
export const getCoverageRankingsByAppId = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT designation, amount, salary_multiplier, uniform_coverage_amount, total_coverage_amount
            FROM DHUB_UAT.sg.financial_insurance_coverage_ranking
            WHERE application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get nested riders for coverage rankings
export const getCoverageRankingRiders = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                cr.ranking_id,
                cr.designation,
                crr.rider_id,
                r.rider_name,
                r.acronym,
                crr.rider_amount,
                crr.rider_unit
            FROM DHUB_UAT.sg.financial_insurance_coverage_ranking_rider crr
            JOIN DHUB_UAT.sg.financial_insurance_coverage_ranking cr ON crr.coverage_ranking_id = cr.ranking_id
            JOIN DHUB_UAT.sg.financial_insurance_riders r ON crr.rider_id = r.rider_id
            WHERE cr.application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get sub_group_types for multiple applications
export const getBulkApplicationSubGroups = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT s.application_id, l.id, l.name FROM DHUB_UAT.sg.financial_insurance_application_subgroup s
        JOIN DHUB_UAT.sg.financial_insurance_group_lookups l ON s.sub_group_type_id = l.id
        WHERE s.application_id IN (${idParams})`);
    return result.recordset ?? [];
};

// Get payment terms for multiple applications
export const getBulkApplicationPaymentTerms = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT 
            p.application_id,
            pt.id as payment_term_id, 
            pt.name as payment_term_name,
            p.sub_payment_term_id,
            ml.month_name as loan_maturity_month_name
        FROM DHUB_UAT.sg.financial_insurance_application p
        JOIN DHUB_UAT.sg.financial_insurance_group_lookups pt ON p.payment_term_id = pt.id
        LEFT JOIN DHUB_UAT.sg.financial_insurance_month_lookups ml ON p.sub_payment_term_id = ml.month_id
        WHERE p.application_id IN (${idParams})
    `);
    return result.recordset ?? [];
};

// Get riders for multiple applications in bulk
export const getBulkApplicationRiders = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT ar.application_id, r.rider_id, r.rider_name, r.acronym, r.input_type, r.unit_value, ar.rider_amount as amount, ar.rider_unit as unit
        FROM DHUB_UAT.sg.financial_insurance_application_rider ar
        JOIN DHUB_UAT.sg.financial_insurance_riders r ON ar.rider_id = r.rider_id
        WHERE ar.application_id IN (${idParams})
    `);
    return result.recordset ?? [];
};

// Get affiliates for a single application
export const getApplicationAffiliates = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT id, company_name, tin_number, address 
            FROM DHUB_UAT.sg.financial_insurance_application_affiliate 
            WHERE application_id = @application_id
        `);
    return result.recordset ?? [];
};

// Get affiliates for multiple applications in bulk
export const getBulkApplicationAffiliates = async (applicationIds) => {
    if (!applicationIds || applicationIds.length === 0) return [];
    const pool = await poolPromise;
    const request = pool.request();

    const idParams = applicationIds.map((id, i) => {
        const paramName = `appId${i}`;
        request.input(paramName, sql.Int, id);
        return `@${paramName}`;
    }).join(',');

    const result = await request.query(`
        SELECT id, application_id, company_name, tin_number, address
        FROM DHUB_UAT.sg.financial_insurance_application_affiliate
        WHERE application_id IN (${idParams})
    `);
    return result.recordset ?? [];
};

// Request an Amendment
export const requestAmendment = async (data, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const { applicationId, requestNotes, requestDeptId, targetDeptId, ipAddress } = data;

        // Insert into DHUB_UAT.sg.financial_insurance_amendment_requests table
        const insertReq = new sql.Request(transaction)
            .input('application_id', sql.Int, applicationId)
            .input('requested_by', sql.Int, userId)
            .input('request_dept_id', sql.Int, valueOrNull(requestDeptId))
            .input('target_dept_id', sql.Int, valueOrNull(targetDeptId))
            .input('request_notes', sql.NVarChar(sql.MAX), valueOrNull(requestNotes))
            .input('status', sql.NVarChar(50), 'PENDING');

        const insertRes = await insertReq.query(`
            INSERT INTO DHUB_UAT.sg.financial_insurance_amendment_requests (
                application_id, requested_by, request_dept_id, target_dept_id, request_notes, status
            ) VALUES (
                @application_id, @requested_by, @request_dept_id, @target_dept_id, @request_notes, @status
            );
            SELECT SCOPE_IDENTITY() AS amendment_id;
        `);

        const amendmentId = insertRes.recordset[0].amendment_id;

        // Clear extension request flag if any; application status_id remains unchanged until approved by Actuarial
        await new sql.Request(transaction)
            .input('application_id', sql.Int, applicationId)
            .query(`
                UPDATE DHUB_UAT.sg.financial_insurance_application
                SET extension_requested = 0 -- clear extension request if any
                WHERE application_id = @application_id
            `);

        // Fetch application snapshot for audit history logging
        const snapshotRes = await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query(`SELECT * FROM DHUB_UAT.sg.financial_insurance_application WHERE application_id = @appId`);

        const appSnapshot = snapshotRes.recordset[0] || {};
        appSnapshot.amendment_id = amendmentId;
        appSnapshot.amendment_request_notes = requestNotes;
        appSnapshot.amendment_requested_by = userId;

        // Log snapshot action to history logs
        await new sql.Request(transaction)
            .input('application_id', sql.Int, applicationId)
            .input('user_id', sql.Int, userId)
            .input('action_type', sql.NVarChar, 'AMENDMENT_REQUESTED')
            .input('changes', sql.NVarChar(sql.MAX), JSON.stringify(appSnapshot))
            .input('ip_address', sql.NVarChar, ipAddress || null)
            .query(`
                INSERT INTO DHUB_UAT.sg.financial_insurance_application_history_logs (application_id, user_id, action_type, changes, ip_address)
                VALUES (@application_id, @user_id, @action_type, @changes, @ip_address)
            `);

        await transaction.commit();
        return amendmentId;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

// Get pending amendment requests for queue
export const getPendingAmendmentRequests = async (targetDeptId = null) => {
    const pool = await poolPromise;
    const request = pool.request();
    let whereClause = "WHERE ar.status = 'PENDING'";

    if (targetDeptId) {
        request.input('target_dept_id', sql.Int, targetDeptId);
        whereClause += " AND (ar.target_dept_id IS NULL OR ar.target_dept_id = @target_dept_id)";
    }

    const result = await request.query(`
		SELECT 
            ar.id AS amendment_id,
            ar.application_id,
            ar.requested_by,
            ar.request_dept_id,
            reqDept.name AS request_dept_name,
            ar.target_dept_id,
            targetDept.name AS target_dept_name,
            ar.request_notes,
            ar.status AS amendment_status,
            ar.created_at AS request_created_at,
            fia.group_name,
            fia.email,
            fia.minimum_age,
            fia.maximum_age,
            fia.status_id,
            fis.status_name,
            ps.name AS proposal_status_name,
            topl.name AS type_of_proposal_name,
            p.product_name AS plan_name,
            p.acronym AS plan_acronym,
            u.firstname + ' ' + u.lastname AS requester_name
        FROM DHUB_UAT.sg.financial_insurance_amendment_requests ar
        JOIN DHUB_UAT.sg.financial_insurance_application fia
            ON ar.application_id = fia.application_id
        LEFT JOIN DHUB_UAT.sg.financial_insurance_status fis
            ON fia.status_id = fis.status_id
        LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups ps
            ON fia.proposal_status_id = ps.id
        LEFT JOIN DHUB_UAT.sg.financial_insurance_group_lookups topl
            ON fia.type_of_proposal_id = topl.id
        LEFT JOIN DHUB_UAT.sg.financial_insurance_product p
            ON fia.plan_id = p.product_id
        LEFT JOIN DHUB_UAT.sg.financial_insurance_users u
            ON ar.requested_by = u.user_id
        LEFT JOIN DHUB_UAT.sg.financial_insurance_system_lookups reqDept
            ON ar.request_dept_id = reqDept.id
            AND reqDept.category = 'DEPARTMENT'
        LEFT JOIN DHUB_UAT.sg.financial_insurance_system_lookups targetDept
            ON ar.target_dept_id = targetDept.id
            AND targetDept.category = 'DEPARTMENT'
        ${whereClause}
        ORDER BY ar.created_at ASC
    `);

    return result.recordset ?? [];
};

// Approve an Amendment Request
export const approveAmendment = async (data, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const { applicationId, responseNotes, ipAddress } = data;

        // Update latest pending amendment request record
        await new sql.Request(transaction)
            .input('application_id', sql.Int, applicationId)
            .input('response_notes', sql.NVarChar(sql.MAX), valueOrNull(responseNotes))
            .input('responded_by', sql.Int, userId)
            .query(`
                UPDATE DHUB_UAT.sg.financial_insurance_amendment_requests
                SET status = 'APPROVED',
                    response_notes = @response_notes,
                    responded_by = @responded_by,
                    updated_at = GETDATE()
                WHERE application_id = @application_id AND status = 'PENDING'
            `);

        // Update application status to Amend - Actuarial (Status 16) to allow editing rates, total premium, and evidence notes
        await new sql.Request(transaction)
            .input('application_id', sql.Int, applicationId)
            .query(`
                UPDATE DHUB_UAT.sg.financial_insurance_application
                SET status_id = 16,
                    updated_at = GETDATE()
                WHERE application_id = @application_id
            `);

        // Fetch updated snapshot
        const snapshotRes = await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query(`SELECT * FROM DHUB_UAT.sg.financial_insurance_application WHERE application_id = @appId`);

        const appSnapshot = snapshotRes.recordset[0] || {};
        appSnapshot.amendment_response_notes = responseNotes;
        appSnapshot.responded_by = userId;
        appSnapshot.amendment_decision = 'APPROVED';

        // Log snapshot history
        await new sql.Request(transaction)
            .input('application_id', sql.Int, applicationId)
            .input('user_id', sql.Int, userId)
            .input('action_type', sql.NVarChar, 'AMENDMENT_APPROVED')
            .input('changes', sql.NVarChar(sql.MAX), JSON.stringify(appSnapshot))
            .input('ip_address', sql.NVarChar, ipAddress || null)
            .query(`
                INSERT INTO DHUB_UAT.sg.financial_insurance_application_history_logs (application_id, user_id, action_type, changes, ip_address)
                VALUES (@application_id, @user_id, @action_type, @changes, @ip_address)
            `);

        await transaction.commit();
        return true;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

// Decline an Amendment Request
export const declineAmendment = async (data, userId) => {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const { applicationId, responseNotes, ipAddress } = data;

        // Update latest pending amendment request record
        await new sql.Request(transaction)
            .input('application_id', sql.Int, applicationId)
            .input('response_notes', sql.NVarChar(sql.MAX), valueOrNull(responseNotes))
            .input('responded_by', sql.Int, userId)
            .query(`
                UPDATE DHUB_UAT.sg.financial_insurance_amendment_requests
                SET status = 'DECLINED',
                    response_notes = @response_notes,
                    responded_by = @responded_by,
                    updated_at = GETDATE()
                WHERE application_id = @application_id AND status = 'PENDING'
            `);

        // Restore application status to Released (Status 15)
        await new sql.Request(transaction)
            .input('application_id', sql.Int, applicationId)
            .query(`
                UPDATE DHUB_UAT.sg.financial_insurance_application
                SET status_id = 15,
                    updated_at = GETDATE()
                WHERE application_id = @application_id
            `);

        // Fetch updated snapshot
        const snapshotRes = await new sql.Request(transaction)
            .input('appId', sql.Int, applicationId)
            .query(`SELECT * FROM DHUB_UAT.sg.financial_insurance_application WHERE application_id = @appId`);

        const appSnapshot = snapshotRes.recordset[0] || {};
        appSnapshot.amendment_response_notes = responseNotes;
        appSnapshot.responded_by = userId;
        appSnapshot.amendment_decision = 'DECLINED';

        // Log snapshot history
        await new sql.Request(transaction)
            .input('application_id', sql.Int, applicationId)
            .input('user_id', sql.Int, userId)
            .input('action_type', sql.NVarChar, 'AMENDMENT_DECLINED')
            .input('changes', sql.NVarChar(sql.MAX), JSON.stringify(appSnapshot))
            .input('ip_address', sql.NVarChar, ipAddress || null)
            .query(`
                INSERT INTO DHUB_UAT.sg.financial_insurance_application_history_logs (application_id, user_id, action_type, changes, ip_address)
                VALUES (@application_id, @user_id, @action_type, @changes, @ip_address)
            `);

        await transaction.commit();
        return true;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

// Helper: Ensure DHUB_UAT.sg.financial_insurance_amendment_requests table exists
export const ensureAmendmentRequestsTable = async () => {
    const pool = await poolPromise;
    await pool.request().query(`
        IF OBJECT_ID('DHUB_UAT.sg.financial_insurance_amendment_requests', 'U') IS NULL
        BEGIN
            CREATE TABLE DHUB_UAT.sg.financial_insurance_amendment_requests (
                id INT IDENTITY(1,1) PRIMARY KEY,
                application_id INT NOT NULL,
                requested_by INT NOT NULL,
                request_dept_id INT NULL,
                target_dept_id INT NULL,
                request_notes NVARCHAR(MAX) NULL,
                status NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
                response_notes NVARCHAR(MAX) NULL,
                responded_by INT NULL,
                created_at DATETIME DEFAULT GETDATE(),
                updated_at DATETIME DEFAULT GETDATE()
            );
        END
    `);
};

// Get Amendment History for an Application (joins requester and responder names)
export const getAmendmentHistoryByApplicationId = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                ar.id AS amendment_id,
                ar.application_id,
                ar.requested_by,
                req_u.firstname + ' ' + req_u.lastname AS requested_by_name,
                ar.request_dept_id,
                req_dept.name AS request_dept_name,
                ar.target_dept_id,
                target_dept.name AS target_dept_name,
                ar.request_notes,
                ar.status AS amendment_status,
                ar.responded_by,
                resp_u.firstname + ' ' + resp_u.lastname AS responded_by_name,
                ar.response_notes,
                ar.created_at AS requested_at,
                ar.updated_at AS responded_at
            FROM DHUB_UAT.sg.financial_insurance_amendment_requests ar
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users req_u
                ON ar.requested_by = req_u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users resp_u
                ON ar.responded_by = resp_u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_system_lookups req_dept
                ON ar.request_dept_id = req_dept.id
                AND req_dept.category = 'DEPARTMENT'
            LEFT JOIN DHUB_UAT.sg.financial_insurance_system_lookups target_dept
                ON ar.target_dept_id = target_dept.id
                AND target_dept.category = 'DEPARTMENT'
            WHERE ar.application_id = @application_id
            ORDER BY ar.created_at DESC;
        `);
    return result.recordset ?? [];
};

// Get Latest Amendment Request for an Application (for response formatting)
export const getLatestAmendmentRequestByAppId = async (applicationId) => {
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT TOP 1
                ar.id,
                ar.status,
                ar.request_notes,
                ar.response_notes,
                ar.requested_by,
                req_u.firstname + ' ' + req_u.lastname AS requested_by_name,
                req_dept.name AS request_dept_name,
                ar.responded_by,
                resp_u.firstname + ' ' + resp_u.lastname AS responded_by_name,
                ar.created_at AS requested_at,
                ar.updated_at AS responded_at
            FROM DHUB_UAT.sg.financial_insurance_amendment_requests ar
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users req_u ON ar.requested_by = req_u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_users resp_u ON ar.responded_by = resp_u.user_id
            LEFT JOIN DHUB_UAT.sg.financial_insurance_system_lookups req_dept ON ar.request_dept_id = req_dept.id AND req_dept.category = 'DEPARTMENT'
            WHERE ar.application_id = @application_id
            ORDER BY ar.created_at DESC
        `);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
};



