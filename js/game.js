const pageMessage =
  document.querySelector(
    "#game-page-message"
  );

const pageContent =
  document.querySelector(
    "#game-page-content"
  );

const gameBackground =
  document.querySelector(
    "#game-detail-background"
  );

const gameCover =
  document.querySelector(
    "#game-detail-cover"
  );

const gameTitle =
  document.querySelector(
    "#game-detail-title"
  );

const gameReleased =
  document.querySelector(
    "#game-detail-released"
  );

const gameDeveloper =
  document.querySelector(
    "#game-detail-developer"
  );

const gamePublisher =
  document.querySelector(
    "#game-detail-publisher"
  );

const gamePlatform =
  document.querySelector(
    "#game-detail-platform"
  );

const gameGenres =
  document.querySelector(
    "#game-detail-genres"
  );

const gameDescription =
  document.querySelector(
    "#game-detail-description"
  );


/* ==================================================
   HELPERS
   ================================================== */

function showGameMessage(
  message,
  status = ""
) {
  if (!pageMessage) {
    return;
  }

  pageMessage.hidden =
    false;

  pageMessage.textContent =
    message;

  pageMessage.dataset.status =
    status;
}


function showGameContent() {
  if (pageMessage) {
    pageMessage.hidden =
      true;
  }

  if (pageContent) {
    pageContent.hidden =
      false;
  }
}


function formatDate(dateValue) {
  if (!dateValue) {
    return "Unknown";
  }

  const date =
    new Date(
      `${dateValue}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateValue;
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


function formatGenres(values) {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return "Unknown";
  }

  return values.join(", ");
}


function setFallbackCover() {
  if (!gameCover) {
    return;
  }

  gameCover.onerror =
    null;

  gameCover.src =
    "images/feature-game.jpg";
}


/* ==================================================
   LOAD GAME
   ================================================== */

async function loadGamePage() {
  showGameMessage(
    "Loading game..."
  );

  const parameters =
    new URLSearchParams(
      window.location.search
    );

  const gameId =
    parameters.get("id");

  if (!gameId) {
    showGameMessage(
      "No game was selected.",
      "error"
    );

    return;
  }

  if (
    !/^\d+$/.test(gameId)
  ) {
    showGameMessage(
      "That game link is invalid.",
      "error"
    );

    return;
  }

  try {
    const {
      data: game,
      error
    } = await supabaseClient
      .from("games")
      .select(`
        id,
        thegamesdb_id,
        title,
        released,
        description,
        cover_url,
        developer,
        publisher,
        genres,
        platform,
        added_by,
        created_at
      `)
      .eq(
        "id",
        Number(gameId)
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Game page query error:",
        error
      );

      showGameMessage(
        `The game could not be loaded: ${error.message}`,
        "error"
      );

      return;
    }

    if (!game) {
      showGameMessage(
        "That game could not be found.",
        "error"
      );

      return;
    }

    document.title =
      `${game.title} | 360 Archive`;

    if (gameTitle) {
      gameTitle.textContent =
        game.title ||
        "Unknown game";
    }

    if (gameReleased) {
      gameReleased.textContent =
        formatDate(
          game.released
        );
    }

    if (gameDeveloper) {
      gameDeveloper.textContent =
        game.developer ||
        "Unknown";
    }

    if (gamePublisher) {
      gamePublisher.textContent =
        game.publisher ||
        "Unknown";
    }

    if (gamePlatform) {
      gamePlatform.textContent =
        game.platform ||
        "Xbox 360";
    }

    if (gameGenres) {
      gameGenres.textContent =
        formatGenres(
          game.genres
        );
    }

    if (gameDescription) {
      gameDescription.textContent =
        game.description ||
        "No description is available for this game.";
    }

    if (
      gameCover &&
      game.cover_url
    ) {
      gameCover.src =
        game.cover_url;

      gameCover.alt =
        `${game.title} cover`;

      gameCover.onerror =
        setFallbackCover;
    } else {
      setFallbackCover();
    }

    if (
      gameBackground &&
      game.cover_url
    ) {
      const safeCoverUrl =
        String(
          game.cover_url
        )
          .replaceAll("\\", "\\\\")
          .replaceAll('"', '\\"');

      gameBackground.style.backgroundImage = `
        linear-gradient(
          rgba(5, 10, 6, 0.4),
          rgba(5, 10, 6, 0.88)
        ),
        url("${safeCoverUrl}")
      `;
    }

    showGameContent();

    window.dispatchEvent(
      new CustomEvent(
        "gameLoaded",
        {
          detail: {
            game
          }
        }
      )
    );

  } catch (error) {
    console.error(
      "Unexpected game page error:",
      error
    );

    showGameMessage(
      `The game could not be loaded: ${error.message}`,
      "error"
    );
  }
}


/* ==================================================
   START
   ================================================== */

if (
  typeof supabaseClient ===
  "undefined"
) {
  showGameMessage(
    "Supabase did not load. Check js/supabase.js.",
    "error"
  );

} else if (
  !pageMessage ||
  !pageContent
) {
  console.error(
    "The required game page elements were not found."
  );

} else {
  loadGamePage();
}