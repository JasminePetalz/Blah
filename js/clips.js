const clipLoginMessage =
  document.querySelector(
    "#clip-login-message"
  );

const showClipFormButton =
  document.querySelector(
    "#show-clip-form-button"
  );

const clipForm =
  document.querySelector(
    "#clip-form"
  );

const clipTitle =
  document.querySelector(
    "#clip-title"
  );

const clipYoutubeUrl =
  document.querySelector(
    "#clip-youtube-url"
  );

const clipDescription =
  document.querySelector(
    "#clip-description"
  );

const cancelClipButton =
  document.querySelector(
    "#cancel-clip-button"
  );

const clipFormMessage =
  document.querySelector(
    "#clip-form-message"
  );

const clipList =
  document.querySelector(
    "#game-clip-list"
  );


let clipUser =
  null;

let clipGameId =
  null;


/* ==================================================
   HELPERS
   ================================================== */

function escapeClipHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getYouTubeVideoId(urlValue) {
  try {
    const url =
      new URL(urlValue);


    const hostname =
      url.hostname
        .replace("www.", "")
        .toLowerCase();


    if (
      hostname === "youtu.be"
    ) {
      return (
        url.pathname
          .slice(1)
          .split("/")[0] ||
        null
      );
    }


    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      if (
        url.pathname === "/watch"
      ) {
        return (
          url.searchParams
            .get("v") ||
          null
        );
      }


      const pathParts =
        url.pathname
          .split("/")
          .filter(Boolean);


      if (
        [
          "shorts",
          "embed",
          "live"
        ].includes(pathParts[0])
      ) {
        return (
          pathParts[1] ||
          null
        );
      }
    }


    return null;

  } catch {
    return null;
  }
}


function formatClipDate(value) {
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


/* ==================================================
   DISPLAY CLIPS
   ================================================== */

function renderClips(clips) {
  clipList.innerHTML =
    "";


  if (!clips.length) {
    clipList.innerHTML = `
      <p class="empty-message">
        No clips have been posted yet.
      </p>
    `;


    return;
  }


  clips.forEach(
    (clip) => {
      const card =
        document.createElement(
          "article"
        );


      card.className =
        "game-clip-card";


      const username =
        clip.profile?.username ||
        "user";


      const isOwner =
        clipUser &&
        clip.user_id ===
          clipUser.id;


      card.innerHTML = `
        <div class="game-clip-video">

          <iframe
            src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(
              clip.youtube_video_id
            )}"
            title="${escapeClipHtml(clip.title)}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>

        </div>

        <div class="game-clip-info">

          <h3>
            ${escapeClipHtml(clip.title)}
          </h3>

          <span>
            posted by
            ${escapeClipHtml(username)}
            ·
            ${escapeClipHtml(
              formatClipDate(
                clip.created_at
              )
            )}
          </span>

          ${
            clip.description
              ? `
                  <p>
                    ${escapeClipHtml(
                      clip.description
                    )}
                  </p>
                `
              : ""
          }

          <div class="game-clip-actions">

            <a
              href="${escapeClipHtml(clip.youtube_url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              WATCH ON YOUTUBE
            </a>

            ${
              isOwner
                ? `
                    <button
                      type="button"
                      class="delete-clip-button"
                      data-clip-id="${escapeClipHtml(clip.id)}"
                    >
                      DELETE
                    </button>
                  `
                : ""
            }

          </div>

        </div>
      `;


      clipList.append(card);
    }
  );


  const deleteButtons =
    clipList.querySelectorAll(
      ".delete-clip-button"
    );


  deleteButtons.forEach(
    (button) => {
      button.addEventListener(
        "click",
        () => {
          deleteClip(
            button.dataset.clipId,
            button
          );
        }
      );
    }
  );
}


/* ==================================================
   LOAD CLIPS
   ================================================== */

async function loadClips() {
  if (!clipGameId) {
    return;
  }


  const {
    data: clips,
    error
  } = await supabaseClient
    .from("clips")
    .select(`
      id,
      user_id,
      game_id,
      title,
      description,
      youtube_url,
      youtube_video_id,
      created_at,
      updated_at,
      profile:profiles (
        username,
        avatar_url
      )
    `)
    .eq(
      "game_id",
      clipGameId
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {
    console.error(
      "Clip loading error:",
      error
    );


    clipList.innerHTML = `
      <p class="empty-message">
        Clips could not be loaded.
      </p>
    `;


    return;
  }


  renderClips(
    clips || []
  );
}


/* ==================================================
   SAVE CLIP
   ================================================== */

async function saveClip(event) {
  event.preventDefault();


  if (!clipUser) {
    window.location.href =
      "login.html";


    return;
  }


  const title =
    clipTitle
      .value
      .trim();


  const youtubeUrl =
    clipYoutubeUrl
      .value
      .trim();


  const description =
    clipDescription
      .value
      .trim();


  const videoId =
    getYouTubeVideoId(
      youtubeUrl
    );


  if (!title) {
    clipFormMessage.textContent =
      "Enter a clip title.";


    return;
  }


  if (!videoId) {
    clipFormMessage.textContent =
      "Enter a valid YouTube link.";


    return;
  }


  const submitButton =
    clipForm.querySelector(
      'button[type="submit"]'
    );


  submitButton.disabled =
    true;


  clipFormMessage.textContent =
    "Posting clip...";


  const {
    error
  } = await supabaseClient
    .from("clips")
    .insert({
      user_id:
        clipUser.id,

      game_id:
        Number(clipGameId),

      title,

      description:
        description ||
        null,

      youtube_url:
        youtubeUrl,

      youtube_video_id:
        videoId
    });


  submitButton.disabled =
    false;


  if (error) {
    console.error(
      "Clip saving error:",
      error
    );


    clipFormMessage.textContent =
      "The clip could not be posted.";


    return;
  }


  clipForm.reset();


  clipForm.hidden =
    true;


  showClipFormButton.hidden =
    false;


  clipFormMessage.textContent =
    "";


  await loadClips();
}


/* ==================================================
   DELETE CLIP
   ================================================== */

async function deleteClip(
  clipId,
  button
) {
  if (!clipUser) {
    return;
  }


  const confirmed =
    window.confirm(
      "Delete this clip?"
    );


  if (!confirmed) {
    return;
  }


  button.disabled =
    true;


  button.textContent =
    "DELETING...";


  const {
    error
  } = await supabaseClient
    .from("clips")
    .delete()
    .eq(
      "id",
      clipId
    )
    .eq(
      "user_id",
      clipUser.id
    );


  if (error) {
    console.error(
      "Clip deletion error:",
      error
    );


    button.disabled =
      false;


    button.textContent =
      "DELETE";


    return;
  }


  await loadClips();
}


/* ==================================================
   INITIALIZE
   ================================================== */

async function initializeClips() {
  const parameters =
    new URLSearchParams(
      window.location.search
    );


  clipGameId =
    parameters.get("id");


  if (!clipGameId) {
    clipList.innerHTML = `
      <p class="empty-message">
        No game was selected.
      </p>
    `;


    return;
  }


  const {
    data: {
      session
    },
    error
  } = await supabaseClient
    .auth
    .getSession();


  if (error) {
    console.error(
      "Clip session error:",
      error
    );
  }


  clipUser =
    session?.user ||
    null;


  if (clipUser) {
    showClipFormButton.hidden =
      false;


    clipLoginMessage.hidden =
      true;

  } else {
    showClipFormButton.hidden =
      true;


    clipLoginMessage.hidden =
      false;
  }


  await loadClips();


  supabaseClient.auth
    .onAuthStateChange(
      (
        event,
        session
      ) => {
        clipUser =
          session?.user ||
          null;


        if (clipUser) {
          showClipFormButton.hidden =
            false;


          clipLoginMessage.hidden =
            true;

        } else {
          showClipFormButton.hidden =
            true;


          clipForm.hidden =
            true;


          clipLoginMessage.hidden =
            false;
        }


        loadClips();
      }
    );
}


showClipFormButton?.addEventListener(
  "click",
  () => {
    clipForm.hidden =
      false;


    showClipFormButton.hidden =
      true;


    clipFormMessage.textContent =
      "";
  }
);


cancelClipButton?.addEventListener(
  "click",
  () => {
    clipForm.reset();


    clipForm.hidden =
      true;


    showClipFormButton.hidden =
      false;


    clipFormMessage.textContent =
      "";
  }
);


clipForm?.addEventListener(
  "submit",
  saveClip
);


initializeClips();