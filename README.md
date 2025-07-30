# rest-auth-files

A robust REST API for authentication and file management with JWT, refresh tokens, and multi-device session support. Includes comprehensive integration tests for all API routes and unit tests for utility logic.

## 🛠️ Tech Stack

- **Express.js** — REST API framework
- **JWT** — Authentication and session management
- **Multer** — File uploads
- **Drizzle ORM** — Type-safe database access
- **MySQL** — Relational database
- **Docker** — Containerization and orchestration
- **Vitest** — Modern unit/integration testing framework
- **Supertest** — HTTP assertions and integration testing for Express

## 🚀 Quick Start

1. **Clone the repo:**

   ```bash
   git clone https://github.com/maxfromit/rest-auth-files.git
   cd rest-auth-files
   ```

2. **Copy environment variables:**

   ```bash
   cp .env\ example .env
   ```

   Edit `.env` as needed.

3. **Start the stack:**
   ```bash
   docker-compose up --build
   ```
   The service will be available at [http://localhost:3000/](http://localhost:3000/)

---

## 🗂️ API Endpoints

### Auth

| Method | Route               | Description                                                      |
| ------ | ------------------- | ---------------------------------------------------------------- |
| POST   | `/signup`           | Register new user (id = phone/email)                             |
| POST   | `/signin`           | Login, returns JWT and refresh token                             |
| POST   | `/signin/new_token` | Get new access token and rotated refresh token via refresh token |
| POST   | `/logout`           | Logout (revoke current session)                                  |

### File

| Method | Route                | Description                                  |
| ------ | -------------------- | -------------------------------------------- |
| POST   | `/file/upload`       | Upload new file (Multer, DB record)          |
| GET    | `/file/list`         | List files (pagination: `page`, `list_size`) |
| GET    | `/file/:id`          | Get file metadata by id                      |
| GET    | `/file/download/:id` | Download file by id                          |
| DELETE | `/file/delete/:id`   | Delete file (DB + disk)                      |
| PUT    | `/file/update/:id`   | Update file (replace file + DB record)       |

#### Example: List files with pagination

```
GET http://localhost:3000/file/list?page=2&list_size=5
```

### Info

| Method | Route   | Description                        |
| ------ | ------- | ---------------------------------- |
| GET    | `/info` | Get current user id (JWT required) |

---

## 🔒 Token & Session Logic

- **JWT (access token):** Short-lived, stateless, used for authentication. Returned in the response body.
- **Refresh token:** Long-lived, stored in the DB with a unique `session_id` per device/session, and sent to the client as an **HTTP-only, Secure, SameSite=Strict cookie**. This cookie is never accessible to JavaScript and is only sent by the browser to the `/signin/new_token` endpoint.
- **Multi-device:** Each login gets a new `session_id` and refresh token cookie. Logging out on one device does **not** affect others.
- **Refresh token rotation:** On every `/signin/new_token` request, a new refresh token and access token are issued. The old refresh token is revoked in the database. The client must always use the new refresh token cookie for future refreshes. This allows users to stay logged in indefinitely, as long as they keep refreshing before expiry. If a refresh token is stolen and used, the legitimate user's token will be revoked, improving security.
- **Logout:**
  - `POST /logout` revokes the refresh token for the current session (`session_id` from JWT).
  - After logout, both the refresh token and access token for that session are blocked.
  - Access token is checked on every request; if its session is revoked, access is denied.
- **Token revocation:**
  - On logout or refresh, the DB field `revoked_at` is set for the session.
  - Middleware checks `session_id` on every request for instant revocation.

**Security Note:**

- The refresh token is never exposed to frontend JavaScript, protecting it from XSS attacks.
- The refresh token cookie is only sent to the `/signin/new_token` endpoint, reducing its exposure and risk.
- The access token is short-lived and only stored in memory, minimizing risk if compromised.

---

## 📝 Notes

- The `id` field is used for both phone and email for simplicity. In a real-world app, these would be separate fields.

---

## 🗄️ File Storage

- Uploaded files are stored in a Docker-managed volume (`uploads`).
- The upload directory inside the container is `/app/uploads`.

---

## 📦 Centralized Messages (`messages.ts`)

All error and success messages are grouped and centralized in [`src/consts/messages.ts`](src/consts/messages.ts). This file exports objects for authentication and file messages, as well as utility functions for formatting error and message responses. Centralizing messages ensures:

- Consistent API responses across all controllers and middleware
- Easy updates and localization of messages
- DRY (Don't Repeat Yourself) code and improved maintainability

Example usage:

```typescript
import { fileMessages, asError, asMessage } from "../consts/messages.js"
// ...
return res.status(400).json(asError(fileMessages.error.noFileUploaded))
```

## 🧪 Testing

This project is tested as a real-world API with comprehensive integration tests, ensuring all routes and flows are covered as black-box endpoints. Unit tests are also included for utility functions to guarantee correctness in isolation. Mock functions are used to simulate database and file system operations in specific unit and integration tests, allowing for precise control over error and edge cases. This approach provides confidence in both the overall system behavior and the reliability of individual components.

When running tests in Docker (using the provided npm scripts), the tests execute against a real MySQL database and real file storage logic for almost all operations, closely simulating production behavior. This ensures that database logic, migrations, and file handling are fully exercised in a real environment, while still allowing for mocking in targeted scenarios.

**Vitest** is used for running tests and **Supertest** for HTTP assertions and integration testing of Express routes. Tests cover all authentication and file management endpoints, including edge cases and error handling. File upload and deletion are tested in-memory for speed and reliability, and all uploaded files are cleaned up after tests.

To run tests in Docker:

```bash
npm run test:in-docker
```

To generate a coverage report in Docker:

```bash
npm run coverage:in-docker
```

Test coverage is high and includes all major logic, error cases, and integration flows.

## 📝 Coverage Report

```
% Coverage report from istanbul
----------------------------------|---------|----------|---------|---------|-------------------
File                              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------------------|---------|----------|---------|---------|-------------------
All files                         |    83.2 |    86.36 |   88.63 |   83.07 |
 app                              |       0 |      100 |     100 |       0 |
  drizzle.config.ts               |       0 |      100 |     100 |       0 | 5-8
 app/src                          |   58.33 |      100 |       0 |   58.33 |
  app.ts                          |     100 |      100 |     100 |     100 |
  server.ts                       |       0 |      100 |       0 |       0 | 5-10
 app/src/consts                   |     100 |      100 |     100 |     100 |
  messages.ts                     |     100 |      100 |     100 |     100 |
  tokenConfig.ts                  |     100 |      100 |     100 |     100 |
 app/src/controllers              |   92.18 |    82.35 |     100 |   92.18 |
  authControllers.ts              |   96.29 |    91.66 |     100 |   96.29 | 91
  fileControllers.ts              |   89.18 |    77.27 |     100 |   89.18 | 27,46,59,72
 app/src/db                       |     100 |      100 |     100 |     100 |
  index.ts                        |     100 |      100 |     100 |     100 |
  schema.ts                       |     100 |      100 |     100 |     100 |
 app/src/db/scripts               |   18.75 |      100 |   33.33 |   18.75 |
  deleteFiles.ts                  |      60 |      100 |     100 |      60 | 9-10
  deleteUsers.ts                  |      60 |      100 |     100 |      60 | 9-10
  destroyer.ts                    |       0 |      100 |       0 |       0 | 4-10
  getFiles.ts                     |       0 |      100 |       0 |       0 | 6-20
  getTables.ts                    |       0 |      100 |       0 |       0 | 4-8
  getUsers.ts                     |       0 |      100 |       0 |       0 | 7-22
 app/src/middleware               |   91.66 |       90 |     100 |   91.66 |
  authMiddleware.ts               |     100 |      100 |     100 |     100 |
  multerConfig.ts                 |      80 |      100 |     100 |      80 | 12,21
  removeExistingFileMiddleware.ts |    87.5 |       50 |     100 |    87.5 | 22
 app/src/routes                   |     100 |      100 |     100 |     100 |
  authRoutes.ts                   |     100 |      100 |     100 |     100 |
  fileRoutes.ts                   |     100 |      100 |     100 |     100 |
  infoRoutes.ts                   |     100 |      100 |     100 |     100 |
 app/src/services                 |   98.64 |    90.62 |     100 |    98.5 |
  authServices.ts                 |   98.07 |     90.9 |     100 |   97.87 | 62
  fileServices.ts                 |     100 |       90 |     100 |     100 | 58
 app/src/tests                    |     100 |      100 |     100 |     100 |
  utils.ts                        |     100 |      100 |     100 |     100 |
 app/src/utils                    |   83.33 |       50 |     100 |     100 |
  getFilePath.ts                  |     100 |      100 |     100 |     100 |
  getUploadDir.ts                 |      75 |       50 |     100 |     100 | 4
  setRefreshTokenCookie.ts        |     100 |      100 |     100 |     100 |
----------------------------------|---------|----------|---------|---------|-------------------
```

## 🛠️ Development & Maintenance

- To remove all data (including DB tables and uploaded files), run:
  ```bash
  docker-compose down -v
  ```

---

## 📚 Useful Commands

- Start: `docker-compose up --build`
- Stop: `docker-compose down`
- Remove all data: `docker-compose down -v`
