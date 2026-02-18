import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- STATE YÖNETİMİ ---
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("react-items");
    return saved ? JSON.parse(saved) : [];
  });

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Genel");
  
  // Filtreler
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("date-desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Öneri Listesi
  const commonProducts = [
    "Süt", "Ekmek", "Yumurta", "Peynir", "Yoğurt", "Domates", 
    "Salatalık", "Elma", "Muz", "Çay", "Kahve", "Şeker", 
    "Tuz", "Deterjan", "Şampuan", "Diş Macunu", "Peçete"
  ];

  // Her değişimde kaydet
  useEffect(() => {
    localStorage.setItem("react-items", JSON.stringify(items));
  }, [items]);

  // --- 1. AKILLI EKLEME (FİYAT GEÇMİŞİ ANALİZİ) ---
  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) return;

    // Önceki aynı isimli ürünü bul
    const previousItem = items.find(i => i.name.toLowerCase() === name.trim().toLowerCase());
    
    let priceTrend = null; // 'up', 'down', 'same'
    
    if (previousItem) {
      if (parseFloat(price) > previousItem.price) priceTrend = "up";
      else if (parseFloat(price) < previousItem.price) priceTrend = "down";
      else priceTrend = "same";
    }

    const newItem = {
      id: Date.now(),
      name: name.trim(),
      price: parseFloat(price),
      category,
      isFavorite: false, // Favori özelliği
      trend: priceTrend // Fiyat trendi
    };

    setItems([newItem, ...items]);
    setName("");
    setPrice("");
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  // --- 2. FAVORİ TOGGLE ---
  const toggleFavorite = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };

  const handleClear = () => {
    if (confirm("Tüm liste silinecek?")) setItems([]);
  };

  // --- 3. LİSTELEME VE SIRALAMA MANTIĞI ---
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
      return b.id - a.id; // date-desc (Varsayılan)
    });

  // --- 4. KATEGORİ BAZLI TOPLAM (RAPORLAMA) ---
  const categoryTotals = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.price;
    return acc;
  }, {});

  const grandTotal = items.reduce((sum, item) => sum + item.price, 0);

  // --- GÖRÜNÜM ---
  return (
    <div className="container">
      <header>
        <h2>🛒 React Pro Listesi</h2>
      </header>

      {/* Form */}
      <form onSubmit={handleAdd} className="input-group">
        <input 
          type="text" 
          list="productSuggestions" 
          placeholder="Ürün adı..." 
          value={name}
          onChange={e => setName(e.target.value)}
          required 
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
          type="number" 
          placeholder="Fiyat" 
          value={price}
          onChange={e => setPrice(e.target.value)}
          required 
        />
        <button id="addBtn">Ekle</button>
      </form>

      {/* Araç Çubuğu (Filtreler) */}
      <div className="toolbar">
        <input 
          type="text" 
          placeholder="🔍 Ara..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
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
          title="Sadece Favoriler"
        >
          {showFavoritesOnly ? "❤️ Favoriler" : "🤍 Tümü"}
        </button>
      </div>

      {/* Liste */}
      <ul>
        {filteredItems.map(item => (
          <li key={item.id} className={item.isFavorite ? "fav-item" : ""}>
            <div className="item-info">
              {item.trend === 'up' && <span className="trend-up">⬆️</span>}
              {item.trend === 'down' && <span className="trend-down">⬇️</span>}
              
              <span className="category-badge">{item.category}</span>
              <span className="item-name">{item.name}</span>
            </div>
            
            <div className="actions">
              <span className="price-tag">{item.price} ₺</span>
              
             {/* --- YENİ & DÜZELTİLMİŞ KALP BUTONU --- */}
              <button 
                className="action-btn fav-btn" 
                onClick={() => toggleFavorite(item.id)}
                title={item.isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
              >
                {/* Mantık şu: 
                    - Favoriyse: İçi kırmızı (#ff4757), Çizgisi kırmızı.
                    - Değilse: İçi boş (none), Çizgisi gri (#999).
                */}
                <svg 
                  viewBox="0 0 24 24" 
                  fill={item.isFavorite ? "#ff4757" : "none"} 
                  stroke={item.isFavorite ? "#ff4757" : "#999"} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
              
              {/* --- YENİ "UÇAN KAPAKLI" ÇÖP KUTUSU --- */}
              <button className="bin-button" onClick={() => handleDelete(item.id)}>
                <svg
                  className="bin-top"
                  viewBox="0 0 39 5"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <line y1="5" x2="39" y2="5" stroke="white" strokeWidth="4"></line>
                  <line x1="12" y1="1.5" x2="26" y2="1.5" stroke="white" strokeWidth="3"></line>
                </svg>
                <svg
                  className="bin-bottom"
                  viewBox="0 0 33 39"
                  xmlns="http://www.w3.org/2000/svg"
                >
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

      {/* İstatistik ve Toplam */}
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
          <button onClick={handleClear} className="clear-btn-text">Temizle</button>
        </div>
      </div>
    </div>
  );
}

export default App;