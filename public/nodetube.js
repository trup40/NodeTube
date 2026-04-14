// by trup40 (Eagle) 
// https://github.com/trup40/NodeTube
// 2026

let lang = localStorage.getItem('nodeTubeLang') || 'tr';

function applyLanguage() {
    document.getElementById('langToggleBtn').innerText = lang === 'tr' ? 'EN' : 'TR';
    document.getElementById('searchInput').placeholder = i18n[lang].search;
    document.getElementById('ui-prep-title').innerText = i18n[lang].prepTitle;
    document.getElementById('ui-prep-desc').innerText = i18n[lang].prepDesc;
    document.getElementById('ui-load').innerText = i18n[lang].loadMore;
    
    document.getElementById('langToggleBtn').title = i18n[lang].ttLang;
    document.getElementById('viewToggleBtn').title = i18n[lang].ttView;
    document.getElementById('favViewBtn').title = i18n[lang].ttFavs;
    document.getElementById('themeToggleBtn').title = i18n[lang].ttTheme;
    document.getElementById('clearInputBtn').title = i18n[lang].ttClear;
    document.getElementById('searchBtn').title = i18n[lang].ttSearch;
    document.getElementById('prevBtn').title = i18n[lang].ttPrev;
    document.getElementById('playBtn').title = i18n[lang].ttPlay;
    document.getElementById('nextBtn').title = i18n[lang].ttNext;
    document.getElementById('loopBtn').title = i18n[lang].ttLoop;
    document.getElementById('downloadBtn').title = i18n[lang].ttDownload;
    document.getElementById('playerFavBtn').title = i18n[lang].ttFavToggle;
    document.getElementById('volumeBtn').title = i18n[lang].ttVolume;
    
    document.querySelectorAll('.card-fav-btn').forEach(btn => btn.title = i18n[lang].ttFavToggle);
    document.querySelectorAll('.fav-up').forEach(btn => btn.title = i18n[lang].ttOrderUp);
    document.querySelectorAll('.fav-down').forEach(btn => btn.title = i18n[lang].ttOrderDown);
    
    updateEmptyState();
    const np = document.getElementById('now-playing');
    if(audio.src === "") { np.innerText = i18n[lang].wait; document.title = i18n[lang].pageTitle; } 
    else if(currentQueueIndex !== -1) {
        np.innerText = `${audio.paused ? i18n[lang].prep : i18n[lang].play}: ${globalQueue[currentQueueIndex].title}`;
        document.title = `▶ ${globalQueue[currentQueueIndex].title} | NodeTube`;
    }
}

function toggleLang() { lang = lang === 'tr' ? 'en' : 'tr'; localStorage.setItem('nodeTubeLang', lang); applyLanguage(); }

function updateEmptyState() {
    const container = document.getElementById('results');
    if(container.innerHTML.includes('id="empty-state"')) {
        if(isFavViewActive) container.innerHTML = `<div id="empty-state"><i class="far fa-heart"></i><h3>${i18n[lang].favTitle}</h3><p>${i18n[lang].favDesc}</p></div>`;
        else container.innerHTML = `<div id="empty-state"><i class="fas fa-headphones"></i><h3 id="ui-empty-title">${i18n[lang].emptyTitle}</h3><p id="ui-empty-desc">${i18n[lang].emptyDesc}</p></div>`;
    }
}

let currentQuery = ''; let currentPage = 1;
let searchVideos = []; let searchHasMore = false; 
let favoritesList = JSON.parse(localStorage.getItem('nodeTubeFavs')) || [];
let isFavViewActive = false; 
let viewMode = localStorage.getItem('nodeTubeView') || 'grid'; 
let globalQueue = []; let currentQueueIndex = -1;

const audio = document.getElementById('mainAudio');
const resultsDiv = document.getElementById('results');
const viewBtnIcon = document.getElementById('viewToggleBtn').querySelector('i');

window.onload = () => {
    if(viewMode === 'list') { resultsDiv.classList.replace('grid-view', 'list-view'); viewBtnIcon.className = 'fas fa-list'; }
    applyLanguage();
};

function toggleViewMode() {
    if (viewMode === 'grid') { viewMode = 'list'; resultsDiv.classList.replace('grid-view', 'list-view'); viewBtnIcon.className = 'fas fa-list'; } 
    else { viewMode = 'grid'; resultsDiv.classList.replace('list-view', 'grid-view'); viewBtnIcon.className = 'fas fa-th'; }
    localStorage.setItem('nodeTubeView', viewMode);
}

function toggleClearBtn() { document.getElementById('clearInputBtn').style.display = document.getElementById('searchInput').value ? 'block' : 'none'; }
function clearSearch() {
    document.getElementById('searchInput').value = ''; toggleClearBtn();
    searchVideos = []; searchHasMore = false;
    if(!isFavViewActive) resetApp(); else document.getElementById('loadMoreBtn').style.display = 'none';
}

function resetApp() {
    searchVideos = [];
    resultsDiv.innerHTML = `<div id="empty-state"><i class="fas fa-headphones"></i><h3 id="ui-empty-title">${i18n[lang].emptyTitle}</h3><p id="ui-empty-desc">${i18n[lang].emptyDesc}</p></div>`;
    document.getElementById('loadMoreBtn').style.display = 'none'; document.title = i18n[lang].pageTitle;
}

function saveFavorites() { localStorage.setItem('nodeTubeFavs', JSON.stringify(favoritesList)); }
function checkIsFav(id) { return favoritesList.some(f => f.id === id); }

function toggleFavoritesView() {
    isFavViewActive = !isFavViewActive;
    const favBtn = document.getElementById('favViewBtn'); const loadBtn = document.getElementById('loadMoreBtn');
    if (isFavViewActive) {
        favBtn.classList.add('active-fav'); loadBtn.style.display = 'none';
        if(favoritesList.length===0) resultsDiv.innerHTML = `<div id="empty-state"><i class="far fa-heart"></i><h3>${i18n[lang].favTitle}</h3><p>${i18n[lang].favDesc}</p></div>`;
        else renderCards(favoritesList);
    } else {
        favBtn.classList.remove('active-fav');
        if(searchVideos.length > 0) { renderCards(searchVideos); loadBtn.style.display = searchHasMore ? 'inline-block' : 'none'; } 
        else resetApp();
    }
}

async function startNewSearch() {
    const q = document.getElementById('searchInput').value; if(!q) return;
    isFavViewActive = false; document.getElementById('favViewBtn').classList.remove('active-fav');
    currentQuery = q; currentPage = 1; searchVideos = [];
    resultsDiv.innerHTML = `<p style="text-align:center; padding-top:50px;"><i class="fas fa-spinner fa-spin"></i> ${i18n[lang].searching}</p>`;
    await fetchPage(true);
}

async function fetchPage(isNew = false) {
    const loadBtn = document.getElementById('loadMoreBtn');
    if(!isNew) { document.getElementById('ui-load').innerText = i18n[lang].searching; currentPage++; }
    try {
        const res = await fetch(`/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}`);
        const data = await res.json();
        if(isNew) searchVideos = []; data.videos.forEach(v => searchVideos.push(v)); searchHasMore = data.hasMore;
        if(!isFavViewActive) {
            renderCards(searchVideos);
            loadBtn.style.display = searchHasMore ? 'inline-block' : 'none';
            document.getElementById('ui-load').innerText = i18n[lang].loadMore;
        }
    } catch (e) { if(!isFavViewActive) resultsDiv.innerHTML = `<p style="text-align:center; color:var(--heart);">${i18n[lang].error}</p>`; }
}

function moveFav(index, direction, event) {
    event.stopPropagation();
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= favoritesList.length) return;

    const temp = favoritesList[index];
    favoritesList[index] = favoritesList[newIndex];
    favoritesList[newIndex] = temp;
    saveFavorites();

    if (isFavViewActive && currentQueueIndex !== -1) {
        const playingId = globalQueue[currentQueueIndex].id;
        globalQueue = [...favoritesList];
        currentQueueIndex = globalQueue.findIndex(v => v.id === playingId);
    }
    renderCards(favoritesList);
}

function renderCards(list) {
    resultsDiv.innerHTML = ''; const context = isFavViewActive ? 'fav' : 'search';
    list.forEach((v, idx) => {
        const isFav = checkIsFav(v.id); const safeVideoStr = encodeURIComponent(JSON.stringify(v));
        const card = document.createElement('div'); card.className = 'card'; card.id = `card-${v.id}`;
        card.onclick = () => playWithContext(idx, context);
        
        let orderBadgeHtml = '';
        if (context === 'fav') {
            orderBadgeHtml = `
                <div class="fav-order-badge" onclick="event.stopPropagation()">
                    <button class="fav-up" onclick="moveFav(${idx}, -1, event)" ${idx === 0 ? 'disabled' : ''} title="${i18n[lang].ttOrderUp}"><i class="fas fa-caret-up"></i></button>
                    <span>${idx + 1}</span>
                    <button class="fav-down" onclick="moveFav(${idx}, 1, event)" ${idx === list.length - 1 ? 'disabled' : ''} title="${i18n[lang].ttOrderDown}"><i class="fas fa-caret-down"></i></button>
                </div>
            `;
        }

        card.innerHTML = `
            ${orderBadgeHtml}
            <button class="card-fav-btn ${isFav ? 'loved' : ''}" data-id="${v.id}" onclick="toggleFav(event, ${idx}, '${context}')" title="${i18n[lang].ttFavToggle}">
                <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
            <img src="${v.thumbnail}" loading="lazy">
            <div class="info">
                <h4>${v.title}</h4>
                <p>${v.author} • ${v.duration}</p>
            </div>
        `;
        resultsDiv.appendChild(card);
    });
    highlightCard();
}

function playWithContext(index, context) { globalQueue = (context === 'fav') ? [...favoritesList] : [...searchVideos]; startStream(index); }

function startStream(index) {
    if(index < 0 || index >= globalQueue.length) return;
    currentQueueIndex = index; const video = globalQueue[index];
    audio.pause(); audio.removeAttribute('src'); audio.load();
    
    const popup = document.getElementById('preparing-popup');
    popup.style.display = 'flex'; setTimeout(() => popup.style.opacity = '1', 10);
    
    document.getElementById('now-playing').innerText = `${i18n[lang].prep}: ${video.title}`;
    document.title = `▶ ${video.title} | NodeTube`;

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: video.title, artist: video.author, artwork: [{ src: video.thumbnail, sizes: '512x512', type: 'image/jpeg' }] });
        navigator.mediaSession.setActionHandler('previoustrack', playPrevious); navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }

    audio.src = `/stream?id=${video.id}`; audio.play().catch(() => {});
    audio.onplaying = () => {
        popup.style.opacity = '0'; setTimeout(() => popup.style.display = 'none', 300);
        document.getElementById('now-playing').innerText = `${i18n[lang].play}: ${video.title}`;
        document.getElementById('playBtn').querySelector('i').className = 'fas fa-pause';
        highlightCard(); updatePlayerHeart();
    };
}

function playNext() { 
    if(currentQueueIndex < globalQueue.length - 1) startStream(currentQueueIndex + 1); 
    else if (globalQueue.length > 0) startStream(0); 
}

function playPrevious() { 
    if(currentQueueIndex > 0) startStream(currentQueueIndex - 1); 
    else if (globalQueue.length > 0) startStream(globalQueue.length - 1); 
}

function toggleFav(e, idx, context) {
    e.stopPropagation(); const list = (context === 'fav') ? favoritesList : searchVideos; const video = list[idx];
    if(checkIsFav(video.id)) favoritesList = favoritesList.filter(f => f.id !== video.id); else favoritesList.push(video);
    saveFavorites();
    
    if(isFavViewActive) {
        if(favoritesList.length===0) resultsDiv.innerHTML = `<div id="empty-state"><i class="far fa-heart"></i><h3>${i18n[lang].favTitle}</h3><p>${i18n[lang].favDesc}</p></div>`;
        else renderCards(favoritesList);
    } else {
        const btn = e.currentTarget; btn.classList.toggle('loved');
        btn.querySelector('i').className = checkIsFav(video.id) ? 'fas fa-heart' : 'far fa-heart';
    }
    updatePlayerHeart();
}

function updatePlayerHeart() {
    if(currentQueueIndex === -1) return;
    const isFav = checkIsFav(globalQueue[currentQueueIndex].id);
    document.getElementById('playerFavBtn').classList.toggle('loved', isFav);
    document.getElementById('playerFavBtn').querySelector('i').className = isFav ? 'fas fa-heart' : 'far fa-heart';
}

function togglePlayerFavorite() {
    if(currentQueueIndex === -1) return;
    const video = globalQueue[currentQueueIndex];
    if(checkIsFav(video.id)) favoritesList = favoritesList.filter(f => f.id !== video.id); else favoritesList.push(video);
    saveFavorites();
    if(isFavViewActive) {
        if(favoritesList.length===0) resultsDiv.innerHTML = `<div id="empty-state"><i class="far fa-heart"></i><h3>${i18n[lang].favTitle}</h3><p>${i18n[lang].favDesc}</p></div>`;
        else renderCards(favoritesList);
    }
    updatePlayerHeart(); highlightCard();
    if(!isFavViewActive) renderCards(searchVideos);
}

function highlightCard() {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('playing'));
    if(currentQueueIndex === -1) return;
    const card = document.getElementById(`card-${globalQueue[currentQueueIndex].id}`);
    if(card) card.classList.add('playing');
}

function togglePlay() { 
    if(!audio.src) return;
    if(audio.paused) { audio.play(); document.getElementById('playBtn').querySelector('i').className = 'fas fa-pause'; }
    else { audio.pause(); document.getElementById('playBtn').querySelector('i').className = 'fas fa-play'; }
}

function toggleLoop() { audio.loop = !audio.loop; document.getElementById('loopBtn').classList.toggle('active', audio.loop); }

function formatTime(s) { if(isNaN(s)) return "0:00"; const m=Math.floor(s/60), sc=Math.floor(s%60); return `${m}:${sc<10?'0':''}${sc}`; }

audio.ontimeupdate = () => { if(audio.duration) { document.getElementById('progressBar').value = (audio.currentTime/audio.duration)*100; document.getElementById('currentTime').innerText = formatTime(audio.currentTime); } };
audio.onloadedmetadata = () => document.getElementById('durationTime').innerText = formatTime(audio.duration);
document.getElementById('progressBar').oninput = e => { if(audio.duration) audio.currentTime = (e.target.value/100)*audio.duration; };
audio.onended = () => { if(!audio.loop) playNext(); };

function downloadCurrent() {
    if(currentQueueIndex === -1) return;
    
    const utf8Encoder = new TextEncoder();
    const bytes = utf8Encoder.encode(globalQueue[currentQueueIndex].title);
    const hexTitle = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    window.location.href = `/download?id=${globalQueue[currentQueueIndex].id}&t=${hexTitle}`;
}

function toggleTheme() {
    const r = document.documentElement; const isL = r.getAttribute('data-theme') === 'light';
    r.setAttribute('data-theme', isL ? 'dark' : 'light');
    document.getElementById('themeToggleBtn').querySelector('i').className = isL ? 'fas fa-sun' : 'fas fa-moon';
    localStorage.setItem('nodeTubeTheme', isL ? 'dark' : 'light');
}
if(localStorage.getItem('nodeTubeTheme') === 'light') { document.documentElement.setAttribute('data-theme', 'light'); document.getElementById('themeToggleBtn').querySelector('i').className = 'fas fa-moon'; }

let lastVolume = 1;

function handleVolumeClick() {
    if (window.innerWidth <= 768) {
        document.getElementById('volumeContainer').classList.toggle('active');
    } else {
        toggleMute();
    }
}

function toggleMute() {
    const volBar = document.getElementById('volumeBar');
    if (audio.volume > 0) {
        lastVolume = audio.volume;
        audio.volume = 0;
        volBar.value = 0;
    } else {
        audio.volume = lastVolume > 0 ? lastVolume : 1;
        volBar.value = audio.volume;
    }
    updateVolumeIcon(audio.volume);
}

function changeVolume(val) {
    audio.volume = val;
    updateVolumeIcon(val);
}

function updateVolumeIcon(vol) {
    const icon = document.getElementById('volumeIcon');
    if (vol == 0) icon.className = 'fas fa-volume-mute';
    else if (vol < 0.5) icon.className = 'fas fa-volume-down';
    else icon.className = 'fas fa-volume-up';
}

document.addEventListener('click', (e) => {
    const volContainer = document.getElementById('volumeContainer');
    if (volContainer && volContainer.classList.contains('active')) {
        if (!volContainer.contains(e.target)) {
            volContainer.classList.remove('active');
        }
    }
});