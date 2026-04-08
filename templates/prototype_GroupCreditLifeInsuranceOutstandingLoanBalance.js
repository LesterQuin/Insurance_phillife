const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
};

export const generateGCLIOutstandingLoanBalancePDFContent = (application, user, details) => {
    const proposalDate = new Date(application.updated_at);
    const addresseeLastName = application.proposal_addressee?.split(' ').pop() || '';
    const totalAnnualPremium = details?.totalAnnualPremium || 0;
    const contactLocal = details?.contactLocal || 'N/A';
    const cfeFullName = `${user.firstname} ${user.lastname}`;
    const logoDataUri = details?.logoDataUri || null;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Group Credit Life Insurance – Outstanding Loan Balance</title>
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

    <h2>Group Credit Life Insurance – Outstanding Loan Balance</h2>
    <h3>Prototype Plan</h3>
    <h3>Prospects</h3>
    <p>Rural Banks, Credit Unions / Associations, Lending and Financial Institutions</p>
    <h3>Benefits (Php)</h3>
    <h4>Maximum Outstanding Loan</h4>
    <table>
        <tr><th>Classification</th><th>Outstanding Loan Balance (Php)</th></tr>
        <tr><td>All eligible individuals</td><td>Outstanding loan balance maximum of 1,500,000.00</td></tr>
    </table>
   <h4>Single Rate per 1,000</h4>
    <table>
        <tr>
            <th>Term of Loan</th>
            <th>0%</th>
            <th>10%</th>
            <th>20%</th>
            <th>30%</th>
            <th>35%</th>
            <th>40%</th>
            <th>50%</th>
        </tr>
        <tr>
            <td>1 month</td>
            <td>0.70</td>
            <td>0.78</td>
            <td>0.87</td>
            <td>1.00</td>
            <td>1.08</td>
            <td>1.17</td>
            <td>1.40</td>
        </tr>
        <tr>
            <td>2 months</td>
            <td>1.05</td>
            <td>1.16</td>
            <td>1.31</td>
            <td>1.50</td>
            <td>1.61</td>
            <td>1.74</td>
            <td>2.09</td>
        </tr>
        <tr>
            <td>3 months</td>
            <td>1.39</td>
            <td>1.55</td>
            <td>1.74</td>
            <td>1.99</td>
            <td>2.14</td>
            <td>2.32</td>
            <td>2.79</td>
        </tr>
        <tr>
            <td>4 months</td>
            <td>1.74</td>
            <td>1.93</td>
            <td>2.17</td>
            <td>2.48</td>
            <td>2.68</td>
            <td>2.90</td>
            <td>3.48</td>
        </tr>
        <tr>
            <td>5 months</td>
            <td>2.08</td>
            <td>2.32</td>
            <td>2.60</td>
            <td>2.98</td>
            <td>3.21</td>
            <td>3.47</td>
            <td>4.17</td>
        </tr>
        <tr>
            <td>6 months</td>
            <td>2.43</td>
            <td>2.70</td>
            <td>3.03</td>
            <td>3.47</td>
            <td>3.73</td>
            <td>4.05</td>
            <td>4.85</td>
        </tr>
        <tr>
            <td>7 months</td>
            <td>2.77</td>
            <td>3.08</td>
            <td>3.46</td>
            <td>3.96</td>
            <td>4.26</td>
            <td>4.62</td>
            <td>5.54</td>
        </tr>
        <tr>
            <td>8 months</td>
            <td>3.11</td>
            <td>3.46</td>
            <td>3.89</td>
            <td>4.44</td>
            <td>4.79</td>
            <td>5.18</td>
            <td>6.22</td>
        </tr>
        <tr>
            <td>9 months</td>
            <td>3.45</td>
            <td>3.83</td>
            <td>4.31</td>
            <td>4.93</td>
            <td>5.31</td>
            <td>5.75</td>
            <td>6.90</td>
        </tr>
        <tr>
            <td>10 months</td>
            <td>3.79</td>
            <td>4.21</td>
            <td>4.74</td>
            <td>5.41</td>
            <td>5.83</td>
            <td>6.32</td>
            <td>7.58</td>
        </tr>
        <tr>
            <td>11 months</td>
            <td>4.13</td>
            <td>4.59</td>
            <td>5.16</td>
            <td>4.90</td>
            <td>6.35</td>
            <td>6.88</td>
            <td>8.26</td>
        </tr>
        <tr>
            <td>12 months</td>
            <td>4.46</td>
            <td>4.96</td>
            <td>5.58</td>
            <td>6.38</td>
            <td>6.87</td>
            <td>7.44</td>
            <td>8.93</td>
        </tr>
        <tr>
            <td>15 months</td>
            <td>5.47</td>
            <td>6.08</td>
            <td>6.84</td>
            <td>7.81</td>
            <td>8.41</td>
            <td>9.11</td>
            <td>10.94</td>
        </tr>
        <tr>
            <td>18 months</td>
            <td>6.46</td>
            <td>6.05</td>
            <td>8.08</td>
            <td>9.23</td>
            <td>9.94</td>
            <td>10.77</td>
            <td>12.93</td>
        </tr>
        <tr>
            <td>21 months</td>
            <td>7.45</td>
            <td>7.18</td>
            <td>9.31</td>
            <td>10.64</td>
            <td>11.46</td>
            <td>12.41</td>
            <td>14.89</td>
        </tr>
        <tr>
            <td>24 months</td>
            <td>8.42</td>
            <td>8.27</td>
            <td>10.53</td>
            <td>12.03</td>
            <td>12.96</td>
            <td>14.04</td>
            <td>16.84</td>
        </tr>
        <tr>
            <td>27 months</td>
            <td>9.39</td>
            <td>9.36</td>
            <td>11.73</td>
            <td>13.41</td>
            <td>14.44</td>
            <td>15.64</td>
            <td>18.77</td>
        </tr>
        <tr>
            <td>30 months</td>
            <td>10.34</td>
            <td>11.49</td>
            <td>12.93</td>
            <td>14.77</td>
            <td>15.91</td>
            <td>17.23</td>
            <td>20.68</td>
        </tr>
        <tr>
            <td>33 months</td>
            <td>11.29</td>
            <td>12.54</td>
            <td>14.11</td>
            <td>16.12</td>
            <td>17.36</td>
            <td>18.81</td>
            <td>22.57</td>
        </tr>
        <tr>
            <td>36 months</td>
            <td>12.22</td>
            <td>13.58</td>
            <td>15.28</td>
            <td>17.46</td>
            <td>18.80</td>
            <td>20.37</td>
            <td>24.44</td>
        </tr>
    </table>
    <p class="note">Rates are inclusive of government-mandated taxes and 15.00% commission.</p>
    <h3>Eligibility</h3>
    <p>Any in good health and actively-at-work debtor of the Policyholder who is at least eighteen (18) years old and has not attained his 65th birth anniversary.</p>
    <p>Actively-at-work means:</p>
    <ul>
        <li>Performing usual duties of occupation</li>
        <li>Performing activities of daily living</li>
    </ul>

    <h3>Termination Age</h3>
    <p>GCLIP: Coverage terminates at age 65.</p>

    <h3>Termination of Insurance</h3>
    <p>Insurance coverage automatically terminates on the earliest of the following dates:</p>
    <ul>
        <li>The date the policy terminates</li>
        <li>The policy anniversary immediately succeeding the date the Debtor attains the termination age</li>
        <li>The date the Insured Debtor enters military, naval, or air service</li>
        <li>The date any one payment towards the Insured's loan becomes six (6) months overdue, notwithstanding payments
            for insurance</li>
        <li>The Insured Debtor ceases to be a debtor of the Creditor</li>
    </ul>

    <h3>Participation Requirements</h3>
    <ul>
        <li>100% of all eligible individuals</li>
        <li>At least 100 individuals during the policy year</li>
    </ul>

    <h3>Premium Requirement</h3>
    <p>Minimum of Php 10,000.00 annual premium (net of collection fee) during the policy year</p>

    <h3>NML (Non-Medical Limit)</h3>
    <p>Non-medical limit is Php 500,000.00 provided eligible individual has not attained his 55th birth anniversary.</p>

    <h3>Payment of Benefits</h3>
    <p>Upon approval of proof of death of the Debtor while the Insurance is in force, PhilLife shall pay to the
        Policyholder the outstanding balance of the Debtor's loan.</p>

    <h3>Other Terms</h3>
    <ul>
        <li>40%-50% Collection Fee subject to management approval</li>
        <li>Rates beyond 36 months are subject to management approval</li>
        <li>Initially, only 0%-35% Collection Fee can be offered</li>
    </ul>

</body>
</html>
    `;
};