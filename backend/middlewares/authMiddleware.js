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

module.exports = { verifyToken, JWT_SECRET };
