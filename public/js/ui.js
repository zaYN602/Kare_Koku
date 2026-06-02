window.showInfoModal = function(key) {
    const data = KareState.siteInfoContent[key];
    if(data) {
        document.getElementById('infoTitle').innerText = data.title;
        document.getElementById('infoContent').innerHTML = data.html;
        document.getElementById('infoModalOverlay').style.display = 'flex';
    }
};
