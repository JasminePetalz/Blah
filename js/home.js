const homeAvatar =
  document.querySelector("#home-profile-avatar");

const homeUsername =
  document.querySelector("#home-profile-username");

const homeGamerscore =
  document.querySelector("#home-profile-gamerscore");

const homeMemberSince =
  document.querySelector("#home-profile-member-since");

const homeStatus =
  document.querySelector("#home-profile-status");

const homeBio =
  document.querySelector("#home-profile-bio");

const primaryLink =
  document.querySelector("#home-profile-primary-link");

const secondaryLink =
  document.querySelector("#home-profile-secondary-link");


function showLoggedOutCard() {
  homeAvatar.src =
    "images/avatar.png";

  homeUsername.textContent =
    "guest";

  homeGamerscore.textContent =
    "Gamerscore: —";

  homeMemberSince.textContent =
    "Member since: —";

  homeStatus.textContent =
    "Status: Offline";

  homeBio.textContent =
    "Log in or create an account to make your own profile.";

  primaryLink.textContent =
    "Log in";

  primaryLink.href =
    "login.html";

  secondaryLink.textContent =
    "Create account";

  secondaryLink.href =
    "signup.html";

  secondaryLink.onclick =
    null;
}


function showProfileCard(profile) {
  const username =
    profile.username || "user";

  const gamerscore =
    Number(
      profile.gamerscore || 0
    ).toLocaleString();

  let memberYear =
    "—";


  if (profile.created_at) {
    memberYear =
      new Date(
        profile.created_at
      ).getFullYear();
  }


  homeUsername.textContent =
    username;

  homeGamerscore.textContent =
    `Gamerscore: ${gamerscore}`;

  homeMemberSince.textContent =
    `Member since: ${memberYear}`;

  homeStatus.textContent =
    "Status: Online";

  homeBio.textContent =
    profile.bio ||
    "No bio added yet.";

  homeAvatar.src =
    profile.avatar_url ||
    "images/avatar.png";


  homeAvatar.onerror = () => {
    homeAvatar.onerror =
      null;

    homeAvatar.src =
      "images/avatar.png";
  };


  primaryLink.textContent =
    "View profile";

  primaryLink.href =
    "profile.html";


  secondaryLink.textContent =
    "Log out";

  secondaryLink.href =
    "#";


  secondaryLink.onclick =
    async (event) => {
      event.preventDefault();

      secondaryLink.textContent =
        "Logging out...";


      const { error } =
        await supabaseClient
          .auth
          .signOut();


      if (error) {
        console.error(
          "Logout error:",
          error
        );

        secondaryLink.textContent =
          "Log out";

        return;
      }


      showLoggedOutCard();
    };
}


async function loadHomepageProfile() {
  try {
    const {
      data: { user },
      error: userError
    } = await supabaseClient
      .auth
      .getUser();


    if (userError || !user) {
      showLoggedOutCard();
      return;
    }


    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .select(`
        username,
        bio,
        avatar_url,
        gamerscore,
        created_at
      `)
      .eq("id", user.id)
      .single();


    if (profileError) {
      console.error(
        "Homepage profile error:",
        profileError
      );

      showLoggedOutCard();
      return;
    }


    showProfileCard(profile);

  } catch (error) {
    console.error(
      "Homepage profile error:",
      error
    );

    showLoggedOutCard();
  }
}


loadHomepageProfile();