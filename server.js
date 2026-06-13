require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const app = express();


const { verifyToken, isAdmin, JWT_SECRET } = require('./backend/middlewares/authMiddleware');
// 🚨 [GÜVENLİK] KAMERA SİSTEMİ (Middleware)
app.use((req, res, next) => {
    console.log(`\n🚨 [KAMERA] Yeni İstek Geldi: ${req.method} ${req.url}`);
    next();
});

const izinVerilenOriginler = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500']; // Canlıya çıkınca buraya gerçek domain yazılmalı
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || izinVerilenOriginler.indexOf(origin) !== -1 || origin.includes('ngrok')) {
            callback(null, true);
        } else {
            callback(new Error('CORS politikası gereği erişim engellendi!'));
        }
    },
    credentials: true
}));

// Genel API Sınırı (15 dakikada 500 istek)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { hata: "Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin." }
});

// Hassas İşlemler (Login, Register vb.) Sınırı (15 dakikada 10 istek)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { hata: "Çok fazla deneme yaptınız, lütfen 15 dakika bekleyin." }
});

app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/sifre-sifirla', authLimiter);
app.use('/api/sifre-yeni-belirle', authLimiter);
app.use('/api/sifre-degistir', authLimiter);
app.use('/api/', apiLimiter);
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // Gerekli: index.html ve js modüllerini HTTP üzerinden servis et


const { poolPromise, sql } = require('./backend/config/db');
// ==========================================
require('./backend/routes/apiRoutes')(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken, isAdmin);
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Karekoku Garsonu mesaide! (Port: ${PORT})`);
});