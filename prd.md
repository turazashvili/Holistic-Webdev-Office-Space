## Product Requirements Document (Revised)

### 1. Overview

**Product Name:** Smart Day‑Starter Dashboard
**Challenge Prompt:** Holistic Webdev: Office Space
**Goal:** Build a professional, feature‑rich intranet homepage that streamlines daily workflows for employees by surfacing critical information and tools in one cohesive dashboard.

---

### 2. Objectives

* **Primary:** Showcase frontend expertise (HTML/CSS/JS) through a polished, intuitive dashboard.
* **Secondary:** Prioritize practical intranet utility over decorative elements.
* **Success Criteria:**

  * Achieve top‑3 in judging for usability and code quality.
  * Lighthouse: ≥ 90 Performance, ≥ 95 Accessibility.
  * Responsive design across desktop, tablet, mobile.

---

### 3. Target Users & Personas

| Persona         | Role                   | Needs                                                           |
| --------------- | ---------------------- | --------------------------------------------------------------- |
| **Manager Mia** | Team Lead              | Overview of team tasks, approvals pending, and announcements.   |
| **Staff Steve** | Individual Contributor | Quick access to project boards, timesheets, and company news.   |
| **IT Ingrid**   | Technical Support      | Dashboard metrics to monitor system health and support tickets. |

---

### 4. Core Features

1. **Announcements & Alerts**

   * **Description:** Companywide banners for critical updates (e.g., policy changes, system downtime).
   * **Behavior:** Dismissible; auto‑expires based on expiration date.
   * **Accessibility:** ARIA `role="alert"`, keyboard focus.

2. **Task & Approval Summary**

   * **Description:** Lists pending approvals (time off, expense reports) and task assignments.
   * **Behavior:** Fetches from mock JSON; links to relevant forms.
   * **Accessibility:** Semantic table with `aria-label`, keyboard row navigation.

3. **Resource Quick Launch**

   * **Description:** Grid of customizable icons linking to internal tools (HR portal, code repo, ticketing).
   * **Behavior:** Drag‑to‑reorder; add/remove shortcuts.
   * **Accessibility:** Focusable icons with visible outlines and labels.

4. **Team Calendar Snapshot**

   * **Description:** Mini calendar showing today’s meetings and deadlines.
   * **Behavior:** Hover shows event details; click opens full calendar.
   * **Accessibility:** `<table>` structure, keyboard navigation.

5. **Support Ticket Dashboard**

   * **Description:** Shows top 5 open tickets assigned to the user or team.
   * **Behavior:** Color‑coded statuses; auto‑refresh every 5 minutes.
   * **Accessibility:** Color contrast compliant; screen‑reader labels.

---

### 5. User Stories

* **As Mia**, I want to see urgent company announcements immediately, so I can act accordingly.
* **As Steve**, I want one‑click access to my tasks and tools, so I can maximize productivity.
* **As Ingrid**, I want visibility into open tickets, so I can prioritize support effectively.

---

### 6. Non‑Functional Requirements

* **Performance:**

  * FCP ≤ 1s on 4G; JS bundle ≤ 100 KB gzipped.
* **Accessibility:**

  * WCAG 2.1 AA; full keyboard and screen‑reader support.
* **Internationalization:**

  * Support for English and one RTL language (e.g., Arabic).
* **Browser Support:**

  * Latest Chrome, Firefox, Safari, Edge; graceful fallback in IE11.

---

### 7. Tech Stack & Architecture

* **HTML/CSS:** Semantic markup, BEM conventions, CSS Grid/Flexbox.
* **JavaScript:** ES6 modules, minimal dependencies.
* **State Management:** LocalStorage + simple pub/sub for realtime sections.
* **Build & Tooling:** Rollup or Vite for bundling; Lighthouse CLI for audits.

---

### 10. Data & Storage Management

**Objective:** Define how user-generated data (e.g., support tickets, shortcuts) is persisted during the demo and provide a path for real-backend integration.

1. **Demo Persistence (Frontend-Only):**

   * Leverage **LocalStorage** for CRUD operations:

     * **Create:** On ticket submission, serialize ticket object and append to localStorage array.
     * **Read:** Widgets fetch from localStorage on load or at refresh intervals.
     * **Update/Delete:** Provide in-UI controls to edit or remove tickets, syncing changes back to localStorage.
   * Encapsulate storage access in a **StorageService** module with methods `getTickets()`, `addTicket()`, `updateTicket()`, and `deleteTicket()`.

2. **Mock API Simulation (Optional):**

   * Use **json-server** or **MirageJS** to simulate REST endpoints, allowing `fetch()`-style code without a real backend.
   * Configure routes `/api/tickets`, `/api/shortcuts`, etc., backed by an in-memory data set for realistic HTTP interactions.

3. **Production Integration Path:**

   * Abstract storage layer so switching from LocalStorage to real **REST API** or **GraphQL** backend requires minimal code changes.
   * Use the same StorageService interface, swapping implementations:

     * **Frontend Demo:** LocalStorageAdapter
     * **Production:** ApiAdapter that issues `fetch()` calls to real endpoints and handles authentication tokens.

---

### 8. Project Timeline

| Phase             | Deliverable                     | Deadline (PT)    |
| ----------------- | ------------------------------- | ---------------- |
| Planning & Design | Wireframes & Style Guide        | July 16          |
| Layout & Shell    | Responsive HTML/CSS framework   | July 19          |
| Data Widgets      | Announcements, Tasks, Calendar  | July 23          |
| Interactivity     | Quick Launch, Ticket Refresh    | July 25          |
| Testing & Polish  | QA, Accessibility & Performance | July 26          |
| Submission Prep   | Embed demo + DEV post draft     | July 27 11:59 PM |

---

### 9. Success Metrics

* **Lighthouse Scores:** ≥ 90 Performance; ≥ 95 Accessibility.
* **Peer Feedback:** Positive responses on UX and code quality.
* **Judges’ Criteria:** Responsiveness, usability, creativity, code quality.

---

**Next Steps:**

1. Review feature list and adjust priorities.
2. Finalize mock data schemas for widgets.
3. Confirm design tokens (colors, typography) for branding consistency.

*Let me know which area to refine further!*
