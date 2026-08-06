/**
 * Group Medical Rider (GMR) Template
 * 
 * @param {Object} application - Application details (e.g. effective_date)
 * @param {Object} details - Additional parameters (logoDataUri, isReview, etc.)
 * @param {Object} rider - Rider metadata (acronym, rider_name, min_amount, max_amount, unit_value, etc.)
 * @returns {string} HTML string for PDF rendering
 */
export default function generateGMRTemplate(application = {}, details = {}, rider = {}) {
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
    const riderName = rider?.rider_name || 'GROUP MEDICAL RIDER';
    const acronym = rider?.acronym || 'GMR';
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

        <p class="paragraph">
            This Rider shall become effective on the effective date of the Policy unless a different date is indicated above.
        </p>

        <!-- Section I: Definition of Terms -->
        <div class="section-title">I. Definition of Terms</div>
        
        <p class="section-content">
            • <strong>Medical Benefits</strong> shall mean out-patient benefits, hospitalization benefits and other such medical benefits as provided for in this Rider.
        </p>
        <p class="section-content">
            • <strong>In-Patient</strong> shall mean medical and surgical services rendered to an Insured confined in the hospital.
        </p>
        <p class="section-content">
            • <strong>Out-Patient</strong> shall mean medical and surgical services rendered to an Insured where confinement is not necessary.
        </p>
        <p class="section-content">
            • <strong>Emergency</strong> shall mean the sudden, unexpected onset of illness or injury, which at the time of contract reasonably appeared as having the potential of causing immediate disability or death or requiring the immediate alleviation of severe pain and discomfort. Emergency cases include but are not limited to the following: (a) Massive Bleeding; (b) Acute Appendicitis; (c) Acute Myocardial Infarction (heart attack); (d) Hypertensive Crisis (e.g. stroke, HPN, coma); (e) Fractures/multiple injuries secondary to accidents; (f) Convulsions; (g) illnesses or conditions resulting in moderate or severe dehydration such as diarrhea or fever; and (h) Syncope.
        </p>
        <p class="section-content">
            • <strong>Hospital</strong> shall mean any public or private institution duly recognized and licensed by the Bureau of Hospitals of the Department of Health to render hospital services which include beds for hospitalized patients, food and general nursing services. Hospital does not include any institution or that portion of any institution which is operated as a convalescent or nursing home, rest home, home for the aged, a place for custodian care or for any similar purpose.
        </p>
        <p class="section-content">
            • <strong>Affiliated Hospital</strong> shall mean any of the hospitals contracted by the Insurer to provide medical services to its Insureds as specified in this Rider.
        </p>
        <p class="section-content">
            • <strong>Clinic/Health Facility</strong> shall mean any private institution duly recognized and licensed by the Department of Health to render medical or out-patient surgical services.
        </p>
        <p class="section-content">
            • <strong>Maternity</strong> shall mean any cause or condition arising out of or during any one pregnancy, childbirth, miscarriage or abortion or any complications arising from the same.
        </p>
        <p class="section-content">
            • <strong>Insurer Coordinator</strong> shall mean the affiliated duly licensed Physician engaged by the Insurer in an Affiliated Hospital to provide, among others, the following Covered Services to Insureds: primary medical consultations, referrals to specialist, requests for laboratory examinations, and arrangements for medical services such as, but not limited, to hospitalization.
        </p>
        <p class="section-content">
            • <strong>Physician</strong> shall mean any person legally authorized to render medical and surgical services.
        </p>
        <p class="section-content">
            • <strong>Specialist</strong> shall mean a Physician who has been certified and accredited by specific specialty board(s).
        </p>
        <p class="section-content">
            • <strong>Insurer Authorized LOA Issuer</strong> shall mean a person authorized by the Insurer to issue letters of authorization or letters of referral to physicians or medical facilities for the purpose of providing medical services to its Insureds.
        </p>
        <p class="section-content">
            • <strong>280-day Waiting Period</strong> shall mean that maternity benefit shall only be available to eligible Insureds after she has been continuously covered under this Rider for a period of 280 days.
        </p>
        <p class="section-content">
            • <strong>Medically Necessary or Medical Necessity</strong> shall mean the appropriate and necessary medical services, as determined by the Insurer, provided to the Insured for an illness and injury which, according to generally-accepted principles of good medical practice in the Philippines, requires diagnosis, direct care and treatment. These do not include services rendered for convenience and aesthetic purposes.
        </p>

        <!-- Section II: General Provisions -->
        <div class="section-title">II. General Provisions</div>

        <div class="subsection-title">Insurance Premiums</div>
        <p class="section-content paragraph">
            The insurance premium pertaining to this Rider shall be as specified in the Policy Data Page.
        </p>

        <div class="subsection-title">Insurer Network</div>
        <p class="section-content paragraph">
            Hospitals, clinics / health facilities, physicians and other health professionals duly affiliated by the Insurer to provide medical and healthcare services to Insureds comprise the Insurer Network. The Insurer shall provide the Policyholder with a list of such hospitals, clinics / health facilities under the Insurer Network and shall periodically update such list.
        </p>
        <p class="section-content">
            Clinics, which are engaged by the Insurer to provide out-patient services, are classified as follows:
        </p>
        <ol style="list-style-type: decimal;">
            <li>Primary Clinic</li>
            <li>Affiliated Clinic/Health Facility</li>
            <li>Preferred Clinic/Health Facility</li>
        </ol>
        <p class="section-content">
            Physicians contracted by the Insurer to provide medical services are classified as follows:
        </p>
        <ol style="list-style-type: decimal;">
            <li>Primary Physician</li>
            <li>Affiliated Physician</li>
        </ol>

        <div class="subsection-title">Termination</div>
        <p class="section-content">
            The insurance under this Rider shall automatically terminate on the earliest of the following:
        </p>
        <ol style="list-style-type: decimal;">
            <li>termination of this Rider or the Policy; or</li>
            <li>attainment of the Insured of the termination age for this Rider as stated in the Policy Data Page; or</li>
            <li>termination of the Insured’s individual insurance under the Policy; or</li>
            <li>the end of the grace period if the premiums pertaining to this Rider is not paid within such period.</li>
        </ol>

        <!-- Section III: Benefits Provision -->
        <div class="section-title">III. Benefits Provision</div>
        <p class="section-content paragraph">
            This Rider provides for medical services subject to the exclusions, limitations and conditions herein specified.
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

        <div class="subsection-title">Outpatient Benefits</div>
        
        <p class="section-content"><strong>1. ANNUAL PHYSICAL EXAMINATION</strong></p>
        <ul style="list-style-type: none; padding-left: 15px;">
            <li>1.1 Taking of Medical History</li>
            <li>1.2 Physical Examination</li>
            <li>1.3 Chest X-ray</li>
            <li>1.4 Routine Urinalysis</li>
            <li>1.5 Routine Stool Examination</li>
            <li>1.6 Complete Blood Count (CBC)</li>
            <li>1.7 Electrocardiogram (ECG) for Insureds 35 years old and above</li>
            <li>1.8 Pap smear for female Insureds 35 years old and above.</li>
        </ul>

        <p class="section-content"><strong>2. PREVENTIVE MEDICAL BENEFITS</strong></p>
        <ul style="list-style-type: none; padding-left: 15px;">
            <li>2.1 Wellness programs</li>
            <li>2.2 Immunization and allergy desensitization (cost of vaccines, allergens and determinations of susceptibility are not included)</li>
            <li>2.3 Health education and counseling on diet or exercise</li>
            <li>2.4 Periodic monitoring of health problems</li>
            <li>2.5 Family planning counseling</li>
        </ul>

        <p class="section-content"><strong>3. OUT-PATIENT SERVICES SUCH AS BUT NOT LIMITED TO:</strong></p>
        <ul style="list-style-type: none; padding-left: 15px;">
            <li>3.1 Consultation, including specialist’s evaluation</li>
            <li>3.2 First aid treatment of injury or illness</li>
            <li>3.3 Necessary x-rays and laboratory examinations</li>
            <li>3.4 Eye, Ear, Nose and Throat Care</li>
            <li>3.5 Transfusion of blood and other blood elements, except the cost of blood screening</li>
            <li>3.6 Pre-natal and post-natal consultations</li>
            <li>3.7 Dialysis, chemotherapy, physical therapy and similar treatment procedures except occupational therapy</li>
        </ul>

        <div class="subsection-title">Hospitalization Benefits</div>
        <p class="section-content">
            In case an Insured suffers an ailment, which requires hospitalization, he shall be entitled to the hospitalization benefits listed below:
        </p>
        <ol style="list-style-type: decimal;">
            <li>Services of a Physician including surgical services</li>
            <li>Room and Board according to the type of room accommodation and subject to the maximum rate of Daily Room and Board stated in the Policy Data Page applicable to the Insured</li>
            <li>General Nursing Service</li>
            <li>Use of operating room and recovery room</li>
            <li>Anesthesia and its administration</li>
            <li>Drug and medication during confinement</li>
            <li>Confinement in Intensive Care Unit up to the maximum limit</li>
            <li>Other services deemed medically necessary such as but not limited to:
                <ul style="list-style-type: none; padding-left: 15px; margin-top: 5px;">
                    <li>8.1 Oxygen and its administration</li>
                    <li>8.2 Dressings, plaster casts and other medical supplies</li>
                    <li>8.3 Laboratory tests, x-rays and other necessary diagnostic services</li>
                    <li>8.4 Transfusion of blood and other blood elements, except the cost of blood screening</li>
                    <li>8.5 Dialysis, chemotherapy and similar treatment procedures except occupational therapy up to the maximum limit</li>
                </ul>
            </li>
        </ol>
        <p class="section-content">
            Except for emergency illness or injury wherein the Emergency Provision of this Rider shall apply, these hospitalization benefits shall be available subject to the following conditions:
        </p>
        <ol style="list-style-type: decimal;" start="9">
            <li>The Hospitalization must be arranged or approved by the Insurer Authorized LOA Issuer prior to the confinement.</li>
            <li>The confinement shall be in an Affiliated Hospital under the type of hospital room accommodation and not exceeding the maximum Daily Room and Board rate stated in the Policy Data Page applicable to the Insured.</li>
            <li>Professional services shall be provided only by the Insurer Affiliated Physician(s).</li>
            <li>If discharge from the Hospital has been authorized by an Insurer affiliated Physician and an Insured shall fail or refuse to do so, the Insurer shall not be responsible for any charges for hospital service rendered after the day and time for which discharge has been authorized.</li>
        </ol>

        <div class="subsection-title">Emergency Benefits</div>
        <p class="section-content paragraph">
            In the event of an emergency and the Insured receives the medical benefits in any hospital, the Insured’s representative shall notify the Insurer Call Center or the nearest the Insurer office in provincial areas within twenty four (24) hours after the emergency has commenced. The Insured shall be responsible for presenting information as to the conditions of the emergency to enable the Insurer to determine whether the services rendered were for the care of a sickness or injury which is emergency in nature. The Insurer shall not cover any services rendered to an Insured without such notification or if the sickness or injury is not emergency in nature as defined in this Rider. Neither shall the Insurer be liable to cover any benefits availed of by an Insured, if such benefits or services are not medically necessary or appropriate as determined by the Insurer.
        </p>
        
        <p class="section-content"><strong>1. EMERGENCY CARE IN AFFILIATED HOSPITAL</strong></p>
        <p class="section-content paragraph">
            If the emergency medical benefits was administered in an Affiliated Hospital, whether as inpatient or outpatient, the Insured shall be entitled to full coverage under the Hospitalization Benefits Provisions of this Rider, provided that the Insurer has been notified of such emergency and a prescribed referral letter was issued by an Insurer Authorized LOA Issuer and provided further that the illness or condition is covered under this Rider. However, if no such prescribed referral letter was issued or if the professional service was provided by a non-Affiliated Physician but the illness or condition is otherwise covered by this Rider, the Insurer shall reimburse the amount which would have been paid by the Insurer according to the Schedule of Insurance specified in the Policy Data Page had the Insured been entitled to full benefit under this Rider.
        </p>

        <p class="section-content"><strong>2. EMERGENCY CARE IN NON – AFFILIATED HOSPITAL</strong></p>
        <p class="section-content paragraph">
            2.1 If the emergency medical benefits was administered in a Non-Affiliated Hospital, whether as inpatient or outpatient, and the Insurer was notified of such emergency within 24 hours following the commencement of the emergency, the Insurer shall reimburse the usual customary and reasonable charges for medical benefits and services which were incurred as a result of such emergency but in no case shall this exceed the amount which would have been paid by the Insurer according to the Schedule of Insurance specified in the Policy Data Page had an Insured been treated in an Affiliated Hospital. The Insurer shall not be liable for any charges if it is not notified of such emergency within the required 24 hours after the emergency has commenced.
        </p>
        <p class="section-content paragraph">
            2.2 The Insurer reserves the right to transfer an Insured to an Affiliated Hospital when, on recommendation of a Primary Physician, it is medically safe to do so. If such transfer has been recommended by any Primary Physician and an Insured shall fail or refuse to oblige, the Insurer shall not be responsible for any charges for hospital services rendered after the day the transfer was recommended. If, however, it is determined by an Primary Physician that it is not medically safe to transfer an Insured to an Affiliated Hospital, the Insurer shall reimburse the usual customary and reasonable charges for medical benefits and services which were incurred as a result of such emergency but in no case shall this exceed the amount which would have been paid by the Insurer according to the Schedule of Insurance specified in the Policy Data Page had an Insured been treated in an Affiliated Hospital.
        </p>

        <p class="section-content"><strong>3. EMERGENCY CARE IN FOREIGN TERRITORIES</strong></p>
        <p class="section-content paragraph">
            If the emergency medical benefits was administered in a hospital outside the territorial limits of the Republic of the Philippines, the Insurer shall reimburse the reasonable charges for medical benefits and services which were incurred as a result of such emergency, but not to exceed the amount which would have been paid by the Insurer Schedule of Insurance specified in the Policy Data Page of this Rider had the Insured been treated in the Philippines in an Affiliated Hospital or Medical Center by an Affiliated Physician.
        </p>

        <div class="subsection-title">Access to Medical Benefits</div>
        <p class="section-content paragraph">
            The type of access to the medical benefits is indicated in the Policy Data Page per class of Insureds.
        </p>
        
        <p class="section-content"><strong>1. PRIMARY ACCESS</strong></p>
        <p class="section-content paragraph">
            For Primary Access, an Insured shall first report his condition to a Primary Clinic, or to an Affiliated Clinic / Health Facility if there are no Primary Clinics in his location, before proceeding to any hospital for treatment unless the illness is emergency in nature. The Physician in the clinic shall, upon examining the Insured, prescribe the necessary medical procedure. If hospitalization is needed, the Primary Physician shall provide the required hospital referral in the prescribed form.
        </p>
        <p class="section-content paragraph">
            All out-patient benefits shall be provided only at the Primary Clinics by the Primary Physicians or at an Affiliated Clinic / Health Facility by an Affiliated Physician if there are no Primary Clinics in the Insured’s location, except for emergency cases wherein the Emergency Provisions of this Rider shall apply. Outpatient services may also be provided within the Insurer Network but only when referred by the Insurer Authorized LOA Issuer.
        </p>

        <p class="section-content"><strong>2. PREFERRED ACCESS</strong></p>
        <p class="section-content paragraph">
            For Preferred Access, an Insured shall first report his condition to a Primary Clinic or Preferred Clinic, or to an Affiliated Clinic / Health Facility if there are no Primary/Preferred Clinics in his location before proceeding to any hospital for treatment unless the illness is emergency in nature. The Primary/Affiliated Physician in the said clinics shall, upon examining the Insured, prescribe the necessary medical procedure. If hospitalization is needed, the Primary / Affiliated Physician shall provide the required hospital referral in the prescribed form.
        </p>
        <p class="section-content paragraph">
            All out-patient benefits shall be provided only at the Preferred and Primary Clinics by the Primary/Affiliated Physicians, or at an Affiliated Clinic / Health Facility by an Affiliated Physician if there are no Primary Clinics in the Insured’s location, except for emergency cases wherein the Emergency Provisions of this Rider shall apply. Outpatient services may also be provided within the Insurer Network but only when referred by the Insurer Authorized LOA Issuer.
        </p>

        <p class="section-content"><strong>3. SPECIAL ACCESS</strong></p>
        <p class="section-content paragraph">
            For Special Access, Insureds may directly access, for hospitalization and out-patient services, all the Insurer Affiliated Hospitals through the office of the Insurer Coordinators or Letter of Authorization (LOA) Issuing Officers who shall issue LOAs for specialist consultations and necessary diagnostic and laboratory procedures. Insureds may also access Preferred and Primary Clinics.
        </p>

        <div class="subsection-title">Incremental Rate Difference and Excess Charges</div>
        <p class="section-content"><strong>1. SAME ROOM CATEGORY</strong></p>
        <p class="section-content paragraph">
            If an Insured avails of a hospital room within the same category but of a higher rate than the Insured’s allowable benefit, the Insured shall pay the excess room charges.
        </p>

        <p class="section-content"><strong>2. DIFFERENT ROOM CATEGORY</strong></p>
        <p class="section-content paragraph">
            If an Insured chooses to avail of a hospital room of higher category than his allowable benefit, the Insured shall pay incremental rate difference and excess charges as follows:
        </p>
        <p class="section-content paragraph">
            2.1 For room and board charges, the Insured shall pay the difference between the actual rate of the room occupied by the Insured and the allowable room rate. In computing the share in room and board charges, the PhilHealth benefits for which the Insured is eligible shall be deducted from the allowable charges.
        </p>
        <p class="section-content paragraph">
            2.2 For professional fees, upon accessing a higher room type, the Insured shall pay the difference between the allowable professional fees, based on the Insurer Schedule of Fees in effect at the time of delivery of service, and the actual professional fees charged by the physician. The Insurer shall not be held liable for this difference in professional fees.
        </p>
        <p class="section-content paragraph">
            2.3 For covered hospital charges other than the room charges and professional fees, the Insured shall pay:
            <br>2.3.1 The amount equivalent to a minimum of thirty (30) percent of covered hospital charges, if the Insured is confined in a hospital room next higher in category than the Insured’s allowable benefit (e.g., from semi–private to private; from private to suite).
            <br>2.3.2 The amount equivalent to a minimum of fifty (50) percent of covered hospital charges, if the Insured is confined in hospital room two categories higher than the Insured’s allowable benefit (e.g., from semi-private to suite).
        </p>
        <p class="section-content paragraph">
            When services were availed of outside the Insurer Network which is covered by this Rider, the Insured shall pay incremental and excess charges at the same rates as stated above. In computing the reimbursable amount, the PhilHealth benefits for which the Insured is eligible shall be deducted first, and the incremental rates and excess charges shall thereafter be subtracted from the allowable medical expenses.
        </p>
        <p class="section-content paragraph">
            If the services were availed by Insureds who are not eligible for PhilHealth benefits, the Insured shall pay the incremental rate difference and excess charges at the same rates as stated above.
        </p>
        <p class="section-content paragraph">
            If no maximum daily room and board rate is specified and the Insured avails of a room accommodation of a higher category than his room entitlement, the difference between the rate of the room occupied and the average of the highest and the lowest room rate for his benefit category shall be for the account of the Insured.
        </p>
        <p class="section-content paragraph">
            If the room accommodation is semi-private and has no maximum daily room and board rate, and the Insured is admitted in a hospital without semi-private rooms and the Insured occupied a higher room category, the difference between the rate of the room occupied and the average of the smallest private room and the highest ward room shall be for the account of the Insured. For covered hospital charges other than the room charges and professional fees, the Insured shall pay incremental and excess charges at the same rates as stated above.
        </p>

        <div class="subsection-title">PhilHealth</div>
        <p class="section-content paragraph">
            Unless otherwise specified in the Policy Data Page, benefits under this Rider are integrated with the benefits under PhilHealth and as such, benefits to which an Insured is entitled under PhilHealth, whether or not the Insured is eligible for PhilHealth benefits, shall be made deductible in the computation of benefits under this Rider. The Insurer is therefore under no obligation to pay or advance the costs of such benefits under PhilHealth. Should the Insured fail to pay the PhilHealth portion of his availment prior to discharge, then, the Policyholder shall be obliged to pay the Insurer this portion within 15 days upon receipt of billing statement.
        </p>

        <div class="subsection-title">Employees Compensation Commission</div>
        <p class="section-content paragraph">
            Work-related injuries or conditions compensable under the Employee’s Compensation Commission (ECC) whether as an in-patient or out-patient shall be covered and shall not be made deductible in the computation of benefits under this Rider.
        </p>

        <div class="subsection-title">Motor Vehicle Liability Provision</div>
        <p class="section-content paragraph">
            If an Insured’s bodily injuries are claimed to be caused by an act or omission of a third party through a motor vehicle, benefits or rights to which an Insured is entitled under a Compulsory Third Party Liability Insurance as provided by law, shall not be made deductible in the computation of benefits under this Rider.
        </p>

        <div class="subsection-title">Coordination of Benefits</div>
        <p class="section-content paragraph">
            Medical expenses incurred by an Insured that have been covered by and/or paid for by an insurance company or another medical benefits company or similar agencies shall no longer be claimed from the Insurer. Any balance not covered or paid for, if still coverable under this Rider, may be subject for reimbursement by the Insurer.
        </p>
        <p class="section-content paragraph">
            If an Insured has two or more health care coverage under the Insurer, the maximum liability of the Insurer for each of the diseases or conditions and their complications set forth in the General Limitations shall be the amount provided in that coverage with the highest Maximum Limit Per Disability. Any medical benefits expenses incurred by the Insured that has already been covered by and/or paid for by the Insurer under one coverage can no longer be claimed from the Insurer under the other coverage/s.
        </p>

        <div class="subsection-title">First Day Room Upgrade</div>
        <p class="section-content paragraph">
            The Insurer shall cover the excess in room and board, professional fees and ancillary charges above the Insured’s Room and Board Classification for the first day of the emergency confinement except for Suite Room provided that during the admission (1) there were no available rooms according to the Insured’s Room and Board Classification and (2) the Room and Board assigned shall be the next higher Room and Board above the Insured’s Classification. The Insurer reserves the right to transfer the Insured to his respective Room and Board Classification when it is determined to be medically safe by the Insurer Affiliated Physician; otherwise if the Insured refuses to transfer, the excess in room and board charges shall be for the Insured’s personal account.
        </p>

        <div class="subsection-title">Areas with No Affiliated Hospital</div>
        <p class="section-content paragraph">
            In areas wherein the Insurer has no Affiliated Hospital or Medical Facility within a 50- kilometer radius from the place of work or place of residence of the Insured, the Insurer shall reimburse 100% of the coverable and reasonable charges for medical benefits and services incurred by the Insured for emergency case, but not to exceed what the Insurer would have paid had the Insured been treated by an Affiliated Physician in an Affiliated Hospital subject to the limits stated in the Policy Data Page.
        </p>

        <div class="subsection-title">Utilization and Claims Procedure</div>
        <p class="section-content paragraph">
            Before discharge from the Hospital, an Insured must fill up the prescribed Insurer claim form and settle that portion of the medical bill not covered by this Rider. That portion of the bill covered by this Rider shall be settled directly by the Insurer with the hospital and/or attending Physician(s).
        </p>
        <p class="section-content paragraph">
            In case of emergency, the Emergency Benefit Provision specified in this Rider shall apply.
        </p>
        <p class="section-content paragraph">
            In cases wherein the Insurer covered costs were not deducted from the medical bills and an Insured is made to pay for the medical benefits cost, an Insured may request reimbursement of such costs which are covered under this Rider. The request must be made on the prescribed claim form to which shall be attached official receipts, together with supporting charge slips, detailed itemized accounts and other necessary documents. No reimbursement shall be made to the Insured unless such originals are submitted by the Insured or if the Insured has otherwise been fully indemnified or reimbursed of the medical bills or costs incurred under any other medical benefits coverage or insurance policy or any other similar contracts or Agreements. Such request for benefits must be presented within sixty (60) days after the expiration of the period of the treatment for which claim for benefits is being made.
        </p>
        <p class="section-content paragraph">
            The Insurer shall process the payment of all claims in accordance with the terms of this Rider. All benefits that pertain to an Insured or a dependent of an Insured shall be paid by check to the order of said Insured, unless an Insured requests otherwise, or the Insurer, in its discretion, considers it preferable to make the payment in another manner. In case of death of an Insured, any benefit due but remaining unpaid shall be paid to his / her beneficiary.
        </p>

        <!-- Section IV: Exclusions, Limitations & Conditions -->
        <div class="section-title">IV. Exclusions, Limitations & Conditions</div>

        <div class="subsection-title">Pre-Existing Conditions</div>
        <p class="section-content paragraph">
            This Rider shall not cover any Pre-existing illness or condition as herein defined. An illness or condition shall be considered Pre-existing if, during the period prior to the Effective Date of this Rider or the approval date of reinstatement in case of lapse, any of the following conditions are present: a) any professional advice or treatment was given for such illness or condition; b) such illness or condition was in any way evident to the Insured; or c) the pathogenesis of such illness or condition has started whether or not an Insured is aware of such illness or condition.
        </p>
        <p class="section-content paragraph">
            For purposes of this provision, it is hereby understood and agreed that the following conditions and their complications, but not limited to, when occurring during the first year of coverage after the Effective Date or Date of Last Reinstatement shall be considered Pre-existing: (a) endometriosis; (b) hemorrhoids; (c) diseased tonsils requiring surgery; (d) pathological abnormalities of nasal septum and turbinates; (e) hyperthyroidism/goiter; (f) cataracts; (g) sinus condition requiring surgery; (h) epilepsy; (i) asthma; (j) cirrhosis of the liver; (k) tuberculosis; (l) anal fistulae; (m) cholecystitis/cholelithiasis; (n) calculi of the urinary system; (o) gastric or duodenal ulcer; (p) hallux valgus; (q) tumors, whether benign or malignant, of all organs and organ systems, including malignancies of the blood and bone marrow; (r) diabetes mellitus; (s) hypertension; (t) collagen disease; (u) cardiovascular diseases; (v) hernia; (w) HIV/AIDS and (x) chronic skin conditions.
        </p>
        <p class="section-content paragraph">
            The Pre-existing Condition Provision shall no longer be applicable after an Insured has been covered for twelve (12) consecutive months and this Rider is renewed except for illnesses or condition specifically excluded by an endorsement to the provisions of this Rider. This is on the condition that there is no failure to disclose or there is no misrepresentation and concealment, whether intentional or unintentional, of material information in the original application or application for reinstatement.
        </p>
        <p class="section-content paragraph">
            The Insurer shall reimburse according to its standard rates all expenses related to necessary diagnostic procedures to determine or rule out pre-existing illness or condition as stated in the previous paragraph if the results are negative. If the results of the medical tests are positive, the Insurer shall not reimburse the cost of such diagnostic procedures.
        </p>
        <p class="section-content paragraph">
            If the Insured was issued exclusion, whether on initial application, renewal or reinstatement, which the Insured questions or objects to, the diagnostic procedure(s) which may be necessary to resolve the issue shall be for the account of the Insured.
        </p>

        <div class="subsection-title">General Exclusions Applicable to Medical Benefits Coverage</div>
        <p class="section-content">
            No Medical Benefits shall be paid for the following services, procedures or conditions:
        </p>
        <ol style="list-style-type: decimal;">
            <li>Care by Non-Affiliated Physician in either Affiliated or Non-Affiliated Hospitals, except in emergencies wherein the Emergency Provision of this Rider shall apply</li>
            <li>Care by an Affiliated Physician in a Non-Affiliated Hospital</li>
            <li>Additional hospital charges and Professional Fees resulting from taking a Room Category higher than that specified in the Policy Data Page applicable to the Insured, additional personal comfort items (e.g. telephone and television, additional food trays, admission kit and such other items of the same nature)</li>
            <li>Procurement or use of corrective appliances, prosthesis, artificial aids and durable equipment such as but not limited to the following: (a) stents (b) prolene mesh (c) pins, screws, plates, wires (d) VP shunt, clips (e) hearing aids (f) intraocular lens, eyeglasses, contact lenses (g) balloons, valves (h) braces, crutches (i) pace maker</li>
            <li>All pregnancy-related conditions and their complications, requiring medical and surgical care, regardless of time/date of occurrence (during the actual time of pregnancy or thereafter)</li>
            <li>All sexually transmitted diseases</li>
            <li>Circumcision, sterilization of either sex or reversal of such, artificial insemination, sex transformation or diagnosis and treatment of infertility</li>
            <li>Rest cures, custodial, domiciliary and convalescent care. These pertain to care in a skilled affiliated facility or an institution that meets certain standards for medical care and includes nursing care and therapeutic services following hospital confinement</li>
            <li>Cosmetic procedure and surgery and oral surgery solely for purpose of beautification, including but not limited to, wart removals through excision or electrodessication / cauterization, mesotherapy, liposuction, except reconstructive surgery to treat functional defects due to disease or accidental injury</li>
            <li>Blood screening, blood typing, cross-matching for potential donors in relation to blood donation and transfusion</li>
            <li>Weight reduction programs, surgical operation or procedure for treatment of obesity, including but not limited to, gastric stapling</li>
            <li>Dental examination, extractions, fillings and general dental attention and conditions and all complications arising therefrom, except to the extent that are necessary for repair or alleviation of damage to the covered person caused solely by accidental injuries and those dental benefits specified in the Policy Data Page</li>
            <li>All forms of behavioral disorders whether congenital or acquired; developmental or psychiatric disorder; psychosomatic illness including occupational therapy</li>
            <li>Any injury, illness or condition which the Insured may suffer after he has taken intoxicating drugs or alcoholic beverage as evidenced by clinical history or alcoholic breath as determined by the examining physician and/or conditions or illnesses resulting from Alcoholism and Drug Addiction</li>
            <li>Medical or surgical procedures that are experimental in nature and not generally accepted as standard medical treatment by the medical profession, that may include but is not limited to, Chiropractic Services, Acupuncture, and Reflexology</li>
            <li>Allergens used for hypersensitivity testing regardless if administered as an out-patient or in-patient procedure</li>
            <li>All expenses incurred by the Insured in the process of donating organs</li>
            <li>Injuries or illnesses resulting from hazardous activities in which an Insured has engaged in leisure that may include but is not limited to: bungee jumping, scuba diving, hang-gliding, mountain climbing and all such other voluntary activities which pose a danger to life and limb, except those related to or directly connected with the Insured’s occupation as declared in the application for medical benefits coverage under this Rider</li>
            <li>Physical examinations and other related services required for obtaining or continuing employment, insurance or government licensing, or not related to the health maintenance of the Insured</li>
            <li>Injuries or illnesses due to military service or suffered under conditions of war</li>
            <li>Executive check-ups and confinement which are for purely diagnostic purposes except as specified in this Rider</li>
            <li>Injuries or illnesses wherein the care or reimbursement of services is provided by law or a government program, up to the stipulated limits</li>
            <li>Injuries or illness which are self-inflicted, caused by attempt at suicide, or incurred as a result of or while participating in the commission of a crime or acts involving the violation of laws or ordinances</li>
            <li>Take-home medicine, immunizing agents and out-patient medicines, with the exception of intravenous chemotherapy medicine and those administered during an emergency treatment</li>
            <li>Vaccines, whether elective or administered during an emergency treatment are not covered</li>
            <li>All hospital charges and Professional Fees incurred after the day and time the discharge from the hospital has been duly authorized.</li>
            <li>Laser Treatment for the purpose of corrective eye refraction.</li>
            <li><strong>Medico-Legal Fees</strong>: These are professional fees of a medico-legal consultant to whom a patient is referred primarily for the issuance of a medical certificate for legal purposes.</li>
        </ol>

        <div class="subsection-title">General Limitations</div>
        <p class="section-content">
            The rights of an Insured and obligations of the Insurer are subject to the following limitations unless specified in an endorsement to this Rider:
        </p>
        <ol style="list-style-type: decimal;">
            <li>If a major disaster or epidemic causes unavailability of facilities or personnel, or if circumstances not within the control of the Insurer such as temporary lack of hospital facilities, complete or partial destruction of facilities, war, riot, civil insurrection, labor disputes, or similar causes occur, then the Insurer shall not be liable for any delay or failure to provide services to the Insured. The Insurer shall, however, exert its best efforts to provide services to the Insured, as the circumstances permit.</li>
            <li>If an Insured avails of the special modalities of treatment and/ or diagnostic tests, the liability of the Insurer shall be limited to the prevailing costs of hospital bills, professional fees and related expenses ordinarily charged for traditionally accepted treatment modality and/or diagnostic tests.
            <br><br>Notwithstanding this provision, the Insurer’s liability shall be limited to the amounts specified in the Policy Data Page.
            <br><br>All new modalities of treatment and/or diagnostic procedures for which there are no comparable conventional or traditional equivalent or counterparts shall have a maximum limit of P 5,000.00.</li>
            <li>The availment of Laparoscopic Cholecystectomy, Lithotripsy, Transurethral Microwave Therapy of Prostate, Percutaneous Ultrasonic Nephrolithotomy, Ureterolithotripsy or Cryosurgery procedure is limited only to once per contract year. When an Insured chooses the new modalities of treatment specified on page 2 of this Rider, the Insurer shall no longer be liable for the cost of further traditional modes of treatment/diagnostics for the same illness, should they be necessary, or for any of its complications. If an Insured refuses to follow the recommended treatment or procedure and the Primary Physician or Affiliated Physician believes that no professionally acceptable alternative exists, then the Insurer shall no longer be responsible to provide care for the condition under treatment.</li>
            <li>Hospital Service is subject to all rules and regulations of the hospital selected, including the rules and regulations governing admission.</li>
            <li>In no event shall the cost of medical benefits during the one-year term of this Rider exceed the Maximum Disability Benefit Limit stated in the Policy Data Page for the following diseases or conditions and their complications: (a) Neurologic condition; (b) Blood Dyscrasias; (c) Collagen / Immunologic Degenerative Disorders; (d) Liver Cirrhosis; (e) Cardiovascular; (f) Chronic illnesses involving all organ systems; (g) Cancer and all forms of malignancies; (h) Any condition which shall necessitate the use of the ICU; (i) AIDS; (j) Diabetes Mellitus; (k) Accidental Injuries; (l) Dengue Hemorrhagic Fever (DHF) stage III-IV/ Dengue Shock Syndrome; and (m) Sepsis or Septicemia and (n) Ophthalmologic conditions.</li>
            <li>If the Pre-existing Condition of this Rider applies, all congenital anomalies and conditions and its complications shall not be covered. If the Pre-existing Condition Clause is waived for all or some Insureds as specified in the Policy Data Page or in a endorsement, the Insurer shall cover congenital conditions except for illness or conditions specifically excluded by an endorsement to this Rider. However, the total liability of the Insurer during the entire lifetime of the Insured for congenital anomalies or conditions and their complications shall not exceed the Maximum Benefit Limit indicated in the Policy Data Page.</li>
        </ol>

        <!-- Document Code Suffix -->
        <div class="document-code-suffix">
            GMR2012v01
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
