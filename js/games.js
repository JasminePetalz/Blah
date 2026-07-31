const searchForm =
  document.querySelector(
    "#game-search-form"
  );


const searchInput =
  document.querySelector(
    "#game-search-input"
  );


const searchMessage =
  document.querySelector(
    "#game-search-message"
  );


const searchResults =
  document.querySelector(
    "#game-search-results"
  );


function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "Release date unavailable";
  }


  const parsedDate =
    new Date(
      `${dateValue}T00:00:00`
    );


  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return dateValue;
  }


  return parsedDate.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric"
    }
  );
}


function getNames(
  values,
  includedValues = {}
) {
  if (!Array.isArray(values)) {
    return [];
  }


  return values
    .map((value) => {
      const valueKey =
        String(value);


      if (
        includedValues[valueKey]
      ) {
        return (
          includedValues[valueKey]
            .name ||
          includedValues[valueKey]
            .publisher ||
          includedValues[valueKey]
            .genre ||
          null
        );
      }


      if (
        typeof value === "object" &&
        value !== null
      ) {
        return (
          value.name ||
          value.publisher ||
          value.genre ||
          null
        );
      }


      return value;
    })
    .filter(Boolean);
}


function getGameImage(
  gameId,
  boxartData,
  baseUrl
) {
  const images =
    boxartData?.[String(gameId)] ||
    [];


  if (!Array.isArray(images)) {
    return null;
  }


  const frontCover =
    images.find(
      (image) =>
        image.type === "boxart" &&
        image.side === "front"
    );


  const anyCover =
    images.find(
      (image) =>
        image.type === "boxart"
    );


  const selectedCover =
    frontCover ||
    anyCover;


  if (!selectedCover?.filename) {
    return null;
  }


  return (
    baseUrl +
    selectedCover.filename
  );
}


function createGameCard(
  game,
  includedData,
  boxartData,
  imageBaseUrl
) {
  const card =
    document.createElement(
      "article"
    );


  card.className =
    "game-search-card";


  const gameTitle =
    game.game_title ||
    "Unknown game";


  const coverUrl =
    getGameImage(
      game.id,
      boxartData,
      imageBaseUrl
    );


  const publishers =
    getNames(
      game.publishers,
      includedData.publishers
    );


  const genres =
    getNames(
      game.genres,
      includedData.genres
    );


  const coverHtml =
    coverUrl
      ? `
          <img
            src="${escapeHtml(coverUrl)}"
            alt="${escapeHtml(gameTitle)} cover"
          >
        `
      : `
          <div class="game-cover-placeholder">
            NO IMAGE
          </div>
        `;


  card.innerHTML = `
    <div class="game-search-cover">
      ${coverHtml}
    </div>

    <div class="game-search-info">

      <h3>
        ${escapeHtml(gameTitle)}
      </h3>

      <p class="game-search-date">
        ${escapeHtml(
          formatDate(
            game.release_date
          )
        )}
      </p>

      <p>
        <strong>Platform:</strong>
        Xbox 360
      </p>

      ${
        publishers.length
          ? `
              <p>
                <strong>Publisher:</strong>
                ${escapeHtml(
                  publishers.join(", ")
                )}
              </p>
            `
          : ""
      }

      ${
        genres.length
          ? `
              <p>
                <strong>Genres:</strong>
                ${escapeHtml(
                  genres.join(", ")
                )}
              </p>
            `
          : ""
      }

      <div class="game-card-actions">

        <button
          type="button"
          class="main-button select-game-button"
        >
          SELECT GAME
        </button>

      </div>

    </div>
  `;


  const selectButton =
    card.querySelector(
      ".select-game-button"
    );


  selectButton.addEventListener(
    "click",
    () => {
      selectButton.textContent =
        "SELECTED";


      selectButton.disabled =
        true;


      searchMessage.textContent =
        `${gameTitle} was selected.`;


      console.log(
        "Selected game:",
        {
          thegamesdb_id:
            game.id,

          title:
            gameTitle,

          released:
            game.release_date ||
            null,

          publishers,

          genres,

          description:
            game.overview ||
            "",

          cover_url:
            coverUrl
        }
      );
    }
  );


  return card;
}


async function searchGames(event) {
  event.preventDefault();


  const searchTerm =
    searchInput.value.trim();


  if (!searchTerm) {
    searchMessage.textContent =
      "Enter a game title.";

    return;
  }


  searchMessage.textContent =
    "Searching...";


  searchResults.innerHTML = `
    <p class="empty-message">
      Loading results...
    </p>
  `;


  try {
    const functionUrl =
      `/.netlify/functions/games-search?search=${encodeURIComponent(searchTerm)}`;


    const response =
      await fetch(functionUrl);


    const responseText =
      await response.text();


    let responseData;


    try {
      responseData =
        JSON.parse(responseText);

    } catch {
      throw new Error(
        "The game search returned an invalid response."
      );
    }


    if (!response.ok) {
      console.error(
        "Function response:",
        responseData
      );


      throw new Error(
        responseData.error ||
        `Search failed with error ${response.status}.`
      );
    }


    console.log(
      "Game search response:",
      responseData
    );


    const games =
      responseData?.data?.games ||
      [];


    const includedData = {
      publishers:
        responseData?.include
          ?.publishers
          ?.data ||
        {},

      genres:
        responseData?.include
          ?.genres
          ?.data ||
        {}
    };


    const boxartData =
      responseData?.include
        ?.boxart
        ?.data ||
      {};


    const imageBaseUrl =
      responseData?.include
        ?.boxart
        ?.base_url
        ?.original ||
      "https://cdn.thegamesdb.net/images/original/";


    searchResults.innerHTML =
      "";


    if (!games.length) {
      searchResults.innerHTML = `
        <p class="empty-message">
          No Xbox 360 games were found.
        </p>
      `;


      searchMessage.textContent =
        "No matching games found.";

      return;
    }


    games.forEach(
      (game) => {
        const card =
          createGameCard(
            game,
            includedData,
            boxartData,
            imageBaseUrl
          );


        searchResults.append(card);
      }
    );


    searchMessage.textContent =
      `${games.length} result${
        games.length === 1
          ? ""
          : "s"
      } found.`;

  } catch (error) {
    console.error(
      "Game search error:",
      error
    );


    searchResults.innerHTML = `
      <p class="empty-message">
        The games could not be loaded.
      </p>
    `;


    searchMessage.textContent =
      error.message ||
      "Something went wrong while searching.";
  }
}


if (
  searchForm &&
  searchInput &&
  searchMessage &&
  searchResults
) {
  searchForm.addEventListener(
    "submit",
    searchGames
  );

} else {
  console.error(
    "The game search elements could not be found."
  );
}