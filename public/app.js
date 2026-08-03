const PLACEHOLDER_ICONS = {
  'hayacare-vaginal-cream': '🌸',
  'vagina-tightening-cream': '🤍',
  'likoria-care': '🎗️',
  'manmax': '💪',
  'joint-care': '🦵'
};

const state = {
  products: [],
  config: null,
  cart: loadCart()
};

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('hayacare-cart') || '[]');
  } catch {
    return [];
  }
}

function saveCart() {
  localStorage.setItem('hayacare-cart', JSON.stringify(state.cart));
}

function whatsappLink(number, text) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function money(n) {
  return `$${n.toFixed(2)}`;
}

async function init() {
  const [productsRes, configRes] = await Promise.all([
    fetch('/api/products'),
    fetch('/api/config')
  ]);
  state.products = await productsRes.json();
  state.config = await configRes.json();

  wireHeaderAndFooter();
  renderProducts();
  updateCartCount();
  wireGlobalEvents();
}

function wireHeaderAndFooter() {
  const { whatsappNumber, instagram, email, storeName } = state.config;
  const dmText = `Hi ${storeName}! I'd like to know more about your products.`;
  document.getElementById('hero-whatsapp').href = whatsappLink(whatsappNumber, dmText);
  document.getElementById('footer-whatsapp').href = whatsappLink(whatsappNumber, dmText);
  document.getElementById('footer-instagram').href = `https://instagram.com/${instagram}`;
  document.getElementById('footer-email').href = `mailto:${email}`;
  document.getElementById('footer-year').textContent = new Date().getFullYear();
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = state.products.map(productCardHTML).join('');

  grid.querySelectorAll('[data-open-product]').forEach(el => {
    el.addEventListener('click', () => openProductModal(el.dataset.openProduct));
  });
  grid.querySelectorAll('[data-quick-add]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(el.dataset.quickAdd, 1);
      openCart();
    });
  });
}

function productCardHTML(p) {
  const icon = PLACEHOLDER_ICONS[p.id] || '🌿';
  return `
    <article class="product-card accent-${p.accent}" data-open-product="${p.id}">
      <div class="product-media">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <img src="${p.image}" alt="${p.name}" loading="lazy"
             onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'placeholder-icon',textContent:'${icon}'}))">
      </div>
      <div class="product-body">
        <p class="product-category">${p.category}</p>
        <h3>${p.name}</h3>
        <p class="product-tagline">${p.tagline}</p>
        <p class="product-price">${money(p.priceUSD)} <span class="pkr">/ Rs. ${p.pricePKR.toLocaleString()}</span></p>
        <div class="product-actions">
          <button class="btn btn-ghost" data-open-product="${p.id}">Details</button>
          <button class="btn btn-primary" data-quick-add="${p.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `;
}

function openProductModal(id) {
  const p = state.products.find(x => x.id === id);
  if (!p) return;
  const icon = PLACEHOLDER_ICONS[p.id] || '🌿';
  const modal = document.getElementById('product-modal');
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-body">
      <div class="modal-media accent-${p.accent} product-media">
        <img src="${p.image}" alt="${p.name}"
             onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'placeholder-icon',textContent:'${icon}'}))">
      </div>
      <div class="modal-info">
        <p class="product-category">${p.category}</p>
        <h2>${p.name}</h2>
        <p class="product-tagline">${p.tagline}</p>
        <p>${p.description}</p>
        <ul class="modal-highlights">
          ${p.highlights.map(h => `<li>${h}</li>`).join('')}
        </ul>
        <p class="product-price">${money(p.priceUSD)} <span class="pkr">/ Rs. ${p.pricePKR.toLocaleString()} · ${p.size}</span></p>
        <div class="modal-qty">
          <button data-qty="-1">−</button>
          <span id="modal-qty-value">1</span>
          <button data-qty="1">+</button>
        </div>
        <div class="modal-actions">
          <button class="btn btn-primary" id="modal-add-cart">Add to Cart</button>
          <a class="btn btn-outline" href="${whatsappLink(state.config.whatsappNumber, `Hi ${state.config.storeName}! I'd like to order: ${p.name}.`)}" target="_blank" rel="noopener">Order via WhatsApp</a>
        </div>
      </div>
    </div>
  `;

  let qty = 1;
  const qtyValue = document.getElementById('modal-qty-value');
  modal.querySelectorAll('[data-qty]').forEach(btn => {
    btn.addEventListener('click', () => {
      qty = Math.max(1, Math.min(20, qty + Number(btn.dataset.qty)));
      qtyValue.textContent = qty;
    });
  });
  document.getElementById('modal-add-cart').addEventListener('click', () => {
    addToCart(p.id, qty);
    closeModal();
    openCart();
  });

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('product-modal').hidden = true;
  document.body.style.overflow = '';
}

function addToCart(id, qty) {
  const existing = state.cart.find(item => item.id === id);
  if (existing) {
    existing.qty = Math.min(20, existing.qty + qty);
  } else {
    state.cart.push({ id, qty });
  }
  saveCart();
  updateCartCount();
  renderCart();
}

function updateCartQty(id, delta) {
  const item = state.cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(x => x.id !== id);
  }
  saveCart();
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  state.cart = state.cart.filter(x => x.id !== id);
  saveCart();
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cart-count').textContent = count;
}

function cartLines() {
  return state.cart
    .map(item => ({ ...item, product: state.products.find(p => p.id === item.id) }))
    .filter(line => line.product);
}

function renderCart() {
  const lines = cartLines();
  const itemsEl = document.getElementById('cart-items');
  const total = lines.reduce((sum, l) => sum + l.product.priceUSD * l.qty, 0);

  if (!lines.length) {
    itemsEl.innerHTML = `<p class="cart-empty">Your cart is empty. Add a product to get started 🌸</p>`;
  } else {
    itemsEl.innerHTML = lines.map(l => {
      const icon = PLACEHOLDER_ICONS[l.id] || '🌿';
      return `
        <div class="cart-item">
          <div class="cart-item-media accent-${l.product.accent} product-media">
            <img src="${l.product.image}" alt="${l.product.name}"
                 onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'placeholder-icon',textContent:'${icon}'}))">
          </div>
          <div class="cart-item-info">
            <p>${l.product.name}</p>
            <p class="cart-item-price">${money(l.product.priceUSD)} × ${l.qty}</p>
            <div class="cart-item-qty">
              <button data-cart-dec="${l.id}">−</button>
              <span>${l.qty}</span>
              <button data-cart-inc="${l.id}">+</button>
            </div>
            <button class="cart-item-remove" data-cart-remove="${l.id}">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    itemsEl.querySelectorAll('[data-cart-inc]').forEach(b => b.addEventListener('click', () => updateCartQty(b.dataset.cartInc, 1)));
    itemsEl.querySelectorAll('[data-cart-dec]').forEach(b => b.addEventListener('click', () => updateCartQty(b.dataset.cartDec, -1)));
    itemsEl.querySelectorAll('[data-cart-remove]').forEach(b => b.addEventListener('click', () => removeFromCart(b.dataset.cartRemove)));
  }

  document.getElementById('cart-total').textContent = money(total);

  const checkoutBtn = document.getElementById('checkout-btn');
  const note = document.getElementById('cart-note');
  const whatsappText = lines.length
    ? `Hi ${state.config.storeName}! I'd like to order:\n` +
      lines.map(l => `- ${l.product.name} x${l.qty}`).join('\n')
    : `Hi ${state.config.storeName}! I'd like to place an order.`;
  document.getElementById('cart-whatsapp').href = whatsappLink(state.config.whatsappNumber, whatsappText);

  if (!state.config.checkoutConfigured) {
    checkoutBtn.disabled = true;
    note.textContent = 'Card checkout is being set up — order via WhatsApp for now.';
  } else {
    checkoutBtn.disabled = !lines.length;
    note.textContent = 'Secure international card checkout via 2Checkout / Verifone.';
  }
}

async function startCheckout() {
  const lines = cartLines();
  if (!lines.length) return;

  const btn = document.getElementById('checkout-btn');
  btn.disabled = true;
  btn.textContent = 'Redirecting…';

  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: lines.map(l => ({ id: l.id, qty: l.qty })),
        returnUrl: window.location.origin
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout failed.');
    window.location.href = data.url;
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = 'Checkout Securely 🔒';
  }
}

function openCart() {
  renderCart();
  document.getElementById('cart-drawer').hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cart-drawer').hidden = true;
  document.body.style.overflow = '';
}

function wireGlobalEvents() {
  document.getElementById('cart-toggle').addEventListener('click', openCart);
  document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  document.querySelectorAll('[data-close-cart]').forEach(el => el.addEventListener('click', closeCart));
  document.getElementById('checkout-btn').addEventListener('click', startCheckout);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeCart(); }
  });
}

init();
