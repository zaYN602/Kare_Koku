const fs = require('fs');
let code = fs.readFileSync('backend/routes/apiRoutes.js', 'utf8');

const target1 = `            let requestSiparis = new sql.Request(transaction);
            let siparisRes = await requestSiparis
                .input('KullaniciID', sql.Int, kullaniciID)
                .input('AdresID', sql.Int, adresID)
                .input('PersonelID', sql.Int, 2) 
                .input('ToplamTutar', sql.Decimal(15,2), toplamTutar)
                .input('SiparisDurumu', sql.NVarChar, 'Yeni')
                .query(\`INSERT INTO Siparisler (KullaniciID, AdresID, PersonelID, ToplamTutar, SiparisDurumu, SiparisTarihi) 
                        OUTPUT INSERTED.SiparisID VALUES (@KullaniciID, @AdresID, @PersonelID, @ToplamTutar, @SiparisDurumu, GETDATE())\`);
            let siparisID = siparisRes.recordset[0].SiparisID;`;

const replacement1 = `            let guvenliToplamTutar = 0;
            let indirimTipi = null;
            let indirimDegeri = 0;

            if (kuponKodu) {
                let checkKupon = new sql.Request(transaction);
                let kuponRes = await checkKupon
                    .input('kod', sql.NVarChar, kuponKodu)
                    .query("SELECT * FROM Kuponlar WHERE Kod = @kod");

                if (kuponRes.recordset.length > 0) {
                    const kupon = kuponRes.recordset[0];
                    if (kupon.Durum === 'Aktif' && kupon.KullanilanMiktar < kupon.KullanimSiniri && new Date(kupon.BitisTarihi) >= new Date()) {
                        indirimTipi = kupon.IndirimTipi;
                        indirimDegeri = kupon.IndirimDegeri;
                    } else {
                        throw new Error("Girdiğiniz kupon kodu geçersiz veya süresi dolmuş!");
                    }
                } else {
                    throw new Error("Geçersiz kupon kodu!");
                }
            }

            let requestSiparis = new sql.Request(transaction);
            let siparisRes = await requestSiparis
                .input('KullaniciID', sql.Int, kullaniciID)
                .input('AdresID', sql.Int, adresID)
                .input('PersonelID', sql.Int, 2) 
                .input('ToplamTutar', sql.Decimal(15,2), 0) // Şimdilik 0, ürünler eklenince güncelleyeceğiz
                .input('SiparisDurumu', sql.NVarChar, 'Yeni')
                .query(\`INSERT INTO Siparisler (KullaniciID, AdresID, PersonelID, ToplamTutar, SiparisDurumu, SiparisTarihi) 
                        OUTPUT INSERTED.SiparisID VALUES (@KullaniciID, @AdresID, @PersonelID, @ToplamTutar, @SiparisDurumu, GETDATE())\`);
            let siparisID = siparisRes.recordset[0].SiparisID;`;

const target2 = `                let requestFiyat = new sql.Request(transaction);
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
                        .query(\`INSERT INTO Parfum_Fiyatlari (ParfumID, Hacim_ml, SatisFiyati) 
                                OUTPUT INSERTED.SatisID VALUES (@ParfumID2, @Hacim2, @Fiyat2)\`);
                    finalSatisID = insertSatis.recordset[0].SatisID;
                }

                let requestDetay = new sql.Request(transaction);
                await requestDetay
                    .input('SiparisID', sql.Int, siparisID)
                    .input('SatisID', sql.Int, finalSatisID)
                    .input('Adet', sql.Int, urun.adet)
                    .input('SatisFiyati', sql.Decimal(10,2), urun.fiyat)
                    .input('Maliyet', sql.Decimal(10,2), 0)
                    .query(\`INSERT INTO Siparis_Detay (SiparisID, SatisID, Adet, SatisFiyati, SatisAnlikMaliyet) 
                            VALUES (@SiparisID, @SatisID, @Adet, @SatisFiyati, @Maliyet)\`);`;

const replacement2 = `                let requestFiyat = new sql.Request(transaction);
                let satisFiyatRes = await requestFiyat
                    .input('ParfumID', sql.Int, urun.id)
                    .input('Hacim', sql.Int, urun.ml)
                    .query('SELECT SatisID, SatisFiyati FROM Parfum_Fiyatlari WHERE ParfumID = @ParfumID AND Hacim_ml = @Hacim');
                
                let finalSatisID; 
                let gercekSatisFiyati;
                if (satisFiyatRes.recordset.length > 0) {
                    finalSatisID = satisFiyatRes.recordset[0].SatisID;
                    gercekSatisFiyati = satisFiyatRes.recordset[0].SatisFiyati;
                } else {
                    throw new Error(\`\${parfumAdi} için \${urun.ml}ml fiyat bilgisi sistemde bulunamadı! Lütfen yöneticiye bildirin.\`);
                }

                guvenliToplamTutar += gercekSatisFiyati * urun.adet;

                let requestDetay = new sql.Request(transaction);
                await requestDetay
                    .input('SiparisID', sql.Int, siparisID)
                    .input('SatisID', sql.Int, finalSatisID)
                    .input('Adet', sql.Int, urun.adet)
                    .input('SatisFiyati', sql.Decimal(10,2), gercekSatisFiyati)
                    .input('Maliyet', sql.Decimal(10,2), 0)
                    .query(\`INSERT INTO Siparis_Detay (SiparisID, SatisID, Adet, SatisFiyati, SatisAnlikMaliyet) 
                            VALUES (@SiparisID, @SatisID, @Adet, @SatisFiyati, @Maliyet)\`);`;

const target3 = `            let requestOdeme = new sql.Request(transaction);
            await requestOdeme
                .input('SiparisID', sql.Int, siparisID)
                .input('PayTR', sql.NVarChar, siparisNo)
                .input('Komisyon', sql.Decimal(10,2), (toplamTutar * 0.02))
                .input('Durum', sql.NVarChar, 'Başarılı')
                .query(\`INSERT INTO Odeme_Detay (SiparisID, PayTR_IslemNo, KomisyonKesinti, Durum) 
                        VALUES (@SiparisID, @PayTR, @Komisyon, @Durum)\`);`;

const replacement3 = `            // Kupon indirimini güvenli toplam tutara uygula
            if (indirimTipi === 'Yüzde') {
                guvenliToplamTutar = guvenliToplamTutar - (guvenliToplamTutar * indirimDegeri / 100);
            } else if (indirimTipi === 'Tutar') {
                guvenliToplamTutar = guvenliToplamTutar - indirimDegeri;
            }
            if (guvenliToplamTutar < 0) guvenliToplamTutar = 0;

            // Siparişteki Toplam Tutar alanını GÜVENLİ tutarla güncelle
            let requestUpdateSiparis = new sql.Request(transaction);
            await requestUpdateSiparis
                .input('SiparisID', sql.Int, siparisID)
                .input('GercekTutar', sql.Decimal(15,2), guvenliToplamTutar)
                .query(\`UPDATE Siparisler SET ToplamTutar = @GercekTutar WHERE SiparisID = @SiparisID\`);

            let requestOdeme = new sql.Request(transaction);
            await requestOdeme
                .input('SiparisID', sql.Int, siparisID)
                .input('PayTR', sql.NVarChar, siparisNo)
                .input('Komisyon', sql.Decimal(10,2), (guvenliToplamTutar * 0.02))
                .input('Durum', sql.NVarChar, 'Başarılı')
                .query(\`INSERT INTO Odeme_Detay (SiparisID, PayTR_IslemNo, KomisyonKesinti, Durum) 
                        VALUES (@SiparisID, @PayTR, @Komisyon, @Durum)\`);`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);

fs.writeFileSync('backend/routes/apiRoutes.js', code);
console.log('Price Tampering fixes applied.');
