// HTML'deki YENİ ID'leri seçiyoruz
const addBtn = document.getElementById("addBtn");
const nameInput = document.getElementById("productName");
const priceInput = document.getElementById("productPrice");
const listArea = document.getElementById("listArea");
const totalSpan = document.getElementById("totalPrice");

// LocalStorage'dan verileri çek veya boş dizi oluştur
let items = JSON.parse(localStorage.getItem("items")) || [];

// Listeyi Ekrana Yazdıran Fonksiyon
function renderItems() {
  listArea.innerHTML = ""; // itemList yerine listArea kullanıyoruz
  let total = 0;

  items.forEach((item, index) => {
    total += item.price;

    const li = document.createElement("li");
    // Ürün adı ve fiyatı
    li.innerHTML = `
      <span>${item.name}</span> 
      <span>
        <strong>${item.price.toFixed(2)} ₺</strong>
        <button class="delete-btn" onclick="deleteItem(${index})">X</button>
      </span>
    `;
    listArea.appendChild(li);
  });

  // Toplamı güncelle
  totalSpan.textContent = total.toFixed(2);
  
  // Güncel listeyi tarayıcı hafızasına kaydet
  localStorage.setItem("items", JSON.stringify(items));
}

// Ürün Silme Fonksiyonu
function deleteItem(index) {
  items.splice(index, 1); // Listeden o sıradaki ürünü çıkar
  renderItems(); // Ekranı güncelle
}

// ARTIK FORM YOK, BUTONA TIKLAMA OLAYI VAR
addBtn.addEventListener("click", function () {
  const name = nameInput.value;
  const price = Number(priceInput.value);

  if (name && price > 0) {
    items.push({ name, price });
    renderItems();
    
    // Inputları manuel temizle (Form reset çalışmaz çünkü form yok)
    nameInput.value = "";
    priceInput.value = "";
    nameInput.focus(); 
  } else {
    alert("Lütfen geçerli bir isim ve fiyat giriniz.");
  }
});

// Sayfa ilk açıldığında listeyi yükle
renderItems();// Enter tuşuna basıldığında ekleme yapma özelliği
priceInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    addBtn.click();
  }
});
