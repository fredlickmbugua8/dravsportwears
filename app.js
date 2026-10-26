/**
 * DRAVSPORTS WEARS - Frontend Core JavaScript
 * Syncs with Express Backend APIs (/api/visit, /api/products, /api/orders, /api/upload)
 * Location: Chuka Town, Tharaka Nithi County, Kenya
 */

const initialProducts = [
  {
    id: 'prod_1',
    title: 'Nike Dri-FIT Pro Football Kit 2026',
    category: 'football',
    price: 2800,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image: 'images/football_kit.png',
    description: 'Breathable, lightweight football jersey & shorts set.',
    createdAt: Date.now() - 1000000
  },
  {
    id: 'prod_2',
    title: 'ZoomX Marathon Running Sneakers',
    category: 'athletics',
    price: 4500,
    sizes: ['39', '40', '41', '42', '43', '44', '45'],
    image: 'images/running_sneakers.png',
    description: 'High-bounce carbon plate running sneakers engineered for performance.',
    createdAt: Date.now() - 900000
  },
  {
    id: 'prod_3',
    title: 'Elite Compression Gym Set (Top + Tights)',
    category: 'gym',
    price: 3200,
    sizes: ['M', 'L', 'XL'],
    image: 'images/gym_wear.png',
    description: 'Ergonomic athletic compression fit for workouts.',
    createdAt: Date.now() - 800000
  },
  {
    id: 'prod_4',
    title: 'Pro Basketball Jersey & Shorts Pack',
    category: 'basketball',
    price: 3000,
    sizes: ['M', 'L', 'XL', 'XXL'],
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&auto=format&fit=crop&q=80',
    description: 'Authentic mesh basketball uniform set. Quick-dry moisture wicking.',
    createdAt: Date.now() - 700000
  },
  {
    id: 'prod_5',
    title: 'Speedo Hydro-Fit Swimming Goggles & Cap',
    category: 'swimming',
    price: 1800,
    sizes: ['One Size'],
    image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&auto=format&fit=crop&q=80',
    description: 'Anti-fog UV protection swimming goggles with silicone cap.',
    createdAt: Date.now() - 600000
  }
];

const deliveryRates = {
  'chuka_town': { name: 'Chuka Town (Free Pickup / Fast Dispatch)', fee: 0 },
  'tharaka_nithi': { name: 'Tharaka Nithi County Doorstep (KSh 150)', fee: 150 },
  'meru_embu': { name: 'Meru / Embu Towns (KSh 200)', fee: 200 },
  'nairobi': { name: 'Nairobi Express (KSh 300)', fee: 300 },
  'countrywide': { name: 'Rest of Kenya (Mombasa, Kisumu, Eldoret etc.) (KSh 350)', fee: 350 }
};

let products = [];
let cart = [];
let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'newest';
let previewImageBase64 = null;
let siteContent = null;

document.addEventListener('DOMContentLoaded', () => {
  initCookieConsent();
  loadContent();
  loadProducts();
  loadCart();
  setupEventListeners();
  updateThemeIcon();
});

/* ==========================================================================
   BACKEND-DRIVEN WEBSITE CONTENT
   Every section of the storefront (hero, about, team, branches, contact and
   footer) is rendered from GET /api/content, so the store owner can update the
   website from the admin panel without touching any code.
   ========================================================================== */

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Build a WhatsApp link using the number stored in the backend
function waLink(text) {
  const fallback = '254720357085';
  const number = (siteContent && siteContent.contact && siteContent.contact.whatsapp) || fallback;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

async function loadContent() {
  try {
    const res = await fetch('/api/content');
    if (!res.ok) throw new Error('Content API offline');
    siteContent = await res.json();
    applyContent();
  } catch (err) {
    console.warn('Website content could not be loaded:', err);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el && value != null && value !== '') el.textContent = value;
}

function applyContent() {
  if (!siteContent) return;
  const c = siteContent;

  // Brand name (header + footer)
  setText('brandNamePrefix', c.brand.namePrefix);
  setText('brandNameSuffix', c.brand.nameSuffix);
  setText('footerBrandNamePrefix', c.brand.namePrefix);
  setText('footerBrandNameSuffix', c.brand.nameSuffix);

  // Hero section
  setText('heroLocationText', c.hero.locationPill);
  setText('heroTitlePrefix', c.hero.titlePrefix);
  setText('heroTitleHighlight', c.hero.titleHighlight);
  setText('heroDescription', c.hero.description);
  setText('heroPrimaryCtaText', c.hero.primaryCta);
  setText('heroWhatsappCtaText', c.hero.whatsappCta);

  const statsEl = document.getElementById('heroStats');
  if (statsEl && Array.isArray(c.hero.stats)) {
    statsEl.innerHTML = c.hero.stats.map(s => `
      <div>
        <div class="stat-num">${esc(s.value)}</div>
        <div class="stat-label">${esc(s.label)}</div>
      </div>
    `).join('');
  }

  // About section
  setText('aboutTag', c.about.tag);
  setText('aboutTitle', c.about.title);

  const paragraphsEl = document.getElementById('aboutParagraphs');
  if (paragraphsEl && Array.isArray(c.about.paragraphs)) {
    const last = c.about.paragraphs.length - 1;
    paragraphsEl.innerHTML = c.about.paragraphs.map((p, i) => `
      <p style="color: var(--text-muted); font-size: 1.05rem; margin-bottom: ${i === last ? '1.5rem' : '1.25rem'};">${esc(p)}</p>
    `).join('');
  }

  const featuresEl = document.getElementById('aboutFeatures');
  if (featuresEl && Array.isArray(c.about.features)) {
    featuresEl.innerHTML = c.about.features.map(f => `
      <div class="feature-card">
        <div class="feature-icon"><i class="${esc(f.icon)}"></i></div>
        <h4>${esc(f.title)}</h4>
        <p>${esc(f.text)}</p>
      </div>
    `).join('');
  }

  // Team section
  setText('teamTag', c.team.tag);
  setText('teamTitle', c.team.title);
  setText('teamSubtitle', c.team.subtitle);

  const teamEl = document.getElementById('teamGrid');
  if (teamEl && Array.isArray(c.team.members)) {
    teamEl.innerHTML = c.team.members.map(m => `
      <div class="team-card">
        <div class="team-img-wrapper">
          <img src="${esc(m.image)}" alt="${esc(m.name)}" onerror="this.src='images/team_derrick.png';">
        </div>
        <div class="team-info">
          <h3 class="team-name">${esc(m.name)}</h3>
          <div class="team-role">${esc(m.role)}</div>
          <div class="team-location"><i class="fas fa-map-marker-alt"></i> ${esc(m.location)}</div>
        </div>
      </div>
    `).join('');
  }

  // Branches section
  setText('branchesTag', c.branches.tag);
  setText('branchesTitle', c.branches.title);
  setText('branchesSubtitle', c.branches.subtitle);

  const branchesEl = document.getElementById('branchesGrid');
  if (branchesEl && Array.isArray(c.branches.items)) {
    branchesEl.innerHTML = c.branches.items.map(b => `
      <div class="branch-card">
        <div class="branch-name"><i class="fas fa-store"></i> ${esc(b.name)}</div>
        <div class="branch-detail"><i class="fas fa-location-dot"></i><span>${esc(b.address)}</span></div>
        <div class="branch-detail"><i class="fas fa-phone-alt"></i><span>${esc(b.phone)}</span></div>
        <div class="branch-detail"><i class="fas fa-clock"></i><span>${esc(b.hours)}</span></div>
      </div>
    `).join('');
  }

  // Contact section
  setText('contactTag', c.contactSection.tag);
  setText('contactTitle', c.contactSection.title);
  setText('contactSubtitle', c.contactSection.subtitle);
  setText('contactAddress', c.contactSection.address);
  setText('contactPhones', [c.contact.phone, c.contact.phoneSecondary].filter(Boolean).join(' • '));
  setText('contactWhatsapp', c.contact.phone + ' (Fast Order Verification & Inquiries)');
  setText('contactEmails', [c.contact.email, c.contact.emailSecondary].filter(Boolean).join(' • '));

  // Footer
  setText('footerDescription', c.footer.description);
  setText('footerCopyright', c.footer.copyright);
  setText('footerHours', c.contactSection.storeHours);
  setText('footerDelivery', c.contactSection.deliveryNote);
  setText('footerPhone', c.contact.phone);
  setText('footerEmail', c.contact.email);
  if (Array.isArray(c.branches.items)) {
    setText('footerLocation', c.branches.items.map(b => b.name.replace(' Branch', '')).join(' & ') + ', Kenya');
  }

  // Cookie consent banner & privacy policy (all editable from the backend)
  const legal = c.legal || {};
  setText('cookieBannerTitle', legal.consentTitle);
  setText('cookieBannerText', legal.consentText);
  setText('cookieBannerPolicyLink', legal.policyLinkLabel);
  setText('cookieAcceptBtn', legal.acceptLabel);
  setText('cookieDeclineBtn', legal.declineLabel);
  setText('footerPolicyLink', legal.policyLinkLabel);
  setText('footerCookieSettings', legal.settingsLabel);
  setText('policyTitle', legal.policyTitle);
  setText('policyUpdated', legal.policyUpdated);
  setText('policyController', legal.dataController);

  const policyEl = document.getElementById('policyParagraphs');
  if (policyEl && Array.isArray(legal.policyParagraphs)) {
    policyEl.innerHTML = legal.policyParagraphs.map(p => `<p>${esc(p)}</p>`).join('');
  }

  // Point every WhatsApp button/link at the backend number
  document.querySelectorAll('.js-whatsapp-link').forEach(a => {
    a.setAttribute('href', waLink('Hello DravSports Wears, I would like to inquire about your current sportswear uploads.'));
  });
}

function updateThemeIcon() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  const icon = themeToggle.querySelector('i');
  if (!icon) return;
  const current = document.documentElement.getAttribute('data-theme');
  icon.className = current === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

/* ==========================================================================
   COOKIE CONSENT & PRIVACY
   Kenya Data Protection Act, 2019 compliant. No analytics are recorded until
   the visitor explicitly accepts. The choice is stored in the strictly
   necessary drav_cookie_consent cookie for 12 months and is re-read by the
   server on every request, so declining genuinely stops all IP logging.
   ========================================================================== */

const CONSENT_COOKIE = 'drav_cookie_consent';
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 12 months (seconds)

function getConsentChoice() {
  const match = document.cookie
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(CONSENT_COOKIE + '='));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1));
  return value === 'granted' || value === 'denied' ? value : null;
}

function setConsentChoice(value) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Max-Age=${CONSENT_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
}

function showConsentBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.add('active');
}

function hideConsentBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.remove('active');
}

function openPolicyModal() {
  openModal('policyModal');
}

function initCookieConsent() {
  const acceptBtn = document.getElementById('cookieAcceptBtn');
  const declineBtn = document.getElementById('cookieDeclineBtn');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      setConsentChoice('granted');
      hideConsentBanner();
      recordWebsiteVisit();
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      setConsentChoice('denied');
      hideConsentBanner();
    });
  }

  const choice = getConsentChoice();
  if (choice === 'granted') {
    recordWebsiteVisit();
  } else if (choice === null) {
    showConsentBanner();
  }
}

// Record Website Visit Ping to Backend Analytics (consent gated)
async function recordWebsiteVisit() {
  if (getConsentChoice() !== 'granted') return;
  try {
    await fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: window.location.pathname })
    });
  } catch (err) {
    // Fallback silently if offline
  }
}

// Load products from API server or LocalStorage
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      products = await res.json();
    } else {
      throw new Error('API offline');
    }
  } catch (err) {
    const saved = localStorage.getItem('dravsports_products');
    products = saved ? JSON.parse(saved) : [...initialProducts];
  }
  renderCatalog();
}

function saveProducts() {
  localStorage.setItem('dravsports_products', JSON.stringify(products));
}

function loadCart() {
  const saved = localStorage.getItem('dravsports_cart');
  cart = saved ? JSON.parse(saved) : [];
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('dravsports_cart', JSON.stringify(cart));
}

function setupEventListeners() {
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
  }

  const tabs = document.querySelectorAll('.cat-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      renderCatalog();
    });
  });

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderCatalog();
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderCatalog();
    });
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
      themeToggle.querySelector('i').className = nextTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
      showToast(`Switched to ${nextTheme} mode`);
    });
  }

  const cartBtn = document.getElementById('cartBtn');
  const drawerClose = document.getElementById('drawerClose');
  const modalOverlay = document.getElementById('modalOverlay');

  if (cartBtn) cartBtn.addEventListener('click', () => openCartDrawer());
  if (drawerClose) drawerClose.addEventListener('click', () => closeCartDrawer());
  if (modalOverlay) {
    modalOverlay.addEventListener('click', () => {
      closeCartDrawer();
      closeModal('uploadModal');
      closeModal('quickViewModal');
    });
  }

  const openUploadBtn = document.getElementById('openUploadBtn');
  const closeUploadModal = document.getElementById('closeUploadModal');
  if (openUploadBtn) openUploadBtn.addEventListener('click', () => openModal('uploadModal'));
  if (closeUploadModal) closeUploadModal.addEventListener('click', () => closeModal('uploadModal'));

  const productImageInput = document.getElementById('productImageInput');
  const imagePreviewBox = document.getElementById('imagePreviewBox');
  if (productImageInput && imagePreviewBox) {
    productImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          previewImageBase64 = evt.target.result;
          imagePreviewBox.innerHTML = `<img src="${previewImageBase64}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  const uploadForm = document.getElementById('uploadProductForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleProductUpload();
    });
  }

  const deliverySelect = document.getElementById('deliverySelect');
  if (deliverySelect) deliverySelect.addEventListener('change', () => updateCartUI());

  const btnCheckoutWhatsApp = document.getElementById('btnCheckoutWhatsApp');
  if (btnCheckoutWhatsApp) btnCheckoutWhatsApp.addEventListener('click', () => handleWhatsAppCheckout());
}

function renderCatalog() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  let filtered = products.filter(p => {
    const matchCat = currentCategory === 'all' || p.category === currentCategory;
    const matchSearch = p.title.toLowerCase().includes(searchQuery) ||
                        p.description.toLowerCase().includes(searchQuery) ||
                        p.category.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });

  if (currentSort === 'low-to-high') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'high-to-low') {
    filtered.sort((a, b) => b.price - a.price);
  } else {
    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-catalog">
        <i class="fas fa-running"></i>
        <h3>No Sportswear Found</h3>
        <p>Try searching another item or upload new gear!</p>
        <button class="btn-primary" style="margin-top: 1rem;" onclick="openModal('uploadModal')">
          <i class="fas fa-plus"></i> Upload Wear Now
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="product-card" data-id="${item.id}">
      <div class="card-img-wrapper">
        <span class="sport-tag">⚡ ${item.category}</span>
        <img src="${item.image}" alt="${item.title}" onerror="this.src='images/football_kit.png';">
        <div class="card-quick-actions">
          <button class="action-btn" title="Quick View" onclick="openQuickView('${item.id}')">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn" title="Delete Item" onclick="deleteProduct('${item.id}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
      <div class="card-content">
        <h3 class="card-title">${item.title}</h3>
        <div class="card-meta">
          <span><i class="fas fa-ruler-combined"></i> Sizes: ${Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes}</span>
        </div>
        <div class="card-footer">
          <div class="card-price">KSh ${item.price.toLocaleString()}</div>
          <button class="card-btn-add" onclick="addToCart('${item.id}')">
            <i class="fas fa-shopping-basket"></i> Add to Bucket
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function addToCart(productId) {
  const item = products.find(p => p.id === productId);
  if (!item) return;

  const existing = cart.find(c => c.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      category: item.category,
      qty: 1
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added "${item.title}" to order bucket!`);
}

function updateCartUI() {
  const cartBadge = document.getElementById('cartBadgeCount');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const deliveryFeeEl = document.getElementById('deliveryFee');
  const cartGrandTotalEl = document.getElementById('cartGrandTotal');
  const deliverySelect = document.getElementById('deliverySelect');

  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  if (cartBadge) cartBadge.textContent = totalCount;
  if (!cartItemsList) return;

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <i class="fas fa-shopping-basket" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
        <p>Your sportswear bucket is empty!</p>
      </div>
    `;
    cartSubtotalEl.textContent = 'KSh 0';
    deliveryFeeEl.textContent = 'KSh 0';
    cartGrandTotalEl.textContent = 'KSh 0';
    return;
  }

  cartItemsList.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img class="cart-item-img" src="${item.image}" alt="${item.title}">
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.title}</h4>
        <div class="cart-item-price">KSh ${(item.price * item.qty).toLocaleString()}</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.id}')"><i class="fas fa-times"></i></button>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const selectedTownKey = deliverySelect ? deliverySelect.value : 'chuka_town';
  const deliveryInfo = deliveryRates[selectedTownKey] || deliveryRates['chuka_town'];
  const grandTotal = subtotal + deliveryInfo.fee;

  cartSubtotalEl.textContent = `KSh ${subtotal.toLocaleString()}`;
  deliveryFeeEl.textContent = `KSh ${deliveryInfo.fee.toLocaleString()}`;
  cartGrandTotalEl.textContent = `KSh ${grandTotal.toLocaleString()}`;
}

function updateQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
  } else {
    saveCart();
    updateCartUI();
  }
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
  showToast('Item removed from bucket.');
}

async function handleWhatsAppCheckout() {
  if (cart.length === 0) {
    showToast('Your order bucket is empty!');
    return;
  }

  const customerName = document.getElementById('customerName')?.value || 'Valued Customer';
  const customerPhone = document.getElementById('customerPhone')?.value || 'Not provided';
  const customerLocation = document.getElementById('customerLocation')?.value || 'Chuka Town';
  const deliverySelect = document.getElementById('deliverySelect');

  const townKey = deliverySelect ? deliverySelect.value : 'chuka_town';
  const deliveryInfo = deliveryRates[townKey];
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const grandTotal = subtotal + deliveryInfo.fee;

  // Send Order to Backend Database
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerPhone,
        customerLocation,
        items: cart,
        total: grandTotal
      })
    });
  } catch (err) {}

  let msg = `*🏆 NEW SPORTSWEAR ORDER - DRAVSPORTS WEARS*\n`;
  msg += `-------------------------------------------\n`;
  msg += `👤 *Customer Name:* ${customerName}\n`;
  msg += `📞 *Phone Number:* ${customerPhone}\n`;
  msg += `📍 *Delivery Destination:* ${customerLocation} (${deliveryInfo.name})\n\n`;
  msg += `*🛍️ ORDER BUCKET ITEMS:*\n`;

  cart.forEach((item, idx) => {
    msg += `${idx + 1}. *${item.title}*\n   • Qty: ${item.qty} | Price: KSh ${(item.price * item.qty).toLocaleString()}\n`;
  });

  msg += `\n-------------------------------------------\n`;
  msg += `💵 *Subtotal:* KSh ${subtotal.toLocaleString()}\n`;
  msg += `🚚 *Delivery Fee:* KSh ${deliveryInfo.fee.toLocaleString()}\n`;
  msg += `🎯 *GRAND TOTAL:* KSh ${grandTotal.toLocaleString()}\n`;
  msg += `-------------------------------------------\n`;
  msg += `Locations: Chuka Town & Nairobi, Kenya.\nPlease confirm dispatch!`;

  const whatsappUrl = waLink(msg);
  window.open(whatsappUrl, '_blank');
  showToast('Connecting to WhatsApp with your order details...');
}

async function handleProductUpload() {
  const title = document.getElementById('productTitle').value.trim();
  const category = document.getElementById('productCategory').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const sizesInput = document.getElementById('productSizes').value.trim();
  const imageUrlInput = document.getElementById('productImageUrl').value.trim();
  const description = document.getElementById('productDescription').value.trim();

  if (!title || isNaN(price) || price <= 0) {
    showToast('Please enter a valid title and price!');
    return;
  }

  let imagePath = previewImageBase64 || imageUrlInput || 'images/football_kit.png';

  // If base64 image uploaded, send to Express Backend /api/upload
  if (previewImageBase64) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: previewImageBase64, filename: title })
      });
      const data = await res.json();
      if (data.imageUrl) {
        imagePath = data.imageUrl;
      }
    } catch (err) {}
  }

  const payload = {
    title,
    category,
    price,
    sizes: sizesInput ? sizesInput.split(',').map(s => s.trim()) : ['Standard'],
    image: imagePath,
    description
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.product) {
      products.unshift(data.product);
    }
  } catch (err) {
    payload.id = 'prod_' + Date.now();
    payload.createdAt = Date.now();
    products.unshift(payload);
    saveProducts();
  }

  renderCatalog();
  document.getElementById('uploadProductForm').reset();
  document.getElementById('imagePreviewBox').innerHTML = `
    <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 0.5rem;"></i>
    <span style="font-size: 0.85rem; color: var(--text-muted);">Click to browse image file</span>
  `;
  previewImageBase64 = null;
  closeModal('uploadModal');
  showToast(`Successfully uploaded "${title}"!`);
}

async function deleteProduct(id) {
  if (confirm('Delete this sportswear upload?')) {
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (err) {}
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderCatalog();
    showToast('Upload deleted.');
  }
}

function openQuickView(id) {
  const item = products.find(p => p.id === id);
  if (!item) return;

  const quickViewContent = document.getElementById('quickViewContent');
  if (!quickViewContent) return;

  quickViewContent.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr; gap: 1.5rem; text-align: left;">
      <div style="height: 280px; border-radius: 12px; overflow: hidden; background: #000;">
        <img src="${item.image}" alt="${item.title}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div>
        <span class="sport-tag">⚡ ${item.category}</span>
        <h2 style="font-family: var(--font-heading); font-size: 1.6rem; margin-top: 0.5rem; margin-bottom: 0.5rem;">${item.title}</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1rem;">${item.description}</p>
        <div style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--accent-primary); margin-bottom: 1rem;">
          KSh ${item.price.toLocaleString()}
        </div>
        <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem;">
          <strong>Sizes:</strong> ${Array.isArray(item.sizes) ? item.sizes.join(', ') : item.sizes}
        </div>
        <div style="display: flex; gap: 1rem;">
          <button class="btn-primary" style="flex: 1;" onclick="addToCart('${item.id}'); closeModal('quickViewModal'); openCartDrawer();">
            <i class="fas fa-shopping-basket"></i> Add to Bucket
          </button>
        </div>
      </div>
    </div>
  `;

  openModal('quickViewModal');
}

function openModal(id) {
  const modal = document.getElementById(id);
  const overlay = document.getElementById('modalOverlay');
  if (modal && overlay) {
    overlay.classList.add('active');
    modal.classList.add('active');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  const overlay = document.getElementById('modalOverlay');
  if (modal) modal.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('modalOverlay');
  if (drawer && overlay) {
    overlay.classList.add('active');
    drawer.classList.add('active');
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('modalOverlay');
  if (drawer) drawer.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
}

function showToast(message) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i class="fas fa-bolt" style="color: var(--accent-primary)"></i> ${message}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
