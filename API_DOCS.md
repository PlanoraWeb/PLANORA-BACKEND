# 📡 Planora API Dokümantasyonu

Bu doküman frontend ekibi ve entegrasyon geliştiricileri için hazırlanmıştır.  
Tüm endpoint'ler, request/response formatları ve auth akışı burada açıklanmaktadır.

---

## 🌐 Base URL
```
http://localhost:5000/api/v1
```

---

## 🔐 Authentication

Planora, **JWT tabanlı** kimlik doğrulama kullanır.

### Token Sistemi

| Token | Süre | Amaç |
|-------|------|-------|
| `accessToken` | 15 dakika | API isteklerinde kullanılır |
| `refreshToken` | 7 gün | Yeni access token almak için kullanılır |

### Korumalı Route Kullanımı

Tüm 🔒 işaretli endpoint'lere istek atarken header'a şunu ekle:
```
Authorization: Bearer <accessToken>
```

### Auth Akışı
```
1. POST /auth/register  → Kayıt ol
2. POST /auth/login     → accessToken + refreshToken al
3. İsteklerde Authorization: Bearer <accessToken> kullan
4. Access token süresi dolunca → POST /auth/refresh ile yenile
5. Çıkış yapmak için → POST /auth/logout
```

---

## 📋 Endpoint Listesi

### Health Check

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/health` | Sunucu durumu |

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "message": "Planora API is running"
  },
  "meta": { "timestamp": "2026-01-01T00:00:00.000Z" }
}
```

---

### 🔑 Auth — `/auth`

| Metot | Endpoint | Açıklama | Koruma |
|-------|----------|----------|--------|
| POST | `/auth/register` | Yeni kullanıcı kaydı | Public |
| POST | `/auth/login` | Giriş, token al | Public |
| POST | `/auth/refresh` | Access token yenile | Public |
| POST | `/auth/logout` | Mevcut cihazdan çıkış | Public |
| POST | `/auth/logout-all` | Tüm cihazlardan çıkış | 🔒 |

#### POST `/auth/register`
```json
// Request Body
{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "email": "ahmet@example.com",
  "password": "Sifre123"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "email": "ahmet@example.com",
    "role": "Member",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

#### POST `/auth/login`
```json
// Request Body
{
  "email": "ahmet@example.com",
  "password": "Sifre123"
}

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "firstName": "Ahmet",
      "lastName": "Yılmaz",
      "email": "ahmet@example.com",
      "role": "Member"
    }
  }
}
```

#### POST `/auth/refresh`
```json
// Request Body
{
  "refreshToken": "eyJ..."
}

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

#### POST `/auth/logout`
```json
// Request Body
{
  "refreshToken": "eyJ..."
}

// Response 200
{
  "success": true,
  "data": { "message": "Başarıyla çıkış yapıldı" }
}
```

---

### 👤 Users — `/users` 🔒

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| GET | `/users/me` | Kendi profilini getir |
| GET | `/users` | Tüm kullanıcıları listele |
| GET | `/users/:id` | ID ile kullanıcı getir |

#### GET `/users/me`
```json
// Response 200
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "email": "ahmet@example.com",
    "role": { "id": "uuid", "name": "Member" },
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### 📁 Projects — `/projects` 🔒

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/projects` | Yeni proje oluştur |
| GET | `/projects` | Üye olduğun projeleri listele |
| GET | `/projects/:id` | Proje detayı |
| PUT | `/projects/:id` | Proje güncelle |
| DELETE | `/projects/:id` | Proje sil |
| POST | `/projects/:id/members` | Projeye üye ekle |
| DELETE | `/projects/:id/members/:userId` | Projeden üye çıkar |

#### POST `/projects`
```json
// Request Body
{
  "name": "Planora Web",
  "description": "Ana web uygulaması"
}

// Response 201
{
  "success": true,
  "data": {
    "id": "uuid",
    "projectName": "Planora Web",
    "description": "Ana web uygulaması",
    "createdBy": { "id": "uuid", "firstName": "Ahmet", "lastName": "Yılmaz", "email": "ahmet@example.com" },
    "members": [...],
    "statuses": [
      { "id": "uuid", "name": "TODO", "position": 0, "isDefault": true },
      { "id": "uuid", "name": "IN_PROGRESS", "position": 1, "isDefault": false },
      { "id": "uuid", "name": "DONE", "position": 2, "isDefault": false }
    ]
  }
}
```

#### POST `/projects/:id/members`
```json
// Request Body
{
  "userId": "uuid",
  "role": "MEMBER"  // "MEMBER" veya "PROJECT_ADMIN"
}
```

---

### ✅ Tasks — `/tasks` 🔒

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/tasks/project/:projectId` | Göreve görev ekle |
| GET | `/tasks/project/:projectId` | Proje görevlerini listele |
| GET | `/tasks/:id` | Görev detayı |
| PUT | `/tasks/:id` | Görev güncelle |
| DELETE | `/tasks/:id` | Görev sil |
| PATCH | `/tasks/:id/status` | Görev durumunu değiştir (Kanban) |
| PATCH | `/tasks/:id/assign` | Görevi kullanıcıya ata |

#### POST `/tasks/project/:projectId`
```json
// Request Body
{
  "title": "Login sayfası tasarımı",
  "description": "Figma tasarımına uygun login sayfası",
  "priority": "HIGH",
  "type": "TASK",
  "statusId": "uuid",
  "assigneeId": "uuid",
  "dueDate": "2026-02-01T00:00:00.000Z"
}
```

#### PATCH `/tasks/:id/status`
```json
// Request Body
{
  "status": "IN_PROGRESS",
  "newOrder": 0
}
```

#### PATCH `/tasks/:id/assign`
```json
// Request Body
{
  "assigneeId": "uuid"  // null göndererek atamayı kaldırabilirsin
}
```

---

### 📊 Task Statuses — `/task-statuses` 🔒

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/task-statuses/project/:projectId` | Yeni Kanban kolonu oluştur |
| GET | `/task-statuses/project/:projectId` | Proje kolonlarını listele |
| PUT | `/task-statuses/:id` | Kolon güncelle |
| DELETE | `/task-statuses/:id` | Kolon sil |

#### POST `/task-statuses/project/:projectId`
```json
// Request Body
{
  "name": "IN_REVIEW",
  "position": 2
}
```

---

## ⚠️ Hata Formatı

Tüm hata yanıtları aynı formattadır:
```json
{
  "success": false,
  "error": {
    "code": "HATA_KODU",
    "message": "Hata açıklaması"
  }
}
```

| HTTP Kodu | Code | Açıklama |
|-----------|------|----------|
| 400 | `VALIDATION_ERROR` | Eksik veya hatalı veri |
| 401 | `UNAUTHORIZED` | Token yok veya geçersiz |
| 401 | `TOKEN_EXPIRED` | Refresh token süresi dolmuş |
| 401 | `TOKEN_REVOKED` | Token iptal edilmiş |
| 403 | `FORBIDDEN` | Yetki yok |
| 404 | `NOT_FOUND` | Kaynak bulunamadı |
| 409 | `CONFLICT` | Çakışma (örn: email zaten kayıtlı) |
| 500 | `INTERNAL_ERROR` | Sunucu hatası |

---

## 🔢 Enum Değerleri

### TaskPriority
`LOW` `MEDIUM` `HIGH` `URGENT`

### TaskType
`BUG` `TASK` `STORY`

### ProjectRole
`MEMBER` `PROJECT_ADMIN`