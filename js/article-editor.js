console.log("Previous Save article editor cover upload fix loaded");

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

const articleCoverFile =
  document.querySelector("#article-cover-file");

const articleImageSelection =
  document.querySelector("#article-image-selection");

const articleImageThumbnail =
  document.querySelector("#article-image-thumbnail");

const articleImageName =
  document.querySelector("#article-image-name");

const articleImageSize =
  document.querySelector("#article-image-size");

const articleRemoveImage =
  document.querySelector("#article-remove-image");

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

const ARTICLE_IMAGE_BUCKET = "article-images";
const MAX_ARTICLE_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_ARTICLE_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];

let loggedInUser = null;
let loggedInProfile = null;
let currentArticleId = null;
let currentArticleStatus = "draft";
let selectedCoverFile = null;
let selectedCoverObjectUrl = null;
let currentCoverUrl = "";
let removeCurrentCover = false;


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
  if (!articleEditorMessage) {
    return;
  }

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
  articleCoverFile.disabled = saving;

  articleSaveDraft.textContent =
    saving ? "SAVING..." : "SAVE DRAFT";

  articlePublish.textContent =
    saving ? "SAVING..." : "PUBLISH ARTICLE";
}


function normalizeUrl(value) {
  const cleanValue = String(value || "").trim();

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


function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function getCoverPreviewUrl() {
  if (selectedCoverObjectUrl) {
    return selectedCoverObjectUrl;
  }

  if (removeCurrentCover) {
    return "";
  }

  return currentCoverUrl || articleCoverUrl?.value || "";
}


function clearSelectedObjectUrl() {
  if (selectedCoverObjectUrl) {
    URL.revokeObjectURL(selectedCoverObjectUrl);
    selectedCoverObjectUrl = null;
  }
}


function showImageSelection({
  url,
  name = "Current cover image",
  size = ""
}) {
  if (!url) {
    articleImageSelection.hidden = true;
    articleImageThumbnail.removeAttribute("src");
    articleImageName.textContent = "Selected image";
    articleImageSize.textContent = "";
    return;
  }

  articleImageThumbnail.src = url;
  articleImageName.textContent = name;
  articleImageSize.textContent = size;
  articleImageSelection.hidden = false;
}


function validateCoverFile(file) {
  if (!ALLOWED_ARTICLE_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Choose a JPG, PNG, WEBP, or GIF image."
    );
  }

  if (file.size > MAX_ARTICLE_IMAGE_SIZE) {
    throw new Error(
      "The cover image must be 10 MB or smaller."
    );
  }
}


function sanitizeFileName(fileName) {
  const extension =
    fileName.includes(".")
      ? fileName.split(".").pop().toLowerCase()
      : "jpg";

  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "cover";

  return `${baseName}.${extension}`;
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
    getCoverPreviewUrl();

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
   COVER IMAGE
================================================== */

async function uploadSelectedCover() {
  if (!selectedCoverFile) {
    return removeCurrentCover
      ? null
      : (currentCoverUrl || null);
  }

  if (!loggedInUser) {
    throw new Error(
      "You must be logged in to upload a cover image."
    );
  }

  const safeFileName =
    sanitizeFileName(selectedCoverFile.name);

  const filePath =
    `${loggedInUser.id}/${Date.now()}-${safeFileName}`;

  showMessage("Uploading cover image...", "");

  const {
    error: uploadError
  } = await supabaseClient.storage
    .from(ARTICLE_IMAGE_BUCKET)
    .upload(filePath, selectedCoverFile, {
      cacheControl: "3600",
      upsert: false,
      contentType: selectedCoverFile.type
    });

  if (uploadError) {
    throw new Error(
      `Cover upload failed: ${uploadError.message}`
    );
  }

  const {
    data: publicUrlData
  } = supabaseClient.storage
    .from(ARTICLE_IMAGE_BUCKET)
    .getPublicUrl(filePath);

  const publicUrl =
    publicUrlData?.publicUrl || "";

  if (!publicUrl) {
    throw new Error(
      "The image uploaded, but its public URL could not be created."
    );
  }

  currentCoverUrl = publicUrl;
  removeCurrentCover = false;

  if (articleCoverUrl) {
    articleCoverUrl.value = publicUrl;
  }

  return publicUrl;
}


function handleCoverSelection() {
  const file =
    articleCoverFile.files?.[0];

  if (!file) {
    return;
  }

  try {
    validateCoverFile(file);

    clearSelectedObjectUrl();

    selectedCoverFile = file;
    selectedCoverObjectUrl =
      URL.createObjectURL(file);

    removeCurrentCover = false;

    showImageSelection({
      url: selectedCoverObjectUrl,
      name: file.name,
      size: formatFileSize(file.size)
    });

    refreshPreview();

    showMessage(
      "Cover selected. It will upload when you save or publish.",
      "success"
    );
  } catch (error) {
    articleCoverFile.value = "";
    selectedCoverFile = null;

    showMessage(
      error.message || "That image could not be used.",
      "error"
    );
  }
}


function removeCoverImage() {
  clearSelectedObjectUrl();

  selectedCoverFile = null;
  articleCoverFile.value = "";
  currentCoverUrl = "";
  removeCurrentCover = true;

  if (articleCoverUrl) {
    articleCoverUrl.value = "";
  }

  showImageSelection({
    url: ""
  });

  refreshPreview();

  showMessage(
    "Cover image removed. Save the article to keep this change.",
    "success"
  );
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
    throw new Error(
      "That article could not be found."
    );
  }

  if (data.author_id !== loggedInUser.id) {
    throw new Error(
      "You do not have permission to edit this article."
    );
  }

  currentArticleId = data.id;
  currentArticleStatus = data.status;
  currentCoverUrl = data.cover_url || "";
  removeCurrentCover = false;

  articleEditorTitle.textContent = "Edit article";
  articleEditorStatus.textContent =
    data.status.toUpperCase();

  articleEditorStatus.dataset.status =
    data.status;

  articleGame.value = data.game_id || "";
  articleTitle.value = data.title || "";
  articleSubtitle.value = data.subtitle || "";
  articleBody.value = data.body || "";

  if (articleCoverUrl) {
    articleCoverUrl.value = currentCoverUrl;
  }

  if (currentCoverUrl) {
    showImageSelection({
      url: currentCoverUrl,
      name: "Current cover image"
    });
  }

  articleDelete.hidden = false;

  refreshPreview();
}


/* ==================================================
   SAVE
================================================== */

function getArticleValues(status, coverUrl) {
  const title =
    articleTitle.value.trim();

  const subtitle =
    articleSubtitle.value.trim();

  const body =
    articleBody.value.trim();

  if (!title) {
    throw new Error(
      "Add an article title."
    );
  }

  if (!body) {
    throw new Error(
      "Write something in the article body."
    );
  }

  return {
    author_id: loggedInUser.id,
    game_id: articleGame.value || null,
    title,
    subtitle: subtitle || null,
    body,
    cover_url: coverUrl || null,
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
    const coverUrl =
      await uploadSelectedCover();

    const values =
      getArticleValues(status, coverUrl);

    let savedArticle;

    if (currentArticleId) {
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
        .select("id, status, cover_url")
        .single();

      if (error) {
        throw error;
      }

      savedArticle = data;
    } else {
      const { data, error } = await supabaseClient
        .from("articles")
        .insert(values)
        .select("id, status, cover_url")
        .single();

      if (error) {
        throw error;
      }

      savedArticle = data;
      currentArticleId = data.id;
      articleDelete.hidden = false;
    }

    currentArticleStatus = savedArticle.status;
    currentCoverUrl = savedArticle.cover_url || "";
    selectedCoverFile = null;
    clearSelectedObjectUrl();

    if (articleCoverUrl) {
      articleCoverUrl.value = currentCoverUrl;
    }

    if (currentCoverUrl) {
      showImageSelection({
        url: currentCoverUrl,
        name: "Current cover image"
      });
    } else {
      showImageSelection({
        url: ""
      });
    }

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

    showMessage(
      "Draft saved.",
      "success"
    );

    setTimeout(() => {
      articleEditorMessage.hidden = true;
    }, 2200);

  } catch (error) {
    console.error(
      "Article save error:",
      error
    );

    showMessage(
      error.message ||
        "The article could not be saved.",
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
    console.error(
      "Article delete error:",
      error
    );

    showMessage(
      error.message ||
        "The article could not be deleted.",
      "error"
    );
  } finally {
    setSavingState(false);
  }
}


/* ==================================================
   INITIALIZATION
================================================== */

function verifyEditorElements() {
  const requiredElements = {
    articleEditorMessage,
    articleEditorContent,
    articleEditorTitle,
    articleEditorStatus,
    articleForm,
    articleGame,
    articleTitle,
    articleSubtitle,
    articleCoverFile,
    articleImageSelection,
    articleImageThumbnail,
    articleImageName,
    articleImageSize,
    articleRemoveImage,
    articleBody,
    articleSaveDraft,
    articlePublish,
    articleDelete,
    articlePreview,
    articleRefreshPreview
  };

  const missing =
    Object.entries(requiredElements)
      .filter(([, element]) => !element)
      .map(([name]) => name);

  if (missing.length) {
    throw new Error(
      `The article editor is missing: ${missing.join(", ")}`
    );
  }
}


async function initializeEditor() {
  try {
    verifyEditorElements();

    const {
      data: sessionData,
      error: sessionError
    } = await supabaseClient.auth.getSession();

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

    const {
      data: profile,
      error: profileError
    } = await supabaseClient
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
    console.error(
      "Article editor error:",
      error
    );

    showMessage(
      error.message ||
        "The editor could not be loaded.",
      "error"
    );
  }
}


/* ==================================================
   EVENTS
================================================== */

articleForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    await saveArticle("published");
  }
);


articleSaveDraft?.addEventListener(
  "click",
  async () => {
    await saveArticle("draft");
  }
);


articleDelete?.addEventListener(
  "click",
  deleteArticle
);


articleRefreshPreview?.addEventListener(
  "click",
  refreshPreview
);


articleTitle?.addEventListener(
  "input",
  refreshPreview
);


articleSubtitle?.addEventListener(
  "input",
  refreshPreview
);


articleBody?.addEventListener(
  "input",
  refreshPreview
);


articleCoverFile?.addEventListener(
  "change",
  handleCoverSelection
);


articleRemoveImage?.addEventListener(
  "click",
  removeCoverImage
);


window.addEventListener(
  "beforeunload",
  clearSelectedObjectUrl
);


if (typeof supabaseClient === "undefined") {
  showMessage(
    "Supabase did not load. Check js/supabase.js.",
    "error"
  );
} else {
  initializeEditor();
}
