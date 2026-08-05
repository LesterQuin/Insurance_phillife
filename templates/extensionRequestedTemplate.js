export const extensionRequestedTemplate = (creatorName, creatorEmail, accountName, proposalNumber, appUrl) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Extension Request Notification</title>
</head>
<body style="margin:0;padding:0;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background:#f8f9fa; color:#333;">
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; background:#fff; border: 1px solid #e0e0e0; padding: 20px; border-radius: 5px; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #0d47a1; border-bottom: 2px solid #0d47a1; padding-bottom: 10px; margin-top: 0;">DHUB_UAT</h2>
        <p>An extension request has been submitted for an insurance application requiring your review:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
                <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f0f0f0; width: 180px;">Application ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${proposalNumber}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Group Name:</td>
                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${accountName}</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Requested By:</td>
                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${creatorName} (${creatorEmail})</td>
            </tr>
            <tr>
                <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f0f0f0;">Submission Date:</td>
                <td style="padding: 8px; border-bottom: 1px solid #f0f0f0;">${new Date().toLocaleDateString()}</td>
            </tr>
        </table>
        <p>Please log in to the PhilLife Insurance System dashboard to review, approve, or decline this request.</p>
        <div style="margin-top: 30px; text-align: center;">
            <a href="${appUrl}" style="background-color: #0d47a1; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; display: inline-block;">View Proposal</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin-top: 30px; margin-bottom: 20px;" />
        <p style="font-size: 9pt; color: #777; text-align: center; margin-bottom: 0;">
            This is an automated notification from PhilLife Insurance System. Please do not reply directly to this email.
        </p>
    </div>
</body>
</html>
    `;
};
