const fs = require('fs');

// 1. UPDATE server.js
let serverCode = fs.readFileSync('server.js', 'utf8');
serverCode = serverCode.replace(
    "app.use('/api/sifre-sifirla', authLimiter);",
    "app.use('/api/sifre-sifirla', authLimiter);\napp.use('/api/sifre-yeni-belirle', authLimiter);\napp.use('/api/sifre-degistir', authLimiter);"
);
fs.writeFileSync('server.js', serverCode);

// 2. UPDATE backend/routes/apiRoutes.js
let apiCode = fs.readFileSync('backend/routes/apiRoutes.js', 'utf8');

// Task 1: /api/adres-sil/:adresID
apiCode = apiCode.replace(
    "const checkSiparis = await pool.request()\n            .input('id', sql.Int, req.params.adresID)\n            .query(\"SELECT SiparisID FROM Siparisler WHERE AdresID = @id\");",
    "const checkSahip = await pool.request().input('adresId', sql.Int, req.params.adresID).query(\"SELECT KullaniciID FROM Adres_Tablosu WHERE AdresID = @adresId\");\n        if (checkSahip.recordset.length === 0) return res.status(404).json({ hata: \"Adres bulunamadı.\" });\n        if (checkSahip.recordset[0].KullaniciID !== req.user.id && req.user.rol !== 'Admin') return res.status(403).json({ hata: \"Yetkisiz işlem! Başkasının adresini silemezsiniz.\" });\n\n        const checkSiparis = await pool.request()\n            .input('id', sql.Int, req.params.adresID)\n            .query(\"SELECT SiparisID FROM Siparisler WHERE AdresID = @id\");"
);

// Task 2: /api/yorum-ekle
apiCode = apiCode.replace(
    "app.post('/api/yorum-ekle', async (req, res) => {\n    let { kullaniciID, parfumID, yorumMetni, puan } = req.body;",
    "app.post('/api/yorum-ekle', verifyToken, async (req, res) => {\n    let { kullaniciID, parfumID, yorumMetni, puan } = req.body;\n    if (parseInt(kullaniciID) !== req.user.id) return res.status(403).json({ hata: \"Yetkisiz işlem! Başkası adına yorum yapamazsınız.\" });"
);

// Task 3: /api/sifre-sifirla
apiCode = apiCode.replace(
    "const dogrulamaKodu = Math.floor(100000 + Math.random() * 900000).toString();\n\n            sifreSifirlamaKodlari[email] = {\n                kod: dogrulamaKodu,\n                zaman: Date.now() + 15 * 60 * 1000 \n            };",
    "const dogrulamaKodu = require('crypto').randomInt(100000, 1000000).toString();\n\n            sifreSifirlamaKodlari[email] = {\n                kod: dogrulamaKodu,\n                zaman: Date.now() + 15 * 60 * 1000,\n                deneme: 0\n            };"
);

// Task 4: /api/sifre-yeni-belirle
apiCode = apiCode.replace(
    "if (sifreSifirlamaKodlari[email].kod !== kod) {\n        return res.status(400).json({ hata: \"Hatalı doğrulama kodu girdiniz!\" });\n    }",
    "sifreSifirlamaKodlari[email].deneme++;\n    if (sifreSifirlamaKodlari[email].deneme > 3) {\n        delete sifreSifirlamaKodlari[email];\n        return res.status(400).json({ hata: \"Çok fazla hatalı deneme yaptınız. Kodunuz iptal edildi.\" });\n    }\n\n    if (sifreSifirlamaKodlari[email].kod !== kod) {\n        return res.status(400).json({ hata: `Hatalı doğrulama kodu girdiniz! (Kalan hak: ${3 - sifreSifirlamaKodlari[email].deneme})` });\n    }"
);

fs.writeFileSync('backend/routes/apiRoutes.js', apiCode);

console.log('All logic vulnerabilities patched successfully!');
