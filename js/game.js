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


async function loadGamePage() {
  const parameters =
    new URLSearchParams(
      window.location.search
    );


  const gameId =
    parameters.get("id");


  if (!gameId) {
    pageMessage.textContent =
      "No game was selected.";


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
        title,
        released,
        description,
        cover_url,
        developer,
        publisher,
        genres,
        platform
      `)
      .eq(
        "id",
        gameId
      )
      .single();


    if (
      error ||
      !game
    ) {
      console.error(
        "Game page error:",
        error
      );


      pageMessage.textContent =
        "That game could not be found.";


      return;
    }


    document.title =
      `${game.title} | 360 Archive`;


    gameTitle.textContent =
      game.title;


    gameReleased.textContent =
      formatDate(
        game.released
      );


    gameDeveloper.textContent =
      game.developer ||
      "Unknown";


    gamePublisher.textContent =
      game.publisher ||
      "Unknown";


    gamePlatform.textContent =
      game.platform ||
      "Xbox 360";


    gameGenres.textContent =
      formatGenres(
        game.genres
      );


    gameDescription.textContent =
      game.description ||
      "No description is available for this game.";


    if (game.cover_url) {
      gameCover.src =
        game.cover_url;


      gameCover.alt =
        `${game.title} cover`;


      gameBackground.style
        .backgroundImage =
          `linear-gradient(
            rgba(5, 10, 6, 0.35),
            rgba(5, 10, 6, 0.8)
          ),
          url("${game.cover_url}")`;
    }


    gameCover.onerror = () => {
      gameCover.onerror =
        null;


      gameCover.src =
        "images/feature-game.jpg";
    };


    pageMessage.hidden =
      true;


    pageContent.hidden =
      false;

  } catch (error) {
    console.error(
      "Game page error:",
      error
    );


    pageMessage.textContent =
      "That game could not be loaded.";
  }
}


loadGamePage();