/**
 * Group Hospital Income Rider (GHIR) Template
 * 
 * @param {Object} application - Application details (e.g. effective_date)
 * @param {Object} details - Additional parameters (logoDataUri, isReview, etc.)
 * @param {Object} rider - Rider metadata (acronym, rider_name, min_amount, max_amount, unit_value, etc.)
 * @returns {string} HTML string for PDF rendering
 */
export default function generateGHIRTemplate(application = {}, details = {}, rider = {}) {
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
    const riderName = rider?.rider_name || 'GROUP HOSPITAL INCOME RIDER';
    const acronym = rider?.acronym || 'GHIR';
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

        <!-- Daily Hospital Income Benefit -->
        <div class="section-title">Daily Hospital Income Benefit</div>
        <p class="section-content paragraph">
            Subject to the limitations provided herein, a Hospital Income Benefit shall be paid to the Insured for each day of confinement, after the waiting period, if any, for a maximum number of days stated in the Policy. The amount of Daily Hospital Income Benefit, the waiting period, if any, and the maximum number of days per confinement shall be as specified in the Policy Data Page.
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

        <!-- Daily ICU Income Benefit -->
        <div class="section-title">Daily ICU Income Benefit</div>
        <p class="section-content paragraph">
            An ICU Income Benefit shall be paid to the Insured in addition to the Daily Hospital Income Benefit for each day that the Insured is confined in the Intensive Care Unit (ICU) and a Daily Hospital Income Benefit is payable if this benefit is stated in the Policy Data Page. The amount of Daily ICU Income Benefit shall be as specified in the Policy Data Page.
        </p>

        <!-- Definition of Terms -->
        <div class="section-title">Definition of Terms</div>
        <p class="section-content">
            <strong>Hospital</strong> means a duly licensed institution having full diagnostic, surgical and therapeutic facilities under the supervision of a staff of licensed physicians and with full time nursing care and services rendered by registered nurses. This shall not apply to any establishment primarily operated as a convalescent or nursing home, home for the aged, rest treatment and care of persons suffering from alcoholism or drug addiction, or from nervous or mental disorder.
        </p>
        <p class="section-content">
            <strong>Sickness</strong> means a specific illness, disease, or disorder of the human body commencing while this Policy is in force.
        </p>
        <p class="section-content">
            <strong>Injury</strong> means accidental bodily injury resulting independently of any other causes sustained while this Policy is in force, and producing a visible contusion or wound on the exterior of the body except in cases of drowning and internal injury revealed by medical examination or autopsy.
        </p>
        <p class="section-content">
            <strong>Physician</strong> means a person legally licensed to practice medicine and/or surgery other than the Insured or a member of the Insured's immediate family within the third (3rd) Civil degree, whether by affinity or by consanguinity.
        </p>
        <p class="section-content">
            <strong>Hospital Confinement</strong> means confinement in a hospital for at least eighteen (18) hours as a resident patient for necessary treatment of injury or sickness. Hospital confinement to be compensable must be recommended by a qualified physician.
        </p>
        <p class="section-content">
            <strong>Repeated Hospital Confinement</strong> means successive hospital or clinic confinements which arise from the same or closely interrelated cause or causes and which shall be considered one period of hospital confinement if such confinements are not separated by a period of at least three (3) months or one (1) month of continuous active work, whichever is sooner.
        </p>
        <p class="section-content paragraph">
            The total number of days for such repeated hospital confinements shall be subject to the designated maximum number of days per confinement as stated in the Policy Data Page. Any subsequent hospital confinements separated by an interval of at least three (3) months from a prior confinement or one (1) month of continuous active work, whichever is sooner, shall be considered as an entirely new confinement and the designated maximum number of days per confinement shall apply separately to such subsequent confinement.
        </p>
        <p class="section-content">
            <strong>Waiting Period</strong> means the initial period of hospital confinement as specified in the Policy Data Page during which benefits are not payable.
        </p>

        <!-- Pre-Existing Conditions -->
        <div class="section-title">Pre-Existing Conditions</div>
        <p class="section-content paragraph">
            This Rider shall not cover any Pre-existing illness or condition as herein defined. An illness or condition shall be considered Pre-existing if, during the period prior to the Effective Date of this Rider or the approval date of reinstatement in case of lapse, any of the following conditions are present: a) any professional advice or treatment was given for such illness or condition; b) such illness or condition was in any way evident to the Insured; or c) the pathogenesis of such illness or condition has started whether or not an Insured is aware of such illness or condition.
        </p>
        <p class="section-content paragraph">
            For purposes of this provision, it is hereby understood and agreed that the following conditions and their complications, but not limited to, when occurring during the first year of coverage after the Effective Date or Date of Last Reinstatement shall be considered Pre-existing: (a) endometriosis; (b) hemorrhoids; (c) diseased tonsils requiring surgery; (d) pathological abnormalities of nasal septum and turbinates; (e) hyperthyroidism/goiter; (f) cataracts; (g) sinus condition requiring surgery; (h) epilepsy; (i) asthma; (j) cirrhosis of the liver; (k) tuberculosis; (l) anal fistulae; (m) cholecystitis/cholelithiasis; (n) calculi of the urinary system; (o) gastric or duodenal ulcer; (p) hallux valgus; (q) tumors, whether benign or malignant, of all organs and organ systems, including malignancies of the blood and bone marrow; (r) diabetes mellitus; (s) hypertension; (t) collagen disease; (u) cardiovascular diseases; (v) hernia; (w) HIV/AIDS and (x) chronic skin conditions.
        </p>
        <p class="section-content paragraph">
            The Pre-existing Condition Provision shall no longer be applicable after an Insured has been covered for twelve (12) consecutive months and this Rider is renewed except for illnesses or condition specifically excluded by an endorsement to the provisions of this Rider. This is on the condition that there is no failure to disclose or there is no misrepresentation and concealment, whether intentional or unintentional, of material information in the original application or application for reinstatement.
        </p>

        <!-- Limitations -->
        <div class="section-title">Limitations</div>
        <p class="section-content">
            The following cases are excluded from the coverage of this Rider:
        </p>
        <ol style="list-style-type: decimal;">
            <li>hospital confinements not recommended, approved, and performed by a legally qualified physician or surgeon;</li>
            <li>hospital confinements due to declared or undeclared war, riots, illegal demonstrations, or criminal acts;</li>
            <li>hospital confinements due to fortuitous events;</li>
            <li>hospital confinements outside the Philippines;</li>
            <li>confinements prior to the effective date of coverage of the Policy;</li>
            <li>confinements primarily for diagnosis, routine physical examination, check-up, rest and recuperation, speech therapy, physical therapy, radiotherapy, chemotherapy, and renal dialysis;</li>
            <li>confinements because of intentionally self-inflicted injury, or attempted suicide whether the insured individual is sane or insane;</li>
            <li>confinements caused by fertility or infertility, pregnancy, childbirth, miscarriage, abortion, or complications of any of these;</li>
            <li>confinements caused by venereal diseases, nervous or mental diseases or disorders;</li>
            <li>confinements involving all bodily injury or sickness contracted while the insured is in the military, naval or air service;</li>
            <li>confinements as a result of murder and provoked assault;</li>
            <li>AIDS or AIDS-related confinements;</li>
            <li>confinements by reason of cosmetic surgery, dental surgery, or plastic surgery, except to the extent that any of them are necessary for the repair or alleviation of damage to the insured person caused solely by accidental bodily injuries covered by this Policy;</li>
            <li>confinements involving congenital deformities;</li>
            <li>confinement due to alcoholisms or drug addiction or any reaction to drug, unless such drug was prescribed by a licensed medical practitioner;</li>
            <li>confinements due to medical or surgical procedures which are experimental in nature or not generally accepted by the medical profession; and</li>
            <li>confinements due to ionizing radiation or contamination by radioactivity from any nuclear fuel or from any nuclear waste from the combustion of nuclear fuel; and confinements in which a proximate cause was the Insured's attempted commission of or willful participation in a crime punishable under the Revised Penal Code of the Philippines except crimes of reckless imprudence as defined in Article 365, or under similar laws of any country in which the crime was attempted, or resistance to lawful arrest.</li>
        </ol>

        <!-- Notice of Hospital Confinement -->
        <div class="section-title">Notice of Hospital Confinement</div>
        <p class="section-content paragraph">
            Written notice of the Insured’s hospital confinement upon which claim under this Rider may be based must be given to the Insurer at its Home Office within fifteen (15) days from the date of such confinement. Failure to give notice within such time shall not invalidate nor reduce any claim if it shall be shown that it was not reasonably possible to submit such notice within the required period.
        </p>
        <p class="section-content paragraph">
            The Insurer, upon receipt of such notice, shall provide forms for filing proof of hospital confinement. Subject to the written proof of hospital confinement and written recommendation of the attending physician for hospital confinement, all accrued benefits under this Rider shall be paid to the Insured upon discharge from the hospital. In case of long-period hospital confinement, the Insurer may, upon request, make periodic payments of such benefits.
        </p>
        <p class="section-content paragraph">
            The Insurer, at its own expense, reserves the right, through its designated examiners, to medically examine the Insured for any injury or sickness resulting to any claim under this Rider.
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
            <li>termination of this Rider or the Policy; or</li>
            <li>attainment of the Insured of the termination age for this Rider as stated in the Policy Data Page; or</li>
            <li>termination of the Insured’s individual insurance under the Policy.</li>
        </ol>
        <p class="section-content paragraph">
            Termination of this Rider or the individual insurance shall be without prejudice to any claim arising before such termination.
        </p>

        <!-- Document Code Suffix -->
        <div class="document-code-suffix">
            GHIR2012v01
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
