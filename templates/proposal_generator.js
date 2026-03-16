// Helper to format numbers with commas for currency.
const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

/**
 * Generates the HTML content for a Group Credit Life Insurance Plan (GCLIP) proposal.
 * @param {object} application - The full application data object from the database.
 * @param {object} user - The user object for the person generating the proposal (CFE).
 * @param {object} details - An object containing plan-specific details like rates and premiums.
 * @returns {string} - The complete HTML content for the proposal.
 */
export const generateGCLIPDFContent = (application, user, details) => {
    const proposalDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(proposalDate.getDate() + 30);

    const addresseeLastName = application.proposal_addressee.split(' ').pop();

    // Defaulting details to avoid errors if they are not provided
    const {
        totalAnnualPremium = 0,
        contactLocal = 'N/A',
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
    } = details || {};

    const cfeFullName = `${user.firstname} ${user.lastname}`;

    return `
    <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Group Credit Life Insurance Proposal</title>
<style>
body{
    font-family: Arial, sans-serif;
    margin:40px;
    line-height:1.6;
}

h2,h3{
    margin-top:30px;
}

table{
    width:100%;
    border-collapse:collapse;
    margin-top:15px;
}

table, th, td{
    border:1px solid #000;
}

th, td{
    padding:8px;
    text-align:center;
}

.header-table td{
    border:none;
    text-align:left;
}

.signature{
    margin-top:60px;
}

.notes{
    margin-top:20px;
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
</style>
</head>

<body>

<table class="header-table">
<tr>
<td><strong>Presented To:</strong> ${application.group_name}</td>
<td><strong>Proposal Status:</strong> ${application.status.name}</td>
<td><strong>Date of Proposal:</strong> ${formatDate(proposalDate)}</td>
</tr>

<tr>
<td><strong>Base Plan:</strong> ${application.basic_plan.name}</td>
<td><strong>Total Annual Premium:</strong> Php ${formatNumber(totalAnnualPremium)}</td>
<td><strong>Payment Terms:</strong> ${application.payment_mode.name}</td>
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
${application.contact_person_salutation} ${application.proposal_addressee} <br>
${application.addressee_designation} <br>
${application.group_name} <br>
${application.business_address}
</p>

<p>
Dear ${application.addressee_designation} ${addresseeLastName},
</p>

<p>
We are pleased to present to you our <strong>${application.basic_plan.name} – Initial Loan Amount</strong>
for the benefit of <strong>${application.group_name} - debtors</strong>.
</p>

<p>
Relative premium rates as well as other pertinent benefits and provisions are stated
in the attached proposal.
</p>

<p>
Should you have concerns with our program, please feel free to contact us at
Tel. Nos. (02) 7798 – 5433 loc. ${contactLocal} or email us at <a href="mailto:helpdesk@phillife.com.ph" class="helpdesk@phillife.com.ph">
helpdesk@phillife.com.ph
</a> and we will be
more than willing to answer your queries.
</p>

<p>
Thank you and looking forward to have a mutually beneficial partnership with your company.
</p>

<p>
Sincerely,<br><br>

<strong>${cfeFullName}</strong> <br>
${user.roleName || 'N/A'} <br>
<strong>${user.locationName || 'N/A'}</strong>
</p>

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
<td>${application.minimum_age}-${application.maximum_age}</td>
<td>Initial amount balance maximum of Php ${formatNumber(maxAmount18_64)}</td>
</tr>

<tr>
<td>65-67</td>
<td>Initial amount balance maximum of Php ${formatNumber(maxAmount65_67)}</td>
</tr>

<tr>
<td>68-70</td>
<td>Initial amount balance maximum of Php ${formatNumber(maxAmount68_70)}</td>
</tr>

<tr>
<td>71-74</td>
<td>Initial amount balance maximum of Php ${formatNumber(maxAmount71_74)}</td>
</tr>
</table>

<p>
Death benefit is the Amount of Insurance at loan effective date. It is level
throughout the term of the loan.
</p>

<h3>Single Rate per 1,000 – Borrowers Age ${application.minimum_age}-${application.maximum_age}</h3>

<table>
<tr>
<th>Term of Loan</th>
<th>Rate</th>
</tr>

<tr>
<td>6 months</td>
<td>${rates18_64[6] || 'N/A'}</td>
</tr>

<tr>
<td>12 months</td>
<td>${rates18_64[12] || 'N/A'}</td>
</tr>

<tr>
<td>18 months</td>
<td>${rates18_64[18] || 'N/A'}</td>
</tr>

<tr>
<td>24 months</td>
<td>${rates18_64[24] || 'N/A'}</td>
</tr>

<tr>
<td>30 months</td>
<td>${rates18_64[30] || 'N/A'}</td>
</tr>

<tr>
<td>36 months</td>
<td>${rates18_64[36] || 'N/A'}</td>
</tr>
</table>

<h3>Single Rate per 1,000 – Borrowers Age 65-67</h3>

<table>
<tr>
<th>Term of Loan</th>
<th>Rate</th>
</tr>

<tr>
<td>6 months</td>
<td>${rates65_67[6] || 'N/A'}</td>
</tr>

<tr>
<td>12 months</td>
<td>${rates65_67[12] || 'N/A'}</td>
</tr>

<tr>
<td>18 months</td>
<td>${rates65_67[18] || 'N/A'}</td>
</tr>

<tr>
<td>24 months</td>
<td>${rates65_67[24] || 'N/A'}</td>
</tr>

<tr>
<td>30 months</td>
<td>${rates65_67[30] || 'N/A'}</td>
</tr>

<tr>
<td>36 months</td>
<td>${rates65_67[36] || 'N/A'}</td>
</tr>
</table>

<h3>Single Rate per 1,000 – Borrowers Age 68-70</h3>

<table>
<tr>
<th>Term of Loan</th>
<th>Rate</th>
</tr>

<tr>
<td>6 months</td>
<td>${rates68_70[6] || 'N/A'}</td>
</tr>

<tr>
<td>12 months</td>
<td>${rates68_70[12] || 'N/A'}</td>
</tr>

<tr>
<td>18 months</td>
<td>${rates68_70[18] || 'N/A'}</td>
</tr>

<tr>
<td>24 months</td>
<td>${rates68_70[24] || 'N/A'}</td>
</tr>

<tr>
<td>30 months</td>
<td>${rates68_70[30] || 'N/A'}</td>
</tr>

<tr>
<td>36 months</td>
<td>${rates68_70[36] || 'N/A'}</td>
</tr>
</table>

<h3>Attained Age Rates (12 Months)</h3>

<table>
<tr>
<th>Age</th>
<th>Rate</th>
</tr>

<tr>
<td>71</td>
<td>${rates71_74[71] || 'N/A'}</td>
</tr>

<tr>
<td>72</td>
<td>${rates71_74[72] || 'N/A'}</td>
</tr>

<tr>
<td>73</td>
<td>${rates71_74[73] || 'N/A'}</td>
</tr>

<tr>
<td>74</td>
<td>${rates71_74[74] || 'N/A'}</td>
</tr>
</table>

<h2>Notes</h2>

<div class="notes">

<p>
1. Rates are inclusive of government-mandated taxes. Renewal rate may change
depending on the claims experience of the policy.
</p>

<p>
2. <strong>Eligibility Requirements</strong><br>
Any in good health and actively-at-work debtor of the Policyholder who is at
least ${application.minimum_age} years old and who has not attained his ${application.maximum_age + 1}th birth anniversary
at the time of loan application.
</p>

<p>
3. <strong>Termination of Insurance</strong><br>
Insurance coverage automatically terminates on the earliest of the following dates:
</p>

<ul>
<li>The date the policy terminates</li>
<li>The policy anniversary immediately succeeding the date of the Debtor attains the termination age</li>
<li>The date any payment towards the loan becomes six (6) months overdue</li>
<li>The Insured Debtor ceases to be a debtor of the Creditor</li>
<li>The date the loan matures</li>
</ul>

<p>
4. <strong>Participation Requirements</strong><br>
At least ${participationPercentage}% individuals within the policy year
</p>

<p>
5. <strong>Evidence of Insurability</strong><br>
No Evidence Limit (NEL): Php ${formatNumber(nelAmount)} before ${nelAge} birthday<br>
Non-Medical Limit (NML): Php ${formatNumber(nmlAmount)} before ${nmlAge} birthday
</p>

<p>
6. <strong>Payment of Benefits</strong><br>
Upon approval of proof of death of the Debtor:
</p>

<ul>
<li>To the Policyholder: Outstanding loan balance</li>
<li>To the Beneficiaries: Difference between insurance amount and loan balance</li>
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

</body>
</html>
    `;
};
