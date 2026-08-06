/**
 * Group Critical Illness Rider - Top 45 (GCIR45) Template
 * 
 * @param {Object} application - Application details (e.g. effective_date)
 * @param {Object} details - Additional parameters (logoDataUri, isReview, etc.)
 * @param {Object} rider - Rider metadata (acronym, rider_name, min_amount, max_amount, unit_value, etc.)
 * @returns {string} HTML string for PDF rendering
 */
export default function generateGCIR45Template(application = {}, details = {}, rider = {}) {
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
    const riderName = rider?.rider_name || 'GROUP CRITICAL ILLNESS RIDER – TOP 45';
    const acronym = rider?.acronym || 'GCIR45';
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
            The following provisions, herein referred to as the Rider, form part of the Policy if its description title is indicated in the Policy Data Page. These conditions shall apply only to this Rider and not to any other portion of the Policy to which this Rider is attached, herein referred to simply as the Policy, unless specifically provided otherwise.
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
            Full Recovery is defined as all of the following conditions arising for at least two (2) continuous and uninterrupted years prior to the effective date of this Rider. Did not receive any medical advice or treatment of pre-existing Cancer, except for purposes of prevention of recurrence of cancer;
        </p>
        <ol class="nested-list">
            <li>Did not receive any medical advice or treatment, except for purposes of prevention of recurrence or cancer spread;</li>
            <li>No signs and symptoms of the pre-existing Cancer;</li>
            <li>Can continuously perform all activities of daily living;</li>
            <li>No emergency room care;</li>
            <li>No minor and/or major surgical operation;</li>
            <li>No confinement in a clinic, hospital, or nursing facility due to the pre-existing Cancer or arising as a complication of the pre-existing Cancer, or as a complication of its treatment; and</li>
            <li>No recurrence, relapse, or progression</li>
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
        <div class="section-title">Definition of Terms</div>
        
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
                    <li>Diagnostic elevation of Troponin T or I at 0.5 mcg/L (0.5ng/mL) and above;</li>
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
            <li>
                <strong>Alzheimer's Disease</strong> shall mean the progressive deterioration or loss of intellectual capacity as confirmed by clinical evaluation and imaging tests resulting in an associated neurological deficit solely responsible for a permanent inability to perform independently at least three (3) of the six (6) Activities of Daily Living. This diagnosis must be supported by the clinical confirmation of a Consultant Neurologist or Psychiatrist, and by the Cedant’s appointed doctor.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Other types of dementia;</li>
                    <li>Alcohol- or drug-related brain disorder or any reversible organic brain disorder; and</li>
                    <li>Non-organic diseases such as psychiatric illnesses and neurosis.</li>
                </ol>
            </li>
            <li>
                <strong>Amyotrophic Lateral Sclerosis (ALS)</strong> shall mean the permanent clinical impairment manifesting with progressive signs of upper motor neuron (UMN) and lower motor neuron (LMN) in at least three (3) body segments (at least Stage 3) resulting to inability to perform at least three (3) of the six (6) Activities of Daily Living for a continuous period of at least three (3) months with no reasonable chance of recovery. The diagnosis must be evidenced by nerve conduction and imaging studies and electromyography (EMG), and confirmed by a Neurologist.<br><br>
                <em>For the above definition, the following are not covered, but not limited to:</em>
                <ol class="nested-list">
                    <li>Familial ALS;</li>
                    <li>Spinal Muscular Atrophy;</li>
                    <li>Post-Polio Syndrome;</li>
                    <li>Polymyositis;</li>
                    <li>Dermatomyositis;</li>
                    <li>Multifocal Motor Neuropathy; and</li>
                    <li>Bulbar Muscular Atrophy (Kennedy’s Disease).</li>
                </ol>
            </li>
            <li>
                <strong>Apallic Syndrome</strong> shall mean the universal necrosis of the brain cortex, with the brainstem remaining intact resulting to persistent vegetative state. The diagnosis must be confirmed by a Consultant Neurologist, and the condition must be documented for at least one (1) month.
            </li>
            <li>
                <strong>Aplastic Anemia</strong> shall mean the chronic persistent bone marrow failure, confirmed by biopsy, which results in anemia, neutropenia, and thrombocytopenia requiring treatment with at least one (1) of the following:
                <ol class="nested-list">
                    <li>Blood product transfusion;</li>
                    <li>Marrow stimulating agents;</li>
                    <li>Immunosuppressive agents; or</li>
                    <li>Bone marrow transplantation.</li>
                </ol>
                The diagnosis must be supported by bone marrow histology findings and confirmed by a Consultant Hematologist.
            </li>
            <li>
                <strong>Bacterial Meningitis</strong> shall mean the persistent neurological deficit documented for at least three (3) months following the date of diagnosis. The diagnosis must be evidenced by growth of pathogenic bacteria from cerebrospinal fluid culture and confirmed by a Consultant Neurologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Viral Meningitis;</li>
                    <li>Parasitic Meningitis;</li>
                    <li>Aseptic Meningitis; and</li>
                    <li>Non-infectious Meningitis.</li>
                </ol>
            </li>
            <li>
                <strong>Benign Brain Tumor</strong> shall mean the non-malignant growth of tissue located in the cranial vault and limited to the brain, cranial nerves, or meninges. The tumor must be treated with at least one (1) of the following:
                <ol class="nested-list">
                    <li>Complete or incomplete surgical removal;</li>
                    <li>External beam radiation; or</li>
                    <li>Stereotactic radiosurgery.</li>
                </ol>
                If none of the treatment options is possible due to medical reasons, the tumor must cause a persistent neurological deficit which has to be documented for at least three (3) months following the date of diagnosis. The diagnosis must be supported by imaging findings and confirmed by a Consultant Neurosurgeon or Neurologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Diagnosis or treatment of any cyst, granuloma, hematoma or malformation of the arteries or veins of the brain;</li>
                    <li>Tumors of the pituitary gland or spine;</li>
                    <li>Tumors of the acoustic nerve; and</li>
                    <li>Angioma and cholesteatoma.</li>
                </ol>
            </li>
            <li>
                <strong>Cardiomyopathy</strong> shall mean the definite diagnosis of one (1) of the following primary cardiomyopathies:
                <ol class="nested-list">
                    <li>Arrhythmogenic Right Ventricular Cardiomyopathy;</li>
                    <li>Dilated Cardiomyopathy;</li>
                    <li>Hypertrophic Cardiomyopathy (obstructive or non-obstructive); or</li>
                    <li>Restrictive Cardiomyopathy.</li>
                </ol>
                The disease must result in at least one (1) of the following:
                <ol class="nested-list">
                    <li>Left ventricular ejection fraction (LVEF) of less than forty percent (40%) measured twice at an interval of at least three (3) months;</li>
                    <li>Implantation of an Implantable Cardioverter Defibrillator (ICD) for the prevention of sudden cardiac death; or</li>
                    <li>Marked limitation of physical activities where less than ordinary activity causes fatigue, palpitation, breathlessness, or chest pain (Class III or IV of the New York Heart Association classification) over a period of at least six (6) months.</li>
                </ol>
                The diagnosis must be evidenced by echocardiogram, cardiac MRI or cardiac CT scan, and confirmed by a Consultant Cardiologist. The implantation of an Implantable Cardioverter Defibrillator (ICD) must be determined to be medically necessary by a Consultant Cardiologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Secondary (hypertensive, ischemic, valvular, metabolic or toxic) cardiomyopathy;</li>
                    <li>Cardiomyopathy due to systemic diseases;</li>
                    <li>Transient reduction of left ventricular function due to myocarditis;</li>
                    <li>Implantation of an Implantable Cardioverter Defibrillator (ICD) due to primary arrhythmias; and</li>
                    <li>Cardiomyopathy caused directly or indirectly, wholly or partly, by coronary artery disease or alcohol or drug abuse.</li>
                </ol>
            </li>
            <li>
                <strong>Chronic Adrenal Insufficiency (Addison's Disease)</strong> shall mean an autoimmune disorder causing a gradual destruction of the adrenal gland resulting in the need for lifelong glucocorticoid and mineral corticoid replacement therapy. The disorder must be confirmed by a specialist in endocrinology through one of the following:
                <ol class="nested-list">
                    <li>ACTH simulation tests;</li>
                    <li>Insulin-induced hypoglycemia test;</li>
                    <li>Plasma ACTH level measurement; or</li>
                    <li>Plasma Renin Activity (PRA) level measurement.</li>
                </ol>
                Only autoimmune cause of primary adrenal insufficiency is included. All other causes of adrenal insufficiency are not covered.
            </li>
            <li>
                <strong>Chronic Recurrent Pancreatitis</strong> shall mean chronic, irreversible inflammation of the pancreas with an idiopathic cause characterized by severe, intractable pain with no reasonable chance of recovery necessitating surgical therapy. It is a result of progressive severe destruction with all of the following characteristics:
                <ol class="nested-list">
                    <li>More than three (3) attacks of acute pancreatitis;</li>
                    <li>Generalize calcium deposits in pancreas from imaging study; and</li>
                    <li>Chronic continuous pancreatic function impairment resulting in malabsorption of intestine (high fat in stool) or diabetes.</li>
                </ol>
                The diagnosis must be confirmed by a Consultant Gastroenterologist and supported by pancreatic function tests, imaging studies, and endoscopic diagnostic procedures.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Congenital abnormalities-related Chronic Pancreatitis (CP);</li>
                    <li>Alcoholic CP; and</li>
                    <li>All other causes of CP.</li>
                </ol>
            </li>
            <li>
                <strong>Coma</strong> shall mean the state of unconsciousness with no reaction or response to external stimuli or internal needs which:
                <ol class="nested-list">
                    <li>Results in a score of eight (8) or less on the Glasgow coma scale for a continuous period of at least ninety-six (96) hours;</li>
                    <li>Results in associated permanent neurological deficit with persisting clinical symptoms which must be assessed at least thirty (30) days after the onset of the coma; and</li>
                    <li>Requires the use of life support systems.</li>
                </ol>
                The diagnosis must be confirmed by a Consultant Neurologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Coma secondary to self-inflicted injury, alcohol or drug use; and</li>
                    <li>Medically induced coma.</li>
                </ol>
            </li>
            <li>
                <strong>Dissecting Aortic Aneurysm</strong> shall mean the undergoing of endovascular repair of an aneurysm of the thoracic or abdominal aorta measuring > 0.5 cm. or rapidly enlarging at > 0.5 cm. per year through stent graft placement. The diagnosis must be certified by a Consultant Vascular Surgeon and supported by imaging studies and surgical report.<br><br>
                For the above definition, procedures to any branches of the thoracic or abdominal aorta is not covered.
            </li>
            <li>
                <strong>Eisenmenger's Syndrome</strong> shall mean the lesions restricted to large septal defects characterized by severe pulmonary hypertension and/or a high pulmonary flow state that are therapeutically to be approached by corrective cardiac surgery, lung and cardiac transplantation.<br><br>
                The diagnosis must be made by a Medical Specialist with echocardiography and cardiac catheterization.<br><br>
                For the above definition, surgically created extracardiac shunts, or palliative and congenital heart disease; and any related treatment for congenital heart disease are not covered.
            </li>
            <li>
                <strong>Elephantiasis</strong> shall mean the surgical correction of hydrocele and scrotal elephantiasis in lymphatic filariasis and skin grafting with surgical correction of limb elephantiasis. The diagnosis must be supported by laboratory tests showing circulating filariae antigen or microfilariae in a blood smear (Wuchereria bancrofti or Brugia malayi), and must be made by a Medical Practitioner who is a qualified specialist.<br><br>
                For the above definition, non-surgically corrected elephantiasis is not covered.
            </li>
            <li>
                <strong>Encephalitis</strong> shall mean the severe inflammation of brain substance, resulting in permanent neurological deficit which must be documented for a minimum period of six (6) weeks. The diagnosis must be supported by any confirmatory diagnostic tests and certified by a Consultant Neurologist. The permanent deficit must result in an inability to perform at least three (3) of the six (6) Activities of Daily Living either with or without the use of mechanical equipment, special devices or other aids and adaptations in use for disabled persons.<br><br>
                Permanent shall mean beyond the hope of recovery with current medical knowledge and technology.<br><br>
                For the above definition, encephalitis as a result of HIV infection is not covered.
            </li>
            <li>
                <strong>End-Stage Lung Disease</strong> shall mean the chronic respiratory failure and evidenced by all of the following:
                <ol class="nested-list">
                    <li>FEV1 (Forced Expiratory Volume at one (1) second) being less than forty percent (40%) of predicted on two (2) occasions at least one (1) month apart;</li>
                    <li>Persistent reduction in partial oxygen pressures (PaO2) below 55 mmHg (7.3 kPa) in arterial blood gas analysis measured without administration of oxygen; and</li>
                    <li>Treatment with oxygen therapy for at least sixteen (16) hours per day for a minimum of three (3) months.</li>
                </ol>
                The diagnosis must be confirmed by a Respiratory Specialist.
            </li>
            <li>
                <strong>Fulminant Viral Hepatitis</strong> shall mean the rare syndrome of massive necrosis of liver parenchyma and decrease in liver size (acute yellow atrophy), as evidenced by all of the following:
                <ol class="nested-list">
                    <li>Typical serological course of acute viral hepatitis;</li>
                    <li>Development of hepatic encephalopathy;</li>
                    <li>Development of liver failure within seven (7) days of onset of symptoms;</li>
                    <li>Coagulopathy with an international normalized ratio (INR) greater than one point five (1.5);</li>
                    <li>Increase in bilirubin levels; and</li>
                    <li>No known history of liver disease.</li>
                </ol>
                The diagnosis must be confirmed by a Consultant Gastroenterologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Fulminant viral hepatitis associated with intravenous drug use; and</li>
                    <li>All other non-viral causes of acute liver failure (including paracetamol or aflatoxin intoxication).</li>
                </ol>
            </li>
            <li>
                <strong>Heart Valve Replacement</strong> shall mean the undergoing of surgery to replace or repair one (1) or more defective heart valves which includes:
                <ol class="nested-list">
                    <li>Heart valve replacement or repair with full sternotomy (vertical division of the breastbone), partial sternotomy or thoracotomy;</li>
                    <li>Catheter-based valvuloplasty;</li>
                    <li>Transcatheter aortic valve implantation (TAVI); and</li>
                    <li>Ross-Procedure.</li>
                </ol>
                The surgery must be supported by echocardiogram or cardiac catheterization findings and determined to be medically necessary by a Consultant Cardiologist or Cardiac Surgeon. For the above definition, transcatheter mitral valve clipping is not covered.
            </li>
            <li>
                <strong>HIV due to Blood Transfusion</strong> shall mean the infection with the Human Immunodeficiency Virus (HIV) resulting from transfusion of blood products. The HIV infection must be evidenced by all of the following:
                <ol class="nested-list">
                    <li>The infection is caused by a medically necessary transfusion of blood products received after commencement of the policy;</li>
                    <li>The institution or transfusion service, which provided the transfusion of blood products, is officially registered with and recognized by the health authorities;</li>
                    <li>The institution or transfusion service which provided the transfusion of blood products admits liability;</li>
                    <li>HIV seroconversion must occur within twelve (12) months of transfusion; and</li>
                    <li>The transfusion of the contaminated blood product must have been carried out within the Philippines.</li>
                </ol>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>HIV infection resulting from transfusion of blood products due to hemophilia or thalassemia major; and</li>
                    <li>HIV infection resulting from any other means of transmission, including sexual activity or drug use.</li>
                </ol>
            </li>
            <li>
                <strong>Occupationally-Acquired HIV</strong> shall mean the infection with the Human Immunodeficiency Virus (HIV) resulting from an incident occurring during normal duties of employment from the following eligible occupations:
                <ol class="nested-list">
                    <li>Medical doctor or dentist;</li>
                    <li>Nurse or midwife;</li>
                    <li>Physician’s assistant or dental assistant;</li>
                    <li>Laboratory worker or laboratory technician;</li>
                    <li>Member of the ambulance service;</li>
                    <li>Hospital housekeeper or hospital maintenance worker;</li>
                    <li>Member of the fire service;</li>
                    <li>Police officer; or</li>
                    <li>Prison officer.</li>
                </ol>
                The HIV infection must be evidenced by all of the following:
                <ol class="nested-list">
                    <li>The incident must have taken place after commencement of the policy;</li>
                    <li>An HIV-negative blood test taken within five (5) days of the incident;</li>
                    <li>HIV seroconversion must occur within twelve (12) months of the incident;</li>
                    <li>The incident must have been reported, investigated and documented in accordance with current guidelines of appropriate authorities; and</li>
                    <li>The incident causing infection must have occurred in the Philippines.</li>
                </ol>
                For the above definition, HIV infection resulting from any other means of transmission, including sexual activity or drug abuse, is not covered.
            </li>
            <li>
                <strong>Liver Cirrhosis</strong> shall mean the end-stage liver disease resulting in cirrhosis and with the following features:
                <ol class="nested-list">
                    <li>Permanent jaundice;</li>
                    <li>Ascites; and</li>
                    <li>Hepatic encephalopathy or hepatorenal syndrome.</li>
                </ol>
                For the above definition, liver disease secondary to alcohol or drug misuse is not covered.
            </li>
            <li>
                <strong>Loss of Hearing</strong> shall mean the permanent and irreversible loss of hearing in both ears as a result of sickness or accidental injury. The diagnosis must be confirmed by a Consultant ENT specialist and evidenced by an average auditory threshold of more than ninety decibels (90 db) at five hundred (500), one thousand (1000) and two thousand (2000) hertz in the better ear using a pure tone audiogram.
            </li>
            <li>
                <strong>Loss of Independent Existence</strong> shall mean the condition as a result of a disease, illness or injury resulting to inability to perform at least three (3) of the six (6) Activities of Daily Living for a continuous period of at least six (6) months with no reasonable chance of recovery. The diagnosis must be confirmed by a Specialist.<br><br>
                For the above definition, non-organic diseases such as neurosis and psychiatric illnesses are not covered.
            </li>
            <li>
                <strong>Loss of Limbs</strong> shall mean the complete severance of two (2) or more limbs at or above the wrist or ankle joint as the result of a medically required amputation or accident. The diagnosis has to be confirmed by a Specialist and supported by essential diagnostic procedures and surgical report.<br><br>
                For the above definition, loss of limbs due to self-inflicted injury is not covered.
            </li>
            <li>
                <strong>Loss of Sight</strong> shall mean the permanent and irreversible vision loss of both eyes resulting from either trauma or disease that cannot be corrected by refractive correction, medication or surgery.<br><br>
                Profound vision loss is evidenced by either a visual acuity of 3/60 or less (0.05 or less in the decimal notation) in the better eye using a Snellen eye chart or a visual field of less than ten degree (10°) diameter in the better eye after best correction. The diagnosis must be confirmed by a Consultant Ophthalmologist.
            </li>
            <li>
                <strong>Loss of Speech</strong> shall mean the total permanent and irreversible loss of the ability to speak as the result of disease or physical injury. The condition has to be present for a continuous period of at least six (6) months. The diagnosis must be confirmed by a Consultant ENT Specialist.<br><br>
                For the above definition, loss of speech due to psychiatric disorders is not covered.
            </li>
            <li>
                <strong>Major Burns</strong> shall mean burns that involve damage or destruction of the skin through its full depth to the underlying tissue (third-degree burns) and covering at least twenty percent (20%) of the body surface as measured by "The Rule of Nines" or the "Lund and Browder Chart". The diagnosis must be confirmed by a Specialist.
            </li>
            <li>
                <strong>Major Head Trauma</strong> shall mean the physical head injury causing significant permanent functional impairment lasting for a minimum period of three (3) months from the date of the trauma or injury. The resultant permanent functional impairment is to be verified by a Consultant Neurologist and must result in an inability to perform at least three (3) of the six (6) Activities of Daily Living either with or without the use of mechanical equipment, special devices or other aids and adaptations in use for disabled persons.<br><br>
                Permanent shall mean beyond the hope of recovery with current medical knowledge and technology.
            </li>
            <li>
                <strong>Medullary Cystic Disease</strong> shall mean the progressive hereditary disease of the kidneys characterized by the presence of cysts in the medulla, tubular atrophy and interstitial fibrosis with the clinical manifestations of anemia, polyuria and renal loss of sodium, progressing to chronic kidney failure, as a result of which either regular hemodialysis or peritoneal dialysis is instituted, or renal transplantation is carried out.<br><br>
                The diagnosis must be certified by a Consultant Nephrologist and supported by renal biopsy.<br><br>
                For the above definition, isolated or benign kidney cysts are not covered.
            </li>
            <li>
                <strong>Motor Neuron Disease</strong> shall mean the definite diagnosis of one of the following progressive degenerative disorders of the central nervous system of unknown etiology resulting in irreversible impairment of motor functions and permanent inability to perform at least three (3) of the six (6) Activities of Daily Living persisting continuously for a minimum period of three (3) months as certified by a Neurologist:
                <ol class="nested-list">
                    <li>Progressive Adult-Onset Spinal Muscular Atrophy;</li>
                    <li>Progressive Adult-Onset Bulbar Palsy; or</li>
                    <li>Primary Lateral Sclerosis.</li>
                </ol>
            </li>
            <li>
                <strong>Multiple Sclerosis</strong> shall mean the definite diagnosis confirmed by a Consultant Neurologist and supported by all of the following criteria:
                <ol class="nested-list">
                    <li>Magnetic resonance imaging (MRI) showing at least two (2) lesions of demyelination in the brain or spinal cord characteristic of multiple sclerosis; and</li>
                    <li>Current clinical impairment of motor or sensory function, which must have persisted for a continuous period of at least six (6) months.</li>
                </ol>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Isolated optic neuritis and neuromyelitis optica; and</li>
                    <li>Possible multiple sclerosis and neurologically or radiologically isolated syndromes suggestive but not diagnostic of multiple sclerosis.</li>
                </ol>
            </li>
            <li>
                <strong>Muscular Dystrophy</strong> shall mean the definite diagnosis of one (1) of the following muscular dystrophies:
                <ol class="nested-list">
                    <li>Becker Muscular Dystrophy</li>
                    <li>Duchenne Muscular Dystrophy</li>
                    <li>Emery-Dreifuss Muscular Dystrophy</li>
                    <li>Facioscapulohumeral Muscular Dystrophy</li>
                    <li>Limb-Girdle Muscular Dystrophy</li>
                    <li>Myotonic Dystrophy (Steinert's Disease)</li>
                    <li>Oculopharyngeal Muscular Dystrophy</li>
                </ol>
                The disease must result in a total inability to perform, by oneself, at least three (3) of the six (6) Activities of Daily Living for a continuous period of at least three (3) months with no reasonable chance of recovery. The diagnosis must be evidenced by electromyography (EMG) and muscle biopsy and confirmed by a Consultant Neurologist.<br><br>
                For the above definition, other forms of myotonia are not covered.
            </li>
            <li>
                <strong>Myasthenia Gravis (MG)</strong> shall mean the severe exacerbation with inability to generate adequate ventilation requiring intubation, with or without mechanical ventilation. The diagnosis must be supported by a confirmatory anti–acetylcholine receptor (AChR) antibody test, other antibody assays, electrodiagnostic and imaging studies, and confirmed by a Consultant Neurologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Drug-induced MG;</li>
                    <li>Juvenile MG;</li>
                    <li>Pregnancy-induced or Pregnancy-related MG.</li>
                </ol>
            </li>
            <li>
                <strong>Necrotizing Fasciitis (NF)</strong> shall mean the rapidly progressive inflammatory infection invading the fascia, with secondary necrosis of the subcutaneous tissues causing deep infection resulting to vascular occlusion, ischemia and tissue necrosis, requiring surgical soft tissue reconstruction or amputation.<br><br>
                The diagnosis must be confirmed by a Consultant Surgeon and supported by a biopsy, blood and imaging studies.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Surgical procedure-related NF;</li>
                    <li>Alcoholism-related NF;</li>
                    <li>Intravenous drug use-related NF; and</li>
                    <li>HIV-related NF.</li>
                </ol>
            </li>
            <li>
                <strong>Paralysis</strong> shall mean the total and irreversible loss of muscle function to the whole of any two (2) limbs as a result of disease of, or injury to, the spinal cord or brain. Limb is defined as the complete leg or the complete arm.<br><br>
                Paralysis must be present for more than three (3) months, supported by clinical and diagnostic findings, and confirmed by a Consultant Neurologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Guillain-Barré-Syndrome;</li>
                    <li>Paralysis due to self-harm or psychological disorders; and</li>
                    <li>Periodic or hereditary paralysis.</li>
                </ol>
            </li>
            <li>
                <strong>Parkinson's Disease</strong> shall mean the unequivocal diagnosis by a Consultant Neurologist and supported by all of the following conditions:
                <ol class="nested-list">
                    <li>Permanent clinical impairment of motor function with associated tremor and muscle rigidity;</li>
                    <li>The disease cannot be controlled with medication; and</li>
                    <li>Inability of the Insured to perform without assistance at least three (3) of the six (6) Activities of Daily Living for a continuous period of at least six (6) months.</li>
                </ol>
                For the above definition, drug-induced or toxic causes of Parkinsonism are not covered.
            </li>
            <li>
                <strong>Poliomyelitis</strong> shall mean the acute poliovirus infection resulting in paralysis of the limb muscles or respiratory muscles. The paralysis must be medically documented for at least three (3) months from the date of diagnosis. The diagnosis must be evidenced by laboratory tests proving the presence of the poliovirus and confirmed by a Consultant Neurologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Poliovirus infections without paralysis;</li>
                    <li>Guillain-Barré syndrome or transverse myelitis; and</li>
                    <li>Other enterovirus infections.</li>
                </ol>
            </li>
            <li>
                <strong>Primary Pulmonary Arterial Hypertension</strong> shall mean the primary and unexplained increase in pulmonary artery pressure causing signs of right heart strain and failure evidenced by all of the following:
                <ol class="nested-list">
                    <li>Mean pulmonary artery pressure of more than 25 mmHg at rest measured by right heart catheterization; and</li>
                    <li>Permanent irreversible physical impairment where less than ordinary activity causes fatigue, palpitation, breathlessness or chest pain (Class III or IV of the New York Heart Association Classification of cardiac impairment) over a period of three (3) months.</li>
                </ol>
                The diagnosis must be evidenced by data provided at cardiac catheterization and confirmed by a Lung Specialist or Consultant Cardiologist.<br><br>
                <em>For the above definition, the following are not covered:</em>
                <ol class="nested-list">
                    <li>Chronic thromboembolic pulmonary hypertension (CTEPH);</li>
                    <li>Pulmonary hypertension secondary to lung, heart or systemic disease; and</li>
                    <li>Drug- or toxin-induced pulmonary hypertension.</li>
                </ol>
            </li>
            <li>
                <strong>Progressive Bulbar Palsy</strong> shall mean the motor neuron disorder that involves the lower motor neurons. Initially, patients with progressive bulbar palsy only have muscle weakness that affects speech and swallowing. The diagnosis must be made by a Medical Specialist as progressive and resulting in permanent neurological deficit with appropriate neuromuscular testing such as Electromyogram (EMG).
            </li>
            <li>
                <strong>Progressive Muscular Atrophy</strong> shall mean the condition characterized by progressive degeneration of corticospinal tracts and anterior horn cells or bulbar efferent neurons. The diagnosis must be confirmed by a Consultant Neurologist as progressive and resulting in permanent irreversible neurological deficits. The disease must result in a total inability to perform, by oneself, at least three (3) of the six (6) Activities of Daily Living for a continuous period of at least three (3) months with no reasonable chance of recovery.
            </li>
            <li>
                <strong>Terminal Illness</strong> shall mean the advanced or rapidly progressing disease which, in the opinion of the Consulting Physician and an appointed Independent Physician, is not curable and will lead to death within twelve (12) months. The Insured must no longer receive active treatment other than that of palliative therapy that reduces the severity of disease symptoms.
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
        <p class="section-content paragraph">
            The Insurer, at its own expense, reserves the right, through its designated examiners, to medically examine the Insured for the sickness resulting to any claim under this Rider.
        </p>

        <!-- Proof of Claim -->
        <div class="section-title">Proof of Claim</div>
        <p class="section-content paragraph">
            Written proof of Critical Illness herein referred to must be submitted to the Insurer on the Insurer's form within ninety (90) days after the date of discharge from the hospital for which claim is made. Failure to submit written proof of diagnosis within such time shall not invalidate nor reduce any claim if it is shown that it was not reasonably possible to submit such proof within the required time and that proof was submitted as soon as was reasonably possible.
        </p>

        <!-- Document Code Suffix -->
        <div class="document-code-suffix">
            GCIR452025v01
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
