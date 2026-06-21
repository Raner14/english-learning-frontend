# Lingua -- English Learning Platform (Frontend)

**Course:** Internet Development Environments, Ben-Gurion University of the Negev
**Assignment:** 4
**Stack:** React 19 | React Router 7 | Axios | Socket.IO Client

Lingua is a web-based English learning platform that connects students with teachers and AI-powered learning tools. Students progress through structured, multi-stage lessons, practice conversations with an AI tutor, and receive feedback from human teachers. Teachers manage student relationships, review AI conversations, and engage in live discussions. Admins oversee all platform content and users.

---

## Table of Contents

1. [Installation and Running](#installation-and-running)
2. [Project Structure](#project-structure)
3. [Pages and Features by Role](#pages-and-features-by-role)
4. [Real-Time Features (Socket.IO)](#real-time-features-socketio)
5. [Key Technical Patterns](#key-technical-patterns)

---

## Installation and Running

### Prerequisites

- Node.js (v18 or higher recommended)
- The Lingua backend server running on `http://localhost:3000`

### Setup

```bash
cd english-learning-frontend
npm install
npm start
```

The development server starts at **http://localhost:5173**. Make sure the backend is already running on port 3000 before using the app.

---

## Project Structure

```
src/
├── components/        Reusable UI components (Card, Button, Loader, Navbar, NotificationBell, etc.)
├── context/           React Context providers (AuthContext, SocketContext, ToastContext)
├── pages/             Page components organized by feature
│   ├── auth/              Login, Register
│   ├── dashboard/         Role-specific dashboards (Student, Teacher, Admin)
│   ├── lessons/           Lesson catalog, detail, vocab, stages
│   │                      (Flashcards, Grammar, Conversation, etc.)
│   ├── conversations/     AI conversation detail, teacher discussions
│   ├── teachers/          Find teacher, match teacher, my teachers, teacher profile
│   ├── students/          Student list, student progress
│   ├── progress/          Student progress tracking
│   ├── assessment/        AI level assessment
│   ├── exercises/         Warm-up grammar exercises
│   ├── grammar/           Grammar rules management (admin)
│   ├── settings/          User settings, learning preferences
│   ├── reviews/           Teacher reviews
│   ├── relations/         Admin relations management
│   └── users/             Admin user management
├── services/          API service layer (one file per resource)
├── utils/             Shared helpers (notificationHelpers.js)
└── config/            App routes configuration
```

---

## Pages and Features by Role

### Student

- **Dashboard** with level assessment prompt and recommended next lesson.
- **Lesson catalog** with level-based locking. Students unlock lessons cumulatively as they advance through Beginner, Intermediate, and Advanced levels.
- **Multi-stage lessons** that follow a fixed progression:
  1. Grammar Rule
  2. Flashcards
  3. Vocabulary Multiple Choice
  4. Match Definition
  5. Grammar Multiple Choice
  6. AI Conversation
- **AI conversation practice** scoped to lesson context, with vocabulary tracking to reinforce target words.
- **AI level assessment** that determines the student's proficiency level (Beginner / Intermediate / Advanced).
- **Find and request teachers**, view teacher profiles, and read reviews from other students.
- **AI-powered teacher matching** that recommends teachers based on student preferences.
- **Progress tracking** with charts and statistics.
- **Learning preferences** management in Settings.
- **Real-time notifications** (toast popups and notification bell) for teacher reviews, accepted requests, and more.
- **Live chat** with teachers on reviewed conversations.

### Teacher

- **Dashboard** showing active students, pending connection requests, and average rating.
- **Accept or reject** student connection requests with real-time updates.
- **View student conversations** and leave scored reviews.
- **Live discussion thread** on reviewed conversations for back-and-forth feedback.
- **Online status indicator** showing which students are currently active.
- **Profile management** for updating personal and professional information.

### Admin

- **Dashboard** with aggregate counts (total users, students, teachers).
- **Manage Users** -- full CRUD operations. Admins cannot delete other admins or change user roles.
- **Manage Lessons** -- CRUD with vocabulary management.
- **Manage Grammar Rules** -- CRUD for grammar content.
- **Manage Relations** -- view all student-teacher relationships.
- **Manage Warm-Up Exercises** -- CRUD for grammar exercises.

---

## Real-Time Features (Socket.IO)

The platform uses Socket.IO for bidirectional communication between the client and server. All WebSocket logic is centralized in `SocketContext`.

### Capabilities

| Feature | Description |
|---|---|
| Online status | Green or gray dot next to user names indicating online/offline state |
| Toast notifications | Pop-up notifications that auto-dismiss and support click-to-navigate |
| Notification bell | Persistent bell icon with unread count; clicking an item navigates to the relevant page |
| Live chat | Real-time message exchange in conversation discussion threads |
| Dashboard updates | Teachers see new student requests appear without refreshing |

### Socket Events

| Event | Purpose |
|---|---|
| `users:online-list` | Receive the full list of currently online users on connect |
| `user:online` | A user has come online |
| `user:offline` | A user has gone offline |
| `conversation:new-reply` | A new message was added to a conversation thread |
| `conversation:completed` | A student completed an AI conversation |
| `conversation:reviewed` | A teacher submitted a review on a conversation |
| `relation:accepted` | A teacher accepted a student's connection request |
| `relation:requested` | A student sent a new connection request |
| `relation:removed` | A student-teacher relationship was removed |

---

## Key Technical Patterns

### Context Providers

The app wraps its component tree with three context providers:

- **AuthContext** -- Manages user session state, login/logout flows, and role-based access control. Exposes the current user object and authentication helpers to all components.
- **SocketContext** -- Establishes and manages the WebSocket connection. Tracks online users, handles incoming socket events, and triggers toast notifications. Provides hooks for components to access real-time data.
- **ToastContext** -- Controls toast notification display. Supports auto-dismiss timers and click handlers that navigate to relevant pages.

### Authentication

Authentication uses a header-based approach via an Axios request interceptor. Every outgoing HTTP request includes:

| Header | Value |
|---|---|
| `x-user-id` | The logged-in user's ID |
| `x-user-role` | The user's role (student, teacher, or admin) |
| `x-user-name` | The user's display name |

Session data is stored in `sessionStorage`. No JWT tokens are used.

### API Service Layer

Each backend resource has a dedicated service file under `src/services/`. These files encapsulate all Axios calls for a given resource, keeping API logic out of components and making endpoints easy to locate and update.

### Routing

Route configuration is centralized in `src/config/`. React Router 7 handles client-side navigation with role-aware route guards that redirect unauthorized users.
