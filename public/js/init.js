function initApp() {
    if(localStorage.getItem('karekoku_tema') === 'light') document.body.classList.add('light-theme');
    
    // Görünmez duvarları zorla kapat
    const mainOverlay = document.getElementById('overlay');
    if(mainOverlay) mainOverlay.style.display = 'none';
    
    const savedUser = sessionStorage.getItem('kareUser');
    const savedID = sessionStorage.getItem('kareID');
    
    if(savedUser && savedID && savedUser !== 'null') {
        KareState.aktifKullanici = savedUser; 
        KareState.aktifKullaniciID = savedID;
        if(document.getElementById('authBtn')) document.getElementById('authBtn').innerHTML = '👤 ' + KareState.aktifKullanici;
    } else {
        if(document.getElementById('authBtn')) document.getElementById('authBtn').innerHTML = '👤 Giriş Yap / Üye Ol';
    }

    const savedCart = localStorage.getItem('kareSepet');
    if(savedCart) KareState.sepet = JSON.parse(savedCart);
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
        
        // Açılır menü dışına tıklanınca kapanması
        if (!e.target.closest('.filter-dropdown')) {
            document.querySelectorAll('.filter-dropdown-content').forEach(el => el.classList.remove('show'));
        }
    });
}

window.toggleDropdown = function(id, event) {
    if(event) {
        event.stopPropagation();
        event.preventDefault();
    }
    const target = document.getElementById(id);
    const wasOpen = target.classList.contains('show');
    
    // Diğer tüm dropdownları kapat
    document.querySelectorAll('.filter-dropdown-content').forEach(el => el.classList.remove('show'));
    
    // Tıklanan kapalıysa aç
    if(!wasOpen) {
        target.classList.add('show');
    }
};

window.toggleMobileSidebar = function() { const sidebar = document.querySelector('.shop-sidebar'); const overlay = document.getElementById('sidebarOverlay'); if(sidebar) sidebar.classList.toggle('open'); if(overlay) overlay.classList.toggle('active'); };

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initApp);
} else {
    // Tüm modüller yüklendiğinde ve tanımlamalar bittiğinde çalıştır
    setTimeout(initApp, 0); 
}

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
        const gercekKullanici = KareState.aktifKullanici || sessionStorage.getItem('kareUser');
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
    KareState.aktifKullanici = null; KareState.aktifKullaniciID = null;
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
