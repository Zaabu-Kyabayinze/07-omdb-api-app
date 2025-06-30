// Select the form and results container from the DOM
const searchForm = document.getElementById('search-form');
const movieResults = document.getElementById('movie-results');
const watchlistSection = document.getElementById('watchlist');

// Load the watchlist from localStorage, or start with an empty array
let watchlist = [];
const savedWatchlist = localStorage.getItem('watchlist');
if (savedWatchlist) {
  watchlist = JSON.parse(savedWatchlist);
}

// This function fetches movies from the OMDb API using the search term (with .then/.catch)
function fetchMovies(searchTerm) {
  const apiKey = 'f4e784e4';
  const url = `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(searchTerm)}`;

  return fetch(url)
    .then(response => {
      if (!response.ok) {
        // HTTP error (network, server, etc)
        console.error(`HTTP error! status: ${response.status}`);
        movieResults.innerHTML = `<div class="no-results">Sorry, something went wrong. Please try again later.</div>`;
        return [];
      }
      return response.json();
    })
    .then(data => {
      if (!data || data.Response === "False") {
        // OMDb API error (bad API key, limit reached, etc)
        console.error(`OMDb API error: ${data && data.Error}`);
        movieResults.innerHTML = `<div class="no-results">${(data && data.Error) || "No movies found. Try another search!"}</div>`;
        return [];
      }
      return data.Search || [];
    })
    .catch(error => {
      // Network or parsing error
      console.error('Fetch error:', error);
      movieResults.innerHTML = `<div class="no-results">Sorry, something went wrong. Please check your connection and try again.</div>`;
      return [];
    });
}

// This function displays movies in the movie results grid
function displayMovies(movies) {
  // If no movies found, show a message
  if (movies.length === 0) {
    // Only show this if fetchMovies didn't already set an error message
    if (!movieResults.innerHTML.includes('no-results')) {
      movieResults.innerHTML = `<div class="no-results">No movies found. Try another search!</div>`;
    }
    return;
  }

  // Create HTML for each movie and join them together
  const moviesHTML = movies.map(movie => {
    // Use a placeholder image if poster is not available
    const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/250x350?text=No+Image";
    return `
      <div class="movie-card">
        <div class="movie-info">
          <button class="btn btn-details" data-imdbid="${movie.imdbID}">Details</button>
          <img class="movie-poster" src="${poster}" alt="Poster for ${movie.Title}">
          <div class="movie-title">${movie.Title}</div>
          <div class="movie-year">${movie.Year}</div>
          <button class="btn btn-add" data-imdbid="${movie.imdbID}">Add to Watchlist</button>
        </div>
      </div>
    `;
  }).join('');

  // Insert the movies into the results grid
  movieResults.innerHTML = moviesHTML;

  // Details button event
  const detailsButtons = document.querySelectorAll('.btn-details');
  detailsButtons.forEach(button => {
    button.addEventListener('click', function() {
      const imdbID = button.getAttribute('data-imdbid');
      fetchMovieDetails(imdbID).then(showMovieModal);
    });
  });

  // Add to Watchlist button event
  const addButtons = document.querySelectorAll('.btn-add');
  addButtons.forEach(button => {
    button.addEventListener('click', function() {
      const imdbID = button.getAttribute('data-imdbid');
      const movieToAdd = movies.find(m => m.imdbID === imdbID);
      // Only add if not already in the watchlist
      if (!watchlist.some(m => m.imdbID === imdbID)) {
        watchlist.push(movieToAdd);
        // Save the updated watchlist to localStorage
        localStorage.setItem('watchlist', JSON.stringify(watchlist));
        displayWatchlist();
      }
    });
  });
}

// This function displays the watchlist movies
function displayWatchlist() {
  // If the watchlist is empty, show a styled message
  if (watchlist.length === 0) {
    watchlistSection.innerHTML = `<div class="no-results">Your watchlist is empty. Search for movies to add!</div>`;
    return;
  }

  // Create HTML for each movie in the watchlist, including a Remove button
  const watchlistHTML = watchlist.map(movie => {
    const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/250x350?text=No+Image";
    return `
      <div class="movie-card">
        <div class="movie-info">
          <button class="btn btn-details" data-imdbid="${movie.imdbID}">Details</button>
          <img class="movie-poster" src="${poster}" alt="Poster for ${movie.Title}">
          <div class="movie-title">${movie.Title}</div>
          <div class="movie-year">${movie.Year}</div>
          <button class="btn btn-remove" data-imdbid="${movie.imdbID}">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  // Insert the movies into the watchlist section
  watchlistSection.innerHTML = watchlistHTML;

  // Details button event
  const detailsButtons = watchlistSection.querySelectorAll('.btn-details');
  detailsButtons.forEach(button => {
    button.addEventListener('click', function() {
      const imdbID = button.getAttribute('data-imdbid');
      fetchMovieDetails(imdbID).then(showMovieModal);
    });
  });

  // Remove button event
  const removeButtons = watchlistSection.querySelectorAll('.btn-remove');
  removeButtons.forEach(button => {
    button.addEventListener('click', function() {
      const imdbID = button.getAttribute('data-imdbid');
      // Remove the movie from the watchlist array
      watchlist = watchlist.filter(m => m.imdbID !== imdbID);
      // Update localStorage
      localStorage.setItem('watchlist', JSON.stringify(watchlist));
      // Re-render the watchlist
      displayWatchlist();
    });
  });
}

// Create and append a modal to the body if it doesn't exist
function ensureModal() {
  if (!document.getElementById('movie-modal')) {
    const modal = document.createElement('div');
    modal.id = 'movie-modal';
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="modal-close">&times;</button>
        <div id="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close modal on backdrop or close button click
    modal.querySelector('.modal-backdrop').onclick =
    modal.querySelector('.modal-close').onclick = function() {
      modal.style.display = 'none';
    };
  }
}

// Fetch full movie details by imdbID
function fetchMovieDetails(imdbID) {
  const apiKey = 'f4e784e4';
  const url = `https://www.omdbapi.com/?apikey=${apiKey}&i=${imdbID}&plot=full`;
  return fetch(url)
    .then(response => response.json())
    .catch(err => {
      console.error('Details fetch error:', err);
      return null;
    });
}

// Show modal with movie details
function showMovieModal(movie) {
  ensureModal();
  const modal = document.getElementById('movie-modal');
  const modalBody = modal.querySelector('#modal-body');
  if (!movie) {
    modalBody.innerHTML = `<div class="no-results">Could not load movie details.</div>`;
  } else {
    const poster = movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/250x350?text=No+Image";
    modalBody.innerHTML = `
      <div class="modal-movie">
        <img class="modal-poster" src="${poster}" alt="Poster for ${movie.Title}">
        <div class="modal-info">
          <h2>${movie.Title} (${movie.Year})</h2>
          <p><strong>Rated:</strong> ${movie.Rated || 'N/A'}</p>
          <p><strong>Genre:</strong> ${movie.Genre || 'N/A'}</p>
          <p><strong>Director:</strong> ${movie.Director || 'N/A'}</p>
          <p><strong>Cast:</strong> ${movie.Actors || 'N/A'}</p>
          <p><strong>Plot:</strong> ${movie.Plot || 'N/A'}</p>
        </div>
      </div>
    `;
  }
  modal.style.display = 'block';
}

// Listen for the form submit event
searchForm.addEventListener('submit', function(event) {
  // Prevent the page from reloading
  event.preventDefault();

  // Get the search term from the input field
  const searchInput = document.getElementById('movie-search');
  const searchTerm = searchInput.value.trim();

  // Only search if the input is not empty
  if (searchTerm.length > 0) {
    // Fetch movies from the API using .then()
    fetchMovies(searchTerm).then(movies => {
      displayMovies(movies);
      // Clear the search bar field after submitting
      searchInput.value = '';
    });
  }
});

// Show the watchlist when the page loads
displayWatchlist();

// --- Add styles for modal and details button ---
const style = document.createElement('style');
style.innerHTML = `
#movie-modal {
  display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100vw; height: 100vh;
}
#movie-modal .modal-backdrop {
  position: absolute; width: 100vw; height: 100vh; background: rgba(0,0,0,0.7); top: 0; left: 0;
}
#movie-modal .modal-content {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  background: #222; color: #fff; border-radius: 10px; max-width: 400px; width: 90vw; padding: 24px 16px 16px 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
}
#movie-modal .modal-close {
  position: absolute; top: 8px; right: 16px; background: none; border: none; color: #fff; font-size: 2rem; cursor: pointer;
}
#movie-modal .modal-movie {
  display: flex; flex-direction: column; align-items: center;
}
#movie-modal .modal-poster {
  width: 180px; height: 270px; object-fit: cover; border-radius: 8px; margin-bottom: 16px;
}
#movie-modal .modal-info h2 {
  margin: 0 0 8px 0; font-size: 1.3rem; color: #ee4f69;
}
#movie-modal .modal-info p { margin: 4px 0; }
.btn-details {
  background-color: #ffd166;
  color: #222;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 8px;
  margin-right: 8px;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-details:hover {
  background-color: #ffe49c;
}
@media (max-width: 600px) {
  #movie-modal .modal-content { max-width: 95vw; }
  #movie-modal .modal-poster { width: 120px; height: 180px; }
}
`;
document.head.appendChild(style);