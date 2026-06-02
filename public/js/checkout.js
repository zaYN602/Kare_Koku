// --- ÖDEME EKRANI (CHECKOUT) ---
window.openCheckout = function() {
    if (!KareState.sepet || KareState.sepet.length === 0) { showToast("Sepetiniz boş, lütfen önce ürün ekleyin!", true); return; }
    if (!KareState.aktifKullanici) { showToast("Sipariş verebilmek için lütfen önce giriş yapın!", true); closeAllDrawers(); toggleLogin(); return; }

    // 🌟 ÖN YÜZ GÜMRÜK KONTROLÜ: Ödeme ekranı açılmadan önce sepetteki her şeyi canlı stokla eşleştiriyoruz
    for (let item of KareState.sepet) {
        const p = KareState.db.find(x => String(x.id) === String(item.id));
        if (p) {
            // Bu ürünün sepetteki toplam ml miktarını hesapla
            const toplamIstenenMl = KareState.sepet
                .filter(x => String(x.id) === String(item.id))
                .reduce((toplam, x) => toplam + (x.ml * x.adet), 0);
            
            // Eğer sepette kalan miktar veritabanındaki canlı stoğu aşıyorsa siperi alıyoruz
            if (toplamIstenenMl > p.kalanStok) {
                showToast(`❌ Yetersiz Stok! Sepetinizdeki ${item.ad} miktarı (${toplamIstenenMl}ml), güncel stok miktarını (${p.kalanStok}ml) aşıyor! Lütfen sepetinizi güncelleyin.`, true);
                toggleDrawer('cartDrawer'); // Sepet çekmecesini aç ki kullanıcı ürünü görebilsin
                return; // Ödeme ekranını AÇMA, işlemi burada kilitle!
            }
        }
    }

    // Eğer tüm ürünlerin stoğu sağlamsa ödeme sihirbazı güvenle açılır:
    document.getElementById('adresAd').value = KareState.aktifKullanici; 
    closeAllDrawers();
    document.getElementById('checkoutOverlay').style.display = 'flex';
    document.getElementById('step1-address').style.display = 'block';
    document.getElementById('step2-payment').style.display = 'none';
    document.getElementById('step3-success').style.display = 'none';
};

window.closeCheckout = function() { 
    document.getElementById('checkoutOverlay').style.display = 'none';
    const onayBtn = document.getElementById('odemeOnayBtn');
    if(onayBtn) { onayBtn.disabled = false; onayBtn.innerText = 'ÖDEMEYİ ONAYLA'; }
};

window.kuponUygula = async function() {
    const kod = document.getElementById('kuponKoduInput').value.trim().toUpperCase();
    if(!kod) { showToast("Lütfen bir kupon kodu giriniz!", true); return; }

    let genelToplam = KareState.sepet.reduce((t, item) => t + (item.fiyat * item.adet), 0);

    showToast("Kupon kontrol ediliyor...", false);

    try {
        const response = await apiFetch(`${KareState.API_URL}/api/kupon`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ kod: kod }) 
        });
        const data = await response.json();
        if(response.ok) {
            // Sepet alt limit kontrolü (Tutar indirimleri için)
            if (data.tip === 'Tutar' && genelToplam < data.deger * 2) {
                showToast(`❌ Bu kuponu kullanabilmek için KareState.sepet tutarınız en az ${data.deger * 2} TL olmalıdır!`, true);
                return;
            }

            KareState.uygulananKupon = { kod: kod, tip: data.tip, deger: data.deger };
            let mesaj = data.tip === 'Yuzde' ? `%${data.deger} İndirim` : `${data.deger} TL Nakit İndirim`;
            showToast(`✅ ${data.mesaj} (${mesaj})`);
            goToPayment(); 
        } else {
            KareState.uygulananKupon = null;
            showToast("❌ " + data.hata, true);
        }
    } catch(e) {
        showToast("❌ Sunucuya bağlanılamadı!", true);
    }
};

window.kuponIptal = function() {
    KareState.uygulananKupon = null;
    if(document.getElementById('kuponKoduInput')) document.getElementById('kuponKoduInput').value = '';
    showToast("Kupon iptal edildi.");
    goToPayment();
};

window.formatSKT = function(input) {
    let val = input.value.replace(/[^0-9]/g, ''); 
    if (val.length >= 2) {
        let ay = val.substring(0, 2);
        if (parseInt(ay) > 12) ay = '12'; 
        if (ay === '00') ay = '01';       
        let yil = val.substring(2, 4);
        val = ay + (yil.length > 0 ? '/' + yil : ''); 
    }
    input.value = val;
};

window.goToPayment = function() {
    const ad = document.getElementById('adresAd').value;
    const tel = document.getElementById('adresTel').value;
    const il = document.getElementById('adresIl').value;
    const ilce = document.getElementById('adresIlce').value;
    const detay = document.getElementById('adresDetay').value;

    if(!ad || !tel || tel.length < 10 || !il || !ilce || !detay) { showToast("Lütfen teslimat adresini eksiksiz doldurun! (Telefon en az 10 hane olmalı)", true); return; }

    let genelToplam = 0;
    let ozetHTML = `<div style="border-bottom:1px solid var(--border); padding-bottom:10px; margin-bottom:10px;">`;
    
    KareState.sepet.forEach(item => {
        genelToplam += item.fiyat * item.adet;
        ozetHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:var(--muted);">
                <span>${item.adet}x ${item.ad} (${item.ml}ml)</span>
                <span style="color:var(--text);">${formatTL(item.fiyat * item.adet)}</span>
            </div>`;
    });
    ozetHTML += `</div>`;

    let indirimMiktari = 0;
    if(KareState.uygulananKupon) {
        if(KareState.uygulananKupon.tip === 'Yuzde') {
            indirimMiktari = (genelToplam * KareState.uygulananKupon.deger) / 100;
            ozetHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:var(--active-theme); font-weight: 600;">
                <span>Kupon (${KareState.uygulananKupon.kod} - %${KareState.uygulananKupon.deger}): <button onclick="kuponIptal()" style="background:none; border:none; color:#ef4444; font-size:11px; cursor:pointer; text-decoration:underline; font-weight:bold;">İptal Et</button></span>
                <span>-${formatTL(indirimMiktari)}</span>
            </div>`;
        } else if (KareState.uygulananKupon.tip === 'Tutar') {
            indirimMiktari = KareState.uygulananKupon.deger;
            // Güvenlik: İndirim KareState.sepet toplamını asla aşamaz (Alt limit kontrolü yukarıda var ama garanti olsun)
            if(indirimMiktari > genelToplam) indirimMiktari = genelToplam; 
            ozetHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:var(--active-theme); font-weight: 600;">
                <span>Kupon (${KareState.uygulananKupon.kod} - ${KareState.uygulananKupon.deger} TL): <button onclick="kuponIptal()" style="background:none; border:none; color:#ef4444; font-size:11px; cursor:pointer; text-decoration:underline; font-weight:bold;">İptal Et</button></span>
                <span>-${formatTL(indirimMiktari)}</span>
            </div>`;
        }
    }

    let indirimliToplam = genelToplam - indirimMiktari;
    let kargoUcreti = (indirimliToplam >= 2000) ? 0 : 95;
    let kargoYazisi = `<span style="color:var(--text);">${formatTL(95)}</span>`;
    
    if(kargoUcreti === 0) {
        kargoYazisi = `<span style="text-decoration:line-through; color:var(--muted); margin-right:8px;">${formatTL(95)}</span><span style="color:var(--active-theme); font-weight:bold;">0,00 ₺</span>`;
    }

    const odenecekTutar = indirimliToplam + kargoUcreti;

    ozetHTML += `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:var(--muted);">
            <span>Ara Toplam:</span>
            <span style="color:var(--text);">${formatTL(indirimliToplam)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; margin-bottom:15px; color:var(--muted);">
            <span>Kargo Ücreti:</span>
            <div>${kargoYazisi}</div>
        </div>
        <div style="display:flex; justify-content:space-between; padding-top:10px; border-top:1px dashed var(--border); font-size:18px; font-weight:900; color:var(--active-theme);">
            <span>GENEL TOPLAM:</span>
            <span>${formatTL(odenecekTutar)}</span>
        </div>
    `;

    document.getElementById('orderSummaryBox').innerHTML = ozetHTML;
    document.getElementById('step1-address').style.display = 'none';
    document.getElementById('step2-payment').style.display = 'block';
};

window.backToAddress = function() {
    document.getElementById('step2-payment').style.display = 'none';
    document.getElementById('step1-address').style.display = 'block';
};

window.odemeYap = async function() {
    const kartIsim = document.getElementById('kartIsim').value;
    const kartNo = document.getElementById('kartNo').value;
    const skt = document.getElementById('kartSKT').value;
    const cvv = document.getElementById('kartCVV').value;

    let yilGecerli = false;
    let tarih = new Date();
    let guncelYil = parseInt(tarih.getFullYear().toString().slice(-2)); 
    let guncelAy = tarih.getMonth() + 1;       

    if(skt.length === 5 && skt.includes('/')) {
        let ayPart = parseInt(skt.split('/')[0]);
        let yilPart = parseInt(skt.split('/')[1]);
        
        if (ayPart > 0 && ayPart <= 12) {
            if (yilPart > guncelYil && yilPart <= 40) { yilGecerli = true; } 
            else if (yilPart === guncelYil && ayPart >= guncelAy) { yilGecerli = true; }
        }
    }

    if(!yilGecerli) { showToast("Geçersiz SKT! Kartın son kullanma tarihi geçmiş olamaz.", true); return; }
    if(!kartIsim || kartNo.length < 15 || cvv.length < 3) { showToast("Lütfen kart bilgilerinizi eksiksiz giriniz!", true); return; }

    const onayBtn = document.getElementById('odemeOnayBtn');
    onayBtn.disabled = true;
    onayBtn.innerText = "İŞLEM YAPILIYOR...";

    const ad = document.getElementById('adresAd').value;
    const tel = document.getElementById('adresTel').value;
    const il = document.getElementById('adresIl').value;
    const ilce = document.getElementById('adresIlce').value;
    const detay = document.getElementById('adresDetay').value;

    let genelToplam = 0;
    KareState.sepet.forEach(item => genelToplam += item.fiyat * item.adet);
    
    let indirimMiktari = 0;
    if(KareState.uygulananKupon) {
        if(KareState.uygulananKupon.tip === 'Yuzde') indirimMiktari = (genelToplam * KareState.uygulananKupon.deger) / 100;
        else if (KareState.uygulananKupon.tip === 'Tutar') indirimMiktari = KareState.uygulananKupon.deger > genelToplam ? genelToplam : KareState.uygulananKupon.deger;
    }
    
    let indirimliToplam = genelToplam - indirimMiktari;
    let kargoUcreti = (indirimliToplam >= 2000) ? 0 : 95;
    let odenecekTutar = indirimliToplam + kargoUcreti;

    const siparisNo = "KARE-" + Math.floor(100000 + Math.random() * 900000);

    showToast("Ödemeniz bankadan onaylanıyor...", false);
    
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/siparis`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                kullaniciID: KareState.aktifKullaniciID, 
                siparisNo: siparisNo,
                adSoyad: KareState.aktifKullanici, 
                telefon: tel,
                sehir: il,
                ilce: ilce,
                mahalle: "Belirtilmedi", 
                acikAdres: detay,
                toplamTutar: odenecekTutar,
                sepet: KareState.sepet,
                kuponKodu: KareState.uygulananKupon ? KareState.uygulananKupon.kod : null 
            }) 
        });

        if(response.ok) {
            showToast("✅ Sipariş Başarılı! Yönlendiriliyorsunuz...", false);
            
            setTimeout(() => {
                document.getElementById('siparisNoText').innerText = siparisNo;
                document.getElementById('step2-payment').style.display = 'none';
                document.getElementById('step3-success').style.display = 'block';
                
                KareState.sepet = [];
                KareState.uygulananKupon = null; 
                localStorage.setItem('kareSepet', JSON.stringify(KareState.sepet));
                if(document.getElementById('sepetSayaci')) document.getElementById('sepetSayaci').innerText = "0";
                renderCart();
                
                onayBtn.disabled = false;
                onayBtn.innerText = "ÖDEMEYİ ONAYLA";
                
                siparisleriGetir();
            }, 2500);
        } else {
            const data = await response.json();
            showToast("❌ " + data.hata, true);
        }
    } catch(e) {
        showToast("❌ SQL Sunucuya ulaşılamadı!", true);
    } finally {
        onayBtn.disabled = false;
        onayBtn.innerText = "ÖDEMEYİ ONAYLA";
    }
};

window.finishOrder = function() {
    closeCheckout();
    document.getElementById('step3-success').style.display = 'none';
    document.getElementById('step1-address').style.display = 'block';
    // Form inputlarını sıfırla
    ['adresTel','adresIl','adresIlce','adresDetay','kartIsim','kartNo','kartSKT','kartCVV','kuponKoduInput'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
    KareState.uygulananKupon = null;
};

// --- HESABIM SEKMELERİ VE SQL BAĞLANTILARI ---
window.hesapTabGoster = function(tabAdi, event) {
    document.getElementById('tab-siparisler').style.display = 'none';
    document.getElementById('tab-adreslerim').style.display = 'none';
    document.getElementById('tab-kartlarim').style.display = 'none';
    document.getElementById('tab-guvenlik').style.display = 'none';
    document.getElementById('tab-' + tabAdi).style.display = 'block';
    document.querySelectorAll('.account-menu-item').forEach(el => el.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
};

window.siparisleriGetir = async function() {
    const container = document.getElementById('siparisListesiTab');
    if (!container) return; 
    container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--muted);">⏳ Siparişleriniz SQL Veritabanından Çekiliyor...</td></tr>';
    
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/siparislerim`, { credentials: 'include' });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.hata || "API Hatası");
        }
        
        const siparisler = await response.json();
        
        if (!Array.isArray(siparisler) || siparisler.length === 0) {
            container.innerHTML = `
            <tr><td colspan="5" style="text-align: center; padding: 50px 20px;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 15px;">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
                <p style="color:var(--text); font-weight:600; font-size:16px; margin-bottom:5px;">Henüz Siparişiniz Yok</p>
                <p style="color:var(--muted); font-size:13px;">Lüks kokularımızla tanışmak için mağazayı ziyaret edin.</p>
            </td></tr>`;
        } else {
            container.innerHTML = siparisler.map(s => {
                let durumRenk = "var(--muted)"; 
                let durumMetin = "var(--text)";
                
                if(s.SiparisDurumu === "Yeni" || s.SiparisDurumu === "Hazırlanıyor") { 
                    durumRenk = "rgba(255, 107, 53, 0.1)"; 
                    durumMetin = "var(--orange)"; 
                } else if (s.SiparisDurumu === "Kargolandı" || s.SiparisDurumu === "Teslim Edildi" || s.SiparisDurumu === "Başarılı") { 
                    durumRenk = "rgba(204, 167, 106, 0.1)"; 
                    durumMetin = "var(--active-theme)"; 
                }
                
                let urunIsimleri = s.Urunler ? s.Urunler : "Ürün detayı alınamadı";
                let tarih = s.SiparisTarihi ? new Date(s.SiparisTarihi).toLocaleDateString('tr-TR') : "Tarih Yok";

                return `
                <tr style="border-bottom: 1px solid var(--border); transition: 0.3s;" onmouseover="this.style.backgroundColor='rgba(204, 167, 106, 0.05)'" onmouseout="this.style.backgroundColor='transparent'">
                    <td style="padding: 15px 10px; font-weight: bold; color: var(--text);">#${s.SiparisID}</td>
                    <td style="padding: 15px 10px; color: var(--muted);">${tarih}</td>
                    <td style="padding: 15px 10px; color: var(--text); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${urunIsimleri}">${urunIsimleri}</td>
                    <td style="padding: 15px 10px; font-weight: 800; color: var(--text);">${formatTL(s.ToplamTutar)}</td>
                    <td style="padding: 15px 10px;"><span style="background: ${durumRenk}; color: ${durumMetin}; padding: 4px 10px; border-radius: 15px; font-size: 11px; font-weight: bold; border: 1px solid ${durumMetin};">${s.SiparisDurumu}</span></td>
                </tr>`;
            }).join('');
        }
    } catch (e) { 
        container.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: #ef4444;">Siparişler yüklenemedi: ${e.message}</td></tr>`;
    }
};

window.adresleriGetir = async function() {
    const container = document.getElementById('adresListesiContainer');
    if (!container) return;
    container.innerHTML = '<p style="color:var(--muted); text-align:center;">Adresleriniz SQL Veritabanından çekiliyor...</p>';
    
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/adreslerim`, { credentials: 'include' });
        if (!response.ok) throw new Error("API Hatası");
        
        const adresler = await response.json();
        
        if (adresler.length === 0) {
            container.innerHTML = '<p style="color:var(--muted); text-align:center;">Kayıtlı adresiniz bulunmuyor.</p>';
        } else {
            container.innerHTML = adresler.map(a => `
                <div style="border: 1px solid var(--border); border-radius: 8px; padding: 20px; background: var(--bg);">
                    <div style="display: flex; justify-content: space-between;">
                        <strong style="color: var(--active-theme);">${a.AdresBasligi || 'Kayıtlı Adres'}</strong>
                        <span onclick="adresSil(${a.AdresID})" style="font-size: 12px; color: #ef4444; cursor: pointer; font-weight: bold;">[ Sil ]</span>
                    </div>
                    <p style="color: var(--text); font-size: 13px; line-height: 1.5;">
                        ${KareState.aktifKullanici}<br>
                        ${a.Telefon || ''}<br>
                        ${a.AcikAdres} ${a.Mahalle ? a.Mahalle : ''}, ${a.Ilce} / ${a.Sehir}
                    </p>
                </div>
            `).join('');
        }
    } catch (e) {
        container.innerHTML = '<p style="color:var(--muted); text-align:center;">Adresler getirilemedi. Node.js sunucusunu kontrol edin.</p>';
    }
};

window.adresSil = async function(adresID) {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    
    showToast("Adres siliniyor...", false);
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/adres-sil/${adresID}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        if (response.ok) {
            showToast("✅ Adres başarıyla silindi!");
            adresleriGetir(); 
        } else {
            showToast("❌ " + data.hata, true);
        }
    } catch (err) {
        showToast("❌ Sunucuya bağlanılamadı!", true);
    }
};

window.kartlariGetir = function() {
    const container = document.getElementById('kartListesiContainer');
    if(!container) return;
    
    let kartlar = JSON.parse(localStorage.getItem('kareKartlar')) || [];
    
    if(kartlar.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); font-size: 13px; margin-top:10px;">Kayıtlı kartınız bulunmuyor.</p>';
    } else {
        container.innerHTML = kartlar.map((k, index) => {
            let gizliNo = "**** **** **** " + k.no.slice(-4);
            return `
            <div style="background: linear-gradient(135deg, var(--active-theme), #1a1a1a); color: #fff; padding: 20px; border-radius: 10px; width: 100%; position: relative;">
                <button onclick="kartSil(${index})" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.5); border: none; color: #ef4444; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold; font-family: Arial;">X</button>
                <div style="font-size: 20px; margin-bottom: 15px; letter-spacing: 2px;">${gizliNo}</div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; text-transform: uppercase;">
                    <span>${k.isim}</span>
                    <span>${k.skt}</span>
                </div>
            </div>`;
        }).join('');
    }
};

window.kartSil = function(index) {
    if(!confirm("Bu kartı silmek istediğinize emin misiniz?")) return;
    let kartlar = JSON.parse(localStorage.getItem('kareKartlar')) || [];
    kartlar.splice(index, 1);
    localStorage.setItem('kareKartlar', JSON.stringify(kartlar));
    kartlariGetir();
    showToast("✅ Kart silindi.");
};

window.openAdresModal = function() { document.getElementById('adresModalOverlay').style.display = 'flex'; };
window.closeAdresModal = function() { document.getElementById('adresModalOverlay').style.display = 'none'; };

window.kaydetAdres = async function() {
    const kaydetBtn = document.querySelector('#adresModalOverlay .login-submit');
    if(kaydetBtn) kaydetBtn.disabled = true;

    const baslik = document.getElementById('yeniAdresBaslik') ? document.getElementById('yeniAdresBaslik').value.trim() : "";
    const telefon = document.getElementById('yeniAdresTel') ? document.getElementById('yeniAdresTel').value.trim() : "";
    const il = document.getElementById('yeniAdresIl') ? document.getElementById('yeniAdresIl').value.trim() : "";
    const ilce = document.getElementById('yeniAdresIlce') ? document.getElementById('yeniAdresIlce').value.trim() : "";
    const acikAdres = document.getElementById('yeniAdresDetay') ? document.getElementById('yeniAdresDetay').value.trim() : "";

    if(!il || !ilce || !acikAdres) { 
        showToast("Lütfen İl, İlçe ve Açık Adres kısımlarını doldurun!", true); 
        if(kaydetBtn) kaydetBtn.disabled = false;
        return; 
    }

    showToast("Adres kaydediliyor...", false);
    
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/adres-ekle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                kullaniciID: KareState.aktifKullaniciID, 
                baslik: baslik, 
                telefon: telefon, 
                il: il, 
                ilce: ilce, 
                acikAdres: acikAdres 
            })
        });
        
        const data = await response.json();
        
        if(response.ok) {
            showToast("✅ " + data.mesaj);
            closeAdresModal();
            
            if(document.getElementById('yeniAdresBaslik')) document.getElementById('yeniAdresBaslik').value = '';
            if(document.getElementById('yeniAdresTel')) document.getElementById('yeniAdresTel').value = '';
            document.getElementById('yeniAdresIl').value = '';
            document.getElementById('yeniAdresIlce').value = '';
            document.getElementById('yeniAdresDetay').value = '';
            
            adresleriGetir(); 
        } else {
            showToast("❌ " + data.hata, true);
        }
    } catch(e) {
        showToast("❌ Sunucuya ulaşılamadı!", true);
    } finally {
        if(kaydetBtn) kaydetBtn.disabled = false;
    }
};

window.openKartModal = function() { document.getElementById('kartModalOverlay').style.display = 'flex'; };
window.closeKartModal = function() { document.getElementById('kartModalOverlay').style.display = 'none'; };

window.kaydetKart = function() {
    const isimKutusu = document.getElementById('yeniKartIsimModal');
    const noKutusu = document.getElementById('yeniKartNoModal');
    const sktKutusu = document.getElementById('yeniKartSKTModal');
    const cvvKutusu = document.getElementById('yeniKartCVVModal');

    if (!isimKutusu || !noKutusu || !sktKutusu || !cvvKutusu) {
        showToast("Sistemsel bir hata oluştu, sayfayı yenileyin.", true);
        return;
    }

    const isim = isimKutusu.value.trim().toUpperCase();
    const no = noKutusu.value.trim();
    const skt = sktKutusu.value.trim();
    const cvv = cvvKutusu.value.trim();

    if(!isim || no.length < 15 || !skt || cvv.length < 3) { 
        showToast("Lütfen kart bilgilerini eksiksiz giriniz!", true); 
        return; 
    }

    let kartlar = JSON.parse(localStorage.getItem('kareKartlar')) || [];
    
    const isDuplicate = kartlar.some(k => k.no === no);
    
    if(isDuplicate) {
        showToast("Bu kart numarası zaten sistemde kayıtlı!", true); 
        return; 
    }

    kartlar.push({ isim: isim, no: '**** **** **** ' + no.slice(-4), skt: skt }); 
    localStorage.setItem('kareKartlar', JSON.stringify(kartlar));
    
    showToast("✅ Kart başarıyla eklendi!");
    closeKartModal();
    
    isimKutusu.value = '';
    noKutusu.value = '';
    sktKutusu.value = '';
    cvvKutusu.value = '';
    
    kartlariGetir(); 
};
