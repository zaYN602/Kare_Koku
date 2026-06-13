require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMail() {
    console.log("Kullanıcı:", process.env.EMAIL_USER);
    console.log("Şifre:", process.env.EMAIL_PASS ? "Yüklendi" : "Boş");

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    try {
        await transporter.sendMail({
            from: '"KareKoku Destek" <infokarekoku@gmail.com>',
            to: process.env.EMAIL_USER, // kendi kendine yollasın
            subject: 'Test Mail',
            text: 'Bu bir test mailidir.'
        });
        console.log("Mail başarıyla gönderildi!");
    } catch(e) {
        console.log("Mail hatası:", e.message);
    }
}
testMail();
