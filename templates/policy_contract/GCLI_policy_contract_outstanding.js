/**
 * Group Credit Life Insurance Outstanding (GCLI Outstanding) Policy Contract Template
 * Standalone template containing the full contract structure.
 * 
 * @param {Object} application - The application/proposal data.
 * @param {Object} details - Additional helper details.
 * @param {string} riderTemplatesHtml - Rendered HTML of selected riders.
 * @returns {string} The complete HTML document.
 */
export function generateGCLIOutstandingPolicyContract(application = {}, details = {}, riderTemplatesHtml = '') {
    const logoDataUri = details?.logoDataUri || '';
    const showReviewWatermark = details?.isReview !== false;

    // Company & Client Info
    const groupName = application?.group_name || 'COFORGE BPS PHILIPPINES, INC.';
    const businessAddress = application?.business_address || 'Ground Floor, Vector-3, Northgate Cyberzone, Filinvest City, Alabang 1781 City of Muntinlupa, NCR';
    
    // Dates & Policy Number
    const isBooked = !!(application?.policy_no && application.policy_no.trim() !== '') || application?.status_id === 7 || application?.proposal_status_id === 7;
    const effectiveDateObj = application?.effective_date 
        ? new Date(application.effective_date) 
        : (isBooked ? (application?.updated_at ? new Date(application.updated_at) : new Date()) : null);
    const effectiveDate = effectiveDateObj || new Date();
    const effectiveYear = effectiveDate.getFullYear().toString().substring(2);
    const effectiveDateStr = effectiveDateObj 
        ? effectiveDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
        : '';

    const basicPlanName = application?.basic_plan_name || application?.plan_name || 'Group Credit Life Insurance (Outstanding Balance)';
    const policyNo = (application?.policy_no && application.policy_no.trim() !== '') 
        ? application.policy_no 
        : `G-CLI-${effectiveYear}-`;

    // Helper to render dynamic table rows for underwriting limits parameter
    const renderParameterRows = (label, items, isMerged = false) => {
        if (!Array.isArray(items) || items.length === 0) {
            if (isMerged) {
                return `
                    <tr>
                        <td style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; font-style: italic;">${label}</td>
                        <td colspan="2" style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt;"></td>
                    </tr>
                `;
            } else {
                return `
                    <tr>
                        <td style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; font-style: italic;">${label}</td>
                        <td style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; text-align: center; font-style: italic;"></td>
                        <td style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; text-align: center; font-style: italic;"></td>
                    </tr>
                `;
            }
        }

        let html = '';
        items.forEach((item, idx) => {
            const amountVal = item.amount || '';
            const ageVal = item.age || '';

            if (idx === 0) {
                if (isMerged) {
                    html += `
                        <tr>
                            <td rowspan="${items.length}" style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; font-style: italic; vertical-align: middle;">${label}</td>
                            <td colspan="2" style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt;">${amountVal}</td>
                        </tr>
                    `;
                } else {
                    html += `
                        <tr>
                            <td rowspan="${items.length}" style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; font-style: italic; vertical-align: middle;">${label}</td>
                            <td style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; text-align: center; font-style: italic; vertical-align: middle;">${amountVal}</td>
                            <td style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; text-align: center; font-style: italic; vertical-align: middle;">${ageVal}</td>
                        </tr>
                    `;
                }
            } else {
                if (isMerged) {
                    html += `
                        <tr>
                            <td colspan="2" style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt;">${amountVal}</td>
                        </tr>
                    `;
                } else {
                    html += `
                        <tr>
                            <td style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; text-align: center; font-style: italic; vertical-align: middle;">${amountVal}</td>
                            <td style="border: 1px solid #000; padding: 6px 8px; font-size: 9pt; text-align: center; font-style: italic; vertical-align: middle;">${ageVal}</td>
                        </tr>
                    `;
                }
            }
        });

        return html;
    };

    // Helper to render dynamic table for Participation Requirements
    const renderParticipationRequirements = (val) => {
        if (!val) {
            return `
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; width: 40%; font-style: italic;">Percentage of all Eligible Individuals</td>
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; text-align: center; font-style: italic;">100%</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; font-style: italic;">Minimum Number of Insureds</td>
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; text-align: center; font-style: italic;"></td>
                        </tr>
                    </tbody>
                </table>
            `;
        }

        if (typeof val === 'object') {
            const percentage = (val.percentage || '').trim();
            const minimumNoVal = val.minimum_no;
            
            let minNoHtml = '';
            let alignStyle = 'text-align: center;';

            if (Array.isArray(minimumNoVal)) {
                minNoHtml = `<ul style="margin: 0; padding-left: 15px; list-style-type: disc; text-align: left;">${minimumNoVal.map(item => `<li style="line-height: 1.4; font-size: 8.5pt;">${(item || '').trim()}</li>`).join('')}</ul>`;
                alignStyle = 'text-align: left;';
            } else {
                minNoHtml = (minimumNoVal || '').trim();
                if (minNoHtml.includes('<')) {
                    alignStyle = 'text-align: left;';
                }
            }

            return `
                <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; width: 40%; font-style: italic;">Percentage of all Eligible Individuals</td>
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; text-align: center; font-style: italic;">${percentage || '100%'}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; font-style: italic; vertical-align: middle;">Minimum Number of Insureds</td>
                            <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; ${alignStyle} vertical-align: middle;">${minNoHtml}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        }

        return val;
    };

    // Currency & Contribution
    const currencyName = application?.currency_name || 'Philippine Peso';
    const contributionText = application?.contribution_text || '';
    const numberOfLives = application?.number_of_lives || 100;
    const amountOfInsurance = application?.amount_of_insurance ?? '';
    const coveragePeriod = application?.coverage_period ?? '';
    const dueDates = application?.due_dates ?? '';

    // Addressee & Signatories
    const addresseeName = application?.proposal_addressee || (application?.contact_person_firstname || application?.contact_person_lastname) 
        ? `${application.contact_person_firstname || ''} ${application.contact_person_lastname || ''}`.trim() 
        : 'DEEPAK MENON';
    const addresseeDesignation = application?.addressee_designation || application?.designation || 'Vice-President – Delivery Head';

    // Helper for Special Underwriting Provisions
    const getSpecialUnderwritingProvisionsHtml = () => {
        if (typeof application?.special_underwriting_provisions === 'string' && application.special_underwriting_provisions.trim() !== '') {
            return application.special_underwriting_provisions;
        }
        if (Array.isArray(application?.special_underwriting_provisions) && application.special_underwriting_provisions.length > 0) {
            return `<ol style="padding-left: 20px; line-height: 1.6;">${application.special_underwriting_provisions.map(item => `<li>${item}</li>`).join('')}</ol>`;
        }
        
        const enrollment = application.provision_enrollment ?? '';
        const rollover = application.provision_rollover ?? '';
        const termination = application.provision_termination ?? '';
        const definitions = application.provision_definitions ?? '';
        const claims = application.provision_claims ?? '';

        return `
            <table class="data-table" style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                    <tr>
                        <th colspan="2" style="text-align: center; font-size: 10pt; font-weight: bold; background-color: #f1f5f9; color: #000000; text-transform: uppercase; padding: 8px; border: 1px solid #000;">SPECIAL UNDERWRITING PROVISIONS</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="width: 20%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; border: 1px solid #000; background-color: #f1f5f9;">ENROLLMENT</td>
                        <td style="font-size: 9.5pt; text-align: justify; padding: 8px 10px; line-height: 1.45; border: 1px solid #000;">${enrollment}</td>
                    </tr>
                    <tr>
                        <td style="width: 20%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; border: 1px solid #000; background-color: #f1f5f9;">ROLL-OVER PROVISIONS</td>
                        <td style="font-size: 9.5pt; text-align: justify; padding: 8px 10px; line-height: 1.45; border: 1px solid #000;">${rollover}</td>
                    </tr>
                    <tr>
                        <td style="width: 20%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; border: 1px solid #000; background-color: #f1f5f9;">TERMINATION OF INDIVIDUAL INSURANCE</td>
                        <td style="font-size: 9.5pt; text-align: justify; padding: 8px 10px; line-height: 1.45; border: 1px solid #000;">${termination}</td>
                    </tr>
                    <tr>
                        <td style="width: 20%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; border: 1px solid #000; background-color: #f1f5f9;">GENERAL DEFINITIONS</td>
                        <td style="font-size: 9.5pt; text-align: justify; padding: 8px 10px; line-height: 1.45; border: 1px solid #000;">${definitions}</td>
                    </tr>
                    <tr>
                        <td style="width: 20%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; border: 1px solid #000; background-color: #f1f5f9;">CLAIMS PROCEDURE</td>
                        <td style="font-size: 9.5pt; text-align: justify; padding: 8px 10px; line-height: 1.45; border: 1px solid #000;">${claims}</td>
                    </tr>
                </tbody>
            </table>
        `;
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Group Master Policy Contract - ${policyNo}</title>
    <style>
        @page {
            size: A4;
            margin: 12mm 20mm 25mm 20mm;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #202124;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-size: 10.5pt;
        }
        .page-container {
            width: 100%;
            margin: 0 auto;
            position: relative;
            background-color: #ffffff;
        }
        .page-break {
            page-break-after: always;
            break-after: page;
        }
        .watermark-review {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-70%, -70%) rotate(-35deg);
            font-size: 75pt;
            color: rgba(220, 220, 220, 0.25);
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: 8px;
            pointer-events: none;
            z-index: 9999;
            user-select: none;
            white-space: nowrap;
        }
        .header-logo {
            text-align: center;
            margin-bottom: 20px;
        }
        .header-logo img {
            max-height: 70px;
        }
        .main-title {
            text-align: center;
            font-size: 15pt;
            font-weight: 800;
            color: #000;
            margin: 25px 0 10px 0;
            text-transform: uppercase;
        }
        .subtitle {
            text-align: center;
            font-size: 11pt;
            margin-bottom: 25px;
        }
        .policyholder-name {
            text-align: center;
            font-size: 18pt;
            font-weight: 800;
            color: #000;
            margin: 20px 0 5px 0;
            text-transform: uppercase;
        }
        .paragraph {
            text-align: justify;
            text-indent: 30px;
            margin-bottom: 12px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 15px;
        }
        .data-table th, .data-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 9.5pt;
            vertical-align: top;
        }
        .data-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-transform: uppercase;
            text-align: left;
        }
        .section-header {
            font-size: 13pt;
            font-weight: bold;
            color: #0d47a1;
            margin-top: 20px;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 3px;
        }
        .signature-block {
            margin-top: 40px;
            width: 100%;
        }
        .signature-table {
            width: 100%;
            border: none;
        }
        .signature-table td {
            border: none;
            vertical-align: top;
            text-align: center;
            padding: 10px;
        }
        .doc-code {
            text-align: right;
            font-size: 8.5pt;
            color: #718096;
            font-family: monospace;
            font-weight: bold;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    ${showReviewWatermark ? `<div class="watermark-review">FOR REVIEW</div>` : ''}
    <div class="page-container">

        <!-- ================= PAGE 1: COVER PAGE ================= -->
        <div style="border: 3px double #000; padding: 25px 25px 15px 25px; box-sizing: border-box; min-height: 94vh; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div class="header-logo" style="margin-bottom: 15px;">
                    ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" style="max-height: 100px;" />` : `<strong>PHILIPPINE LIFE FINANCIAL ASSURANCE CORP.</strong>`}
                    <div style="font-size: 8.5pt; color: #2d3748; margin-top: 5px; font-weight: 600;">
                        Philippine Life Financial Assurance Corporation<br>
                        11/F STI Holdings Center, 6764 Ayala Avenue, 1226 Makati City, Philippines<br>
                        Tel. No.: (632) 7798-5433 | TIN: 007-884-680-000
                    </div>
                </div>

                <div style="text-align: center; font-size: 15pt; font-weight: 900; color: #000; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                    PHILIPPINE LIFE FINANCIAL ASSURANCE CORPORATION
                </div>
                <div style="text-align: center; font-size: 9.5pt; font-style: italic; margin-bottom: 20px;">
                    (herein called the Insurer)
                </div>

                <p style="text-align: center; font-size: 10.5pt; margin: 15px 0;">
                    HEREBY ISSUES this Group Policy (hereinafter referred to as this Policy) to
                </p>

                <div style="text-align: center; font-size: 16pt; font-weight: 900; color: #000; margin: 15px 0 3px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${groupName}
                </div>
                <div style="text-align: center; font-size: 9.5pt; font-style: italic; margin-bottom: 20px;">
                    (herein called the Policyholder)
                </div>

                <p class="paragraph" style="line-height: 1.45; font-size: 10pt;">
                    And agrees, subject to all terms appearing on this and the following pages, to pay at its Home Office in Metro Manila the benefits as determined in accordance with the provisions of this Policy immediately upon the receipt and approval of due proof of loss and to provide the other rights and privileges set forth in this Policy.
                </p>
                <p class="paragraph" style="line-height: 1.45; font-size: 10pt;">
                    This Policy is issued in consideration of the application of the Policyholder, a copy of which is attached hereto and made a part hereof, and of the payment of the Policyholder of the required first premium as herein provided. The first premium is due and payable on the Effective Date of this Policy.
                </p>
                <p class="paragraph" style="line-height: 1.45; font-size: 10pt;">
                    The provisions on the subsequent pages, including any amendments or riders included at issue or added thereafter, shall form part of this Policy as fully as if recited at length over the signatures hereto affixed.
                </p>
                <p class="paragraph" style="line-height: 1.45; font-size: 10pt;">
                    In witness whereof, Philippine Life Financial Assurance Corporation has caused this Policy to be executed at Makati City, Philippines as of the Effective Date of this Policy.
                </p>
            </div>

            <div style="margin-top: 30px;">
                <!-- 1. Executive Signatory (RIGHT) -->
                <div style="width: 300px; margin-left: auto; text-align: center; margin-bottom: 25px;">
                    <strong style="font-size: 11pt; text-transform: uppercase; font-family: 'Segoe UI', Tahoma, sans-serif; letter-spacing: 0.5px;">MICHELLE L. AMBAGAN</strong><br>
                    <span style="font-size: 9.5pt; display: inline-block; margin-top: 2px;">EVP & COO</span>
                </div>

                <!-- 2. Documentary Stamps Notice (RIGHT) -->
                <div style="font-size: 9pt; color: #000; text-align: left; margin-bottom: 20px; max-width: 420px; margin-left: auto; line-height: 1.4;">
                    Documentary stamps to the value of ₱200.00 are affixed and properly cancelled in the duplicate copy of this Policy.
                </div>

                <!-- 3. Examined By Line (RIGHT, 1 Line) -->
                <div style="width: 420px; margin-left: auto; text-align: left; margin-bottom: 25px; font-size: 10pt; font-weight: bold; white-space: nowrap;">
                    Examined By: ____________________________________
                </div>

                <!-- 4. Black Filled Plan Title Bar (RIGHT, Always 1 Line) -->
                <div style="width: 420px; max-width: 580px; margin-left: auto; text-align: center;">
                    <div style="background-color: #000000; color: #ffffff; font-size: 9.5pt; font-weight: 900; padding: 5px 8px; letter-spacing: 0.3px; text-transform: uppercase; width: 100%; box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${basicPlanName}
                    </div>
                </div>
            </div>
        </div>

        <div class="page-break"></div>

        <!-- ================= PAGE 2: POLICY DATA PAGE ================= -->
        <div class="main-title" style="font-size: 14pt;">POLICY DATA PAGE</div>

        <table class="data-table">
            <tr>
                <th style="width: 20%;">POLICY NO.</th>
                <td><strong>${policyNo}</strong></td>
            </tr>
            <tr>
                <th>POLICYHOLDER</th>
                <td>
                    <strong>${groupName}</strong><br>
                    ${businessAddress}
                </td>
            </tr>
            <tr>
                <th>EFFECTIVE DATE</th>
                <td><strong>${effectiveDateStr}</strong></td>
            </tr>
            <tr>
                <th>BASIC PLAN</th>
                <td>
                    ${basicPlanName}
                    ${application?.basic_plan_acronym ? `(${application?.basic_plan_acronym})` : ''}
                </td>
            </tr>
            <tr>
                <th>SUPPLEMENTARY BENEFITS/RIDERS</th>
                <td>
                    ${Array.isArray(application?.riders) && application.riders.length > 0
                        ? application.riders.map(r => `${r.rider_name || r.name || r.acronym} (${r.acronym})`).join('<br>')
                        : 'None'}
                </td>
            </tr>
            <tr>
                <th>CURRENCY</th>
                <td>${currencyName}</td>
            </tr>
            <tr>
                <th>ELIGIBLE INDIVIDUALS</th>
                <td>
                    ${application?.eligible_individuals || '[insert wordings]'}
                    <table style="width: 100%; border-collapse: collapse; margin-top: 6px;">
                        <thead>
                            <tr style="background-color: #f1f5f9;">
                                <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; font-weight: bold;">Classification of Individuals</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; font-weight: bold;">Eligibility Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt;">Insured Debtors as of the Effective Date of this Policy.</td>
                                <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt;">The Effective Date</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt;">Individual who becomes an Insured Debtor of the Creditor after the Effective Date of this Policy.</td>
                                <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt;">On the Date of Loan Disbursement to the Individual by the Policyholder.</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
            <tr>
                <th>CONTRIBUTION</th>
                <td>${contributionText}</td>
            </tr>
            <tr>
                <th>PARTICIPATION REQUIREMENTS</th>
                <td>
                    ${renderParticipationRequirements(application?.participation_requirements)}
                </td>
            </tr>
            <tr>
                <th style="font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; border: 1px solid #000; background-color: #f1f5f9;">UNDERWRITING PROVISIONS</th>
                <td style="padding: 0; vertical-align: middle;">
                    <table style="width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; border-top: hidden; border-left: hidden; border-right: hidden;">
                        <thead>
                            <tr style="background-color: #ffffff;">
                                <th style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 9pt; font-weight: bold; background-color: #ffffff;">Parameters</th>
                                <th style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 9pt; font-weight: bold; width: 32%; background-color: #ffffff;">Maximum Amount of Insurance at entry</th>
                                <th style="border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 9pt; font-weight: bold; width: 30%; background-color: #ffffff;">Attained Age at entry</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderParameterRows('No-Evidence Limit per Life (NEL)', application?.nel)}
                            ${renderParameterRows('Non-Medical Limit per Life (NMed)', application?.nmed)}
                            ${renderParameterRows('Medical Limit per Life (Med)', application?.med, true)}
                            ${renderParameterRows('Maximum Amount of Insurance per Life', application?.max_limit)}
                        </tbody>
                    </table>
                    ${application?.underwriting_notes && application.underwriting_notes.trim() !== '' ? `
                    <div style="padding: 6px 8px; font-size: 8.5pt;">
                        <strong>NOTES:</strong>
                        ${application.underwriting_notes}
                    </div>
                    ` : ''}
                </td>
            </tr>
        </table>

        <!-- Standalone Schedule of Insurance Table -->
        <table class="data-table" style="margin-top: 15px; margin-bottom: 15px;">
            <thead>
                <tr>
                    <th colspan="5" style="text-align: center; font-size: 10pt; font-weight: bold; background-color: #ffffff; color: #000000; text-transform: uppercase; padding: 8px; border: 1px solid #000;">SCHEDULE OF INSURANCE</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="width: 20%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; border: 1px solid #000; background-color: #f1f5f9;">AMOUNT OF INSURANCE</td>
                    <td colspan="4" style="font-size: 9.5pt; text-align: justify; font-style: italic; padding: 8px 10px; line-height: 1.45; border: 1px solid #000;">
                        ${amountOfInsurance}
                    </td>
                </tr>
                <tr>
                    <td style="width: 20%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; border: 1px solid #000; background-color: #f1f5f9;">COVERAGE PERIOD</td>
                    <td colspan="4" style="font-size: 9.5pt; text-align: justify; font-style: italic; padding: 8px 10px; line-height: 1.45; border: 1px solid #000;">
                        ${coveragePeriod}
                    </td>
                </tr>
                <tr>
                    <td style="width: 20%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; border: 1px solid #000; background-color: #f1f5f9;">PREMIUMS</td>
                    <td style="width: 16%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; text-align: center; border: 1px solid #000; background-color: #f1f5f9;">MODE OF PAYMENT</td>
                    <td style="width: 21%; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-align: center; font-style: italic; border: 1px solid #000; font-weight: 500;">${application?.payment_mode_name || ''}</td>
                    <td style="width: 13%; font-weight: bold; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; text-transform: uppercase; text-align: center; border: 1px solid #000; background-color: #f1f5f9;">DUE DATES</td>
                    <td style="width: 30%; font-size: 9.5pt; vertical-align: middle; padding: 8px 10px; color: #000; font-style: italic; line-height: 1.35; border: 1px solid #000; font-weight: 500;">${dueDates}</td>
                </tr>
            </tbody>
        </table>

        <!-- Resume main Data Table for Premium Rates, Refund of Premiums, Taxes, and Termination Age -->
        <table class="data-table">
            <thead>
                <tr>
                    <th colspan="2" style="text-align: center; font-size: 10pt; font-weight: bold; background-color: #ffffff; color: #000000; text-transform: uppercase; padding: 8px; border: 1px solid #000;">
                        ${(application?.payment_mode_name || 'MONTHLY').toUpperCase()} RATE PER ₱1,000 OF AMOUNT OF INSURANCE AND TERM OF LOAN
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="2" style="padding: 15px; border: 1px solid #000; text-align: center; vertical-align: middle;">
                        <!-- Nested Rates Table -->
                        ${(() => {
                            const rates = details?.rates || [];
                            const basicRates = rates.filter(r => r.rider_id === '0' || r.rider_id === null || r.rider_id === 0 || !r.rider_id);
                            if (basicRates.length === 0) {
                                return '<div style="font-size: 10pt; font-weight: bold; color: #718096;">None</div>';
                            }
                            basicRates.sort((a, b) => (a.term_months || 0) - (b.term_months || 0));
                            
                            const rowsHtml = basicRates.map(r => {
                                const baseRate = parseFloat(r.premium_amount || r.premium_rate || 0);
                                const term = r.term_months || 1;
                                const termStr = term === 1 ? '1 month' : term + ' months';
                                return `
                                    <tr>
                                        <td style="border: 1px solid #000; padding: 6px 12px; font-style: italic; font-size: 9.5pt; text-align: center; width: 50%; font-weight: bold;">${termStr}</td>
                                        <td style="border: 1px solid #000; padding: 6px 12px; font-style: italic; font-size: 9.5pt; text-align: center; width: 50%; font-weight: bold;">${baseRate.toFixed(2)}</td>
                                    </tr>
                                `;
                            }).join('\n');

                            return `
                                <table style="margin: 0 auto; border-collapse: collapse; min-width: 250px;">
                                    <thead>
                                        <tr style="background-color: #ffffff;">
                                            <th style="border: 1px solid #000; padding: 6px 12px; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; text-align: center; width: 50%;">TERM OF LOAN</th>
                                            <th style="border: 1px solid #000; padding: 6px 12px; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; text-align: center; width: 50%;">${application?.basic_plan_acronym || application?.plan_acronym || 'GCLIP'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rowsHtml}
                                    </tbody>
                                </table>
                            `;
                        })()}

                        <!-- Formula Text -->
                        <div style="font-style: italic; margin-top: 15px; font-size: 9.5pt; line-height: 1.5; text-align: left;">
                            The Premium is computed as follows:<br>
                            <strong style="font-weight: bold;">Premium = Total Outstanding Loan Obligation / 1,000 * ${(application?.payment_mode_name || 'Monthly')} Rate * Term of Loan in Months</strong>
                        </div>
                    </td>
                </tr>
            <tr>
                <th style="width: 20%;">REFUND OF PREMIUMS</th>
                <td style="font-size: 9.5pt; text-align: justify; padding: 8px 10px; line-height: 1.45; border: 1px solid #000; font-style: italic;">
                    ${application.refund_of_premiums ?? ''}
                </td>
            </tr>
            <tr>
                <th>TAXES</th>
                <td>Inclusive</td>
            </tr>
            <tr>
                <th>TERMINATION AGE</th>
                <td><strong>Group Credit Life Insurance Plan (GCLIP):</strong> ${application.termination_age ?? '__'} years old</td>
            </tr>
        </table>

        <div style="margin-top: 20px;"></div>

        <!-- ================= PAGE 3: SPECIAL UNDERWRITING PROVISIONS ================= -->
        <div class="provisions-container" style="margin-top: 10px;">
            ${getSpecialUnderwritingProvisionsHtml()}
        </div>

        <div class="page-break"></div>

        <!-- ================= PAGE 4: SERVICE LEVEL AGREEMENT (SLA) ================= -->
        <style>
            .sla-container {
                border: 3px double #000;
                font-family: 'Segoe UI', Arial, sans-serif;
                margin-top: 15px;
            }
            .sla-table {
                width: 100%;
                border-collapse: collapse;
                border: none !important;
                margin-top: 0px;
                table-layout: fixed;
            }
            .sla-table thead {
                display: table-header-group !important;
            }
            .sla-table tr {
                page-break-inside: avoid;
                break-inside: avoid;
            }
            .sla-table td {
                border: 1px solid #000;
                padding: 4px 6px !important;
                font-size: 7.5pt !important;
            }
            .sla-table th {
                border: 1px solid #000;
            }
        </style>
        <div class="sla-container">
            <div style="text-align: center; font-size: 10pt; font-weight: bold; background-color: #ffffff; color: #000000; text-transform: uppercase; padding: 8px; border-bottom: 1px solid #000; letter-spacing: 0.5px;">TURN-AROUND TIME (TAT)</div>
            <div style="text-align: left; padding: 8px 10px; border-bottom: 1px solid #000; background-color: #ffffff; font-size: 10pt; font-weight: bold; text-transform: uppercase;">
                SERVICE LEVEL AGREEMENT (SLA):
            </div>
            <table class="sla-table">
                <thead>
                    <tr style="background-color: #d1d5db; font-size: 8.5pt; font-weight: bold; text-align: center; border: 1px solid #000;">
                        <th style="width: 20%; border: 1px solid #000; padding: 8px 6px;">TRANSACTION CATEGORY</th>
                        <th style="width: 6%; border: 1px solid #000; padding: 8px 6px;">TAT (WD)</th>
                        <th style="width: 24%; border: 1px solid #000; padding: 8px 6px;">RECKONING DATE</th>
                        <th style="width: 17%; border: 1px solid #000; padding: 8px 6px;">MODE OF COMMUNICATION</th>
                        <th style="width: 16%; border: 1px solid #000; padding: 8px 6px;">RESPONSIBLE</th>
                        <th style="width: 17%; border: 1px solid #000; padding: 8px 6px;">CONTACT DETAILS</th>
                    </tr>
                </thead>
                <tbody style="font-size: 8pt;">
                <!-- Category: QUOTATION -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">QUOTATION</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Presentation of Quotation</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;"></td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;"></td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o PhilLife GMS</td>
                </tr>

                <!-- Category: NEGOTIATION -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">NEGOTIATION</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Presentation of Proposal</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Open</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">-</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o PhilLife GMS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Acceptance/Signing of Conforme</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Open</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">-</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o PhilLife GMS</td>
                </tr>

                <!-- Category: NEW BUSINESS -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">NEW BUSINESS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of Group Application</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Open</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">-</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of Listing (NEL)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Open</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">-</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of Individual Application (NML/MED)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Open</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">-</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of Other UW Requirements</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Open</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">-</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of Adjustment Requirements</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Open</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">-</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of Claims Requirements</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Open</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">-</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>

                <!-- Category: UNDERWRITING -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">UNDERWRITING</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Evaluation of No-Evidence Limit (NEL)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">1</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of Certified List</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Evaluation of Application - NMed</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">3</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of complete requirements</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Evaluation of Application - Med</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">7</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of complete requirements</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Issuance of Application-Med LOA – Letter of Approval</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">3</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Receipt of request</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Evaluation of Adjustment</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">3</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of complete requirements</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>

                <!-- Category: ISSUANCE -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">ISSUANCE</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Group Master Policy</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">7</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Completion of Underwriting</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Enrollment Upload</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">1</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Within 24 hours of loan/policy issuance</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Soft copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder/Phillife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Confirmation of Coverage (CoC)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">7</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Completion of Underwriting</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Endorsement - Renewal</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">7</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Completion of Underwriting</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Endorsement - Amendment</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">7</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Completion of Underwriting</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>

                <!-- Category: CANCELLATION -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">CANCELLATION</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Preparation of RCP</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;"></td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Receipt of request</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>

                <!-- Category: BILLING -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">BILLING</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">First Premium</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">7</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Completion of Underwriting</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Renewal</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">-30</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Policy Anniversary</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Addition/Deletion (Adjustment)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">7</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Completion of Underwriting</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>

                <!-- Category: COLLECTION -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">COLLECTION</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">First Premium</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">10</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Due Date</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Renewal</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">30</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Due Date</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Addition/Deletion (Adjustment)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">10</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Due Date</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Refund of Premium</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">15</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Receipt of request</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">c/o Policyholder</td>
                </tr>

                <!-- Category: CLAIMS -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">CLAIMS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Evaluation/Decision</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">15</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission of Claims Requirements</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">Claims</td>
                </tr>

                <!-- Category: REPORTS -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">REPORTS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Policy Issuance (Monthly)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;"></td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission Report</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">PhilLife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Client Monies Reconciliation (Annual)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;"></td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Submission Report</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder/Phillife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph/GMS</td>
                </tr>

                <!-- Category: COMMUNICATION -->
                <tr style="background-color: #ffff00; font-weight: bold; font-size: 9pt;">
                    <td colspan="6" style="border: 1px solid #000; padding: 6px 10px; text-transform: uppercase;">COMMUNICATION</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Acknowledgement (Simple)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">2</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Simple: working dates from receipt</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder/Phillife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph/GMS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Acknowledgement (Complex)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">2</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Complex: working dates from receipt</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder/Phillife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph/GMS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Processing and Resolution (Simple)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">7</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Simple: working dates from receipt</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder/Phillife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph/GMS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Processing and Resolution (Complex)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">7</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Complex: working dates from receipt</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder/Phillife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph/GMS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Communication of resolution (Simple)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">9</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Simple: working dates from receipt</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder/Phillife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph/GMS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Communication of resolution (Complex)</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">47</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Complex: working dates from receipt</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center" >Email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Policyholder/Phillife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph/GMS</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Audit/Reconciliation Report</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">30</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; font-style: italic;">Within 30 calendar days after end of each quarter</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center">Printed copy, email</td>
                    <td style="border: 1px solid #000; padding: 6px 8px; text-align: center;">Audit/Phillife</td>
                    <td style="border: 1px solid #000; padding: 6px 8px;">ebam@phillife.com.ph/Audit</td>
                </tr>
            </tbody>
        </table>
        </div>

        <div class="page-break"></div>

        <!-- ================= PAGE 5: CONFORME & SIGNATURE PAGE ================= -->
        <div style="font-size: 9.5pt; color: #4a5568; margin-bottom: 30px; font-weight: bold;">Continuation of ${policyNo}:</div>

        <div style="margin-top: 50px; text-align: center;">
            <div style="font-weight: bold; font-size: 18pt; text-transform: uppercase; letter-spacing: 0.5px;">PHILIPPINE LIFE FINANCIAL ASSURANCE CORPORATION</div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 8px; margin-bottom: 40px;">By:</div>

            <div style="width: 380px; margin: 0 auto; border-bottom: 1.5px solid #000; height: 30px;"></div>
            <div style="font-weight: bold; font-size: 13pt; margin-top: 8px; text-transform: uppercase;">MICHELLE L. AMBAGAN</div>
            <div style="font-size: 11pt; font-weight: 500;">Executive Vice-President & Chief Operating Officer</div>
            <div style="font-size: 11pt; margin-top: 8px;">Signed on _________________ at Makati City, Metro Manila.</div>
        </div>

        <div style="margin-top: 70px; text-align: center;">
            <div style="font-weight: bold; font-size: 12pt; text-transform: uppercase; letter-spacing: 1.5px;">CONFORME:</div>
            <div style="font-weight: bold; font-size: 18pt; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 15px;">${groupName}</div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 8px; margin-bottom: 40px;">By:</div>

            <div style="width: 380px; margin: 0 auto; border-bottom: 1.5px solid #000; height: 30px;"></div>
            <div style="font-weight: bold; font-size: 13pt; margin-top: 8px; text-transform: uppercase;">${addresseeName}</div>
            <div style="font-size: 11pt; font-weight: 500;">${addresseeDesignation}</div>
            <div style="font-size: 11pt; margin-top: 8px;">Signed on _________________ at ${application?.signing_location || businessAddress || ''}.</div>
        </div>

        <div class="page-break"></div>

        <!-- ================= SECTIONS I-IV: INSURANCE PROVISIONS ================= -->
        <!-- ================= SECTION I: INSURANCE PROVISIONS ================= -->
        <div class="main-title" style="font-size: 14pt;">I. INSURANCE PROVISIONS</div>
        
        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">WHO MAY BE INSURED</div>
        <p class="paragraph">
            All debtors satisfying the eligibility provision stated in the Policy Data Page shall be eligible for insurance under this Policy on the date stated in the Policy Data Page.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">ENROLLMENT</div>
        <p class="paragraph">
            Written application, on forms satisfactory to the Insurer, is required for each eligible debtor in respect of whom an application for insurance under this Policy is being made. Eligible debtors accepted by the Insurer for insurance coverage under this Policy are hereinafter referred to as Insured Debtors.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">BENEFITS</div>
        <p class="paragraph">
            Each eligible debtor shall be insured in accordance with the Schedule of Insurance stated in the Policy Data Page.
        </p>
        <p class="paragraph">
            Upon death of the Insured Debtor, the Insurer shall pay the Creditor the amount of his insurance to the extent of his outstanding loan balance and to his designated beneficiary any amount of insurance in excess of his outstanding loan balance.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">EFFECTIVE DATE OF INDIVIDUAL INSURANCE</div>
        <p class="paragraph">
            Subject to the Evidence of Insurability provision, individual insurance shall take effect on the eligibility date of the debtor provided premiums are paid and provided further that if on account of illness or disability, any eligible debtor is bedridden or is confined in a hospital/clinic on the date his insurance would have become effective, as provided above, his insurance shall not become effective until the first day of the month coincident with or immediately following the date he fully recovers from such illness or disability, or of his discharge from the hospital/clinic as a fully recovered patient.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">EVIDENCE OF INSURABILITY</div>
        <p class="paragraph">
            No evidence of insurability shall be required for amounts of insurance not exceeding the no-evidence limit stated in the Policy Data Page, if any, subject to conditions stated therein and provided further that:
        </p>
        <ol style="padding-left: 25px; line-height: 1.5;">
            <li>the debtor’s application for insurance is received by the Insurer not later than 31 days after his date of eligibility; nor</li>
            <li>the debtor is not applying for reinstatement of his insurance that he has voluntarily terminated.</li>
        </ol>
        <p class="paragraph">
            The Insurer shall require evidence of insurability acceptable to it for amounts exceeding the No-Evidence Limit, if any, and to debtors not satisfying the above-stated conditions.
        </p>
        <p class="paragraph">
            The insurance of a debtor subject to evidence of insurability shall take effect on the date such evidence is approved by the Insurer.
        </p>
        <p class="paragraph">
            The Insurer reserves the right to charge extra premium for a debtor who is required to submit evidence of insurability and is found to be substandard or entirely decline his insurance which is subject to the evidence of insurability, if such evidence is found not acceptable or should the Creditor and/or debtor refuse to pay such extra premium.
        </p>

        <div class="page-break"></div>

        <!-- ================= SECTION II: PREMIUM PROVISIONS ================= -->
        <div class="main-title" style="font-size: 14pt;">II. PREMIUM PROVISIONS</div>
        
        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PREMIUM RATES</div>
        <p class="paragraph">
            The premium rates per ₱ 1,000.00 of insurance by class of Insured Debtors shall be as stated in the Policy Data Page.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">GUARANTEE OF AND RIGHT TO CHANGE THE PREMIUM RATE</div>
        <p class="paragraph">
            The premium rates are guaranteed for the first policy year. The Insurer reserves the right to establish new premium rates at the beginning of any renewal year or whenever the terms of this Policy are changed.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">COMPUTATION OF PREMIUMS DUE</div>
        <p class="paragraph">
            The amount of each premium due shall be determined by multiplying the applicable premium rate per ₱ 1,000.00 by the total amount of insurance in force on the said due date. A statement of premiums due including premium adjustments shall be furnished as of each due date by the Insurer.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PREMIUM ADJUSTMENTS</div>
        <p class="paragraph">
            Premiums shall be subject to adjustment on account of insurance added, increased, reduced and/or terminated. Premium adjustment during a policy year shall be calculated pro-rata using the premium rates effective at the beginning of that policy year, from the date the adjustment becomes effective to the next premium due date or as mutually agreed upon by the Creditor and the Insurer.
        </p>
        <p class="paragraph">
            Premium adjustments shall be due when determined.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PAYMENT OF PREMIUMS</div>
        <p class="paragraph">
            Premiums are payable to the Insurer in advance on each premium due date, at its Home Office or to a duly authorized agent of the Insurer or through the other offices as the Insurer may hereafter designate, in exchange for a receipt duly signed by the Insurer's authorized representative. The payment of any premium shall not maintain the insurance under this Policy in force beyond the date when the next premium becomes payable, except as set forth in the "GRACE PERIOD" provision.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">GRACE PERIOD</div>
        <p class="paragraph">
            A grace period of thirty-one (31) days following the due date shall be allowed the Creditor for the payment of each premium after the first during which insurance coverage hereunder shall remain in force. If any premium due is not paid within the grace period, this Policy shall automatically terminate at the expiration of the grace period, except that if the Creditor shall have given the Insurer written notice in advance of an earlier date of termination, this Policy shall terminate as such earlier date. The Creditor shall be liable to the Insurer for the payment of a pro-rata premium from the time this Policy was in force during the grace period.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">TAXES</div>
        <p class="paragraph">
            The taxes specified in the Policy Data Page, if any, shall be for the account of the Creditor and shall be payable in the manner stated therein.
        </p>

        <div class="page-break"></div>

        <!-- ================= SECTION III: CLAIM PROVISIONS ================= -->
        <div class="main-title" style="font-size: 14pt;">III. CLAIM PROVISIONS</div>
        
        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">BENEFICIARY</div>
        <p class="paragraph">
            The Creditor shall be the primary and irrevocable beneficiary of each Insured Debtor hereunder to the extent of his outstanding loan balance at the time of death of the Insured Debtor.
        </p>
        <p class="paragraph">
            The Insured Debtor shall have the right to designate anybody, not disqualified by law, as beneficiary to receive the amount of insurance payable in excess of his outstanding loan balance, if any.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">NOTICE OF CLAIM</div>
        <p class="paragraph">
            Written notice of claim must be given to the Insurer within thirty (30) days after the occurrence or commencement of any loss covered by this Policy or as soon thereafter as is reasonably possible. Failure to comply within the time provided shall not invalidate nor reduce the claim if it is given as soon as was reasonably possible.
        </p>
        <p class="paragraph">
            The Insurer upon receipt of a notice of claim shall furnish to the claimant such forms as are usually required by the Insurer for filing proofs of loss. If such forms are not so furnished by the Insurer within fifteen (15) days after its receipt of such notice, the claimant shall be deemed to have complied with the requirements of this Policy as to proof of loss upon submitting, within the time fixed in this Policy for filing proofs of loss, written proof covering the occurrence, character and extent of the loss for which claim is made.
        </p>
        <p class="paragraph">
            Written notice of claim given by or in behalf of the Insured Debtor, to the Insurer or to any authorized representative of the Insurer, with information sufficient to identify the Insured Debtor, shall be deemed to be notice to the Insurer.
        </p>

        <div class="page-break"></div>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PROOF OF LOSS</div>
        <p class="paragraph">
            Written proof of loss must be furnished to the Insurer within ninety (90) days from the date of the loss to which the claim is made. Failure to comply within the time provided shall not invalidate nor reduce the claim if it is shown that it was not reasonably possible to submit such proof within the required time and that proof was submitted as soon as was reasonably possible.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PAYMENT OF CLAIM</div>
        <p class="paragraph">
            The amount of any loss for which the Insurer may be liable under this Policy, shall be paid to the Creditor within thirty (30) days after proof of loss is received by the Insurer and ascertainment of the loss is made by agreement between the Creditor and the Insurer or by arbitration; but if such ascertainment is not made within sixty (60) days after such receipt by the Insurer of the proof of loss, then the loss shall be paid within ninety (90) days after such receipt.
        </p>
        <p class="paragraph">
            Such amount paid shall be applied by the Creditor to reduce or completely extinguish the outstanding loan of the Insured Debtor to the Creditor.
        </p>
        <p class="paragraph">
            Refusal or failure to pay the claim within the time prescribed herein shall entitle the Insured Debtor to collect interest for the duration of the delay at the rate of twice the ceiling prescribed by the Monetary Board, unless such refusal or failure to pay is based on the ground that the claim is fraudulent.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PHYSICAL EXAMINATION AND AUTOPSY</div>
        <p class="paragraph">
            The Insurer, at its own expense, shall have the right and opportunity to examine an Insured Debtor when and as often as the Insurer may reasonably require while the claim is pending hereunder, and also the right and opportunity to make an autopsy in case of death where it is not forbidden by law.
        </p>

        <div class="page-break"></div>

        <!-- ================= SECTION IV: GENERAL PROVISIONS ================= -->
        <div class="main-title" style="font-size: 14pt;">IV. GENERAL PROVISIONS</div>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">THE CONTRACT</div>
        <p class="paragraph">
            This Policy, the Policy Data Page, the Creditor’s application attached hereto, any riders, endorsements or amendments herein and the Insured Debtors’ applications (including evidence of insurability, if any) constitute the entire contract. All statements made by the Creditor or by the Insured Debtors shall be deemed representations and not warranties. No statement made by any Insured Debtor shall be used to contest the validity of the insurance unless it is written and signed by him and a copy furnished to him or to his beneficiaries.
        </p>
        <p class="paragraph">
            No agent is authorized to alter or amend this Policy, to accept premiums in arrears or to extend the due date of any premium, to waive any notice or proof of claim required by the Insurer, or to extend the date before which any such notice or proof be submitted.
        </p>
        <p class="paragraph">
            This Policy may at any time be amended and changed by written agreement between the Insurer and the Creditor. Any such amendment shall be binding on all Insureds whether their insurance became effective prior to, on, or after the effective date of the amendment.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">POLICY EFFECTIVITY</div>
        <p class="paragraph">
            This Policy becomes effective only upon the payment of its initial premium and its delivery to the Creditor. The Effective Date, shown in the Policy Data Page shall be used to determine premium due dates, policy years and policy anniversaries.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">DATA REQUIRED</div>
        <p class="paragraph">
            The Creditor shall furnish the Insurer promptly in writing all information necessary for the efficient administration of this Policy including (1) debtors becoming eligible and their respective dates of birth and amount of insurance (2) Insured Debtors whose insurance terminates and their respective termination dates, and (3) changes in the classification and amounts of insurance of an Insured Debtor, if any.
        </p>
        <p class="paragraph">
            All documents furnished to the Creditor by a debtor in connection with his insurance and such other records as may have a bearing on the insurance under this Policy, shall be open for inspection by the Insurer at reasonable hours.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">CLERICAL ERROR</div>
        <p class="paragraph">
            Clerical error in keeping the records shall not invalidate an insurance which otherwise is validly in force nor shall it continue an insurance which otherwise is validly terminated.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">AGE AND MISSTATEMENT OF AGE</div>
        <p class="paragraph">
            Age, unless defined otherwise, shall mean age at last birthday. The Insurer may request proof of age of any Insured Debtor. Benefits payable are suspended until the requested proof is given.
        </p>
        <p class="paragraph">
            If the age of the Insured Debtor has been misstated, the amount of insurance shall be adjusted to the amount that the premium would have purchased at the correct age, applicable risk class and applicable premium rates as of the effective date.
        </p>
        <p class="paragraph">
            If at the correct age, the Insured Debtor is not eligible for any coverage under this Policy or its riders, the Insurer shall refund the corresponding premiums actually received by the Insurer.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">RENEWAL</div>
        <p class="paragraph">
            The Creditor shall be entitled to renew this Policy upon payment of the premium due on the effective date of renewal.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">TERMINATION OF THIS POLICY</div>
        <p class="paragraph">
            This Policy shall automatically terminate if premiums due remain unpaid beyond the grace period as stated in the Grace Period provision of this Policy.
        </p>
        <p class="paragraph">
            The Creditor may discontinue this Policy at any time by giving written notice to the Insurer at least 31 days prior to the date of termination.
        </p>
        <p class="paragraph">
            The Insurer may also terminate this Policy at any time by giving at least 31 days prior written notice to the Creditor if the number of Insureds is less than the minimum number stated in the Policy Data Page or the percentage of Insured Debtors is less than the minimum percentage stated in the Policy Data Page.
        </p>
        <p class="paragraph">
            Notice of termination shall be in writing, mailed or delivered to the Creditor at the address shown in this Policy or application.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">TERMINATION OF INDIVIDUAL INSURANCE</div>
        <p class="paragraph">
            The insurance of all Insured Debtors hereunder shall automatically terminate on the earliest of the following:
        </p>
        <ol style="padding-left: 25px; line-height: 1.5;">
            <li>the date this Policy terminates; or</li>
            <li>the policy anniversary immediately succeeding the date he attains the termination age stated in the Policy Data Page; or</li>
            <li>the date the Insured Debtor enters military, naval or air service; or</li>
            <li>the date any one payment towards the Insured’s loan becomes six (6) months overdue, notwithstanding payments for his insurance; or</li>
            <li>the Insured Debtor ceases to be a debtor of the Creditor.</li>
        </ol>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">LEGAL PROCEEDINGS</div>
        <p class="paragraph">
            If a claim is made and an action or suit is not commenced either with the Insurance Commission or any court of competent jurisdiction within 24 months from notice of denial of claim, then the claim shall for all purposes be deemed to have been abandoned and shall not thereafter be reopened or reconsidered.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">INCONTESTABILITY</div>
        <p class="paragraph">
            This policy shall be incontestable after one (1) year from the effective date or the date of its last reinstatement, except for non-payment of premiums. Similarly, any individual insurance, or any additional portion thereof, shall not be contested after it has been in force during the lifetime of the Insured Debtor for a period of one (1) year from its effective date or date of last reinstatement, except for non-payment of premium.
        </p>
        <p class="paragraph">
            No statement made by the Insured Debtor relating to his insurability shall be used in contesting the validity of the insurance with respect to which such statement was made after such insurance has been in force during the Insured Debtor’s lifetime for a period of one (1) year from its effective date or the date of last reinstatement, nor unless contained in a written instrument signed by him.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">SUICIDE CLAUSE</div>
        <p class="paragraph">
            The Insurer will not be liable if an Insured Debtor dies within one (1) year after the effective date or date of last reinstatement of his insurance coverage, provided however, that suicide committed in the state of insanity shall be compensable regardless of the date of commission.
        </p>
        <p class="paragraph">
            Where suicide is not compensable, the liability of the Insurer will be limited to the return of premiums paid pertaining to the Insured.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">INDIVIDUAL CONFIRMATION OF INSURANCE COVERAGE</div>
        <p class="paragraph">
            The Insurer shall issue to the Creditor, for delivery to each Insured Debtor, an individual confirmation of insurance coverage setting forth a summary of the essential features of the individual insurance coverage and other privileges to which the Insured Debtor is entitled. These forms do not constitute a contract but are merely informative statements setting forth the benefits and the claim procedures and are not transferable.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">REINSTATEMENT</div>
        <p class="paragraph">
            This Policy may be reinstated any time after it has been terminated provided the conditions set by the Insurer at the time of reinstatement are met and the appropriate premiums are paid. Only losses that occur after the effective date of reinstatement shall be covered.
        </p>
        <p class="paragraph">
            If a debtor whose insurance is terminated in accordance with the termination provision of this Policy again becomes entitled to participate for insurance hereunder, such debtor may again become insured under this Policy by submitting, without expense to the Insurer, an evidence of insurability acceptable to it. His insurance shall take effect once the evidence is approved by the Insurer and the corresponding premium is paid.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">NON-WAIVER OF POLICY PROVISION</div>
        <p class="paragraph">
            Failure of the Insurer to insist upon compliance with any provision of this Policy at any given time or under any given set of circumstances shall not operate to waive or modify such provision, or in any manner whatsoever to render it unenforceable, as to any other time or as to any other occurrence, whether the circumstances are, or are not, the same.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">ARTICLE 1250 (R.A. No. 386) NOT APPLICABLE</div>
        <p class="paragraph">
            It is hereby declared and agreed that the provision of Article 1250 of the Civil Code of the Philippines (Republic Act No. 386) which reads:
        </p>
        <blockquote style="font-style: italic; margin: 10px 30px; line-height: 1.4;">
            “in case of extraordinary inflation or deflation of the currency stipulated should supervene, the value of the currency at the time of the establishment of the obligation shall be the basis of payment…”
        </blockquote>
        <p class="paragraph">
            shall not apply in determining the extent of liability under the provision of this Policy.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">CURRENCY</div>
        <p class="paragraph">
            All amounts mentioned in this Policy refer to the currency stated in the Policy Data Page.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">AVAILABILITY OF THIS POLICY</div>
        <p class="paragraph">
            This Policy shall be kept in the main office and in the custody of an officer of the Creditor. It will be available to the Insured Debtors for their inspection during regular business hours of the Creditor.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">POLICY DATA PAGE PROVISIONS</div>
        <p class="paragraph">
            The Provisions stated in the Policy Data Page shall supersede any inconsistent provision herein.
        </p>

        <div class="page-break"></div>
        
        <!-- Centered Important Notice Page -->
        <div style="display: flex; flex-direction: column; justify-content: center; min-height: 90vh; box-sizing: border-box;">
            <div style="border: 3px double #000; padding: 20px 25px; text-align: justify; font-size: 9.5pt; line-height: 1.4; page-break-inside: avoid; break-inside: avoid; width: 90%; margin: 0 auto;">
                <div style="text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 12px; letter-spacing: 0.5px;">IMPORTANT NOTICE</div>
                The Insurance Commission, with offices in Manila, Cebu and Davao, is the government office in charge of the enforcement of all laws related to insurance and has supervision over insurance providers and intermediaries. It is ready at all times to assist the general public in matters pertaining to insurance. For any inquiries or complains, please contact the Public Assistance and Mediation Division (PAMD) of the Insurance Commission at 1071 United Nations Avenue, Ermita, Manila with telephone/cellphone numbers (02) 8523-8461 local 103 or 127, 09171160007 (Globe), and 09999930637 (Smart), and with email address <a href="mailto:publicassistance@insurance.gov.ph" style="color: #0d47a1; text-decoration: underline;">publicassistance@insurance.gov.ph</a>. The official website of the Insurance Commission is <a href="https://www.insurance.gov.ph" style="color: #0d47a1; text-decoration: underline;">www.insurance.gov.ph</a>.
            </div>
        </div>

        <div class="page-break"></div>

        <!-- ================= ATTACHED RIDER TEMPLATES ================= -->
        ${riderTemplatesHtml}

        <!-- ================= PAGE 23: SIGN-OFF CHECKLIST ================= -->
        <div style="font-weight: bold; text-align: center; font-size: 14pt; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">GROUP POLICY SIGN-OFF</div>

        <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; margin-bottom: 6px; font-size: 9pt; font-family: 'Segoe UI', Arial, sans-serif;">
            <tr>
                <td style="padding: 3px 8px; width: 28%; font-style: italic; border: none; vertical-align: middle;">Policyholder</td>
                <td style="padding: 3px 8px; border: none; vertical-align: middle;">: <strong>${groupName.toUpperCase()}</strong></td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; font-style: italic; border: none; vertical-align: middle;">Group Master Policy Number</td>
                <td style="padding: 3px 8px; border: none; vertical-align: middle;">: <strong>${policyNo.toUpperCase()}</strong></td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; font-style: italic; border: none; vertical-align: middle;">Plan of Insurance</td>
                <td style="padding: 3px 8px; border: none; vertical-align: middle;">: <strong>${basicPlanName.toUpperCase()}</strong></td>
            </tr>
        </table>

        <div style="font-size: 8pt; font-style: italic; margin-bottom: 8px;">
            Printing Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <div style="font-weight: bold; text-align: center; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px;">GROUP MASTER POLICY</div>
        <div style="font-weight: bold; text-align: center; font-size: 13pt; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">CHECKLIST</div>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 10px; font-size: 8pt; font-family: 'Segoe UI', Arial, sans-serif;">
            <thead>
                <tr style="font-size: 7.5pt; font-style: italic; text-align: center;">
                    <th colspan="7" style="border: 1px solid #000; padding: 4px 6px; font-weight: normal; line-height: 1.3;">
                        Pages to be signed (Those with ✓ marks only.)<br>
                        Please affix your signature on this certification below to keep the policy contract clean. Thank you.
                    </th>
                </tr>
                <tr style="font-size: 8pt; font-weight: bold; font-style: italic; text-align: center; background-color: #ffffff;">
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 8%;">Page</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 44%;">Description</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 10%;">Actuarial</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 10%;">Underwriting</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 9%;">Group Sales</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 9%;">Operation Head</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 10%;">EVP & COO</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">1</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Cover Page</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">1</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">“Examined By” portion</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">2-8</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Policy Data Page, Schedule of Insurance, Premium</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">9</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Insurance Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">10</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Conversion Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">11</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Premium Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">12-13</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Claim Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">14-17</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">General Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                ${(() => {
                    const riderCount = Array.isArray(application?.riders) && application.riders.length > 0 ? application.riders.length : 0;
                    const range = riderCount > 0 ? '18-22' : 'N/A';
                    return `
                        <tr>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">${range}</td>
                            <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Riders</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                        </tr>
                    `;
                })()}
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">&nbsp;</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Cover Letter</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
            </tbody>
        </table>

        <div style="font-weight: bold; text-align: center; font-size: 13pt; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px;">CERTIFICATION</div>
        <p style="font-size: 8.5pt; font-style: italic; line-height: 1.4; text-align: justify; margin-bottom: 10px; text-indent: 0; font-family: 'Segoe UI', Arial, sans-serif;">
            We, the undersigned, certify that the Policy Data Page, Schedule of Insurance, Premium and policy contract assembly of the Account described herein is correct, and hereby endorsed for final signature by the EVP and COO.
        </p>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 5px; font-size: 8.5pt; font-family: 'Segoe UI', Arial, sans-serif;">
            <thead>
                <tr style="background-color: #ffffff; font-size: 8.5pt;">
                    <th style="width: 50%; border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">SIGNATORIES</th>
                    <th style="width: 50%; border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">DATE AND SIGNATURE</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>REYMARK M. MAGDATO</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">EBAM/UNDERWRITING</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>IRVIN C. BO</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">EBAM/UNDERWRITING</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>MARIA FE SALANIO</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">EBAM/UNDERWRITING</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>FERDINAND A. RECIO</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">OPERATIONS</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>RONALD Y. TABALADA</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">ACTUARIAL</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>MARVIN M. CATAPANG</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">GROUP SALES</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
            </tbody>
        </table>

    </div>
</body>
</html>
    `;
}
