const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'public', 'app.js');
const jsDir = path.join(__dirname, 'public', 'js');
let content = fs.readFileSync(appJsPath, 'utf8');

// Create public/js if not exists
if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
}

// 1. Replace state variables with window.KareState
const stateVars = [
    'db', 'sepet', 'aktifKullanici', 'aktifKullaniciID', 'uygulananKupon', 
    'seciliAnaKategori', 'seciliAnaCinsiyet', 'seciliPdpID', 'aktifYildiz', 
    'API_URL', 'fallbackImg', 'siteInfoContent', 'quizAnswers'
];

// We need to be careful with regex to not replace substrings of other words (e.g. padding -> padding, db -> KareState.db)
// Use word boundaries \b
stateVars.forEach(v => {
    // We only replace exact variables. 
    // We also must remove their declaration 'let db = ...' or 'const API_URL = ...'
    // But since we are creating KareState, we will just delete the declarations manually and replace the usages.
    const regex = new RegExp(`\\b${v}\\b`, 'g');
    
    // Some exceptions where 'db' or others might be an object property like 'res.db' (not applicable here, but safe to avoid \.)
    // Actually, simple \b is mostly fine, but let's be careful.
});

// To be 100% safe and precise, let's just write the modules manually in this script
// I will extract the logic directly.

// Instead of automated splitting which might break, I will just dump the split content into files directly from here.
// But wait, the app.js is large. It's safer if I use string manipulation on the raw content.

// Let's first remove the declarations at the top.
content = content.replace(/const API_URL = "http:\/\/127\.0\.0\.1:3000";/g, '');
content = content.replace(/const fallbackImg = "https:\/\/images\.unsplash\.com\/photo-1615486171448-4fb324aa8eb0\?auto=format&fit=crop&w=600&q=80";/g, '');
content = content.replace(/let db = \[\];[\s\S]*?let aktifYildiz = 5;/g, '');
content = content.replace(/const siteInfoContent = \{[\s\S]*?\};\n/g, '');
content = content.replace(/let quizAnswers = \{ cinsiyet: '', mevsim: '', ortam: '', koku: '', kategori: '' \};/g, '');

// Replace all usages. We must ignore property access like `obj.db`
stateVars.forEach(v => {
    // match variable not preceded by a dot
    const reg = new RegExp(`(?<!\\.)\\b${v}\\b`, 'g');
    content = content.replace(reg, `KareState.${v}`);
});

// Now we split the content into files based on comment blocks
const blocks = [
    { name: 'api.js', marker: 'window.apiFetch = async function', endMarker: '// 🌟 SAYFA YÜKLENDİĞİNDE 🌟' },
    { name: 'init.js', marker: '// 🌟 SAYFA YÜKLENDİĞİNDE 🌟', endMarker: 'window.showInfoModal = function' },
    { name: 'ui.js', marker: 'window.showInfoModal = function', endMarker: '// --- SQL BAĞLANTISI VE VİTRİN ---' },
    { name: 'shop.js', marker: '// --- SQL BAĞLANTISI VE VİTRİN ---', endMarker: '// --- SEPET FONKSİYONLARI ---' },
    { name: 'cart.js', marker: '// --- SEPET FONKSİYONLARI ---', endMarker: '// --- ÖDEME EKRANI (CHECKOUT) ---' },
    { name: 'checkout.js', marker: '// --- ÖDEME EKRANI (CHECKOUT) ---', endMarker: '// --- SİHİRLİ QUIZ ---' },
    { name: 'quiz.js', marker: '// --- SİHİRLİ QUIZ ---', endMarker: '// --- MODALLAR VE GÜVENLİK ---' },
    { name: 'auth.js', marker: '// --- MODALLAR VE GÜVENLİK ---', endMarker: '// --- YENİ ÜRÜN DETAY SAYFASI (SEPHORA TARZI) ---' },
    { name: 'pdp.js', marker: '// --- YENİ ÜRÜN DETAY SAYFASI (SEPHORA TARZI) ---', endMarker: 'EOF' }
];

let remainingContent = content;

fs.writeFileSync(path.join(jsDir, 'state.js'), `
window.KareState = {
    API_URL: "http://127.0.0.1:3000",
    fallbackImg: "https://images.unsplash.com/photo-1615486171448-4fb324aa8eb0?auto=format&fit=crop&w=600&q=80",
    db: [], 
    sepet: [],
    aktifKullanici: null, 
    aktifKullaniciID: null,
    uygulananKupon: null, 
    seciliAnaKategori: "",
    seciliAnaCinsiyet: "",
    seciliPdpID: null,
    aktifYildiz: 5,
    quizAnswers: { cinsiyet: '', mevsim: '', ortam: '', koku: '', kategori: '' },
    siteInfoContent: {
        "neden": { 
            title: "Neden Karekoku?", 
            html: \`
                <p>Karekoku olarak en büyük önceliğimiz <strong>%100 Orijinallik</strong> ve <strong>Maksimum Hijyen</strong> kurallarına uymaktır.</p>
                <ul style="margin-top: 15px; margin-bottom: 15px; padding-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong>Orijinallik Garantisi:</strong> Tüm parfümlerimiz resmi distribütörlerden ve güvenilir Avrupa B2B toptancılarından faturalı olarak temin edilir.</li>
                    <li style="margin-bottom: 10px;"><strong>Steril Dolum (Dekant):</strong> Şişelerden dekantlara (küçük cam şişelere) aktarım sırasında parfümler asla havayla temas etmez. Özel medikal şırınga yöntemleri kullanılarak milimetrik hassasiyetle dolum yapılır. Böylece parfümün yapısı ve kalıcılığı asla bozulmaz.</li>
                    <li><strong>Ulaşılabilir Lüks:</strong> Binlerce lira değerindeki niş parfümleri kör alış yapmadan önce uygun fiyatlarla deneme fırsatı sunuyoruz.</li>
                </ul>\` 
        },
        "hakkimizda": { 
            title: "Hakkımızda", 
            html: \`
                <p>Karekoku, niş ve tasarımcı parfüm dünyasının en seçkin eserlerine herkesin ulaşabilmesi amacıyla kurulmuş yenilikçi bir platformdur.</p>
                <p style="margin-top: 15px;">Koku hafızasının insan hayatındaki gücüne inanıyoruz. Amacımız, müşterilerimize sadece bir parfüm satmak değil, kendi imza kokularını bulma serüveninde güvenilir bir rehberlik sunmaktır. Şeffaf ve vizyoner ekibimizle, Türkiye'nin her yerine lüksü şişeleyip gönderiyoruz.</p>\` 
        },
        "iletisim": { 
            title: "İletişim Bilgileri", 
            html: \`
                <p>Her türlü soru, öneri ve destek talebiniz için bize aşağıdaki kanallardan ulaşabilirsiniz:</p>
                <div style="background: var(--bg); padding: 15px; border-radius: 8px; margin-top: 15px; border: 1px solid var(--border);">
                    <p style="margin-bottom: 10px;">📍 <strong>Adres:</strong> Işık Üniversitesi Kampüsü Yurdu, A Blok, Şile / İstanbul</p>
                    <p style="margin-bottom: 10px;">📱 <strong>WhatsApp Destek Hattı:</strong> 0566 987 12 99 <br><span style="font-size: 11px; color: var(--muted);">(Hafta içi 09:00 - 18:00 arası aktiftir)</span></p>
                    <p>✉️ <strong>E-Posta:</strong> infokarekoku@gmail.com</p>
                </div>
                <p style="margin-top: 15px; font-size: 12px; color: var(--muted);"><em>E-postalarınıza en geç 24 saat içerisinde dönüş yapılmaktadır.</em></p>\` 
        },
        "blog": { 
            title: "Karekoku Blog & Rehber", 
            html: \`
                <p>Koku dünyasının gizemli derinliklerine inmeye hazır mısınız?</p>
                <p style="margin-top: 15px; color: var(--active-theme); font-weight: bold;">Çok yakında bu bölümde:</p>
                <ul style="margin-top: 10px; margin-bottom: 15px; padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Notaların (Alt, Orta, Üst) sırları ve ten uyumu,</li>
                    <li style="margin-bottom: 8px;">Mevsime ve ortama göre parfüm seçme rehberleri,</li>
                    <li style="margin-bottom: 8px;">Dünyaca ünlü niş parfüm evlerinin tarihçeleri,</li>
                    <li>Editörün seçimi "Top 10 En Kalıcı Parfümler" listeleri sizlerle olacak!</li>
                </ul>
                <p>Bizi takipte kalın!</p>\` 
        },
        "sss": { 
            title: "Sıkça Sorulan Sorular (S.S.S.)", 
            html: \`
                <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 5px;">1. Parfümleriniz gerçekten orijinal mi?</h3>
                <p style="margin-bottom: 20px;">Evet, stoklarımızdaki tüm ürünler %100 orijinaldir ve resmi tedarikçilerden faturalı olarak alınır. Kesinlikle tester, replika veya muadil ürün satışı yapmıyoruz.</p>
                
                <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 5px;">2. Dekant (Dolum) işlemi nasıl yapılıyor?</h3>
                <p style="margin-bottom: 20px;">Orijinal şişesinden, hava ile temas etmeden steril şırıngalar yardımıyla milimi milimine çekilip özel cam dekant şişelerine aktarılır.</p>
                
                <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 5px;">3. Hangi kargo ile çalışıyorsunuz?</h3>
                <p>Siparişleriniz dökülmeye ve kırılmaya karşı ekstra güvenli paketleme ile korunaklı olarak gönderilmektedir.</p>\` 
        },
        "odeme": { 
            title: "Ödeme ve Teslimat Süreçleri", 
            html: \`
                <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 10px;">Ödeme Güvenliği</h3>
                <p style="margin-bottom: 20px;">Sitemizdeki tüm ödemeler <strong>PayTR</strong> altyapısı ile 256-bit SSL sertifikası güvencesi altında gerçekleşir. Kredi veya Banka kartı bilgileriniz sistemimizde kesinlikle saklanmaz ve 3. şahısların eline geçemez.</p>
                
                <h3 style="color: var(--active-theme); font-size: 16px; margin-bottom: 10px;">Teslimat ve Kargo</h3>
                <ul style="padding-left: 20px;">
                    <li style="margin-bottom: 8px;">Saat 14:00'a kadar verilen siparişler <strong>aynı gün</strong> kargoya teslim edilir.</li>
                    <li style="margin-bottom: 8px;">2000 TL ve üzeri siparişlerinizde <strong>Kargo Ücretsizdir</strong>. (Altındaki siparişlerde sabit 95 TL kargo ücreti yansıtılır.)</li>
                    <li>Kargoya verilen ürünler bulunduğunuz ile ve ilçeye göre ortalama 1-3 iş günü içerisinde size ulaşır.</li>
                </ul>\` 
        },
        "iade": { 
            title: "İade Şartları ve Prosedürü", 
            html: \`
                <p>Müşteri memnuniyeti bizim için önemlidir ancak hijyen ve sağlık kuralları gereği kozmetik ürünlerinde iade prosedürü yasalara tabidir.</p>
                <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin-top: 15px; margin-bottom: 15px;">
                    <strong style="color: #ef4444;">Dekant (Dolum) Parfümler Hakkında:</strong>
                    <p style="margin-top: 5px; color: var(--text);">Bu ürünler siparişinize özel olarak orijinal şişesinden çekilip hazırlandığı için, Tüketici Hakları Mesafeli Sözleşmeler Yönetmeliği gereği <strong>cayma hakkı kapsamı dışındadır ve iadesi/değişimi kesinlikle yapılamaz.</strong></p>
                </div>
                <p>Kargoda hasar görmüş, şişesi kırılmış, dökülmüş veya yanlış gönderilmiş ürünler için teslimat günü (kargo paketini açarken çektiğiniz video ile birlikte) bizimle iletişime geçmeniz halinde derhal telafi ve değişim sağlanır.</p>\` 
        },
        "gizlilik": { 
            title: "Gizlilik Politikası ve KVKK", 
            html: \`
                <p><strong>Kişisel Verilerin Korunması (KVKK)</strong></p>
                <p style="margin-top: 10px; margin-bottom: 15px;">Karekoku olarak kişisel verilerinizin güvenliğine en üst düzeyde önem veriyoruz. Sitemize üye olurken veya alışveriş yaparken paylaştığınız bilgiler (Ad, soyad, adres, telefon, e-posta) sadece siparişinizin size sağlıklı bir şekilde ulaşması amacıyla işlenir.</p>
                <p style="margin-bottom: 15px;">Bu bilgiler hiçbir suretle pazarlama şirketleri veya 3. şahıslarla paylaşılmaz, satılmaz.</p>
                <p>Sistemimiz yüksek güvenlikli sunucularda barındırılmakta olup, ödeme esnasında girilen kart bilgileri doğrudan BDDK onaylı ödeme kuruluşunun (PayTR) ekranlarında gerçekleşir, veritabanımıza kaydedilmez.</p>\` 
        }
    }
};
`);

// To avoid bad splits, let's just write main.js that imports them all.
fs.writeFileSync(path.join(jsDir, 'main.js'), `
import './state.js';
import './api.js';
import './ui.js';
import './shop.js';
import './cart.js';
import './checkout.js';
import './quiz.js';
import './auth.js';
import './pdp.js';
import './init.js';
`);

for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    let chunk = '';
    const startIndex = remainingContent.indexOf(block.marker);
    if (startIndex !== -1) {
        if (block.endMarker === 'EOF') {
            chunk = remainingContent.substring(startIndex);
        } else {
            const endIndex = remainingContent.indexOf(block.endMarker, startIndex);
            if (endIndex !== -1) {
                chunk = remainingContent.substring(startIndex, endIndex);
            } else {
                chunk = remainingContent.substring(startIndex);
            }
        }
        fs.writeFileSync(path.join(jsDir, block.name), chunk);
    }
}

console.log("Splitting completed successfully.");
