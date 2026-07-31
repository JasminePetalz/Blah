const articleMessage =
  document.querySelector("#article-message");

const articleContent =
  document.querySelector("#article-content");

const articleCover =
  document.querySelector("#article-cover");

const articleGameLabel =
  document.querySelector("#article-game-label");

const articleDate =
  document.querySelector("#article-date");

const articleTitle =
  document.querySelector("#article-title");

const articleSubtitle =
  document.querySelector("#article-subtitle");

const articleAuthorLink =
  document.querySelector("#article-author-link");

const articleAuthorAvatar =
  document.querySelector("#article-author-avatar");

const articleAuthorName =
  document.querySelector("#article-author-name");

const articleEditLink =
  document.querySelector("#article-edit-link");

const articleBody =
  document.querySelector("#article-body");

const articleGameLink =
  document.querySelector("#article-game-link");


function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


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
    (items) => `<ul>${items}</ul>`
  );

  return html;
}


function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}


function showError(message) {
  articleMessage.hidden = false;
  articleMessage.textContent = message;
  articleMessage.dataset.status = "error";
}


async function loadArticle() {
  const articleId =
    new URLSearchParams(
      window.location.search
    ).get("id");

  if (!articleId) {
    showError("No article was selected.");
    return;
  }

  try {
    const { data: sessionData } =
      await supabaseClient.auth.getSession();

    const loggedInUser =
      sessionData.session?.user || null;

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
        created_at,
        updated_at,
        published_at,

        author:profiles!articles_author_id_fkey (
          id,
          username,
          avatar_url,
          role
        ),

        game:games!articles_game_id_fkey (
          id,
          title,
          platform
        )
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

    const author =
      Array.isArray(data.author)
        ? data.author[0]
        : data.author;

    const game =
      Array.isArray(data.game)
        ? data.game[0]
        : data.game;

    document.title =
      `${data.title} | 360 Archive`;

    articleTitle.textContent =
      data.title;

    if (data.subtitle) {
      articleSubtitle.textContent =
        data.subtitle;

      articleSubtitle.hidden = false;
    }

    articleDate.textContent =
      formatDate(
        data.published_at ||
        data.created_at
      );

    articleBody.innerHTML =
      renderMarkdown(data.body);

    if (data.cover_url) {
      articleCover.src =
        data.cover_url;

      articleCover.alt =
        `${data.title} cover`;

      articleCover.hidden = false;
    }

    if (author) {
      articleAuthorName.textContent =
        author.username || "user";

      articleAuthorAvatar.src =
        author.avatar_url ||
        "images/avatar.png";

      articleAuthorAvatar.alt =
        `${author.username || "user"} avatar`;

      articleAuthorLink.href =
        `profile.html?id=${encodeURIComponent(
          author.id
        )}`;
    }

    if (game) {
      articleGameLabel.textContent =
        game.title;

      articleGameLink.href =
        `game.html?id=${encodeURIComponent(
          game.id
        )}`;

      articleGameLink.hidden = false;
    }

    if (
      loggedInUser?.id ===
      data.author_id
    ) {
      articleEditLink.href =
        `article-editor.html?id=${encodeURIComponent(
          data.id
        )}`;

      articleEditLink.hidden = false;
    }

    articleMessage.hidden = true;
    articleContent.hidden = false;
  } catch (error) {
    console.error("Article loading error:", error);

    showError(
      error.message ||
      "The article could not be loaded."
    );
  }
}


if (typeof supabaseClient === "undefined") {
  showError(
    "Supabase did not load. Check js/supabase.js."
  );
} else {
  loadArticle();
}