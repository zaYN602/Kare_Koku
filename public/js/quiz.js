// --- SİHİRLİ QUIZ ---
window.openQuiz = function() {
    KareState.quizAnswers = { cinsiyet: '', mevsim: '', ortam: '', koku: '', kategori: '' };
    for(let i=1; i<=5; i++) document.getElementById('quizQ'+i).style.display = i===1 ? 'block' : 'none';
    document.getElementById('quizResult').style.display = 'none';
    document.getElementById('quizOverlay').style.display = 'flex';
};
window.closeQuiz = function() { document.getElementById('quizOverlay').style.display = 'none'; };
window.nextQ = function(step, ans) {
    if (step === 1) KareState.quizAnswers.cinsiyet = ans; else if (step === 2) KareState.quizAnswers.mevsim = ans; else if (step === 3) KareState.quizAnswers.ortam = ans; else if (step === 4) KareState.quizAnswers.koku = ans; else if (step === 5) KareState.quizAnswers.kategori = ans;
    document.getElementById('quizQ' + step).style.display = 'none';
    if (step < 5) document.getElementById('quizQ' + (step + 1)).style.display = 'block'; else sonuclariHesaplaVeGoster();
};
window.sonuclariHesaplaVeGoster = function() {
    let scoredDB = KareState.db.map(p => {
        let score = 0;
        if (p.cinsiyet === KareState.quizAnswers.cinsiyet || p.cinsiyet === 'unisex' || KareState.quizAnswers.cinsiyet === 'unisex') score += 15;
        if (p.koku === KareState.quizAnswers.koku) score += 10;
        if (KareState.quizAnswers.kategori === '' || p.kategori === KareState.quizAnswers.kategori) score += 5;
        if (KareState.quizAnswers.mevsim === 'yaz' && (p.koku === 'ferah' || p.koku === 'meyvemsi' || p.koku === 'ciceksi')) score += 5;
        if (KareState.quizAnswers.mevsim === 'kis' && (p.koku === 'odunsu' || p.koku === 'baharatli' || p.koku === 'gurme')) score += 5;
        if (KareState.quizAnswers.mevsim === 'dortmevsim') score += 3;
        if (KareState.quizAnswers.ortam === 'ofis' && (p.koku === 'ferah' || p.koku === 'ciceksi' || p.koku === 'meyvemsi')) score += 5;
        if (KareState.quizAnswers.ortam === 'gece' && (p.koku === 'odunsu' || p.koku === 'baharatli' || p.koku === 'gurme')) score += 5;
        if (KareState.quizAnswers.ortam === 'spor' && (p.koku === 'ferah' || p.koku === 'meyvemsi')) score += 5;
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
            <img src="${p.gorsel}" style="width:50px; height:60px; border-radius:4px; object-fit:cover;" onerror="this.src='${KareState.fallbackImg}'">
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
    const p = KareState.db.find(x => String(x.id) === String(id)); if(!p) return;
    const ml = parseInt(document.getElementById(`quiz-vol-${id}`).value);

    // 🌟 QUIZ STOK KATMANI
    const sepettekiToplamMl = KareState.sepet
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

    const m = KareState.sepet.find(i => String(i.id) === String(id) && i.ml === ml);
    if (m) m.adet += 1; else KareState.sepet.push({ id: p.id, ad: p.ad, marka: p.marka, ml: ml, fiyat: p.v[ml], adet: 1, gorsel: p.gorsel });
    localStorage.setItem('kareSepet', JSON.stringify(KareState.sepet)); renderCart(); showToast(`${p.ad} sepete eklendi!`);
};
