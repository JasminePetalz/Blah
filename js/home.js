const $ = (selector) => document.querySelector(selector);

const homeAvatar = $("#home-profile-avatar");
const homeUsername = $("#home-profile-username");
const homeGamerscore = $("#home-profile-gamerscore");
const homeMemberSince = $("#home-profile-member-since");
const homeStatus = $("#home-profile-status");
const homeBio = $("#home-profile-bio");
const primaryLink = $("#home-profile-primary-link");
const secondaryLink = $("#home-profile-secondary-link");
const writeArticleLink = $("#home-write-article");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value, options = {}) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options
  });
}

function shortText(value = "", limit = 150) {
  const text = String(value).trim();
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

function showLoggedOutCard() {
  if (writeArticleLink) writeArticleLink.hidden = true;
  homeAvatar.src = "images/avatar.png";
  homeUsername.textContent = "guest";
  homeGamerscore.textContent = "Gamerscore: —";
  homeMemberSince.textContent = "Member since: —";
  homeStatus.textContent = "Status: Offline";
  homeBio.textContent = "Log in or create an account to make your own profile.";
  primaryLink.textContent = "Log in";
  primaryLink.href = "login.html";
  secondaryLink.textContent = "Create account";
  secondaryLink.href = "signup.html";
  secondaryLink.onclick = null;
}

function showProfileCard(profile) {
  const normalizedRole = String(profile.role || "")
    .trim()
    .toLowerCase()
    .replaceAll("_", "-")
    .replace(/\s+/g, "-");

  const articleRoles = new Set([
    "co-creator",
    "co-creator-dev",
    "cocreator",
    "admin",
    "writer"
  ]);

  console.info("Previous Save profile role:", profile.role || "no role set");

  if (writeArticleLink) {
    writeArticleLink.hidden = !articleRoles.has(normalizedRole);
  }

  const username = profile.username || "user";
  const gamerscore = Number(profile.gamerscore || 0).toLocaleString();
  const memberYear = profile.created_at
    ? new Date(profile.created_at).getFullYear()
    : "—";

  homeUsername.textContent = username;
  homeGamerscore.textContent = `Gamerscore: ${gamerscore}`;
  homeMemberSince.textContent = `Member since: ${memberYear}`;
  homeStatus.textContent = "Status: Online";
  homeBio.textContent = profile.bio || "No bio added yet.";
  homeAvatar.src = profile.avatar_url || "images/avatar.png";
  homeAvatar.onerror = () => {
    homeAvatar.onerror = null;
    homeAvatar.src = "images/avatar.png";
  };

  primaryLink.textContent = "View profile";
  primaryLink.href = "profile.html";
  secondaryLink.textContent = "Log out";
  secondaryLink.href = "#";
  secondaryLink.onclick = async (event) => {
    event.preventDefault();
    secondaryLink.textContent = "Logging out...";
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
      secondaryLink.textContent = "Log out";
      return;
    }
    showLoggedOutCard();
  };
}

async function loadHomepageProfile() {
  try {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      showLoggedOutCard();
      return;
    }

    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("username,bio,avatar_url,gamerscore,created_at,role")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    showProfileCard(profile);
  } catch (error) {
    console.error("Homepage profile error:", error);
    showLoggedOutCard();
  }
}

async function loadFeaturedArticle() {
  const title = $("#home-feature-title");
  const description = $("#home-feature-description");
  const image = $("#home-feature-image");
  const link = $("#home-feature-link");
  const kicker = $("#home-feature-kicker");

  try {
    const { data: article, error } = await supabaseClient
      .from("articles")
      .select("id,author_id,game_id,title,subtitle,body,cover_url,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!article) {
      title.textContent = "The archive is waiting for its first story.";
      description.textContent = "Published articles will be featured here as soon as one is added.";
      link.textContent = "VISIT COMMUNITY";
      link.href = "community.html";
      return;
    }

    let authorName = "Previous Save";
    if (article.author_id) {
      const { data: author } = await supabaseClient
        .from("profiles")
        .select("username")
        .eq("id", article.author_id)
        .maybeSingle();
      if (author?.username) authorName = author.username;
    }

    kicker.textContent = `LATEST ARTICLE · ${authorName}`;
    title.textContent = article.title;
    description.textContent = article.subtitle || shortText(article.body, 210);
    link.textContent = "READ ARTICLE";
    link.href = `article.html?id=${encodeURIComponent(article.id)}`;

    if (article.cover_url) {
      image.src = article.cover_url;
      image.alt = `${article.title} article cover`;
    }
  } catch (error) {
    console.error("Featured article error:", error);
    title.textContent = "Explore stories from the Xbox 360 era.";
    description.textContent = "Read community-written histories, retrospectives, and preservation pieces.";
  }
}

async function loadGames() {
  const container = $("#home-game-grid");
  try {
    const { data, error } = await supabaseClient
      .from("games")
      .select("id,title,released,cover_url,developer,platform,created_at")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;
    if (!data?.length) {
      container.innerHTML = '<p class="home-loading-message">No games have been archived yet.</p>';
      return;
    }

    container.innerHTML = data.map((game) => `
      <article class="game-item">
        <a href="game.html?id=${encodeURIComponent(game.id)}">
          ${game.cover_url
            ? `<img src="${escapeHtml(game.cover_url)}" alt="${escapeHtml(game.title)} game cover" loading="lazy">`
            : '<div class="home-game-placeholder">NO COVER</div>'}
        </a>
        <h3><a href="game.html?id=${encodeURIComponent(game.id)}">${escapeHtml(game.title)}</a></h3>
        <p>${escapeHtml(game.developer || game.platform || "Xbox")} · ${escapeHtml(game.released ? String(game.released).slice(0, 4) : "—")}</p>
      </article>
    `).join("");
  } catch (error) {
    console.error("Homepage games error:", error);
    container.innerHTML = '<p class="home-loading-message">Games could not be loaded.</p>';
  }
}

async function loadArticles() {
  const container = $("#home-article-list");
  try {
    const { data, error } = await supabaseClient
      .from("articles")
      .select("id,author_id,title,subtitle,body,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(3);

    if (error) throw error;
    if (!data?.length) {
      container.innerHTML = '<p class="home-loading-message">No published articles yet.</p>';
      return;
    }

    const authorIds = [...new Set(data.map((item) => item.author_id).filter(Boolean))];
    let authorMap = new Map();
    if (authorIds.length) {
      const { data: authors } = await supabaseClient
        .from("profiles")
        .select("id,username")
        .in("id", authorIds);
      authorMap = new Map((authors || []).map((author) => [author.id, author.username]));
    }

    container.innerHTML = data.map((article) => {
      const date = new Date(article.published_at || Date.now());
      const day = String(date.getDate()).padStart(2, "0");
      const month = date.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
      const author = authorMap.get(article.author_id) || "Previous Save";
      return `
        <article class="post">
          <div class="post-date"><strong>${day}</strong><span>${month}</span></div>
          <div class="post-content">
            <h3><a href="article.html?id=${encodeURIComponent(article.id)}">${escapeHtml(article.title)}</a></h3>
            <p>${escapeHtml(article.subtitle || shortText(article.body, 180))}</p>
            <span class="post-details">written by ${escapeHtml(author)} · ${escapeHtml(formatDate(article.published_at))}</span>
          </div>
        </article>
      `;
    }).join("");
  } catch (error) {
    console.error("Homepage articles error:", error);
    container.innerHTML = '<p class="home-loading-message">Articles could not be loaded.</p>';
  }
}

async function loadClips() {
  const container = $("#home-clip-grid");
  try {
    const { data, error } = await supabaseClient
      .from("clips")
      .select("id,game_id,title,clip_type,youtube_video_id,youtube_url,video_url,created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;
    if (!data?.length) {
      container.innerHTML = '<p class="home-loading-message">No clips have been posted yet.</p>';
      return;
    }

    container.innerHTML = data.map((clip) => {
      const youtubeId = clip.youtube_video_id;
      const preview = youtubeId
        ? `<img src="https://i.ytimg.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg" alt="${escapeHtml(clip.title)} clip preview" loading="lazy">`
        : '<div class="home-clip-placeholder">VIDEO CLIP</div>';
      const href = clip.game_id ? `game.html?id=${encodeURIComponent(clip.game_id)}#clips` : "community.html?type=clips";
      return `<a class="home-clip-link" href="${href}">${preview}<span>${escapeHtml(clip.title)}</span></a>`;
    }).join("");
  } catch (error) {
    console.error("Homepage clips error:", error);
    container.innerHTML = '<p class="home-loading-message">Clips could not be loaded.</p>';
  }
}

async function loadReviews() {
  const container = $("#home-review-list");
  try {
    const { data, error } = await supabaseClient
      .from("reviews")
      .select("id,user_id,game_id,rating,title,body,created_at")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error) throw error;
    if (!data?.length) {
      container.innerHTML = '<p class="home-loading-message">No reviews have been posted yet.</p>';
      return;
    }

    const gameIds = [...new Set(data.map((item) => item.game_id).filter(Boolean))];
    const userIds = [...new Set(data.map((item) => item.user_id).filter(Boolean))];
    let gameMap = new Map();
    let userMap = new Map();

    if (gameIds.length) {
      const { data: games } = await supabaseClient.from("games").select("id,title").in("id", gameIds);
      gameMap = new Map((games || []).map((game) => [String(game.id), game.title]));
    }
    if (userIds.length) {
      const { data: users } = await supabaseClient.from("profiles").select("id,username").in("id", userIds);
      userMap = new Map((users || []).map((user) => [user.id, user.username]));
    }

    container.innerHTML = data.map((review) => `
      <article class="review">
        <div class="review-score">${escapeHtml(review.rating)}</div>
        <div>
          <h3><a href="game.html?id=${encodeURIComponent(review.game_id)}#reviews">${escapeHtml(gameMap.get(String(review.game_id)) || review.title || "Game review")}</a></h3>
          <p>${escapeHtml(shortText(review.body || review.title || "", 180))}</p>
          <span class="post-details">reviewed by ${escapeHtml(userMap.get(review.user_id) || "member")} · ${escapeHtml(formatDate(review.created_at))}</span>
        </div>
      </article>
    `).join("");
  } catch (error) {
    console.error("Homepage reviews error:", error);
    container.innerHTML = '<p class="home-loading-message">Reviews could not be loaded.</p>';
  }
}

async function loadStats() {
  const tableTargets = [
    ["games", "#home-stat-games", null],
    ["clips", "#home-stat-clips", null],
    ["profiles", "#home-stat-members", null],
    ["articles", "#home-stat-articles", { column: "status", value: "published" }]
  ];

  await Promise.all(tableTargets.map(async ([table, selector, filter]) => {
    try {
      let query = supabaseClient.from(table).select("*", { count: "exact", head: true });
      if (filter) query = query.eq(filter.column, filter.value);
      const { count, error } = await query;
      if (error) throw error;
      $(selector).textContent = Number(count || 0).toLocaleString();
    } catch (error) {
      console.error(`Homepage ${table} count error:`, error);
      $(selector).textContent = "—";
    }
  }));
}

async function loadNewestMembers() {
  const container = $("#home-member-list");
  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id,username,avatar_url,created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw error;
    if (!data?.length) {
      container.innerHTML = '<p class="home-loading-message">No members yet.</p>';
      return;
    }
    container.innerHTML = data.map((member) => `
      <a class="home-member-row" href="profile.html?id=${encodeURIComponent(member.id)}">
        <img src="${escapeHtml(member.avatar_url || "images/avatar.png")}" alt="" loading="lazy">
        <span><strong>${escapeHtml(member.username || "user")}</strong><small>joined ${escapeHtml(formatDate(member.created_at, { year: undefined }))}</small></span>
      </a>
    `).join("");
  } catch (error) {
    console.error("Homepage members error:", error);
    container.innerHTML = '<p class="home-loading-message">Members could not be loaded.</p>';
  }
}

async function initializeHomepage() {
  if (typeof supabaseClient === "undefined") {
    console.error("Supabase did not load.");
    showLoggedOutCard();
    return;
  }

  await Promise.allSettled([
    loadHomepageProfile(),
    loadFeaturedArticle(),
    loadGames(),
    loadArticles(),
    loadClips(),
    loadReviews(),
    loadStats(),
    loadNewestMembers()
  ]);
}

document.addEventListener("DOMContentLoaded", initializeHomepage);
