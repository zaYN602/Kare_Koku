const sql = require('mssql/msnodesqlv8');
const config = {
    connectionString: 'Driver={SQL Server};Server=.\\SQLEXPRESS;Database=Kare_Koku;Trusted_Connection=yes;'
};

sql.connect(config).then(pool => {
    const q = `
    DELETE FROM Adres_Tablosu 
    WHERE AdresID IN (
        SELECT a.AdresID 
        FROM Adres_Tablosu a
        LEFT JOIN Siparisler s ON a.AdresID = s.AdresID
        WHERE s.SiparisID IS NULL
    )
    `;
    return pool.request().query(q);
}).then(res => {
    console.log('Orphaned addresses deleted:', res.rowsAffected);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
