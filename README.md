# rest-auth-files

A robust REST API for authentication and file management with JWT, refresh tokens, and multi-device session support.

## 🛠️ Tech Stack

- **Express.js** — REST API framework
- **JWT** — Authentication and session management
- **Multer** — File uploads
- **Drizzle ORM** — Type-safe database access
- **MySQL** — Relational database
- **Docker** — Containerization and orchestration

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
