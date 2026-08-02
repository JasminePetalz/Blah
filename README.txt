PREVIOUS SAVE FORUM UPDATE

Replace these three files in your repository:
- forum.html
- js/forum.js
- style.css

What changed:
- Signed-in users see START A THREAD on the forum homepage.
- Logged-out users see LOG IN TO POST instead.
- The forum homepage thread form includes a category picker.
- Category pages keep CREATE THREAD.
- Individual thread pages show REPLY TO THREAD instead of CREATE THREAD.
- Clicking REPLY TO THREAD opens and focuses the reply form.
- Locked threads do not allow normal users to reply; staff can still reply.
- Forum search now searches thread titles and post bodies.
- FORUM HOME stays hidden on the actual forum homepage.
- Added a global hidden attribute fix so JS-controlled buttons stay hidden.

No new SQL is required.
