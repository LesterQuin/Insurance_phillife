/**
 * Group Accidental Medical Expense Reimbursement Rider (GAMERR) Template
 * Generates an HTML string formatted as a professional insurance rider document.
 * 
 * @param {Object} application - The application/proposal data.
 * @param {Object} details - Helper details (e.g., logoDataUri, effectiveDate).
 * @param {Object} rider - Rider properties from the database (e.g., min_amount, max_amount, unit_value).
 */
export const generateGAMERRTemplate = (application = {}, details = {}, rider = {}) => {
    // Determine effective date (either from details, application, or default to a placeholder)
    let effectiveDateStr = '__________________';
    const rawDate = details?.effectiveDate || application?.effective_date;
    if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
            effectiveDateStr = d.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    const logoDataUri = details?.logoDataUri || '';
    const riderName = rider?.rider_name || 'Group Accidental Medical Expense Reimbursement Rider';
    const acronym = rider?.acronym || 'GAMERR';
    const showReviewWatermark = details?.isReview !== false;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${riderName} (${acronym})</title>
    <style>
        @page {
            size: A4;
            margin: 12mm 20mm 25mm 20mm;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #202124;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-size: 11pt;
        }
        .rider-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 20mm 20mm 20mm;
            box-sizing: border-box;
            position: relative;
            background-color: #ffffff;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #C53030;
            padding-bottom: 6px;
            margin-bottom: 15px;
            margin-top: 0;
        }
        .logo-container img {
            max-height: 75px;
            display: block;
        }
        .company-info {
            text-align: right;
            font-size: 7.5pt;
            color: #718096;
            line-height: 1.2;
        }
        .company-info strong {
            color: #1A202C;
        }
        .title-section {
            text-align: center;
            margin-bottom: 5px;
        }
        h1 {
            font-size: 15pt;
            color: #0d47a1;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 700;
        }
        .subtitle {
            font-size: 12pt;
            font-weight: bold;
            color: #333333;
            margin: 0;
        }
        .effective-date-line {
            font-size: 11pt;
            margin-bottom: 20px;
            font-weight: 600;
            text-align: center;
        }
        .paragraph {
            text-align: justify;
            margin-top: 0;
            margin-bottom: 5px;
            text-indent: 30px;
            line-height: 1.45;
        }
        .section-title {
            font-size: 11pt;
            font-weight: bold;
            color: #0d47a1;
            margin-top: 25px;
            margin-bottom: 8px;
            text-transform: uppercase;
            border-bottom: 1.5px solid #e0e0e0;
            padding-bottom: 2px;
            page-break-after: avoid;
            break-after: avoid;
        }
        .section-content {
            text-align: justify;
            margin-top: 0;
            margin-bottom: 15px;
            line-height: 1.45;
        }
        ol {
            margin-top: 5px;
            margin-bottom: 15px;
            padding-left: 20px;
        }
        li {
            text-align: justify;
            margin-bottom: 10px;
            padding-left: 5px;
            line-height: 1.45;
        }
        .footer-code {
            text-align: right;
            font-size: 8.5pt;
            color: #9aa0a6;
            margin-top: 40px;
            font-family: 'Courier New', Courier, monospace;
            font-weight: bold;
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .watermark-review {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 75pt;
            color: rgba(220, 220, 220, 0.25);
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 8px;
            pointer-events: none;
            z-index: 9999;
            user-select: none;
            white-space: nowrap;
        }
        .layout-table, .layout-table tr, .layout-table td {
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
            width: 100%;
        }
        .layout-table > thead > tr > td,
        .layout-table > tbody > tr > td {
            border: none !important;
            padding: 0 !important;
            background: transparent !important;
        }
        @media print {
            body {
                background-color: transparent;
                font-size: 10.5pt;
            }
            .rider-container {
                max-width: 100%;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    ${showReviewWatermark ? `<div class="watermark-review">FOR REVIEW</div>` : ''}
    <div class="rider-container">
        <table class="layout-table">
            <thead>
                <tr>
                    <td>
                        <!-- Logo and Header -->
                        <div class="header">
                            <div class="logo-container">
                                ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" />` : `<strong>PHILIPPINE LIFE FINANCIAL ASSURANCE CORP.</strong>`}
                            </div>
                        </div>
                    </td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>

        <!-- Title Section -->
        <div class="title-section">
            <h1>${riderName} (${acronym})</h1>
        </div>

        <!-- Effective Date Line -->
        <div class="effective-date-line">
            Effective Date: &nbsp;<u><strong>&nbsp;${effectiveDateStr}&nbsp;</strong></u>
        </div>

        <!-- Introductory Clauses -->
        <p class="section-content paragraph">
            The following provisions form part of the Policy if its description title is indicated in the Policy Data Page. These conditions shall apply only to this Rider and not to any other portion of the Policy to which this Rider is attached, herein referred to simply as the Policy, unless specifically provided otherwise.
        </p>
        <p class="section-content paragraph">
            The provisions of the Policy not inconsistent with the provisions of this Rider shall apply to this Rider.
        </p>
        <p class="section-content paragraph">
            Provisions stated in the Policy Data Page pertaining to this Rider, if any, shall supersede any provisions to the contrary hereunder.
        </p>

        <div class="section-title">Effective Date</div>
        <p class="section-content paragraph">
            This Rider shall become effective on the effective date of the Policy unless a different date is indicated above.
        </p>

        <div class="section-title">Insurance Premiums</div>
        <p class="section-content paragraph">
            The insurance premium pertaining to this Rider shall be as specified in the Policy Data Page.
        </p>

        <div class="section-title">Amount of Insurance</div>
        <p class="section-content paragraph">
            The Amount of Insurance under this Rider shall be as specified in the Policy Data Page.
            ${(rider?.min_amount || rider?.max_amount) ? `
            <br><br>
            <span style="font-size: 9.5pt; color: #5f6368; font-weight: 600; text-indent: 0; display: block; margin-top: 10px;">
                RIDER LIMITS FOR REFERENCE:
                ${rider.min_amount ? `Min Amount: Php ${Number(rider.min_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}
                ${rider.max_amount ? ` &nbsp;|&nbsp; Max Amount: Php ${Number(rider.max_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}
                ${rider.unit_value ? ` &nbsp;|&nbsp; Unit Value: Php ${Number(rider.unit_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : ''}
            </span>
            ` : ''}
        </p>

        <div class="section-title">Medical Expense Reimbursement Benefit</div>
        <p class="section-content paragraph">
            Upon receipt and approval by the Insurer of due proof that an Insured has sustained accidental bodily injuries effected directly and independently of all other causes and, within one hundred eighty (180) days after the date of accident, needed medical treatment, the Insurer shall, subject to the limitations and provisions hereunder and of the Policy, reimburse the actual medical expense incurred up to the Amount of Insurance of this Rider and provided further that the total actual medical expense is in excess of the minimum reimbursement amount specified in the Policy Data Page.
        </p>
        <p class="section-content paragraph">
            Medical expense shall mean the reasonable and customary Physician’s fees, hospitalization fees, medical supplies and medications, all of which must have been necessary and reasonable incurred in the medical or surgical treatment of the bodily injury covered by this Rider. Such medical or surgical treatment must be administered on or prescribed by a legally qualified surgeon or physician.
        </p>

        <div class="section-title">Exclusions</div>
        <p class="section-content" style="margin-bottom: 10px;">
            No payment shall be made under this Rider for any injury resulting from or caused directly or wholly, by:
        </p>
        <ol>
            <li>Bodily or mental infirmity, hernia, ptomaines, or bacterial infection (except pyogenic infection which shall occur with and through an accidental cut or wound) or disease or sickness of any kind; or</li>
            <li>Poison, gas or fumes (voluntarily or involuntarily taken), atomic explosions, nuclear fission, or radioactive gas; or</li>
            <li>Accident occurring while or because the Insured is affected by alcohol or any unprescribed drug; or</li>
            <li>Self-destruction or any attempt threat while sane or insane; or</li>
            <li>Participation in any brawl; or</li>
            <li>Any violation or attempt of violation of the law or resistance to arrest; or</li>
            <li>Murder or provoked assault; or</li>
            <li>War, declared or undeclared, strike, riot, civil war, revolution or any war-like operations, or while under orders for war-like operations or restoration of public order; or</li>
            <li>Entering, operating, or servicing, ascending from or with any aerial or marine device or conveyance except while travelling as a passenger in an aircraft or marine transportation operated by a commercial passenger airline or shipping line on a scheduled air or sea service over an established passenger route.</li>
        </ol>

        <div class="section-title">Termination</div>
        <p class="section-content paragraph">
            This Rider shall automatically terminate if premiums due for this Rider remain unpaid beyond the grace period as stated in the Grace Period Provision of the Policy.
        </p>
        <p class="section-content paragraph">
            The Policyholder may discontinue this Rider at any time by giving written notice to the Insurer at least 31 days prior to the date of termination.
        </p>
        <p class="section-content paragraph">
            The individual insurance under this Rider shall automatically terminate on the earliest of the following:
        </p>
        <ol>
            <li>Termination of this Rider or the Policy; or</li>
            <li>Attainment of the Insured of the termination age for this Rider as stated in the Policy Data Page; or</li>
            <li>Termination of the Insured’s individual insurance under the Policy.</li>
        </ol>
        <p class="section-content paragraph">
            Termination of this Rider or the individual insurance shall be without prejudice to any claim arising before such termination.
        </p>

        <div class="section-title">Notice of Injury</div>
        <p class="section-content paragraph">
            Written notice of the injury upon which claim under this Rider may be based must be given to the Insurer within thirty (30) days after the occurrence or commencement of any loss covered hereunder. Failure to give notice within such time shall not invalidate nor reduce any claim if it is shown that it was not reasonably possible to submit such notice within the required period.
        </p>
        <p class="section-content paragraph">
            The Insurer, upon receipt of such notice of injury, shall provide forms for filing proof of claim. If such forms are not provided within fifteen (15) days after the receipt of notice of injury, the claimant shall be deemed to have complied with the requirements of this Rider as to proof of claim upon submitting, within ninety (90) days after the date of the loss for which the claim is made, written proof covering the occurrence, character and extent of the loss for which claim is made.
        </p>

        <div class="section-title">Proof of Claim</div>
        <p class="section-content paragraph">
            Written proof of loss herein referred to must be submitted to the Insurer on the Insurer's form within ninety (90) days after the date of the disability for which claim is made. Failure to submit written proof of disability within such time shall not invalidate nor reduce any claim if it is shown that it was not reasonably possible to submit such proof within the required time and that proof was submitted as soon as was reasonably possible.
        </p>

        <!-- Document Code/Version Suffix -->
        <div class="footer-code">
            GAMERR2012v01
        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
    `;
};
