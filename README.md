# 🛒 ShopSync: AI Destekli Ortak Alışveriş ve Fiyat Takip Platformu

**Proje Açıklaması:** ShopSync, kullanıcıların aile üyeleri veya arkadaşlarıyla ortak alışveriş listeleri oluşturabildiği, yapay zeka desteğiyle saniyeler içinde malzeme listesi çıkarabildiği ve ürünlerin farklı marketlerdeki fiyatlarını karşılaştırabildiği modern bir e-ticaret/yardımlaşma platformudur.

## 📖 Proje Senaryosu
Market alışverişleri sırasında yaşanan "Hangi marka? Hangi çeşit?" karmaşasını önleyen bu platform, iki ana kullanım senaryosu ile çalışır:

* **Evdeki/Destek Kullanıcı:** Aile üyesinin e-postasını girerek hesabı bağlar. Listeye eklenecek ürünün tam fotoğrafını yükler, internetten BİM, ŞOK, A101, Migros gibi market fiyatlarını araştırıp not düşer.
* **Marketteki Kullanıcı:** Alışveriş sırasında sadece listeye ve yüklenen fotoğrafa bakar, doğru ürünü raftan alıp tek tıkla "Sepete Eklendi" olarak işaretler.
* **AI Asistanı:** Her iki kullanıcı da "Akşama 4 kişilik mantı ziyafeti vereceğim" yazdığında, gerekli tüm malzemeleri saniyeler içinde listeye otomatik döker.

##  Neden Bu Konu?
* Market alışverişlerinde yaşanan yanlış ürün/marka alma sorununun sık sık yaşanması.
* Enflasyon nedeniyle marketler arası anlık fiyat karşılaştırmasının hayati önem taşıması.
* Yapay Zeka (AI) entegrasyonu ile zaman tasarrufu sağlama ihtiyacı.
* NoSQL veritabanında ilişkisel veri (ortak arkadaş listesi) yönetimi deneyimi.

## 📋 Müşteri Gereksinimleri
* ✅ Güvenli giriş ve JWT tabanlı kimlik doğrulama.
* ✅ Kullanıcıların e-posta ile birbirini "Ortak" olarak ekleyebilmesi.
* ✅ Cloudinary ile buluta ürün fotoğrafı yükleme ve görüntüleme.
* ✅ Google Gemini AI ile doğal dilden ürün listesi çıkarma.
* ✅ Farklı marketler için (BİM, ŞOK vb.) fiyat ve kampanya notu girebilme.
* ✅ Alınan ürünlerin işaretlenmesi ve canlı liste yönetimi.
* ❌ (Yapım Aşamasında) Alışveriş sırasında ürünün doğru şekilde tanımlanması için fotoğraf yükleme zorunluluğu.

## 🛠️ Teknoloji Stack

| Teknoloji | Versiyon | Kullanım Amacı |
| :--- | :--- | :--- |
| **Node.js & Express** | 22.x | Backend API ve Sunucu Yönetimi |
| **React.js (Vite)** | 18.x | Dinamik Frontend (Kullanıcı Arayüzü) |
| **MongoDB Atlas** | Cloud | NoSQL Bulut Veritabanı |
| **Mongoose** | 8.x | Veritabanı Şema Modellemesi |
| **Google Gemini API** | 2.5-Flash | Yapay Zeka (Doğal Dil İşleme) |
| **Cloudinary** | API | Medya ve Fotoğraf Depolama |
| **BCrypt.js & JWT** | Son | Şifreleme ve Güvenli Oturum Yönetimi |

## 📁 Proje Yapısı

``` text
shopsync/
├── client/                 # React Frontend Klasörü
│   ├── src/
│   │   ├── App.jsx         # Ana UI ve State Yönetimi (AI, Formlar, Listeler)
│   │   ├── App.css         # Stil ve Dark Mode özellikleri
│   │   └── main.jsx        # React DOM render
├── server/                 # Node.js Backend Klasörü
│   ├── models/
│   │   ├── User.js         # Kullanıcı ve Arkadaş (sharedWith) modeli
│   │   └── Item.js         # Ürün, Market Fiyatları ve Fotoğraf modeli
│   ├── .env                # Gizli API anahtarları (Git'e atılmaz)
│   └── server.js           # Ana sunucu, Express rotaları, AI ve Cloudinary ayarları
└── README.md
```
## 🚀 Kurulum ve ÇalıştırmaGereksinimler: Node.js, MongoDB Atlas hesabı, Google Gemini API Anahtarı1. Projeyi KlonlayınBashgit clone <repo-url>
cd shopsync_repo
2. Bağımlılıkları YükleyinBashcd server && npm install
cd ../client && npm install
3. Environment (.env) Dosyasını Yapılandırınserver klasörü içine .env dosyası oluşturun:Kod snippet'iPORT=10000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0...
JWT_SECRET=your_super_secret_key
GEMINI_API_KEY=your_google_ai_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
⚠️ ÖNEMLİ: Şifrelerinizdeki özel karakterleri URL encode etmeyi unutmayın!4. Uygulamayı ÇalıştırınBash# Terminal 1 (Backend)
cd server
node server.js

# Terminal 2 (Frontend)
cd client
npm run dev
5. Tarayıcıda Açın http://localhost:5173🗄️ MongoDB Atlas KoleksiyonlarıKoleksiyonAçıklamausersKullanıcı bilgileri, şifre hash'leri ve Ekli Arkadaşların referanslarıitemsÜrün adları, fotoğrafları, AI tarafından üretilen metinler ve Market fiyat detayları👤 Kullanıcı EkranlarıGiriş & Kayıt Ekranı: E-posta + şifre ile güvenli giriş, JWT Token ile yetkilendirme.AI Alışveriş Asistanı: Doğal dil ile prompt girme (Örn: "Kahvaltı hazırlayacağım"), AI yükleme animasyonu ve otomatik listeleme.Ortak Ekleme (Arkadaşlık Sistemi): E-posta adresi ile arkadaş bulma, Listelerin çift taraflı (bi-directional) senkronizasyonu.Ürün & Fiyat Yönetimi: Ürün adı, kategori ve fotoğraf (Cloudinary) ekleme, Market fiyatları (BİM, A101) ve kampanya notları girme, Satın alınan ürünleri "Favori/Alındı" olarak işaretleme.📊 Veritabanı ŞemasıUser CollectionJSON{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "passwordHash": "string",
  "sharedWith": ["ObjectId"], // Ekli arkadaşların User ID'leri
  "createdAt": "DateTime"
}
Item CollectionJSON{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "name": "string",
  "marketPrices": [
    {
      "marketName": "string",
      "price": "decimal",
      "campaignNote": "string"
    }
  ],
  "imageUrl": "string", // Cloudinary'den dönen güvenli URL
  "isPurchased": "boolean",
  "createdAt": "DateTime"
}
🔐 Güvenlik ÖzellikleriBCrypt.js ile şifrelerin geri döndürülemez şekilde hashlenmesi.JWT (JSON Web Token) ile API rotalarının korunması (Sadece giriş yapanlar liste görebilir).CORS politikalarının Vercel ve Render arasında güvenli yapılandırılması.Dotenv ile API anahtarlarının sunucu tarafında gizlenmesi.🐛 Sorun Giderme1. AI Hata Veriyor (Limit 0 veya Geo-blocking)Çözüm: Google Gemini API'nin Avrupa sunucularında kısıtlamaları vardır. Projenin Backend kısmı Render.com üzerinden ABD (US) sunucularında (Oregon/Ohio) ayağa kaldırılarak bu sorun kökten çözülmüştür.2. Kullanıcı Arkadaş Olarak EklenemiyorÇözüm: E-posta adresinin büyük/küçük harf duyarlılığını kontrol edin. Kodda trim() ve toLowerCase() fonksiyonlarının devrede olduğundan emin olun.
