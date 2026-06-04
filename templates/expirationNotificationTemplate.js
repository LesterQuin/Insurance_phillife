export const expirationNotificationTemplate = (lastname, groupName, daysLeft, appUrl) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Proposal Expiration Warning</title>
</head>
<body style="margin:0;padding:0;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f8f9fa; color:#333;">
    <table role="presentation" style="width:100%; max-width:600px; margin:20px auto; background:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden; border-collapse:collapse;">
        
        <!-- Header -->
        <tr>
            <td bgcolor="#d32f2f" style="background-color:#d32f2f; background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%); text-align:center; padding:20px; color:white;">
                <h1 style="margin:0; font-size:24px; font-weight:300;">Proposal Expiring Soon</h1>
                <p style="margin:5px 0 0; font-size:14px; opacity:0.9;">Urgent Action Required</p>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding:30px 25px;">
                <p style="margin:0 0 20px; font-size:16px;">Dear Mr./Ms. <strong>${lastname}</strong>,</p>
                
                <p style="margin:0 0 20px; font-size:16px;">This is an automated notification regarding the financial insurance application for the group below:</p>

                <div style="background:#ffebee; border-left:4px solid #d32f2f; padding:15px; margin:20px 0;">
                    <h3 style="margin:0 0 10px; font-size:18px; color:#c62828;">Expiration Details</h3>
                    <table role="presentation" style="width:100%; font-size:14px; border-collapse:collapse;">
                        <tr>
                            <td style="padding:5px 0; font-weight:bold; width:40%;">Account Name:</td>
                            <td style="padding:5px 0;">${groupName}</td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0; font-weight:bold;">Time Remaining:</td>
                            <td style="padding:5px 0;"><span style="color:#d32f2f; font-weight:bold;">${daysLeft} days</span></td>
                        </tr>
                    </table>
                </div>

                <p style="margin:20px 0; font-size:16px;">
                    This proposal will automatically expire if the requirements are not completed and the status is not changed to <strong>Booked</strong> within the remaining period.
                </p>

                <p style="margin:20px 0; font-size:16px;">
                    If you require more time to finalize the proposal, you may request an extension of another 30 days via the link below.
                </p>

                <!-- CTA Button -->
                <div style="text-align:center; margin:30px 0;">
                    <a href="${appUrl}" target="_blank" style="background-color:#d32f2f; color:white; padding:15px 25px; text-align:center; text-decoration:none; display:inline-block; border-radius:8px; font-size:16px; font-weight:bold;">Manage Application</a>
                </div>

                <p style="margin:20px 0; font-size:14px; color:#666; font-style:italic;">
                    Failure to complete the process or request an extension before the expiration date will result in the application being automatically closed.
                </p>

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