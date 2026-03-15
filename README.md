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
