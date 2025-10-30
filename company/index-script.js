const PRODUCTS = [
  {
    name: "Butter Bread",
    prices: [40, 30, 20, 10, 3],
    image: "/assets/butterbread.jpg",
    available: true
  },
  {
    name: "Sugar Bread",
    prices: [20, 10, 5, 2],
    image: "/assets/sugarbread.jpg",
    available: true
  },
  {
    name: "Wheat Bread",
    prices: [20],
    image: "/assets/wheatbread.webp",
    available: true
  },
  {
    name: "Biscuits (Aberewa Enwe)",
    prices: [10],
    image: "/assets/biscuit.jpg",
    available: true
  }
];

const r = 0.4; // profit rate constant

const menuModal = document.getElementById("menuModal");
const openMenuBtns = [
  document.getElementById("viewMenuBtnHome"),
  document.getElementById("openMenuHeader"),
];
const closeMenu = document.getElementById("closeMenu");
const productsGrid = document.getElementById("productsGrid");
const orderMode = document.getElementById("orderMode");

const cartDrawer = document.getElementById("cartDrawer");
const cartList = document.getElementById("cartList");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartMinBtn = document.getElementById("cartMinBtn");
const cartCountEl = document.getElementById("cartCount");
const minimizeCart = document.getElementById("minimizeCart");
const clearCart = document.getElementById("clearCart");
const checkoutBtn = document.getElementById("checkoutBtn");

let CART = JSON.parse(localStorage.getItem("oat_cart_v2") || "[]");

// -----------------------------------------------------
// Utility Functions
// -----------------------------------------------------
function saveCart() {
  localStorage.setItem("oat_cart_v2", JSON.stringify(CART));
  updateCartUI();
}

function getAdjustedUnitPrice(productName, S) {
  // Apply adjustment for 40% margin except Biscuits
  if (productName.toLowerCase().includes("biscuit")) return S;
  return S / (1 + r);
}

function calculateSubtotal() {
  return CART.reduce((sum, item) => sum + item.total, 0);
}

function formatCurrency(value) {
  return `GH₵ ${value.toFixed(2)}`;
}

// -----------------------------------------------------
// Menu Modal
// -----------------------------------------------------
function openMenu() {
  menuModal.style.display = "flex";
  setTimeout(() => menuModal.classList.add("show"), 20);
  renderProducts();
}
function closeMenuModal() {
  menuModal.classList.remove("show");
  setTimeout(() => (menuModal.style.display = "none"), 300);
}
openMenuBtns.forEach(btn => btn?.addEventListener("click", openMenu));
closeMenu.addEventListener("click", closeMenuModal);

// -----------------------------------------------------
// Render Products
// -----------------------------------------------------
function renderProducts() {
  productsGrid.innerHTML = "";
  PRODUCTS.forEach(product => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <h4>${product.name}</h4>
      <div class="price-row">
        ${product.prices
          .map(
            p =>
              `<div class="price-pill" data-name="${product.name}" data-price="${p}">GH₵ ${p.toFixed(2)}</div>`
          )
          .join("")}
      </div>
      <div class="availability ${
        product.available ? "badge-available" : "badge-out"
      }">
        ${product.available ? "Available ✅" : "Out of stock ❌"}
      </div>
    `;
    productsGrid.appendChild(card);
  });

  document.querySelectorAll(".price-pill").forEach(pill =>
    pill.addEventListener("click", e => {
      const name = e.target.dataset.name;
      const price = parseFloat(e.target.dataset.price);
      const mode = orderMode.value;

      if (mode === "unit") {
        const qty = parseInt(prompt(`Enter quantity of ${name} at GH₵ ${price.toFixed(2)} each:`));
        if (!qty || qty <= 0) return;
        const adjusted = getAdjustedUnitPrice(name, price);
        const total = qty * adjusted;
        CART.push({ name, price, adjusted, qty, mode, total });
      } else {
        const cost = parseFloat(prompt(`Enter total GH₵ you wish to spend on ${name} (market price GH₵ ${price.toFixed(2)}):`));
        if (!cost || cost <= 0) return;
        const n = Math.floor((cost * (1 + r)) / price);
        if (n <= 0) return alert("Amount too small for a purchase.");
        CART.push({ name, price, adjusted: price, qty: n, mode, total: cost });
      }

      saveCart();
      showCart();
    })
  );
}

// -----------------------------------------------------
// Cart Logic
// -----------------------------------------------------
function updateCartUI() {
  cartList.innerHTML = "";
  CART.forEach((item, i) => {
    const li = document.createElement("div");
    li.className = "cart-item";
    li.innerHTML = `
      <div style="flex:1;">
        <strong>${item.name}</strong><br/>
        <small>${
          item.mode === "unit"
            ? `${item.qty} pcs @ GH₵ ${item.adjusted.toFixed(2)}`
            : `${item.qty} pcs (bulk cost GH₵ ${item.total.toFixed(2)})`
        }</small>
      </div>
      <div class="qty-controls">
        <button class="small-btn" data-act="minus" data-index="${i}">−</button>
        <div>${item.qty}</div>
        <button class="small-btn" data-act="plus" data-index="${i}">+</button>
      </div>
    `;
    cartList.appendChild(li);
  });

  document.querySelectorAll(".qty-controls button").forEach(btn =>
    btn.addEventListener("click", e => {
      const i = e.target.dataset.index;
      const act = e.target.dataset.act;
      if (act === "plus") CART[i].qty++;
      if (act === "minus" && CART[i].qty > 1) CART[i].qty--;
      CART[i].total =
        CART[i].mode === "unit"
          ? CART[i].qty * CART[i].adjusted
          : CART[i].total;
      saveCart();
    })
  );

  const subtotal = calculateSubtotal();
  cartSubtotalEl.textContent = formatCurrency(subtotal);
  cartCountEl.textContent = CART.length;
}

function showCart() {
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden", "false");
  cartMinBtn.style.display = "none";
}

function minimizeCartFunc() {
  cartDrawer.classList.add("closing");
  setTimeout(() => {
    cartDrawer.classList.remove("open", "closing");
    cartDrawer.setAttribute("aria-hidden", "true");
    cartMinBtn.style.display = "flex";
  }, 300);
}

function clearCartFunc() {
  if (confirm("Clear all items from cart?")) {
    CART = [];
    saveCart();
    minimizeCartFunc();
  }
}

minimizeCart.addEventListener("click", minimizeCartFunc);
clearCart.addEventListener("click", clearCartFunc);
cartMinBtn.addEventListener("click", showCart);

// -----------------------------------------------------
// Checkout via WhatsApp
// -----------------------------------------------------
checkoutBtn.addEventListener("click", () => {
  if (CART.length === 0) return alert("Your cart is empty.");

  let message = "🧺 *O.A.T. Company Ltd Order Summary*%0A%0A";
  CART.forEach(item => {
    message += `• ${item.name} — ${item.qty} pcs (${
      item.mode === "unit"
        ? `@ GH₵ ${item.adjusted.toFixed(2)}`
        : `bulk cost GH₵ ${item.total.toFixed(2)}`
    })%0A`;
  });
  const total = calculateSubtotal();
  message += `%0A*Subtotal:* GH₵ ${total.toFixed(2)}%0A%0A`;
  message += "Thank you for ordering with O.A.T. Company Ltd!";

  const waUrl = `https://wa.me/233507969291?text=${message}`;
  window.open(waUrl, "_blank");
});