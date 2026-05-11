# Centavo

Personal finance manager with multi-format import (OFX, CSV, manual). Built as a portfolio project to demonstrate fullstack development with Angular and NestJS.


## Stack

| Layer       | Tech                                    |
|-------------|-----------------------------------------|
| Frontend    | Angular 20 (standalone, signals), SCSS  |
| Backend     | NestJS 11, Prisma 6, PostgreSQL 16      |
| Auth        | JWT with refresh tokens                 |
| Monorepo    | Nx                                      |
| Testing     | Jest                                    |

## Architecture

```
centavo/
├── apps/
│   ├── api/    # NestJS backend
│   └── web/    # Angular frontend
└── libs/
    └── shared-types/    # Shared DTOs and interfaces
```

## Running locally

### Prerequisites
- Node.js 22+
- pnpm
- Docker

### Setup

```bash
# Install dependencies
pnpm install

# Start database
docker compose up -d

# Configure environment
cp apps/api/.env.example apps/api/.env

# Run migrations
cd apps/api && npx prisma migrate dev && cd ../..

# Start backend (terminal 1)
pnpm nx serve api

# Start frontend (terminal 2)
pnpm nx serve web
```

Backend runs at `http://localhost:3333`, frontend at `http://localhost:4200`.


## License

MIT