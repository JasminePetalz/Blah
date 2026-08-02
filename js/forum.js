console.log("Previous Save forum JavaScript loaded");

const forumState = {
  user: null,
  profile: null,
  isStaff: false,
  category: null,
  thread: null
};

const forumElements = {
  loading: document.querySelector("#forum-loading"),
  overviewView: document.querySelector("#forum-overview-view"),
  categoryView: document.querySelector("#forum-category-view"),
  threadView: document.querySelector("#forum-thread-view"),

  pageTitle: document.querySelector("#forum-page-title"),
  pageDescription: document.querySelector("#forum-page-description"),
  backButton: document.querySelector("#forum-back-button"),
  globalMessage: document.querySelector("#forum-global-message"),

  homeCreateButton: document.querySelector("#forum-home-create-button"),
  homeLoginButton: document.querySelector("#forum-home-login-button"),
  homeCreatePanel: document.querySelector("#forum-home-create-panel"),
  homeCreateForm: document.querySelector("#forum-home-create-form"),
  homeCategory: document.querySelector("#forum-home-category"),
  homeThreadTitle: document.querySelector("#forum-home-thread-title"),
  homeThreadBody: document.querySelector("#forum-home-thread-body"),
  homeCreateMessage: document.querySelector("#forum-home-create-message"),
  homeCancelCreate: document.querySelector("#forum-home-cancel-create"),

  searchForm: document.querySelector("#forum-search-form"),
  searchInput: document.querySelector("#forum-search-input"),
  searchResults: document.querySelector("#forum-search-results"),
  clearSearch: document.querySelector("#forum-clear-search"),

  categoryList: document.querySelector("#forum-category-list"),
  recentThreads: document.querySelector("#forum-recent-threads"),
  threadList: document.querySelector("#forum-thread-list"),

  showCreateButton: document.querySelector(
    "#forum-show-create-button"
  ),

  loginToPost: document.querySelector("#forum-login-to-post"),
  createPanel: document.querySelector("#forum-create-panel"),
  createForm: document.querySelector("#forum-create-form"),
  createTitle: document.querySelector("#forum-thread-title"),
  createBody: document.querySelector("#forum-thread-body"),
  createMessage: document.querySelector("#forum-create-message"),

  cancelCreateButton: document.querySelector(
    "#forum-cancel-create-button"
  ),

  mainPost: document.querySelector("#forum-main-post"),
  replyList: document.querySelector("#forum-reply-list"),
  replyCount: document.querySelector("#forum-reply-count"),
  replyPanel: document.querySelector("#forum-reply-panel"),
  replyForm: document.querySelector("#forum-reply-form"),
  replyBody: document.querySelector("#forum-reply-body"),
  replyMessage: document.querySelector("#forum-reply-message"),
  lockedMessage: document.querySelector("#forum-locked-message"),
  threadLogin: document.querySelector("#forum-thread-login")
};


function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatForumText(value = "") {
  return escapeHtml(value)
    .replaceAll("\r\n", "\n")
    .replaceAll("\n", "<br>");
}


function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}


function normalizeRole(role = "") {
  return String(role)
    .trim()
    .toLowerCase()
    .replaceAll("_", "-")
    .replace(/\s+/g, "-");
}


function roleIsStaff(role) {
  return [
    "co-creator",
    "co-creator-dev",
    "admin",
    "moderator"
  ].includes(normalizeRole(role));
}


function getRoleLabel(role) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "co-creator-dev") {
    return "CO-CREATOR · DEV";
  }

  if (normalizedRole === "co-creator") {
    return "CO-CREATOR";
  }

  if (normalizedRole === "admin") {
    return "ADMIN";
  }

  if (normalizedRole === "moderator") {
    return "MODERATOR";
  }

  return "";
}


function showForumMessage(element, message, type = "") {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = "forum-message";

  if (type) {
    element.classList.add(`forum-message-${type}`);
  }
}


function hideAllViews() {
  forumElements.overviewView.hidden = true;
  forumElements.categoryView.hidden = true;
  forumElements.threadView.hidden = true;
}


function showLoading(message = "Loading forum...") {
  forumElements.loading.textContent = message;
  forumElements.loading.hidden = false;
}


function hideLoading() {
  forumElements.loading.hidden = true;
}


async function loadCurrentForumUser() {
  try {
    const {
      data: { session },
      error: sessionError
    } = await supabaseClient.auth.getSession();

    if (sessionError) {
      console.error("Forum session error:", sessionError);
    }

    const user = session?.user || null;

    if (!user) {
      forumState.user = null;
      forumState.profile = null;
      forumState.isStaff = false;
      return;
    }

    forumState.user = user;

    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .select("id,username,avatar_url,role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Forum profile error:", profileError);

      forumState.profile = null;
      forumState.isStaff = false;
      return;
    }

    forumState.profile = profile || null;
    forumState.isStaff = roleIsStaff(profile?.role);

  } catch (error) {
    console.error("Unexpected forum user error:", error);

    forumState.user = null;
    forumState.profile = null;
    forumState.isStaff = false;
  }
}


async function getProfilesByIds(ids) {
  const uniqueIds = [
    ...new Set(
      ids.filter(Boolean)
    )
  ];

  if (!uniqueIds.length) {
    return new Map();
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("profiles")
    .select("id,username,avatar_url,role")
    .in("id", uniqueIds);

  if (error) {
    console.error("Forum author lookup error:", error);
    return new Map();
  }

  return new Map(
    (data || []).map((profile) => [
      profile.id,
      profile
    ])
  );
}


function renderAuthor(profile) {
  const username = profile?.username || "Deleted user";
  const avatarUrl = profile?.avatar_url || "images/avatar.png";
  const roleLabel = getRoleLabel(profile?.role);

  const profileUrl = profile?.id
    ? `profile.html?id=${encodeURIComponent(profile.id)}`
    : "#";

  return `
    <a class="forum-author" href="${profileUrl}">
      <img
        src="${escapeHtml(avatarUrl)}"
        alt="${escapeHtml(username)} avatar"
        onerror="this.onerror=null;this.src='images/avatar.png';"
      >

      <span>
        <strong>${escapeHtml(username)}</strong>

        ${
          roleLabel
            ? `<em>${escapeHtml(roleLabel)}</em>`
            : ""
        }
      </span>
    </a>
  `;
}


function renderThreadRow(thread, author, category = null) {
  return `
    <article class="forum-thread-row">

      <div class="forum-thread-status">
        ${
          thread.is_pinned
            ? '<span class="forum-status-badge">PINNED</span>'
            : ""
        }

        ${
          thread.is_locked
            ? '<span class="forum-status-badge forum-status-locked">LOCKED</span>'
            : ""
        }
      </div>

      <div class="forum-thread-summary">

        <h3>
          <a href="forum.html?thread=${encodeURIComponent(thread.id)}">
            ${escapeHtml(thread.title)}
          </a>
        </h3>

        <p>
          by
          <a href="profile.html?id=${encodeURIComponent(thread.author_id)}">
            ${escapeHtml(author?.username || "Deleted user")}
          </a>

          ${
            category
              ? `
                in
                <a href="forum.html?category=${encodeURIComponent(
                  category.slug
                )}">
                  ${escapeHtml(category.name)}
                </a>
              `
              : ""
          }

          · ${escapeHtml(formatDate(thread.created_at))}
        </p>

      </div>

      <a
        class="forum-open-thread"
        href="forum.html?thread=${encodeURIComponent(thread.id)}"
      >
        OPEN
      </a>

    </article>
  `;
}


async function loadForumOverview() {
  hideAllViews();
  showLoading();

  forumElements.pageTitle.textContent =
    "Previous Save Forum";

  forumElements.pageDescription.textContent =
    "Talk about games, collecting, achievements, preservation, and the Xbox 360 era.";

  forumElements.backButton.hidden = true;

  const {
    data: categories,
    error: categoryError
  } = await supabaseClient
    .from("forum_categories")
    .select("id,slug,name,description,sort_order")
    .order("sort_order", {
      ascending: true
    });

  if (categoryError) {
    throw categoryError;
  }

  if (forumElements.homeCategory) {
    forumElements.homeCategory.innerHTML = `
      <option value="">Choose a category</option>
      ${(categories || []).map((category) => `
        <option value="${category.id}">${escapeHtml(category.name)}</option>
      `).join("")}
    `;
  }

  const {
    data: threads,
    error: threadError
  } = await supabaseClient
    .from("forum_threads")
    .select(
      "id,category_id,author_id,title,body,is_pinned,is_locked,created_at"
    )
    .order("created_at", {
      ascending: false
    });

  if (threadError) {
    throw threadError;
  }

  const categoryMap = new Map(
    (categories || []).map((category) => [
      category.id,
      category
    ])
  );

  const threadCounts = new Map();

  for (const thread of threads || []) {
    const currentCount =
      threadCounts.get(thread.category_id) || 0;

    threadCounts.set(
      thread.category_id,
      currentCount + 1
    );
  }

  forumElements.categoryList.innerHTML =
    (categories || []).map((category) => {
      const threadCount =
        threadCounts.get(category.id) || 0;

      return `
        <a
          class="forum-category-card"
          href="forum.html?category=${encodeURIComponent(category.slug)}"
        >
          <div>
            <h2>${escapeHtml(category.name)}</h2>
            <p>${escapeHtml(category.description)}</p>
          </div>

          <span>
            ${threadCount}
            ${threadCount === 1 ? "thread" : "threads"}
          </span>
        </a>
      `;
    }).join("");

  const recentThreads = (threads || []).slice(0, 8);

  if (!recentThreads.length) {
    forumElements.recentThreads.innerHTML =
      '<p class="forum-empty">No threads have been posted yet.</p>';
  } else {
    const authorMap = await getProfilesByIds(
      recentThreads.map((thread) => thread.author_id)
    );

    forumElements.recentThreads.innerHTML =
      recentThreads.map((thread) => {
        return renderThreadRow(
          thread,
          authorMap.get(thread.author_id),
          categoryMap.get(thread.category_id)
        );
      }).join("");
  }

  if (forumState.user) {
    forumElements.homeCreateButton.hidden = false;
    forumElements.homeLoginButton.hidden = true;
  } else {
    forumElements.homeCreateButton.hidden = true;
    forumElements.homeLoginButton.hidden = false;
  }

  forumElements.homeCreatePanel.hidden = true;

  hideLoading();
  forumElements.overviewView.hidden = false;
}


async function loadForumCategory(categorySlug) {
  hideAllViews();
  showLoading();

  const {
    data: category,
    error: categoryError
  } = await supabaseClient
    .from("forum_categories")
    .select("id,slug,name,description")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (categoryError) {
    throw categoryError;
  }

  if (!category) {
    throw new Error(
      "That forum category could not be found."
    );
  }

  forumState.category = category;

  forumElements.pageTitle.textContent = category.name;
  forumElements.pageDescription.textContent =
    category.description;

  forumElements.backButton.hidden = false;
  forumElements.backButton.href = "forum.html";
  forumElements.backButton.textContent = "← FORUM HOME";

  forumElements.createPanel.hidden = true;

  if (forumState.user) {
    forumElements.showCreateButton.hidden = false;
    forumElements.loginToPost.hidden = true;
  } else {
    forumElements.showCreateButton.hidden = true;
    forumElements.loginToPost.hidden = false;
  }

  const {
    data: threads,
    error: threadError
  } = await supabaseClient
    .from("forum_threads")
    .select(
      "id,category_id,author_id,title,is_pinned,is_locked,created_at"
    )
    .eq("category_id", category.id)
    .order("is_pinned", {
      ascending: false
    })
    .order("created_at", {
      ascending: false
    });

  if (threadError) {
    throw threadError;
  }

  if (!threads?.length) {
    forumElements.threadList.innerHTML =
      '<p class="forum-empty">No threads have been posted in this category yet.</p>';
  } else {
    const authorMap = await getProfilesByIds(
      threads.map((thread) => thread.author_id)
    );

    forumElements.threadList.innerHTML =
      threads.map((thread) => {
        return renderThreadRow(
          thread,
          authorMap.get(thread.author_id)
        );
      }).join("");
  }

  hideLoading();
  forumElements.categoryView.hidden = false;
}


function renderPostActions({
  type,
  id,
  authorId,
  isPinned = false,
  isLocked = false
}) {
  const isOwner =
    forumState.user?.id === authorId;

  if (!isOwner && !forumState.isStaff) {
    return "";
  }

  return `
    <div class="forum-post-actions">

      <button
        type="button"
        data-forum-action="edit-${type}"
        data-id="${escapeHtml(id)}"
      >
        EDIT
      </button>

      <button
        type="button"
        data-forum-action="delete-${type}"
        data-id="${escapeHtml(id)}"
      >
        DELETE
      </button>

      ${
        type === "thread" && forumState.isStaff
          ? `
            <button
              type="button"
              data-forum-action="toggle-pin"
              data-id="${escapeHtml(id)}"
            >
              ${isPinned ? "UNPIN" : "PIN"}
            </button>

            <button
              type="button"
              data-forum-action="toggle-lock"
              data-id="${escapeHtml(id)}"
            >
              ${isLocked ? "UNLOCK" : "LOCK"}
            </button>
          `
          : ""
      }

    </div>
  `;
}


async function loadForumThread(threadId) {
  hideAllViews();
  showLoading();

  const {
    data: thread,
    error: threadError
  } = await supabaseClient
    .from("forum_threads")
    .select(
      "id,category_id,author_id,title,body,is_pinned,is_locked,created_at,updated_at"
    )
    .eq("id", threadId)
    .maybeSingle();

  if (threadError) {
    throw threadError;
  }

  if (!thread) {
    throw new Error(
      "That forum thread could not be found."
    );
  }

  const {
    data: category,
    error: categoryError
  } = await supabaseClient
    .from("forum_categories")
    .select("id,slug,name,description")
    .eq("id", thread.category_id)
    .maybeSingle();

  if (categoryError) {
    console.error(
      "Forum thread category error:",
      categoryError
    );
  }

  const {
    data: replies,
    error: repliesError
  } = await supabaseClient
    .from("forum_replies")
    .select(
      "id,thread_id,author_id,body,created_at,updated_at"
    )
    .eq("thread_id", thread.id)
    .order("created_at", {
      ascending: true
    });

  if (repliesError) {
    throw repliesError;
  }

  forumState.thread = thread;
  forumState.category = category || null;

  const authorIds = [
    thread.author_id,
    ...(replies || []).map(
      (reply) => reply.author_id
    )
  ];

  const authorMap =
    await getProfilesByIds(authorIds);

  const threadAuthor =
    authorMap.get(thread.author_id);

  forumElements.pageTitle.textContent =
    thread.title;

  forumElements.pageDescription.textContent =
    category?.name || "Forum thread";

  forumElements.backButton.hidden = false;

  forumElements.backButton.href = category
    ? `forum.html?category=${encodeURIComponent(category.slug)}`
    : "forum.html";

  forumElements.backButton.textContent = category
    ? `← ${category.name.toUpperCase()}`
    : "← FORUM HOME";

  forumElements.mainPost.innerHTML = `
    <div class="forum-post-author-column">
      ${renderAuthor(threadAuthor)}
    </div>

    <div class="forum-post-content">

      <div class="forum-post-header">

        <div>
          ${
            thread.is_pinned
              ? '<span class="forum-status-badge">PINNED</span>'
              : ""
          }

          ${
            thread.is_locked
              ? '<span class="forum-status-badge forum-status-locked">LOCKED</span>'
              : ""
          }
        </div>

        <time>
          ${escapeHtml(formatDate(thread.created_at))}
        </time>

      </div>

      <div class="forum-post-body">
        ${formatForumText(thread.body)}
      </div>

      ${renderPostActions({
        type: "thread",
        id: thread.id,
        authorId: thread.author_id,
        isPinned: thread.is_pinned,
        isLocked: thread.is_locked
      })}

    </div>
  `;

  const replyTotal = replies?.length || 0;

  forumElements.replyCount.textContent =
    `${replyTotal} ${replyTotal === 1 ? "reply" : "replies"}`;

  if (!replyTotal) {
    forumElements.replyList.innerHTML =
      '<p class="forum-empty">No replies yet. Be the first to respond.</p>';
  } else {
    forumElements.replyList.innerHTML =
      replies.map((reply) => {
        const replyAuthor =
          authorMap.get(reply.author_id);

        return `
          <article class="forum-post forum-reply">

            <div class="forum-post-author-column">
              ${renderAuthor(replyAuthor)}
            </div>

            <div class="forum-post-content">

              <div class="forum-post-header">
                <span>REPLY</span>

                <time>
                  ${escapeHtml(formatDate(reply.created_at))}
                </time>
              </div>

              <div class="forum-post-body">
                ${formatForumText(reply.body)}
              </div>

              ${renderPostActions({
                type: "reply",
                id: reply.id,
                authorId: reply.author_id
              })}

            </div>

          </article>
        `;
      }).join("");
  }

  forumElements.replyPanel.hidden = true;
  forumElements.lockedMessage.hidden = true;
  forumElements.threadLogin.hidden = true;

  if (thread.is_locked) {
    forumElements.lockedMessage.hidden = false;

    if (forumState.user && forumState.isStaff) {
      forumElements.replyPanel.hidden = false;
    }

  } else if (forumState.user) {
    forumElements.replyPanel.hidden = false;

  } else {
    forumElements.threadLogin.hidden = false;
  }

  hideLoading();
  forumElements.threadView.hidden = false;
}


forumElements.showCreateButton?.addEventListener(
  "click",
  () => {
    forumElements.createPanel.hidden =
      !forumElements.createPanel.hidden;

    if (!forumElements.createPanel.hidden) {
      forumElements.createTitle.focus();
    }
  }
);


forumElements.cancelCreateButton?.addEventListener(
  "click",
  () => {
    forumElements.createPanel.hidden = true;
    forumElements.createForm.reset();

    showForumMessage(
      forumElements.createMessage,
      ""
    );
  }
);


forumElements.createForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!forumState.user || !forumState.category) {
      showForumMessage(
        forumElements.createMessage,
        "You must be logged in to create a thread.",
        "error"
      );

      return;
    }

    const title =
      forumElements.createTitle.value.trim();

    const body =
      forumElements.createBody.value.trim();

    if (title.length < 3) {
      showForumMessage(
        forumElements.createMessage,
        "Your thread title must contain at least 3 characters.",
        "error"
      );

      return;
    }

    if (!body) {
      showForumMessage(
        forumElements.createMessage,
        "Please write something before posting.",
        "error"
      );

      return;
    }

    const submitButton =
      forumElements.createForm.querySelector(
        'button[type="submit"]'
      );

    submitButton.disabled = true;
    submitButton.textContent = "POSTING...";

    const {
      data,
      error
    } = await supabaseClient
      .from("forum_threads")
      .insert({
        category_id: forumState.category.id,
        author_id: forumState.user.id,
        title,
        body
      })
      .select("id")
      .single();

    if (error) {
      console.error("Create thread error:", error);

      showForumMessage(
        forumElements.createMessage,
        error.message ||
          "Your thread could not be posted.",
        "error"
      );

      submitButton.disabled = false;
      submitButton.textContent = "POST THREAD";
      return;
    }

    window.location.href =
      `forum.html?thread=${encodeURIComponent(data.id)}`;
  }
);


forumElements.replyForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!forumState.user || !forumState.thread) {
      showForumMessage(
        forumElements.replyMessage,
        "You must be logged in to reply.",
        "error"
      );

      return;
    }

    const body =
      forumElements.replyBody.value.trim();

    if (!body) {
      showForumMessage(
        forumElements.replyMessage,
        "Please write a reply first.",
        "error"
      );

      return;
    }

    const submitButton =
      forumElements.replyForm.querySelector(
        'button[type="submit"]'
      );

    submitButton.disabled = true;
    submitButton.textContent = "POSTING...";

    const {
      error
    } = await supabaseClient
      .from("forum_replies")
      .insert({
        thread_id: forumState.thread.id,
        author_id: forumState.user.id,
        body
      });

    if (error) {
      console.error("Create reply error:", error);

      showForumMessage(
        forumElements.replyMessage,
        error.message ||
          "Your reply could not be posted.",
        "error"
      );

      submitButton.disabled = false;
      submitButton.textContent = "POST REPLY";
      return;
    }

    window.location.reload();
  }
);


document.addEventListener(
  "click",
  async (event) => {
    const button = event.target.closest(
      "[data-forum-action]"
    );

    if (!button) {
      return;
    }

    const action =
      button.dataset.forumAction;

    const id =
      button.dataset.id;

    button.disabled = true;

    try {
      if (action === "edit-thread") {
        const newTitle = window.prompt(
          "Edit the thread title:",
          forumState.thread?.title || ""
        );

        if (newTitle === null) {
          button.disabled = false;
          return;
        }

        const newBody = window.prompt(
          "Edit the thread post:",
          forumState.thread?.body || ""
        );

        if (newBody === null) {
          button.disabled = false;
          return;
        }

        const {
          error
        } = await supabaseClient
          .from("forum_threads")
          .update({
            title: newTitle.trim(),
            body: newBody.trim()
          })
          .eq("id", id);

        if (error) {
          throw error;
        }

        window.location.reload();
        return;
      }


      if (action === "delete-thread") {
        const confirmed = window.confirm(
          "Delete this entire thread and all of its replies?"
        );

        if (!confirmed) {
          button.disabled = false;
          return;
        }

        const {
          error
        } = await supabaseClient
          .from("forum_threads")
          .delete()
          .eq("id", id);

        if (error) {
          throw error;
        }

        window.location.href =
          forumState.category
            ? `forum.html?category=${encodeURIComponent(
                forumState.category.slug
              )}`
            : "forum.html";

        return;
      }


      if (action === "edit-reply") {
        const replyElement =
          button.closest(".forum-reply");

        const bodyElement =
          replyElement?.querySelector(
            ".forum-post-body"
          );

        const currentBody =
          bodyElement?.innerText || "";

        const newBody = window.prompt(
          "Edit your reply:",
          currentBody
        );

        if (newBody === null) {
          button.disabled = false;
          return;
        }

        const {
          error
        } = await supabaseClient
          .from("forum_replies")
          .update({
            body: newBody.trim()
          })
          .eq("id", id);

        if (error) {
          throw error;
        }

        window.location.reload();
        return;
      }


      if (action === "delete-reply") {
        const confirmed =
          window.confirm("Delete this reply?");

        if (!confirmed) {
          button.disabled = false;
          return;
        }

        const {
          error
        } = await supabaseClient
          .from("forum_replies")
          .delete()
          .eq("id", id);

        if (error) {
          throw error;
        }

        window.location.reload();
        return;
      }


      if (action === "toggle-pin") {
        const {
          error
        } = await supabaseClient
          .from("forum_threads")
          .update({
            is_pinned:
              !forumState.thread.is_pinned
          })
          .eq("id", id);

        if (error) {
          throw error;
        }

        window.location.reload();
        return;
      }


      if (action === "toggle-lock") {
        const {
          error
        } = await supabaseClient
          .from("forum_threads")
          .update({
            is_locked:
              !forumState.thread.is_locked
          })
          .eq("id", id);

        if (error) {
          throw error;
        }

        window.location.reload();
      }

    } catch (error) {
      console.error("Forum action error:", error);

      showForumMessage(
        forumElements.globalMessage,
        error.message ||
          "That forum action could not be completed.",
        "error"
      );

      button.disabled = false;
    }
  }
);



forumElements.homeCreateButton?.addEventListener("click", () => {
  forumElements.homeCreatePanel.hidden =
    !forumElements.homeCreatePanel.hidden;

  if (!forumElements.homeCreatePanel.hidden) {
    forumElements.homeCategory.focus();
  }
});


forumElements.homeCancelCreate?.addEventListener("click", () => {
  forumElements.homeCreatePanel.hidden = true;
  forumElements.homeCreateForm.reset();
  showForumMessage(forumElements.homeCreateMessage, "");
});


forumElements.homeCreateForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!forumState.user) {
    window.location.href = "login.html";
    return;
  }

  const categoryId = Number(forumElements.homeCategory.value);
  const title = forumElements.homeThreadTitle.value.trim();
  const body = forumElements.homeThreadBody.value.trim();

  if (!categoryId) {
    showForumMessage(
      forumElements.homeCreateMessage,
      "Please choose a forum category.",
      "error"
    );
    return;
  }

  if (title.length < 3) {
    showForumMessage(
      forumElements.homeCreateMessage,
      "Your title must contain at least 3 characters.",
      "error"
    );
    return;
  }

  if (!body) {
    showForumMessage(
      forumElements.homeCreateMessage,
      "Please write something before posting.",
      "error"
    );
    return;
  }

  const submitButton = forumElements.homeCreateForm.querySelector(
    'button[type="submit"]'
  );

  submitButton.disabled = true;
  submitButton.textContent = "POSTING...";

  const { data, error } = await supabaseClient
    .from("forum_threads")
    .insert({
      category_id: categoryId,
      author_id: forumState.user.id,
      title,
      body
    })
    .select("id")
    .single();

  if (error) {
    console.error("Homepage forum thread error:", error);
    showForumMessage(
      forumElements.homeCreateMessage,
      error.message || "Your thread could not be posted.",
      "error"
    );
    submitButton.disabled = false;
    submitButton.textContent = "POST THREAD";
    return;
  }

  window.location.href = `forum.html?thread=${encodeURIComponent(data.id)}`;
});


async function searchForum(searchTerm) {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    forumElements.searchResults.hidden = true;
    forumElements.searchResults.innerHTML = "";
    forumElements.clearSearch.hidden = true;
    return;
  }

  forumElements.searchResults.hidden = false;
  forumElements.clearSearch.hidden = false;
  forumElements.searchResults.innerHTML =
    '<p class="forum-empty">Searching...</p>';

  const { data: threads, error } = await supabaseClient
    .from("forum_threads")
    .select("id,category_id,author_id,title,body,is_pinned,is_locked,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Forum search error:", error);
    forumElements.searchResults.innerHTML =
      '<p class="forum-empty">The forum could not be searched.</p>';
    return;
  }

  const matches = (threads || []).filter((thread) => {
    const searchableText = `${thread.title || ""} ${thread.body || ""}`.toLowerCase();
    return searchableText.includes(query);
  });

  if (!matches.length) {
    forumElements.searchResults.innerHTML = `
      <p class="forum-empty">No forum threads matched “${escapeHtml(searchTerm)}”.</p>
    `;
    return;
  }

  const [{ data: categories }, authorMap] = await Promise.all([
    supabaseClient
      .from("forum_categories")
      .select("id,slug,name"),
    getProfilesByIds(matches.map((thread) => thread.author_id))
  ]);

  const categoryMap = new Map(
    (categories || []).map((category) => [category.id, category])
  );

  forumElements.searchResults.innerHTML = `
    <div class="forum-search-heading">
      ${matches.length} ${matches.length === 1 ? "RESULT" : "RESULTS"}
    </div>
    ${matches.map((thread) => renderThreadRow(
      thread,
      authorMap.get(thread.author_id),
      categoryMap.get(thread.category_id)
    )).join("")}
  `;
}


forumElements.searchForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await searchForum(forumElements.searchInput.value);
});


forumElements.clearSearch?.addEventListener("click", () => {
  forumElements.searchInput.value = "";
  forumElements.searchResults.innerHTML = "";
  forumElements.searchResults.hidden = true;
  forumElements.clearSearch.hidden = true;
  forumElements.searchInput.focus();
});


async function initializeForum() {
  hideAllViews();
  showLoading();

  try {
    if (
      typeof supabaseClient === "undefined"
    ) {
      throw new Error(
        "Supabase did not load. Check js/supabase.js."
      );
    }

    await loadCurrentForumUser();

    const params = new URLSearchParams(
      window.location.search
    );

    const threadId = params.get("thread");
    const categorySlug = params.get("category");

    if (threadId) {
      await loadForumThread(threadId);
      return;
    }

    if (categorySlug) {
      await loadForumCategory(categorySlug);
      return;
    }

    await loadForumOverview();

  } catch (error) {
    console.error(
      "Forum initialization error:",
      error
    );

    hideLoading();
    hideAllViews();

    showForumMessage(
      forumElements.globalMessage,
      error.message ||
        "The forum could not be loaded.",
      "error"
    );
  }
}


initializeForum();