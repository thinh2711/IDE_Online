# package.json Explained
tôi đã hoàn thành kiểm tra xong, tiếp theo đến công việc milestone 2 
File `package.json` la file cau hinh trung tam cua project Node.js. No mo ta thong tin project, cac lenh co the chay bang `npm`, va cac package can cai.

Luu y: `package.json` la JSON chuan nen khong the them comment truc tiep bang `//` hoac `#`. Neu muon ghi chu, nen dat vao file markdown rieng nhu file nay.

## Metadata

```json
{
```

Mo object JSON chinh.

```json
"name": "DOCKER_TEST",
```

Ten project/package. Trong project local, field nay chu yeu dung de dinh danh project.

```json
"version": "1.0.0",
```

Version hien tai cua project.

```json
"description": "Express API with PostgreSQL and JWT auth, containerized with Docker Compose.",
```

Mo ta ngan gon project: Express API, PostgreSQL, JWT auth va Docker Compose.

```json
"main": "backend/src/server.js",
```

File entrypoint mac dinh cua package. Voi project nay, file nay cung la entrypoint khoi dong backend.

## Scripts

```json
"scripts": {
```

Khai bao cac lenh co the chay bang `npm run <script-name>`.

```json
"start": "node backend/src/server.js",
```

Chay backend o che do binh thuong/production.

Dung:

```bash
npm start
```

Docker backend dang goi lenh nay qua:

```dockerfile
CMD ["npm", "start"]
```

```json
"dev": "node --watch backend/src/server.js",
```

Chay backend o che do development. Flag `--watch` giup Node tu restart khi source code thay doi.

Dung:

```bash
npm run dev
```

```json
"test": "node --test backend/test/*.test.js",
```

Chay test backend bang test runner co san cua Node.js.

Dung:

```bash
npm test
```

```json
"dev:web": "vite --host 0.0.0.0",
```

Chay Vite dev server cho frontend React. `--host 0.0.0.0` cho phep server lang nghe tu moi network interface, huu ich khi chay trong Docker hoac can truy cap tu may khac.

Dung:

```bash
npm run dev:web
```

```json
"build:web": "vite build"
```

Build frontend React/Vite thanh static files. Trong project nay output duoc cau hinh ra thu muc `public`.

Dung:

```bash
npm run build:web
```

Docker frontend dang goi lenh nay trong stage build.

## Dependencies

```json
"dependencies": {
```

Danh sach package can co de app chay that o production.

```json
"bcryptjs": "^2.4.3",
```

Dung de hash password khi register va so sanh password khi login.

```json
"dotenv": "^16.4.5",
```

Dung de doc bien moi truong tu file `.env`.

```json
"express": "^4.21.2",
```

Framework backend Node.js de tao REST API server.

```json
"jsonwebtoken": "^9.0.2",
```

Dung de tao va verify JWT token cho authentication.

```json
"pg": "^8.13.1"
```

PostgreSQL client cho Node.js, dung de ket noi va query database.

## Dev Dependencies

```json
"devDependencies": {
```

Danh sach package phuc vu development/build. Trong backend runtime production, Dockerfile dang bo qua nhom nay bang `npm ci --omit=dev`.

```json
"@vitejs/plugin-react": "^6.0.3",
```

Plugin giup Vite xu ly React.

```json
"react": "^18.3.1",
```

Thu vien React de xay UI.

```json
"react-dom": "^18.3.1",
```

Dung de render React component vao DOM tren browser.

```json
"vite": "^8.1.3"
```

Build tool va dev server cho frontend.

## Version Prefix

Ky tu `^` trong version, vi du:

```json
"express": "^4.21.2"
```

Nghia la npm co the cai ban moi hon trong cung major version, vi du `4.x.x`, nhung khong tu dong nhay len `5.x.x`.

## Project Summary

Project nay dang gom frontend va backend chung trong mot `package.json`:

| Command | Muc dich |
| --- | --- |
| `npm start` | Chay backend production |
| `npm run dev` | Chay backend development co watch |
| `npm test` | Chay backend tests |
| `npm run dev:web` | Chay frontend dev server |
| `npm run build:web` | Build frontend ra static files |

