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
  // Adding timeZone: 'UTC' prevents the date from shifting to the next day
  // due to local timezone conversion of a UTC-like date string from the database.
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
};

// Helper to generate table rows dynamically for rates
const generateRateRows = (items, suffix = "") => {
  if (!Array.isArray(items) || items.length === 0)
    return '<tr><td colspan="4">No rates provided yet</td></tr>';

  // Sort items: attained_age first, then age_band, then term_months, then rider_id, then rider_name
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

// Helper to generate chunked tables for 18-64 GCLI rates
const generateChunkedRateTables = (
  rates,
  maturity,
  header,
  suffix,
  minAge = 18,
  maxAge = 64,
) => {
  if (!Array.isArray(rates) || rates.length === 0)
    return '<div class="age-tables-container"><div class="age-table-box"><p>No rates provided yet</p></div></div>';

  // Detect if we are dealing with monthly term rates
  const isMonthly = rates.some((r) => {
    const t = r.term_of_months || r.term_months;
    return t !== null && t !== undefined && t > 0 && t <= 120;
  });
  const displaySuffix = isMonthly ? " months" : suffix;

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
                    ${generateRateRows(rates, displaySuffix)}
                </table>
            </div>
        </div>
    `;
};

/**
 * Generates the HTML content for a Group Credit Life Insurance Plan (GCLIP) proposal.
 * @param {object} application - The full application data object from the database.
 * @param {object} user - The user object for the person generating the proposal (CFE).
 * @param {object} details - An object containing plan-specific details like rates and premiums.
 * @returns {string} - The complete HTML content for the proposal.
 */
export const generateGYRTPDFContent = (application, user, details) => {
  const proposalDate = new Date(application.updated_at);
  const expiryDate = new Date(proposalDate);
  expiryDate.setDate(expiryDate.getDate() + 30);

  const addresseeLastName =
    application.proposal_addressee?.split(" ").pop() || "";

  // Defaulting details to avoid errors if they are not provided
  const {
    totalAnnualPremium = 0,
    maxAmount18_65 = 0,
    maxAmount66_70 = 0,
    maxAmount71_75 = 0,
    maxAmount76_80 = 0,
    rates18_65 = {},
    rates66_70 = {},
    rates71_75 = {},
    rates76_80 = {},
    participationPercentage = 100,
    logoDataUri = null,
    centerPhotoUri = null,
    footerPhotoUri = null,
    page2FooterPhotoUri = null,
  } = details || {};
  const maturity = details?.maturity || 0; // Get maturity from details

  const cfeFullName = `${user.firstname} ${user.lastname}`;

  // Dynamic configuration based on Plan
  const isGCLI = Number(application.plan_id) === 1;
  const standardHeader = isGCLI ? "Term of Loan" : "Rider";
  const standardSuffix = isGCLI ? " months" : "";

  const planName = (application.basic_plan?.name || "").trim();
  const lastSpaceIndex =
    planName.lastIndexOf(" ") !== -1
      ? planName.lastIndexOf(" ")
      : planName.length;

  let displayTitle = "";
  if (planName.lastIndexOf(" ") !== -1) {
    displayTitle = `
        <span style="color:#0d47a1;">${planName.substring(0, lastSpaceIndex)}</span>
        <br>
        <span style="color:#2e7d32;">${planName.substring(lastSpaceIndex + 1)} PROPOSAL</span>
    `;
  } else {
    // Fallback for single-word plan names
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
<title>Group Yearly Renewable Term Life Insurance Proposal (GYRT)</title>
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
            width: 100%; border-collapse: collapse; margin-top: 15px; 
        }
        table, th, td { 
            border: 1px solid #000; 
        }
        th, td { 
            padding: 8px; text-align: center; 
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
        flex: 1 1 calc(33.33% - 20px); /* Allow tables to grow to fill space */
        min-width: 200px;
        max-width: 100%;
        }
        .compact-table { width: 100%; font-size: 8.5pt; border: 1px solid #999; }
        .compact-table th, .compact-table td { padding: 3px 5px; border: 1px solid #999; text-align: left; }
        .note { 
            font-size: 14px; margin-top: 10px; 
        }
        .footer-contact { 
            display: flex; justify-content: left; gap: 20px; width: 100%; font-size: 10pt; color: #020202; font-style: italic; 
        }
        .footer-link { 
            color: inherit; text-decoration: none; cursor: pointer; 
        }
        .page-break { 
            page-break-before: always; 
        }
        .logo { 
            display: block; margin-left: auto; margin-right: -15mm; margin-top: -10mm; width: 200px; 
        }
        .center-photo { 
            display: block; width: 100%; height: 550px; object-fit: cover; margin-bottom: 20px; margin-top: 20px; 
        }
        .footer-logo { 
            width: 200px; 
        }
        .cover-proposal-title { 
            text-align: left; width: calc(100% - 40mm); font-size: 24pt; font-weight: bold; margin: -5mm 20mm 30px 20mm; color: #2b333c; text-transform: uppercase; line-height: 1.2; 
        }
        .header-table {
            width: calc(100% - 40mm) !important;
            margin: 10px auto 0 auto !important;
            border-collapse: separate;   
            border-spacing: 6.5px;        /* equal spacing between boxes */
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
        .cover-top {
            position: relative; 
            padding: 0 20mm;
        }
        .gradient-bar {
            position: absolute;
            top: -2mm;       
            left: 20mm;     
            width: 70mm;    
            height: 13px;
            background: linear-gradient(
                90deg,
                #2b2a8c 0%,
                #253b97 15%,
                #1b5aa1 30%,
                #13728f 45%,
                #0f8b7b 60%,
                #0ca363 75%,
                #0db14b 100%
            );
            border-radius: 1px;
        } 
        .subsequent-header-gradient {
            position: absolute;
            top: 15mm;          
            right: -1mm;        
            width: 70mm;
            height: 13px;
            background: linear-gradient(
                90deg, 
                #2b2a8c 0%,
                #253b97 15%,
                #1b5aa1 30%,
                #13728f 45%,
                #0f8b7b 60%,
                #0ca363 75%,
                #0db14b 100%
            );
            border-radius: 1px;
            z-index: 5;
        }   
        .cover-middle {
            flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 10mm; 
        }
        .cover-bottom {
            flex-shrink: 0; display: flex; justify-content: left; align-items: left; padding: 10px 15mm 10px 20mm;
        }
        .main-content {
            padding: 30mm 20mm 10mm 20mm;
            position: relative;
            background-color: transparent;
            z-index: 1;
            min-height: 260mm;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            box-sizing: border-box;
            page-break-after: always; /* Ensure the next section starts on a new page */
        }
        .content-logo { 
            position: absolute; top: 10mm; left: 10mm; width: 160px; z-index: 10; 
        }
        .plan-details { 
            margin: 0;
            background-color: transparent;
            position: relative;
        } 
        .layout-table { 
            width: 100%; border: none !important; border-collapse: collapse; 
        }
        .layout-table > thead > tr > td,
        .layout-table > tfoot > tr > td { 
            border: none !important; padding: 0 20mm; text-align: left; vertical-align: top; position: relative; 
        }
        .layout-table > tbody > tr > td { 
            border: none !important; padding: 0 20mm; text-align: left; vertical-align: top; position: relative; 
        }
        .spacer-top { 
            height: 30mm; 
        }
        .spacer-bottom { 
            height: 40mm; 
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-5deg);
            width: 100%;
            height: 100%;
            background-image: url('${logoDataUri}');
            background-repeat: repeat;
            background-size: 180px; /* Adjust this to make the "looping" logos smaller or larger */
            opacity: 0.04;
            filter: grayscale(1);
            z-index: 9999;
            pointer-events: none;
        }
        .subsequent-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 101%;
            z-index: 0;
            pointer-events: none;
        }
        .plan-name-footer {
            position: absolute;
            bottom: 4mm;
            left: 10mm;
            font-size: 10pt;
            color: #ffffff;
            z-index: 5;
            font-weight: bold;
        }
        .page2-footer {
            position: absolute;
            bottom: 115mm;
            left: 0;
            width: 100%;
            z-index: 20;
            pointer-events: none;
        }
        </style>
</head>
<body>
    <!-- To disable the watermark entirely, you can comment out the line below: -->
    ${
      Number(application.status?.id || application.status_id) !== 7 &&
      logoDataUri
        ? `<div class="watermark"></div>`
        : ""
    }

    ${
      footerPhotoUri
        ? `
        <div class="subsequent-footer">
            <div class="plan-name-footer">${planName}</div>
            <img src="${footerPhotoUri}" style="width: 101%; display: block;" />
        </div>
    `
        : ""
    }

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

    ${
      page2FooterPhotoUri
        ? `
        <div class="page2-footer">
            <img src="${page2FooterPhotoUri}" style="width: 100%; display: block;"  />
        </div>
    `
        : ""
    }

    <div class="subsequent-header-gradient"></div>
        <p>
            ${formatDate(proposalDate)} <br><br>
            ${application.contact_person_salutation || ""} ${application.proposal_addressee || ""} <br>
            ${application.addressee_designation} <br>
            ${application.group_name} <br>
            ${application.business_address}
        </p>
            <p>Dear ${application.contact_person_salutation || ""} ${addresseeLastName},</p>

            <p>
            We are pleased to present our ${application.basic_plan?.name || "Group Yearly Renewable Term Life Insurance Proposal"}, designed to provide 
            ${application.group_name || ""} and its valued members with comprehensive protection, financial security, and peace of mind.
            </p>

            <p>
            Our program offers competitive premium rates, flexible coverage, and reliable benefits tailored to support your organization’s goals and strengthen the value you deliver to those you serve.
            </p>

            <p>
            We would be happy to discuss further how this solution can align with your goals. Please contact us at (02) 7798-5433, mobile ${user.phoneNumber || ""} or email us at <a href="mailto:${user.email || "helpdesk@phillife.com.ph"}" class="footer-link">${user.email || "helpdesk@phillife.com.ph"}</a> for any inquiries.
            </p>

            <p>
            We look forward to partnering with ${application.group_name || ""} to protect what matters most—your people, your clients, and your organization’s future.
            </p>
        <p>
            Sincerely,<br><br>

            <strong>${cfeFullName}</strong> <br>
            ${user.roleName || "Corporate Financial Executive"} <br>
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
    <h2 style="margin-top:10px;">SINGLE RATE PER 1,000 (Age ${application.minimum_age}-${application.maximum_age})</h2>
    ${generateChunkedRateTables(rates18_65, maturity, standardHeader, standardSuffix, application.minimum_age, application.maximum_age)}

${
  application.borrower_age_66_70
    ? `
    <h2 style="margin-top:10px;">SINGLE RATE PER 1,000 (Age 66-70)</h2>
    ${generateChunkedRateTables(rates66_70, maturity, standardHeader, standardSuffix, 66, 70)}
`
    : ""
}

${
  application.borrower_age_71_75
    ? `
    <h2 style="margin-top:10px;">SINGLE RATE PER 1,000 (Age 71-75)</h2>
    ${generateChunkedRateTables(rates71_75, maturity, standardHeader, standardSuffix, 71, 75)}
`
    : ""
}

${
  application.borrower_age_76_80
    ? `
    <h2 style="margin-top:10px;">SINGLE RATE PER 1,000 (Age 76-80)</h2>
    ${generateChunkedRateTables(rates76_80, maturity, standardHeader, standardSuffix, 76, 80)}
`
    : ""
}
                </div>

<div class="page-break"></div>

<h2>Notes</h2>
<div class="notes">

    <p>
        1. Rates are inclusive of government-mandated taxes. Renewal rate may change
        depending on the claims experience of the policy.
    </p>

    <p>
        2. <strong>Eligibility Requirements</strong>
        <div style="text-indent: 20px;">
            Any regular, in good health and actively-at-work employee of the
        Policyholder who is at least ${application.minimum_age} years old and who has not attained his ${application.maximum_age + 1}th birth anniversary
        at the time of loan application. Actively-at-work means
        </div>
    </p>

    <p>
        3. <strong>Termination Age</strong>
    </p>

    <ul style="margin-top: 2px; margin-left: 5mm; padding-left: 15px; font-size: 12pt;">
        <li>
            <strong>
                ${
                  application.basic_plan?.name?.includes(
                    `(${application.basic_plan?.acronym})`,
                  )
                    ? application.basic_plan.name
                    : `${application.basic_plan?.name || "Basic Plan"}${application.basic_plan?.acronym ? ` (${application.basic_plan.acronym})` : ""}`
                }
            </strong> : Coverage terminates at age 65.
        </li>

        ${(application.riders || [])
          .map(
            (r) => `
                <li>
                    <strong>
                        ${
                          r.rider_name?.includes(`(${r.acronym})`)
                            ? r.rider_name
                            : `${r.rider_name || "Rider"}${r.acronym ? ` (${r.acronym})` : ""}`
                        }
                    </strong> : Coverage terminates at age 65.
                </li>
            `,
          )
          .join("")}
    </ul>

    <div style="margin-bottom: 12px;">
        4. <strong>Participation Requirements</strong><br>
        At least ${participationPercentage}% individuals within the policy year
    </div>

    <div style="margin-bottom: 12px;">
        5. <strong>Evidence of Insurability</strong>
        ${
          application.evidence_notes
            ? `
        <div style="margin-left: 5mm; margin-top: 1px;">
            ${application.evidence_notes}
        </div>
        `
            : ""
        }
    </div>

    <p>
        6. <strong>Payment of Benefits</strong><br>
        Upon approval of proof of death of the Debtor while the insurance is in force , PHILLIFE shall pay the following:
    </p>

    <ul>
        <li>To the Policyholder: the Outstanding balance of the Debtor's loan</li>
        <li>To the Debtor's benefeciaries: the difference, if any, between the amount of insurance and the outstanding balance of the Debtor's loan. Outstanding balance were derived from amortization of the insured.</li>
    </ul>

    <p>
        7. This proposal is subject to the complete provisions to be provided in the Policy.
    </p>

    <p>
        8. The proposal validity is until ${formatDate(expiryDate)}.
    </p>
</div>

<div class="page-break"></div>
<div class="installation-requirements" style="margin-top: 50px; break-inside: avoid;">
    <h3 style="border-bottom: 2px solid #0d47a1; color: #0d47a1; padding-bottom: 5px; text-transform: uppercase; font-size: 14pt;">Installation requirements:</h3>
    <p style="font-size: 10pt; margin-bottom: 10px;">
        Should this proposal merits your approval, the following requirements are to be submitted to PHILLIFE prior to policy inception for evaluation and acceptance.
    </p>
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
    <p style="font-size: 10pt; margin-top: 10px; font-style: italic;">
        Additional document/s will be required if needed after initial evaluation.
    </p>
</div>

<div class="signature-section" style="margin-top: 50px; break-inside: avoid;">
    <h3 style="border-bottom: 2px solid #0d47a1; color: #0d47a1; padding-bottom: 5px; text-transform: uppercase; font-size: 14pt;">Conforme:</h3>
    <p style="font-size: 10pt; margin-bottom: 20px;">I have read the benefits, premium and terms stated in this proposal. As the authorized representative of my company, I hereby confirm my acceptance on the proposal provided by Philippines Life Financial Assurance, Corp.(PhilLife) subject to the complete provisions to be provided in the Policy.</p>
    
    <table style="border: none; width: 100%; border-collapse: separate; border-spacing: 0 15px;">
        <tr style="border: none;">
            <td style="border: none; text-align: left; width: 48%; padding: 0; vertical-align: bottom;">
                <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">
                    ${application.contact_person_salutation || ""} ${application.proposal_addressee || ""}
                </div>
                <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Authorized Representative</div>
            </td>
            <td style="border: none; width: 4%;"></td>
            <td style="border: none; text-align: left; width: 48%; padding: 0; vertical-align: bottom;">
                <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">
                    ${application.addressee_designation || ""}
                </div>
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
                <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">
                </div>
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
                <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">
                    ${cfeFullName}
                </div>
                <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Authorized PhilLife Representative</div>
            </td>
            <td style="border: none; width: 4%;"></td>
            <td style="border: none; text-align: left; width: 48%; padding: 0; vertical-align: bottom;">
                <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">
                    ${user.roleName || "Corporate Financial Executive"}
                </div>
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
                <div style="border-bottom: 1px solid #333; padding-bottom: 5px; font-weight: bold; min-height: 20px;">
                    ${user.phoneNumber || ""}
                </div>
                <div style="font-size: 8pt; color: #666; margin-top: 4px; text-transform: uppercase;">Contact Number</div>
            </td>
        </tr>
    </table>
</div>

    </div>
        </td></tr></tbody>
        <tfoot><tr><td><div class="spacer-bottom"></div></td></tr></tfoot>
    </table>
</div>

</body>
</html>
    `;
};
