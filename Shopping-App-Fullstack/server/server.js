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

// ==========================================
// 👤 KULLANICI ŞEMASI (ORTAKLAR EKLENDİ 🤝)
// ==========================================
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  sharedWith: [{ type: String }], // YENİ: Ortakların ID'lerini burada tutacağız
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

// ==========================================
// 🔐 AUTH (KAYIT VE GİRİŞ) API'LERİ
// ==========================================
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

// ==========================================
// 🤝 YENİ: ORTAK EKLEME API'Sİ
// ==========================================
app.post('/api/share', verifyToken, async (req, res, next) => {
  try {
    const { partnerEmail } = req.body;
    
    // Arkadaşımızı veritabanında bulalım
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) return res.status(404).json({ error: "Bu e-posta ile kayıtlı kullanıcı bulunamadı!" });

    if (partner._id.toString() === req.user.userId) return res.status(400).json({ error: "Kendinizle paylaşamazsınız!" });

    const me = await User.findById(req.user.userId);

    // Eğer daha önce eklenmemişse, birbirimizi ortak olarak ekleyelim
    if (!me.sharedWith.includes(partner._id.toString())) {
      me.sharedWith.push(partner._id.toString());
      await me.save();

      // Karşı tarafın listesine de beni ekle (Karşılıklı bağlantı)
      if (!partner.sharedWith.includes(me._id.toString())) {
        partner.sharedWith.push(me._id.toString());
        await partner.save();
      }
    }
    
    res.json({ message: "Liste başarıyla paylaşıldı!" });
  } catch (err) { next(err); }
});

// ==========================================
// 📦 ÜRÜN ŞEMASI VE FOTOĞRAF AYARLARI
// ==========================================
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
  price: { type: Number, required: true },
  category: { type: String, default: "Genel" },
  quantity: { type: Number, default: 1 },
  isFavorite: { type: Boolean, default: false },
  imageUrl: { type: String, default: "" }, 
  createdAt: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', itemSchema);

// GET: Sadece benim değil, ortaklarımın ürünlerini de getir
app.get('/api/items', verifyToken, async (req, res, next) => {
  try {
    const me = await User.findById(req.user.userId);
    const allowedUserIds = [req.user.userId, ...me.sharedWith]; // Ben + Ortaklarım

    const items = await Item.find({ userId: { $in: allowedUserIds } }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { next(err); }
});

app.post('/api/items', verifyToken, upload.single('image'), async (req, res, next) => {
  try {
    const { name, price, category, quantity } = req.body; 
    let imageUrl = "";
    if (req.file && req.file.path) imageUrl = req.file.path;

    const newItem = await Item.create({
      userId: req.user.userId,
      name,
      price: parseFloat(price),
      category,
      quantity: quantity || 1,
      imageUrl: imageUrl
    });
    res.status(201).json(newItem);
  } catch (err) { next(err); }
});

// PUT & DELETE: Ortaklarımın ürünlerini silmeme ve düzenlememe izin ver
app.put('/api/items/:id', verifyToken, async (req, res, next) => {
  try {
    const me = await User.findById(req.user.userId);
    const allowedUserIds = [req.user.userId, ...me.sharedWith];

    const updated = await Item.findOneAndUpdate(
      { _id: req.params.id, userId: { $in: allowedUserIds } }, 
      req.body, 
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(404).json({ error: 'Bulunamadı veya yetkiniz yok' });
    res.json(updated);
  } catch (err) { next(err); }
});

app.delete('/api/items/:id', verifyToken, async (req, res, next) => {
  try {
    const me = await User.findById(req.user.userId);
    const allowedUserIds = [req.user.userId, ...me.sharedWith];

    const deleted = await Item.findOneAndDelete({ _id: req.params.id, userId: { $in: allowedUserIds } });
    if (!deleted) return res.status(404).json({ error: 'Bulunamadı veya yetkiniz yok' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ==========================================
// 🚨 GİZLİ HATALARI ÇEVİREN YAKALAYICI
// ==========================================
app.use((err, req, res, next) => {
  console.error("💥 KESİN HATA SEBEBİ:", err.message || err);
  res.status(500).json({ error: err.message || 'Sunucu hatası' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server çalışıyor: Port ${PORT}`);
});