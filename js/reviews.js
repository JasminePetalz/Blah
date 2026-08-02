const reviewForm =
  document.querySelector(
    "#review-form"
  );

const reviewLoginMessage =
  document.querySelector(
    "#review-login-message"
  );

const reviewRating =
  document.querySelector(
    "#review-rating"
  );

const reviewTitleInput =
  document.querySelector(
    "#review-title"
  );

const reviewBody =
  document.querySelector(
    "#review-body"
  );

const reviewSubmitButton =
  document.querySelector(
    "#review-submit-button"
  );

const reviewDeleteButton =
  document.querySelector(
    "#review-delete-button"
  );

const reviewFormMessage =
  document.querySelector(
    "#review-form-message"
  );

const reviewList =
  document.querySelector(
    "#game-review-list"
  );

const averageRating =
  document.querySelector(
    "#game-average-rating"
  );


let reviewUser =
  null;

let currentReview =
  null;

let reviewGameId =
  null;


/* ==================================================
   HELPERS
   ================================================== */

function escapeReviewHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatReviewDate(value) {
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


function fillExistingReview(review) {
  currentReview =
    review;


  reviewRating.value =
    String(review.rating);


  reviewTitleInput.value =
    review.title;


  reviewBody.value =
    review.body;


  reviewSubmitButton.textContent =
    "UPDATE REVIEW";


  reviewDeleteButton.hidden =
    false;
}


function clearReviewForm() {
  currentReview =
    null;


  reviewForm.reset();


  reviewSubmitButton.textContent =
    "POST REVIEW";


  reviewDeleteButton.hidden =
    true;
}


/* ==================================================
   DISPLAY REVIEWS
   ================================================== */

function renderReviews(reviews) {
  reviewList.innerHTML =
    "";


  if (!reviews.length) {
    reviewList.innerHTML = `
      <p class="empty-message">
        No reviews have been posted yet.
      </p>
    `;


    averageRating.textContent =
      "No ratings yet";


    return;
  }


  const ratingTotal =
    reviews.reduce(
      (total, review) => {
        return (
          total +
          Number(review.rating)
        );
      },
      0
    );


  const ratingAverage =
    ratingTotal /
    reviews.length;


  averageRating.textContent =
    `${ratingAverage.toFixed(1)} / 10 · ${reviews.length} review${
      reviews.length === 1
        ? ""
        : "s"
    }`;


  reviews.forEach(
    (review) => {
      const card =
        document.createElement(
          "article"
        );


      card.className =
        "game-review-card";


      const username =
        review.profile?.username ||
        "user";


      const avatarUrl =
        review.profile?.avatar_url ||
        "images/avatar.png";


      card.innerHTML = `
        <div class="game-review-score">
          ${escapeReviewHtml(review.rating)}
        </div>

        <div class="game-review-content">

          <div class="game-review-user">

            <img
              src="${escapeReviewHtml(avatarUrl)}"
              alt="${escapeReviewHtml(username)} avatar"
            >

            <div>

              <strong>
                ${escapeReviewHtml(username)}
              </strong>

              <span>
                ${escapeReviewHtml(
                  formatReviewDate(
                    review.created_at
                  )
                )}
              </span>

            </div>

          </div>

          <h3>
            ${escapeReviewHtml(review.title)}
          </h3>

          <p>
            ${escapeReviewHtml(review.body)}
          </p>

        </div>
      `;


      const avatar =
        card.querySelector("img");


      avatar.onerror = () => {
        avatar.onerror =
          null;


        avatar.src =
          "images/avatar.png";
      };


      reviewList.append(card);
    }
  );
}


/* ==================================================
   LOAD REVIEWS
   ================================================== */

async function loadReviews() {
  if (!reviewGameId) {
    return;
  }


  const {
    data: reviews,
    error
  } = await supabaseClient
    .from("reviews")
    .select(`
      id,
      user_id,
      game_id,
      rating,
      title,
      body,
      created_at,
      updated_at,
      profile:profiles (
        username,
        avatar_url
      )
    `)
    .eq(
      "game_id",
      reviewGameId
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {
    console.error(
      "Review loading error:",
      error
    );


    reviewList.innerHTML = `
      <p class="empty-message">
        Reviews could not be loaded.
      </p>
    `;


    return;
  }


  renderReviews(
    reviews || []
  );


  if (reviewUser) {
    const userReview =
      reviews?.find(
        (review) => {
          return (
            review.user_id ===
            reviewUser.id
          );
        }
      );


    if (userReview) {
      fillExistingReview(
        userReview
      );

    } else {
      clearReviewForm();
    }
  }
}


/* ==================================================
   SAVE REVIEW
   ================================================== */

async function saveReview(event) {
  event.preventDefault();


  if (!reviewUser) {
    window.location.href =
      "login.html";


    return;
  }


  const rating =
    Number(
      reviewRating.value
    );


  const title =
    reviewTitleInput
      .value
      .trim();


  const body =
    reviewBody
      .value
      .trim();


  if (
    !rating ||
    rating < 1 ||
    rating > 10
  ) {
    reviewFormMessage.textContent =
      "Choose a rating from 1 to 10.";


    return;
  }


  if (!title) {
    reviewFormMessage.textContent =
      "Enter a review title.";


    return;
  }


  if (!body) {
    reviewFormMessage.textContent =
      "Write your review.";


    return;
  }


  reviewSubmitButton.disabled =
    true;


  reviewFormMessage.textContent =
    currentReview
      ? "Updating review..."
      : "Posting review...";


  let error =
    null;


  if (currentReview) {
    const result =
      await supabaseClient
        .from("reviews")
        .update({
          rating,
          title,
          body,
          updated_at:
            new Date()
              .toISOString()
        })
        .eq(
          "id",
          currentReview.id
        )
        .eq(
          "user_id",
          reviewUser.id
        );


    error =
      result.error;

  } else {
    const result =
      await supabaseClient
        .from("reviews")
        .insert({
          user_id:
            reviewUser.id,

          game_id:
            Number(reviewGameId),

          rating,

          title,

          body
        });


    error =
      result.error;
  }


  reviewSubmitButton.disabled =
    false;


  if (error) {
    console.error(
      "Review saving error:",
      error
    );


    reviewFormMessage.textContent =
      error.code === "23505"
        ? "You already reviewed this game."
        : "Your review could not be saved.";


    return;
  }


  reviewFormMessage.textContent =
    currentReview
      ? "Review updated."
      : "Review posted.";


  await loadReviews();
}


/* ==================================================
   DELETE REVIEW
   ================================================== */

async function deleteReview() {
  if (
    !currentReview ||
    !reviewUser
  ) {
    return;
  }


  const confirmed =
    window.confirm(
      "Delete your review?"
    );


  if (!confirmed) {
    return;
  }


  reviewDeleteButton.disabled =
    true;


  reviewFormMessage.textContent =
    "Deleting review...";


  const {
    error
  } = await supabaseClient
    .from("reviews")
    .delete()
    .eq(
      "id",
      currentReview.id
    )
    .eq(
      "user_id",
      reviewUser.id
    );


  reviewDeleteButton.disabled =
    false;


  if (error) {
    console.error(
      "Review deletion error:",
      error
    );


    reviewFormMessage.textContent =
      "The review could not be deleted.";


    return;
  }


  clearReviewForm();


  reviewFormMessage.textContent =
    "Review deleted.";


  await loadReviews();
}


/* ==================================================
   INITIALIZE
   ================================================== */

async function initializeReviews() {
  const parameters =
    new URLSearchParams(
      window.location.search
    );


  reviewGameId =
    parameters.get("id");


  if (!reviewGameId) {
    reviewList.innerHTML = `
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
      "Review session error:",
      error
    );
  }


  reviewUser =
    session?.user ||
    null;


  if (reviewUser) {
    reviewForm.hidden =
      false;


    reviewLoginMessage.hidden =
      true;

  } else {
    reviewForm.hidden =
      true;


    reviewLoginMessage.hidden =
      false;
  }


  await loadReviews();


  supabaseClient.auth
    .onAuthStateChange(
      (
        event,
        session
      ) => {
        reviewUser =
          session?.user ||
          null;


        if (reviewUser) {
          reviewForm.hidden =
            false;


          reviewLoginMessage.hidden =
            true;

        } else {
          reviewForm.hidden =
            true;


          reviewLoginMessage.hidden =
            false;
        }
      }
    );
}


reviewForm?.addEventListener(
  "submit",
  saveReview
);


reviewDeleteButton?.addEventListener(
  "click",
  deleteReview
);


initializeReviews();