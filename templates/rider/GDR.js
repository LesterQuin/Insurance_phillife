/**
 * Group Dengue Rider (GDR) Template
 * 
 * @param {Object} application - Application details (e.g. effective_date)
 * @param {Object} details - Additional parameters (logoDataUri, isReview, etc.)
 * @param {Object} rider - Rider metadata (acronym, rider_name, min_amount, max_amount, unit_value, etc.)
 * @returns {string} HTML string for PDF rendering
 */
export default function generateGDRTemplate(application = {}, details = {}, rider = {}) {
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
    const riderName = rider?.rider_name || 'GROUP DENGUE RIDER';
    const acronym = rider?.acronym || 'GDR';
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
            The following provisions form part of the Policy if its description title indicated in the Policy Data Page. These conditions shall apply only to this Rider and not to any other portion of the Policy to which this Rider is attached, herein referred to simply as the Policy, unless specifically provided otherwise.
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

        <!-- Benefit -->
        <div class="section-title">Benefit</div>
        <p class="section-content paragraph">
            Upon receipt and approval by the Insurer of due proof that an Insured was confined in a hospital due to Dengue Hemorrhagic Fever while this Rider is in force, the Insurer shall, subject to the limitations and provisions hereunder and of the Policy, reimburse the actual hospitalization expense incurred up to the Amount of Insurance of this Rider as specified in the Policy Data Page.
        </p>
        <p class="section-content paragraph">
            In case of repeated hospital confinements, the maximum amount of benefit to be paid within one policy year shall be the Amount of Insurance of this Rider.
        </p>

        <!-- Waiting Period -->
        <div class="section-title">Waiting Period</div>
        <p class="section-content paragraph">
            No payment shall be made under this Rider for hospital confinement that commenced within thirty (30) days from the effective date of coverage under this Rider and for subsequent confinements related to the first.
        </p>

        <!-- Definition of Terms -->
        <div class="section-title">Definition of Terms</div>
        <p class="section-content">
            <strong>Hospital</strong> means a duly licensed institution having full diagnostic, surgical, and therapeutic facilities under the supervision of a staff of licensed physicians and with full time nursing care and services rendered by registered nurses. This shall be apply to any establishment primarily operated as a convalescent of nursing home, home for the aged, rest treatment and care of persons suffering from alcoholism or drug addiction, or from nervous or mental disorder.
        </p>
        <p class="section-content">
            <strong>Hospitalization expense</strong> means the reasonable and customary Physician’s fees, hospitalization fees, medical supplies and medications, all of which must have been necessary and reasonable, incurred in the treatment of the disease while confined in a hospital.
        </p>
        <p class="section-content">
            <strong>Physician</strong> means a person legally licensed to practice medicine and/or surgery other than the Insured or a member of the Insured’s immediate family within the third (3rd) Civil degree, whether by affinity or by consanguinity.
        </p>
        <p class="section-content">
            <strong>Hospital Confinement</strong> means confinement in a hospital for at least eighteen (18) hours as a resident patient for necessary treatment of injury or sickness. Hospital confinement to be compensable must be recommended by a qualified physician.
        </p>
        <p class="section-content">
            <strong>Dengue</strong> also known as Dengue fever, is an acute mosquito-borne viral illness of sudden onset that usually follows a benign course with headache, fever, prostration, severe joint and muscle pain, swollen glands and rash. The presence of fever, rash, and headache is particularly characteristic of dengue. In a small proportion of cases the disease develops into the life-threatening dengue hemorrhagic fever, resulting in bleeding, low levels of blood platelets and blood plasma leakage, or into dengue shock syndrome, where dangerously low blood pressure occurs.
        </p>

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
            <li>termination of this Rider of the Policy; or</li>
            <li>attainment of the Insured of the termination age for this Rider as stated in the Policy Data Page; or</li>
            <li>termination of the Insured’s individual insurance under the Policy.</li>
        </ol>
        <p class="section-content paragraph">
            Termination of this Rider or the individual insurance shall be without prejudice to any claim arising before such termination.
        </p>

        <!-- Notice of Hospital Confinement -->
        <div class="section-title">Notice of Hospital Confinement</div>
        <p class="section-content paragraph">
            Written notice of the Insured’s hospital confinement due to Dengue Hemorrhagic Fever upon which claim under this Rider may be based must be given to the Insurer at its Home Office within fifteen (15) days from the date of such confinement. Failure to give notice within such time shall not invalidate nor reduce any claim if it shall be shown that it was not reasonably possible to submit such notice within the required period.
        </p>
        <p class="section-content paragraph">
            The Insurer, upon receipt of such notice, shall provide forms for filling proof of hospital confinement. Subject to the written proof of hospital confinement and written recommendation of the attending physician for hospital confinement, all accrued benefits under this Rider shall be paid to the Insured upon discharge from the hospital. In case of long-period hospital confinement, the Insurer may, upon request, make periodic payments of such benefits.
        </p>
        <p class="section-content paragraph">
            The Insurer, at its own expense, reserves the right, through its designated examiners, to medically examine the Insured for the sickness resulting to any claim under this Rider.
        </p>

        <!-- Proof of Claim -->
        <div class="section-title">Proof of Claim</div>
        <p class="section-content paragraph">
            Written proof hospital confinement herein referred to must be submitted to the Insurer on the Insurer’s form within ninety (90) days after the date of discharge from the hospital for which claim is made. Failure to submit written proof of hospital confinement within such time shall not invalidate nor reduce any claim if it is shown that it was not reasonably possible to submit such proof within the required time and that proof was submitted as soon as was reasonably possible.
        </p>

        <!-- Document Code Suffix -->
        <div class="document-code-suffix">
            GDR2013v01
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
