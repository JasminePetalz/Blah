const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const searchForm = $("#community-search-form");
const searchInput = $("#community-search-input");
const message = $("#community-message");
const defaultView = $("#community-default-view");
const searchView = $("#community-search-view");
const searchTitle = $("#community-search-title");
const searchResults = $("#community-search-results");
const clearSearch = $("#community-clear-search");
const filters = $$('[data-community-type]');

let activeType = "all";

function esc(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function joined(value) {
  return Array.isArray(value) ? value[0] || null : value || null;
}

function date(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function safeTerm(value) {
  return String(value || "")
    .trim()
    .replace(/[(),]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 80);
}

function showMessage(text, status = "") {
  message.hidden = false;
  message.textContent = text;
  message.dataset.status = status;
}

function hideMessage() {
  message.hidden = true;
}

function setType(type) {
  const allowed = ["all", "articles", "reviews", "clips", "people", "tags"];
  activeType = allowed.includes(type) ? type : "all";
  filters.forEach((button) => {
    button.classList.toggle("active", button.dataset.communityType === activeType);
  });
  $$(".community-subnav a").forEach((link) => {
    const url = new URL(link.href, window.location.href);
    const linkType = url.searchParams.get("type") || "all";
    link.classList.toggle("active", linkType === activeType);
  });
}

function updateUrl(query = "") {
  const url = new URL(window.location.href);
  query ? url.searchParams.set("q", query) : url.searchParams.delete("q");
  activeType === "all"
    ? url.searchParams.delete("type")
    : url.searchParams.set("type", activeType);
  history.replaceState({}, "", url);
}

function authorLink(author) {
  if (!author) return "";
  return `<a class="community-author-link" href="profile.html?id=${encodeURIComponent(author.id)}">
    <img src="${esc(author.avatar_url || "images/avatar.png")}" alt="">
    <span>${esc(author.username || "user")}</span>
  </a>`;
}

function renderArticles(container, rows) {
  if (!rows.length) {
    container.innerHTML = '<p class="community-empty-message">No published articles yet.</p>';
    return;
  }
  container.innerHTML = rows.map((row) => {
    const author = joined(row.author);
    const game = joined(row.game);
    return `<article class="community-article-card">
      <a class="community-article-cover" href="article.html?id=${encodeURIComponent(row.id)}">
        ${row.cover_url
          ? `<img src="${esc(row.cover_url)}" alt="${esc(row.title)}" loading="lazy">`
          : '<div class="community-cover-placeholder">360 ARCHIVE</div>'}
      </a>
      <div class="community-article-content">
        <div class="community-card-meta"><span>${esc(game?.title || "360 Archive")}</span><span>${esc(date(row.published_at))}</span></div>
        <h3><a href="article.html?id=${encodeURIComponent(row.id)}">${esc(row.title)}</a></h3>
        ${row.subtitle ? `<p>${esc(row.subtitle)}</p>` : ""}
        ${authorLink(author)}
      </div>
    </article>`;
  }).join("");
}

function renderMembers(container, rows) {
  if (!rows.length) {
    container.innerHTML = '<p class="community-empty-message">No members found.</p>';
    return;
  }
  container.innerHTML = rows.map((row) => `<a class="community-member-card" href="profile.html?id=${encodeURIComponent(row.id)}">
    <img src="${esc(row.avatar_url || "images/avatar.png")}" alt="${esc(row.username || "user")} avatar">
    <div><div class="community-member-name"><strong>${esc(row.username || "user")}</strong>${row.role && row.role !== "member" ? `<span>${esc(row.role.replaceAll("-", " ").toUpperCase())}</span>` : ""}</div>
    <p>${esc(row.bio || "No bio added yet.")}</p></div>
  </a>`).join("");
}

function renderReviews(container, rows) {
  if (!rows.length) {
    container.innerHTML = '<p class="community-empty-message">No reviews found.</p>';
    return;
  }
  container.innerHTML = rows.map((row) => {
    const profile = joined(row.profile);
    const game = joined(row.game);
    return `<article class="community-review-card">
      <div class="community-review-score">${esc(row.rating)}</div>
      <div><div class="community-card-meta"><span>${esc(game?.title || "Unknown game")}</span><span>${esc(date(row.created_at))}</span></div>
      <h3><a href="game.html?id=${encodeURIComponent(row.game_id)}">${esc(row.title)}</a></h3>
      <p>${esc(row.body)}</p>${authorLink(profile)}</div>
    </article>`;
  }).join("");
}

function renderClips(container, rows) {
  if (!rows.length) {
    container.innerHTML = '<p class="community-empty-message">No clips found.</p>';
    return;
  }
  container.innerHTML = rows.map((row) => {
    const profile = joined(row.profile);
    const game = joined(row.game);
    let media = '<div class="community-clip-placeholder">VIDEO</div>';
    if (row.clip_type === "upload" && row.video_url) {
      media = `<video src="${esc(row.video_url)}" controls preload="metadata" playsinline></video>`;
    } else if (row.youtube_video_id) {
      media = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(row.youtube_video_id)}" title="${esc(row.title)}" loading="lazy" allowfullscreen></iframe>`;
    }
    return `<article class="community-clip-card">
      <div class="community-clip-media">${media}</div>
      <div class="community-clip-content"><div class="community-card-meta"><span>${esc(game?.title || "Unknown game")}</span><span>${esc(date(row.created_at))}</span></div>
      <h3><a href="game.html?id=${encodeURIComponent(row.game_id)}">${esc(row.title)}</a></h3>
      ${row.description ? `<p>${esc(row.description)}</p>` : ""}${authorLink(profile)}</div>
    </article>`;
  }).join("");
}

function renderTags(container, rows) {
  if (!rows.length) {
    container.innerHTML = '<p class="community-empty-message">No tags found.</p>';
    return;
  }
  container.innerHTML = rows.map((row) => {
    const profile = joined(row.profile);
    return `<a class="community-tag-card" href="profile.html?id=${encodeURIComponent(profile?.id || "")}">
      <span class="community-tag-name">#${esc(row.tag)}</span>
      <div><strong>${esc(profile?.username || "user")}</strong><p>${esc(profile?.bio || "No bio added yet.")}</p></div>
    </a>`;
  }).join("");
}

async function articles(term = "", limit = 40) {
  let query = supabaseClient.from("articles").select(`id,title,subtitle,cover_url,published_at,author:profiles(id,username,avatar_url),game:games(id,title)`).eq("status", "published").order("published_at", { ascending: false }).limit(limit);
  if (term) query = query.or(`title.ilike.%${term}%,subtitle.ilike.%${term}%,body.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function members(term = "", limit = 40) {
  let query = supabaseClient.from("profiles").select("id,username,avatar_url,bio,location,favorite_genre,role,created_at").order("created_at", { ascending: false }).limit(limit);
  if (term) query = query.or(`username.ilike.%${term}%,bio.ilike.%${term}%,location.ilike.%${term}%,favorite_genre.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function reviews(term = "", limit = 40) {
  let query = supabaseClient.from("reviews").select(`id,user_id,game_id,rating,title,body,created_at,profile:profiles(id,username,avatar_url),game:games(id,title)`).order("created_at", { ascending: false }).limit(limit);
  if (term) query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function clips(term = "", limit = 40) {
  let query = supabaseClient.from("clips").select(`id,user_id,game_id,title,description,clip_type,youtube_video_id,video_url,created_at,profile:profiles(id,username,avatar_url),game:games(id,title)`).order("created_at", { ascending: false }).limit(limit);
  if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function tags(term = "", limit = 50) {
  let query = supabaseClient.from("profile_tags").select(`tag,normalized_tag,user_id,profile:profiles(id,username,avatar_url,bio,role)`).order("tag", { ascending: true }).limit(limit);
  if (term) query = query.ilike("tag", `%${term}%`);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

function resultSection(title, className) {
  const section = document.createElement("section");
  section.className = "community-search-section";
  section.innerHTML = `<div class="community-section-heading"><h2>${esc(title)}</h2></div><div class="${className}"></div>`;
  searchResults.append(section);
  return section.querySelector(`.${className}`);
}

async function loadOverview() {
  defaultView.hidden = false;
  searchView.hidden = true;
  showMessage("Loading the community...");
  const jobs = [
    articles("", 4).then((rows) => renderArticles($("#community-latest-articles"), rows)),
    members("", 6).then((rows) => renderMembers($("#community-new-members"), rows)),
    reviews("", 6).then((rows) => renderReviews($("#community-latest-reviews"), rows)),
    clips("", 4).then((rows) => renderClips($("#community-latest-clips"), rows))
  ];
  const settled = await Promise.allSettled(jobs);
  settled.forEach((result) => result.status === "rejected" && console.error(result.reason));
  hideMessage();
}

async function loadResults(term = "") {
  defaultView.hidden = true;
  searchView.hidden = false;
  searchResults.innerHTML = "";
  searchTitle.textContent = term ? `Results for “${term}”` : `${activeType[0].toUpperCase()}${activeType.slice(1)}`;
  showMessage(term ? `Searching for “${term}”...` : `Loading ${activeType}...`);
  updateUrl(term);

  try {
    const tasks = [];
    if (["all", "people"].includes(activeType)) tasks.push(members(term).then((rows) => ["People", "community-search-members", renderMembers, rows]));
    if (["all", "articles"].includes(activeType)) tasks.push(articles(term).then((rows) => ["Articles", "community-search-articles", renderArticles, rows]));
    if (["all", "reviews"].includes(activeType)) tasks.push(reviews(term).then((rows) => ["Reviews", "community-search-reviews", renderReviews, rows]));
    if (["all", "clips"].includes(activeType)) tasks.push(clips(term).then((rows) => ["Clips", "community-search-clips", renderClips, rows]));
    if (["all", "tags"].includes(activeType)) tasks.push(tags(term).then((rows) => ["Tags", "community-search-tags", renderTags, rows]));

    const groups = await Promise.all(tasks);
    hideMessage();
    let total = 0;
    groups.forEach(([title, className, renderer, rows]) => {
      total += rows.length;
      if (rows.length || activeType !== "all") renderer(resultSection(title, className), rows);
    });
    if (!total) searchResults.innerHTML = '<div class="community-search-empty"><h2>Nothing found</h2><p>Try another title, username, phrase, or tag.</p></div>';
  } catch (error) {
    console.error("Community loading error:", error);
    showMessage(`Community could not load: ${error.message || "Unknown error"}`, "error");
  }
}

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  loadResults(safeTerm(searchInput.value));
});

filters.forEach((button) => button.addEventListener("click", () => {
  setType(button.dataset.communityType);
  const term = safeTerm(searchInput.value);
  activeType === "all" && !term ? loadOverview() : loadResults(term);
}));

clearSearch?.addEventListener("click", () => {
  searchInput.value = "";
  setType("all");
  updateUrl("");
  loadOverview();
});

async function start() {
  const params = new URLSearchParams(window.location.search);
  const term = safeTerm(params.get("q"));
  setType(params.get("type") || "all");
  searchInput.value = term;
  if (activeType === "all" && !term) await loadOverview();
  else await loadResults(term);
}

if (typeof supabaseClient === "undefined") {
  showMessage("Supabase did not load. Check js/supabase.js.", "error");
} else {
  start();
}
