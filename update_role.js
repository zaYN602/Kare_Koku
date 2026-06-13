const { sql, poolPromise } = require('./backend/config/db');
async function run() {
    try {
        const pool = await poolPromise;
        try {
            await pool.request().query("ALTER TABLE Kullanicilar ADD Yetki NVARCHAR(50) DEFAULT 'User'");
            console.log("Yetki column added.");
        } catch(e) {
            console.log("Column might already exist: ", e.message);
        }
        await pool.request().query("UPDATE Kullanicilar SET Yetki = 'Admin' WHERE Email LIKE 'mert%' OR Email = 'admin@karekoku.com'");
        console.log("Yetki updated to Admin for mert and admin.");
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();
