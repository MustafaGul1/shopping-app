require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);
app.use(helmet()); 

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: "Çok fazla istek attınız, lütfen daha sonra tekrar deneyin."
});
app.use('/api/', apiLimiter); 
app.use(cors());
app.use(express.json());

// ==========================================
// 🔗 VERİTABANI BAĞLANTISI
// ==========================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Bağlandı!'))
  .catch(err => console.error('❌ Bağlantı Hatası:', err.message));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  sharedWith: [{ type: String }], 
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Bu email zaten kullanılıyor!' });
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const newUser = await User.create({ name, email, passwordHash: hashedPassword });
    res.status(201).json({ message: 'Kayıt başarılı!', userId: newUser._id });
  } catch (err) { next(err); }
});

// 🔥 YENİ SİLAH: E-posta ile Arkadaş Ekleme ve Listeleri Birleştirme
app.post('/api/users/share', verifyToken, async (req, res, next) => {
  try {
    const { friendEmail } = req.body;
    const myId = req.user.userId;

    // 1. Arkadaşın sistemde kayıtlı mı diye bak
    const friend = await User.findOne({ email: friendEmail });
    if (!friend) {
      return res.status(404).json({ error: 'Bu e-posta adresine sahip bir kullanıcı bulunamadı!' });
    }

    // 2. Kendini eklemeye çalışıyorsa engelle
    if (friend._id.toString() === myId) {
      return res.status(400).json({ error: 'Kendinizi arkadaş olarak ekleyemezsiniz!' });
    }

    // 3. Kendi bilgilerimizi bul
    const me = await User.findById(myId);

    // 4. Arkadaş zaten ekli mi kontrol et
    if (me.sharedWith.includes(friend._id.toString())) {
      return res.status(400).json({ error: 'Bu kişi zaten arkadaş listenizde!' });
    }

    // 5. Arkadaşı BİZİM listemize ekle
    me.sharedWith.push(friend._id.toString());
    await me.save();

    // 6. Çift Taraflı Senkronizasyon (Bizi de ONUN listesine ekle)
    if (!friend.sharedWith.includes(myId)) {
      friend.sharedWith.push(myId);
      await friend.save();
    }

    res.json({ message: 'Arkadaş başarıyla eklendi! Artık listelerinizi ortak görebilirsiniz.' });
  } catch (err) { 
    next(err); 
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Kullanıcı bulunamadı!' });
    const isPasswordCorrect = bcrypt.compareSync(password, user.passwordHash);
    if (!isPasswordCorrect) return res.status(401).json({ error: 'Şifre hatalı!' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Giriş başarılı!', token, user: { id: user._id, name: user.name, email: user.email }});
  } catch (err) { next(err); }
});

const verifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ error: 'Erişim reddedildi!' });
  const token = authHeader.split(' ')[1];
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) { res.status(400).json({ error: 'Geçersiz bilet!' }); }
};

app.post('/api/share', verifyToken, async (req, res, next) => {
  try {
    const { partnerEmail } = req.body;
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) return res.status(404).json({ error: "Bu e-posta ile kayıtlı kullanıcı bulunamadı!" });
    if (partner._id.toString() === req.user.userId) return res.status(400).json({ error: "Kendinizle paylaşamazsınız!" });
    const me = await User.findById(req.user.userId);
    if (!me.sharedWith.includes(partner._id.toString())) {
      me.sharedWith.push(partner._id.toString());
      await me.save();
      if (!partner.sharedWith.includes(me._id.toString())) {
        partner.sharedWith.push(me._id.toString());
        await partner.save();
      }
    }
    res.json({ message: "Liste başarıyla paylaşıldı!" });
  } catch (err) { next(err); }
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'shopping-app-images', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }
});
const upload = multer({ storage: storage });

const itemSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  
  // 🔥 ESKİ TEK FİYAT YERİNE, YENİ MARKET FİYATLARI SİSTEMİ:
  marketPrices: [{
    marketName: { type: String },  // Örn: "BİM" veya "A101"
    price: { type: Number },       // Örn: 42.50
    campaignNote: { type: String } // Örn: "Chokokare çeşidinde 2 al 1 öde var!"
  }],

  category: { type: String, default: "Genel" },
  quantity: { type: Number, default: 1 },
  isFavorite: { type: Boolean, default: false },
  
  // Bulut resim yükleme altyapın zaten harika çalışıyor:
  imageUrl: { type: String, default: "" }, 
  
  // 🔥 YENİ: Marketteki kişi alıp sepete atınca uygulamanın haberi olsun:
  isPurchased: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', itemSchema);
app.get('/api/items', verifyToken, async (req, res, next) => {
  try {
    const me = await User.findById(req.user.userId);
    const allowedUserIds = [req.user.userId, ...me.sharedWith];
    const items = await Item.find({ userId: { $in: allowedUserIds } }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { next(err); }
});


// 🚀 ZIRHLANDIRILMIŞ AI LİSTE OLUŞTURUCU 

app.post('/api/items/ai-generate', verifyToken, async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Lütfen bir cümle girin!" });
    
    console.log(`🤖 AI Toplu Liste Düşünüyor: "${prompt}"`);

    const systemPrompt = `
      Sen bir alışveriş asistanısın. Kullanıcının şu cümlesinden gereken tüm malzemeleri çıkar: "${prompt}"
      Bana SADECE geçerli bir JSON dizisi (array) döndür. Başka hiçbir açıklama veya markdown işareti kullanma.
      Her ürün objesi şu formatta olmalı:
      {
        "name": "Ürün Adı",
        "category": "Gıda", 
        "price": 50 
      }
    `;
// GÜNCELLEME:  Modeli olan gemini-2.5-flash'adayım
  const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
  });
    const aiData = await aiResponse.json();

    if (!aiData.candidates) {
      console.error("🛑 GOOGLE'DAN GELEN GİZLİ HATA:", JSON.stringify(aiData, null, 2));
      return res.status(500).json({ error: "Google'dan dönen hata: " + (aiData.error?.message || "Bilinmiyor") });
    }

    let aiText = aiData.candidates[0].content.parts[0].text.trim();

    if (aiText.startsWith('```json')) aiText = aiText.substring(7, aiText.length - 3).trim();
    else if (aiText.startsWith('```')) aiText = aiText.substring(3, aiText.length - 3).trim();

    const itemsArray = JSON.parse(aiText);

    const itemsToInsert = itemsArray.map(item => ({
      userId: req.user.userId,
      name: item.name,
      category: ["Gıda", "Temizlik", "Teknoloji", "Giyim", "Genel"].includes(item.category) ? item.category : "Genel",
      price: parseFloat(item.price) || 50,
      quantity: 1,
      imageUrl: ""
    }));

    const newItems = await Item.insertMany(itemsToInsert);
    res.status(201).json(newItems);

  } catch (err) {
    console.error("❌ JSON Parse veya Kayıt Hatası:", err);
    res.status(500).json({ error: "Yapay zeka listeyi oluşturamadı, cümleyi değiştirip tekrar deneyin." });
  }
});

app.post('/api/items', verifyToken, upload.single('image'), async (req, res, next) => {
  try {
    const { name, price, quantity, category } = req.body; 
    let imageUrl = "";
    if (req.file && req.file.path) imageUrl = req.file.path;

    let finalCategory = category || "Genel"; 
    
    if (process.env.GEMINI_API_KEY) {
      try {
        // 🔥 GÜNCELLEME: Tekli tahminler için de ücretsiz gemini-2.0-flash modelini 
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: `Kategoriyi tahmin et: "${name}". Sadece BİRİNİ yaz: Gıda, Temizlik, Teknoloji, Giyim, Genel.` }] }] })
        });
        const aiData = await aiResponse.json();
        
        if (aiData.candidates) {
          const predictedCategory = aiData.candidates[0].content.parts[0].text.trim();
          const validCategories = ["Gıda", "Temizlik", "Teknoloji", "Giyim", "Genel"];
          if (validCategories.includes(predictedCategory)) finalCategory = predictedCategory;
        }
      } catch (aiErr) { console.log("Tekli AI tahmini atlandı."); }
    }

    const newItem = await Item.create({
      userId: req.user.userId,
      name,
      price: parseFloat(price),
      category: finalCategory,
      quantity: quantity || 1,
      imageUrl: imageUrl
    });
    res.status(201).json(newItem);
  } catch (err) { next(err); }
});

app.put('/api/items/:id', verifyToken, async (req, res, next) => {
  try {
    const me = await User.findById(req.user.userId);
    const allowedUserIds = [req.user.userId, ...me.sharedWith];
    const updated = await Item.findOneAndUpdate(
      { _id: req.params.id, userId: { $in: allowedUserIds } }, 
      req.body, 
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(404).json({ error: 'Bulunamadı' });
    res.json(updated);
  } catch (err) { next(err); }
});

app.delete('/api/items/:id', verifyToken, async (req, res, next) => {
  try {
    const me = await User.findById(req.user.userId);
    const allowedUserIds = [req.user.userId, ...me.sharedWith];
    const deleted = await Item.findOneAndDelete({ _id: req.params.id, userId: { $in: allowedUserIds } });
    if (!deleted) return res.status(404).json({ error: 'Bulunamadı' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

app.use((err, req, res, next) => {
  console.error("💥 HATA:", err.message || err);
  res.status(500).json({ error: err.message || 'Sunucu hatası' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server çalışıyor: Port ${PORT}`);
});