const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'public', 'app.js');
const jsDir = path.join(__dirname, 'public', 'js');
const lines = fs.readFileSync(appJsPath, 'utf8').split('\n');

if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
}

// Extract chunks exactly by line numbers (1-indexed matching)
// Line 1 is lines[0]
function getChunk(startLine, endLine) {
    return lines.slice(startLine - 1, endLine).join('\n');
}

// 1. API & State (1 - 26)
let apiStateChunk = getChunk(1, 26);
// 2. Init (27 - 133)
let initChunk = getChunk(27, 133);
// 3. Info Modals (134 - 229)
let infoChunk = getChunk(134, 229);
// 4. Shop / SQL (230 - 426)
let shopChunk = getChunk(230, 426);
// 5. Cart (427 - 516)
let cartChunk = getChunk(427, 516);
// 6. Checkout (517 - 1059)
let checkoutChunk = getChunk(517, 1059);
// 7. Quiz (1060 - 1136)
let quizChunk = getChunk(1060, 1136);
// 8. Auth & Modals (1137 - 1323)
let authChunk = getChunk(1137, 1323);
// 9. PDP (1324 - 1576)
let pdpChunk = getChunk(1324, 1576);

const stateVars = [
    'db', 'sepet', 'aktifKullanici', 'aktifKullaniciID', 'uygulananKupon', 
    'seciliAnaKategori', 'seciliAnaCinsiyet', 'seciliPdpID', 'aktifYildiz', 
    'API_URL', 'fallbackImg', 'siteInfoContent', 'quizAnswers'
];

function replaceStateVars(chunk) {
    let replaced = chunk;
    stateVars.forEach(v => {
        // match variable not preceded by a dot
        // In JS Regex, (?<!\\.) works.
        const reg = new RegExp(`(?<!\\.)\\b${v}\\b`, 'g');
        replaced = replaced.replace(reg, `KareState.${v}`);
    });
    // Fix object literal keys if any got replaced (e.g. { db: KareState.db } shouldn't have key replaced)
    // Actually, in our code, we don't have object keys exactly named like these that get replaced wrongly, except maybe 'id' but 'id' is not in stateVars.
    // Wait, in app.js line 247: const katalog = { ... } doesn't have these keys.
    // In db.push, { id: p.id ... } - no conflict.
    return replaced;
}

// Fix chunks
initChunk = replaceStateVars(initChunk);
infoChunk = replaceStateVars(infoChunk);
shopChunk = replaceStateVars(shopChunk);
cartChunk = replaceStateVars(cartChunk);
checkoutChunk = replaceStateVars(checkoutChunk);
quizChunk = replaceStateVars(quizChunk);
authChunk = replaceStateVars(authChunk);
pdpChunk = replaceStateVars(pdpChunk);

// API and State needs special handling because we want to MOVE the declarations to window.KareState
const stateJsContent = `
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
    quizAnswers: { cinsiyet: '', mevsim: '', ortam: '', koku: '', kategori: '' }
};
`;

// Extract apiFetch from apiStateChunk
// Lines 4 to 12
const apiJsContent = `
window.apiFetch = async function(url, options = {}) {
    if (!options.headers) options.headers = {};
    const token = localStorage.getItem('kareToken');
    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }
    options.credentials = 'include';
    return fetch(url, options);
};
`;

// Also extract siteInfoContent which is in infoChunk (lines 135 to 219)
const infoLines = fs.readFileSync(appJsPath, 'utf8').split('\n');
const siteInfoStr = infoLines.slice(134, 219).join('\n'); // 135 to 219
// We need to inject siteInfoContent into KareState
const stateJsFinal = stateJsContent + '\\nwindow.KareState.siteInfoContent = ' + siteInfoStr.replace('const siteInfoContent = ', '').trim() + '\\n';

// Remove the siteInfoContent declaration from infoChunk
let modifiedInfoChunk = infoChunk.replace(/const KareState\.siteInfoContent = \{[\s\S]*?\};\r?\n/, '');
// Because replaceStateVars already replaced 'siteInfoContent' to 'KareState.siteInfoContent'

// Let's just write them out
fs.writeFileSync(path.join(jsDir, 'state.js'), stateJsFinal);
fs.writeFileSync(path.join(jsDir, 'api.js'), apiJsContent);
fs.writeFileSync(path.join(jsDir, 'init.js'), initChunk);

// Wait, modifiedInfoChunk might be broken because of Regex. Let's just strip lines 135 to 219 manually!
// Info Modals (134 - 229) -> Line 135 to 219 is siteInfoContent. Line 220 is empty. Line 221 is showInfoModal.
// So we just take 221 to 229 for infoChunk!
let exactInfoChunk = getChunk(221, 229);
exactInfoChunk = replaceStateVars(exactInfoChunk);
fs.writeFileSync(path.join(jsDir, 'ui.js'), exactInfoChunk);

fs.writeFileSync(path.join(jsDir, 'shop.js'), shopChunk);
fs.writeFileSync(path.join(jsDir, 'cart.js'), cartChunk);
fs.writeFileSync(path.join(jsDir, 'checkout.js'), checkoutChunk);
fs.writeFileSync(path.join(jsDir, 'quiz.js'), quizChunk);
fs.writeFileSync(path.join(jsDir, 'auth.js'), authChunk);
fs.writeFileSync(path.join(jsDir, 'pdp.js'), pdpChunk);

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

console.log('Exact splitting completed.');
