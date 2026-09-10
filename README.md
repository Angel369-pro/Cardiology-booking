# Cardiology-booking

A full-stack appointment booking system for a cardiology practice, rebuilt from an earlier desktop (Python/Tkinter) version as a web app to learn Node.js and Express.

**Live demo:** [link after deployment]

## Why this project

Most appointment-booking demos are simple CRUD. This one focuses on the two hardest real-world problems in scheduling systems:

1. **Preventing double-booking under concurrent requests** — solved with a `SELECT ... FOR UPDATE` row lock inside a database transaction, not just an application-level check (which is a race condition waiting to happen).
2. **Role-based access** — patients and doctors share one auth system but have distinct permissions (a patient can only book for themselves; a doctor can only manage their own slots and appointments).

## Tech stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **Auth:** JWT (jsonwebtoken), bcrypt for password hashing
- **Frontend:** Vanilla HTML/CSS/JS (kept deliberately framework-free to focus on the backend logic)

## Architecture decisions

- **`availability_slots` as a separate table from `appointments`** — doctors pre-define open time slots; booking simply claims one. This avoids calculating time-overlap conflicts on every booking attempt.
- **Two layers of double-booking protection** — a `UNIQUE` constraint on `appointments.slot_id` at the schema level, plus a row lock (`FOR UPDATE`) at the transaction level, so the system is safe even under near-simultaneous requests.
- **Identity from JWT, never from the request body** — `patient_id` and `doctor_id` are always read from the verified token (`req.user.id`), not from what the client sends. This prevents a logged-in user from acting as someone else.
- **Denormalized `doctor_id` on `appointments`** — technically derivable via `slot_id`, but stored directly to keep common queries ("all of Dr. X's appointments") simple.

## Database schema

See [`schema.sql`](./schema.sql) for the full `CREATE TABLE` statements with constraints.

## API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register/patient` | none | Patient registration |
| POST | `/auth/register/doctor` | none | Doctor registration |
| POST | `/auth/login` | none | Login (patient or doctor) |
| GET | `/doctors/:id/availability` | none | Public list of open slots |
| POST | `/availability` | doctor | Create a new open slot |
| GET | `/availability/mine` | doctor | Doctor's full schedule |
| DELETE | `/availability/:id` | doctor | Remove an unbooked slot |
| POST | `/appointments` | patient | Book an available slot |
| GET | `/appointments/mine` | doctor | Doctor's appointments for today |
| PATCH | `/appointments/:id` | doctor | Update appointment status |

## Setup

```bash
git clone https://github.com/Angel369-pro/Cardiology-booking.git
cd Cardiology-booking
npm install
cp .env.example .env   # add your DATABASE_URL and JWT_SECRET
psql $DATABASE_URL < schema.sql
npm start
```

Then visit `http://localhost:3000` for the patient booking page, or `http://localhost:3000/dashboard.html` for the doctor dashboard.

## What I'd add with more time

- Email/SMS appointment reminders
- Refresh tokens instead of a flat 2-hour JWT expiry
- Doctor-selection page (currently hardcoded to doctor #1 for demo purposes)
