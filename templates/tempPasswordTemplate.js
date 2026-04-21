// templates/tempPasswordTemplate.js
export const tempPasswordTemplate = (lastname, tempPassword, baseUrl) => {
  return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Temporary Password</title>
    </head>
    <body style="margin:0;padding:0;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f8f9fa; color:#333;">
        <table role="presentation" style="width:100%; max-width:600px; margin:20px auto; background:#fff; border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1); overflow:hidden; border-collapse:collapse;">
        
        <!-- Header -->
        <tr>
        <td 
            bgcolor="#4caf50" 
            style="background-color:#4caf50; 
                background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                text-align:center; 
                padding:20px; 
                color:white;">
            <h1 style="margin:0; font-size:24px; font-weight:300;">Welcome to Insurance Proposal System</h1>
            <p style="margin:5px 0 0; font-size:14px; opacity:0.9;">Your account has been created</p>
        </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding:30px 25px;">
            <p style="margin:0 0 20px; font-size:16px;">Hello Mr/Mrs, <strong>${lastname}</strong></p>
            <p style="margin:0 0 25px; font-size:16px;">
                Your temporary password is:
            </p>

            <!-- Password Highlight -->
            <div style="text-align:center; margin:25px 0; padding:25px; background:#fff3e0; border:2px solid #4caf50; border-radius:10px; box-shadow:0 2px 8px rgba(255,152,0,0.2);">
                <h2 style="margin:0; font-size:36px; font-weight:bold; color:#2c5530; letter-spacing:2px; font-family:'Courier New', monospace;">${tempPassword}</h2>
            </div>

            <p style="margin:20px 0; font-size:16px;">
                Please <a href="http://192.5.5.142:85/login"  style="color:#3498db; text-decoration:none;">login</a> and reset your password immediately for security.
            </p>

            <p style="margin:25px 0 0; font-size:14px; color:#555; text-align:center; font-style:italic;">
                Thank you for joining Loan Due Tracking System! Stay secure.
            </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background:#f8f9fa; text-align:center; padding:20px; border-top:1px solid #e9ecef;">
                <p style="margin:0; font-size:12px; color:#6c757d;">© 2026 Insurance Proposal. All rights reserved.</p>

                <p style="font-size: 9pt; color:#c62828; margin-top:10px; font-style:italic;">
                <strong>Notice:</strong> This is a system-generated proposal. Please do not reply directly to this email.
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
