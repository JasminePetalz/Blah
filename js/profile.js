const profileMessage =
  document.querySelector(
    "#profile-message"
  );

const profileContent =
  document.querySelector(
    "#profile-content"
  );

const profileAvatar =
  document.querySelector(
    "#profile-avatar"
  );

const profileUsername =
  document.querySelector(
    "#profile-username"
  );

const profileBio =
  document.querySelector(
    "#profile-bio"
  );

const profileLocation =
  document.querySelector(
    "#profile-location"
  );

const profileMemberSince =
  document.querySelector(
    "#profile-member-since"
  );

const profileAboutUsername =
  document.querySelector(
    "#profile-about-username"
  );

const profileAboutLocation =
  document.querySelector(
    "#profile-about-location"
  );

const profileFavoriteGenre =
  document.querySelector(
    "#profile-favorite-genre"
  );

const profileGamerscore =
  document.querySelector(
    "#profile-gamerscore"
  );

const profileStatReviews =
  document.querySelector(
    "#profile-stat-reviews"
  );

const profileStatClips =
  document.querySelector(
    "#profile-stat-clips"
  );

const profileStatGames =
  document.querySelector(
    "#profile-stat-games"
  );

const profileStatPosts =
  document.querySelector(
    "#profile-stat-posts"
  );

const profileLogoutButton =
  document.querySelector(
    "#profile-logout-button"
  );


/* ==================================================
   HELPERS
   ================================================== */

function showProfileMessage(
  message,
  status = ""
) {
  if (!profileMessage) {
    return;
  }


  profileMessage.hidden =
    false;


  profileMessage.textContent =
    message;


  profileMessage.dataset.status =
    status;
}


function showProfileContent() {
  if (profileMessage) {
    profileMessage.hidden =
      true;
  }


  if (profileContent) {
    profileContent.hidden =
      false;
  }
}


function formatMemberDate(value) {
  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }


  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long"
    }
  );
}


function getSessionWithTimeout() {
  const sessionRequest =
    supabaseClient.auth
      .getSession();


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
   PROFILE DATA
   ================================================== */

function displayProfile(profile) {
  const username =
    profile.username ||
    "user";


  const location =
    profile.location ||
    "Not added";


  const favoriteGenre =
    profile.favorite_genre ||
    "Not added";


  const gamerscore =
    Number(
      profile.gamerscore ||
      0
    ).toLocaleString();


  const memberSince =
    formatMemberDate(
      profile.created_at
    );


  profileUsername.textContent =
    username;


  profileBio.textContent =
    profile.bio ||
    "No bio added yet.";


  profileLocation.textContent =
    `Location: ${location}`;


  profileMemberSince.textContent =
    `Member since: ${memberSince}`;


  profileAboutUsername.textContent =
    username;


  profileAboutLocation.textContent =
    location;


  profileFavoriteGenre.textContent =
    favoriteGenre;


  profileGamerscore.textContent =
    gamerscore;


  profileAvatar.src =
    profile.avatar_url ||
    "images/avatar.png";


  profileAvatar.alt =
    `${username} avatar`;


  profileAvatar.onerror = () => {
    profileAvatar.onerror =
      null;


    profileAvatar.src =
      "images/avatar.png";
  };
}


async function loadProfileStats(userId) {
  const results =
    await Promise.all([
      supabaseClient
        .from("reviews")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "user_id",
          userId
        ),

      supabaseClient
        .from("clips")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "user_id",
          userId
        ),

      supabaseClient
        .from("games")
        .select(
          "id",
          {
            count: "exact",
            head: true
          }
        )
        .eq(
          "added_by",
          userId
        )
    ]);


  const reviewResult =
    results[0];

  const clipResult =
    results[1];

  const gameResult =
    results[2];


  profileStatReviews.textContent =
    reviewResult.count ??
    0;


  profileStatClips.textContent =
    clipResult.count ??
    0;


  profileStatGames.textContent =
    gameResult.count ??
    0;


  /*
    Posts are not connected yet.
  */

  profileStatPosts.textContent =
    "0";


  if (reviewResult.error) {
    console.error(
      "Review count error:",
      reviewResult.error
    );
  }


  if (clipResult.error) {
    console.error(
      "Clip count error:",
      clipResult.error
    );
  }


  if (gameResult.error) {
    console.error(
      "Game count error:",
      gameResult.error
    );
  }
}


/* ==================================================
   LOAD PROFILE
   ================================================== */

async function loadProfile() {
  showProfileMessage(
    "Loading profile..."
  );


  try {
    const sessionResult =
      await getSessionWithTimeout();


    if (sessionResult.timedOut) {
      showProfileMessage(
        "Your login session took too long to load. Refresh the page and try again.",
        "error"
      );


      return;
    }


    if (sessionResult.error) {
      console.error(
        "Profile session error:",
        sessionResult.error
      );


      showProfileMessage(
        "Your login session could not be checked.",
        "error"
      );


      return;
    }


    const user =
      sessionResult
        .data
        ?.session
        ?.user;


    if (!user) {
      showProfileMessage(
        "You need to log in to view your profile.",
        "error"
      );


      setTimeout(
        () => {
          window.location.href =
            "login.html?return=profile.html";
        },
        1000
      );


      return;
    }


    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .select(`
        id,
        username,
        bio,
        avatar_url,
        gamerscore,
        location,
        favorite_genre,
        created_at
      `)
      .eq(
        "id",
        user.id
      )
      .maybeSingle();


    if (profileError) {
      console.error(
        "Profile loading error:",
        profileError
      );


      showProfileMessage(
        `The profile could not be loaded: ${profileError.message}`,
        "error"
      );


      return;
    }


    if (!profile) {
      showProfileMessage(
        "Your account exists, but its profile row is missing.",
        "error"
      );


      return;
    }


    displayProfile(
      profile
    );


    showProfileContent();


    loadProfileStats(
      user.id
    );

  } catch (error) {
    console.error(
      "Unexpected profile error:",
      error
    );


    showProfileMessage(
      `The profile could not be loaded: ${error.message}`,
      "error"
    );
  }
}


/* ==================================================
   LOGOUT
   ================================================== */

profileLogoutButton
  ?.addEventListener(
    "click",
    async (event) => {
      event.preventDefault();


      profileLogoutButton.textContent =
        "Logging out...";


      const {
        error
      } = await supabaseClient
        .auth
        .signOut();


      if (error) {
        console.error(
          "Logout error:",
          error
        );


        profileLogoutButton.textContent =
          "Log out";


        showProfileMessage(
          "You could not be logged out.",
          "error"
        );


        return;
      }


      window.location.href =
        "index.html";
    }
  );


/* ==================================================
   START
   ================================================== */

if (
  typeof supabaseClient ===
  "undefined"
) {
  showProfileMessage(
    "Supabase did not load. Check js/supabase.js.",
    "error"
  );

} else {
  loadProfile();
}