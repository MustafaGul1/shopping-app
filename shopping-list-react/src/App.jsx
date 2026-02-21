import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- AUTH (KULLANICI) STATE'LERİ ---
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // --- TEMA (DARK MODE) STATE'İ ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  // --- ÜRÜN VE YÜKLEME STATE'LERİ ---
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null); 
  const [category, setCategory] = useState("Genel");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("date-desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isAdding, setIsAdding] = useState(false); 

  // --- ORTAK EKLEME STATE'LERİ ---
  const [partnerEmail, setPartnerEmail] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  // 🤖 YENİ: YAPAY ZEKA STATE'LERİ
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const API_URL = "https://shopping-backend-x3jp.onrender.com/api";

  const commonProducts = [
    "Süt", "Ekmek", "Yumurta", "Peynir", "Yoğurt", "Domates", 
    "Salatalık", "Elma", "Muz", "Çay", "Kahve", "Şeker", 
    "Tuz", "Deterjan", "Şampuan", "Diş Macunu", "Peçete"
  ];

  // ==========================================
  // 1. GİRİŞ VE KAYIT İŞLEMLERİ (AUTH)
  // ==========================================
  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      
      if (res.ok) {
        if (isLoginMode) {
          setToken(data.token);
          localStorage.setItem('token', data.token);
          setAuthForm({ name: '', email: '', password: '' }); 
        } else {
          alert("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
          setIsLoginMode(true);
        }
      } else {
        alert("Hata: " + data.error);
      }
    } catch (err) { alert("Sunucuya bağlanılamadı!"); }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setItems([]);
  };

  // ==========================================
  // 2. VERİTABANINDAN (MONGODB) VERİ ÇEKME
  // ==========================================
  const fetchItems = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/items`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else if (res.status === 401) {
        handleLogout(); 
      }
    } catch (err) { console.error("Veri çekme hatası:", err); }
  };

  useEffect(() => {
    fetchItems();
  }, [token]);

  // ==========================================
  // 🤝 3. ORTAK EKLEME (PAYLAŞIM) İŞLEMİ
  // ==========================================
  const handleShare = async (e) => {
    e.preventDefault();
    if (!partnerEmail.trim()) return;

    try {
      const res = await fetch(`${API_URL}/share`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ partnerEmail: partnerEmail.trim() })
      });
      
      const data = await res.json();
      if (res.ok) {
        setShareMessage("✅ Başarıyla eklendi!");
        setPartnerEmail("");
        fetchItems(); 
        setTimeout(() => setShareMessage(""), 3000); 
      } else {
        setShareMessage(`❌ Hata: ${data.error}`);
        setTimeout(() => setShareMessage(""), 3000);
      }
    } catch (err) {
      setShareMessage("❌ Sunucu hatası!");
    }
  };

  // ==========================================
  // 🤖 4. YENİ: YAPAY ZEKAYA CÜMLE GÖNDERME
  // ==========================================
  const handleAiGenerate = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true); // Yükleniyor animasyonunu başlat

    try {
      const res = await fetch(`${API_URL}/items/ai-generate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      
      if (res.ok) {
        const newAiItems = await res.json();
        setItems([...newAiItems, ...items]); // Gelen listeyi eskinin üstüne ekle
        setAiPrompt(""); // Kutuyu temizle
      } else {
        const errData = await res.json();
        alert("AI Hatası: " + errData.error);
      }
    } catch (err) {
      alert("Yapay zeka asistanına şu an ulaşılamıyor.");
      console.error(err);
    } finally {
      setIsAiLoading(false); // Yükleniyor animasyonunu durdur
    }
  };

  // ==========================================
  // 5. TEKLİ ÜRÜN VE FOTOĞRAF EKLEME
  // ==========================================
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) return;

    setIsAdding(true); 

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('price', price);
    formData.append('category', category);
    formData.append('quantity', 1);
    if (image) formData.append('image', image); 

    try {
      const res = await fetch(`${API_URL}/items`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
      });
      
      if (res.ok) {
        const newItem = await res.json();
        setItems([newItem, ...items]); 
        setName("");
        setPrice("");
        setImage(null); 
        document.getElementById('fileInput').value = ""; 
      }
    } catch (err) { console.error("Ekleme hatası:", err); } 
    finally { setIsAdding(false); }
  };

  // ==========================================
  // 6. SİLME VE FAVORİ İŞLEMLERİ
  // ==========================================
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/items/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setItems(items.filter(item => item._id !== id));
    } catch (err) { console.error("Silme hatası:", err); }
  };

  const toggleFavorite = async (item) => {
    try {
      const res = await fetch(`${API_URL}/items/${item._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFavorite: !item.isFavorite })
      });
      if (res.ok) {
        const updated = await res.json();
        setItems(items.map(i => i._id === updated._id ? updated : i));
      }
    } catch (err) { console.error("Güncelleme hatası:", err); }
  };

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFav = showFavoritesOnly ? item.isFavorite : true;
      return matchesSearch && matchesFav;
    })
    .sort((a, b) => {
      if (sortType === 'price-asc') return a.price - b.price;
      if (sortType === 'price-desc') return b.price - a.price;
      if (sortType === 'alpha-asc') return a.name.localeCompare(b.name);
      return new Date(b.createdAt) - new Date(a.createdAt); 
    });

  const categoryTotals = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.price;
    return acc;
  }, {});

  const grandTotal = items.reduce((sum, item) => sum + item.price, 0);

  // ==========================================
  // GÖRÜNÜM (UI) KISMI
  // ==========================================
  
  if (!token) {
    return (
      <div className="container">
        <header>
          <h2>{isLoginMode ? "🔐 Giriş Yap" : "📝 Kayıt Ol"}</h2>
        </header>
        <form onSubmit={handleAuth} style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          {!isLoginMode && (
            <input 
              type="text" placeholder="İsim" required 
              value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})}
            />
          )}
          <input 
            type="email" placeholder="Email adresi" required 
            value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})}
          />
          <input 
            type="password" placeholder="Şifre" required 
            value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})}
          />
          <button type="submit" id="addBtn">{isLoginMode ? "Giriş Yap" : "Kayıt Ol"}</button>
        </form>
        <div style={{textAlign: 'center', marginTop: '15px'}}>
          <button className="clear-btn-text" onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <h2>🛒 React Pro Listesi</h2>
        <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
          <button 
            className="clear-btn-text" 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            title="Temayı Değiştir"
            style={{fontSize: '1.2rem', textDecoration: 'none'}}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
          <button className="clear-btn-text" onClick={handleLogout} title="Çıkış Yap">🚪 Çıkış</button>
        </div>
      </header>

      {/* ================= 🤖 YENİ: AI ASİSTAN KUTUSU ================= */}
      <div className="ai-box" style={{ backgroundColor: 'rgba(29, 209, 161, 0.1)', border: '1px solid #1dd1a1', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#1dd1a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✨ AI Alışveriş Asistanı
        </h4>
        <form onSubmit={handleAiGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <textarea 
            placeholder="Ne planlıyorsun? (Örn: Akşama 4 kişilik lahmacun ve çoban salata yapacağım, evde hiçbir malzeme yok...)"
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            rows="3"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', resize: 'none' }}
          />
          <button 
            type="submit" 
            disabled={isAiLoading}
            style={{ backgroundColor: '#1dd1a1', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: isAiLoading ? 'wait' : 'pointer', fontWeight: 'bold' }}
          >
            {isAiLoading ? "⏳ AI Listenizi Hazırlıyor..." : "🪄 Sihirli Listeyi Oluştur"}
          </button>
        </form>
      </div>
      {/* ============================================================== */}
      
      <form onSubmit={handleAdd} style={{display: 'flex', flexDirection: 'column'}}>
        <div className="input-group" style={{marginBottom: '0'}}>
          <input 
            type="text" list="productSuggestions" placeholder="Ürün adı (Tekli Ekle)..." required
            value={name} onChange={e => setName(e.target.value)}
          />
          <datalist id="productSuggestions">
            {commonProducts.map((p, i) => <option key={i} value={p} />)}
          </datalist>

          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option>Genel</option>
            <option>Gıda</option>
            <option>Temizlik</option>
            <option>Teknoloji</option>
            <option>Giyim</option>
          </select>
          
          <input 
            type="number" placeholder="Fiyat" required
            value={price} onChange={e => setPrice(e.target.value)}
          />
          <button id="addBtn" disabled={isAdding} style={{ opacity: isAdding ? 0.7 : 1 }}>
            {isAdding ? "⏳" : "Ekle"}
          </button>
        </div>
        
        <div className="file-input-container">
          <input 
            type="file" id="fileInput" accept="image/*" 
            onChange={e => setImage(e.target.files[0])} 
          />
        </div>
      </form>

      {/* ================= ORTAK EKLEME BÖLÜMÜ ================= */}
      <div className="toolbar" style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '10px', marginTop: '10px' }}>
        <form onSubmit={handleShare} style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>🤝</span>
          <input 
            type="email" 
            placeholder="Arkadaşının Emailini Gir..." 
            value={partnerEmail} 
            onChange={e => setPartnerEmail(e.target.value)}
            style={{ flex: 1, margin: 0 }}
          />
          <button type="submit" className="fav-filter-btn" style={{ padding: '8px 15px' }}>
            Ortak Ekle
          </button>
        </form>
        {shareMessage && (
          <div style={{ width: '100%', textAlign: 'center', marginTop: '5px', fontSize: '0.9rem', color: shareMessage.includes('✅') ? '#2ecc71' : '#ff4757' }}>
            {shareMessage}
          </div>
        )}
      </div>

      <div className="toolbar" style={{ marginTop: '10px' }}>
        <input 
          type="text" placeholder="🔍 Ara..." 
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={sortType} onChange={e => setSortType(e.target.value)}>
          <option value="date-desc">En Yeni</option>
          <option value="price-asc">Fiyat (Artan)</option>
          <option value="price-desc">Fiyat (Azalan)</option>
          <option value="alpha-asc">A-Z</option>
        </select>
        <button 
          className={`fav-filter-btn ${showFavoritesOnly ? 'active' : ''}`}
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          {showFavoritesOnly ? "❤️ Favoriler" : "🤍 Tümü"}
        </button>
      </div>

      <ul>
        {filteredItems.map(item => (
          <li key={item._id} className={item.isFavorite ? "fav-item" : ""}>
            <div className="item-info">
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.name} className="item-image" />
              )}
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                <span className="category-badge">{item.category}</span>
                <span className="item-name">{item.name}</span>
              </div>
            </div>
            
            <div className="actions">
              <span className="price-tag">{item.price} ₺</span>
              
              <button className="action-btn fav-btn" onClick={() => toggleFavorite(item)}>
                <svg viewBox="0 0 24 24" fill={item.isFavorite ? "#ff4757" : "none"} stroke={item.isFavorite ? "#ff4757" : "#999"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              
              <button className="bin-button" onClick={() => handleDelete(item._id)}>
                <svg className="bin-top" viewBox="0 0 39 5" xmlns="http://www.w3.org/2000/svg">
                  <line y1="5" x2="39" y2="5" stroke="white" strokeWidth="4"></line>
                  <line x1="12" y1="1.5" x2="26" y2="1.5" stroke="white" strokeWidth="3"></line>
                </svg>
                <svg className="bin-bottom" viewBox="0 0 33 39" xmlns="http://www.w3.org/2000/svg">
                  <mask id="path-1-inside-1_8_19">
                    <path d="M0 0H33V35C33 37.2091 31.2091 39 29 39H4C1.79086 39 0 37.2091 0 35V0Z"></path>
                  </mask>
                  <path d="M0 0H33H0ZM37 35C37 39.4183 33.4183 43 29 43H4C-0.418278 43 -4 39.4183 -4 35H4H29H37ZM4 43C-0.418278 43 -4 39.4183 -4 35V0H4V35V43ZM37 0V35C37 39.4183 33.4183 43 29 43V35V0H37Z" fill="white" mask="url(#path-1-inside-1_8_19)"></path>
                  <path d="M12 6L12 29" stroke="white" strokeWidth="4"></path>
                  <path d="M21 6V29" stroke="white" strokeWidth="4"></path>
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul> 

      <div className="stats-section">
        <div className="category-breakdown">
          {Object.entries(categoryTotals).map(([cat, total]) => (
            <div key={cat} className="cat-stat">
              <span>{cat}:</span> <strong>{total}₺</strong>
            </div>
          ))}
        </div>
        <div className="grand-total">
          Toplam: {grandTotal} ₺
        </div>
      </div>
    </div>
  );
}

export default App;