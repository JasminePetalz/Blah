const resetPasswordForm = document.querySelector("#reset-password-form");
const newPasswordInput = document.querySelector("#new-password");
const confirmPasswordInput = document.querySelector("#confirm-password");
const resetPasswordButton = document.querySelector("#reset-password-button");
const resetPasswordMessage = document.querySelector("#reset-password-message");
const resetPasswordLoading = document.querySelector("#reset-password-loading");
const resetPasswordInvalid = document.querySelector("#reset-password-invalid");

let recoverySessionReady = false;

function showResetMessage(message, type = "") {
  resetPasswordMessage.textContent = message;
  resetPasswordMessage.className = "auth-message";
  if (type) resetPasswordMessage.classList.add(`auth-message-${type}`);
}

function showResetForm() {
  recoverySessionReady = true;
  resetPasswordLoading.hidden = true;
  resetPasswordInvalid.hidden = true;
  resetPasswordForm.hidden = false;
}

function showInvalidResetLink() {
  recoverySessionReady = false;
  resetPasswordLoading.hidden = true;
  resetPasswordForm.hidden = true;
  resetPasswordInvalid.hidden = false;
}

const { data: authListener } = supabaseClient.auth.onAuthStateChange(
  async (event, session) => {
    if (event === "PASSWORD_RECOVERY" && session) showResetForm();
  }
);

async function checkRecoverySession() {
  try {
    const {
      data: { session },
      error
    } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Recovery session error:", error);
      showInvalidResetLink();
      return;
    }

    if (session) {
      showResetForm();
      return;
    }

    window.setTimeout(async () => {
      if (recoverySessionReady) return;
      const {
        data: { session: delayedSession }
      } = await supabaseClient.auth.getSession();

      if (delayedSession) showResetForm();
      else showInvalidResetLink();
    }, 1500);
  } catch (error) {
    console.error("Unexpected recovery-session error:", error);
    showInvalidResetLink();
  }
}

resetPasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const newPassword = newPasswordInput.value;
  const confirmedPassword = confirmPasswordInput.value;
  showResetMessage("");

  if (!recoverySessionReady) {
    showResetMessage("Your password reset link is no longer active.", "error");
    return;
  }

  if (newPassword.length < 8) {
    showResetMessage("Your password must be at least 8 characters long.", "error");
    return;
  }

  if (newPassword !== confirmedPassword) {
    showResetMessage("The two passwords do not match.", "error");
    return;
  }

  resetPasswordButton.disabled = true;
  resetPasswordButton.textContent = "UPDATING PASSWORD...";

  try {
    const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;

    showResetMessage(
      "Your password has been updated. Redirecting you to login...",
      "success"
    );
    resetPasswordForm.reset();
    await supabaseClient.auth.signOut();

    window.setTimeout(() => {
      window.location.href = "login.html?password-reset=success";
    }, 1800);
  } catch (error) {
    console.error("Password update error:", error);
    showResetMessage(
      error.message ||
        "Your password could not be updated. Please request a new reset link.",
      "error"
    );
    resetPasswordButton.disabled = false;
    resetPasswordButton.textContent = "UPDATE PASSWORD";
  }
});

checkRecoverySession();

window.addEventListener("beforeunload", () => {
  authListener?.subscription?.unsubscribe();
});
