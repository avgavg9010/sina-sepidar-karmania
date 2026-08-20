/**
 * Sina Sepidar Karmania - Main Vanilla JavaScript
 * Zero external frameworks required - fully functional for GitHub Pages deployment.
 */

// Global Configuration
const CONFIG = {
  telegramUsername: "SinaSepidarKarmania", // Customize or fallback to official handle
  telegramChannel: "SinaSepidarKarmania",
  phone: "+98 912 000 0000",
  whatsapp: "+989120000000",
  currency: "تومان"
};

// ==========================================
// 1. LOCAL STORAGE CART MANAGEMENT
// ==========================================
class CartManager {
  constructor() {
    this.storageKey = 'karmania_cart_v1';
    this.items = this.loadCart();
    this.listeners = [];
  }

  loadCart() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to parse cart storage', e);
      return [];
    }
  }

  saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      this.notify();
    } catch (e) {
      console.error('Failed to save cart', e);
    }
  }

  addItem(product, qty = 1) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      this.items.push({
        id: product.id,
        title: product.title,
        priceText: product.priceText,
        priceNumeric: product.priceNumeric || 0,
        priceFormatted: product.priceFormatted || product.priceText,
        image: product.image,
        category: product.category,
        quantity: qty
      });
    }
    this.saveCart();
    showToast(`«${product.title}» به سبد سفارش افزوده شد`, 'success');
  }

  removeItem(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.saveCart();
    showToast('محصول از سبد حذف شد', 'info');
  }

  updateQuantity(productId, newQty) {
    if (newQty <= 0) {
      this.removeItem(productId);
      return;
    }
    const item = this.items.find(i => i.id === productId);
    if (item) {
      item.quantity = newQty;
      this.saveCart();
    }
  }

  clearCart() {
    this.items = [];
    this.saveCart();
  }

  getTotalCount() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  getTotalPrice() {
    return this.items.reduce((sum, i) => sum + ((i.priceNumeric || 0) * i.quantity), 0);
  }

  subscribe(callback) {
    this.listeners.push(callback);
    callback(this.items);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.items));
    updateCartBadges(this.getTotalCount());
  }

  generateTelegramOrderText() {
    if (this.items.length === 0) return '';
    
    let text = `سلام و احترام،\nمن قصد ثبت سفارش موارد زیر را از وب‌سایت سینا سپیدار کارمانیا دارم:\n\n`;
    this.items.forEach((item, index) => {
      text += `🔸 ${index + 1}. ${item.title}\n`;
      text += `   - کد محصول: ${item.id}\n`;
      text += `   - تعداد: ${item.quantity} عدد\n`;
      text += `   - مبلغ: ${item.priceFormatted}\n\n`;
    });

    const total = this.getTotalPrice();
    if (total > 0) {
      text += `💰 جمع کل تقریبی: ${total.toLocaleString('fa-IR')} تومان\n\n`;
    }
    text += `لطفاً جهت هماهنگی ارسال و تایید پیش‌فاکتور راهنمایی بفرمایید.`;
    return text;
  }
}

const appCart = new CartManager();

// ==========================================
// 2. TOAST NOTIFICATION SYSTEM
// ==========================================
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  let iconName = 'info';
  if (type === 'success') iconName = 'check_circle';
  if (type === 'error') iconName = 'error';

  toast.innerHTML = `
    <span class="material-symbols-outlined text-primary text-xl">${iconName}</span>
    <span class="text-sm font-medium flex-grow">${message}</span>
    <button onclick="this.parentElement.remove()" class="text-on-surface-variant hover:text-white transition-colors">
      <span class="material-symbols-outlined text-sm">close</span>
    </button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// 3. CART BADGES & DRAWER UI
// ==========================================
function updateCartBadges(count) {
  const badges = document.querySelectorAll('.cart-badge-count');
  badges.forEach(b => {
    b.textContent = count > 0 ? count.toLocaleString('fa-IR') : '۰';
    if (count > 0) {
      b.classList.remove('hidden');
      b.classList.add('inline-flex');
    } else {
      b.classList.add('hidden');
      b.classList.remove('inline-flex');
    }
  });
}

function openCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) {
    drawer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderCartDrawerContent();
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (drawer) {
    drawer.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

function renderCartDrawerContent() {
  const list = document.getElementById('cart-drawer-items');
  const footer = document.getElementById('cart-drawer-footer');
  const emptyState = document.getElementById('cart-drawer-empty');
  const totalAmountEl = document.getElementById('cart-drawer-total-amount');

  if (!list) return;

  if (appCart.items.length === 0) {
    list.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    if (footer) footer.classList.add('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (footer) footer.classList.remove('hidden');

  list.innerHTML = appCart.items.map(item => `
    <div class="glass-panel p-4 rounded-xl flex gap-4 items-center justify-between border border-white/5">
      <img src="${item.image}" alt="${item.title}" class="w-16 h-16 rounded-lg object-cover bg-surface-dim flex-shrink-0" />
      <div class="flex-grow min-w-0">
        <h4 class="font-bold text-sm text-on-surface truncate">${item.title}</h4>
        <div class="text-xs text-primary mt-1">${item.priceFormatted || item.priceText}</div>
        <div class="flex items-center gap-2 mt-2">
          <button onclick="appCart.updateQuantity('${item.id}', ${item.quantity - 1}); renderCartDrawerContent();" 
                  class="w-6 h-6 rounded bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-xs text-on-surface">
            -
          </button>
          <span class="text-xs font-bold px-1">${item.quantity.toLocaleString('fa-IR')}</span>
          <button onclick="appCart.updateQuantity('${item.id}', ${item.quantity + 1}); renderCartDrawerContent();" 
                  class="w-6 h-6 rounded bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-xs text-on-surface">
            +
          </button>
        </div>
      </div>
      <button onclick="appCart.removeItem('${item.id}'); renderCartDrawerContent();" class="text-on-surface-variant hover:text-error transition-colors p-1" title="حذف">
        <span class="material-symbols-outlined text-lg">delete</span>
      </button>
    </div>
  `).join('');

  if (totalAmountEl) {
    const total = appCart.getTotalPrice();
    totalAmountEl.textContent = total > 0 ? `${total.toLocaleString('fa-IR')} تومان` : 'استعلام قیمت نهایی';
  }
}

// Telegram Checkout
function orderCartViaTelegram() {
  const text = appCart.generateTelegramOrderText();
  if (!text) {
    showToast('سبد سفارش شما خالی است', 'error');
    return;
  }
  const encodedText = encodeURIComponent(text);
  const url = `https://t.me/${CONFIG.telegramUsername}?text=${encodedText}`;
  window.open(url, '_blank');
}

// Single Product Direct Telegram Inquiry
function orderProductDirectViaTelegram(productId) {
  const product = (typeof PRODUCTS_DATA !== 'undefined') 
    ? PRODUCTS_DATA.find(p => p.id === productId) 
    : null;

  let text = '';
  if (product) {
    text = `سلام و احترام،\nمایل به دریافت مشاوره تخصصی و ثبت سفارش محصول زیر از وب‌سایت سینا سپیدار کارمانیا هستم:\n\n` +
      `🔸 نام اثر: ${product.title}\n` +
      `🔹 کد شناسه: ${product.id}\n` +
      `🔸 دسته‌بندی: ${product.category}\n` +
      `🔹 قیمت/وضعیت: ${product.priceFormatted || product.priceText}\n\n` +
      `لطفاً اطلاعات تکمیلی نحوه سفارش و ارسال را ارسال فرمایید.`;
  } else {
    text = `سلام و احترام،\nقصد ثبت سفارش و استعلام قیمت محصولات صنایع دستی سینا سپیدار کارمانیا را دارم.`;
  }

  const encodedText = encodeURIComponent(text);
  const url = `https://t.me/${CONFIG.telegramUsername}?text=${encodedText}`;
  window.open(url, '_blank');
}

// ==========================================
// 4. PRODUCT QUICK-VIEW MODAL
// ==========================================
function openProductModal(productId) {
  if (typeof PRODUCTS_DATA === 'undefined') return;
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  let modal = document.getElementById('product-quickview-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'product-quickview-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop hidden';
    document.body.appendChild(modal);
  }

  let specsHtml = '';
  if (product.specs) {
    specsHtml = `
      <div class="mt-4 border-t border-white/10 pt-4">
        <h5 class="text-xs font-bold text-primary mb-2">مشخصات فنی و اصالت:</h5>
        <div class="grid grid-cols-2 gap-2 text-xs text-on-surface-variant">
          ${Object.entries(product.specs).map(([k, v]) => `
            <div class="bg-surface-container-high/60 p-2 rounded">
              <span class="text-on-surface/60">${k}:</span> <strong class="text-on-surface">${v}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  modal.innerHTML = `
    <div class="glass-panel w-full max-w-3xl rounded-2xl overflow-hidden border border-white/15 max-h-[90vh] flex flex-col md:flex-row animate-fade-in relative">
      <button onclick="closeProductModal()" class="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-black/60 text-white hover:text-primary flex items-center justify-center transition-colors">
        <span class="material-symbols-outlined text-lg">close</span>
      </button>

      <div class="w-full md:w-1/2 relative bg-surface-dim min-h-[260px] md:min-h-full">
        <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover" />
        <div class="absolute top-4 right-4 bg-primary text-on-primary text-xs font-bold px-3 py-1 rounded-full">
          ${product.badge || product.category}
        </div>
      </div>

      <div class="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
        <div class="text-xs text-primary/80 font-label-md mb-1">${product.category} (کد: ${product.id})</div>
        <h3 class="font-headline-md text-lg md:text-xl font-bold text-on-surface mb-3">${product.title}</h3>
        <p class="text-sm text-on-surface-variant leading-relaxed mb-4">${product.details || product.shortDesc}</p>
        
        ${specsHtml}

        <div class="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-xs text-on-surface-variant">قیمت پایه:</span>
            <span class="text-lg font-bold text-primary">${product.priceFormatted || product.priceText}</span>
          </div>

          <div class="flex gap-2">
            <button onclick="appCart.addItem(PRODUCTS_DATA.find(p=>p.id==='${product.id}')); closeProductModal();" 
                    class="btn-gold flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
              <span class="material-symbols-outlined text-lg">shopping_bag</span>
              افزودن به سبد
            </button>
            <button onclick="orderProductDirectViaTelegram('${product.id}')" 
                    class="btn-ghost px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-1.5 hover:text-primary">
              <span class="material-symbols-outlined text-lg">send</span>
              سفارش تلگرام
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = document.getElementById('product-quickview-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// ==========================================
// 5. GLOBAL SEARCH OVERLAY
// ==========================================
function openSearchModal() {
  let modal = document.getElementById('global-search-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'global-search-modal';
    modal.className = 'fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 modal-backdrop hidden';
    modal.innerHTML = `
      <div class="glass-panel w-full max-w-2xl rounded-2xl p-6 border border-white/15 animate-fade-in">
        <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div class="flex items-center gap-3 flex-grow">
            <span class="material-symbols-outlined text-primary text-2xl">search</span>
            <input type="text" id="global-search-input" placeholder="جستجو در میان منسوجات، خاتم، ابریشم و خدمات..." 
                   class="bg-transparent border-none text-on-surface w-full focus:outline-none text-base placeholder:text-on-surface-variant/60" />
          </div>
          <button onclick="closeSearchModal()" class="text-on-surface-variant hover:text-white p-1">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div id="global-search-results" class="max-h-[60vh] overflow-y-auto flex flex-col gap-2">
          <p class="text-xs text-on-surface-variant/60 text-center py-6">عبارت مورد نظر خود را تایپ نمایید...</p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const input = document.getElementById('global-search-input');
    input.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const resultsEl = document.getElementById('global-search-results');
      if (!q) {
        resultsEl.innerHTML = '<p class="text-xs text-on-surface-variant/60 text-center py-6">عبارت مورد نظر خود را تایپ نمایید...</p>';
        return;
      }
      if (typeof PRODUCTS_DATA === 'undefined') return;

      const matches = PRODUCTS_DATA.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) || 
        p.shortDesc.toLowerCase().includes(q)
      );

      if (matches.length === 0) {
        resultsEl.innerHTML = '<p class="text-xs text-on-surface-variant text-center py-6">موردی با این مشخصات یافت نشد.</p>';
        return;
      }

      resultsEl.innerHTML = matches.map(p => `
        <div onclick="closeSearchModal(); openProductModal('${p.id}');" class="glass-card p-3 rounded-lg flex items-center justify-between cursor-pointer hover:border-primary">
          <div class="flex items-center gap-3">
            <img src="${p.image}" alt="${p.title}" class="w-12 h-12 rounded object-cover" />
            <div>
              <div class="text-sm font-bold text-on-surface">${p.title}</div>
              <div class="text-xs text-primary">${p.category}</div>
            </div>
          </div>
          <span class="material-symbols-outlined text-on-surface-variant text-sm rtl:rotate-180">arrow_forward</span>
        </div>
      `).join('');
    });
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const input = document.getElementById('global-search-input');
    if (input) input.focus();
  }, 100);
}

function closeSearchModal() {
  const modal = document.getElementById('global-search-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// ==========================================
// 6. MOBILE DRAWER & DOM INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
  const mobileMenuClose = document.getElementById('mobile-menu-close');

  if (mobileMenuBtn && mobileMenuDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuDrawer.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }

  if (mobileMenuClose && mobileMenuDrawer) {
    mobileMenuClose.addEventListener('click', () => {
      mobileMenuDrawer.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }

  // Bind Cart button triggers
  const cartButtons = document.querySelectorAll('.trigger-cart-modal');
  cartButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openCartDrawer();
    });
  });

  // Bind Search triggers
  const searchButtons = document.querySelectorAll('.trigger-search-modal');
  searchButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSearchModal();
    });
  });

  // Highlight active nav links
  const path = window.location.pathname;
  const navLinks = document.querySelectorAll('nav a, #mobile-menu-drawer a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '#' && path.includes(href)) {
      link.classList.add('text-primary', 'font-bold');
    }
  });

  // Setup initial cart count
  appCart.notify();

  // Scroll effect on top navigation
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('main-nav') || document.querySelector('header');
    if (nav) {
      if (window.scrollY > 20) {
        nav.classList.add('shadow-2xl', 'bg-surface/90');
      } else {
        nav.classList.remove('shadow-2xl', 'bg-surface/90');
      }
    }
  });
});
