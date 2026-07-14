/**
 * Confirmation of Coverage (COC) Letter Template
 * Generates HTML string formatted as a professional letter with logo.
 * 
 * @param {Object} application - The application/proposal data.
 * @param {Object} user - The user who created/approved the proposal.
 * @param {Object} details - Contains pre-processed helper values (like logoDataUri).
 */
export const generateCOCTemplate = (application, user, details) => {
    const logoDataUri = details?.logoDataUri || '';
    
    // Formatting helpers
    const formatDate = (dateVal) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const todayStr = formatDate(new Date());
    
    // Dynamic Recipient Fields
    const contactSalutation = application.contact_person_salutation || 'Mr.';
    const contactFirstname = application.contact_person_firstname || 'JOHN';
    const contactLastname = application.contact_person_lastname || 'DOE';
    const contactFullname = `${contactSalutation} ${contactFirstname} ${contactLastname}`.trim().toUpperCase();
    const contactDesignation = application.designation || 'Manager';
    const groupName = application.group_name || 'Philfe Corp';
    const businessAddress = application.business_address || '123 Main Street, Cityville, Country';
    
    // Dynamic Plan Details
    const planName = application.plan?.name || 'Group Term Life Insurance Plan (GTLIP)';
    const basicPlanName = application.basic_plan?.name || planName;
    
    // Dynamic Policy Number Generation: G-[ACRONYM]-[2-DIGIT-YEAR]-[APPLICATION-ID]
    let planPrefix = 'TLI';
    const planAcronym = (application.plan?.acronym || '').toUpperCase();
    const basicPlanId = application.basic_plan_id || application.basic_plan?.id ? Number(application.basic_plan_id || application.basic_plan?.id) : null;
    
    if (basicPlanId) {
        if (basicPlanId === 1) {
            planPrefix = 'CLI';
        } else if (basicPlanId === 2) {
            planPrefix = 'TLI';
        } else if (basicPlanId === 3) {
            planPrefix = 'CBP';
        } else if (basicPlanId === 4) {
            planPrefix = 'ADD';
        } else if (basicPlanId === 5) {
            planPrefix = 'ADD-DRX';
        } else {
            planPrefix = application.basic_plan?.acronym || 'TLI';
        }
    } else {
        if (planAcronym === 'GCLI') {
            planPrefix = 'CLI';
        } else if (planAcronym === 'GYRT') {
            planPrefix = 'TLI';
        } else if (planAcronym === 'GPA') {
            planPrefix = 'ADD';
        } else {
            planPrefix = planAcronym || 'TLI';
        }
    }

    const shortYear = new Date().getFullYear().toString().slice(-2);
    const appId = application.application_id || '380';
    const policyNo = `G-${planPrefix.toUpperCase()}-${shortYear}-${appId}`;
    
    const groupTypeName = application.group_type?.name?.toLowerCase() || 'employer-employees';
    
    const appCreatedDate = application.created_at ? new Date(application.created_at) : new Date();
    const validCreatedDate = isNaN(appCreatedDate.getTime()) ? new Date() : appCreatedDate;
    
    const startDate = formatDate(validCreatedDate);
    
    const endDateVal = new Date(validCreatedDate);
    endDateVal.setFullYear(endDateVal.getFullYear() + 1);
    const endDate = formatDate(endDateVal);

    // Generate riders list html
    let ridersHtml = '';
    if (application.riders && Array.isArray(application.riders) && application.riders.length > 0) {
        ridersHtml = application.riders.map(rider => {
            const name = rider.rider_name || rider.name;
            const acr = rider.acronym;
            return `<li>${name} ${acr ? `(${acr})` : ''}</li>`;
        }).join('\n');
    } else {
        ridersHtml = '<li>No Selected Riders</li>';
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation of Coverage</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4;
            margin: 0;
        }
        body {
            font-family: 'Inter', -apple-system, sans-serif;
            color: #2D3748;
            line-height: 1.45;
            background-color: #ffffff;
            font-size: 9pt;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 45px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            min-height: 290mm;
        }
        .main-content {
            flex: 1;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #C53030;
            padding-bottom: 6px;
            margin-bottom: 15px;
            margin-top: 5px;
        }
        .logo-container img {
            max-height: 75px;
            display: block;
        }
        .company-info {
            text-align: right;
            font-size: 7.5pt;
            color: #718096;
            line-height: 1.2;
        }
        .company-info strong {
            color: #1A202C;
        }
        .date {
            margin-bottom: 25px;
            font-size: 9pt;
            color: #4A5568;
            font-weight: 500;
        }
        .recipient {
            margin-bottom: 25px;
            font-size: 9pt;
            line-height: 1.3;
            color: #2D3748;
        }
        .recipient-name {
            font-weight: 700;
            color: #1A202C;
            font-size: 9.5pt;
        }
        .subject-box {
            background-color: #F7FAFC;
            border-left: 3px solid #C53030;
            padding: 6px 12px;
            margin-bottom: 22px;
            border-radius: 0 4px 4px 0;
        }
        .subject-table {
            width: 100%;
            border-collapse: collapse;
        }
        .subject-table td {
            vertical-align: top;
            padding: 1px 0;
            font-size: 9pt;
        }
        .subject-label {
            font-weight: 700;
            width: 100px;
            color: #4A5568;
        }
        .subject-value {
            font-weight: 700;
            color: #1A202C;
        }
        .salutation {
            margin-bottom: 16px;
            font-size: 9pt;
            font-weight: 600;
            color: #2D3748;
        }
        .body-text {
            font-size: 9pt;
            text-align: justify;
            margin-bottom: 16px;
            color: #2D3748;
        }
        .details-card {
            border: 1px solid #E2E8F0;
            border-radius: 5px;
            padding: 8px 14px;
            margin-bottom: 22px;
            background-color: #FFFFFF;
        }
        .plan-row {
            font-size: 9pt;
            margin-bottom: 6px;
            color: #2D3748;
            display: flex;
        }
        .plan-label {
            font-weight: 700;
            width: 80px;
            color: #4A5568;
        }
        .plan-value {
            font-weight: 600;
            color: #1A202C;
        }
        .riders-row {
            display: flex;
            align-items: flex-start;
        }
        .riders-label {
            font-weight: 700;
            width: 80px;
            color: #4A5568;
            flex-shrink: 0;
        }
        .riders-list {
            margin: 0;
            padding-left: 15px;
            list-style-type: square;
            font-size: 8.5pt;
            color: #2D3748;
        }
        .riders-list li {
            line-height: 1.25;
            margin-bottom: 2px;
        }
        .closing {
            margin-top: 22px;
            font-size: 9pt;
            color: #2D3748;
        }
        .signature-block {
            margin-top: 25px;
        }
        .signature-col {
            width: 220px;
        }
        .signature-line {
            border-top: 1px solid #CBD5E0;
            margin-top: 25px;
            padding-top: 4px;
        }
        .signer-name {
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9pt;
            color: #1A202C;
            margin-bottom: 2px;
        }
        .signer-title {
            color: #718096;
            font-size: 8.5pt;
            font-weight: 500;
        }
        .footer {
            border-top: 1px solid #E2E8F0;
            padding-top: 8px;
            text-align: center;
            font-size: 7.5pt;
            color: #718096;
            line-height: 1.3;
            margin-bottom: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="main-content">
        <!-- Logo and Header -->
        <div class="header">
            <div class="logo-container">
                ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" />` : `<strong>PHILIPPINE LIFE FINANCIAL ASSURANCE CORP.</strong>`}
            </div>
            <div class="company-info">
                <strong>Philippine Life Financial Assurance Corporation</strong><br>
                11/F STI Holdings Center, 6764 Ayala Avenue<br>
                1226 Makati City, Philippines<br>
                Tel. No: (632) 7798-5433 | www.phillife.com.ph
            </div>
        </div>

        <!-- Date -->
        <div class="date">
            ${todayStr}
        </div>

        <!-- Recipient -->
        <div class="recipient">
            <span class="recipient-name">${contactFullname}</span><br>
            ${contactDesignation}<br>
            <strong>${groupName}</strong><br>
            ${businessAddress.replace(/\n/g, '<br>')}
        </div>        <!-- Subject Highlights Box -->
        <div class="subject-box">
            <table class="subject-table">
                <tr>
                    <td class="subject-label">SUBJECT</td>
                    <td class="subject-value">: ${basicPlanName.toUpperCase()} </td>
                </tr>
                <tr>
                    <td class="subject-label"></td>
                    <td class="subject-value">: POLICY NO. ${policyNo}</td>
                </tr>
            </table>
        </div>

        <!-- Salutation -->
        <div class="salutation">
            Dear ${contactSalutation} ${contactLastname}:
        </div>

        <!-- Body Text -->
        <div class="body-text">
            This is to confirm that the ${groupTypeName} of <strong>${groupName}</strong> are covered under Group Policy No. <strong>${policyNo}</strong> with the following insurance benefits from <strong>${startDate}</strong> to <strong>${endDate}</strong>.
        </div>

        <!-- Plan details and Riders Card -->
        <div class="details-card">
            <div class="plan-row">
                <span class="plan-label">PLAN</span>
                <span class="plan-value">: ${basicPlanName}</span>
            </div>
            <div class="riders-row">
                <span class="riders-label">RIDERS</span>
                <div style="flex-grow: 1;">
                    <ul class="riders-list" style="margin-top: -2px;">
                        ${ridersHtml}
                    </ul>
                </div>
            </div>
        </div>

        <div class="body-text">
            Should you have further clarification or queries, feel free to call us.
        </div>
        
        <div class="body-text">
            Thank you for insuring the lives of your employees with PhilLife.
        </div>

        <div class="closing">
            Sincerely,
        </div>

        <!-- Signature Block -->
        <div class="signature-block">
            <div class="signature-col">
                <div class="signature-line"></div>
                <div class="signer-name">Maria Fe Salnio</div>
                <div class="signer-title">EBAM Manager</div>
            </div>
            
            <div class="signature-col" style="margin-top: 20px;">
                <div class="signer-title" style="margin-bottom: 25px; font-weight: bold; color: #4A5568;">Approved by:</div>
                <div class="signature-line" style="margin-top: 0;"></div>
                <div class="signer-name">Atty. Ferdinand A. Recio</div>
                <div class="signer-title">FVP – Operations</div>
            </div>
        </div>
        </div> <!-- end main-content -->
        
        <!-- Footer Contact Details -->
        <div class="footer">
            Philippine Life Financial Assurance Corporation<br>
            11/F STI Holdings Center, 6764 Ayala Avenue, 1226 Makati City, Philippines<br>
            Tel. No: (632) 7798-5433 (Trunkline) | www.phillife.com.ph
        </div>
    </div>
</body>
</html>
    `;
};
