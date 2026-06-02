const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Replace top requires
code = code.replace(/require\('dotenv'\)\.config\(\);\nconst express = require\('express'\);\nconst cors = require\('cors'\);\nconst sql = require\('mssql\/msnodesqlv8'\);\nconst bcrypt = require\('bcrypt'\);\nconst nodemailer = require\('nodemailer'\);\nconst cookieParser = require\('cookie-parser'\);\n\nconst jwt = require\('jsonwebtoken'\);\nconst JWT_SECRET = process\.env\.JWT_SECRET \|\| 'kare_koku_cok_gizli_anahtar';\n\nconst verifyToken = \(req, res, next\) => \{[\s\S]*?\}\s*\n\}\);\n\};\n\nconst app = express\(\);\napp\.use\(express\.json\(\)\);\napp\.use\(cookieParser\(\)\);[\s\S]*?\/\/ SQL BAĞLANTISI \(Eren Karaarslan Veritabanı\)[\s\S]*?\}\);/g, `const { sql, poolPromise } = require('../config/db');
const { JWT_SECRET } = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const apiController = {`);

// Replace routes
code = code.replace(/app\.post\('\/api\/register',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    register: async (req, res) => {');
code = code.replace(/app\.post\('\/api\/login',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    login: async (req, res) => {');
code = code.replace(/app\.get\('\/api\/parfumler',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    getParfumler: async (req, res) => {');
code = code.replace(/app\.post\('\/api\/kupon',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    kuponKontrol: async (req, res) => {');
code = code.replace(/app\.post\('\/api\/siparis',\s*verifyToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    siparisOlustur: async (req, res) => {');
code = code.replace(/app\.get\('\/api\/siparislerim',\s*verifyToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    getSiparislerim: async (req, res) => {');
code = code.replace(/app\.get\('\/api\/adreslerim',\s*verifyToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    getAdreslerim: async (req, res) => {');
code = code.replace(/app\.post\('\/api\/sifre-sifirla',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    sifreSifirla: async (req, res) => {');
code = code.replace(/app\.post\('\/api\/sifre-yeni-belirle',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    sifreYeniBelirle: async (req, res) => {');
code = code.replace(/app\.post\('\/api\/sifre-degistir',\s*verifyToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    sifreDegistir: async (req, res) => {');
code = code.replace(/app\.post\('\/api\/adres-ekle',\s*verifyToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    adresEkle: async (req, res) => {');
code = code.replace(/app\.delete\('\/api\/adres-sil\/:adresID',\s*verifyToken,\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    adresSil: async (req, res) => {');
code = code.replace(/app\.get\('\/api\/yorumlar\/:parfumID',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    getYorumlar: async (req, res) => {');
code = code.replace(/app\.post\('\/api\/yorum-ekle',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    yorumEkle: async (req, res) => {');
code = code.replace(/app\.get\('\/api\/admin\/siparisler',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    adminSiparisler: async (req, res) => {');
code = code.replace(/app\.get\('\/api\/admin\/ozet',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    adminOzet: async (req, res) => {');
code = code.replace(/app\.get\('\/api\/admin\/stok',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    adminStok: async (req, res) => {');
code = code.replace(/app\.post\('\/api\/admin\/siparis-guncelle',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, '    adminSiparisGuncelle: async (req, res) => {');

// Replace ending
code = code.replace(/const PORT = process\.env\.PORT \|\| 3000;\napp\.listen\(PORT, \(\) => console\.log\(`✅ Sunucu \$\{PORT\} portunda çalışıyor\.`\)\);/g, '};\n\nmodule.exports = apiController;');

// Fix trailing commas
code = code.replace(/\}\);\n\n\/\/ ==========================================/g, '},\n\n// ==========================================');
code = code.replace(/\}\);\n\n\};\n\nmodule\.exports = apiController;/g, '}\n\n};\n\nmodule.exports = apiController;');

// Convert all remaining app.method blocks ending in `});` into `},`
// This might be tricky, so we will use a regex loop
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '});') {
        if (i < lines.length - 1 && lines[i+1].includes('// ===')) {
            lines[i] = '},';
        }
    }
}
code = lines.join('\n');

fs.writeFileSync('backend/controllers/apiController.js', code);
console.log('Controller created!');
