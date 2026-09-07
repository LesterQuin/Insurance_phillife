import { generateTatTableHtml } from './tat_table_generator.js';

/**
 * Group Personal Accident (GPA GADDP) Policy Contract Template
 * Standalone template containing the full contract structure.
 * 
 * @param {Object} application - The application/proposal data.
 * @param {Object} details - Additional helper details.
 * @param {string} riderTemplatesHtml - Rendered HTML of selected riders.
 * @returns {string} The complete HTML document.
 */
export function generateGPAGADDPPolicyContract(application = {}, details = {}, riderTemplatesHtml = '') {
    const logoDataUri = details?.logoDataUri || '';
    const showReviewWatermark = details?.isReview !== false;

    const _contributionText = application?.contribution_text || '';
    const hasEligibleIndividualsGPA = (application?.eligible_individuals && application.eligible_individuals.trim() !== '');
    const hasContributionGPA = (_contributionText && _contributionText.trim() !== '');
    const hasParticipationGPA = (application?.participation_minimum_no && String(application.participation_minimum_no).trim() !== '');
    const hasSpecialProvisionsGPA = (application?.provision_text && application.provision_text.trim() !== '');

    const hasScheduleOfInsuranceGPA = (application?.first_due_date && application.first_due_date.trim() !== '') || 
                                      (application?.renewal_due_date && application.renewal_due_date.trim() !== '') || 
                                      (application?.additions_due_date && application.additions_due_date.trim() !== '');

    const hasAnyEbamInput = hasScheduleOfInsuranceGPA || 
                            hasSpecialProvisionsGPA || 
                            hasContributionGPA || 
                            hasEligibleIndividualsGPA || 
                            hasParticipationGPA;

    let cleanRidersHtml = riderTemplatesHtml;
    if (details.showSignoff === false && cleanRidersHtml.endsWith('<div class="page-break"></div>')) {
        cleanRidersHtml = cleanRidersHtml.substring(0, cleanRidersHtml.length - '<div class="page-break"></div>'.length);
    }

    // Company & Client Info
    const groupName = application?.group_name || 'COFORGE BPS PHILIPPINES, INC.';
    const businessAddress = application?.business_address || 'Ground Floor, Vector-3, Northgate Cyberzone, Filinvest City, Alabang 1781 City of Muntinlupa, NCR';
    
    // Dates & Policy Number
    const isBooked = !!(application?.policy_no && application.policy_no.trim() !== '') || application?.status_id === 7 || application?.proposal_status_id === 7;
    const effectiveDateObj = application?.effective_date 
        ? new Date(application.effective_date) 
        : (isBooked ? (application?.updated_at ? new Date(application.updated_at) : new Date()) : null);
    const effectiveDate = effectiveDateObj || new Date();
    const effectiveYear = effectiveDate.getFullYear().toString().substring(2);
    const effectiveDateStr = effectiveDateObj 
        ? effectiveDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
        : '';

    const basicPlanName = application?.basic_plan_name || application?.plan_name || 'Group Accidental Death, Dismemberment and Disability Plan (GADDP)';
    const policyNo = (application?.policy_no && application.policy_no.trim() !== '') 
        ? application.policy_no 
        : `G-ADD-${effectiveYear}-`;

    const addresseeName = application?.proposal_addressee || (application?.contact_person_firstname || application?.contact_person_lastname ? `${application.contact_person_firstname || ''} ${application.contact_person_lastname || ''}`.trim() : 'JONH DOE');
    const addresseeDesignation = application?.addressee_designation || 'Branch Manager';

    const renderParticipationRequirements = (appOrVal) => {
        let percentage = '100%';
        let minimumNoVal = null;

        if (typeof appOrVal === 'object' && appOrVal !== null) {
            percentage = appOrVal.participation_percentage || appOrVal.percentage || '100%';
            minimumNoVal = appOrVal.participation_minimum_no ?? appOrVal.minimum_no;
            
            // If legacy participation_requirements string exists
            if (!minimumNoVal && appOrVal.participation_requirements) {
                const reqRaw = appOrVal.participation_requirements;
                if (typeof reqRaw === 'string' && (reqRaw.trim().startsWith('{') || reqRaw.trim().startsWith('['))) {
                    try {
                        const parsed = JSON.parse(reqRaw);
                        percentage = parsed.percentage || percentage;
                        minimumNoVal = parsed.minimum_no;
                    } catch (e) {
                        minimumNoVal = reqRaw;
                    }
                } else {
                    minimumNoVal = reqRaw;
                }
            }
        } else if (typeof appOrVal === 'string') {
            if (appOrVal.trim().startsWith('{') || appOrVal.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(appOrVal);
                    percentage = parsed.percentage || '100%';
                    minimumNoVal = parsed.minimum_no;
                } catch (e) {
                    minimumNoVal = appOrVal;
                }
            } else {
                minimumNoVal = appOrVal;
            }
        }

        let minNoHtml = '';
        let alignStyle = 'text-align: center;';

        if (Array.isArray(minimumNoVal)) {
            minNoHtml = `<ul style="margin: 0; padding-left: 15px; list-style-type: disc; text-align: left;">${minimumNoVal.map(item => `<li style="line-height: 1.4; font-size: 8.5pt;">${(item || '').trim()}</li>`).join('')}</ul>`;
            alignStyle = 'text-align: left;';
        } else if (minimumNoVal) {
            minNoHtml = String(minimumNoVal).trim();
            if (minNoHtml.includes('<')) {
                alignStyle = 'text-align: left;';
            }
        }

        return `
            <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
                <tbody>
                    <tr>
                        <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; width: 40%; font-style: italic;">Percentage of all Eligible Individuals</td>
                        <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; text-align: center; font-style: italic;">${percentage}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; font-style: italic; vertical-align: middle;">Minimum Number of Insureds</td>
                        <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; ${alignStyle} vertical-align: middle;">${minNoHtml}</td>
                    </tr>
                </tbody>
            </table>
        `;
    };

    // Provisions fields falling back to standard GPA values
    const eligibleIndividuals = application?.eligible_individuals || ``;
    const contributionText = application?.contribution_text || ``;
    const participationRequirements = application?.participation_requirements || ``;
    const specialProvisions = application?.special_underwriting_provisions || application?.special_provisions || application?.provision_text || ``;

    let paymentModeRaw = application?.payment_mode_name || application?.payment_mode?.name || application?.mode_of_payment || application?.payment_mode || '';
    if (!paymentModeRaw && application?.payment_mode_id) {
        const pId = Number(application.payment_mode_id);
        if (pId === 1 || pId === 35) paymentModeRaw = 'Annual';
        else if (pId === 2 || pId === 36) paymentModeRaw = 'Semi-Annual';
        else if (pId === 3 || pId === 37) paymentModeRaw = 'Quarterly';
        else if (pId === 4 || pId === 38) paymentModeRaw = 'Monthly';
    }
    if (!paymentModeRaw) {
        paymentModeRaw = 'Annual';
    }
    const paymentModeUpper = paymentModeRaw.toUpperCase();
    const premiumHeaderTitle = `${paymentModeUpper} PREMIUMS`;

    // Coverage Rankings vs Uniform
    const coverageTypeId = Number(application?.coverage_type_id || 0);
    const isUniform = coverageTypeId === 31 || (application?.coverage_type_name || '').toUpperCase().includes('UNIFORM');

    let rankingsList = [];
    let isSalaryRanking = false;
    if (!isUniform) {
        if (Array.isArray(application?.level_ranking) && application.level_ranking.length > 0) {
            rankingsList = application.level_ranking;
            isSalaryRanking = false;
        } else if (Array.isArray(application?.salary_ranking) && application.salary_ranking.length > 0) {
            rankingsList = application.salary_ranking;
            isSalaryRanking = true;
        } else if (Array.isArray(application?.rankings) && application.rankings.length > 0) {
            rankingsList = application.rankings;
            // Detect salary by rank from coverage type id (34) or name
            isSalaryRanking = coverageTypeId === 34 || (application?.coverage_type_name || '').toUpperCase().includes('SALARY');
        }
    }

    const riders = Array.isArray(application?.riders) ? application.riders : [];

    // Base Plan Rate resolution
    let basicRateVal = null;
    if (application?.premium_rate) {
        basicRateVal = Number(application.premium_rate);
    } else if (details?.rates && details.rates.length > 0) {
        const basicRateRow = details.rates.find(r => r.rider_id === '0' || r.rider_id === 0 || !r.rider_id);
        if (basicRateRow && basicRateRow.premium_rate) {
            basicRateVal = Number(basicRateRow.premium_rate);
        }
    }

    // Base Plan Termination Age: Max Age + 1
    const basicMaxAgeInput = application?.maximum_age ?? application?.max_age ?? application?.entry_age_max ?? application?.age_max ?? application?.max_entry_age ?? application?.age_to ?? (application?.termination_age ? (Number(application.termination_age) - 1) : 65);
    const basicMaxAgeNum = Number(basicMaxAgeInput);
    const basicTerminationAgeNum = (!isNaN(basicMaxAgeNum) && basicMaxAgeNum > 0) ? basicMaxAgeNum + 1 : 66;
    const basicTerminationAgeStr = `${basicTerminationAgeNum} years old`;

    let scheduleRowsHtml = '';

    if (rankingsList.length > 0) {
        // Grouped by Classification / Ranking (e.g. Supervisor, Rank & File)
        rankingsList.forEach(rank => {
            const desigRaw = rank.designation || rank.rank_name || rank.classification || 'Classification';

            // Detect MBS (Monthly Basic Salary) multiplier-based coverage
            // Only applies when the source is salary_ranking, not level_ranking
            const hasMBSMultiplier = isSalaryRanking && !!(rank.salary_multiplier || rank.multiplier);

            // Amount for this classification
            let baseAmtNumber = null;
            if (rank.total_coverage_amount !== undefined && rank.total_coverage_amount !== null && rank.total_coverage_amount !== '') {
                baseAmtNumber = Number(rank.total_coverage_amount);
            } else if (rank.amount !== undefined && rank.amount !== null && rank.amount !== '') {
                baseAmtNumber = Number(rank.amount);
            } else if (rank.uniform_coverage_amount !== undefined && rank.uniform_coverage_amount !== null && rank.uniform_coverage_amount !== '') {
                baseAmtNumber = Number(rank.uniform_coverage_amount);
            } else if (application?.coverage_amount) {
                baseAmtNumber = Number(application.coverage_amount);
            }

            let baseAmtDisplay = baseAmtNumber !== null
                ? '₱ ' + baseAmtNumber.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '<span style="color: #e53e3e; font-style: italic;">Actuarial Team</span>';

            if (hasMBSMultiplier || coverageTypeId === 34) {
                const multVal = rank.salary_multiplier || rank.multiplier;
                if (multVal) {
                    const mult = String(multVal).replace(/[xX]/g, '').trim();
                    // MBS-based: show "X x MBS" regardless of whether baseAmtNumber exists
                    baseAmtDisplay = `${mult} x MBS`;
                }
            }

            const baseRateDisplay = basicRateVal !== null 
                ? basicRateVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                : '<span style="color: #e53e3e; font-style: italic;">(Rate)</span>';

            // Per head: if MBS-based, cannot compute a fixed value
            const basePerHead = (!hasMBSMultiplier && baseAmtNumber !== null && basicRateVal !== null) ? (baseAmtNumber / 1000) * basicRateVal : null;
            const basePerHeadDisplay = hasMBSMultiplier
                ? 'DEPEND ON MBS'
                : (basePerHead !== null 
                    ? '₱ ' + basePerHead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : '<span style="color: #e53e3e; font-style: italic;">₱ 0.00</span>');

            let groupTotalPerHead = basePerHead !== null ? basePerHead : 0;

            // Classification Heading
            scheduleRowsHtml += `
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold; font-style: italic; background-color: #ffffff;" colspan="5">
                        ${desigRaw.toUpperCase()}:
                    </td>
                </tr>
                <!-- Basic Plan Row -->
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 6px 6px 20px; font-style: italic;">
                        (${basicPlanName})
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-style: italic;">
                        ${baseAmtDisplay}
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                        ${baseRateDisplay}
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-style: italic;">
                        ${basePerHeadDisplay}
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                        ${basicTerminationAgeStr}
                    </td>
                </tr>
            `;

            // Riders for this classification
            riders.forEach(r => {
                const riderName = r.rider_name || r.name || r.acronym || 'Supplemental Rider';
                const acronym = (r.acronym || '').toUpperCase();

                // Find matching value for this ranking if available
                const matchedVal = Array.isArray(r.values) 
                    ? r.values.find(v => (v.designation || '').trim().toUpperCase() === desigRaw.trim().toUpperCase())
                    : (Array.isArray(r.rider_values) 
                        ? r.rider_values.find(v => (v.designation || '').trim().toUpperCase() === desigRaw.trim().toUpperCase())
                        : null);

                let riderAmt = null;
                if (matchedVal && matchedVal.amount !== undefined && matchedVal.amount !== null && matchedVal.amount !== '') {
                    riderAmt = Number(matchedVal.amount);
                } else if (r.amount !== undefined && r.amount !== null && r.amount !== '') {
                    riderAmt = Number(r.amount);
                } else if (r.rider_amount !== undefined && r.rider_amount !== null && r.rider_amount !== '') {
                    riderAmt = Number(r.rider_amount);
                } else if (r.coverage_amount !== undefined && r.coverage_amount !== null && r.coverage_amount !== '') {
                    riderAmt = Number(r.coverage_amount);
                } else if (r.sum_insured !== undefined && r.sum_insured !== null && r.sum_insured !== '') {
                    riderAmt = Number(r.sum_insured);
                } else {
                    riderAmt = baseAmtNumber;
                }

                // --- Rider Amount Display ---
                let riderAmtDisplay = '';
                if (isSalaryRanking) {
                    // Salary by rank: show multiplier x MBS
                    // Use rider's own multiplier, or fall back to the base rank's multiplier
                    const riderMultVal = r.salary_multiplier || r.multiplier || matchedVal?.salary_multiplier || matchedVal?.multiplier
                        || rank.salary_multiplier || rank.multiplier;
                    if (acronym.includes('GTIR') || (r.rider_name || '').toUpperCase().includes('TERMINAL ILLNESS')) {
                        riderAmtDisplay = '50% of ' + (application?.acronym || 'GADDP');
                    } else if (riderMultVal) {
                        const rMult = String(riderMultVal).replace(/[xX]/g, '').trim();
                        riderAmtDisplay = `${rMult} x MBS`;
                    } else {
                        riderAmtDisplay = 'DEPEND ON MBS';
                    }
                } else if (acronym.includes('GTIR') || (r.rider_name || '').toUpperCase().includes('TERMINAL ILLNESS')) {
                    riderAmtDisplay = '50% of ' + (application?.acronym || 'GADDP');
                } else if (riderAmt && !isNaN(riderAmt)) {
                    riderAmtDisplay = '₱' + riderAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else {
                    riderAmtDisplay = '<span style="color: #e53e3e; font-style: italic;">Actuarial Team</span>';
                }

                // --- Rate ---
                let riderRateVal = null;
                if (r.rate !== undefined && r.rate !== null && r.rate !== '') {
                    riderRateVal = Number(r.rate);
                } else if (details?.rates && details.rates.length > 0) {
                    const riderRateRow = details.rates.find(rateRow => String(rateRow.rider_id) === String(r.rider_id));
                    if (riderRateRow && riderRateRow.premium_rate !== undefined && riderRateRow.premium_rate !== null) {
                        riderRateVal = Number(riderRateRow.premium_rate);
                    }
                }
                if (riderRateVal === null && r.unit_value !== undefined && r.unit_value !== null && r.unit_value !== '') {
                    riderRateVal = Number(r.unit_value);
                }

                // --- Rider Rate & Per Head Display ---
                let riderRateDisplay = '';
                let riderPerHeadDisplay = '';

                const isFreeRider = acronym.includes('GTIR') 
                    || (r.rider_name || '').toUpperCase().includes('TERMINAL ILLNESS') 
                    || ((r.rider_name || '').toUpperCase().includes('ADDITIONAL LIFE') && (riderRateVal === 0 || riderRateVal === null))
                    || riderRateVal === 0;

                if (isFreeRider) {
                    riderRateDisplay = 'Free';
                    riderPerHeadDisplay = 'Free';
                } else if (isSalaryRanking) {
                    // Salary by rank: per head is always DEPEND ON MBS — no numeric accumulation
                    riderRateDisplay = riderRateVal !== null
                        ? riderRateVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '<span style="color: #e53e3e; font-style: italic;">(Rate)</span>';
                    riderPerHeadDisplay = 'DEPEND ON MBS';
                } else if (riderRateVal !== null) {
                    riderRateDisplay = riderRateVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const riderPerHead = (riderAmt && !isNaN(riderAmt)) ? (riderAmt / 1000) * riderRateVal : null;
                    if (riderPerHead !== null) {
                        groupTotalPerHead += riderPerHead;
                        riderPerHeadDisplay = '₱ ' + riderPerHead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    } else {
                        riderPerHeadDisplay = '<span style="color: #e53e3e; font-style: italic;">₱ 0.00</span>';
                    }
                } else {
                    riderRateDisplay = '<span style="color: #e53e3e; font-style: italic;">(Rate)</span>';
                    riderPerHeadDisplay = '<span style="color: #e53e3e; font-style: italic;">₱ 0.00</span>';
                }

                // Termination Age: Max Age + 1
                const riderMaxAgeInput = r.maximum_age ?? r.max_age ?? r.entry_age_max ?? r.age_max ?? r.max_entry_age ?? r.age_to ?? (r.termination_age ? (Number(r.termination_age) - 1) : basicMaxAgeNum);
                const riderMaxAgeNum = Number(riderMaxAgeInput);
                const riderTerminationAgeNum = (!isNaN(riderMaxAgeNum) && riderMaxAgeNum > 0) ? riderMaxAgeNum + 1 : (basicTerminationAgeNum || 66);
                const riderTermAge = `${riderTerminationAgeNum} years old`;

                scheduleRowsHtml += `
                    <tr>
                        <td style="border: 1px solid #000; padding: 6px 6px 6px 20px; font-style: italic;">
                            (${riderName})
                        </td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                            ${riderAmtDisplay}
                        </td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                            ${riderRateDisplay}
                        </td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                            ${riderPerHeadDisplay}
                        </td>
                        <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                            ${riderTermAge}
                        </td>
                    </tr>
                `;
            });

            // Total row for this classification
            scheduleRowsHtml += `
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 6px 6px 20px;">
                        <strong style="color: #e53e3e;">Total:</strong>
                    </td>
                    <td style="border: 1px solid #000; padding: 6px;"></td>
                    <td style="border: 1px solid #000; padding: 6px;"></td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; border-top: 1.5px solid #000;">
                        <strong style="color: #e53e3e;">${hasMBSMultiplier ? 'DEPEND ON MBS' : '₱ ' + groupTotalPerHead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </td>
                    <td style="border: 1px solid #000; padding: 6px;"></td>
                </tr>
            `;
        });
    } else {
        // Fallback: Single Uniform Tier "All Eligible Individuals"
        const basicCoverageAmount = application?.coverage_amount ? Number(application.coverage_amount) : (application?.uniform_coverage_amount ? Number(application.uniform_coverage_amount) : null);
        const basicPerHead = (basicCoverageAmount !== null && basicRateVal !== null) ? (basicCoverageAmount / 1000) * basicRateVal : null;
        let totalUniformPerHead = basicPerHead || 0;

        scheduleRowsHtml += `
            <tr>
                <td style="border: 1px solid #000; padding: 6px; font-style: italic; font-weight: bold;" colspan="5">
                    All Eligible Individuals
                </td>
            </tr>
            <!-- Basic Plan Row -->
            <tr>
                <td style="border: 1px solid #000; padding: 6px 6px 6px 20px; font-style: italic;">
                    (${basicPlanName})
                </td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-style: italic;">
                    ${basicCoverageAmount ? '₱' + basicCoverageAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '<span style="color: #e53e3e; font-style: italic;">Actuarial Team</span>'}
                </td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                    ${basicRateVal !== null ? basicRateVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '<span style="color: #e53e3e; font-style: italic;">(Rate)</span>'}
                </td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; font-style: italic;">
                    ${basicPerHead !== null ? '₱ ' + basicPerHead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '<span style="color: #e53e3e; font-style: italic;">₱ 0.00</span>'}
                </td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                    ${basicTerminationAgeStr}
                </td>
            </tr>
        `;

        riders.forEach(r => {
            const riderName = r.rider_name || r.name || r.acronym || 'Supplemental Rider';
            const acronym = (r.acronym || '').toUpperCase();

            let riderAmt = null;
            if (r.amount !== undefined && r.amount !== null && r.amount !== '') {
                riderAmt = Number(r.amount);
            } else if (r.rider_amount !== undefined && r.rider_amount !== null && r.rider_amount !== '') {
                riderAmt = Number(r.rider_amount);
            } else if (r.coverage_amount !== undefined && r.coverage_amount !== null && r.coverage_amount !== '') {
                riderAmt = Number(r.coverage_amount);
            } else if (r.sum_insured !== undefined && r.sum_insured !== null && r.sum_insured !== '') {
                riderAmt = Number(r.sum_insured);
            } else if (Array.isArray(r.values) && r.values.length > 0 && r.values[0]?.amount) {
                riderAmt = Number(r.values[0].amount);
            } else if (Array.isArray(r.rider_values) && r.rider_values.length > 0 && r.rider_values[0]?.amount) {
                riderAmt = Number(r.rider_values[0].amount);
            }

            const riderAmtDisplay = (riderAmt && !isNaN(riderAmt))
                ? '₱' + riderAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                : '<span style="color: #e53e3e; font-style: italic;">Actuarial Team</span>';

            let riderRateVal = null;
            if (r.rate !== undefined && r.rate !== null && r.rate !== '') {
                riderRateVal = Number(r.rate);
            } else if (details?.rates && details.rates.length > 0) {
                const riderRateRow = details.rates.find(rateRow => String(rateRow.rider_id) === String(r.rider_id));
                if (riderRateRow && riderRateRow.premium_rate !== undefined && riderRateRow.premium_rate !== null) {
                    riderRateVal = Number(riderRateRow.premium_rate);
                }
            }
            if (riderRateVal === null && r.unit_value !== undefined && r.unit_value !== null && r.unit_value !== '') {
                riderRateVal = Number(r.unit_value);
            }

            const riderRateDisplay = riderRateVal !== null 
                ? riderRateVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                : '<span style="color: #e53e3e; font-style: italic;">(Rate)</span>';

            const riderPerHead = (riderAmt && riderRateVal) ? (riderAmt / 1000) * riderRateVal : null;
            if (riderPerHead !== null) {
                totalUniformPerHead += riderPerHead;
            }

            const riderPerHeadDisplay = riderPerHead !== null 
                ? '₱ ' + riderPerHead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                : '<span style="color: #e53e3e; font-style: italic;">₱ 0.00</span>';

            const riderMaxAgeInput = r.maximum_age ?? r.max_age ?? r.entry_age_max ?? r.age_max ?? r.max_entry_age ?? r.age_to ?? (r.termination_age ? (Number(r.termination_age) - 1) : basicMaxAgeNum);
            const riderMaxAgeNum = Number(riderMaxAgeInput);
            const riderTerminationAgeNum = (!isNaN(riderMaxAgeNum) && riderMaxAgeNum > 0) ? riderMaxAgeNum + 1 : (basicTerminationAgeNum || 66);
            const riderTermAge = `${riderTerminationAgeNum} years old`;

            scheduleRowsHtml += `
                <tr>
                    <td style="border: 1px solid #000; padding: 6px 6px 6px 20px; font-style: italic;">
                        (${riderName})
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                        ${riderAmtDisplay}
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                        ${riderRateDisplay}
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                        ${riderPerHeadDisplay}
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic;">
                        ${riderTermAge}
                    </td>
                </tr>
            `;
        });

        // Total Row
        scheduleRowsHtml += `
            <tr>
                <td style="border: 1px solid #000; padding: 6px 6px 6px 20px;">
                    <strong style="color: #e53e3e;">Total:</strong>
                </td>
                <td style="border: 1px solid #000; padding: 6px;"></td>
                <td style="border: 1px solid #000; padding: 6px;"></td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; border-top: 1.5px solid #000;">
                    <strong style="color: #e53e3e;">₱ ${totalUniformPerHead.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                </td>
                <td style="border: 1px solid #000; padding: 6px;"></td>
            </tr>
        `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>GPA GADDP Policy Contract</title>
    <style>
        @page {
            size: A4;
            margin: 12mm 20mm 25mm 20mm;
        }
        body {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            color: #202124;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-size: 10.5pt;
        }
        .page-container {
            width: 100%;
            margin: 0 auto;
            position: relative;
            background-color: #ffffff;
        }
        .page-break {
            page-break-after: always;
            break-after: page;
        }
        thead {
            display: table-row-group !important;
        }
        tfoot {
            display: table-row-group !important;
        }
        tr {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .layout-table, .layout-table tr, .layout-table tbody, .layout-table td,
        .rider-container, .rider-header-wrapper, .rider-body-wrapper {
            page-break-inside: auto !important;
            break-inside: auto !important;
        }
        .watermark-review {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            transform-origin: center center;
            font-size: 70pt;
            color: rgba(220, 220, 220, 0.25);
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 8px;
            pointer-events: none;
            z-index: 9999;
            user-select: none;
            white-space: nowrap;
            text-align: center;
        }
        .header-logo {
            text-align: center;
            margin-bottom: 20px;
        }
        .header-logo img {
            max-height: 70px;
        }
        .main-title {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            text-align: center;
            font-size: 15pt;
            font-weight: bold;
            color: #000;
            margin: 25px 0 10px 0;
            text-transform: uppercase;
        }
        .subtitle {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            text-align: center;
            font-size: 11pt;
            margin-bottom: 25px;
        }
        .policyholder-name {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            text-align: center;
            font-size: 18pt;
            font-weight: 800;
            color: #000;
            margin: 20px 0 5px 0;
            text-transform: uppercase;
        }
        .paragraph {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            text-align: justify;
            text-indent: 30px;
            margin-bottom: 12px;
        }
        .paragraph-no-indent {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            text-align: justify;
            margin-bottom: 12px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 15px;
        }
        .data-table th, .data-table td {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 9.5pt;
            vertical-align: top;
        }
        .data-table th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-transform: uppercase;
            text-align: left;
        }
        .section-header {
            font-size: 13pt;
            font-weight: bold;
            color: #0d47a1;
            margin-top: 20px;
            margin-bottom: 10px;
            text-transform: uppercase;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 3px;
        }
        .policy-provisions-container {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            color: #000000;
        }
        .provisions-main-title {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            color: #000000;
            margin: 15px 0 10px 0;
            text-transform: uppercase;
        }
        .provisions-section-header {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            font-size: 11.5pt;
            font-weight: bold;
            color: #000000;
            margin-top: 10px;
            margin-bottom: 4px;
            text-transform: uppercase;
            border-bottom: none;
        }
        .policy-provisions-container p,
        .policy-provisions-container .paragraph,
        .policy-provisions-container .paragraph-no-indent,
        .policy-provisions-container ol,
        .policy-provisions-container ul,
        .policy-provisions-container li,
        .policy-provisions-container blockquote,
        .policy-provisions-container td,
        .policy-provisions-container th {
            font-family: 'Cambria', 'Cambria Math', Georgia, serif;
            font-size: 10pt;
            font-weight: normal;
            line-height: 1.35;
            color: #000000;
        }
        .policy-provisions-container th {
            font-weight: bold;
        }
        .policy-provisions-container li {
            line-height: 1.35;
        }
        .signature-block {
            margin-top: 40px;
            width: 100%;
        }
        .signature-table {
            width: 100%;
            border: none;
        }
        .signature-table td {
            border: none;
            vertical-align: top;
            text-align: center;
            padding: 10px;
        }
        .doc-code {
            text-align: right;
            font-size: 8.5pt;
            color: #718096;
            font-family: monospace;
            font-weight: bold;
            margin-top: 20px;
        }
        .sla-container {
            border: 3px double #000;
            font-family: 'Cambria', Georgia, serif;
            margin-top: 10px;
        }
        .sla-table {
            width: 100%;
            border-collapse: collapse;
            border: none !important;
            margin-top: 0px;
            table-layout: fixed;
        }
        .sla-table thead {
            display: table-row-group !important;
        }
        .sla-table tr {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .sla-table td {
            border: 1px solid #000;
            padding: 2.5px 4px !important;
            font-size: 6.8pt !important;
            line-height: 1.15;
        }
        .sla-table th {
            border: 1px solid #000;
            padding: 4px 4px !important;
            font-size: 7.2pt !important;
        }
        .sla-table tr[style*="background-color: #ffff00"] td {
            padding: 3px 6px !important;
            font-size: 7.5pt !important;
        }
    </style>
</head>
<body>
    ${showReviewWatermark ? `<div class="watermark-review">FOR REVIEW</div>` : ''}
    <div class="page-container">

        <!-- ================= PAGE 1: COVER PAGE ================= -->
        <div style="border: 3px double #000; padding: 25px 25px 15px 25px; box-sizing: border-box; min-height: 94vh; position: relative; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
                <div class="header-logo" style="margin-bottom: 15px;">
                    ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" style="max-height: 100px;" />` : `<strong>PHILIPPINE LIFE FINANCIAL ASSURANCE CORP.</strong>`}
                    <div style="font-size: 8.5pt; color: #2d3748; margin-top: 5px; font-weight: 600;">
                        Philippine Life Financial Assurance Corporation
                    </div>
                    <div style="font-size: 8.5pt; color: #2d3748; font-weight: 400;">
                        11/F STI Holdings Center, 6764 Ayala Avenue, 1226 Makati City, Philippines<br>
                        Tel. No.: (632) 7798-5433 | TIN: 007-884-680-000
                    </div>
                </div>

                <div style="text-align: center; font-size: 15pt; font-weight: 900; color: #000; margin-top: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                    PHILIPPINE LIFE FINANCIAL ASSURANCE CORPORATION
                </div>
                <div style="text-align: center; font-size: 9.5pt; font-style: italic; margin-bottom: 20px;">
                    (herein called the Insurer)
                </div>

                <p style="text-align: center; font-size: 10.5pt; margin: 15px 0;">
                    HEREBY ISSUES this Group Policy (hereinafter referred to as this Policy) to
                </p>

                <div style="text-align: center; font-size: 15pt; font-weight: 900; color: #000; margin: 15px 0 3px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${groupName}
                </div>
                <div style="text-align: center; font-size: 9.5pt; font-style: italic; margin-bottom: 20px;">
                    (herein called the Policyholder)
                </div>

                <p class="paragraph" style="line-height: 1.45; font-size: 10pt;">
                    And agrees, subject to all terms appearing on this and the following pages, to pay at its Home Office in Metro Manila the benefits as determined in accordance with the provisions of this Policy immediately upon the receipt and approval of due proof of loss and to provide the other rights and privileges set forth in this Policy.
                </p>
                <p class="paragraph" style="line-height: 1.45; font-size: 10pt;">
                    This Policy is issued in consideration of the application of the Policyholder, a copy of which is attached hereto and made a part hereof, and of the payment of the Policyholder of the required first premium as herein provided. The first premium is due and payable on the Effective Date of this Policy.
                </p>
                <p class="paragraph" style="line-height: 1.45; font-size: 10pt;">
                    The provisions on the subsequent pages, including any amendments or riders included at issue or added thereafter, shall form part of this Policy as fully as if recited at length over the signatures hereto affixed.
                </p>
                <p class="paragraph" style="line-height: 1.45; font-size: 10pt;">
                    In witness whereof, Philippine Life Financial Assurance Corporation has caused this Policy to be executed at Makati City, Philippines as of the Effective Date of this Policy.
                </p>
            </div>

            <div style="margin-top: 30px;">
                <!-- 1. Executive Signatory (RIGHT) -->
                <div style="width: 300px; margin-left: auto; text-align: center; margin-bottom: 25px;">
                    <strong style="font-size: 11pt; text-transform: uppercase; font-family: 'Cambria', Georgia, serif; letter-spacing: 0.5px;">MICHELLE L. AMBAGAN</strong><br>
                    <span style="font-size: 9.5pt; display: inline-block; margin-top: 2px;">EVP & COO</span>
                </div>

                <!-- 2. Documentary Stamps Notice (RIGHT) -->
                <div style="font-size: 9pt; color: #000; text-align: left; margin-bottom: 20px; max-width: 420px; margin-left: auto; line-height: 1.4;">
                    Documentary stamps to the value of ₱200.00 are affixed and properly cancelled in the duplicate copy of this Policy.
                </div>

                <!-- 3. Examined By Line (RIGHT, 1 Line) -->
                <div style="width: 420px; margin-left: auto; text-align: left; margin-bottom: 25px; font-size: 10pt; font-weight: bold; white-space: nowrap;">
                    Examined By: ____________________________________
                </div>

                <!-- 4. Black Filled Plan Title Bar (RIGHT, Always 1 Line) -->
                <div style="width: 420px; max-width: 580px; margin-left: auto; text-align: center;">
                    <div style="background-color: #000000; color: #ffffff; font-size: 9.5pt; font-weight: 900; padding: 5px 8px; letter-spacing: 0.3px; text-transform: uppercase; width: 100%; box-sizing: border-box; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${basicPlanName}
                    </div>
                </div>
            </div>

            ${application?.doc_code ? `
            <div style="position: absolute; bottom: 12px; left: 16px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 8.5pt; font-weight: bold; color: #000; letter-spacing: 0.3px;">
                ${application.doc_code}
            </div>` : ''}
        </div>

        <div class="page-break"></div>

        <!-- ================= PAGE 2: POLICY DATA PAGE ================= -->
        <div class="main-title" style="font-size: 14pt;">POLICY DATA PAGE</div>

        <table class="data-table">
            <tr>
                <th style="width: 25%;">POLICY NO.</th>
                <td><strong>${policyNo}</strong></td>
            </tr>
            <tr>
                <th>POLICYHOLDER</th>
                <td>
                    <strong>${groupName}</strong><br>
                    ${businessAddress}
                </td>
            </tr>
            <tr>
                <th>EFFECTIVE DATE</th>
                <td><strong>${effectiveDateStr}</strong></td>
            </tr>
            <tr>
                <th>BASIC PLAN</th>
                <td><strong>Group Accidental Death & Disability Plan (GADDP)</strong></td>
            </tr>
            <tr>
                <th>SUPPLEMENTARY BENEFITS/RIDERS</th>
                <td>${Array.isArray(application?.riders) && application.riders.length > 0 ? application.riders.map(r => `- ${r.rider_name || r.name || r.acronym}`) .join('<br>') : 'None' }</td>
            </tr>
            <tr>
                <th>CURRENCY</th>
                <td>Philippine Peso</td>
            </tr>
            ${hasEligibleIndividualsGPA ? `<tr>
                <th>ELIGIBLE INDIVIDUALS</th>
                <td>
                    ${eligibleIndividuals}
                    <table style="width: 100%; border-collapse: collapse; margin-top: 6px;">
                        <thead>
                            <tr style="background-color: #f1f5f9;">
                                <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; font-weight: bold;">Classification of Individuals</th>
                                <th style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-size: 8.5pt; font-weight: bold;">Eligibility Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt;">Eligible Individuals as of the Effective Date of this Policy.</td>
                                <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt;">The Effective Date</td>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt;">Employees who become regular after the Effective Date of this Policy.</td>
                                <td style="border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt;">Date of Enrollment to the Policy</td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>` : ''}
            ${hasContributionGPA ? `<tr>
                <th>CONTRIBUTION</th>
                <td>${contributionText}</td>
            </tr>` : ''}
            ${hasParticipationGPA ? `<tr>
                <th>PARTICIPATION REQUIREMENTS</th>
                <td>${renderParticipationRequirements(application)}</td>
            </tr>` : ''}
            ${hasSpecialProvisionsGPA ? `<tr>
                <th>SPECIAL UNDERWRITING PROVISIONS</th>
                <td>${specialProvisions ? (specialProvisions.includes('<') ? specialProvisions : specialProvisions.replace(/\n/g, '<br>')) : 'None'}</td>
            </tr>` : ''}
        </table>

        ${hasScheduleOfInsuranceGPA ? `<!-- ================= SCHEDULE OF INSURANCE HEADER ================= -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-family: 'Cambria', Georgia, serif; font-size: 9.5pt; line-height: 1.4; margin-top: 15px; margin-bottom: -1.5px; table-layout: fixed;">
            <colgroup>
                <col style="width: 15%;">
                <col style="width: 35%;">
                <col style="width: 10%;">
                <col style="width: 50%;">
            </colgroup>
            <thead>
                <tr>
                    <th colspan="4" style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 11pt; padding: 6px; text-transform: uppercase; letter-spacing: 0.5px; background-color: #ffffff;">
                        SCHEDULE OF INSURANCE
                    </th>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 15%; text-transform: uppercase; vertical-align: middle; background-color: #f1f5f9;">
                        MODE OF PAYMENT
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; vertical-align: middle; color: #000000ff; font-style: italic; width: 30%;">
                        ${application?.payment_mode_name || ''}
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-align: center; vertical-align: middle; width: 10%; text-transform: uppercase; background-color: #f1f5f9;">
                        DUE DATES
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; vertical-align: top; color: #000000ff; font-style: italic; width: 45%;">
                        <strong>First:</strong> ${application?.first_due_date || effectiveDateStr || ''}<br>
                        <strong>Renewal:</strong> ${application?.renewal_due_date || application?.renewal_date || ''}<br>
                        <strong>Additions:</strong> ${application?.additions_due_date || ''}
                    </td>
                </tr>
            </thead>
        </table>

        <!-- ================= SCHEDULE OF INSURANCE DETAILS ================= -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-family: 'Cambria', Georgia, serif; font-size: 9.5pt; line-height: 1.4; margin-bottom: -1.5px; table-layout: fixed;">
            <colgroup>
                <col style="width: 30%;">
                <col style="width: 22%;">
                <col style="width: 15%;">
                <col style="width: 15%;">
                <col style="width: 18%;">
            </colgroup>
            <tbody>
                <tr style="font-weight: bold; text-align: center; text-transform: uppercase;">
                    <th rowspan="2" style="border: 1px solid #000; padding: 6px; vertical-align: middle; background-color: #ffffff;">
                        CLASSIFICATION &amp; BENEFITS
                    </th>
                    <th rowspan="2" style="border: 1px solid #000; padding: 6px; vertical-align: middle; background-color: #ffffff;">
                        AMOUNT OF<br>INSURANCE
                    </th>
                    <th colspan="2" style="border: 1px solid #000; padding: 4px; vertical-align: middle; background-color: #ffffff;">
                        ${premiumHeaderTitle}
                    </th>
                    <th rowspan="2" style="border: 1px solid #000; padding: 6px; vertical-align: middle; background-color: #ffffff;">
                        TERMINATION<br>AGE
                    </th>
                </tr>
                <tr style="font-weight: bold; text-align: center; text-transform: uppercase;">
                    <th style="border: 1px solid #000; padding: 4px; vertical-align: middle; background-color: #ffffff;">
                        RATE/<br>₱1,000
                    </th>
                    <th style="border: 1px solid #000; padding: 4px; vertical-align: middle; background-color: #ffffff;">
                        PER HEAD<br>(₱)
                    </th>
                </tr>
                ${scheduleRowsHtml}
            </tbody>
        </table>

        <!-- ================= TAXES ================= -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000; font-family: 'Cambria', Georgia, serif; font-size: 9.5pt; line-height: 1.4; margin-bottom: 15px; table-layout: fixed;">
            <colgroup>
                <col style="width: 15%;">
                <col style="width: 85%;">
            </colgroup>
            <tbody>
                <tr>
                    <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-transform: uppercase; background-color: #f1f5f9; width: 15%;">
                        TAXES
                    </td>
                    <td style="border: 1px solid #000; padding: 6px; font-style: italic; width: 85%;">
                        ${application?.taxes || 'Inclusive'}
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="page-break"></div>` : ''}

        <!-- ================= SLA / TAT TABLE ================= -->
        <div style="font-size: 9.5pt; color: #4a5568; margin-bottom: 10px; font-weight: bold;">Continuation of ${policyNo}:</div>
        ${generateTatTableHtml(details?.tat || application?.tat)}

        <div class="page-break"></div>

        <!-- ================= PAGE 4: CONFORME & SIGNATURE PAGE ================= -->
        <div style="font-size: 9.5pt; color: #4a5568; margin-bottom: 30px; font-weight: bold;">Continuation of ${policyNo}:</div>

        <div style="margin-top: 50px; text-align: center;">
            <div style="font-weight: bold; font-size: 16pt; text-transform: uppercase; letter-spacing: 0.5px;">PHILIPPINE LIFE FINANCIAL ASSURANCE CORPORATION</div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 8px; margin-bottom: 40px;">By:</div>

            <div style="width: 380px; margin: 0 auto; border-bottom: 1.5px solid #000; height: 30px;"></div>
            <div style="font-weight: bold; font-size: 13pt; margin-top: 8px; text-transform: uppercase;">MICHELLE L. AMBAGAN</div>
            <div style="font-size: 11pt; font-weight: 500;">Executive Vice-President & Chief Operating Officer</div>
            <div style="font-size: 11pt; margin-top: 8px;">Signed on _________________ at Makati City, Metro Manila.</div>
        </div>

        <div style="margin-top: 70px; text-align: center;">
            <div style="font-weight: bold; font-size: 12pt; text-transform: uppercase; letter-spacing: 1.5px;">CONFORME:</div>
            <div style="font-weight: bold; font-size: 18pt; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 15px;">${groupName}</div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 8px; margin-bottom: 40px;">By:</div>

            <div style="width: 380px; margin: 0 auto; border-bottom: 1.5px solid #000; height: 30px;"></div>
            <div style="font-weight: bold; font-size: 13pt; margin-top: 8px; text-transform: uppercase;">${addresseeName}</div>
            <div style="font-size: 11pt; font-weight: 500;">${addresseeDesignation}</div>
            <div style="font-size: 11pt; margin-top: 8px;">Signed on _________________ at ${application?.signing_location || businessAddress || ''}.</div>
        </div>

        <div class="page-break"></div>

        <!-- ================= POLICY PROVISIONS ================= -->
        <div class="policy-provisions-container">

            <!-- ================= INSURANCE PROVISIONS ================= -->
            <div class="provisions-main-title">I. INSURANCE PROVISIONS</div>
            
            <div class="provisions-section-header">WHO MAY BE INSURED</div>
            <p class="paragraph">
                All individuals satisfying the eligibility provision stated in the Policy Data Page shall be eligible for insurance under this Policy on the date stated in the Policy Data Page.
            </p>

            <div class="provisions-section-header">ENROLLMENT</div>
            <p class="paragraph">
                Written application, on forms satisfactory to the Insurer, is required for each eligible individual in respect of whom an application for insurance under this Policy is being made. Eligible individuals accepted by the Insurer for insurance coverage under this Policy are hereinafter referred to as Insured.
            </p>

            <div class="provisions-section-header">AMOUNT OF INSURANCE</div>
            <p class="paragraph">
                Each eligible individual shall be insured in accordance with the Schedule of Insurance stated in the Policy Data Page.
            </p>

            <div class="provisions-section-header">CHANGE IN THE INSURED’S CLASSIFICATION</div>
            <p class="paragraph">
                If the Insured’s classification changes, the amount of his insurance shall be changed on the date the said change in classification took effect.
            </p>
            <p class="paragraph">
                The Policyholder shall notify the Insurer of all such changes in classification on or before the premium due date immediately following such changes.
            </p>

            <div class="page-break"></div>

            <!-- ================= BENEFIT PROVISIONS ================= -->
            <div class="provisions-main-title">II. BENEFIT PROVISIONS</div>

            <div class="provisions-section-header">INSURANCE BENEFIT</div>
            <p class="paragraph">
                An Insured who sustained accidental injuries effected directly and independently of all other causes and as a result of such injuries has sustained, within one hundred eighty (180) days after the date of accident, any of the losses enumerated in the following Schedule of Indemnities, the Insurer shall, subject to the exclusions and provisions hereunder, pay to the Insured, if living, otherwise to his beneficiaries, the amount specified for such loss in accordance with the Schedule of Indemnities.
            </p>

            <div class="provisions-section-header">SCHEDULE OF INDEMNITIES</div>
            <table class="data-table" style="font-family: 'Cambria', Georgia, serif; font-size: 11pt;">
                <thead>
                    <tr>
                        <th style="font-family: 'Cambria', Georgia, serif; font-size: 11pt; font-weight: bold;">DESCRIPTION OF LOSS</th>
                        <th style="width: 35%; text-align: center; font-family: 'Cambria', Georgia, serif; font-size: 11pt; font-weight: bold;">PERCENTAGE OF AMOUNT OF INSURANCE</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>Loss of life</td><td style="text-align: center; font-weight: bold;">100 %</td></tr>
                    <tr><td>Loss of two limbs</td><td style="text-align: center; font-weight: bold;">100 %</td></tr>
                    <tr><td>Loss of both hands</td><td style="text-align: center; font-weight: bold;">100 %</td></tr>
                    <tr><td>Loss of both feet</td><td style="text-align: center; font-weight: bold;">100 %</td></tr>
                    <tr><td>Total loss of sight of both eyes</td><td style="text-align: center; font-weight: bold;">100 %</td></tr>
                    <tr><td>Loss of hearing of both ears</td><td style="text-align: center; font-weight: bold;">75 %</td></tr>
                    <tr><td>Loss of one hand</td><td style="text-align: center; font-weight: bold;">50 %</td></tr>
                    <tr><td>Loss of one foot</td><td style="text-align: center; font-weight: bold;">50 %</td></tr>
                    <tr><td>Loss of sight of one eye</td><td style="text-align: center; font-weight: bold;">50 %</td></tr>
                </tbody>
            </table>
            
            <p class="paragraph-no-indent">
                Loss of hand means severance at or above the wrist. Loss of foot means severance at or above the ankle joint. Loss of sight or hearing means total and irrecoverable loss of sight or hearing.
            </p>
            <p class="paragraph-no-indent">
                Total Permanent loss of the use of a body part shall be treated as loss of such body part.
            </p>
            <p class="paragraph-no-indent" style="margin-top: 10px;">
                The total benefits payable under this Policy in respect to any one accident resulting in loss(es) within 180 days from the date of such accident(s) shall not exceed the Insured’s amount of insurance.
            </p>
            <p class="paragraph" style="margin-top: 10px;">
                The aggregate disability benefits payable, including benefits for accident(s) resulting in loss(es) within 180 days from the date of accident(s) shall not exceed the Insured’s amount of insurance, i.e., for any subsequent accident resulting in any loss(es) which would make the aggregate disability benefits exceed the Insured’s amount of insurance, the amount payable under this Policy shall be his amount of insurance less any amount(s) paid for previous loss(es). However, the payment of his amount of insurance for such loss(es) shall not terminate his insurance in so far as accidental death benefit is concerned.
            </p>
            <p class="paragraph-no-indent" style="margin-top: 10px;">
                The amount of benefit payable for loss of life arising from independent/unrelated accident/event shall always be the Insured’s amount of insurance.
            </p>
            <p class="paragraph" style="margin-top: 10px;">
                Any partial benefit already paid for any loss(es) shall not be carried over in the subsequent policy year, i.e., the amount of benefits to be paid in the succeeding policy year with respect to an Insured shall not be reduced by any amount paid to him in the preceding policy year.
            </p>

            <div class="provisions-section-header">EXCLUSIONS</div>
            <p class="paragraph-no-indent">No payment shall be made under this Policy for any claim resulting from or caused directly or wholly, by:</p>
            <ol style="margin-top: 5px; margin-bottom: 10px; padding-left: 20px; line-height: 1.45; text-align: justify;">
                <li>Bodily or mental infirmity, hernia, ptomaine, or bacterial infection (except phylogenic infection which shall occur with and through an accidental cut or wound) or disease or sickness of any kind; or</li>
                <li>Poison, gas or fumes (voluntarily or involuntarily taken), atomic explosions, nuclear fission, or radioactive gas; or</li>
                <li>Accident occurring while or because the Insured is affected by alcohol or any unprescribed drug; or</li>
                <li>Suicide, self-destruction or any attempt threat while sane or insane; or</li>
                <li>Participation in any brawl; or</li>
                <li>Any violation or attempt of violation of the law or resistance to arrest; or</li>
                <li>Murder or provoked assault; or</li>
                <li>War, declared or undeclared, strike, riot, civil war, revolution or any war-like operations, or while under orders for war-like operations or restoration of public order; or</li>
                <li>Entering, operating, or servicing, ascending from or with any aerial or marine device or conveyance except while traveling as a passenger in an aircraft or marine transportation operated by a commercial passenger airline or shipping line on a scheduled air or sea service over an established passenger route.</li>
            </ol>

            <div class="page-break"></div>

            <!-- ================= PREMIUM PROVISIONS ================= -->
            <div class="provisions-main-title">III. PREMIUM PROVISIONS</div>

            <div class="provisions-section-header">PREMIUM RATES</div>
            <p class="paragraph">
                The premium rates per ₱1,000.00 of insurance by class of Insureds shall be as stated in the Policy Data Page.
            </p>

            <div class="provisions-section-header">GUARANTEE OF AND RIGHT TO CHANGE THE PREMIUM RATE</div>
            <p class="paragraph">
                The premium rates are guaranteed for the first policy year. The Insurer reserves the right to establish new premium rates at the beginning of any renewal year or whenever the terms of this Policy are changed.
            </p>

            <div class="provisions-section-header">COMPUTATION OF PREMIUMS DUE</div>
            <p class="paragraph">
                The amount of each premium due shall be determined by multiplying the applicable premium rate per ₱1,000.00 by the total amount of insurance in force on the said due date. A statement of premiums due including premium adjustments shall be furnished as of each due date by the Insurer.
            </p>

            <div class="provisions-section-header">PREMIUM ADJUSTMENTS</div>
            <p class="paragraph">
                Premiums shall be subject to adjustment on account of insurance added, increased, reduced and/or terminated. Premium adjustment during a policy year shall be calculated pro-rata using the premium rates effective at the beginning of that policy year, from the date the adjustment becomes effective to the next premium due date or as mutually agreed upon by the Policyholder and the Insurer.
            </p>
            <p class="paragraph-no-indent">
                Premium adjustments shall be due when determined.
            </p>

            <div class="provisions-section-header">PAYMENT OF PREMIUMS</div>
            <p class="paragraph">
                Premiums are payable to the Insurer in advance on each premium due date, at its Home Office or to a duly authorized agent of the Insurer or through other offices as the Insurer may hereafter designate, in exchange for a receipt duly signed by the Insurer’s authorized representative. The payment of any premium shall not maintain the insurance under this Policy in force beyond the date when the next premium becomes payable, except as set forth in the “GRACE PERIOD” provision.
            </p>
            <p class="paragraph-no-indent">
                All amounts payable to or by the Insurer shall be payable in the Philippine Pesos.
            </p>

            <div class="provisions-section-header">GRACE PERIOD</div>
            <p class="paragraph">
                A grace period of thirty-one (31) days following the due date shall be allowed the Policyholder for the payment of each premium after the first during which insurance coverage hereunder shall remain in force. If any premium due is not paid within the grace period, the Policy shall automatically terminate at the expiration of the grace period, except that if the Policyholder shall have given the Insurer written notice in advance of an earlier date of termination, the Policy shall terminate as such earlier date. The Policyholder shall be liable to the Insurer for the payment of a pro-rata premium from the time the Policy was in force during the grace period.
            </p>

            <div class="provisions-section-header">TAXES</div>
            <p class="paragraph">
                The taxes specified in the Policy Data Page, if any, shall be for the account of the Policyholder and shall be payable in the manner stated therein.
            </p>

            <div class="page-break"></div>

            <!-- ================= CLAIM PROVISIONS ================= -->
            <div class="provisions-main-title">IV. CLAIM PROVISIONS</div>

            <div class="provisions-section-header">BENEFICIARY</div>
            <p class="paragraph">
                An Insured shall have the right to designate anybody, not disqualified by law, as his beneficiary or beneficiaries, and may at any time, designate new beneficiary or beneficiaries by filing through the Policyholder a properly completed written request on a form satisfactory to the Insurer. Such change shall take effect only when recorded in writing by the Insurer at its Home Office but without prejudice to the Insurer on any payment made before receipt of such notice.
            </p>
            <p class="paragraph">
                The indemnity for the loss of life of an Insured shall be payable to his designated beneficiary or beneficiaries, if surviving; or if there be no beneficiaries designated or surviving at the death of the Insured, to the surviving class of the following classes of successive preference beneficiaries:
            </p>
            <p class="paragraph-no-indent" style="margin-left: 30px;">
                The Insured’s:<br>
                1. widow or widower<br>
                2. surviving children born to or legally adopted by the Insured<br>
                3. surviving parents<br>
                4. surviving brothers and sisters regardless if full or half blood<br>
                5. Executors and administrators
            </p>
            <p class="paragraph">
                An affidavit signed by any individual belonging to the first surviving class of successive preference beneficiaries described above, stating the names and addresses of the persons belonging to such class, shall be sufficient proof to the Insurer that the person or persons so named therein are the sole survivors of such class. Payment by the Insurer based on such affidavit shall be in full acquaintance hereunder.
            </p>
            <p class="paragraph-no-indent">
                If there be two or more beneficiaries, they shall share equally on the proceeds unless otherwise specified by the Insured. All other indemnities under this Policy shall be payable to the Insured.
            </p>

            <div class="provisions-section-header">NOTICE OF CLAIM</div>
            <p class="paragraph">
                Written notice of claim must be given to the Insurer within thirty (30) days after the date of accident causing the loss covered by this Policy, or as soon thereafter as is reasonably possible. Failure to comply within the time provided shall not invalidate nor reduce the claim if it was given as soon as was reasonably possible.
            </p>
            <p class="paragraph">
                The Insurer upon receipt of a notice of claim shall furnish to the claimant such forms as are usually required by the Insurer for filing proofs of loss. If such forms are not so furnished by the Insurer within fifteen (15) days after its receipt of such notice, the claimant shall be deemed to have complied with the requirements of this Policy as to proof of loss upon submitting, within the time fixed in this Policy for filing proofs of loss, written proof covering the occurrence, character and extent of the loss for which claim is made.
            </p>
            <p class="paragraph">
                Written notice of claim given by or in behalf of the Insured or Beneficiary, to the Insurer or to any authorized representative of the Insurer, with information sufficient to identify the Insured, shall be deemed to be notice to the Insurer.
            </p>

            <div class="provisions-section-header">PROOF OF LOSS</div>
            <p class="paragraph">
                Written proof of loss must be furnished to the Insurer within ninety (90) days from the date of the loss to which the claim is made. Failure to comply within the time provided shall not invalidate nor reduce the claim if it is shown that it was not reasonably possible to submit such proof within the required time and that proof was submitted as soon as was reasonably possible.
            </p>

            <div class="provisions-section-header">PHYSICAL EXAMINATION AND AUTOPSY</div>
            <p class="paragraph">
                The Insurer, at its own expense, shall have the right and opportunity to examine an Insured when and as often as the Insurer may reasonably require while the claim is pending hereunder, and also the right and opportunity to make an autopsy in case of death where it is not forbidden by law.
            </p><br>

            <div class="provisions-section-header">PAYMENT OF CLAIM</div>
            <p class="paragraph">
                The amount of any loss for which the Insurer may be liable under this Policy, shall be paid within thirty (30) days after proof of loss is received by the Insurer and ascertainment of the loss is made by agreement between the Insured and the Insurer or by arbitration; but if such ascertainment is not made within sixty (60) days after such receipt by the Insurer of the proof of loss, then the loss shall be paid within ninety (90) days after such receipt.
            </p>
            <p class="paragraph">
                Refusal or failure to pay the claim within the time prescribed herein shall entitle the Insured to collect interest for the duration of the delay at the rate of twice the ceiling prescribed by the Monetary Board, unless such refusal or failure to pay is based on the ground that the claim is fraudulent.
            </p>

            <div class="page-break"></div>

            <!-- ================= GENERAL PROVISIONS ================= -->
            <div class="provisions-main-title">V. GENERAL PROVISIONS</div>

            <div class="provisions-section-header">THE CONTRACT</div>
            <p class="paragraph">
                This Policy, the Policy Data Page, the Policyholder’s application attached hereto, any riders, endorsements or amendments herein and the Insured’s applications (including evidence of insurability, if any) constitute the entire contract. All statements made by the Policyholder or by the Insureds shall be deemed representations and not warranties. No statement made by any Insured shall be used to contest the validity of the insurance unless it is written and signed by him, a copy furnished to him or to his beneficiaries.
            </p>
            <p class="paragraph">
                No agent is authorized to alter or amend this Policy, to accept premiums in arrears or to extend the due date of any premium, to waive any notice or proof of claim required by the Insurer, or to extend the date before which any such notice or proof be submitted.
            </p>
            <p class="paragraph">
                This Policy may at any time be amended and changed by written agreement between the Insurer and the Policyholder. Any such amendment shall be binding on all Insureds whether their insurance became effective prior to, on, or after the effective date of the amendment.
            </p>

            <div class="provisions-section-header">POLICY EFFECTIVITY</div>
            <p class="paragraph">
                This Policy becomes effective only upon the payment of its initial premium and its delivery to the Policyholder. The Effective Date, shown in the Policy Data Page shall be used to determine premium due dates, policy years and policy anniversaries.
            </p>

            <div class="provisions-section-header">DATA REQUIRED</div>
            <p class="paragraph">
                The Policyholders shall furnish the Insurer promptly in writing all information necessary for the efficient administration of this Policy including (1) individuals becoming eligible and their respective dates of birth and amount of insurance (2) Insureds whose insurance terminates and their respective termination dates, and (3) changes in the classification and amounts of insurance of an Insured, if any.
            </p>
            <p class="paragraph">
                All documents furnished to the Policyholder by an individual in connection with his insurance and such other records as may have a bearing on the insurance under this Policy, shall be open for inspection by the Insurer at reasonable hours.
            </p>

            <div class="provisions-section-header">CLERICAL ERROR</div>
            <p class="paragraph">
                Clerical error in keeping the records shall not invalidate an insurance which otherwise is validly in force nor shall it continue an insurance which otherwise is validly terminated.
            </p>

            <div class="provisions-section-header">AGE AND MISSTATEMENT OF AGE</div>
            <p class="paragraph">
                Age, unless defined otherwise, shall mean age at last birthday.
            </p>
            <p class="paragraph">
                The Insurer may request proof of age of any Insured. Benefits payable are suspended until the requested proof is given.
            </p>
            <p class="paragraph">
                If the age of the Insured has been misstated, the amount of insurance shall be adjusted to the amount that the premium would have purchased at the correct age, applicable risk class and applicable premium rates as of the effective date.
            </p>
            <p class="paragraph">
                If at the correct age, the Insured is not eligible for any coverage under this Policy or its riders, the Insurer shall refund the corresponding premiums actually received by the Insurer.
            </p>

            <div class="provisions-section-header">RENEWAL</div>
            <p class="paragraph">
                The Policyholders shall be entitled to renew this Policy upon payment of the premium due on the effective date of renewal.
            </p>

            <div class="provisions-section-header">TERMINATION OF THIS POLICY</div>
            <p class="paragraph">
                This Policy shall automatically terminate if premiums due remain unpaid beyond the grace period as stated in the Grace Period Provision of this Policy.
            </p>
            <p class="paragraph">
                The Policyholder may discontinue this Policy at any time by giving written notice to the Insurer at least 31 days prior to the date of termination.
            </p>
            <p class="paragraph">
                The Insurer may also terminate this Policy at any time by giving at least 31 days prior written notice to the Policyholder if the number of Insureds is less than the minimum number stated in the Policy Data Page or the percentage of Insureds is less than the minimum percentage stated in the Policy Data Page.
            </p>
            <p class="paragraph-no-indent">
                Notice of termination shall be in writing, mailed or delivered to the Policyholder at the address shown in this Policy or application.
            </p>

            <div class="provisions-section-header">TERMINATION OF INDIVIDUAL INSURANCE</div>
            <p class="paragraph-no-indent">
                The insurance coverage of all Insureds under this Policy shall automatically terminate on the earliest of the following:
            </p>
            <p class="paragraph-no-indent" style="margin-left: 20px; line-height: 1.45;">
                1. The date this Policy is terminated; or<br>
                2. The policy anniversary immediately succeeding the date the Insured attains the termination age stated in the Policy Data Page; or<br>
                3. The date the Insured enters military, naval or air service; or<br>
                4. The date the relationship between the Insured and the Policyholder as stated in the Eligibility Provision of this policy ends.<br>
                5. In case of employer-employee groups, the date the Insured ceases active work for the Policyholder except that in the event of disability, temporary lay-off or approved leave of absence, payment of the required premium shall continue the insurance in force:<br>
                &nbsp;&nbsp;&nbsp;&nbsp;5.1. In case of disability, during the continuance of disability; or<br>
                &nbsp;&nbsp;&nbsp;&nbsp;5.2. In case of temporary lay-off or approved leave of absence, for three (3) months.
            </p>

            <div class="provisions-section-header">ASSIGNMENTS</div>
            <p class="paragraph">
                No assignment of this Policy by the Policyholder shall be binding upon the Insurer unless made in writing and properly filed at the Home Office of the Insurer. No assignment by any individual of any insurance under this Policy shall be valid. Any assignment by the beneficiary subsequent to the death of an Insured shall not be binding upon the Insurer until the original assignment or duplicate thereof is received at the Home Office of the Insurer and the Insurer, prior to the payment of the proceeds, acknowledges the assignment in writing. The Insurer shall not assume any responsibility for the validity or sufficiency of any assignment.
            </p>

            <div class="provisions-section-header">LEGAL PROCEEDINGS</div>
            <p class="paragraph">
                If a claim is made and an action or suit is not commenced either with the Insurance Commission or any court of competent jurisdiction within 24 months from notice of denial of claim, then the claim shall for all purposes be deemed to have been abandoned and shall not thereafter be reopened or reconsidered.
            </p>

            <div class="provisions-section-header">INCONTESTABILITY</div>
            <p class="paragraph">
                This policy shall be incontestable after one (1) year from the effective date or the date of its last reinstatement, except for non-payment of premiums. Similarly, any individual insurance, or any additional portion thereof, shall not be contested after it has been in force during the lifetime of the Insured for a period of one (1) year from its effective date or date of last reinstatement, except for non-payment of premium.
            </p>
            <p class="paragraph">
                No statement made by the Insured relating to his insurability shall be used in contesting the validity of the insurance with respect to which such statement was made after such insurance has been in force during the Insured’s lifetime for a period of one (1) year from its effective date or the date of last reinstatement, nor unless contained in a written instrument signed by him.
            </p>

            <div class="provisions-section-header">INDIVIDUAL CONFIRMATION OF INSURANCE COVERAGE</div>
            <p class="paragraph">
                The Insurer shall issue to the Policyholder, for delivery to each Insured, an individual confirmation of insurance coverage setting forth a summary of the essential features of the individual insurance coverage and other privileges to which the Insured is entitled. These forms do not constitute a contract but are merely informative statements setting forth the benefits and the claim procedures and are not transferable.
            </p>

            <div class="provisions-section-header">REINSTATEMENT</div>
            <p class="paragraph">
                If an Insured whose insurance is terminated in accordance with the termination provision of this Policy again becomes entitled to participate for insurance hereunder, such individual may again become insured under this Policy. His insurance will take effect once the premium is paid.
            </p>

            <div class="provisions-section-header">NON-WAIVER OF POLICY PROVISION</div>
            <p class="paragraph">
                Failure of the Insurer to insist upon strict compliance with any provision of this Policy at any given time or under any given set of circumstances shall not operate as a waiver of or modification of such provision, or in any manner whatsoever to render it unenforceable, as to any other time or as to any other occurrence, whether the circumstances are, or are not, the same.
            </p>

            <div class="provisions-section-header">ARTICLE 1250 (R.A. No. 386) NOT APPLICABLE</div>
            <p class="paragraph">
                It is hereby declared and agreed that the provision of Article 1250 of the Civil Code of the Philippines (Republic Act No. 386) which reads:
            </p>
            <blockquote style="font-style: italic; margin: 10px 30px; line-height: 1.4;">
                “in case of extraordinary inflation or deflation of the currency stipulated should supervene, the value of the currency at the time of the establishment of the obligation shall be the basis of payment…”
            </blockquote>
            <p class="paragraph-no-indent">
                shall not apply in determining the extent of liability under the provision of this Policy.
            </p>

            <div class="provisions-section-header">CURRENCY</div>
            <p class="paragraph">
                All amounts mentioned in this Policy refer to the currency stated in the Policy Data Page.
            </p>

            <div class="provisions-section-header">AVAILABILITY OF THIS POLICY</div>
            <p class="paragraph">
                This Policy shall be kept in the main office and in the custody of an officer of the Policyholder. It will be available to the Insureds for their inspection during regular business hours of the Policyholder.
            </p>

            <div class="provisions-section-header">CANCELLATION</div>
            <p class="paragraph-no-indent">
                This policy shall not be cancelled by the Company except upon prior notice thereof to the Policyholder, and no notice of cancellation shall be effective unless it is based on the occurrence, after the effective date of the Policy, on one or, more of the following:
            </p>
            <p class="paragraph-no-indent" style="margin-left: 20px; line-height: 1.4;">
                1. non-payment of premium;<br>
                2. conviction of a crime arising out of acts increasing the hazard insured against;<br>
                3. discovery of fraud or material misrepresentation;<br>
                4. discovery of willful or reckless acts or omissions increasing the hazard insured against;<br>
                5. a determination by the Commissioner that the continuation of the Policy would violate or would place the Company in violation of the Insurance Code.
            </p>
            <p class="paragraph">
                All notices of cancellation shall be in writing, mailed or delivered to the Policyholder at the address shown in the policy or application, and shall state the ground(s) relied upon and that upon written request of the Policyholder, the Company will furnish the facts on which the cancellation is based.
            </p>
            <p class="paragraph-no-indent">
                The Policyholder may cancel this policy provided written notice is served the Company.
            </p>

            <div class="provisions-section-header">POLICY DATA PAGE PROVISIONS</div>
            <p class="paragraph">
                The Provisions stated in the Policy Data Page shall supersede all provisions to the contrary under this contract.
            </p>

        </div>

        <div class="page-break"></div>

        <!-- ================= Centered Important Notice Page ================= -->
        <div style="display: flex; flex-direction: column; justify-content: center; min-height: 90vh; box-sizing: border-box;">
            <div style="border: 3px double #000; padding: 20px 25px; text-align: justify; font-size: 9.5pt; line-height: 1.4; page-break-inside: avoid; break-inside: avoid; width: 90%; margin: 0 auto;">
                <div style="text-align: center; font-size: 13pt; font-weight: bold; margin-bottom: 12px; letter-spacing: 0.5px;">IMPORTANT NOTICE</div>
                The Insurance Commission, with offices in Manila, Cebu and Davao, is the government office in charge of the enforcement of all laws related to insurance and has supervision over insurance providers and intermediaries. It is ready at all times to assist the general public in matters pertaining to insurance. For any inquiries or complains, please contact the Public Assistance and Mediation Division (PAMD) of the Insurance Commission at 1071 United Nations Avenue, Ermita, Manila with telephone/cellphone numbers (02) 8523-8461 local 103 or 127, 09171160007 (Globe), and 09999930637 (Smart), and with email address <a href="mailto:publicassistance@insurance.gov.ph" style="color: #0d47a1; text-decoration: underline;">publicassistance@insurance.gov.ph</a>. The official website of the Insurance Commission is <a href="https://www.insurance.gov.ph" style="color: #0d47a1; text-decoration: underline;">www.insurance.gov.ph</a>.
            </div>
        </div>

        ${(cleanRidersHtml || details.showSignoff !== false) ? '<div class="page-break"></div>' : ''}
        
        <!-- ================= ATTACHED RIDER TEMPLATES ================= -->
        ${cleanRidersHtml}

        ` + (details.showSignoff !== false ? `<!-- ================= SIGN-OFF CHECKLIST ================= -->
        <div style="font-weight: bold; text-align: center; font-size: 14pt; text-transform: uppercase; margin-bottom: 10px; letter-spacing: 0.5px;">GROUP POLICY SIGN-OFF</div>

        <table style="width: 100%; border: 1px solid #000; border-collapse: collapse; margin-bottom: 6px; font-size: 9pt; font-family: 'Cambria', Georgia, serif;">
            <tr>
                <td style="padding: 3px 8px; width: 28%; font-style: italic; border: none; vertical-align: middle;">Policyholder</td>
                <td style="padding: 3px 8px; border: none; vertical-align: middle;">: <strong>${groupName.toUpperCase()}</strong></td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; font-style: italic; border: none; vertical-align: middle;">Group Master Policy Number</td>
                <td style="padding: 3px 8px; border: none; vertical-align: middle;">: <strong>${policyNo.toUpperCase()}</strong></td>
            </tr>
            <tr>
                <td style="padding: 3px 8px; font-style: italic; border: none; vertical-align: middle;">Plan of Insurance</td>
                <td style="padding: 3px 8px; border: none; vertical-align: middle;">: <strong>${basicPlanName ? basicPlanName.toUpperCase() : 'GROUP ACCIDENTAL DEATH & DISABILITY PLAN (GADDP)'}</strong></td>
            </tr>
        </table>

        <div style="font-size: 8pt; font-style: italic; margin-bottom: 8px;">
            Printing Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>

        <div style="font-weight: bold; text-align: center; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.5px;">GROUP MASTER POLICY</div>
        <div style="font-weight: bold; text-align: center; font-size: 13pt; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">CHECKLIST</div>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 10px; font-size: 8pt; font-family: 'Cambria', Georgia, serif;">
            <thead>
                <tr style="font-size: 7.5pt; font-style: italic; text-align: center;">
                    <th colspan="7" style="border: 1px solid #000; padding: 4px 6px; font-weight: normal; line-height: 1.3;">
                        Pages to be signed (Those with ✓ marks only.)<br>
                        Please affix your signature on this certification below to keep the policy contract clean. Thank you.
                    </th>
                </tr>
                <tr style="font-size: 8pt; font-weight: bold; font-style: italic; text-align: center; background-color: #ffffff;">
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 8%;">Page</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 44%;">Description</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 10%;">Actuarial</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 10%;">Underwriting</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 9%;">Group Sales</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 9%;">Operation Head</th>
                    <th style="border: 1px solid #000; padding: 4px 2px; width: 10%;">EVP & COO</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">1</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Cover Page</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">1</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">“Examined By” portion</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">2-8</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Policy Data Page, Schedule of Insurance, Premium</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">9</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Insurance Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">10</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Conversion Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">11</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Premium Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">12-13</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Claim Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">14-17</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">General Provisions</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
                ${(() => {
                    const hasRiders = Array.isArray(application?.riders) && application.riders.length > 0;
                    const range = hasRiders ? '{{RIDER_PAGE_RANGE}}' : 'N/A';
                    return `
                        <tr>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">${range}</td>
                            <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Riders</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                            <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                        </tr>
                    `;
                })()}
                <tr>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">&nbsp;</td>
                    <td style="border: 1px solid #000; padding: 3px 6px; font-style: italic;">Cover Letter</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">✓</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                    <td style="border: 1px solid #000; padding: 3px 2px; text-align: center; font-style: italic;">X</td>
                </tr>
            </tbody>
        </table>

        <div style="font-weight: bold; text-align: center; font-size: 13pt; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px;">CERTIFICATION</div>
        <p style="font-size: 8.5pt; font-style: italic; line-height: 1.4; text-align: justify; margin-bottom: 10px; text-indent: 0; font-family: 'Cambria', Georgia, serif;">
            We, the undersigned, certify that the Policy Data Page, Schedule of Insurance, Premium and policy contract assembly of the Account described herein is correct, and hereby endorsed for final signature by the EVP and COO.
        </p>

        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 5px; font-size: 8.5pt; font-family: 'Cambria', Georgia, serif;">
            <thead>
                <tr style="background-color: #ffffff; font-size: 8.5pt;">
                    <th style="width: 50%; border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">SIGNATORIES</th>
                    <th style="width: 50%; border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">DATE AND SIGNATURE</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>REYMARK M. MAGDATO</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">EBAM/UNDERWRITING</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>IRVIN C. BO</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">EBAM/UNDERWRITING</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>MARIA FE SALANIO</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">EBAM/UNDERWRITING</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>FERDINAND A. RECIO</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">OPERATIONS</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>RONALD Y. TABALADA</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">ACTUARIAL</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
                <tr>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px; vertical-align: middle;">
                        <strong>MARVIN M. CATAPANG</strong><br>
                        <span style="font-size: 7.5pt; color: #000000; font-weight: 500;">GROUP SALES</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 5px 8px; height: 32px;"></td>
                </tr>
            </tbody>
        </table>

    </div>
        ` : '') + `
</body>
</html>
    `;
}
