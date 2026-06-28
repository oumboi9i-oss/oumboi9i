// 📁 Server/utils/mailer.js
// إعداد Nodemailer لإرسال الإيميلات الحقيقية عبر Gmail
// يستعمل المتغيرات لي عندك ديجا فـ .env: EMAIL_USER و EMAIL_PASS

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// ✅ نتأكدو من الإعدادات عند بداية السيرفر (كايطبع فـ console فقط، ماكايوقفش السيرفر)
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Mailer config error:', error.message);
    } else {
        console.log('✅ Mailer is ready to send emails');
    }
});

/**
 * إرسال إيميل حقيقي
 * @param {Object} param0
 * @param {string} param0.to - البريد ديال المستقبل
 * @param {string} param0.subject - الموضوع
 * @param {string} [param0.text] - محتوى نصي
 * @param {string} [param0.html] - محتوى HTML
 * @returns {Promise<Object>} نتيجة الإرسال من nodemailer (فيها messageId)
 */
async function sendMail({ to, subject, text, html }) {
    const mailOptions = {
        from: `"SwitchGuard" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text: text || undefined,
        html: html || undefined
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
}

module.exports = { sendMail, transporter };