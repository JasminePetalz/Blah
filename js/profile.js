const byId = (id) => document.getElementById(id);

const profileMessage = byId("profile-message");
const profileContent = byId("profile-content");
const profileAvatar = byId("profile-avatar");
const profileUsername = byId("profile-username");
const profileBio = byId("profile-bio");
const profileLocation = byId("profile-location");
const profileMemberSince = byId("profile-member-since");
const profileAboutUsername = byId("profile-about-username");
const profileAboutLocation = byId("profile-about-location");
const profileFavoriteGenre = byId("profile-favorite-genre");
const profileGamerscore = byId("profile-gamerscore");
const profileRoleBadge = byId("profile-role-badge");
const profileStaffCard = byId("profile-staff-card");
const profileStaffTitle = byId("profile-staff-title");
const profileStaffDescription = byId("profile-staff-description");
const profileAboutRoleRow = byId("profile-about-role-row");
const profileAboutRole = byId("profile-about-role");
const profileEditButton = byId("profile-edit-button");
const profileFollowButton = byId("profile-follow-button");
const profileFollowerCount = byId("profile-follower-count");
const profileFollowingCount = byId("profile-following-count");
const profileFollowersButton = byId("profile-followers-button");
const profileFollowingButton = byId("profile-following-button");
const profileTagList = byId("profile-tag-list");
const profileStatPosts = byId("profile-stat-posts");
const profileStatReviews = byId("profile-stat-reviews");
const profileStatClips = byId("profile-stat-clips");
const profileStatGames = byId("profile-stat-games");
const profileActivityList = byId("profile-activity-list");
const profileReviewList = byId("profile-review-list");
const profileClipList = byId("profile-clip-list");
const profileReviewCountLabel = byId("profile-review-count-label");
const profileClipCountLabel = byId("profile-clip-count-label");
const profileAccountSection = byId("profile-account-section");
const profileLogoutButton = byId("profile-logout-button");
const followListModal = byId("follow-list-modal");
const followListTitle = byId("follow-list-title");
const followListResults = byId("follow-list-results");
const followListClose = byId("follow-list-close");

const profileTabButtons =
  document.querySelectorAll("[data-profile-tab]");

const profileTabPanels =
  document.querySelectorAll("[data-profile-panel]");

let loggedInUser = null;
let viewedProfileId = null;
let viewingOwnProfile = false;
let currentlyFollowing = false;


/* ==================================================
   HELPERS
   ================================================== */

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}


function showMessage(message, status = "") {
  if (!profileMessage) {
    return;
  }

  profileMessage.hidden = false;
  profileMessage.textContent = message;
  profileMessage.dataset.status = status;
}


function showContent() {
  if (profileMessage) {
    profileMessage.hidden = true;
  }

  if (profileContent) {
    profileContent.hidden = false;
  }
}


function formatDate(value, monthOnly = false) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    undefined,
    monthOnly
      ? {
          year: "numeric",
          month: "long"
        }
      : {
          year: "numeric",
          month: "short",
          day: "numeric"
        }
  );
}


function getGameTitle(record) {
  if (Array.isArray(record?.game)) {
    return record.game[0]?.title || "Unknown game";
  }

  return record?.game?.title || "Unknown game";
}


async function withTimeout(promise, milliseconds, message) {
  let timeoutId;

  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(message)),
      milliseconds
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}


/* ==================================================
   TABS
   ================================================== */

function openProfileTab(tabName) {
  const validTabs = ["overview", "reviews", "clips"];
  const safeTab = validTabs.includes(tabName)
    ? tabName
    : "overview";

  profileTabButtons.forEach((button) => {
    const active =
      button.dataset.profileTab === safeTab;

    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

  profileTabPanels.forEach((panel) => {
    const active =
      panel.dataset.profilePanel === safeTab;

    panel.classList.toggle("active", active);
    panel.hidden = !active;
  });

  sessionStorage.setItem("profileActiveTab", safeTab);
}


profileTabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openProfileTab(button.dataset.profileTab);
  });
});


/* ==================================================
   ROLE + PROFILE
   ================================================== */

function displayRole(profile) {
  const role = String(profile.role || "member").toLowerCase();

  const settings = {
    "co-creator": {
      badge: "CO-CREATOR",
      title: "360 ARCHIVE CO-CREATOR",
      name: "Co-creator"
    },

    "co-creator-dev": {
      badge: "CO-CREATOR · DEV",
      title: "360 ARCHIVE CO-CREATOR & DEVELOPER",
      name: "Co-creator and developer"
    },

    admin: {
      badge: "ADMIN",
      title: "360 ARCHIVE ADMINISTRATOR",
      name: "Administrator"
    },

    moderator: {
      badge: "MOD",
      title: "360 ARCHIVE MODERATOR",
      name: "Moderator"
    }
  };

  const selected = settings[role];

  if (!selected) {
    profileRoleBadge.hidden = true;
    profileStaffCard.hidden = true;
    profileAboutRoleRow.hidden = true;
    return;
  }

  profileRoleBadge.textContent = selected.badge;
  profileRoleBadge.dataset.role = role;
  profileRoleBadge.hidden = false;

  profileStaffCard.hidden = false;
  setText(profileStaffTitle, selected.title);
  setText(
    profileStaffDescription,
    profile.staff_description ||
      "Member of the 360 Archive team."
  );

  profileAboutRoleRow.hidden = false;
  setText(profileAboutRole, selected.name);
}


function displayProfile(profile) {
  const username = profile.username || "user";
  const location = profile.location || "Not added";
  const favoriteGenre =
    profile.favorite_genre || "Not added";

  document.title = `${username} | 360 Archive`;

  setText(profileUsername, username);
  setText(profileBio, profile.bio || "No bio added yet.");
  setText(profileLocation, `Location: ${location}`);
  setText(
    profileMemberSince,
    `Member since: ${formatDate(profile.created_at, true)}`
  );
  setText(profileAboutUsername, username);
  setText(profileAboutLocation, location);
  setText(profileFavoriteGenre, favoriteGenre);
  setText(
    profileGamerscore,
    Number(profile.gamerscore || 0).toLocaleString()
  );

  displayRole(profile);

  if (profileAvatar) {
    profileAvatar.src =
      profile.avatar_url || "images/avatar.png";

    profileAvatar.alt = `${username} avatar`;

    profileAvatar.onerror = () => {
      profileAvatar.onerror = null;
      profileAvatar.src = "images/avatar.png";
    };
  }
}


/* ==================================================
   PROFILE ACTIONS
   ================================================== */

function displayProfileActions() {
  profileEditButton.hidden = !viewingOwnProfile;
  profileAccountSection.hidden = !viewingOwnProfile;

  if (viewingOwnProfile) {
    profileFollowButton.hidden = true;
    return;
  }

  profileFollowButton.hidden = false;

  if (!loggedInUser) {
    profileFollowButton.textContent = "LOG IN TO FOLLOW";
    profileFollowButton.dataset.state = "login";
    return;
  }

  profileFollowButton.dataset.state =
    currentlyFollowing ? "following" : "not-following";

  profileFollowButton.textContent =
    currentlyFollowing ? "UNFOLLOW" : "FOLLOW";
}


async function loadFollowState() {
  currentlyFollowing = false;

  if (
    !loggedInUser ||
    !viewedProfileId ||
    viewingOwnProfile
  ) {
    displayProfileActions();
    return;
  }

  const { data, error } = await supabaseClient
    .from("follows")
    .select("follower_id")
    .eq("follower_id", loggedInUser.id)
    .eq("following_id", viewedProfileId)
    .maybeSingle();

  if (error) {
    console.error("Follow state error:", error);
  }

  currentlyFollowing = Boolean(data);
  displayProfileActions();
}


async function toggleFollow() {
  if (!loggedInUser) {
    window.location.href =
      `login.html?return=${encodeURIComponent(
        window.location.pathname + window.location.search
      )}`;

    return;
  }

  if (viewingOwnProfile) {
    return;
  }

  profileFollowButton.disabled = true;
  profileFollowButton.textContent =
    currentlyFollowing ? "UNFOLLOWING..." : "FOLLOWING...";

  try {
    if (currentlyFollowing) {
      const { error } = await supabaseClient
        .from("follows")
        .delete()
        .eq("follower_id", loggedInUser.id)
        .eq("following_id", viewedProfileId);

      if (error) {
        throw error;
      }

      currentlyFollowing = false;
    } else {
      const { error } = await supabaseClient
        .from("follows")
        .insert({
          follower_id: loggedInUser.id,
          following_id: viewedProfileId
        });

      if (error) {
        throw error;
      }

      currentlyFollowing = true;
    }

    await loadFollowCounts();
    displayProfileActions();
  } catch (error) {
    console.error("Follow action error:", error);
    alert(error.message || "The follow action failed.");
  } finally {
    profileFollowButton.disabled = false;
  }
}


profileFollowButton?.addEventListener("click", toggleFollow);


/* ==================================================
   COUNTS + LISTS
   ================================================== */

async function loadFollowCounts() {
  const { data, error } = await supabaseClient
    .rpc("get_profile_follow_counts", {
      profile_user_id: viewedProfileId
    })
    .maybeSingle();

  if (error) {
    console.error("Follow counts error:", error);
    return;
  }

  setText(profileFollowerCount, data?.follower_count ?? 0);
  setText(profileFollowingCount, data?.following_count ?? 0);
}


function closeFollowModal() {
  followListModal.hidden = true;
  document.body.classList.remove("modal-open");
}


function openFollowModal() {
  followListModal.hidden = false;
  document.body.classList.add("modal-open");
}


async function loadFollowList(type) {
  const isFollowers = type === "followers";

  setText(
    followListTitle,
    isFollowers ? "Followers" : "Following"
  );

  followListResults.innerHTML = `
    <p class="profile-empty-message">Loading...</p>
  `;

  openFollowModal();

  const selectClause = isFollowers
    ? `
        follower_id,
        profile:profiles!follows_follower_id_fkey (
          id,
          username,
          avatar_url,
          bio,
          role
        )
      `
    : `
        following_id,
        profile:profiles!follows_following_id_fkey (
          id,
          username,
          avatar_url,
          bio,
          role
        )
      `;

  let query = supabaseClient
    .from("follows")
    .select(selectClause)
    .order("created_at", { ascending: false });

  query = isFollowers
    ? query.eq("following_id", viewedProfileId)
    : query.eq("follower_id", viewedProfileId);

  const { data, error } = await query;

  if (error) {
    console.error("Follow list error:", error);

    followListResults.innerHTML = `
      <p class="profile-empty-message">
        This list could not be loaded.
      </p>
    `;

    return;
  }

  renderFollowList(data || []);
}


function getVisibleRoleLabel(role) {
  const labels = {
    "co-creator": "CO-CREATOR",
    "co-creator-dev": "CO-CREATOR · DEV",
    admin: "ADMIN",
    moderator: "MOD"
  };

  return labels[String(role || "").toLowerCase()] || "";
}


function renderFollowList(rows) {
  followListResults.innerHTML = "";

  if (!rows.length) {
    followListResults.innerHTML = `
      <p class="profile-empty-message">
        Nobody is here yet.
      </p>
    `;

    return;
  }

  rows.forEach((row) => {
    const profile = Array.isArray(row.profile)
      ? row.profile[0]
      : row.profile;

    if (!profile) {
      return;
    }

    const roleLabel = getVisibleRoleLabel(profile.role);
    const item = document.createElement("a");

    item.className = "follow-list-item";
    item.href = `profile.html?id=${encodeURIComponent(profile.id)}`;

    item.innerHTML = `
      <img
        src="${escapeHtml(profile.avatar_url || "images/avatar.png")}"
        alt="${escapeHtml(profile.username || "user")} avatar"
      >

      <div>
        <div class="follow-list-name-row">
          <strong>${escapeHtml(profile.username || "user")}</strong>
          ${
            roleLabel
              ? `<span>${escapeHtml(roleLabel)}</span>`
              : ""
          }
        </div>

        <p>
          ${escapeHtml(profile.bio || "No bio added yet.")}
        </p>
      </div>
    `;

    followListResults.append(item);
  });
}


profileFollowersButton?.addEventListener(
  "click",
  () => loadFollowList("followers")
);

profileFollowingButton?.addEventListener(
  "click",
  () => loadFollowList("following")
);

followListClose?.addEventListener("click", closeFollowModal);

document
  .querySelectorAll("[data-close-follow-modal]")
  .forEach((element) => {
    element.addEventListener("click", closeFollowModal);
  });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !followListModal.hidden) {
    closeFollowModal();
  }
});


/* ==================================================
   TAGS
   ================================================== */

async function loadProfileTags() {
  const { data, error } = await supabaseClient
    .from("profile_tags")
    .select("tag, normalized_tag")
    .eq("user_id", viewedProfileId)
    .order("tag", { ascending: true });

  if (error) {
    console.error("Profile tags error:", error);
    return;
  }

  profileTagList.innerHTML = "";

  (data || []).forEach((item) => {
    const link = document.createElement("a");

    link.href =
      `search.html?q=${encodeURIComponent(item.tag)}` +
      `&type=tags`;

    link.textContent = `#${item.tag}`;

    profileTagList.append(link);
  });
}


/* ==================================================
   REVIEWS
   ================================================== */

function renderReviews(reviews) {
  setText(profileStatReviews, reviews.length);
  setText(
    profileReviewCountLabel,
    `${reviews.length} review${reviews.length === 1 ? "" : "s"}`
  );

  profileReviewList.innerHTML = "";

  if (!reviews.length) {
    profileReviewList.innerHTML = `
      <div class="profile-empty-state">
        <p>This user has not posted any reviews yet.</p>
      </div>
    `;

    return;
  }

  reviews.forEach((review) => {
    const card = document.createElement("article");
    const gameTitle = getGameTitle(review);

    card.className = "profile-review-card";

    card.innerHTML = `
      <div class="profile-review-score">
        ${escapeHtml(review.rating)}
      </div>

      <div class="profile-review-card-content">
        <div class="profile-card-meta">
          <span>${escapeHtml(formatDate(review.created_at))}</span>
          <span>${escapeHtml(gameTitle)}</span>
        </div>

        <h3>
          <a href="game.html?id=${encodeURIComponent(review.game_id)}">
            ${escapeHtml(review.title)}
          </a>
        </h3>

        <p>${escapeHtml(review.body)}</p>

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


async function loadReviews() {
  const { data, error } = await supabaseClient
    .from("reviews")
    .select(`
      id,
      game_id,
      rating,
      title,
      body,
      created_at,
      game:games (title)
    `)
    .eq("user_id", viewedProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Profile reviews error:", error);
    profileReviewList.innerHTML = `
      <p class="profile-empty-message">
        Reviews could not be loaded.
      </p>
    `;
    return [];
  }

  const reviews = data || [];
  renderReviews(reviews);
  return reviews;
}


/* ==================================================
   CLIPS
   ================================================== */

function renderClips(clips) {
  setText(profileStatClips, clips.length);
  setText(
    profileClipCountLabel,
    `${clips.length} clip${clips.length === 1 ? "" : "s"}`
  );

  profileClipList.innerHTML = "";

  if (!clips.length) {
    profileClipList.innerHTML = `
      <div class="profile-empty-state">
        <p>This user has not posted any clips yet.</p>
      </div>
    `;

    return;
  }

  clips.forEach((clip) => {
    const card = document.createElement("article");
    const gameTitle = getGameTitle(clip);

    let mediaHtml = `
      <div class="profile-clip-placeholder">
        VIDEO UNAVAILABLE
      </div>
    `;

    if (clip.clip_type === "upload" && clip.video_url) {
      mediaHtml = `
        <video
          src="${escapeHtml(clip.video_url)}"
          controls
          preload="metadata"
          playsinline
        ></video>
      `;
    } else if (clip.youtube_video_id) {
      mediaHtml = `
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(
            clip.youtube_video_id
          )}"
          title="${escapeHtml(clip.title)}"
          loading="lazy"
          allowfullscreen
        ></iframe>
      `;
    }

    card.className = "profile-clip-card";

    card.innerHTML = `
      <div class="profile-clip-media">
        ${mediaHtml}
      </div>

      <div class="profile-clip-card-content">
        <div class="profile-card-meta">
          <span>${escapeHtml(formatDate(clip.created_at))}</span>
          <span>${escapeHtml(gameTitle)}</span>
        </div>

        <h3>${escapeHtml(clip.title)}</h3>

        ${
          clip.description
            ? `<p>${escapeHtml(clip.description)}</p>`
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


async function loadClips() {
  const { data, error } = await supabaseClient
    .from("clips")
    .select(`
      id,
      game_id,
      title,
      description,
      clip_type,
      youtube_video_id,
      video_url,
      created_at,
      game:games (title)
    `)
    .eq("user_id", viewedProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Profile clips error:", error);
    profileClipList.innerHTML = `
      <p class="profile-empty-message">
        Clips could not be loaded.
      </p>
    `;
    return [];
  }

  const clips = data || [];
  renderClips(clips);
  return clips;
}


/* ==================================================
   ACTIVITY + GAME COUNT
   ================================================== */

function renderActivity(reviews, clips) {
  const activity = [
    ...reviews.map((review) => ({
      type: "review",
      created_at: review.created_at,
      game_id: review.game_id,
      game_title: getGameTitle(review),
      title: review.title,
      rating: review.rating
    })),

    ...clips.map((clip) => ({
      type: "clip",
      created_at: clip.created_at,
      game_id: clip.game_id,
      game_title: getGameTitle(clip),
      title: clip.title
    }))
  ]
    .sort(
      (first, second) =>
        new Date(second.created_at) -
        new Date(first.created_at)
    )
    .slice(0, 6);

  profileActivityList.innerHTML = "";

  if (!activity.length) {
    profileActivityList.innerHTML = `
      <div class="profile-empty-state">
        <p>Reviews, clips and posts from this user will appear here.</p>
      </div>
    `;
    return;
  }

  activity.forEach((item) => {
    const link = document.createElement("a");

    link.className = "profile-activity-item";
    link.href = `game.html?id=${encodeURIComponent(item.game_id)}`;

    const action =
      item.type === "review"
        ? `posted a ${item.rating}/10 review`
        : "shared a clip";

    link.innerHTML = `
      <span class="profile-activity-icon">
        ${item.type === "review" ? "★" : "▶"}
      </span>

      <div>
        <p>
          <strong>${escapeHtml(action)}</strong>
          for
          <span>${escapeHtml(item.game_title)}</span>
        </p>

        <small>
          ${escapeHtml(item.title)}
          ·
          ${escapeHtml(formatDate(item.created_at))}
        </small>
      </div>
    `;

    profileActivityList.append(link);
  });
}


async function loadGameCount() {
  const { count, error } = await supabaseClient
    .from("games")
    .select("id", {
      count: "exact",
      head: true
    })
    .eq("added_by", viewedProfileId);

  if (error) {
    console.error("Game count error:", error);
    return;
  }

  setText(profileStatGames, count ?? 0);
}


/* ==================================================
   LOAD PAGE
   ================================================== */

async function loadProfilePage() {
  showMessage("Loading profile...");

  try {
    const sessionResult = await withTimeout(
      supabaseClient.auth.getSession(),
      5000,
      "The login session took too long to load."
    );

    if (sessionResult.error) {
      throw sessionResult.error;
    }

    loggedInUser =
      sessionResult.data?.session?.user || null;

    const profileIdFromUrl =
      new URLSearchParams(window.location.search).get("id");

    viewedProfileId =
      profileIdFromUrl || loggedInUser?.id || null;

    if (!viewedProfileId) {
      showMessage(
        "Choose a profile to view, or log in to see your own profile.",
        "error"
      );
      return;
    }

    viewingOwnProfile =
      loggedInUser?.id === viewedProfileId;

    const profileResult = await withTimeout(
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
        .eq("id", viewedProfileId)
        .maybeSingle(),
      8000,
      "The profile took too long to load."
    );

    if (profileResult.error) {
      throw profileResult.error;
    }

    if (!profileResult.data) {
      showMessage("That profile could not be found.", "error");
      return;
    }

    displayProfile(profileResult.data);
    setText(profileStatPosts, "0");
    displayProfileActions();
    showContent();

    openProfileTab(
      sessionStorage.getItem("profileActiveTab") || "overview"
    );

    await Promise.all([
      loadFollowState(),
      loadFollowCounts(),
      loadProfileTags(),
      loadGameCount()
    ]);

    const [reviewsResult, clipsResult] =
      await Promise.allSettled([
        loadReviews(),
        loadClips()
      ]);

    const reviews =
      reviewsResult.status === "fulfilled"
        ? reviewsResult.value
        : [];

    const clips =
      clipsResult.status === "fulfilled"
        ? clipsResult.value
        : [];

    renderActivity(reviews, clips);
  } catch (error) {
    console.error("Profile loading error:", error);

    showMessage(
      `The profile could not be loaded: ${
        error.message || "Unknown error"
      }`,
      "error"
    );
  }
}


/* ==================================================
   LOGOUT
   ================================================== */

profileLogoutButton?.addEventListener(
  "click",
  async (event) => {
    event.preventDefault();

    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "index.html";
  }
);


/* ==================================================
   START
   ================================================== */

if (typeof supabaseClient === "undefined") {
  showMessage(
    "Supabase did not load. Check js/supabase.js.",
    "error"
  );
} else {
  loadProfilePage();
}
