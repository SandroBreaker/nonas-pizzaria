// app.js
// CONSOLIDATED FILE: Core Logic + All Components

import * as State from './state.js';
import * as Utils from './utils.js';

// --- I. CORE CONTROLLER LOGIC ---

/**
 * Lógica de Navegação e Renderização Principal (Controller)
 */
export function renderApp(onlyCartUpdate = false) {
  const root = document.getElementById('root');
  
  // 1. Renderiza o Header (sempre visível)
  renderHeader();
  
  // 2. Renderiza o CartDrawer (overlay)
  renderCartDrawer();

  // Se for apenas uma atualização do carrinho, não precisamos redesenhar o conteúdo principal
  if (onlyCartUpdate) {
    lucide.createIcons(); // Chama aqui também para garantir ícones no Drawer
    return;
  }
  
  // 3. Remove o conteúdo anterior (main)
  let mainContent = root.querySelector('main');
  if (mainContent) {
    root.removeChild(mainContent);
  }
  
  // 4. Renderiza o novo conteúdo (main) baseado na View
  let newContent;
  switch (State.appState.currentView) {
    case State.APP_VIEWS.CHECKOUT:
      newContent = renderCheckoutForm();
      break;
    case State.APP_VIEWS.SUCCESS:
      newContent = renderPixPayment();
      break;
    case State.APP_VIEWS.MENU:
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
  
  // 5. ATUALIZADO: Processa TODOS os ícones APÓS TODOS os elementos estarem no DOM.
  lucide.createIcons(); 
}

// --- II. COMPONENTS LOGIC ---

// --- 1. ProductCard ---
export function renderProductCard(product) {
  const isPizza = product.category === State.CATEGORIES.PIZZA;
  let selectedSize = isPizza ? State.PIZZA_SIZES.G : undefined;
  
  const card = document.createElement('div');
  card.className = "bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden flex flex-col hover-shadow-md transition-shadow duration-300";

  const renderPriceAndActions = (currentPrice, size) => {
    return `
        <div class="flex items-center justify-between pt-2 border-t border-stone-100">
            <span class="font-bold text-lg text-dark">
                ${Utils.formatCurrency(currentPrice)}
            </span>
            <button 
                data-product-id="${product.id}" 
                data-size="${size || ''}"
                class="add-to-cart-btn bg-primary hover-bg-red-700 text-white p-2 rounded-full shadow-sm hover-shadow-md transition-all active-scale-95"
                aria-label="Adicionar ao Carrinho"
            >
                ${Utils.getIconSVG('Plus', 'icon-20')}
            </button>
        </div>
    `;
  };

  const getPizzaSizeButtons = () => {
    return `
      <div class="flex bg-stone-100 rounded-lg p-1">
        ${Object.values(State.PIZZA_SIZES).map(size => {
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

  const initialPrice = product.priceModifiers ? product.priceModifiers[selectedSize] : product.basePrice;

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
                ${renderPriceAndActions(initialPrice, selectedSize)}
              </div>
          </div>
      </div>
  `;

  const priceAndActionsContainer = card.querySelector('.price-and-actions');

  const updatePriceAndListeners = (size) => {
        const currentPrice = product.priceModifiers ? product.priceModifiers[size] : product.basePrice;
        priceAndActionsContainer.innerHTML = renderPriceAndActions(currentPrice, size);
        
        const newAddToCartBtn = card.querySelector('.add-to-cart-btn');
        if (newAddToCartBtn) {
            newAddToCartBtn.addEventListener('click', () => State.CartStore.addItem(product, size));
        }
  };

  if (isPizza) {
    const sizeButtons = card.querySelectorAll('.size-button');
    sizeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const newSize = e.target.dataset.size;
        selectedSize = newSize;

        sizeButtons.forEach(b => {
          b.classList.remove('bg-white', 'text-primary', 'shadow-sm');
          b.classList.add('text-stone-500', 'hover-text-stone-700');
        });
        e.target.classList.add('bg-white', 'text-primary', 'shadow-sm');
        e.target.classList.remove('text-stone-500', 'hover-text-stone-700');

        updatePriceAndListeners(newSize);
      });
    });
  }

  updatePriceAndListeners(selectedSize);

  return card;
}


// --- 2. Header ---
export function renderHeader() {
  const root = document.getElementById('root');
  let header = root.querySelector('header');

  if (!header) {
    header = document.createElement('header');
    header.className = "sticky-top-0 z-40 w-full bg-white backdrop-blur-sm border-b border-stone-100 shadow-sm transition-all duration-300";
    root.prepend(header);
  }

  const itemsCount = State.CartStore.itemsCount;
  const isMenu = State.appState.currentView === State.APP_VIEWS.MENU;
  const currentCategory = State.appState.selectedCategory; 

  header.innerHTML = `
    <div class="container h-16 flex items-center justify-between">
      <button 
        id="nav-to-menu-logo"
        class="flex items-center gap-2 group"
      >
        <div class="bg-primary p-1\.5 rounded-lg text-white transition-transform group-hover-rotate-12">
          ${Utils.getIconSVG('UtensilsCrossed', 'icon-24')}
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
          ${Utils.getIconSVG('ShoppingCart', 'icon-24')}
          ${itemsCount > 0 ? `
            <span class="cart-count shadow-sm animate-in zoom-in">
              ${itemsCount}
            </span>
          ` : ''}
        </button>
      </nav>
    </div>

    ${isMenu ? `
        <div class="w-full bg-white border-b border-stone-100 shadow-sm">
            <div class="container flex justify-start items-center gap-3 overflow-x-auto whitespace-nowrap py-2">
                ${Object.values(State.CATEGORIES).map(category => {
                    const isActive = category === currentCategory;
                    // Lógica para label da categoria, tratando 'AVALIAÇÕES'
                    const label = category === State.CATEGORIES.REVIEW ? 'Avaliações' : category.charAt(0) + category.slice(1).toLowerCase();
                    return `
                        <button 
                            data-category="${category}"
                            class="category-nav-btn px-4 py-1\.5 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${
                                isActive 
                                    ? 'bg-primary text-white shadow-md' 
                                    : 'bg-stone-100 text-stone-600 hover-bg-stone-200'
                            }"
                        >
                            ${label}
                        </button>
                    `;
                }).join('')}
            </div>
        </div>
    ` : ''}
  `;

  // Adiciona listeners
  header.querySelector('#nav-to-menu-logo').addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
  const navBtn = header.querySelector('#nav-to-menu-btn');
  if(navBtn) navBtn.addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
  
  header.querySelector('#open-cart-btn').addEventListener('click', () => {
    State.CartStore.isCartOpen = true;
    State.CartStore.updateUI();
  });

  if (isMenu) {
      header.querySelectorAll('.category-nav-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
              const category = e.currentTarget.dataset.category;
              State.setSelectedCategory(category);
          });
      });
  }

  // lucide.createIcons() REMOVIDO DAQUI
}

// --- 3. CartDrawer ---
function closeCart() {
  State.CartStore.isCartOpen = false;
  State.CartStore.updateUI();
}

export function renderCartDrawer() {
  const root = document.getElementById('root');
  let drawer = root.querySelector('#cart-drawer');

  if (!State.CartStore.isCartOpen) {
    if (drawer) drawer.remove();
    return;
  }

  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'fixed inset-0 z-50 flex justify-end';
    root.append(drawer);
  }

  const items = State.CartStore.items;
  const cartTotal = State.CartStore.cartTotal;
  const itemsCount = State.CartStore.itemsCount;

  const getCartItemsHTML = () => {
    if (items.length === 0) {
      return `
        <div class="h-full flex flex-col items-center justify-center text-stone-400 space-y-4">
          ${Utils.getIconSVG('ShoppingBag', 'icon-48 opacity-20')}
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
                ${Utils.getIconSVG('Trash2', 'icon-16')}
              </button>
            </div>
            
            <div class="flex items-center justify-between mt-3">
              <div class="flex items-center gap-3 bg-white border border-stone-200 rounded-lg px-2 py-1 shadow-sm">
                <button 
                  data-cart-id="${item.cartId}" data-delta="-1"
                  class="update-quantity-btn text-stone-400 hover-text-dark ${item.quantity <= 1 ? 'opacity-50' : ''}"
                  ${item.quantity <= 1 ? 'disabled' : ''}
                >
                  ${Utils.getIconSVG('Minus', 'icon-14')}
                </button>
                <span class="text-sm font-semibold w-4 text-center">${item.quantity}</span>
                <button 
                  data-cart-id="${item.cartId}" data-delta="1"
                  class="update-quantity-btn text-stone-400 hover-text-dark"
                >
                  ${Utils.getIconSVG('Plus', 'icon-14')}
                </button>
              </div>
              <span class="font-bold text-dark">${Utils.formatCurrency(item.totalPrice)}</span>
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
          ${Utils.getIconSVG('ShoppingBag', 'icon-20 text-primary')}
          Seu Pedido
        </h2>
        <button 
          id="close-cart-btn"
          class="p-2 text-stone-400 hover-text-dark transition-colors rounded-full"
          style="background: transparent; border: none; cursor: pointer;"
        >
          ${Utils.getIconSVG('X', 'icon-20')}
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        ${getCartItemsHTML()}
      </div>

      ${items.length > 0 ? `
        <div class="p-4 bg-white border-t border-stone-100 drawer-footer-shadow">
          <div class="flex justify-between items-center mb-4 text-lg">
            <span class="font-medium text-stone-600">Total</span>
            <span class="font-bold text-2xl text-dark">${Utils.formatCurrency(cartTotal)}</span>
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
      State.CartStore.removeItem(cartId);
    });
  });

  drawer.querySelectorAll('.update-quantity-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cartId = e.currentTarget.dataset.cartId;
      const delta = parseInt(e.currentTarget.dataset.delta);
      State.CartStore.updateQuantity(cartId, delta);
    });
  });

  drawer.querySelector('#checkout-btn')?.addEventListener('click', () => {
    closeCart();
    State.navigate(State.APP_VIEWS.CHECKOUT);
  });
  
  // lucide.createIcons() REMOVIDO DAQUI
}

// --- 4. ReviewsSection ---
const REVIEWS = [
  { id: 1, author: "Matheus Freitas", rating: 5, date: "2024-03-20T10:00:00Z", text: "Fui no manhã de sábado (4/5/22) [A data foi ajustada para ser atual]. Tomamos um café da manhã excelente! Tudo muito fresquinho e bem saboroso, aquela cesta de padaria, o pão de queijo é muito bom. Meus pais vieram visitar e pediram para voltarmos, e vamos voltaremos com ctz. ... Mais", commentsCount: 17, photosCount: 2 },
  { id: 2, author: "José Alberto", rating: 5, date: "2024-03-18T14:30:00Z", text: "Local muito bom na Zona Sul com atendimento com excelência. Recomendo o salmão com risoto de aspargos. Preços bons, mas a qualidade compensa! ... Mais", commentsCount: 4, photosCount: 6 },
  { id: 3, author: "Boni Marc", rating: 5, date: "2024-03-17T09:15:00Z", text: "Adoro este lugar, frequento desde quando abriu, sempre um salão bem legal pra ir. ... Mais", commentsCount: 7, photosCount: 12 },
  { id: 4, author: "Elizabeth Monari", rating: 5, date: "2024-03-15T18:00:00Z", text: "BONS PRODUTOS, INGREDIENTES FRESCOS / PREÇO ACESSÍVEL / ATENDIMENTO ÓTIMO. ... Mais", commentsCount: 2, photosCount: 2 },
  { id: 5, author: "Angela Silva", rating: 4, date: "2024-03-14T11:00:00Z", text: "Maravilhosa tudo muito fresquinho e ótimo preço. ... Mais", commentsCount: 3, photosCount: 1 },
  { id: 6, author: "Paloma Mascarenhas", rating: 4, date: "2024-03-12T08:45:00Z", text: "Atendimento rápido, um café da manhã. Cardápio com ótimas opções. Preço bom, mas tem que fazer um desejo no pedido em lanchonetes e dando. Previsão de preço, acabei de vir com uma dúvida incrível. Voltarei a frequentar 😊 ... Mais", commentsCount: 21, photosCount: 1 },
  { id: 7, author: "Lanchonete e Pizzaria Boa Sorte (responsável)", rating: null, date: "2024-03-12T09:00:00Z", text: "Obrigado! 👏👏👏", isOwner: true, },
];

export function renderReviewsSection() {
  const section = document.createElement('section');
  section.id = 'reviews-section';
  // Removido classes de container/espaçamento externo, e mt-12. Agora será apenas o card de avaliações.
  section.className = 'py-12 space-y-8 bg-white rounded-3xl shadow-xl border border-stone-100';

  section.innerHTML = `
    <h2 class="font-serif text-3xl font-bold text-dark mb-6 flex items-center gap-3 px-4">
      <span class="w-8 h-1 bg-primary rounded-full"></span>
      Avaliações dos Clientes
    </h2>
    <div class="space-y-6 px-4">
      ${REVIEWS.map(review => `
        <div class="border-b border-stone-100 pb-6 last:border-b-0">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-dark font-semibold text-lg flex-shrink-0">
                ${review.isOwner ? Utils.getIconSVG('Pizza', 'icon-20 text-primary') : review.author.charAt(0)}
            </div>
            <div>
              <p class="font-semibold text-dark">${review.author} ${review.isOwner ? '<span class="text-sm text-stone-500">(Proprietário)</span>' : ''}</p>
              <div class="flex items-center text-sm text-stone-500">
                ${review.rating ? `
                  ${Array(review.rating).fill().map(() => Utils.getIconSVG('StarFill', 'icon-14 text-yellow-500')).join('')}
                  ${Array(5 - review.rating).fill().map(() => Utils.getIconSVG('Star', 'icon-14 text-stone-300')).join('')}
                ` : ''}
                <span class="ml-2">${Utils.formatDate(review.date)}</span>
              </div>
            </div>
          </div>
          <p class="text-stone-700 mb-3">${review.text}</p>
          <div class="flex items-center gap-4 text-sm text-stone-500">
            ${review.commentsCount ? `
                <span class="flex items-center gap-1">
                    ${Utils.getIconSVG('MessageSquare', 'icon-16')} ${review.commentsCount}
                </span>
            ` : ''}
            ${review.photosCount ? `
                <span class="flex items-center gap-1">
                    ${Utils.getIconSVG('Camera', 'icon-16')} ${review.photosCount}
                </span>
            ` : ''}
            <button class="text-primary hover-underline font-medium ml-auto">Ver Mais</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  
  // lucide.createIcons() REMOVIDO DAQUI
  return section;
}


// --- 5. Menu ---
export function renderMenu() {
  const main = document.createElement('main');
  main.className = 'py-8 space-y-16'; 

  const currentCategory = State.appState.selectedCategory;

  // 1. Hero Section (Full Width)
  const heroWrapper = document.createElement('div');
  heroWrapper.className = 'w-full';
  
  const heroHTML = `
    <div class="bg-dark p-8 md-p-12 relative overflow-hidden text-white shadow-2xl">
        <img 
            src="https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1920&auto=format&fit=crop" 
            alt="Pizza Hero" 
            class="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
            style="opacity: 0.4;"
        />
        <div class="container mx-auto px-4">
            <div class="relative max-w-2xl" style="z-index: 10;">
                <h1 class="font-serif text-4xl md:text-6xl font-bold mb-4 leading-tight">
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
    </div>
  `;
  heroWrapper.innerHTML = heroHTML;

  // 2. Menu Content (Contained)
  const menuContent = document.createElement('div');
  menuContent.id = 'menu-sections-container';
  menuContent.className = 'container mx-auto px-4'; 

  // Lógica para alternar entre Menu de Produtos e Seção de Avaliações
  
  if (currentCategory === State.CATEGORIES.REVIEW) {
    // RENDERIZA AVALIAÇÕES como o conteúdo principal
    menuContent.appendChild(renderReviewsSection());
  } else {
    // RENDERIZA CATEGORIA DE PRODUTOS
    const categoryItems = State.MENU_ITEMS.filter(i => i.category === currentCategory);
      
    if (categoryItems.length > 0) {
      const section = document.createElement('section');
      section.id = currentCategory.toLowerCase();
      section.className = 'animate-in fade-in duration-300 scroll-mt-24'; 
      
      const title = currentCategory === State.CATEGORIES.PIZZA ? 'Pizzas Especiais' : 
                    currentCategory === State.CATEGORIES.DRINK ? 'Bebidas' : 'Sobremesas';
      const indicatorColorClass = currentCategory === State.CATEGORIES.PIZZA ? 'bg-secondary' : 'bg-stone-300';
      
      let gridClasses;
      // ATUALIZADO: Usando gap-10 (2.5rem) para aumentar o espaçamento entre cards
      if (currentCategory === State.CATEGORIES.PIZZA) {
        gridClasses = 'grid-cols-2 gap-10 product-cards-grid'; 
      } else {
        gridClasses = 'grid-cols-1 md-grid-cols-2 lg-grid-cols-4 gap-10 product-cards-grid'; 
      }
      
      section.innerHTML = `
        <h2 class="font-serif text-3xl font-bold text-dark mb-6 flex items-center gap-3">
          <span class="w-8 h-1 ${indicatorColorClass} rounded-full"></span>
          ${title}
        </h2>
        <div class="${gridClasses}">
        </div>
      `;
      
      const grid = section.querySelector('.product-cards-grid');
      categoryItems.forEach(item => {
        grid.appendChild(renderProductCard(item));
      });
      
      menuContent.appendChild(section);
    }
  }

  main.appendChild(heroWrapper);
  main.appendChild(menuContent);
  
  heroWrapper.querySelector('#scroll-to-menu-btn').addEventListener('click', () => {
    document.getElementById(State.CATEGORIES.PIZZA.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
    State.setSelectedCategory(State.CATEGORIES.PIZZA);
  });

  return main;
}


// --- 6. CheckoutForm ---
export function renderCheckoutForm() {
  const root = document.getElementById('root');
  const main = document.createElement('main');
  main.className = 'container mx-auto';

  let formData = {
    fullName: '', email: '', phone: '', cpf: '',
    address: { zipCode: '', street: '', number: '', neighborhood: '', complement: '' }
  };
  let errors = {};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = Utils.maskCPF(value);
    if (name === 'phone') formattedValue = Utils.maskPhone(value);
    if (name === 'zipCode') formattedValue = Utils.maskZip(value);

    // 1. Atualiza o formData
    if (name in formData.address) {
      formData.address[name] = formattedValue;
    } else {
      formData[name] = formattedValue;
    }
    
    // Clear error on change
    if (errors[name]) {
        errors[name] = '';
    }
    
    // 2. Lógica de Autocompletar CEP
    if (name === 'zipCode' && formData.address.zipCode.replace(/[^\d]/g, '').length === 8) {
        clearTimeout(window.zipTimeout);
        window.zipTimeout = setTimeout(async () => {
            const address = await Utils.fetchAddressByZipCode(formData.address.zipCode);
            if (address) {
                formData.address.street = formData.address.street || address.street;
                formData.address.neighborhood = formData.address.neighborhood || address.neighborhood;
                
                renderFormContent(main);
                
                const numberInput = main.querySelector('input[name="number"]');
                if(numberInput) numberInput.focus();
            }
        }, 300);
    }
  };
  
  const validateForm = () => {
    errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Nome é obrigatório";
    if (!formData.email.includes('@')) errors.email = "Email inválido";
    if (!Utils.isValidPhone(formData.phone)) errors.phone = "Telefone inválido";
    if (!Utils.isValidCPF(formData.cpf)) errors.cpf = "CPF inválido";
    
    // Validação de Endereço combinada
    if (formData.address.street.length < 3) errors.address = "Rua é obrigatória";
    if (formData.address.zipCode.replace(/[^\d]/g, '').length !== 8) errors.address = "CEP inválido";
    if (!formData.address.number) errors.address = "Número é obrigatório";
    if (!formData.address.neighborhood) errors.address = "Bairro é obrigatório";

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      State.setCustomerData(formData); 
      State.navigate(State.APP_VIEWS.SUCCESS);
    } else {
      renderFormContent(main);
    }
  };
  
  const renderFormContent = (container) => {
    container.innerHTML = `
      <div class="max-w-2xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button 
          id="back-to-menu-btn"
          class="flex items-center text-stone-500 hover-text-dark mb-6 transition-colors"
        >
          ${Utils.getIconSVG('ChevronLeft', 'icon-20')}
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
                ${Utils.getIconSVG('User', 'icon-20 text-primary')} Dados Pessoais
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
                ${Utils.getIconSVG('MapPin', 'icon-20 text-primary')} Entrega
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
                ${Utils.getIconSVG('CreditCard', 'icon-24')}
                Ir para Pagamento
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    container.querySelector('#back-to-menu-btn').addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
    const form = container.querySelector('#checkout-form');
    form.addEventListener('submit', handleSubmit);
    
    form.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', handleInputChange);
    });
    
    // lucide.createIcons() REMOVIDO DAQUI
  }
  
  renderFormContent(main);
  return main;
}


// --- 7. PixPayment ---
export function renderPixPayment() {
  let finalTotal = State.CartStore.cartTotal;
  let pixData = null;
  let loading = true;
  let error = null;
  let copied = false;
  
  const customerData = State.appState.customerData; 

  State.CartStore.clearCart(); 

  const main = document.createElement('main');
  main.className = 'container mx-auto';
  
  const handleCopy = async (btn) => {
    try {
      const code = pixData?.pix?.pix_qr_code;
      if (!code) throw new Error("Código PIX não disponível.");
      
      await navigator.clipboard.writeText(code);
      copied = true;
      btn.innerHTML = `${Utils.getIconSVG('Check', 'icon-18')} Copiado!`;
      btn.classList.remove('bg-stone-800', 'hover-bg-black');
      btn.classList.add('bg-green-500');
      
      setTimeout(() => {
        copied = false;
        renderContent(main); 
      }, 3000);

    } catch (err) {
      console.error('Failed to copy', err);
    }
    renderContent(main); 
  };
  
  const renderContent = (container) => {
    
    container.innerHTML = `
      <div class="max-w-xl mx-auto py-12 px-4 animate-in zoom-in-95 duration-500">
        <div class="bg-white rounded-3xl shadow-2xl p-8 text-center border-t-8 ${error ? 'border-red-500' : 'border-green-500'}">
          ${loading ? `
            <div class="flex flex-col items-center justify-center space-y-4">
                ${Utils.getIconSVG('LoaderCircle', 'icon-64 text-primary animate-spin')}
                <h2 class="text-2xl font-serif font-bold text-dark">Gerando PIX...</h2>
                <p class="text-stone-500">Aguarde enquanto processamos sua transação segura.</p>
            </div>
          ` : error ? `
            <div class="flex flex-col items-center justify-center space-y-4">
                ${Utils.getIconSVG('XCircle', 'icon-64 text-red-500')}
                <h2 class="text-2xl font-serif font-bold text-dark">Erro no Pagamento</h2>
                <p class="text-stone-500">${error}</p>
                <button 
                  id="reset-app-btn"
                  class="text-primary hover-text-dark font-medium flex items-center justify-center gap-2 mx-auto transition-colors mt-4"
                >
                  ${Utils.getIconSVG('Home', 'icon-18')}
                  Voltar para o Início
                </button>
            </div>
          ` : `
            <div class="mb-6 flex justify-center">
              <div class="bg-green-100 p-4 rounded-full">
                ${Utils.getIconSVG('CheckCircle2', 'icon-64 text-green-600')}
              </div>
            </div>
            
            <h2 class="text-3xl font-serif font-bold text-dark mb-2">Pedido Recebido!</h2>
            <p class="text-stone-500 mb-8">Agora só falta o pagamento para prepararmos sua pizza.</p>

            <div class="bg-stone-50 rounded-xl p-6 mb-8 border border-stone-100">
              <p class="text-sm font-bold text-stone-400 uppercase tracking-wider mb-1">Valor Total</p>
              <p class="font-bold text-4xl text-dark mb-6">${Utils.formatCurrency(finalTotal)}</p>

              <div class="space-y-4">
                ${pixData?.pix?.qr_code_base64 ? `
                    <div class="flex justify-center mb-4">
                        <img src="data:image/png;base64,${pixData.pix.qr_code_base64}" alt="QR Code PIX" class="w-32 h-32 border border-stone-200 p-1 rounded-lg">
                    </div>
                ` : ''}

                <div class="text-left">
                  <label class="text-xs font-semibold text-stone-500 uppercase ml-1">Pix Copia e Cola</label>
                  <div class="flex gap-2 mt-1">
                    <input 
                      readOnly 
                      value="${pixData?.pix?.pix_qr_code || ''}" 
                      id="pix-code-input"
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
                      ${copied ? Utils.getIconSVG('Check', 'icon-18') : Utils.getIconSVG('Copy', 'icon-18')}
                      ${copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
                
                <div class="text-xs text-stone-400 bg-white p-3 rounded-lg border border-dashed border-stone-300">
                  <p>1. Abra o app do seu banco</p>
                  <p>2. Escolha pagar via PIX > Copia e Cola</p>
                  <p>3. Cole o código acima e confirme</p>
                  <p class="mt-2 text-stone-500">Protocolo: ${pixData?.hash || 'N/A'}</p>
                </div>
              </div>
            </div>

            <button 
              id="reset-app-btn"
              class="text-stone-500 hover-text-primary font-medium flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              ${Utils.getIconSVG('Home', 'icon-18')}
              Voltar para o Início
            </button>
          `}
        </div>
      </div>
    `;
    
    if (!loading && !error) {
        container.querySelector('#copy-pix-btn')?.addEventListener('click', (e) => handleCopy(e.currentTarget));
    }
    container.querySelector('#reset-app-btn')?.addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
    
    if (copied) {
        const input = container.querySelector('#pix-code-input');
        if (input) {
             input.select();
             input.setSelectionRange(0, 99999);
        }
    }

    // lucide.createIcons() REMOVIDO DAQUI
  };

  const generatePix = async () => {
    renderContent(main); 

    if (finalTotal <= 0) {
        error = "O total do pedido deve ser maior que zero. Adicione itens ao carrinho.";
        loading = false;
        renderContent(main);
        return;
    }

    if (!customerData) {
        error = "Dados do cliente não foram encontrados. Volte ao Checkout e preencha o formulário.";
        loading = false;
        renderContent(main);
        return;
    }
    
    const invictusCustomerData = {
        name: customerData.fullName,
        document: customerData.cpf.replace(/\D/g, ''),
        phone_number: customerData.phone.replace(/\D/g, ''),
        email: customerData.email,
        zip_code: customerData.address.zipCode.replace(/\D/g, ''),
        number: customerData.address.number,
        street_name: customerData.address.street,
        neighborhood: customerData.address.neighborhood,
        city: "Sao Paulo", 
        state: "SP", 
    };

    const valorEmCentavos = Math.round(finalTotal * 100);

    const payload = {
        "amount": valorEmCentavos, 
        "offer_hash": State.OFFER_HASH_DEFAULT, 
        "payment_method": "pix", 
        "customer": invictusCustomerData, 
        "cart": [{
            "product_hash": State.OFFER_HASH_DEFAULT,
            "title": "Pedido Nona's Pizzeria",
            "price": valorEmCentavos,
            "quantity": 1,
            "operation_type": 1, 
            "tangible": true
        }],
        "installments": 1,
        "expire_in_days": 1,
        "transaction_origin": "api"
    };

    const result = await Utils.executeInvictusApi(payload);

    if (result.success) {
        pixData = result.data;
    } else {
        error = result.error;
    }

    loading = false;
    renderContent(main); 
  };
  
  generatePix();

  return main;
}


// --- III. INITIALIZATION ---

State.initRenderAppRef(renderApp); 

document.addEventListener('DOMContentLoaded', () => {
  State.CartStore.init(); 
  renderApp();      
});
