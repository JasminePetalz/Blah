const profileMessage =
  document.querySelector("#profile-message");

const profileContent =
  document.querySelector("#profile-content");

const profileAvatar =
  document.querySelector("#profile-avatar");

const profileUsername =
  document.querySelector("#profile-username");

const profileBio =
  document.querySelector("#profile-bio");

const profileLocation =
  document.querySelector("#profile-location");

const profileMemberSince =
  document.querySelector("#profile-member-since");

const profileAboutUsername =
  document.querySelector("#profile-about-username");

const profileAboutLocation =
  document.querySelector("#profile-about-location");

const profileFavoriteGenre =
  document.querySelector("#profile-favorite-genre");

const profileGamerscore =
  document.querySelector("#profile-gamerscore");

const profileRoleBadge =
  document.querySelector("#profile-role-badge");

const profileStaffCard =
  document.querySelector("#profile-staff-card");

const profileStaffTitle =
  document.querySelector("#profile-staff-title");

const profileStaffDescription =
  document.querySelector("#profile-staff-description");

const profileAboutRoleRow =
  document.querySelector("#profile-about-role-row");

const profileAboutRole =
  document.querySelector("#profile-about-role");

const profileStatPosts =
  document.querySelector("#profile-stat-posts");

const profileStatReviews =
  document.querySelector("#profile-stat-reviews");

const profileStatClips =
  document.querySelector("#profile-stat-clips");

const profileStatGames =
  document.querySelector("#profile-stat-games");

const profileActivityList =
  document.querySelector("#profile-activity-list");

const profileReviewList =
  document.querySelector("#profile-review-list");

const profileClipList =
  document.querySelector("#profile-clip-list");

const profileReviewCountLabel =
  document.querySelector("#profile-review-count-label");

const profileClipCountLabel =
  document.querySelector("#profile-clip-count-label");

const profileLogoutButton =
  document.querySelector("#profile-logout-button");

const profileTabButtons =
  document.querySelectorAll("[data-profile-tab]");

const profileTabPanels =
  document.querySelectorAll("[data-profile-panel]");


let currentProfileUser =
  null;


/* ==================================================
   GENERAL HELPERS
   ================================================== */

function escapeProfileHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function setText(element, value) {
  if (element) {
    element.textContent =
      value;
  }
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


function getGameTitle(record) {
  if (
    Array.isArray(record?.game)
  ) {
    return (
      record.game[0]?.title ||
      "Unknown game"
    );
  }

  return (
    record?.game?.title ||
    "Unknown game"
  );
}


async function withTimeout(
  promise,
  milliseconds,
  timeoutMessage
) {
  let timeoutId;

  const timeoutPromise =
    new Promise(
      (
        resolve,
        reject
      ) => {
        timeoutId =
          setTimeout(
            () => {
              reject(
                new Error(
                  timeoutMessage
                )
              );
            },
            milliseconds
          );
      }
    );

  try {
    return await Promise.race([
      promise,
      timeoutPromise
    ]);

  } finally {
    clearTimeout(timeoutId);
  }
}


/* ==================================================
   PROFILE TABS
   ================================================== */

function openProfileTab(tabName) {
  const validTabs = [
    "overview",
    "reviews",
    "clips"
  ];

  const safeTab =
    validTabs.includes(tabName)
      ? tabName
      : "overview";

  profileTabButtons.forEach(
    (button) => {
      const active =
        button.dataset.profileTab ===
        safeTab;

      button.classList.toggle(
        "active",
        active
      );

      button.setAttribute(
        "aria-selected",
        String(active)
      );
    }
  );

  profileTabPanels.forEach(
    (panel) => {
      const active =
        panel.dataset.profilePanel ===
        safeTab;

      panel.classList.toggle(
        "active",
        active
      );

      panel.hidden =
        !active;
    }
  );

  sessionStorage.setItem(
    "profileActiveTab",
    safeTab
  );
}


profileTabButtons.forEach(
  (button) => {
    button.addEventListener(
      "click",
      () => {
        openProfileTab(
          button.dataset.profileTab
        );
      }
    );
  }
);


/* ==================================================
   STAFF ROLE
   ================================================== */

function displayProfileRole(profile) {
  const role =
    String(
      profile.role ||
      "member"
    ).toLowerCase();

  const roleSettings = {
    "co-creator": {
      badge:
        "CO-CREATOR",

      title:
        "360 ARCHIVE CO-CREATOR",

      name:
        "Co-creator"
    },

    "co-creator-dev": {
      badge:
        "CO-CREATOR · DEV",

      title:
        "360 ARCHIVE CO-CREATOR & DEVELOPER",

      name:
        "Co-creator and developer"
    },

    admin: {
      badge:
        "ADMIN",

      title:
        "360 ARCHIVE ADMINISTRATOR",

      name:
        "Administrator"
    },

    moderator: {
      badge:
        "MOD",

      title:
        "360 ARCHIVE MODERATOR",

      name:
        "Moderator"
    }
  };

  const settings =
    roleSettings[role];

  if (!settings) {
    if (profileRoleBadge) {
      profileRoleBadge.hidden =
        true;

      profileRoleBadge.removeAttribute(
        "data-role"
      );
    }

    if (profileStaffCard) {
      profileStaffCard.hidden =
        true;
    }

    if (profileAboutRoleRow) {
      profileAboutRoleRow.hidden =
        true;
    }

    return;
  }

  if (profileRoleBadge) {
    profileRoleBadge.textContent =
      settings.badge;

    profileRoleBadge.dataset.role =
      role;

    profileRoleBadge.hidden =
      false;
  }

  if (profileStaffCard) {
    profileStaffCard.hidden =
      false;
  }

  setText(
    profileStaffTitle,
    settings.title
  );

  setText(
    profileStaffDescription,
    profile.staff_description ||
      "Member of the 360 Archive team."
  );

  if (profileAboutRoleRow) {
    profileAboutRoleRow.hidden =
      false;
  }

  setText(
    profileAboutRole,
    settings.name
  );
}


/* ==================================================
   BASIC PROFILE
   ================================================== */

function displayProfile(profile) {
  displayProfileRole(profile);

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

  setText(
    profileUsername,
    username
  );

  setText(
    profileBio,
    profile.bio ||
      "No bio added yet."
  );

  setText(
    profileLocation,
    `Location: ${location}`
  );

  setText(
    profileMemberSince,
    `Member since: ${memberSince}`
  );

  setText(
    profileAboutUsername,
    username
  );

  setText(
    profileAboutLocation,
    location
  );

  setText(
    profileFavoriteGenre,
    favoriteGenre
  );

  setText(
    profileGamerscore,
    gamerscore
  );

  if (profileAvatar) {
    profileAvatar.src =
      profile.avatar_url ||
      "images/avatar.png";

    profileAvatar.alt =
      `${username} avatar`;

    profileAvatar.onerror =
      () => {
        profileAvatar.onerror =
          null;

        profileAvatar.src =
          "images/avatar.png";
      };
  }
}


/* ==================================================
   REVIEWS
   ================================================== */

function renderProfileReviews(reviews) {
  setText(
    profileStatReviews,
    reviews.length
  );

  setText(
    profileReviewCountLabel,
    `${reviews.length} review${
      reviews.length === 1
        ? ""
        : "s"
    }`
  );

  if (!profileReviewList) {
    return;
  }

  profileReviewList.innerHTML =
    "";

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

  reviews.forEach(
    (review) => {
      const card =
        document.createElement(
          "article"
        );

      const gameTitle =
        getGameTitle(review);

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
    }
  );
}


async function loadProfileReviews(userId) {
  try {
    const result =
      await withTimeout(
        supabaseClient
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
          ),
        8000,
        "Reviews took too long to load."
      );

    if (result.error) {
      throw result.error;
    }

    const reviews =
      result.data ||
      [];

    renderProfileReviews(
      reviews
    );

    return reviews;

  } catch (error) {
    console.error(
      "Profile reviews error:",
      error
    );

    setText(
      profileStatReviews,
      "0"
    );

    setText(
      profileReviewCountLabel,
      "0 reviews"
    );

    if (profileReviewList) {
      profileReviewList.innerHTML = `
        <p class="profile-empty-message">
          Reviews could not be loaded.
        </p>
      `;
    }

    return [];
  }
}


/* ==================================================
   CLIPS
   ================================================== */

function renderProfileClips(clips) {
  setText(
    profileStatClips,
    clips.length
  );

  setText(
    profileClipCountLabel,
    `${clips.length} clip${
      clips.length === 1
        ? ""
        : "s"
    }`
  );

  if (!profileClipList) {
    return;
  }

  profileClipList.innerHTML =
    "";

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

  clips.forEach(
    (clip) => {
      const card =
        document.createElement(
          "article"
        );

      const gameTitle =
        getGameTitle(clip);

      let mediaHtml;

      if (
        clip.clip_type === "upload" &&
        clip.video_url
      ) {
        mediaHtml = `
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
        mediaHtml = `
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
        mediaHtml = `
          <div class="profile-clip-placeholder">
            VIDEO UNAVAILABLE
          </div>
        `;
      }

      card.className =
        "profile-clip-card";

      card.innerHTML = `
        <div class="profile-clip-media">

          ${mediaHtml}

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
    }
  );
}


async function loadProfileClips(userId) {
  try {
    const result =
      await withTimeout(
        supabaseClient
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
          ),
        8000,
        "Clips took too long to load."
      );

    if (result.error) {
      throw result.error;
    }

    const clips =
      result.data ||
      [];

    renderProfileClips(
      clips
    );

    return clips;

  } catch (error) {
    console.error(
      "Profile clips error:",
      error
    );

    setText(
      profileStatClips,
      "0"
    );

    setText(
      profileClipCountLabel,
      "0 clips"
    );

    if (profileClipList) {
      profileClipList.innerHTML = `
        <p class="profile-empty-message">
          Clips could not be loaded.
        </p>
      `;
    }

    return [];
  }
}


/* ==================================================
   RECENT ACTIVITY
   ================================================== */

function renderProfileActivity(
  reviews,
  clips
) {
  if (!profileActivityList) {
    return;
  }

  const activity = [
    ...reviews.map(
      (review) => ({
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
      })
    ),

    ...clips.map(
      (clip) => ({
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
      })
    )
  ]
    .sort(
      (
        first,
        second
      ) => {
        return (
          new Date(second.created_at) -
          new Date(first.created_at)
        );
      }
    )
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

  activity.forEach(
    (item) => {
      const link =
        document.createElement("a");

      link.className =
        "profile-activity-item";

      link.href =
        `game.html?id=${encodeURIComponent(item.game_id)}`;

      const actionText =
        item.type === "review"
          ? `posted a ${item.rating}/10 review`
          : "shared a clip";

      link.innerHTML = `
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

      profileActivityList.append(link);
    }
  );
}


/* ==================================================
   GAME COUNT
   ================================================== */

async function loadGameCount(userId) {
  try {
    const result =
      await withTimeout(
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
          ),
        8000,
        "Game count took too long to load."
      );

    if (result.error) {
      throw result.error;
    }

    setText(
      profileStatGames,
      result.count ?? 0
    );

  } catch (error) {
    console.error(
      "Profile game count error:",
      error
    );

    setText(
      profileStatGames,
      "0"
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
      await withTimeout(
        supabaseClient.auth
          .getSession(),
        5000,
        "Your login session took too long to load."
      );

    if (sessionResult.error) {
      throw sessionResult.error;
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
        1200
      );

      return;
    }

    const profileResult =
      await withTimeout(
        supabaseClient
          .from("profiles")
          .select(`
            id,
            username,
            bio,
            avatar_url,
            gamerscore,
            location,
            favorite_genre,
            role,
            staff_description,
            created_at
          `)
          .eq(
            "id",
            currentProfileUser.id
          )
          .maybeSingle(),
        8000,
        "Your profile information took too long to load."
      );

    if (profileResult.error) {
      throw profileResult.error;
    }

    if (!profileResult.data) {
      showProfileMessage(
        "Your account exists, but its profile information is missing.",
        "error"
      );

      return;
    }

    displayProfile(
      profileResult.data
    );

    setText(
      profileStatPosts,
      "0"
    );

    showProfileContent();

    const savedTab =
      sessionStorage.getItem(
        "profileActiveTab"
      );

    openProfileTab(
      savedTab ||
      "overview"
    );

    const results =
      await Promise.allSettled([
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

    const reviews =
      results[0].status ===
      "fulfilled"
        ? results[0].value
        : [];

    const clips =
      results[1].status ===
      "fulfilled"
        ? results[1].value
        : [];

    renderProfileActivity(
      reviews,
      clips
    );

  } catch (error) {
    console.error(
      "Profile loading error:",
      error
    );

    showProfileMessage(
      `The profile could not be loaded: ${
        error.message ||
        "Unknown error"
      }`,
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

      try {
        const result =
          await withTimeout(
            supabaseClient.auth
              .signOut(),
            5000,
            "Logout took too long."
          );

        if (result.error) {
          throw result.error;
        }

        window.location.href =
          "index.html";

      } catch (error) {
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
      }
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