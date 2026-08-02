const forgotPasswordForm = document.querySelector("#forgot-password-form");
const forgotPasswordEmail = document.querySelector("#email");
const forgotPasswordButton = document.querySelector("#forgot-password-button");
const forgotPasswordMessage = document.querySelector("#forgot-password-message");

function showForgotPasswordMessage(message, type = "") {
  forgotPasswordMessage.textContent = message;
  forgotPasswordMessage.className = "auth-message";
  if (type) forgotPasswordMessage.classList.add(`auth-message-${type}`);
}

forgotPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = forgotPasswordEmail.value.trim();

  if (!email) {
    showForgotPasswordMessage("Please enter your email address.", "error");
    return;
  }

  forgotPasswordButton.disabled = true;
  forgotPasswordButton.textContent = "SENDING...";
  showForgotPasswordMessage("");

  try {
    const redirectUrl =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? `${window.location.origin}/reset-password.html`
        : "https://previoussave.com/reset-password.html";

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) console.error("Password reset request error:", error);

    showForgotPasswordMessage(
      "If an account exists with that email, a password reset link has been sent.",
      "success"
    );
    forgotPasswordForm.reset();
  } catch (error) {
    console.error("Unexpected password reset error:", error);
    showForgotPasswordMessage(
      "Something went wrong. Please wait a moment and try again.",
      "error"
    );
  } finally {
    forgotPasswordButton.disabled = false;
    forgotPasswordButton.textContent = "SEND RESET LINK";
  }
});
