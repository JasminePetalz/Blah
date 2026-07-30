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