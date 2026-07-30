const signupForm = document.querySelector("#signup-form");
const loginForm = document.querySelector("#login-form");

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document
      .querySelector("#signup-username")
      .value
      .trim();

    const email = document
      .querySelector("#signup-email")
      .value
      .trim();

    const password = document
      .querySelector("#signup-password")
      .value;

    const message = document.querySelector("#signup-message");

    message.textContent = "Creating account...";

    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      console.log("Signup data:", data);
      console.log("Signup error:", error);

      if (error) {
        message.textContent = `Signup failed: ${error.message}`;
        return;
      }

      if (!data.user) {
        message.textContent =
          "No user was returned. Check the browser console.";
        return;
      }

      if (!data.session) {
        message.textContent =
          "Account created. Check the Mailtrap sandbox for the confirmation email.";
        return;
      }

      message.textContent = "Account created.";

      window.location.href = "profile.html";
    } catch (error) {
      console.error(error);

      message.textContent =
        `Unexpected error: ${error.message}`;
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document
      .querySelector("#login-email")
      .value
      .trim();

    const password = document
      .querySelector("#login-password")
      .value;

    const message = document.querySelector("#login-message");

    message.textContent = "Logging in...";

    try {
      const { error } =
        await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        message.textContent = `Login failed: ${error.message}`;
        return;
      }

      window.location.href = "profile.html";
    } catch (error) {
      console.error(error);

      message.textContent =
        `Unexpected error: ${error.message}`;
    }
  });
}