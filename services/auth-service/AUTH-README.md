# Luki Play - Auth Service

Authentication and authorization service for the Luki Play OTT platform.

## Architecture

The service follows **Clean Architecture** with a modular structure:

```
services/auth-service/src/
├── common/                          # Shared utilities
│   ├── filters/                     # Global exception filters
│   └── pipes/                       # Global validation pipes
├── config/                          # Configuration (future)
├── modules/
│   ├── auth/                        # Authentication module
│   │   ├── domain/
│   │   │   ├── entities/            # User, Session, Account entities
│   │   │   └── interfaces/          # Repository & service ports
│   │   ├── application/
│   │   │   ├── dto/                 # Request/Response DTOs
│   │   │   └── use-cases/           # Business logic
│   │   ├── infrastructure/
│   │   │   ├── jwt/                 # JWT strategy & token service
│   │   │   ├── persistence/         # Hash service (bcrypt)
│   │   │   └── repositories/        # In-memory repositories (dev)
│   │   └── presentation/
│   │       ├── controllers/         # REST endpoints
│   │       ├── guards/              # Auth guards (JWT, Roles, etc.)
│   │       └── decorators/          # Custom decorators
│   ├── access-control/              # RBAC module
│   │   └── domain/                  # Role-permission mapping
│   ├── billing/                     # Billing integration
│   │   ├── domain/interfaces/       # BillingGateway port
│   │   └── infrastructure/adapters/ # MockBillingGateway
│   ├── crm/                         # CRM integration
│   │   ├── domain/interfaces/       # CrmGateway port
│   │   └── infrastructure/adapters/ # MockCrmGateway
│   └── profiles/                    # User profiles (placeholder)
│       └── domain/entities/         # Profile entity
├── app.module.ts
└── main.ts
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/app/login` | No | Client login with contract number |
| POST | `/auth/cms/login` | No | CMS login with email |
| POST | `/auth/refresh` | No | Refresh access token (rotation) |
| POST | `/auth/logout` | JWT | Logout and revoke session |
| GET | `/auth/me` | JWT | Get current user profile |
| POST | `/auth/change-password` | JWT | Change password |
| GET | `/auth/sessions` | JWT | List active sessions |
| DELETE | `/auth/sessions/:id` | JWT | Revoke a specific session |

## JWT Claims

```json
{
  "sub": "user-uuid",
  "role": "cliente | soporte | superadmin",
  "permissions": ["app:playback", "app:profiles"],
  "aud": "app | cms",
  "accountId": "account-uuid | null",
  "entitlements": ["live-tv", "vod-basic"]
}
```

## Roles & Permissions (RBAC)

| Role | Permissions |
|------|-------------|
| superadmin | `cms:*`, all cms and app permissions |
| soporte | `cms:users:read`, `cms:content:read`, `cms:analytics:read` |
| cliente | `app:playback`, `app:profiles` |

## Guards

- **JwtAuthGuard** — Validates JWT bearer token
- **RolesGuard** — Checks user role against required roles
- **PermissionsGuard** — Checks user permissions (supports wildcards like `cms:*`)
- **AudienceGuard** — Validates access context (APP vs CMS)

## Mock Integrations

The service uses mock adapters for external systems that don't exist yet:

### BillingGateway (MockBillingGateway)
- `validateContract(contractNumber)` — Validates contract numbers
- `getSubscriptionStatus(accountId)` — Returns subscription info, entitlements

### CrmGateway (MockCrmGateway)
- `getCustomerByContract(contractNumber)` — Returns customer info

**To replace with real implementations:**
1. Create a new adapter class implementing the interface (e.g., `HttpBillingGateway`)
2. Update the module provider to use the new class instead of the mock
3. No changes needed in use cases or controllers (dependency inversion)

## Seed Data (Development)

| User | Contract | Email | Role | Password |
|------|----------|-------|------|----------|
| Client 1 | CONTRACT-001 | juan@example.com | cliente | password123 |
| Client 2 | CONTRACT-002 | maria@example.com | cliente | password123 |
| Client 3 | CONTRACT-003 | carlos@example.com | cliente | password123 |
| Admin | — | admin@lukiplay.com | superadmin | password123 |
| Support | — | soporte@lukiplay.com | soporte | password123 |

## Running

### Development
```bash
cd services/auth-service
cp .env.example .env
npm install
npm run start:dev
```

### Production Build
```bash
npm run build
node dist/main.js
```

### Docker
```bash
docker-compose up -d
```

### Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Swagger

Available at `http://localhost:3000/api/docs` when the service is running.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment |
| JWT_ACCESS_SECRET | — | Secret for access tokens |
| JWT_REFRESH_SECRET | — | Secret for refresh tokens |
| JWT_ACCESS_EXPIRY | 15m | Access token TTL |
| JWT_REFRESH_EXPIRY | 7d | Refresh token TTL |
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_USERNAME | lukiplay | Database user |
| DB_PASSWORD | — | Database password |
| DB_NAME | lukiplay_auth | Database name |
| REDIS_HOST | localhost | Redis host |
| REDIS_PORT | 6379 | Redis port |

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- Short-lived access tokens (15 min default)
- Refresh token rotation (old token invalidated on refresh)
- Rate limiting via @nestjs/throttler
- DTO validation with class-validator (whitelist + forbidNonWhitelisted)
- Global exception filter (no internal error leaks)
- RBAC with wildcard permission support

## Future Improvements

- [ ] Replace in-memory repositories with TypeORM + PostgreSQL
- [ ] Replace in-memory sessions with Redis-backed store
- [ ] Connect real Billing API (replace MockBillingGateway)
- [ ] Connect real CRM API (replace MockCrmGateway)
- [ ] Implement QR login flow
- [ ] Add device limit enforcement per plan
- [ ] Add profile management with PIN/parental controls
- [ ] Add structured logging (Winston/Pino)
- [ ] Add health check endpoint
- [ ] Add OpenTelemetry tracing
