const { poolPromise, sql } = require('./backend/config/db');

async function updateDb() {
    try {
        const pool = await poolPromise;
        await pool.request().query("UPDATE Kullanicilar SET MailOnayliMi = 1 WHERE MailOnayliMi IS NULL OR MailOnayliMi = 0");
        console.log("Database updated successfully.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateDb();
