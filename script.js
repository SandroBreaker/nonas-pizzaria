// script.js - Refatorado com classes de CSS PURO

// --- Global State Management (Simulando React State/Context) ---

const appState = {
  currentView: AppView.MENU,
};

const CartStore = {
  items: [],
  isCartOpen: false,

  // Inicializa o carrinho a partir do localStorage
  init() {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        this.items = JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse cart storage", e);
        this.items = [];
      }
    }
    this.updateUI(); // Chama o primeiro render
    window.addEventListener('storage', (e) => {
        if (e.key === CART_STORAGE_KEY) {
            this.loadFromStorage();
        }
    });
  },

  loadFromStorage() {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    this.items = stored ? JSON.parse(stored) : [];
    this.updateUI();
  },

  // Persiste e atualiza a UI
  saveAndRender() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    this.updateUI();
  },

  // Notifica o sistema de renderização sobre a mudança
  updateUI() {
    renderHeader();
    renderCartDrawer();
  },

  get cartTotal() {
    return this.items.reduce((acc, item) => acc + item.totalPrice, 0);
  },

  get itemsCount() {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  },

  addItem(product, size) {
    const isPizza = product.category === Category.PIZZA;
    const finalPrice =
      isPizza && size && product.priceModifiers
        ? product.priceModifiers[size] || product.basePrice
        : product.basePrice;

    const existingItemIndex = this.items.findIndex(
      (item) => item.product.id === product.id && item.size === size
    );

    if (existingItemIndex > -1) {
      const item = this.items[existingItemIndex];
      item.quantity += 1;
      item.totalPrice = item.quantity * finalPrice;
    } else {
      const newItem = {
        cartId: `${product.id}-${size || 'default'}-${Date.now()}`,
        product,
        size,
        quantity: 1,
        totalPrice: finalPrice,
      };
      this.items.push(newItem);
    }

    this.isCartOpen = true; // Abre o carrinho ao adicionar item
    this.saveAndRender();
  },

  removeItem(cartId) {
    this.items = this.items.filter((item) => item.cartId !== cartId);
    this.saveAndRender();
  },

  updateQuantity(cartId, delta) {
    this.items = this.items.map((item) => {
      if (item.cartId === cartId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        const unitPrice = item.totalPrice / item.quantity;
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: unitPrice * newQuantity,
        };
      }
      return item;
    });
    this.saveAndRender();
  },
  
  clearCart() {
    this.items = [];
    this.saveAndRender();
  }
};


// --- Componente: ProductCard ---

function renderProductCard(product) {
  const isPizza = product.category === Category.PIZZA;
  let selectedSize = isPizza ? PizzaSize.G : undefined;
  
  const card = document.createElement('div');
  card.className = "bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col hover-shadow-md transition-shadow duration-300";

  const renderPriceAndActions = (currentPrice, size) => {
    return `
        <div class="flex items-center justify-between pt-2 border-t border-stone-100">
            <span class="font-bold text-lg text-dark">
                ${formatCurrency(currentPrice)}
            </span>
            <button 
                data-product-id="${product.id}" 
                data-size="${size || ''}"
                class="add-to-cart-btn bg-primary hover-bg-red-700 text-white p-2 rounded-full shadow-sm hover-shadow-md transition-all active-scale-95"
                aria-label="Adicionar ao Carrinho"
            >
                ${getIconSVG('Plus', 'icon-20')}
            </button>
        </div>
    `;
  };

  const getPizzaSizeButtons = () => {
    return `
      <div class="flex bg-stone-100 rounded-lg p-1">
        ${Object.values(PizzaSize).map(size => {
          const price = product.priceModifiers[size] || product.basePrice;
          const label = size === 'M' ? 'Média' : size === 'G' ? 'Grande' : 'Família';
          const isActive = size === selectedSize;
          return `
            <button
              data-size="${size}"
              data-product-id="${product.id}"
              class="size-button flex-1 text-xs font-medium py-1\.5 rounded-md transition-all ${
                isActive 
                  ? 'bg-white text-primary shadow-sm' 
                  : 'text-stone-500 hover-text-stone-700'
              }"
            >
              ${label}
            </button>
          `;
        }).join('')}
      </div>
    `;
  }

  card.innerHTML = `
      <div class="relative h-48 overflow-hidden group">
          <img 
            src="${product.imageUrl}" 
            alt="${product.name}" 
            class="w-full h-full object-cover transition-transform duration-500 group-hover-scale-110"
            loading="lazy"
          />
          <div class="absolute inset-0" style="background: linear-gradient(to top, rgba(0,0,0,0.5), transparent); opacity: 0.6;"></div>
          <div class="absolute bottom-3 left-3 text-white">
              <span class="text-xs font-bold bg-secondary px-2 py-0\.5 rounded-full uppercase tracking-wider">
                  ${product.category}
              </span>
          </div>
      </div>
      
      <div class="p-4 flex-1 flex flex-col">
          <h3 class="font-serif text-lg font-bold text-dark mb-1">${product.name}</h3>
          <p class="text-stone-500 text-sm mb-4 flex-1 line-clamp-3">
              ${product.description}
          </p>

          <div class="mt-auto space-y-3 product-actions">
              ${isPizza ? getPizzaSizeButtons() : ''}
              <div class="price-and-actions">
                ${renderPriceAndActions(product.priceModifiers ? product.priceModifiers[selectedSize] : product.basePrice, selectedSize)}
              </div>
          </div>
      </div>
  `;

  // --- Lógica de Interação ---

  if (isPizza) {
    const sizeButtons = card.querySelectorAll('.size-button');
    sizeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const newSize = e.target.dataset.size;
        selectedSize = newSize;

        // Atualiza o estado visual dos botões de tamanho
        sizeButtons.forEach(b => {
          b.classList.remove('bg-white', 'text-primary', 'shadow-sm');
          b.classList.add('text-stone-500', 'hover-text-stone-700');
        });
        e.target.classList.add('bg-white', 'text-primary', 'shadow-sm');
        e.target.classList.remove('text-stone-500', 'hover-text-stone-700');

        // Atualiza a seção de preço/carrinho com o novo preço
        const currentPrice = product.priceModifiers[newSize] || product.basePrice;
        card.querySelector('.price-and-actions').innerHTML = renderPriceAndActions(currentPrice, newSize);

        // Re-adiciona o listener ao novo botão "Add to cart"
        const newAddToCartBtn = card.querySelector('.add-to-cart-btn');
        newAddToCartBtn.addEventListener('click', () => CartStore.addItem(product, selectedSize));
      });
    });
  }

  // Listener inicial para o botão "Add to cart"
  const initialAddToCartBtn = card.querySelector('.add-to-cart-btn');
  initialAddToCartBtn.addEventListener('click', () => CartStore.addItem(product, selectedSize));

  return card;
}


// --- Componente: Header ---

function getIconSVG(name, sizeClass) {
  // Função para injetar ícones Lucide via JS
  return `<i data-lucide="${name}" class="icon ${sizeClass}"></i>`;
}

function renderHeader() {
  const root = document.getElementById('root');
  let header = root.querySelector('header');

  if (!header) {
    header = document.createElement('header');
    // Classes CSS Puro
    header.className = "sticky-top-0 z-40 w-full bg-white backdrop-blur-sm border-b border-stone-100 shadow-sm transition-all duration-300";
    root.prepend(header);
  }

  const itemsCount = CartStore.itemsCount;
  const isMenu = appState.currentView === AppView.MENU;

  header.innerHTML = `
    <div class="container h-16 flex items-center justify-between">
      <button 
        id="nav-to-menu-logo"
        class="flex items-center gap-2 group"
      >
        <div class="bg-primary p-1\.5 rounded-lg text-white transition-transform group-hover-rotate-12">
          ${getIconSVG('UtensilsCrossed', 'icon-24')}
        </div>
        <span class="font-serif text-xl font-bold tracking-tight text-dark">
          Nona's <span class="text-primary">Pizzeria</span>
        </span>
      </button>

      <nav class="flex items-center gap-4">
        ${!isMenu ? `
          <button 
            id="nav-to-menu-btn"
            class="text-stone-600 hover-text-primary font-medium text-sm md-hidden"
          >
            Voltar ao Menu
          </button>
        ` : ''}
        
        <button 
          id="open-cart-btn"
          class="relative p-2 text-stone-600 hover-text-primary transition-colors"
          aria-label="Abrir Carrinho"
        >
          ${getIconSVG('ShoppingCart', 'icon-24')}
          ${itemsCount > 0 ? `
            <span class="cart-count shadow-sm animate-in zoom-in">
              ${itemsCount}
            </span>
          ` : ''}
        </button>
      </nav>
    </div>
  `;

  // Adiciona listeners aos botões de navegação
  header.querySelector('#nav-to-menu-logo').addEventListener('click', () => navigate(AppView.MENU));
  const navBtn = header.querySelector('#nav-to-menu-btn');
  if(navBtn) navBtn.addEventListener('click', () => navigate(AppView.MENU));
  header.querySelector('#open-cart-btn').addEventListener('click', () => {
    CartStore.isCartOpen = true;
    CartStore.updateUI();
  });

  // Renderiza novamente os ícones Lucide
  lucide.createIcons(); 
}


// --- Componente: CartDrawer ---

function renderCartDrawer() {
  const root = document.getElementById('root');
  let drawer = root.querySelector('#cart-drawer');

  if (!CartStore.isCartOpen) {
    if (drawer) drawer.remove();
    return;
  }

  if (!drawer) {
    drawer = document.createElement('div');
    // Classes CSS Puro
    drawer.id = 'cart-drawer';
    drawer.className = 'fixed inset-0 z-50 flex justify-end';
    root.append(drawer);
  }

  const items = CartStore.items;
  const cartTotal = CartStore.cartTotal;
  const itemsCount = CartStore.itemsCount;

  const getCartItemsHTML = () => {
    if (items.length === 0) {
      return `
        <div class="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
          ${getIconSVG('ShoppingBag', 'icon-48 opacity-20')}
          <p class="text-center">Seu carrinho está vazio.</p>
          <button 
            id="close-cart-empty-btn"
            class="text-primary font-medium hover-underline"
          >
            Ver Cardápio
          </button>
        </div>
      `;
    }

    return items.map((item) => {
      const sizeLabel = item.size ? 
        (item.size === 'M' ? 'Médio' : item.size === 'G' ? 'Grande' : 'Família') : '';

      return `
        <div class="flex gap-4 p-3 border border-stone-100 rounded-xl bg-stone-50">
          <img 
            src="${item.product.imageUrl}" 
            alt="${item.product.name}" 
            class="w-16 h-16 object-cover rounded-md"
          />
          <div class="flex-1">
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-medium text-dark line-clamp-1">${item.product.name}</h4>
                ${item.size ? `
                  <span class="text-xs text-stone-500 font-medium bg-white border border-stone-200 px-1\.5 py-0\.5 rounded">
                    Tamanho: ${sizeLabel}
                  </span>
                ` : ''}
              </div>
              <button 
                data-cart-id="${item.cartId}"
                class="remove-item-btn text-stone-300 hover-text-red-500 transition-colors p-1"
                aria-label="Remover item"
              >
                ${getIconSVG('Trash2', 'icon-16')}
              </button>
            </div>
            
            <div class="flex items-center justify-between mt-3">
              <div class="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-2 py-1 shadow-sm">
                <button 
                  data-cart-id="${item.cartId}" data-delta="-1"
                  class="update-quantity-btn text-stone-400 hover-text-dark ${item.quantity <= 1 ? 'opacity-50' : ''}"
                  ${item.quantity <= 1 ? 'disabled' : ''}
                >
                  ${getIconSVG('Minus', 'icon-14')}
                </button>
                <span class="text-sm font-semibold w-4 text-center">${item.quantity}</span>
                <button 
                  data-cart-id="${item.cartId}" data-delta="1"
                  class="update-quantity-btn text-stone-400 hover-text-dark"
                >
                  ${getIconSVG('Plus', 'icon-14')}
                </button>
              </div>
              <span class="font-bold text-dark">${formatCurrency(item.totalPrice)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  drawer.innerHTML = `
    <div 
      id="cart-backdrop"
      class="absolute inset-0"
      style="background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);"
    ></div>

    <div class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      <div class="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
        <h2 class="font-serif text-xl font-bold text-dark flex items-center gap-2">
          ${getIconSVG('ShoppingBag', 'icon-20 text-primary')}
          Seu Pedido
        </h2>
        <button 
          id="close-cart-btn"
          class="p-2 text-stone-400 hover-text-dark transition-colors rounded-full"
          style="background: transparent; border: none; cursor: pointer;"
        >
          ${getIconSVG('X', 'icon-20')}
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        ${getCartItemsHTML()}
      </div>

      ${items.length > 0 ? `
        <div class="p-4 bg-white border-t border-stone-100 drawer-footer-shadow">
          <div class="flex justify-between items-center mb-4 text-lg">
            <span class="font-medium text-stone-600">Total</span>
            <span class="font-bold text-2xl text-dark">${formatCurrency(cartTotal)}</span>
          </div>
          <button 
            id="checkout-btn"
            class="w-full bg-primary hover-bg-red-700 text-white font-bold py-3\.5 rounded-xl shadow-lg shadow-red-200 transition-all active-scale-98 flex items-center justify-center gap-2"
          >
            Finalizar Pedido
          </button>
        </div>
      ` : ''}
    </div>
  `;

  // Adiciona Listeners
  drawer.querySelector('#cart-backdrop').addEventListener('click', closeCart);
  drawer.querySelector('#close-cart-btn')?.addEventListener('click', closeCart);
  drawer.querySelector('#close-cart-empty-btn')?.addEventListener('click', closeCart);

  drawer.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cartId = e.currentTarget.dataset.cartId;
      CartStore.removeItem(cartId);
    });
  });

  drawer.querySelectorAll('.update-quantity-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cartId = e.currentTarget.dataset.cartId;
      const delta = parseInt(e.currentTarget.dataset.delta);
      CartStore.updateQuantity(cartId, delta);
    });
  });

  drawer.querySelector('#checkout-btn')?.addEventListener('click', () => {
    closeCart();
    navigate(AppView.CHECKOUT);
  });
  
  // Renderiza novamente os ícones Lucide
  lucide.createIcons(); 
}

function closeCart() {
  CartStore.isCartOpen = false;
  CartStore.updateUI();
}


// --- Componente: CheckoutForm ---

function renderCheckoutForm() {
  const root = document.getElementById('root');
  const main = document.createElement('main');
  main.className = 'container mx-auto';

  // O estado do formulário será mantido internamente na função
  let formData = {
    fullName: '', email: '', phone: '', cpf: '',
    address: { zipCode: '', street: '', number: '', neighborhood: '', complement: '' }
  };
  let errors = {};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = maskCPF(value);
    if (name === 'phone') formattedValue = maskPhone(value);
    if (name === 'zipCode') formattedValue = maskZip(value);

    if (name in formData.address) {
      formData.address[name] = formattedValue;
    } else {
      formData[name] = formattedValue;
    }
    
    // Clear error on change
    if (errors[name]) {
        errors[name] = '';
        renderFormContent(main); // Re-renderiza para limpar o erro
    }
  };
  
  const validateForm = () => {
    errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Nome é obrigatório";
    if (!formData.email.includes('@')) errors.email = "Email inválido";
    if (!isValidPhone(formData.phone)) errors.phone = "Telefone inválido";
    if (!isValidCPF(formData.cpf)) errors.cpf = "CPF inválido";
    
    // Validação de Endereço combinada
    if (formData.address.street.length < 3) errors.address = "Rua é obrigatória";
    if (!formData.address.zipCode) errors.address = "CEP é obrigatório";
    if (!formData.address.number) errors.address = "Número é obrigatório";
    if (!formData.address.neighborhood) errors.address = "Bairro é obrigatório";

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Simula a submissão e navega para a tela de sucesso
      navigate(AppView.SUCCESS);
    } else {
      renderFormContent(main); // Re-renderiza para mostrar os erros
    }
  };
  
  const renderFormContent = (container) => {
    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          id="back-to-menu-btn"
          class="flex items-center text-stone-500 hover-text-dark mb-6 transition-colors"
        >
          ${getIconSVG('ChevronLeft', 'icon-20')}
          Voltar para o Menu
        </button>

        <div class="bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden">
          <div class="bg-stone-50 p-6 border-b border-stone-100">
            <h2 class="text-2xl font-serif font-bold text-dark">Checkout</h2>
            <p class="text-stone-500">Complete seus dados para finalizar o pedido.</p>
          </div>

          <form id="checkout-form" class="p-6 space-y-8">
            <section>
              <h3 class="flex items-center gap-2 font-bold text-dark mb-4">
                ${getIconSVG('User', 'icon-20 text-primary')} Dados Pessoais
              </h3>
              <div class="grid grid-cols-1 md-grid-cols-2 gap-4">
                <div class="md-col-span-2">
                  <label class="block text-sm font-medium text-stone-700 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    required
                    name="fullName"
                    value="${formData.fullName}"
                    placeholder="João Silva"
                    class="w-full px-4 py-2 rounded-lg border border-stone-200 focus-ring-2 focus-border-primary transition-all outline-none"
                  />
                  ${errors.fullName ? `<span class="text-xs text-red-500 mt-1">${errors.fullName}</span>` : ''}
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-stone-700 mb-1">CPF</label>
                  <input
                    type="text"
                    required
                    maxlength="14"
                    name="cpf"
                    value="${formData.cpf}"
                    placeholder="000.000.000-00"
                    class="w-full px-4 py-2 rounded-lg border ${errors.cpf ? 'input-error' : 'border-stone-200'} focus-ring-2 focus-border-primary transition-all outline-none"
                  />
                  ${errors.cpf ? `<span class="text-xs text-red-500 mt-1">${errors.cpf}</span>` : ''}
                </div>

                <div>
                  <label class="block text-sm font-medium text-stone-700 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    required
                    maxlength="15"
                    name="phone"
                    value="${formData.phone}"
                    placeholder="(11) 99999-9999"
                    class="w-full px-4 py-2 rounded-lg border ${errors.phone ? 'input-error' : 'border-stone-200'} focus-ring-2 focus-border-primary transition-all outline-none"
                  />
                  ${errors.phone ? `<span class="text-xs text-red-500 mt-1">${errors.phone}</span>` : ''}
                </div>

                <div class="md-col-span-2">
                  <label class="block text-sm font-medium text-stone-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    name="email"
                    value="${formData.email}"
                    placeholder="joao@exemplo.com"
                    class="w-full px-4 py-2 rounded-lg border border-stone-200 focus-ring-2 focus-border-primary transition-all outline-none"
                  />
                  ${errors.email ? `<span class="text-xs text-red-500 mt-1">${errors.email}</span>` : ''}
                </div>
              </div>
            </section>

            <section>
              <h3 class="flex items-center gap-2 font-bold text-dark mb-4">
                ${getIconSVG('MapPin', 'icon-20 text-primary')} Entrega
              </h3>
              <div class="grid grid-cols-1 md-grid-cols-4 gap-4">
                <div class="md-col-span-1">
                  <label class="block text-sm font-medium text-stone-700 mb-1">CEP</label>
                  <input
                    type="text"
                    required
                    maxlength="9"
                    name="zipCode"
                    value="${formData.address.zipCode}"
                    placeholder="00000-000"
                    class="w-full px-4 py-2 rounded-lg border border-stone-200 focus-ring-2 focus-border-primary transition-all outline-none"
                  />
                </div>
                <div class="md-col-span-3">
                  <label class="block text-sm font-medium text-stone-700 mb-1">Rua</label>
                  <input
                    type="text"
                    required
                    name="street"
                    value="${formData.address.street}"
                    class="w-full px-4 py-2 rounded-lg border border-stone-200 focus-ring-2 focus-border-primary transition-all outline-none"
                  />
                </div>
                <div class="md-col-span-1">
                  <label class="block text-sm font-medium text-stone-700 mb-1">Número</label>
                  <input
                    type="text"
                    required
                    name="number"
                    value="${formData.address.number}"
                    class="w-full px-4 py-2 rounded-lg border border-stone-200 focus-ring-2 focus-border-primary transition-all outline-none"
                  />
                </div>
                <div class="md-col-span-2">
                  <label class="block text-sm font-medium text-stone-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    required
                    name="neighborhood"
                    value="${formData.address.neighborhood}"
                    class="w-full px-4 py-2 rounded-lg border border-stone-200 focus-ring-2 focus-border-primary transition-all outline-none"
                  />
                </div>
                <div class="md-col-span-1">
                  <label class="block text-sm font-medium text-stone-700 mb-1">Comp.</label>
                  <input
                    type="text"
                    name="complement"
                    value="${formData.address.complement}"
                    class="w-full px-4 py-2 rounded-lg border border-stone-200 focus-ring-2 focus-border-primary transition-all outline-none"
                  />
                </div>
                ${errors.address ? `<div class="md-col-span-4 text-xs text-red-500">${errors.address}</div>` : ''}
              </div>
            </section>

            <div class="pt-6 border-t border-stone-100">
              <button 
                type="submit"
                class="w-full bg-primary hover-bg-red-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all transform active-scale-99 flex items-center justify-center gap-2"
              >
                ${getIconSVG('CreditCard', 'icon-24')}
                Ir para Pagamento
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Adiciona Listeners ao formulário
    container.querySelector('#back-to-menu-btn').addEventListener('click', () => navigate(AppView.MENU));
    const form = container.querySelector('#checkout-form');
    form.addEventListener('submit', handleSubmit);
    form.addEventListener('input', handleInputChange);
    
    // Renderiza novamente os ícones Lucide
    lucide.createIcons();
  }
  
  renderFormContent(main);
  return main;
}


// --- Componente: PixPayment (SUCCESS) ---

function renderPixPayment() {
  const finalTotal = CartStore.cartTotal; // Captura o total no momento do "pedido"

  // Simula o useEffect: limpa o carrinho imediatamente
  CartStore.clearCart(); 

  let copied = false;
  
  const main = document.createElement('main');
  main.className = 'container mx-auto';
  
  const handleCopy = async (btn) => {
    try {
      await navigator.clipboard.writeText(PIX_KEY_MOCK);
      copied = true;
      btn.innerHTML = `${getIconSVG('Check', 'icon-18')} Copiado!`;
      btn.classList.remove('bg-stone-800', 'hover-bg-black');
      btn.classList.add('bg-green-500');
      
      setTimeout(() => {
        copied = false;
        btn.innerHTML = `${getIconSVG('Copy', 'icon-18')} Copiar`;
        btn.classList.add('bg-stone-800', 'hover-bg-black');
        btn.classList.remove('bg-green-500');
        lucide.createIcons(); // Re-renderiza ícones
      }, 3000);

    } catch (err) {
      console.error('Failed to copy', err);
    }
    lucide.createIcons(); // Re-renderiza ícones
  };

  const renderContent = (container) => {
    container.innerHTML = `
      <div class="max-w-xl mx-auto py-12 px-4 animate-in zoom-in-95 duration-500">
        <div class="bg-white rounded-3xl shadow-2xl p-8 text-center border-t-8 border-green-500">
          <div class="mb-6 flex justify-center">
            <div class="bg-green-100 p-4 rounded-full">
              ${getIconSVG('CheckCircle2', 'icon-64 text-green-600')}
            </div>
          </div>
          
          <h2 class="text-3xl font-serif font-bold text-dark mb-2">Pedido Recebido!</h2>
          <p class="text-stone-500 mb-8">Agora só falta o pagamento para prepararmos sua pizza.</p>

          <div class="bg-stone-50 rounded-xl p-6 mb-8 border border-stone-100">
            <p class="text-sm font-bold text-stone-400 uppercase tracking-wider mb-1">Valor Total</p>
            <p class="text-4xl font-bold text-dark mb-6">${formatCurrency(finalTotal)}</p>

            <div class="space-y-4">
              <div class="text-left">
                <label class="text-xs font-semibold text-stone-500 uppercase ml-1">Pix Copia e Cola</label>
                <div class="flex gap-2 mt-1">
                  <input 
                    readOnly 
                    value="${PIX_KEY_MOCK}" 
                    class="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-400 truncate"
                  />
                  <button 
                    id="copy-pix-btn"
                    class="flex-shrink-0 px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-stone-800 text-white hover-bg-black'
                    }"
                  >
                    ${copied ? getIconSVG('Check', 'icon-18') : getIconSVG('Copy', 'icon-18')}
                    ${copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
              
              <div class="text-xs text-stone-400 bg-white p-3 rounded-lg border border-dashed border-stone-300">
                <p>1. Abra o app do seu banco</p>
                <p>2. Escolha pagar via PIX > Copia e Cola</p>
                <p>3. Cole o código acima e confirme</p>
              </div>
            </div>
          </div>

          <button 
            id="reset-app-btn"
            class="text-stone-500 hover-text-primary font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
          >
            ${getIconSVG('Home', 'icon-18')}
            Voltar para o Início
          </button>
        </div>
      </div>
    `;
    
    container.querySelector('#copy-pix-btn').addEventListener('click', (e) => handleCopy(e.currentTarget));
    container.querySelector('#reset-app-btn').addEventListener('click', () => navigate(AppView.MENU));
    
    // Renderiza novamente os ícones Lucide
    lucide.createIcons();
  }

  renderContent(main);
  return main;
}


// --- Componente: Menu Principal ---

function renderMenu() {
  const main = document.createElement('main');
  main.className = 'container mx-auto px-4 py-8 space-y-12';

  const menuHTML = `
    <div class="bg-dark rounded-3xl p-8 md-p-12 relative overflow-hidden text-white shadow-2xl">
      <img 
        src="https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1920&auto=format&fit=crop" 
        alt="Pizza Hero" 
        class="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
        style="opacity: 0.4;"
      />
      <div class="relative max-w-2xl" style="z-index: 10;">
        <h1 class="font-serif text-4xl md-text-6xl font-bold mb-4 leading-tight">
          A Verdadeira Pizza <br/><span class="text-secondary">Artesanal</span>
        </h1>
        <p class="text-stone-200 text-lg mb-8 max-w-lg">
          Ingredientes selecionados, massa de fermentação natural e o sabor inconfundível do forno a lenha.
        </p>
        <button 
          id="scroll-to-menu-btn"
          class="bg-primary hover-bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-all hover-scale-105 shadow-lg"
        >
          Ver Cardápio
        </button>
      </div>
    </div>

    <div id="menu-sections-container" class="space-y-12">
      </div>
  `;
  
  main.innerHTML = menuHTML;
  
  const menuContainer = main.querySelector('#menu-sections-container');
  
  // Renderiza as seções do menu
  [Category.PIZZA, Category.DRINK, Category.DESSERT].forEach(category => {
    const items = MENU_ITEMS.filter(i => i.category === category);
    if (items.length > 0) {
      const section = document.createElement('section');
      section.id = category.toLowerCase();
      section.className = 'scroll-mt-24';
      
      const title = category === Category.PIZZA ? 'Pizzas Especiais' : 
                    category === Category.DRINK ? 'Bebidas' : 'Sobremesas';
      const indicatorColorClass = category === Category.PIZZA ? 'bg-secondary' : 'bg-stone-300';
      
      section.innerHTML = `
        <h2 class="font-serif text-3xl font-bold text-dark mb-6 flex items-center gap-3">
          <span class="w-8 h-1 ${indicatorColorClass} rounded-full"></span>
          ${title}
        </h2>
        <div class="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-4 gap-6 product-cards-grid">
        </div>
      `;
      
      const grid = section.querySelector('.product-cards-grid');
      items.forEach(item => {
        grid.appendChild(renderProductCard(item));
      });
      
      menuContainer.appendChild(section);
    }
  });
  
  // Adiciona Listener para o scroll da Hero Section
  main.querySelector('#scroll-to-menu-btn').addEventListener('click', () => {
    document.getElementById(Category.PIZZA.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
  });

  return main;
}


// --- Lógica de Navegação e Renderização Principal (Controller) ---

function navigate(view) {
  appState.currentView = view;
  renderApp();
}

function renderApp() {
  const root = document.getElementById('root');
  
  // 1. Renderiza o Header (sempre visível)
  renderHeader();
  
  // 2. Remove o conteúdo anterior (main)
  let mainContent = root.querySelector('main');
  if (mainContent) {
    root.removeChild(mainContent);
  }
  
  // 3. Renderiza o novo conteúdo (main)
  let newContent;
  switch (appState.currentView) {
    case AppView.CHECKOUT:
      newContent = renderCheckoutForm();
      break;
    case AppView.SUCCESS:
      newContent = renderPixPayment();
      break;
    case AppView.MENU:
    default:
      newContent = renderMenu();
      break;
  }

  // Insere o novo conteúdo antes do Cart Drawer (que é fixo/overlay)
  let cartDrawer = root.querySelector('#cart-drawer');
  if (cartDrawer) {
    root.insertBefore(newContent, cartDrawer);
  } else {
    root.appendChild(newContent);
  }

  // 4. Renderiza o CartDrawer (overlay, chama updateUI/renderCartDrawer no CartStore)
  CartStore.updateUI();
}

// --- Inicialização da Aplicação ---
document.addEventListener('DOMContentLoaded', () => {
  CartStore.init(); // Inicia o estado do carrinho e persistência
  renderApp();      // Renderiza a primeira tela (MENU)
});
