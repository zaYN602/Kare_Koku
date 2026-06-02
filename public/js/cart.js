// --- SEPET FONKSİYONLARI ---
window.fiyatGuncelle = function (id) {
    const p = KareState.db.find(x => String(x.id) === String(id));
    if(p) document.getElementById(`price-${id}`).innerText = formatTL(p.v[document.getElementById(`vol-${id}`).value]);
};
window.sepeteEkle = function (id) {
    const p = KareState.db.find(x => String(x.id) === String(id)); if(!p) return;
    const ml = parseInt(document.getElementById(`vol-${id}`).value);
    
    // 🌟 STOK KATMANI: Bu parfümden sepette halihazırda kaç ml var hesaplıyoruz
    const sepettekiToplamMl = KareState.sepet
        .filter(item => String(item.id) === String(id))
        .reduce((toplam, item) => toplam + (item.ml * item.adet), 0);

    // Yeni eklenecek miktar ile sepettekilerin toplamı veritabanı stoğunu aşamaz!
    if (sepettekiToplamMl + ml > p.kalanStok) {
        const kalanKullanilabilir = p.kalanStok - sepettekiToplamMl;
        if (kalanKullanilabilir <= 0) {
            showToast(`❌ Bu parfümün kalan tüm stoğu zaten sepetinizde!`, true);
        } else {
            showToast(`❌ Yetersiz Stok! Sepete bu üründen en fazla ${kalanKullanilabilir}ml daha ekleyebilirsiniz.`, true);
        }
        return; // İşlemi durdur, sepete ekletme!
    }

    // Stok yeterliyse senin mevcut KareState.sepet mantığın tıkır tıkır çalışır:
    const m = KareState.sepet.find(i => String(i.id) === String(id) && i.ml === ml);
    if (m) m.adet += 1; else KareState.sepet.push({ id: p.id, ad: p.ad, marka: p.marka, ml: ml, fiyat: p.v[ml], adet: 1, gorsel: p.gorsel });
    localStorage.setItem('kareSepet', JSON.stringify(KareState.sepet)); 
    renderCart(); showToast(`${p.ad} sepete eklendi!`);
};

window.renderCart = function () {
    const container = document.getElementById('cartItems'); if(!container) return;
    container.innerHTML = ''; let top = 0;

    if (KareState.sepet.length === 0) {
        container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 15px;">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p style="color:var(--text); font-weight:600; font-size:16px; margin-bottom:5px;">Sepetiniz Boş</p>
            <p style="color:var(--muted); font-size:13px;">Hemen imza kokunuzu keşfetmeye başlayın.</p>
        </div>`;
        document.getElementById('cartTotal').innerText = `Ara Toplam: 0,00 ₺`;
        if(document.getElementById('sepetSayaci')) document.getElementById('sepetSayaci').innerText = "0";
    } else {
        let urunlerHTML = "";
        KareState.sepet.forEach((i, idx) => {
            top += i.fiyat * i.adet;
            urunlerHTML += `
                <div class="cart-item">
                    <img src="${i.gorsel}" onerror="this.src='${KareState.fallbackImg}'">
                    <div style="flex: 1;">
                        <div style="font-weight: 800; color: var(--text); font-size: 15px; margin-bottom:4px;">${i.ad}</div>
                        <div style="font-size: 11px; color: var(--muted); margin-bottom: 8px;">${i.marka} - ${i.ml}ml</div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <button onclick="sepetMiktarDegistir(${idx}, -1)" style="background:none; border:1px solid var(--border); color:var(--text); width:28px; height:28px; cursor:pointer; border-radius:4px; font-size:14px; font-weight:bold;">−</button>
                            <span style="color: var(--text); font-weight: 800; font-size: 14px; min-width:20px; text-align:center;">${i.adet}</span>
                            <button onclick="sepetMiktarDegistir(${idx}, 1)" style="background:none; border:1px solid var(--border); color:var(--text); width:28px; height:28px; cursor:pointer; border-radius:4px; font-size:14px; font-weight:bold;">+</button>
                        </div>
                        <div style="color: var(--active-theme); font-weight: 800; font-size: 15px; margin-top:5px;">${i.adet} x ${formatTL(i.fiyat)}</div>
                    </div>
                    <button onclick="sepettenCikar(${idx})" style="background:none; border:none; color:#ef4444; font-size:20px; cursor:pointer;">&times;</button>
                </div>`;
        });

        let kargoHTML = top >= 2000 
            ? `<div style="background:var(--card); padding:15px; border-radius:8px; margin-bottom:25px; border:1px solid var(--active-theme);"><div style="color:var(--active-theme); font-weight:800; font-size:12px; margin-bottom:8px; text-align:center;">🎉 TEBRİKLER! KARGO BEDAVA 🎉</div><div style="width:100%; height:8px; background:var(--border); border-radius:10px; overflow:hidden;"><div style="width:100%; height:100%; background:var(--active-theme); transition:0.4s;"></div></div></div>`
            : `<div style="background:var(--card); padding:15px; border-radius:8px; margin-bottom:25px; border:1px solid var(--border);"><div style="color:var(--text); font-weight:600; font-size:12px; margin-bottom:8px; text-align:center;">Ücretsiz kargoya <b style="color:var(--active-theme);">${formatTL(2000-top)}</b> kaldı!</div><div style="width:100%; height:8px; background:var(--border); border-radius:10px; overflow:hidden;"><div style="width:${(top/2000)*100}%; height:100%; background:var(--active-theme); transition:0.4s;"></div></div></div>`;
        
        container.innerHTML = kargoHTML + urunlerHTML;
        document.getElementById('cartTotal').innerText = `Ara Toplam: ${formatTL(top)}`;
        if(document.getElementById('sepetSayaci')) document.getElementById('sepetSayaci').innerText = KareState.sepet.reduce((t, i) => t + i.adet, 0);
    }
};

window.sepettenCikar = function(index) { KareState.sepet.splice(index, 1); localStorage.setItem('kareSepet', JSON.stringify(KareState.sepet)); renderCart(); };

window.sepetMiktarDegistir = function(index, degisim) {
    if(!KareState.sepet[index]) return;
    KareState.sepet[index].adet += degisim;
    if(KareState.sepet[index].adet <= 0) KareState.sepet.splice(index, 1);
    localStorage.setItem('kareSepet', JSON.stringify(KareState.sepet));
    renderCart();
};
