const API_KEY = 'ff92f7f3c703f962c7ef5f13285067c3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w1280';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

const homeView = document.getElementById('home-view');
const detailsView = document.getElementById('details-view');
const movieGrid = document.getElementById('movie-grid');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');

getMovies(`https://api.themoviedb.org/3/trending/all/day?api_key=${API_KEY}`);

async function getMovies(url) {
    const res = await fetch(url);
    const data = await res.json();
    showMovies(data.results);
}

function showMovies(items) {
    movieGrid.innerHTML = '';
    items.forEach(item => {
        if (!item.poster_path) return;
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `<img src="${IMG_PATH + item.poster_path}"><div class="movie-info"><h3>${item.title || item.name}</h3></div>`;
        card.onclick = () => showDetails(item);
        movieGrid.appendChild(card);
    });
}

async function showDetails(item) {
    homeView.style.display = 'none';
    detailsView.style.display = 'block';
    window.scrollTo(0, 0);

    document.getElementById('details-backdrop').style.backgroundImage = `url(${BACKDROP_PATH + item.backdrop_path})`;
    document.getElementById('details-poster').src = IMG_PATH + item.poster_path;
    document.getElementById('details-title').innerText = item.title || item.name;
    document.getElementById('details-desc').innerText = item.overview;
    document.getElementById('details-rating').innerText = "★ " + (item.vote_average || 0).toFixed(1);
    document.getElementById('details-year').innerText = (item.release_date || item.first_air_date || "").split('-')[0];

    const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
    const playerContainer = document.getElementById('player-container');
    const tvControls = document.getElementById('tv-controls');
    const iframe = document.getElementById('video-iframe');

    if (mediaType === 'tv') {
        tvControls.style.display = 'block';
        playerContainer.style.display = 'none';
        iframe.src = '';
        loadSeasons(item.id);
    } else {
        tvControls.style.display = 'none';
        playerContainer.style.display = 'block';
        iframe.src = `https://vidsrc.to/embed/movie/${item.id}`;
    }
}

async function loadSeasons(tvId) {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}?api_key=${API_KEY}`);
    const data = await res.json();
    const tabs = document.getElementById('season-tabs');
    tabs.innerHTML = '';
    data.seasons.forEach(s => {
        if (s.season_number === 0) return;
        const btn = document.createElement('div');
        btn.className = 'season-tab';
        btn.innerText = `Season ${s.season_number}`;
        btn.onclick = () => {
            document.querySelectorAll('.season-tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            loadEpisodes(tvId, s.season_number);
        };
        tabs.appendChild(btn);
    });
    tabs.firstChild.click();
}

async function loadEpisodes(tvId, sNum) {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${sNum}?api_key=${API_KEY}`);
    const data = await res.json();
    const list = document.getElementById('episode-list');
    list.innerHTML = '';
    data.episodes.forEach(e => {
        const item = document.createElement('div');
        item.className = 'episode-item';
        item.innerHTML = `<strong>Eps ${e.episode_number}:</strong> ${e.name}`;
        item.onclick = () => {
            const playerContainer = document.getElementById('player-container');
            playerContainer.style.display = 'block';
            document.getElementById('video-iframe').src = `https://vidsrc.to/embed/tv/${tvId}/${sNum}/${e.episode_number}`;
            window.scrollTo(0, document.getElementById('player-container').offsetTop - 100);
        };
        list.appendChild(item);
    });
}

function showHome() {
    homeView.style.display = 'block';
    detailsView.style.display = 'none';
    document.getElementById('video-iframe').src = '';
}

searchForm.onsubmit = (e) => {
    e.preventDefault();
    if (searchInput.value) {
        getMovies(`https://api.themoviedb.org/3/search/multi?api_key=${API_KEY}&query=${searchInput.value}`);
        showHome();
    }
};