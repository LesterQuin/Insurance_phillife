/**
 * Group Total and Permanent Disability Rider (GTPDR) Template
 * 
 * @param {Object} application - Application details (e.g. effective_date)
 * @param {Object} details - Additional parameters (logoDataUri, isReview, etc.)
 * @param {Object} rider - Rider metadata (acronym, rider_name, min_amount, max_amount, unit_value, etc.)
 * @returns {string} HTML string for PDF rendering
 */
export default function generateGTPDRTemplate(application = {}, details = {}, rider = {}) {
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
    const riderName = rider?.rider_name || 'GROUP TOTAL AND PERMANENT DISABILITY RIDER';
    const acronym = rider?.acronym || 'GTPDR';
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
            padding: 0 20mm 15mm 20mm;
            box-sizing: border-box;
            position: relative;
            background-color: #ffffff;
        }
        .header {
            display: flex;
            justify-content: flex-start;
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
            margin-top: 22px;
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
            margin-bottom: 12px;
            line-height: 1.45;
        }
        ol, ul {
            margin-top: 5px;
            margin-bottom: 12px;
            padding-left: 25px;
        }
        li {
            text-align: justify;
            margin-bottom: 8px;
            padding-left: 5px;
            line-height: 1.45;
        }
        .document-code-suffix {
            text-align: right;
            font-size: 8.5pt;
            color: #9aa0a6;
            margin-top: 20px;
            margin-bottom: 10px;
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

        <!-- Introductory Provisions -->
        <p class="paragraph">
            The following provisions form part of the Policy if its description title is indicated in the Policy Data Page. These conditions shall apply only to this Rider and not to any other portion of the Policy to which this Rider is attached, herein referred to simply as the Policy, unless specifically provided otherwise.
        </p>
        <p class="paragraph">
            The provisions of the Policy not inconsistent with the provisions of this Rider shall apply to this Rider.
        </p>
        <p class="paragraph">
            Provisions stated in the Policy Data Page pertaining to this Rider, if any, shall supersede any provisions to the contrary hereunder.
        </p>

        <!-- Effective Date -->
        <div class="section-title">Effective Date</div>
        <p class="section-content paragraph">
            This Rider shall become effective on the effective date of the Policy unless a different date is indicated above.
        </p>

        <!-- Insurance Premiums -->
        <div class="section-title">Insurance Premiums</div>
        <p class="section-content paragraph">
            The insurance premium pertaining to this Rider shall be as specified in the Policy Data Page.
        </p>

        <!-- Amount of Insurance -->
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

        <!-- Total and Permanent Disability Benefit -->
        <div class="section-title">Total and Permanent Disability Benefit</div>
        <p class="section-content">
            The Insured shall be entitled to receive the amount of insurance under this Rider if he:
        </p>
        <ol style="list-style-type: decimal;">
            <li>Becomes totally disabled by bodily injury or disease</li>
            <li>Is thereby prevented from engaging in any occupation for compensation or profit</li>
            <li>Has been disabled for a continuous period of at least six (6) months</li>
            <li>Has not exercised his conversion rights.</li>
        </ol>
        <p class="section-content paragraph">
            Upon availment of said benefit, all insurance under the Policy with respect to such Insured shall immediately cease.
        </p>

        <!-- Settlement Option -->
        <div class="section-title">Settlement Option</div>
        <p class="section-content paragraph">
            The Insured may elect to receive the benefit in monthly installments, instead of lump sum by filing a written request with the Insurer, subject to the Insurer’s prevailing terms and conditions.
        </p>

        <!-- Exclusions -->
        <div class="section-title">Exclusions</div>
        <p class="section-content">
            No payment shall be made under this Rider for any disability resulting from or caused directly or wholly, by:
        </p>
        <ol style="list-style-type: decimal;">
            <li>Any attempt at self-destruction while sane or insane or</li>
            <li>Disease which originated, or bodily injury which occurred, before the effective date of this Rider if the Insured received medical or surgical treatment for such disease or injury within three (3) years immediately before such effective date, unless such treatment was disclosed in the application for coverage; or</li>
            <li>War, declared or undeclared, strike, riot, civil war, revolution or any war-like operations or while under orders for war-like operations or restoration of public order</li>
            <li>Poison, gas or fumes (voluntarily or involuntarily taken), atomic explosions, nuclear fission, or radioactive gas.</li>
        </ol>

        <!-- Termination -->
        <div class="section-title">Termination</div>
        <p class="section-content paragraph">
            This Rider shall automatically terminate if premiums due for this Rider remain unpaid beyond the grace period as stated in the Grace Period Provision of the Policy.
        </p>
        <p class="section-content paragraph">
            The Policyholder may discontinue this Rider at any time by giving written notice to the Insurer at least 31 days prior to the date of termination.
        </p>
        <p class="section-content">
            The individual insurance under this Rider shall automatically terminate on the earliest of the following:
        </p>
        <ol style="list-style-type: decimal;">
            <li>Termination of this Rider or the Policy</li>
            <li>Attainment of the Insured of the termination age for this Rider as stated in the Policy Data Page</li>
            <li>Termination of the Insured’s individual insurance under the Policy</li>
        </ol>

        <!-- Notice of Disability -->
        <div class="section-title">Notice of Disability</div>
        <p class="section-content paragraph">
            Written notice of claim must be given to the Insurer within thirty (30) days after the occurrence or commencement of any disability covered hereunder. Failure to give notice within such time shall not invalidate nor reduce any claim if it is shown that it was not reasonably possible to submit such notice within the required period.
        </p>
        <p class="section-content paragraph">
            The Insurer, upon receipt of such notice of disability, shall provide forms for filing proof of claim. If such forms are not provided within fifteen (15) days after the receipt of notice of injury, the claimant shall be deemed to have complied with the requirements of this Rider as to proof of claim upon submitting within ninety (90) days after the date of the disability for which the claim is made, written proof covering the occurrence, character and extent of disability for which claim is made.
        </p>

        <!-- Proof of Claim -->
        <div class="section-title">Proof of Claim</div>
        <p class="section-content paragraph">
            Written proof of disability herein referred to must be submitted to the Insurer on the Insurer's form within ninety (90) days after the date of the disability for which claim is made. Failure to submit written proof of disability within such time shall not invalidate nor reduce any claim if it is shown that it was not reasonably possible to submit such proof within the required time and that proof was submitted as soon as was reasonably possible.
        </p>

        <!-- Document Code Suffix -->
        <div class="document-code-suffix">
            GTPDR2012v01
        </div>

                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
    `;
}
