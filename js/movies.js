/**
 * ============================================================================
 * MOVIE SEARCH APP - JAVASCRIPT (ES6+)
 * ============================================================================
 * Beginner-friendly, well-commented implementation meeting all project rubrics:
 * 1. Arrow functions
 * 2. Template literals
 * 3. Object & Array Destructuring
 * 4. Asynchronous programming: async/await, Fetch API & Promises
 * 5. Dynamic DOM manipulation & Event Delegation
 * 6. Error handling & graceful user alerts
 * ============================================================================
 */

// --- 1. DOM Elements Selection ---
const movieForm = document.getElementById('movie-form');
const movieInput = document.getElementById('movie-input');
const typeFilter = document.getElementById('type-filter');
const moviesGrid = document.getElementById('movies-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const alertBox = document.getElementById('alert-box');
const alertMessage = document.getElementById('alert-message');
const resultsHeader = document.getElementById('results-header');
const resultsCountEl = document.getElementById('results-count');

// Modal Elements
const movieModal = document.getElementById('movie-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalBody = document.getElementById('modal-body');
const modalPoster = document.getElementById('modal-poster');

// --- 2. Configuration & State ---
// Default public API key for OMDb
const DEFAULT_OMDB_KEY = 'trilogy';

const getApiKey = () => {
  return localStorage.getItem('omdb_api_key') || DEFAULT_OMDB_KEY;
};

// Current search state
let currentSearchQuery = '';

/**
 * --- 3. UI Helpers ---
 */

// Display error alert
const showError = (message) => {
  alertMessage.textContent = message;
  alertBox.classList.remove('hidden');
  loadingSpinner.classList.add('hidden');
  moviesGrid.innerHTML = '';
  resultsHeader.classList.add('hidden');
};

// Hide active error
const clearError = () => {
  alertBox.classList.add('hidden');
  alertMessage.textContent = '';
};

// Show loading state
const showLoading = () => {
  clearError();
  loadingSpinner.classList.remove('hidden');
  moviesGrid.innerHTML = '';
  resultsHeader.classList.add('hidden');
};

// Hide loading state
const hideLoading = () => {
  loadingSpinner.classList.add('hidden');
};

/**
 * --- 4. Render Movies Grid ---
 * Demonstrates: Array.map(), Template Literals, and Destructuring
 */
const renderMovies = (movies, totalResults, isFeatured = false) => {
  // Filter out titles without valid posters or inappropriate/romantic titles
  const blockedKeywords = ['bikini', 'erotic', 'sensual', 'porn', 'romance', 'dating', 'wedding', 'passion', 'lust'];
  
  const validMovies = movies.filter((movie) => {
    // 1. Prioritize movies with real poster image
    if (!movie.Poster || movie.Poster === 'N/A') return false;

    // 2. Filter out romantic or inappropriate b-movies
    const lowerTitle = (movie.Title || '').toLowerCase();
    const isBlocked = blockedKeywords.some((word) => lowerTitle.includes(word));
    return !isBlocked;
  });

  // Use filtered list if available, or fallback gracefully
  const displayList = validMovies.length > 0 ? validMovies : movies;

  // Update result count header
  if (isFeatured) {
    resultsCountEl.textContent = 'Featured Movies & Web Series';
  } else {
    resultsCountEl.textContent = `Showing ${displayList.length} titles for "${currentSearchQuery}"`;
  }
  resultsHeader.classList.remove('hidden');

  // Generate cards HTML using map() and template literals
  const cardsHtml = displayList
    .map((movie) => {
      // ES6 Object Destructuring
      const { Title, Year, imdbID, Type, Poster } = movie;

      // Clean label for badge (e.g. series -> Web Series)
      const typeLabel = Type === 'series' ? 'Web Series' : Type;

      // Safe poster loading with dynamic onerror fallback
      const posterContent =
        Poster && Poster !== 'N/A'
          ? `<img src="${Poster}" alt="${Title} Poster" class="movie-poster" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'no-poster\\'><span class=\\'no-poster-icon\\'>🎬</span><span>${Title}</span></div>';">`
          : `<div class="no-poster">
               <span class="no-poster-icon">🎬</span>
               <span>No Poster Available</span>
             </div>`;

      return `
        <article class="movie-card" data-imdb-id="${imdbID}" tabindex="0" role="button" aria-label="View details for ${Title}">
          <div class="poster-wrapper">
            ${posterContent}
            <span class="type-badge">${typeLabel}</span>
          </div>
          <div class="movie-info">
            <h3 class="movie-title" title="${Title}">${Title}</h3>
            <div class="movie-meta">
              <span class="movie-year">📅 ${Year}</span>
              <span class="view-btn">Details →</span>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  // Dynamically inject into DOM
  moviesGrid.innerHTML = cardsHtml;
};

/**
 * --- 5. Fetch Movies List by Search Term ---
 * Demonstrates: Async/Await, Fetch API, and Error Handling
 */
const searchMovies = async (query, type = '') => {
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    showError('Please type a title to search.');
    return;
  }

  currentSearchQuery = cleanQuery;
  showLoading();

  try {
    const apiKey = getApiKey();
    let apiUrl = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(cleanQuery)}`;

    // Append type filter if selected (e.g. movie, series)
    if (type) {
      apiUrl += `&type=${encodeURIComponent(type)}`;
    }

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Server returned HTTP status ${response.status}`);
    }

    const data = await response.json();

    // Check OMDb API response status
    if (data.Response === 'False') {
      // Graceful error handling for invalid queries / no matches
      showError(data.Error || `No results found for "${cleanQuery}". Try another title!`);
      return;
    }

    // Render list of movies
    renderMovies(data.Search, data.totalResults, false);

  } catch (error) {
    console.error('Search Movies Error:', error);
    showError('Unable to connect to the Movie Database. Please check your internet connection.');
  } finally {
    hideLoading();
  }
};

/**
 * --- 6. Fetch Diverse Featured Collection on Page Load ---
 * Demonstrates: Promise.all to fetch diverse general movies, Iron Man, comedy, adventure & web series
 */
const loadFeaturedMovies = async () => {
  showLoading();
  try {
    const apiKey = getApiKey();
    // Curated mix of Iron Man, general blockbusters, adventure, comedy & web series
    const featuredIds = [
      'tt0371746', // Iron Man (Marvel / Action)
      'tt0468569', // The Dark Knight (Action / Crime)
      'tt0816692', // Interstellar (Adventure / Sci-Fi)
      'tt0325980', // Pirates of the Caribbean (Action / Adventure)
      'tt2283362', // Jumanji: Welcome to the Jungle (Comedy / Adventure)
      'tt10872600', // Spider-Man: No Way Home (Marvel / Adventure)
      'tt0114709', // Toy Story (Animation / Comedy / Adventure)
      'tt4574334', // Stranger Things (Web Series / Drama)
      'tt0903747', // Breaking Bad (Web Series / Crime)
      'tt4154796', // Avengers: Endgame (Action / Sci-Fi)
    ];

    // Fetch in parallel using Promise.all
    const promises = featuredIds.map((id) =>
      fetch(`https://www.omdbapi.com/?apikey=${apiKey}&i=${id}`).then((res) => res.json())
    );

    const results = await Promise.all(promises);
    const validMovies = results.filter((item) => item.Response === 'True');

    if (validMovies.length > 0) {
      renderMovies(validMovies, validMovies.length, true);
    } else {
      searchMovies('Iron Man');
    }
  } catch (err) {
    console.warn('Featured load failed, falling back to search:', err);
    searchMovies('Iron Man');
  } finally {
    hideLoading();
  }
};

/**
 * --- 7. Fetch & Render Detailed Movie Information (Modal) ---
 * Demonstrates: Fetching specific ID details, Destructuring nested properties
 */
const fetchMovieDetails = async (imdbID) => {
  try {
    const apiKey = getApiKey();
    const detailUrl = `https://www.omdbapi.com/?apikey=${apiKey}&i=${encodeURIComponent(imdbID)}&plot=full`;

    const response = await fetch(detailUrl);
    const movie = await response.json();

    if (movie.Response === 'False') {
      alert(`Could not load movie details: ${movie.Error}`);
      return;
    }

    // Destructure movie details
    const {
      Title,
      Year,
      Rated,
      Released,
      Runtime,
      Genre,
      Director,
      Writer,
      Actors,
      Plot,
      Language,
      Country,
      Awards,
      Poster,
      Ratings,
      imdbRating,
      BoxOffice,
      Type,
    } = movie;

    // Set poster with placeholder fallback
    modalPoster.src = Poster && Poster !== 'N/A' ? Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
    modalPoster.alt = `${Title} Poster`;

    // Process genres
    const genresHtml = (Genre || 'N/A')
      .split(',')
      .map((g) => `<span class="genre-tag">${g.trim()}</span>`)
      .join('');

    // Ratings badges (IMDb, Rotten Tomatoes, etc.)
    let ratingsHtml = `
      <div class="rating-badge">
        <span>⭐</span>
        <span>${imdbRating !== 'N/A' ? `${imdbRating}/10 (IMDb)` : 'Unrated'}</span>
      </div>
    `;

    if (Array.isArray(Ratings)) {
      Ratings.forEach(({ Source, Value }) => {
        if (Source === 'Rotten Tomatoes') {
          ratingsHtml += `
            <div class="rating-badge rotten">
              <span>🍅</span>
              <span>${Value}</span>
            </div>`;
        } else if (Source === 'Metacritic') {
          ratingsHtml += `
            <div class="rating-badge meta">
              <span>Ⓜ️</span>
              <span>${Value}</span>
            </div>`;
        }
      });
    }

    const categoryText = Type === 'series' ? 'Web Series' : Type;

    // Inject modal details
    modalBody.innerHTML = `
      <div class="modal-header">
        <h2>${Title}</h2>
        <div class="modal-subhead">
          <span class="rated-badge">${Rated !== 'N/A' ? Rated : 'Not Rated'}</span>
          <span>📅 ${Released !== 'N/A' ? Released : Year}</span>
          <span>⏱️ ${Runtime}</span>
          <span style="text-transform: capitalize;">🎞️ ${categoryText}</span>
        </div>
      </div>

      <div class="ratings-container">
        ${ratingsHtml}
      </div>

      <div class="genre-tags">
        ${genresHtml}
      </div>

      <div class="modal-plot">
        <p>${Plot !== 'N/A' ? Plot : 'No synopsis available for this title.'}</p>
      </div>

      <div class="modal-details-grid">
        <span class="detail-name">Director:</span>
        <span class="detail-val">${Director || 'N/A'}</span>

        <span class="detail-name">Writers:</span>
        <span class="detail-val">${Writer || 'N/A'}</span>

        <span class="detail-name">Starring:</span>
        <span class="detail-val">${Actors || 'N/A'}</span>

        <span class="detail-name">Languages:</span>
        <span class="detail-val">${Language || 'N/A'}</span>

        <span class="detail-name">Country:</span>
        <span class="detail-val">${Country || 'N/A'}</span>

        <span class="detail-name">Box Office:</span>
        <span class="detail-val">${BoxOffice && BoxOffice !== 'N/A' ? BoxOffice : 'N/A'}</span>

        <span class="detail-name">Awards:</span>
        <span class="detail-val">${Awards || 'N/A'}</span>
      </div>
    `;

    // Open Modal
    openModal();

  } catch (error) {
    console.error('Error fetching details:', error);
    alert('Failed to load movie details. Please try again.');
  }
};

/**
 * --- 8. Modal Control Functions ---
 */
const openModal = () => {
  movieModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Prevent background scrolling
};

const closeModal = () => {
  movieModal.classList.add('hidden');
  document.body.style.overflow = 'auto';
};

/**
 * --- 9. Event Listeners ---
 */

// Form Submission
movieForm.addEventListener('submit', (e) => {
  e.preventDefault();
  searchMovies(movieInput.value, typeFilter.value);
});

// Category Filter change
typeFilter.addEventListener('change', () => {
  if (movieInput.value.trim()) {
    searchMovies(movieInput.value, typeFilter.value);
  } else {
    // If input is empty and user switches to web series, search popular series
    if (typeFilter.value === 'series') {
      searchMovies('Stranger Things', 'series');
    } else if (typeFilter.value === 'movie') {
      searchMovies('Iron Man', 'movie');
    } else {
      loadFeaturedMovies();
    }
  }
});

// Event Delegation: Click on movie cards to view details
moviesGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.movie-card');
  if (card && card.dataset.imdbId) {
    fetchMovieDetails(card.dataset.imdbId);
  }
});

// Keyboard accessibility for movie cards (Enter or Space key)
moviesGrid.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    const card = event.target.closest('.movie-card');
    if (card && card.dataset.imdbId) {
      event.preventDefault();
      fetchMovieDetails(card.dataset.imdbId);
    }
  }
});

// Close modal via close button
modalCloseBtn.addEventListener('click', closeModal);

// Close modal on click outside (backdrop)
movieModal.addEventListener('click', (event) => {
  if (event.target === movieModal) {
    closeModal();
  }
});

// Close modal on Escape key
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !movieModal.classList.contains('hidden')) {
    closeModal();
  }
});

// Quick Chips selection
document.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip-btn');
  if (chip && chip.dataset.movie) {
    const title = chip.dataset.movie;
    movieInput.value = title;
    searchMovies(title, typeFilter.value);
  }
});

// Initial load: Load rich collection of featured general movies, Iron Man, comedy, adventure & web series
window.addEventListener('DOMContentLoaded', () => {
  loadFeaturedMovies();
});
