# RTA Ligi Mobil Uygulama

Rize Tenis Akademisi ligleri için gerçek mobil uygulama başlangıcı.

## Çalıştırma

```bash
npm install
npm run start
```

Expo açıldıktan sonra iPhone'da Expo Go ile test edilebilir. App Store/TestFlight için EAS Build kurulumu yapılır:

```bash
npx eas build:configure
npx eas build --platform ios
```

## İçerik

- Lig puan durumu
- Ranking
- Sonuçlar ve fikstür
- Turnuva listesi
- Yönetici skor girişi taslağı

Bu ilk sürüm örnek veriyle çalışır. Canlı veri için mevcut web sitesinin veritabanı/API yapısına bağlanması gerekir.

## Supabase

1. Supabase projesinde `supabase/schema.sql` dosyasını SQL Editor içinde çalıştırın.
2. `.env.example` dosyasını `.env` olarak kopyalayın.
3. Supabase Project URL ve anon public key değerlerini `.env` içine girin.
4. Uygulamayı yeniden başlatın.

```bash
npm run start
```

Uygulama `.env` yoksa örnek veriyle açılır. `.env` varsa `players`, `matches` ve `tournaments` tablolarından canlı veri okur.

## Mevcut index.html

Eski sitedeki `index.html` dosyasını bu proje klasörüne veya `work/` klasörüne ekleyin. İçindeki tablo isimleri, skor formatı ve turnuva alanları okunup Supabase şemasına birebir eşlenebilir.

## GitHub

GitHub reposu hazır olduğunda bu klasör doğrudan ilk commit olarak gönderilebilir. Önerilen repo adı:

```bash
rta-ligi-mobile
```
