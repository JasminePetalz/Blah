const articleEditorMessage =
  document.querySelector("#article-editor-message");

const articleEditorContent =
  document.querySelector("#article-editor-content");

const articleEditorTitle =
  document.querySelector("#article-editor-title");

const articleEditorStatus =
  document.querySelector("#article-editor-status");

const articleForm =
  document.querySelector("#article-form");

const articleGame =
  document.querySelector("#article-game");

const articleTitle =
  document.querySelector("#article-title");

const articleSubtitle =
  document.querySelector("#article-subtitle");

const articleCoverUrl =
  document.querySelector("#article-cover-url");

const articleBody =
  document.querySelector("#article-body");

const articleSaveDraft =
  document.querySelector("#article-save-draft");

const articlePublish =
  document.querySelector("#article-publish");

const articleDelete =
  document.querySelector("#article-delete");

const articlePreview =
  document.querySelector("#article-preview");

const articleRefreshPreview =
  document.querySelector("#article-refresh-preview");

const allowedArticleRoles = [
  "co-creator",
  "co-creator-dev",
  "admin",
  "writer"
];

let loggedInUser = null;
let loggedInProfile = null;
let currentArticleId = null;
let currentArticleStatus = "draft";


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


function showMessage(message, status = "") {
  articleEditorMessage.hidden = false;
  articleEditorMessage.textContent = message;
  articleEditorMessage.dataset.status = status;
}


function showEditor() {
  articleEditorMessage.hidden = true;
  articleEditorContent.hidden = false;
}


function setSavingState(saving) {
  articleSaveDraft.disabled = saving;
  articlePublish.disabled = saving;
  articleDelete.disabled = saving;

  articleSaveDraft.textContent =
    saving ? "SAVING..." : "SAVE DRAFT";

  articlePublish.textContent =
    saving ? "SAVING..." : "PUBLISH ARTICLE";
}


function normalizeUrl(value) {
  const cleanValue = value.trim();

  if (!cleanValue) {
    return null;
  }

  try {
    const url = new URL(cleanValue);

    if (
      url.protocol !== "http:" &&
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}


/* ==================================================
   SAFE MARKDOWN
   ================================================== */

function renderMarkdown(markdown = "") {
  const escaped = escapeHtml(markdown)
    .replace(/\r\n/g, "\n");

  const lines = escaped.split("\n");

  const renderedLines = lines.map((line) => {
    if (line.startsWith("### ")) {
      return `<h3>${line.slice(4)}</h3>`;
    }

    if (line.startsWith("## ")) {
      return `<h2>${line.slice(3)}</h2>`;
    }

    if (line.startsWith("# ")) {
      return `<h1>${line.slice(2)}</h1>`;
    }

    if (line.startsWith("> ")) {
      return `<blockquote>${line.slice(2)}</blockquote>`;
    }

    if (line.startsWith("- ")) {
      return `<li>${line.slice(2)}</li>`;
    }

    if (!line.trim()) {
      return "";
    }

    return `<p>${line}</p>`;
  });

  let html = renderedLines.join("\n");

  html = html.replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  );

  html = html.replace(
    /\*(.+?)\*/g,
    "<em>$1</em>"
  );

  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  html = html.replace(
    /(?:<li>.*?<\/li>\s*)+/gs,
    (listItems) => `<ul>${listItems}</ul>`
  );

  return html;
}


function refreshPreview() {
  const title =
    articleTitle.value.trim() ||
    "Untitled article";

  const subtitle =
    articleSubtitle.value.trim();

  const coverUrl =
    normalizeUrl(articleCoverUrl.value);

  const body =
    articleBody.value.trim();

  articlePreview.innerHTML = `
    ${
      coverUrl
        ? `
          <img
            class="article-cover-image"
            src="${escapeHtml(coverUrl)}"
            alt=""
          >
        `
        : ""
    }

    <header class="article-preview-title">
      <h1>${escapeHtml(title)}</h1>

      ${
        subtitle
          ? `<p>${escapeHtml(subtitle)}</p>`
          : ""
      }
    </header>

    <div>
      ${
        body
          ? renderMarkdown(body)
          : "<p>Your article body will appear here.</p>"
      }
    </div>
  `;
}


/* ==================================================
   GAMES
   ================================================== */

async function loadGames() {
  const { data, error } = await supabaseClient
    .from("games")
    .select("id, title, platform")
    .order("title", {
      ascending: true
    });

  if (error) {
    throw error;
  }

  (data || []).forEach((game) => {
    const option =
      document.createElement("option");

    option.value = game.id;

    option.textContent =
      `${game.title} — ${game.platform || "Xbox"}`;

    articleGame.append(option);
  });

  const gameIdFromUrl =
    new URLSearchParams(
      window.location.search
    ).get("game");

  if (gameIdFromUrl) {
    articleGame.value = gameIdFromUrl;
  }
}


/* ==================================================
   ARTICLE LOADING
   ================================================== */

async function loadExistingArticle(articleId) {
  const { data, error } = await supabaseClient
    .from("articles")
    .select(`
      id,
      author_id,
      game_id,
      title,
      subtitle,
      body,
      cover_url,
      status,
      published_at
    `)
    .eq("id", articleId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("That article could not be found.");
  }

  if (data.author_id !== loggedInUser.id) {
    throw new Error(
      "You do not have permission to edit this article."
    );
  }

  currentArticleId = data.id;
  currentArticleStatus = data.status;

  articleEditorTitle.textContent = "Edit article";
  articleEditorStatus.textContent =
    data.status.toUpperCase();

  articleEditorStatus.dataset.status =
    data.status;

  articleGame.value = data.game_id || "";
  articleTitle.value = data.title || "";
  articleSubtitle.value = data.subtitle || "";
  articleCoverUrl.value = data.cover_url || "";
  articleBody.value = data.body || "";

  articleDelete.hidden = false;

  refreshPreview();
}


/* ==================================================
   SAVE
   ================================================== */

function getArticleValues(status) {
  const title =
    articleTitle.value.trim();

  const subtitle =
    articleSubtitle.value.trim();

  const body =
    articleBody.value.trim();

  const coverInput =
    articleCoverUrl.value.trim();

  const coverUrl =
    normalizeUrl(coverInput);

  if (!title) {
    throw new Error("Add an article title.");
  }

  if (!body) {
    throw new Error("Write something in the article body.");
  }

  if (coverInput && !coverUrl) {
    throw new Error(
      "The cover image needs a valid HTTP or HTTPS URL."
    );
  }

  return {
    author_id: loggedInUser.id,
    game_id: articleGame.value || null,
    title,
    subtitle: subtitle || null,
    body,
    cover_url: coverUrl,
    status,

    published_at:
      status === "published"
        ? new Date().toISOString()
        : null
  };
}


async function saveArticle(status) {
  setSavingState(true);

  try {
    const values =
      getArticleValues(status);

    let savedArticle;

    if (currentArticleId) {
      /*
        Keep the original publication time when editing an
        already-published article.
      */

      if (
        currentArticleStatus === "published" &&
        status === "published"
      ) {
        delete values.published_at;
      }

      const { data, error } = await supabaseClient
        .from("articles")
        .update(values)
        .eq("id", currentArticleId)
        .eq("author_id", loggedInUser.id)
        .select("id, status")
        .single();

      if (error) {
        throw error;
      }

      savedArticle = data;
    } else {
      const { data, error } = await supabaseClient
        .from("articles")
        .insert(values)
        .select("id, status")
        .single();

      if (error) {
        throw error;
      }

      savedArticle = data;
      currentArticleId = data.id;

      articleDelete.hidden = false;
    }

    currentArticleStatus = savedArticle.status;

    articleEditorStatus.textContent =
      savedArticle.status.toUpperCase();

    articleEditorStatus.dataset.status =
      savedArticle.status;

    const url = new URL(window.location.href);

    url.searchParams.set(
      "id",
      savedArticle.id
    );

    url.searchParams.delete("game");

    history.replaceState({}, "", url);

    if (status === "published") {
      window.location.href =
        `article.html?id=${encodeURIComponent(
          savedArticle.id
        )}`;

      return;
    }

    showMessage("Draft saved.", "success");

    setTimeout(() => {
      articleEditorMessage.hidden = true;
    }, 2200);
  } catch (error) {
    console.error("Article save error:", error);

    showMessage(
      error.message || "The article could not be saved.",
      "error"
    );
  } finally {
    setSavingState(false);
  }
}


/* ==================================================
   DELETE
   ================================================== */

async function deleteArticle() {
  if (!currentArticleId) {
    return;
  }

  const confirmed = window.confirm(
    "Delete this article permanently? This cannot be undone."
  );

  if (!confirmed) {
    return;
  }

  setSavingState(true);

  try {
    const { error } = await supabaseClient
      .from("articles")
      .delete()
      .eq("id", currentArticleId)
      .eq("author_id", loggedInUser.id);

    if (error) {
      throw error;
    }

    window.location.href =
      `profile.html?id=${encodeURIComponent(
        loggedInUser.id
      )}`;
  } catch (error) {
    console.error("Article delete error:", error);

    showMessage(
      error.message || "The article could not be deleted.",
      "error"
    );
  } finally {
    setSavingState(false);
  }
}


/* ==================================================
   INITIALIZATION
   ================================================== */

async function initializeEditor() {
  try {
    const { data: sessionData, error: sessionError } =
      await supabaseClient.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    loggedInUser =
      sessionData.session?.user || null;

    if (!loggedInUser) {
      window.location.href =
        `login.html?return=${encodeURIComponent(
          window.location.pathname +
          window.location.search
        )}`;

      return;
    }

    const { data: profile, error: profileError } =
      await supabaseClient
        .from("profiles")
        .select("id, username, role")
        .eq("id", loggedInUser.id)
        .single();

    if (profileError) {
      throw profileError;
    }

    loggedInProfile = profile;

    if (
      !allowedArticleRoles.includes(
        String(profile.role || "").toLowerCase()
      )
    ) {
      throw new Error(
        "Your account does not have article publishing permission."
      );
    }

    await loadGames();

    const articleId =
      new URLSearchParams(
        window.location.search
      ).get("id");

    if (articleId) {
      await loadExistingArticle(articleId);
    } else {
      refreshPreview();
    }

    showEditor();
  } catch (error) {
    console.error("Article editor error:", error);

    showMessage(
      error.message || "The editor could not be loaded.",
      "error"
    );
  }
}


/* ==================================================
   EVENTS
   ================================================== */

articleForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    await saveArticle("published");
  }
);


articleSaveDraft.addEventListener(
  "click",
  async () => {
    await saveArticle("draft");
  }
);


articleDelete.addEventListener(
  "click",
  deleteArticle
);


articleRefreshPreview.addEventListener(
  "click",
  refreshPreview
);


articleTitle.addEventListener(
  "input",
  refreshPreview
);


articleSubtitle.addEventListener(
  "input",
  refreshPreview
);


if (typeof supabaseClient === "undefined") {
  showMessage(
    "Supabase did not load. Check js/supabase.js.",
    "error"
  );
} else {
  initializeEditor();
}