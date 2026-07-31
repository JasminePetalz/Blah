/* ==================================================
   GAMES SEARCH
   Xbox 360 + Original Xbox compatibility
   ================================================== */

const gamesSearchForm =
  document.querySelector("#game-search-form");

const gamesSearchInput =
  document.querySelector("#game-search-input");

const gamesSearchButton =
  document.querySelector("#game-search-button");

const gamesSearchMessage =
  document.querySelector("#game-search-message");

const gamesSearchResults =
  document.querySelector("#game-search-results");


const XBOX_PLATFORM_ID = 14;
const XBOX_360_PLATFORM_ID = 15;

let currentSearchResults = [];


/* ==================================================
   GENERAL HELPERS
   ================================================== */

function escapeGamesHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function normalizeGameTitle(title = "") {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}


function showGamesMessage(
  message,
  status = ""
) {
  if (!gamesSearchMessage) {
    return;
  }

  gamesSearchMessage.hidden = false;
  gamesSearchMessage.textContent = message;
  gamesSearchMessage.dataset.status = status;
}


function hideGamesMessage() {
  if (gamesSearchMessage) {
    gamesSearchMessage.hidden = true;
  }
}


function setSearchButtonLoading(loading) {
  if (!gamesSearchButton) {
    return;
  }

  gamesSearchButton.disabled = loading;

  gamesSearchButton.textContent =
    loading
      ? "SEARCHING..."
      : "SEARCH";
}


function setResultButtonLoading(
  button,
  loading
) {
  if (!button) {
    return;
  }

  button.disabled = loading;

  button.textContent =
    loading
      ? "ADDING..."
      : "ADD TO ARCHIVE";
}


function formatReleaseDate(value) {
  if (!value) {
    return "Release date unknown";
  }

  const date =
    new Date(`${value}T00:00:00`);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}


function getSessionWithTimeout() {
  const sessionRequest =
    supabaseClient.auth.getSession();

  const timeoutRequest =
    new Promise((resolve) => {
      setTimeout(
        () => {
          resolve({
            timedOut: true,
            data: {
              session: null
            }
          });
        },
        5000
      );
    });

  return Promise.race([
    sessionRequest,
    timeoutRequest
  ]);
}


/* ==================================================
   PLATFORM HELPERS
   ================================================== */

function getPlatformId(game) {
  const possibleId =
    game.platform_id ??
    game.platformId ??
    game.platform?.id ??
    game.platforms?.[0]?.id ??
    null;

  const numericId =
    Number(possibleId);

  if (
    Number.isFinite(numericId)
  ) {
    return numericId;
  }

  const platformName =
    String(
      game.platform_name ??
      game.platformName ??
      game.platform?.name ??
      game.platform ??
      ""
    ).toLowerCase();

  if (
    platformName.includes("xbox 360")
  ) {
    return XBOX_360_PLATFORM_ID;
  }

  if (
    platformName.includes("microsoft xbox") ||
    platformName === "xbox" ||
    platformName.includes("original xbox")
  ) {
    return XBOX_PLATFORM_ID;
  }

  return null;
}


function getPlatformName(game) {
  const platformId =
    getPlatformId(game);

  if (
    platformId ===
    XBOX_360_PLATFORM_ID
  ) {
    return "Xbox 360";
  }

  if (
    platformId ===
    XBOX_PLATFORM_ID
  ) {
    return "Original Xbox";
  }

  return (
    game.platform_name ||
    game.platformName ||
    game.platform?.name ||
    game.platform ||
    "Unknown platform"
  );
}


function isOriginalXboxGame(game) {
  return (
    getPlatformId(game) ===
    XBOX_PLATFORM_ID
  );
}


function isXbox360Game(game) {
  return (
    getPlatformId(game) ===
    XBOX_360_PLATFORM_ID
  );
}


/* ==================================================
   NORMALIZE API RESULTS
   ================================================== */

function normalizeGameResult(game) {
  const genres =
    Array.isArray(game.genres)
      ? game.genres
          .map((genre) => {
            if (
              typeof genre === "string"
            ) {
              return genre;
            }

            return (
              genre?.name ||
              genre?.genre ||
              ""
            );
          })
          .filter(Boolean)
      : [];

  return {
    thegamesdb_id:
      Number(
        game.id ??
        game.thegamesdb_id ??
        game.game_id
      ),

    title:
      game.title ??
      game.game_title ??
      game.gameTitle ??
      "Unknown game",

    released:
      game.released ??
      game.release_date ??
      game.releaseDate ??
      null,

    description:
      game.description ??
      game.overview ??
      game.plot ??
      "",

    cover_url:
      game.cover_url ??
      game.coverUrl ??
      game.boxart_url ??
      game.boxart ??
      game.image_url ??
      game.image ??
      "",

    developer:
      game.developer ??
      game.developers?.[0]?.name ??
      game.developers?.[0] ??
      "",

    publisher:
      game.publisher ??
      game.publishers?.[0]?.name ??
      game.publishers?.[0] ??
      "",

    genres,

    platform_id:
      getPlatformId(game),

    platform:
      getPlatformName(game),

    backward_compatible_360:
      false,

    compatibility_notes:
      null
  };
}


function extractGamesFromResponse(response) {
  const possibleArrays = [
    response?.games,
    response?.data?.games,
    response?.data,
    response?.results,
    response
  ];

  const games =
    possibleArrays.find(
      (value) =>
        Array.isArray(value)
    ) || [];

  return games
    .map(normalizeGameResult)
    .filter((game) => {
      return (
        game.thegamesdb_id &&
        game.title &&
        (
          isXbox360Game(game) ||
          isOriginalXboxGame(game)
        )
      );
    });
}


/* ==================================================
   COMPATIBILITY LOOKUP
   ================================================== */

async function addCompatibilityData(games) {
  const originalXboxGames =
    games.filter(
      isOriginalXboxGame
    );

  if (!originalXboxGames.length) {
    return games;
  }

  const normalizedTitles = [
    ...new Set(
      originalXboxGames
        .map((game) =>
          normalizeGameTitle(
            game.title
          )
        )
        .filter(Boolean)
    )
  ];

  if (!normalizedTitles.length) {
    return games;
  }

  try {
    const {
      data,
      error
    } = await supabaseClient
      .from("xbox_360_compatibility")
      .select(`
        title,
        normalized_title,
        notes,
        region
      `)
      .in(
        "normalized_title",
        normalizedTitles
      );

    if (error) {
      throw error;
    }

    const compatibilityMap =
      new Map();

    for (
      const entry of data || []
    ) {
      /*
        Prefer North American entries when the
        same title exists for multiple regions.
      */

      const existing =
        compatibilityMap.get(
          entry.normalized_title
        );

      if (
        !existing ||
        entry.region ===
          "North America"
      ) {
        compatibilityMap.set(
          entry.normalized_title,
          entry
        );
      }
    }

    return games.map((game) => {
      if (!isOriginalXboxGame(game)) {
        return game;
      }

      const compatibility =
        compatibilityMap.get(
          normalizeGameTitle(
            game.title
          )
        );

      return {
        ...game,

        backward_compatible_360:
          Boolean(compatibility),

        compatibility_notes:
          compatibility?.notes ||
          null
      };
    });

  } catch (error) {
    console.error(
      "Compatibility lookup error:",
      error
    );

    /*
      Do not accidentally mark games as compatible
      when the lookup itself failed.
    */

    return games;
  }
}


/* ==================================================
   SEARCH RESULTS
   ================================================== */

function createPlatformBadge(game) {
  if (isXbox360Game(game)) {
    return `
      <span class="game-platform-badge">
        XBOX 360
      </span>
    `;
  }

  return `
    <span class="game-platform-badge original-xbox">
      ORIGINAL XBOX
    </span>
  `;
}


function createCompatibilityBadge(game) {
  if (!isOriginalXboxGame(game)) {
    return "";
  }

  if (game.backward_compatible_360) {
    return `
      <span class="compatibility-badge compatible">
        PLAYS ON XBOX 360
      </span>
    `;
  }

  return `
    <span class="compatibility-badge incompatible">
      NOT CONFIRMED FOR XBOX 360
    </span>
  `;
}


function renderGamesSearchResults(games) {
  if (!gamesSearchResults) {
    return;
  }

  gamesSearchResults.innerHTML = "";

  if (!games.length) {
    gamesSearchResults.innerHTML = `
      <div class="games-empty-state">

        <h2>
          No games found
        </h2>

        <p>
          Try another title or check the spelling.
        </p>

      </div>
    `;

    return;
  }

  games.forEach(
    (
      game,
      index
    ) => {
      const result =
        document.createElement(
          "article"
        );

      result.className =
        "game-search-result";

      const cannotAdd =
        isOriginalXboxGame(game) &&
        !game.backward_compatible_360;

      const genresText =
        game.genres.length
          ? game.genres.join(", ")
          : "Genre unknown";

      result.innerHTML = `
        <div class="game-search-result-cover">

          ${
            game.cover_url
              ? `
                  <img
                    src="${escapeGamesHtml(game.cover_url)}"
                    alt="${escapeGamesHtml(game.title)} cover"
                    loading="lazy"
                  >
                `
              : `
                  <div class="game-cover-placeholder">
                    NO COVER
                  </div>
                `
          }

        </div>


        <div class="game-search-result-info">

          <div class="game-result-badges">

            ${createPlatformBadge(game)}

            ${createCompatibilityBadge(game)}

          </div>


          <h2>
            ${escapeGamesHtml(game.title)}
          </h2>


          <p class="game-result-date">
            ${escapeGamesHtml(
              formatReleaseDate(
                game.released
              )
            )}
          </p>


          <p class="game-result-genres">
            ${escapeGamesHtml(genresText)}
          </p>


          ${
            game.description
              ? `
                  <p class="game-result-description">
                    ${escapeGamesHtml(game.description)}
                  </p>
                `
              : ""
          }


          ${
            game.compatibility_notes
              ? `
                  <div class="compatibility-note">

                    <strong>
                      Compatibility note:
                    </strong>

                    ${escapeGamesHtml(
                      game.compatibility_notes
                    )}

                  </div>
                `
              : ""
          }


          <button
            class="game-add-button"
            type="button"
            data-game-index="${index}"
            ${cannotAdd ? "disabled" : ""}
          >
            ${
              cannotAdd
                ? "NOT 360 COMPATIBLE"
                : "ADD TO ARCHIVE"
            }
          </button>

        </div>
      `;

      const image =
        result.querySelector("img");

      if (image) {
        image.addEventListener(
          "error",
          () => {
            image.remove();
          }
        );
      }

      gamesSearchResults.append(
        result
      );
    }
  );
}


/* ==================================================
   SEARCH
   ================================================== */

async function searchGames(searchTerm) {
  setSearchButtonLoading(true);

  showGamesMessage(
    "Searching Xbox 360 and Original Xbox games..."
  );

  if (gamesSearchResults) {
    gamesSearchResults.innerHTML = "";
  }

  try {
    const requestUrl =
      `/.netlify/functions/games-search` +
      `?search=${encodeURIComponent(searchTerm)}` +
      `&platforms=${XBOX_PLATFORM_ID},${XBOX_360_PLATFORM_ID}`;

    const response =
      await fetch(requestUrl);

    if (!response.ok) {
      let errorMessage =
        `Search failed with status ${response.status}.`;

      try {
        const errorResponse =
          await response.json();

        errorMessage =
          errorResponse.error ||
          errorResponse.message ||
          errorMessage;

      } catch {
        /*
          The response was not JSON.
        */
      }

      throw new Error(errorMessage);
    }

    const responseData =
      await response.json();

    const games =
      extractGamesFromResponse(
        responseData
      );

    const gamesWithCompatibility =
      await addCompatibilityData(
        games
      );

    currentSearchResults =
      gamesWithCompatibility;

    hideGamesMessage();

    renderGamesSearchResults(
      currentSearchResults
    );

  } catch (error) {
    console.error(
      "Game search error:",
      error
    );

    showGamesMessage(
      `Games could not be searched: ${
        error.message ||
        "Unknown error"
      }`,
      "error"
    );
  } finally {
    setSearchButtonLoading(false);
  }
}


/* ==================================================
   SAVE GAME
   ================================================== */

async function saveGameToArchive(
  game,
  button
) {
  if (
    isOriginalXboxGame(game) &&
    !game.backward_compatible_360
  ) {
    showGamesMessage(
      "That Original Xbox game is not confirmed as playable on Xbox 360.",
      "error"
    );

    return;
  }

  setResultButtonLoading(
    button,
    true
  );

  showGamesMessage(
    "Adding game to the archive..."
  );

  try {
    const sessionResult =
      await getSessionWithTimeout();

    if (sessionResult.timedOut) {
      throw new Error(
        "Your login session took too long to load."
      );
    }

    if (sessionResult.error) {
      throw sessionResult.error;
    }

    const user =
      sessionResult
        .data
        ?.session
        ?.user;

    if (!user) {
      window.location.href =
        "login.html?return=games.html";

      return;
    }

    /*
      Check whether the game has already been saved.
    */

    const {
      data: existingGame,
      error: existingError
    } = await supabaseClient
      .from("games")
      .select("id")
      .eq(
        "thegamesdb_id",
        game.thegamesdb_id
      )
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingGame) {
      window.location.href =
        `game.html?id=${encodeURIComponent(existingGame.id)}`;

      return;
    }

    const gameRecord = {
      thegamesdb_id:
        game.thegamesdb_id,

      title:
        game.title,

      released:
        game.released ||
        null,

      description:
        game.description ||
        null,

      cover_url:
        game.cover_url ||
        null,

      developer:
        game.developer ||
        null,

      publisher:
        game.publisher ||
        null,

      genres:
        game.genres,

      platform:
        game.platform,

      added_by:
        user.id,

      backward_compatible_360:
        Boolean(
          game.backward_compatible_360
        ),

      compatibility_notes:
        game.compatibility_notes ||
        null,

      compatibility_checked_at:
        isOriginalXboxGame(game)
          ? new Date().toISOString()
          : null
    };

    const {
      data: savedGame,
      error: saveError
    } = await supabaseClient
      .from("games")
      .insert(gameRecord)
      .select("id")
      .single();

    if (saveError) {
      /*
        Another user might have inserted the same game
        between our duplicate check and this insert.
      */

      if (
        saveError.code === "23505"
      ) {
        const {
          data: duplicateGame,
          error: duplicateError
        } = await supabaseClient
          .from("games")
          .select("id")
          .eq(
            "thegamesdb_id",
            game.thegamesdb_id
          )
          .single();

        if (duplicateError) {
          throw duplicateError;
        }

        window.location.href =
          `game.html?id=${encodeURIComponent(duplicateGame.id)}`;

        return;
      }

      throw saveError;
    }

    window.location.href =
      `game.html?id=${encodeURIComponent(savedGame.id)}`;

  } catch (error) {
    console.error(
      "Save game error:",
      error
    );

    showGamesMessage(
      `The game could not be added: ${
        error.message ||
        "Unknown error"
      }`,
      "error"
    );

    setResultButtonLoading(
      button,
      false
    );
  }
}


/* ==================================================
   EVENTS
   ================================================== */

gamesSearchForm
  ?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const searchTerm =
        gamesSearchInput
          ?.value
          .trim();

      if (!searchTerm) {
        showGamesMessage(
          "Enter a game title to search.",
          "error"
        );

        gamesSearchInput?.focus();

        return;
      }

      await searchGames(
        searchTerm
      );
    }
  );


gamesSearchResults
  ?.addEventListener(
    "click",
    async (event) => {
      const button =
        event.target.closest(
          "[data-game-index]"
        );

      if (
        !button ||
        button.disabled
      ) {
        return;
      }

      const gameIndex =
        Number(
          button.dataset.gameIndex
        );

      const game =
        currentSearchResults[
          gameIndex
        ];

      if (!game) {
        showGamesMessage(
          "That search result could not be found.",
          "error"
        );

        return;
      }

      await saveGameToArchive(
        game,
        button
      );
    }
  );


/* ==================================================
   STARTUP CHECK
   ================================================== */

if (
  typeof supabaseClient ===
  "undefined"
) {
  showGamesMessage(
    "Supabase did not load. Check js/supabase.js.",
    "error"
  );
}