export const bookedNotificationTemplate = (recipientName, accountName, clientName, proposalNumber, bookedDate, cfeName) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Account Marked as BOOKED</title>
</head>
<body style="margin:0;padding:0;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f8f9fa; color:#333;">
    <table role="presentation" style="width:100%; max-width:600px; margin:20px auto; background:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden; border-collapse:collapse;">
        
        <!-- Header -->
        <tr>
            <td bgcolor="#0d47a1" style="background-color:#0d47a1; text-align:center; padding:20px; color:white;">
                <h1 style="margin:0; font-size:24px; font-weight:300;">Account Successfully Booked</h1>
                <p style="margin:5px 0 0; font-size:14px; opacity:0.9;">Automated Notification</p>
            </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding:30px 25px;">
                <p style="margin:0 0 20px; font-size:16px;">Dear ${recipientName},</p>
                
                <p style="margin:0 0 20px; font-size:16px;">This is to inform you that the account below has been successfully marked as <strong>BOOKED</strong> in the Group Proposal System.</p>

                <div style="background:#e3f2fd; border-left:4px solid #0d47a1; padding:15px; margin:20px 0;">
                    <h3 style="margin:0 0 10px; font-size:18px; color:#0d47a1;">Account Details</h3>
                    <table role="presentation" style="width:100%; font-size:14px; border-collapse:collapse;">
                        <tr>
                            <td style="padding:5px 0; font-weight:bold; width:40%;">Account Name:</td>
                            <td style="padding:5px 0;">${accountName}</td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0; font-weight:bold;">Client Name:</td>
                            <td style="padding:5px 0;">${clientName}</td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0; font-weight:bold;">Proposal Number:</td>
                            <td style="padding:5px 0;">${proposalNumber}</td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0; font-weight:bold;">Account Status:</td>
                            <td style="padding:5px 0;"><span style="background:#2e7d32; color:white; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:bold;">BOOKED</span></td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0; font-weight:bold;">Booked Date:</td>
                            <td style="padding:5px 0;">${bookedDate}</td>
                        </tr>
                        <tr>
                            <td style="padding:5px 0; font-weight:bold;">CFE:</td>
                            <td style="padding:5px 0;">${cfeName}</td>
                        </tr>
                    </table>
                </div>

                <p style="margin:20px 0; font-size:16px;">
                    The signed Proposal Conforme has been uploaded to the Group Proposal System and the booking process has been completed successfully.
                </p>

                <p style="margin:20px 0; font-size:16px;">
                    Please log in to the system for further details and any necessary follow-up actions.
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