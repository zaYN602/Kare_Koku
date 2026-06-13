// --- YENİ ÜRÜN DETAY SAYFASI (SEPHORA TARZI) ---
window.openUrunSayfasi = function(id) {
    const p = KareState.db.find(x => String(x.id) === String(id));
    if(!p) return;
    
    KareState.seciliPdpID = id;
    KareState.aktifYildiz = 5; 
    showView('urunDetayView'); 
    
    if(document.getElementById('pdpGorsel')) document.getElementById('pdpGorsel').src = p.gorsel;
    if(document.getElementById('stickyImg')) document.getElementById('stickyImg').src = p.gorsel;
    
    if(document.getElementById('pdpMarka')) document.getElementById('pdpMarka').innerText = p.marka.toUpperCase();
    if(document.getElementById('stickyMarka')) document.getElementById('stickyMarka').innerText = p.marka.toUpperCase();
    
    if(document.getElementById('pdpAd')) document.getElementById('pdpAd').innerText = p.ad;
    if(document.getElementById('stickyAd')) document.getElementById('stickyAd').innerText = p.ad;
    
    if(document.getElementById('pdpNotalar')) document.getElementById('pdpNotalar').innerText = p.notalar;
    
    let options = ''; 
    for (let ml in p.v) options += `<option value="${ml}">${ml} ml - ${formatTL(p.v[ml])}</option>`;
    
    const volSelect = document.getElementById('pdpVolSelect');
    const mainBtn = document.getElementById('pdpMainBtn');
    const stickyBtn = document.getElementById('stickyMainBtn');

    if(p.kalanStok <= 0) {
        if(volSelect) volSelect.innerHTML = `<option value="">Tükendi</option>`;
        if(mainBtn) {
            mainBtn.innerText = "GELİNCE HABER VER";
            mainBtn.onclick = () => stokBildirimTalebi(p.id);
            mainBtn.style.background = "#000"; 
            mainBtn.style.color = "var(--active-theme)";
        }
        if(stickyBtn) {
            stickyBtn.innerText = "GELİNCE HABER VER";
            stickyBtn.onclick = () => stokBildirimTalebi(p.id);
            stickyBtn.style.background = "#000";
            stickyBtn.style.color = "var(--active-theme)";
        }
        if(document.getElementById('pdpFiyat')) document.getElementById('pdpFiyat').innerText = "Stokta Yok";
        if(document.getElementById('stickyFiyat')) document.getElementById('stickyFiyat').innerText = "Stokta Yok";
    } else {
        if(volSelect) {
            volSelect.innerHTML = options;
            volSelect.onchange = function() {
                let seciliFiyat = p.v[this.value];
                if(document.getElementById('pdpFiyat')) document.getElementById('pdpFiyat').innerText = formatTL(seciliFiyat);
                if(document.getElementById('stickyFiyat')) document.getElementById('stickyFiyat').innerText = formatTL(seciliFiyat);
            };
            volSelect.onchange();
        }
        if(mainBtn) {
            mainBtn.innerText = "SEPETE EKLE";
            mainBtn.onclick = pdpSepeteEkle;
            mainBtn.style.background = ""; 
            mainBtn.style.color = "";
        }
        if(stickyBtn) {
            stickyBtn.innerText = "SEPETE EKLE";
            stickyBtn.onclick = pdpSepeteEkle;
            stickyBtn.style.background = "";
            stickyBtn.style.color = "";
        }
    }

    const pdpOnerilenler = document.getElementById('pdpOnerilenler');
    if(pdpOnerilenler) {
        const onerilenler = KareState.db.filter(x => x.id !== id).sort(() => 0.5 - Math.random()).slice(0, 6);
        pdpOnerilenler.innerHTML = onerilenler.map(o => `
            <div style="min-width: 200px; max-width: 200px; border: 1px solid var(--border); border-radius: 8px; padding: 15px; background: var(--card); cursor:pointer; display: flex; flex-direction: column; transition: 0.3s;" onmouseover="this.style.borderColor='var(--active-theme)'" onmouseout="this.style.borderColor='var(--border)'" onclick="openUrunSayfasi('${o.id}')">
                <img src="${o.gorsel}" style="width: 100%; height: 180px; object-fit: contain; margin-bottom: 15px; border-radius: 4px;" onerror="this.src='${KareState.fallbackImg}'">
                <div style="font-size: 11px; font-weight: 800; color: var(--muted); letter-spacing: 1px; margin-bottom: 5px;">${o.marka.toUpperCase()}</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 10px;">${o.ad}</div>
                <div style="margin-top: auto; font-weight: 900; font-size: 16px; color: var(--active-theme);">${formatTL(o.v[Object.keys(o.v)[0]])}</div>
            </div>
        `).join('');
    }

    const yorumForm = document.getElementById('pdpYorumFormu');
    if(yorumForm) {
        if (KareState.aktifKullanici) {
            yorumForm.innerHTML = `
                <div style="font-size: 28px; cursor: pointer; margin-bottom: 15px; display: flex; gap: 8px;">
                    <span id="formYildiz-1" onclick="yildizSec(1)" style="color: var(--active-theme);">★</span>
                    <span id="formYildiz-2" onclick="yildizSec(2)" style="color: var(--active-theme);">★</span>
                    <span id="formYildiz-3" onclick="yildizSec(3)" style="color: var(--active-theme);">★</span>
                    <span id="formYildiz-4" onclick="yildizSec(4)" style="color: var(--active-theme);">★</span>
                    <span id="formYildiz-5" onclick="yildizSec(5)" style="color: var(--active-theme);">★</span>
                </div>
                <textarea id="yeniYorumMetniPdp" class="login-input" placeholder="Kokunun kalıcılığı, silajı ve notaları hakkında ne düşünüyorsunuz?" style="height: 80px; resize: none;"></textarea>
                <button class="login-submit" onclick="kaydetPdpYorum()">Yorumu Yayınla</button>
            `;
        } else {
            yorumForm.innerHTML = `
                <div style="text-align:center; padding: 20px; background: var(--bg); border-radius: 6px;">
                    <p style="color: var(--muted); font-size: 13px; margin-bottom: 15px;">Yorum yazabilmek için lütfen giriş yapın.</p>
                    <button class="filter-btn" onclick="toggleLogin()">GİRİŞ YAP</button>
                </div>`;
        }
    }

    yorumlarıPdpYukle(id);
};

window.addEventListener('scroll', () => {
    const sticky = document.getElementById('stickyFooter');
    const urunView = document.getElementById('urunDetayView');
    if(!sticky) return;
    if(!urunView || urunView.style.display === 'none') { sticky.classList.remove('visible'); return; }
    if (window.scrollY > 400) { sticky.classList.add('visible'); } else { sticky.classList.remove('visible'); }
});

window.pdpSepeteEkle = function() {
    const volSelect = document.getElementById('pdpVolSelect');
    if(!volSelect) return;
    const ml = parseInt(volSelect.value);
    const p = KareState.db.find(x => String(x.id) === String(KareState.seciliPdpID));
    if(!p) return;

    // 🌟 PDP STOK KATMANI
    const sepettekiToplamMl = KareState.sepet
        .filter(item => String(item.id) === String(KareState.seciliPdpID))
        .reduce((toplam, item) => toplam + (item.ml * item.adet), 0);

    if (sepettekiToplamMl + ml > p.kalanStok) {
        const kalanKullanilabilir = p.kalanStok - sepettekiToplamMl;
        if (kalanKullanilabilir <= 0) {
            showToast(`❌ Bu parfümün kalan tüm stoğu zaten sepetinizde!`, true);
        } else {
            showToast(`❌ Yetersiz Stok! Bu üründen sepetinize en fazla ${kalanKullanilabilir}ml daha ekleyebilirsiniz.`, true);
        }
        return;
    }

    const m = KareState.sepet.find(i => String(i.id) === String(KareState.seciliPdpID) && i.ml === ml);
    if (m) m.adet += 1; 
    else KareState.sepet.push({ id: p.id, ad: p.ad, marka: p.marka, ml: ml, fiyat: p.v[ml], adet: 1, gorsel: p.gorsel });
    localStorage.setItem('kareSepet', JSON.stringify(KareState.sepet)); 
    renderCart(); showToast(`${p.ad} sepete eklendi!`); toggleDrawer('cartDrawer'); 
};
// 🌟 DİNAMİK YORUM YÜKLEME (Matematik ve İstatistikler Burda) 🌟
window.yorumlarıPdpYukle = async function(parfumID) {
    const liste = document.getElementById('pdpYorumlarListesi');
    const ozetPanel = document.getElementById('pdpYorumOzeti');
    if(!liste) return;
    
    liste.innerHTML = '<p style="color: var(--muted);">⏳ Yorumlar getiriliyor...</p>';

    try {
        const response = await apiFetch(`${KareState.API_URL}/api/yorumlar/${parfumID}`, { credentials: 'include' });
        if(!response.ok) throw new Error();
        const yorumlar = await response.json();

        if(yorumlar.length === 0) {
            liste.innerHTML = '<div class="review-card" style="text-align:center;"><p style="color: var(--muted);">Bu muhteşem esere ilk yorumu siz bırakın.</p></div>';
            if(ozetPanel) ozetPanel.innerHTML = '<div style="text-align:center; color: var(--muted);">Henüz değerlendirme yok.</div>';
            if(document.getElementById('pdpPuan')) document.getElementById('pdpPuan').innerHTML = '<span style="color:var(--border);">★★★★★</span>';
        } else {
            let toplamPuan = 0;
            let dagilim = {5:0, 4:0, 3:0, 2:0, 1:0};

            liste.innerHTML = yorumlar.map(y => {
                let p = y.Puan || 5;
                toplamPuan += p;
                dagilim[p]++;
                
                let doluYildiz = '★'.repeat(p);
                let bosYildiz = '☆'.repeat(5 - p);
                
                return `
                <div class="review-card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <div>
                            <strong style="color: var(--text); font-size: 14px; display:block; margin-bottom: 5px;">${y.AdSoyad} <span style="color: var(--active-theme); font-size: 10px; background: rgba(204,167,106,0.1); padding: 2px 6px; border-radius: 4px;">Doğrulanmış Alıcı</span></strong>
                            <div style="color: var(--active-theme); font-size: 13px;">${doluYildiz}<span style="color:var(--border);">${bosYildiz}</span></div>
                        </div>
                        <span style="color: var(--muted); font-size: 12px;">${new Date(y.Tarih).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <p style="color: var(--muted); font-size: 14px; line-height: 1.6; margin:0;">${y.YorumMetni}</p>
                    
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--border); display: flex; gap: 20px; font-size: 12px; color: var(--muted);">
                        <span onclick="yorumOyla(this, 'faydalı')" style="cursor:pointer; transition:0.2s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">👍 Faydalı (<span class="sayac">0</span>)</span>
                        <span onclick="yorumOyla(this, 'degil')" style="cursor:pointer; transition:0.2s;" onmouseover="this.style.color='var(--text)'" onmouseout="this.style.color='var(--muted)'">👎 Değil (<span class="sayac">0</span>)</span>
                    </div>
                    </div>
            `}).join('');

            let ortalama = (toplamPuan / yorumlar.length).toFixed(1);
            let ortDolu = '★'.repeat(Math.round(ortalama));
            let ortBos = '☆'.repeat(5 - Math.round(ortalama));

            if(document.getElementById('pdpPuan')) document.getElementById('pdpPuan').innerHTML = ortDolu + `<span style="color:var(--border);">${ortBos}</span>`;

            let ozetHTML = `
                <div style="font-size: 40px; font-weight: 900; color: var(--text); text-align: center;">${ortalama}<span style="font-size: 20px; color: var(--muted);">/5</span></div>
                <div style="color: var(--active-theme); font-size: 24px; text-align: center; margin-bottom: 20px;">${ortDolu}<span style="color:var(--border);">${ortBos}</span></div>
            `;

            for(let i=5; i>=1; i--) {
                let yuzde = yorumlar.length > 0 ? (dagilim[i] / yorumlar.length) * 100 : 0;
                ozetHTML += `
                    <div class="rating-bar"><span class="star-label">${i} ★</span><div class="bar-bg"><div class="bar-fill" style="width: ${yuzde}%;"></div></div><span class="count-label">${dagilim[i]}</span></div>
                `;
            }
            if(ozetPanel) ozetPanel.innerHTML = ozetHTML;
        }
    } catch(e) {
        if(liste) liste.innerHTML = '<p style="color: #ef4444;">❌ Yorumlar yüklenirken sistemsel bir hata oluştu.</p>';
    }
};
window.kaydetPdpYorum = async function() {
    const textarea = document.getElementById('yeniYorumMetniPdp');
    if(!textarea) return;
    const metin = textarea.value.trim();

    if(!metin) { showToast("Lütfen boş yorum göndermeyin!", true); return; }

    try {
        const response = await apiFetch(`${KareState.API_URL}/api/yorum-ekle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parfumID: KareState.seciliPdpID, kullaniciID: KareState.aktifKullaniciID, yorumMetni: metin, puan: KareState.aktifYildiz })
        });

        if(response.ok) {
            showToast("✅ Yorumunuz başarıyla yayınlandı.");
            textarea.value = '';
            yildizSec(5); 
            yorumlarıPdpYukle(KareState.seciliPdpID); 
        } else {
            const data = await response.json();
            showToast("❌ " + data.hata, true);
        }
    } catch(e) {
        showToast("❌ Sunucu bağlantısı koptu!", true);
    }
};
// --- YORUM BEĞENİ SİSTEMİ ---
// Not: Oylama verileri şu an kalıcı değil (sadece frontend). Backend entegrasyonu gerekir.
window.yorumOyla = function(element, tip) {
    if (element.classList.contains('oylandi')) {
        showToast("Bu yoruma zaten geri bildirim verdiniz!", true);
        return;
    }
    const sayacSpan = element.querySelector('.sayac');
    let mevcutSayi = parseInt(sayacSpan.innerText);
    sayacSpan.innerText = mevcutSayi + 1;
    
    // Tıklandığını belli et ve kilitle
    element.classList.add('oylandi');
    element.style.color = tip === 'faydalı' ? 'var(--active-theme)' : '#ef4444'; 
    showToast("Geri bildiriminiz için teşekkürler!");
};
window.hesabiSil = async function() {
    if(!KareState.aktifKullaniciID) return;
    
    const eminMisiniz = confirm("Hesabınızı ve tüm verilerinizi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!");
    if(!eminMisiniz) return;
    
    try {
        showToast("Hesabınız siliniyor...", false);
        const response = await apiFetch(`${KareState.API_URL}/api/hesap-sil/${KareState.aktifKullaniciID}`, {
            method: 'DELETE'
        });
        
        if(response.ok) {
            // 🚨 İŞTE ÇÖZÜM: Hesabı silerken tarayıcıda kalan kartları ve sepeti de temizliyoruz
            localStorage.removeItem('kareKartlar');
            localStorage.removeItem('kareSepet');
            KareState.sepet = [];
            renderCart();
            
            showToast("Hesabınız başarıyla silindi. Hoşça kalın...");
            setTimeout(() => cikisYap(), 1500); // 1.5 saniye sonra çıkış yaptır
        } else {
            const data = await response.json();
            showToast("❌ " + data.hata, true);
        }
    } catch(e) {
        showToast("❌ Sunucuya ulaşılamadı!", true);
    }
};
window.toggleMobileSidebar = function() { const sidebar = document.querySelector('.shop-sidebar'); const overlay = document.getElementById('sidebarOverlay'); if(sidebar) sidebar.classList.toggle('open'); if(overlay) overlay.classList.toggle('active'); };

window.stokBildirimTalebi = async function(parfumID) {
    let email = KareState.aktifKullaniciEmail;
    if(!email) {
        email = prompt("Stok yenilendiğinde haber verebilmemiz için lütfen e-posta adresinizi girin:");
        if(!email || !email.includes('@')) {
            showToast("Geçerli bir e-posta adresi girmelisiniz!", true);
            return;
        }
    }
    
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/stok-bildirim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kullaniciID: KareState.aktifKullaniciID, email: email, parfumID: parseInt(parfumID) })
        });
        const data = await response.json();
        
        if (response.ok) {
            showToast("✅ " + data.mesaj);
        } else {
            showToast("❌ " + (data.hata || data.mesaj), true);
        }
    } catch(err) {
        showToast("Sunucuya ulaşılamadı!", true);
    }
};
