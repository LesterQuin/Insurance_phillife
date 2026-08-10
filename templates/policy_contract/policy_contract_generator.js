/**
 * Master Policy Contract PDF Generator Engine for EBAM
 * Generates complete dynamic Group Master Policy Contract PDF assembly
 */

export const getPolicyNumberPrefix = (basicPlanName = '', planId = null) => {
    const nameUpper = basicPlanName.toUpperCase();
    if (nameUpper.includes('OVERSEAS') || nameUpper.includes('OFW') || nameUpper.includes('G-OFW')) return { prefix: 'G-OFW', startSeq: 1 };
    if (nameUpper.includes('TERM LIFE WITH MEDICAL') || nameUpper.includes('G-TMR')) return { prefix: 'G-TMR', startSeq: 701 };
    if (nameUpper.includes('MOSQUITO-BORNE LIFE') || nameUpper.includes('G-MBL')) return { prefix: 'G-MBL', startSeq: 801 };
    if (nameUpper.includes('MOSQUITO-BORNE ACCIDENT') || nameUpper.includes('G-ADD-MBDRX')) return { prefix: 'G-ADD-MBDRX', startSeq: 1001 };
    if (nameUpper.includes('TERM LIFE - FAM') || nameUpper.includes('FAMS') || nameUpper.includes('GTLI-FAMS')) return { prefix: 'GTLI-FAMS', startSeq: 1101 };
    if (nameUpper.includes('COMPREHENSIVE') || nameUpper.includes('G-CBP')) return { prefix: 'G-CBP', startSeq: 201 };
    if ((nameUpper.includes('ACCIDENTAL DEATH') && (nameUpper.includes('PLUS') || nameUpper.includes('DRX'))) || nameUpper.includes('G-ADD-DRX')) return { prefix: 'G-ADD-DRX', startSeq: 401 };
    if (nameUpper.includes('ACCIDENTAL DEATH') || nameUpper.includes('GPA') || nameUpper.includes('G-ADD')) return { prefix: 'G-ADD', startSeq: 301 };
    if (nameUpper.includes('CREDIT LIFE') || nameUpper.includes('GCLI') || nameUpper.includes('G-CLI')) return { prefix: 'G-CLI', startSeq: 501 };
    if (nameUpper.includes('CRITICAL ILLNESS') || nameUpper.includes('GCI') || nameUpper.includes('G-CIP')) return { prefix: 'G-CIP', startSeq: 601 };
    if (nameUpper.includes('TERM LIFE') || nameUpper.includes('GTLIP') || nameUpper.includes('GYRT') || nameUpper.includes('G-TLI')) return { prefix: 'G-TLI', startSeq: 101 };
    return { prefix: 'G-TLI', startSeq: 101 };
};

export function buildScheduleOfInsuranceRows(application = {}) {
    const coverageTypeId = Number(application?.coverage_type_id || 32);
    
    let rankingsList = [];
    if (coverageTypeId === 32 && Array.isArray(application?.level_ranking) && application.level_ranking.length > 0) {
        rankingsList = application.level_ranking;
    } else if (coverageTypeId === 34 && Array.isArray(application?.salary_ranking) && application.salary_ranking.length > 0) {
        rankingsList = application.salary_ranking;
    } else if (Array.isArray(application?.rankings) && application.rankings.length > 0) {
        rankingsList = application.rankings;
    }

    if (rankingsList.length === 0) {
        if (coverageTypeId === 33 || application?.uniform_coverage_amount) {
            rankingsList = [{ designation: 'All Eligible Individuals', total_coverage_amount: application?.uniform_coverage_amount || 3000000 }];
        } else {
            rankingsList = [
                { designation: 'VICE-PRESIDENT', total_coverage_amount: 3000000 },
                { designation: 'PROGRAM DIRECTOR TO ASSOCIATE VICE-PRESIDENT', total_coverage_amount: 2000000 },
                { designation: 'ASSISTANT MANAGER TO SENIOR MANAGER', total_coverage_amount: 1500000 },
                { designation: 'TEAM LEADERS TO SENIOR TEAM LEADER', total_coverage_amount: 800000 },
                { designation: 'RANK AND FILE EMPLOYEES, ASSOCIATE TEAM MEMBER TO SENIOR TEAM MEMBER', total_coverage_amount: 500000 }
            ];
        }
    }

    const basicPlanName = application?.basic_plan_name || application?.plan_name || 'GTLIP (Basic Life)';
    const riders = Array.isArray(application?.riders) ? application.riders : [];

    let html = '';

    html += `
        <tr style="background-color: #f1f5f9; font-weight: bold;">
            <td colspan="5">All Eligible Individuals</td>
        </tr>
    `;

    rankingsList.forEach(rank => {
        const desigLabel = (rank.designation || 'All Eligible Individuals').toUpperCase();
        
        let baseAmtNumber = Number(rank.total_coverage_amount || rank.uniform_coverage_amount || rank.amount || 1000000);
        let baseAmtDisplay = `₱ ${baseAmtNumber.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        if (coverageTypeId === 34 && rank.salary_multiplier) {
            const mult = String(rank.salary_multiplier).toLowerCase().replace(/x$/, '').trim();
            baseAmtDisplay = `${mult}x Monthly Basic Salary max of ₱ ${baseAmtNumber.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        const baseRate = Number(rank.rate || rank.basic_rate || 1.01);
        const basePerHead = (baseAmtNumber / 1000) * baseRate;

        html += `
            <tr>
                <td colspan="5"><strong>${desigLabel}:</strong></td>
            </tr>
            <tr>
                <td style="padding-left: 20px;">${basicPlanName}</td>
                <td>${baseAmtDisplay}</td>
                <td>${baseRate.toFixed(2)}</td>
                <td>₱ ${basePerHead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>70 years old</td>
            </tr>
        `;

        let totalPerHead = basePerHead;

        riders.forEach(r => {
            const acronym = (r.acronym || r.rider_name || 'RIDER').toUpperCase();
            const riderVal = r.values?.find(v => (v.designation || '').toUpperCase() === desigLabel);
            const riderAmt = Number(riderVal?.amount || r.amount || baseAmtNumber);
            const riderRate = Number(r.rate || r.unit_value || (acronym.includes('GTIR') || acronym.includes('ADDITIONAL') ? 0 : 0.20));

            let riderAmtStr = `₱ ${riderAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            let riderRateStr = riderRate === 0 ? 'Free' : riderRate.toFixed(2);
            let perHeadStr = 'Free';

            if (acronym.includes('GTIR')) {
                riderAmtStr = '50% of GTLIP';
                riderRateStr = 'Free';
                perHeadStr = 'Free';
            } else if (riderRate > 0) {
                const riderPerHead = (riderAmt / 1000) * riderRate;
                perHeadStr = `₱ ${riderPerHead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                totalPerHead += riderPerHead;
            }

            const termAge = (acronym.includes('GTPDR') || acronym.includes('DISABILITY')) ? '66 years old' : '66 years old';

            html += `
                <tr>
                    <td style="padding-left: 20px;">${acronym}</td>
                    <td>${riderAmtStr}</td>
                    <td>${riderRateStr}</td>
                    <td>${perHeadStr}</td>
                    <td>${termAge}</td>
                </tr>
            `;
        });

        if (!riders.some(r => (r.acronym || r.rider_name || '').toUpperCase().includes('GTIR'))) {
            html += `
                <tr>
                    <td style="padding-left: 20px;">GTIR (Terminal Illness)</td>
                    <td>50% of GTLIP</td>
                    <td>Free</td>
                    <td>Free</td>
                    <td>66 years old</td>
                </tr>
            `;
        }

        html += `
            <tr style="font-weight: bold; background-color: #fafafa;">
                <td style="padding-left: 20px;">Total:</td>
                <td></td>
                <td></td>
                <td>₱ ${totalPerHead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td></td>
            </tr>
        `;
    });

    return html;
}

export function generateMasterPolicyContractTemplate(application = {}, details = {}, riderTemplatesHtml = '') {
    const logoDataUri = details?.logoDataUri || '';
    const showReviewWatermark = details?.isReview !== false;

    // Company & Client Info
    const groupName = application?.group_name || 'COFORGE BPS PHILIPPINES, INC.';
    const businessAddress = application?.business_address || 'Ground Floor, Vector-3, Northgate Cyberzone, Filinvest City, Alabang 1781 City of Muntinlupa, NCR';
    const companyTin = application?.company_tin || '007-884-680-000';
    
    // Dates & Policy Number
    const isBooked = !!(application?.policy_no && application.policy_no.trim() !== '') || application?.status_id === 7 || application?.proposal_status_id === 7;
    const effectiveDateObj = application?.effective_date 
        ? new Date(application.effective_date) 
        : (isBooked ? (application?.updated_at ? new Date(application.updated_at) : new Date()) : null);
    const effectiveDateStr = effectiveDateObj 
        ? effectiveDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
        : '';
    const effectiveDate = effectiveDateObj || new Date();
    const effectiveYear = effectiveDate.getFullYear().toString().substring(2);

    const basicPlanName = application?.basic_plan_name || application?.plan_name || 'Group Term Life Insurance Plan (GTLIP)';
    const { prefix, startSeq } = getPolicyNumberPrefix(basicPlanName, application?.plan_id);
    const appId = application?.application_id || 1;
    const policyNo = (application?.policy_no && application.policy_no.trim() !== '') 
        ? application.policy_no 
        : `${prefix}-${effectiveYear}-`;

    // Underwriting Limits
    const nelAmount = application?.nel_amount || 3000000;
    const formattedNel = `₱ ${Number(nelAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    // Currency & Contribution
    const currencyName = application?.currency_name || 'Philippine Peso';
    const contributionText = application?.contribution_text || '';
    const numberOfLives = application?.number_of_lives || 776;

    // Addressee & Signatories
    const addresseeName = application?.proposal_addressee || application?.contact_person_lastname ? `${application.contact_person_firstname || ''} ${application.contact_person_lastname || ''}`.trim() : 'DEEPAK MENON';
    const addresseeDesignation = application?.addressee_designation || application?.designation || 'Vice-President – Delivery Head';

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
                    ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" style="max-height: 65px;" />` : `<strong>PHILIPPINE LIFE FINANCIAL ASSURANCE CORP.</strong>`}
                    <div style="font-size: 8.5pt; color: #2d3748; margin-top: 5px; font-weight: 600;">
                        Philippine Life Financial Assurance Corporation<br>
                        11/F STI Holdings Center, 6764 Ayala Avenue, 1226 Makati City, Philippines<br>
                        Tel. No.: (632) 7798-5433 | TIN: 007-884-680-000
                    </div>
                </div>

                <div style="text-align: center; font-size: 18pt; font-weight: 900; color: #000; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                    PHILIPPINE LIFE FINANCIAL ASSURANCE CORPORATION
                </div>
                <div style="text-align: center; font-size: 9.5pt; font-style: italic; margin-bottom: 20px;">
                    (herein called the Insurer)
                </div>

                <p style="text-align: center; font-size: 10.5pt; margin: 15px 0;">
                    HEREBY ISSUES this Group Policy (hereinafter referred to as this Policy) to
                </p>

                <div style="text-align: center; font-size: 17pt; font-weight: 900; color: #000; margin: 15px 0 3px 0; text-transform: uppercase; letter-spacing: 0.5px;">
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
        <div class="main-title" style="font-size: 16pt;">POLICY DATA PAGE</div>

        <table class="data-table">
            <tr>
                <th style="width: 25%;">POLICY NO.</th>
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
                <td>${basicPlanName}</td>
            </tr>
            <tr>
                <th>SUPPLEMENTARY BENEFITS/RIDERS</th>
                <td>
                    ${Array.isArray(application?.riders) && application.riders.length > 0
                        ? application.riders.map(r => `${r.rider_name || r.name || r.acronym} (${r.acronym})`).join('<br>')
                        : (Array.isArray(details?.riders) && details.riders.length > 0
                            ? details.riders.map(r => `${r.rider_name || r.name || r.acronym} (${r.acronym})`).join('<br>')
                            : 'None')}
                </td>
            </tr>
            <tr>
                <th>CURRENCY</th>
                <td>${currencyName}</td>
            </tr>
            <tr>
                <th>ELIGIBLE INDIVIDUALS</th>
                <td>
                    Any regular, probationary or contractual employee of the Policyholder who is in good health and actively-at-work at least 18 years old and who has not attained 66th birth anniversary on Eligibility Date.<br><br>
                    Subject to DOLE’s ruling on Employment of Youth aged 15 years old and not more than 18 years old.
                </td>
            </tr>
            <tr>
                <th>CONTRIBUTION</th>
                <td>${contributionText}</td>
            </tr>
            <tr>
                <th>PARTICIPATION REQUIREMENTS</th>
                <td>
                    <strong>Percentage of all Eligible Individuals:</strong> 100%<br>
                    <strong>Minimum Number of Insureds:</strong> At least 10 individuals at policy inception | At least ${numberOfLives} individuals before policy renewal
                </td>
            </tr>
            <tr>
                <th>UNDERWRITING PROVISIONS</th>
                <td>
                    <strong>No-Evidence Limit per Life:</strong> ${formattedNel} (18 to 65 years old)<br>
                    <strong>Non-Medical Limit per Life:</strong> N/A<br>
                    <strong>Medical Limit per Life:</strong> N/A<br>
                    <strong>Maximum Amount of Insurance per Life:</strong> ${formattedNel} (18 to 70 years old)
                </td>
            </tr>
        </table>

        <div class="page-break"></div>

        <!-- ================= PAGE 3: SPECIAL UNDERWRITING PROVISIONS ================= -->
        <div class="section-header">SPECIAL UNDERWRITING PROVISIONS</div>
        <div class="provisions-container" style="line-height: 1.6; font-size: 10pt;">
            ${typeof application?.special_underwriting_provisions === 'string' && application.special_underwriting_provisions.trim() !== ''
                ? application.special_underwriting_provisions
                : (Array.isArray(application?.special_underwriting_provisions) && application.special_underwriting_provisions.length > 0
                    ? `<ol style="padding-left: 20px; line-height: 1.6;">${application.special_underwriting_provisions.map(item => `<li>${item}</li>`).join('')}</ol>`
                    : ''
                )
            }
        </div>

        <div class="page-break"></div>

        <!-- ================= SCHEDULE OF INSURANCE ================= -->
        <div class="main-title" style="font-size: 14pt; margin-bottom: 10px;">SCHEDULE OF INSURANCE</div>

        <table class="data-table" style="margin-bottom: 10px; font-size: 8.5pt;">
            <tr>
                <th style="width: 20%; padding: 4px 6px;">MODE OF PAYMENT</th>
                <td style="width: 30%; padding: 4px 6px;"><strong>${application?.payment_mode_name || 'Annual'}</strong></td>
                <th style="width: 15%; padding: 4px 6px;">DUE DATES</th>
                <td style="width: 35%; padding: 4px 6px;">
                    <strong>First:</strong> Within 10 days from the date of billing by the Insurer.<br>
                    <strong>Renewal:</strong> Every 1st day of ${effectiveDate.toLocaleDateString('en-US', { month: 'long' })} of each subsequent year, with billing from the Insurer.<br>
                    <strong>Additions:</strong> Within 10 days from the date of billing by the Insurer.
                </td>
            </tr>
        </table>

        <table class="data-table" style="font-size: 8.5pt;">
            <thead>
                <tr>
                    <th style="width: 35%; padding: 4px 6px;">CLASSIFICATION & BENEFITS</th>
                    <th style="width: 25%; padding: 4px 6px;">AMOUNT OF INSURANCE</th>
                    <th style="width: 12%; padding: 4px 6px;">RATE/₱1,000</th>
                    <th style="width: 15%; padding: 4px 6px;">PER HEAD (₱)</th>
                    <th style="width: 13%; padding: 4px 6px;">TERMINATION AGE</th>
                </tr>
            </thead>
            <tbody>
                ${buildScheduleOfInsuranceRows(application)}
            </tbody>
        </table>

        <table class="data-table" style="margin-top: 10px; font-size: 8.5pt;">
            <tr style="background-color: #f1f5f9; font-weight: bold;">
                <td colspan="4" style="padding: 4px 6px;">SPECIAL RATES PER ₱1,000 BASED ON RENEWAL AGES:</td>
            </tr>
            <tr>
                <th style="width: 25%; padding: 4px 6px;">Age</th>
                <th style="width: 25%; padding: 4px 6px;">GTLIP Amount (%)</th>
                <th style="width: 25%; padding: 4px 6px;">Rate per ₱1,000</th>
                <th style="width: 25%; padding: 4px 6px;">Termination Age</th>
            </tr>
            <tr>
                <td style="padding: 3px 6px;">66 years old</td>
                <td style="padding: 3px 6px;">100%</td>
                <td style="padding: 3px 6px;">21.83</td>
                <td style="padding: 3px 6px;">70 years old</td>
            </tr>
            <tr>
                <td style="padding: 3px 6px;">67 years old</td>
                <td style="padding: 3px 6px;">100%</td>
                <td style="padding: 3px 6px;">21.83</td>
                <td style="padding: 3px 6px;">70 years old</td>
            </tr>
            <tr>
                <td style="padding: 3px 6px;">68 years old</td>
                <td style="padding: 3px 6px;">100%</td>
                <td style="padding: 3px 6px;">21.83</td>
                <td style="padding: 3px 6px;">70 years old</td>
            </tr>
            <tr>
                <td style="padding: 3px 6px;">69 years old</td>
                <td style="padding: 3px 6px;">100%</td>
                <td style="padding: 3px 6px;">21.83</td>
                <td style="padding: 3px 6px;">70 years old</td>
            </tr>
        </table>

        <div class="page-break"></div>

        <!-- ================= PAGES 6-7: EXPERIENCE REFUND & TURN-AROUND TIME (TAT) SLA ================= -->
        <table class="data-table">
            <tr>
                <th style="width: 25%;">EXPERIENCE REFUND PROVISIONS</th>
                <td>
                    An experience refund shall be made by the Insurer at the end of each Policy Year provided:
                    <ol style="padding-left: 20px; margin-top: 5px; margin-bottom: 8px; line-height: 1.4;">
                        <li>the number of Insureds at renewal date is at least ${numberOfLives};</li>
                        <li>this Policy is renewed;</li>
                        <li>all premiums due to the previous policy year have been paid; and contingent upon renewal.</li>
                    </ol>
                    The experience refund shall be 50% of Surplus, if any, for the previous policy year. Surplus shall be computed as follows:
                    <div style="font-weight: bold; font-style: italic; margin: 10px 0; text-align: center; font-size: 9.5pt;">
                        Surplus = 50% x (Premiums Paid – Claims Amount – Loss Carryover – IBNR provisions – Unearned Premiums – Reinsurance Premium)
                    </div>
                    <div style="font-size: 8.5pt; line-height: 1.4; padding-left: 10px;">
                        where:<br>
                        • <strong>“Premiums Paid”</strong> is the cost of insurance paid by the Policyholder at the contingent year;<br>
                        • <strong>“Claims Amount”</strong> is the amount of insurance payable to the Policyholder by the insurance provider;<br>
                        • <strong>“Loss Carryover”</strong> is the cumulative negative surpluses, if any, from previous policy years;<br>
                        • <strong>“IBNR”</strong> stands for “Incurred But Not Reported”. It is the estimated late reported claims;<br>
                        • <strong>“Unearned Premiums”</strong> is the remaining portion of net premium left until the expiry date;<br>
                        • <strong>“Reinsurance Premium”</strong> is the payment for reinsurance service.
                    </div>
                    <br>
                    Any such experience refund shall be paid in cash to the Policyholder or applied as payment for renewal premiums.
                </td>
            </tr>
            <tr>
                <th>TAXES</th>
                <td><strong>Inclusive</strong></td>
            </tr>
        </table>

        <div class="main-title" style="font-size: 13pt; margin-top: 25px;">TURN-AROUND TIME (TAT) SERVICE LEVEL AGREEMENT (SLA)</div>

        <table class="data-table" style="font-size: 8pt; margin-top: 10px;">
            <thead>
                <tr>
                    <th style="width: 22%;">TRANSACTION CATEGORY</th>
                    <th style="width: 8%;">TAT (WD)</th>
                    <th style="width: 22%;">RECKONING DATE</th>
                    <th style="width: 16%;">MODE OF COMMUNICATION</th>
                    <th style="width: 14%;">RESPONSIBLE</th>
                    <th style="width: 18%;">CONTACT DETAILS</th>
                </tr>
            </thead>
            <tbody>
                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">QUOTATION</td></tr>
                <tr>
                    <td>Presentation of Quotation</td>
                    <td></td>
                    <td></td>
                    <td>Printed copy, email</td>
                    <td>PhilLife</td>
                    <td>c/o PhilLife GMS</td>
                </tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">NEGOTIATION</td></tr>
                <tr>
                    <td>Presentation of Proposal</td>
                    <td>Open</td>
                    <td>-</td>
                    <td>Printed copy, email</td>
                    <td>PhilLife</td>
                    <td>c/o PhilLife GMS</td>
                </tr>
                <tr>
                    <td>Acceptance/Signing of Conforme</td>
                    <td>Open</td>
                    <td>-</td>
                    <td>Printed copy, email</td>
                    <td>Policyholder</td>
                    <td>c/o PhilLife GMS</td>
                </tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">NEW BUSINESS</td></tr>
                <tr><td>Submission of Group Application</td><td>Open</td><td>-</td><td>Printed copy, email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>
                <tr><td>Submission of Listing (NEL)</td><td>Open</td><td>-</td><td>Printed copy, email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>
                <tr><td>Submission of Individual Application (NML/MED)</td><td>Open</td><td>-</td><td>Printed copy, email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>
                <tr><td>Submission of Other UW Requirements</td><td>Open</td><td>-</td><td>Printed copy, email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>
                <tr><td>Submission of Adjustment Requirements</td><td>Open</td><td>-</td><td>Printed copy, email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>
                <tr><td>Submission of Claims Requirements</td><td>Open</td><td>-</td><td>Printed copy, email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">UNDERWRITING</td></tr>
                <tr><td>Evaluation of No-Evidence Limit (NEL)</td><td>1</td><td>Submission of Certified List</td><td>Email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Evaluation of Application - NMed</td><td>3</td><td>Submission of complete requirements</td><td>Email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Evaluation of Application - Med</td><td>7</td><td>Submission of complete requirements</td><td>Email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Issuance of Application-Med LOA – Letter of Approval</td><td>3</td><td>Receipt of request</td><td>Email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Evaluation of Adjustment</td><td>3</td><td>Submission of complete requirements</td><td>Email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">ISSUANCE</td></tr>
                <tr><td>Group Master Policy</td><td>7</td><td>Completion of Underwriting</td><td>Printed copy</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Enrollment Upload</td><td>1</td><td>Within 24 hours of loan/policy issuance</td><td>Soft copy, email</td><td>Policyholder/Phillife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Confirmation of Coverage (CoC)</td><td>7</td><td>Completion of Underwriting</td><td>Printed copy, email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Endorsement - Renewal</td><td>7</td><td>Completion of Underwriting</td><td>Printed copy, email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Endorsement - Amendment</td><td>7</td><td>Completion of Underwriting</td><td>Printed copy, email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">CANCELLATION</td></tr>
                <tr><td>Preparation of RCP</td><td></td><td>Receipt of request</td><td>Printed copy, email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">BILLING</td></tr>
                <tr><td>First Premium</td><td>7</td><td>Completion of Underwriting</td><td>Printed copy, email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Renewal</td><td>-30</td><td>Policy Anniversary</td><td>Printed copy, email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Addition/Deletion (Adjustment)</td><td>7</td><td>Completion of Underwriting</td><td>Printed copy, email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">COLLECTION</td></tr>
                <tr><td>First Premium</td><td>10</td><td>Due Date</td><td>Printed copy, email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>
                <tr><td>Renewal</td><td>30</td><td>Due Date</td><td>Printed copy, email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>
                <tr><td>Addition/Deletion (Adjustment)</td><td>10</td><td>Due Date</td><td>Printed copy, email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>
                <tr><td>Refund of Premium</td><td>15</td><td>Receipt of request</td><td>Email</td><td>Policyholder</td><td>c/o Policyholder</td></tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">CLAIMS</td></tr>
                <tr><td>Evaluation/Decision</td><td>15</td><td>Submission of Claims Requirements</td><td>Printed copy, email</td><td>PhilLife</td><td>Claims</td></tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">REPORTS</td></tr>
                <tr><td>Policy Issuance (Monthly)</td><td></td><td>Submission Report</td><td>Printed copy, email</td><td>PhilLife</td><td>ebam@phillife.com.ph</td></tr>
                <tr><td>Client Monies Reconciliation (Annual)</td><td></td><td>Submission Report</td><td>Printed copy, email</td><td>Policyholder/Phillife</td><td>ebam@phillife.com.ph/GMS</td></tr>

                <tr style="background-color: #e2e8f0; font-weight: bold;"><td colspan="6">COMMUNICATION</td></tr>
                <tr><td>Acknowledgement (Simple)</td><td>2</td><td>Simple: working dates from receipt</td><td>Email</td><td>Policyholder/Phillife</td><td>ebam@phillife.com.ph/GMS</td></tr>
                <tr><td>Acknowledgement (Complex)</td><td>2</td><td>Complex: working dates from receipt</td><td>Email</td><td>Policyholder/Phillife</td><td>ebam@phillife.com.ph/GMS</td></tr>
                <tr><td>Processing and Resolution (Simple)</td><td>7</td><td>Simple: working dates from receipt</td><td>Email</td><td>Policyholder/Phillife</td><td>ebam@phillife.com.ph/GMS</td></tr>
                <tr><td>Processing and Resolution (Complex)</td><td>7</td><td>Complex: working dates from receipt</td><td>Email</td><td>Policyholder/Phillife</td><td>ebam@phillife.com.ph/GMS</td></tr>
                <tr><td>Communication of resolution (Simple)</td><td>9</td><td>Simple: working dates from receipt</td><td>Email</td><td>Policyholder/Phillife</td><td>ebam@phillife.com.ph/GMS</td></tr>
                <tr><td>Communication of resolution (Complex)</td><td>47</td><td>Complex: working dates from receipt</td><td>Email</td><td>Policyholder/Phillife</td><td>ebam@phillife.com.ph/GMS</td></tr>
                <tr><td>Audit/Reconciliation Report</td><td>30</td><td>Within 30 calendar days after end of each quarter</td><td>Printed copy, email</td><td>Audit/Phillife</td><td>ebam@phillife.com.ph/Audit</td></tr>
            </tbody>
        </table>

        <div class="page-break"></div>

        <!-- ================= PAGE 8: CONFORME & SIGNATURE PAGE ================= -->
        <div style="font-size: 9.5pt; color: #4a5568; margin-bottom: 30px; font-weight: bold;">Continuation of ${policyNo}:</div>

        <div style="margin-top: 50px; text-align: center;">
            <div style="font-weight: bold; font-size: 25pt; text-transform: uppercase; letter-spacing: 0.5px;">PHILIPPINE LIFE FINANCIAL ASSURANCE CORPORATION</div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 8px; margin-bottom: 40px;">By:</div>

            <div style="width: 380px; margin: 0 auto; border-bottom: 1.5px solid #000; height: 30px;"></div>
            <div style="font-weight: bold; font-size: 13pt; margin-top: 8px; text-transform: uppercase;">MICHELLE L. AMBAGAN</div>
            <div style="font-size: 11pt; font-weight: 500;">Executive Vice-President & Chief Operating Officer</div>
            <div style="font-size: 11pt; margin-top: 12px;">Signed on _________________ at Makati City, Metro Manila.</div>
        </div>

        <div style="margin-top: 70px; text-align: center;">
            <div style="font-weight: bold; font-size: 14pt; text-transform: uppercase; letter-spacing: 1.5px;">CONFORME:</div>
            <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 15px;">${groupName}</div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 8px; margin-bottom: 40px;">By:</div>

            <div style="width: 380px; margin: 0 auto; border-bottom: 1.5px solid #000; height: 30px;"></div>
            <div style="font-weight: bold; font-size: 13pt; margin-top: 8px; text-transform: uppercase;">${addresseeName}</div>
            <div style="font-size: 11pt; font-weight: 500;">${addresseeDesignation}</div>
            <div style="font-size: 11pt; margin-top: 12px;">Signed on _________________ at ${application?.signing_location || businessAddress || 'Muntinlupa City, Metro Manila'}.</div>
        </div>

        <div class="page-break"></div>

        <!-- ================= SECTION I: INSURANCE PROVISIONS ================= -->
        <div class="main-title" style="font-size: 14pt;">I. INSURANCE PROVISIONS</div>
        
        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">WHO MAY BE INSURED</div>
        <p class="paragraph">
            All individuals satisfying the eligibility provision stated in the Policy Data Page shall be eligible for insurance under this Policy on the date stated in the Policy Data Page.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">ENROLLMENT</div>
        <p class="paragraph">
            Written application, on forms satisfactory to the Insurer, is required for each eligible individual in respect of whom an application for insurance under this Policy is being made. Eligible individuals accepted by the Insurer for insurance coverage under this Policy are hereinafter referred to as Insured.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">AMOUNT OF INSURANCE</div>
        <p class="paragraph">
            Each eligible individual shall be insured in accordance with the Schedule of Insurance stated in the Policy Data Page.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">EVIDENCE OF INSURABILITY</div>
        <p class="paragraph">
            No evidence of insurability shall be required for amounts of insurance not exceeding the no-evidence limit stated in the Policy Data Page, if any, subject to conditions stated therein and provided further that:
        </p>
        <ol style="padding-left: 25px; line-height: 1.5;">
            <li>the individual’s application for insurance is received by the Insurer not later than 31 days after his date of eligibility; nor</li>
            <li>the individual is not applying for reinstatement of his insurance that he has voluntarily terminated.</li>
        </ol>
        <p class="paragraph">
            The Insurer shall require evidence of insurability acceptable to it for amounts exceeding the no-evidence limit, if any, and to individuals not satisfying the above-stated conditions. Evidence of insurability shall also be required each time the aggregate increase in the amount of insurance of an individual over the amount of insurance covered by the previous evidence of insurability accepted by the Insurer, exceeds the no-evidence increase limit stated in the Policy Data Page.
        </p>
        <p class="paragraph">
            The insurance of an individual subject to evidence of insurability shall take effect on the date such evidence is approved by the Insurer.
        </p>
        <p class="paragraph">
            The Insurer reserves the right to charge extra premium for an individual who is required to submit evidence of insurability and is found to be substandard or entirely decline his insurance which is subject to the evidence of insurability, if such evidence is found not acceptable or should the Policyholder and/or individual refuse to pay such extra premium.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">CHANGE IN THE INSURED'S CLASSIFICATION</div>
        <p class="paragraph">
            If the Insured's classification changes, the amount of his insurance shall be changed on the date the said change in classification took effect. However, in case of employer-employee groups, if the Insured, on account of injury or disease is not actively working in full time employment on such date, the change shall take effect on the date he returns to full time active work.
        </p>
        <p class="paragraph">
            The Policyholder shall notify the Insurer of all such changes in classification on or before the premium due date immediately following such changes.
        </p>

        <div class="page-break"></div>

        <!-- ================= SECTION II: CONVERSION PROVISIONS ================= -->
        <div class="main-title" style="font-size: 14pt;">II. CONVERSION PROVISIONS</div>
        
        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">CONVERSION PRIVILEGE</div>
        <p class="paragraph">
            Each Insured shall have the privilege to convert his insurance hereunder into an individual life insurance policy, except term insurance and without riders, without showing evidence of insurability, after it has been terminated under any of the following circumstances:
        </p>
        <ol style="padding-left: 25px; line-height: 1.5; type: a;">
            <li>He is separated from the Policyholder or is no longer eligible for coverage under this Policy</li>
            <li>He has been insured under this Policy for at least five (5) years and this Policy is terminated or amended resulting to the termination of his insurance</li>
        </ol>
        <p class="paragraph">
            for an amount of insurance not exceeding the amount of his insurance under this Policy but not less than the minimum amount allowed by the Insurer for individual life insurance policies; and provided further that the Insured applies for conversion and pays the required premium for the individual life insurance policy within thirty-one (31) days from termination of his insurance under this Policy.
        </p>
        <p class="paragraph">
            The premium on the individual policy shall be at the Insurer’s then current rate applicable to type of individual life insurance policy and the amount of insurance applied for, to the class of risk to which he then belongs, and to his attained age on the date of issue of the individual policy.
        </p>
        <p class="paragraph">
            Such individual policy shall take effect immediately after the thirty-one (31) day conversion period.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">INSURANCE BENEFIT DURING THE CONVERSION PERIOD</div>
        <p class="paragraph">
            If the Insured dies during the conversion period, the amount of insurance he would have been entitled to have converted shall be payable under this Policy whether or not application for the individual policy or the payment of the first premium therefor has been made. Payment under this provision shall be made to the Insured’s beneficiary under this Policy.
        </p>
        <p class="paragraph">
            Any Insured who shall have exercised the conversion privilege herein granted may not be re-admitted for life insurance coverage under this Policy without the production, at his own expense, of evidence of insurability acceptable to the Insurer.
        </p>

        <div class="page-break"></div>

        <!-- ================= SECTION III: PREMIUM PROVISIONS ================= -->
        <div class="main-title" style="font-size: 14pt;">III. PREMIUM PROVISIONS</div>
        
        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PREMIUM RATES</div>
        <p class="paragraph">
            The premium rates per P 1,000.00 of insurance by class of Insureds shall be as stated in the Policy Data Page.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">GUARANTEE OF AND RIGHT TO CHANGE THE PREMIUM RATE</div>
        <p class="paragraph">
            The premium rates are guaranteed for the first policy year. The Insurer reserves the right to establish new premium rates at the beginning of any renewal year or whenever the terms of this Policy are changed.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">COMPUTATION OF PREMIUMS DUE</div>
        <p class="paragraph">
            The amount of each premium due shall be determined by multiplying the applicable premium rate per P 1,000.00 by the total amount of insurance in force on the said due date. A statement of premiums due including premium adjustments shall be furnished as of each due date by the Insurer.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PREMIUM ADJUSTMENTS</div>
        <p class="paragraph">
            Premiums shall be subject to adjustment on account of insurance added, increased, reduced and/or terminated. Premium adjustment during a policy year shall be calculated pro-rata using the premium rates effective at the beginning of that policy year, from the date the adjustment becomes effective to the next premium due date or as mutually agreed upon by the Policyholder and the Insurer.
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
            A grace period of thirty-one (31) days following the due date shall be allowed the Policyholder for the payment of each premium after the first during which insurance coverage hereunder shall remain in force. If any premium due is not paid within the grace period, this Policy shall automatically terminate at the expiration of the grace period, except that if the Policyholder shall have given the Insurer written notice in advance of an earlier date of termination, this Policy shall terminate as such earlier date. The Policyholder shall be liable to the Insurer for the payment of a pro-rata premium from the time this Policy was in force during the grace period.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">TAXES</div>
        <p class="paragraph">
            The taxes specified in the Policy Data Page, if any, shall be for the account of the Policyholder and shall be payable in the manner stated therein.
        </p>

        <div class="page-break"></div>

        <!-- ================= SECTION IV: CLAIM PROVISIONS ================= -->
        <div class="main-title" style="font-size: 14pt;">IV. CLAIM PROVISIONS</div>
        
        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">BENEFICIARY</div>
        <p class="paragraph">
            An Insured shall have the right to designate anybody, not disqualified by law, as his beneficiary or beneficiaries, and may at anytime, designate new beneficiary or beneficiaries by filing through the Policyholder a properly completed written request on a form satisfactory to the Insurer. Such change shall take effect only when recorded in writing by the Insurer at its Home Office but without prejudice to the Insurer on any payment made before receipt of such notice.
        </p>
        <p class="paragraph">
            The indemnity for the loss of life of an Insured shall be payable to his designated beneficiary or beneficiaries, if surviving; or if there be no beneficiaries designated or surviving at the death of the Insured, to the surviving class of the following classes of successive preference beneficiaries:
        </p>
        <div style="padding-left: 30px; margin-bottom: 10px; line-height: 1.5;">
            the Insured’s:<br>
            a. widow or widower<br>
            b. surviving children born to or legally adopted by the member<br>
            c. surviving parents<br>
            d. surviving brothers and sisters<br>
            e. executors and administrators
        </div>
        <p class="paragraph">
            An affidavit signed by any individual belonging to the first surviving class of successive preference beneficiaries described above, stating the names and addresses of the persons belonging to such class, shall be sufficient proof to the Insurer that the person or persons so named therein are the sole survivors of such class. Payment of the Insurer based on such affidavit shall be in full acquittance hereunder.
        </p>
        <p class="paragraph">
            If there be two or more beneficiaries, they shall share equally on the proceeds unless otherwise specified by the Insured. All other indemnities under this Policy shall be payable to the Insured.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">NOTICE OF CLAIM</div>
        <p class="paragraph">
            Written notice of claim must be given to the Insurer within thirty (30) days after the occurrence or commencement of any loss covered by this Policy or as soon thereafter as is reasonably possible. Failure to comply within the time provided shall not invalidate nor reduce the claim if it is given as soon as was reasonably possible.
        </p>
        <p class="paragraph">
            The Insurer upon receipt of a notice of claim shall furnish to the claimant such forms as are usually required by the Insurer for filing proofs of loss. If such forms are not so furnished by the Insurer within fifteen (15) days after its receipt of such notice, the claimant shall be deemed to have complied with the requirements of this Policy as to proof of loss upon submitting, within the time fixed in this Policy for filing proofs of loss, written proof covering the occurrence, character and extent of the loss for which claim is made.
        </p>
        <p class="paragraph">
            Written notice of claim given by or in behalf of the Insured or Beneficiary, to the Insurer or to any authorized representative of the Insurer, with information sufficient to identify the Insured, shall be deemed to be notice to the Insurer.
        </p>

        <div class="page-break"></div>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PROOF OF LOSS</div>
        <p class="paragraph">
            Written proof of loss must be furnished to the Insurer within ninety (90) days from the date of the loss to which the claim is made. Failure to comply within the time provided shall not invalidate nor reduce the claim if it is shown that it was not reasonably possible to submit such proof within the required time and that proof was submitted as soon as was reasonably possible.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PAYMENT OF CLAIM</div>
        <p class="paragraph">
            The amount of any loss for which the Insurer may be liable under this Policy, shall be paid within thirty (30) days after proof of loss is received by the Insurer and ascertainment of the loss is made by agreement between the Insured and the Insurer or by arbitration; but if such ascertainment is not made within sixty (60) days after such receipt by the Insurer of the proof of loss, then the loss shall be paid within ninety (90) days after such receipt.
        </p>
        <p class="paragraph">
            Refusal or failure to pay the claim within the time prescribed herein shall entitle the Insured to collect interest for the duration of the delay at the rate of twice the ceiling prescribed by the Monetary Board, unless such refusal or failure to pay is based on the ground that the claim is fraudulent.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">PHYSICAL EXAMINATION AND AUTOPSY</div>
        <p class="paragraph">
            The Insurer, at its own expense, shall have the right and opportunity to examine an insured when and as often as the Insurer may reasonably require while the claim is pending hereunder, and also the right and opportunity to make an autopsy in case of death where it is not forbidden by law.
        </p>

        <div class="page-break"></div>

        <!-- ================= SECTION V: GENERAL PROVISIONS ================= -->
        <div class="main-title" style="font-size: 14pt;">V. GENERAL PROVISIONS</div>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">THE CONTRACT</div>
        <p class="paragraph">
            This Policy, the Policy Data Page, the Policyholder’s application attached hereto, any riders, endorsements or amendments herein and the Insureds’ applications (including evidence of insurability, if any) constitute the entire contract. All statements made by the Policyholder or by the Insureds shall be deemed representations and not warranties. No statement made by any Insured shall be used to contest the validity of the insurance unless it is written and signed by him and a copy furnished to him or to his beneficiaries.
        </p>
        <p class="paragraph">
            No agent is authorized to alter or amend this Policy, to accept premiums in arrears or to extend the due date of any premium, to waive any notice or proof of claim required by the Insurer, or to extend the date before which any such notice or proof be submitted.
        </p>
        <p class="paragraph">
            This Policy may at any time be amended and changed by written agreement between the Insurer and the Policyholder. Any such amendment shall be binding on all Insureds whether their insurance became effective prior to, on, or after the effective date of the amendment.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">POLICY EFFECTIVITY</div>
        <p class="paragraph">
            This Policy becomes effective only upon the payment of its initial premium and its delivery to the Policyholder. The Effective Date, shown in the Policy Data Page shall be used to determine premium due dates, policy years and policy anniversaries.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">DATA REQUIRED</div>
        <p class="paragraph">
            The Policyholders shall furnish the Insurer promptly in writing all information necessary for the efficient administration of this Policy including (1) individuals becoming eligible and their respective dates of birth and amount of insurance (2) Insureds whose insurance terminates and their respective termination dates, and (3) changes in the classification and amounts of insurance of an Insured, if any.
        </p>
        <p class="paragraph">
            All documents furnished to the Policyholder by an individual in connection with his insurance and such other records as may have a bearing on the insurance under this Policy, shall be open for inspection by the Insurer at reasonable hours.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">CLERICAL ERROR</div>
        <p class="paragraph">
            Clerical error in keeping the records shall not invalidate an insurance which otherwise is validly in force nor shall it continue an insurance which otherwise is validly terminated.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">AGE AND MISSTATEMENT OF AGE</div>
        <p class="paragraph">
            Age, unless defined otherwise, shall mean age at last birthday. The Insurer may request proof of age of any Insured. Benefits payable are suspended until the requested proof is given.
        </p>
        <p class="paragraph">
            If the age of the Insured has been misstated, the amount of insurance shall be adjusted to the amount that the premium would have purchased at the correct age, applicable risk class and applicable premium rates as of the effective date.
        </p>
        <p class="paragraph">
            If at the correct age, the Insured is not eligible for any coverage under this Policy or its riders, the Insurer shall refund the corresponding premiums actually received by the Insurer.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">RENEWAL</div>
        <p class="paragraph">
            The Policyholders shall be entitled to renew this Policy upon payment of the premium due on the effective date of renewal.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">TERMINATION OF THIS POLICY</div>
        <p class="paragraph">
            This Policy shall automatically terminate if premiums due remain unpaid beyond the grace period as stated in the Grace Period Provision of this Policy.
        </p>
        <p class="paragraph">
            The Policyholder may discontinue this Policy at any time by giving written notice to the Insurer at least 31 days prior to the date of termination.
        </p>
        <p class="paragraph">
            The Insurer may also terminate this Policy at any time by giving at least 31 days prior written notice to the Policyholder if the number of Insureds is less than the minimum number stated in the Policy Data Page or the percentage of Insureds is less than the minimum percentage stated in the Policy Data Page.
        </p>
        <p class="paragraph">
            Notice of termination shall be in writing, mailed or delivered to the Policyholder at the address shown in this Policy or application.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">TERMINATION OF INDIVIDUAL INSURANCE</div>
        <p class="paragraph">
            The insurance of all Insureds hereunder shall automatically terminate on the earliest of the following:
        </p>
        <ol style="padding-left: 25px; line-height: 1.5;">
            <li>the date this Policy terminates; or</li>
            <li>the policy anniversary immediately succeeding the date he attains the termination age stated in the Policy Data Page; or</li>
            <li>the date the Insured enters military, naval or air service; or</li>
            <li>the date the relationship between the Insured and the Policyholder as stated in the Eligibility Provision of this policy ends; or</li>
            <li>in case of employer-employee groups, the date the Insured ceases active work for the Policyholder except that in the event of disability, temporary lay-off or approved leave of absence, payment of the required premium shall continue the insurance in force:
                <ol style="padding-left: 20px; type: a;">
                    <li>in case of disability, during the continuance of disability; or</li>
                    <li>in case of temporary lay-off or approved leave of absence, for three (3) months.</li>
                </ol>
            </li>
        </ol>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">LEGAL PROCEEDINGS</div>
        <p class="paragraph">
            If a claim is made and an action or suit is not commenced either with the Insurance Commission or any court of competent jurisdiction within 24 months from notice of denial of claim, then the claim shall for all purposes be deemed to have been abandoned and shall not thereafter be reopened or reconsidered.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">ASSIGNMENTS</div>
        <p class="paragraph">
            No assignment of this Policy by the Policyholder shall be binding upon the Insurer unless made in writing and properly filed at the Home Office of the Insurer. No assignment by any individual of any insurance under this Policy shall be valid. Any assignment by the beneficiary subsequent to the death of an individual shall not be binding upon the Insurer until the original assignment or duplicate thereof is received at the Home Office of the Insurer and the assignment is acknowledged in writing by the Insurer prior to the payment of the proceeds. The Insurer does not assume any responsibility for the validity or sufficiency of any assignment.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">INCONTESTABILITY</div>
        <p class="paragraph">
            This policy shall be incontestable after one (1) year from the effective date or the date of its last reinstatement, except for non-payment of premiums. Similarly, any individual insurance, or any additional portion thereof, shall not be contested after it has been in force during the lifetime of the Insured for a period of one (1) year from its effective date or date of last reinstatement, except for non-payment of premium.
        </p>
        <p class="paragraph">
            No statement made by the Insured relating to his insurability shall be used in contesting the validity of the insurance with respect to which such statement was made after such insurance has been in force during the Insured’s lifetime for a period of one (1) year from its effective date or the date of last reinstatement, nor unless contained in a written instrument signed by him.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">SUICIDE CLAUSE</div>
        <p class="paragraph">
            The Insurer will not be liable if an Insured dies within one (1) year after the effective date or date of last reinstatement, provided however, that suicide committed in the state of insanity shall be compensable regardless of the date of commission.
        </p>
        <p class="paragraph">
            Where suicide is not compensable, the liability of the Insurer will be limited to the return of premiums pertaining to the Insured.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">INDIVIDUAL CONFIRMATION OF INSURANCE COVERAGE</div>
        <p class="paragraph">
            The Insurer shall issue to the Policyholder, for delivery to each Insured, an individual confirmation of insurance coverage setting forth a summary of the essential features of the individual insurance coverage and other privileges to which the Insured is entitled. These forms do not constitute a contract but are merely informative statements setting forth the benefits and the claim procedures and are not transferable.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">REINSTATEMENT</div>
        <p class="paragraph">
            This Policy may be reinstated any time after it has been terminated provided the conditions set by the Insurer at the time of reinstatement are met and the appropriate premiums are paid. Only losses that occur after the effective date of reinstatement shall be covered.
        </p>
        <p class="paragraph">
            If an Insured whose insurance is terminated in accordance with the termination provision of this Policy again becomes entitled to participate for insurance hereunder, such individual may again become insured under this Policy by submitting, without expense to the Insurer, an evidence of insurability acceptable to it. His insurance shall take effect once the evidence is approved by the Insurer and the corresponding premium is paid.
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
            This Policy shall be kept in the main office and in the custody of an officer of the Policyholder. It will be available to the Insureds for their inspection during regular business hours of the Policyholder.
        </p>

        <div class="section-header" style="font-size: 11pt; border-bottom: none; margin-top: 15px;">POLICY DATA PAGE PROVISIONS</div>
        <p class="paragraph">
            The Provisions stated in the Policy Data Page shall supersede any inconsistent provision herein.
        </p>

        <div class="page-break"></div>        
        <div style="border: 3px double #000; padding: 12px 15px; margin-top: 25px; text-align: justify; font-size: 8.5pt; line-height: 1.45;">
            <div style="text-align: center; font-size: 11pt; font-weight: bold; margin-bottom: 8px; letter-spacing: 0.5px;">IMPORTANT NOTICE</div>
            The Insurance Commission, with offices in Manila, Cebu and Davao, is the government office in charge of the enforcement of all laws related to insurance and has supervision over insurance providers and intermediaries. It is ready at all times to assist the general public in matters pertaining to insurance. For any inquiries or complains, please contact the Public Assistance and Mediation Division (PAMD) of the Insurance Commission at 1071 United Nations Avenue, Ermita, Manila with telephone/cellphone numbers (02) 8523-8461 local 103 or 127, 09171160007 (Globe), and 09999930637 (Smart), and with email address <a href="mailto:publicassistance@insurance.gov.ph" style="color: #0d47a1; text-decoration: underline;">publicassistance@insurance.gov.ph</a>. The official website of the Insurance Commission is <a href="https://www.insurance.gov.ph" style="color: #0d47a1; text-decoration: underline;">www.insurance.gov.ph</a>.
        </div>

        <div class="page-break"></div>

        <!-- ================= ATTACHED RIDER TEMPLATES ================= -->
        ${riderTemplatesHtml}

        <!-- ================= PAGE 23: SIGN-OFF CHECKLIST ================= -->
        <div class="main-title" style="font-size: 15pt; margin-bottom: 15px;">GROUP POLICY SIGN-OFF</div>

        <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; margin-bottom: 10px; font-size: 9.5pt;">
            <tr>
                <td style="padding: 5px 8px; border: 1px solid #000; width: 30%;">Policyholder</td>
                <td style="padding: 5px 8px; border: 1px solid #000;">: <strong>${groupName}</strong></td>
            </tr>
            <tr>
                <td style="padding: 5px 8px; border: 1px solid #000;">Group Master Policy Number</td>
                <td style="padding: 5px 8px; border: 1px solid #000;">: <strong>${policyNo}</strong></td>
            </tr>
            <tr>
                <td style="padding: 5px 8px; border: 1px solid #000;">Plan of Insurance</td>
                <td style="padding: 5px 8px; border: 1px solid #000;">: <strong>${basicPlanName}</strong></td>
            </tr>
        </table>

        <div style="font-size: 8.5pt; color: #4a5568; margin-bottom: 15px;">
            Printing Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <div style="font-weight: bold; text-align: center; font-size: 12pt; margin-bottom: 2px;">GROUP MASTER POLICY CHECKLIST</div>
        <div style="font-size: 8.5pt; text-align: center; font-style: italic; margin-bottom: 10px;">
            Pages to be signed (Those with ✓ marks only.)<br>
            Please affix your signature on this certification below to keep the policy contract clean. Thank you.
        </div>

        <table class="data-table">
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Description</th>
                    <th>Actuarial</th>
                    <th>Underwriting</th>
                    <th>Group Sales</th>
                    <th>Ops Head</th>
                    <th>EVP & COO</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>Cover Page</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                </tr>
                <tr>
                    <td>2-8</td>
                    <td>Policy Data Page & Schedule</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                </tr>
                <tr>
                    <td>9-17</td>
                    <td>Policy Provisions</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                    <td>✓</td>
                </tr>
                ${(() => {
                    const riderCount = Array.isArray(application?.riders) && application.riders.length > 0 ? application.riders.length : 0;
                    if (riderCount === 0) {
                        return `
                            <tr>
                                <td>N/A</td>
                                <td>Riders</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                                <td>-</td>
                            </tr>
                        `;
                    }

                    return `
                        <tr>
                            <td>{{RIDER_PAGE_RANGE}}</td>
                            <td>Riders</td>
                            <td>✓</td>
                            <td>✓</td>
                            <td>✓</td>
                            <td>✓</td>
                            <td>✓</td>
                        </tr>
                    `;
                })()}
            </tbody>
        </table>

        <div class="section-header" style="margin-top: 15px; font-size: 11pt;">CERTIFICATION</div>
        <p class="paragraph" style="font-size: 9pt; text-indent: 0; margin-bottom: 15px;">
            We, the undersigned, certify that the Policy Data Page, Schedule of Insurance, Premium and policy contract assembly of the Account described herein is correct, and hereby endorsed for final signature by the EVP and COO.
        </p>

        <table class="data-table" style="margin-top: 10px; font-size: 9pt;">
            <thead>
                <tr>
                    <th style="width: 50%; text-align: left;">SIGNATORIES</th>
                    <th style="width: 50%; text-align: left;">DATE AND SIGNATURE</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>REYMARK M. MAGDATO</strong><br>
                        <span style="font-size: 8pt; color: #4a5568;">EBAM/UNDERWRITING</span>
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td>
                        <strong>IRVIN C. BO</strong><br>
                        <span style="font-size: 8pt; color: #4a5568;">EBAM/UNDERWRITING</span>
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td>
                        <strong>MARIA FE SALANIO</strong><br>
                        <span style="font-size: 8pt; color: #4a5568;">EBAM/UNDERWRITING</span>
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td>
                        <strong>FERDINAND A. RECIO</strong><br>
                        <span style="font-size: 8pt; color: #4a5568;">OPERATIONS</span>
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td>
                        <strong>RONALD Y. TABALADA</strong><br>
                        <span style="font-size: 8pt; color: #4a5568;">ACTUARIAL</span>
                    </td>
                    <td></td>
                </tr>
                <tr>
                    <td>
                        <strong>MARVIN M. CATAPANG</strong><br>
                        <span style="font-size: 8pt; color: #4a5568;">GROUP SALES</span>
                    </td>
                    <td></td>
                </tr>
            </tbody>
        </table>

    </div>
</body>
</html>
    `;
}
