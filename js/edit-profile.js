const editProfileForm =
  document.querySelector("#edit-profile-form");

const usernameInput =
  document.querySelector("#edit-username");

const bioInput =
  document.querySelector("#edit-bio");

const locationInput =
  document.querySelector("#edit-location");

const favoriteGenreInput =
  document.querySelector("#edit-favorite-genre");

const gamerscoreInput =
  document.querySelector("#edit-gamerscore");

const avatarFileInput =
  document.querySelector("#edit-avatar-file");

const avatarPreview =
  document.querySelector("#edit-avatar-preview");

const removeAvatarButton =
  document.querySelector("#remove-avatar-button");

const bioCharacterCount =
  document.querySelector("#bio-character-count");

const messageElement =
  document.querySelector("#edit-profile-message");

const saveButton =
  document.querySelector("#save-profile-button");

const editTagList = document.querySelector("#edit-tag-list");
const editTagInput = document.querySelector("#edit-tag-input");
const editTagAddButton = document.querySelector("#edit-tag-add-button");
const editTagCount = document.querySelector("#edit-tag-count");
const editTagMessage = document.querySelector("#edit-tag-message");


const DEFAULT_AVATAR =
  "images/avatar.png";

const AVATAR_BUCKET =
  "avatars";

const MAX_AVATAR_SIZE =
  5 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
];


let currentUser = null;

let currentAvatarUrl = "";

let selectedAvatarFile = null;

let removeCurrentAvatar = false;


function updateBioCount() {
  if (!bioCharacterCount || !bioInput) {
    return;
  }

  bioCharacterCount.textContent =
    `${bioInput.value.length} / 300`;
}


function setMessage(text, isError = false) {
  if (!messageElement) {
    return;
  }

  messageElement.textContent = text;

  messageElement.dataset.status =
    isError ? "error" : "normal";
}


function getFileExtension(file) {
  const fileNameParts =
    file.name.split(".");

  if (fileNameParts.length > 1) {
    return fileNameParts
      .pop()
      .toLowerCase();
  }

  const typeParts =
    file.type.split("/");

  return typeParts[1] || "jpg";
}


function validateAvatarFile(file) {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return "Please choose a PNG, JPG, WebP or GIF image.";
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return "That image is larger than 5 MB.";
  }

  return "";
}


function showSelectedAvatar(file) {
  const previewUrl =
    URL.createObjectURL(file);

  avatarPreview.src = previewUrl;

  avatarPreview.onload = () => {
    URL.revokeObjectURL(previewUrl);
  };
}



const MAX_PROFILE_TAGS = 8;
const MAX_TAG_LENGTH = 24;
let profileTags = [];

function normalizeTag(value = "") {
  return String(value)
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function displayTag(value = "") {
  return String(value)
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ");
}

function setTagMessage(message = "", isError = false) {
  if (!editTagMessage) return;
  editTagMessage.textContent = message;
  editTagMessage.dataset.status = isError ? "error" : "normal";
}

function renderEditableTags() {
  if (!editTagList) return;

  editTagList.innerHTML = "";
  editTagCount.textContent = `${profileTags.length} / ${MAX_PROFILE_TAGS}`;

  if (!profileTags.length) {
    editTagList.innerHTML = '<p class="edit-tags-empty">No tags added yet.</p>';
    return;
  }

  profileTags.forEach((item) => {
    const chip = document.createElement("span");
    chip.className = "edit-tag-chip";
    chip.innerHTML = `
      <span>#${item.tag}</span>
      <button type="button" aria-label="Remove ${item.tag}" data-tag="${item.normalized_tag}">×</button>
    `;
    editTagList.append(chip);
  });
}

async function loadEditableTags() {
  if (!currentUser) return;

  const { data, error } = await supabaseClient
    .from("profile_tags")
    .select("tag,normalized_tag")
    .eq("user_id", currentUser.id)
    .order("tag", { ascending: true });

  if (error) {
    console.error("Tag load error:", error);
    setTagMessage("Tags could not be loaded.", true);
    return;
  }

  profileTags = data || [];
  renderEditableTags();
}

async function addProfileTag() {
  if (!currentUser) return;

  const tag = displayTag(editTagInput.value);
  const normalizedTag = normalizeTag(tag);

  if (!tag) {
    setTagMessage("Type a tag first.", true);
    return;
  }

  if (tag.length > MAX_TAG_LENGTH) {
    setTagMessage(`Tags can be no longer than ${MAX_TAG_LENGTH} characters.`, true);
    return;
  }

  if (!/^[a-zA-Z0-9][a-zA-Z0-9 &+.'_-]*$/.test(tag)) {
    setTagMessage("Use letters, numbers, spaces, and simple punctuation only.", true);
    return;
  }

  if (profileTags.length >= MAX_PROFILE_TAGS) {
    setTagMessage(`You can add up to ${MAX_PROFILE_TAGS} tags.`, true);
    return;
  }

  if (profileTags.some((item) => item.normalized_tag === normalizedTag)) {
    setTagMessage("You already have that tag.", true);
    return;
  }

  editTagAddButton.disabled = true;

  const { error } = await supabaseClient
    .from("profile_tags")
    .insert({
      user_id: currentUser.id,
      tag,
      normalized_tag: normalizedTag
    });

  editTagAddButton.disabled = false;

  if (error) {
    console.error("Tag add error:", error);
    setTagMessage(error.message || "That tag could not be added.", true);
    return;
  }

  editTagInput.value = "";
  setTagMessage("Tag added.");
  await loadEditableTags();
}

editTagAddButton?.addEventListener("click", addProfileTag);
editTagInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addProfileTag();
  }
});

editTagList?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-tag]");
  if (!button || !currentUser) return;

  button.disabled = true;

  const { error } = await supabaseClient
    .from("profile_tags")
    .delete()
    .eq("user_id", currentUser.id)
    .eq("normalized_tag", button.dataset.tag);

  if (error) {
    console.error("Tag delete error:", error);
    setTagMessage("That tag could not be removed.", true);
    button.disabled = false;
    return;
  }

  setTagMessage("Tag removed.");
  await loadEditableTags();
});


async function loadProfileForEditing() {
  setMessage("Loading profile...");


  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();


  if (userError || !user) {
    window.location.href =
      "login.html";

    return;
  }


  currentUser = user;


  const {
    data: profile,
    error: profileError
  } = await supabaseClient
    .from("profiles")
    .select(`
      username,
      bio,
      location,
      favorite_genre,
      gamerscore,
      avatar_url
    `)
    .eq("id", user.id)
    .single();


  if (profileError) {
    console.error(
      "Profile load error:",
      profileError
    );

    setMessage(
      `Could not load profile: ${profileError.message}`,
      true
    );

    return;
  }


  usernameInput.value =
    profile.username || "";

  bioInput.value =
    profile.bio || "";

  locationInput.value =
    profile.location || "";

  favoriteGenreInput.value =
    profile.favorite_genre || "";

  gamerscoreInput.value =
    profile.gamerscore || 0;

  currentAvatarUrl =
    profile.avatar_url || "";

  avatarPreview.src =
    currentAvatarUrl || DEFAULT_AVATAR;


  updateBioCount();
  await loadEditableTags();

  setMessage("");
}


async function uploadAvatar(file) {
  const extension =
    getFileExtension(file);

  const filePath =
    `${currentUser.id}/avatar-${Date.now()}.${extension}`;


  const {
    data: uploadData,
    error: uploadError
  } = await supabaseClient
    .storage
    .from(AVATAR_BUCKET)
    .upload(
      filePath,
      file,
      {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false
      }
    );


  if (uploadError) {
    console.error(
      "Avatar upload error:",
      uploadError
    );

    throw new Error(
      `Image upload failed: ${uploadError.message}`
    );
  }


  const {
    data: publicUrlData
  } = supabaseClient
    .storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(uploadData.path);


  if (!publicUrlData?.publicUrl) {
    throw new Error(
      "The image uploaded, but its public URL could not be created."
    );
  }


  return publicUrlData.publicUrl;
}


avatarFileInput.addEventListener(
  "change",
  () => {
    const file =
      avatarFileInput.files[0];

    if (!file) {
      return;
    }


    const validationError =
      validateAvatarFile(file);


    if (validationError) {
      avatarFileInput.value = "";

      selectedAvatarFile = null;

      setMessage(
        validationError,
        true
      );

      return;
    }


    selectedAvatarFile = file;

    removeCurrentAvatar = false;

    showSelectedAvatar(file);

    setMessage(
      "Image selected. Press Save Profile to upload it."
    );
  }
);


removeAvatarButton.addEventListener(
  "click",
  () => {
    selectedAvatarFile = null;

    removeCurrentAvatar = true;

    avatarFileInput.value = "";

    avatarPreview.src =
      DEFAULT_AVATAR;

    setMessage(
      "The avatar will be removed when you save."
    );
  }
);


bioInput.addEventListener(
  "input",
  updateBioCount
);


editProfileForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();


    if (!currentUser) {
      setMessage(
        "You must be logged in.",
        true
      );

      return;
    }


    const username =
      usernameInput.value.trim();

    const bio =
      bioInput.value.trim();

    const location =
      locationInput.value.trim();

    const favoriteGenre =
      favoriteGenreInput.value.trim();

    const gamerscore =
      Number(gamerscoreInput.value);


    if (!username) {
      setMessage(
        "Please enter a username.",
        true
      );

      return;
    }


    if (
      Number.isNaN(gamerscore) ||
      gamerscore < 0
    ) {
      setMessage(
        "Please enter a valid Gamerscore.",
        true
      );

      return;
    }


    saveButton.disabled = true;

    saveButton.textContent =
      "SAVING...";

    setMessage(
      selectedAvatarFile
        ? "Uploading image..."
        : "Saving profile..."
    );


    try {
      let avatarUrl =
        currentAvatarUrl;


      if (removeCurrentAvatar) {
        avatarUrl = "";
      }


      if (selectedAvatarFile) {
        avatarUrl =
          await uploadAvatar(
            selectedAvatarFile
          );

        setMessage(
          "Image uploaded. Saving profile..."
        );
      }


      const {
        data,
        error
      } = await supabaseClient
        .from("profiles")
        .update({
          username,
          bio,
          location,
          favorite_genre: favoriteGenre,
          gamerscore,
          avatar_url: avatarUrl
        })
        .eq("id", currentUser.id)
        .select()
        .single();


      if (error) {
        console.error(
          "Profile update error:",
          error
        );

        throw new Error(
          `Could not save profile: ${error.message}`
        );
      }


      console.log(
        "Updated profile:",
        data
      );


      setMessage(
        "Profile saved!"
      );


      setTimeout(() => {
        window.location.href =
          "profile.html";
      }, 500);

    } catch (error) {
      console.error(error);

      setMessage(
        error.message ||
          "Something went wrong while saving.",
        true
      );

      saveButton.disabled = false;

      saveButton.textContent =
        "SAVE PROFILE";
    }
  }
);


loadProfileForEditing();