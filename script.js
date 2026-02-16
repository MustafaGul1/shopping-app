const form = document.getElementById("itemForm");
const itemList = document.getElementById("itemList");
const totalSpan = document.getElementById("total");

let items = JSON.parse(localStorage.getItem("items")) || [];

function renderItems() {
  itemList.innerHTML = "";
  let total = 0;

  items.forEach((item, index) => {
    total += item.price;

    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} - ${item.price} ₺
      <button onclick="deleteItem(${index})">❌</button>
    `;
    itemList.appendChild(li);
  });

  totalSpan.textContent = total;
  localStorage.setItem("items", JSON.stringify(items));
}

function deleteItem(index) {
  items.splice(index, 1);
  renderItems();
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("itemName").value;
  const price = Number(document.getElementById("itemPrice").value);

  items.push({ name, price });
  renderItems();

  form.reset();
});

renderItems();