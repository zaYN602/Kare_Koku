const fs = require('fs');
let code = fs.readFileSync('backend/routes/apiRoutes.js', 'utf8');

code = code.replace(
    'module.exports = function(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken, isAdmin) {',
    "const xss = require('xss');\nmodule.exports = function(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken, isAdmin) {"
);

code = code.replace(
    'const { adSoyad, email, telefon, sifre } = req.body;',
    'let { adSoyad, email, telefon, sifre } = req.body;\n    adSoyad = xss(adSoyad);\n    email = xss(email);'
);

code = code.replace(
    'const { kullaniciID, parfumID, yorumMetni, puan } = req.body;',
    'let { kullaniciID, parfumID, yorumMetni, puan } = req.body;\n    yorumMetni = xss(yorumMetni);'
);

code = code.replace(
    'const { kullaniciID, sehir, ilce, mahalle, acikAdres } = req.body;',
    'let { kullaniciID, sehir, ilce, mahalle, acikAdres } = req.body;\n    sehir = xss(sehir);\n    ilce = xss(ilce);\n    mahalle = xss(mahalle);\n    acikAdres = xss(acikAdres);'
);

code = code.replace(
    'const { kullaniciID, siparisNo, adSoyad, telefon, sehir, ilce, mahalle, acikAdres, toplamTutar, sepet, kuponKodu } = req.body;',
    'let { kullaniciID, siparisNo, adSoyad, telefon, sehir, ilce, mahalle, acikAdres, toplamTutar, sepet, kuponKodu } = req.body;\n    adSoyad = xss(adSoyad);\n    sehir = xss(sehir);\n    ilce = xss(ilce);\n    mahalle = xss(mahalle);\n    acikAdres = xss(acikAdres);'
);

fs.writeFileSync('backend/routes/apiRoutes.js', code);
console.log('XSS protections applied.');
