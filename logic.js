const input = document.getElementById("search-movies");
const suggestions = document.getElementById("suggestions");
const movieDetails = document.getElementById("movieDetails");
const loadingOverlay = document.getElementById("loadingOverlay");
const quoteEl = document.getElementById("quote");
const apiKey = "47d7de06";

input.addEventListener("input", async () => {
    const query = input.value.trim();
    suggestions.innerHTML = "";
    movieDetails.style.display = "none";

    if (query.length < 3) return;

    const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`);
    const data = await response.json();

    if (data.Response === "True") {
        for (let movie of data.Search) {
            const res = await fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`);
            const details = await res.json();
          
            const li = document.createElement("li");
    li.innerHTML = `<img src="${movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/40x60?text=N/A'}" />
     <div>
    <span>${movie.Title} (${movie.Year})</span><br>
    <span style="color: #888;">⭐ ${details.Ratings?.[0]?.Value || "No Rating"}</span>
      </div>`;

    li.addEventListener("click", () => {
    showLoadingAndFetch(movie.imdbID);
        });

        suggestions.appendChild(li);

          }
          
    }
});


const quotes = [
    "May the Force be with you.", 
   "I'm going to make him an offer he can't refuse.", 
   "Here's looking at you, kid.", 
   "You're gonna need a bigger boat.", 
   "I'll be back.", 
   "Houston, we have a problem.", 
   "Why so serious?", 
   "Life is like a box of chocolates. You never know what you're gonna get.", 
   "Say hello to my little friend!", 
   "To infinity and beyond!", 
   "I see dead people.", 
   "You talking to me?", 
   "Keep your friends close, but your enemies closer.", 
   "I feel the need—the need for speed!", 
   "I'm king of the world!", 
   "Just keep swimming.", 
   "With great power comes great responsibility.", 
   "Why did it have to be snakes?", 
   "I'm the king of the world!", 
   "They may take our lives, but they'll never take our freedom!", 
   "It’s alive! It’s alive!", 
   "You can’t handle the truth!", 
   "I’m walking here! I’m walking here!", 
   "Here's Johnny!", 
   "Hasta la vista, baby." 
   ];

   function getRandomQuote() {
    const index = Math.floor(Math.random() * quotes.length);
    return quotes[index];
  }
  
 
  function showLoadingAndFetch(imdbID) {
    input.style.display = "none";
    suggestions.innerHTML = "";
    suggestions.style.display = "none";
    document.querySelector(".search-info").style.display = "none";

  
    quoteEl.textContent = getRandomQuote();
    document.getElementById("quoteImage").src = "images/CineSage logo with the word prominently featured.png";
    loadingOverlay.style.display = "flex";
  
    const bgMusic = document.getElementById("bgMusic");
    bgMusic.currentTime = 0;
    bgMusic.volume = 0.3;
    bgMusic.play();
  
    fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${apiKey}`)
      .then(res => res.json())
      .then(data => {
        setTimeout(() => {
          loadingOverlay.style.display = "none";
          bgMusic.pause();
          showMovieDetails(data);
        }, 3500);
      });
  }
  
   
  function showMovieDetails(data) {
    const detailsContainer = document.getElementById("movieDetails");
    detailsContainer.innerHTML = `
      <h2>${data.Title}</h2>
      <p><strong>Year:</strong> ${data.Year}</p>
      <p><strong>Genre:</strong> ${data.Genre}</p>
      <p><strong>Plot:</strong> ${data.Plot}</p>
      <div class="poster-container">
        <img src="${data.Poster}" alt="${data.Title}" class="main-poster" style="max-width:200px; border-radius:10px;">
        <button id="similarBtn" class="similar-btn">Similar Movies</button>
      </div>
      <div id="similarMoviesContainer"></div>
    `;
  
    document.body.style.backgroundImage = data.Poster && data.Poster !== "N/A"
      ? `url(${data.Poster})`
      : "none";
  
    detailsContainer.style.display = "block";

    const similarBtn = document.getElementById("similarBtn");
    if (similarBtn) {
      similarBtn.addEventListener("click", () => {
        fetchSimilarMovies(data.Title);
      });
    }
  }
  
  

   let timeout;
input.addEventListener("input", () => {
  clearTimeout(timeout);
  timeout = setTimeout(fetchSuggestions, 500);
});

async function fetchSimilarMovies(title) {
  console.log("Calling backend for:", title);
  const response = await fetch("http://localhost:5000/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ movie: title })
  });

  const data = await response.json();
  const container = document.getElementById("similarMoviesContainer");
  container.innerHTML = "<h3>Similar Movies:</h3>";

  if (data.error) {
    container.innerHTML += `<p style="color:red; word-spacing:5px;">"Sometimes, nothing is the scariest thing of all."</p>`;
    return;
  }

  for (let title of data.recommendations) {
    const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`);
    const info = await res.json();
  
    const div = document.createElement("div");
    div.classList.add("similar-movie");
    div.innerHTML = `
      <img src="${info.Poster !== "N/A" ? info.Poster : 'https://via.placeholder.com/80x120?text=N/A'}" style="height: 120px; border-radius: 8px;">
      <p style="margin:5px 0;"><strong>${info.Title}</strong> (${info.Year})</p>
    `;
  
    div.addEventListener("click", () => {
      if (info.imdbID) {
        showLoadingAndFetch(info.imdbID);
      }
    });
  
    container.appendChild(div);
  }
  
}

function displayRecommendations(recommendations) {
  const recContainer = document.getElementById("recommendations");
  recContainer.innerHTML = "";

  recommendations.forEach(title => {
      const btn = document.createElement("button");
      btn.textContent = title;
      btn.className = "recommendation-button";
      btn.onclick = () => {
          console.log("User clicked on:", title);
          fetchMovieDetails(title);  
          fetchSimilarMovies(title); 
      };
      recContainer.appendChild(btn);
  });
}

function fetchMovieDetails(title) {
  fetch('http://localhost:5000/movie-details', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ movie: title }),
  })
  .then(response => response.json())
  .then(data => {
      if (data.error) {
          alert(data.error);
      } else {
          displayMovieDetails(data); 
      }
  })
  .catch(error => {
      console.error("Failed to fetch movie details:", error);
  });
}

function displayMovieDetails(data) {
  const detailsDiv = document.getElementById("movie-details");
  detailsDiv.innerHTML = `
      <h2>${data.title}</h2>
      <p><strong>Overview:</strong> ${data.overview}</p>
      <p><strong>Genres:</strong> ${data.genres.join(", ")}</p>
      <p><strong>Cast:</strong> ${data.cast.join(", ")}</p>
      <p><strong>Crew:</strong> ${data.crew.join(", ")}</p>
      <p><strong>Keywords:</strong> ${data.keywords.join(", ")}</p>
  `;
}