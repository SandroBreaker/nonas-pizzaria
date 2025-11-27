
import * as State from './state.js';
import * as Utils from './utils.js';

// --- UI COMPONENTS ---

export function renderProductCard(product) {
  const isPizza = product.category === State.CATEGORIES.PIZZA;
  let selectedSize = isPizza ? State.PIZZA_SIZES.G : undefined;
  
  const card = document.createElement('div');
  card.className = "product-card";

  const getPrice = (size) => product.priceModifiers ? product.priceModifiers[size] : product.basePrice;

  const renderContent = () => {
    const currentPrice = getPrice(selectedSize);
    const originalPrice = currentPrice * 2; 

    card.innerHTML = `
      <div class="card-image-box">
          <img src="${product.imageUrl}" alt="${product.name}" class="card-img" loading="lazy" />
          <div class="card-badge">${product.category}</div>
          ${product.onSale ? '<div class="card-promo-badge">OFERTA 🔥</div>' : ''}
      </div>
      
      <div class="card-body">
          <h3 class="card-title">${product.name}</h3>
          <p class="card-desc">${product.description}</p>

          <div class="card-actions">
              ${isPizza ? `
                  <div class="size-selector">
                    ${Object.values(State.PIZZA_SIZES).map(size => `
                        <button class="size-btn ${size === selectedSize ? 'active' : ''}" data-size="${size}">
                            ${size === 'M' ? 'Média' : size === 'G' ? 'Grande' : 'Família'}
                        </button>
                    `).join('')}
                  </div>
              ` : ''}
              
              <div class="price-row">
                  <div class="price-container">
                    <span class="price-original">${Utils.formatCurrency(originalPrice)}</span>
                    <span class="price-value">${Utils.formatCurrency(currentPrice)}</span>
                  </div>
                  <button class="btn-add-cart" aria-label="Adicionar">
                      ${Utils.getIcon('Plus', 'icon-20 text-white')}
                  </button>
              </div>
          </div>
      </div>
    `;
    
    if (isPizza) {
        card.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                selectedSize = e.target.dataset.size;
                renderContent(); 
            });
        });
    }
    
    card.querySelector('.btn-add-cart').addEventListener('click', () => {
        State.CartStore.addItem(product, selectedSize);
    });
  };

  renderContent();
  return card;
}

export function renderFooter() {
    let footer = document.getElementById('app-footer');
    if (!footer) {
        footer = document.createElement('nav');
        footer.id = 'app-footer';
        footer.className = 'app-footer';
        document.body.appendChild(footer);
    }
    
    const views = [
        { id: State.APP_VIEWS.MENU, icon: 'Home', label: 'Início' },
        { id: State.APP_VIEWS.FAQ, icon: 'Question', label: 'FAQ' },
        { id: State.APP_VIEWS.CONTACT, icon: 'Phone', label: 'Contato' },
        { id: State.APP_VIEWS.PROFILE, icon: 'User', label: 'Perfil' }
    ];

    const current = State.appState.currentView;

    footer.innerHTML = views.map(v => `
        <button class="footer-btn ${current === v.id ? 'active' : ''}" data-view="${v.id}">
            ${Utils.getIcon(v.icon, 'icon-20')}
            <span>${v.label}</span>
        </button>
    `).join('');

    footer.querySelectorAll('.footer-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
             const view = e.currentTarget.dataset.view;
             State.navigate(view);
        });
    });
}

export function updateHeaderUI() {
    const count = State.CartStore.itemsCount;
    const badge = document.getElementById('header-cart-count');
    const cartBtn = document.getElementById('open-cart-btn');
    
    if(!badge || !cartBtn) return;

    if (badge.innerText !== count.toString() && count > 0) {
        cartBtn.classList.remove('animate-shake');
        void cartBtn.offsetWidth; 
        cartBtn.classList.add('animate-shake');
    }

    badge.innerText = count;
    if (count > 0) badge.classList.remove('hidden');
    else badge.classList.add('hidden');
    
    renderCategoryNav();
}

export function renderCategoryNav() {
    const container = document.querySelector('.category-scroll');
    if (!container) return;
    
    const currentCategory = State.appState.selectedCategory;
    
    container.innerHTML = Object.values(State.CATEGORIES).map(category => {
        const isActive = category === currentCategory;
        const label = category === State.CATEGORIES.REVIEW ? 'Avaliações' : category.charAt(0) + category.slice(1).toLowerCase();
        return `
            <button 
                data-category="${category}"
                class="category-btn ${isActive ? 'active' : ''}"
            >
                ${label}
            </button>
        `;
    }).join('');
    
    container.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            State.setSelectedCategory(e.currentTarget.dataset.category);
        });
    });
}

export function updateCartUI() {
    const drawer = document.getElementById('cart-drawer');
    const container = document.getElementById('cart-items-container');
    const footer = document.getElementById('cart-footer');
    const totalEl = document.getElementById('cart-total-value');
    
    if(!drawer || !container) return;

    if (State.CartStore.isCartOpen) {
        drawer.setAttribute('aria-hidden', 'false');
    } else {
        drawer.setAttribute('aria-hidden', 'true');
    }
    
    const items = State.CartStore.items;
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-msg">
                ${Utils.getIcon('ShoppingBag', 'icon-48 text-primary')}
                <p>Seu carrinho está vazio.</p>
                <button id="close-cart-empty" class="btn-ghost">Ver Cardápio</button>
            </div>
        `;
        if(footer) footer.classList.add('hidden');
        
        container.querySelector('#close-cart-empty')?.addEventListener('click', () => {
             State.CartStore.isCartOpen = false;
             State.CartStore.updateUI();
        });
    } else {
        if(footer) footer.classList.remove('hidden');
        if(totalEl) totalEl.innerText = Utils.formatCurrency(State.CartStore.cartTotal);
        
        container.innerHTML = items.map(item => `
            <div class="cart-item">
                <img src="${item.product.imageUrl}" class="cart-item-img" alt="${item.product.name}" />
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.product.name}</h4>
                    ${item.size ? `<p class="cart-item-details">Tam: ${item.size}</p>` : ''}
                    
                    <div class="cart-controls">
                        <div class="qty-selector">
                            <button class="qty-btn update-qty" data-id="${item.cartId}" data-delta="-1" ${item.quantity <= 1 ? 'disabled' : ''}>
                                ${Utils.getIcon('Minus', 'icon-14')}
                            </button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn update-qty" data-id="${item.cartId}" data-delta="1">
                                ${Utils.getIcon('Plus', 'icon-14')}
                            </button>
                        </div>
                        <p class="font-bold text-sm">${Utils.formatCurrency(item.totalPrice)}</p>
                        <button class="remove-item btn-icon" data-id="${item.cartId}">
                            ${Utils.getIcon('Trash2', 'icon-16')}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('.update-qty').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const delta = parseInt(e.currentTarget.dataset.delta);
                State.CartStore.updateQuantity(id, delta);
            });
        });
        
        container.querySelectorAll('.remove-item').forEach(btn => {
             btn.addEventListener('click', (e) => State.CartStore.removeItem(e.currentTarget.dataset.id));
        });
    }
}

export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') {
        toast.style.borderLeft = '4px solid var(--color-error)';
        toast.innerHTML = `${Utils.getIcon('XCircle', 'icon-16 text-red')} ${message}`;
    } else {
        toast.innerHTML = `${Utils.getIcon('Check', 'icon-16 text-green')} ${message}`;
    }
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// TIMERS
let countdownInterval;
export function startCountdown() {
  const timerEl = document.getElementById('countdown-timer');
  if (!timerEl) return;
  
  let totalSeconds = 3600; 
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    totalSeconds--;
    if (totalSeconds < 0) totalSeconds = 3600; 
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    timerEl.innerText = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

export function startSalesPop() {
  const container = document.getElementById('sales-pop-container');
  if(!container) return;
  
  const names = ["Ricardo", "Ana", "Carlos", "Beatriz", "João", "Fernanda", "Pedro", "Larissa", "Lucas", "Mariana", "Gabriel"];
  const actions = ["comprou 2 Pizzas G", "comprou 1 Promoção Família", "aproveitou o desconto de 50%", "acabou de pedir 3 Pizzas"];
  
  setInterval(() => {
    if (document.hidden) return;
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const timeAgo = Math.floor(Math.random() * 40) + 5; 

    const pop = document.createElement('div');
    pop.className = 'sales-pop';
    pop.innerHTML = `
      <div class="sales-pop-icon">${Utils.getIcon('CreditCard', 'icon-20 text-green')}</div>
      <div class="sales-pop-content">
        <p><strong>${randomName}</strong> ${randomAction}</p>
        <span>há ${timeAgo} segundos</span>
      </div>
    `;
    container.appendChild(pop);
    setTimeout(() => {
      pop.style.animation = 'slideOutRight 0.5s ease-in forwards';
      setTimeout(() => pop.remove(), 500);
    }, 5000);
  }, 40000); 
}
