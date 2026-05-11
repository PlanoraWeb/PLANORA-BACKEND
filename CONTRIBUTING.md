# 🤝 Katkı Rehberi — Planora Backend

Bu doküman projeye yeni katılan geliştiriciler için kurulum,  
çalışma akışı ve kod standartlarını açıklamaktadır.

---

## 🛠️ Gereksinimler

Projeyi çalıştırmak için yalnızca iki araç yeterlidir:

| Araç | Sürüm | İndirme |
|------|-------|---------|
| Docker Desktop | Son sürüm | https://www.docker.com/products/docker-desktop |
| Node.js | 18 veya üzeri | https://nodejs.org |

> Node.js, PostgreSQL kurulumu gerekmez.  
> Veritabanı Docker üzerinde otomatik ayağa kalkar.

---

## ⚡ İlk Kurulum (Bir Kere Yapılır)

### 1. Repoyu klonla
```bash
git clone https://github.com/PlanoraWeb/PLANORA-BACKEND.git
cd PLANORA-BACKEND
```

### 2. Bağımlılıkları yükle
```bash
npm install
```

### 3. Ortam değişkenlerini ayarla
```bash
# .env.example dosyasını kopyala
cp .env.example .env
```

`.env` dosyasını aç ve şu alanları doldur:
```env
JWT_SECRET="en_az_32_karakter_uzun_rastgele_bir_key"
JWT_REFRESH_SECRET="baska_bir_en_az_32_karakter_uzun_key"
```

> Diğer alanlar Docker ile uyumlu şekilde ayarlanmış, değiştirmene gerek yok.

### 4. Veritabanını başlat
```bash
npm run db:up
```

### 5. Migration'ları çalıştır
```bash
npx prisma migrate dev
```

### 6. Seed verilerini yükle (rolleri oluşturur)
```bash
npm run db:seed
```

### 7. Geliştirme sunucusunu başlat
```bash
npm run dev
```

Sunucu `http://localhost:5000` adresinde çalışmaya başlar.  
`GET http://localhost:5000/api/health` ile kontrol edebilirsin.

---

## 🔄 Günlük Geliştirme Akışı

Projeye her yeni özellik için aşağıdaki adımları izle:

### 1. Ana branch'i güncelle
```bash
git checkout PLAN-42
git pull origin PLAN-42
```

### 2. Kendi branch'ini aç
```bash
# Format: feature/PLAN-<numara>-<kisa-aciklama>
git checkout -b feature/PLAN-55-proje-davet-sistemi
```

### 3. Kodunu yaz, commit at
```bash
git add .
git commit -m "feat(PLAN-55): proje davet sistemi eklendi"
```

### 4. Push'la
```bash
git push origin feature/PLAN-55-proje-davet-sistemi
```

### 5. GitHub'da Pull Request aç
- Base branch: `PLAN-42`
- Compare branch: `feature/PLAN-55-proje-davet-sistemi`
- Açıklama yaz, ekip arkadaşını reviewer olarak ekle

---

## 📝 Commit Mesajı Formatı
```
<tip>(<kapsam>): <açıklama>
```

| Tip | Kullanım |
|-----|----------|
| `feat` | Yeni özellik |
| `fix` | Hata düzeltme |
| `chore` | Yapılandırma, bağımlılık güncellemesi |
| `refactor` | Kod iyileştirme (davranış değişmez) |
| `docs` | Dokümantasyon |

**Örnekler:**
```bash
feat(PLAN-48): kullanıcı kayıt ve giriş API eklendi
fix(PLAN-52): refresh token süresi hesaplama hatası giderildi
chore: prisma schema güncellendi
docs: API_DOCS.md oluşturuldu
```

---

## 🌿 Branch Stratejisi
```
master          → Production (kararlı sürüm)
PLAN-42         → Ana geliştirme branch'i
  └── feature/PLAN-48-authentication
  └── feature/PLAN-55-davet-sistemi
  └── fix/PLAN-60-token-bug
```

> Direkt `master` veya `PLAN-42` branch'ine push yapma.  
> Her zaman kendi feature branch'inden Pull Request aç.

---

## 🗂️ Proje Yapısı
```
PLANORA-BACKEND/
├── prisma/
│   ├── schema.prisma        # Veritabanı modelleri
│   └── seed.ts              # Başlangıç verileri (roller)
├── src/
│   ├── modules/             # Her özellik kendi klasöründe
│   │   ├── auth/            # Kayıt, giriş, token yönetimi
│   │   ├── user/            # Kullanıcı profili
│   │   ├── project/         # Proje CRUD + üye yönetimi
│   │   ├── task/            # Görev CRUD + Kanban
│   │   └── task-status/     # Kanban kolonları
│   ├── shared/
│   │   ├── config/          # Ortam değişkenleri
│   │   ├── middlewares/     # Auth, validation, error handler
│   │   ├── types/           # TypeScript tipleri
│   │   └── utils/           # Yardımcı fonksiyonlar
│   ├── app.ts               # Express kurulumu
│   └── server.ts            # Sunucu başlangıcı
├── .env.example             # Ortam değişkeni şablonu
├── API_DOCS.md              # Frontend için API dokümantasyonu
├── docker-compose.yml       # PostgreSQL container
└── package.json
```

---

## 🧪 Faydalı Komutlar
```bash
# Geliştirme
npm run dev              # Sunucuyu başlat (hot reload)

# Veritabanı
npm run db:up            # PostgreSQL container başlat
npm run db:down          # PostgreSQL container durdur
npm run db:seed          # Seed verilerini yükle
npx prisma migrate dev   # Yeni migration oluştur ve uygula
npx prisma studio        # Veritabanı arayüzü (tarayıcıda açılır)
npx prisma generate      # Prisma client yeniden oluştur

# Build
npm run build            # TypeScript derle
npm start                # Production sunucusu başlat
```

---

## ❓ Sık Karşılaşılan Sorunlar

**`Cannot find module '@prisma/client'` hatası:**
```bash
npx prisma generate
```

**Veritabanına bağlanılamıyor:**
```bash
# Docker çalışıyor mu kontrol et
docker ps
# Çalışmıyorsa başlat
npm run db:up
```

**Migration hatası:**
```bash
# Migration geçmişini sıfırla (sadece geliştirmede)
npx prisma migrate reset
npm run db:seed
```

**Port 5000 kullanımda:**
```bash
# .env dosyasında PORT değerini değiştir
PORT=5001
```