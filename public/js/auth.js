// --- MODALLAR VE GÜVENLİK ---
window.toggleDrawer = function (id) { closeAllDrawers(); document.getElementById(id).classList.add('open'); document.getElementById('overlay').style.display = 'block'; };
window.closeAllDrawers = function () { document.querySelectorAll('.drawer').forEach(d => d.classList.remove('open')); document.getElementById('overlay').style.display = 'none'; if(document.getElementById('searchSuggestions')) document.getElementById('searchSuggestions').style.display = 'none'; };
window.toggleLogin = function () { const m = document.getElementById('loginModal'); m.style.display = m.style.display === 'flex' ? 'none' : 'flex'; };
window.showToast = function (msg, isError = false) { const t = document.getElementById('toast'); t.innerText = msg; t.className = 'toast show' + (isError ? ' error' : ''); setTimeout(() => t.classList.remove('show'), 3000); };
window.switchTab = function (tab) {
    document.getElementById('loginForm').style.display = 'none'; document.getElementById('registerForm').style.display = 'none'; document.getElementById('forgotForm').style.display = 'none'; if(document.getElementById('otpForm')) document.getElementById('otpForm').style.display = 'none'; document.getElementById('tabButtons').style.display = 'flex';
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
    } else if (tab === 'otp') {
        if(document.getElementById('otpForm')) document.getElementById('otpForm').style.display = 'block';
        document.getElementById('tabButtons').style.display = 'none';
    }
};

window.girisYap = async function() {
    const email = document.getElementById('loginEmail').value.trim(); 
    const sifre = document.getElementById('loginPass').value.trim();
    
    if(!email || !sifre) { showToast('Lütfen e-posta ve şifre girin!', true); return; }
    
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/login`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ email, sifre }) 
        });
        const data = await response.json();
        
        if (response.ok) { 
            KareState.aktifKullanici = data.kullanici; 
            KareState.aktifKullaniciID = data.id;
            KareState.aktifKullaniciEmail = data.email;
            KareState.aktifKullaniciMailOnayliMi = data.mailOnayliMi;
            sessionStorage.setItem('kareUser', data.kullanici); 
            sessionStorage.setItem('kareID', data.id); 
            sessionStorage.setItem('kareEmail', data.email);
            sessionStorage.setItem('kareMailOnayliMi', data.mailOnayliMi);
            sessionStorage.setItem('kareRol', data.rol);
            localStorage.setItem('kareToken', data.token);
            
            // YENİ: Favorileri çek
            try {
                const favRes = await apiFetch(`${KareState.API_URL}/api/favoriler/${data.id}`);
                if (favRes.ok) {
                    KareState.favoriler = await favRes.json();
                }
            } catch(e) {}
            // Vitrini favorilerle tekrar render et (ikona yansıması için)
            if(typeof window.renderProducts === 'function' && KareState.db.length > 0) window.renderProducts(KareState.db);
            
            if(document.getElementById('authBtn')) document.getElementById('authBtn').innerHTML = '👤 ' + data.kullanici; 
            

            toggleLogin(); 
            showToast('✅ Giriş başarılı!');

            if(document.getElementById('urunDetayView').style.display === 'block' && KareState.seciliPdpID) {
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
            if (data.requireOtp) {
                KareState.tempEmail = data.tempEmail || email;
                showToast('❌ Hesabınız onaylanmamış! Lütfen kodu girin.', true);
                switchTab('otp');
            } else {
                showToast('❌ ' + (data.hata || data.mesaj), true); 
            }
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
        const response = await apiFetch(`${KareState.API_URL}/api/register`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            // Telefonu da paketleyip gönderiyoruz:
            body: JSON.stringify({ adSoyad, email, telefon, sifre }) 
        });
        const data = await response.json();
        
        if (response.ok) {
            if (data.requireOtp) {
                KareState.tempEmail = email; // Store the email for OTP validation
                showToast("✅ Kayıt başarılı! Lütfen onay kodunu girin.");
                document.getElementById('regName').value = '';
                document.getElementById('regEmail').value = '';
                if(document.getElementById('regPhone')) document.getElementById('regPhone').value = '';
                document.getElementById('regPass').value = '';
                switchTab('otp');
            } else {
                showToast("✅ Kayıt başarılı! Lütfen giriş yapın."); 
                document.getElementById('regName').value = '';
                document.getElementById('regEmail').value = '';
                if(document.getElementById('regPhone')) document.getElementById('regPhone').value = '';
                document.getElementById('regPass').value = '';
                setTimeout(() => { switchTab('login'); }, 1500);
            }
        } else { 
            showToast("❌ " + (data.mesaj || data.hata), true); 
        }
    } catch (err) { 
        showToast("❌ Sunucuya bağlanılamadı!", true); 
    }
};

window.verifyRegisterOtp = async function() {
    const kod = document.getElementById('otpCode').value.trim();
    if (!kod || kod.length < 6) { showToast("Lütfen 6 haneli kodu girin!", true); return; }
    if (!KareState.tempEmail) { showToast("Oturum süresi doldu, lütfen tekrar giriş yapın.", true); return; }

    try {
        const response = await apiFetch(`${KareState.API_URL}/api/verify-register-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: KareState.tempEmail, kod })
        });
        const data = await response.json();
        if (response.ok) {
            showToast("✅ E-posta adresiniz onaylandı! Lütfen giriş yapın.");
            document.getElementById('otpCode').value = '';
            switchTab('login');
        } else {
            showToast("❌ " + (data.hata || data.mesaj), true);
        }
    } catch (err) {
        showToast("❌ Sunucuya bağlanılamadı!", true);
    }
};

window.resendRegisterOtp = async function() {
    if (!KareState.tempEmail) { showToast("Lütfen önce giriş yapın veya kayıt olun.", true); return; }
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/resend-register-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: KareState.tempEmail })
        });
        const data = await response.json();
        if (response.ok) {
            showToast("✅ Yeni kod gönderildi!");
        } else {
            showToast("❌ " + (data.hata || data.mesaj), true);
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
        const response = await apiFetch(`${KareState.API_URL}/api/sifre-sifirla`, { 
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
        const response = await apiFetch(`${KareState.API_URL}/api/sifre-yeni-belirle`, { 
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
        const response = await apiFetch(`${KareState.API_URL}/api/sifre-degistir`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kullaniciID: KareState.aktifKullaniciID, eskiSifre: eskiSifre, yeniSifre: yeniSifre }), credentials: 'include' });
        const data = await response.json();
        if (response.ok) { showToast("✅ " + data.mesaj); eskiKutu.value = ''; yeniKutu.value = ''; } else { showToast("❌ " + data.hata, true); }
    } catch (e) { showToast("❌ Sunucuya ulaşılamadı!", true); }
};

// Formdaki yıldızlara tıklayınca rengini değiştiren fonksiyon
window.yildizSec = function(puan) {
    KareState.aktifYildiz = puan;
    for(let i=1; i<=5; i++) {
        const yildiz = document.getElementById('formYildiz-'+i);
        if(yildiz) yildiz.style.color = (i <= puan) ? 'var(--active-theme)' : 'var(--border)';
    }
};

window.koduDogrula = async function() {
    const kod = document.getElementById('verifyCodeInput').value.trim();
    if (!kod || kod.length !== 6) { showToast('Lütfen 6 haneli kodu giriniz!', true); return; }
    
    showToast('Kod doğrulanıyor...', false);
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/verify-email`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: KareState.aktifKullaniciEmail, kod: kod })
        });
        const data = await response.json();
        if (response.ok) {
            showToast('✅ ' + data.mesaj);
            KareState.aktifKullaniciMailOnayliMi = true;
            sessionStorage.setItem('kareMailOnayliMi', 'true');
            document.getElementById('emailVerifyOverlay').style.display = 'none';
            openCheckout();
        } else {
            showToast('❌ ' + data.hata, true);
        }
    } catch (err) { showToast('❌ Sunucuya ulaşılamadı!', true); }
};

window.koduTekrarGonder = async function() {
    showToast('Yeni kod isteniyor...', false);
    try {
        const response = await apiFetch(`${KareState.API_URL}/api/resend-code`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: KareState.aktifKullaniciEmail })
        });
        const data = await response.json();
        if (response.ok) { showToast('✅ ' + data.mesaj); }
        else { showToast('❌ ' + data.hata, true); }
    } catch (err) { showToast('❌ Sunucuya ulaşılamadı!', true); }
};
