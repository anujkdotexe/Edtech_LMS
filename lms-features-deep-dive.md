# LMS Feature Deep-Dive: Every Feature Explained in Full

> Complete reference document covering all features across Student, Admin, and Developer roles.
> No code. Pure product thinking — what each feature does, why it exists, how it behaves, and what the user experiences.

---

# PART 1 — STUDENT ROLE

The student is the end user. They paid ₹200 (or were enrolled by an admin). Their entire experience is designed around one goal: make language learning feel like a game you want to come back to every day. Everything they see is either showing them their progress or inviting them to act on it.

---

## Section 1 — Auth & Onboarding

### Email Login
This is the primary entry point. The student lands on a login page and enters their registered email address and password. The system checks that the email exists in the database, that the password matches the stored hash, and that the account is active (not suspended or deleted). If either check fails, the student sees a specific error — not a vague "something went wrong" message, but a clear one like "No account found with this email" or "Incorrect password." The reason specificity matters here is trust — a $200 product needs to feel polished from the very first screen.

On success, the backend issues two tokens: a short-lived access token (15 minutes) used for all API calls, and a long-lived refresh token (stored in an httpOnly cookie) used to silently get a new access token when the old one expires. This means the student never gets logged out mid-session unexpectedly. Form validations happen both on the frontend (before the request is sent) and the backend (before the database is touched) — every field is checked for format, length, and presence.

### Google OAuth
Instead of typing an email and password, the student clicks "Continue with Google." A popup opens, they select their Google account, and they're in. Behind the scenes, Google hands the app a verified identity token — the app reads the email and name from it, checks if a student account with that email already exists, and either logs them in or creates a new account automatically.

The critical UX decision here is that if a student originally signed up with email/password and later tries to log in with Google using the same email, the system should recognize it as the same person and link the accounts — not create a duplicate. This is called account merging and it's something many apps get wrong, resulting in confused students who think they've lost their progress.

### Forgot Password
The student clicks "Forgot password?" on the login screen, enters their email address, and receives an email containing a unique reset link. That link contains a secure, time-limited token (typically valid for 15–30 minutes). When the student clicks it, they're taken to a page to enter a new password. After submitting, the token is invalidated so it can never be used again, and the student is redirected to login with their new credentials.

The reason the token expires is security — if a student's email is briefly compromised, the attacker can't use an old reset link days later. The page must also handle edge cases gracefully: if the token has expired, show a clear message and offer to send a fresh one. If the email doesn't exist in the system, for security reasons the app should still say "If this email is registered, you'll receive a link" — this prevents attackers from probing which emails are in the database.

### Avatar Selection
During signup, after filling in their name and email, the student is presented with a grid of 12 illustrated avatar options. They click one to select it, and it becomes their visual identity throughout the platform — it appears on the leaderboard next to their name, on their profile page, in the activity feed, and anywhere their presence is shown to others.

This feature exists for a very specific psychological reason: personalization increases ownership. When a student picks an avatar, they've made a micro-commitment to the platform. It makes their account feel like theirs. The 12 avatars should be distinct enough that students feel like they made a real choice — not 12 variations of the same character.

### Change Password
From inside their profile settings, a logged-in student can update their password. The form asks for their current password first (to confirm identity), then asks for the new password twice (to catch typos). The current password check is important — without it, anyone who briefly gets access to an unlocked device could change the password and lock the real owner out.

### Change Avatar
Also from profile settings, the student can re-open the same 12-avatar grid and pick a different one. This updates their avatar everywhere on the platform immediately — leaderboard, profile, activity feed. It's a small feature but it matters because students' sense of identity can shift over time, and letting them change their avatar shows the platform treats them as humans, not fixed records.

---

## Section 2 — Home Dashboard

### Personalized Greeting
The first thing a student sees when they log in is their name in a greeting. This is not just cosmetic. Using someone's name immediately signals that this is their space, not a generic web page. The greeting is time-aware — "Good morning, Aryan" in the morning, "Good evening, Aryan" in the evening. It's a small detail that takes five minutes to build and meaningfully changes how the dashboard feels.

### Streak Counter
The streak is the single most powerful retention mechanic borrowed from Duolingo. It shows how many consecutive days the student has completed at least one learning activity (quiz, lesson, or warmup). The number is displayed prominently with a flame icon — a visual that carries the cultural meaning of "keep it burning."

The psychology is straightforward: once a student hits a 7-day streak, they do not want to lose it. The fear of losing the streak is often a stronger motivator than the desire to learn. This is known as loss aversion. The streak counter makes that tension visible every single time they open the app.

The backend resets the streak to zero if the student didn't do anything the previous calendar day. An important UX consideration: the streak should be evaluated at midnight in the student's local timezone, not the server's. If a student in Mumbai has a streak and travels to London, the reset shouldn't fire at an unexpected time.

### XP + Level Card
XP (Experience Points) is the numerical representation of everything the student has done on the platform. Every quiz completed, every lesson finished, every warmup done earns XP. The level card shows their current level and their total accumulated XP.

Levels are computed thresholds — for example, Level 1 is 0–250 XP, Level 2 is 251–500 XP, and so on. The level number gives students a sense of long-term progression that XP points alone don't provide. Seeing "Level 5" feels like an achievement. Seeing "1,250 XP" is just a number. Both are shown together — the level for pride, the XP for granularity.

### 30-Second Warmup
This is a micro-activity shown on the dashboard designed for one specific scenario: the student opens the app but doesn't have 10–15 minutes to do a full quiz or lesson. The warmup is a single quick vocabulary exercise — typically one or two questions — that counts as activity for the day (keeping the streak alive) and takes literally 30 seconds.

This feature exists because the number one reason streaks die is "I didn't have time today." The warmup removes that excuse entirely. It's the minimum viable action that keeps the student engaged on busy days. Psychologically it also serves as an entry point — many students who open the app "just for the warmup" end up doing more once they're already there.

### Daily Tip
A rotating card that shows a short language learning tip, fact, or piece of advice. These rotate daily (or could be randomized per session). The content is managed by the admin. Examples: "Did you know Spanish has two words for 'to be'? Ser is for permanent states, estar is for temporary ones." These tips serve two purposes — they deliver micro-learning passively, and they give the dashboard fresh content so it never feels stale.

### Leaderboard Preview
A compact card on the dashboard showing the top 3 students on the leaderboard alongside the current student's own rank. This serves as a constant competitive nudge — if the student is ranked #8, they can see that the person at #3 has 200 more XP. That specific, visible gap motivates action. It's not just "a leaderboard exists" — it's "here is exactly how close you are to the people above you."

### Quick Links
Two prominent shortcut buttons on the dashboard: one that takes the student directly to the daily quiz, and one that resumes their most recently active course. This eliminates navigation friction. The student doesn't need to think about where to go — the app tells them exactly where to pick up. This is especially important for return visits, where the student's mental model is "continue where I left off, not re-navigate from scratch."

---

## Section 3 — Quiz System

### Quiz Catalog
A full-page grid of all 14 quizzes available on the platform. Each quiz is displayed as a card with an emoji (for quick visual identification), a title, a difficulty badge, the point value for completing it, and the number of questions. The difficulty is color-coded: green for Easy, orange for Medium, red for Hard. This lets students make an instant decision — if they have five minutes, they pick an Easy one; if they want a challenge, they pick Hard.

The color coding is important because it communicates risk vs reward at a glance. A Hard quiz in red feels like a challenge accepted. An Easy quiz in green feels approachable. Color is doing emotional work here, not just organizational work.

### Start Quiz
When the student clicks a quiz card, they enter the quiz flow. Questions are displayed one at a time. Each question has exactly four answer options displayed as clickable cards. This single-question-at-a-time format is deliberate — it removes the cognitive overwhelm of seeing all questions at once and keeps the student focused entirely on the current question. It also creates a sense of momentum: answering one question feels like progress, not like you've barely started.

### Progress Bar
At the top of every question screen, a progress bar shows how far through the quiz the student is — "Question 4 of 14," for example, with the bar filled proportionally. This is essential for managing the student's expectation of how much time they need to invest. Without it, quizzes feel endless. With it, the student always knows they're getting closer to done, which reduces the temptation to abandon mid-way.

### Instant Feedback
Immediately after the student selects an answer, before moving to the next question, the selected option changes color. If correct, it turns green. If wrong, it turns red and the correct answer is highlighted in green. This immediate, visual feedback is the most important learning mechanism in the entire quiz system.

The reason this matters pedagogically: feedback that comes instantly after a response is exponentially more effective than feedback that comes at the end. The student's brain is still holding the question in working memory when the feedback fires — it can immediately update its understanding. Feedback after 14 questions is almost useless for learning; the student has already forgotten the context of each question.

### Score Result Screen
After the final question, the student sees a results screen with their total score (e.g., "10 out of 14 correct"), the XP they earned, and two buttons: "Try Again" and "Back to Quizzes." If they leveled up or earned a badge, this is where that animation triggers. The result screen is a moment of closure — it bookends the quiz experience and gives the student a clear signal that they're done.

The "Try Again" button matters because students who got a low score feel the pull to immediately improve. Removing friction to retry keeps them on the platform. The XP displayed tells them exactly how the quiz contributed to their progress, connecting the action to the reward.

### Exit Confirmation
If a student is in the middle of a quiz and tries to navigate away (close the tab, press back, click a menu link), a confirmation popup appears: "Are you sure you want to leave? Your progress will not be saved." This prevents accidental exits. Without this, a student who fat-fingers a navigation link loses all their quiz progress and gets frustrated. With it, accidental exits are caught and intentional exits are respected.

### Quiz History
On their profile page, students can see a list of every quiz they've ever attempted, when they took it, and their score. They can also see their personal best score for each quiz. This serves two purposes: it gives students a sense of their history and growth on the platform, and it motivates re-attempts on quizzes where their score was low. Seeing "8/14 — your best" on a quiz is an invitation to beat it.

---

## Section 4 — Courses & Learning

### Course Catalog
An organized display of all 8 available courses. Each course is shown as a card with the CEFR level badge (A1, A2, B1, B2, C1, C2 — the international standard for language proficiency), the course title, number of video lessons, total hours of content, and price. At the top of the page, filter pills let students narrow by level or category. At the bottom, a CEFR guide section explains what each level means in plain language.

The CEFR level system is crucial for this type of product because students often don't know their own level. The guide section on the catalog page does the work of helping them self-select the right course, which reduces purchases of the wrong course and the refund requests that follow.

### Course Detail
Clicking a course card opens the full detail page. This is the product's sales page as much as it is an information page. It shows the course header (level badge, title, description, key stats like lesson count and hours), a full module-by-module syllabus showing exactly what the student will learn, the price with an unlock button, a purchase CTA at the bottom, and for purchased courses, a resume/continue button instead.

The syllabus is particularly important. Students paying ₹200 need to feel confident they're getting value before clicking buy. Showing them exactly what's inside — "Module 3: Present Tense Verbs — 4 lessons, 45 minutes" — lets them make an informed decision and sets expectations correctly.

### Purchase Course
When the student clicks the unlock button on a course they haven't bought, they enter the Razorpay checkout flow. This covers the entire payment journey: selecting payment method (UPI, debit/credit card, net banking, EMI), entering payment details, confirming, and receiving a success/failure response. On success, course access is granted immediately — the student doesn't need to refresh or wait. On failure, they're shown what went wrong and invited to try again.

The checkout flow must feel seamless and trustworthy. A slow or confusing payment page is the single biggest cause of drop-off at the moment of purchase. The flow should be as few steps as possible, show security indicators, and handle edge cases gracefully (payment gateway timeout, bank declining, etc.).

### Course Player
Once a course is purchased, the student can open individual lessons. Each lesson is either a video (played inline with standard controls — play, pause, seek, speed control) or a PDF (displayed inline as a document viewer). The player keeps track of whether the student has completed the lesson — typically defined as watching at least 80–90% of a video or scrolling through a PDF.

The player must handle common failure cases: video buffering slowly on a weak connection, PDFs taking time to load, the student closing the browser mid-lesson and resuming later exactly where they left off. These aren't edge cases — they're the normal experience on mobile networks in India.

### Progress Tracking
For each enrolled course, the student can see how many lessons they've completed out of the total — "7 of 22 lessons complete" — usually shown as a progress bar on the course card and a more detailed breakdown on the course detail page. This feature exists to answer the question every student has: "How far am I?" Without it, the course feels like a black box.

Progress tracking also surfaces the "completion drive" — the psychological pull to finish something that's 85% done is much stronger than starting something new. Showing 85% completion on a course keeps students coming back.

### Locked State
Courses that the student hasn't purchased show a visual lock icon on the card and on the course detail page. Lesson items inside the syllabus are greyed out with a lock overlay. This communicates clearly and without ambiguity: this content exists, it's real, but it requires purchase. The locked state should make the content feel valuable and accessible, not frustrating — the lock should look like an invitation, not a barrier.

### Purchase History
From their profile, students can see a list of every course they've bought, when they bought it, how much they paid, and a receipt/invoice they can download or have emailed to them. This is important for trust and professionalism. A student paying ₹200 expects to be treated like a customer who made a real transaction, not just a user. Having a clean purchase history with downloadable receipts signals legitimacy.

---

## Section 5 — Gamification & Social

### Full Leaderboard
A dedicated page showing the ranked list of all students on the platform, ordered by total XP score. Each row shows the rank number, the student's avatar and name, their current level, their streak count, and their total score. The leaderboard updates in near real-time (or on a short refresh cycle). This is the social pressure engine of the entire platform — it makes learning competitive and public.

The leaderboard works because it transforms a private, solitary activity (studying) into a social one. Seeing your name at #12 and knowing exactly who is at #11 and by how much creates a specific, actionable motivation. It's not "I want to be better" — it's "I need 150 more XP to beat Priya."

### My Rank Highlight
On the leaderboard, the current student's own row is visually differentiated from all others — typically a different background color, a "You" label, or a subtle highlight. This is a UX necessity: if the leaderboard has 50+ students, the student should not have to scan the whole list to find themselves. The highlight makes their position immediately obvious. It also makes the leaderboard feel personal rather than like watching someone else's score table.

### Badge Showcase
On the profile page, 7 badge cards are displayed in a grid. Badges that have been earned are shown with full color and their name. Badges that haven't been earned yet are shown as grey/locked silhouettes with a hint of what they are. This is deliberate — showing locked badges creates the "collection drive." The student can see there's a badge they don't have yet, they can see the condition to unlock it, and they want to complete the collection.

Each badge represents a specific achievement — completing a first lesson, maintaining a 7-day streak, finishing a full course, reaching Level 5, scoring 100% on a Hard quiz, and so on. The conditions should be publicly visible so students know what to aim for, not hidden so they're surprised.

### XP Progress Bar
On the profile page, a horizontal bar shows how much XP the student has within their current level band, and how much they need to reach the next level. If the student is Level 4 and the level band is 750–1000 XP, and they have 850 XP, the bar is 40% filled. This makes the next level feel achievable — "I'm 150 XP away" is a concrete goal. Without this bar, leveling up feels arbitrary and distant.

### Activity Feed
A chronological list of the student's recent actions on the platform — "Completed Quiz: Beginner Vocabulary — 12/14 correct," "Started Course: Spanish A1," "Earned badge: First Streak," "Leveled up to Level 3." This feed serves as the student's personal history on the platform. It tells their story of progress. It's also motivating to scroll through — seeing a long list of completed activities reinforces the feeling of growth and effort invested.

### Stats Grid
Four summary cards on the profile page showing the student's most important numbers at a glance: Total Score (lifetime XP), Current Level, Streak (days), and Global Rank. These four numbers together give a complete picture of where the student stands. They're the first thing the student sees when they open their profile, and they're designed to make the student feel like a real player with real statistics — not just a learner.

---

# PART 2 — ADMIN ROLE

The admin is typically the founder or operations team. They don't learn on the platform — they run it. Their job is to manage the students, the content, the money, and the day-to-day operations. Everything in the admin panel is designed for efficiency and control.

---

## Section 1 — Dashboard Overview

### Revenue Summary
The admin's first view when they log in shows total revenue earned to date, revenue for the current month (MRR — Monthly Recurring Revenue), and revenue for today. These three numbers give an instant read on business health. Is this month tracking above last month? Is today above the daily average? The admin doesn't need to export data or run queries — the answer is right there on load.

### Active Students
Two numbers: total registered students on the platform, and how many logged in today. The "today's logins" number is a health metric — if it drops sharply from the usual daily average, something might be wrong (site down, a bad experience, a school holiday). Tracking it daily trains the admin to notice patterns.

### Quiz Completions
How many quizzes were completed today, and what was the average score across all of them. This tells the admin whether students are actively learning. A day with high logins but low quiz completions means students are opening the app but not engaging deeply. A day with low logins but high completions means the students who did come were highly engaged. These two metrics together paint a picture of quality vs quantity of engagement.

### New Signups Chart
A bar or line chart showing how many new students signed up each day over the past week (or selectable time period). This is the growth metric. Is the platform growing? Is a particular day of the week consistently better for signups? Did a marketing push last Tuesday cause a spike? The chart makes these patterns visible at a glance.

### Course Enrollment
A ranked list of courses by number of enrolled students. This tells the admin which courses are most popular. If Spanish A1 has 80 students and French B2 has 3, that's actionable — maybe French B2 needs better promotion, a price adjustment, or the admin needs to focus content creation on what's already working. This prevents the admin from guessing what students want.

### Streak Leaders
A quick widget showing the top 5 students with the highest active streaks. This is both a business health indicator (high streaks = high retention) and a human story — the admin can see real students who are deeply engaged. It can also be used to celebrate students: "Congratulations to Riya for a 30-day streak!" in an announcement.

---

## Section 2 — Student Management

### Student List
A paginated, searchable, filterable table of all students. Columns include name, email, join date, current level, streak, enrolled courses, and account status (active/suspended). The admin can search by name or email, filter by course enrollment or account status, and sort by any column. Pagination means even with thousands of students, the page loads fast.

This is the admin's main operating interface for students. Every other student action flows from finding a student in this list first.

### Student Profile View
Clicking on any student opens their full profile as seen by the admin — their avatar and name, their XP and level, their streak history, every course they're enrolled in (and their progress in each), and their complete payment history. This is a read-only view that gives the admin full context on any student before taking action.

This is critical for support situations: a student emails saying "I paid but don't have access to the course." The admin opens this student's profile, sees their payment history, sees whether the enrollment was granted, and immediately knows what happened and how to fix it — without needing to dig through the database.

### Add Single Student
A form to manually add one student to the platform. The admin enters the student's name and email address. The system creates the account and sends the student a welcome email with instructions to set their password. This is used for B2B deals (a company buys 5 seats), for students who paid offline (cash, bank transfer), or for test accounts.

### Bulk Import Students
Instead of adding students one at a time, the admin uploads a CSV file containing a list of names and email addresses. The system processes the file, creates accounts for all valid rows, skips duplicates, flags invalid email formats, and sends welcome emails to all newly created students. A results summary shows the admin exactly how many were created, how many were skipped (already exist), and how many failed (bad data).

This feature is essential for institutional onboarding. If a school buys 50 seats, the admin should not spend 45 minutes clicking "Add student" 50 times. One CSV upload handles it in 30 seconds.

### Assign Course
The admin can grant any student access to any course without requiring payment. This is used for: students who paid through an offline channel, as a goodwill gesture for a student who had a bad experience, for B2B enrollments billed separately, or for internal test accounts. The assignment is immediate — the student's account is updated instantly and they can access the course the next time they log in.

### Bulk Assign Course
The same as above, but for multiple students at once. The admin selects a course, then selects multiple students (by checkbox from the student list, or by uploading a CSV of emails), and assigns all of them in one action. This is the operational version of the bulk import — useful when an existing group of students all need access to a new course.

### Revoke Course Access
The admin can remove a student's access to a course. This would be used in cases of refund (the student gets their money back and loses access), account misuse, or a mistaken bulk assignment. Because this removes something the student may have been actively using, it's marked as a destructive action — meaning the UI shows it in red and requires confirmation before executing. The student should also ideally receive an automated email explaining why their access was revoked.

### Suspend Student
Disables a student's ability to log in without deleting their account. The student's data, progress, and payment history are all preserved — they simply can't access the platform until the suspension is lifted. This is used for accounts flagged for abuse, unpaid chargebacks, or situations where the admin needs to pause access while investigating something.

Suspension is preferable to deletion in almost every case because it's reversible. If the admin made a mistake, unsuspending takes one click. Deletion is permanent.

### Delete Student
Permanently and irreversibly removes the student's account and all associated data — profile, progress, quiz attempts, payment records — from the database. Because this is irreversible, the UI must make this extremely difficult to do accidentally: a confirmation dialog that requires the admin to type the student's name or email address before the delete button becomes active. This is used only for GDPR deletion requests or genuine account fraud cases.

### Reset Student Password
Triggers a password reset email to the student without the student having to request it themselves. Used when a student says "I never received my reset email" or "I'm locked out and the email isn't working." The admin can bypass the student-initiated flow and force a fresh reset link. This is a support tool, not a routine operation.

### Export Student Data
Downloads a CSV file of all student data matching the current filters — name, email, join date, enrollment status, XP, streak, last login, and so on. This is used for external reporting, sharing data with a business partner, importing into a CRM, or performing analysis in Excel. It respects whatever filters are active — the admin can export "all students enrolled in Spanish A1" rather than the entire database.

### Send Message
Opens a compose interface that allows the admin to send an email directly to a specific student. The email is sent through the platform's email service (Resend) and the message is logged in the student's profile. Used for personal outreach: "We noticed you haven't logged in for 2 weeks, is everything okay?" or "Congratulations on completing your first course!" Manual, human messages from a founder to a student at this price point are powerful retention tools.

---

## Section 3 — Course Management

### Create Course
A form where the admin creates a new course from scratch. Fields include: title, CEFR level (A1–C2), description, pricing, a thumbnail image, and estimated duration. Saving the form creates the course in the database in draft state — it is not yet visible to students. The admin then adds modules and lessons before publishing.

The separation of creation and publishing is important. Content teams need to build things in stages without exposing half-finished courses to paying students.

### Edit Course
The admin can update any field on an existing course at any time — fix a typo in the title, change the price, update the description, swap the thumbnail. Changes take effect immediately for published courses. This is routine maintenance — no content stays perfectly written or perfectly priced forever.

### Delete Course
Permanently removes a course from the platform. Before executing, the system checks whether any students are currently enrolled. If students are enrolled, the admin sees a warning: "47 students are currently enrolled in this course. Deleting it will remove their access." The admin must explicitly confirm they understand this before proceeding. Deletion removes the course, all its modules, all its lessons, and all enrollment records. Student payment records are preserved separately (for accounting purposes).

### Add Module
Within a course, content is organized into modules — thematic groupings of lessons. For example, a Spanish A1 course might have modules: "Greetings and Introductions," "Numbers and Counting," "Basic Verbs." The admin creates modules by giving them a name and an order position within the course. Modules appear in the syllabus on the course detail page.

Modules exist for navigational clarity — they break a long course into digestible chapters and help students understand the structure of what they're learning before they buy.

### Add Lesson
Within a module, the admin adds individual lessons. Each lesson has a title, a type (video or PDF), and the associated content file. The admin uploads the file, and it gets stored on Cloudflare R2. The lesson also has an order position within its module and an estimated duration. This is the atom of content — the smallest unit of learning.

### Upload Content
The file upload interface for lessons. The admin selects a video file (MP4) or document (PDF) from their computer, the system uploads it to Cloudflare R2 (a cloud storage service), and returns a secure URL. That URL is stored with the lesson record. When a student later opens the lesson, they receive a time-limited signed URL — a special link that expires after a short window — which prevents content from being shared or downloaded directly.

The reason for signed URLs is content protection. The admin spent time creating these videos. They shouldn't be freely shareable to non-paying users.

### Reorder Lessons
Within a module, the admin can drag and drop lessons into a different order. This produces a numbered order field in the database that the frontend uses to display lessons in the correct sequence. This is necessary for courses where lesson order matters — you can't teach past tense before present tense.

### Toggle Published
Each course has a published/draft status toggle. Draft courses are invisible to students. Published courses are visible in the catalog. This toggle allows the admin to prepare an entire course — create all modules, add all lessons, upload all content — and then flip one switch to make it live. It also allows temporarily unpublishing a course for maintenance without deleting it.

### Course Analytics
A per-course breakdown showing: how many students have enrolled, what percentage have completed at least one lesson, what percentage have completed the entire course, and where students most commonly drop off (which module or lesson has the highest abandonment rate). The dropout rate by lesson is the most actionable metric — if 40% of students quit at Lesson 6 of a particular module, that lesson is probably too hard, too long, or has a technical problem.

---

## Section 4 — Quiz Management

### Create Quiz
A form to create a new quiz. Fields: title, emoji icon, difficulty level (Easy / Medium / Hard), point value for completion, and an optional description. Creating the quiz record is step one — questions are added separately after the quiz shell exists.

### Add Questions
Within a quiz, the admin adds individual questions. Each question has: the question text, four answer options (labeled A, B, C, D), and a designation of which option is the correct answer. The admin can add as many questions as needed — the platform spec calls for 14 questions per quiz. Questions are ordered sequentially and presented to the student in that order.

### Edit Question
The admin can click on any existing question and modify any part of it — the question text, any of the four options, or which option is correct. Changes take effect immediately. This is used to fix errors discovered after publishing (wrong answer marked correct, typo in a question, outdated vocabulary example).

### Delete Quiz
Removes a quiz entirely. Before confirming, the system warns the admin: "This quiz has 230 total attempts from 45 students. Deleting it will remove all attempt records and XP earned from it." This is irreversible and has downstream consequences for student XP and leaderboard positions — hence the warning. Used for quizzes that are fundamentally broken or redundant.

### Quiz Analytics
A per-quiz analytics view showing: total attempts, average score, average completion time, pass rate (what % score above a threshold), and a per-question breakdown — which specific questions had the lowest correct answer rates. A question that 5% of students get right is either extremely hard or poorly written. A question that 98% get right might be too easy and not earning its place in the quiz. This data informs content improvement.

### Preview Quiz
The admin can view the quiz exactly as a student would see it — the question cards, the four options, the progress bar, the result screen — without the answers being submitted to the database and without affecting any real student data. This is essential for quality checking new quizzes before publishing. The admin can catch formatting errors, ambiguous questions, or wrong correct answers before students encounter them.

---

## Section 5 — Payments (Admin)

### Payment List
A full table of every payment transaction ever processed through the platform. Each row shows: order ID (from Razorpay), student name and email, course purchased, amount, payment method (UPI, card, etc.), timestamp, and status. The admin can search by student name, filter by status or date range, and sort by any column. This is the financial ledger of the business.

### Successful Payments
A filtered view showing only transactions with status "paid" — confirmed, money received, course access granted. This is what the admin checks when reconciling monthly revenue or confirming that a specific student's payment went through.

### Failed Payments
Transactions where the student initiated payment but it did not complete successfully. Each failed payment has a reason code from Razorpay (bank declined, payment timeout, insufficient funds, etc.). This view is used to identify students who tried to pay but couldn't — they're warm leads who might succeed with a follow-up or a different payment method.

### Pending Payments
Transactions initiated but not yet confirmed. With some payment methods (certain net banking flows, UPI collect requests), there's a window between "student pressed pay" and "money confirmed received." Pending payments sit in this state. If a payment stays pending for too long, it needs investigation — either the student is stuck, or the gateway is having an issue.

### Refund Record
A list of all refunds that have been processed, showing the original transaction, the refund amount, the reason (if logged), and the date. This is both a financial record and a customer service log. If a student asks "Did my refund go through?" the admin can look it up here instantly.

### Issue Refund
From a specific payment's detail view, the admin can trigger a refund through the Razorpay API. They enter the amount to refund (full or partial), optionally add a reason, and confirm. Razorpay processes the refund back to the student's original payment method. The platform then revokes the student's course access (if a full refund). This is logged in the refund record and in the student's payment history.

### Payment Detail
Clicking on any transaction opens a full detail view: the Razorpay order ID, the payment ID, the exact amount, the payment method and last 4 digits (for cards), the timestamp to the second, the student's account details, which course was purchased, and the current status. This level of detail is needed for support cases, disputes with Razorpay, and accounting audits.

### Revenue Export
Downloads a CSV of all payment data matching the currently active filters. The admin can select a date range (e.g., "April 2026") and export every transaction in that period as a spreadsheet. This is used for monthly accounting, sharing revenue data with a CA, or feeding into external financial tools. The export includes all relevant fields: order ID, student name, course, amount, date, status.

### Manual Enrollment
Grants a student access to a course without any payment being processed. This is distinct from "Assign Course" in the student management section only in where you initiate it — here it's initiated from the payments section, which makes it contextually appropriate for cases where payment happened outside the platform (wire transfer, cash, check) and the admin is recording a "paid offline" enrollment.

---

## Section 6 — Content & Site Settings

### Edit Daily Tips
The admin manages a pool of short learning tips displayed on the student dashboard. They can add new tips, edit existing ones, and delete outdated ones. Tips rotate either daily (one new tip per day) or randomly per session. The admin controls the entire tip library from this interface — no code changes needed to update the content students see every day.

### Manage Badges
The admin can view all 7 badges in the system, edit their names and descriptions, and adjust the conditions that trigger each badge. For example, "First Step" badge unlocks when a student completes their first lesson — the admin can change the name to "Beginner" or adjust the condition to "completes first quiz" if the product direction changes. This makes the gamification system configurable without touching code.

### Announcement Banner
A global banner that appears at the top of the student's app when active. The admin can write a message (up to a few sentences), set it as active, and every student who logs in will see it. Used for: "🎉 New course Spanish B2 is now live!", "🚨 Maintenance scheduled for Sunday 2–4 AM," or "Congratulations to Arjun for reaching Level 10!" Deactivating the banner removes it from all student views immediately.

### Email Templates
The admin can view and edit the templates for all automated emails the platform sends: the welcome email, the streak-at-risk reminder ("You haven't logged in today — your 7-day streak is in danger!"), the password reset email, the purchase confirmation email, and the level-up congratulations email. Editing a template changes what all future sends of that email will look like. The admin doesn't need a developer to fix a typo in the welcome email.

---

# PART 3 — DEVELOPER ROLE

The developer has everything the admin has, plus full visibility into the technical internals of the system. They are the person who built the platform or maintains it. Their additional tools are not for operations — they're for debugging, monitoring, and infrastructure management.

---

## Section 1 — System Logs

### API Request Logs
A real-time or near-real-time log of every HTTP request made to the backend API. Each entry shows: the HTTP method (GET, POST, DELETE), the route path (/api/quizzes/attempt), the response status code (200 OK, 404 Not Found, 500 Internal Server Error), and the time the request took to process (latency in milliseconds). This is the first place a developer checks when investigating a reported bug — "what exactly happened at 3:47 PM when this student says the quiz broke?"

### Error Logs
Every unhandled exception, caught error, and warning that occurs in the backend, surfaced from Sentry. Each error entry shows the full stack trace (the exact file, function, and line where the error occurred), the request context that triggered it (which user, which route, what inputs were sent), and when it happened. The developer can see at a glance whether errors are isolated incidents or repeating patterns. A single error that happened once is a blip. The same error occurring 200 times in an hour is a production crisis.

### Auth Event Log
A dedicated log of every authentication-related event: successful logins, failed login attempts (wrong password), token refresh events, logouts, password resets, and Google OAuth connections. This log serves two purposes — debugging auth issues ("why can't this student log in?") and security monitoring ("is anyone attempting to brute-force login to admin accounts?"). Seeing 50 failed login attempts on the same email in 5 minutes is a signal that warrants investigation.

### Webhook Log
Every event sent by Razorpay to the platform's webhook endpoint is logged here — including the raw JSON payload Razorpay sent, the timestamp, the event type (payment.captured, payment.failed, refund.created), and whether the platform successfully processed it. This is critical for payment debugging. If a student paid and didn't get access, the first thing to check is whether the webhook was received and what happened when the platform tried to process it.

### Cron Job Log
A history of every scheduled background job execution: the streak reset cron (runs daily at midnight), the leaderboard snapshot (runs hourly), and any other scheduled tasks. Each entry shows when the job ran, how long it took, how many records it processed, and whether it succeeded or failed. If streaks aren't resetting correctly, this log shows exactly what the job did (or failed to do) the last time it ran.

### Queue Monitor
A dashboard showing the current state of the background job queue — jobs waiting to be processed, jobs currently being processed, jobs that completed successfully, and jobs that failed. For each failed job, the developer can see the error and retry the job manually. This is essential for catching situations where an event fired (user completed a quiz) but the downstream job (award XP, check badge conditions) failed silently without the student or admin knowing.

### DB Query Log
A log of slow database queries — any query that took longer than a configurable threshold (e.g., 200ms) is flagged. Each entry shows the exact SQL query, how long it took, and the context that triggered it. This is a performance tool. If the leaderboard page starts loading slowly, the developer opens this log and immediately sees "this query is doing a full table scan because there's no index on the score column." The fix is then obvious.

### Storage Log
A record of every file upload and deletion on Cloudflare R2. When an admin uploads a video lesson, that's logged. When a course is deleted and its content files are cleaned up, that's logged. If a file upload fails or a signed URL generation errors, it appears here. This prevents "orphaned files" — content on R2 that's no longer referenced by any lesson record — which cost money and create confusion.

---

## Section 2 — User & Account Tools

### Impersonate User
The developer can log in as any student without knowing their password. The developer's session temporarily takes on the student's identity — they see exactly what the student sees, in their exact state (their courses, their XP, their streak). This is the most powerful debugging tool in the developer's arsenal. When a student reports "my quiz result didn't save," the developer impersonates them, takes the quiz, and observes exactly what happens. No guessing, no "can you reproduce it?" emails to the student.

This feature must be used responsibly. It should only be used for debugging specific reported issues, never for curiosity or spying. Every impersonation event is logged in the audit log with the developer's identity and timestamp.

### Manually Award XP
The developer can add or subtract XP from any student's account, bypassing the normal earning flow. Used for: correcting XP that was lost due to a bug, compensating a student for a poor experience (a quiz didn't save, but they clearly completed it), or setting up realistic test data in a staging environment. The XP change is logged with a note about the reason.

### Reset Streak
Sets a student's streak counter back to zero. Used for testing the streak reset logic in production, or undoing a streak that was incorrectly preserved due to a bug. Like XP changes, this is logged.

### Force Badge Unlock
Grants any badge to any student immediately, regardless of whether the conditions are met. Used for testing badge display logic, compensating a student who should have earned a badge but didn't due to a bug, or demoing features to a stakeholder. All forced unlocks are logged.

### JWT Inspector
A tool that takes a JSON Web Token string (an access or refresh token) and decodes it, showing all its claims: who it belongs to, when it was issued, when it expires, and what role it grants. Also validates the token's signature to confirm it was genuinely issued by this application's signing key. Used for debugging auth issues — "this student says they're logged in but getting 401 errors; let me inspect their token and see if it's expired or malformed."

### Role Editor
Changes any user's role — from Student to Admin, from Admin to Developer, from Developer to Student. This is a destructive operation because the consequences are immediate and significant: granting someone Admin access gives them control over the entire student database. The UI requires explicit confirmation and all role changes are logged in the audit log. This tool should be used sparingly and only when there's a genuine operational need to change someone's access level.

### Hard Delete User
Permanently and completely purges a user from the system — their account, all progress data, all quiz attempts, all payment records, all activity logs. This is the nuclear option, used only for GDPR right-to-erasure requests or confirmed fraudulent accounts. Unlike the admin's "Delete Student" action (which may preserve payment records for accounting), the developer's hard delete removes everything. The UI requires typing the exact email address to confirm before executing.

### Audit Log
A chronological, immutable record of every significant action taken by admins and developers: who logged in, who edited which course, who deleted which student, who issued a refund, who changed a role, who impersonated a user. Each entry includes the actor's identity, the action taken, the affected record, and the timestamp.

The audit log is the accountability system for the entire admin and developer interface. It answers "who did this?" for any change made to the system. It cannot be deleted or edited — even by a developer. Its value comes entirely from its completeness and immutability.

---

## Section 3 — Payment & Finance Debug

### Raw Webhook Payload
For any transaction in the payment log, the developer can view the exact JSON object that Razorpay sent to the webhook endpoint. This is unprocessed, unformatted raw data — exactly as Razorpay sent it. Used when there's ambiguity about what information Razorpay included and whether the platform correctly parsed it. If the enrollment logic ran but granted access to the wrong course, examining the raw payload often reveals why — perhaps the course ID field had an unexpected format.

### Retry Failed Payment
When a webhook was received but the platform's processing logic failed (e.g., the database was temporarily unavailable, a bug caused an exception), the webhook event is marked failed in the log. The developer can select any failed webhook event and re-trigger its processing logic — essentially running the handling code again on the same payload, now that whatever caused the failure has been fixed. This avoids having to ask the student to pay again.

### Test Payment Mode
A toggle that switches the Razorpay integration between test mode (using test API keys, where no real money moves) and live mode (using production keys, where real money is charged). Switching to test mode allows the developer to exercise the entire payment flow — including webhooks — with Razorpay's test card numbers, without touching real student payments. Switching to live mode makes the platform ready for real transactions. This toggle requires explicit confirmation because accidentally leaving it in test mode on a production environment means real students can "pay" without money actually moving.

### Payment Reconciliation
A comparison report that checks the platform's payment database against Razorpay's records for a given time period. For every payment the platform thinks was successful, it verifies that Razorpay also recorded it as successful, for the same amount, at the same time. Discrepancies — payments in the platform database not in Razorpay, or Razorpay payments not reflected in the platform — are flagged for review. This is a financial integrity check. Running it monthly ensures the platform's revenue records are accurate and there are no ghost enrollments or lost revenue.

### Force Enrollment
Grants a student access to a course at the database level, completely bypassing the payment system. No payment record is created. This is the developer's version of manual enrollment, used for internal test accounts, demonstrations, or emergency access in cases where payment processing is broken. Because no financial record is created, it must be used carefully — it's a debugging and testing tool, not an operational one. All force enrollments are logged.

---

## Section 4 — System & Infrastructure

### Environment Config
A read-only view of all environment variable names configured on the server — the names only, never the values. This tells the developer at a glance whether a required configuration key is present (e.g., is RAZORPAY_SECRET_KEY set? Is DATABASE_URL present?). Used to diagnose "why is this integration not working?" without needing to shell into the server. Values are never shown because they're secrets — API keys, database passwords — that should never appear in any UI.

### DB Health Check
A live status check of the database connection: is the connection active? How many connections are in the pool? How many are currently in use? What is the ping latency to the database server? A healthy database pool running at capacity is a sign the application may be hitting its connection limit — a common cause of intermittent 500 errors under load. This gives the developer a real-time view of database health without needing to access the database server directly.

### Cache Inspector
A browser for the Redis cache — showing what keys currently exist, their values, and their TTL (Time To Live, the number of seconds until they expire automatically). Used to verify that caching is working correctly: "Is the leaderboard being cached? What's its TTL? Has it been invalidated after a score update?" and to manually delete a stale cache key if needed. Cache bugs are notoriously difficult to diagnose without this kind of visibility.

### Storage Browser
A file tree view of the Cloudflare R2 bucket — showing all uploaded content files organized in their folder structure. The developer can see what files exist, their sizes, and when they were uploaded. Used to verify that course content was uploaded correctly, to identify orphaned files (files that exist in storage but aren't referenced by any lesson), and to manually review what's in the bucket without needing to log into the Cloudflare dashboard. Critically, this is a read-only browser — the developer can see files but the UI does not allow deletion (to prevent accidental content loss).

### Seed Database
A controlled action that populates the database with realistic test data — a set of fake student accounts, quiz attempts with varied scores, course enrollments at different stages of progress, and payment records with a mix of successful and failed statuses. This is used in the staging/development environment to create a realistic-looking dataset for testing features without needing real student data. Running it in production would be catastrophic — the UI requires typing "SEED" to confirm and only works when the environment is flagged as staging.

### Feature Flags
A management interface for toggling features on and off without deploying new code. Each feature flag has a name, a description, and an enabled/disabled state. When a flag is disabled, the associated feature is hidden or inactive for all users. This allows the development team to: ship new code in a "dark" state (deployed but off), gradually roll out features (enable for 10% of users), instantly disable a feature if it causes problems, and test features with specific admin or developer accounts before exposing them to students.

### Run Migration
Triggers the Drizzle ORM database migration tool to apply any pending schema changes to the database. A migration might add a new column, create a new table, or modify an index. This is one of the most dangerous operations in the developer panel — a bad migration can corrupt data, make the application crash, or lock database tables causing downtime. The UI requires typing "MIGRATE" to confirm, shows exactly which migration files will be applied, and is disabled entirely in the production environment during peak hours. It should only be run during a planned maintenance window.

### System Health
A real-time dashboard showing the uptime and current status of all critical services: the API server (is it responding?), the database (is it connected and accepting queries?), the Redis cache (is it reachable?), the file storage (is R2 responding?), and the email service (is Resend sending successfully?). Each service shows green/yellow/red status and the time of the last successful health check. This is the developer's first stop when something is wrong — it tells them in 5 seconds whether the issue is widespread (multiple services red) or isolated (one service yellow).

---

## Section 5 — Analytics & Reporting (Developer)

### PostHog Events
A raw stream of all product analytics events captured by PostHog: every page view, every button click, every quiz started, every checkout initiated. The developer can filter by event type, by user, by date range, and build custom funnels — for example, "of everyone who viewed the Course Detail page, what percentage clicked Buy, and what percentage completed payment?" These funnels identify where users are dropping off in key conversion flows.

### Performance Metrics
API response time percentiles: P50 (the median response time — half of all requests are faster than this), P95 (95% of requests are faster than this), and P99 (99% of requests are faster than this). P95 and P99 are the important ones — they reveal the worst-case experience real users have. A P50 of 80ms looks fine, but a P99 of 4000ms means 1 in 100 requests takes 4 seconds. That's a real user experience problem hiding in the averages.

### Error Rate Chart
A time-series chart of the percentage of API requests that returned a 5xx status code (server errors) over time. A healthy application has a near-zero error rate. A spike — even a small one — during a specific time window is a signal to investigate what was happening then. Was a new deployment rolling out? Was the database under high load? Did a specific feature get a sudden spike of traffic? The chart makes these correlations visible.

### Retention Cohorts
A cohort analysis showing what percentage of students who signed up in a given week were still active (logged in at least once) one week later (week-1 retention) and four weeks later (week-4 retention). These are the most important long-term health metrics for any subscription or high-value educational product. If week-1 retention is 60% but week-4 retention is 15%, students are trying the product but not sticking — a sign that the onboarding experience needs improvement or the content isn't delivering enough value to keep them coming back.

---

## Summary: Permission Hierarchy

| Feature Area | Student | Admin | Developer |
|---|---|---|---|
| Own profile & settings | ✅ | ✅ | ✅ |
| Take quizzes & courses | ✅ | — | — |
| View leaderboard | ✅ | ✅ | ✅ |
| Manage students | — | ✅ | ✅ |
| Manage courses & quizzes | — | ✅ | ✅ |
| View payments & refunds | — | ✅ | ✅ |
| Issue refunds | — | ✅ | ✅ |
| Edit site content | — | ✅ | ✅ |
| System logs | — | — | ✅ |
| Impersonate users | — | — | ✅ |
| Payment debug tools | — | — | ✅ |
| Infrastructure controls | — | — | ✅ |
| Audit log | — | — | ✅ |
| Feature flags | — | — | ✅ |
| Analytics (raw) | — | — | ✅ |

---

*This document covers every feature in the LMS role-based feature map — Student (27 features), Admin (40 features), Developer (27 additional features). Total: 94 distinct features across 3 roles.*
