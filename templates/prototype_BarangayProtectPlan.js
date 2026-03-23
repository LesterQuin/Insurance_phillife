// prototype_BarangayProtectPlan.js

const formatNumber = (num) => {
if (num == null || isNaN(num)) return '0.00';
return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

export const generateBarangayPDFContent = (application, user, details) => {
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
    <title>Barangay Protect Plan</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
        }

        h2,
        h3 {
            margin-top: 30px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        table,
        th,
        td {
            border: 1px solid #000;
        }

        th,
        td {
            padding: 8px;
            text-align: center;
        }

        .note {
            font-size: 14px;
            margin-top: 10px;
        }
            
        .footer-contact{
            text-align:left;
            font-size:9pt;
            color:#555;
            margin-top:8px;
            font-style: italic;
        }   
        .footer-link{
            color:#555;
            text-decoration:none;
        }
        .footer-link:hover{
            color:#0066cc;
            text-decoration:underline;
        }
        .page-break {
            page-break-before: always;
        }
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

    <p>
        Dear ${application.addressee_designation || ''} ${addresseeLastName},
    </p>

    <p>
        We are pleased to present to you our <strong>${application.basic_plan?.name || ''}</strong>
        for the benefit of <strong>${application.group_name || ''}</strong>.
    </p>

    <p>
        Relative premium rates as well as other pertinent benefits and provisions are stated in the attached proposal.
    </p>

    <p>
        Should you have concerns with our program, please feel free to contact us at
        Tel. Nos. (02) 7798 – 5433 loc. ${contactLocal} or email us at
        <a href="mailto:helpdesk@phillife.com.ph">helpdesk@phillife.com.ph</a>
    </p>

    <p>
        Thank you and looking forward to have a mutually beneficial partnership with your company.
    </p>

    <p>
        Sincerely,<br><br>
        <strong>${cfeFullName}</strong> <br>
        ${user.departmentName || 'N/A'} <br>
        <strong>${user.locationName || 'N/A'}</strong>
    </p>

    <div class="page-break"></div>

    <!-- Start of your unchanged Barangay Protect Plan HTML -->
    <h2>Barangay Protect Plan</h2>
    <h3>Packaged Prototype Plans</h3>

    <h3>Prospects</h3>
    <ul>
        <li><strong>Class 1:</strong> Barangay Officials and Barangay Office Workers</li>
        <li><strong>Class 2:</strong> Barangay Officials and Barangay Tanods</li>
        <li><strong>Class 3:</strong> Barangay Tanods</li>
    </ul>

    <h3>Benefits (Php) – 1 Unit</h3>
    <table>
        <tr>
            <th>Classification</th>
            <th>GTLIP</th>
            <th>GADDR</th>
            <th>GAMERR (Annual Limit)</th>
        </tr>
        <tr>
            <td>All eligible individuals</td>
            <td>20,000.00</td>
            <td>20,000.00</td>
            <td>10,000.00</td>
        </tr>
    </table>
    <p class="note">*Maximum of 2 units. Uniform coverage for all members.</p>

    <h3>Single Premium per Head (Php) – 1 Unit</h3>
    <table>
        <tr>
            <th>Classification</th>
            <th>GTLIP</th>
            <th>GADDR</th>
            <th>GAMERR</th>
            <th>Total</th>
        </tr>
        <tr>
            <td>Class 1</td>
            <td>134.00</td>
            <td>108.00</td>
            <td>158.00</td>
            <td>400.00</td>
        </tr>
        <tr>
            <td>Class 2</td>
            <td>152.00</td>
            <td>126.00</td>
            <td>222.00</td>
            <td>500.00</td>
        </tr>
        <tr>
            <td>Class 3</td>
            <td>203.00</td>
            <td>172.00</td>
            <td>275.00</td>
            <td>650.00</td>
        </tr>
    </table>
    <p class="note">Rates are inclusive of government-mandated taxes, 15.00% commission, and 5.00% collection fee.</p>

    <h3>Eligibility</h3>
    <ul>
        <li>Any in good health and actively-at-work individual who is in the regular roster of the Barangay.</li>
        <li>At least 18 years old and has not attained 65th birth anniversary.</li>
        <li>Excludes individuals engaged in hazardous activities such as deep-sea diving, mountain climbing, and
            underground mining.</li>
    </ul>

    <h3>Termination Age</h3>
    <ul>
        <li>GTLIP: Coverage terminates at age 65.</li>
        <li>GADDR: Coverage terminates at age 65.</li>
        <li>GAMERR: Coverage terminates at age 65.</li>
    </ul>

    <h3>Participation Requirements</h3>
    <ul>
        <li>100% of all eligible individuals.</li>
        <li>At least 15 individuals at policy inception and throughout the policy period.</li>
    </ul>

    <h3>Premium Requirement</h3>
    <p>Minimum of Php 10,000.00 annual premium (net of collection fee) required to install the plan.</p>

    <h3>NEL (1 Unit)</h3>
    <p>No evidence limit is Php 20,000.00 provided eligible individual has not attained 55th birth anniversary.</p>

    <h3>Term of Coverage</h3>
    <p>Each eligible individual will be covered for a maximum of one year.</p>

    <h3>Other Terms</h3>
    <ul>
        <li>Unprovoked Murder and Assault (UMA) not covered.</li>
        <li>Can be offered as GTLIP with ADD only, subject to same terms and conditions.</li>
        <li>Elective members not accepted 6 months prior to and after elections.</li>
        <li>Not to be offered in Masbate.</li>
        <li>Participation requirements remain the same regardless of the number of units purchased.</li>
        <li>Number of units can be increased up to the maximum to meet annual premium requirement.</li>
        <li>Benefits, Rates, and NEL will be adjusted based on number of units purchased.</li>
        <li>Area for offering will be subject for review before proposal release.</li>
    </ul>

</body>

</html>
`;
};