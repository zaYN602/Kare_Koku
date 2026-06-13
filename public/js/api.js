
window.apiFetch = async function(url, options = {}) {
    if (!options.headers) options.headers = {};
    const token = localStorage.getItem('kareToken');
    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }
    options.headers['ngrok-skip-browser-warning'] = '69420';
    options.credentials = 'include';
    return fetch(url, options);
};
