# CHAPTER IV — Diagram Outlines (Drawing Blueprints)

Use these outlines as drawing instructions for draw.io, Figma, or Canva. Keep the labels and roles consistent with the current app.

**Shape key:** For a DFD, use a circle for each process, a rectangle for each external entity, an open-ended rectangle for each data store, and a labeled arrow for each data flow. For a use-case diagram, use stick figures for actors, ovals for use cases, and a system-boundary rectangle. For the context diagram, use one central circle for the whole system.

---

## Figure 4.1 — Agile Model

Draw five process boxes in a clockwise loop and connect each box with a directional arrow. Add a larger return arrow from **Testing and Review** to **Requirements** labeled **Feedback for the next iteration**.

1. **Requirements** — Gather community health needs (Odiongan RHU data, patient privacy needs)
2. **Planning** — Sprint planning, backlog of features
3. **Design** — Wireframes/mockups (Figma), database schema
4. **Development** — Build in React/Supabase increments
5. **Testing and Review** — Run functional tests and review the working increment; prepare a production deployment through Vercel when approved

Label the loop **Repeat for the next iteration**. Add the note **Working software is reviewed after each iteration**. Do not imply that every development sprint automatically results in a production release.

---

## Figure 4.2 — Fishbone Diagram

Draw one horizontal spine ending at a right-facing problem box labeled with the study's approved problem statement. Use six cause branches. The following causes are suggestions; keep only those supported by the proponents' needs assessment and replace or remove the rest.

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

Create a timeline using the project's actual start/end dates. Put tasks in rows and actual weeks or months in columns; show each task's duration with a horizontal bar. These task ranges are examples only:

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

Replace the example months with actual dates, and shade completed tasks differently from planned or in-progress tasks.

---

## Figure 4.4 — Context Diagram (Level 0 DFD)

Draw **one central circle** labeled **HIVeLink — HIV/AIDS Awareness Web Platform (Process 0)**.

Place exactly three external-entity rectangles around the circle:

- **User** on the left (represents both Guest and Patient)
- **Health Worker** below or at the lower left
- **Administrator** on the right

Draw separate, solid, directional arrows for the data entering and leaving the system. Every arrow must connect an external entity directly to the central circle. Do not draw internal processes, databases, data stores, or entity-to-entity arrows.

| Entity | Inputs to HIVeLink (arrow points to circle) | Outputs from HIVeLink (arrow points to entity) |
|---|---|---|
| **User** | `Browsing request`; `Login or registration details`; `Appointment request`; `Appointment edit or cancellation`; `Private chat message`; `Support-group join or post`; `Support inquiry` | `HIV information`; `Testing-facility information`; `Account verification and UIC information`; `Appointment status`; `Private chat response`; `Support-group updates`; `Inquiry acknowledgement` |
| **Health Worker** | `Login credentials`; `Patient care update`; `Availability update`; `Private chat reply`; `Support-group message or moderation action` | `Assigned patient information`; `Appointment schedule`; `Patient chat messages`; `Support-group messages and membership information` |
| **Administrator** | `Login credentials`; `User and health-worker account changes`; `Appointment approval, assignment, reschedule, or cancellation`; `Platform-service availability change`; `Support-group supervisor assignment`; `Email message` | `User and health-worker records`; `Appointment request details`; `Platform-service status`; `Support-group configuration`; `Activity logs and dashboard reports`; `Email delivery result` |

Use noun phrases as arrow labels (for example, **Appointment request**, not “send appointment request”). Draw multiple arrows per entity as needed to keep every label readable. The administrator does not manage HIV content or testing-facility records through the current dashboard; do not show those as Administrator inputs.

**Layout suggestion:** User left, Administrator right, and Health Worker below the central circle, matching the reference image. Keep the system circle unobstructed and route arrows around its edge.

---

## Figure 4.5 — DFD Level 1: Patient Perspective

Draw **Patient** as the external entity on the left. Draw six numbered process circles in the center and the required data stores on the right. Show labeled data-flow arrows, not control-flow arrows.

1. **1.0 Authenticate Patient**
   - Patient → process: `UIC and password`, registration information, verification or recovery request
   - Process ⇄ **D1 Users** and **D2 Patients**
   - Process → Patient: authentication result, verification result, UIC email or recovery response
2. **2.0 View HIV Information**
   - Patient → process: `Information-page request`
   - Process → Patient: `HIV topics`, `source links`, `educational media`
   - The topic text and media are part of the application interface. The current database has no EducationalResources table; do not draw one.
3. **3.0 View Testing-Facility Information**
   - Patient → process: `Testing-facility request`
   - Process → Patient: `Facility names and map`, `contact and referral guidance`
   - Include **D3 TestingFacilities** only for facility records read from the database; fixed map annotations or external map links should not be shown as database writes.
4. **4.0 Manage Appointment Request**
   - Patient → process: `New appointment request`, `Edit request`, or `Cancellation`
   - Process ⇄ **D4 Appointments**; process reads **D3 TestingFacilities** to offer active facilities
   - Process → Patient: `Appointment status`
   - Patients can create requests and edit or cancel requests while their status allows it; the Administrator reviews, approves, assigns, or reschedules them.
5. **5.0 Exchange Private Chat Messages**
   - Patient → process: `Chat message`
   - Process ⇄ **D5 ChatSessions** and **D6 ChatMessages**
   - Process → Patient: `Health-worker reply` and `Chat update`
6. **6.0 Participate in Support Group**
   - Patient → process: `Join request and alias`, `Leave request`, or `Group message`
   - Process ⇄ **D7 SupportGroupMembers** and **D8 SupportGroupMessages**
   - Process → Patient: `Membership result` and `Authorized group updates`
   - Messages show the member's chosen alias; the patient's account identity remains server-side.

All authenticated patient processes use the signed-in patient session. Do not depict authentication as a control signal; show the credential and authentication-result data flows only.

---

## Figure 4.6A — DFD Level 1: Health Worker Perspective

Draw **Health Worker** as the only external actor in this DFD. Use separate numbered circles for the worker processes and separate data-store symbols for each database table involved.

1. **1.0 Authenticate Health Worker** ⇄ **D1 Users**
2. **2.0 View and Claim Eligible Patients** ⇄ **D2 Patients**, **D3 HealthWorkers**, and **D4 TestingFacilities**
   - Claiming is limited to eligible unassigned patients associated with the worker's facility.
3. **3.0 View Assigned Appointment Schedule** ⇄ **D5 Appointments**
   - The worker views assigned appointments; appointment approval and assignment are not worker actions.
4. **4.0 Update Patient Care Details** ⇄ **D2 Patients**
   - Include only permitted care status and care-note updates.
5. **5.0 Respond to Private Chat** ⇄ **D6 ChatSessions** and **D7 ChatMessages**
6. **6.0 Supervise Support Group** ⇄ **D8 SupportGroups** and **D9 SupportGroupMessages**
   - Only the designated eligible supervisor can post as the supervisor or redact group messages.
7. **7.0 Update Availability** ⇄ **D3 HealthWorkers**

Connect the Health Worker only to these process circles. Label each arrow with the data exchanged. Patient and Administrator actors must not appear in this separate worker DFD.

---

## Figure 4.6B — DFD Level 1: Administrator Perspective

Draw **Administrator** as the only external actor in this DFD. Do not put Health Worker processes in this diagram.

1. **1.0 Authenticate Administrator** ⇄ **D1 Users**
2. **2.0 Review and Process Appointment Requests** ⇄ **D2 Appointments**, **D3 Patients**, **D4 HealthWorkers**, and **D5 TestingFacilities**
   - Show request review, approval with worker assignment, rescheduling, cancellation, and completion updates.
3. **3.0 Manage Accounts** ⇄ **D1 Users**, **D3 Patients**, and **D4 HealthWorkers**
   - Include account creation, viewing, editing, deletion, and verification-email actions as applicable.
4. **4.0 Assign Support-Group Supervisor** ⇄ **D6 SupportGroups** and **D4 HealthWorkers**
5. **5.0 Manage Platform-Service Availability** ⇄ **D7 PlatformServices**
6. **6.0 View Activity and Reports** ⇄ **D8 ActivityLogs**, **D2 Appointments**, **D1 Users**, and **D4 HealthWorkers**
7. **7.0 Send Email to Registered User** ⇄ **D1 Users**
   - Show the email provider as an external service only if the diagram's scope includes external systems; otherwise label the output `Email request`.

The current Administrator dashboard does not provide content-editor, testing-facility-editor, partner-directory, or public-inquiry-management processes. Do not draw those functions.

---

## Figure 4.7 — Use Case Diagram: Guest and Patient

Draw a system-boundary rectangle labeled **HIVeLink**. Place the **Guest** and **Patient** actors outside the boundary on the left. Keep them as separate actors; do not use a generalization arrow.

- Connect **Guest** to: *Browse HIV Information*, *View Testing-Facility Information*, *Open External Health References*, *Contact Support*.
- Connect **Patient** to those same public use cases, plus:
  - *Register with Email and Verify Account*
  - *Sign In with UIC and Password*
  - *Request Appointment*
  - *Edit or Cancel Eligible Appointment Request*
  - *View Appointment and Care History*
  - *Exchange Private Chat Messages*
  - *Join or Leave Support Group*
  - *Post Under Support-Group Alias*
  - *Update Profile*

Connect *Register with Email and Verify Account* to the Patient actor. The registration flow uses the patient's email address for verification and delivery of the UIC; patient sign-in uses the UIC and password, not the email address. Connect *Sign In with UIC and Password* to Patient. Mark the appointment, care-history, chat, support-group, and profile use cases as requiring a signed-in Patient session; do not draw repeated authentication «include» arrows. Do not include medication requests or a partner-organization directory.

---

## Figure 4.8 — Use Case Diagram: Health Worker

Draw a system-boundary rectangle labeled **HIVeLink**. Place only the **Health Worker** actor outside it. Inside, add these use-case ovals:

- *Sign In with Email and Password*
- *View Assigned Patients*
- *Claim Eligible Unassigned Patient*
- *View Appointment Schedule*
- *Update Patient Care Details*
- *Toggle Availability*
- *View Private Chat Inbox*
- *Respond to Patient Chat Messages*
- *Supervise Support Group*
- *Post as Supervisor*
- *Redact Support-Group Message*

Connect the Health Worker actor to each use case. Health Workers sign in with their registered email address and password; all other use cases require an authenticated Health Worker session. Only an eligible designated support-group supervisor can use the supervisor posting and redaction functions. Health Workers view appointment schedules; they do not approve or assign appointment requests.

---

## Figure 4.9 — Use Case Diagram: Administrator

Draw a separate system-boundary rectangle labeled **HIVeLink**. Place only the **Administrator** actor outside it. Inside, add:

- *Sign In with Email and Password*
- *Manage User Accounts*
- *Manage Health-Worker Accounts*
- *Review Appointment Requests*
- *Approve and Assign Appointment*
- *Reschedule or Cancel Appointment*
- *Manage Platform-Service Availability*
- *Assign Support-Group Supervisor*
- *View Activity Logs*
- *View Reports*
- *Send Email to Registered User*
- *Resend Verification Email*

Connect the Administrator actor to each use case. Administrators sign in with their registered email address and password; all other use cases require an authenticated Administrator session. Keep *View Activity Logs* and *View Reports* as separate use cases, matching the separate dashboard pages. Do not add content management, facility editing, partner management, or public-inquiry management; those are not current Administrator dashboard functions. Keep the Administrator diagram separate from Figure 4.8.

---

## Figure 4.10 — ERD (entities and relationships to draw)

Entities (from the Data Dictionary) and cardinalities — crow's foot notation:

| Relationship | Cardinality |
|---|---|
| USERS — PATIENTS | A User has 0..1 Patient profile; each Patient belongs to exactly 1 User |
| USERS — HEALTHWORKERS | A User has 0..1 Health Worker profile; each Health Worker belongs to exactly 1 User |
| HEALTHWORKERS — PATIENTS (`assigned_worker_id`) | A Health Worker has 0..N assigned Patients; a Patient has 0..1 assigned Health Worker |
| TESTINGFACILITIES — HEALTHWORKERS (`primary_facility_id`) | A facility has 0..N Health Workers; a Health Worker has 0..1 primary facility |
| TESTINGFACILITIES — PATIENTS (`preferred_facility_id`) | A facility has 0..N Patients; a Patient has 0..1 preferred facility |
| PATIENTS — APPOINTMENTS | A Patient has 0..N Appointments; each Appointment belongs to exactly 1 Patient |
| HEALTHWORKERS — APPOINTMENTS (`worker_id`) | A Health Worker has 0..N Appointments; an Appointment has 0..1 assigned Health Worker |
| TESTINGFACILITIES — APPOINTMENTS (`facility_id`) | A facility has 0..N Appointments; an Appointment has 0..1 facility |
| PATIENTS — CHATSESSIONS | A Patient has 0..N Chat Sessions; each Chat Session belongs to exactly 1 Patient |
| HEALTHWORKERS — CHATSESSIONS (`worker_id`) | A Health Worker has 0..N Chat Sessions; a Chat Session has 0..1 assigned Health Worker |
| CHATSESSIONS — CHATMESSAGES | A Chat Session has 0..N messages; each message belongs to exactly 1 Chat Session |
| USERS — CHATMESSAGES (`sender_user_id`) | A User sends 0..N messages; each message has exactly 1 sender |
| HEALTHWORKERS — SUPPORTGROUPS (`facilitator_worker_id`) | A Health Worker may supervise 0..N groups; a group has 0..1 designated supervisor. The app allows one active group. |
| SUPPORTGROUPS — SUPPORTGROUPMEMBERS | A group has 0..N memberships; each membership belongs to exactly 1 group |
| PATIENTS — SUPPORTGROUPMEMBERS | A Patient has 0..N memberships; each membership belongs to exactly 1 Patient |
| SUPPORTGROUPS — SUPPORTGROUPMESSAGES | A group has 0..N messages; each message belongs to exactly 1 group |
| USERS — ACTIVITYLOGS (`actor_user_id`) | A User has 0..N activity logs; a log has 0..1 associated User |
| HEALTHWORKERS — PUBLICINQUIRIES (`assigned_worker_id`) | A Health Worker may be assigned 0..N inquiries; an inquiry has 0..1 assigned Health Worker |

Draw **USERS**, **PATIENTS**, **HEALTHWORKERS**, **TESTINGFACILITIES**, **APPOINTMENTS**, **CHATSESSIONS**, **CHATMESSAGES**, **SUPPORTGROUPS**, **SUPPORTGROUPMEMBERS**, **SUPPORTGROUPMESSAGES**, **PUBLICINQUIRIES**, **PLATFORMSERVICES**, and **ACTIVITYLOGS** as entities. Only include tables present in the current schema.

Place USERS near the center, but do not draw an Admin table: Administrators are records in USERS distinguished by the `role` value. Support-group aliases and messages have no direct Patient or User foreign key. Membership access is enforced by application rules; do not draw a MEMBERS-to-MESSAGES relationship. Do not include **EMAILVERIFICATIONTOKENS**, **SYSTEMSETTINGS**, **EDUCATIONALRESOURCES**, **PARTNERORGANIZATIONS**, or medication tables; these are not part of the cleaned current schema.

---

## Figure 4.21 — Workflow Diagram

Draw the flowchart from top to bottom. Use an oval for Start/End, a rectangle for an action, a diamond for a decision, and a parallelogram for user input or system output.

1. **Start** → **Open HIVeLink** → **Public Home, Information, or Testing page**
2. Decision: **Sign in or create an account?**
   - **No** → continue browsing public pages → **End guest session**
   - **Create account** → **Register patient account** → **Verify email** → **Receive UIC** → **Sign in with UIC and password**
   - **Sign in** → enter credentials → decision **Account role?**
3. **Patient path**
   - **Patient dashboard** → choose one or more actions:
     - view HIV information or local Testing Facilities
     - request, edit, or cancel an eligible appointment request
     - exchange private chat messages
     - join/leave the support group and post under an alias
     - update profile or review care history
   - **Sign out** → End
4. **Health Worker path**
   - **Health Worker workspace** → view or claim eligible patients, view assigned appointment schedule, update permitted care details, toggle availability, or respond to private chats
   - If designated as the eligible group supervisor: supervise the support group and redact messages
   - **Sign out** → End
5. **Administrator path**
   - **Administrator dashboard** → manage user/worker accounts; review and process appointment requests; assign support-group supervisor; manage platform-service availability; view activity logs/reports; send or resend account email
   - **Sign out** → End

Only patient accounts are created through public registration. Health Worker and Administrator accounts are provisioned through authorized staff workflows; do not route them through patient registration. Keep the Health Worker and Administrator paths separate, and do not include medication, facility-editing, education-content-management, or partner-management actions.

---

## Reminders

- Figures 4.11–4.20 are **screenshots** of the running app, not drawn diagrams — capture them from `npm start` at http://localhost:3000 in the order listed in the chapter.
- Suggested screenshot sequence:
  - 4.11 Authentication module
  - 4.12 Guest Home page
  - 4.13 Guest Information page
  - 4.14 Guest Testing-Facility page
  - 4.15 Patient dashboard
  - 4.16 Patient appointment-request form
  - 4.17 Private chat
  - 4.18 Support-group panel
  - 4.19 Health-worker workspace
  - 4.20 Administrator dashboard
- Figures 4.2 (fishbone) and 4.3 (Gantt) must reflect your **actual** dates/tasks; adjust the suggested spans above.
- Keep consistent terminology across all diagrams: Guest, Patient, Health Worker, Administrator — and call facility records **Testing Facilities**.
- The current patient navigation is: **Home, Information, Testing, Private Chat, Support Groups**, with the care dashboard opened from the UIC/profile icon.
- The current health-worker navigation is: **Patients, Chats, Appointments, Groups**.
- The current administrator navigation is: **Overview, Users, Appointments, Health workers, Support group, Services, Activity logs, Reports, Settings**.
