const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    connectionString: 'Driver={SQL Server};Server=.\\SQLEXPRESS;Database=Kare_Koku;Trusted_Connection=yes;'
};

const newPrices = {
    "Aventus (Flacon)": 189.12,
    "Oud Wood": 256.12,
    "Baccarat Rouge 540": 346.50,
    "Layton": 190.68,
    "Naxos": 380.63,
    "Hacivat": 368.02,
    "Delina": 497.12,
    "Portrait of a Lady": 280.46,
    "Sauvage EDP": 94.41,
    "Bleu de Chanel EDP": 109.74,
    "Y EDP": 92.56,
    "Eros EDP": 83.28,
    "Invictus": 80.31,
    "1 Million": 81.80,
    "Acqua di Gio Profondo": 107.47,
    "Stronger With You": 99.36,
    "Le Male Le Parfum": 102.13,
    "Wanted EDP": 93.42,
    "Explorer": 74.01,
    "Luna Rossa Carbon": 95.40,
    "Bottled EDP": 78.83,
    "The One EDP": 95.40,
    "Dylan Blue": 76.97,
    "Good Girl": 109.74,
    "Black Opium": 107.77,
    "La Vie Est Belle": 111.72,
    "Si EDP": 109.74,
    "L'Interdit": 105.79,
    "Her": 107.77,
    "For Her": 103.81,
    "Light Blue": 80.31,
    "Bright Crystal": 78.83,
    "Bloom": 105.79,
    "Coco Mademoiselle": 103.69,
    "J'adore": 118.15,
    "Paradoxe": 109.74,
    "Donna Born In Roma": 109.74,
    "Olympea": 103.81
};

sql.connect(dbConfig).then(async pool => {
    let count = 0;
    for (const [ad, basePrice] of Object.entries(newPrices)) {
        // Find ParfumID
        const pRes = await pool.request()
            .input('ad', sql.NVarChar, ad)
            .query('SELECT ParfumID FROM Parfumler WHERE Ad = @ad');
        
        if (pRes.recordset.length > 0) {
            const pid = pRes.recordset[0].ParfumID;
            
            // Get all volumes for this perfume
            const fRes = await pool.request()
                .input('pid', sql.Int, pid)
                .query('SELECT Hacim_ml FROM Parfum_Fiyatlari WHERE ParfumID = @pid');
                
            for (let row of fRes.recordset) {
                const hacim = row.Hacim_ml;
                const newSatis = basePrice * hacim;
                
                await pool.request()
                    .input('pid', sql.Int, pid)
                    .input('hacim', sql.Int, hacim)
                    .input('satis', sql.Decimal(10,2), newSatis)
                    .query('UPDATE Parfum_Fiyatlari SET SatisFiyati = @satis WHERE ParfumID = @pid AND Hacim_ml = @hacim');
            }
            count++;
        } else {
            console.log("Bulunamadı: " + ad);
        }
    }
    console.log(count + " adet parfümün fiyatları güncellendi.");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
