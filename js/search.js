const searchForm =
  document.querySelector("#archive-search-form");

const searchInput =
  document.querySelector("#archive-search-input");

const searchMessage =
  document.querySelector("#archive-search-message");

const searchResults =
  document.querySelector("#archive-search-results");

const filterButtons =
  document.querySelectorAll("[data-search-type]");

let activeSearchType = "all";


function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showMessage(message, status = "") {
  searchMessage.textContent = message;
  searchMessage.dataset.status = status;
}


function setActiveFilter(type) {
  const valid = ["all", "people", "games", "tags"];

  activeSearchType = valid.includes(type)
    ? type
    : "all";

  filterButtons.forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.searchType === activeSearchType
    );
  });
}


function getRoleLabel(role) {
  const labels = {
    "co-creator": "CO-CREATOR",
    "co-creator-dev": "CO-CREATOR · DEV",
    admin: "ADMIN",
    moderator: "MOD"
  };

  return labels[String(role || "").toLowerCase()] || "";
}


async function searchPeople(term) {
  const pattern = `%${term}%`;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select(`
      id,
      username,
      avatar_url,
      bio,
      location,
      favorite_genre,
      role,
      created_at
    `)
    .or(
      [
        `username.ilike.${pattern}`,
        `bio.ilike.${pattern}`,
        `location.ilike.${pattern}`,
        `favorite_genre.ilike.${pattern}`
      ].join(",")
    )
    .order("username", { ascending: true })
    .limit(30);

  if (error) {
    throw error;
  }

  return data || [];
}


async function searchGames(term) {
  const pattern = `%${term}%`;

  const { data, error } = await supabaseClient
    .from("games")
    .select(`
      id,
      title,
      cover_url,
      platform,
      released,
      genres
    `)
    .or(
      [
        `title.ilike.${pattern}`,
        `developer.ilike.${pattern}`,
        `publisher.ilike.${pattern}`
      ].join(",")
    )
    .order("title", { ascending: true })
    .limit(40);

  if (error) {
    throw error;
  }

  return data || [];
}


async function searchTags(term) {
  const pattern = `%${term}%`;

  const { data, error } = await supabaseClient
    .from("profile_tags")
    .select(`
      tag,
      normalized_tag,
      user_id,
      profile:profiles (
        id,
        username,
        avatar_url,
        bio,
        role
      )
    `)
    .ilike("tag", pattern)
    .order("tag", { ascending: true })
    .limit(50);

  if (error) {
    throw error;
  }

  return data || [];
}


function renderPeople(people) {
  if (!people.length) {
    return "";
  }

  const cards = people.map((profile) => {
    const role = getRoleLabel(profile.role);

    return `
      <a
        class="search-person-card"
        href="profile.html?id=${encodeURIComponent(profile.id)}"
      >
        <img
          src="${escapeHtml(profile.avatar_url || "images/avatar.png")}"
          alt="${escapeHtml(profile.username || "user")} avatar"
        >

        <div>
          <div class="search-person-name">
            <h3>${escapeHtml(profile.username || "user")}</h3>
            ${role ? `<span>${escapeHtml(role)}</span>` : ""}
          </div>

          <p>${escapeHtml(profile.bio || "No bio added yet.")}</p>

          <small>
            ${escapeHtml(profile.location || "Location not added")}
            ·
            ${escapeHtml(profile.favorite_genre || "No favorite genre")}
          </small>
        </div>
      </a>
    `;
  }).join("");

  return `
    <section class="search-result-section">
      <div class="section-heading">
        <h2>PEOPLE</h2>
        <span>${people.length} result${people.length === 1 ? "" : "s"}</span>
      </div>

      <div class="search-people-grid">
        ${cards}
      </div>
    </section>
  `;
}


function renderGames(games) {
  if (!games.length) {
    return "";
  }

  const cards = games.map((game) => {
    const genres = Array.isArray(game.genres)
      ? game.genres.join(", ")
      : "";

    return `
      <a
        class="search-game-card"
        href="game.html?id=${encodeURIComponent(game.id)}"
      >
        ${
          game.cover_url
            ? `
                <img
                  src="${escapeHtml(game.cover_url)}"
                  alt="${escapeHtml(game.title)} cover"
                  loading="lazy"
                >
              `
            : `
                <div class="search-game-placeholder">
                  NO COVER
                </div>
              `
        }

        <div>
          <span>${escapeHtml(game.platform || "Xbox 360")}</span>
          <h3>${escapeHtml(game.title)}</h3>
          <p>${escapeHtml(genres || "Genre unknown")}</p>
        </div>
      </a>
    `;
  }).join("");

  return `
    <section class="search-result-section">
      <div class="section-heading">
        <h2>GAMES</h2>
        <span>${games.length} result${games.length === 1 ? "" : "s"}</span>
      </div>

      <div class="search-games-grid">
        ${cards}
      </div>
    </section>
  `;
}


function renderTags(tags) {
  if (!tags.length) {
    return "";
  }

  const cards = tags.map((row) => {
    const profile = Array.isArray(row.profile)
      ? row.profile[0]
      : row.profile;

    if (!profile) {
      return "";
    }

    return `
      <a
        class="search-tag-card"
        href="profile.html?id=${encodeURIComponent(profile.id)}"
      >
        <span>#${escapeHtml(row.tag)}</span>

        <div>
          <strong>${escapeHtml(profile.username || "user")}</strong>
          <p>${escapeHtml(profile.bio || "No bio added yet.")}</p>
        </div>
      </a>
    `;
  }).join("");

  return `
    <section class="search-result-section">
      <div class="section-heading">
        <h2>TAGS</h2>
        <span>${tags.length} result${tags.length === 1 ? "" : "s"}</span>
      </div>

      <div class="search-tags-grid">
        ${cards}
      </div>
    </section>
  `;
}


async function runSearch(term, type = activeSearchType) {
  const cleanTerm = term.trim();

  if (!cleanTerm) {
    showMessage("Enter something to search.", "error");
    searchResults.innerHTML = "";
    return;
  }

  setActiveFilter(type);
  showMessage(`Searching for “${cleanTerm}”...`);
  searchResults.innerHTML = "";

  const url = new URL(window.location.href);
  url.searchParams.set("q", cleanTerm);
  url.searchParams.set("type", activeSearchType);
  history.replaceState({}, "", url);

  try {
    let people = [];
    let games = [];
    let tags = [];

    if (activeSearchType === "all") {
      [people, games, tags] = await Promise.all([
        searchPeople(cleanTerm),
        searchGames(cleanTerm),
        searchTags(cleanTerm)
      ]);
    }

    if (activeSearchType === "people") {
      people = await searchPeople(cleanTerm);
    }

    if (activeSearchType === "games") {
      games = await searchGames(cleanTerm);
    }

    if (activeSearchType === "tags") {
      tags = await searchTags(cleanTerm);
    }

    const total =
      people.length +
      games.length +
      tags.length;

    if (!total) {
      showMessage(`No results found for “${cleanTerm}”.`);
      searchResults.innerHTML = `
        <div class="search-empty-state">
          <h2>Nothing found</h2>
          <p>Try another title, username, or tag.</p>
        </div>
      `;
      return;
    }

    showMessage(`${total} result${total === 1 ? "" : "s"} found.`);

    searchResults.innerHTML =
      renderPeople(people) +
      renderGames(games) +
      renderTags(tags);
  } catch (error) {
    console.error("Archive search error:", error);

    showMessage(
      `Search failed: ${error.message || "Unknown error"}`,
      "error"
    );
  }
}


searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch(searchInput.value, activeSearchType);
});


filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled) {
      return;
    }

    setActiveFilter(button.dataset.searchType);

    if (searchInput.value.trim()) {
      runSearch(searchInput.value, activeSearchType);
    }
  });
});


if (typeof supabaseClient === "undefined") {
  showMessage(
    "Supabase did not load. Check js/supabase.js.",
    "error"
  );
} else {
  const parameters =
    new URLSearchParams(window.location.search);

  const startingQuery =
    parameters.get("q") || "";

  const startingType =
    parameters.get("type") || "all";

  searchInput.value = startingQuery;
  setActiveFilter(startingType);

  if (startingQuery) {
    runSearch(startingQuery, activeSearchType);
  } else {
    showMessage(
      "Search for a game, username, profile detail, or tag."
    );
  }
}
