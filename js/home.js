const API_KEY = 'ff92f7f3c703f962c7ef5f13285067c3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

let currentId = null;
let currentType = null;
let currentS = 1;
let currentE = 1;
let currentSrv = 1;

const homeView = document.getElementById('home-view');
const detailsView = document.getElementById('details-view');
const iframe = document.getElementById('video-iframe');
const srvSwitcher = document.getElementById('server-switcher');
const searchResults = document.getElementById('search-results');
const homepageContent = document.getElementById('homepage-content');

// Initial Load
loadHomepage();

async function loadHomepage() {
    fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`).then(r => r.json()).then(d => renderRow(d.results, 'trending-list'));
    fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=release_date.desc&vote_count.gte=100`).then(r => r.json()).then(d => renderRow(d.results, 'latest-movies-list'));
    fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&sort_by=first_air_date.desc&vote_count.gte=50`).then(r => r.json()).then(d => renderRow(d.results, 'latest-tv-list'));
}

function renderRow(items, elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
        if (!item.poster_path) return;
        const card = document.createElement('div');
        card.className = 'movie-card';
        const year = (item.release_date || item.first_air_date || "N/A").split('-')[0];
        const type = item.media_type === 'tv' || item.first_air_date ? 'TV' : 'Movie';
        
        card.innerHTML = `
            <img src="${IMG_PATH + item.poster_path}" loading="lazy">
            <div class="movie-info">
                <h3>${item.title || item.name}</h3>
                <span>${year} • ${type}</span>
            </div>`;
        card.onclick = () => showDetails(item);
        container.appendChild(card);
    });
}

async function showDetails(item) {
    homeView.style.display = 'none';
    detailsView.style.display = 'block';
    window.scrollTo(0, 0);

    currentId = item.id;
    currentType = item.media_type || (item.first_air_date ? 'tv' : 'movie');

    // Basic Info
    document.getElementById('details-backdrop').style.backgroundImage = `url(${BACKDROP_PATH + item.backdrop_path})`;
    document.getElementById('details-poster').src = IMG_PATH + item.poster_path;
    document.getElementById('details-title').innerText = item.title || item.name;
    document.getElementById('details-desc').innerText = item.overview;
    document.getElementById('details-rating').innerText = "★ " + (item.vote_average || 0).toFixed(1);
    document.getElementById('details-year').innerText = (item.release_date || item.first_air_date || "").split('-')[0];
    
    // NEW: FETCH RUNTIME/DURATION
    const runtimeUrl = `https://api.themoviedb.org/3/${currentType}/${currentId}?api_key=${API_KEY}`;
    fetch(runtimeUrl).then(r => r.json()).then(details => {
        let duration = "";
        if(currentType === 'movie' && details.runtime) {
            duration = `${details.runtime}m`;
        } else if(currentType === 'tv' && details.episode_run_time?.length > 0) {
            duration = `${details.episode_run_time[0]}m`;
        } else {
            duration = currentType === 'tv' ? "Series" : "Movie";
        }
        document.getElementById('details-runtime').innerText = duration;
    });

    srvSwitcher.style.display = 'block';
    iframe.src = '';

    if (currentType === 'tv') {
        document.getElementById('tv-controls').style.display = 'block';
        document.getElementById('player-container').style.display = 'none';
        loadSeasons(currentId);
    } else {
        document.getElementById('tv-controls').style.display = 'none';
        updatePlayer();
    }
}

function updatePlayer() {
    let url = "";
    const params = "?auto_play=1&sub_f=1&ds_lang=en&sc_r=1&iv_load_policy=3"; 

    if (currentType === 'movie') {
        if (currentSrv === 1) url = `https://vidsrc.to/embed/movie/${currentId}${params}`;
        if (currentSrv === 2) url = `https://vidsrc.xyz/embed/movie/${currentId}${params}`;
        if (currentSrv === 3) url = `https://vidsrc.me/embed/movie?tmdb=${currentId}`;
    } else {
        if (currentSrv === 1) url = `https://vidsrc.to/embed/tv/${currentId}/${currentS}/${currentE}${params}`;
        if (currentSrv === 2) url = `https://vidsrc.xyz/embed/tv/${currentId}/${currentS}/${currentE}${params}`;
        if (currentSrv === 3) url = `https://vidsrc.me/embed/tv?tmdb=${currentId}&sea=${currentS}&epi=${currentE}`;
    }
    
    document.getElementById('player-container').style.display = 'block';
    iframe.src = url;
}

function changeServer(n) {
    currentSrv = n;
    document.querySelectorAll('.srv-btn').forEach((b, i) => b.classList.toggle('active', i+1 === n));
    updatePlayer();
}

async function loadSeasons(id) {
    const d = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`).then(r => r.json());
    const t = document.getElementById('season-tabs');
    t.innerHTML = '';
    d.seasons.forEach(s => {
        if (s.season_number === 0) return;
        const b = document.createElement('div');
        b.className = 'season-tab';
        b.innerText = `Season ${s.season_number}`;
        b.onclick = () => {
            document.querySelectorAll('.season-tab').forEach(x => x.classList.remove('active'));
            b.classList.add('active');
            currentS = s.season_number;
            loadEpisodes(id, s.season_number);
        };
        t.appendChild(b);
    });
    if(t.firstChild) t.firstChild.click();
}

async function loadEpisodes(id, s) {
    const d = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${s}?api_key=${API_KEY}`).then(r => r.json());
    const l = document.getElementById('episode-list');
    l.innerHTML = '';
    d.episodes.forEach(e => {
        const i = document.createElement('div');
        i.className = 'episode-item';
        i.innerHTML = `<strong>Eps ${e.episode_number}:</strong> ${e.name}`;
        i.onclick = () => { currentE = e.episode_number; updatePlayer(); scrollToPlayer(); };
        l.appendChild(i);
    });
}

function showHome() { 
    homeView.style.display = 'block'; 
    detailsView.style.display = 'none'; 
    iframe.src = '';
}

function scrollToPlayer() { 
    const el = document.getElementById('watch-section');
    if(el) window.scrollTo({ top: el.offsetTop - 60, behavior: 'smooth' });
}

document.getElementById('search-form').onsubmit = async (e) => {
    e.preventDefault();
    const val = document.getElementById('search-input').value;
    if (!val) return;
    const d = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${val}`).then(r => r.json());
    homepageContent.style.display = 'none';
    document.getElementById('search-results').style.display = 'block';
    renderRow(d.results, 'search-list');
};