// --- SQL BAĞLANTISI VE VİTRİN ---
window.vitriniDoldur = async function() {
    try {
        const grid = document.getElementById('urunGrid');
        if(grid) {
            let skeletonHTML = '';
            for(let i = 0; i < 6; i++) {
                skeletonHTML += `<div class="card" style="animation: pulse 1.5s ease-in-out infinite;"><div style="width:100%;height:280px;background:var(--border);border-radius:4px;margin-bottom:15px;"></div><div style="height:12px;width:60%;background:var(--border);border-radius:4px;margin-bottom:10px;"></div><div style="height:18px;width:80%;background:var(--border);border-radius:4px;margin-bottom:15px;"></div><div style="height:40px;background:var(--border);border-radius:4px;"></div></div>`;
            }
            grid.innerHTML = skeletonHTML;
        }
        const response = await apiFetch(`${KareState.API_URL}/api/parfumler`, { credentials: 'include' });
        if(!response.ok) throw new Error("API Hatası");
        const sqlParfumler = await response.json();
        
        if (!Array.isArray(sqlParfumler)) { throw new Error("Sunucudan gelen veri hatalı."); }
        
        const katalog = {
            "aventus (flacon)": { kat: "nis", cin: "erkek", img: "Creed Aventus.PNG" }, 
            "oud wood": { kat: "nis", cin: "unisex", img: "Tom Ford Oud Wood.PNG" }, 
            "baccarat rouge 540": { kat: "nis", cin: "unisex", img: "MFK Baccarat Rouge 540.PNG" },
            "layton": { kat: "nis", cin: "erkek", img: "Parfums de Marly Layton.PNG" }, 
            "naxos": { kat: "nis", cin: "unisex", img: "Xerjoff Naxos.PNG" }, 
            "hacivat": { kat: "nis", cin: "unisex", img: "Nishane Hacivat.PNG" },
            "delina": { kat: "nis", cin: "kadin", img: "PdM Delina.PNG" }, 
            "portrait of a lady": { kat: "nis", cin: "kadin", img: "Frederic Malle Portrait of a Lady.PNG" },
            "sauvage edp": { kat: "designer", cin: "erkek", img: "Dior Sauvage EDP.PNG" }, 
            "bleu de chanel edp": { kat: "designer", cin: "erkek", img: "Bleu de Chanel EDP.PNG" }, 
            "y edp": { kat: "designer", cin: "erkek", img: "YSL Y EDP.PNG" },
            "eros edp": { kat: "designer", cin: "erkek", img: "Versace Eros EDP.PNG" }, 
            "invictus": { kat: "designer", cin: "erkek", img: "Paco Rabanne Invictus.PNG" }, 
            "1 million": { kat: "designer", cin: "erkek", img: "Paco Rabanne 1 Million.PNG" },
            "acqua di gio profondo": { kat: "designer", cin: "erkek", img: "Acqua di Gio Profondo.PNG" }, 
            "stronger with you": { kat: "designer", cin: "erkek", img: "Armani Stronger With You.PNG" }, 
            "le male le parfum": { kat: "designer", cin: "erkek", img: "JPG Le Male Le Parfum.PNG" },
            "wanted edp": { kat: "designer", cin: "erkek", img: "Azzaro Wanted EDP.PNG" }, 
            "explorer": { kat: "designer", cin: "erkek", img: "Montblanc Explorer.PNG" }, 
            "luna rossa carbon": { kat: "designer", cin: "erkek", img: "Prada Luna Rossa Carbon.PNG" },
            "bottled edp": { kat: "designer", cin: "erkek", img: "Hugo Boss Bottled EDP.PNG" }, 
            "the one edp": { kat: "designer", cin: "erkek", img: "D&G The One EDP.PNG" }, 
            "dylan blue": { kat: "designer", cin: "erkek", img: "Versace Dylan Blue.PNG" },
            "good girl": { kat: "designer", cin: "kadin", img: "Carolina Herrera Good Girl.PNG" }, 
            "black opium": { kat: "designer", cin: "kadin", img: "YSL Black Opium.PNG" }, 
            "la vie est belle": { kat: "designer", cin: "kadin", img: "Lancome La Vie Est Belle.PNG" },
            "si edp": { kat: "designer", cin: "kadin", img: "Armani Si EDP.PNG" }, 
            "l'interdit": { kat: "designer", cin: "kadin", img: "Givenchy L'Interdit.PNG" }, 
            "her": { kat: "designer", cin: "kadin", img: "Burberry Her.PNG" },
            "for her": { kat: "designer", cin: "kadin", img: "Narciso Rodriguez For Her.PNG" }, 
            "light blue": { kat: "designer", cin: "kadin", img: "D&G Light Blue.PNG" }, 
            "bright crystal": { kat: "designer", cin: "kadin", img: "Versace Bright Crystal.PNG" },
            "bloom": { kat: "designer", cin: "kadin", img: "Gucci Bloom.PNG" }, 
            "coco mademoiselle": { kat: "designer", cin: "kadin", img: "Chanel Coco Mademoiselle.PNG" }, 
            "j'adore": { kat: "designer", cin: "kadin", img: "Dior J'adore.PNG" },
            "paradoxe": { kat: "designer", cin: "kadin", img: "Prada Paradoxe.PNG" }, 
            "donna born in roma": { kat: "designer", cin: "kadin", img: "Valentino Donna Born In Roma.PNG" }, 
            "olympea": { kat: "designer", cin: "kadin", img: "Paco Rabanne Olympea.PNG" }
        };
        
        KareState.db = sqlParfumler.map((urun) => {
            let adKucuk = (urun.Ad || "").toLowerCase();
            let notalarKucuk = (urun.Notalar || "").toLowerCase();
            let atananKategori = "nis"; 
            let atananCinsiyet = "unisex"; 
            let resimAdi = `${urun.Marka} ${urun.Ad}.PNG`; 

            for (let anahtar in katalog) {
                if (adKucuk === anahtar || adKucuk.includes(anahtar)) {
                    atananKategori = katalog[anahtar].kat;
                    atananCinsiyet = katalog[anahtar].cin;
                    if (katalog[anahtar].img) resimAdi = katalog[anahtar].img;
                    break;
                }
            }

            // 🚨 YBS KOKU MOTORU GÜNCELLEMESİ (Hiyerarşik Tarama - Naxos Hatası Çözümü)
            let n = notalarKucuk;
            let tahminKoku = "ferah"; // Fallback
            if (n.includes("vanilya") || n.includes("bal") || n.includes("tonka") || n.includes("pralin") || n.includes("kahve") || n.includes("çikolata") || n.includes("karamel") || n.includes("badem")) tahminKoku = "gurme";
            else if (n.includes("biber") || n.includes("tarçın") || n.includes("safran") || n.includes("kakule") || n.includes("karanfil") || n.includes("zencefil")) tahminKoku = "baharatli";
            else if (n.includes("odun") || n.includes("sedir") || n.includes("sandal") || n.includes("vetiver") || n.includes("meşe") || n.includes("huş") || n.includes("paçuli") || n.includes("deri") || n.includes("öd") || n.includes("tütün") || n.includes("misk") || n.includes("amber")) tahminKoku = "odunsu";
            else if (n.includes("elma") || n.includes("ananas") || n.includes("çilek") || n.includes("ahududu") || n.includes("şeftali") || n.includes("üzüm") || n.includes("meyve") || n.includes("kiraz") || n.includes("incir")) tahminKoku = "meyvemsi";
            else if (n.includes("gül") || n.includes("yasemin") || n.includes("şakayık") || n.includes("çiçek") || n.includes("lavanta") || n.includes("sümbülteber") || n.includes("iris") || n.includes("menekşe")) tahminKoku = "ciceksi";
            else if (n.includes("bergamot") || n.includes("limon") || n.includes("greyfurt") || n.includes("deniz") || n.includes("su") || n.includes("nane") || n.includes("mandalina") || n.includes("portakal") || n.includes("okyanus")) tahminKoku = "ferah";
            else tahminKoku = "odunsu";

            return {
                id: urun.ParfumID, marka: urun.Marka, ad: urun.Ad,
                kategori: atananKategori, cinsiyet: atananCinsiyet, koku: tahminKoku,
                gorsel: `parfüm RESİM/${resimAdi}`, notalar: urun.Notalar || "Özel İmza Notalar",
                v: { 2: parseFloat(urun.Bir_ml_Maliyeti)*2, 3: parseFloat(urun.Bir_ml_Maliyeti)*3, 5: parseFloat(urun.Bir_ml_Maliyeti)*5, 10: parseFloat(urun.Bir_ml_Maliyeti)*10, 15: parseFloat(urun.Bir_ml_Maliyeti)*15, 25: parseFloat(urun.Bir_ml_Maliyeti)*25 },
                kalanStok: parseFloat(urun.Kalan_Stok_ml) || 0
            };
        });
        
        const uniqueBrands = [...new Set(KareState.db.map(p => p.marka))].sort();
        const markaContainer = document.getElementById('markaFiltreleri');
        if(markaContainer) {
            markaContainer.innerHTML = '';
            uniqueBrands.forEach(m => { markaContainer.innerHTML += `<label class="custom-cb"><input type="checkbox" value="${m.toLowerCase()}" onchange="filtreleriUygula()"> ${m}</label>`; });
        }
        renderProducts(KareState.db);
    } catch (err) { 
        console.error("Vitrin yüklenemedi:", err); 
        const grid = document.getElementById('urunGrid');
        if(grid) grid.innerHTML = '<p style="color:var(--active-theme); text-align:center; padding:50px; grid-column:1/-1;">Veritabanına bağlanılamadı. Lütfen Node.js sunucusunu çalıştırın.</p>';
    }
}

window.renderProducts = function(liste) {
    const grid = document.getElementById('urunGrid');
    if(!grid) return;
    grid.innerHTML = '';
    if (!liste || liste.length === 0) {
        grid.innerHTML = '<p style="color:var(--muted); text-align:center; grid-column:1/-1; padding:50px; font-weight:600;">Aradığınız kriterlere uygun parfüm bulunamadı.</p>'; 
        return;
    }
    liste.forEach((p, index) => {
        let options = ''; for (let ml in p.v) options += `<option value="${ml}">${ml} ml</option>`;
        let ilkFiyat = p.v[Object.keys(p.v)[0]];
        let themeClass = p.kategori === 'designer' ? 'designer' : 'nis';

        grid.insertAdjacentHTML('beforeend', `
            <div class="card ${themeClass}" style="animation-delay: ${index * 0.05}s;">
                <img src="${p.gorsel}" loading="lazy" onclick="openUrunSayfasi('${p.id}')" onerror="this.src='${KareState.fallbackImg}'" style="cursor: pointer;">
                
                <div class="brand">${p.marka}</div>
                <div class="title">${p.ad}</div>
                <div class="badge-container">
                    <span class="badge">${p.kategori === 'nis' ? 'NİŞ PARFÜM' : 'DESIGNER'}</span>
                    <span class="badge">${p.cinsiyet.toUpperCase()}</span>
                </div>
                <div class="notes">Notalar: ${p.notalar}</div>
                <select class="vol-select" id="vol-${p.id}" onchange="fiyatGuncelle('${p.id}')">${options}</select>
                <div class="card-bottom">
                    <div class="price" id="price-${p.id}">${formatTL(ilkFiyat)}</div>
                    <button class="add-btn" onclick="sepeteEkle('${p.id}')">Sepete Ekle</button>
                </div>
            </div>`);
    });

    if (typeof gsap !== 'undefined') {
        gsap.killTweensOf(".card");
        gsap.fromTo(".card", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "power2.out" });
    }
};

window.filtreleriUygula = function () {
    if(!document.getElementById('searchInput')) return;
    const aranan = document.getElementById('searchInput').value.toLowerCase().trim();
    const seciliMarkalar = Array.from(document.querySelectorAll('#markaFiltreleri input:checked')).map(cb => cb.value);
    const seciliKategoriler = Array.from(document.querySelectorAll('#kategoriFiltreleri input:checked')).map(cb => cb.value);
    const seciliCinsiyetler = Array.from(document.querySelectorAll('#cinsiyetFiltreleri input:checked')).map(cb => cb.value);
    const seciliKokular = Array.from(document.querySelectorAll('#kokuFiltreleri input:checked')).map(cb => cb.value);

    const filtrelenmis = KareState.db.filter(p => {
        const aramayaUyar = aranan === "" || p.ad.toLowerCase().includes(aranan) || p.marka.toLowerCase().includes(aranan) || p.notalar.toLowerCase().includes(aranan);
        const anaKategoriUyar = KareState.seciliAnaKategori === "" || p.kategori === KareState.seciliAnaKategori;
        const anaCinsiyetUyar = KareState.seciliAnaCinsiyet === "" || p.cinsiyet === KareState.seciliAnaCinsiyet;
        const markayaUyar = seciliMarkalar.length === 0 || seciliMarkalar.includes(p.marka.toLowerCase());
        const kategoriyeUyar = seciliKategoriler.length === 0 || seciliKategoriler.includes(p.kategori);
        const cinsiyeteUyar = seciliCinsiyetler.length === 0 || seciliCinsiyetler.includes(p.cinsiyet);
        const kokuyaUyar = seciliKokular.length === 0 || seciliKokular.includes(p.koku);
        return aramayaUyar && anaKategoriUyar && anaCinsiyetUyar && markayaUyar && kategoriyeUyar && cinsiyeteUyar && kokuyaUyar;
    });
    renderProducts(filtrelenmis);
    renderActiveFilters();
};

let aramaTimer;
window.debouncedArama = function() {
    clearTimeout(aramaTimer);
    aramaTimer = setTimeout(() => {
        aramaOnerileriGetir();
    }, 300);
};

window.renderActiveFilters = function() {
    const container = document.getElementById('activeFiltersContainer');
    if(!container) return;
    container.innerHTML = '';
    
    document.querySelectorAll('.filter-dropdown-content input:checked').forEach(cb => {
        const text = cb.parentElement.innerText.trim();
        const value = cb.value;
        const id = cb.closest('.filter-dropdown-content').id;
        
        container.insertAdjacentHTML('beforeend', `
            <div class="active-filter-badge" onclick="removeFilter('${id}', '${value}')">
                ${text} ✖
            </div>
        `);
    });
};

window.removeFilter = function(containerId, value) {
    const cb = document.querySelector(`#${containerId} input[value="${value}"]`);
    if(cb) cb.checked = false;
    filtreleriUygula();
};

window.setMainKategori = function(kat, event) {
    KareState.seciliAnaKategori = kat;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
    filtreleriUygula();
};

window.setMainCinsiyet = function(cin, event) {
    KareState.seciliAnaCinsiyet = cin;
    document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
    filtreleriUygula();
};

window.aramaOnerileriGetir = function() {
    const val = document.getElementById('searchInput').value.toLowerCase().trim();
    const box = document.getElementById('searchSuggestions');
    if(!box) return;
    if(val.length < 2) { box.style.display = 'none'; filtreleriUygula(); return; }
    const matches = KareState.db.filter(p => p.ad.toLowerCase().includes(val) || p.marka.toLowerCase().includes(val) || p.notalar.toLowerCase().includes(val)).slice(0, 5);
    
    if(matches.length > 0) {
        box.innerHTML = matches.map(m => `
            <div class="suggestion-item" onclick="oneriSec('${m.ad.replace(/'/g, "\\'")}')">
                <img src="${m.gorsel}" onerror="this.src='${KareState.fallbackImg}'">
                <div><b style="color:var(--active-theme)">${m.marka}</b><br>${m.ad}</div>
            </div>
        `).join('');
        box.style.display = 'block';
    } else { box.style.display = 'none'; }
    filtreleriUygula();
};

window.oneriSec = function(ad) { document.getElementById('searchInput').value = ad; document.getElementById('searchSuggestions').style.display = 'none'; filtreleriUygula(); };

window.hizliKategoriSec = function(deger) {
    document.querySelectorAll('.custom-cb input').forEach(cb => cb.checked = false);
    const hedefCb = document.querySelector(`.custom-cb input[value="${deger}"]`);
    if(hedefCb) hedefCb.checked = true;
    document.querySelector('.shop-main').scrollIntoView({ behavior: 'smooth', block: 'start' });
    if(typeof filtreleriUygula === 'function') filtreleriUygula();
};