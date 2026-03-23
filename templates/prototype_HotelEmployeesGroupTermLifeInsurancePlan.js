const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

export const generateHotelEmployeesPDFContent = (application, user, details) => {
    const proposalDate = new Date(application.updated_at);
    const addresseeLastName = application.proposal_addressee?.split(' ').pop() || '';
    const totalAnnualPremium = details?.totalAnnualPremium || 0;
    const contactLocal = details?.contactLocal || 'N/A';
    const cfeFullName = `${user.firstname} ${user.lastname}`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Hotel Employees' Group Term Life Insurance Plan</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        h2, h3 { margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        table, th, td { border: 1px solid #000; }
        th, td { padding: 8px; text-align: center; }
        .note { font-size: 14px; margin-top: 10px; }
        .footer-contact { text-align: left; font-size: 9pt; color: #555; margin-top: 8px; font-style: italic; }
        .footer-link { color: #555; text-decoration: none; }
        .page-break { page-break-before: always; }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td><strong>Presented To:</strong> ${application.group_name}</td>
            <td><strong>Proposal Status:</strong> ${application.status?.name || ''}</td>
            <td><strong>Date of Proposal:</strong> ${formatDate(proposalDate)}</td>
        </tr>
        <tr>
            <td><strong>Base Plan:</strong> ${application.basic_plan?.name || ''}</td>
            <td><strong>Total Annual Premium:</strong> Php ${formatNumber(totalAnnualPremium)}</td>
            <td><strong>Payment Terms:</strong> ${application.payment_mode?.name || ''}</td>
        </tr>
    </table>
    <br>
    <div class="footer-contact">
        <a href="https://www.phillife.com.ph" class="footer-link" target="_blank">www.phillife.com.ph</a><br>
        <a href="tel:+63277985433" class="footer-link">(02) 7798 5433</a><br>
        <a href="mailto:helpdesk@phillife.com.ph" class="footer-link">helpdesk@phillife.com.ph</a>
    </div>
    <br>
    <p>
        ${formatDate(proposalDate)} <br>
        ${application.contact_person_salutation || ''} ${application.proposal_addressee || ''} <br>
        ${application.addressee_designation || ''} <br>
        ${application.group_name || ''} <br>
        ${application.business_address || ''}
    </p>
    <p>Dear ${application.addressee_designation || ''} ${addresseeLastName},</p>
    <p>We are pleased to present to you our <strong>${application.basic_plan?.name || ''}</strong> for the benefit of <strong>${application.group_name || ''} - employees</strong>.</p>
    <p>Relative premium rates as well as other pertinent benefits and provisions are stated in the attached proposal.</p>
    <p>Should you have concerns with our program, please feel free to contact us at Tel. Nos. (02) 7798 – 5433 loc. ${contactLocal} or email us at <a href="mailto:helpdesk@phillife.com.ph">helpdesk@phillife.com.ph</a>.</p>
    <p>Thank you and looking forward to have a mutually beneficial partnership with your company.</p>
    <p>
        Sincerely,<br><br>
        <strong>${cfeFullName}</strong> <br>
        ${user.departmentName || 'N/A'} <br>
        <strong>${user.locationName || 'N/A'}</strong>
    </p>
    <div class="page-break"></div>
    <h2>Hotel Employees' Group Term Life Insurance Plan</h2>
    <h3>Packaged Prototype Plan</h3>
    <h3>Benefits (Php)</h3>
    <table>
        <tr><th>Classification</th><th>GTLIP</th><th>GADDR</th><th>GADBR</th><th>GHIR</th><th>GTIR</th></tr>
        <tr><td>Level 1</td><td>50,000.00</td><td>50,000.00</td><td>50,000.00</td><td>300.00</td><td>50% OF GTLIP</td></tr>
        <tr><td>Level 2</td><td>100,000.00</td><td>100,000.00</td><td>100,000.00</td><td>500.00</td><td>50% OF GTLIP</td></tr>
    </table>
    <h3>Annual Premium per Head (Php)</h3>
    <table>
        <tr><th>Classification</th><th>Annual Premium per Head</th></tr>
        <tr><td>Level 1</td><td>934.62</td></tr>
        <tr><td>Level 2</td><td>1,694.01</td></tr>
    </table>
    <p class="note">Rates are inclusive of government-mandated taxes and 20.00% commission.</p>

    <h3>Eligibility</h3>
    <p>Any in good health and actively-at-work bona fide member of the Policyholder who is at least eighteen (18) years
        old and has not attained his 65th birth anniversary.</p>

    <h3>Termination Age</h3>
    <ul>
        <li>GTLIP: Coverage terminates at age 65.</li>
        <li>GADDR: Coverage terminates at age 65.</li>
        <li>Other Riders: Coverage terminates at age 65.</li>
    </ul>

    <h3>Participation Requirements</h3>
    <ul>
        <li>100% of all eligible individuals</li>
        <li>At least 12 individuals at policy inception and throughout the policy period</li>
    </ul>

    <h3>Premium Requirement</h3>
    <p>Minimum of Php 10,000.00 annual premium shall be required to install the plan.</p>

    <h3>Underwriting</h3>
    <p>All employees must submit accomplished health statement form.</p>

    <h3>Other Terms</h3>
    <ul>
        <li>GADBR: Pays out the amount of insurance in case of death due to accident during official working shift and
            during official business of the employee.</li>
        <li>GHIR: 0 days waiting period for death due to accident.</li>
        <li>GHIR: 1 day waiting period for death due to illness.</li>
    </ul>

</body>
</html>
    `;
};
