/**
 * central repository for Basic Plan and Rider descriptions
 * used to populate the "Summary of Benefits" section in PDF proposals.
 */

export const getPlanBenefitDescription = (planId) => {
  const descriptions = {
    1: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Credit Life Insurance Plan (GCLIP)</strong></p>
        <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
            A type of decreasing term life insurance designed to cover borrower loans based on either the Principal or the Outstanding loans.
        </p>`,
    2: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Term Life Insurance Plan (GTLIP)</strong></p>
        <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
            Pays the amount of insurance of the insured member in the event of his death during the defined period of coverage.
        </p>`,
    3: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Comprehensive Benefits Plan (Retirement)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                A bundled life insurance product which allows for an investment savings which earns an interest for a period of period of investment, with a built-in guaranteed principal sum insured.
            </p>`,
    4: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Accidental Death and Disability Plan (GADDP)</strong></p>
        <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
            A group insurance plan that pays out a percentage of the amount of insurance in cases of accidents in accordance with the schedule
            (Issue Age: 5-64).
        </p>
        <table style="width:100%; border-collapse: collapse; font-size: 8pt; margin-top: 5px; margin-bottom: 15px;">
            <tr style="background:#f0f0f0;">
                <th style="border:1px solid #ccc; padding:4px;">Description</th>
                <th style="border:1px solid #ccc; padding:4px;">Percentage of Amount of Insurance</th>
            </tr>
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">Loss of life</td>
                <td style="border:1px solid #ccc; padding:4px;">100%</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">Loss of two limbs</td>
                <td style="border:1px solid #ccc; padding:4px;">100%</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">Loss of both hands</td>
                <td style="border:1px solid #ccc; padding:4px;">100%</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">Loss of both feet</td>
                <td style="border:1px solid #ccc; padding:4px;">100%</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">Total loss of sight of both eyes</td>
                <td style="border:1px solid #ccc; padding:4px;">100%</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">Loss of hearing of both ears</td>
                <td style="border:1px solid #ccc; padding:4px;">75%</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">Loss of one hand</td>
                <td style="border:1px solid #ccc; padding:4px;">50%</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">Loss of one foot</td>
                <td style="border:1px solid #ccc; padding:4px;">50%</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc; padding:4px;">Loss of sight of one eye</td>
                <td style="border:1px solid #ccc; padding:4px;">50%</td>
            </tr>
        </table>`,

    5: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Accidental Death and Disability Plus Plan (GADDR+)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                A group insurance plan that pays out a certain percentage of the amount of insurance in case of sustained accidental injuries effected directly and independently of all other causes and as a result of such injuries has sustained, within 180 days after the date of accident, in accordance with a particular schedule of payment.
            </p>`,

    6: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Critical Illness Plan - Top 5 (GCI5P)</strong></p>
            <p style="margin: 0 0 10px 0; text-indent: 30px; font-size: 11pt;">
                Pays a pre-determined lump sum amount of Critical Illness Benefit upon receipt of due proof satisfactory to the Company if the Insured is first diagnosed, by a qualified physician, of having any one of the covered Critical Illnesses:
            </p>
            <div style="font-size: 11pt; line-height: 1.5; margin-left: 20px; text-align: justify; margin-bottom: 15px;">
                <p style="margin: 5px 0 2px 0;"><strong>1. Cancer</strong></p>
                <div style="margin-left: 15px;">
                    <p style="margin: 0; text-indent: 20px;">Cancer shall mean the presence of a malignant tumor positively diagnosed with histological confirmation and characterized by the uncontrolled growth of malignant cells with invasion and destruction of normal tissue. The diagnosis must be confirmed by an Oncologist. Leukemia, lymphoma, myelodysplastic syndrome, essential thrombocythemia, polycythemia rubra vera, and microinvasive carcinoma of the breast or cervix uteri are covered.</p>
                    <strong style="font-size: 10pt; color: #555; display: block; margin-top: 5px;">Exclusions:</strong>
                    <ul style="margin: 2px 0 5px 0; padding-left: 15px; font-size: 10pt; color: #555; list-style-type: disc;">
                        <li>Any tumor histologically classified as pre-malignant, non-invasive, carcinoma in-situ, having either borderline malignancy, or having low malignant potential;</li>
                        <li>Lobular carcinoma-in-situ of the breast unless the condition requires mastectomy;</li>
                        <li>All tumors of the prostate unless histologically classified as having a Gleason score of 7 or above or having progressed to at least TNM classification T2bN0M0;</li>
                        <li>Gastric MALT Lymphoma, if the condition can be treated with Helicobacter eradication;</li>
                        <li>Gastrointestinal stromal tumor (GIST) Stage I and II according to the AJCC Cancer Staging Manual, Seventh Edition (2010); and</li>
                        <li>The AJCC Cancer Staging Manual, Seventh Edition.</li>
                    </ul>
                </div>

                <p style="margin: 5px 0 2px 0;"><strong>2. Heart Attack</strong></p>
                <div style="margin-left: 15px;">
                    <p style="margin: 0; text-indent: 20px;">Heart Attack shall mean the death of a portion of heart muscle (myocardial infarction) resulting from ischemia of one or more coronary arteries as evidenced by all of the following:</p>
                    <ul style="margin: 2px 0 2px 0; padding-left: 15px; list-style-type: disc;">
                        <li>Presence of the typical chest pain;</li>
                        <li>New characteristic electrocardiographic (ECG) changes;</li>
                        <li>Characteristic rise of cardiac (heart) enzymes, inclusive of CKMB above the normal levels, or Cardiac Troponin T or I equal to or above 0.5 ng/ml;</li>
                        <li>Diagnostic elevation of Troponin T or I at 0.5 mcg/L (0.5ng/mL) and above; and</li>
                        <li>Left ventricular ejection fraction less than 50% measured three (3) months or more after the event.</li>
                    </ul>
                    <strong style="font-size: 10pt; color: #555; display: block; margin-top: 5px;">Exclusions:</strong>
                    <ul style="margin: 2px 0 5px 0; padding-left: 15px; font-size: 10pt; color: #555; list-style-type: disc;">
                        <li>Other acute coronary syndromes;</li>
                        <li>Angina without myocardial infarction; and</li>
                        <li>A rise in cardiac biomarkers or Troponin T or I following an intra-arterial cardiac procedure including, but not limited to, coronary angiography and coronary angioplasty.</li>
                    </ul>
                </div>

                <p style="margin: 5px 0 2px 0;"><strong>3. Stroke</strong></p>
                <div style="margin-left: 15px;">
                    <p style="margin: 0; text-indent: 20px;">Stroke shall mean the death of brain cells due to an acute cerebrovascular event caused by hemorrhage (including subarachnoid hemorrhage) or intracranial thrombosis, or embolism from an extracranial source with:</p>
                    <ol style="margin: 2px 0 2px 0; padding-left: 15px; list-style-type: lower-alpha;">
                        <li>New objective neurological deficits on clinical examination; and</li>
                        <li>Acute onset of new neurological symptoms.</li>
                    </ol>
                    <p style="margin: 5px 0 0 0; text-indent: 20px;">The neurological deficit must persist for more than thirty (30) days following the date of diagnosis. The diagnosis must be supported by imaging findings and confirmed by a Consultant Neurologist.</p>
                    <strong style="font-size: 10pt; color: #555; display: block; margin-top: 5px;">Exclusions:</strong>
                    <ul style="margin: 2px 0 5px 0; padding-left: 15px; font-size: 10pt; color: #555; list-style-type: disc;">
                        <li>Prolonged Reversible Ischemic Neurological Deficit (PRIND) and Transient Ischemic Attack (TIA);</li>
                        <li>Neurological deficits due to general hypoxia, infection, inflammatory disease, migraine, or medical intervention;</li>
                        <li>Traumatic injury to brain tissue or blood vessels;</li>
                        <li>Death of tissue of the optic nerve or retina / eye stroke; and</li>
                        <li>Incidental imaging findings (CT- or MRI-scan) without clearly related clinical symptoms (silent stroke).</li>
                    </ul>
                </div>

                <p style="margin: 5px 0 2px 0;"><strong>4. Kidney Failure</strong></p>
                <div style="margin-left: 15px;">
                    <p style="margin: 0; text-indent: 20px;">Kidney Failure shall mean the chronic and irreversible failure of both kidneys to function, as a result of which either regular hemodialysis or peritoneal dialysis is instituted, or renal transplantation is carried out. The dialysis must be medically necessary and confirmed by a Consultant Nephrologist. Acute reversible kidney failure with temporary renal dialysis is not covered.</p>
                </div>

                <p style="margin: 5px 0 2px 0;"><strong>5. Coronary Artery Bypass Surgery</strong></p>
                <div style="margin-left: 15px;">
                    <p style="margin: 0; text-indent: 20px;">Coronary Artery Bypass Surgery shall mean the actual undergoing of open chest coronary artery bypass surgery by way of thoracotomy to correct or treat coronary artery disease but not including angioplasty, stent insertion, laser or other intraarterial procedures, and key-hole coronary artery by-pass surgery. The diagnosis must be supported by angiographic evidence of significant coronary artery obstruction and the procedure must be considered medically necessary by a consultant cardiologist.</p>
                    <p style="margin: 5px 0 0 0; text-indent: 20px;">The narrowing or blockage of coronary arteries must satisfy any of the following criteria:</p>
                    <ul style="margin: 2px 0 5px 0; padding-left: 15px; font-size: 10pt; color: #555; list-style-type: disc;">
                        <li>Over 50% left main coronary artery stenosis;</li>
                        <li>Over 70% stenosis of the proximal left anterior descending (LAD) and proximal circumflex arteries;</li>
                        <li>Three-vessel disease in asymptomatic patients or those with mild or stable angina;</li>
                        <li>Three-vessel disease with proximal LAD stenosis in patients with poor left ventricular (LV) function; or</li>
                        <li>Over 70% proximal LAD stenosis with either an ejection fraction (EF) below 50% or demonstrable ischemia on non-invasive testing.</li>
                    </ul>
                </div>

        <hr style="border: none; border-top: 1px dashed #ccc; margin: 10px 0;">

        <p style="margin: 0; font-size: 11pt; text-indent: 10px;">
            <strong>FOR PRE-EXISTING CANCER</strong>
        </p>

        <p style="margin: 0 0 10px 0; text-indent: 30px; font-size: 11pt; text-align: justify; line-height: 1.5;">
            Full Recovery is defined as all of the following conditions arising for at least two (2) continuous and uninterrupted years prior to the effective date of this Plan. Did not receive any medical advice or treatment of pre-existing Cancer, except for purposes of prevention of recurrence of cancer:
        </p>

        <ol style="margin: 0 0 10px 30px; padding-left: 15px; list-style-type: lower-alpha; font-size: 11pt; line-height: 1.5; text-align: justify;">
            <li>Did not receive any medical advice or treatment, except for purposes of prevention of recurrence or cancer spread;</li>
            <li>No signs and symptoms of the pre-existing Cancer;</li>
            <li>Can continuously perform all activities of daily living;</li>
            <li>No emergency room care;</li>
            <li>No minor and/or major surgical operation;</li>
            <li>No confinement in a clinic, hospital, or nursing facility due to the pre-existing Cancer or arising as a complication of the pre-existing Cancer, or as a complication of its treatment; and</li>
            <li>No recurrence, relapse, or progression.</li>
        </ol>

        <p style="margin: 0 15px 15px 0; text-indent: 30px; font-size: 11pt; text-align: justify; line-height: 1.5;">
            Full recovery must be confirmed by the Insured’s attending oncologist or surgeon. The confirmation should cover the entire two (2)-year period and must be accompanied by the results of all the medical examinations, procedures, and treatment performed to prove that the Insured is cancer-free. Insurer reserves the right to require from the Insured further proof to establish full recovery.
        </p>

        <p style="margin: 0; font-size: 11pt; text-indent: 10px;">
            <strong>FOR OTHER PRE-EXISTING ILLNESSES</strong>
        </p>

        <p style="margin: 0 0 10px 0; text-indent: 30px; font-size: 11pt; text-align: justify; line-height: 1.5;">
            Full Recovery is defined as all of the following conditions arising for at least two (2) continuous and uninterrupted years prior to the effective date of this Plan:
        </p>

        <ol style="margin: 0 0 10px 30px; padding-left: 15px; list-style-type: lower-alpha; font-size: 11pt; line-height: 1.5; text-align: justify;">
            <li>Did not receive any medical advice or treatment for other pre-existing illnesses;</li>
            <li>No recurrence, relapse, progression, signs and symptoms of the pre-existing illness;</li>
            <li>Can continuously perform all activities of daily living;</li>
            <li>No emergency room care;</li>
            <li>No minor and/or major surgical operation; and</li>
            <li>No confinement in a clinic, hospital, or nursing facility due to the pre-existing illness or arising as a complication of the pre-existing illness, or as a complication of its treatment.</li>
        </ol>

        <p style="margin: 0 0 10px 0; text-indent: 30px; font-size: 11pt; text-align: justify; line-height: 1.5;">
            All of the following supporting documents must be submitted for all pre-existing illnesses as proofs or medical evidence of full recovery:
        </p>

        <ol style="margin: 0 0 10px 30px; padding-left: 15px; list-style-type: lower-alpha; font-size: 11pt; line-height: 1.5; text-align: justify;">
            <li>Attending Specialist’s Statement;</li>
            <li>Treatment History Report;</li>
            <li>Operative Technique or Surgical Report;</li>
            <li>Histo-pathological or biopsy report;</li>
            <li>Clinic and/or hospital records.</li>
        </ol>

        <p style="margin: 0 15px 15px 0; text-indent: 30px; font-size: 11pt; text-align: justify; line-height: 1.5;">
            Insurer reserves the right to require from the Insured further proof to establish full recovery.
        </p>

        <p style="margin: 0; font-size: 11pt; text-indent: 10px;">
            <strong>WAITING PERIOD</strong>
        </p>

        <p style="margin: 0 15px 15px 0; text-indent: 30px; font-size: 11pt; text-align: justify; line-height: 1.5;">
            No payment shall be made under this Plan for any Critical Illness diagnosed that commenced within ninety (90) days from the effective date of coverage of this Plan or from the last reinstatement date or the date of increase in benefits.
        </p>

        <p style="margin: 0; font-size: 11pt; text-indent: 10px;">
            <strong>SURVIVAL PERIOD</strong>
        </p>

        <p style="margin: 0 15px 15px 0; text-indent: 30px; font-size: 11pt; text-align: justify; line-height: 1.5;">
            Further to the conditions defined in the BENEFITS, the Insured must survive for at least thirty (30) days following such first diagnosis or the minimum assessment periods for covered Critical Illnesses as provided under the descriptions for each of the Critical Illnesses, whichever is longer.
        </p>`,

    7: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Critical Illness Plan - Top 45 (GCI45P)</strong></p>
            <p style="margin: 0 0 10px 0; text-indent: 30px; font-size: 11pt;">
                Pays a pre-determined lump sum amount of Critical Illness Benefit upon receipt of due proof satisfactory to the Company if the Insured is first diagnosed, by a qualified physician, of having any one of the covered Critical Illnesses:
            </p>
            <table style="width:100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 5px; margin-bottom: 15px;">
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; width: 33.33%; text-align:left;">1. Cancer</td>
                    <td style="border:1px solid #ccc; padding:4px; width: 33.33%; text-align:left;">16. Dissecting aortic aneurysm</td>
                    <td style="border:1px solid #ccc; padding:4px; width: 33.34%; text-align:left;">31. Major burns</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">2. Heart attack</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">17. Eisenmenger’s syndrome</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">32. Major head trauma</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">3. Stroke</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">18. Elephantiasis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">33. Medullary cystic disease</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">4. Kidney failure</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">19. Encephalitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">34. Motor neuron disease</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">5. Coronary artery bypass surgery</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">20. End-stage lung disease</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">35. Multiple sclerosis</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">6. Alzheimer’s disease</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">21. Fulminant viral hepatitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">36. Muscular dystrophy</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">7. Amyotrophic Lateral Sclerosis (ALS)</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">22. Heart valve replacement</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">37. Myasthenia gravis (MG)</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">8. Apallic syndrome</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">23. HIV due to blood transfusion</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">38. Necrotizing fasciitis (NF)</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">9. Aplastic anemia</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">24. Occupationally-acquired HIV</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">39. Paralysis</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">10. Bacterial meningitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">25. Liver cirrhosis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">40. Parkinson’s disease</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">11. Benign brain tumor</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">26. Loss of hearing</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">41. Poliomyelitis</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">12. Cardiomyopathy</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">27. Loss of independent existence</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">42. Primary pulmonary arterial hypertension</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">13. Chronic adrenal insufficiency (Addison’s disease)</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">28. Loss of limbs</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">43. Progressive bulbar palsy</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">14. Chronic recurrent pancreatitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">29. Loss of sight</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">44. Progressive muscular atrophy</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">15. Coma</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">30. Loss of speech</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">45. Terminal Illness</td>
                </tr>
            </table>`,
  };
  return descriptions[planId] || "";    
};

export const getRiderBenefitDescription = (riderId) => {
  const riders = {
    // GCLI Riders
    1: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Total and Permanent Disability Rider for Creditors (TPDRCR)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">Pays out the amount of insurance in lump sum if the insured becomes totally and permanently disabled by bodily injury or disease, is prevented from engaging in any occupation, and has been disabled for at least six (6) months.</p>`,

    // GYRT Riders
    2: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Accidental Death Benefit Rider (GADBR)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">Pays an additional amount of insurance in the event of death of the insured member during the defined period.</p>`,

    3: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Accidental Death and Disability Rider (GADDR)</strong></p>
            <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
                Pays out a percentage of the amount of insurance in case of accident in accordance with the schedule
                (Issue Age: 5-64):
            </p>
            <table style="width:100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
                <tr style="background:#f0f0f0;">
                    <th style="border:1px solid #ccc; padding:4px;">Description</th>
                    <th style="border:1px solid #ccc; padding:4px;">Percentage of Amount of Insurance</th>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px;">Loss of life</td>
                    <td style="border:1px solid #ccc; padding:4px;">100%</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px;">Loss of two limbs</td>
                    <td style="border:1px solid #ccc; padding:4px;">100%</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px;">Loss of both hands</td>
                    <td style="border:1px solid #ccc; padding:4px;">100%</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px;">Loss of both feet</td>
                    <td style="border:1px solid #ccc; padding:4px;">100%</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px;">Total loss of sight of both eyes</td>
                    <td style="border:1px solid #ccc; padding:4px;">100%</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px;">Loss of hearing of both ears</td>
                    <td style="border:1px solid #ccc; padding:4px;">75%</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px;">Loss of one hand</td>
                    <td style="border:1px solid #ccc; padding:4px;">50%</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px;">Loss of one foot</td>
                    <td style="border:1px solid #ccc; padding:4px;">50%</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px;">Loss of sight of one eye</td>
                    <td style="border:1px solid #ccc; padding:4px;">50%</td>
                </tr>
            </table>`,

    4: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Accidental Death &amp; Disability Rider Plus (GADDR+) Rider</strong></p>
        <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
            Pays out a certain percentage of the amount of insurance in case the Insured sustains accidental injuries
            effected directly and independently of all other causes and, as a result of such injuries, sustains any of
            the following losses within one hundred eighty (180) days after the date of accident:
        </p>
        <table style="width:100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
            <tr style="background:#f0f0f0;">
                <th style="border:1px solid #ccc; padding:4px;">Description</th>
                <th style="border:1px solid #ccc; padding:4px;">Percentage of Amount of Insurance</th>
            </tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of life</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of two limbs</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of both hands</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of both feet</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Total loss of sight of both eyes</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Injuries resulting in being permanently bedridden</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Any other injury causing permanent total disability</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of hearing of both ears</td><td style="border:1px solid #ccc; padding:4px;">75%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of arm at or above elbow</td><td style="border:1px solid #ccc; padding:4px;">70%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of arm between elbow and wrist</td><td style="border:1px solid #ccc; padding:4px;">60%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of leg at or above knee</td><td style="border:1px solid #ccc; padding:4px;">60%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of one hand</td><td style="border:1px solid #ccc; padding:4px;">50%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of one foot</td><td style="border:1px solid #ccc; padding:4px;">50%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of sight of one eye</td><td style="border:1px solid #ccc; padding:4px;">50%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of all fingers of one hand</td><td style="border:1px solid #ccc; padding:4px;">40%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of hearing - one ear</td><td style="border:1px solid #ccc; padding:4px;">25%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of one finger</td><td style="border:1px solid #ccc; padding:4px;">7%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of all toes of one foot</td><td style="border:1px solid #ccc; padding:4px;">30%</td></tr>
            <tr><td style="border:1px solid #ccc; padding:4px;">Loss of any toe</td><td style="border:1px solid #ccc; padding:4px;">4%</td></tr>
        </table>`,

    5: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Special Accidental Death and Disability Rider (GADDSR)</strong></p>
            <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
                Pays out a percentage of the amount of insurance in case of accident in accordance with the schedule
                (Issue Age: 5-64):
            </p>

            <table style="width:100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 10px;">
                <tr style="background:#f0f0f0;">
                    <th style="border:1px solid #ccc; padding:4px;">Description</th>
                    <th style="border:1px solid #ccc; padding:4px;">Percentage of Amount of Insurance</th>
                </tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of life</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of two limbs</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of both hands</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of arm at or above elbow</td><td style="border:1px solid #ccc; padding:4px;">70%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of arm between elbow and wrist</td><td style="border:1px solid #ccc; padding:4px;">60%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of one hand</td><td style="border:1px solid #ccc; padding:4px;">50%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of all fingers of one hand</td><td style="border:1px solid #ccc; padding:4px;">50%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of thumb</td><td style="border:1px solid #ccc; padding:4px;">15%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of index finger</td><td style="border:1px solid #ccc; padding:4px;">10%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of middle, ring or little finger</td><td style="border:1px solid #ccc; padding:4px;">6%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of both feet</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of leg at or above knee</td><td style="border:1px solid #ccc; padding:4px;">70%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of leg below knee</td><td style="border:1px solid #ccc; padding:4px;">60%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of one foot</td><td style="border:1px solid #ccc; padding:4px;">50%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of all toes of one foot</td><td style="border:1px solid #ccc; padding:4px;">30%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of any toe</td><td style="border:1px solid #ccc; padding:4px;">4%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Total loss of sight of both eyes</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of sight of one eye</td><td style="border:1px solid #ccc; padding:4px;">50%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of speech</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of hearing of both ears</td><td style="border:1px solid #ccc; padding:4px;">100%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Loss of hearing - one ear</td><td style="border:1px solid #ccc; padding:4px;">50%</td></tr>
            </table>

            <p style="margin-top: 0; margin-bottom: 0; font-size: 9pt;"><strong><i>Annual Premium per Head:</i></strong> Classification</p>

            <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
                Upon attaining age 65, GTLIP coverage of an employee will be reduced to 50% of his previous coverage with no riders.
            </p>

            <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
                Yearly submission of proof of good health is required for renewing employees who are beyond 64 years old.
            </p>

            <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
                The liability of the Insurer for Insureds below five years old shall be limited to the following:
            </p>

            <table style="width:100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
                <tr style="background:#f0f0f0;">
                    <th style="border:1px solid #ccc; padding:4px;">Age</th>
                    <th style="border:1px solid #ccc; padding:4px;">Percentage of Amount of Insurance</th>
                </tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Less than one year old</td><td style="border:1px solid #ccc; padding:4px;">10%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">One year old but less than two years old</td><td style="border:1px solid #ccc; padding:4px;">20%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Two years old but less than three years old</td><td style="border:1px solid #ccc; padding:4px;">40%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Three years old but less than four years old</td><td style="border:1px solid #ccc; padding:4px;">60%</td></tr>
                <tr><td style="border:1px solid #ccc; padding:4px;">Four years old but less than five years old</td><td style="border:1px solid #ccc; padding:4px;">80%</td></tr>
            </table>`,

    6: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Total &amp; Permanent Disability (GTPDR) Rider</strong></p>
            <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
                Pays out the amount of insurance in a lump sum if the insured:
            </p>
            <ol style="margin-top:5px; padding-left:20px; font-size: 11pt;">
                <li>Becomes totally and permanently disabled by bodily injury or disease;</li>
                <li>Is prevented from engaging in any occupation for compensation or profit;</li>
                <li>Has been disabled for a continuous period of at least six (6) months; and</li>
                <li>Has not exercised his conversion rights.</li>
            </ol>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                Upon availment of this benefit, all insurance under the Policy with respect to such Insured shall immediately cease.
        </p>`,

    7: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Terminal Illness Rider (GTIR)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">Pays 50% of the amount of insurance in advance under the basic plan, upon diagnosis of terminal illness.</p>`,

    8: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Hospital Income Rider (GHDIR)</strong></p>
            <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
                Provides a daily hospital income benefit if the Insured is confined in a hospital, subject to a waiting period and a maximum number of days. For an additional premium, an additional benefit shall be provided if the Insured is confined in the Intensive Care Unit (ICU).
            </p>
            <p style="margin: 0; text-indent: 10px; font-size: 11pt;">
                <strong>Issue Age:</strong> 18–64
            </p>
            <p style="margin: 0; text-indent: 30px; font-size: 11pt;">
                This benefit shall be paid to the Insured for each day of confinement for at least a continuous stay of eighteen (18) hours as a registered patient in a duly registered hospital and upon the recommendation of a physician.
            </p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                Benefits are payable for up to three hundred sixty-five (365) days of confinement.
            </p>`,

    9: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Accidental Medical Expense Reimbursement (GAMERR) Rider</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                Upon receipt and approval by the Insurer of due proof that an Insured has sustained accidental bodily injuries effected directly and independently of all other causes and, within one hundred eighty (180) days after the date of accident, needed medical treatment, the Insurer shall, subject to the limitations and provisions of the Policy, reimburse the actual medical expense incurred up to the Amount of Insurance of this Rider.
            </p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                Medical expense shall mean the reasonable and customary Physician’s fees, hospitalization fees, medical supplies, and medications, all of which must have been necessarily and reasonably incurred in the medical or surgical treatment of the bodily injury covered by this Rider.
            </p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                Such medical or surgical treatment must be administered by or prescribed by a legally qualified surgeon or physician.
            </p>`,

    10: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Additional/Life Coverage (ALCR)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">Additional Life is a Term Insurance Benefit payable in case of death of the Insured and is automatically paid to the beneficiary regardless of whether the basic life is payable or not.</p>`,

    11: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Burial (Memorial/Service) (BMSR)</strong></p>
            <p style="margin: 0; text-indent: 30px; font-size: 11pt;">An additional GTLIP Policy worth Php50,000.00, which upon death of the member, is exchanged for funeral services to be rendered by PhilPlans with accredited mortuaries nationwide. PhilPlans is a pre-need Company duly registered and authorized by the Insurance Commission.</p>
            <ul style="margin-left: 40px; margin-bottom: 15px;">
                <li>All eligible members are entitled to this benefit.</li>
            </ul>`,

    12: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Medical Rider (GMR)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">Provides medical benefits and coverage for healthcare-related expenses.</p>`,

    13: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Dengue Rider (GDR)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">Reimburses up to a maximum amount if the hospital confinement is due to Dengue Hemorrhagic Fever (30-day waiting period).</p>`,

    // GPA Riders (IDs 14-15)
    14: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Accidental Medical Expense Reimbursement (GAMERR) Rider</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                Upon receipt and approval by the Insurer of due proof that an Insured has sustained accidental bodily injuries effected directly and independently of all other causes and, within one hundred eighty (180) days after the date of accident, needed medical treatment, the Insurer shall, subject to the limitations and provisions of the Policy, reimburse the actual medical expense incurred up to the Amount of Insurance of this Rider.
            </p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                Medical expense shall mean the reasonable and customary Physician’s fees, hospitalization fees, medical supplies, and medications, all of which must have been necessarily and reasonably incurred in the medical or surgical treatment of the bodily injury covered by this Rider.
            </p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">
                Such medical or surgical treatment must be administered by or prescribed by a legally qualified surgeon or physician.
            </p>`,

    15: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Medical Rider (GMR)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">Provides medical benefits and coverage for healthcare-related expenses.</p>`,
    16: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Mosquito-Borne Disease Rider (GMBDR)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">This benefit provides protection due to Dengue Fever or Dengue without warning signs or Severe Dengue, Dengue Hemorrhagic Fever or Dengue with warning signs, or Japanese Encephalitis or Zika Virus infection.</p>`,
    17: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Critical Illness Rider - Top 5 (GCI5R)</strong></p>
            <p style="margin: 0 0 10px 0; text-indent: 30px; font-size: 11pt;">
                Pays a pre-determined lump sum amount of Critical Illness Benefit upon receipt of due proof satisfactory to the Company if the Insured is first diagnosed, by a qualified physician, of having any one of the covered Critical Illnesses:
            </p>
            <table style="width:100%; border-collapse: collapse; font-size: 9pt; margin-top: 5px; margin-bottom: 15px;">
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">1. Cancer</td></tr>
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">2. Heart attack</td></tr>
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">3. Stroke</td></tr>
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">4. Kidney failure</td></tr>
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">5. Coronary artery bypass surgery</td></tr>
            </table>`,
    18: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Critical Illness Rider - Top 45 (GCI45R)</strong></p>
            <p style="margin: 0 0 10px 0; text-indent: 30px; font-size: 11pt;">
                Pays a pre-determined lump sum amount of Critical Illness Benefit upon receipt of due proof satisfactory to the Company if the Insured is first diagnosed, by a qualified physician, of having any one of the covered Critical Illnesses:
            </p>
            <table style="width:100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 5px; margin-bottom: 15px;">
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; width: 33.33%; text-align:left;">1. Cancer</td>
                    <td style="border:1px solid #ccc; padding:4px; width: 33.33%; text-align:left;">16. Dissecting aortic aneurysm</td>
                    <td style="border:1px solid #ccc; padding:4px; width: 33.34%; text-align:left;">31. Major burns</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">2. Heart attack</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">17. Eisenmenger’s syndrome</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">32. Major head trauma</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">3. Stroke</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">18. Elephantiasis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">33. Medullary cystic disease</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">4. Kidney failure</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">19. Encephalitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">34. Motor neuron disease</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">5. Coronary artery bypass surgery</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">20. End-stage lung disease</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">35. Multiple sclerosis</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">6. Alzheimer’s disease</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">21. Fulminant viral hepatitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">36. Muscular dystrophy</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">7. Amyotrophic Lateral Sclerosis (ALS)</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">22. Heart valve replacement</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">37. Myasthenia gravis (MG)</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">8. Apallic syndrome</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">23. HIV due to blood transfusion</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">38. Necrotizing fasciitis (NF)</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">9. Aplastic anemia</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">24. Occupationally-acquired HIV</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">39. Paralysis</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">10. Bacterial meningitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">25. Liver cirrhosis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">40. Parkinson’s disease</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">11. Benign brain tumor</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">26. Loss of hearing</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">41. Poliomyelitis</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">12. Cardiomyopathy</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">27. Loss of independent existence</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">42. Primary pulmonary arterial hypertension</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">13. Chronic adrenal insufficiency (Addison’s disease)</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">28. Loss of limbs</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">43. Progressive bulbar palsy</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">14. Chronic recurrent pancreatitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">29. Loss of sight</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">44. Progressive muscular atrophy</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">15. Coma</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">30. Loss of speech</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">45. Terminal Illness</td>
                </tr>
            </table>`,
    19: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Mosquito-Borne Disease Rider (GMBDR)</strong></p>
            <p style="margin: 0 0 15px 0; text-indent: 30px; font-size: 11pt;">This benefit provides protection due to Dengue Fever or Dengue without warning signs or Severe Dengue, Dengue Hemorrhagic Fever or Dengue with warning signs, or Japanese Encephalitis or Zika Virus infection.</p>`,
    20: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Critical Illness Rider - Top 5 (GCI5R)</strong></p>
            <p style="margin: 0 0 10px 0; text-indent: 30px; font-size: 11pt;">
                Pays a pre-determined lump sum amount of Critical Illness Benefit upon receipt of due proof satisfactory to the Company if the Insured is first diagnosed, by a qualified physician, of having any one of the covered Critical Illnesses:
            </p>
            <table style="width:100%; border-collapse: collapse; font-size: 9pt; margin-top: 5px; margin-bottom: 15px;">
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">1. Cancer</td></tr>
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">2. Heart attack</td></tr>
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">3. Stroke</td></tr>
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">4. Kidney failure</td></tr>
                <tr><td style="border:1px solid #ccc; padding:6px; vertical-align: top;">5. Coronary artery bypass surgery</td></tr>
            </table>`,
    21: `<p style="margin: 0; font-size: 11pt; text-indent: 10px;"><strong>Group Critical Illness Rider - Top 45 (GCI45R)</strong></p>
            <p style="margin: 0 0 10px 0; text-indent: 30px; font-size: 11pt;">
                Pays a pre-determined lump sum amount of Critical Illness Benefit upon receipt of due proof satisfactory to the Company if the Insured is first diagnosed, by a qualified physician, of having any one of the covered Critical Illnesses:
            </p>
            <table style="width:100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 5px; margin-bottom: 15px;">
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; width: 33.33%; text-align:left;">1. Cancer</td>
                    <td style="border:1px solid #ccc; padding:4px; width: 33.33%; text-align:left;">16. Dissecting aortic aneurysm</td>
                    <td style="border:1px solid #ccc; padding:4px; width: 33.34%; text-align:left;">31. Major burns</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">2. Heart attack</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">17. Eisenmenger’s syndrome</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">32. Major head trauma</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">3. Stroke</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">18. Elephantiasis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">33. Medullary cystic disease</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">4. Kidney failure</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">19. Encephalitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">34. Motor neuron disease</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">5. Coronary artery bypass surgery</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">20. End-stage lung disease</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">35. Multiple sclerosis</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">6. Alzheimer’s disease</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">21. Fulminant viral hepatitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">36. Muscular dystrophy</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">7. Amyotrophic Lateral Sclerosis (ALS)</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">22. Heart valve replacement</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">37. Myasthenia gravis (MG)</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">8. Apallic syndrome</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">23. HIV due to blood transfusion</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">38. Necrotizing fasciitis (NF)</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">9. Aplastic anemia</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">24. Occupationally-acquired HIV</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">39. Paralysis</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">10. Bacterial meningitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">25. Liver cirrhosis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">40. Parkinson’s disease</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">11. Benign brain tumor</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">26. Loss of hearing</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">41. Poliomyelitis</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">12. Cardiomyopathy</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">27. Loss of independent existence</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">42. Primary pulmonary arterial hypertension</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">13. Chronic adrenal insufficiency (Addison’s disease)</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">28. Loss of limbs</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">43. Progressive bulbar palsy</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">14. Chronic recurrent pancreatitis</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">29. Loss of sight</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">44. Progressive muscular atrophy</td>
                </tr>
                <tr>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">15. Coma</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">30. Loss of speech</td>
                    <td style="border:1px solid #ccc; padding:4px; text-align:left;">45. Terminal Illness</td>
                </tr>
            </table>`,
  };
    return riders[riderId] || "";
};

/**
 * Generates the full HTML for the Summary of Benefits section.
 * @param {Object} application - The application record.
 * @param {Array} selectedRiders - Array of rider objects from the database/details.
 */
export const generateSummaryOfBenefits = (application, selectedRiders = []) => {
let html = `<div class="summary-benefits">`;

  // 1. Add Basic Plan
  const planDescription = getPlanBenefitDescription(
    application.basic_plan_id || application.plan_id,
  );
  if (planDescription) {
    html += `<div class="benefit-item">
                    <h4 style="margin-bottom: 0;">Product:</h4>
                    ${planDescription}
                 </div>`;
  }

  // 2. Add Riders
  if (selectedRiders && selectedRiders.length > 0) {
    html += `<div class="benefit-item">
                    <h4 style="margin-bottom: 0;">Rider(s):</h4>`;
    selectedRiders.forEach((rider) => {
      const riderDesc = getRiderBenefitDescription(rider.rider_id);
      if (riderDesc) {
        html += `<div class="rider-desc">${riderDesc}</div>`;
      }
    });

    html += `</div>`;
  }

  // 3. Add Age-specific limitations for GTLIP (If Product 2)
  if (Number(application.product_id) === 2) {
    html += `<div class="benefit-item">
                    <h3>Special Provisions:</h3>
                    <ul>
                        <li>Upon attaining age 65, GTLIP coverage will be reduced to 50% of the previous coverage with no riders.</li>
                        <li>Liability for Insureds below five years old:
                            <ul>
                                <li>Less than 1 yr: 10%</li>
                                <li>1 yr to < 2 yrs: 20%</li>
                                <li>2 yrs to < 3 yrs: 40%</li>
                                <li>3 yrs to < 4 yrs: 60%</li>
                                <li>4 yrs to < 5 yrs: 80%</li>
                            </ul>
                        </li>
                    </ul>
                 </div>`;
  }

  html += `</div>`;
  return html;
};
