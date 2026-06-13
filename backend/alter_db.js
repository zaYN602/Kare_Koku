const { sql, poolPromise } = require('./config/db.js');
async function run() {
    try {
        const pool = await poolPromise;
        await pool.request().query('ALTER TABLE Kullanicilar ADD MailOnayliMi BIT DEFAULT 0;');
        console.log("MailOnayliMi eklendi.");
    } catch(e) { console.log("MailOnayliMi hatası:", e.message); }
    
    try {
        const pool = await poolPromise;
        await pool.request().query('ALTER TABLE Kullanicilar ADD OnayKodu NVARCHAR(10);');
        console.log("OnayKodu eklendi.");
    } catch(e) { console.log("OnayKodu hatası:", e.message); }

    try {
        const pool = await poolPromise;
        await pool.request().query('UPDATE Kullanicilar SET MailOnayliMi = 1;');
        console.log("Mevcut kullanıcılar onaylandı.");
    } catch(e) { console.log("Update hatası:", e.message); }

    process.exit();
}
run();
