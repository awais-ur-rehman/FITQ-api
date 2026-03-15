# FITQ API

Backend REST API for **FITQ** — an AI-powered outfit rating app. Users upload outfit photos and receive instant AI-generated scores (0–10) with detailed style analysis powered by Gemini 2.5 Flash. 

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + TypeScript |
| Framework | Express.js |
| Database | MongoDB (Atlas) |
| Cache | Redis (Upstash) |
| AI | Gemini 2.5 Flash |
| File Storage | Cloudinary |
| Email | Resend |
| Auth | JWT (access + refresh tokens) |
| Deployment | Render |

## Project Structure

```
src/
├── config/         # DB, Redis, Cloudinary, Gemini, Resend connections
├── controllers/    # Thin request handlers (5–15 lines each)
├── middleware/     # Auth, validation, upload, rate limiting, error handler
├── models/         # Mongoose schemas
├── routes/         # URL mapping + middleware chaining
├── services/       # All business logic
├── types/          # TypeScript type declarations
├── utils/          # apiResponse, apiError, asyncHandler
├── validators/     # express-validator rule chains
├── app.ts          # Express app setup
└── server.ts       # Entry point — connects DB and starts server
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Redis (Upstash free tier)
- Google AI Studio API key
- Cloudinary account
- Resend account

### Local Setup

```bash
# Install dependencies
npm install

# Copy env file and fill in your values
cp .env.example .env

# Start dev server (hot reload)
npm run dev
```

### Build for Production

```bash
npm run build   # Compiles TypeScript → dist/
npm start       # Runs compiled output
```

### Type Check

```bash
npm run typecheck
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | `development` / `production` / `test` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `JWT_ACCESS_EXPIRY` | Access token expiry (e.g. `15m`) |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry (e.g. `30d`) |
| `REDIS_URL` | Upstash Redis connection URL |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RESEND_API_KEY` | Resend email API key |
| `RESEND_FROM_EMAIL` | Sender email address |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `DAILY_SCAN_LIMIT_FREE` | Free tier daily scan cap (default: 3) |
| `DAILY_SCAN_LIMIT_PRO` | Pro tier daily scan cap (default: 100) |
| `OTP_EXPIRY_SECONDS` | OTP TTL in seconds (default: 300) |
| `OTP_MAX_ATTEMPTS` | Max OTP verification attempts (default: 3) |

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

### Auth — `POST /api/v1/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | — | Initiate signup, send OTP |
| POST | `/verify-otp` | — | Verify OTP, create account |
| POST | `/resend-otp` | — | Resend OTP email |
| POST | `/login` | — | Login with email + password |
| POST | `/refresh` | — | Rotate access + refresh tokens |
| POST | `/forgot-password` | — | Send password reset OTP |
| POST | `/reset-password` | — | Reset password with OTP |
| GET | `/me` | Bearer | Get current user profile |
| POST | `/logout` | Bearer | Invalidate refresh token |

### Scans — `POST /api/v1/scans`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Bearer | Upload outfit + get AI analysis |
| GET | `/` | Bearer | Get paginated scan history |
| GET | `/:id` | Bearer | Get single scan details |
| PATCH | `/:id/favorite` | Bearer | Toggle favorite status |
| DELETE | `/:id` | Bearer | Delete scan + Cloudinary image |

### Profile — `/api/v1/profile`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/` | Bearer | Update profile fields |
| PATCH | `/avatar` | Bearer | Upload/replace avatar |
| PATCH | `/change-password` | Bearer | Change password |
| GET | `/stats` | Bearer | Get detailed style stats |
| DELETE | `/` | Bearer | Delete account permanently |

## API Response Format

```json
// Success
{ "success": true, "message": "...", "data": { } }

// Error
{ "success": false, "message": "...", "errors": [] }
```

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /auth/signup` | 5 req | 15 min per IP |
| `POST /auth/login` | 10 req | 15 min per IP |
| `POST /auth/resend-otp` | 3 req | 15 min per email |
| `POST /auth/forgot-password` | 3 req | 15 min per IP |
| `POST /scans` | 3/day (free), unlimited (pro) | 24 hours per user |
| General | 100 req | 15 min per user |

## Architecture

This API follows a strict **service-layer pattern**:

```
Route → Controller (thin) → Service (all logic) → Model
```

- **Controllers** only parse `req` and call services (5–15 lines max)
- **Services** contain all business logic and call external APIs
- **Models** define schemas with no business logic
- Every async handler uses `asyncHandler` — no try/catch in controllers
- `ApiError` is thrown for expected errors; global handler catches the rest
