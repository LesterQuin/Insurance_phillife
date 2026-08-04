import { generateSummaryOfBenefits } from './plan_riders.js';

// Helper to format numbers with commas for currency.
const capitalize = (str) => {
  if (!str) return "";
  const s = String(str);
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const formatNumber = (num) => {
  if (num == null || isNaN(num)) return "0.00";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
};

const getPaymentModeName = (application) => {
  const modeId = Number(application.payment_mode_id || application.payment_mode?.id || 0);
  switch (modeId) {
    case 23: return "Annual";
    case 24: return "Semi-Annual";
    case 25: return "Quarterly";
    case 26: return "Monthly";
    case 27: return "Single Mode";
    default:
      if (application.payment_mode?.name) {
        return capitalize(application.payment_mode.name);
      }
      return "Annual";
  }
};

// Helper to extract flat rate for basic plan or riders (when lives > 30)
const getRateForRider = (ratesObj, riderId, isBasic = false) => {
  if (isBasic) {
    const basicVal = ratesObj?.rates?.[0]?.basic_rate;
    if (basicVal == null) return 0;
    const parsed = parseFloat(String(basicVal).replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  if (Number(riderId) === 27) return 0; // GTIR under GCI (ID 27) is Free
  const riderObj = ratesObj?.rates?.[0]?.riders?.find(r => Number(r.rider_id) === Number(riderId));
  const rateVal = riderObj?.rider_rate;
  if (rateVal == null) return 0;
  const parsed = parseFloat(String(rateVal).replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

// Helper to extract age-banded rate (when lives <= 30)
const getAgeBasedRateForRider = (ratesObj, ageKey, riderId, isBasic = false) => {
  const ageGroup = ratesObj?.[ageKey];
  if (!ageGroup || ageGroup.length === 0) return 0;
  if (isBasic) {
    const basicVal = ageGroup[0]?.basic_rate;
    if (basicVal == null) return 0;
    const parsed = parseFloat(String(basicVal).replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }
  if (Number(riderId) === 27) return 0; // GTIR is Free
  const riderObj = ageGroup[0]?.riders?.find(r => Number(r.rider_id) === Number(riderId));
  const rateVal = riderObj?.rider_rate;
  if (rateVal == null) return 0;
  const parsed = parseFloat(String(rateVal).replace(/,/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

// Helper to extract benefit amount (numeric)
const getBenefitAmount = (application, riderId, designation = null, isBasic = false) => {
  if (Number(riderId) === 27) {
    return 0; // GTIR has no numeric benefit for premium calculation
  }

  // Uniform Coverage
  if (Number(application.coverage_type_id) === 33) {
    if (isBasic) {
      return parseFloat(application.uniform_coverage_amount || 0);
    }
    const rider = application.riders?.find(r => Number(r.rider_id) === Number(riderId));
    return parseFloat(rider?.amount ?? rider?.values?.[0]?.amount ?? 0);
  }

  // Level Ranking
  if (Number(application.coverage_type_id) === 32) {
    if (isBasic) {
      const ranking = application.level_ranking?.find(r => r.designation === designation);
      return parseFloat(ranking?.total_coverage_amount ?? 0);
    }
    const rider = application.riders?.find(r => Number(r.rider_id) === Number(riderId));
    const riderVal = rider?.values?.find(v => v.designation === designation);
    return parseFloat(riderVal?.amount ?? 0);
  }

  // By Salary Rank
  if (Number(application.coverage_type_id) === 34) {
    if (isBasic || Number(riderId) === 26 || Number(riderId) === 23) { // TPDR/GADDR equivalents for GCI
      const rank = application.salary_ranking?.find(r => r.designation === designation);
      return parseFloat(rank?.total_coverage_amount ?? 0);
    }
    const rider = application.riders?.find(r => Number(r.rider_id) === Number(riderId));
    const riderVal = rider?.values?.find(v => v.designation === designation);
    return parseFloat(riderVal?.amount ?? 0);
  }

  return 0;
};

// Helper to extract benefit display text
const getBenefitDisplay = (application, riderId, designation = null, isBasic = false) => {
  if (Number(riderId) === 27) {
    return "50% of GCIP maximum of Php 4,000,000.00";
  }

  if (Number(application.coverage_type_id) === 34) {
    if (isBasic || Number(riderId) === 26 || Number(riderId) === 23) {
      const rank = application.salary_ranking?.find(r => r.designation === designation);
      if (rank) {
        const mult = rank.salary_multiplier || "";
        const cleanMult = mult.toLowerCase().replace(/x$/, '').trim();
        return `${cleanMult} Monthly Basic Salary maximum of Php ${formatNumber(rank.total_coverage_amount)}`;
      }
    }
  }

  const amt = getBenefitAmount(application, riderId, designation, isBasic);
  return formatNumber(amt);
};

// Helper to generate table rows dynamically for rates
const generateRateRows = (items, suffix = "") => {
  if (!Array.isArray(items) || items.length === 0)
    return '<tr><td colspan="4">No rates provided yet</td></tr>';

  const sorted = [...items].sort((a, b) => {
    if (a.attained_age !== null && b.attained_age !== null)
      return a.attained_age - b.attained_age;
    if (a.attained_age !== null) return 1;
    if (b.attained_age !== null) return -1;
    if (a.age_band !== null && b.age_band !== null)
      return a.age_band.localeCompare(b.age_band);
    const aTerm = a.term_of_months || a.term_months;
    const bTerm = b.term_of_months || b.term_months;
    if (aTerm != null && bTerm != null) return aTerm - bTerm;
    if (aTerm != null) return -1;
    if (bTerm != null) return 1;
    if (a.rider_id !== null && b.rider_id !== null)
      return a.rider_id - b.rider_id;
    return (a.rider_name || "").localeCompare(b.rider_name || "");
  });

  return sorted
    .map((item) => {
      const ageLabel =
        item.attained_age ||
        (item.age_band === "BASIC_PLAN" || item.age_band === "BASIC"
          ? "Standard"
          : item.age_band) ||
        "-";
      const termVal = item.term_of_months || item.term_months;
      const termLabel = termVal ? `${termVal}${suffix}` : "-";
      const riderLabel =
        item.rider_name || item.basic_plan_name || "Basic Plan";

      return `
<tr>
  <td>${ageLabel}</td>
  <td>${termLabel}</td>
  <td>${riderLabel}</td>
  <td>${item.rate}</td>
</tr>`;
    })
    .join("");
};

// Helper to generate chunked tables for GCI rates
const generateChunkedRateTables = (
  rates,
  maturity,
  header,
  suffix,
  minAge = 18,
  maxAge = 65,
) => {
  if (!Array.isArray(rates) || rates.length === 0)
    return '<div class="age-tables-container"><div class="age-table-box"><p>No rates provided yet</p></div></div>';

  return `
        <div class="age-tables-container">
            <div class="age-table-box" style="flex: 0 0 100%;">
                <table class="compact-table">
                    <tr style="background-color: #f9f9f9;">
                        <th style="font-size: 8.5pt;">Attained Age</th>
                        <th style="font-size: 8.5pt;">Term of Loan</th>
                        <th style="font-size: 8.5pt;">Rider</th>
                        <th style="font-size: 8.5pt;">Rate(%)</th>
                    </tr>
                    ${generateRateRows(rates, suffix)}
                </table>
            </div>
        </div>
    `;
};

const formatRate = (num, decimals = 2) => {
  if (num == null || isNaN(num)) return "0.00";
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const getRiderHeader = (rider, isBasic = false) => {
  if (isBasic) return 'GCIP';
  if (Number(rider.rider_id) === 31 || rider.acronym === 'BMSR') return 'GCI - Burial';
  return rider.acronym || rider.rider_name;
};

const getSortedAgeKeys = (ratesObj) => {
  if (!ratesObj) return [];
  return Object.keys(ratesObj)
    .filter(key => key.startsWith('age_'))
    .sort((a, b) => {
      const getStartAge = (key) => {
        const parts = key.split('_');
        const val = parseInt(parts[1], 10);
        return isNaN(val) ? 0 : val;
      };
      return getStartAge(a) - getStartAge(b);
    });
};

const formatAgeLabel = (key) => {
  const clean = key.replace(/^age_/, '');
  if (clean.includes('_')) {
    return clean.replace('_', ' to ');
  }
  return clean;
};

const renderGCITables = (application, rates18_65, details) => {
  const lives = Number(application.number_of_lives || 0);
  const coverageTypeId = Number(application.coverage_type_id || 0);
  const paymentMode = getPaymentModeName(application);

  if (coverageTypeId !== 32 && coverageTypeId !== 33 && coverageTypeId !== 34) {
    const standardHeader = "Rider";
    const standardSuffix = "";
    return `
      <h2 style="margin-top:10px;">SINGLE RATE PER 1,000 (Age ${application.minimum_age}-${application.maximum_age})</h2>
      ${generateChunkedRateTables(rates18_65, details?.maturity, standardHeader, standardSuffix, application.minimum_age, application.maximum_age)}
    `;
  }

  const activeRiders = (application.riders || []).filter(r => r.rider_id !== null && r.rider_id !== 0);

  const columns = [
    { id: 'basic', label: application.basic_plan_acronym || application.basic_plan?.acronym || 'GCIP', isBasic: true }
  ];
  activeRiders.forEach(r => {
    columns.push({
      id: r.rider_id,
      label: getRiderHeader(r),
      isBasic: false,
      acronym: r.acronym
    });
  });

  // Chunk columns into groups of max 6 to prevent horizontal overflow in PDF
  const MAX_COLS = 6;
  const colChunks = [];
  for (let i = 0; i < columns.length; i += MAX_COLS) {
    colChunks.push(columns.slice(i, i + MAX_COLS));
  }

  let rows = [];
  if (coverageTypeId === 32) {
    const designations = (application.level_ranking || []).map(r => r.designation).filter(Boolean);
    rows = designations.map(d => ({ id: d, label: d }));
  } else if (coverageTypeId === 34) {
    const designations = (application.salary_ranking || []).map(r => r.designation).filter(Boolean);
    rows = designations.map(d => ({ id: d, label: d }));
  } else if (coverageTypeId === 33) {
    rows = [{ id: 'uniform', label: 'All eligible individuals' }];
  }

  // 1. Benefits Table HTML (Chunked)
  let benefitsHtml = `
    <h3 style="margin-top: 15px; margin-bottom: 5px; color: #0d47a1; font-size: 11pt;">Benefits:</h3>
  `;
  benefitsHtml += colChunks.map(chunk => {
    const colWidth = 65 / chunk.length;
    return `
      <table class="compact-table" style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="width: 35%; padding: 6px; border: 1px solid #ddd; text-align: left; font-size: 8.5pt;">Classification</th>
            ${chunk.map(col => `<th style="width: ${colWidth}%; padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: left; font-weight: bold; font-size: 8.5pt;">${row.label}</td>
              ${chunk.map(col => {
                const display = getBenefitDisplay(application, col.id, row.id, col.isBasic);
                return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${display}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }).join('');

  if (lives > 30) {
    const getRateDisplay = (col) => {
      if (Number(col.id) === 27) return 'Free';
      const rateVal = getRateForRider(rates18_65, col.id, col.isBasic);
      return formatRate(rateVal, 2);
    };

    let ratesHtml = `
      <h3 style="margin-top: 15px; margin-bottom: 5px; color: #0d47a1; font-size: 11pt;">${paymentMode} Rate per 1,000</h3>
    `;
    ratesHtml += colChunks.map(chunk => {
      const hasFirstCol = !!details?.ratesCustomRemaining;
      const firstColWidth = 35;
      const colWidth = (100 - (hasFirstCol ? firstColWidth : 0)) / chunk.length;
      return `
        <table class="compact-table" style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              ${details?.ratesCustomRemaining ? `<th style="width: 35%; padding: 6px; border: 1px solid #ddd; text-align: left; font-size: 8.5pt;">Age Bracket</th>` : ''}
              ${chunk.map(col => `<th style="width: ${colWidth}%; padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              ${details?.ratesCustomRemaining ? `<td style="padding: 6px; border: 1px solid #ddd; text-align: left; font-weight: bold; font-size: 8.5pt;">${application.minimum_age || 18}-${application.maximum_age || 65}</td>` : ''}
              ${chunk.map(col => `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold; font-size: 8.5pt;">${getRateDisplay(col)}</td>`).join('')}
            </tr>
            ${details?.ratesCustomRemaining ? `
            <tr>
              <td style="padding: 6px; border: 1px solid #ddd; text-align: left; font-weight: bold; font-size: 8.5pt;">${(application.maximum_age || 65) + 1}-65</td>
              ${chunk.map(col => {
                if (Number(col.id) === 27) return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold; font-size: 8.5pt;">Free</td>`;
                const rateVal = getRateForRider(details.ratesCustomRemaining, col.id, col.isBasic);
                return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold; font-size: 8.5pt;">${formatRate(rateVal, 2)}</td>`;
              }).join('')}
            </tr>
            ` : ''}
          </tbody>
        </table>
      `;
    }).join('');

    let premiumHtml = `
      <h3 style="margin-top: 15px; margin-bottom: 5px; color: #0d47a1; font-size: 11pt;">${paymentMode} Premium per Head (Php):</h3>
    `;
    premiumHtml += colChunks.map((chunk, chunkIdx) => {
      const isLastChunk = chunkIdx === colChunks.length - 1;
      const firstColWidth = 25;
      const lastColWidth = isLastChunk ? 15 : 0;
      const remainingWidth = 100 - firstColWidth - lastColWidth;
      const colWidth = remainingWidth / chunk.length;

      return `
        <table class="compact-table" style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="width: 25%; padding: 6px; border: 1px solid #ddd; text-align: left; font-size: 8.5pt;">Classification</th>
              ${chunk.map(col => `<th style="width: ${colWidth}%; padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${col.label}</th>`).join('')}
              ${isLastChunk ? `<th style="width: 15%; padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold; font-size: 8.5pt;">TOTAL</th>` : ''}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => {
              let rowTotal = 0;
              columns.forEach(col => {
                if (Number(col.id) === 27) return;
                const benefitAmt = getBenefitAmount(application, col.id, row.id, col.isBasic);
                const rateVal = getRateForRider(rates18_65, col.id, col.isBasic);
                const premium = (benefitAmt / 1000) * rateVal;
                rowTotal += premium;
              });

              const cells = chunk.map(col => {
                if (Number(col.id) === 27) {
                  return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">Free</td>`;
                }
                const benefitAmt = getBenefitAmount(application, col.id, row.id, col.isBasic);
                const rateVal = getRateForRider(rates18_65, col.id, col.isBasic);
                const premium = (benefitAmt / 1000) * rateVal;
                return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${formatNumber(premium)}</td>`;
              });

              return `
                <tr>
                  <td style="padding: 6px; border: 1px solid #ddd; text-align: left; font-weight: bold; font-size: 8.5pt;">${row.label}</td>
                  ${cells.join('')}
                  <td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-weight: bold; background-color: #fafafa; font-size: 8.5pt;">${formatNumber(rowTotal)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }).join('');

    let grandTotalHtml = `
      <div style="margin-top: 15px; text-align: left; font-size: 11pt; font-weight: bold; color: #0d47a1; border-top: 2px solid #0d47a1; padding-top: 10px;">
        Total Premium: Php ${formatNumber(details?.totalAnnualPremium || 0)}
      </div>
    `;

    const planId = Number(application.plan_id || 4);
    let seniorRatesTablesHtml = "";
    const seniorBracketsList = [
      { key: '66-70', flag: 'borrower_age_66_70', data: details?.rates66_70, min: 66, max: 70 },
      { key: '71-75', flag: 'borrower_age_71_75', data: details?.rates71_75, min: 71, max: 75 },
      { key: '76-80', flag: 'borrower_age_76_80', data: details?.rates76_80, min: 76, max: 80 }
    ];

    seniorBracketsList.forEach(sb => {
      if (application[sb.flag] && sb.data && Object.keys(sb.data).some(k => k.startsWith('age_'))) {
        const ageKeys = getSortedAgeKeys(sb.data).filter(ageKey => {
          const ageNum = parseInt(ageKey.replace('age_', ''), 10);
          return ageNum <= 69;
        });
        if (ageKeys.length > 0) {
          seniorRatesTablesHtml += `
            <h3 style="margin-top: 15px; margin-bottom: 5px; color: #0d47a1; font-size: 11pt;">Senior Age Bracket ${sb.key} ${paymentMode} Rate per 1,000</h3>
          `;
          seniorRatesTablesHtml += colChunks.map(chunk => {
            const colWidth = 65 / chunk.length;
            return `
              <table class="compact-table" style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th style="width: 35%; padding: 6px; border: 1px solid #ddd; text-align: left; font-size: 8.5pt;">Attained Age</th>
                    ${chunk.map(col => `<th style="width: ${colWidth}%; padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${col.label}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${ageKeys.map(ageKey => {
                    const ageLabel = formatAgeLabel(ageKey);
                    return `
                      <tr>
                        <td style="padding: 6px; border: 1px solid #ddd; text-align: left; font-weight: bold; font-size: 8.5pt;">${ageLabel}</td>
                        ${chunk.map(col => {
                          const freeRiderId = 27;
                          if (Number(col.id) === freeRiderId) return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">Free</td>`;
                          const isAllowedRider = col.isBasic || col.id.toString() === '30';
                          if (!isAllowedRider) {
                            return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt; color: #777;">N/A</td>`;
                          }
                          const rate = getAgeBasedRateForRider(sb.data, ageKey, col.id, col.isBasic);
                          return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${formatRate(rate, 3)}</td>`;
                        }).join('')}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `;
          }).join('');
        }
      }
    });

    if (coverageTypeId === 34) {
      return benefitsHtml + ratesHtml + grandTotalHtml + seniorRatesTablesHtml;
    }
    return benefitsHtml + ratesHtml + premiumHtml + grandTotalHtml + seniorRatesTablesHtml;

  } else {
    const ageKeys = getSortedAgeKeys(rates18_65);
    
    let ratesTableHtml = `
      <h3 style="margin-top: 15px; margin-bottom: 5px; color: #0d47a1; font-size: 11pt;">${paymentMode} Rate per 1,000</h3>
    `;
    ratesTableHtml += colChunks.map(chunk => {
      const colWidth = 65 / chunk.length;
      return `
        <table class="compact-table" style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="width: 35%; padding: 6px; border: 1px solid #ddd; text-align: left; font-size: 8.5pt;">Attained Age</th>
              ${chunk.map(col => `<th style="width: ${colWidth}%; padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${col.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${ageKeys.map(ageKey => {
              const ageLabel = formatAgeLabel(ageKey);
              return `
                <tr>
                  <td style="padding: 6px; border: 1px solid #ddd; text-align: left; font-weight: bold; font-size: 8.5pt;">${ageLabel}</td>
                  ${chunk.map(col => {
                    if (Number(col.id) === 27) return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">Free</td>`;
                    const rate = getAgeBasedRateForRider(rates18_65, ageKey, col.id, col.isBasic);
                    return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${formatRate(rate, 3)}</td>`;
                  }).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    }).join('');

    let grandTotalHtml = `
      <div style="margin-top: 15px; text-align: left; font-size: 11pt; font-weight: bold; color: #0d47a1; border-top: 2px solid #0d47a1; padding-top: 10px;">
        Total Premium: Php ${formatNumber(details?.totalAnnualPremium || 0)}
      </div>
    `;

    const planId = Number(application.plan_id || 4);
    let seniorRatesTablesHtml = "";
    const seniorBracketsList = [
      { key: '66-70', flag: 'borrower_age_66_70', data: details?.rates66_70, min: 66, max: 70 },
      { key: '71-75', flag: 'borrower_age_71_75', data: details?.rates71_75, min: 71, max: 75 },
      { key: '76-80', flag: 'borrower_age_76_80', data: details?.rates76_80, min: 76, max: 80 }
    ];

    seniorBracketsList.forEach(sb => {
      if (application[sb.flag] && sb.data && Object.keys(sb.data).some(k => k.startsWith('age_'))) {
        const ageKeys = getSortedAgeKeys(sb.data).filter(ageKey => {
          const ageNum = parseInt(ageKey.replace('age_', ''), 10);
          return ageNum <= 69;
        });
        if (ageKeys.length > 0) {
          seniorRatesTablesHtml += `
            <h3 style="margin-top: 15px; margin-bottom: 5px; color: #0d47a1; font-size: 11pt;">Senior Age Bracket ${sb.key} ${paymentMode} Rate per 1,000</h3>
          `;
          seniorRatesTablesHtml += colChunks.map(chunk => {
            const colWidth = 65 / chunk.length;
            return `
              <table class="compact-table" style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
                <thead>
                  <tr style="background-color: #f2f2f2;">
                    <th style="width: 35%; padding: 6px; border: 1px solid #ddd; text-align: left; font-size: 8.5pt;">Attained Age</th>
                    ${chunk.map(col => `<th style="width: ${colWidth}%; padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${col.label}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${ageKeys.map(ageKey => {
                    const ageLabel = formatAgeLabel(ageKey);
                    return `
                      <tr>
                        <td style="padding: 6px; border: 1px solid #ddd; text-align: left; font-weight: bold; font-size: 8.5pt;">${ageLabel}</td>
                        ${chunk.map(col => {
                          const freeRiderId = 27;
                          if (Number(col.id) === freeRiderId) return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">Free</td>`;
                          const isAllowedRider = col.isBasic || col.id.toString() === '30';
                          if (!isAllowedRider) {
                            return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt; color: #777;">N/A</td>`;
                          }
                          const rate = getAgeBasedRateForRider(sb.data, ageKey, col.id, col.isBasic);
                          return `<td style="padding: 6px; border: 1px solid #ddd; text-align: center; font-size: 8.5pt;">${formatRate(rate, 3)}</td>`;
                        }).join('')}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `;
          }).join('');
        }
      }
    });

    return benefitsHtml + ratesTableHtml + grandTotalHtml + seniorRatesTablesHtml;
  }
};

export const generateGCIPDFContent = (application, user, details) => {
  const proposalDate = new Date(application.updated_at);
  const expiryDate = new Date(proposalDate);
  expiryDate.setDate(expiryDate.getDate() + 30);

  const addresseeLastName =
    application.proposal_addressee?.split(" ").pop() || "";

  const {
    totalAnnualPremium = 0,
    rates18_65 = {},
    logoDataUri = null,
    centerPhotoUri = null,
    footerPhotoUri = null,
    page2FooterPhotoUri = null,
  } = details || {};

  const selectedRiders = (application.riders || []).filter(r => r.rider_id !== null && r.rider_id !== 0);
  const hasManyRiders = selectedRiders.length > 8;

  const getTerminationAge = () => {
    if (application.borrower_age_76_80) return 81;
    if (application.borrower_age_71_75) return 76;
    if (application.borrower_age_66_70) return 71;
    const hasRemaining = !!details?.ratesCustomRemaining;
    if (hasRemaining) return 66;
    return (application.maximum_age || 65) + 1;
  };
  const terminationAge = getTerminationAge();

  const encloseText = `<p style="text-align: justify; text-indent: 30px;">Enclosed are the proposed premium rates, coverage details, benefits, terms and conditions, and other pertinent provisions for your review and evaluation. We have carefully developed this proposal to offer comprehensive critical illness protection that aligns with your organization's needs and objectives.</p>`;

  const appreciateText = `<p style="text-align: justify; text-indent: 30px;">We appreciate the opportunity to present this proposal and trust that it will meet your organization's requirements. We look forward to building a long-term, mutually beneficial partnership founded on trust, reliability, and excellent service.</p>`;

  const cfeFullName = `${user.firstname} ${user.lastname}`;
  const isDirect = Number(application.channel_type_id) === 55;
  const salesRepName = isDirect ? cfeFullName : (application.channel_name || "");
  const salesRepNumber = isDirect ? (user.phoneNumber || application.channel_number || "") : (application.channel_number || "");
  const salesRepEmail = isDirect ? (user.email || application.channel_email || "helpdesk@phillife.com.ph") : (application.channel_email || "helpdesk@phillife.com.ph");

  const planName = (application.basic_plan?.name || "Group Critical Illness Plan").trim();
  const lastSpaceIndex = planName.lastIndexOf(" ") !== -1 ? planName.lastIndexOf(" ") : planName.length;

  let displayTitle = "";
  if (planName.lastIndexOf(" ") !== -1) {
    displayTitle = `
        <span style="color:#0d47a1;">${planName.substring(0, lastSpaceIndex)}</span>
        <br>
        <span style="color:#2e7d32;">${planName.substring(lastSpaceIndex + 1)} PROPOSAL</span>
    `;
  } else {
    displayTitle = `
        <span style="color:#0d47a1;">${planName}</span>
        <br>
        <span style="color:#2e7d32;">PROPOSAL</span>
    `;
  }

  return `
    <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Group Critical Illness Insurance Proposal (GCI)</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        html, body {
            margin: 0; padding: 0; font-family: 'Inter', sans-serif; line-height: 1.6; color: #202124; 
        }
        h2 {
            color: #0d47a1;
            margin-top: 30px;
            margin-bottom: 15px;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 5px;
            break-after: avoid;
            page-break-after: avoid;
        }
        h3 { 
            margin-top: 30px; break-after: avoid; page-break-after: avoid; 
        }
        .main-content p { font-size: 11pt; }
        .section-group, .notes, .installation-requirements, .signature-section { 
            break-inside: auto; page-break-inside: auto; 
        }
        .plan-details table:not(.layout-table), .plan-details ul, .plan-details .note, .plan-details p { break-inside: auto; page-break-inside: auto; }
        table { 
            width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: fixed; word-wrap: break-word; word-break: break-word;
        }
        table, th, td { 
            border: 1px solid #000; 
        }
        th, td { 
            padding: 8px; text-align: center; white-space: normal; word-wrap: break-word; word-break: break-word;
        }
        .age-tables-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-top: 15px;
            width: 100%;
            justify-content: flex-start;
        }
        .age-table-box {
            flex: 1 1 calc(33.33% - 20px);
            min-width: 200px;
            max-width: 100%;
        }
        .compact-table { width: 100%; font-size: 8.5pt; border: 1px solid #999; table-layout: fixed; word-wrap: break-word; word-break: break-word; }
        .compact-table th, .compact-table td { padding: 3px 5px; border: 1px solid #999; text-align: left; white-space: normal; word-wrap: break-word; word-break: break-word; }
        .note { font-size: 14px; margin-top: 10px; }
        .footer-contact { 
            display: flex; justify-content: left; gap: 20px; width: 100%; font-size: 10pt; color: #020202; font-style: italic; 
        }
        .footer-link { color: inherit; text-decoration: none; cursor: pointer; }
        .page-break { page-break-before: always; }
        .logo { display: block; margin-left: auto; margin-right: -15mm; margin-top: -10mm; width: 200px; }
        .center-photo { display: block; width: 100%; height: 550px; object-fit: cover; margin-bottom: 20px; margin-top: 20px; }
        .footer-logo { width: 200px; }
        .cover-proposal-title { 
            text-align: left; width: calc(100% - 40mm); font-size: 24pt; font-weight: bold; margin: -5mm 20mm 30px 20mm; color: #2b333c; text-transform: uppercase; line-height: 1.2; 
        }
        .header-table {
            width: calc(100% - 40mm) !important;
            margin: 10px auto 0 auto !important;
            border-collapse: separate;   
            border-spacing: 6.5px;
            table-layout: fixed;
            border: none !important;      
        }
        .header-table td {
            width: 33.33%;
            padding: 10px 12px;
            border: none !important;      
            background: #ffffff;          
            border-radius: 6px;
            vertical-align: top;
            text-align: left;
            line-height: 1.1;
            box-sizing: border-box;
            box-shadow: 0 1px 1px rgba(0,0,0,0.08);
        }
        .header-table strong {
            display: block;
            color: #202124;
            font-size: 11pt;
            text-transform: uppercase;
            margin-bottom: 0;
        }
        .cover-page {
            display: flex; flex-direction: column; height: 100vh; padding: 15mm 0 0 0; box-sizing: border-box; background-color: white; position: relative; z-index: 2;
        }
        .cover-top { position: relative; padding: 0 20mm; }
        .gradient-bar {
            position: absolute; top: -2mm; left: 20mm; width: 70mm; height: 13px;
            background: linear-gradient(90deg, #2b2a8c 0%, #253b97 15%, #1b5aa1 30%, #13728f 45%, #0f8b7b 60%, #0ca363 75%, #0db14b 100%);
            border-radius: 1px;
        } 
        .subsequent-header-gradient {
            position: absolute; top: 15mm; right: -1mm; width: 70mm; height: 13px;
            background: linear-gradient(90deg, #2b2a8c 0%, #253b97 15%, #1b5aa1 30%, #13728f 45%, #0f8b7b 60%, #0ca363 75%, #0db14b 100%);
            border-radius: 1px; z-index: 5;
        }   
        .cover-middle {
            flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 10mm; 
        }
        .cover-bottom {
            flex-shrink: 0; display: flex; justify-content: left; align-items: left; padding: 10px 15mm 10px 20mm;
        }
        .main-content {
            padding: 30mm 20mm 10mm 20mm; position: relative; background-color: transparent; z-index: 1; min-height: 260mm;
            display: flex; flex-direction: column; justify-content: flex-start; box-sizing: border-box; page-break-after: always;
        }
        .content-logo { position: absolute; top: 10mm; left: 10mm; width: 160px; z-index: 10; }
        .plan-details { margin: 0; background-color: transparent; position: relative; } 
        .layout-table { width: 100%; border: none !important; border-collapse: collapse; }
        .layout-table > thead > tr > td, .layout-table > tfoot > tr > td { 
            border: none !important; padding: 0 20mm; text-align: left; vertical-align: top; position: relative; 
        }
        .layout-table > tbody > tr > td { 
            border: none !important; padding: 0 20mm; text-align: left; vertical-align: top; position: relative; 
        }
        .spacer-top { height: 30mm; }
        .spacer-bottom { height: 40mm; }
        .watermark {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-5deg); width: 100%; height: 100%;
            background-image: url('${logoDataUri}'); background-repeat: repeat; background-size: 180px; opacity: 0.04; filter: grayscale(1); z-index: 9999; pointer-events: none;
        }
        .subsequent-footer { position: fixed; bottom: 0; left: 0; width: 101%; z-index: 0; pointer-events: none; }
        .plan-name-footer { position: absolute; bottom: 4mm; left: 10mm; font-size: 10pt; color: #ffffff; z-index: 5; font-weight: bold; }
        .page2-footer { position: absolute; bottom: 115mm; left: 0; width: 100%; z-index: 20; pointer-events: none; }
        </style>
</head>
<body>
    ${Number(application.status?.id || application.status_id) !== 7 && logoDataUri ? `<div class="watermark"></div>` : ""}
    ${footerPhotoUri ? `
        <div class="subsequent-footer">
            <div class="plan-name-footer">${planName}</div>
            <img src="${footerPhotoUri}" style="width: 101%; display: block;" />
        </div>
    ` : ""}

<div class="cover-page">
    <div class="cover-top">
        <div class="gradient-bar"></div>
        ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="logo" />` : ""}
    </div>
    <div class="cover-middle">
            <div class="cover-proposal-title">
                ${displayTitle}
            </div>
            ${centerPhotoUri ? `<img src="${centerPhotoUri}" alt="Plan Image" class="center-photo" />` : ""}
        <table class="header-table">
            <tr>
                <td><strong>Presented To:</strong><br>${capitalize(application.group_name)}</td>
                <td><strong>Proposal Status:</strong><br>${capitalize(application.proposal_status_name || application.status?.name || "New")}</td>
                <td><strong>Date of Proposal:</strong><br>${formatDate(proposalDate)}</td>
            </tr>
        </table>
    </div>
    <div class="cover-bottom">
            <div class="footer-contact">
                <a href="mailto:groupmarketingsales1@gmail.com" class="footer-link">✉️ groupmarketingsales1@gmail.com</a>
                <a href="https://www.phillife.com.ph" class="footer-link" target="_blank">🌐  www.phillife.com.ph</a>
                <a href="tel:+63277985433" class="footer-link">📞 (02) 7798 5433</a>
            </div>
    </div>
</div>

<div class="page-break"></div>
<div class="main-content">
    ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="content-logo" />` : ""}
    ${page2FooterPhotoUri ? `<div class="page2-footer"><img src="${page2FooterPhotoUri}" style="width: 100%; display: block;"  /></div>` : ""}
    <div class="subsequent-header-gradient"></div>
    <p>
        ${formatDate(proposalDate)} <br><br>
        ${application.contact_person_salutation || ""} ${application.proposal_addressee || ""} <br>
        ${application.addressee_designation} <br>
        ${application.group_name} <br>
        ${application.business_address}
    </p>
    <p>Dear ${application.contact_person_salutation || ""} ${addresseeLastName},</p>
    <p style="text-align: justify; text-indent: 30px;">
    We are pleased to submit our ${application.basic_plan?.name || "Group Critical Illness Insurance Proposal"} for the benefit of  
    ${application.group_name || ""}. This proposal is designed to provide valuable financial protection for your employees/members while reinforcing your organization's commitment to their well-being and security.
    </p>
    <p>The proposed insurance package includes the following:</p>
    <ul style="margin-top: -10px; margin-bottom: 15px; padding-left: 20px;">
        <li style="text-align: justify; font-size: 11pt; line-height: 1.6;">${planName}</li>
        ${application.riders && application.riders.length > 0 ? application.riders.map(r => {
            const hasAcronym = r.acronym && r.rider_name.toLowerCase().includes(r.acronym.toLowerCase());
            const displayName = hasAcronym || !r.acronym ? r.rider_name : `${r.rider_name} (${r.acronym})`;
            return `<li style="text-align: justify; font-size: 11pt; line-height: 1.6;">${displayName}</li>`;
        }).join('') : ""}
    </ul>
    ${encloseText}
    ${!hasManyRiders ? appreciateText : ""}
</div>

<div class="page-break"></div>
<div class="main-content">
    ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="content-logo" />` : ""}
    ${page2FooterPhotoUri ? `<div class="page2-footer"><img src="${page2FooterPhotoUri}" style="width: 100%; display: block;"  /></div>` : ""}
    <div class="subsequent-header-gradient"></div> <br>
    ${hasManyRiders ? appreciateText : ""}
    <p style="text-align: justify; text-indent: 30px;">
    Should you require any additional information or wish to discuss any aspect of this proposal, please feel free to contact our Sales Representative ${salesRepName} at ${salesRepNumber} or via email at ${salesRepEmail}.
    We will be pleased to assist you and discuss the proposal at your convenience.
    </p>
    <p style="text-align: justify; text-indent: 30px;">
    Thank you for your time and thoughtful consideration. We look forward to the opportunity to serve your organization and to receiving your favorable response.<br><br>
    Sincerely yours,
    </p>
    <p style="margin-bottom: 0;">
        <strong>${cfeFullName}</strong> <br>
        ${user.roleName || "Corporate Financial Executive"}${user.position ? ` - ${user.position}` : ""} <br>
        ${user.departmentName || "N/A"}
    </p>
</div>

<div class="page-break"></div>
<div class="plan-details">
    <table class="layout-table">
        <thead><tr><td>
            ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="content-logo" />` : ""}
            <div class="subsequent-header-gradient"></div>
            <div class="spacer-top"></div>
        </td></tr></thead>
        <tbody><tr><td>
            <div class="section-group">
            <h2>Summary of Benefits</h2>
            ${generateSummaryOfBenefits(application, application.riders || [])}
            </div>
            
            <div class="page-break"></div>
            <div class="section-group">
                ${renderGCITables(application, rates18_65, details)}
            </div>

            <div class="page-break"></div>
            <h2>Notes</h2>
            <div class="notes">
                <p>1. Rates are inclusive of government-mandated taxes. Renewal rate may change depending on the claims experience of the policy.</p>
                <p>2. <strong>Eligibility Requirements</strong>
                    <div style="text-indent: 20px;">Any regular, in good health and actively-at-work employee of the Policyholder who is at least ${application.minimum_age} years old and who has not attained his ${application.maximum_age + 1}th birth anniversary at the time of application.</div>
                </p>
                <p>3. <strong>Termination Age</strong></p>
                <ul style="margin-top: 2px; margin-left: 5mm; padding-left: 15px; font-size: 12pt;">
                    <li><strong>${planName}</strong> : Coverage terminates at age ${terminationAge}.</li>
                    ${(application.riders || []).map(r => `
                        <li><strong>${r.rider_name?.includes(`(${r.acronym})`) ? r.rider_name : `${r.rider_name || "Rider"}${r.acronym ? ` (${r.acronym})` : ""}`}</strong> : Coverage terminates at age ${terminationAge}.</li>
                    `).join("")}
                </ul>
                <div style="margin-bottom: 12px;">4. <strong>Participation Requirements</strong>:
                    <ul style="margin-top: 2px; margin-left: 5mm; padding-left: 15px; font-size: 11pt; line-height: 1.5;">
                        <li>100% of all eligible employees</li>
                        <li>At least 50 individuals upon policy inception.</li>
                        <li>At least 275 individuals before policy renewal.</li>
                    </ul>
                </div>
                <div style="margin-bottom: 12px;">5. <strong>Evidence of Insurability</strong>
                    ${application.evidence_notes ? `<div style="margin-left: 5mm; margin-top: 1px;">${application.evidence_notes}</div>` : ""}
                </div>
                <p>6. This proposal is subject to the complete provisions to be provided in the Policy.</p>
                <p>7. The proposal validity is until ${formatDate(expiryDate)}.</p>
                ${(() => {
                  let html = "";
                  let num = 8;
                  if (application.notes) {
                    html += `<div style="margin-bottom: 12px; break-inside: avoid;">${num}. <strong>Remarks</strong><div style="margin-left: 5mm; margin-top: 1px;">${application.notes}</div></div>`;
                    num++;
                  }
                  if (application.actuarial_notes && application.actuarial_notes_show_in_pdf !== false) {
                    html += `<div style="margin-bottom: 12px; break-inside: avoid;">${num}. <strong>Other Terms</strong><div style="margin-left: 5mm; margin-top: 1px;">${application.actuarial_notes}</div></div>`;
                    num++;
                  }
                  return html;
                })()}
            </div>

            <div class="page-break"></div>
            <div class="installation-requirements" style="margin-top: 50px; break-inside: avoid;">
                <h3 style="border-bottom: 2px solid #0d47a1; color: #0d47a1; padding-bottom: 5px; text-transform: uppercase; font-size: 14pt;">Installation requirements:</h3>
                <p style="font-size: 10pt; margin-bottom: 10px;">Should this proposal merits your approval, the following requirements are to be submitted to PHILLIFE prior to policy inception for evaluation and acceptance.</p>
                <ul style="font-size: 10pt; margin-left: 20px; line-height: 1.4;">
                    <li>SIGNED PROPOSAL/CONFORME</li>
                    <li>APPLICATION FOR GROUP INSURANCE</li>
                    <li>DTI(FOR SOLE PROPRIETORSHIP)</li>
                    <li>SEC CERTIFICATE OF REGISTRATION</li>
                    <li>ARTICLES OF INCORPORATION</li>
                    <li>BY-LAWS</li>
                    <li>BUSINESS PERMIT</li>
                    <li>MASTERLIST - Declaration with Certified by and Authorized Signatory (PDF & Excel Copy)</li>
                    <li>Copy of ID of the Authorized Signatory</li>
                </ul>
                <p style="font-size: 10pt; margin-top: 10px; font-style: italic;">Additional document/s will be required if needed after initial evaluation.</p>
            </div>

            <div class="signature-section" style="margin-top: 50px; break-inside: avoid;">
                <h3 style="border-bottom: 2px solid #0d47a1; color: #0d47a1; padding-bottom: 5px; text-transform: uppercase; font-size: 14pt;">Conforme:</h3>
                <p style="font-size: 10pt; margin-bottom: 20px;">I have read the benefits, premium and terms stated in this proposal. As the authorized representative of my company, I hereby confirm my acceptance on the proposal provided by Philippines Life Financial Assurance, Corp.(PhilLife) subject to the complete provisions to be provided in the Policy.</p>
                <table style="border: none; width: 100%; border-collapse: separate; border-spacing: 0 15px;">
                    <tr style="border: none;">
                        <td style="border: none; text-align: left; width: 48%; padding: 0; vertical-align: bottom;">
                            <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">${application.contact_person_salutation || ""} ${application.proposal_addressee || ""}</div>
                            <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Authorized Representative</div>
                        </td>
                        <td style="border: none; width: 4%;"></td>
                        <td style="border: none; text-align: left; width: 48%; padding: 0; vertical-align: bottom;">
                            <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">${application.addressee_designation || ""}</div>
                            <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Designation / Title</div>
                        </td>
                    </tr>
                    <tr style="border: none;">
                        <td style="border: none; text-align: left; padding: 20px 0 0 0; vertical-align: bottom;">
                            <div style="border-bottom: 1px solid #333; height: 40px;"></div>
                            <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Signature</div>
                        </td>
                        <td style="border: none;"></td>
                        <td style="border: none; text-align: left; padding: 20px 0 0 0; vertical-align: bottom;">
                            <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;"></div>
                            <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Date of Signed</div>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="signature-section" style="margin-top: 50px; break-inside: avoid;">
                <h3 style="border-bottom: 2px solid #0d47a1; color: #0d47a1; padding-bottom: 5px; text-transform: uppercase; font-size: 14pt;">Proposed by:</h3>
                <p style="font-size: 10pt; margin-bottom: 20px;">This proposal is prepared and submitted for your consideration by:</p>
                <table style="border: none; width: 100%; border-collapse: separate; border-spacing: 0 15px;">
                    <tr style="border: none;">
                        <td style="border: none; text-align: left; width: 48%; padding: 0; vertical-align: bottom;">
                            <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">${cfeFullName}</div>
                            <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Authorized PhilLife Representative</div>
                        </td>
                        <td style="border: none; width: 4%;"></td>
                        <td style="border: none; text-align: left; width: 48%; padding: 0; vertical-align: bottom;">
                            <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">${user.roleName || "Corporate Financial Executive"}</div>
                            <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Designation / Title</div>
                        </td>
                    </tr>
                    <tr style="border: none;">
                        <td style="border: none; text-align: left; padding: 20px 0 0 0; vertical-align: bottom;">
                            <div style="border-bottom: 1px solid #333; height: 40px;"></div>
                            <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Signature</div>
                        </td>
                        <td style="border: none;"></td>
                        <td style="border: none; text-align: left; padding: 20px 0 0 0; vertical-align: bottom;">
                            <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">${user.phoneNumber || ""}</div>
                            <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Contact Number</div>
                        </td>
                    </tr>
                </table>
            </div>
        </td></tr></tbody>
        <tfoot><tr><td><div class="spacer-bottom"></div></td></tr></tfoot>
    </table>
</div>

</body>
</html>
    `;
};
