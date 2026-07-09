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
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });
};

export const generateStudentsGTLIPPDFContent = (application, user, details) => {
    const proposalDate = new Date(application.updated_at);
    const expiryDate = new Date(proposalDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
    const addresseeLastName =
        application.proposal_addressee?.split(" ").pop() || "";
    const totalAnnualPremium = details?.totalAnnualPremium || 0;
    const cfeFullName = `${user.firstname} ${user.lastname}`;
    const {
        logoDataUri = null,
        centerPhotoUri = null,
        footerPhotoUri = null,
        page2FooterPhotoUri = null,
    } = details || {};

    const planName = (application.basic_plan?.name || "").trim();
    const openParenIndex = planName.indexOf("(");
    let displayTitle = "";
    if (openParenIndex !== -1) {
        displayTitle = `
                <span style="color:#0d47a1;">${planName.substring(0, openParenIndex).trim()}</span>
                <br>
                <span style="color:#2e7d32;">${planName.substring(openParenIndex).trim()} PROPOSAL</span>
            `;
    } else {
        const lastSpaceIndex =
            planName.lastIndexOf(" ") !== -1
            ? planName.lastIndexOf(" ")
            : planName.length;

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
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Students' Group Term Life Insurance Plan</title>
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
            margin-top: 35px;
            margin-bottom: 15px;
            border-bottom: 2px solid #0d47a1;
            padding-bottom: 8px;
            font-size: 15pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            break-after: avoid;
            page-break-after: avoid;
        }
        h3 {
            color: #000000ff;
            margin-top: 25px;
            margin-bottom: 4px;
            font-size: 11pt;
            font-weight: 600;
            break-after: avoid;
            page-break-after: avoid;
        }
        .h3-details {
            padding-left: 0;
            margin-top: 0;
            margin-bottom: 15px;
        }
        .h3-details p {
            margin-top: 0;
            margin-bottom: 6px;
            font-size: 10pt;
            color: #202124;
            text-indent: 15px;
        }
        .h3-details ul {
            list-style-type: none;
            padding-left: 15px;
            margin-top: 0;
            margin-bottom: 6px;
        }
        .h3-details li {
            position: relative;
            padding-left: 15px;
            margin-bottom: 4px;
            font-size: 10pt;
            color: #202124;
        }
        .h3-details li::before {
            content: "•";
            color: #000000ff;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
            font-size: 12pt;
            line-height: 1;
            vertical-align: middle;
        }
        h4 {
            color: #000000ff;
            margin-top: 20px;
            margin-bottom: 4px;
            font-size: 10pt;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            break-after: avoid;
            page-break-after: avoid;
        }
        .main-content p { 
            font-size: 11pt; 
            line-height: 1.65;
            color: #202124;
            margin-bottom: 18px;
        }
        .section-group, .notes, .installation-requirements, .signature-section { 
            break-inside: auto; page-break-inside: auto; 
        }
        .plan-details table:not(.layout-table), .plan-details ul, .plan-details .note, .plan-details p { break-inside: auto; page-break-inside: auto; }
        
        /* Modern Data Table Styling */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
            margin-bottom: 6px;
        }
        .data-table th {
            background: linear-gradient(135deg, #0d47a1 0%, #1b5aa1 100%);
            color: #ffffff;
            font-size: 8.5pt;
            font-weight: 600;
            padding: 10px 8px;
            border: 1px solid #e2e8f0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .data-table td {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
            font-size: 9pt;
            color: #202124;
            text-align: center;
        }
        .data-table tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        
        /* Custom List Styling */
        .plan-details ul {
            list-style-type: none;
            padding-left: 15px;
            margin-top: 8px;
            margin-bottom: 15px;
        }
        .plan-details li {
            position: relative;
            padding-left: 15px;
            margin-bottom: 6px;
            font-size: 10pt;
            color: #202124;
        }
        .plan-details li::before {
            content: "•";
            color: #000000ff;
            font-weight: bold;
            display: inline-block;
            width: 1em;
            margin-left: -1em;
            font-size: 12pt;
            line-height: 1;
            vertical-align: middle;
        }

        .note { font-size: 9pt; color: #64748b; font-style: italic; margin-top: 2px; margin-bottom: 10px; }
        .footer-contact { display: flex; justify-content: left; gap: 20px; width: 100%; font-size: 10pt; color: #202124; font-style: italic; }
        .footer-link { color: inherit; text-decoration: none; cursor: pointer; }
        .page-break { page-break-before: always; }
        .logo { 
            display: block; margin-left: auto; margin-right: -15mm; margin-top: -10mm; width: 200px; 
        }
        .center-photo { display: block; width: 100%; height: 550px; object-fit: cover; margin-bottom: 20px; margin-top: 20px; }
        .cover-proposal-title { text-align: left; width: calc(100% - 40mm); font-size: 24pt; font-weight: bold; margin: -5mm 20mm 30px 20mm; color: #2b333c; text-transform: uppercase; line-height: 1.2; }
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
            display: flex; flex-direction: column; height: 297mm; padding: 15mm 0 0 0; box-sizing: border-box; background-color: white; position: relative; z-index: 2;
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
            min-height: 297mm;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            box-sizing: border-box;
            page-break-after: always;
        }
        .content-logo { 
            position: absolute; top: 10mm; left: 10mm; width: 160px; z-index: 10; 
        }
        .plan-details { 
            margin: 0;
            background-color: transparent;
            position: relative;
        } 
        .layout-table { width: 100%; border: none !important; border-collapse: collapse; }
        .layout-table > thead > tr > td,
        .layout-table > tfoot > tr > td { border: none !important; padding: 0 20mm; text-align: left; vertical-align: top; position: relative; }
        .layout-table > tbody > tr > td { 
            border: none !important; padding: 0 20mm; text-align: left; vertical-align: top; position: relative; 
        }
        .spacer-top { height: 30mm; }
        .spacer-bottom { height: 40mm; }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-5deg);
            width: 100%;
            height: 100%;
            background-image: url('${logoDataUri}');
            background-repeat: repeat;
            background-size: 180px;
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
    ${
        false && logoDataUri
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

    ${page2FooterPhotoUri ? `
        <div class="page2-footer">
            <img src="${page2FooterPhotoUri}" style="width: 100%; display: block;"  />
        </div>
    ` : ""}

    <div class="subsequent-header-gradient"></div>
        <p>
            ${formatDate(proposalDate)} <br><br>
            ${application.contact_person_salutation ? application.contact_person_salutation + ' ' : ''}${application.proposal_addressee || ""} <br>
            ${application.addressee_designation || ""} <br>
            ${application.group_name || ""} <br>
            ${application.business_address || ""}
        </p>
        <p>Dear ${application.contact_person_salutation || ""} ${addresseeLastName},</p>
        <p>We are pleased to present to you our <strong>${application.basic_plan?.name || ""}</strong> for the benefit of <strong>${application.group_name || ""}</strong> - debtors.</p>
        <p>Relative premium rates as well as other pertinent benefits and provisions are stated in the attached proposal.</p>
            <p>
            We would be happy to discuss further how this solution can align with your goals. Please contact us at (02) 7798-5433, mobile ${user.phoneNumber || ""} or email us at <a href="mailto:${user.email || "helpdesk@phillife.com.ph"}" class="footer-link">${user.email || "helpdesk@phillife.com.ph"}</a> for any inquiries.
            </p>
        <p>Thank you and looking forward to have a mutually beneficial partnership with your company.</p>
        <p>
            Sincerely,<br><br>
            <strong>${cfeFullName}</strong> <br>
            ${user.departmentName || "N/A"} <br>
            <strong>${user.locationName || "N/A"}</strong>
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

    <h2>Students' Group Term Life Insurance Plan</h2>

    <h3>Benefits (Php) – 1 Unit</h3>
    <div class="h3-details">
        <table class="data-table">
            <tr><th>Classification</th><th>GTLIP</th><th>GADDR</th><th>GAMERR (Annual Limit)</th></tr>
            <tr><td>Student</td><td>5,000.00</td><td>10,000.00</td><td>7,000.00</td></tr>
        </table>
        <p class="note">*Maximum of 5 units. Uniform coverage for all students.</p>
    </div>

    <h3>Single Premium Per Head (Php) – 1 Unit</h3>
    <div class="h3-details">
        <table class="data-table">
            <tr><th>Count</th><th>GTLIP</th><th>GADDR</th><th>GAMERR</th><th>Total</th></tr>
            <tr><td>50 - 99</td><td>28.42</td><td>34.93</td><td>156.65</td><td>220.00</td></tr>
            <tr><td>100 - 199</td><td>14.21</td><td>17.46</td><td>78.33</td><td>110.00</td></tr>
            <tr><td>200 - 299</td><td>6.46</td><td>7.94</td><td>35.6</td><td>50.00</td></tr>
            <tr><td>300 - 399</td><td>5.17</td><td>6.35</td><td>28.48</td><td>40.00</td></tr>
            <tr><td>400 - 599</td><td>3.88</td><td>4.76</td><td>21.36</td><td>30.00</td></tr>
            <tr><td>600 and above</td><td>2.58</td><td>3.18</td><td>14.24</td><td>20.00</td></tr>
        </table>
        <p class="note">Rates are inclusive of government-mandated taxes.</p>
    </div>

    <h3>Eligibility</h3>
    <div class="h3-details">
        <p>Any in good health and actively-at-work bona fide enrolled student of the Policyholder who is at least five (5) years old and has not attained his 25th birth anniversary.</p>
        <p>Any regular, in good health and actively-at-work employee of the Policyholder who is at least eighteen (18) years old and has not attained his 65th birth anniversary.</p>
    </div>

    <h3>Termination Age</h3>
    <div class="h3-details">
        <ul>
            <li><strong>GADDR:</strong> Coverage terminates at age 65.</li>
            <li><strong>Other Riders:</strong> Coverage terminates at age 65.</li>
            <li><strong>Students:</strong> Coverage automatically terminates at age 25.</li>
        </ul>
    </div>

    <h3>Term of Coverage</h3>
    <div class="h3-details">
        <p>All eligible individuals will be covered for a maximum of one year.</p>
    </div>

    <h3>Participation Requirements</h3>
    <div class="h3-details">
        <p><strong>100% of all eligible individuals</strong></p>
        <p class="note">
            <strong>Annual Premium During Policy Inception (Net of Collection Fee):</strong><br>
            N/A – Since our objective is to offer a competitive plan for this type of group.
        </p>
    </div>

    <h3>Minimum Number Requirements</h3>
    <div class="h3-details">
        <table class="data-table">
            <tr><th>Count</th><th>Annual Premium During Policy Inception<br>(Net of Collection Fee)</th><th>Minimum During Inception</th><th>Minimum Within Policy Period</th></tr>
            <tr><td>50 - 99</td><td rowspan="6">N/A – Since our objective is to offer a competitive plan for this type of group.</td><td>50</td><td>50</td></tr>
            <tr><td>100 - 199</td><td>100</td><td>100</td></tr>
            <tr><td>200 - 299</td><td>200</td><td>210</td></tr>
            <tr><td>300 - 399</td><td>300</td><td>300</td></tr>
            <tr><td>400 - 599</td><td>400</td><td>400</td></tr>
            <tr><td>600 and above</td><td>600</td><td>600</td></tr>
        </table>
    </div>

    <h3>NEL (1 Unit)</h3>
    <div class="h3-details">
        <p>No-evidence limit is Php 5,000.00 provided eligible individual has not attained his 25th birth anniversary.</p>
    </div>

    <h3>Other Terms</h3>
    <div class="h3-details">
        <ul>
            <li>Free GADDR coverage of Php 10,000 for employees (Teaching and Non-Teaching), regardless of the unit/s purchased, provided their number does not exceed 10% of the total participating students.</li>
            <li>Unprovoked Murder and Assault (UMA) is not covered.</li>
            <li>Participation requirements remain the same, regardless of the number of units purchased.</li>
            <li>Benefits, Rates, and NEL will be adjusted accordingly based on the number of units purchased.</li>
        </ul>
    </div>

<div class="page-break"></div>
<div class="installation-requirements" style="margin-top: 20px; break-inside: avoid;">
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

<div class="signature-section" style="margin-top: 20px; break-inside: avoid;">
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

<div class="signature-section" style="margin-top: 20px; break-inside: avoid;">
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

    </td></tr></tbody>
    <tfoot><tr><td><div class="spacer-bottom"></div></td></tr></tfoot>
    </table>
    </div>
</body>
</html>
  `;
};
