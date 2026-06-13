const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    console.warn("⚠️ UYARI: .env dosyasında JWT_SECRET bulunamadı! Lütfen güvenliğiniz için bir sır belirleyin.");
}
const JWT_SECRET = process.env.JWT_SECRET || 'kare_koku_cok_gizli_anahtar'; // Geliştirme ortamı için geçici (üretimde kesinlikle değiştirin)

const verifyToken = (req, res, next) => {
    let token = req.cookies ? req.cookies.kareToken : null;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ hata: "Erişim reddedildi. Lütfen giriş yapın." });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ hata: "Geçersiz token. Lütfen tekrar giriş yapın." });
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ hata: "Önce giriş yapmalısınız." });
    }
    if (req.user.rol !== 'Admin') {
        return res.status(403).json({ hata: "Bu işlem için yönetici yetkisi gerekmektedir!" });
    }
    next();
};

module.exports = { verifyToken, isAdmin, JWT_SECRET };
