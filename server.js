require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const app = express();


const { verifyToken, JWT_SECRET } = require('./backend/middlewares/authMiddleware');
// 🚨 [GÜVENLİK] KAMERA SİSTEMİ (Middleware)
app.use((req, res, next) => {
    console.log(`\n🚨 [KAMERA] Yeni İstek Geldi: ${req.method} ${req.url}`);
    next();
});

app.use(cors({
    origin: function (origin, callback) {
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public')); // Gerekli: index.html ve js modüllerini HTTP üzerinden servis et


const { poolPromise, sql } = require('./backend/config/db');
// ==========================================
require('./backend/routes/apiRoutes')(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken);
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ Karekoku Garsonu mesaide! (Port: ${PORT})`);
});