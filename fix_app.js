const fs = require('fs');
let code = fs.readFileSync('public/app.js', 'utf8');

const fetchWrapper = `
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

if (!code.includes('window.apiFetch')) {
    code = code.replace(/const API_URL = [^;]+;/, match => match + '\n' + fetchWrapper);
}

// Replace fetch calls
code = code.replace(/fetch\(/g, 'apiFetch(');
// Revert apiFetch in the wrapper itself
code = code.replace(/return apiFetch\(url, options\);/g, 'return fetch(url, options);');

// Update login to save token
code = code.replace(/aktifKullaniciID = data\.id;\s*localStorage\.setItem\('aktifKullanici',\s*aktifKullaniciID\);/, match => match + '\n            if(data.token) localStorage.setItem(\'kareToken\', data.token);');

// Update logout to remove token
code = code.replace(/localStorage\.removeItem\('aktifKullanici'\);/, match => match + '\n    localStorage.removeItem(\'kareToken\');');

fs.writeFileSync('public/app.js', code);
console.log('App.js updated successfully!');
