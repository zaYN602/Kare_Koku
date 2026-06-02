const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

// 1. JWT and DOTENV updates
serverCode = "require('dotenv').config();\n" + serverCode;
serverCode = serverCode.replace(
    /user: 'Mertakbulut9494@gmail\.com',\s*pass: 'yewx atfy gtms nxcs'/g,
    'user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS'
);

// Add verifyToken middleware
const authMiddlewareCode = `
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'kare_koku_cok_gizli_anahtar';

const verifyToken = (req, res, next) => {
    let token = req.cookies ? req.cookies.kareToken : null;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ hata: "Erişim reddedildi. Lütfen giriş yapın." });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ hata: "Oturum süresi dolmuş veya geçersiz token." });
        req.user = user;
        next();
    });
};
`;
serverCode = serverCode.replace("const app = express();", authMiddlewareCode + "\nconst app = express();");
serverCode = serverCode.replace("const cookieParser = require('cookie-parser');", "");
serverCode = "const cookieParser = require('cookie-parser');\n" + serverCode;
serverCode = serverCode.replace("app.use(express.json());", "app.use(express.json());\napp.use(cookieParser());\n");

// Update login for JWT
serverCode = serverCode.replace(
    /res\.status\(200\)\.json\(\{ mesaj: "Giriş başarılı", kullanici: user\.AdSoyad, id: user\.KullaniciID \}\);/g,
    `const token = jwt.sign({ id: user.KullaniciID, email: user.Email, rol: user.Yetki || 'User' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('kareToken', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ mesaj: "Giriş başarılı", kullanici: user.AdSoyad, id: user.KullaniciID, token: token });`
);

// /api/siparis
serverCode = serverCode.replace(
    /app\.post\('\/api\/siparis',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*kullaniciID\s*=\s*req\.body\.kullaniciID;/g,
    `app.post('/api/siparis', verifyToken, async (req, res) => {
    const kullaniciID = req.user.id;`
);

// Fix duplicate address on siparis
serverCode = serverCode.replace(
    /let adresRes = await requestAdres[\s\S]*?OUTPUT INSERTED\.AdresID VALUES \(@KullaniciID, @Sehir, @Ilce, @Mahalle, @AcikAdres\)`\);[\s\S]*?let adresID = adresRes\.recordset\[0\]\.AdresID;/g,
    `let checkAdresRes = await requestAdres
        .input('KullaniciID', sql.Int, kullaniciID) 
        .input('Sehir', sql.NVarChar, sehir)
        .input('Ilce', sql.NVarChar, ilce)
        .input('Mahalle', sql.NVarChar, mahalle || 'Belirtilmedi')
        .input('AcikAdres', sql.NVarChar, acikAdres)
        .query(\`SELECT AdresID FROM Adres_Tablosu 
                WHERE KullaniciID = @KullaniciID AND Sehir = @Sehir AND Ilce = @Ilce 
                AND Mahalle = @Mahalle AND AcikAdres = @AcikAdres\`);
                
    let adresID;
    if (checkAdresRes.recordset.length > 0) {
        adresID = checkAdresRes.recordset[0].AdresID;
    } else {
        let insertAdres = new sql.Request(transaction);
        let adresRes = await insertAdres
            .input('KullaniciID', sql.Int, kullaniciID) 
            .input('Sehir', sql.NVarChar, sehir)
            .input('Ilce', sql.NVarChar, ilce)
            .input('Mahalle', sql.NVarChar, mahalle || 'Belirtilmedi')
            .input('AcikAdres', sql.NVarChar, acikAdres)
            .query(\`INSERT INTO Adres_Tablosu (KullaniciID, Sehir, Ilce, Mahalle, AcikAdres) 
                    OUTPUT INSERTED.AdresID VALUES (@KullaniciID, @Sehir, @Ilce, @Mahalle, @AcikAdres)\`);
        adresID = adresRes.recordset[0].AdresID;
    }`
);

// Update siparislerim
serverCode = serverCode.replace(
    /app\.get\('\/api\/siparislerim',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*kullaniciID\s*=\s*req\.query\.kullaniciID;/g,
    `app.get('/api/siparislerim', verifyToken, async (req, res) => {
    const kullaniciID = req.user.id;`
);

// Update adreslerim
serverCode = serverCode.replace(
    /app\.get\('\/api\/adreslerim',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*kullaniciID\s*=\s*req\.query\.kullaniciID;/g,
    `app.get('/api/adreslerim', verifyToken, async (req, res) => {
    const kullaniciID = req.user.id;`
);

// Update sifre degistir
serverCode = serverCode.replace(
    /app\.post\('\/api\/sifre-degistir',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*kullaniciID\s*=\s*req\.body\.kullaniciID;/g,
    `app.post('/api/sifre-degistir', verifyToken, async (req, res) => {
    const kullaniciID = req.user.id;`
);

// Update adres ekle (FIXED SYNTAX ERROR HERE!!!)
serverCode = serverCode.replace(
    /app\.post\('\/api\/adres-ekle',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*\{\s*kullaniciID,\s*/g,
    `app.post('/api/adres-ekle', verifyToken, async (req, res) => {
    const kullaniciID = req.user.id;
    const { `
);

// Update adres sil
serverCode = serverCode.replace(
    /app\.delete\('\/api\/adres-sil\/:adresID',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g,
    `app.delete('/api/adres-sil/:adresID', verifyToken, async (req, res) => {`
);

fs.writeFileSync('server.js', serverCode);

// EXTRACT INTO MVC CAREFULLY
const lines = serverCode.split('\n');

let dbStart = -1, dbEnd = -1;
let authStart = -1, authEnd = -1;
let routesStart = -1, routesEnd = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('// SQL BAĞLANTISI')) dbStart = i;
    if (lines[i].includes('app.post(\'/api/register\',')) {
        // Find the line just before // 1. KULLANICI KAYDI
        for (let j = i; j >= 0; j--) {
            if (lines[j].includes('// ==========================================')) {
                if (dbEnd === -1) dbEnd = j - 1;
                routesStart = j;
                break;
            }
        }
    }
    if (lines[i].includes('const verifyToken = (req, res, next) => {')) authStart = i - 3; // const jwt = ...
    if (lines[i].includes('// 🚨 [GÜVENLİK] KAMERA SİSTEMİ')) authEnd = i - 1; 
    if (lines[i].includes('const PORT = process.env.PORT')) routesEnd = i - 1;
}

// 1. DB
const dbLines = lines.slice(dbStart, dbEnd).join('\n');
fs.writeFileSync('backend/config/db.js', 'const sql = require(\'mssql/msnodesqlv8\');\n' + dbLines + '\nmodule.exports = { sql, poolPromise };\n');

// 2. Auth Middleware
const authLines = lines.slice(authStart, authEnd).join('\n');
fs.writeFileSync('backend/middlewares/authMiddleware.js', authLines + '\nmodule.exports = { verifyToken, JWT_SECRET };\n');

// 3. Routes
const routeLines = lines.slice(routesStart, routesEnd).join('\n');
const apiRoutesCode = 'module.exports = function(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken) {\n' + routeLines + '\n};\n';
fs.writeFileSync('backend/routes/apiRoutes.js', apiRoutesCode);

// 4. Update server.js
let serverLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
    if (i === dbStart) {
        serverLines.push('const { poolPromise, sql } = require(\'./backend/config/db\');');
        skip = true;
    }
    if (i === dbEnd) skip = false;
    
    if (i === authStart) {
        serverLines.push('const { verifyToken, JWT_SECRET } = require(\'./backend/middlewares/authMiddleware\');');
        skip = true;
    }
    if (i === authEnd) { skip = false; continue; }
    
    if (i === routesStart) {
        serverLines.push('require(\'./backend/routes/apiRoutes\')(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken);');
        skip = true;
    }
    if (i === routesEnd) skip = false;
    
    if (!skip) serverLines.push(lines[i]);
}

fs.writeFileSync('server.js', serverLines.join('\n'));
console.log('Restoration and safe modularization complete!');
