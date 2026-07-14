# DOCKER_TEST

Express API don gian co dang ky, dang nhap JWT, PostgreSQL va frontend React, chay bang Docker Compose.

## Online code editor preparation

Project nay co the dung lam nen cho online code editor tuong tu LeetCode. Bo tai lieu chuan bi nam trong:

- `docs/online-code-editor-prep.md`: scope MVP, architecture, ERD, API draft, RBAC, sequence, risk.
- `docs/mvp-backlog.md`: backlog theo milestone de implement dan.
- `docs/judge0-integration.md`: ghi chu tich hop Judge0 self-hosted.
- `docs/week-3-to-8-plan.md`: ke hoach song song tai lieu va code theo tung tuan thuc tap.
- `docs/package-json-explained.md`: giai thich tung phan trong `package.json`.

## Yeu cau

- Docker va Docker Compose
- Node.js neu muon chay local khong qua Docker

## Chay bang Docker

Build va start 3 container frontend + API + PostgreSQL:

```bash
docker compose up --build
```

Frontend React chay tai:

```text
http://localhost:5173
```

API chay tai:

```text
http://localhost:3000
```

PostgreSQL chay trong Docker network noi bo qua service name:

```text
db:5432
```

Dung stack:

```bash
docker compose down
```

Xoa ca database volume neu muon reset du lieu:

```bash
docker compose down -v
```

## Chay local

Can co PostgreSQL dang chay local truoc. Sau do cai dependencies:

```bash
npm install
```

Build frontend React ra thu muc `public`:

```bash
npm run build:web
```

Chay API local:

```bash
npm run dev
```

Hoac chay production command:

```bash
npm start
```

Neu chay local, co the cau hinh bang environment variables:

```bash
PORT=3000
JWT_SECRET=your-secret
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=auth_db
```

Khi chay Docker Compose, app dung `DATABASE_URL` da khai bao trong `docker-compose.yml`.

## Chay React development server

Neu muon code frontend voi hot reload, can chay API va Vite o 2 terminal.

Terminal 1, chay API:

```bash
npm run dev
```

Terminal 2, chay React:

```bash
npm run dev:web
```

React dev server chay tai:

```text
http://localhost:5173
```

Vite se proxy cac request `/api/*` va `/health` ve API tai `http://localhost:3000` khi chay local.
Khi chay Docker, frontend container se proxy ve service `http://api:3000`.

## Test API

Kiem tra healthcheck:

```bash
curl http://localhost:3000/health
```

Dang ky user:

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","username":"testuser","password":"password123"}'
```

Dang nhap:

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

Lay thong tin user hien tai, thay `<TOKEN>` bang token tra ve tu endpoint login:

```bash
curl http://localhost:3000/api/me \
  -H "Authorization: Bearer <TOKEN>"
```

## Cau truc nhanh

- `backend/src/server.js`: entrypoint khoi dong server va database.
- `backend/src/app.js`: tao Express app, gan middleware va routes.
- `backend/src/config/`: cau hinh runtime, PostgreSQL pool va migration nhe cho bang `users`.
- `backend/src/middlewares/`: middleware dung chung nhu logger, JWT auth va error handler.
- `backend/src/modules/auth/`: auth domain, gom routes, controller, service va repository.
- `backend/src/routes/`: route global khong thuoc domain nao, hien co `/health`.
- `frontend/src/App.jsx`: khai bao provider va page hien tai, sau nay co the dat Routes tai day.
- `frontend/src/api/`: client goi API.
- `frontend/src/components/ui/`: component UI dung chung nhu Field va Icon.
- `frontend/src/components/layout/`: component layout/branding dung lai giua cac page.
- `frontend/src/components/auth/`: component dac thu auth nhu AuthCard, PreviewTabs va SessionDebugger.
- `frontend/src/contexts/`: global state dung chung, hien co AuthContext.
- `frontend/src/pages/`: tang page/view, hien co AuthPage.
- `frontend/src/hooks/`: workflow UI cuc bo cua page auth.
- `frontend/src/utils/`: helper dung chung cho frontend.
- `public/`: frontend React sau khi build, duoc Express serve khi chay production/Docker.
- `vite.config.js`: cau hinh Vite build React va proxy API khi dev.
- `Dockerfile`: build image rieng cho API.
- `Dockerfile.frontend`: build image rieng cho frontend Vite.
- `docker-compose.yml`: chay rieng 3 service frontend, API va PostgreSQL trong cung Docker network.
