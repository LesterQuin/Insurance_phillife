const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

export const generateStudentsGTLIPPDFContent = (application, user, details) => {
    const proposalDate = new Date(application.updated_at);
    const addresseeLastName = application.proposal_addressee?.split(' ').pop() || '';
    const totalAnnualPremium = details?.totalAnnualPremium || 0;
    const cfeFullName = `${user.firstname} ${user.lastname}`;
    const logoDataUri = details?.logoDataUri || null;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Students' Group Term Life Insurance Plan</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
        h2, h3 { margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        table, th, td { border: 1px solid #000; }
        th, td { padding: 8px; text-align: center; }
        .note { font-size: 14px; margin-top: 10px; }
        .footer-contact { text-align: center; font-size: 9pt; color: #555; font-style: italic; }
        .footer-link { color: inherit; text-decoration: none; cursor: pointer; }
        .page-break { page-break-before: always; }
        .logo { display: block; margin: 0 auto; width: 250px; }
        .header-table td { text-align: left; }
        .cover-page { display: flex; flex-direction: column; justify-content: space-between; height: 230mm; box-sizing: border-box; padding: 20px 0; }
        .cover-middle { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    </style>
</head>
<body>
    <div class="cover-page">
        <div class="cover-top">
            ${logoDataUri ? `<img src="${logoDataUri}" alt="PhilLife Logo" class="logo" />` : ''}
        </div>
        <div class="cover-middle">
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
        </div>
        <div class="cover-bottom">
            <div class="footer-contact">
                <a href="https://www.phillife.com.ph" class="footer-link" target="_blank">www.phillife.com.ph</a><br>
                <a href="tel:+63277985433" class="footer-link">(02) 7798 5433</a><br>
                <a href="mailto:helpdesk@phillife.com.ph" class="footer-link">helpdesk@phillife.com.ph</a>
            </div>
        </div>
    </div>
    <div class="page-break"></div>
    <p>
        ${formatDate(proposalDate)} <br>
        ${application.contact_person_salutation || ''} ${application.proposal_addressee || ''} <br>
        ${application.addressee_designation || ''} <br>
        ${application.group_name || ''} <br>
        ${application.business_address || ''}
    </p>
    <p>Dear ${application.addressee_designation || ''} ${addresseeLastName},</p>
    <p>We are pleased to present to you our <strong>${application.basic_plan?.name || ''}</strong> for the benefit of <strong>${application.group_name || ''} - students</strong>.</p>
    <p>Relative premium rates as well as other pertinent benefits and provisions are stated in the attached proposal.</p>
    <p>Should you have concerns with our program, please feel free to contact us at telephone number (02) 7798 – 5433, local number +63 917 123 4567 or email us at <a href="mailto:helpdesk@phillife.com.ph" class="footer-link">helpdesk@phillife.com.ph</a>.</p>
    <p>Thank you and looking forward to have a mutually beneficial partnership with your company.</p>
    <p>
        Sincerely,<br><br>
        <strong>${cfeFullName}</strong> <br>
        ${user.departmentName || 'N/A'} <br>
        <strong>${user.locationName || 'N/A'}</strong>
    </p>
    <div class="page-break"></div>
    <h2>Students' Group Term Life Insurance Plan</h2>
    <h3>Packaged Prototype Plan</h3>
    <p><strong>Prospects:</strong><br>Elementary, Secondary Schools, Universities & Colleges,<br>Vocational Schools & Special Training Schools</p>
    <h3>Benefits (Php) – 1 Unit</h3>
    <table>
        <tr><th>Classification</th><th>GTLIP</th><th>GADDR</th><th>GAMERR (Annual Limit)</th></tr>
        <tr><td>Student</td><td>5,000.00</td><td>10,000.00</td><td>7,000.00</td></tr>
    </table>
    <p class="note">*Maximum of 5 units. Uniform coverage for all students.</p>
    <h3>Single Premium Per Head (Php) – 1 Unit</h3>
    <table>
        <tr><th>Count</th><th>GTLIP</th><th>GADDR</th><th>GAMERR</th><th>Total</th></tr>
        <tr><td>50 - 99</td><td>28.42</td><td>34.93</td><td>156.65</td><td>220.00</td></tr>
        <tr><td>100 - 199</td><td>14.21</td><td>17.46</td><td>78.33</td><td>110.00</td></tr>
        <tr><td>200 - 299</td><td>6.46</td><td>7.94</td><td>35.6</td><td>50.00</td></tr>
        <tr><td>300 - 399</td><td>5.17</td><td>6.35</td><td>28.48</td><td>40.00</td></tr>
        <tr><td>400 - 599</td><td>3.88</td><td>4.76</td><td>21.36</td><td>30.00</td></tr>
        <tr><td>600 and above</td><td>2.58</td><td>3.18</td><td>14.24</td><td>20.00</td></tr>
    </table>

    <p class="note">
    Rates are inclusive of government-mandated taxes and 15.00% commission.
    </p>

    <h3>Eligibility</h3>
    <p>
    Any in good health and actively-at-work bona fide enrolled student of the Policyholder 
    who is at least five (5) years old and has not attained his 25th birth anniversary.
    </p>
    <p>
    Any regular, in good health and actively-at-work employee of the Policyholder 
    who is at least eighteen (18) years old and has not attained his 65th birth anniversary.
    </p>

    <h3>Termination Age</h3>
    <ul>
    <li><strong>GADDR:</strong> Coverage terminates at age 65.</li>
    <li><strong>Other Riders:</strong> Coverage terminates at age 65.</li>
    <li><strong>Students:</strong> Coverage automatically terminates at age 25.</li>
    </ul>

    <h3>Term of Coverage</h3>
    <p>All eligible individuals will be covered for a maximum of one year.</p>

    <h3>Participation Requirements</h3>
    <p><strong>100% of all eligible individuals</strong></p>

    <p class="note">
    <strong>Annual Premium During Policy Inception (Net of Collection Fee):</strong><br>
    N/A – Since our objective is to offer a competitive plan for this type of group.
    </p>

    <h3>Minimum Number Requirements</h3>

    <table>
    <tr><th>Count</th><th>Annual Premium During Policy Inception<br>(Net of Collection Fee)</th><th>Minimum During Inception</th><th>Minimum Within Policy Period</th></tr>
    <tr><td>50 - 99</td><td rowspan="6">N/A – Since our objective is to offer a competitive plan for this type of group.</td><td>50</td><td>50</td></tr>
    <tr><td>100 - 199</td><td>100</td><td>100</td></tr>
    <tr><td>200 - 299</td><td>200</td><td>210</td></tr>
    <tr><td>300 - 399</td><td>300</td><td>300</td></tr>
    <tr><td>400 - 599</td><td>400</td><td>400</td></tr>
    <tr><td>600 and above</td><td>600</td><td>600</td></tr>
    </table>

    <h3>NEL (1 Unit)</h3>
    <p>
    No-evidence limit is Php 5,000.00 provided eligible individual has not attained his 25th birth anniversary.
    </p>

    <h3>Other Terms</h3>
    <ul>
    <li>Free GADDR coverage of Php 10,000 for employees (Teaching and Non-Teaching), regardless of the unit/s purchased, provided their number does not exceed 10% of the total participating students.</li>
    <li>Unprovoked Murder and Assault (UMA) is not covered.</li>
    <li>Participation requirements remain the same, regardless of the number of units purchased.</li>
    <li>Benefits, Rates, and NEL will be adjusted accordingly based on the number of units purchased.</li>
    </ul>

</body>
</html>
    `;
};