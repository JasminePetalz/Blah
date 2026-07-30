async function loadProfile() {
  const usernameElement =
    document.querySelector("#profile-username");

  const bioElement =
    document.querySelector("#profile-bio");

  const gamerscoreElement =
    document.querySelector("#profile-gamerscore");

  const locationElement =
    document.querySelector("#profile-location");

  const avatarElement =
    document.querySelector("#profile-avatar");

  const memberSinceElement =
    document.querySelector("#profile-member-since");

  const favoriteGenreElement =
    document.querySelector("#profile-favorite-genre");

  const gamertagElement =
    document.querySelector("#profile-gamertag");


  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();


  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }


  const {
    data: profile,
    error: profileError
  } = await supabaseClient
    .from("profiles")
    .select(
      `
      username,
      bio,
      avatar_url,
      gamerscore,
      location,
      favorite_genre,
      created_at
      `
    )
    .eq("id", user.id)
    .single();


  if (profileError) {
    console.error(
      "Profile load error:",
      profileError
    );

    if (bioElement) {
      bioElement.textContent =
        "Could not load profile information.";
    }

    return;
  }


  const username =
    profile.username || "user";


  if (usernameElement) {
    usernameElement.textContent =
      username;
  }


  if (bioElement) {
    bioElement.textContent =
      profile.bio || "No bio added yet.";
  }


  if (gamerscoreElement) {
    const gamerscore =
      Number(
        profile.gamerscore || 0
      ).toLocaleString();

    gamerscoreElement.textContent =
      `Gamerscore: ${gamerscore}`;
  }


  if (locationElement) {
    locationElement.textContent =
      profile.location ||
      "Location not added";
  }


  if (
    avatarElement &&
    profile.avatar_url
  ) {
    avatarElement.src =
      profile.avatar_url;
  }


  if (
    memberSinceElement &&
    profile.created_at
  ) {
    const createdDate =
      new Date(profile.created_at);

    const createdYear =
      createdDate.getFullYear();

    memberSinceElement.textContent =
      `Member since ${createdYear}`;
  }


  if (favoriteGenreElement) {
    favoriteGenreElement.textContent =
      profile.favorite_genre ||
      "Not added";
  }


  if (gamertagElement) {
    gamertagElement.textContent =
      username;
  }


  updateActivityUsernames(username);
}


function updateActivityUsernames(username) {
  const activityUsernames =
    document.querySelectorAll(
      ".activity-item strong"
    );

  activityUsernames.forEach((element) => {
    element.textContent = username;
  });
}


const logoutButton =
  document.querySelector("#logout-button");


if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    async () => {
      logoutButton.disabled = true;
      logoutButton.textContent =
        "LOGGING OUT...";

      const { error } =
        await supabaseClient.auth.signOut();

      if (error) {
        console.error(
          "Logout error:",
          error
        );

        logoutButton.disabled = false;
        logoutButton.textContent =
          "LOG OUT";

        return;
      }

      window.location.href =
        "login.html";
    }
  );
}


loadProfile();