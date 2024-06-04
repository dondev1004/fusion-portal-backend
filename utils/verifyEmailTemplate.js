exports.verifyEmailTemplate = (name, verificationLink) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
                .container {
                    width: 100%;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: Arial, sans-serif;
                    color: #333;
                }
                .header, .footer {
                    background-color: #f8f8f8;
                    padding: 10px;
                    text-align: center;
                }
                .body {
                    padding: 20px;
                    text-align: center;
                }
                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    color: #fff;
                    background-color: #84f1a1;
                    text-decoration: none;
                    border-radius: 5px;
                }
                .text {
                    font-size: 15px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Email Verification</h1>
                </div>
                <div class="body">
                    <p class="text">Hi ${name},</p>
                    <p class="text">Thank you for registering. Please click the button below to verify your email address.</p>
                    <a href="${verificationLink}" class="button">Verify Email</a>
                    <p class="text">The current verify link is valid for 10 minutes.</p>
                    </div>
                <div class="footer">
                    <p>&copy; 2024 Your Company. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
}