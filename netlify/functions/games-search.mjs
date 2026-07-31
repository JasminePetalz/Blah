const THEGAMESDB_BASE_URL =
  "https://api.thegamesdb.net/v1/Games/ByGameName";

const XBOX_PLATFORM_ID = 14;
const XBOX_360_PLATFORM_ID = 15;

const ALLOWED_PLATFORM_IDS = [
  XBOX_PLATFORM_ID,
  XBOX_360_PLATFORM_ID
];


/* ==================================================
   RESPONSE HELPERS
   ================================================== */

function jsonResponse(
  statusCode,
  body
) {
  return {
    statusCode,

    headers: {
      "Content-Type":
        "application/json",

      "Cache-Control":
        "no-store"
    },

    body:
      JSON.stringify(body)
  };
}


function parsePlatformIds(value) {
  if (!value) {
    return [
      XBOX_PLATFORM_ID,
      XBOX_360_PLATFORM_ID
    ];
  }

  const requestedIds =
    String(value)
      .split(",")
      .map((id) =>
        Number(id.trim())
      )
      .filter((id) =>
        ALLOWED_PLATFORM_IDS.includes(id)
      );

  return [
    ...new Set(requestedIds)
  ];
}


function getPlatformName(platformId) {
  if (
    Number(platformId) ===
    XBOX_PLATFORM_ID
  ) {
    return "Original Xbox";
  }

  if (
    Number(platformId) ===
    XBOX_360_PLATFORM_ID
  ) {
    return "Xbox 360";
  }

  return "Unknown platform";
}


function getFirstValue(
  values,
  lookup
) {
  if (
    !Array.isArray(values) ||
    !values.length
  ) {
    return "";
  }

  const firstValue =
    values[0];

  if (
    typeof firstValue ===
    "string"
  ) {
    return (
      lookup?.[firstValue] ??
      firstValue
    );
  }

  const id =
    firstValue?.id ??
    firstValue;

  return (
    lookup?.[id] ??
    firstValue?.name ??
    ""
  );
}


function getGenres(
  genreIds,
  genreLookup
) {
  if (!Array.isArray(genreIds)) {
    return [];
  }

  return genreIds
    .map((genre) => {
      if (
        typeof genre ===
        "string"
      ) {
        return (
          genreLookup?.[genre] ??
          genre
        );
      }

      const id =
        genre?.id ??
        genre;

      return (
        genreLookup?.[id] ??
        genre?.name ??
        ""
      );
    })
    .filter(Boolean);
}


function buildImageUrl(
  gameId,
  include
) {
  const boxart =
    include?.boxart;

  const baseUrl =
    include?.boxart?.base_url?.original ??
    include?.boxart?.base_url?.large ??
    include?.boxart?.base_url?.medium ??
    "";

  const gameImages =
    boxart?.data?.[gameId] ??
    boxart?.data?.[String(gameId)] ??
    [];

  if (
    !baseUrl ||
    !Array.isArray(gameImages)
  ) {
    return "";
  }

  const frontImage =
    gameImages.find(
      (image) =>
        image?.type === "boxart" &&
        image?.side === "front"
    ) ??
    gameImages.find(
      (image) =>
        image?.type === "boxart"
    ) ??
    gameImages[0];

  if (!frontImage?.filename) {
    return "";
  }

  return `${baseUrl}${frontImage.filename}`;
}


/* ==================================================
   API REQUEST
   ================================================== */

async function fetchGamesForPlatform(
  searchTerm,
  platformId,
  apiKey
) {
  const parameters =
    new URLSearchParams({
      apikey:
        apiKey,

      name:
        searchTerm,

      filter:
        `[{"field":"players","values":[]}]`,

      fields:
        "players,publishers,genres,overview,last_updated,rating,platform,coop,youtube,os",

      include:
        "boxart",

      platform:
        String(platformId)
    });

  /*
    TheGamesDB's ByGameName endpoint supports
    game-name searches and returns game records
    plus optional included artwork data.
  */

  const response =
    await fetch(
      `${THEGAMESDB_BASE_URL}?${parameters.toString()}`
    );

  const responseText =
    await response.text();

  let responseData;

  try {
    responseData =
      JSON.parse(responseText);

  } catch {
    throw new Error(
      `TheGamesDB returned an invalid response for platform ${platformId}.`
    );
  }

  if (!response.ok) {
    const apiMessage =
      responseData?.error ??
      responseData?.message ??
      `TheGamesDB request failed with status ${response.status}.`;

    throw new Error(apiMessage);
  }

  return {
    platformId,
    responseData
  };
}


/* ==================================================
   NORMALIZE RESPONSE
   ================================================== */

function normalizePlatformResults(
  platformResult
) {
  const {
    platformId,
    responseData
  } = platformResult;

  const games =
    responseData?.data?.games ??
    [];

  const include =
    responseData?.include ??
    {};

  const developerLookup =
    include?.developer?.data ??
    include?.developers?.data ??
    {};

  const publisherLookup =
    include?.publisher?.data ??
    include?.publishers?.data ??
    {};

  const genreLookup =
    include?.genre?.data ??
    include?.genres?.data ??
    {};

  if (!Array.isArray(games)) {
    return [];
  }

  return games.map((game) => {
    const actualPlatformId =
      Number(
        game.platform ??
        game.platform_id ??
        platformId
      );

    return {
      id:
        Number(game.id),

      title:
        game.game_title ??
        game.title ??
        "Unknown game",

      release_date:
        game.release_date ??
        game.released ??
        null,

      overview:
        game.overview ??
        "",

      cover_url:
        buildImageUrl(
          game.id,
          include
        ),

      developer:
        getFirstValue(
          game.developers,
          developerLookup
        ),

      publisher:
        getFirstValue(
          game.publishers,
          publisherLookup
        ),

      genres:
        getGenres(
          game.genres,
          genreLookup
        ),

      platform_id:
        actualPlatformId,

      platform_name:
        getPlatformName(
          actualPlatformId
        )
    };
  });
}


/* ==================================================
   NETLIFY HANDLER
   ================================================== */

export async function handler(event) {
  if (
    event.httpMethod !== "GET"
  ) {
    return jsonResponse(
      405,
      {
        error:
          "Method not allowed."
      }
    );
  }

  const apiKey =
    process.env
      .THEGAMESDB_API_KEY;

  if (!apiKey) {
    return jsonResponse(
      500,
      {
        error:
          "TheGamesDB API key is missing from Netlify."
      }
    );
  }

  const searchTerm =
    event.queryStringParameters
      ?.search
      ?.trim();

  if (!searchTerm) {
    return jsonResponse(
      400,
      {
        error:
          "Enter a game title to search."
      }
    );
  }

  const platformIds =
    parsePlatformIds(
      event.queryStringParameters
        ?.platforms
    );

  if (!platformIds.length) {
    return jsonResponse(
      400,
      {
        error:
          "No supported platforms were requested."
      }
    );
  }

  try {
    /*
      TheGamesDB's name-search endpoint takes one
      platform filter at a time, so we make one request
      for Original Xbox and another for Xbox 360.
    */

    const platformResults =
      await Promise.all(
        platformIds.map(
          (platformId) =>
            fetchGamesForPlatform(
              searchTerm,
              platformId,
              apiKey
            )
        )
      );

    const games =
      platformResults
        .flatMap(
          normalizePlatformResults
        );

    /*
      Remove duplicates while keeping the platform-specific
      version of a title when the same title exists on both.
    */

    const uniqueGames =
      Array.from(
        new Map(
          games.map((game) => [
            `${game.id}-${game.platform_id}`,
            game
          ])
        ).values()
      );

    return jsonResponse(
      200,
      {
        games:
          uniqueGames,

        platforms:
          platformIds,

        count:
          uniqueGames.length
      }
    );

  } catch (error) {
    console.error(
      "TheGamesDB search error:",
      error
    );

    return jsonResponse(
      500,
      {
        error:
          error.message ||
          "The game search failed."
      }
    );
  }
}