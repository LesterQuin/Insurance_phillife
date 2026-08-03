export const extensionApprovedTemplate = (recipientName, accountName, proposalNumber, newExpiryDate, appUrl) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Extension Request Approved</title>
</head>
<body style="margin:0;padding:0;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f8f9fa; color:#333;">
    <table role="presentation" style="width:100%; max-width:600px; margin:20px auto; background:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden; border-collapse:collapse;">
        
        <!-- Header -->
        <tr>
            <td bgcolor="#2e7d32" style="background-color:#2e7d32; text-align:center; padding:20px; color:white;">
                <h1 style="margin:0; font-size:24px; font-weight:300;">Extension Request Approved</h1>
                <p style="margin:5px 0 0; font-size:14px; opacity:0.9;">Automated Notification</p>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding:30px 25px;">
                <p style="margin:0 0 20px; font-size:16px;">Dear ${recipientName},</p>
                
                <p style="margin:0 0 20px; font-size:16px;">This is to inform you that your extension request for the application below has been successfully <strong>APPROVED</strong> in the Group Proposal System.</p>

                <div style="background:#e8f5e9; border-left:4px solid #2e7d32; padding:15px; margin:20px 0;">
                    <h3 style="margin:0 0 10px; font-size:18px; color:#2e7d32;">Proposal Details</h3>
                    <table role="presentation" style="width:100%; font-size:14px; border-collapse:collapse;">
                        <tr>
                            <td style="padding:5px 0; font-weight:bold; width:40%;">Account Name:</td>
                            <td style="padding:5px 0;">${accountName}</td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0; font-weight:bold;">Proposal Number:</td>
                            <td style="padding:5px 0;">${proposalNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0; font-weight:bold;">Extension Status:</td>
                            <td style="padding:5px 0;"><span style="background:#2e7d32; color:white; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold;">APPROVED</span></td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0; font-weight:bold;">New Expiry Date:</td>
                            <td style="padding:5px 0; color: #2e7d32; font-weight:bold;">${newExpiryDate}</td>
                        </tr>
                    </table>
                </div>

                <p style="margin:20px 0; font-size:16px;">
                    Please log in to the PhilLife Insurance System dashboard to review the proposal and continue finalizing your application.
                </p>

                <div style="margin: 30px 0; text-align: center;">
                    <a href="${appUrl}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">View Proposal</a>
                </div>

                <p style="margin:30px 0 0; font-size:16px;">
                    Thank you.
                </p>
                <p style="margin:10px 0 0; font-size:16px;">
                    Regards,<br><br>
                    <strong>Group Proposal System</strong><br>
                    Automated Notification
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background:#f8f9fa; text-align:center; padding:20px; border-top:1px solid #e9ecef;">
                <p style="margin:0; font-size:12px; color:#6c757d;">© 2026 Philippines Life Financial Assurance, Corp. (PhilLife). All rights reserved.</p>
                <p style="font-size: 9pt; color:#c62828; margin-top:10px; font-style:italic;">
                <strong>Notice:</strong> This is a system-generated notification. Please do not reply directly to this email.
                For inquiries or concerns, kindly contact us at 
                <a href="mailto:helpdesk@phillife.com.ph" style="color:#c62828;">
                helpdesk@phillife.com.ph
                </a> or call (02) 7798 – 5433.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
`;
};
