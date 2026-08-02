const CLIP_BUCKET =
  "clips";

const MAX_CLIP_SIZE =
  25 * 1024 * 1024;

const ALLOWED_CLIP_TYPES = [
  "video/mp4",
  "video/webm"
];


const clipLoginMessage =
  document.querySelector(
    "#clip-login-message"
  );

const showClipFormButton =
  document.querySelector(
    "#show-clip-form-button"
  );

const closeClipFormButton =
  document.querySelector(
    "#close-clip-form-button"
  );

const clipForm =
  document.querySelector(
    "#clip-form"
  );

const clipTitle =
  document.querySelector(
    "#clip-title"
  );

const clipDescription =
  document.querySelector(
    "#clip-description"
  );

const clipYoutubeUrl =
  document.querySelector(
    "#clip-youtube-url"
  );

const clipVideoFile =
  document.querySelector(
    "#clip-video-file"
  );

const clipFileLabel =
  document.querySelector(
    "#clip-file-label"
  );

const clipFilePreview =
  document.querySelector(
    "#clip-file-preview"
  );

const youtubeClipFields =
  document.querySelector(
    "#youtube-clip-fields"
  );

const uploadClipFields =
  document.querySelector(
    "#upload-clip-fields"
  );

const clipSourceYoutube =
  document.querySelector(
    "#clip-source-youtube"
  );

const clipSourceUpload =
  document.querySelector(
    "#clip-source-upload"
  );

const clipSubmitButton =
  document.querySelector(
    "#clip-submit-button"
  );

const cancelClipButton =
  document.querySelector(
    "#cancel-clip-button"
  );

const clipFormMessage =
  document.querySelector(
    "#clip-form-message"
  );

const clipUploadProgress =
  document.querySelector(
    "#clip-upload-progress"
  );

const clipList =
  document.querySelector(
    "#game-clip-list"
  );

const clipCount =
  document.querySelector(
    "#game-clip-count"
  );


let clipUser =
  null;

let clipGameId =
  null;

let previewObjectUrl =
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


function getYouTubeVideoId(urlValue) {
  try {
    const url =
      new URL(urlValue);


    const hostname =
      url.hostname
        .replace("www.", "")
        .toLowerCase();


    if (hostname === "youtu.be") {
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
      if (url.pathname === "/watch") {
        return (
          url.searchParams.get("v") ||
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


function createStoragePath(file) {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() ||
    (
      file.type === "video/webm"
        ? "webm"
        : "mp4"
    );


  const uniqueName =
    crypto.randomUUID();


  return (
    `${clipUser.id}/` +
    `${uniqueName}.${extension}`
  );
}


function clearVideoPreview() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(
      previewObjectUrl
    );


    previewObjectUrl =
      null;
  }


  clipFilePreview.pause();


  clipFilePreview.removeAttribute(
    "src"
  );


  clipFilePreview.load();


  clipFilePreview.hidden =
    true;


  clipFileLabel.textContent =
    "Choose a video file";
}


function resetClipForm() {
  clipForm.reset();


  clipSourceYoutube.checked =
    true;


  youtubeClipFields.hidden =
    false;


  uploadClipFields.hidden =
    true;


  clipUploadProgress.hidden =
    true;


  clipFormMessage.textContent =
    "";


  clearVideoPreview();
}


function openClipForm() {
  clipForm.hidden =
    false;


  showClipFormButton.hidden =
    true;


  clipTitle.focus();
}


function closeClipForm() {
  resetClipForm();


  clipForm.hidden =
    true;


  if (clipUser) {
    showClipFormButton.hidden =
      false;
  }
}


function setClipFormLoading(
  loading,
  message = ""
) {
  clipSubmitButton.disabled =
    loading;


  cancelClipButton.disabled =
    loading;


  closeClipFormButton.disabled =
    loading;


  clipUploadProgress.hidden =
    !loading;


  clipSubmitButton.textContent =
    loading
      ? "POSTING..."
      : "POST CLIP";


  clipFormMessage.textContent =
    message;
}


/* ==================================================
   SOURCE AND FILE CONTROLS
   ================================================== */

function updateClipSourceFields() {
  const uploadSelected =
    clipSourceUpload.checked;


  youtubeClipFields.hidden =
    uploadSelected;


  uploadClipFields.hidden =
    !uploadSelected;


  clipYoutubeUrl.required =
    !uploadSelected;


  clipVideoFile.required =
    uploadSelected;


  clipFormMessage.textContent =
    "";
}


function previewSelectedClip() {
  clearVideoPreview();


  const file =
    clipVideoFile.files?.[0];


  if (!file) {
    return;
  }


  if (
    !ALLOWED_CLIP_TYPES.includes(
      file.type
    )
  ) {
    clipFormMessage.textContent =
      "Choose an MP4 or WebM video.";


    clipVideoFile.value =
      "";


    return;
  }


  if (file.size > MAX_CLIP_SIZE) {
    clipFormMessage.textContent =
      "That clip is larger than 25 MB.";


    clipVideoFile.value =
      "";


    return;
  }


  const sizeInMb =
    (
      file.size /
      1024 /
      1024
    ).toFixed(1);


  clipFileLabel.textContent =
    `${file.name} · ${sizeInMb} MB`;


  previewObjectUrl =
    URL.createObjectURL(file);


  clipFilePreview.src =
    previewObjectUrl;


  clipFilePreview.hidden =
    false;


  clipFormMessage.textContent =
    "";
}


/* ==================================================
   DISPLAY CLIPS
   ================================================== */

function renderClips(clips) {
  clipList.innerHTML =
    "";


  clipCount.textContent =
    `${clips.length} clip${
      clips.length === 1
        ? ""
        : "s"
    }`;


  if (!clips.length) {
    clipList.innerHTML = `
      <div class="clips-empty-state">

        <span class="clips-empty-icon">
          ▶
        </span>

        <h3>
          No clips yet
        </h3>

        <p>
          Be the first person to share a clip from this game.
        </p>

      </div>
    `;


    return;
  }


  clips.forEach((clip) => {
    const card =
      document.createElement(
        "article"
      );


    card.className =
      "game-clip-card";


    const username =
      clip.profile?.username ||
      "user";


    const avatarUrl =
      clip.profile?.avatar_url ||
      "images/avatar.png";


    const isOwner =
      Boolean(
        clipUser &&
        clip.user_id === clipUser.id
      );


    let mediaHtml;


    if (
      clip.clip_type === "upload" &&
      clip.video_url
    ) {
      mediaHtml = `
        <video
          src="${escapeClipHtml(clip.video_url)}"
          controls
          preload="metadata"
          playsinline
        ></video>
      `;

    } else {
      mediaHtml = `
        <iframe
          src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(
            clip.youtube_video_id || ""
          )}"
          title="${escapeClipHtml(clip.title)}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      `;
    }


    card.innerHTML = `
      <div class="game-clip-media">

        ${mediaHtml}

        <span class="clip-type-badge">
          ${
            clip.clip_type === "upload"
              ? "UPLOADED"
              : "YOUTUBE"
          }
        </span>

      </div>


      <div class="game-clip-info">

        <div class="game-clip-author">

          <img
            src="${escapeClipHtml(avatarUrl)}"
            alt=""
          >

          <div>

            <strong>
              ${escapeClipHtml(username)}
            </strong>

            <span>
              ${escapeClipHtml(
                formatClipDate(
                  clip.created_at
                )
              )}
            </span>

          </div>

        </div>


        <h3>
          ${escapeClipHtml(clip.title)}
        </h3>


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

          ${
            clip.clip_type === "youtube"
              ? `
                  <a
                    href="${escapeClipHtml(clip.youtube_url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WATCH ON YOUTUBE
                  </a>
                `
              : `
                  <a
                    href="${escapeClipHtml(clip.video_url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OPEN VIDEO
                  </a>
                `
          }


          ${
            isOwner
              ? `
                  <button
                    type="button"
                    class="delete-clip-button"
                    data-clip-id="${escapeClipHtml(clip.id)}"
                    data-storage-path="${escapeClipHtml(
                      clip.storage_path || ""
                    )}"
                  >
                    DELETE
                  </button>
                `
              : ""
          }

        </div>

      </div>
    `;


    const avatar =
      card.querySelector(
        ".game-clip-author img"
      );


    avatar.onerror = () => {
      avatar.onerror =
        null;


      avatar.src =
        "images/avatar.png";
    };


    clipList.append(card);
  });


  clipList
    .querySelectorAll(
      ".delete-clip-button"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          deleteClip(
            button.dataset.clipId,
            button.dataset.storagePath,
            button
          );
        }
      );
    });
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
      clip_type,
      youtube_url,
      youtube_video_id,
      video_url,
      storage_path,
      mime_type,
      created_at,
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
   UPLOAD VIDEO
   ================================================== */

async function uploadClipFile(file) {
  const storagePath =
    createStoragePath(file);


  const {
    error: uploadError
  } = await supabaseClient
    .storage
    .from(CLIP_BUCKET)
    .upload(
      storagePath,
      file,
      {
        cacheControl:
          "3600",

        contentType:
          file.type,

        upsert:
          false
      }
    );


  if (uploadError) {
    throw uploadError;
  }


  const {
    data: publicUrlData
  } = supabaseClient
    .storage
    .from(CLIP_BUCKET)
    .getPublicUrl(
      storagePath
    );


  if (!publicUrlData?.publicUrl) {
    await supabaseClient
      .storage
      .from(CLIP_BUCKET)
      .remove([
        storagePath
      ]);


    throw new Error(
      "The uploaded video URL could not be created."
    );
  }


  return {
    storagePath,

    publicUrl:
      publicUrlData.publicUrl
  };
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
    clipTitle.value.trim();


  const description =
    clipDescription.value.trim();


  const sourceType =
    clipSourceUpload.checked
      ? "upload"
      : "youtube";


  if (!title) {
    clipFormMessage.textContent =
      "Enter a clip title.";


    return;
  }


  setClipFormLoading(
    true,
    sourceType === "upload"
      ? "Uploading video..."
      : "Posting clip..."
  );


  let uploadedStoragePath =
    null;


  try {
    let clipRow;


    if (sourceType === "youtube") {
      const youtubeUrl =
        clipYoutubeUrl.value.trim();


      const videoId =
        getYouTubeVideoId(
          youtubeUrl
        );


      if (!videoId) {
        throw new Error(
          "Enter a valid YouTube link."
        );
      }


      clipRow = {
        user_id:
          clipUser.id,

        game_id:
          Number(clipGameId),

        title,

        description:
          description || null,

        clip_type:
          "youtube",

        youtube_url:
          youtubeUrl,

        youtube_video_id:
          videoId,

        video_url:
          null,

        storage_path:
          null,

        mime_type:
          null
      };

    } else {
      const file =
        clipVideoFile.files?.[0];


      if (!file) {
        throw new Error(
          "Choose a video file."
        );
      }


      if (
        !ALLOWED_CLIP_TYPES.includes(
          file.type
        )
      ) {
        throw new Error(
          "Choose an MP4 or WebM video."
        );
      }


      if (file.size > MAX_CLIP_SIZE) {
        throw new Error(
          "That clip is larger than 25 MB."
        );
      }


      const uploadResult =
        await uploadClipFile(file);


      uploadedStoragePath =
        uploadResult.storagePath;


      clipRow = {
        user_id:
          clipUser.id,

        game_id:
          Number(clipGameId),

        title,

        description:
          description || null,

        clip_type:
          "upload",

        youtube_url:
          null,

        youtube_video_id:
          null,

        video_url:
          uploadResult.publicUrl,

        storage_path:
          uploadResult.storagePath,

        mime_type:
          file.type
      };
    }


    const {
      error: insertError
    } = await supabaseClient
      .from("clips")
      .insert(
        clipRow
      );


    if (insertError) {
      if (uploadedStoragePath) {
        await supabaseClient
          .storage
          .from(CLIP_BUCKET)
          .remove([
            uploadedStoragePath
          ]);
      }


      throw insertError;
    }


    closeClipForm();


    await loadClips();

  } catch (error) {
    console.error(
      "Clip saving error:",
      error
    );


    setClipFormLoading(
      false,
      error.message ||
      "The clip could not be posted."
    );


    return;
  }


  setClipFormLoading(
    false
  );
}


/* ==================================================
   DELETE CLIP
   ================================================== */

async function deleteClip(
  clipId,
  storagePath,
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
    error: deleteError
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


  if (deleteError) {
    console.error(
      "Clip deletion error:",
      deleteError
    );


    button.disabled =
      false;


    button.textContent =
      "DELETE";


    return;
  }


  if (storagePath) {
    const {
      error: storageError
    } = await supabaseClient
      .storage
      .from(CLIP_BUCKET)
      .remove([
        storagePath
      ]);


    if (storageError) {
      console.error(
        "Uploaded clip file deletion error:",
        storageError
      );
    }
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


/* ==================================================
   EVENTS
   ================================================== */

showClipFormButton
  ?.addEventListener(
    "click",
    openClipForm
  );


closeClipFormButton
  ?.addEventListener(
    "click",
    closeClipForm
  );


cancelClipButton
  ?.addEventListener(
    "click",
    closeClipForm
  );


clipSourceYoutube
  ?.addEventListener(
    "change",
    updateClipSourceFields
  );


clipSourceUpload
  ?.addEventListener(
    "change",
    updateClipSourceFields
  );


clipVideoFile
  ?.addEventListener(
    "change",
    previewSelectedClip
  );


clipForm
  ?.addEventListener(
    "submit",
    saveClip
  );


initializeClips();