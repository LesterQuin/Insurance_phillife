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

export const generateSmallGroupsPDFContent = (application, user, details) => {
    const proposalDate = new Date(application.updated_at);
    const expiryDate = new Date(proposalDate);
    expiryDate.setDate(expiryDate.getDate() + 30);
    const addresseeLastName =
        application.proposal_addressee?.split(" ").pop() || "";
    const totalAnnualPremium = details?.totalAnnualPremium || 0;
    const cfeFullName = `${user.firstname} ${user.lastname}`;

    const isDirect = Number(application.channel_type_id) === 55;
    const salesRepName = isDirect ? cfeFullName : (application.channel_name || "");
    const salesRepNumber = isDirect ? (user.phoneNumber || application.channel_number || "") : (application.channel_number || "");
    const salesRepEmail = isDirect ? (user.email || application.channel_email || "helpdesk@phillife.com.ph") : (application.channel_email || "helpdesk@phillife.com.ph");
    
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
    <title>Prototype Plan for Small Groups</title>
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
            margin-bottom: 5px;
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

    ${page2FooterPhotoUri ? `
        <div class="page2-footer">
            <img src="${page2FooterPhotoUri}" style="width: 100%; display: block;"  />
        </div>
    ` : ""}

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
            We are pleased to submit our ${application.basic_plan?.name || "Group Personal Accident Insurance Proposal"} for the benefit of  
            ${application.group_name || ""}.This proposal is designed to provide valuable financial protection for your employees/members while reinforcing your organization's commitment to their well-being and security.
            </p>

            <p>
            The proposed insurance package includes the following:
            </p><br>
            <ul style="margin-top: -10px; margin-bottom: 15px; padding-left: 20px;">
                <li style="text-align: justify; font-size: 11pt; line-height: 1.6;">Group Term Life Insurance Plan (GTLIP)</li>
                <li style="text-align: justify; font-size: 11pt; line-height: 1.6;">Group Accidental Death, Dismemberment and Disability Rider (GADDR)</li>
                <li style="text-align: justify; font-size: 11pt; line-height: 1.6;">Group Total and Permanent Disability Rider (GTPDR)</li>
            </ul>

            <p style="text-align: justify; text-indent: 30px;">Enclosed are the proposed premium rates, coverage details, benefits, terms and conditions, and other pertinent provisions for your review and evaluation. 
            We have carefully developed this proposal to offer comprehensive life insurance protection that aligns with your organization's needs and objectives.</p>

            <p style="text-align: justify; text-indent: 30px;">We appreciate the opportunity to present this proposal and trust that it will meet your organization's life insurance requirements. 
            We look forward to building a long-term, mutually beneficial partnership founded on trust, reliability, and excellent service.</p>

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

    <div class="subsequent-header-gradient"></div> <br>
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

    <div class="plan-details">
    <table class="layout-table">
        <thead><tr><td>
            ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="content-logo" />` : ""}
            <div class="subsequent-header-gradient"></div>
            <div class="spacer-top"></div>
        </td></tr></thead>
        <tbody><tr><td>

    <h2>Prototype Plan for Small Groups</h2>

    <h3>Class I</h3>
    <div class="h3-details">
        <p>Coverage per Head for GTLIP/GADDR/GTPDR</p>
        <table class="data-table">
            <tr>
                <th>Group Size</th>
                <th>10,000.00</th>
                <th>15,000.00</th>
                <th>20,000.00</th>
                <th>25,000.00</th>
                <th>30,000.00</th>
            </tr>
            <tr><td>10-15</td><td>266,000.00</td><td>399,000.00</td><td>532,000.00</td><td>665,000.00</td><td>798,000.00</td></tr>
            <tr><td>16-20</td><td>192,000.00</td><td>288,000.00</td><td>384,000.00</td><td>480,000.00</td><td>576,000.00</td></tr>
            <tr><td>21-25</td><td>150,000.00</td><td>225,000.00</td><td>301,000.00</td><td>376,000.00</td><td>451,000.00</td></tr>
            <tr><td>26-30</td><td>123,000.00</td><td>185,000.00</td><td>247,000.00</td><td>308,000.00</td><td>370,000.00</td></tr>
            <tr><td>31-35</td><td>105,000.00</td><td>157,000.00</td><td>210,000.00</td><td>262,000.00</td><td>314,000.00</td></tr>
            <tr><td>35-40</td><td>91,000.00</td><td>136,000.00</td><td>182,000.00</td><td>227,000.00</td><td>273,000.00</td></tr>
            <tr><td>41-50</td><td>80,000.00</td><td>120,000.00</td><td>161,000.00</td><td>201,000.00</td><td>241,000.00</td></tr>
        </table>

        <ul>
            <li>Office/Clerical Jobs/Professional</li>
            <li>Finance/Investment/Insurance/Banking/Holding Company/Real Estate</li>
            <li>Developer Semi-Conductor/Call Center</li>
            <li>Retail Trading/Distributors/Dealers (not including Drivers)</li>
            <li>Manufacturing Food, Textile Mill Products, Apparels</li>
            <li>Manufacturing Electrical Products, Electric Equipment, Instruments</li>
        </ul>
    </div>

    <h3>Class II</h3>
    <div class="h3-details">
        <p>Coverage per Head for GTLIP/GADDR/GTPDR</p>
        <table class="data-table">
            <tr>
                <th>Group Size</th>
                <th>10,000.00</th>
                <th>15,000.00</th>
                <th>20,000.00</th>
                <th>25,000.00</th>
                <th>30,000.00</th>
            </tr>
            <tr>
                <td>10-15</td>
                <td>222,000.00</td>
                <td>332,000.00</td>
                <td>443,000.00</td>
                <td>554,000.00</td>
                <td>665,000.00</td>
            </tr>
            <tr>
                <td>16-20</td>
                <td>160,000.00</td>
                <td>240,000.00</td>
                <td>320,000.00</td>
                <td>400,000.00</td>
                <td>480,000.00</td>
            </tr>
            <tr>
                <td>21-25</td>
                <td>125,000.00</td>
                <td>188,000.00</td>
                <td>250,000.00</td>
                <td>313,000.00</td>
                <td>376,000.00</td>
            </tr>
            <tr>
                <td>26-30</td>
                <td>103,000.00</td>
                <td>154,000.00</td>
                <td>206,000.00</td>
                <td>257,000.00</td>
                <td>309,000.00</td>
            </tr>
            <tr>
                <td>31-35</td>
                <td>87,000.00</td>
                <td>131,000.00</td>
                <td>175,000.00</td>
                <td>218,000.00</td>
                <td>262,000.00</td>
            </tr>
            <tr>
                <td>35-40</td>
                <td>76,000.00</td>
                <td>113,000.00</td>
                <td>151,000.00</td>
                <td>189,000.00</td>
                <td>227,000.00</td>
            </tr>
            <tr>
                <td>41-50</td>
                <td>67,000.00</td>
                <td>100,000.00</td>
                <td>134,000.00</td>
                <td>167,000.00</td>
                <td>201,000.00</td>
            </tr>
        </table>

        <ul>
            <li>Manufacturing Glass, Cement, & Plaster Products</li>
            <li>Manufacturing Miscellaneous Wood Products (Furniture & Fixtures)</li>
            <li>Manufacturing Fabricated Metal Products (Cutlery / Hand Tools / Metal Cans / Bolts)</li>
            <li>Manufacturing Machineries (Office & Computing Machines / Farm & Garden Machineries)</li>
            <li>Manufacturing Transportation Equipment & Parts (Motor Vehicles / Aircraft / Ship & Boat)</li>
            <li>Manufacturing Paper & Allied Products (Paper Mills / Pulp Mills / Building Paper)</li>
            <li>Manufacturing Rubber & Miscellaneous Products (Tires / Rubbers / Plastic Products)</li>
            <li>Manufacturing Leather & Leather Products (Luggage / Footwear / Handbags)</li>
            <li>Hotel & Resort Management</li>
            <li>Business Services (Service to Building / Advertising / Personnel Supply Services; Auto Repair, Services and Garages)</li>
        </ul>
    </div>

    <h3>Class III</h3>
    <div class="h3-details">
        <p>Coverage per Head for GTLIP/GADDR/GTPDR</p>
        <table class="data-table">
            <tr>
                <th>Group Size</th>
                <th>10,000.00</th>
                <th>15,000.00</th>
                <th>20,000.00</th>
                <th>25,000.00</th>
                <th>30,000.00</th>
            </tr>
            <tr>
                <td>10-15</td>
                <td>190,000.00</td>
                <td>285,000.00</td>
                <td>380,000.00</td>
                <td>475,000.00</td>
                <td>570,000.00</td>
            </tr>
            <tr>
                <td>16-20</td>
                <td>137,000.00</td>
                <td>206,000.00</td>
                <td>274,000.00</td>
                <td>343,000.00</td>
                <td>412,000.00</td>
            </tr>
            <tr>
                <td>21-25</td>
                <td>107,000.00</td>
                <td>161,000.00</td>
                <td>215,000.00</td>
                <td>268,000.00</td>
                <td>322,000.00</td>
            </tr>
            <tr>
                <td>26-30</td>
                <td>88,000.00</td>
                <td>132,000.00</td>
                <td>176,000.00</td>
                <td>220,000.00</td>
                <td>264,000.00</td>
            </tr>
            <tr>
                <td>31-35</td>
                <td>75,000.00</td>
                <td>112,000.00</td>
                <td>150,000.00</td>
                <td>187,000.00</td>
                <td>224,000.00</td>
            </tr>
            <tr>
                <td>35-40</td>
                <td>65,000.00</td>
                <td>97,000.00</td>
                <td>130,000.00</td>
                <td>162,000.00</td>
                <td>195,000.00</td>
            </tr>
            <tr>
                <td>41-50</td>
                <td>57,000.00</td>
                <td>86,000.00</td>
                <td>115,000.00</td>
                <td>143,000.00</td>
                <td>172,000.00</td>
            </tr>
        </table>

        <ul>
            <li>Construction (General Building Contractors / Special Trade Contractors)</li>
            <li>Manufacturing Primary Metal Industries (Iron & Steel)</li>
            <li>Manufacturing Lumber</li>
        </ul>
    </div>
    
    <h3>Eligibility</h3>
    <div class="h3-details">
        <p>Any regular, in good health and actively-at-work employee of the Policyholder who is at least eighteen (18) years old and has not attained his 65th birth anniversary.</p>
    </div>

    <h3>Termination Age</h3>
    <div class="h3-details">
        <ul>
            <li>GTLIP: Coverage terminates at age 65.</li>
            <li>GTPDR: Coverage terminates at age 65.</li>
            <li>GADDR: Coverage terminates at age 65.</li>
            <li>Other Riders: Coverage terminates at age 65.</li>
        </ul>
    </div>

    <h3>Participation Requirements</h3>
    <div class="h3-details">
        <ul>
            <li>100% of all eligible individuals</li>
            <li>At least 10 individuals at policy inception</li>
        </ul>
    </div>

    <h3>Underwriting</h3>
    <div class="h3-details">
        <p>Each eligible individual must submit an accomplished health questionnaire and application form.</p>
        <p>Non-medical limit is Php 500,000.00 provided eligible individual has not attained his 55th birth anniversary.</p>
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
