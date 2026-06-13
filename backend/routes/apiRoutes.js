module.exports = function(app, sql, poolPromise, bcrypt, jwt, JWT_SECRET, nodemailer, verifyToken, isAdmin) {
// 1. KULLANICI KAYDI (REGISTER)
// ==========================================
app.post('/api/register', async (req, res) => {
    const { adSoyad, email, telefon, sifre } = req.body;
    if (!adSoyad || !email || !sifre) {
        return res.status(400).json({ hata: "Tüm alanları doldurun!" });
    }

    try {
        const pool = await poolPromise; 
        const checkUser = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Kullanicilar WHERE Email = @email');

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ hata: "Bu e-posta adresi zaten kullanılıyor!" });
        }

        const hashedPassword = await bcrypt.hash(sifre, 10);

        const onayKodu = Math.floor(100000 + Math.random() * 900000).toString();

        await pool.request()
            .input('adSoyad', sql.NVarChar, adSoyad)
            .input('email', sql.NVarChar, email)
            .input('telefon', sql.NVarChar, telefon || null)
            .input('sifre', sql.NVarChar, hashedPassword)
            .input('onayKodu', sql.NVarChar, onayKodu)
            .query('INSERT INTO Kullanicilar (AdSoyad, Email, Telefon, Sifre, MailOnayliMi, OnayKodu) VALUES (@adSoyad, @email, @telefon, @sifre, 0, @onayKodu)');

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        
        let mailOptions = {
            from: '"KareKoku Destek" <infokarekoku@gmail.com>',
            to: email,
            subject: 'Karekoku Üyelik Onay Kodu',
            html: `<h1>Merhaba ${adSoyad},</h1>
                   <p>Aramıza hoş geldiniz! Hesabınızı aktifleştirmek için onay kodunuz:</p>
                   <h2 style="color: #cca76a; font-size: 32px; letter-spacing: 5px;">${onayKodu}</h2>
                   <p>Bu kodu ekrandaki kutucuğa girerek alışverişe başlayabilirsiniz.</p>`
        };
        await transporter.sendMail(mailOptions);

        res.status(200).json({ mesaj: "Kayıt başarılı! Lütfen e-postanıza gelen onay kodunu girin.", requireOtp: true, tempEmail: email });
    } catch (err) {
        console.error("Kayıt Hatası:", err);
        res.status(500).json({ hata: "Veritabanı hatası!" });
    }
});

// ==========================================
// 2. KULLANICI GİRİŞİ (LOGIN)
// ==========================================
app.post('/api/login', async (req, res) => {
    const { email, sifre } = req.body;
    if (!email || !sifre) return res.status(400).json({ hata: "E-posta ve şifre zorunludur!" });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM Kullanicilar WHERE Email = @email');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const isMatch = await bcrypt.compare(sifre, user.Sifre);
            if (isMatch) {
                if (user.MailOnayliMi === false || user.MailOnayliMi === 0) {
                    return res.status(403).json({ hata: "Hesabınız henüz onaylanmamış! Lütfen e-posta adresinizi doğrulayın.", requireOtp: true, tempEmail: user.Email });
                }
                const token = jwt.sign({ id: user.KullaniciID, email: user.Email, rol: user.Yetki || 'User' }, JWT_SECRET, { expiresIn: '7d' });
                res.cookie('kareToken', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
                res.status(200).json({ mesaj: "Giriş başarılı", kullanici: user.AdSoyad, id: user.KullaniciID, token: token, rol: user.Yetki || 'User' });
            } else {
                res.status(401).json({ hata: "E-posta veya şifre hatalı!" });
            }
        } else {
            res.status(401).json({ hata: "E-posta veya şifre hatalı!" });
        }
    } catch (err) {
        console.error("Giriş Hatası:", err);
        res.status(500).json({ hata: "Veritabanı hatası!" });
    }
});

// ==========================================
// 2.1 OTP DOĞRULAMA & YENİDEN GÖNDERME
// ==========================================
app.post('/api/verify-register-otp', async (req, res) => {
    const { email, kod } = req.body;
    if (!email || !kod) return res.status(400).json({ hata: "Bilgiler eksik!" });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT OnayKodu FROM Kullanicilar WHERE Email = @email');

        if (result.recordset.length === 0) return res.status(404).json({ hata: "Kullanıcı bulunamadı!" });

        if (result.recordset[0].OnayKodu === kod) {
            await pool.request()
                .input('email', sql.NVarChar, email)
                .query('UPDATE Kullanicilar SET MailOnayliMi = 1, OnayKodu = NULL WHERE Email = @email');
            res.status(200).json({ mesaj: "Hesabınız başarıyla onaylandı!" });
        } else {
            res.status(400).json({ hata: "Hatalı doğrulama kodu!" });
        }
    } catch (err) {
        console.error("OTP Doğrulama Hatası:", err);
        res.status(500).json({ hata: "Sunucu hatası!" });
    }
});

app.post('/api/resend-register-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ hata: "E-posta eksik!" });

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT AdSoyad, MailOnayliMi FROM Kullanicilar WHERE Email = @email');

        if (result.recordset.length === 0) return res.status(404).json({ hata: "Kullanıcı bulunamadı!" });
        if (result.recordset[0].MailOnayliMi) return res.status(400).json({ hata: "Hesabınız zaten onaylı!" });

        const adSoyad = result.recordset[0].AdSoyad;
        const onayKodu = Math.floor(100000 + Math.random() * 900000).toString();

        await pool.request()
            .input('email', sql.NVarChar, email)
            .input('kod', sql.NVarChar, onayKodu)
            .query('UPDATE Kullanicilar SET OnayKodu = @kod WHERE Email = @email');

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
        
        let mailOptions = {
            from: '"KareKoku Destek" <infokarekoku@gmail.com>',
            to: email,
            subject: 'Karekoku Üyelik Onay Kodu (Yeni)',
            html: `<h1>Merhaba ${adSoyad},</h1>
                   <p>Yeni onay kodunuz aşağıdadır:</p>
                   <h2 style="color: #cca76a; font-size: 32px; letter-spacing: 5px;">${onayKodu}</h2>`
        };
        await transporter.sendMail(mailOptions);
        
        res.status(200).json({ mesaj: "Yeni doğrulama kodu e-posta adresinize gönderildi!" });
    } catch (err) {
        console.error("OTP Yeniden Gönderme Hatası:", err);
        res.status(500).json({ hata: "Sunucu hatası!" });
    }
});

// ==========================================
// 3. VİTRİNE ÜRÜN GÖNDER (GET PARFÜMLER)
// ==========================================
app.get('/api/parfumler', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT * FROM Parfumler");
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Parfüm Çekme Hatası:", err);
        res.status(500).json({ hata: "Veritabanı Hatası!" });
    }
});

// ==========================================
// 4. KUPON KODU DOĞRULAMA 
// ==========================================
app.post('/api/kupon', async (req, res) => {
    const { kod } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('kod', sql.NVarChar, kod)
            .query("SELECT * FROM Kuponlar WHERE Kod = @kod");

        if(result.recordset.length > 0) {
            const kupon = result.recordset[0];
            
            if (kupon.Durum !== 'Aktif' || kupon.KullanilanMiktar >= kupon.KullanimSiniri) {
                return res.status(400).json({ hata: "Bu kupon kullanılmış veya artık geçerli değil!" });
            }
            if (new Date(kupon.BitisTarihi) < new Date()) {
                return res.status(400).json({ hata: "Bu kuponun süresi dolmuş!" });
            }

            res.status(200).json({ 
                mesaj: "Kupon uygulandı!", 
                tip: kupon.IndirimTipi, 
                deger: kupon.IndirimDegeri 
            });
        } else {
            res.status(404).json({ hata: "Geçersiz kupon kodu!" });
        }
    } catch (err) {
        console.error("Kupon Hatası:", err);
        res.status(500).json({ hata: "Sunucu hatası!" });
    }
});

// ==========================================
// 5. SİPARİŞ KAYDI (TRANSACTION)
// ==========================================
app.post('/api/siparis', async (req, res) => {
    const { kullaniciID, siparisNo, adSoyad, telefon, sehir, ilce, mahalle, acikAdres, toplamTutar, sepet, kuponKodu } = req.body;

    try {
        const pool = await poolPromise; 
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            let requestAdres = new sql.Request(transaction); 
            let checkAdresRes = await requestAdres
        .input('KullaniciID', sql.Int, kullaniciID) 
        .input('Sehir', sql.NVarChar, sehir)
        .input('Ilce', sql.NVarChar, ilce)
        .input('Mahalle', sql.NVarChar, mahalle || 'Belirtilmedi')
        .input('AcikAdres', sql.NVarChar, acikAdres)
        .query(`SELECT AdresID FROM Adres_Tablosu 
                WHERE KullaniciID = @KullaniciID AND Sehir = @Sehir AND Ilce = @Ilce 
                AND Mahalle = @Mahalle AND AcikAdres = @AcikAdres`);
                
    let adresID;
    if (checkAdresRes.recordset.length > 0) {
        adresID = checkAdresRes.recordset[0].AdresID;
    } else {
        let insertAdres = new sql.Request(transaction);
        let adresRes = await insertAdres
            .input('KullaniciID', sql.Int, kullaniciID) 
            .input('Sehir', sql.NVarChar, sehir)
            .input('Ilce', sql.NVarChar, ilce)
            .input('Mahalle', sql.NVarChar, mahalle || 'Belirtilmedi')
            .input('AcikAdres', sql.NVarChar, acikAdres)
            .query(`INSERT INTO Adres_Tablosu (KullaniciID, Sehir, Ilce, Mahalle, AcikAdres) 
                    OUTPUT INSERTED.AdresID VALUES (@KullaniciID, @Sehir, @Ilce, @Mahalle, @AcikAdres)`);
        adresID = adresRes.recordset[0].AdresID;
    }

            let requestSiparis = new sql.Request(transaction);
            let siparisRes = await requestSiparis
                .input('KullaniciID', sql.Int, kullaniciID)
                .input('AdresID', sql.Int, adresID)
                .input('PersonelID', sql.Int, 2) 
                .input('ToplamTutar', sql.Decimal(15,2), toplamTutar)
                .input('SiparisDurumu', sql.NVarChar, 'Yeni')
                .query(`INSERT INTO Siparisler (KullaniciID, AdresID, PersonelID, ToplamTutar, SiparisDurumu, SiparisTarihi) 
                        OUTPUT INSERTED.SiparisID VALUES (@KullaniciID, @AdresID, @PersonelID, @ToplamTutar, @SiparisDurumu, GETDATE())`);
            let siparisID = siparisRes.recordset[0].SiparisID;

            for (let urun of sepet) {
                let requestStok = new sql.Request(transaction);

                let stokKontrolRes = await requestStok
                    .input('CheckParfumID', sql.Int, urun.id)
                    .query('SELECT Kalan_Stok_ml, Ad FROM Parfumler WHERE ParfumID = @CheckParfumID');

                let mevcutStok = stokKontrolRes.recordset[0].Kalan_Stok_ml;
                let parfumAdi = stokKontrolRes.recordset[0].Ad;
                let istenenMiktar = urun.ml * urun.adet;

                if (mevcutStok < istenenMiktar) {
                    throw new Error(`${parfumAdi} için yeterli stok bulunmuyor! (Mevcut: ${mevcutStok}ml)`);
                }

                let requestFiyat = new sql.Request(transaction);
                let satisFiyatRes = await requestFiyat
                    .input('ParfumID', sql.Int, urun.id)
                    .input('Hacim', sql.Int, urun.ml)
                    .query('SELECT SatisID FROM Parfum_Fiyatlari WHERE ParfumID = @ParfumID AND Hacim_ml = @Hacim');
                
                let finalSatisID; 
                if (satisFiyatRes.recordset.length > 0) {
                    finalSatisID = satisFiyatRes.recordset[0].SatisID;
                } else {
                    let requestInsertSatis = new sql.Request(transaction);
                    let insertSatis = await requestInsertSatis
                        .input('ParfumID2', sql.Int, urun.id)
                        .input('Hacim2', sql.Int, urun.ml)
                        .input('Fiyat2', sql.Decimal(10,2), urun.fiyat)
                        .query(`INSERT INTO Parfum_Fiyatlari (ParfumID, Hacim_ml, SatisFiyati) 
                                OUTPUT INSERTED.SatisID VALUES (@ParfumID2, @Hacim2, @Fiyat2)`);
                    finalSatisID = insertSatis.recordset[0].SatisID;
                }

                let requestDetay = new sql.Request(transaction);
                await requestDetay
                    .input('SiparisID', sql.Int, siparisID)
                    .input('SatisID', sql.Int, finalSatisID)
                    .input('Adet', sql.Int, urun.adet)
                    .input('SatisFiyati', sql.Decimal(10,2), urun.fiyat)
                    .input('Maliyet', sql.Decimal(10,2), 0)
                    .query(`INSERT INTO Siparis_Detay (SiparisID, SatisID, Adet, SatisFiyati, SatisAnlikMaliyet) 
                            VALUES (@SiparisID, @SatisID, @Adet, @SatisFiyati, @Maliyet)`);

                let requestUpdateStok = new sql.Request(transaction);
                await requestUpdateStok
                    .input('Dusulecek', sql.Int, (urun.ml * urun.adet))
                    .input('ParfumID3', sql.Int, urun.id)
                    .query(`UPDATE Parfumler SET Kalan_Stok_ml = Kalan_Stok_ml - @Dusulecek WHERE ParfumID = @ParfumID3`);
            }

            let requestOdeme = new sql.Request(transaction);
            await requestOdeme
                .input('SiparisID', sql.Int, siparisID)
                .input('PayTR', sql.NVarChar, siparisNo)
                .input('Komisyon', sql.Decimal(10,2), (toplamTutar * 0.02))
                .input('Durum', sql.NVarChar, 'Başarılı')
                .query(`INSERT INTO Odeme_Detay (SiparisID, PayTR_IslemNo, KomisyonKesinti, Durum) 
                        VALUES (@SiparisID, @PayTR, @Komisyon, @Durum)`);

            if (kuponKodu) {
                let requestKupon = new sql.Request(transaction);
                await requestKupon
                    .input('kod', sql.NVarChar, kuponKodu)
                    .query(`UPDATE Kuponlar 
                            SET KullanilanMiktar = KullanilanMiktar + 1,
                                Durum = CASE WHEN KullanilanMiktar + 1 >= KullanimSiniri THEN 'Kullanıldı' ELSE Durum END
                            WHERE Kod = @kod`);
            }

            await transaction.commit();
            res.status(200).json({ mesaj: "Siparişiniz başarıyla alındı!" });

        } catch (innerErr) {
            await transaction.rollback();
            console.error("SQL Transaction Hatası:", innerErr);
            res.status(500).json({ hata: "Sipariş işlenirken veritabanı hatası oluştu: " + innerErr.message });
        }
    } catch (err) {
        console.error("Sunucu Bağlantı Hatası:", err);
        res.status(500).json({ hata: "SQL Sunucusuna bağlanılamadı!" });
    }
});

// ==========================================
// 6. GEÇMİŞ SİPARİŞLERİM
// ==========================================
app.get('/api/siparislerim/:kullaniciID', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.kullaniciID)
            .query(`
                SELECT 
                    s.SiparisID, 
                    s.ToplamTutar, 
                    s.SiparisDurumu, 
                    s.SiparisTarihi,
                    (
                        SELECT STRING_AGG(p.Ad + ' (' + CAST(pf.Hacim_ml AS VARCHAR) + 'ml)', ', ')
                        FROM Siparis_Detay sd
                        INNER JOIN Parfum_Fiyatlari pf ON sd.SatisID = pf.SatisID
                        INNER JOIN Parfumler p ON pf.ParfumID = p.ParfumID
                        WHERE sd.SiparisID = s.SiparisID
                    ) AS Urunler
                FROM Siparisler s
                WHERE s.KullaniciID = @id
                ORDER BY s.SiparisTarihi DESC
            `);

        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Siparişlerim Hatası DETAYLI:", err.message);
        res.status(500).json({ hata: "Siparişler getirilemedi. Hata: " + err.message });
    }
});

// ==========================================
// 7. KAYITLI ADRESLERİM 
// ==========================================
app.get('/api/adreslerim/:kullaniciID', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, req.params.kullaniciID)
            .query(`
                SELECT * FROM Adres_Tablosu
                WHERE KullaniciID = @id
                ORDER BY AdresID DESC
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Adreslerim Hatası:", err);
        res.status(500).json({ hata: "Adresler getirilemedi!" });
    }
});

// ==========================================
// 8. E-POSTA İLE DOĞRULAMA KODU GÖNDER VE ŞİFRE SIFIRLA
// ==========================================
const sifreSifirlamaKodlari = {};

app.post('/api/sifre-sifirla', async (req, res) => {
    const { email } = req.body;
    
    let transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS 
        }
    });

    try {
        const pool = await poolPromise;
        const user = await pool.request()
            .input('email', sql.NVarChar, email)
            .query("SELECT AdSoyad FROM Kullanicilar WHERE Email = @email");

        if (user.recordset.length > 0) {
            const ad = user.recordset[0].AdSoyad;
            const dogrulamaKodu = Math.floor(100000 + Math.random() * 900000).toString();

            sifreSifirlamaKodlari[email] = {
                kod: dogrulamaKodu,
                zaman: Date.now() + 15 * 60 * 1000 
            };
            
            let mailOptions = {
                from: '"KareKoku Destek" <infokarekoku@gmail.com>',
                to: email,
                subject: 'Karekoku Şifre Sıfırlama Kodu',
                html: `<h1>Merhaba ${ad},</h1>
                       <p>Şifrenizi sıfırlamak için 6 haneli doğrulama kodunuz aşağıdadır:</p>
                       <h2 style="color: #cca76a; font-size: 32px; letter-spacing: 5px;">${dogrulamaKodu}</h2>
                       <p>Bu kod 15 dakika boyunca geçerlidir. Kodunuzu kimseyle paylaşmayın.</p>`
            };

            await transporter.sendMail(mailOptions);
            res.json({ mesaj: "Doğrulama kodu e-posta adresinize gönderildi!" });
        } else {
            res.status(404).json({ hata: "Bu e-posta adresi sistemde kayıtlı değil!" });
        }
    } catch (err) {
        console.error("E-posta Gönderme Hatası:", err);
        res.status(500).json({ hata: "İşlem sırasında hata oluştu!" });
    }
});

app.post('/api/sifre-yeni-belirle', async (req, res) => {
    const { email, kod, yeniSifre } = req.body;

    if (!sifreSifirlamaKodlari[email]) {
        return res.status(400).json({ hata: "Geçersiz veya süresi dolmuş kod işlemi!" });
    }
    
    if (sifreSifirlamaKodlari[email].zaman < Date.now()) {
        delete sifreSifirlamaKodlari[email]; 
        return res.status(400).json({ hata: "Kodun süresi dolmuş. Lütfen tekrar kod isteyin." });
    }

    if (sifreSifirlamaKodlari[email].kod !== kod) {
        return res.status(400).json({ hata: "Hatalı doğrulama kodu girdiniz!" });
    }

    try {
        const hashedSifre = await bcrypt.hash(yeniSifre, 10);
        const pool = await poolPromise;
        await pool.request()
            .input('email', sql.NVarChar, email)
            .input('yeniSifre', sql.NVarChar, hashedSifre)
            .query("UPDATE Kullanicilar SET Sifre = @yeniSifre WHERE Email = @email");

        delete sifreSifirlamaKodlari[email];
        res.status(200).json({ mesaj: "Şifreniz başarıyla güncellendi! Giriş yapabilirsiniz." });
    } catch (err) {
        console.error("Şifre güncelleme hatası:", err);
        res.status(500).json({ hata: "Veritabanı hatası oluştu!" });
    }
});

// ==========================================
// 9. KULLANICI ŞİFRE DEĞİŞTİRME
// ==========================================
app.post('/api/sifre-degistir', async (req, res) => {
    const { kullaniciID, eskiSifre, yeniSifre } = req.body;

    if (!kullaniciID || !eskiSifre || !yeniSifre) {
        return res.status(400).json({ hata: "Lütfen eski ve yeni şifrenizi girin!" });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id', sql.Int, kullaniciID)
            .query('SELECT Sifre FROM Kullanicilar WHERE KullaniciID = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ hata: "Kullanıcı bulunamadı!" });
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(eskiSifre, user.Sifre);
        
        if (!isMatch) {
            return res.status(401).json({ hata: "Mevcut şifrenizi yanlış girdiniz!" });
        }

        const hashedYeniSifre = await bcrypt.hash(yeniSifre, 10);
        await pool.request()
            .input('id', sql.Int, kullaniciID)
            .input('yeniSifre', sql.NVarChar, hashedYeniSifre)
            .query('UPDATE Kullanicilar SET Sifre = @yeniSifre WHERE KullaniciID = @id');

        res.status(200).json({ mesaj: "Şifreniz başarıyla güncellendi!" });

    } catch (err) {
        console.error("Şifre Değiştirme Hatası:", err);
        res.status(500).json({ hata: "Veritabanı hatası!" });
    }
});

// ==========================================
// 10. YENİ ADRES EKLEME
// ==========================================
app.post('/api/adres-ekle', verifyToken, async (req, res) => {
    const kullaniciID = req.user.id;
    const { baslik, telefon, il, ilce, acikAdres } = req.body;

    if (!kullaniciID || !il || !ilce || !acikAdres) {
        return res.status(400).json({ hata: "Lütfen İl, İlçe ve Açık Adres alanlarını doldurun!" });
    }

    try {
        const pool = await poolPromise;
        
        const checkAdres = await pool.request()
            .input('KullaniciID', sql.Int, kullaniciID)
            .input('Sehir', sql.NVarChar, il)
            .input('Ilce', sql.NVarChar, ilce)
            .input('AcikAdres', sql.NVarChar, acikAdres)
            .query(`SELECT AdresID FROM Adres_Tablosu 
                    WHERE KullaniciID = @KullaniciID 
                    AND Sehir = @Sehir 
                    AND Ilce = @Ilce 
                    AND AcikAdres = @AcikAdres`);
                    
        if (checkAdres.recordset.length > 0) {
            return res.status(400).json({ hata: "Bu adres zaten kayıtlı! Aynı adresi tekrar ekleyemezsiniz." });
        }

        await pool.request()
            .input('KullaniciID', sql.Int, kullaniciID)
            .input('AdresBasligi', sql.NVarChar, baslik || 'Ev')
            .input('Telefon', sql.NVarChar, telefon || '') 
            .input('Sehir', sql.NVarChar, il)
            .input('Ilce', sql.NVarChar, ilce)
            .input('Mahalle', sql.NVarChar, 'Belirtilmedi') 
            .input('AcikAdres', sql.NVarChar, acikAdres)
            .query(`INSERT INTO Adres_Tablosu (KullaniciID, AdresBasligi, Telefon, Sehir, Ilce, Mahalle, AcikAdres) 
                    VALUES (@KullaniciID, @AdresBasligi, @Telefon, @Sehir, @Ilce, @Mahalle, @AcikAdres)`);

        res.status(200).json({ mesaj: "Yeni adresiniz başarıyla kaydedildi!" });
    } catch (err) {
        console.error("Adres Ekleme SQL Hatası:", err.message); 
        res.status(500).json({ hata: "Veritabanı Hatası: " + err.message });
    }
});

// ==========================================
// 11. ADRES SİLME 
// ==========================================
app.delete('/api/adres-sil/:adresID', verifyToken, async (req, res) => {
    try {
        const pool = await poolPromise;
        const checkSiparis = await pool.request()
            .input('id', sql.Int, req.params.adresID)
            .query("SELECT SiparisID FROM Siparisler WHERE AdresID = @id");

        if (checkSiparis.recordset.length > 0) {
             return res.status(400).json({ hata: "Bu adrese ait geçmiş siparişleriniz var. Adres silinemez!" });
        }

        await pool.request()
            .input('id', sql.Int, req.params.adresID)
            .query("DELETE FROM Adres_Tablosu WHERE AdresID = @id");
            
        res.status(200).json({ mesaj: "Adres başarıyla silindi!" });
    } catch (err) {
        console.error("Adres Silme Hatası:", err);
        res.status(500).json({ hata: "Veritabanı silme hatası!" });
    }
});

// ==========================================
// 12. PARFÜM YORUMLARINI GETİR (GET)
// ==========================================
app.get('/api/yorumlar/:parfumID', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('parfumID', sql.Int, req.params.parfumID)
            .query(`
                SELECT y.YorumID, y.YorumMetni, y.Tarih, y.Puan, k.AdSoyad 
                FROM Yorumlar y
                INNER JOIN Kullanicilar k ON y.KullaniciID = k.KullaniciID
                WHERE y.ParfumID = @parfumID
                ORDER BY y.Tarih DESC
            `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("Yorum Çekme Hatası:", err.message);
        res.status(500).json({ hata: "Yorumlar yüklenirken hata oluştu!" });
    }
});

// ==========================================
// 13. YENİ YORUM EKLE (POST)
// ==========================================
app.post('/api/yorum-ekle', async (req, res) => {
    const { parfumID, kullaniciID, yorumMetni, puan } = req.body;

    if (!parfumID || !kullaniciID || !yorumMetni) {
        return res.status(400).json({ hata: "Yorum alanı boş bırakılamaz!" });
    }

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('parfumID', sql.Int, parfumID)
            .input('kullaniciID', sql.Int, kullaniciID)
            .input('yorumMetni', sql.NVarChar, yorumMetni)
            .input('puan', sql.Int, puan || 5)
            .query(`INSERT INTO Yorumlar (ParfumID, KullaniciID, YorumMetni, Puan, Tarih) 
                    VALUES (@parfumID, @kullaniciID, @yorumMetni, @puan, GETDATE())`);

        res.status(200).json({ mesaj: "Yorumunuz başarıyla gönderildi!" });
    } catch (err) {
        console.error("Yorum Ekleme Hatası:", err.message);
        res.status(500).json({ hata: "Yorum kaydedilirken veritabanı hatası oluştu!" });
    }
});

// ==========================================
// 14. ADMIN: TÜM SİPARİŞLERİ GETİR (Süper Güvenli Form)
// ==========================================
app.get('/api/admin/siparisler', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        // 🚨 JOIN kullanmadan, verileri doğrudan alt sorguyla çekiyoruz. Müşteri silinse bile patlamaz!
        const result = await pool.request().query(`
            SELECT 
                s.SiparisID, 
                ISNULL((SELECT TOP 1 k.AdSoyad FROM Kullanicilar k WHERE k.KullaniciID = s.KullaniciID), 'Bilinmeyen Müşteri') AS AdSoyad, 
                ISNULL(s.ToplamTutar, 0) AS ToplamTutar, 
                ISNULL(s.SiparisDurumu, 'Yeni') AS SiparisDurumu, 
                ISNULL(s.SiparisTarihi, GETDATE()) AS SiparisTarihi 
            FROM Siparisler s
            ORDER BY s.SiparisTarihi DESC
        `);
        res.status(200).json(result.recordset);
    } catch (err) {
        console.error("🚨 Admin Sipariş Hatası:", err.message);
        res.status(500).json({ hata: "Siparişler çekilirken SQL hatası: " + err.message });
    }
});

// ==========================================
// 15. ADMIN: FİNANS VE ÖZET BİLGİLER
// ==========================================
app.get('/api/admin/ozet', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const gelirResult = await pool.request().query("SELECT ISNULL(SUM(ToplamTutar), 0) as ToplamGelir FROM Siparisler WHERE SiparisDurumu != 'İptal'");
        const bekleyenResult = await pool.request().query("SELECT COUNT(SiparisID) as Bekleyen FROM Siparisler WHERE SiparisDurumu IN ('Yeni', 'Hazırlanıyor')");
        
        res.status(200).json({
            ToplamGelir: gelirResult.recordset[0].ToplamGelir,
            BekleyenSiparis: bekleyenResult.recordset[0].Bekleyen,
            KritikStok: 3 
        });
    } catch (err) {
        console.error("🚨 Admin Özet Hatası:", err.message);
        res.status(500).json({ hata: "Özet çekilemedi: " + err.message });
    }
});

// ==========================================
// 16. ADMIN: STOK DURUMU
// ==========================================
app.get('/api/admin/stok', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT ParfumID, Marka, Ad FROM Parfumler ORDER BY Marka ASC`);
        res.status(200).json(result.recordset);
    } catch (err) {
        res.status(500).json({ hata: "Stok çekilemedi" });
    }
});

// ==========================================
// 17. ADMIN: SİPARİŞ DURUMU GÜNCELLEME
// ==========================================
app.post('/api/admin/siparis-guncelle', verifyToken, isAdmin, async (req, res) => {
    const { siparisID, yeniDurum } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, siparisID)
            .input('durum', sql.NVarChar, yeniDurum)
            .query("UPDATE Siparisler SET SiparisDurumu = @durum WHERE SiparisID = @id");
        res.status(200).json({ mesaj: "Güncellendi" });
    } catch (err) {
        res.status(500).json({ hata: "Güncelleme başarısız" });
    }
});

// ==========================================
// 18. FAVORİLER (WISHLIST)
// ==========================================
app.get('/api/favoriler/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('kid', sql.Int, req.params.id)
            .query("SELECT ParfumID FROM Favoriler WHERE KullaniciID = @kid");
        const list = result.recordset.map(x => x.ParfumID);
        res.status(200).json(list);
    } catch (err) {
        res.status(500).json({ hata: "Favoriler çekilemedi" });
    }
});

app.post('/api/favoriler', async (req, res) => {
    const { kullaniciID, parfumID } = req.body;
    try {
        const pool = await poolPromise;
        const check = await pool.request()
            .input('kid', sql.Int, kullaniciID)
            .input('pid', sql.Int, parfumID)
            .query("SELECT * FROM Favoriler WHERE KullaniciID = @kid AND ParfumID = @pid");
        
        if (check.recordset.length > 0) {
            await pool.request()
                .input('kid', sql.Int, kullaniciID)
                .input('pid', sql.Int, parfumID)
                .query("DELETE FROM Favoriler WHERE KullaniciID = @kid AND ParfumID = @pid");
            res.status(200).json({ isFavorite: false });
        } else {
            await pool.request()
                .input('kid', sql.Int, kullaniciID)
                .input('pid', sql.Int, parfumID)
                .query("INSERT INTO Favoriler (KullaniciID, ParfumID) VALUES (@kid, @pid)");
            res.status(200).json({ isFavorite: true });
        }
    } catch (err) {
        res.status(500).json({ hata: "Favori işlemi başarısız" });
    }
});

// ==========================================
// 19. STOK BİLDİRİMİ (GELİNCE HABER VER)
// ==========================================
app.post('/api/stok-bildirim', async (req, res) => {
    const { kullaniciID, email, parfumID } = req.body;
    try {
        const pool = await poolPromise;
        const check = await pool.request()
            .input('email', sql.NVarChar, email)
            .input('pid', sql.Int, parfumID)
            .query("SELECT * FROM StokBildirimleri WHERE Email = @email AND ParfumID = @pid AND BildirildiMi = 0");
            
        if (check.recordset.length > 0) {
            return res.status(400).json({ hata: "Bu parfüm için zaten bir talebiniz var!" });
        }

        await pool.request()
            .input('kid', sql.Int, kullaniciID || null)
            .input('email', sql.NVarChar, email)
            .input('pid', sql.Int, parfumID)
            .query("INSERT INTO StokBildirimleri (KullaniciID, Email, ParfumID) VALUES (@kid, @email, @pid)");
            
        res.status(200).json({ mesaj: "Talebiniz alındı! Stok yenilendiğinde size e-posta ile haber vereceğiz." });
    } catch (err) {
        res.status(500).json({ hata: "Talep oluşturulamadı" });
    }
});

// SUNUCUYU BAŞLAT
};
