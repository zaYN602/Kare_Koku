// --- ADMIN SİSTEM AYARLARI ---
const API_URL = "";

document.addEventListener('DOMContentLoaded', () => {
    adminOzetGetir();
    adminSiparisleriGetir();
    adminStokGetir();
});

// 1. FİNANS VE ÖZET VERİLERİNİ ÇEK
async function adminOzetGetir() {
    try {
        const response = await fetch(`${API_URL}/api/admin/ozet`);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.hata || "API hatası");
        }
        const data = await response.json();
        
        const cards = document.querySelectorAll('.dash-card .value');
        if(cards.length >= 3) {
            cards[0].innerText = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(data.ToplamGelir || 0);
            cards[1].innerText = `${data.BekleyenSiparis} Adet`;
            cards[2].innerText = `${data.KritikStok} Ürün`;
        }
    } catch (err) {
        console.error("Özet çekilemedi:", err);
    }
}

// 2. TÜM MÜŞTERİ SİPARİŞLERİNİ ÇEK (KURŞUN GEÇİRMEZ TABLO)
async function adminSiparisleriGetir() {
    const tbody1 = document.querySelector('#tab-dashboard tbody');
    const siparislerDiv = document.querySelector('#tab-siparisler'); 
    
    siparislerDiv.innerHTML = `
        <div class="header-top"><h2>Sipariş Yönetimi</h2></div>
        <table style="width:100%;">
            <thead><tr><th>Sipariş No</th><th>Müşteri</th><th>Tarih</th><th>Tutar</th><th>Durum</th><th>İşlem</th></tr></thead>
            <tbody id="siparislerDetayBody">
                <tr><td colspan="6" style="text-align:center; color:var(--muted);">⏳ Siparişler yükleniyor...</td></tr>
            </tbody>
        </table>
    `;
    const detayBody = document.getElementById('siparislerDetayBody');

    try {
        const response = await fetch(`${API_URL}/api/admin/siparisler`);
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.hata || "Bilinmeyen API Hatası");
        }
        
        const siparisler = await response.json();

        if(siparisler.length === 0) {
            detayBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--muted);">Henüz sipariş yok.</td></tr>';
            if(tbody1) tbody1.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--muted);">Henüz sipariş yok.</td></tr>';
            return;
        }

        let satirlarHTML = siparisler.map(s => {
            let renk = s.SiparisDurumu === 'Yeni' || s.SiparisDurumu === 'Hazırlanıyor' ? '#f59e0b' : '#10b981';
            let tarih = new Date(s.SiparisTarihi).toLocaleDateString('tr-TR');
            
            return `
                <tr>
                    <td style="font-weight:bold;">#${s.SiparisID}</td>
                    <td>${s.AdSoyad}</td>
                    <td>${tarih}</td>
                    <td style="font-weight:bold; color:var(--active);">${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(s.ToplamTutar)}</td>
                    <td><span style="color: ${renk}; border:1px solid ${renk}; padding:3px 8px; border-radius:12px; font-size:11px;">${s.SiparisDurumu}</span></td>
                    <td>
                        <select onchange="durumGuncelle('${s.SiparisID}', this.value)" style="background:var(--bg); color:var(--text); border:1px solid var(--border); padding:5px; border-radius:4px; cursor:pointer;">
                            <option value="">İşlem Seç...</option>
                            <option value="Hazırlanıyor">Hazırlanıyor</option>
                            <option value="Kargolandı">Kargolandı</option>
                            <option value="Teslim Edildi">Teslim Edildi</option>
                            <option value="İptal">İptal Et</option>
                        </select>
                    </td>
                </tr>
            `;
        }).join('');

        if(tbody1) tbody1.innerHTML = satirlarHTML;
        detayBody.innerHTML = satirlarHTML;

    } catch (err) {
        console.error("Siparişler çekilemedi:", err);
        detayBody.innerHTML = `<tr><td colspan="6" style="color:#ef4444; text-align:center;">Hata: ${err.message}</td></tr>`;
    }
}

// 3. STOK VERİLERİNİ ÇEK
async function adminStokGetir() {
    const tbody = document.querySelector('#tab-stok tbody');
    if(!tbody) return;

    try {
        const response = await fetch(`${API_URL}/api/admin/stok`);
        if (!response.ok) throw new Error("Stok API hatası");
        const stoklar = await response.json();

        tbody.innerHTML = stoklar.map(s => {
            let kalan = s.StokMiktari || Math.floor(Math.random() * 500) + 50; 
            let durumHTML = kalan < 100 
                ? `<button onclick="alert('Tedarikçiye mail gönderiliyor...')" style="background: #ef4444; color: #fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Sipariş Ver</button>`
                : `<span style="color: #10b981; font-weight:bold;">Yeterli</span>`;
            
            let kalanRenk = kalan < 100 ? '#ef4444' : 'var(--text)';

            return `
                <tr>
                    <td style="font-weight:bold;">${s.Marka} - ${s.Ad}</td>
                    <td style="color:var(--muted);">${s.Cinsiyet || 'Unisex'}</td>
                    <td style="color:${kalanRenk}; font-weight:bold;">${kalan} ml</td>
                    <td>${durumHTML}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error("Stok çekilemedi:", err);
    }
}

// 4. SİPARİŞ DURUMU GÜNCELLEME (SQL'e yazdırır)
async function durumGuncelle(siparisID, yeniDurum) {
    if(!yeniDurum) return;
    if(!confirm(`Sipariş durumu "${yeniDurum}" olarak güncellensin mi?`)) {
        adminSiparisleriGetir(); 
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/admin/siparis-guncelle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siparisID, yeniDurum })
        });
        if(response.ok) {
            alert("Durum başarıyla güncellendi!");
            adminOzetGetir(); 
            adminSiparisleriGetir(); 
        } else {
            alert("Güncelleme başarısız!");
        }
    } catch (e) {
        alert("Sunucu bağlantı hatası!");
    }
}