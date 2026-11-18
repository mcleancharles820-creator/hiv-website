# CHAPTER IV
# METHODOLOGY

## A. Software Development Model

The development of HIVeLink, a Web-Based Platform for HIV/AIDS Awareness and Support, adopted the Agile Software Development Life Cycle (SDLC) model to address the dynamic requirements of a community health intervention where user needs evolve rapidly based on stakeholder feedback, local health data updates, and cultural sensitivities specific to Odiongan, Romblon. Unlike rigid waterfall methodologies, Agile's iterative approach enabled continuous refinement through two-week sprints, ensuring the platform remained relevant to the escalating HIV crisis (54 confirmed cases in Odiongan RHU, 2025).

Figure 4.1 Agile Model (Giuseppe, Ng 2018)

The adoption of Agile Software Development Life Cycle (SDLC) for HIVeLink aligns with established practices in Filipino IT capstone projects addressing community health challenges. Giuseppe and Ng (2018) demonstrate that Agile methodologies significantly enhance capstone outcomes in community-oriented initiatives by fostering continuous stakeholder collaboration, rapid iteration, and user-centered refinement, achieving 87% higher user satisfaction compared to traditional waterfall models. Similarly, the same study validates Scrum's effectiveness in Filipino capstone programs, documenting 92% on-time delivery rates through structured iterative sprints that accommodate evolving requirements.

Agile manifesto values individuals and interactions over processes, working software over documentation, customer collaboration over contract negotiation, and responding to change over following a plan directly addressed the dynamic nature of Odiongan's HIV response needs. The methodology's empirical process control through transparency, inspection, and adaptation enabled real-time adjustments to emerging local health data and cultural feedback. This is reflected in the platform's actual implementation, where features such as appointment scheduling, private real-time chat, the alias-based support group, UIC-based patient login, and Odiongan Rural Health Unit facility data were refined incrementally across multiple iterations based on review and feedback.

## B. Planning and Requirements Gathering Phase

### Fishbone Diagram

The fishbone diagram identifies the root causes of delays in web-based platform development by grouping them into categories such as People, Methods, Technology, and Management. It helps the team recognize potential issues early, allowing for better planning, resource allocation, and timely project completion.

Figure 4.2 Fish-Bone Diagram

Figure 4.2 illustrates the core problems addressed in the study concerning rising HIV/AIDS cases in Odiongan. The diagram shows that the primary challenge stems from a combination of institutional, technical, and social barriers that intensify the issue from different perspectives.

### Gantt Chart

A Gantt chart is a visual project management tool used to plan, schedule, and track tasks over a specific period of time. It displays project activities in a timeline format, where each task is represented by a bar that shows its start date, duration, and end date.

Figure 4.3 Gantt Chart

The Gantt Chart shows the phases of the project, including the specific tasks under each phase and their corresponding durations. This chart focuses on the development of HIVeLink, the Web-Based HIV/AIDS Awareness and Support Platform in Odiongan, outlining activities such as requirements gathering, system design, development, and testing to ensure the project is completed efficiently and on schedule.

## C. Analysis Phase

### Context Diagram and Other DFD Diagrams

A context diagram is a high-level visual representation of a system that shows how it interacts with external entities. In a capstone project, it is used to present the system as a single process and illustrate the flow of data between the system and its users or other external systems.

Figure 4.4 Context Diagram

Figure 4.4 illustrates the Context Diagram of HIVeLink, defining the system's scope and the data flows between the central platform and its external entities. The diagram contains one circular central process representing the entire HIVeLink system and three external entities: User, Health Worker, and Administrator. The User represents both guests and registered patients. Users provide browsing requests, public inquiries, login credentials, appointment requests, chat messages, and support-group posts. The system provides educational content, testing-facility information, account confirmation, UIC information, appointment status, chat responses, and support-group updates. Health Workers provide login credentials, chat replies, patient care updates, and support-group supervision. Administrators provide account and appointment decisions, facility changes, service configurations, and support-group assignments. The system returns assigned patient and appointment information, chat messages, user records, public inquiries, activity logs, and reports. Data stores and internal processes are excluded from this Level 0 diagram.

### Data Flow Diagram (DFD) Level 1

The Data Flow Diagram (DFD) Level 1 shows how data flows between the external entities, the main system processes, and the system databases of HIVeLink.

Figure 4.5 Data Flow Diagram (DFD) Level 1 – Patient Perspective

Figure 4.5 illustrates the Level 1 DFD of HIVeLink from the Patient perspective. The patient authenticates against the Users data, views HIV information embedded in the application, and reads testing-facility records. The signed-in patient can submit or manage eligible appointment requests, exchange private messages with a health worker, and join the private support group under a display alias. Patient, appointment, chat, and support-group records are read from or written to their respective data stores. The current schema has no educational-resource catalog table.

Figure 4.6A Data Flow Diagram (DFD) Level 1 – Health Worker Perspective

Figure 4.6A illustrates the Level 1 DFD of HIVeLink from the Health Worker perspective. The Health Worker authenticates using an email address and password. The authentication process validates the Health Worker account in the Users database. The Health Worker then retrieves assigned patient records, views the appointment schedule, responds to private chat sessions, updates permitted patient care details, and supervises the support group. Chat, patient, and support-group data are stored in their respective database tables. Appointment approval and assignment remain separate Administrator responsibilities.

Figure 4.6B Data Flow Diagram (DFD) Level 1 – Administrator Perspective

Figure 4.6B illustrates the Level 1 DFD of HIVeLink from the Administrator perspective. The Administrator authenticates using an email address and password, manages user and health-worker accounts, processes appointment requests, assigns the support-group supervisor, manages platform services, sends account email, and views reports and activity logs. These processes use the Users, Patients, HealthWorkers, Appointments, TestingFacilities, SupportGroups, PlatformServices, and ActivityLogs tables. Health Workers do not perform Administrator account-management or appointment-assignment operations.

### Use Case Diagram

A use case diagram is a visual representation that shows how users interact with a system and what actions the system provides. It highlights the system's functions from the user's perspective, showing different roles and their permissions. Its main purpose is to clarify user requirements and illustrate possible interactions between users and the system.

Figure 4.7 Use Case Diagram of Guest and Patient

Figure 4.7 illustrates the actions available to a Guest and a Patient of HIVeLink. Both can browse public HIV information, view local testing-facility information, and contact support. A patient registers using an email address and verifies that address to receive a UIC; the patient then signs in with the UIC and password. A signed-in patient can request or manage eligible appointment requests, review care history, exchange private messages with a health worker, join or leave the support group and post under an alias, and update the profile. Guest and Patient remain separate actors without a generalization relationship.

Figure 4.8 Use Case Diagram of Health Worker

Figure 4.8 illustrates the use cases of the Health Worker. The Health Worker signs in using the registered email address and password, views assigned patients and appointment schedules, claims eligible unassigned patients, responds to patient chat sessions, updates permitted care details, and changes availability. Only the eligible designated support-group supervisor can post as the supervisor or redact group messages. Health Worker use cases are shown separately from Administrator use cases.

Figure 4.9 Use Case Diagram of Administrator

Figure 4.9 illustrates the use cases of the Administrator. The Administrator signs in using the registered email address and password, manages user and health-worker accounts, reviews and processes appointment requests, assigns the support-group supervisor, manages platform-service availability, views activity logs and reports, and sends email to registered users or resends verification email. Keep *View Activity Logs* and *View Reports* separate to match the dashboard navigation. The Administrator use-case diagram is separate from the Health Worker diagram.

## D. Design Phase

### Entity-Relationship Diagram (ERD)

An Entity-Relationship Diagram (ERD) is a visual representation of a database that shows the entities (objects), their attributes (data fields), and the relationships between those entities. It is used in system design to plan and organize how data will be stored, connected, and managed in a database.

Figure 4.10 Entity-Relationship Diagram (ERD)

### Data Dictionary

**Table 4.1.1 Users Table**

| Field | Type | Key | Description |
|---|---|---|---|
| user_id | INT | PK | Unique identifier for the user |
| email | VARCHAR | | Unique email address used for registration, verification, and account messages; Health Workers and Administrators also use it to sign in |
| uic | VARCHAR | | Patient sign-in identifier, emailed after address verification; not used for Health Worker or Administrator accounts |
| password_hash | VARCHAR | | Securely hashed account password |
| full_name | VARCHAR | | User's full name (composed of first, middle, and last names) |
| role | ENUM | | User's role (patient, health-worker, or admin) |
| email_verified | BOOLEAN | | Indicates whether the user has verified the registered email address |
| age | INT | | User's age |
| gender | ENUM | | User's gender (Male, Female, Other) |
| contact_number | VARCHAR | | User's contact number |
| date_registered | DATETIME | | Date when the user registered |

**Table 4.1.2 Patients Table**

| Field | Type | Key | Description |
|---|---|---|---|
| patient_id | INT | PK | Unique identifier for the patient record |
| user_id | INT | FK | Foreign key referencing USERS |
| assigned_worker_id | INT | FK | Foreign key referencing HEALTHWORKERS (assigned doctor/nurse) |
| preferred_facility_id | INT | FK | Foreign key referencing TESTINGFACILITIES |
| care_status | ENUM | | Current status of the patient's care |
| medical_notes | TEXT | | Notes recorded by the health worker |

**Table 4.1.3 HealthWorkers Table**

| Field | Type | Key | Description |
|---|---|---|---|
| worker_id | INT | PK | Unique identifier for the health worker |
| user_id | INT | FK | Foreign key referencing USERS |
| specialty | VARCHAR | | Medical specialty of the health worker |
| license_number | VARCHAR | | Professional license number |
| primary_facility_id | INT | FK | Foreign key referencing TESTINGFACILITIES |
| is_available | BOOLEAN | | Availability status for consultations |

**Table 4.1.4 TestingFacilities Table**

| Field | Type | Key | Description |
|---|---|---|---|
| facility_id | INT | PK | Unique identifier for the facility |
| name | VARCHAR | | Name of the testing facility or treatment hub |
| facility_type | VARCHAR | | Type of facility (e.g., RHU, hospital) |
| address | VARCHAR | | Address of the facility |
| latitude / longitude | DECIMAL | | Map coordinates used by the facility map |
| contact_phone | VARCHAR | | Contact number of the facility |
| services_offered | VARCHAR | | Services offered by the facility |

**Table 4.1.5 Appointments Table**

| Field | Type | Key | Description |
|---|---|---|---|
| appointment_id | INT | PK | Unique identifier for the appointment request |
| patient_id | INT | FK | Foreign key referencing PATIENTS |
| worker_id | INT | FK | Foreign key referencing HEALTHWORKERS |
| facility_id | INT | FK | Foreign key referencing TESTINGFACILITIES |
| appointment_date | DATE | | Requested appointment date |
| appointment_time | VARCHAR | | Requested appointment time |
| appointment_type | VARCHAR | | Type of consultation or test |
| status | ENUM | | Current status (Requested, Approved, Declined, Completed) |

**Table 4.1.6 ChatSessions Table**

| Field | Type | Key | Description |
|---|---|---|---|
| chat_session_id | INT | PK | Unique identifier for the chat session (support ticket) |
| patient_id | INT | FK | Foreign key referencing PATIENTS |
| worker_id | INT | FK | Foreign key referencing HEALTHWORKERS |
| subject | VARCHAR | | Subject of the conversation |
| status | ENUM | | Session status (Open / Closed) |
| preview | VARCHAR | | Preview of the latest message |
| last_updated | DATETIME | | Timestamp of the most recent activity |

**Table 4.1.7 ChatMessages Table**

| Field | Type | Key | Description |
|---|---|---|---|
| message_id | INT | PK | Unique identifier for the message |
| chat_session_id | INT | FK | Foreign key referencing CHATSESSIONS |
| sender_user_id | INT | FK | Foreign key referencing USERS |
| sender_role | ENUM | | Role of the sender (patient or health worker) |
| message_text | TEXT | | Content of the confidential message |
| is_read | BOOLEAN | | Read receipt indicator |
| sent_at | DATETIME | | Timestamp when the message was sent |

**Table 4.1.8 SupportGroups Table**

| Field | Type | Key | Description |
|---|---|---|---|
| group_id | INT | PK | Unique identifier for the support group |
| name | VARCHAR | | Name of the support group |
| detail | TEXT | | Description of the support group |
| schedule | VARCHAR | | Meeting schedule of the group |
| facilitator_worker_id | INT | FK | Foreign key referencing HEALTHWORKERS (group supervisor) |
| is_active | BOOLEAN | | Indicates whether the group is active |

**Table 4.1.9 SupportGroupMembers Table**

| Field | Type | Key | Description |
|---|---|---|---|
| membership_id | INT | PK | Unique identifier for the membership |
| group_id | INT | FK | Foreign key referencing SUPPORTGROUPS |
| patient_id | INT | FK | Foreign key referencing PATIENTS (server-side only, never exposed) |
| display_alias | VARCHAR | | Anonymous alias shown to other members, unique per group |
| joined_at | DATETIME | | Date when the member joined the group |

**Table 4.1.10 SupportGroupMessages Table**

| Field | Type | Key | Description |
|---|---|---|---|
| message_id | INT | PK | Unique identifier for the group message |
| group_id | INT | FK | Foreign key referencing SUPPORTGROUPS |
| sender_alias | VARCHAR | | Alias of the sender (identity protected) |
| sender_role | ENUM | | Sender's role (member or supervisor) |
| message_text | TEXT | | Message content (maximum 2,000 characters) |
| is_redacted | BOOLEAN | | Indicates whether the message was moderated/redacted |
| sent_at | DATETIME | | Timestamp when the message was sent |

**Table 4.1.11 PublicInquiries Table**

| Field | Type | Key | Description |
|---|---|---|---|
| inquiry_id | INT | PK | Unique identifier for the public inquiry |
| first_name | VARCHAR | | First name of the inquirer |
| email | VARCHAR | | Email address of the inquirer |
| message | TEXT | | Message content of the inquiry |
| status | ENUM | | Handling status of the inquiry |
| assigned_worker_id | INT | FK | Foreign key referencing HEALTHWORKERS (assigned responder) |

**Table 4.1.12 ActivityLogs Table**

| Field | Type | Key | Description |
|---|---|---|---|
| log_id | INT | PK | Unique identifier for the activity log entry |
| actor_user_id | INT | FK | Foreign key referencing USERS |
| actor_name | VARCHAR | | Name of the user who performed the action |
| action | VARCHAR | | Description of the action performed |
| category | VARCHAR | | Category of the action |
| created_at | DATETIME | | Timestamp when the action occurred |

### Sample Screens and Report Layout Prototypes

Figure 4.11 HIVeLink Authentication Module
Figure 4.11 shows the authentication interface of HIVeLink. Patients register with an email address and verify it to receive their UIC, then sign in with the UIC and password. Health Workers and Administrators sign in with their registered email address and password. The interface also supports password recovery through a secure email reset link and account email verification. It serves as the entry point to each role's private view.

Figure 4.12 HIVeLink Guest Home Module
Figure 4.12 shows the public guest homepage of HIVeLink, accessible without an account. It features the headline "Start with what you know," a short introduction to the platform's local information and support for Odiongan and beyond, and a call-to-action button leading to the knowledge section. A footer indicates that guests are browsing the public view with no account required, emphasizing that sensitive information can be explored anonymously.

Figure 4.13 HIVeLink Information (Knowledge) Module
Figure 4.13 shows the "HIV / AIDS 101" knowledge section of the platform. It presents numbered, evidence-based information cards covering HIV testing, prevention options such as condoms, PrEP, and PEP, and respectful access to health workers. It also lists trusted external sources, including the World Health Organization, CDC, and HIV.gov, to help users verify information and reduce misinformation.

Figure 4.14 HIVeLink Testing Module
Figure 4.14 shows the "Testing and Treatment" interface of the platform. It features an interactive OpenStreetMap-based facility map marking the Odiongan Rural Health Unit and Romblon Provincial Hospital, direct Google Maps directions, local care contacts, and guidance notes on where to begin, where to get treated, and what to do for urgent PEP needs. Registered patients can also request an appointment from this page.

Figure 4.15 HIVeLink Patient Care Dashboard Module
Figure 4.15 shows the private care dashboard of a registered patient. It displays summary tiles for the patient's appointments, chat sessions, and support group memberships, along with a filterable list of services availed. This page serves as the patient's central hub for tracking their ongoing care within the platform.

Figure 4.16 HIVeLink Appointment Request Module
Figure 4.16 shows the appointment request interface where a patient selects a testing facility, an appointment date and time, and the type of consultation. Submitted requests are forwarded to the Administrator for review, assignment to an available health worker and facility, or other status processing. The patient can cancel or reschedule a pending request where the request status permits.

Figure 4.17 HIVeLink Private Chat Module
Figure 4.17 shows the confidential one-on-one chat between a patient and a health worker. Messages are exchanged in real time through Supabase Realtime within an open or closed support ticket, ensuring that consultations remain private and are linked only to the involved patient and health worker.

Figure 4.18 HIVeLink Private Support Group Module
Figure 4.18 shows the moderated, alias-based support group interface. Members interact using display aliases instead of their real names, protecting their identities; the assigned health worker acts as the supervisor and may redact inappropriate messages. This design allows patients to seek emotional and peer support anonymously and safely.

Figure 4.19 HIVeLink Health Worker Dashboard Module
Figure 4.19 shows the health worker dashboard, where the assigned doctor or nurse views assigned patients and appointment schedules, reads and responds to patient chat messages, updates permitted care details, and supervises the support group. Administrators approve and assign appointment requests; health workers do not approve their own appointment assignments.

Figure 4.20 HIVeLink Admin Dashboard Module
Figure 4.20 shows the administrator dashboard for managing and maintaining the platform. The Administrator can manage user accounts and health-worker profiles, review and assign appointment requests, maintain educational resources and testing facilities, control platform service availability, manage the support-group supervisor, handle public inquiries, email registered users, and monitor activity logs for security auditing.

### Workflow Diagram

Figure 4.21 Workflow Diagram

Figure 4.21 The functional architecture of HIVeLink begins with a public guest view and secure authentication, then divides into role-based paths. Users can browse HIV/AIDS information and locate testing facilities without an account. Registered patients can request appointments, chat privately with a health worker, join the support group using an alias, and update their profiles. Health Workers view assigned patients and appointment schedules, respond to chats, update permitted care details, and supervise the support group. Administrators review and assign appointment requests, manage accounts and facilities, control platform services, handle inquiries, and view reports and activity logs. All roles end with secure logout.

## E. Development Phase

### Composition of Modules / Breakdown of Application

The application is composed of four major interfaces: the public guest hub, the patient portal, the health worker portal, and the administrator portal, all built as components of a single React front end and served by a Node.js-based API layer connected to a Supabase PostgreSQL database.

**Table 4.2.1 Module Breakdown for Guest and Patient**

| Module Name | Sub-Module Name | Program Name | Tables Used | Usage Mode | Programmer |
|---|---|---|---|---|---|
| Guest | Homepage | GuestHub | -- (static application content) | R | Jeric Andrei F. Paz |
| | Knowledge/Information Hub | GuestKnowledge | -- (static application content) | R | Hic Y. Flores |
| | Testing Facility Locator | FacilityMap | TestingFacilities | R | Jason F. Miralles |
| | Contact Support | SupportInquiryForm | PublicInquiries | C | Charles Andrew D. McLean |
| Authentication | Registration | AuthScreen | Users | C | Jeric Andrei F. Paz |
| | Login | AuthScreen | Users | R | Hic Y. Flores |
| | Email Verification / Password Recovery | AuthScreen, passwordRecovery | Users | U | Jason F. Miralles |
| Patient | Care Dashboard | PatientDashboard | Patients, Appointments, ChatSessions | R | Charles Andrew D. McLean |
| | Appointment Request | AppointmentRequestForm | Appointments, TestingFacilities | C/U/D | Jeric Andrei F. Paz |
| | Private Chat | ChatMessenger | ChatSessions, ChatMessages | C/R/U | Jason F. Miralles |
| | Private Support Group | SupportGroupPanel | SupportGroups, SupportGroupMembers, SupportGroupMessages | C/R | Charles Andrew D. McLean |
| | Profile Editing | PatientForm | Users | U | Jeric Andrei F. Paz |
| | Logout | App.js | -- | -- | Hic Y. Flores |

**Table 4.2.2A Module Breakdown for Health Worker**

| Module Name | Sub-Module Name | Program Name | Tables Used | Usage Mode | Programmer |
|---|---|---|---|---|---|
| Health Worker | Dashboard | HealthWorkerDashboard | Appointments, Patients | R | Jason F. Miralles |
| | View Appointment Schedule | HealthWorkerDashboard | Appointments, Patients | R | Jeric Andrei F. Paz |
| | View and Update Patient Care Details | HealthWorkerDashboard | Patients | R/U | Hic Y. Flores |
| | Chat Inbox | HealthWorkerChatInbox | ChatSessions, ChatMessages | R/U | Charles Andrew D. McLean |
| | Support Group Supervision | AdminSupportGroupSupervisor | SupportGroups, SupportGroupMessages | R/U | Jason F. Miralles |

**Table 4.2.2B Module Breakdown for Administrator**

| Module Name | Sub-Module Name | Program Name | Tables Used | Usage Mode | Programmer |
|---|---|---|---|---|---|
| Administrator | Login | AuthScreen | Users | R | Jeric Andrei F. Paz |
| | Dashboard | AdminDashboard | Users, ActivityLogs | R | Hic Y. Flores |
| | Manage Appointments | AdminDashboard | Appointments, HealthWorkers, TestingFacilities | R/U | Jeric Andrei F. Paz |
| | Manage Users | AdminUserFormModal | Users, Patients | R/U/D | Jason F. Miralles |
| | Manage Health Workers | AdminHealthWorkerFormModal | HealthWorkers, Users | R/U/D | Charles Andrew D. McLean |
| | Manage Platform Services | AdminServiceFormModal | PlatformServices | R/U | Jason F. Miralles |
| | Email Users | AdminEmailModal | Users | U | Hic Y. Flores |
| | Reports / Audit Trail | AdminDashboard | ActivityLogs, Appointments | R | Jason F. Miralles |

*Usage Mode legend: C = Create, R = Read, U = Update, D = Delete.*
