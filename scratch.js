const fs = require('fs');
let code = fs.readFileSync('backend/routes/apiRoutes.js', 'utf8');

code = code.replace(
    'module.exports = function(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken) {',
    'module.exports = function(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken, isAdmin) {'
);

code = code.replace(
    "app.get('/api/admin/siparisler', async (req, res) => {",
    "app.get('/api/admin/siparisler', verifyToken, isAdmin, async (req, res) => {"
);

code = code.replace(
    "app.get('/api/admin/ozet', async (req, res) => {",
    "app.get('/api/admin/ozet', verifyToken, isAdmin, async (req, res) => {"
);

code = code.replace(
    "app.get('/api/admin/stok', async (req, res) => {",
    "app.get('/api/admin/stok', verifyToken, isAdmin, async (req, res) => {"
);

code = code.replace(
    "app.post('/api/admin/siparis-guncelle', async (req, res) => {",
    "app.post('/api/admin/siparis-guncelle', verifyToken, isAdmin, async (req, res) => {"
);

code = code.replace(
    "app.get('/api/siparislerim/:kullaniciID', async (req, res) => {",
    "app.get('/api/siparislerim/:kullaniciID', verifyToken, async (req, res) => {\n    if (parseInt(req.params.kullaniciID) !== req.user.id && req.user.rol !== 'Admin') return res.status(403).json({ hata: 'Yetkisiz erişim!' });"
);

code = code.replace(
    "app.get('/api/adreslerim/:kullaniciID', async (req, res) => {",
    "app.get('/api/adreslerim/:kullaniciID', verifyToken, async (req, res) => {\n    if (parseInt(req.params.kullaniciID) !== req.user.id && req.user.rol !== 'Admin') return res.status(403).json({ hata: 'Yetkisiz erişim!' });"
);

code = code.replace(
    "app.post('/api/sifre-degistir', async (req, res) => {",
    "app.post('/api/sifre-degistir', verifyToken, async (req, res) => {\n    if (parseInt(req.body.kullaniciID) !== req.user.id) return res.status(403).json({ hata: 'Yetkisiz erişim!' });"
);

code = code.replace(
    "app.post('/api/siparis', async (req, res) => {",
    "app.post('/api/siparis', verifyToken, async (req, res) => {\n    if (parseInt(req.body.kullaniciID) !== req.user.id) return res.status(403).json({ hata: 'Yetkisiz erişim!' });"
);

fs.writeFileSync('backend/routes/apiRoutes.js', code);
console.log('Task 3 and 4 reapplied.');
