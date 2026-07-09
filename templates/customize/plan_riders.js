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
