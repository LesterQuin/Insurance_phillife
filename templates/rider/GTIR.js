/**
 * Group Terminal Illness Rider (GTIR) Template
 * 
 * @param {Object} application - Application details (e.g. effective_date)
 * @param {Object} details - Additional parameters (logoDataUri, isReview, etc.)
 * @param {Object} rider - Rider metadata (acronym, rider_name, min_amount, max_amount, unit_value, etc.)
 * @returns {string} HTML string for PDF rendering
 */
export default function generateGTIRTemplate(application = {}, details = {}, rider = {}) {
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
    const riderName = rider?.rider_name || 'GROUP TERMINAL ILLNESS RIDER';
    const acronym = rider?.acronym || 'GTIR';
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
            No premium shall be payable for this Rider
        </p>

        <!-- Terminal Illness Benefit -->
        <div class="section-title">Terminal Illness Benefit</div>
        <p class="section-content paragraph">
            Upon receipt and approval of due proof that has been diagnosed with terminal illness, the Insurer shall pay a Terminal Illness Benefit as indicated in the Policy Data Page as an advance of his death benefit under the Policy.
        </p>
        <p class="section-content paragraph">
            If the Insured has more than one life insurance coverage to which riders of this kind are attached, the amount of benefit under all such riders shall be as indicated in the Policy Data Page.
        </p>
        <p class="section-content paragraph">
            The Terminal Illness Benefit may be availed only once during the lifetime of the Member.
        </p>
        <p class="section-content paragraph">
            Administration charges not exceeding 5% of the Terminal Illness Benefit shall be deducted from such benefit. The Terminal Illness Benefit shall bear an interest based on the Insurer’s prevailing policy loan interest subject to the maximum allowed by law.
        </p>
        <p class="section-content paragraph">
            No benefit shall be provided for any terminal illness or injury sustained or condition which was evident or for which the Insured received medical advice or treatment within six (6) months prior to or within 90 days following the effective date of this Rider.
        </p>

        <!-- Definitions -->
        <div class="section-title">Definitions</div>
        <p class="section-content">
            <strong>Physician</strong> shall mean a person legally licensed to practice medicine and/or surgery other than the Insured or a member of his immediate family within the third (3rd) civil degree, whether by affinity or by consanguinity.
        </p>
        <p class="section-content">
            <strong>Terminal Illness</strong> shall mean an illness that is expected to result to the Insured’s death within 12 months from the date of the diagnosis of such illness.
        </p>

        <!-- Exclusions -->
        <div class="section-title">Exclusions</div>
        <p class="section-content">
            Benefits under this Rider shall not be payable if the Terminal Illness was caused directly or indirectly, wholly or partly, by any of the following:
        </p>
        <ol style="list-style-type: decimal;">
            <li>self-inflicted bodily injury while sane or insane, or caused by attempt to suicide; or</li>
            <li>the commission or attempted commission of the Insured of any criminal act; or</li>
            <li>functional disorders of the mind, abuse of drugs or alcohol; or</li>
            <li>atomic or nuclear explosions or radioactive gas; or</li>
            <li>declared or undeclared war, strikes, riots, or any civil commotion or strife; or</li>
            <li>sexually transmitted diseases, AIDS and AIDS related diseases.</li>
        </ol>

        <!-- Effect of Payment of Benefit -->
        <div class="section-title">Effect of Payment of Benefit</div>
        <p class="section-content">
            Upon payment of the Terminal Illness Benefit:
        </p>
        <ol style="list-style-type: decimal;">
            <li>The Amount of Insurance shall be reduced by the Terminal Illness Benefit paid and the interest on such benefit.</li>
            <li>If the Insured subsequently converts his insurance, the amount eligible for conversion shall be based on the reduced Amount of Insurance.</li>
            <li>The premium based on the original Amount of Insurance shall continue to be paid to keep the insurance coverage in force.</li>
            <li>The Terminal Illness Benefit shall be reflected as claim for experience refund computation purposes, if applicable.</li>
        </ol>

        <!-- Termination -->
        <div class="section-title">Termination</div>
        <p class="section-content paragraph">
            The Policyholder may discontinue this Rider at any time by giving written notice to the Insurer at least 31 days prior to the date of termination.
        </p>
        <p class="section-content">
            The insurance under this Rider shall automatically terminate on the earliest of the following:
        </p>
        <ol style="list-style-type: decimal;">
            <li>termination of this Rider or the Policy; or</li>
            <li>termination of the Insured’s individual insurance under the Policy; or</li>
            <li>attainment of the Insured of the termination age for this Rider as stated in the Policy Data Page;</li>
        </ol>

        <!-- Notice of Claim -->
        <div class="section-title">Notice of Claim</div>
        <p class="section-content paragraph">
            Written notice of claim must be given to the Insurer within thirty (30) days after the occurrence or commencement of any disability covered hereunder. Failure to give notice within such time shall not invalidate nor reduce any claim if it is shown that it was not reasonably possible to submit such notice within the required period.
        </p>
        <p class="section-content paragraph">
            The Insurer, upon receipt of such notice of disability, shall provide forms for filing proof of claim. If such forms are not provided within fifteen (15) days after the receipt of notice of injury, the claimant shall be deemed to have complied with the requirements of this Rider as to proof of claim upon submitting within ninety (90) days after the date of the disability for which the claim is made, written proof covering the occurrence, character and extent of disability for which claim is made.
        </p>

        <!-- Proof of Claim -->
        <div class="section-title">Proof of Claim</div>
        <p class="section-content paragraph">
            Written proof that the Insured has been diagnosed to be terminally ill with a life expectancy of 12 months or less by an acceptable registered physician supported by clinical, radiological, historical and laboratory evidence must be submitted to the Insurer on the Insurer's form within ninety (90) days after the date of diagnosis. Failure to submit written proof of disability within such time shall not invalidate nor reduce any claim if it is shown that it was not reasonably possible to submit such proof within the required time and that proof was submitted as soon as was reasonably possible.
        </p>
        <p class="section-content paragraph">
            The Insurer reserves the right to examine the validity and correctness of such diagnosis.
        </p>

        <!-- Document Code Suffix -->
        <div class="document-code-suffix">
            GTIR2012v01
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
