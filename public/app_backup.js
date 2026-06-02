// --- SİSTEM AYARLARI ---
const API_URL = "http://127.0.0.1:3000";

window.apiFetch = async function(url, options = {}) {
    if (!options.headers) options.headers = {};
    const token = localStorage.getItem('kareToken');
    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }
    options.credentials = 'include';
    return fetch(url, options);
};
 

const fallbackImg = "https://images.unsplash.com/photo-1615486171448-4fb324aa8eb0?auto=format&fit=crop&w=600&q=80";
let db = []; 
let sepet = [];
let aktifKullanici = null; 
let aktifKullaniciID = null;
let uygulananKupon = null; 

let seciliAnaKategori = "";
let seciliAnaCinsiyet = "";
let seciliPdpID = null;
let aktifYildiz = 5; 

// 🌟 SAYFA YÜKLENDİĞİNDE 🌟
window.addEventListener('DOMContentLoaded', () => {
    if(localStorage.getItem('karekoku_tema') === 'light') document.body.classList.add('light-theme');
    
    // Görünmez duvarları zorla kapat
    const mainOverlay = document.getElementById('overlay');
    if(mainOverlay) mainOverlay.style.display = 'none';
    
    const savedUser = sessionStorage.getItem('kareUser');
    const savedID = sessionStorage.getItem('kareID');
    
    if(savedUser && savedID && savedUser !== 'null') {
        aktifKullanici = savedUser; 
        aktifKullaniciID = savedID;
        if(document.getElementById('authBtn')) document.getElementById('authBtn').innerHTML = '👤 ' + aktifKullanici;
    } else {
        if(document.getElementById('authBtn')) document.getElementById('authBtn').innerHTML = '👤 Giriş Yap / Üye Ol';
    }

    const savedCart = localStorage.getItem('kareSepet');
    if(savedCart) sepet = JSON.parse(savedCart);
    renderCart();

    vitriniDoldur();
    showView('anaSayfaView');

    // Escape tuşu ile modalları kapat
    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape') {
            closeAllDrawers();
            if(document.getElementById('checkoutOverlay').style.display === 'flex') closeCheckout();
            if(document.getElementById('loginModal').style.display === 'flex') toggleLogin();
            if(document.getElementById('quizOverlay').style.display === 'flex') closeQuiz();
            if(document.getElementById('infoModalOverlay').style.display === 'flex') document.getElementById('infoModalOverlay').style.display = 'none';
            if(document.getElementById('adresModalOverlay').style.display === 'flex') closeAdresModal();
            if(document.getElementById('kartModalOverlay').style.display === 'flex') closeKartModal();
        }
    });

    // Arama önerileri dışarı tıklayınca kapansın
    document.addEventListener('click', (e) => {
        const searchBar = document.querySelector('.search-bar');
        const box = document.getElementById('searchSuggestions');
        if(box && searchBar && !searchBar.contains(e.target)) box.style.display = 'none';
    });
});

window.showView = function(viewId, pushToHistory = true) {
    if(document.getElementById('anaSayfaView')) document.getElementById('anaSayfaView').style.display = 'none';
    if(document.getElementById('hesabimView')) document.getElementById('hesabimView').style.display = 'none';
    if(document.getElementById('urunDetayView')) document.getElementById('urunDetayView').style.display = 'none';
    if(document.getElementById(viewId)) document.getElementById(viewId).style.display = 'block';
    window.scrollTo(0,0);

    // Tarayıcının geçmişine (URL barına) bu adımı ekle
    if(pushToHistory) {
        history.pushState({ view: viewId }, "", "#" + viewId);
    }
};

// Kullanıcı tarayıcının "GERİ" tuşuna bastığında tetiklenecek olay
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.view) {
        showView(event.state.view, false); // Geçmişten gelen sayfayı aç
    } else {
        showView('anaSayfaView', false); // Hiçbir şey yoksa anasayfaya at
    }
    const sticky = document.getElementById('stickyFooter');
    if(sticky) sticky.classList.remove('visible');
});

window.handleAuthClick = function() {
    const butonYazisi = document.getElementById('authBtn').innerText;
    
    if (butonYazisi.includes('Giriş Yap')) {
        toggleLogin(); 
    } else {
        const gercekKullanici = aktifKullanici || sessionStorage.getItem('kareUser');
        if(document.getElementById('accNameDisplay')) {
            document.getElementById('accNameDisplay').innerText = gercekKullanici;
        }
        
        showView('hesabimView'); 
        try {
            hesapTabGoster('siparisler'); 
            siparisleriGetir();      
            adresleriGetir(); 
            kartlariGetir(); 
        } catch(e) { console.error("Hesabım yüklenirken hata:", e); }
    }
};

window.cikisYap = function() {
    aktifKullanici = null; aktifKullaniciID = null;
    sessionStorage.removeItem('kareUser'); sessionStorage.removeItem('kareID');
    if(document.getElementById('authBtn')) document.getElementById('authBtn').innerHTML = '👤 Giriş Yap / Üye Ol';
    showView('anaSayfaView');
    showToast("Başarıyla çıkış yapıldı!");
};

window.formatTL = function(price) { return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price); };

window.temaDegistir = function() {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('karekoku_tema', document.body.classList.contains('light-theme') ? 'light' : 'dark');
};

// --- BİLGİ MODALLARI (GELİŞMİŞ KURUMSAL METİNLER) ---
const siteInfoContent = {
    "neden": { 
        title: "Neden Karekoku?", 
        html: `
            <p>Karekoku olarak en büyük önceliğimiz <strong>%100 Orijinallik</strong> ve <strong>Maksimum Hijyen</strong> kurallarına uymaktır.</p>
            <ul style="margin-top: 15px; margin-bottom: 15px; padding-left: 20px;">
                <li style="margin-bottom: 10px;"><strong>Orijinallik Garantisi:</strong> Tüm parfümlerimiz resmi distribütörlerden ve güvenilir Avrupa B2B toptancılarından faturalı olarak temin edilir.</li>
                <li style="margin-bottom: 10px;"><strong>Steril Dolum (Dekant):</strong> Şişelerden dekantlara (küçük cam şişelere) aktarım sırasında parfümler asla havayla temas etmez. Özel medikal şırınga yöntemleri kullanılarak milimetrik hassasiyetle dolum yapılır. Böylece parfümün yapısı ve kalıcılığı asla bozulmaz.</li>
                <li><strong>Ulaşılabilir Lüks:</strong> Binlerce lira değerindeki niş parfümleri kör alış yapmadan önce uygun fiyatlarla deneme fırsatı sunuyoruz.</li>
            </ul>` 
    },
    "hakkimizda": { 
        title: "Hakkımızda", 
        html: `
            <p>Karekoku, niş ve tasarımcı parfüm dünyasının en seçkin eserlerine herkesin ulaşabilmesi amacıyla kurulmuş yenilikçi bir platformdur.</p>
            <p style="margin-top: 15px;">Koku hafızasının insan hayatındaki gücüne inanıyoruz. Amacımız, müşterilerimize sadece bir parfüm satmak değil, kendi imza kokularını bulma serüveninde güvenilir bir rehberlik sunmaktır. Şeffaf ve vizyoner ekibimizle, Türkiye'nin her yerine lüksü şişeleyip gönderiyoruz.</p>` 
    },
    "iletisim": { 
        title: "İletişim Bilgileri", 
        html: `
            <p>Her türlü soru, öneri ve destek talebiniz için bize aşağıdaki kanallardan ulaşabilirsiniz:</p>
            <div style="background: var(--bg); padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px solid var(--border);">
                <p style="margin-bottom: 10px;">📍 <strong>Adres:</strong> Işık Üniversitesi Kampüsü Yurdu, A Blok, Şile / İstanbul</p>
                <p style="margin-bottom: 10px;">📱 <strong>WhatsApp Destek Hattı:</strong> 0566 987 12 99 <br><span style="font-size: 11px; color: var(--muted);">(Hafta içi 09:00 - 18:00 arası aktiftir)</span></p>
                <p>✉️ <strong>E-Posta:</strong> infokarekoku@gmail.com</p>
            </div>
            <p style="margin-top: 15px; font-size: 12px; color: var(--muted);"><em>E-postalarınıza en geç 24 saat içerisinde dönüş yapılmaktadır.</em></p>` 
    },
    "blog": { 
        title: "Karekoku Blog & Rehber", 
        html: `
            <p>Koku dünyasının gizemli derinliklerine inmeye hazır mısınız?</p>
            <p style="margin-top: 15px; color: var(--active-theme); font-weight: bold;">Çok yakında bu bölümde:</p>
            <ul style="margin-top: 10px; margin-bottom: 15px; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Notaların (Alt, Orta, Üst) sırları ve ten uyumu,</li>
                <li style="margin-bottom: 8px;">Mevsime ve ortama göre parfüm seçme rehberleri,</li>
                <li style="margin-bottom: 8px;">Dünyaca ünlü niş parfüm evlerinin tarihçeleri,</li>
                <li>Editörün seçimi "Top 10 En Kalıcı Parfümler" listeleri sizlerle olacak!</li>
            </ul>
            <p>Bizi takipte kalın!</p>` 
    },
    "sss": { 
        title: "Sıkça Sorulan Sorular (S.S.S.)", 
        html: `
            <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 5px;">1. Parfümleriniz gerçekten orijinal mi?</h3>
            <p style="margin-bottom: 20px;">Evet, stoklarımızdaki tüm ürünler %100 orijinaldir ve resmi tedarikçilerden faturalı olarak alınır. Kesinlikle tester, replika veya muadil ürün satışı yapmıyoruz.</p>
            
            <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 5px;">2. Dekant (Dolum) işlemi nasıl yapılıyor?</h3>
            <p style="margin-bottom: 20px;">Orijinal şişesinden, hava ile temas etmeden steril şırıngalar yardımıyla milimi milimine çekilip özel cam dekant şişelerine aktarılır.</p>
            
            <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 5px;">3. Hangi kargo ile çalışıyorsunuz?</h3>
            <p>Siparişleriniz dökülmeye ve kırılmaya karşı ekstra güvenli paketleme ile korunaklı olarak gönderilmektedir.</p>` 
    },
    "odeme": { 
        title: "Ödeme ve Teslimat Süreçleri", 
        html: `
            <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 10px;">Ödeme Güvenliği</h3>
            <p style="margin-bottom: 20px;">Sitemizdeki tüm ödemeler <strong>PayTR</strong> altyapısı ile 256-bit SSL sertifikası güvencesi altında gerçekleşir. Kredi veya Banka kartı bilgileriniz sistemimizde kesinlikle saklanmaz ve 3. şahısların eline geçemez.</p>
            
            <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 10px;">Teslimat ve Kargo</h3>
            <ul style="padding-left: 20px;">
                <li style="margin-bottom: 8px;">Saat 14:00'a kadar verilen siparişler <strong>aynı gün</strong> kargoya teslim edilir.</li>
                <li style="margin-bottom: 8px;">2000 TL ve üzeri siparişlerinizde <strong>Kargo Ücretsizdir</strong>. (Altındaki siparişlerde sabit 95 TL kargo ücreti yansıtılır.)</li>
                <li>Kargoya verilen ürünler bulunduğunuz ile ve ilçeye göre ortalama 1-3 iş günü içerisinde size ulaşır.</li>
            </ul>` 
    },
    "iade": { 
        title: "İade Şartları ve Prosedürü", 
        html: `
            <p>Müşteri memnuniyeti bizim için önemlidir ancak hijyen ve sağlık kuralları gereği kozmetik ürünlerinde iade prosedürü yasalara tabidir.</p>
            <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin-top: 15px; margin-bottom: 15px;">
                <strong style="color: #ef4444;">Dekant (Dolum) Parfümler Hakkında:</strong>
                <p style="margin-top: 5px; color: var(--text);">Bu ürünler siparişinize özel olarak orijinal şişesinden çekilip hazırlandığı için, Tüketici Hakları Mesafeli Sözleşmeler Yönetmeliği gereği <strong>cayma hakkı kapsamı dışındadır ve iadesi/değişimi kesinlikle yapılamaz.</strong></p>
            </div>
            <p>Kargoda hasar görmüş, şişesi kırılmış, dökülmüş veya yanlış gönderilmiş ürünler için teslimat günü (kargo paketini açarken çektiğiniz video ile birlikte) bizimle iletişime geçmeniz halinde derhal telafi ve değişim sağlanır.</p>` 
    },
    "gizlilik": { 
        title: "Gizlilik Politikası ve KVKK", 
        html: `
            <p><strong>Kişisel Verilerin Korunması (KVKK)</strong></p>
            <p style="margin-top: 10px; margin-bottom: 15px;">Karekoku olarak kişisel verilerinizin güvenliğine en üst düzeyde önem veriyoruz. Sitemize üye olurken veya alışveriş yaparken paylaştığınız bilgiler (Ad, soyad, adres, telefon, e-posta) sadece siparişinizin size sağlıklı bir şekilde ulaşması amacıyla işlenir.</p>
            <p style="margin-bottom: 15px;">Bu bilgiler hiçbir suretle pazarlama şirketleri veya 3. şahıslarla paylaşılmaz, satılmaz.</p>
            <p>Sistemimiz yüksek güvenlikli sunucularda barındırılmakta olup, ödeme esnasında girilen kart bilgileri doğrudan BDDK onaylı ödeme kuruluşunun (PayTR) ekranlarında gerçekleşir, veritabanımıza kaydedilmez.</p>` 
    }
};

window.showInfoModal = function(key) {
    const data = siteInfoContent[key];
    if(data) {
        document.getElementById('infoTitle').innerText = data.title;
        document.getElementById('infoContent').innerHTML = data.html;
        document.getElementById('infoModalOverlay').style.display = 'flex';
    }
};

// --- SQL BAĞLANTISI VE VİTRİN ---
async function vitriniDoldur() {
    try {
        const grid = document.getElementById('urunGrid');
        if(grid) {
            let skeletonHTML = '';
            for(let i = 0; i < 6; i++) {
                skeletonHTML += `<div class="card" style="animation: pulse 1.5s ease-in-out infinite;"><div style="width:100%;height:280px;background:var(--border);border-radius:4px;margin-bottom:15px;"></div><div style="height:12px;width:60%;background:var(--border);border-radius:4px;margin-bottom:10px;"></div><div style="height:18px;width:80%;background:var(--border);border-radius:4px;margin-bottom:15px;"></div><div style="height:40px;background:var(--border);border-radius:4px;"></div></div>`;
            }
            grid.innerHTML = skeletonHTML;
        }
        const response = await apiFetch(`${API_URL}/api/parfumler`, { credentials: 'include' });
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
        
        db = sqlParfumler.map((urun) => {
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
        
        const uniqueBrands = [...new Set(db.map(p => p.marka))].sort();
        const markaContainer = document.getElementById('markaFiltreleri');
        if(markaContainer) {
            markaContainer.innerHTML = '';
            uniqueBrands.forEach(m => { markaContainer.innerHTML += `<label class="custom-cb"><input type="checkbox" value="${m.toLowerCase()}" onchange="filtreleriUygula()"> ${m}</label>`; });
        }
        renderProducts(db);
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
                <img src="${p.gorsel}" onclick="openUrunSayfasi('${p.id}')" onerror="this.src='${fallbackImg}'" style="cursor: pointer;">
                
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
};

window.filtreleriUygula = function () {
    if(!document.getElementById('searchInput')) return;
    const aranan = document.getElementById('searchInput').value.toLowerCase().trim();
    const seciliMarkalar = Array.from(document.querySelectorAll('#markaFiltreleri input:checked')).map(cb => cb.value);
    const seciliKategoriler = Array.from(document.querySelectorAll('#kategoriFiltreleri input:checked')).map(cb => cb.value);
    const seciliCinsiyetler = Array.from(document.querySelectorAll('#cinsiyetFiltreleri input:checked')).map(cb => cb.value);
    const seciliKokular = Array.from(document.querySelectorAll('#kokuFiltreleri input:checked')).map(cb => cb.value);

    const filtrelenmis = db.filter(p => {
        const aramayaUyar = aranan === "" || p.ad.toLowerCase().includes(aranan) || p.marka.toLowerCase().includes(aranan) || p.notalar.toLowerCase().includes(aranan);
        const anaKategoriUyar = seciliAnaKategori === "" || p.kategori === seciliAnaKategori;
        const anaCinsiyetUyar = seciliAnaCinsiyet === "" || p.cinsiyet === seciliAnaCinsiyet;
        const markayaUyar = seciliMarkalar.length === 0 || seciliMarkalar.includes(p.marka.toLowerCase());
        const kategoriyeUyar = seciliKategoriler.length === 0 || seciliKategoriler.includes(p.kategori);
        const cinsiyeteUyar = seciliCinsiyetler.length === 0 || seciliCinsiyetler.includes(p.cinsiyet);
        const kokuyaUyar = seciliKokular.length === 0 || seciliKokular.includes(p.koku);
        return aramayaUyar && anaKategoriUyar && anaCinsiyetUyar && markayaUyar && kategoriyeUyar && cinsiyeteUyar && kokuyaUyar;
    });
    renderProducts(filtrelenmis);
};

window.setMainKategori = function(kat, event) {
    seciliAnaKategori = kat;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
    filtreleriUygula();
};

window.setMainCinsiyet = function(cin, event) {
    seciliAnaCinsiyet = cin;
    document.querySelectorAll('.pill-btn').forEach(btn => btn.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
    filtreleriUygula();
};

window.aramaOnerileriGetir = function() {
    const val = document.getElementById('searchInput').value.toLowerCase().trim();
    const box = document.getElementById('searchSuggestions');
    if(!box) return;
    if(val.length < 2) { box.style.display = 'none'; filtreleriUygula(); return; }
    const matches = db.filter(p => p.ad.toLowerCase().includes(val) || p.marka.toLowerCase().includes(val) || p.notalar.toLowerCase().includes(val)).slice(0, 5);
    
    if(matches.length > 0) {
        box.innerHTML = matches.map(m => `
            <div class="suggestion-item" onclick="oneriSec('${m.ad.replace(/'/g, "\\'")}')">
                <img src="${m.gorsel}" onerror="this.src='${fallbackImg}'">
                <div><b style="color:var(--active-theme)">${m.marka}</b><br>${m.ad}</div>
            </div>
        `).join('');
        box.style.display = 'block';
    } else { box.style.display = 'none'; }
    filtreleriUygula();
};

window.oneriSec = function(ad) { document.getElementById('searchInput').value = ad; document.getElementById('searchSuggestions').style.display = 'none'; filtreleriUygula(); };

// --- SEPET FONKSİYONLARI ---
window.fiyatGuncelle = function (id) {
    const p = db.find(x => String(x.id) === String(id));
    if(p) document.getElementById(`price-${id}`).innerText = formatTL(p.v[document.getElementById(`vol-${id}`).value]);
};
window.sepeteEkle = function (id) {
    const p = db.find(x => String(x.id) === String(id)); if(!p) return;
    const ml = parseInt(document.getElementById(`vol-${id}`).value);
    
    // 🌟 STOK KATMANI: Bu parfümden sepette halihazırda kaç ml var hesaplıyoruz
    const sepettekiToplamMl = sepet
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

    // Stok yeterliyse senin mevcut sepet mantığın tıkır tıkır çalışır:
    const m = sepet.find(i => String(i.id) === String(id) && i.ml === ml);
    if (m) m.adet += 1; else sepet.push({ id: p.id, ad: p.ad, marka: p.marka, ml: ml, fiyat: p.v[ml], adet: 1, gorsel: p.gorsel });
    localStorage.setItem('kareSepet', JSON.stringify(sepet)); 
    renderCart(); showToast(`${p.ad} sepete eklendi!`);
};

window.renderCart = function () {
    const container = document.getElementById('cartItems'); if(!container) return;
    container.innerHTML = ''; let top = 0;

    if (sepet.length === 0) {
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
        sepet.forEach((i, idx) => {
            top += i.fiyat * i.adet;
            urunlerHTML += `
                <div class="cart-item">
                    <img src="${i.gorsel}" onerror="this.src='${fallbackImg}'">
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
        if(document.getElementById('sepetSayaci')) document.getElementById('sepetSayaci').innerText = sepet.reduce((t, i) => t + i.adet, 0);
    }
};

window.sepettenCikar = function(index) { sepet.splice(index, 1); localStorage.setItem('kareSepet', JSON.stringify(sepet)); renderCart(); };

window.sepetMiktarDegistir = function(index, degisim) {
    if(!sepet[index]) return;
    sepet[index].adet += degisim;
    if(sepet[index].adet <= 0) sepet.splice(index, 1);
    localStorage.setItem('kareSepet', JSON.stringify(sepet));
    renderCart();
};

// --- ÖDEME EKRANI (CHECKOUT) ---
window.openCheckout = function() {
    if (!sepet || sepet.length === 0) { showToast("Sepetiniz boş, lütfen önce ürün ekleyin!", true); return; }
    if (!aktifKullanici) { showToast("Sipariş verebilmek için lütfen önce giriş yapın!", true); closeAllDrawers(); toggleLogin(); return; }

    // 🌟 ÖN YÜZ GÜMRÜK KONTROLÜ: Ödeme ekranı açılmadan önce sepetteki her şeyi canlı stokla eşleştiriyoruz
    for (let item of sepet) {
        const p = db.find(x => String(x.id) === String(item.id));
        if (p) {
            // Bu ürünün sepetteki toplam ml miktarını hesapla
            const toplamIstenenMl = sepet
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
    document.getElementById('adresAd').value = aktifKullanici; 
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

    let genelToplam = sepet.reduce((t, item) => t + (item.fiyat * item.adet), 0);

    showToast("Kupon kontrol ediliyor...", false);

    try {
        const response = await apiFetch(`${API_URL}/api/kupon`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ kod: kod }) 
        });
        const data = await response.json();
        if(response.ok) {
            // Sepet alt limit kontrolü (Tutar indirimleri için)
            if (data.tip === 'Tutar' && genelToplam < data.deger * 2) {
                showToast(`❌ Bu kuponu kullanabilmek için sepet tutarınız en az ${data.deger * 2} TL olmalıdır!`, true);
                return;
            }

            uygulananKupon = { kod: kod, tip: data.tip, deger: data.deger };
            let mesaj = data.tip === 'Yuzde' ? `%${data.deger} İndirim` : `${data.deger} TL Nakit İndirim`;
            showToast(`✅ ${data.mesaj} (${mesaj})`);
            goToPayment(); 
        } else {
            uygulananKupon = null;
            showToast("❌ " + data.hata, true);
        }
    } catch(e) {
        showToast("❌ Sunucuya bağlanılamadı!", true);
    }
};

window.kuponIptal = function() {
    uygulananKupon = null;
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
    
    sepet.forEach(item => {
        genelToplam += item.fiyat * item.adet;
        ozetHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:var(--muted);">
                <span>${item.adet}x ${item.ad} (${item.ml}ml)</span>
                <span style="color:var(--text);">${formatTL(item.fiyat * item.adet)}</span>
            </div>`;
    });
    ozetHTML += `</div>`;

    let indirimMiktari = 0;
    if(uygulananKupon) {
        if(uygulananKupon.tip === 'Yuzde') {
            indirimMiktari = (genelToplam * uygulananKupon.deger) / 100;
            ozetHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:var(--active-theme); font-weight: 600;">
                <span>Kupon (${uygulananKupon.kod} - %${uygulananKupon.deger}): <button onclick="kuponIptal()" style="background:none; border:none; color:#ef4444; font-size:11px; cursor:pointer; text-decoration:underline; font-weight:bold;">İptal Et</button></span>
                <span>-${formatTL(indirimMiktari)}</span>
            </div>`;
        } else if (uygulananKupon.tip === 'Tutar') {
            indirimMiktari = uygulananKupon.deger;
            // Güvenlik: İndirim sepet toplamını asla aşamaz (Alt limit kontrolü yukarıda var ama garanti olsun)
            if(indirimMiktari > genelToplam) indirimMiktari = genelToplam; 
            ozetHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:8px; color:var(--active-theme); font-weight: 600;">
                <span>Kupon (${uygulananKupon.kod} - ${uygulananKupon.deger} TL): <button onclick="kuponIptal()" style="background:none; border:none; color:#ef4444; font-size:11px; cursor:pointer; text-decoration:underline; font-weight:bold;">İptal Et</button></span>
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
    sepet.forEach(item => genelToplam += item.fiyat * item.adet);
    
    let indirimMiktari = 0;
    if(uygulananKupon) {
        if(uygulananKupon.tip === 'Yuzde') indirimMiktari = (genelToplam * uygulananKupon.deger) / 100;
        else if (uygulananKupon.tip === 'Tutar') indirimMiktari = uygulananKupon.deger > genelToplam ? genelToplam : uygulananKupon.deger;
    }
    
    let indirimliToplam = genelToplam - indirimMiktari;
    let kargoUcreti = (indirimliToplam >= 2000) ? 0 : 95;
    let odenecekTutar = indirimliToplam + kargoUcreti;

    const siparisNo = "KARE-" + Math.floor(100000 + Math.random() * 900000);

    showToast("Ödemeniz bankadan onaylanıyor...", false);
    
    try {
        const response = await apiFetch(`${API_URL}/api/siparis`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ 
                kullaniciID: aktifKullaniciID, 
                siparisNo: siparisNo,
                adSoyad: aktifKullanici, 
                telefon: tel,
                sehir: il,
                ilce: ilce,
                mahalle: "Belirtilmedi", 
                acikAdres: detay,
                toplamTutar: odenecekTutar,
                sepet: sepet,
                kuponKodu: uygulananKupon ? uygulananKupon.kod : null 
            }) 
        });

        if(response.ok) {
            showToast("✅ Sipariş Başarılı! Yönlendiriliyorsunuz...", false);
            
            setTimeout(() => {
                document.getElementById('siparisNoText').innerText = siparisNo;
                document.getElementById('step2-payment').style.display = 'none';
                document.getElementById('step3-success').style.display = 'block';
                
                sepet = [];
                uygulananKupon = null; 
                localStorage.setItem('kareSepet', JSON.stringify(sepet));
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
    uygulananKupon = null;
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
        const response = await apiFetch(`${API_URL}/api/siparislerim`, { credentials: 'include' });
        
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
        const response = await apiFetch(`${API_URL}/api/adreslerim`, { credentials: 'include' });
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
                        ${aktifKullanici}<br>
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
        const response = await apiFetch(`${API_URL}/api/adres-sil/${adresID}`, {
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
        const response = await apiFetch(`${API_URL}/api/adres-ekle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                kullaniciID: aktifKullaniciID, 
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

// --- SİHİRLİ QUIZ ---
let quizAnswers = { cinsiyet: '', mevsim: '', ortam: '', koku: '', kategori: '' };
window.openQuiz = function() {
    quizAnswers = { cinsiyet: '', mevsim: '', ortam: '', koku: '', kategori: '' };
    for(let i=1; i<=5; i++) document.getElementById('quizQ'+i).style.display = i===1 ? 'block' : 'none';
    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('quizOverlay').style.display = 'flex';
};
window.closeQuiz = function() { document.getElementById('quizOverlay').style.display = 'none'; };
window.nextQ = function(step, ans) {
    if (step === 1) quizAnswers.cinsiyet = ans; else if (step === 2) quizAnswers.mevsim = ans; else if (step === 3) quizAnswers.ortam = ans; else if (step === 4) quizAnswers.koku = ans; else if (step === 5) quizAnswers.kategori = ans;
    document.getElementById('quizQ' + step).style.display = 'none';
    if (step < 5) document.getElementById('quizQ' + (step + 1)).style.display = 'block'; else sonuclariHesaplaVeGoster();
};
window.sonuclariHesaplaVeGoster = function() {
    let scoredDB = db.map(p => {
        let score = 0;
        if (p.cinsiyet === quizAnswers.cinsiyet || p.cinsiyet === 'unisex' || quizAnswers.cinsiyet === 'unisex') score += 15;
        if (p.koku === quizAnswers.koku) score += 10;
        if (quizAnswers.kategori === '' || p.kategori === quizAnswers.kategori) score += 5;
        if (quizAnswers.mevsim === 'yaz' && (p.koku === 'ferah' || p.koku === 'meyvemsi' || p.koku === 'ciceksi')) score += 5;
        if (quizAnswers.mevsim === 'kis' && (p.koku === 'odunsu' || p.koku === 'baharatli' || p.koku === 'gurme')) score += 5;
        if (quizAnswers.mevsim === 'dortmevsim') score += 3;
        if (quizAnswers.ortam === 'ofis' && (p.koku === 'ferah' || p.koku === 'ciceksi' || p.koku === 'meyvemsi')) score += 5;
        if (quizAnswers.ortam === 'gece' && (p.koku === 'odunsu' || p.koku === 'baharatli' || p.koku === 'gurme')) score += 5;
        if (quizAnswers.ortam === 'spor' && (p.koku === 'ferah' || p.koku === 'meyvemsi')) score += 5;
        return { ...p, quizScore: score };
    });
    let filtered = scoredDB.filter(p => p.quizScore >= 15);
    filtered.sort((a, b) => { if (b.quizScore !== a.quizScore) return b.quizScore - a.quizScore; return a.ad.localeCompare(b.ad); });
    let matched = filtered.slice(0, 5);
    let resHtml = '';
    matched.forEach(p => {
        let options = ''; for (let ml in p.v) options += `<option value="${ml}">${ml} ml - ${formatTL(p.v[ml])}</option>`;
        resHtml += `
        <div style="background:var(--bg); border:1px solid var(--border); padding:10px; border-radius:8px; display:flex; align-items:center; gap:10px; margin-bottom: 5px;">
            <img src="${p.gorsel}" style="width:50px; height:60px; border-radius:4px; object-fit:cover;" onerror="this.src='${fallbackImg}'">
            <div style="flex:1;">
                <div style="color:var(--active-theme); font-size:10px; font-weight:800; text-transform:uppercase;">${p.marka}</div>
                <div style="color:var(--text); font-size:13px; font-weight:700; margin-bottom:3px;">${p.ad}</div>
                <div style="color:var(--muted); font-size:11px;">Uyum Skoru: %${Math.min(100, Math.round((p.quizScore / 40) * 100))}</div>
            </div>
            <div style="display:flex; flex-direction:column; gap:5px; align-items:flex-end;">
                <select id="quiz-vol-${p.id}" style="padding:4px; background:var(--bg); border:1px solid var(--border); color:var(--text); font-size:10px; border-radius:4px; outline:none; font-family:var(--main-font); cursor:pointer;">${options}</select>
                <button class="add-btn" onclick="quizSepeteEkle('${p.id}')" style="padding: 6px 12px; font-size: 10px; width: 100%;">SEPETE AT</button>
            </div>
        </div>`;
    });
    if (matched.length === 0) resHtml = '<p style="color:var(--muted); font-size:13px; text-align:center;">Maalesef tam kriterlerinize uyan bir parfüm bulamadık.</p>';
    document.getElementById('quizResultList').innerHTML = resHtml;
    document.getElementById('quizResult').style.display = 'block';
};

window.quizSepeteEkle = function(id) {
    const p = db.find(x => String(x.id) === String(id)); if(!p) return;
    const ml = parseInt(document.getElementById(`quiz-vol-${id}`).value);

    // 🌟 QUIZ STOK KATMANI
    const sepettekiToplamMl = sepet
        .filter(item => String(item.id) === String(id))
        .reduce((toplam, item) => toplam + (item.ml * item.adet), 0);

    if (sepettekiToplamMl + ml > p.kalanStok) {
        const kalanKullanilabilir = p.kalanStok - sepettekiToplamMl;
        if (kalanKullanilabilir <= 0) {
            showToast(`❌ Bu parfümün kalan tüm stoğu zaten sepetinizde!`, true);
        } else {
            showToast(`❌ Yetersiz Stok! En fazla ${kalanKullanilabilir}ml daha ekleyebilirsiniz.`, true);
        }
        return;
    }

    const m = sepet.find(i => String(i.id) === String(id) && i.ml === ml);
    if (m) m.adet += 1; else sepet.push({ id: p.id, ad: p.ad, marka: p.marka, ml: ml, fiyat: p.v[ml], adet: 1, gorsel: p.gorsel });
    localStorage.setItem('kareSepet', JSON.stringify(sepet)); renderCart(); showToast(`${p.ad} sepete eklendi!`);
};

// --- MODALLAR VE GÜVENLİK ---
window.toggleDrawer = function (id) { closeAllDrawers(); document.getElementById(id).classList.add('open'); document.getElementById('overlay').style.display = 'block'; };
window.closeAllDrawers = function () { document.querySelectorAll('.drawer').forEach(d => d.classList.remove('open')); document.getElementById('overlay').style.display = 'none'; if(document.getElementById('searchSuggestions')) document.getElementById('searchSuggestions').style.display = 'none'; };
window.toggleLogin = function () { const m = document.getElementById('loginModal'); m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; };
window.showToast = function (msg, isError = false) { const t = document.getElementById('toast'); t.innerText = msg; t.className = 'toast show' + (isError ? ' error' : ''); setTimeout(() => t.classList.remove('show'), 3000); };
window.switchTab = function (tab) {
    document.getElementById('loginForm').style.display = 'none'; document.getElementById('registerForm').style.display = 'none'; document.getElementById('forgotForm').style.display = 'none'; document.getElementById('tabButtons').style.display = 'flex';
    if (tab === 'login') { document.getElementById('loginForm').style.display = 'block'; document.getElementById('tabLogin').style.background = 'var(--active-theme)'; document.getElementById('tabLogin').style.color = '#000'; document.getElementById('tabRegister').style.background = 'var(--bg)'; document.getElementById('tabRegister').style.color = 'var(--active-theme)';
    } else if (tab === 'register') { document.getElementById('registerForm').style.display = 'block'; document.getElementById('tabRegister').style.background = 'var(--active-theme)'; document.getElementById('tabRegister').style.color = '#000'; document.getElementById('tabLogin').style.background = 'var(--bg)'; document.getElementById('tabLogin').style.color = 'var(--active-theme)';
    } else if (tab === 'forgot') { 
        document.getElementById('forgotForm').style.display = 'block'; 
        document.getElementById('tabButtons').style.display = 'none'; 
        
        // Forma tıklandığında içini sıfırla ki eski kodlar ekranda kalmasın
        document.getElementById('forgotStep1').style.display = 'block';
        document.getElementById('forgotStep2').style.display = 'none';
        if(document.getElementById('forgotCode')) document.getElementById('forgotCode').value = '';
        if(document.getElementById('forgotNewPass')) document.getElementById('forgotNewPass').value = '';
    }
};

window.girisYap = async function() {
    const email = document.getElementById('loginEmail').value.trim(); 
    const sifre = document.getElementById('loginPass').value.trim();
    
    if(!email || !sifre) { showToast('Lütfen e-posta ve şifre girin!', true); return; }
    
    try {
        const response = await apiFetch(`${API_URL}/api/login`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email, sifre }) 
        });
        const data = await response.json();
        
        if (response.ok) { 
            aktifKullanici = data.kullanici; 
            aktifKullaniciID = data.id;
            sessionStorage.setItem('kareUser', data.kullanici); 
            sessionStorage.setItem('kareID', data.id); 
            
            if(document.getElementById('authBtn')) document.getElementById('authBtn').innerHTML = '👤 ' + data.kullanici; 
            
            toggleLogin(); 
            showToast('✅ Giriş başarılı!');

            if(document.getElementById('urunDetayView').style.display === 'block' && seciliPdpID) {
                const yorumForm = document.getElementById('pdpYorumFormu');
                if(yorumForm) {
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
                }
            }
        } else { 
            showToast('❌ ' + (data.hata || data.mesaj), true); 
        }
    } catch (err) { 
        showToast("❌ Sunucuya bağlanılamadı!", true); 
    }
};

window.kayitOl = async function () {
    const adSoyad = document.getElementById('regName').value.trim(); 
    const email = document.getElementById('regEmail').value.trim(); 
    const sifre = document.getElementById('regPass').value.trim();
    
    // Telefonu al, eğer boş bırakılmışsa boş metin olarak ayarla
    const telefon = document.getElementById('regPhone') ? document.getElementById('regPhone').value.trim() : "";

    // Telefon zorunlu değil, o yüzden sadece diğer 3'ünü kontrol ediyoruz
    if (!adSoyad || !email || !sifre) { showToast("Lütfen Ad, E-posta ve Şifre alanlarını doldurun!", true); return; }
    
    showToast("Bilgiler sunucuya iletiliyor...");
    try {
        const response = await apiFetch(`${API_URL}/api/register`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            // Telefonu da paketleyip gönderiyoruz:
            body: JSON.stringify({ adSoyad, email, telefon, sifre }) 
        });
        const data = await response.json();
        
        if (response.ok) { 
            showToast("✅ Kayıt başarılı! Lütfen giriş yapın."); 
            // Başarılı kayıttan sonra kutuları temizle
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            if(document.getElementById('regPhone')) document.getElementById('regPhone').value = '';
            document.getElementById('regPass').value = '';
            
            setTimeout(() => { switchTab('login'); }, 1500); 
        } else { 
            showToast("❌ " + (data.mesaj || data.hata), true); 
        }
    } catch (err) { 
        showToast("❌ Sunucuya bağlanılamadı!", true); 
    }
};

window.sifreSifirla = async function() {
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) { showToast("Lütfen e-posta adresinizi girin!", true); return; }
    
    showToast("E-posta gönderiliyor, lütfen bekleyin...", false);
    
    try {
        const response = await apiFetch(`${API_URL}/api/sifre-sifirla`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email }) 
        });
        const data = await response.json();
        
        if (response.ok) { 
            showToast("✅ " + data.mesaj); 
            // Başarılıysa Adım 2 ekranına geç
            document.getElementById('forgotStep1').style.display = 'none';
            document.getElementById('forgotStep2').style.display = 'block';
        } else { 
            showToast("❌ " + data.hata, true); 
        }
    } catch (e) { 
        showToast("❌ Sunucuya ulaşılamadı!", true); 
    }
};

window.yeniSifreBelirle = async function() {
    const email = document.getElementById('forgotEmail').value.trim();
    const kod = document.getElementById('forgotCode').value.trim();
    const yeniSifre = document.getElementById('forgotNewPass').value.trim();

    if (!kod || !yeniSifre) { showToast("Lütfen kodu ve yeni şifrenizi girin!", true); return; }
    if (yeniSifre.length < 6) { showToast("Yeni şifreniz en az 6 karakter olmalıdır!", true); return; }

    showToast("Şifreniz güncelleniyor...", false);
    
    try {
        const response = await apiFetch(`${API_URL}/api/sifre-yeni-belirle`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email, kod, yeniSifre }) 
        });
        const data = await response.json();
        
        if (response.ok) { 
            showToast("✅ " + data.mesaj); 
            setTimeout(() => switchTab('login'), 2000); // 2 sn sonra giriş ekranına at
        } else { 
            showToast("❌ " + data.hata, true); 
        }
    } catch (e) { 
        showToast("❌ Sunucuya ulaşılamadı!", true); 
    }
};

window.sifreDegistir = async function() {
    const eskiKutu = document.getElementById('eskiSifre'); const yeniKutu = document.getElementById('yeniSifre');
    if (!eskiKutu || !yeniKutu) return;
    const eskiSifre = eskiKutu.value.trim(); const yeniSifre = yeniKutu.value.trim();
    if (!eskiSifre || !yeniSifre) { showToast("Lütfen tüm alanları doldurun!", true); return; }
    if (yeniSifre.length < 6) { showToast("Yeni şifreniz en az 6 karakter olmalıdır!", true); return; }
    showToast("Şifreniz güncelleniyor...", false);
    try {
        const response = await apiFetch(`${API_URL}/api/sifre-degistir`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kullaniciID: aktifKullaniciID, eskiSifre: eskiSifre, yeniSifre: yeniSifre }), credentials: 'include' });
        const data = await response.json();
        if (response.ok) { showToast("✅ " + data.mesaj); eskiKutu.value = ''; yeniKutu.value = ''; } else { showToast("❌ " + data.hata, true); }
    } catch (e) { showToast("❌ Sunucuya ulaşılamadı!", true); }
};

// Formdaki yıldızlara tıklayınca rengini değiştiren fonksiyon
window.yildizSec = function(puan) {
    aktifYildiz = puan;
    for(let i=1; i<=5; i++) {
        const yildiz = document.getElementById('formYildiz-'+i);
        if(yildiz) yildiz.style.color = (i <= puan) ? 'var(--active-theme)' : 'var(--border)';
    }
};

// --- YENİ ÜRÜN DETAY SAYFASI (SEPHORA TARZI) ---
window.openUrunSayfasi = function(id) {
    const p = db.find(x => String(x.id) === String(id));
    if(!p) return;
    
    seciliPdpID = id;
    aktifYildiz = 5; 
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
    if(volSelect) {
        volSelect.innerHTML = options;
        volSelect.onchange = function() {
            let seciliFiyat = p.v[this.value];
            if(document.getElementById('pdpFiyat')) document.getElementById('pdpFiyat').innerText = formatTL(seciliFiyat);
            if(document.getElementById('stickyFiyat')) document.getElementById('stickyFiyat').innerText = formatTL(seciliFiyat);
        };
        volSelect.onchange();
    }

    const pdpOnerilenler = document.getElementById('pdpOnerilenler');
    if(pdpOnerilenler) {
        const onerilenler = db.filter(x => x.id !== id).sort(() => 0.5 - Math.random()).slice(0, 6);
        pdpOnerilenler.innerHTML = onerilenler.map(o => `
            <div style="min-width: 200px; max-width: 200px; border: 1px solid var(--border); border-radius: 8px; padding: 15px; background: var(--card); cursor:pointer; display: flex; flex-direction: column; transition: 0.3s;" onmouseover="this.style.borderColor='var(--active-theme)'" onmouseout="this.style.borderColor='var(--border)'" onclick="openUrunSayfasi('${o.id}')">
                <img src="${o.gorsel}" style="width: 100%; height: 180px; object-fit: contain; margin-bottom: 15px; border-radius: 4px;" onerror="this.src='${fallbackImg}'">
                <div style="font-size: 11px; font-weight: 800; color: var(--muted); letter-spacing: 1px; margin-bottom: 5px;">${o.marka.toUpperCase()}</div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 10px;">${o.ad}</div>
                <div style="margin-top: auto; font-weight: 900; font-size: 16px; color: var(--active-theme);">${formatTL(o.v[Object.keys(o.v)[0]])}</div>
            </div>
        `).join('');
    }

    const yorumForm = document.getElementById('pdpYorumFormu');
    if(yorumForm) {
        if (aktifKullanici) {
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
    const p = db.find(x => String(x.id) === String(seciliPdpID));
    if(!p) return;

    // 🌟 PDP STOK KATMANI
    const sepettekiToplamMl = sepet
        .filter(item => String(item.id) === String(seciliPdpID))
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

    const m = sepet.find(i => String(i.id) === String(seciliPdpID) && i.ml === ml);
    if (m) m.adet += 1; 
    else sepet.push({ id: p.id, ad: p.ad, marka: p.marka, ml: ml, fiyat: p.v[ml], adet: 1, gorsel: p.gorsel });
    localStorage.setItem('kareSepet', JSON.stringify(sepet)); 
    renderCart(); showToast(`${p.ad} sepete eklendi!`); toggleDrawer('cartDrawer'); 
};
// 🌟 DİNAMİK YORUM YÜKLEME (Matematik ve İstatistikler Burda) 🌟
window.yorumlarıPdpYukle = async function(parfumID) {
    const liste = document.getElementById('pdpYorumlarListesi');
    const ozetPanel = document.getElementById('pdpYorumOzeti');
    if(!liste) return;
    
    liste.innerHTML = '<p style="color: var(--muted);">⏳ Yorumlar getiriliyor...</p>';

    try {
        const response = await apiFetch(`${API_URL}/api/yorumlar/${parfumID}`, { credentials: 'include' });
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
        const response = await apiFetch(`${API_URL}/api/yorum-ekle`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parfumID: seciliPdpID, kullaniciID: aktifKullaniciID, yorumMetni: metin, puan: aktifYildiz })
        });

        if(response.ok) {
            showToast("✅ Yorumunuz başarıyla yayınlandı.");
            textarea.value = '';
            yildizSec(5); 
            yorumlarıPdpYukle(seciliPdpID); 
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
    if(!aktifKullaniciID) return;
    
    const eminMisiniz = confirm("Hesabınızı ve tüm verilerinizi kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!");
    if(!eminMisiniz) return;
    
    try {
        showToast("Hesabınız siliniyor...", false);
        const response = await apiFetch(`${API_URL}/api/hesap-sil/${aktifKullaniciID}`, {
            method: 'DELETE'
        });
        
        if(response.ok) {
            // 🚨 İŞTE ÇÖZÜM: Hesabı silerken tarayıcıda kalan kartları ve sepeti de temizliyoruz
            localStorage.removeItem('kareKartlar');
            localStorage.removeItem('kareSepet');
            sepet = [];
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
