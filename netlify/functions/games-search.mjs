const XBOX_360_PLATFORM_ID =
  "15";


function jsonResponse(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json"
      }
    }
  );
}


export default async function handler(
  request
) {
  try {
    if (request.method !== "GET") {
      return jsonResponse(
        {
          error:
            "Method not allowed."
        },
        405
      );
    }


    const apiKey =
      process.env
        .THEGAMESDB_API_KEY;


    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "THEGAMESDB_API_KEY is missing from Netlify."
        },
        500
      );
    }


    const requestUrl =
      new URL(request.url);


    const searchTerm =
      requestUrl.searchParams
        .get("search")
        ?.trim();


    if (!searchTerm) {
      return jsonResponse(
        {
          error:
            "A game title is required."
        },
        400
      );
    }


    const apiUrl =
      new URL(
        "https://api.thegamesdb.net/v1.1/Games/ByGameName"
      );


    apiUrl.searchParams.set(
      "apikey",
      apiKey
    );


    apiUrl.searchParams.set(
      "name",
      searchTerm
    );


    apiUrl.searchParams.set(
      "filter[platform]",
      XBOX_360_PLATFORM_ID
    );


    apiUrl.searchParams.set(
      "fields",
      [
        "publishers",
        "genres",
        "overview",
        "rating",
        "platform",
        "youtube"
      ].join(",")
    );


    apiUrl.searchParams.set(
      "include",
      "boxart,platform"
    );


    const response =
      await fetch(
        apiUrl.toString(),
        {
          headers: {
            Accept:
              "application/json"
          }
        }
      );


    const responseText =
      await response.text();


    if (!response.ok) {
      console.error(
        "TheGamesDB error:",
        response.status,
        responseText
      );


      return jsonResponse(
        {
          error:
            `TheGamesDB returned error ${response.status}.`,

          details:
            responseText
        },
        response.status
      );
    }


    return new Response(
      responseText,
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/json",

          "Cache-Control":
            "public, max-age=300"
        }
      }
    );

  } catch (error) {
    console.error(
      "Game search function error:",
      error
    );


    return jsonResponse(
      {
        error:
          "The game search function failed.",

        details:
          error.message
      },
      500
    );
  }
}