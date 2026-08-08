# SmartCab Java Backend (Spring Boot 3.3 / Java 21)

REST API powering the SmartCab rider app. Owns the source-of-truth database.

## Endpoints

| Method | Path                                  | Purpose |
|--------|---------------------------------------|---------|
| GET    | `/`                                   | Service health + endpoint index |
| GET    | `/api/trips`  (alias `/api/bookings`) | List recent trips (max 50) |
| POST   | `/api/trips`  (alias `/api/bookings`) | Create a trip (auto-assigns driver + cab) |
| GET    | `/api/trips/{id}`                     | Get one trip |
| PUT    | `/api/trips/{id}/sos`                 | Set status = DANGER, create emergency alert |
| GET    | `/api/drivers`                        | List drivers |
| GET    | `/api/drivers/random`                 | Pick a random driver + their cab |
| GET    | `/api/users`                          | List users |
| POST   | `/api/users/register`                 | Create a user (idempotent on email) |
| POST   | `/api/location/share`                 | Create a `/track/<linkId>` shareable link |
| GET    | `/api/location/track/{linkId}`        | Fetch the live data behind a share link |
| POST   | `/api/location/track/{linkId}/ping`   | Push a fresh GPS ping |
| GET    | `/api/location/track/{linkId}/pings`  | Recent pings for a link |
| POST   | `/api/evidence/upload`                | Multipart video/image evidence upload |
| GET    | `/api/evidence`                       | Recent evidence (top 20) |
| GET    | `/api/evidence/{evidenceId}`          | Download a single evidence file |
| POST   | `/api/emergency`                      | Create an emergency alert (without a trip) |
| PUT    | `/api/emergency/{id}/resolve`         | Mark an alert as resolved |
| GET    | `/h2-console`                         | H2 web UI (dev profile only) |

## Data model

8 tables that match `docs/Database.sql` plus the extras the Live Guard / Share
features need:

- **users** — rider accounts
- **drivers** — driver accounts (license, rating, photo)
- **cabs** — vehicles, many-to-one with drivers
- **trips** — the real booking record (was `bookings`)
- **location_pings** — GPS history per trip / per share link
- **share_links** — `/track/<linkId>` URLs the rider generates
- **evidence** — video/image evidence with file storage on disk
- **emergency_alerts** — SOS history

## Configuration

The service runs in two profiles:

### `default` — H2 file DB (no config needed)
- File path: `./data/smartcabdb.mv.db` (created on first run)
- Survives restarts on the same machine.
- Seed data is auto-loaded from `../database/*.json` on first start.

### `prod` — Postgres (Supabase / Render)
- Set `SPRING_PROFILES_ACTIVE=prod`
- Set `DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_REF.supabase.co:5432/postgres`
- Set `DB_SSLMODE=require` (Supabase needs this)

On Render:
1. Service → Environment → add `SPRING_PROFILES_ACTIVE=prod`
2. Service → Environment → add `DATABASE_URL=<your Supabase connection string>`
3. Trigger a manual deploy.

## Build

```bash
./mvnw clean package -DskipTests
java -jar target/core-0.0.1-SNAPSHOT.jar
```

## Notes

- `application.properties` no longer hard-codes the DB URL — it picks the
  profile from `SPRING_PROFILES_ACTIVE`.
- The old `Booking` / `BookingRepository` / `BookingController` were
  removed; their behavior is now in `Trip*`.
- CORS is wide-open (`*`) for development. Tighten before production.
