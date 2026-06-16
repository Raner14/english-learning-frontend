# Lingua — English Learning Platform (Frontend)

Lingua is a web-based English learning platform that guides students through structured lessons, AI-powered conversations, and personalised teacher matching. This repository contains the React frontend application.

---

## Table of Contents

- [What is this project?](#what-is-this-project)
- [Who is it for?](#who-is-it-for)
- [Main Features](#main-features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Development Server](#running-the-development-server)
- [API](#api)

---

## What is this project?

Lingua is a full-stack English learning application built for students who want to improve their English through interactive lessons and real-time AI conversation practice. The platform assigns each student an English proficiency level (Beginner, Intermediate, or Advanced) through an AI-driven assessment, then unlocks a personalised set of lessons tailored to that level.

Each lesson leads the student through a multi-stage flow: vocabulary flashcards, warm-up exercises, a grammar rule explanation, grammar practice, and a live AI conversation where the student must use the lesson's vocabulary and grammar in context. After the conversation, teachers can review the transcript, score the student's performance, and leave written feedback.

The platform also includes a teacher-matching system that uses student preferences (learning goal, budget, availability) to recommend the most suitable teacher from the platform's roster.

---

## Who is it for?

Lingua has three distinct user roles, each with a dedicated experience:

### Students
- Complete an AI-powered level assessment to receive an initial proficiency level
- Browse and access lessons at their level and all levels below it
- Work through structured multi-stage lesson flows
- Track vocabulary usage in real time during AI conversations
- Monitor their progress, scores, and activity history on a personal dashboard
- Match with a teacher based on their learning goals and budget
- Review teacher feedback on completed lessons

### Teachers
- View the lesson transcripts of their assigned students
- Score student conversations and leave written feedback
- Communicate with students through a comment thread on each lesson
- Access a teacher dashboard showing their active student list

### Admins
- Manage all user accounts (create, edit, delete students and teachers)
- Create and manage lessons, grammar rules, and warm-up exercises
- View and manage all student–teacher relationships
- Monitor platform-wide statistics from the admin dashboard

---

## Main Features

### AI Level Assessment
A conversational assessment flow where the student exchanges messages with an AI to gauge their English proficiency. At the end of the session the AI classifies the student as Beginner, Intermediate, or Advanced, and this level is saved to their profile and unlocks the appropriate lessons.

### Lesson Catalog
Lessons are organised into three levels. Students can access lessons at their own level and all levels below it. Locked lessons display a clear explanation of why they are unavailable. The catalog supports search by title, scene, or grammar topic.

### Multi-Stage Lesson Flow
Each lesson progresses through six sequential stages:
1. **Flashcards** — introduces the lesson's vocabulary words and definitions
2. **Vocabulary Warm-Up** — fill-in-the-blank and matching exercises
3. **Grammar Rule** — displays the grammar concept the lesson targets
4. **Grammar Warm-Up** — multiple-choice exercises to practise the grammar rule
5. **AI Conversation** — a live chat where the student role-plays a scene with an AI partner; a floating sidebar tracks which vocabulary words have been used and which remain
6. **Results** — displays the AI score, feedback, and teacher review when available

### Vocabulary Tracker
During the AI conversation stage, every vocabulary word the student uses correctly moves from a "Vocabulary to Use" list to a "Words You've Used" panel in real time, giving immediate feedback on progress through the lesson.

### Progress Dashboard
Students can view their completed lesson count, overall average score, recent lesson history, and a score chart showing performance over time. Teachers and admins can view a summary of any student's progress.

### Teacher Matching
Students fill in a preference form (learning goal, budget, availability, proficiency level) and receive a ranked list of recommended teachers. Each teacher card shows their specialties, price, and star rating. Students can request a teacher directly from the results page.

### Teacher Reviews
After a student completes a lesson conversation, their assigned teacher can review the full transcript, assign a score, and leave written feedback. Students and teachers can continue the discussion through a comment thread on each conversation.

### Admin Tools
Admins have dedicated pages to manage the full content and user base:
- **Manage Users** — create, search, filter, edit, and delete accounts; role changes and admin deletion are restricted
- **Manage Lessons** — create and edit lessons with title, scene, AI role, level, and grammar rule
- **Grammar Rules** — create grammar rules with inline warm-up exercise creation
- **Warm-Up Exercises** — browse and manage all grammar exercises by rule
- **Manage Relations** — view and approve or remove student–teacher connection requests

---

## Technology Stack

| Category | Technology |
|---|---|
| Framework | React 19 |
| Routing | React Router DOM v7 |
| HTTP client | Axios |
| Styling | Plain CSS with BEM-style class naming |
| State management | React component state and Context API |
| Auth | Header-based (`x-user-role`, `x-user-id`) via Axios interceptors |
| Build tooling | Create React App (react-scripts 5) |
| Testing | React Testing Library, Jest |

---

## Prerequisites

- Node.js v18 or higher
- The backend server running on `http://localhost:3000`

---

## Installation

```bash
npm install
```

---

## Running the Development Server

```bash
npm start
```

The app will be available at `http://localhost:5173`.

---

## API

All API requests are sent to the backend at:

```
http://localhost:3000
```

Make sure the backend server is running before starting the frontend.
