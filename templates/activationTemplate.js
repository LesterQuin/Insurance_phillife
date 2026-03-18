// templates/activationTemplate.js
export const activationTemplate = (lastname, activationLink) => {
    return `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Activate Your Account</title>
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
            <p style="margin:5px 0 0; font-size:14px; opacity:0.9;">One more step to get started</p>
        </td>
        </tr>

        <!-- Content -->
        <tr>
            <td style="padding:30px 25px;">
            <p style="margin:0 0 20px; font-size:16px;">Hello Mr/Mrs, <strong>${lastname}</strong></p>
            <p style="margin:0 0 25px; font-size:16px;">
                Thank you for registering. Please click the button below to activate your account. This link will expire in 24 hours.
            </p>

            <!-- Activation Button -->
            <div style="text-align:center; margin:25px 0;">
                <a href="${activationLink}" target="_blank" style="background-color:#4caf50; color:white; padding:15px 25px; text-align:center; text-decoration:none; display:inline-block; border-radius:8px; font-size:16px; font-weight:bold;">Activate Account</a>
            </div>

            <p style="margin:20px 0; font-size:14px; color:#555;">
                If you did not create an account, no further action is required.
            </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="background:#f8f9fa; text-align:center; padding:20px; border-top:1px solid #e9ecef;">
            <p style="margin:0; font-size:12px; color:#6c757d;">© 2026 Insurance Proposal. All rights reserved.</p>
            </td>
        </tr>

        </table>
    </body>
    </html>
    `;
};

