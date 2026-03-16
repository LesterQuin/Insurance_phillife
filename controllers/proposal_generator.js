import { LocalDate } from '@js-joda/core';
import { DateTimeFormatter } from '@js-joda/format';

// Helper to format numbers with commas for currency.
const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Generates the HTML content for a Group Credit Life Insurance Plan (GCLIP) proposal.
 * @param {object} application - The full application data object from the database.
 * @param {object} user - The user object for the person generating the proposal (CFE).
 * @param {object} details - An object containing plan-specific details like rates and premiums.
 * @returns {string} - The complete HTML content for the proposal.
 */
export const generateGCLIPDFContent = (application, user, details) => {
    const proposalDate = LocalDate.now();
    const expiryDate = proposalDate.plusDays(30);

    const addresseeLastName = application.proposal_addressee.split(' ').pop();

    // Defaulting details to avoid errors if they are not provided
    const {
        totalAnnualPremium = 0,
        contactLocal = 'N/A',
        cfePosition = 'Group Marketing',
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
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Group Credit Life Insurance Proposal</title>
        <style>
            body { font-family: Arial, sans-serif; font-size: 10pt; color: #333; }
            .header { text-align: right; font-size: 8pt; color: #555; margin-bottom: 20px; }
            .main-title { font-size: 14pt; font-weight: bold; }
            .section-title { font-size: 11pt; font-weight: bold; background-color: #EAEAEA; padding: 5px; margin-top: 20px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
            th, td { border: 1px solid #ccc; padding: 5px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .conforme { margin-top: 50px; }
            .signature-line { border-bottom: 1px solid #000; width: 280px; margin-top: 40px; }
            p { line-height: 1.5; }
            ul, ol { padding-left: 20px; }
            li { margin-bottom: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            www.phillife.com.ph<br/>
            (02) 7798 5433<br/>
            helpdesk@phillife.com.ph
        </div>

        <h2>Group Insurance</h2>
        <h3>Plan Proposal</h3>

        <table>
            <tr>
                <td width="150px"><b>Proposal Status:</b></td>
                <td>${application.status.name}</td>
            </tr>
            <tr>
                <td><b>Presented To:</b></td>
                <td>${application.group_name}</td>
            </tr>
            <tr>
                <td><b>Date of Proposal:</b></td>
                <td>${proposalDate.format(DateTimeFormatter.ofPattern('MMMM d, yyyy'))}</td>
            </tr>
            <tr>
                <td><b>Total Annual Premium:</b></td>
                <td>Php ${formatNumber(totalAnnualPremium)}</td>
            </tr>
            <tr>
                <td><b>Base Plan:</b></td>
                <td>${application.basic_plan.name}</td>
            </tr>
            <tr>
                <td><b>Payment Terms:</b></td>
                <td>${application.payment_mode.name}</td>
            </tr>
        </table>

        <br/><br/>

        <p>${proposalDate.format(DateTimeFormatter.ofPattern('MMMM d, yyyy'))}</p>
        <br/>
        <p>
            <b>${application.addressee_designation} ${application.proposal_addressee}</b><br/>
            ${application.addressee_designation}<br/>
            ${application.group_name}<br/>
            ${application.business_address}
        </p>
        <br/>
        <p>Dear ${application.addressee_designation} ${addresseeLastName},</p>
        <p>
            We are pleased to present to you our Group Credit Life Insurance Proposal 
            (Initial Loan Amount) for the benefit of <b>${application.group_name}</b> - debtors.
        </p>
        <p>
            Relative premium rates as well as other pertinent benefits and provisions are
            stated in the attached proposal. Should you have concerns with our program,
            please feel free to contact us at Tel. Nos. (02) 7798 – 5433 loc. ${contactLocal} or email
            us at ${user.email} and we will be more than willing to answer your queries.
        </p>
        <p>
            Thank you and looking forward to have a mutually beneficial partnership with
            your company.
        </p>
        <br/>
        <p>
            Sincerely,<br/><br/><br/>
            <b>${cfeFullName}</b><br/>
            ${cfePosition}<br/>
            Group Marketing Division
        </p>

        <div class="section-title">Summary of Benefits</div>
        <p><b>Group Credit Life Insurance Plan (GCLIP) – Initial Loan Amount</b></p>
        <p>
            Pays the initial loan amount upon approval of proof of death of the borrower while
            the policy is in force and during the defined period, subject to the maximum
            amount. Death benefit is the Amount of Insurance at loan effective date. It is level
            throughout the term of the loan.
        </p>

        <div class="section-title">SINGLE RATE PER 1,000 For borrowers ${application.minimum_age}-${application.maximum_age}</div>
        <table>
            <tr><th>Term of Loan</th><th>GCLIP</th><th>Term of Loan</th><th>GCLIP</th><th>Term of Loan</th><th>GCLIP</th></tr>
            <tr><td>6 months</td><td>${rates18_64[6] || 'N/A'}</td><td>18 months</td><td>${rates18_64[18] || 'N/A'}</td><td>30 months</td><td>${rates18_64[30] || 'N/A'}</td></tr>
            <tr><td>12 months</td><td>${rates18_64[12] || 'N/A'}</td><td>24 months</td><td>${rates18_64[24] || 'N/A'}</td><td>36 months</td><td>${rates18_64[36] || 'N/A'}</td></tr>
        </table>
        
        <div class="section-title">SINGLE RATE PER 1,000 For borrowers 65-67</div>
        <table>
            <tr><th>Term of Loan</th><th>GCLIP</th><th>Term of Loan</th><th>GCLIP</th><th>Term of Loan</th><th>GCLIP</th></tr>
            <tr><td>6 months</td><td>${rates65_67[6] || 'N/A'}</td><td>18 months</td><td>${rates65_67[18] || 'N/A'}</td><td>30 months</td><td>${rates65_67[30] || 'N/A'}</td></tr>
            <tr><td>12 months</td><td>${rates65_67[12] || 'N/A'}</td><td>24 months</td><td>${rates65_67[24] || 'N/A'}</td><td>36 months</td><td>${rates65_67[36] || 'N/A'}</td></tr>
        </table>

        <div class="section-title">SINGLE RATE PER 1,000 For borrowers 68-70</div>
        <table>
            <tr><th>Term of Loan</th><th>GCLIP</th><th>Term of Loan</th><th>GCLIP</th><th>Term of Loan</th><th>GCLIP</th></tr>
            <tr><td>6 months</td><td>${rates68_70[6] || 'N/A'}</td><td>18 months</td><td>${rates68_70[18] || 'N/A'}</td><td>30 months</td><td>${rates68_70[30] || 'N/A'}</td></tr>
            <tr><td>12 months</td><td>${rates68_70[12] || 'N/A'}</td><td>24 months</td><td>${rates68_70[24] || 'N/A'}</td><td>36 months</td><td>${rates68_70[36] || 'N/A'}</td></tr>
        </table>

        <div class="section-title">Attained Age GCLIP - 12 months</div>
        <table>
            <tr><th>Attained Age</th><th>GCLIP</th></tr>
            <tr><td>71</td><td>${rates71_74[71] || 'N/A'}</td></tr>
            <tr><td>72</td><td>${rates71_74[72] || 'N/A'}</td></tr>
            <tr><td>73</td><td>${rates71_74[73] || 'N/A'}</td></tr>
            <tr><td>74</td><td>${rates71_74[74] || 'N/A'}</td></tr>
        </table>

        <div class="section-title">Notes</div>
        <ol>
            <li>Rates are inclusive of government-mandated taxes. Renewal rate may change depending on the claims experience of the policy.</li>
            <li><b>Eligibility Requirements:</b>
                <ul>
                    <li>Any in good health and actively-at-work debtor of the Policyholder who is at least ${application.minimum_age} years old and who has not attained his ${application.maximum_age + 1}th birth anniversary, at the time of loan application. Actively-at-work means performing usual duties of occupation and/or performing activities of daily living.</li>
                    <li>Engaged in lawful employment or business;</li>
                </ul>
            </li>
            <li><b>Termination of Insurance:</b> Insurance coverage automatically terminates on the earliest of the following dates:
                <ul>
                    <li>The date of the policy terminates;</li>
                    <li>The policy anniversary immediately succeeding the date of the Debtor attains the termination age;</li>
                    <li>The date of any one payment towards the Insured’s loan become six (6) months overdue, notwithstanding payment for his insurance;</li>
                    <li>The Insured Debtor ceases to be a debtor of the Creditor; or</li>
                    <li>The date the loan matures.</li>
                </ul>
            </li>
            <li><b>Participation Requirements:</b> At least ${participationPercentage}% of all eligible individuals within the policy year.</li>
            <li><b>Evidence of Insurability:</b>
                <ul>
                    <li>No Evidence limit (NEL) is Php ${formatNumber(nelAmount)} provided eligible individual has not attained his ${nelAge}th birth anniversary.</li>
                    <li>Non-medical limit (NML) is Php ${formatNumber(nmlAmount)} provided eligible individual has not attained his ${nmlAge}th birth anniversary.</li>
                </ul>
            </li>
            <li><b>Payment of benefits:</b> Upon approval of proof of death of the Debtor while the Insurance is in force, PhilLife shall pay the following:
                <ul>
                    <li>To the Policyholder: the outstanding balance of the Debtor's loan.</li>
                    <li>To the Debtor's beneficiaries: the difference, if any, between the amount of insurance and the outstanding balance of the Debtor's loan. Outstanding balance were derived from amortization of the insured.</li>
                </ul>
            </li>
            <li>This proposal is subject to the complete provisions to be provided in the Policy.</li>
            <li>The proposal validity is until <b>${expiryDate.format(DateTimeFormatter.ofPattern('MMMM d, yyyy'))}</b>.</li>
        </ol>

        <div class="conforme">
            <p>Conforme (Policyholder):</p>
            <div class="signature-line"></div>
            <p>
                <b>${application.proposal_addressee}</b><br/>
                ${application.addressee_designation}
            </p>
            <br/>
            <div class="signature-line"></div>
            <p>Date Signed</p>
        </div>
    </body>
    </html>
    `;
};