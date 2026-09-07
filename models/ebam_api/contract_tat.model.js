import { poolPromise, sql } from '../../config/db.js';

export const DEFAULT_TAT_ITEMS = [
    // 1. QUOTATION
    {
        category: "QUOTATION",
        activity: "Presentation of Quotation",
        tat: "",
        reckoning_date: "",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "c/o PhilLife GMS",
        sort_order: 1
    },
    // 2. NEGOTIATION
    {
        category: "NEGOTIATION",
        activity: "Presentation of Proposal",
        tat: "Open",
        reckoning_date: "-",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "c/o PhilLife GMS",
        sort_order: 2
    },
    {
        category: "NEGOTIATION",
        activity: "Acceptance/Signing of Conforme",
        tat: "Open",
        reckoning_date: "-",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o PhilLife GMS",
        sort_order: 3
    },
    // 3. NEW BUSINESS
    {
        category: "NEW BUSINESS",
        activity: "Submission of Group Application",
        tat: "Open",
        reckoning_date: "-",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 4
    },
    {
        category: "NEW BUSINESS",
        activity: "Submission of Listing (NEL)",
        tat: "Open",
        reckoning_date: "-",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 5
    },
    {
        category: "NEW BUSINESS",
        activity: "Submission of Individual Application (NML/MED)",
        tat: "Open",
        reckoning_date: "-",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 6
    },
    {
        category: "NEW BUSINESS",
        activity: "Submission of Other UW Requirements",
        tat: "Open",
        reckoning_date: "-",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 7
    },
    {
        category: "NEW BUSINESS",
        activity: "Submission of Adjustment Requirements",
        tat: "Open",
        reckoning_date: "-",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 8
    },
    {
        category: "NEW BUSINESS",
        activity: "Submission of Claims Requirements",
        tat: "Open",
        reckoning_date: "-",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 9
    },
    // 4. UNDERWRITING
    {
        category: "UNDERWRITING",
        activity: "Evaluation of No-Evidence Limit (NEL)",
        tat: "1",
        reckoning_date: "Submission of Certified List",
        mode_of_communication: "Email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 10
    },
    {
        category: "UNDERWRITING",
        activity: "Evaluation of Application - NMed",
        tat: "3",
        reckoning_date: "Submission of complete requirements",
        mode_of_communication: "Email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 11
    },
    {
        category: "UNDERWRITING",
        activity: "Evaluation of Application - Med",
        tat: "7",
        reckoning_date: "Submission of complete requirements",
        mode_of_communication: "Email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 12
    },
    {
        category: "UNDERWRITING",
        activity: "Issuance of Application-Med LOA (Letter of Approval)",
        tat: "3",
        reckoning_date: "Receipt of request",
        mode_of_communication: "Email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 13
    },
    {
        category: "UNDERWRITING",
        activity: "Evaluation of Adjustment",
        tat: "3",
        reckoning_date: "Submission of complete requirements",
        mode_of_communication: "Email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 14
    },
    // 5. ISSUANCE
    {
        category: "ISSUANCE",
        activity: "Group Master Policy",
        tat: "7",
        reckoning_date: "Completion of Underwriting",
        mode_of_communication: "Printed copy",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 15
    },
    {
        category: "ISSUANCE",
        activity: "Enrollment Upload",
        tat: "1",
        reckoning_date: "Within 24 hours of loan/policy issuance",
        mode_of_communication: "Soft copy, email",
        responsible: "Policyholder/Phillife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 16
    },
    {
        category: "ISSUANCE",
        activity: "Confirmation of Coverage (CoC)",
        tat: "7",
        reckoning_date: "Completion of Underwriting",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 17
    },
    {
        category: "ISSUANCE",
        activity: "Endorsement - Renewal",
        tat: "7",
        reckoning_date: "Completion of Underwriting",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 18
    },
    {
        category: "ISSUANCE",
        activity: "Endorsement - Amendment",
        tat: "7",
        reckoning_date: "Completion of Underwriting",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 19
    },
    // 6. CANCELLATION
    {
        category: "CANCELLATION",
        activity: "Preparation of RCP",
        tat: "",
        reckoning_date: "Receipt of request",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 20
    },
    // 7. BILLING
    {
        category: "BILLING",
        activity: "First Premium",
        tat: "7",
        reckoning_date: "Completion of Underwriting",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 21
    },
    {
        category: "BILLING",
        activity: "Renewal",
        tat: "-30",
        reckoning_date: "Policy Anniversary",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 22
    },
    {
        category: "BILLING",
        activity: "Addition/Deletion (Adjustment)",
        tat: "7",
        reckoning_date: "Completion of Underwriting",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 23
    },
    // 8. COLLECTION
    {
        category: "COLLECTION",
        activity: "First Premium",
        tat: "10",
        reckoning_date: "Due Date",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 24
    },
    {
        category: "COLLECTION",
        activity: "Renewal",
        tat: "30",
        reckoning_date: "Due Date",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 25
    },
    {
        category: "COLLECTION",
        activity: "Addition/Deletion (Adjustment)",
        tat: "10",
        reckoning_date: "Due Date",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 26
    },
    {
        category: "COLLECTION",
        activity: "Refund of Premium",
        tat: "15",
        reckoning_date: "Receipt of request",
        mode_of_communication: "Email",
        responsible: "Policyholder",
        contact_details: "c/o Policyholder",
        sort_order: 27
    },
    // 9. CLAIMS
    {
        category: "CLAIMS",
        activity: "Evaluation/Decision",
        tat: "15",
        reckoning_date: "Submission of Claims Requirements",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "Claims",
        sort_order: 28
    },
    // 10. REPORTS
    {
        category: "REPORTS",
        activity: "Policy Issuance (Monthly)",
        tat: "",
        reckoning_date: "Submission Report",
        mode_of_communication: "Printed copy, email",
        responsible: "PhilLife",
        contact_details: "ebam@phillife.com.ph",
        sort_order: 29
    },
    {
        category: "REPORTS",
        activity: "Client Monies Reconciliation (Annual)",
        tat: "",
        reckoning_date: "Submission Report",
        mode_of_communication: "Printed copy, email",
        responsible: "Policyholder/Phillife",
        contact_details: "ebam@phillife.com.ph/GMS",
        sort_order: 30
    },
    // 11. COMMUNICATION
    {
        category: "COMMUNICATION",
        activity: "Acknowledgement",
        tat: "2",
        reckoning_date: "Simple: working dates from the receipt of the complain/request",
        mode_of_communication: "Email",
        responsible: "Policyholder/Phillife",
        contact_details: "ebam@phillife.com.ph/GMS",
        sort_order: 31
    },
    {
        category: "COMMUNICATION",
        activity: "Acknowledgement",
        tat: "2",
        reckoning_date: "Complex: working dates from the receipt of the complain/request",
        mode_of_communication: "Email",
        responsible: "Policyholder/Phillife",
        contact_details: "ebam@phillife.com.ph/GMS",
        sort_order: 32
    },
    {
        category: "COMMUNICATION",
        activity: "Processing and Resolution (assessment, investigation, & resolution)",
        tat: "7",
        reckoning_date: "Simple: working dates from the receipt of the complain/request",
        mode_of_communication: "Email",
        responsible: "Policyholder/Phillife",
        contact_details: "ebam@phillife.com.ph/GMS",
        sort_order: 33
    },
    {
        category: "COMMUNICATION",
        activity: "Processing and Resolution (assessment, investigation, & resolution)",
        tat: "7",
        reckoning_date: "Complex: working dates from the receipt of the complain/request",
        mode_of_communication: "Email",
        responsible: "Policyholder/Phillife",
        contact_details: "ebam@phillife.com.ph/GMS",
        sort_order: 34
    },
    {
        category: "COMMUNICATION",
        activity: "Communication of resolution to requesting consumer",
        tat: "9",
        reckoning_date: "Simple: working dates from the receipt of the complain/request",
        mode_of_communication: "Email",
        responsible: "Policyholder/Phillife",
        contact_details: "ebam@phillife.com.ph/GMS",
        sort_order: 35
    },
    {
        category: "COMMUNICATION",
        activity: "Communication of resolution to requesting consumer",
        tat: "47",
        reckoning_date: "Complex: working dates from the receipt of the complain/request",
        mode_of_communication: "Email",
        responsible: "Policyholder/Phillife",
        contact_details: "ebam@phillife.com.ph/GMS",
        sort_order: 36
    },
    {
        category: "COMMUNICATION",
        activity: "Audit/Reconciliation Report",
        tat: "30",
        reckoning_date: "Within 30 calendar days after end of each quarter",
        mode_of_communication: "Printed copy, email",
        responsible: "Audit/Phillife",
        contact_details: "ebam@phillife.com.ph/Audit",
        sort_order: 37
    }
];

// Ensure table for tracking per-contract custom TAT records exists
export const ensureContractTatTable = async () => {
    const pool = await poolPromise;
    await pool.request().query(`
        IF OBJECT_ID('DHUB_UAT.sg.financial_insurance_contract_tat', 'U') IS NULL
        BEGIN
            CREATE TABLE DHUB_UAT.sg.financial_insurance_contract_tat (
                tat_id INT IDENTITY(1,1) PRIMARY KEY,
                application_id INT NOT NULL,
                category NVARCHAR(100) NOT NULL,
                activity NVARCHAR(255) NOT NULL,
                tat NVARCHAR(50) NULL,
                reckoning_date NVARCHAR(255) NULL,
                mode_of_communication NVARCHAR(255) NULL,
                responsible NVARCHAR(100) NULL,
                contact_details NVARCHAR(255) NULL,
                sort_order INT NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT GETDATE(),
                updated_at DATETIME DEFAULT GETDATE()
            );

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes 
                WHERE name = 'IX_financial_insurance_contract_tat_app_id' 
                  AND object_id = OBJECT_ID('DHUB_UAT.sg.financial_insurance_contract_tat')
            )
            BEGIN
                CREATE INDEX IX_financial_insurance_contract_tat_app_id 
                    ON DHUB_UAT.sg.financial_insurance_contract_tat(application_id);
            END
        END
    `);
};

// Fetch TAT for a specific application. If custom rows exist, merges them with defaults.
export const getContractTat = async (applicationId) => {
    await ensureContractTatTable();
    const pool = await poolPromise;
    const result = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT 
                tat_id,
                application_id,
                category,
                activity,
                tat,
                reckoning_date,
                mode_of_communication,
                responsible,
                contact_details,
                sort_order,
                created_at,
                updated_at
            FROM DHUB_UAT.sg.financial_insurance_contract_tat
            WHERE application_id = @application_id
            ORDER BY sort_order ASC, tat_id ASC;
        `);

    const customRows = result.recordset || [];
    const customMap = new Map();
    customRows.forEach(row => {
        customMap.set(row.sort_order, row);
    });

    const mergedItems = DEFAULT_TAT_ITEMS.map((defaultItem, index) => {
        const sortOrder = defaultItem.sort_order || (index + 1);
        const override = customMap.get(sortOrder);
        if (override) {
            return {
                tat_id: override.tat_id,
                category: override.category ?? defaultItem.category,
                activity: override.activity ?? defaultItem.activity,
                tat: override.tat ?? defaultItem.tat,
                reckoning_date: override.reckoning_date ?? defaultItem.reckoning_date,
                mode_of_communication: override.mode_of_communication ?? defaultItem.mode_of_communication,
                responsible: override.responsible ?? defaultItem.responsible,
                contact_details: override.contact_details ?? defaultItem.contact_details,
                sort_order: sortOrder,
                is_custom: true
            };
        }
        return {
            tat_id: null,
            category: defaultItem.category,
            activity: defaultItem.activity,
            tat: defaultItem.tat,
            reckoning_date: defaultItem.reckoning_date,
            mode_of_communication: defaultItem.mode_of_communication,
            responsible: defaultItem.responsible,
            contact_details: defaultItem.contact_details,
            sort_order: sortOrder,
            is_custom: false
        };
    });

    return {
        application_id: applicationId,
        is_custom: customRows.length > 0,
        total_custom_items: customRows.length,
        total_items: DEFAULT_TAT_ITEMS.length,
        custom_items: customRows,
        items: mergedItems
    };
};

// Save only the custom modified TAT records for a specific application in the DB
export const saveContractTat = async (applicationId, inputItems, userId = null, ipAddress = null) => {
    await ensureContractTatTable();
    const pool = await poolPromise;

    // 1. Fetch current custom override rows from DB for this application
    const existingRes = await pool.request()
        .input('application_id', sql.Int, applicationId)
        .query(`
            SELECT tat_id, application_id, category, activity, tat, reckoning_date, mode_of_communication, responsible, contact_details, sort_order
            FROM DHUB_UAT.sg.financial_insurance_contract_tat
            WHERE application_id = @application_id;
        `);
    
    const customMap = new Map();
    (existingRes.recordset || []).forEach(row => {
        customMap.set(row.sort_order, { ...row });
    });

    // 2. Merge incoming updates into customMap
    if (Array.isArray(inputItems) && inputItems.length > 0) {
        inputItems.forEach((incoming, idx) => {
            let defaultItem = null;
            if (incoming.sort_order !== undefined && incoming.sort_order !== null) {
                const parsedOrder = parseInt(incoming.sort_order);
                defaultItem = DEFAULT_TAT_ITEMS.find(it => it.sort_order === parsedOrder);
                if (!defaultItem) {
                    throw new Error(`Invalid sort_order '${incoming.sort_order}' at item index ${idx}. Must be an existing order between 1 and ${DEFAULT_TAT_ITEMS.length}.`);
                }
            } else if (incoming.activity) {
                const actName = incoming.activity.trim().toUpperCase();
                const matched = DEFAULT_TAT_ITEMS.filter(it => (it.activity || '').trim().toUpperCase() === actName);
                if (matched.length === 1) {
                    defaultItem = matched[0];
                } else if (matched.length > 1 && incoming.reckoning_date) {
                    const recUpper = incoming.reckoning_date.toUpperCase();
                    if (recUpper.includes('SIMPLE')) {
                        defaultItem = matched.find(it => (it.reckoning_date || '').toUpperCase().includes('SIMPLE')) || matched[0];
                    } else if (recUpper.includes('COMPLEX')) {
                        defaultItem = matched.find(it => (it.reckoning_date || '').toUpperCase().includes('COMPLEX')) || matched[1];
                    } else {
                        defaultItem = matched[0];
                    }
                } else if (matched.length > 0) {
                    defaultItem = matched[0];
                } else {
                    throw new Error(`Invalid activity '${incoming.activity}' at item index ${idx}. Activity does not exist in standard TAT items.`);
                }
            } else {
                throw new Error(`Item at index ${idx} is missing a valid 'sort_order' (1-${DEFAULT_TAT_ITEMS.length}) or 'activity' name.`);
            }

            const sortOrder = defaultItem.sort_order;
            let target = customMap.get(sortOrder);
            if (!target) {
                target = {
                    category: defaultItem.category,
                    activity: defaultItem.activity,
                    tat: defaultItem.tat,
                    reckoning_date: defaultItem.reckoning_date,
                    mode_of_communication: defaultItem.mode_of_communication,
                    responsible: defaultItem.responsible,
                    contact_details: defaultItem.contact_details,
                    sort_order: sortOrder
                };
                customMap.set(sortOrder, target);
            }

            if (incoming.category !== undefined) target.category = incoming.category;
            if (incoming.activity !== undefined) target.activity = incoming.activity;
            if (incoming.tat !== undefined) target.tat = incoming.tat;
            if (incoming.reckoning_date !== undefined) target.reckoning_date = incoming.reckoning_date;
            if (incoming.mode_of_communication !== undefined) target.mode_of_communication = incoming.mode_of_communication;
            if (incoming.responsible !== undefined) target.responsible = incoming.responsible;
            if (incoming.contact_details !== undefined) target.contact_details = incoming.contact_details;
        });
    }

    const rowsToSave = Array.from(customMap.values());

    // 3. Persist in-place using SQL UPSERT (preserves tat_id and updates in place)
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        for (let i = 0; i < rowsToSave.length; i++) {
            const item = rowsToSave[i];
            const upsertReq = new sql.Request(transaction);
            await upsertReq
                .input('application_id', sql.Int, applicationId)
                .input('category', sql.NVarChar(100), item.category)
                .input('activity', sql.NVarChar(255), item.activity)
                .input('tat', sql.NVarChar(50), item.tat)
                .input('reckoning_date', sql.NVarChar(255), item.reckoning_date)
                .input('mode_of_communication', sql.NVarChar(255), item.mode_of_communication)
                .input('responsible', sql.NVarChar(100), item.responsible)
                .input('contact_details', sql.NVarChar(255), item.contact_details)
                .input('sort_order', sql.Int, item.sort_order)
                .query(`
                    IF EXISTS (
                        SELECT 1 FROM DHUB_UAT.sg.financial_insurance_contract_tat
                        WHERE application_id = @application_id AND sort_order = @sort_order
                    )
                    BEGIN
                        UPDATE DHUB_UAT.sg.financial_insurance_contract_tat
                        SET category = @category,
                            activity = @activity,
                            tat = @tat,
                            reckoning_date = @reckoning_date,
                            mode_of_communication = @mode_of_communication,
                            responsible = @responsible,
                            contact_details = @contact_details,
                            updated_at = GETDATE()
                        WHERE application_id = @application_id AND sort_order = @sort_order;
                    END
                    ELSE
                    BEGIN
                        INSERT INTO DHUB_UAT.sg.financial_insurance_contract_tat (
                            application_id, category, activity, tat, reckoning_date,
                            mode_of_communication, responsible, contact_details, sort_order,
                            created_at, updated_at
                        )
                        VALUES (
                            @application_id, @category, @activity, @tat, @reckoning_date,
                            @mode_of_communication, @responsible, @contact_details, @sort_order,
                            GETDATE(), GETDATE()
                        );
                    END
                `);
        }

        // Log to history logs
        if (userId) {
            try {
                const logReq = new sql.Request(transaction);
                await logReq
                    .input('application_id', sql.Int, applicationId)
                    .input('user_id', sql.Int, userId)
                    .input('action_type', sql.NVarChar, 'UPDATE_CONTRACT_TAT')
                    .input('changes', sql.NVarChar(sql.MAX), JSON.stringify({ custom_rows_count: rowsToSave.length, updated_items: inputItems }))
                    .input('ip_address', sql.NVarChar, ipAddress || null)
                    .query(`
                        INSERT INTO DHUB_UAT.sg.financial_insurance_application_history_logs (application_id, user_id, action_type, changes, ip_address)
                        VALUES (@application_id, @user_id, @action_type, @changes, @ip_address);
                    `);
            } catch (logErr) {
                console.warn("TAT history logging skipped:", logErr.message);
            }
        }

        await transaction.commit();
        return await getContractTat(applicationId);
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

// Reset custom TAT back to standard template defaults
export const resetContractTat = async (applicationId, userId = null, ipAddress = null) => {
    await ensureContractTatTable();
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const req = new sql.Request(transaction);
        await req
            .input('application_id', sql.Int, applicationId)
            .query(`
                DELETE FROM DHUB_UAT.sg.financial_insurance_contract_tat
                WHERE application_id = @application_id;
            `);

        if (userId) {
            try {
                const logReq = new sql.Request(transaction);
                await logReq
                    .input('application_id', sql.Int, applicationId)
                    .input('user_id', sql.Int, userId)
                    .input('action_type', sql.NVarChar, 'RESET_CONTRACT_TAT')
                    .input('changes', sql.NVarChar(sql.MAX), JSON.stringify({ message: "Reset to default SLA values." }))
                    .input('ip_address', sql.NVarChar, ipAddress || null)
                    .query(`
                        INSERT INTO DHUB_UAT.sg.financial_insurance_application_history_logs (application_id, user_id, action_type, changes, ip_address)
                        VALUES (@application_id, @user_id, @action_type, @changes, @ip_address);
                    `);
            } catch (logErr) {
                console.warn("TAT history logging skipped:", logErr.message);
            }
        }

        await transaction.commit();
        return await getContractTat(applicationId);
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};
