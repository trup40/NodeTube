// by trup40 (Eagle) 
// https://github.com/trup40/NodeTube
// 2026

let favData = JSON.parse(localStorage.getItem('nodeTubeFavs'));
if (Array.isArray(favData)) {
    favData = { "default": favData };
    localStorage.setItem('nodeTubeFavs', JSON.stringify(favData));
} else if (!favData) {
    favData = { "default": [] };
} else if (favData["Favorilerim"]) {
    favData["default"] = favData["Favorilerim"];
    delete favData["Favorilerim"];
    localStorage.setItem('nodeTubeFavs', JSON.stringify(favData));
}
let activePlaylist = "default";
let videoPendingModal = null;

let resolvedVideos = [];
let resolvedTitle = '';

let lang = localStorage.getItem('nodeTubeLang') || 'tr';

let listSearchMatches = [];
let listSearchCurrentIndex = -1;

let toastTimeout;
function showToast(msg, isLoading = false) {
    const toast = document.getElementById('toast-notification');
    const msgEl = document.getElementById('toast-msg');
    const icon = toast.querySelector('i');
    
    msgEl.innerText = msg;
    if(isLoading) {
        icon.className = 'fas fa-compact-disc fa-spin';
        icon.style.color = 'var(--primary)';
    } else {
        icon.className = 'fas fa-info-circle';
        icon.style.color = 'var(--text-muted)';
    }
    
    toast.classList.add('show');
    
    clearTimeout(toastTimeout);
    if(isLoading) {
        toastTimeout = setTimeout(() => {
            hideToast();
            showToast(i18n[lang].error, false);
            audio.pause();
            document.getElementById('playBtn').querySelector('i').className = 'fas fa-play';
        }, 10000); 
    } else {
        toastTimeout = setTimeout(() => hideToast(), 3000);
    }
}

function hideToast() {
    const toast = document.getElementById('toast-notification');
    toast.classList.remove('show');
    clearTimeout(toastTimeout);
}

window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollToTopBtn');
    if (window.scrollY > 300) btn.classList.add('show');
    else btn.classList.remove('show');
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function applyLanguage() {
    document.getElementById('langToggleBtn').innerText = lang === 'tr' ? 'EN' : 'TR';
    document.getElementById('searchInput').placeholder = i18n[lang].search;
    document.getElementById('ui-load').innerText = i18n[lang].loadMore;
    document.getElementById('ui-modal-title').innerText = i18n[lang].modalTitle;
    document.getElementById('new-playlist-name').placeholder = i18n[lang].newPlaylist;
    
    document.getElementById('ui-input-cancel').innerText = i18n[lang].btnCancel;
    document.getElementById('ui-input-ok').innerText = i18n[lang].btnOk;
    document.getElementById('ui-confirm-no').innerText = i18n[lang].btnNo;
    document.getElementById('ui-confirm-yes').innerText = i18n[lang].btnYes;

    document.getElementById('ui-res-playall').innerHTML = `<i class="fas fa-play"></i> ${i18n[lang].resPlayAll}`;
    document.getElementById('ui-res-saveall').innerHTML = `<i class="fas fa-heart"></i> ${i18n[lang].resSaveAll}`;
    
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
    document.getElementById('shuffleBtn').title = i18n[lang].ttShuffle;
    
    const lsInput = document.getElementById('listSearchInput');
    if(lsInput) lsInput.placeholder = i18n[lang].listSearchPlaceholder || (lang === 'tr' ? 'Liste içinde bul...' : 'Find in playlist...');
    
    document.querySelectorAll('.card-fav-btn').forEach(btn => btn.title = i18n[lang].ttFavToggle);
    document.querySelectorAll('.fav-up').forEach(btn => btn.title = i18n[lang].ttOrderUp);
    document.querySelectorAll('.fav-down').forEach(btn => btn.title = i18n[lang].ttOrderDown);
    
    updateEmptyState();
    const np = document.getElementById('now-playing');
    if(audio.src === "") { np.innerText = i18n[lang].wait; document.title = i18n[lang].pageTitle; } 
    else if(currentQueueIndex !== -1) {
        np.innerText = `${audio.paused ? i18n[lang].prep : i18n[lang].play} (${currentQueueIndex + 1}/${globalQueue.length}): ${globalQueue[currentQueueIndex].title}`;
        document.title = `▶ ${globalQueue[currentQueueIndex].title} | NodeTube`;
    }
    
    if(isFavViewActive) renderFavoritesView();
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
let isFavViewActive = false; 
let viewMode = localStorage.getItem('nodeTubeView') || 'grid'; 
let globalQueue = []; let currentQueueIndex = -1;
let playingContext = '';
let isShuffle = false;

const audio = document.getElementById('mainAudio');
const resultsDiv = document.getElementById('results');
const viewBtnIcon = document.getElementById('viewToggleBtn').querySelector('i');

let audioCtx;
let analyser;
let dataArray;
let sourceNode;

function initAudioAnalyzer() {
    if (audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64; 
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    sourceNode = audioCtx.createMediaElementSource(audio);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    drawVisualizer();
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    
    const currentViewContext = isFavViewActive ? activePlaylist : 'search';
    if (!audioCtx || audio.paused || currentQueueIndex === -1 || playingContext !== currentViewContext) {
        if (playingContext === currentViewContext && currentQueueIndex !== -1) {
            const activeCard = document.getElementById(`card-${currentQueueIndex}-${globalQueue[currentQueueIndex]?.id}`);
            if (activeCard) {
                const spans = activeCard.querySelectorAll('.visualizer-container span');
                if (spans.length === 3) {
                    spans[0].style.height = '3px';
                    spans[1].style.height = '3px';
                    spans[2].style.height = '3px';
                }
            }
        }
        return;
    }

    analyser.getByteFrequencyData(dataArray);

    const activeCard = document.getElementById(`card-${currentQueueIndex}-${globalQueue[currentQueueIndex].id}`);
    if (activeCard) {
        const spans = activeCard.querySelectorAll('.visualizer-container span');
        if (spans.length === 3) {
            spans[0].style.height = Math.max(3, (dataArray[2] / 255) * 16) + 'px';
            spans[1].style.height = Math.max(3, (dataArray[8] / 255) * 16) + 'px';
            spans[2].style.height = Math.max(3, (dataArray[16] / 255) * 16) + 'px';
        }
    }
}

audio.onpause = () => {
    const active = document.querySelector('.card.playing');
    if(active) active.classList.add('paused');
};

audio.onplay = () => {
    const active = document.querySelector('.card.playing');
    if(active) active.classList.remove('paused');
};

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
    clearListSearch();
    if(!isFavViewActive) resetApp(); else document.getElementById('loadMoreBtn').style.display = 'none';
}

function resetApp() {
    searchVideos = [];
    document.getElementById('playlist-header').style.display = 'none';
    document.getElementById('playlist-actions').style.display = 'none';
    document.getElementById('list-search-container').style.display = 'none';
    resultsDiv.innerHTML = `<div id="empty-state"><i class="fas fa-headphones"></i><h3 id="ui-empty-title">${i18n[lang].emptyTitle}</h3><p id="ui-empty-desc">${i18n[lang].emptyDesc}</p></div>`;
    document.getElementById('loadMoreBtn').style.display = 'none'; document.title = i18n[lang].pageTitle;
}

function saveFavorites() { localStorage.setItem('nodeTubeFavs', JSON.stringify(favData)); }

function checkIsFav(id) {
    return Object.values(favData).some(list => list.some(v => v.id === id));
}

let inputModalCallback = null;
function openInputModal(title, defaultValue, callback) {
    document.body.style.overflow = 'hidden';
    document.getElementById('input-modal-title').innerText = title;
    const input = document.getElementById('input-modal-value');
    input.value = defaultValue || '';
    document.getElementById('input-modal').style.display = 'flex';
    input.focus();
    inputModalCallback = callback;
}
function closeInputModal() { 
    document.body.style.overflow = '';
    document.getElementById('input-modal').style.display = 'none'; 
    inputModalCallback = null; 
}
document.getElementById('ui-input-ok').onclick = () => {
    if(inputModalCallback) inputModalCallback(document.getElementById('input-modal-value').value);
    closeInputModal();
};
document.getElementById('input-modal-value').onkeypress = (e) => {
    if(e.key === 'Enter') document.getElementById('ui-input-ok').click();
};

let confirmModalCallback = null;
function openConfirmModal(msg, callback) {
    document.body.style.overflow = 'hidden';
    document.getElementById('confirm-modal-msg').innerText = msg;
    document.getElementById('confirm-modal').style.display = 'flex';
    confirmModalCallback = callback;
}
function closeConfirmModal() { 
    document.body.style.overflow = '';
    document.getElementById('confirm-modal').style.display = 'none'; 
    confirmModalCallback = null; 
}
document.getElementById('ui-confirm-yes').onclick = () => {
    if(confirmModalCallback) confirmModalCallback();
    closeConfirmModal();
};

function renderFavoritesView() {
    const header = document.getElementById('playlist-header');
    const tabsContainer = document.getElementById('playlist-tabs-container');
    const actionsContainer = document.getElementById('playlist-actions');
    header.style.display = 'flex';

    if (!favData[activePlaylist]) activePlaylist = Object.keys(favData)[0] || "default";

    let tabsHtml = '';
    Object.keys(favData).forEach(pKey => {
        const dispName = pKey === 'default' ? i18n[lang].defaultPlaylist : pKey;
        tabsHtml += `<button class="tab-btn ${pKey === activePlaylist ? 'active' : ''}" onclick="switchPlaylist('${pKey}')">${dispName}</button>`;
    });
    tabsContainer.innerHTML = tabsHtml;

    if (activePlaylist !== 'default') {
        actionsContainer.style.display = 'flex';
        
        const keys = Object.keys(favData);
        const idx = keys.indexOf(activePlaylist);
        const canMoveLeft = idx > 1; 
        const canMoveRight = idx > 0 && idx < keys.length - 1;

        actionsContainer.innerHTML = `
            <button onclick="moveActivePlaylist(-1)" title="${i18n[lang].ttMoveLeft}" ${!canMoveLeft ? 'style="opacity:0.3; cursor:not-allowed;" disabled' : ''}><i class="fas fa-chevron-left"></i></button>
            <button onclick="moveActivePlaylist(1)" title="${i18n[lang].ttMoveRight}" ${!canMoveRight ? 'style="opacity:0.3; cursor:not-allowed;" disabled' : ''}><i class="fas fa-chevron-right"></i></button>
            <div style="width: 1px; height: 14px; background: var(--border); margin: 0 5px;"></div>
            <button onclick="renameActivePlaylist()"><i class="fas fa-edit"></i> ${i18n[lang].renamePl}</button>
            <button class="delete-btn" onclick="deleteActivePlaylist()"><i class="fas fa-trash"></i> ${i18n[lang].deletePl}</button>
        `;
    } else {
        actionsContainer.style.display = 'none';
    }

    const list = favData[activePlaylist] || [];
    if (list.length === 0) {
        document.getElementById('list-search-container').style.display = 'none';
        resultsDiv.innerHTML = `<div id="empty-state"><i class="far fa-heart"></i><h3>${i18n[lang].favTitle}</h3><p>${i18n[lang].favDesc}</p></div>`;
    } else {
        document.getElementById('list-search-container').style.display = 'block';
        renderCards(list);
    }
    clearListSearch();
}

function moveActivePlaylist(direction) {
    if (activePlaylist === 'default') return;
    const keys = Object.keys(favData);
    const idx = keys.indexOf(activePlaylist);
    const newIdx = idx + direction;

    if (newIdx <= 0 || newIdx >= keys.length) return;

    const temp = keys[idx];
    keys[idx] = keys[newIdx];
    keys[newIdx] = temp;

    const newData = {};
    keys.forEach(k => newData[k] = favData[k]);
    favData = newData;
    
    saveFavorites();

    if (isFavViewActive && currentQueueIndex !== -1 && playingContext === activePlaylist) {
        const playingId = globalQueue[currentQueueIndex].id;
        globalQueue = [...favData[activePlaylist]];
        currentQueueIndex = globalQueue.findIndex(v => v.id === playingId);
    }

    renderFavoritesView();

    setTimeout(() => {
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 50);
}

function promptNewPlaylist() {
    openInputModal(i18n[lang].promptNew, "", (name) => {
        const trimmed = name.trim();
        if (trimmed && trimmed !== 'default' && !favData[trimmed]) {
            favData[trimmed] = [];
            activePlaylist = trimmed;
            saveFavorites();
            renderFavoritesView();
            setTimeout(() => {
                const tabsContainer = document.getElementById('playlist-tabs-container');
                tabsContainer.scrollLeft = tabsContainer.scrollWidth;
            }, 50);
        }
    });
}

function renameActivePlaylist() {
    if(activePlaylist === 'default') return;
    openInputModal(i18n[lang].promptRename, activePlaylist, (newName) => {
        if (newName && newName.trim() !== '' && newName !== activePlaylist) {
            const trimmed = newName.trim();
            if (trimmed === 'default' || favData[trimmed]) return;
            
            const keys = Object.keys(favData);
            const newData = {};
            keys.forEach(k => {
                if(k === activePlaylist) {
                    newData[trimmed] = favData[activePlaylist];
                } else {
                    newData[k] = favData[k];
                }
            });
            favData = newData;
            
            if (playingContext === activePlaylist) playingContext = trimmed;
            
            activePlaylist = trimmed;
            saveFavorites();
            renderFavoritesView();
        }
    });
}

function deleteActivePlaylist() {
    if(activePlaylist === 'default') return;
    openConfirmModal(i18n[lang].confirmDelete, () => {
        delete favData[activePlaylist];
        activePlaylist = "default";
        saveFavorites();
        renderFavoritesView();
    });
}

function switchPlaylist(name) {
    activePlaylist = name;
    renderFavoritesView();
}

function toggleFavoritesView() {
    isFavViewActive = !isFavViewActive;
    const favBtn = document.getElementById('favViewBtn'); const loadBtn = document.getElementById('loadMoreBtn');
    const header = document.getElementById('playlist-header');
    const actionsContainer = document.getElementById('playlist-actions');
    
    if (isFavViewActive) {
        favBtn.classList.add('active-fav'); loadBtn.style.display = 'none';
        renderFavoritesView();
    } else {
        favBtn.classList.remove('active-fav');
        header.style.display = 'none';
        actionsContainer.style.display = 'none';
        if(searchVideos.length > 0) { 
            document.getElementById('list-search-container').style.display = 'block';
            renderCards(searchVideos); 
            loadBtn.style.display = searchHasMore ? 'inline-block' : 'none'; 
            clearListSearch();
        } 
        else resetApp();
    }
}

function openResolveModal(title, videos) {
    resolvedVideos = videos;
    resolvedTitle = title || 'Playlist';
    document.getElementById('resolve-modal-title').innerText = resolvedTitle;
    
    const listDiv = document.getElementById('resolve-modal-list');
    listDiv.innerHTML = '';
    
    videos.forEach((v, idx) => {
        listDiv.innerHTML += `
            <div class="playlist-option" style="cursor:default;">
                <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
                    <img src="${v.thumbnail}" style="width:50px; height:28px; object-fit:cover; border-radius:4px; flex-shrink:0;">
                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:13px;">${v.title}</span>
                </div>
                <div style="display:flex; gap:5px; flex-shrink:0;">
                    <button onclick="playResolvedSingle(${idx})" style="background:none; border:none; color:var(--primary); cursor:pointer; padding:5px;"><i class="fas fa-play"></i></button>
                    <button onclick="addResolvedSingle(${idx})" style="background:none; border:none; color:var(--text-main); cursor:pointer; padding:5px;"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        `;
    });
    
    document.body.style.overflow = 'hidden';
    document.getElementById('playlist-resolve-modal').style.display = 'flex';
}

function closeResolveModal() {
    document.body.style.overflow = '';
    document.getElementById('playlist-resolve-modal').style.display = 'none';
    resolvedVideos = [];
}

function playResolvedAll() {
    searchVideos = [...resolvedVideos];
    document.getElementById('list-search-container').style.display = 'block';
    renderCards(searchVideos);
    clearListSearch();
    closeResolveModal();
    playWithContext(0, 'search');
}

function saveResolvedAll() {
    openInputModal(i18n[lang].promptNew, resolvedTitle, (name) => {
        const trimmed = name.trim();
        if (trimmed && trimmed !== 'default' && !favData[trimmed]) {
            favData[trimmed] = [...resolvedVideos];
            activePlaylist = trimmed;
            saveFavorites();
            closeResolveModal();
            isFavViewActive = false; 
            toggleFavoritesView();
        }
    });
}

function playResolvedSingle(idx) {
    searchVideos = [resolvedVideos[idx]];
    document.getElementById('list-search-container').style.display = 'block';
    renderCards(searchVideos);
    clearListSearch();
    closeResolveModal();
    playWithContext(0, 'search');
}

function addResolvedSingle(idx) {
    videoPendingModal = resolvedVideos[idx];
    openFavModal();
}

async function startNewSearch() {
    const q = document.getElementById('searchInput').value.trim(); 
    if(!q) return;

    isFavViewActive = false; 
    document.getElementById('favViewBtn').classList.remove('active-fav');
    document.getElementById('playlist-header').style.display = 'none';
    document.getElementById('playlist-actions').style.display = 'none';
    document.getElementById('loadMoreBtn').style.display = 'none';
    document.getElementById('list-search-container').style.display = 'none';
    clearListSearch();

    const isUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(q);
    const isPlaylist = isUrl && q.includes('list=');

    if (isUrl) {
        showToast(`${i18n[lang].searching}`, true);
        try {
            const utf8Encoder = new TextEncoder();
            const bytes = utf8Encoder.encode(q);
            const hexUrl = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

            const res = await fetch(`/resolve?url=${hexUrl}`);
            const data = await res.json();
            
            hideToast();
            if (isPlaylist && data.videos.length > 1) {
                resultsDiv.innerHTML = `<div id="empty-state"><i class="fas fa-list"></i><h3>${data.title || 'Playlist'}</h3><p>${data.videos.length} video</p></div>`;
                openResolveModal(data.title, data.videos);
            } else if (data.videos.length > 0) {
                searchVideos = data.videos;
                document.getElementById('list-search-container').style.display = 'block';
                renderCards(searchVideos);
                playWithContext(0, 'search');
            } else {
                showToast(i18n[lang].error, false);
            }
        } catch(e) {
            hideToast();
            showToast(i18n[lang].error, false);
        }
        return;
    }

    currentQuery = q; currentPage = 1; searchVideos = [];
    resultsDiv.innerHTML = ``;
    showToast(`${i18n[lang].searching}`, true);
    await fetchPage(true);
}

async function fetchPage(isNew = false) {
    const loadBtn = document.getElementById('loadMoreBtn');
    if(!isNew) { document.getElementById('ui-load').innerText = i18n[lang].searching; currentPage++; }
    try {
        const res = await fetch(`/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}`);
        const data = await res.json();
        hideToast();
        if(isNew) searchVideos = []; data.videos.forEach(v => searchVideos.push(v)); searchHasMore = data.hasMore;
        if(!isFavViewActive) {
            document.getElementById('list-search-container').style.display = 'block';
            renderCards(searchVideos);
            if(!isNew) handleListSearch(); 
            loadBtn.style.display = searchHasMore ? 'inline-block' : 'none';
            document.getElementById('ui-load').innerText = i18n[lang].loadMore;
        }
    } catch (e) { 
        hideToast();
        if(!isFavViewActive) showToast(i18n[lang].error, false); 
    }
}

function toggleListSearch() {
    if (window.innerWidth <= 768) {
        const wrapper = document.getElementById('listSearchWrapper');
        const input = document.getElementById('listSearchInput');
        wrapper.classList.add('expanded');
        setTimeout(() => input.focus(), 300);
    }
}

function handleListSearch() {
    const term = document.getElementById('listSearchInput').value.toLowerCase().trim();
    const controls = document.getElementById('listSearchControls');
    const cards = document.querySelectorAll('#results .card');
    
    listSearchMatches = [];
    listSearchCurrentIndex = -1;

    if (!term) {
        controls.style.display = 'none';
        cards.forEach(card => {
            card.classList.remove('search-dimmed', 'search-highlight');
            const h4 = card.querySelector('h4');
            if(h4) h4.innerHTML = h4.textContent; 
        });
        return;
    }

    controls.style.display = 'flex';

    cards.forEach(card => {
        const titleEl = card.querySelector('h4');
        const authorEl = card.querySelector('.info p');
        const title = titleEl ? titleEl.textContent : '';
        const author = authorEl ? authorEl.textContent : '';
        
        if (title.toLowerCase().includes(term) || author.toLowerCase().includes(term)) {
            card.classList.remove('search-dimmed');
            listSearchMatches.push(card);
            
            if (titleEl && term.length > 1) {
                const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                titleEl.innerHTML = title.replace(regex, '<mark>$1</mark>');
            }
        } else {
            card.classList.add('search-dimmed');
            card.classList.remove('search-highlight');
            if (titleEl) titleEl.innerHTML = title;
        }
    });

    if (listSearchMatches.length > 0) {
        navigateListSearch(1, true); 
    } else {
        document.getElementById('listSearchMatchCount').innerText = `0/0`;
    }
}

function navigateListSearch(direction, isInitial = false) {
    if (listSearchMatches.length === 0) return;

    if (!isInitial) {
        if (listSearchCurrentIndex !== -1) {
            listSearchMatches[listSearchCurrentIndex].classList.remove('search-highlight');
        }

        listSearchCurrentIndex += direction;

        if (listSearchCurrentIndex >= listSearchMatches.length) listSearchCurrentIndex = 0;
        if (listSearchCurrentIndex < 0) listSearchCurrentIndex = listSearchMatches.length - 1;
    } else {
        listSearchCurrentIndex = 0;
    }

    const targetCard = listSearchMatches[listSearchCurrentIndex];
    targetCard.classList.add('search-highlight');
    
    document.getElementById('listSearchMatchCount').innerText = `${listSearchCurrentIndex + 1}/${listSearchMatches.length}`;

    const offset = (window.innerHeight / 2) - (targetCard.offsetHeight / 2);
    window.scrollTo({ top: targetCard.offsetTop - offset, behavior: 'smooth' });
}

function clearListSearch() {
    const input = document.getElementById('listSearchInput');
    if(input) {
        input.value = '';
        handleListSearch();
        if(window.innerWidth <= 768) {
            document.getElementById('listSearchWrapper').classList.remove('expanded');
        }
    }
}

function moveFav(index, direction, event) {
    event.stopPropagation();
    const list = favData[activePlaylist];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;
    saveFavorites();

    if (isFavViewActive && currentQueueIndex !== -1 && playingContext === activePlaylist) {
        const playingId = globalQueue[currentQueueIndex].id;
        globalQueue = [...list];
        currentQueueIndex = globalQueue.findIndex(v => v.id === playingId);
    }
    renderFavoritesView();
}

function renderCards(list) {
    resultsDiv.innerHTML = ''; const context = isFavViewActive ? 'fav' : 'search';
    list.forEach((v, idx) => {
        const isFav = checkIsFav(v.id);
        const card = document.createElement('div'); card.className = 'card'; 
        card.id = `card-${idx}-${v.id}`;
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
            <div class="img-wrapper">
                <div class="play-overlay"><i class="fas fa-play"></i></div>
                <img src="${v.thumbnail}" loading="lazy">
                <div class="visualizer-container"><span></span><span></span><span></span></div>
            </div>
            <div class="info">
                <h4>${v.title}</h4>
                <p>${v.author} • ${v.duration}</p>
            </div>
            <button class="card-fav-btn ${isFav ? 'loved' : ''}" onclick="toggleFav(event, ${idx}, '${context}')" title="${i18n[lang].ttFavToggle}">
                <i class="${isFav ? 'fas' : 'far'} fa-heart"></i>
            </button>
        `;
        resultsDiv.appendChild(card);
    });
    highlightCard();
}

function playWithContext(index, context) { 
    const newList = (context === 'fav') ? [...favData[activePlaylist]] : [...searchVideos]; 
    const targetContextName = (context === 'fav') ? activePlaylist : 'search';
    
    if (playingContext === targetContextName && currentQueueIndex === index) {
        togglePlay();
        return;
    }

    globalQueue = newList;
    playingContext = targetContextName;
    startStream(index); 
}

function startStream(index) {
    if(index < 0 || index >= globalQueue.length) return;
    currentQueueIndex = index; const video = globalQueue[index];
    audio.pause(); audio.removeAttribute('src'); audio.load();
    
    showToast(`${i18n[lang].prep}...`, true);
    
    document.getElementById('now-playing').innerText = `${i18n[lang].prep} (${currentQueueIndex + 1}/${globalQueue.length}): ${video.title}`;
    document.title = `▶ ${video.title} | NodeTube`;

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: video.title, artist: video.author, artwork: [{ src: video.thumbnail, sizes: '512x512', type: 'image/jpeg' }] });
        navigator.mediaSession.setActionHandler('previoustrack', playPrevious); navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }

    audio.src = `/stream?id=${video.id}`; 
    initAudioAnalyzer();
    
    audio.play().catch(() => {});
    audio.onplaying = () => {
        hideToast();
        const active = document.querySelector('.card.playing');
        if(active) active.classList.remove('paused');
        
        document.getElementById('now-playing').innerText = `${i18n[lang].play} (${currentQueueIndex + 1}/${globalQueue.length}): ${video.title}`;
        document.getElementById('playBtn').querySelector('i').className = 'fas fa-pause';
        highlightCard(); updatePlayerHeart();
        scrollToCurrentCard();
    };
}

function scrollToCurrentCard() {
    if(currentQueueIndex === -1) return;
    const currentViewContext = isFavViewActive ? activePlaylist : 'search';
    
    if (playingContext === currentViewContext) {
        const card = document.getElementById(`card-${currentQueueIndex}-${globalQueue[currentQueueIndex].id}`);
        if(card) {
            const offset = (window.innerHeight / 2) - (card.offsetHeight / 2);
            window.scrollTo({ top: card.offsetTop - offset, behavior: 'smooth' });
        }
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('shuffleBtn').classList.toggle('active', isShuffle);
}

function playNext() {
    if(globalQueue.length === 0) return;
    if(isShuffle && globalQueue.length > 1) {
        let nextIdx;
        do {
            nextIdx = Math.floor(Math.random() * globalQueue.length);
        } while (nextIdx === currentQueueIndex);
        startStream(nextIdx);
    } else {
        if(currentQueueIndex < globalQueue.length - 1) startStream(currentQueueIndex + 1); 
        else startStream(0); 
    }
}

function playPrevious() { 
    if(currentQueueIndex > 0) startStream(currentQueueIndex - 1); 
    else if (globalQueue.length > 0) startStream(globalQueue.length - 1); 
}

function toggleFav(e, idx, context) {
    e.stopPropagation();
    const list = (context === 'fav') ? favData[activePlaylist] : searchVideos;
    videoPendingModal = list[idx];
    openFavModal();
}

function togglePlayerFavorite() {
    if(currentQueueIndex === -1) return;
    videoPendingModal = globalQueue[currentQueueIndex];
    openFavModal();
}

function openFavModal() {
    document.body.style.overflow = 'hidden';
    document.getElementById('fav-modal').style.display = 'flex';
    renderModalPlaylists();
}

function closeFavModal() {
    document.body.style.overflow = '';
    document.getElementById('fav-modal').style.display = 'none';
    videoPendingModal = null;
    if(isFavViewActive) renderFavoritesView();
    else renderCards(searchVideos);
    updatePlayerHeart();
}

function renderModalPlaylists() {
    const container = document.getElementById('modal-playlist-options');
    container.innerHTML = '';
    Object.keys(favData).forEach(pKey => {
        const isInList = favData[pKey].some(v => v.id === videoPendingModal.id);
        const dispName = pKey === 'default' ? i18n[lang].defaultPlaylist : pKey;
        container.innerHTML += `
            <div class="playlist-option" onclick="toggleVideoInPlaylist('${pKey}')">
                <span>${dispName}</span>
                <i class="${isInList ? 'fas fa-check-circle' : 'far fa-circle'}" style="color: ${isInList ? 'var(--primary)' : 'var(--text-muted)'}"></i>
            </div>
        `;
    });
}

function toggleVideoInPlaylist(pKey) {
    const list = favData[pKey];
    const idx = list.findIndex(v => v.id === videoPendingModal.id);
    if (idx > -1) list.splice(idx, 1);
    else list.push(videoPendingModal);
    saveFavorites();
    renderModalPlaylists();
}

function createNewPlaylistFromModal() {
    const input = document.getElementById('new-playlist-name');
    const name = input.value.trim();
    if (name && name !== 'default' && !favData[name]) {
        favData[name] = [];
        favData[name].push(videoPendingModal);
        saveFavorites();
        input.value = '';
        renderModalPlaylists();
    }
}

function updatePlayerHeart() {
    if(currentQueueIndex === -1) return;
    const isFav = checkIsFav(globalQueue[currentQueueIndex].id);
    document.getElementById('playerFavBtn').classList.toggle('loved', isFav);
    document.getElementById('playerFavBtn').querySelector('i').className = isFav ? 'fas fa-heart' : 'far fa-heart';
}

function highlightCard() {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('playing'));
    if(currentQueueIndex === -1) return;
    
    const currentViewContext = isFavViewActive ? activePlaylist : 'search';
    if (playingContext === currentViewContext) {
        const card = document.getElementById(`card-${currentQueueIndex}-${globalQueue[currentQueueIndex].id}`);
        if(card) card.classList.add('playing');
    }
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
    
    const searchWrapper = document.getElementById('listSearchWrapper');
    if (searchWrapper && searchWrapper.classList.contains('expanded')) {
        const input = document.getElementById('listSearchInput');
        if (!searchWrapper.contains(e.target) && input.value.trim() === '') {
            searchWrapper.classList.remove('expanded');
        }
    }
});