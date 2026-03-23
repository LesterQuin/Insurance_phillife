const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

export const generateSecurityGuardsPDFContent = (application, user, details) => {
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
    <title>Security Guards Protection Plan</title>
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
    
    <p>We are pleased to present to you our <strong>${application.basic_plan?.name || ''}</strong> for the benefit of <strong>${application.group_name || ''} - Security Guards</strong>.</p>
    
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

    <h2>Security Guards Protection Plan</h2>
    <h3>Packaged Prototype Plan</h3>

    <h3>Prospects</h3>
    <p>Security Guards</p>

    <h3>Benefits (Php)</h3>
    <table>
        <tr>
            <th>Classification</th>
            <th>GTLIP</th>
            <th>GADDR</th>
            <th>GAMERR (Annual Limit)</th>
        </tr>
        <tr>
            <td>All Eligible Individuals</td>
            <td>40,000.00</td>
            <td>40,000.00</td>
            <td>15,000.00</td>
        </tr>
    </table>

    <h3>Single Premium Per Head (Php)</h3>
    <table>
        <tr>
            <th>Classification</th>
            <th>GTLIP</th>
            <th>GADDR</th>
            <th>GAMERR</th>
            <th>Total</th>
        </tr>
        <tr>
            <td>All Eligible Individuals</td>
            <td>219.00</td>
            <td>168.00</td>
            <td>163.00</td>
            <td>550.00</td>
        </tr>
    </table>

    <p class="note">Rates are inclusive of government-mandated taxes and 15.00% commission.</p>

    <h3>Eligibility</h3>
    <p>Any in good health and actively-at-work Security Guard of the Policyholder who is at least eighteen (18) years old and has not attained his 65th birth anniversary.</p>

    <h3>Termination Age</h3>
    <ul>
        <li><strong>GTLIP:</strong> Coverage terminates at age 65.</li>
        <li><strong>GADDR:</strong> Coverage terminates at age 65.</li>
        <li><strong>GAMERR:</strong> Coverage terminates at age 65.</li>
    </ul>

    <h3>Participation Requirements</h3>
    <ul>
        <li>100% of all eligible individuals.</li>
        <li>At least 17 individuals at policy inception.</li>
        <li>At least 100 individuals before policy renewal.</li>
    </ul>

    <h3>NEL</h3>
    <p>
        No evidence limit is Php 40,000.00 provided eligible individual has not attained his 55th birth anniversary.
    </p>

    <h3>Term of Coverage</h3>
    <p>
        Each eligible individual will be covered for a maximum of one year.
    </p>

    <h3>Other Terms</h3>
    <ul>
        <li>Other Units: not applicable.</li>
        <li>Unprovoked Murder and Assault (UMA) is not covered.</li>
        <li>Can be offered as GTLIP with ADD only, subject to the same terms and conditions.</li>
        <li>Area of the insured will be reviewed before proposal is released.</li>
    </ul>

</body>
</html>
    `;
};