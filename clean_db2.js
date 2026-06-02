const sql = require('mssql/msnodesqlv8');
const config = {
    connectionString: 'Driver={SQL Server};Server=.\\SQLEXPRESS;Database=Kare_Koku;Trusted_Connection=yes;'
};

sql.connect(config).then(async pool => {
    // Adres_Tablosu'ndaki adresleri çekelim
    const res = await pool.request().query('SELECT * FROM Adres_Tablosu');
    const adresler = res.recordset;
    
    // Aynı özellikleri taşıyan adresleri gruplayalım
    const gruplar = {};
    for (let a of adresler) {
        // String formatında bir key üretelim
        const key = `${a.KullaniciID}_${a.Sehir}_${a.Ilce}_${a.Mahalle}_${a.AcikAdres}`.toLowerCase();
        if(!gruplar[key]) gruplar[key] = [];
        gruplar[key].push(a.AdresID);
    }
    
    let silinecek = 0;
    
    for (const key in gruplar) {
        const idler = gruplar[key].sort((a,b) => a - b); // en küçüğü (en eskisi) tutalım
        if (idler.length > 1) {
            const masterID = idler[0];
            const silinecekIDler = idler.slice(1);
            
            for (const silID of silinecekIDler) {
                // 1. O adrese bağlı siparişleri master adrese geçir
                await pool.request()
                    .input('master', sql.Int, masterID)
                    .input('sil', sql.Int, silID)
                    .query('UPDATE Siparisler SET AdresID = @master WHERE AdresID = @sil');
                
                // 2. Artık boşa çıkan (orphaned) adresi sil
                await pool.request()
                    .input('sil', sql.Int, silID)
                    .query('DELETE FROM Adres_Tablosu WHERE AdresID = @sil');
                    
                silinecek++;
            }
        }
    }
    
    console.log('Kopya (Duplicate) Adresler Başarıyla Temizlendi. Silinen:', silinecek);
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
