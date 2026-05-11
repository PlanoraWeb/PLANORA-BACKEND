# 🗂️ PLANORA — Backend API

**Planora**, ekiplerin projelerini ve görevlerini Kanban tabanlı bir yapıyla yönetmesine olanak tanıyan proje yönetim platformunun backend servisidir.

---

## 📚 İçindekiler

- [Teknoloji Yığını](#-teknoloji-yığını)
- [Mimari](#-mimari)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Çalıştırma](#-çalıştırma)
- [API Endpoint'leri](#-api-endpointleri)
- [Veritabanı Şeması](#-veritabanı-şeması)
- [Proje Yapısı](#-proje-yapısı)
- [Komutlar](#-komutlar)

---

## 🛠️ Teknoloji Yığını

| Katman        | Teknoloji                     |
| ------------- | ----------------------------- |
| Runtime       | Node.js + TypeScript          |
| Framework     | Express 5                     |
| ORM           | Prisma 7                      |
| Veritabanı    | PostgreSQL 15 (Docker)        |
| Kimlik Doğ.   | JWT (jsonwebtoken) + bcryptjs |
| Validasyon    | Zod 4                         |
| Güvenlik      | Helmet, CORS                  |
| Loglama       | Morgan                        |
| Dev Tooling   | Nodemon, tsx, ESLint, Prettier|

---

## 🏗️ Mimari

Proje **Modüler Monolitik** mimari ile tasarlanmıştır. Her özellik kendi modülü altında izole edilmiş olup, modüller arası bağımlılık minimumda tutulmuştur.

```
src/
├── modules/          # Her modül kendi controller, service, routes ve validation dosyalarına sahiptir
│   ├── auth/         # Kayıt & Giriş
│   ├── user/         # Kullanıcı profili & listeleme
│   ├── project/      # Proje CRUD + üye yönetimi
│   ├── task/         # Görev CRUD + durum/atama değişikliği
│   └── task-status/  # Kanban kolonu CRUD
├── shared/           # Ortak altyapı
│   ├── config/       # Ortam değişkenleri
│   ├── middlewares/  # Auth, validation, error handler, async handler
│   ├── types/        # Ortak TypeScript tipleri
│   └── utils/        # Yardımcı fonksiyonlar
├── app.ts            # Express uygulaması & middleware zinciri
└── server.ts         # Sunucu başlatma
```

---

## ⚡ Kurulum

### Gereksinimler

- **Node.js** ≥ 18
- **Docker** & **Docker Compose** (PostgreSQL için)

### Adımlar

```bash
# 1 — Depoyu klonlayın
git clone https://github.com/PlanoraWeb/PLANORA-BACKEND.git
cd PLANORA-BACKEND

# 2 — Bağımlılıkları yükleyin
npm install

# 3 — .env dosyasını oluşturun (.env.example'ı referans alarak)
cp .env .env.local   # veya mevcut .env'yi düzenleyin

# 4 — PostgreSQL container'ını ayağa kaldırın
npm run db:up

# 5 — Prisma migration'larını çalıştırın
npx prisma migrate dev

# 6 — Geliştirme sunucusunu başlatın
npm run dev
```

---

## 🔐 Ortam Değişkenleri

Proje kök dizininde bir `.env` dosyası oluşturun:

```env
# Uygulama
PORT=5000
NODE_ENV=development

# Veritabanı (Docker Compose ile uyumlu)
DATABASE_URL="postgresql://planora_user:planora_password@localhost:5432/planora_db?schema=public"

# JWT
JWT_SECRET="guclu_bir_secret_key_buraya"
```

---

## 🚀 Çalıştırma

| Komut             | Açıklama                                   |
| ----------------- | ------------------------------------------ |
| `npm run dev`     | Geliştirme sunucusunu başlatır (nodemon)   |
| `npm run build`   | TypeScript → JavaScript derlemesi (tsc)    |
| `npm start`       | Production build'ini çalıştırır            |
| `npm run db:up`   | PostgreSQL container'ını başlatır          |
| `npm run db:down` | PostgreSQL container'ını durdurur          |

Sunucu varsayılan olarak `http://localhost:5000` adresinde çalışır.

---

## 📡 API Endpoint'leri

Tüm endpoint'ler `/api/v1` prefix'i altındadır. 🔒 işareti JWT gerektiren route'ları belirtir.

### Health Check

| Metot | Yol              | Açıklama            |
| ----- | ---------------- | -------------------- |
| GET   | `/api/health`    | Sunucu durum kontrolü |

### Auth — `/api/v1/auth`

| Metot | Yol          | Açıklama            |
| ----- | ------------ | -------------------- |
| POST  | `/register`  | Yeni kullanıcı kaydı |
| POST  | `/login`     | Giriş & JWT token    |

### Users — `/api/v1/users` 🔒

| Metot | Yol      | Açıklama                     |
| ----- | -------- | ----------------------------- |
| GET   | `/me`    | Mevcut kullanıcı profili      |
| GET   | `/`      | Tüm kullanıcıları listele    |
| GET   | `/:id`   | ID ile kullanıcı getir        |

### Projects — `/api/v1/projects` 🔒

| Metot  | Yol                    | Açıklama                |
| ------ | ---------------------- | ------------------------ |
| POST   | `/`                    | Yeni proje oluştur       |
| GET    | `/`                    | Tüm projeleri listele   |
| GET    | `/:id`                 | Proje detayı             |
| PUT    | `/:id`                 | Proje güncelle           |
| DELETE | `/:id`                 | Proje sil                |
| POST   | `/:id/members`         | Projeye üye ekle         |
| DELETE | `/:id/members/:userId` | Projeden üye çıkar       |

### Tasks — `/api/v1/tasks` 🔒

| Metot  | Yol                      | Açıklama                      |
| ------ | ------------------------ | ------------------------------ |
| POST   | `/project/:projectId`    | Projeye görev oluştur          |
| GET    | `/project/:projectId`    | Proje görevlerini listele     |
| GET    | `/:id`                   | Görev detayı                   |
| PUT    | `/:id`                   | Görev güncelle                 |
| DELETE | `/:id`                   | Görev sil                      |
| PATCH  | `/:id/status`            | Görev durumunu değiştir        |
| PATCH  | `/:id/assign`            | Görev atamasını değiştir       |

### Task Statuses — `/api/v1/task-statuses` 🔒

| Metot  | Yol                      | Açıklama                      |
| ------ | ------------------------ | ------------------------------ |
| POST   | `/project/:projectId`    | Kanban kolonu oluştur          |
| GET    | `/project/:projectId`    | Proje kolonlarını listele     |
| PUT    | `/:id`                   | Kolon güncelle                 |
| DELETE | `/:id`                   | Kolon sil                      |

---

## 🗄️ Veritabanı Şeması

Proje **6 ana tablo** içerir. Detaylı ER diyagramı için [`ER_DIAGRAM.md`](./ER_DIAGRAM.md) dosyasına bakınız.

```
Role  ──<  User  ──<  ProjectMember  >──  Project
                 │                            │
                 ├── Task (reporter)         TaskStatus
                 └── Task (assignee) ────────┘
```

**Enum'lar:**
- `TaskPriority`: `LOW` · `MEDIUM` · `HIGH` · `URGENT`
- `TaskType`: `BUG` · `TASK` · `STORY`

---

## 📂 Proje Yapısı

```
PLANORA-BACKEND/
├── prisma/
│   └── schema.prisma          # Veritabanı modelleri
├── src/
│   ├── modules/
│   │   ├── auth/              # controller, service, routes, validation
│   │   ├── user/              # controller, service, routes
│   │   ├── project/           # controller, service, routes, validation
│   │   ├── task/              # controller, service, routes, validation
│   │   └── task-status/       # controller, service, routes, validation
│   ├── shared/
│   │   ├── config/            # env.ts
│   │   ├── middlewares/       # authenticate, validate, errorHandler, asyncHandler
│   │   ├── types/             # Ortak tipler
│   │   └── utils/             # Yardımcı fonksiyonlar
│   ├── app.ts                 # Express app yapılandırması
│   └── server.ts              # Sunucu giriş noktası
├── docker-compose.yml         # PostgreSQL container
├── ER_DIAGRAM.md              # Mermaid ER diyagramı
├── tsconfig.json
├── package.json
└── .env                       # Ortam değişkenleri
```

---

## 🧪 Komutlar

```bash
# Geliştirme
npm run dev              # Hot-reload ile geliştirme sunucusu

# Veritabanı
npm run db:up            # Docker PostgreSQL başlat
npm run db:down          # Docker PostgreSQL durdur
npx prisma migrate dev   # Migration oluştur & uygula
npx prisma studio        # Prisma Studio (DB arayüzü)
npx prisma generate      # Prisma Client oluştur

# Build & Production
npm run build            # TypeScript derle
npm start                # Production sunucusu
```

---

## 📄 Lisans

ISC
