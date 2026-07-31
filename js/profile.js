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

const profileReviewList =
  document.querySelector(
    "#profile-review-list"
  );

const profileClipList =
  document.querySelector(
    "#profile-clip-list"
  );

const profileActivityList =
  document.querySelector(
    "#profile-activity-list"
  );

const profileReviewCountLabel =
  document.querySelector(
    "#profile-review-count-label"
  );

const profileClipCountLabel =
  document.querySelector(
    "#profile-clip-count-label"
  );

const profileLogoutButton =
  document.querySelector(
    "#profile-logout-button"
  );


let currentProfileUser =
  null;


/* ==================================================
   HELPERS
   ================================================== */

function escapeProfileHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


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


function formatActivityDate(value) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric"
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


function getGameTitle(record) {
  if (
    Array.isArray(record.game)
  ) {
    return (
      record.game[0]?.title ||
      "Unknown game"
    );
  }

  return (
    record.game?.title ||
    "Unknown game"
  );
}


/* ==================================================
   BASIC PROFILE
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


/* ==================================================
   REVIEWS
   ================================================== */

function renderProfileReviews(reviews) {
  profileReviewList.innerHTML =
    "";

  profileReviewCountLabel.textContent =
    `${reviews.length} review${
      reviews.length === 1
        ? ""
        : "s"
    }`;

  profileStatReviews.textContent =
    reviews.length;

  if (!reviews.length) {
    profileReviewList.innerHTML = `
      <div class="profile-empty-state">

        <p>
          This user has not posted any reviews yet.
        </p>

      </div>
    `;

    return;
  }

  reviews.forEach((review) => {
    const gameTitle =
      getGameTitle(review);

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "profile-review-card";

    card.innerHTML = `
      <div class="profile-review-score">
        ${escapeProfileHtml(review.rating)}
      </div>

      <div class="profile-review-card-content">

        <div class="profile-card-meta">

          <span>
            ${escapeProfileHtml(
              formatActivityDate(
                review.created_at
              )
            )}
          </span>

          <span>
            ${escapeProfileHtml(gameTitle)}
          </span>

        </div>

        <h3>
          <a href="game.html?id=${encodeURIComponent(review.game_id)}">
            ${escapeProfileHtml(review.title)}
          </a>
        </h3>

        <p>
          ${escapeProfileHtml(review.body)}
        </p>

        <a
          class="profile-card-link"
          href="game.html?id=${encodeURIComponent(review.game_id)}"
        >
          VIEW GAME
        </a>

      </div>
    `;

    profileReviewList.append(card);
  });
}


async function loadProfileReviews(userId) {
  const {
    data,
    error
  } = await supabaseClient
    .from("reviews")
    .select(`
      id,
      user_id,
      game_id,
      rating,
      title,
      body,
      created_at,
      updated_at,
      game:games (
        title
      )
    `)
    .eq(
      "user_id",
      userId
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(
      "Profile review error:",
      error
    );

    profileReviewList.innerHTML = `
      <p class="profile-empty-message">
        Reviews could not be loaded.
      </p>
    `;

    profileStatReviews.textContent =
      "0";

    return [];
  }

  const reviews =
    data ||
    [];

  renderProfileReviews(
    reviews
  );

  return reviews;
}


/* ==================================================
   CLIPS
   ================================================== */

function renderProfileClips(clips) {
  profileClipList.innerHTML =
    "";

  profileClipCountLabel.textContent =
    `${clips.length} clip${
      clips.length === 1
        ? ""
        : "s"
    }`;

  profileStatClips.textContent =
    clips.length;

  if (!clips.length) {
    profileClipList.innerHTML = `
      <div class="profile-empty-state">

        <p>
          This user has not posted any clips yet.
        </p>

      </div>
    `;

    return;
  }

  clips.forEach((clip) => {
    const gameTitle =
      getGameTitle(clip);

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "profile-clip-card";

    let videoHtml;

    if (
      clip.clip_type === "upload" &&
      clip.video_url
    ) {
      videoHtml = `
        <video
          src="${escapeProfileHtml(clip.video_url)}"
          controls
          preload="metadata"
          playsinline
        ></video>
      `;

    } else if (
      clip.youtube_video_id
    ) {
      videoHtml = `
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(
            clip.youtube_video_id
          )}"
          title="${escapeProfileHtml(clip.title)}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      `;

    } else {
      videoHtml = `
        <div class="profile-clip-placeholder">
          VIDEO UNAVAILABLE
        </div>
      `;
    }

    card.innerHTML = `
      <div class="profile-clip-media">

        ${videoHtml}

        <span>
          ${
            clip.clip_type === "upload"
              ? "UPLOADED"
              : "YOUTUBE"
          }
        </span>

      </div>

      <div class="profile-clip-card-content">

        <div class="profile-card-meta">

          <span>
            ${escapeProfileHtml(
              formatActivityDate(
                clip.created_at
              )
            )}
          </span>

          <span>
            ${escapeProfileHtml(gameTitle)}
          </span>

        </div>

        <h3>
          ${escapeProfileHtml(clip.title)}
        </h3>

        ${
          clip.description
            ? `
                <p>
                  ${escapeProfileHtml(
                    clip.description
                  )}
                </p>
              `
            : ""
        }

        <a
          class="profile-card-link"
          href="game.html?id=${encodeURIComponent(clip.game_id)}"
        >
          VIEW GAME
        </a>

      </div>
    `;

    profileClipList.append(card);
  });
}


async function loadProfileClips(userId) {
  const {
    data,
    error
  } = await supabaseClient
    .from("clips")
    .select(`
      id,
      user_id,
      game_id,
      title,
      description,
      clip_type,
      youtube_url,
      youtube_video_id,
      video_url,
      created_at,
      game:games (
        title
      )
    `)
    .eq(
      "user_id",
      userId
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );

  if (error) {
    console.error(
      "Profile clip error:",
      error
    );

    profileClipList.innerHTML = `
      <p class="profile-empty-message">
        Clips could not be loaded.
      </p>
    `;

    profileStatClips.textContent =
      "0";

    return [];
  }

  const clips =
    data ||
    [];

  renderProfileClips(
    clips
  );

  return clips;
}


/* ==================================================
   ACTIVITY
   ================================================== */

function renderProfileActivity(
  reviews,
  clips
) {
  const activity = [
    ...reviews.map((review) => ({
      type:
        "review",

      created_at:
        review.created_at,

      game_id:
        review.game_id,

      game_title:
        getGameTitle(review),

      title:
        review.title,

      rating:
        review.rating
    })),

    ...clips.map((clip) => ({
      type:
        "clip",

      created_at:
        clip.created_at,

      game_id:
        clip.game_id,

      game_title:
        getGameTitle(clip),

      title:
        clip.title
    }))
  ]
    .sort((first, second) => {
      return (
        new Date(
          second.created_at
        ) -
        new Date(
          first.created_at
        )
      );
    })
    .slice(0, 6);

  profileActivityList.innerHTML =
    "";

  if (!activity.length) {
    profileActivityList.innerHTML = `
      <div class="profile-empty-state">

        <p>
          Reviews, clips and posts from this user will appear here.
        </p>

      </div>
    `;

    return;
  }

  activity.forEach((item) => {
    const activityItem =
      document.createElement(
        "a"
      );

    activityItem.className =
      "profile-activity-item";

    activityItem.href =
      `game.html?id=${encodeURIComponent(item.game_id)}`;

    const actionText =
      item.type === "review"
        ? `posted a ${item.rating}/10 review`
        : "shared a clip";

    activityItem.innerHTML = `
      <span class="profile-activity-icon">
        ${
          item.type === "review"
            ? "★"
            : "▶"
        }
      </span>

      <div>

        <p>
          <strong>
            ${escapeProfileHtml(actionText)}
          </strong>

          for

          <span>
            ${escapeProfileHtml(item.game_title)}
          </span>
        </p>

        <small>
          ${escapeProfileHtml(item.title)}
          ·
          ${escapeProfileHtml(
            formatActivityDate(
              item.created_at
            )
          )}
        </small>

      </div>
    `;

    profileActivityList.append(
      activityItem
    );
  });
}


/* ==================================================
   GAME COUNT
   ================================================== */

async function loadGameCount(userId) {
  const {
    count,
    error
  } = await supabaseClient
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
    );

  if (error) {
    console.error(
      "Profile game count error:",
      error
    );

    profileStatGames.textContent =
      "0";

    return;
  }

  profileStatGames.textContent =
    count ??
    0;
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
        "Your login session took too long to load. Refresh the page.",
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

    currentProfileUser =
      sessionResult
        .data
        ?.session
        ?.user ||
      null;

    if (!currentProfileUser) {
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
        currentProfileUser.id
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
        "Your account exists, but its profile information is missing.",
        "error"
      );

      return;
    }

    displayProfile(
      profile
    );

    showProfileContent();

    profileStatPosts.textContent =
      "0";

    const [
      reviews,
      clips
    ] = await Promise.all([
      loadProfileReviews(
        currentProfileUser.id
      ),

      loadProfileClips(
        currentProfileUser.id
      ),

      loadGameCount(
        currentProfileUser.id
      )
    ]);

    renderProfileActivity(
      reviews,
      clips
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