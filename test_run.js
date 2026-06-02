const fs = require('fs');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync('public/index.html', 'utf8');

const dom = new JSDOM(html, {
    url: 'http://127.0.0.1:3000',
    runScripts: 'dangerously',
    resources: 'usable'
});

const window = dom.window;
const document = window.document;

window.localStorage = {
    getItem: () => null,
    setItem: () => {}
};
window.sessionStorage = {
    getItem: () => null,
    setItem: () => {}
};
window.fetch = async () => ({ ok: true, json: async () => ([]) });

// Execute scripts manually
const scripts = [
    'public/js/state.js',
    'public/js/api.js',
    'public/js/ui.js',
    'public/js/shop.js',
    'public/js/cart.js',
    'public/js/checkout.js',
    'public/js/quiz.js',
    'public/js/auth.js',
    'public/js/pdp.js',
    'public/js/init.js'
];

try {
    for (const src of scripts) {
        const code = fs.readFileSync(src, 'utf8');
        window.eval(code);
    }
    
    setTimeout(() => {
        console.log("SUCCESS! Grid HTML: ", document.getElementById('urunGrid').innerHTML.substring(0, 100));
        process.exit(0);
    }, 1000);
} catch (e) {
    console.error("ERROR CAUGHT:", e);
    process.exit(1);
}
