
window.apiFetch = async function(url, options = {}) {
    if (!options.headers) options.headers = {};
    const token = localStorage.getItem('kareToken');
    if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
    }
    options.credentials = 'include';
    return fetch(url, options);
};
