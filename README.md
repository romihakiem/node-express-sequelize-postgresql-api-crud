# Express + PostgreSQL (pg / node-postgres) REST API Skeleton (No ORM)

REST API skeleton menggunakan **Node.js + Express**, **PostgreSQL via pg (node-postgres)** — pustaka resmi, tanpa Sequelize/ORM apapun, raw SQL dengan parameterized query — autentikasi **JWT**, CRUD lengkap, dan **graceful shutdown**.

## Struktur Folder

```
config/         -> config/database.js (pg Pool singleton)
controllers/    -> logic request/response (authController, itemController)
middleware/     -> auth middleware (protect, authorize), error handler (kode error PostgreSQL/SQLSTATE), validator
models/         -> User.js, Item.js: raw SQL query (parameterized $1,$2,...) + reshape hasil JOIN
routes/         -> route definitions (authRoutes, itemRoutes, index.js)
sql/            -> schema.sql (DDL: tabel, ENUM type, trigger updated_at) + migrate.js (runner sederhana)
utils/          -> jwt, response, pagination (LIMIT/OFFSET), password helper
app.js          -> setup express app (middleware & routes)
server.js       -> entrypoint: connect DB pool, listen, graceful shutdown
```

> Catatan: Karena tidak pakai ORM, **tidak ada Model class** seperti Sequelize.
> Folder `models/` berisi fungsi yang menjalankan **raw SQL** (selalu parameterized
> query `$1, $2, ...` — bukan string concatenation, supaya aman dari SQL injection)
> terhadap tabel `users` dan `items`. Semua hal yang biasanya otomatis di
> Sequelize — validasi, JOIN/include, exclude password, migration, `updated_at`
> otomatis — dikerjakan secara eksplisit (termasuk lewat trigger PostgreSQL untuk `updated_at`,
> karena Postgres tidak punya `ON UPDATE CURRENT_TIMESTAMP` bawaan seperti MySQL).

## Instalasi

```bash
npm install
cp .env.example .env
# sesuaikan PG_HOST, PG_DATABASE, PG_USER, PG_PASSWORD, JWT_SECRET di .env
```

Jalankan migration (membuat database kalau belum ada, membuat ENUM type, tabel `users` & `items`, index, dan trigger `updated_at` dari `sql/schema.sql`):

```bash
npm run db:migrate
```

Jalankan server:

```bash
npm run dev   # development, pakai nodemon
npm start     # production
```

## Autentikasi

Semua endpoint kecuali `/api/auth/register`, `/api/auth/login`, dan `/api/health` membutuhkan header:

```
Authorization: Bearer <token>
```

## Endpoints

### Auth

| Method | Endpoint             | Auth | Deskripsi                   |
| ------ | -------------------- | ---- | --------------------------- |
| POST   | `/api/auth/register` | ❌   | Daftar user baru            |
| POST   | `/api/auth/login`    | ❌   | Login, return JWT token     |
| GET    | `/api/auth/me`       | ✅   | Data user yang sedang login |

**Register**

```json
POST /api/auth/register
{
  "name": "Romi",
  "email": "romi@example.com",
  "password": "secret123"
}
```

**Login**

```json
POST /api/auth/login
{
  "email": "romi@example.com",
  "password": "secret123"
}
```

### Items (CRUD)

| Method | Endpoint         | Auth | Deskripsi                              |
| ------ | ---------------- | ---- | -------------------------------------- |
| GET    | `/api/items`     | ✅   | List item (pagination, search, filter) |
| GET    | `/api/items/:id` | ✅   | Detail item                            |
| POST   | `/api/items`     | ✅   | Buat item baru (owner = user login)    |
| PUT    | `/api/items/:id` | ✅   | Update item (hanya owner / admin)      |
| DELETE | `/api/items/:id` | ✅   | Hapus item (hanya owner / admin)       |

**Query params untuk GET /api/items**

- `page` (default 1)
- `limit` (default 10, max 100)
- `search` (cari berdasarkan `name`, pakai `ILIKE %keyword%` — case-insensitive khas Postgres)
- `category`
- `status` (`active` | `inactive`)

**Create Item**

```json
POST /api/items
{
  "name": "Kaos Polos",
  "description": "Kaos katun combed 30s",
  "category": "Fashion",
  "price": 75000,
  "stock": 50,
  "status": "active"
}
```

## Format Response

Sukses:

```json
{
  "success": true,
  "message": "Items fetched successfully",
  "data": [...],
  "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3, "hasNextPage": true, "hasPrevPage": false }
}
```

Gagal:

```json
{
    "success": false,
    "message": "Validation error",
    "errors": [{ "field": "status", "message": "status must be one of: active, inactive" }]
}
```

## Hal-hal yang dikerjakan manual (karena tanpa ORM)

- **Password excluded** — `User.findById()` memakai daftar kolom eksplisit (`SAFE_COLUMNS`) tanpa `password`. `User.findByEmail()` (khusus dipakai saat login) select semua kolom, lalu dibuang manual lewat `User.toSafeUser()`.
- **JOIN owner** — `INNER JOIN users` manual di `models/Item.js` (`BASE_SELECT`), hasil kolom `owner_*` di-reshape jadi nested object (`reshapeItemRow()`) — bukan `include: [...]`.
- **ENUM type** — `user_role` dan `item_status` didefinisikan sebagai custom PostgreSQL `ENUM TYPE` di `sql/schema.sql` (padanan `enum: [...]` di Sequelize/Mongoose).
- **`updated_at` otomatis** — PostgreSQL tidak punya `ON UPDATE CURRENT_TIMESTAMP`; solusinya pakai trigger `set_updated_at()` yang dijalankan `BEFORE UPDATE` di kedua tabel.
- **Validasi field (required, enum, min, minLength)** — dijalankan lewat `middleware/validate.js` (`validateBody()`) di layer route.
- **Migration/DDL** — `sql/schema.sql` (raw DDL, idempotent lewat `IF NOT EXISTS` / `DO $$ ... EXCEPTION`) + `sql/migrate.js` (runner: buat database kalau belum ada, lalu jalankan schema) — bukan `sequelize.sync()`.
- **Update parsial** — `Item.update()` membangun klausa `SET` secara dinamis dengan placeholder `$N` berurutan, hanya kolom yang benar-benar dikirim.

## Penanganan Error PostgreSQL

`middleware/errorMiddleware.js` menangani kode SQLSTATE yang umum muncul dari raw query (`err.code` di node-postgres):

- `23505` — unique_violation, mis. email sudah terdaftar → `409 Conflict`
- `23503` — foreign_key_violation, mis. `owner_id` tidak ada di tabel users → `400 Bad Request`
- `23514` — check_violation, mis. `price`/`stock` negatif → `422 Unprocessable Entity`
- `22001` — string_data_right_truncation, data melebihi panjang kolom → `422 Unprocessable Entity`
- `22P02` — invalid_text_representation, mis. nilai ENUM tidak valid → `422 Unprocessable Entity`

## Graceful Shutdown

`server.js` menangani `SIGTERM`, `SIGINT`, `unhandledRejection`, dan `uncaughtException`:

1. Berhenti menerima koneksi baru (`server.close`)
2. Menunggu request yang sedang berjalan selesai
3. Menutup connection pool pg (`pool.end()` — menunggu semua koneksi aktif di pool selesai, baru menutup semuanya)
4. Exit process (force-exit setelah 10 detik jika macet)

Berguna terutama saat deploy di Docker/Kubernetes agar tidak ada request yang terputus paksa saat pod di-restart.
