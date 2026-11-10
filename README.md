# FootyRoom

FootyRoom is a containerized full-stack e-commerce application for football
products. It uses Next.js for the web frontend, Express and TypeScript for the
API, MongoDB for persistent data, Cloudinary for product images, and Nginx as
the public reverse proxy and backend load balancer.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16 App Router, React, TypeScript, Tailwind CSS |
| Backend | Node.js 24, Express 5, TypeScript |
| Database | MongoDB with Mongoose |
| Authentication | NextAuth Google OAuth, backend JWT access/refresh tokens |
| Image storage | Cloudinary |
| Runtime and routing | Docker Compose, Nginx |

## Architecture

```text
Browser
  |
  v
Nginx :3000
  |-- /api/v1/* ------> backend-1, backend-2, backend-3
  |-- /api/auth/* ----> Next.js frontend (NextAuth)
  `-- other paths ----> Next.js frontend

All backend instances ------> shared MongoDB
Product image uploads ------> Cloudinary
```

The backend instances use the same Docker build and source code. Each runs as
an independent container with its own `INSTANCE_ID`, and all use the same
MongoDB database, JWT secrets, and Cloudinary account. Backend ports are only
exposed inside the Compose network; clients reach the app through Nginx.

Nginx uses round robin by default for `/api/v1/` requests. Its `max_fails` and
`fail_timeout` settings provide passive upstream failure handling. The
application and Docker also expose/check backend health at `/health` and
`/api/v1/health`. Nginx Open Source does not provide active upstream health
probes here. See [docs/LOAD_BALANCING.md](docs/LOAD_BALANCING.md) for balancing,
failover, and instance management details.

## Requirements

- Docker Engine and the Docker Compose plugin
- Google OAuth credentials
- MongoDB connection URI
- Cloudinary credentials for product image uploads

## Configuration

Create a root `.env` file based on [.env.example](.env.example). Do not commit
real credentials. Set the following values:

```dotenv
MONGODB_URI=mongodb://mongo:27017
ACCESS_TOKEN_SECRET=use-a-long-random-secret
REFRESH_TOKEN_SECRET=use-a-different-long-random-secret
NEXTAUTH_SECRET=use-a-long-random-secret
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

The Compose file starts a local MongoDB service named `mongo`; use
`mongodb://mongo:27017` when using that database. If you use an external
MongoDB deployment, set `MONGODB_URI` to its connection URI instead. The
application appends its configured database name to the URI.

For Google OAuth, register this authorized redirect URI in Google Cloud
Console:

```text
http://localhost:3000/api/auth/callback/google
```

The app's public origin is configured as `http://localhost:3000` for local
development. Configure the corresponding public HTTPS origin and callback URI
when deploying under a production domain.

## Run with Docker Compose

Start and build the services:

```bash
docker compose up --build -d
```

Check service health and the public API:

```bash
docker compose ps
curl http://localhost:3000/api/v1/health
```

The health response includes an instance ID and PID for diagnostics. To check
the services and logs:

```bash
docker compose logs -f
docker compose logs -f nginx
docker compose logs -f backend-1
```

Restart backend instances or stop the stack:

```bash
docker compose restart backend-1 backend-2 backend-3
docker compose down
```

`docker compose down -v` also removes the MongoDB data volume and should only
be used when you intentionally want to delete that local database data.

### Test load balancing and failover

Send several health requests and check the returned `instance.id`:

```bash
for i in $(seq 1 12); do curl -s http://localhost:3000/api/v1/health; echo; done
```

Stop one backend to simulate failure, then start it again to restore it:

```bash
docker compose stop backend-2
docker compose start backend-2
```

Nginx passive failure handling responds to failed upstream attempts; it is not
an active health probe. Docker health status is useful for service diagnosis
and startup ordering, but Nginx does not automatically consume Docker's
health status as an active upstream check.

## Run the backend without Docker

Install the backend dependencies, configure `Backend/.env` from
[Backend/.env.sample](Backend/.env.sample), and make sure MongoDB is reachable
at the configured `MONGODB_URI`.

```bash
cd Backend
pnpm install --frozen-lockfile
pnpm dev
```

The backend listens on `PORT` (default `8000`). For a production build:

```bash
cd Backend
pnpm build
pnpm start
```

## Development and tests

Backend tests:

```bash
cd Backend
pnpm test
```

Build the backend TypeScript:

```bash
cd Backend
pnpm build
```

Validate the rendered Compose configuration:

```bash
docker compose config
```

## Routes and authentication

- Backend API: `/api/v1/`
- Backend readiness: `/health` and `/api/v1/health`
- NextAuth routes: `/api/auth/`
- Google sign-in: the frontend's **Sign in with Google** button

Nginx sends `/api/v1/` to Express and leaves `/api/auth/` on the Next.js
frontend. JWT signing secrets must be identical across backend instances.
Refresh-token state is stored in MongoDB, not process memory, so a request can
be handled by any healthy instance without session affinity.

## Production notes and limitations

- The checked-in Nginx configuration listens on HTTP port 80, published as
  host port 3000 by Compose. HTTPS is not enabled by this configuration; add
  TLS termination and configure the public OAuth callback URL before production
  use.
- Nginx uses passive failure handling, not active upstream health probing.
- The default setup has one Nginx container, so Nginx itself is a single point
  of failure. Multiple backend instances do not make the entire deployment
  highly available.
- Use a managed or production-grade MongoDB deployment, backups, and secure
  secret management in production. Do not rely on the local Compose database
  as a production database without an appropriate operations and backup plan.
- Backend upload files are temporary and sent to Cloudinary; the application
  does not rely on a shared local upload volume.
- Add backend instances by adding another service using the same backend image
  and adding that service to the Nginx `backend` upstream. Update service
  dependencies and health checks as appropriate.
