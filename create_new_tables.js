const { poolPromise, sql } = require('./backend/config/db');

async function createTables() {
    try {
        const pool = await poolPromise;
        // Favoriler table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Favoriler' and xtype='U')
            CREATE TABLE Favoriler (
                FavoriID INT IDENTITY(1,1) PRIMARY KEY,
                KullaniciID INT NOT NULL,
                ParfumID INT NOT NULL,
                EklenmeTarihi DATETIME DEFAULT GETDATE(),
                FOREIGN KEY (KullaniciID) REFERENCES Kullanicilar(KullaniciID),
                FOREIGN KEY (ParfumID) REFERENCES Parfumler(ParfumID)
            )
        `);

        // StokBildirimleri table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StokBildirimleri' and xtype='U')
            CREATE TABLE StokBildirimleri (
                BildirimID INT IDENTITY(1,1) PRIMARY KEY,
                KullaniciID INT,
                Email NVARCHAR(255) NOT NULL,
                ParfumID INT NOT NULL,
                TalepTarihi DATETIME DEFAULT GETDATE(),
                BildirildiMi BIT DEFAULT 0,
                FOREIGN KEY (ParfumID) REFERENCES Parfumler(ParfumID)
            )
        `);
        console.log("Tables created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating tables:", err);
        process.exit(1);
    }
}

createTables();
