# Çikolata Değerlendirme Uygulaması 🍫

Gruplar halinde çikolata değerlendirme yapabileceğiniz bir web uygulaması.

## Özellikler

- 👥 Kullanıcı adı ile basit giriş
- 🎮 Lobi oluşturma ve katılma sistemi
- ⭐ Çikolataları 1-5 arası puanlama
- 📊 Gerçek zamanlı oylama takibi
- 🏆 Detaylı sonuç sayfası

## Teknolojiler

- Next.js 13+
- TypeScript
- Tailwind CSS
- Firebase Realtime Database

## Kurulum

1. Repository'yi klonlayın:
   ```bash
   git clone https://github.com/dorukungor/ArminArlet.git
   cd ArminArlet
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Firebase projenizi oluşturun ve `.env.local` dosyasına yapılandırma bilgilerinizi ekleyin:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## Kullanım

1. Ana sayfada kullanıcı adınızı girin
2. Yeni bir lobi oluşturun veya mevcut bir lobiye katılın
3. Lobi sahibi oylamayı başlatır
4. Her kullanıcı sırayla çikolataları 1-5 arası puanlar
5. Tüm oylar verildikten sonra sonuçlar görüntülenir

## Firebase Güvenlik Kuralları

Realtime Database için önerilen güvenlik kuralları:

```json
{
  "rules": {
    "lobbies": {
      ".read": true,
      ".write": true,
      "$lobbyId": {
        ".validate": "newData.hasChildren(['owner', 'participants', 'status'])",
        "participants": {
          "$uid": {
            ".validate": "newData.isBoolean()"
          }
        },
        "votes": {
          "$chocolateIndex": {
            "$uid": {
              ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 5"
            }
          }
        }
      }
    }
  }
}
```

## Lisans

MIT
</rewritten_file>