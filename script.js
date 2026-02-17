// --- ELEMENT SEÇİMLERİ ---
const addItemForm = document.getElementById("addItemForm");
const nameInput = document.getElementById("productName");
const priceInput = document.getElementById("productPrice");
const categoryInput = document.getElementById("productCategory");
const listArea = document.getElementById("listArea");
const totalSpan = document.getElementById("totalPrice");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const clearAllBtn = document.getElementById("clearAllBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

// --- VERİ YÖNETİMİ (Güvenli Load) ---
let items = [];
try {
    const rawData = localStorage.getItem("items");
    items = rawData ? JSON.parse(rawData) : [];
} catch (e) {
    console.error("LocalStorage verisi bozuk, sıfırlandı.", e);
    items = [];
}

const currencyFormatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });

// --- GÜVENLİ DOM OLUŞTURMA (XSS FIX) ---
function createItemNode(item, index) {
    const li = document.createElement('li');
    li.dataset.id = item.id; // ID'yi veri setine ekle

    // Sol Taraf (Bilgiler)
    const infoDiv = document.createElement('div');
    infoDiv.className = 'item-info';

    const firstLine = document.createElement('div');
    
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = item.category; // GÜVENLİ
    
    const nameStrong = document.createElement('strong');
    nameStrong.textContent = item.name; // GÜVENLİ (HTML tagleri çalışmaz)

    firstLine.appendChild(badge);
    firstLine.appendChild(nameStrong);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'item-meta';
    metaDiv.textContent = `📅 ${dateFormatter.format(item.id)}`;

    infoDiv.appendChild(firstLine);
    infoDiv.appendChild(metaDiv);

    // Sağ Taraf (Aksiyonlar)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions';

    const priceSpan = document.createElement('span');
    priceSpan.className = 'price-tag';
    priceSpan.textContent = currencyFormatter.format(item.price);

    // Edit Butonu
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = '✏️';
    editBtn.title = 'Düzenle';
    editBtn.dataset.action = 'edit'; // Event Delegation için

    // Delete Butonu (SVG ile)
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.title = 'Sil';
    deleteBtn.dataset.action = 'delete'; // Event Delegation için
    deleteBtn.innerHTML = `<svg viewBox="0 0 24 24" style="pointer-events: none;"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

    actionsDiv.appendChild(priceSpan);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(infoDiv);
    li.appendChild(actionsDiv);

    // Animasyon
    li.style.animation = "slideIn 0.2s ease-out forwards";
    
    return li;
}

// --- RENDER ---
function renderItems() {
    listArea.innerHTML = ""; // Listeyi temizle
    
    // Arama ve Sıralama
    const searchText = searchInput.value.toLowerCase();
    let filteredItems = items.filter(item => item.name.toLowerCase().includes(searchText));

    const sortType = sortSelect.value;
    filteredItems.sort((a, b) => {
        if (sortType === 'price-asc') return a.price - b.price;
        if (sortType === 'price-desc') return b.price - a.price;
        if (sortType === 'alpha-asc') return a.name.localeCompare(b.name);
        return b.id - a.id; // date-desc (Varsayılan)
    });

    // Boş Durum
    if (filteredItems.length === 0) {
        emptyState.style.display = "block";
        emptyState.textContent = items.length > 0 ? "🔍 Sonuç bulunamadı." : "📭 Henüz ürün eklenmedi.";
    } else {
        emptyState.style.display = "none";
    }

    // Elemanları Oluştur ve Ekle
    let total = 0;
    filteredItems.forEach(item => {
        total += item.price;
        listArea.appendChild(createItemNode(item));
    });

    totalSpan.textContent = currencyFormatter.format(total);
    localStorage.setItem("items", JSON.stringify(items));
}

// --- EVENT DELEGATION (Performans) ---
listArea.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    // Tıklanan satırın ID'sini bul
    const li = btn.closest('li');
    const id = Number(li.dataset.id);
    const itemIndex = items.findIndex(i => i.id === id);

    if (itemIndex === -1) return;

    if (btn.dataset.action === 'delete') {
        // Silme İşlemi
        items.splice(itemIndex, 1);
        renderItems();
    } 
    else if (btn.dataset.action === 'edit') {
        // Düzenleme İşlemi (Validation Eklendi)
        const item = items[itemIndex];
        const newName = prompt("Yeni ürün adı:", item.name);
        
        // Kullanıcı iptal ettiyse veya boş bıraktıysa dur
        if (newName === null) return; 

        const newPriceStr = prompt("Yeni fiyat:", item.price);
        if (newPriceStr === null) return;

        const newPrice = parseFloat(newPriceStr);

        if (!newName.trim() || isNaN(newPrice) || newPrice <= 0) {
            alert("⚠️ Geçersiz giriş! İsim boş olamaz ve fiyat 0'dan büyük olmalıdır.");
            return;
        }

        items[itemIndex].name = newName.trim();
        items[itemIndex].price = newPrice;
        renderItems();
    }
});

// --- FORM SUBMIT (Ekleme) ---
addItemForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle

    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value);
    const category = categoryInput.value;

    // HTML5 validation zaten var ama JS ile de garantiye alalım
    if (name && price > 0) {
        items.push({
            id: Date.now(),
            name,
            price,
            category
        });
        renderItems();
        addItemForm.reset(); // Formu temizle
        nameInput.focus();
    }
});

// --- DEBOUNCE ARAMA (Performans) ---
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
searchInput.addEventListener('input', debounce(renderItems, 300));

// --- DİĞER OLAYLAR ---
sortSelect.addEventListener('change', renderItems);

clearAllBtn.addEventListener("click", () => {
    if (items.length > 0 && confirm("Tüm liste kalıcı olarak silinecek?")) {
        items = [];
        renderItems();
    }
});

// JSON Export
exportBtn.addEventListener("click", () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alisveris_listesi_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
});

// GÜVENLİ JSON IMPORT
importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            
            // Veri yapısı kontrolü (Validation)
            if (!Array.isArray(imported)) throw new Error("Format hatası: Veri dizi olmalı.");
            
            const isValid = imported.every(item => 
                item.name && typeof item.name === 'string' &&
                typeof item.price === 'number' && item.price > 0
            );

            if (!isValid) throw new Error("Format hatası: İçerik hatalı veya eksik.");

            // ID Çakışmasını önlemek için yeni ID vererek ekle
            const newItems = imported.map(item => ({
                ...item,
                id: item.id || Date.now() + Math.random(), // ID yoksa oluştur
                category: item.category || "Genel"
            }));

            if(confirm(`${newItems.length} ürün yüklenecek. Mevcut liste silinsin mi?`)) {
                items = newItems; // Üzerine yaz
            } else {
                items = [...items, ...newItems]; // Ekle
            }
            renderItems();

        } catch (err) {
            alert("❌ Dosya yüklenemedi: " + err.message);
        }
    };
    reader.readAsText(file);
    e.target.value = ""; // Aynı dosyayı tekrar seçebilmek için
});

// Başlat
renderItems();