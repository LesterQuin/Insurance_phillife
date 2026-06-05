/**
 * central repository for Basic Plan and Rider descriptions
 * used to populate the "Summary of Benefits" section in PDF proposals.
 */

export const getPlanBenefitDescription = (planId) => {
    const descriptions = {
        1: `<strong>Group Credit Life Insurance Plan (GCLIP)</strong><br>
            A type of decreasing term life insurance designed to cover borrower loans based on either the Principal or the Outstanding loans.`,
        2: `<strong>Group Term Life Insurance Plan (GTLIP)</strong><br>
            Pays the amount of insurance of the insured member in the event of his death during the defined period of coverage.`,
        3: `<strong>Group Comprehensive Benefits Plan (Retirement)</strong><br>
            A bundled life insurance product which allows for an investment savings which earns an interest for a period of period of investment, with a built-in guaranteed principal sum insured.`,
        4: `<strong>Group Accidental Death and Disability Plan (GADDP)</strong><br>
            A group insurance plan that pays out a percentage of the amount of insurance in cases of accidents in accordance with the schedule (Issue Age: 5-64).<br>
            <table style="width:100%; border-collapse: collapse; font-size: 8pt; margin-top: 5px;">
                <tr style="background:#f0f0f0;"><th>Description</th><th>Percentage</th></tr>
                <tr><td>Loss of life / Two Limbs / Both Hands or Feet / Sight of Both Eyes</td><td>100%</td></tr>
                <tr><td>Loss of hearing of both ears</td><td>75%</td></tr>
                <tr><td>Loss of one hand / one foot / sight of one eye</td><td>50%</td></tr>
            </table>`,
        5: `<strong>Group Accidental Death and Disability Plus Plan (GADDR+)</strong><br>
            A group insurance plan that pays out a certain percentage of the amount of insurance in case of sustained accidental injuries effected directly and independently of all other causes and as a result of such injuries has sustained, within 180 days after the date of accident, in accordance with a particular schedule of payment.`
    };
    return descriptions[planId] || "";
};

export const getRiderBenefitDescription = (riderId) => {
    const riders = {
        // GCLI Riders
        1: `<h4>Total and Permanent Disability Rider for Creditors (TPDRCR)</h4>
            <p>Pays out the amount of insurance in lump sum if the insured becomes totally and permanently disabled by bodily injury or disease, is prevented from engaging in any occupation, and has been disabled for at least six (6) months.</p>`,
        
        // GYRT Riders
        2: `<h4>Group Accidental Death Benefit Rider (GADBR)</h4>
            <p>Pays an additional amount of insurance in the event of death of the insured member during the defined period.</p>`,
        
        3: `<h4>Group Accidental Death and Disability Rider (GADDR)</h4>
            <p>Pays out a percentage of the amount of insurance in case of accident (Issue Age: 5-64):</p>
            <table style="width:100%; border-collapse: collapse; font-size: 9pt;">
                <tr style="background:#f0f0f0;"><th>Description</th><th>Percentage</th></tr>
                <tr><td>Loss of life</td><td>100%</td></tr>
                <tr><td>Loss of two limbs / hands / feet</td><td>100%</td></tr>
                <tr><td>Total loss of sight of both eyes</td><td>100%</td></tr>
                <tr><td>Loss of hearing of both ears</td><td>75%</td></tr>
                <tr><td>Loss of one hand / foot / sight of one eye</td><td>50%</td></tr>
            </table>`,

        4: `<h4>Group Accidental Death and Disability Rider Plus (GADDR+)</h4>
            <p>Pays indemnity for accidental injuries sustained within 180 days of the accident:</p>
            <table style="width:100%; border-collapse: collapse; font-size: 8pt;">
                <tr style="background:#f0f0f0;"><th>Schedule of Indemnities</th><th>Percentage</th></tr>
                <tr><td>Loss of life / Two Limbs / Both Hands or Feet</td><td>100%</td></tr>
                <tr><td>Permanently bedridden / Permanent Total Disability</td><td>100%</td></tr>
                <tr><td>Loss of hearing of both ears</td><td>75%</td></tr>
                <tr><td>Loss of arm at or above elbow</td><td>70%</td></tr>
                <tr><td>Loss of leg at or above knee</td><td>60%</td></tr>
                <tr><td>Loss of one hand / one foot / sight of one eye</td><td>50%</td></tr>
                <tr><td>Loss of all fingers of one hand</td><td>40%</td></tr>
                <tr><td>Loss of hearing - one ear</td><td>25%</td></tr>
            </table>`,

        5: `<h4>Group Special Accidental Death and Disability Rider (GSADDR)</h4>
            <p>Indemnity schedule for accidents (Issue Age: 5-64):</p>
            <table style="width:100%; border-collapse: collapse; font-size: 8pt;">
                <tr style="background:#f0f0f0;"><th>Description</th><th>Percentage</th></tr>
                <tr><td>Loss of life / Two Limbs / Both Feet</td><td>100%</td></tr>
                <tr><td>Loss of speech / Total loss of sight of both eyes</td><td>100%</td></tr>
                <tr><td>Loss of arm at or above elbow / Loss of leg at or above knee</td><td>70%</td></tr>
                <tr><td>Loss of one hand / one foot / sight of one eye / All fingers of one hand</td><td>50%</td></tr>
                <tr><td>Loss of thumb</td><td>15%</td></tr>
                <tr><td>Loss of index finger</td><td>10%</td></tr>
            </table>`,

        6: `<h4>Group Total and Permanent Disability Rider (GTPDR)</h4>
            <p>Pays out the amount of insurance in lump sum if the insured becomes totally and permanently disabled by bodily injury or disease for at least six (6) months.</p>`,

        7: `<h4>Group Terminal Illness Rider (GTIR)</h4>
            <p>Pays 50% of the amount of insurance in advance under the basic plan, upon diagnosis of terminal illness.</p>`,

        8: `<h4>Group Hospital Income Rider (GHIR)</h4>
            <p>Provides a daily hospital income benefit for each day of confinement (minimum 18 hours) up to 365 days. (Issue Age: 18-64)</p>`,

        9: `<h4>Group Accidental Medical Expense Reimbursement Rider (GAMERR)</h4>
            <p>Reimburses actual medical expenses (physician's fees, hospitalization, meds) incurred within 180 days of an accident, up to the Rider's limit.</p>`,

        10: `<h4>Additional/Life Coverage (ALCR)</h4>
             <p>Provides supplemental life insurance coverage in addition to the basic plan.</p>`,

        11: `<h4>Burial (Memorial/Service) (BMSR)</h4>
             <p>Provides financial assistance or services specifically for funeral and burial expenses.</p>`,

        12: `<h4>Group Medical Rider (GMR)</h4>
             <p>Provides medical benefits and coverage for healthcare-related expenses.</p>`,

        13: `<h4>Group Dengue Rider (GDR)</h4>
             <p>Reimburses up to a maximum amount if the hospital confinement is due to Dengue Hemorrhagic Fever (30-day waiting period).</p>`,

        // GPA Riders (IDs 14-15)
        14: `<h4>Group Accidental Medical Expense Reimbursement Rider (GAMERR)</h4>
            <p>Reimburses actual medical expenses (physician’s fees, hospitalization, meds) necessarily incurred in medical or surgical treatment within 180 days after the date of accident, up to the Amount of Insurance of this Rider.</p>`,

        15: `<h4>Group Medical Rider (GMR)</h4>
             <p>Provides medical benefits and coverage for healthcare-related expenses.</p>`
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
    const planDescription = getPlanBenefitDescription(application.basic_plan_id || application.plan_id);
    if (planDescription) {
        html += `<div class="benefit-item">
                    <h3>Basic Plan</h3>
                    <p>${planDescription}</p>
                 </div>`;
    }

    // 2. Add Riders
    if (selectedRiders && selectedRiders.length > 0) {
        html += `<div class="benefit-item">
                    <h3>Optional Riders</h3>`;
        
        selectedRiders.forEach(rider => {
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
                    <h3>Special Provisions</h3>
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