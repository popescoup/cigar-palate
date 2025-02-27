// backend/scripts/test-email.js
require('dotenv').config({ path: '../.env' });  // Explicitly point to .env file
console.log('API Key:', process.env.MAILGUN_API_KEY); // Will print undefined if not found

const emailService = require('../services/email');

async function testEmail() {
    try {
        await emailService.sendEmail({
            to: 'popescoup@gmail.com', // Replace with your email
            subject: 'Mailgun Test',
            html: `
                <h1>Test Email</h1>
                <p>If you're seeing this, the Mailgun integration is working correctly!</p>
                <p>Sent at: ${new Date().toLocaleString()}</p>
            `
        });
        console.log('Test email sent successfully!');
    } catch (error) {
        console.error('Error sending test email:', error);
    }
}

testEmail();