# CHAPTER IV — Diagram Outlines (Drawing Blueprints)

Use these outlines as step-by-step specs to draw each figure in draw.io, Figma, or Canva. Shapes notation follows standard conventions: rectangle = entity/process box, rounded rectangle/circle = process, open-ended rectangle = data store (DFD), oval = use case (UML), cylinder = database, arrow = data/control flow.

---

## Figure 4.1 — Agile Model

Central cycle of 5 stages drawn as a circle (arrows connecting each stage clockwise), with an outer loop labeled "Feedback after each sprint":

1. **Requirements** — Gather community health needs (Odiongan RHU data, patient privacy needs)
2. **Planning** — Sprint planning, backlog of features
3. **Design** — Wireframes/mockups (Figma), database schema
4. **Development** — Build in React/Supabase increments
5. **Testing & Deployment** — Functional testing, deploy via Vercel

→ Cycle repeats each sprint. Add small annotations: "Stakeholder feedback" feeding back into Requirements, "Working software delivered each sprint."

---

## Figure 4.2 — Fishbone Diagram

Spine: horizontal arrow pointing right to a **head box: "Rising HIV/AIDS Cases in Odiongan / Delayed Platform Delivery"**. Six diagonal bones branching to the spine, each with sub-causes:

| Bone | Sub-causes |
|---|---|
| **People** | Stigma discourages users from testing; limited number of health workers; varying digital literacy of residents |
| **Methods** | Manual/paper-based appointment records; no centralized information source; scattered reporting |
| **Technology** | Limited internet connectivity in rural areas; no existing local web platform; data privacy constraints |
| **Management** | Limited budget/funding; time constraints of capstone schedule; coordinating with RHU schedules |
| **Materials** | Insufficient printed IEC materials; outdated educational brochures |
| **Environment** | Social stigma in small community; distance of treatment hubs |

---

## Figure 4.3 — Gantt Chart

Rows = tasks, columns = months (e.g., Jun–Nov 2025 or your actual dates). Horizontal bars spanning the active months per task:

| Task | Suggested span |
|---|---|
| Title approval & proposal defense | Month 1 |
| Requirements gathering / interview with RHU | Months 1–2 |
| System analysis (DFDs, use cases, ERD) | Months 2–3 |
| UI/UX design in Figma | Month 3 |
| Front-end development (React) | Months 3–5 |
| Back-end / database (Supabase, API) | Months 4–5 |
| Alpha testing & revision | Month 5 |
| Beta testing with target users | Month 6 |
| Documentation & final defense | Month 6 |

Shade completed bars darker to show actual progress at time of submission.

---

## Figure 4.4 — Context Diagram (Level 0 DFD)

One large rounded rectangle in the center: **"HIVeLink Web-Based HIV/AIDS Awareness and Support Platform (Process 0)"**. Four external entities as rectangles around it, with labeled data-flow arrows (both directions):

- **Guest** → `browsing requests, inquiry details`; ← `educational content, testing facility info, partner org directory`
- **Patient** → `credentials, appointment request, chat messages, support group posts`; ← `account confirmation, booking status, health worker replies`
- **Health Worker** → `approval decisions, chat replies, supervision posts`; ← `pending requests, patient messages, group messages`
- **Admin** → `user/content/facility/service updates`; ← `user records, inquiries, activity logs, reports`

(Supabase database can optionally be shown beneath the central process connected by a dashed line labeled "persistent storage.")

---

## Figure 4.5 — DFD Level 1: Patient Perspective

Top: external entity **Patient**. Main process chain as numbered circles/rounded rectangles:

1. **1.0 Authentication** ⇄ D1 **Users DB** (verifies email/password hash)
2. **2.0 View Educational Content** ⇄ D2 **EducationalResources DB**
3. **3.0 Locate Testing Facility** ⇄ D3 **TestingFacilities DB**
4. **4.0 Manage Appointment Requests** → D4 **Appointments DB** (create/update/cancel)
5. **5.0 Exchange Chat Messages** ⇄ D5 **ChatSessions DB** / **ChatMessages DB**
6. **6.0 Participate in Support Group** ⇄ D6 **SupportGroupMembers DB** / **SupportGroupMessages DB** (posts stored under display alias, not real name)

Arrows from Patient entity to each process; the Authentication process (1.0) gates flow into 2.0–6.0.

---

## Figure 4.6 — DFD Level 1: Health Worker and Admin Perspective

Two lanes, both starting at **1.0 Authentication** ⇄ **Users DB**:

**Health Worker lane:**
- **2.0 Review Appointment Requests** ⇄ Appointments DB (approve/decline → status update flows back to Patient)
- **3.0 Respond to Chat Sessions** ⇄ ChatSessions/ChatMessages DB
- **4.0 Supervise Support Group** ⇄ SupportGroups/SupportGroupMessages DB (redact messages)

**Admin lane:**
- **6.0 Manage User Accounts** ⇄ Users/Patients/HealthWorkers DB
- **7.0 Manage Educational Resources** ⇄ EducationalResources DB
- **8.0 Manage Testing Facilities** ⇄ TestingFacilities DB
- **9.0 Manage Platform Services & Inquiries** ⇄ PlatformServices DB / PublicInquiries DB
- **10.0 View Reports & Audit Logs** ⇄ ActivityLogs DB

---

## Figure 4.7 — Use Case Diagram: Guest and Patient

System boundary box: **"HIVeLink"**.

- **Actor: Guest (stick figure, outside left)** — ovals: *Browse HIV/AIDS Information*, *View Testing Facility Map*, *View Partner Organizations*, *Send Public Inquiry*
- **Actor: Patient (outside left, connected to Guest by generalization arrow "inherits")** — additional ovals: *Register/Login*, *Request Appointment* («include» → *Authenticate*), *Chat with Health Worker*, *Join Support Group Anonymously (alias)*, *Update Profile*

Dashed «include» arrows from every secure use case to a shared **Authenticate** use case.

---

## Figure 4.8 — Use Case Diagram: Health Worker and Administrator

Same boundary box "HIVeLink".

- **Actor: Health Worker** — ovals: *Review/Approve Appointment Requests*, *Respond to Chat Sessions*, *Supervise Support Group (redact messages)*
- **Actor: Admin (actor)** — ovals: *Manage User Accounts*, *Manage Health Worker Profiles*, *Manage Educational Resources*, *Manage Testing Facilities*, *Manage Platform Services*, *Manage Partner Organizations*, *Handle Public Inquiries*, *View Reports/Audit Logs*, *Email Users*

Show one shared oval *Authenticate* with «include» arrows from both actors' secured use cases.

---

## Figure 4.9 — ERD (entities and relationships to draw)

Entities (from the Data Dictionary) and cardinalities — crow's foot notation:

| Relationship | Cardinality |
|---|---|
| USERS — PATIENTS | 1 : 1 |
| USERS — HEALTHWORKERS | 1 : 1 |
| HEALTHWORKERS — PATIENTS (assigned_worker_id) | 1 : N |
| TESTINGFACILITIES — HEALTHWORKERS (primary_facility_id) | 1 : N |
| TESTINGFACILITIES — PATIENTS (preferred_facility_id) | 1 : N |
| PATIENTS — APPOINTMENTS | 1 : N |
| HEALTHWORKERS — APPOINTMENTS | 1 : N |
| TESTINGFACILITIES — APPOINTMENTS | 1 : N |
| PATIENTS — CHATSESSIONS | 1 : N |
| HEALTHWORKERS — CHATSESSIONS | 1 : N |
| CHATSESSIONS — CHATMESSAGES | 1 : N |
| USERS — CHATMESSAGES (sender) | 1 : N |
| HEALTHWORKERS — SUPPORTGROUPS (facilitator) | 1 : 1 |
| SUPPORTGROUPS — SUPPORTGROUPMEMBERS | 1 : N |
| PATIENTS — SUPPORTGROUPMEMBERS | 1 : N |
| SUPPORTGROUPS — SUPPORTGROUPMESSAGES | 1 : N |
| SUPPORTGROUPS — SUPPORTGROUPMEMBERS — SUPPORTGROUPMESSAGES | (alias-based; no user FK on messages) |
| PUBLICINQUIRIES — HEALTHWORKERS (assigned) | 0/1 : N (optional) |
| USERS — ACTIVITYLOGS | 1 : N |

Draw standalone entities (no FK): EDUCATIONALRESOURCES, PARTNERORGANIZATIONS, PLATFORMSERVICES, SYSTEMSETTINGS. Place USERS at the center since almost every entity traces back to it.

---

## Figure 4.20 — Workflow Diagram

Top-down flowchart:

1. **Start** → **Visit HIVeLink (public guest view)** → decision diamond: **"Needs an account?"**
   - No → path: **Browse Information / View Testing Map / Send Inquiry** → **End session**
   - Yes → **Login / Register (email verification)** → decision: **"Role?"**
     - **Patient** → Patient Dashboard → branches: *Request Appointment*, *Chat with Health Worker*, *Join Support Group (alias)*, *Update Profile* → **Logout**
     - **Health Worker** → Worker Dashboard → branches: *Approve/Decline Appointments*, *Respond to Chats*, *Moderate Support Group* → **Logout**
     - **Admin** → Admin Dashboard → branches: *Manage Users/Workers*, *Manage Content & Facilities*, *Manage Services & Partners*, *Handle Inquiries*, *View Reports/Logs* → **Logout**
2. All three role paths converge to **Secure Logout → End**.

Use: oval = start/end, rectangle = process, diamond = decision, parallelogram = input/output.

---

## Reminders

- Figures 4.10–4.19 are **screenshots** of the running app, not drawn diagrams — capture them from `npm start` at http://localhost:3000 in the order listed in the chapter.
- Figures 4.2 (fishbone) and 4.3 (Gantt) must reflect your **actual** dates/tasks; adjust the suggested spans above.
- Keep consistent terminology across all diagrams: Guest, Patient, Health Worker, Admin — and always call facilities "Testing Facilities," never "Testing Centers."
