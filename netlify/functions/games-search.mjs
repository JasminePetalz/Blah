const THEGAMESDB_API_URL =
  "https://api.thegamesdb.net/v1/Games/ByGameName";

const ORIGINAL_XBOX_PLATFORM_ID = 14;
const XBOX_360_PLATFORM_ID = 15;

const SUPPORTED_PLATFORM_IDS = [
  ORIGINAL_XBOX_PLATFORM_ID,
  XBOX_360_PLATFORM_ID
];


/* ==================================================
   RESPONSE HELPERS
   ================================================== */

function createJsonResponse(
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


function getPlatformName(platformId) {
  const numericPlatformId =
    Number(platformId);

  if (
    numericPlatformId ===
    ORIGINAL_XBOX_PLATFORM_ID
  ) {
    return "Original Xbox";
  }

  if (
    numericPlatformId ===
    XBOX_360_PLATFORM_ID
  ) {
    return "Xbox 360";
  }

  return "Unknown platform";
}


/* ==================================================
   INCLUDED DATA HELPERS
   ================================================== */

function getLookupValue(
  values,
  lookup
) {
  if (
    !Array.isArray(values) ||
    values.length === 0
  ) {
    return "";
  }

  const firstValue =
    values[0];

  if (
    typeof firstValue ===
    "string" ||
    typeof firstValue ===
    "number"
  ) {
    return (
      lookup?.[firstValue] ||
      lookup?.[String(firstValue)] ||
      String(firstValue)
    );
  }

  const valueId =
    firstValue?.id;

  return (
    lookup?.[valueId] ||
    lookup?.[String(valueId)] ||
    firstValue?.name ||
    ""
  );
}


function getGenreNames(
  genres,
  genreLookup
) {
  if (!Array.isArray(genres)) {
    return [];
  }

  return genres
    .map((genre) => {
      if (
        typeof genre === "string" ||
        typeof genre === "number"
      ) {
        return (
          genreLookup?.[genre] ||
          genreLookup?.[String(genre)] ||
          String(genre)
        );
      }

      const genreId =
        genre?.id;

      return (
        genreLookup?.[genreId] ||
        genreLookup?.[String(genreId)] ||
        genre?.name ||
        ""
      );
    })
    .filter(Boolean);
}


function getCoverUrl(
  gameId,
  include
) {
  const boxartInclude =
    include?.boxart;

  if (!boxartInclude) {
    return "";
  }

  const baseUrl =
    boxartInclude
      ?.base_url
      ?.original ||
    boxartInclude
      ?.base_url
      ?.large ||
    boxartInclude
      ?.base_url
      ?.medium ||
    boxartInclude
      ?.base_url
      ?.small ||
    "";

  const gameArtwork =
    boxartInclude?.data?.[gameId] ||
    boxartInclude?.data?.[String(gameId)] ||
    [];

  if (
    !baseUrl ||
    !Array.isArray(gameArtwork) ||
    gameArtwork.length === 0
  ) {
    return "";
  }

  const frontCover =
    gameArtwork.find(
      (image) =>
        image?.type === "boxart" &&
        image?.side === "front"
    ) ||
    gameArtwork.find(
      (image) =>
        image?.type === "boxart"
    ) ||
    gameArtwork[0];

  if (!frontCover?.filename) {
    return "";
  }

  return `${baseUrl}${frontCover.filename}`;
}


/* ==================================================
   NORMALIZE GAMES
   ================================================== */

function normalizeGames(apiResponse) {
  const rawGames =
    apiResponse?.data?.games;

  if (!Array.isArray(rawGames)) {
    return [];
  }

  const include =
    apiResponse?.include ||
    {};

  const developerLookup =
    include?.developer?.data ||
    include?.developers?.data ||
    {};

  const publisherLookup =
    include?.publisher?.data ||
    include?.publishers?.data ||
    {};

  const genreLookup =
    include?.genre?.data ||
    include?.genres?.data ||
    {};

  return rawGames
    .map((game) => {
      const platformId =
        Number(
          game.platform ||
          game.platform_id ||
          game.platformId
        );

      return {
        id:
          Number(game.id),

        title:
          game.game_title ||
          game.title ||
          "Unknown game",

        release_date:
          game.release_date ||
          game.released ||
          null,

        overview:
          game.overview ||
          "",

        cover_url:
          getCoverUrl(
            game.id,
            include
          ),

        developer:
          getLookupValue(
            game.developers,
            developerLookup
          ),

        publisher:
          getLookupValue(
            game.publishers,
            publisherLookup
          ),

        genres:
          getGenreNames(
            game.genres,
            genreLookup
          ),

        platform_id:
          platformId,

        platform_name:
          getPlatformName(
            platformId
          )
      };
    })
    .filter((game) => {
      return (
        game.id &&
        game.title &&
        SUPPORTED_PLATFORM_IDS.includes(
          game.platform_id
        )
      );
    });
}


/* ==================================================
   NETLIFY FUNCTION
   ================================================== */

export async function handler(event) {
  if (
    event.httpMethod !== "GET"
  ) {
    return createJsonResponse(
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
    return createJsonResponse(
      500,
      {
        error:
          "TheGamesDB API key is missing from Netlify."
      }
    );
  }

  const searchTerm =
    event
      .queryStringParameters
      ?.search
      ?.trim();

  if (!searchTerm) {
    return createJsonResponse(
      400,
      {
        error:
          "Enter a game title to search."
      }
    );
  }

  try {
    const queryParameters =
      new URLSearchParams({
        apikey:
          apiKey,

        name:
          searchTerm,

        fields:
          [
            "players",
            "publishers",
            "genres",
            "overview",
            "last_updated",
            "rating",
            "platform",
            "coop",
            "youtube",
            "os"
          ].join(","),

        include:
          "boxart"
      });

    const apiResponse =
      await fetch(
        `${THEGAMESDB_API_URL}?${queryParameters.toString()}`
      );

    const responseText =
      await apiResponse.text();

    let responseData;

    try {
      responseData =
        JSON.parse(responseText);

    } catch {
      console.error(
        "Non-JSON TheGamesDB response:",
        responseText.slice(
          0,
          500
        )
      );

      return createJsonResponse(
        502,
        {
          error:
            "TheGamesDB returned something other than game data.",

          status:
            apiResponse.status
        }
      );
    }

    if (!apiResponse.ok) {
      console.error(
        "TheGamesDB API error:",
        responseData
      );

      return createJsonResponse(
        apiResponse.status,
        {
          error:
            responseData?.error ||
            responseData?.message ||
            "TheGamesDB search failed."
        }
      );
    }

    const games =
      normalizeGames(
        responseData
      );

    return createJsonResponse(
      200,
      {
        games,

        count:
          games.length,

        platforms: [
          {
            id:
              ORIGINAL_XBOX_PLATFORM_ID,

            name:
              "Original Xbox"
          },

          {
            id:
              XBOX_360_PLATFORM_ID,

            name:
              "Xbox 360"
          }
        ]
      }
    );

  } catch (error) {
    console.error(
      "Game search function error:",
      error
    );

    return createJsonResponse(
      500,
      {
        error:
          error.message ||
          "The game search failed."
      }
    );
  }
}