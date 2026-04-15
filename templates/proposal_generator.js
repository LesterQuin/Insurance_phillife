// Helper to format numbers with commas for currency.
const capitalize = (str) => {
    if (!str) return '';
    const s = String(str);
    return s.charAt(0).toUpperCase() + s.slice(1);
};

const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
    // Adding timeZone: 'UTC' prevents the date from shifting to the next day
    // due to local timezone conversion of a UTC-like date string from the database.
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

// Helper to generate table rows dynamically for rates
const generateRateRows = (rates, suffix = '') => { 
    const keys = Object.keys(rates).map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (keys.length === 0) return '<tr><td colspan="2">N/A</td></tr>';
    return keys.map(key => `
<tr>
<td>${key}${suffix}</td>
<td>${rates[key]}</td>
</tr>`).join('');
};

/**
 * Generates the HTML content for a Group Credit Life Insurance Plan (GCLIP) proposal.
 * @param {object} application - The full application data object from the database.
 * @param {object} user - The user object for the person generating the proposal (CFE).
 * @param {object} details - An object containing plan-specific details like rates and premiums.
 * @returns {string} - The complete HTML content for the proposal.
 */
export const generateGCLIPDFContent = (application, user, details) => {
    const proposalDate = new Date(application.updated_at);
    const expiryDate = new Date(proposalDate);
    expiryDate.setDate(expiryDate.getDate() + 30);

    const addresseeLastName = application.proposal_addressee?.split(' ').pop() || '';

    // Defaulting details to avoid errors if they are not provided
    const {
        totalAnnualPremium = 0,
        maxAmount18_64 = 0,
        maxAmount65_67 = 0,
        maxAmount68_70 = 0,
        maxAmount71_74 = 0,
        rates18_64 = {},
        rates65_67 = {},
        rates68_70 = {},
        rates71_74 = {},
        participationPercentage = 75,
        nelAmount = 0,
        nelAge = 0,
        nmlAmount = 0,
        nmlAge = 0,
        logoDataUri = null,
        centerPhotoUri = null,
    } = details || {};

    const cfeFullName = `${user.firstname} ${user.lastname}`;

const planName = (application.basic_plan?.name || '').trim();
const lastSpaceIndex = planName.lastIndexOf(' ') !== -1 ? planName.lastIndexOf(' ') : planName.length;

let displayTitle = '';
if (planName.lastIndexOf(' ') !== -1) {
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
<title>Group Credit Life Insurance Proposal (GCLIP)</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }

        html, body {
            margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        h2, h3 { margin-top: 30px; break-after: avoid; page-break-after: avoid; }
        .plan-details table:not(.layout-table), .plan-details ul, .plan-details .note, .plan-details p { break-inside: avoid; page-break-inside: avoid; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        table, th, td { border: 1px solid #000; }
        th, td { padding: 8px; text-align: center; }
        .note { font-size: 14px; margin-top: 10px; }
        .footer-contact { display: flex; justify-content: left; gap: 20px; width: 100%; font-size: 10pt; color: #020202; font-style: italic; }
        .footer-link { color: inherit; text-decoration: none; cursor: pointer; }
        .page-break { page-break-before: always; }
        .logo { display: block; margin-left: auto; margin-right: -15mm; margin-top: -10mm; width: 180px; }
        .center-photo { display: block; width: 100%; height: 550px; object-fit: cover; margin-bottom: 20px; margin-top: 20px; }
        .footer-logo { width: 200px; }
        .cover-proposal-title { text-align: left; width: calc(100% - 40mm); font-size: 24pt; font-weight: bold; margin: -5mm 20mm 30px 20mm; color: #2b333c; text-transform: uppercase; line-height: 1.2; }
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
            padding: 12px 14px;
            border: none !important;      
            background: #ffffff;          
            border-radius: 6px;
            vertical-align: top;
            text-align: left;
            line-height: 1.3;
            box-sizing: border-box;
            box-shadow: 0 1px 1px rgba(0,0,0,0.08);
        }
        .header-table strong {
            display: block;
            color: #000;
            font-size: 10pt;
            text-transform: uppercase;
            margin-bottom: 0;
        }
        .cover-page {
            display: flex; flex-direction: column; height: 297mm; padding: 15mm 0 0 0; box-sizing: border-box; background-color: white; position: relative; z-index: 2;
        }
        .cover-top {
            flex-shrink: 0; padding: 0 20mm;
        }
        .cover-middle {
            flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 10mm; 
        }
        .cover-bottom {
            flex-shrink: 0; display: flex; justify-content: left; align-items: left; border-top: 1.5px solid #000; padding: 10px 20mm 10px 20mm;
        }
        .main-content {
            padding: 20mm;
            padding-left: 20mm;
            position: relative;
            background-color: transparent;
            z-index: 1;
            min-height: 297mm; /* Allow content to expand beyond one page if needed */
            display: flex;
            flex-direction: column;
            justify-content: center;
            box-sizing: border-box;
            page-break-after: always; /* Ensure the next section starts on a new page */
        }
        .content-logo { position: absolute; top: 20px; right: 40px; width: 100px; }
        .plan-details { 
            margin: 0 20mm; 
            background-color: transparent;
        } 
        /* PREMIUM DIAGONAL RIBBON */
        .main-content::before,
        .plan-details::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 30px;
            height: 100%;
            z-index: 1;
            background: linear-gradient(
                135deg,
                #0d47a1 0%,
                #1976d2 25%,
                #26a69a 60%,
                #2e7d32 100%
            );
            box-shadow: 3px 0 12px rgba(0,0,0,0.15);
        }
        /* Angled overlay for premium feel */
        .main-content::after,
        .plan-details::after {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 120px;
            height: 100%;
            z-index: 0;
            background: linear-gradient(
                120deg,
                rgba(255,255,255,0.08) 0%,
                rgba(255,255,255,0.03) 40%,
                transparent 70%
            );
        }
        .layout-table { width: 100%; border: none !important; border-collapse: collapse; }
        .layout-table > thead > tr > td,
        .layout-table > tbody > tr > td,
        .layout-table > tfoot > tr > td { border: none !important; padding: 0; text-align: left; vertical-align: top; }
        .spacer-top { height: 10mm; }
        .spacer-bottom { height: 40mm; }
        .subsequent-footer-logo { position: fixed; bottom: 10mm; right: 10mm; width: 100px; z-index: 1; }
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
    </style>
</head>
<body>
    <!-- To disable the watermark entirely, you can comment out the line below: -->
    ${['pending', 'draft', 'rejected'].includes(application.status?.name?.toLowerCase()) && logoDataUri
        ? `<div class="watermark"></div>`
        : ''}
<div class="cover-page">
    <div class="cover-top">
        ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="logo" />` : ''}
    </div>
    <div class="cover-middle">
            <div class="cover-proposal-title">
                ${displayTitle}
            </div>
            ${centerPhotoUri ? `<img src="${centerPhotoUri}" alt="Plan Image" class="center-photo" />` : ''}
        <table class="header-table">
            <tr>
                <td><strong>Presented To:</strong><br>${capitalize(application.group_name)}</td>
                <td><strong>Proposal Status:</strong><br>${capitalize(application.status?.name || '')}</td>
                <td><strong>Date of Proposal:</strong><br>${formatDate(proposalDate)}</td>
            </tr>
            <tr>
                <td><strong>Base Plan:</strong><br>${capitalize(application.basic_plan?.name || '')}</td>
                <td><strong>Total Annual Premium:</strong><br>Php ${formatNumber(totalAnnualPremium)}</td>
                <td><strong>Payment Terms:</strong><br>${capitalize(application.payment_mode?.name || '')}</td>
            </tr>
        </table>
    </div>
    <div class="cover-bottom">
            <div class="footer-contact">
                <a href="mailto:helpdesk@phillife.com.ph" class="footer-link">✉️ helpdesk@phillife.com.ph</a>
                <a href="https://www.phillife.com.ph" class="footer-link" target="_blank">🌐  www.phillife.com.ph</a>
                <a href="tel:+63277985433" class="footer-link">📞 (02) 7798 5433</a>
            </div>
    </div>
</div>
<div class="page-break"></div>
<div class="main-content">
${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="content-logo" />` : ''}
<p>
${formatDate(proposalDate)} <br><br><br>
${application.contact_person_salutation || ''} ${application.proposal_addressee || ''} <br>
${application.addressee_designation} <br>
${application.group_name} <br>
${application.business_address}
</p>
    <p>Dear ${application.addressee_designation || ''} ${addresseeLastName},</p>
    <p>We are pleased to present to you our <strong>${application.basic_plan?.name || ''}</strong> for the benefit of <strong>${application.group_name || ''}</strong> - debtors.</p>
    <p>Relative premium rates as well as other pertinent benefits and provisions are stated in the attached proposal.</p>
    <p>Should you have concerns with our program, please feel free to contact us at telephone number (02) 7798 – 5433, local number +63 917 123 4567 or email us at <a href="mailto:helpdesk@phillife.com.ph" class="footer-link">helpdesk@phillife.com.ph</a> and we will be more than willing to answer your queries.</p>
    <p>Thank you and looking forward to have a mutually beneficial partnership with your company.</p>
    <p>
Sincerely,<br><br>

<strong>${cfeFullName}</strong> <br>
${user.departmentName || 'N/A'} <br>
<strong>${user.locationName || 'N/A'}</strong>
</p>
</div>

<div class="plan-details">
<table class="layout-table">
    <thead><tr><td><div class="spacer-top"></div></td></tr></thead>
    <tbody><tr><td>
    
<h2>Summary of Benefits</h2>

<p>
<strong>Group Credit Life Insurance Plan (GCLIP) – Initial Loan Amount</strong>
</p>

<p>
Pays the initial loan amount upon approval of proof of death of the borrower
while the policy is in force and during the defined period, subject to the
maximum amount.
</p>

<table>
<tr>
<th>Classification</th>
<th>Benefit</th>
</tr>

<tr>
<td>${application.minimum_age || 18}-${application.maximum_age || 64}</td>
<td>Initial amount balance maximum of Php ${formatNumber(maxAmount18_64)}</td>
</tr>

${application.borrower_age_65_67 ? `
<tr>
<td>65-67</td>
<td>Initial amount balance maximum of Php ${formatNumber(maxAmount65_67)}</td>
</tr>` : ''}

${application.borrower_age_68_70 ? `
<tr>
<td>68-70</td>
<td>Initial amount balance maximum of Php ${formatNumber(maxAmount68_70)}</td>
</tr>` : ''}

${application.borrower_age_71_74 ? `
<tr>
<td>71-74</td>
<td>Initial amount balance maximum of Php ${formatNumber(maxAmount71_74)}</td>
</tr>` : ''}
</table>

<p>
Death benefit is the Amount of Insurance at loan effective date. It is level
throughout the term of the loan.
</p>

<div class="page-break"></div>

<h3>Single Rate per 1,000 – Borrowers Age ${application.minimum_age}-${application.maximum_age}</h3>

<table>
<tr>
<th>Term of Loan</th>
<th>Rate</th>
</tr>

${generateRateRows(rates18_64, ' months')}
</table>

${application.borrower_age_65_67 ? `
    <h3>Single Rate per 1,000 – Borrowers Age 65-67</h3>
    <table>
        <tr>
            <th>Term of Loan</th>
            <th>Rate</th>
        </tr>
        ${generateRateRows(rates65_67, ' months')}
    </table>
` : ''}

${application.borrower_age_68_70 ? `
    <h3>Single Rate per 1,000 – Borrowers Age 68-70</h3>
    <table>
        <tr>
            <th>Term of Loan</th>
            <th>Rate</th>
        </tr>
        ${generateRateRows(rates68_70, ' months')}
    </table>
` : ''}

${application.borrower_age_71_74 ? `
    <h3>Attained Age Rates (12 Months) – Borrowers Age 71-74</h3>
    <table>
        <tr>
            <th>Age</th>
            <th>Rate</th>
        </tr>
        ${generateRateRows(rates71_74, '')}
    </table>
` : ''}

<div class="page-break"></div>

<h2>Notes</h2>

<div class="notes">

<p>
1. Rates are inclusive of government-mandated taxes. Renewal rate may change
depending on the claims experience of the policy.
</p>

<p>
2. <strong>Eligibility Requirements</strong><br>
    A. Any in good health and actively-at-work debtor of the Policyholder who is at
least ${application.minimum_age} years old and who has not attained his ${application.maximum_age + 1}th birth anniversary
at the time of loan application. Actively-at-work means
<ul>
    <li>Performing usual duties of occupation and/or performing activities of daily living</li>
    <li>Engaged in lawful employment or business</li>
</ul>
</p>

<p>
3. <strong>Termination of Insurance</strong><br>
Insurance coverage automatically terminates on the earliest of the following dates:
</p>

<ul>
<li>The date the policy terminates</li>
<li>The policy anniversary immediately succeeding the date of the Debtor attains the termination age</li>
<li>The date any payment towards the loan becomes six (6) months overdue, not with standing payment for his insurance</li>
<li>The Insured Debtor ceases to be a debtor of the Creditor</li>
<li>The date the loan matures</li>
</ul>

<p>
4. <strong>Participation Requirements</strong><br>
At least ${participationPercentage}% individuals within the policy year
</p>

<p>
5. <strong>Evidence of Insurability</strong><br>
Individual application - borrower,
<ul>
    <li>No Evidence Limit (NEL): Php ${formatNumber(nelAmount)} provided eligible individual has not attained his ${nelAge} birthday<br></li>
    <li>Non-Medical Limit (NML): Php ${formatNumber(nmlAmount)} provided eligible individual has not attained his ${nmlAge} birthday</li>
</ul>
</p>

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

<div class="signature">

<p><strong>Conforme (Policyholder):</strong></p>

<p>
${application.contact_person_salutation} ${application.proposal_addressee}: ______________________________ <br>
</p>

<p>
${application.addressee_designation}: ______________________________ <br>
</p>

<p>
Signature: ______________________________ <br>
</p>

<p>
Date Signed: ______________________________ <br>
</p>

</div>

    </td></tr></tbody>
    <tfoot><tr><td><div class="spacer-bottom"></div></td></tr></tfoot>
</table>
</div>
${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="subsequent-footer-logo" />` : ''}

</body>
</html>
    `;
};
