const sql = require('mssql/msnodesqlv8');
// SQL BAĞLANTISI (Eren Karaarslan Veritabanı)
const dbConfig = {
    connectionString: 'Driver={SQL Server};Server=.\\SQLEXPRESS;Database=Kare_Koku;Trusted_Connection=yes;'
};

// 🌟 PROFESYONEL YBS MİMARİSİ: GLOBAL CONNECTION POOL 🌟
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log("🟢 Mutfak (SQL) Bağlantısı Kusursuz Sağlandı!");
        return pool;
    })
    .catch(err => {
        console.error("🔴 SQL Bağlantı Hatası! Veritabanı açık mı kontrol et:", err);
    });

module.exports = { sql, poolPromise };
