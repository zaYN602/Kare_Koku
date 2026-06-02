const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// 1. JWT & Cookie parser
code = "require('dotenv').config();\nconst cookieParser = require('cookie-parser');\n" + code;
code = code.replace("app.use(express.json());", "app.use(express.json());\napp.use(cookieParser());\n");

// 2. Auth middleware
const authMid = `
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'kare_koku_cok_gizli_anahtar';

const verifyToken = (req, res, next) => {
    let token = req.cookies ? req.cookies.kareToken : null;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ hata: "Erişim reddedildi. Lütfen giriş yapın." });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ hata: "Geçersiz token." });
        req.user = user;
        next();
    });
};
`;
code = code.replace("const app = express();", authMid + "\nconst app = express();");

// 3. Login token generation
code = code.replace(
    /res\.status\(200\)\.json\(\{ mesaj: "Giriş başarılı", kullanici: user\.AdSoyad, id: user\.KullaniciID \}\);/g,
    `const token = jwt.sign({ id: user.KullaniciID, email: user.Email, rol: user.Yetki || 'User' }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('kareToken', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({ mesaj: "Giriş başarılı", kullanici: user.AdSoyad, id: user.KullaniciID, token: token });`
);

// 4. Protect routes
code = code.replace(/app\.post\('\/api\/siparis',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*kullaniciID\s*=\s*req\.body\.kullaniciID;/g, `app.post('/api/siparis', verifyToken, async (req, res) => {\n    const kullaniciID = req.user.id;`);
code = code.replace(/app\.get\('\/api\/siparislerim',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*kullaniciID\s*=\s*req\.query\.kullaniciID;/g, `app.get('/api/siparislerim', verifyToken, async (req, res) => {\n    const kullaniciID = req.user.id;`);
code = code.replace(/app\.get\('\/api\/adreslerim',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*kullaniciID\s*=\s*req\.query\.kullaniciID;/g, `app.get('/api/adreslerim', verifyToken, async (req, res) => {\n    const kullaniciID = req.user.id;`);
code = code.replace(/app\.post\('\/api\/sifre-degistir',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*kullaniciID\s*=\s*req\.body\.kullaniciID;/g, `app.post('/api/sifre-degistir', verifyToken, async (req, res) => {\n    const kullaniciID = req.user.id;`);
code = code.replace(/app\.post\('\/api\/adres-ekle',\s*async\s*\(req,\s*res\)\s*=>\s*\{[\s\S]*?const\s*\{\s*kullaniciID,\s*/g, `app.post('/api/adres-ekle', verifyToken, async (req, res) => {\n    const kullaniciID = req.user.id;\n    const { `);
code = code.replace(/app\.delete\('\/api\/adres-sil\/:adresID',\s*async\s*\(req,\s*res\)\s*=>\s*\{/g, `app.delete('/api/adres-sil/:adresID', verifyToken, async (req, res) => {`);

// 5. Duplicate address fix
code = code.replace(
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

// 6. Fix credentials
code = code.replace(/user: 'Mertakbulut9494@gmail\.com',\s*pass: 'yewx atfy gtms nxcs'/g, 'user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS');

fs.writeFileSync('server.js', code);
console.log('Phase 2 fixes applied.');
