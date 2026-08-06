/**
 * Group Critical Illness Rider - Top 5 (GCIR5) Template
 * 
 * @param {Object} application - Application details (e.g. effective_date)
 * @param {Object} details - Additional parameters (logoDataUri, isReview, etc.)
 * @param {Object} rider - Rider metadata (acronym, rider_name, min_amount, max_amount, unit_value, etc.)
 * @returns {string} HTML string for PDF rendering
 */
export default function generateGCIR5Template(application = {}, details = {}, rider = {}) {
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
    const riderName = rider?.rider_name || 'GROUP CRITICAL ILLNESS RIDER – TOP 5';
    const acronym = rider?.acronym || 'GCIR5';
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
        .subsection-title {
            font-size: 10.5pt;
            font-weight: bold;
            color: #1a202c;
            margin-top: 15px;
            margin-bottom: 6px;
            text-transform: uppercase;
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
        .nested-list {
            margin-top: 4px;
            margin-bottom: 8px;
            list-style-type: lower-alpha;
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
            The following provisions, herein referred to as the Rider, form part of the Policy if its description title is indicated in the Policy Data Page. Its conditions shall apply only to this Rider and not to any other portion of the Policy to which this Rider is attached, herein referred to simply as the Policy, unless specifically provided otherwise.
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
            Upon receipt and approval by the Insurer of due proof that if the Insured is first diagnosed with any one of the covered Critical Illnesses while this Rider is in force, the Insurer shall, subject to the limitations and provisions hereunder and of the Policy, receive the Amount of Insurance of this Rider as specified in the Policy Data Page.
        </p>
        <p class="section-content paragraph">
            This benefit can only be availed once during the lifetime of the Insured.
        </p>

        <!-- Pre-Existing Illness -->
        <div class="section-title">Pre-Existing Illness</div>
        <p class="section-content paragraph">
            Pre-existing illness is defined as any illness, injury, sickness, disability, or disease for which the Insured received medical advice, consultation, examination, check-up, diagnostic procedure, or treatment prior to the effective date of the coverage of this Rider.
        </p>
        <p class="section-content paragraph">
            Any Pre-existing Illness is not covered unless the Insured has fully recovered without any lingering effect of the pre-existing illness as defined below. The Insurer may, however, stipulate that a pre-existing condition that was disclosed by the Insured and accepted by the Insurer may be covered.
        </p>

        <div class="subsection-title">For Pre-Existing Cancer</div>
        <p class="section-content">
            Full Recovery is defined as all of the following conditions arising for at least two (2) continuous and uninterrupted years prior to the effective date of this Rider:
        </p>
        <ol class="nested-list">
            <li>Did not receive any medical advice or treatment of pre-existing Cancer, except for purposes of prevention of recurrence of cancer;</li>
            <li>No recurrence, relapse, signs and symptoms of the pre-existing Cancer;</li>
            <li>Actively-at-work</li>
        </ol>
        <p class="section-content">
            Full recovery must be confirmed by the Insured’s attending oncologist or surgeon. The confirmation should cover the entire two (2)-year period and must be accompanied by the results of all the medical examinations, procedures, and treatment performed to prove that the Insured is cancer-free. Insurer reserves the right to require from the Insured further proof to establish full recovery.
        </p>

        <div class="subsection-title">For Other Pre-Existing Illnesses</div>
        <p class="section-content">
            Full Recovery is defined as all of the following conditions arising for at least two (2) continuous and uninterrupted years prior to the effective date of this rider:
        </p>
        <ol class="nested-list">
            <li>Did not receive any medical advice or treatment for other pre-existing illnesses;</li>
            <li>No recurrence, relapse, progression, signs and symptoms of the pre-existing illness;</li>
            <li>Can continuously perform all activities of daily living;</li>
            <li>No emergency room care;</li>
            <li>No minor and/or major surgical operation; and</li>
            <li>No confinement in a clinic, hospital, or nursing facility due to the pre-existing illness or arising as a complication of the pre-existing illness, or as a complication of its treatment.</li>
        </ol>

        <p class="section-content">
            All of the following supporting documents must be submitted for all pre-existing illnesses as proofs or medical evidence of full recovery:
        </p>
        <ol class="nested-list">
            <li>Attending Specialist’s Statement;</li>
            <li>Treatment History Report;</li>
            <li>Operative Technique or Surgical Report;</li>
            <li>Histo-pathological or biopsy report;</li>
            <li>Clinic and/or hospital records.</li>
        </ol>
        <p class="section-content">
            Insurer reserves the right to require from the Insured further proof to establish full recovery.
        </p>

        <!-- Waiting Period -->
        <div class="section-title">Waiting Period</div>
        <p class="section-content paragraph">
            No payment shall be made under this Rider for any Critical Illness diagnosed that commenced within ninety (90) days from the effective date of coverage of this Rider or from the last reinstatement date or the date of increase in benefits.
        </p>

        <!-- Survival Period -->
        <div class="section-title">Survival Period</div>
        <p class="section-content paragraph">
            Further to the conditions defined in the BENEFITS, the Insured must survive for at least thirty (30) days following such first diagnosis or the minimum assessment periods for covered Critical Illnesses as provided under the descriptions for each of the Critical Illnesses, whichever is longer.
        </p>

        <!-- Covered Critical Illnesses -->
        <div class="section-title">Covered Critical Illnesses</div>
        <div class="subsection-title">Definition of Terms</div>
        
        <ol style="list-style-type: decimal;">
            <li>
                <strong>Cancer</strong> shall mean the presence of a malignant tumor positively diagnosed with histological confirmation and characterized by the uncontrolled growth of malignant cells with invasion and destruction of normal tissue. The diagnosis must be confirmed by an Oncologist.<br>
                Leukemia, lymphoma, myelodysplastic syndrome, essential thrombocythemia, polycythemia rubra vera, and microinvasive carcinoma of the breast or cervix uteri are covered.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Any tumor histologically classified as pre-malignant, non-invasive, carcinoma-in-situ, having either borderline malignancy, or having low malignant potential;</li>
                    <li>Lobular carcinoma-in-situ of the breast unless the condition requires mastectomy;</li>
                    <li>All tumors of the prostate unless histologically classified as having a Gleason score of 7 or above or having progressed to at least TNM classification T2bN0M0;</li>
                    <li>Gastric MALT Lymphoma, if the condition can be treated with Helicobacter-eradication;</li>
                    <li>Gastrointestinal stromal tumor (GIST) Stage I and II according to the AJCC Cancer Staging Manual, Seventh Edition (2010); and</li>
                    <li>All tumors in the presence of HIV infection.</li>
                </ol>
            </li>
            <li>
                <strong>Heart Attack</strong> shall mean the death of a portion of heart muscle (myocardial infarction) resulting from ischemia of one or more coronary arteries as evidenced by all of the following:
                <ol class="nested-list">
                    <li>Presence of the typical chest pain;</li>
                    <li>New characteristic electrocardiographic (ECG) changes;</li>
                    <li>Characteristic rise of cardiac (heart) enzymes, inclusive of CKMB above the normal levels, or Cardiac Troponin T or I equal to or above 0.5 ng/ml;</li>
                    <li>Diagnostic elevation of Troponin T or I at 0.5 mcg/L (0.5ng/mL) and above; and</li>
                    <li>Left ventricular ejection fraction less than 50% measured three (3) months or more after the event.</li>
                </ol>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Other acute coronary syndromes;</li>
                    <li>Angina without myocardial infarction; and</li>
                    <li>A rise in cardiac biomarkers or Troponin T or I following an intra-arterial cardiac procedure including, but not limited to, coronary angiography and coronary angioplasty.</li>
                </ol>
            </li>
            <li>
                <strong>Stroke</strong> shall mean the death of brain cells due to an acute cerebrovascular event caused by hemorrhage (including subarachnoid hemorrhage) or intracranial thrombosis, or embolism from an extracranial source with:
                <ol class="nested-list">
                    <li>New objective neurological deficits on clinical examination; and</li>
                    <li>Acute onset of new neurological symptoms.</li>
                </ol>
                The neurological deficit must persist for more than thirty (30) days following the date of diagnosis. The diagnosis must be supported by imaging findings and confirmed by a Consultant Neurologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Prolonged Reversible Ischemic Neurological Deficit (PRIND) and Transient Ischemic Attack (TIA);</li>
                    <li>Neurological deficits due to general hypoxia, infection, inflammatory disease, migraine, or medical intervention;</li>
                    <li>Traumatic injury to brain tissue or blood vessels;</li>
                    <li>Death of tissue of the optic nerve or retina / eye stroke; and</li>
                    <li>Incidental imaging findings (CT- or MRI-scan) without clearly related clinical symptoms (silent stroke).</li>
                </ol>
            </li>
            <li>
                <strong>Kidney Failure</strong> shall mean the chronic and irreversible failure of both kidneys to function, as a result of which either regular hemodialysis or peritoneal dialysis is instituted, or renal transplantation is carried out. The dialysis must be medically necessary and confirmed by a Consultant Nephrologist.<br><br>
                Acute reversible kidney failure with temporary renal dialysis is not covered.
            </li>
            <li>
                <strong>Coronary Artery Bypass Surgery</strong> shall mean the actual undergoing of open chest coronary artery bypass surgery by way of thoracotomy to correct or treat coronary artery disease but not including angioplasty, stent insertion, laser or other intra-arterial procedures, and key-hole coronary artery by-pass surgery. The diagnosis must be supported by angiographic evidence of significant coronary artery obstruction and the procedure must be considered medically necessary by a consultant cardiologist.<br><br>
                The narrowing or blockage of coronary arteries must satisfy any of the following criteria:
                <ol class="nested-list">
                    <li>Over 50% left main coronary artery stenosis;</li>
                    <li>Over 70% stenosis of the proximal left anterior descending (LAD) and proximal circumflex arteries;</li>
                    <li>Three-vessel disease in asymptomatic patients or those with mild or stable angina;</li>
                    <li>Three-vessel disease with proximal LAD stenosis in patients with poor left ventricular (LV) function; or</li>
                    <li>Over 70% proximal LAD stenosis with either an ejection fraction (EF) below 50% or demonstrable ischemia on non-invasive testing.</li>
                </ol>
            </li>
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
            <li>benefit is filed by the Insured; or</li>
            <li>the Insured ceases to be a resident of the Philippines; or</li>
            <li>termination of this Rider or the Policy; or</li>
            <li>attainment of the Insured of the termination age for this Rider as stated in the Policy Data Page; or</li>
            <li>termination of the Insured’s individual insurance under the Policy.</li>
        </ol>
        <p class="section-content paragraph">
            Termination of this Rider or the individual insurance or the Policy shall be without prejudice to any claim arising before such termination.
        </p>

        <!-- Notice of Critical Illness -->
        <div class="section-title">Notice of Critical Illness</div>
        <p class="section-content paragraph">
            Written notice of the Insured’s Critical Illness herein referred to upon which claim under this Rider may be based must be given to the Insurer at its Home Office within thirty (30) days from the date of first diagnosis. Failure to give notice within such time shall not invalidate nor reduce any claim if it shall be shown that it was not reasonably possible to submit such notice within the required period.
        </p>

        <!-- Proof of Claim -->
        <div class="section-title">Proof of Claim</div>
        <p class="section-content paragraph">
            Written proof of Critical Illness herein referred to must be submitted to the Insurer on the Insurer's form within ninety (90) days after first diagnosis is made. Failure to submit written proof of claim within such time shall not invalidate nor reduce any claim if it is shown that it was not reasonably possible to submit such proof within the required time and that proof was submitted as soon as was reasonably possible.
        </p>
        <p class="section-content paragraph">
            The Insurer, at its own expense, reserves the right, through its designated examiners, to medically examine the Insured for the sickness resulting to any claim under this Rider.
        </p>

        <!-- Payment of Claim -->
        <div class="section-title">Payment of Claim</div>
        <p class="section-content paragraph">
            Subject to the written proof of critical illness and the conditions as provided in the Rider and in the Policy, all accrued benefits under this Rider shall be paid to the Insured.
        </p>

        <!-- Document Code Suffix -->
        <div class="document-code-suffix">
            GCIR52025v01
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
