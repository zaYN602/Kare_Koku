Created At: 2026-06-02T06:47:38Z
Completed At: 2026-06-02T06:47:38Z
File Path: `file:///c:/Users/merta/OneDrive/Masa%C3%BCst%C3%BC/Kare_Koku/server.js`
Total Lines: 644
Total Bytes: 27543
Showing lines 1 to 100
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
1: require('dotenv').config();
2: const express = require('express');
3: const cors = require('cors');
4: const sql = require('mssql/msnodesqlv8');
5: const bcrypt = require('bcrypt');
6: const nodemailer = require('nodemailer');
7: 
8: const app = express();
9: 
10: // 🚨 [GÜVENLİK] KAMERA SİSTEMİ (Middleware)
11: app.use((req, res, next) => {
12:     console.log(`\n🚨 [KAMERA] Yeni İstek Geldi: ${req.method} ${req.url}`);
13:     next();
14: });
15: 
16: app.use(cors());
17: app.use(express.json());
18: 
19: // SQL BAĞLANTISI (Eren Karaarslan Veritabanı)
20: const dbConfig = {
21:     connectionString: 'Driver={SQL Server};Server=.\\SQLEXPRESS;Database=Kare_Koku;Trusted_Connection=yes;'
22: };
23: 
24: // 🌟 PROFESYONEL YBS MİMARİSİ: GLOBAL CONNECTION POOL 🌟
25: const poolPromise = new sql.ConnectionPool(dbConfig)
26:     .connect()
27:     .then(pool => {
28:         console.log("🟢 Mutfak (SQL) Bağlantısı Kusursuz Sağlandı!");
29:         return pool;
30:     })
31:     .catch(err => {
32:         console.error("🔴 SQL Bağlantı Hatası! Veritabanı açık mı kontrol et:", err);
33:     });
34: 
35: // ==========================================
36: // 1. KULLANICI KAYDI (REGISTER)
37: // ==========================================
38: app.post('/api/register', async (req, res) => {
39:     const { adSoyad, email, telefon, sifre } = req.body;
40:     if (!adSoyad || !email || !sifre) {
41:         return res.status(400).json({ hata: "Tüm alanları doldurun!" });
42:     }
43: 
44:     try {
45
<truncated 691 bytes>
            .input('sifre', sql.NVarChar, hashedPassword)
61:             .query('INSERT INTO Kullanicilar (AdSoyad, Email, Telefon, Sifre) VALUES (@adSoyad, @email, @telefon, @sifre)');
62: 
63:         res.status(200).json({ mesaj: "Kayıt başarıyla oluşturuldu! Giriş yapabilirsiniz." });
64:     } catch (err) {
65:         console.error("Kayıt Hatası:", err);
66:         res.status(500).json({ hata: "Veritabanı hatası!" });
67:     }
68: });
69: 
70: // ==========================================
71: // 2. KULLANICI GİRİŞİ (LOGIN)
72: // ==========================================
73: app.post('/api/login', async (req, res) => {
74:     const { email, sifre } = req.body;
75:     if (!email || !sifre) return res.status(400).json({ hata: "E-posta ve şifre zorunludur!" });
76: 
77:     try {
78:         const pool = await poolPromise;
79:         const result = await pool.request()
80:             .input('email', sql.NVarChar, email)
81:             .query('SELECT * FROM Kullanicilar WHERE Email = @email');
82: 
83:         if (result.recordset.length > 0) {
84:             const user = result.recordset[0];
85:             const isMatch = await bcrypt.compare(sifre, user.Sifre);
86:             if (isMatch) {
87:                 res.status(200).json({ mesaj: "Giriş başarılı", kullanici: user.AdSoyad, id: user.KullaniciID });
88:             } else {
89:                 res.status(401).json({ hata: "E-posta veya şifre hatalı!" });
90:             }
91:         } else {
92:             res.status(401).json({ hata: "E-posta veya şifre hatalı!" });
93:         }
94:     } catch (err) {
95:         console.error("Giriş Hatası:", err);
96:         res.status(500).json({ hata: "Veritabanı hatası!" });
97:     }
98: });
99: 
100: // ==========================================
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
