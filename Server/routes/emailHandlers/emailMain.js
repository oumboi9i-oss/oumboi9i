const express = require('express');
const router = express.Router();
const Email = require('../../models/email');
const { sendMail } = require('../../utils/mailer');

// ✅ المسار: POST /api/email/send
router.post('/', async (req, res) => {
    try {
        const { to, subject, text, html } = req.body;

        console.log('📝 Sending email to:', to, 'Subject:', subject);

        if (!to || !subject || (!text && !html)) {
            return res.status(400).json({
                success: false,
                error: '⚠️ Please provide to, subject, and content (text or html)'
            });
        }

        let messageId = '';
        let status = 'sent';

        try {
            // ✅ هنا كاتصيفط الإيميل الحقيقي عبر Gmail/Nodemailer
            const info = await sendMail({ to, subject, text, html });
            messageId = info.messageId || '';
            console.log('✅ Email actually sent via Gmail. messageId:', messageId);
        } catch (sendError) {
            // ✅ إيلا فشل الإرسال الحقيقي، نسجلوه كـ failed بدل ما نكذبو على المستخدم
            console.error('❌ Gmail send failed:', sendError.message);

            const failedEmail = new Email({
                to,
                subject,
                text: text || '',
                html: html || '',
                status: 'failed',
                sentAt: new Date()
            });
            await failedEmail.save();

            return res.status(502).json({
                success: false,
                error: '❌ Failed to actually send the email via Gmail: ' + sendError.message,
                savedId: failedEmail._id
            });
        }

        // ✅ نسجلو الإيميل فالداتابيز بعد ما نتأكدو أنه تصيفط بنجاح فعلا
        const email = new Email({
            to,
            subject,
            text: text || '',
            html: html || '',
            status,
            messageId,
            sentAt: new Date()
        });

        await email.save();

        console.log('✅ Email saved successfully');

        res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            savedId: email._id,
            messageId
        });

    } catch (error) {
        console.error('❌ Error sending email:', error);
        res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
});

module.exports = router;