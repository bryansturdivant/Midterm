//Handles email sending via MailerSend API for password recovery functionality.


const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
console.log('MAILERSEND_API_KEY exists:', !!process.env.MAILERSEND_API_KEY);
console.log('MAILERSEND_API_KEY first 10 chars:', process.env.MAILERSEND_API_KEY?.substring(0, 10));
const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY,
});

async function sendEmail(to, subject, text) {
    const sentFrom = new Sender(process.env.GMAIL_USER, "Book Nerds");
    const recipients = [new Recipient(to)];
    
    const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(subject)
        .setText(text);
    
    try {
        const result = await mailerSend.email.send(emailParams);
        console.log('Email sent successfully');
        return { success: true, messageId: result.body?.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { sendEmail };