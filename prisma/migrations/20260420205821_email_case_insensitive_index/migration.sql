-- Mevcut veritabanındaki kayıtları küçük harfe dönüştür
UPDATE "users" SET "email" = LOWER("email");

-- Case-insensitive unique index oluştur (Böylece büyük/küçük harf ile tekrar kayıt açılamaz)
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (LOWER("email"));