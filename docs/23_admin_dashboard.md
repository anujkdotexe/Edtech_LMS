# 23. Admin Dashboard Architecture

This document describes the upgraded administrative panel layout, navigation structure, student CRM, drag-and-drop syllabus composition, and course drop-off analytics.

---

## 1. Unified Vertical Sidebar Layout

To handle an expanding suite of pages without visual clutter, the Admin panel uses a responsive vertical sidebar layout configured directly inside the application layout:

- **Top Bar**: Minimal workspace header with brand identity, real-time environment status badge, and role-specific profile dropdown containing links to dashboard subdivisions.
- **Vertical Navigation Sidebar**: Dedicated persistent column featuring links to:
  - **Dashboard Overview**: Primary cockpit grid showing telemetry.
  - **Students CRM**: Searchable, paginated directory with action controls.
  - **Courses (CMS)**: Interactive course creator and lesson reorder console.
  - **Quizzes**: Interactive quiz builder and question manager.
  - **Payments**: Accounting logs displaying successful, failed, and pending checkouts.
  - **Site Settings**: Settings controls for announcement banners and daily rotating tip sheets.
  - **Student View Link**: Instantly jump into a simulation of the student home experience.

---

## 2. Dynamic Drag-and-Drop Course Builder (CMS)

To give admins rapid control over syllabus composition:
- **Interface**: Accordion listing modules. Inside each module, lessons are displayed as interactive card rows.
- **Ordering Mechanics**: Drag-and-drop order helpers let admins quickly rearrange lessons.
- **Sync Trigger**: Drag endings instantly update sequential `orderIndex` positions in a transaction using the backend endpoint `PUT /api/admin/modules/:moduleId/reorder-lessons`.

---

## 3. Student CRM Modals

The Student CRM contains multiple interactive overlay modals supporting secure, non-destructive administrative interventions:

- **Add Single Student**: Quick onboarding modal generating random 8-character credentials and flagging account for a required password change upon first login.
- **Bulk Assign Courses**: Grant immediate zero-cost catalog access to multiple checked students.
- **Revoke Course Access**: Terminate active course access, resetting order status to `REFUNDED`.
- **Send Message Modal**: Direct messaging console printing email body content to standard system outputs for immediate delivery auditing.

---

## 4. Drop-off Analytics Cockpit

Inside each course details card, admins can access a **Drop-off Analytics Cockpit** providing visual drop-off ratios per lesson. The system tracks how many enrolled students successfully completed each sequential lesson:
- **Telemetry**: Displays total enrolled learners, total syllabus depth, and exact completion rates.
- **Drop-off Rate**: Highlights drop-off differences between subsequent items, pointing out potential learning blocks or overly complex exercises.
