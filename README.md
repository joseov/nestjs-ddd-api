<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository with Domain-Driven Design architecture.

## Prerequisites

- Node.js v22.22.0 (see [.nvmrc](.nvmrc))
- pnpm (recommended) or npm
- Docker & Docker Compose (optional, for containerized development)

## Getting Started

### Option 1: Local Development (without Docker)

#### 1. Install Node.js version

Using [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install
nvm use
```

#### 2. Install dependencies

```bash
pnpm install
```

#### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

#### 4. Run the application

```bash
# Development mode
pnpm start:dev

# Debug mode
pnpm start:debug

# Production mode
pnpm build
pnpm start:prod
```

### Option 2: Development with Docker

This option is ideal if you don't have the recommended Node.js version installed or prefer containerized development.

#### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your configuration (optional for development)
```

#### 2. Start the development environment

```bash
# Build and start all services (app + PostgreSQL)
docker compose up --build

# Run in background
docker compose up -d --build

# View logs
docker compose logs -f app
```

#### 3. Stop the environment

```bash
# Stop containers
docker compose down

# Stop and remove volumes (database data)
docker compose down -v
```

### Production Docker Image

Build the optimized production image to deploy to your orchestrator (Kubernetes, ECS, Cloud Run, etc.):

```bash
# Build production image
docker build --target production -t nestjs-ddd-api:latest .

# Test locally
docker run -p 3000:3000 \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=5432 \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_DATABASE=nestjs_ddd \
  nestjs-ddd-api:latest
```

## Run Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:cov

# E2E tests
pnpm test:e2e
```

## API Documentation

Swagger UI is available at [http://localhost:3000/api/docs](http://localhost:3000/api/docs) when the application is running.

To document your endpoints, use the Swagger decorators in your controllers:

```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  findAll() {
    // ...
  }
}
```

## Health Checks

The API includes health check endpoints powered by `@nestjs/terminus`:

| Endpoint | Purpose | Checks |
|----------|---------|--------|
| `GET /v1/health` | General health | Database + Memory |
| `GET /v1/health/liveness` | Kubernetes liveness probe | Memory |
| `GET /v1/health/readiness` | Kubernetes readiness probe | Database |

Example response:

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" }
  },
  "details": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" }
  }
}
```

### Kubernetes Configuration

```yaml
livenessProbe:
  httpGet:
    path: /v1/health/liveness
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /v1/health/readiness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Debugging

### Debug with VSCode (Local)

1. Open the project in VSCode
2. Go to **Run and Debug** panel (Ctrl+Shift+D / Cmd+Shift+D)
3. Select **"Debug NestJS (Local)"** from the dropdown
4. Press F5 or click the green play button
5. Set breakpoints in your TypeScript files

### Debug with VSCode (Docker)

1. Start the Docker development environment:
   ```bash
   docker compose up -d
   ```

2. In VSCode, go to **Run and Debug** panel
3. Select **"Debug NestJS (Docker)"** from the dropdown
4. Press F5 or click the green play button
5. Set breakpoints in your TypeScript files

The debugger will attach to port 9229 which is exposed from the Docker container.

### Debug Jest Tests

1. In VSCode, go to **Run and Debug** panel
2. Select **"Debug Jest Tests"** from the dropdown
3. Press F5 or click the green play button
4. Set breakpoints in your test files

### Debug with Antigravity / Other IDEs

The application exposes the Node.js inspector on port **9229** when running in debug mode.

For any IDE that supports Node.js debugging:

1. Start the application in debug mode:
   ```bash
   # Local
   pnpm start:debug

   # Docker
   docker compose up
   ```

2. Configure your IDE to attach to:
   - **Host:** localhost
   - **Port:** 9229
   - **Protocol:** Inspector

## Project Structure

```
src/
├── config/                    # Configuration and validation
├── modules/                   # Feature modules (DDD bounded contexts)
├── shared/
│   └── infrastructure/
│       ├── database/          # TypeORM configuration
│       └── health/            # Health checks (Terminus)
├── app.module.ts              # Root module
└── main.ts                    # Application entry point
```

## Docker Images

The Dockerfile uses multi-stage builds:

| Stage | Purpose | Size |
|-------|---------|------|
| `base` | Common Node.js Alpine setup | - |
| `dependencies` | Install all dependencies | - |
| `build` | Compile TypeScript | - |
| `production-dependencies` | Install only prod dependencies | - |
| `production` | Final optimized image | ~200MB |
| `development` | Hot-reload & debugging | ~500MB |

### Build specific stages

```bash
# Production image (default)
docker build --target production -t nestjs-ddd-api:prod .

# Development image
docker build --target development -t nestjs-ddd-api:dev .
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Application port | 3000 |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_USERNAME` | Database username | postgres |
| `DB_PASSWORD` | Database password | postgres |
| `DB_DATABASE` | Database name | nestjs_ddd |

## Useful Docker Commands

```bash
# Rebuild without cache
docker compose build --no-cache

# Execute commands inside container
docker compose exec app sh

# Install new dependencies
docker compose exec app pnpm add <package>

# View container logs
docker compose logs -f

# Check container status
docker compose ps
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Docker Documentation](https://docs.docker.com)
- [pnpm Documentation](https://pnpm.io)

## License

This project is [MIT licensed](LICENSE).
