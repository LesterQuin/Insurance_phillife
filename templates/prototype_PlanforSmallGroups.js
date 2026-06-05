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
    const {
        logoDataUri = null,
        centerPhotoUri = null,
        footerPhotoUri = null,
        page2FooterPhotoUri = null,
    } = details || {};

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
    <title>Prototype Plan for Small Groups</title>
    <style>
        @page {
            size: A4;
            margin: 0;
        }

        html, body {
            margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; 
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
        h2, h3 { margin-top: 30px; break-after: avoid; page-break-after: avoid; }
        .plan-details table:not(.layout-table), .plan-details ul, .plan-details .note, .plan-details p { break-inside: avoid; page-break-inside: avoid; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        table, th, td { border: 1px solid #000; }
        th, td { padding: 8px; text-align: center; }
        .note { font-size: 14px; margin-top: 10px; }
        .footer-contact { display: flex; justify-content: left; gap: 20px; width: 100%; font-size: 10pt; color: #020202; font-style: italic; }
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
            color: #000;
            font-size: 10pt;
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
        Number(application.status?.id || application.status_id) !== 7 && logoDataUri
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
                <tr>
                    <td><strong>Base Plan:</strong><br>${capitalize(application.basic_plan?.name || "")}</td>
                    <td><strong>Total Annual Premium:</strong><br>Php ${formatNumber(totalAnnualPremium)}</td>
                    <td><strong>Payment Terms:</strong><br>${capitalize(application.payment_mode?.name || "")}</td>
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
            ${application.addressee_designation || ""} <br>
            ${application.group_name || ""} <br>
            ${application.business_address || ""}
        </p>
        <p>Dear ${application.addressee_designation || ""} ${addresseeLastName},</p>
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

    <div class="plan-details">
    <table class="layout-table">
        <thead><tr><td>
            ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="content-logo" />` : ""}
            <div class="subsequent-header-gradient"></div>
            <div class="spacer-top"></div>
        </td></tr></thead>
        <tbody><tr><td>

    <h2>Prototype Plan for Small Groups</h2>
    <p>Group Size: 10 to 50 lives per group</p>
    <h3>Class I</h3>
    <p>Coverage per Head for GTLIP/GADDR/GTPDR</p>
    <table>
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

    <h3>Class II</h3>
    <p>Coverage per Head for GTLIP/GADDR/GTPDR</p>

    <table>
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

    <h3>Class III</h3>
    <p>Coverage per Head for GTLIP/GADDR/GTPDR</p>

    <table>
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
    
    <h3>Eligibility</h3>
    <p>Any regular, in good health and actively-at-work employee of the Policyholder who is at least eighteen (18) years
        old and has not attained his 65th birth anniversary.</p>

    <h3>Termination Age</h3>
    <ul>
        <li>GTLIP: Coverage terminates at age 65.</li>
        <li>GTPDR: Coverage terminates at age 65.</li>
        <li>GADDR: Coverage terminates at age 65.</li>
        <li>Other Riders: Coverage terminates at age 65.</li>
    </ul>

    <h3>Participation Requirements</h3>
    <ul>
        <li>100% of all eligible individuals</li>
        <li>At least 10 individuals at policy inception</li>
    </ul>

    <h3>Underwriting</h3>
    <p>Each eligible individual must submit an accomplished health questionnaire and application form.</p>
    <p>Non-medical limit is Php 500,000.00 provided eligible individual has not attained his 55th birth anniversary.</p>

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
    </td></tr></tbody>
    <tfoot><tr><td><div class="spacer-bottom"></div></td></tr></tfoot>
    </table>
    </div>

</body>
</html>
    `;
};
