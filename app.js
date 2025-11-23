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
  if (onlyCartUpdate) return;
  
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
}

// --- II. COMPONENTS LOGIC ---

// --- 1. Product Card ---
export function renderProductCard(product) {
  const card = document.createElement('div');
  card.className = 'bg-white rounded-xl shadow-lg overflow-hidden transition-all hover-shadow-xl hover-scale-105 zoom-in duration-300';
  
  const isPizza = product.category === State.CATEGORIES.PIZZA;
  const priceDisplay = isPizza 
    ? Utils.formatCurrency(product.priceModifiers[State.PIZZA_SIZES.M]) + ' (M)' 
    : Utils.formatCurrency(product.basePrice);

  let sizeOptionsHTML = '';
  if (isPizza) {
    sizeOptionsHTML = `
      <div class="flex items-center mt-3 mb-4 gap-2 text-sm font-medium">
        <span class="text-stone-500">Tamanho:</span>
        <select id="size-select-${product.id}" class="select-base text-sm py-1 pl-2 pr-8 border border-stone-300 rounded-md bg-stone-50 cursor-pointer">
          <option value="${State.PIZZA_SIZES.M}" data-price="${product.priceModifiers[State.PIZZA_SIZES.M]}">M - ${Utils.formatCurrency(product.priceModifiers[State.PIZZA_SIZES.M])}</option>
          <option value="${State.PIZZA_SIZES.G}" data-price="${product.priceModifiers[State.PIZZA_SIZES.G]}">G - ${Utils.formatCurrency(product.priceModifiers[State.PIZZA_SIZES.G])}</option>
          <option value="${State.PIZZA_SIZES.F}" data-price="${product.priceModifiers[State.PIZZA_SIZES.F]}">Família - ${Utils.formatCurrency(product.priceModifiers[State.PIZZA_SIZES.F])}</option>
        </select>
      </div>
    `;
  }
  
  card.innerHTML = `
    <img src="${product.imageUrl}" alt="${product.name}" class="w-full h-48 object-cover">
    <div class="p-4 flex flex-col flex-grow">
      <h3 class="text-xl font-bold mb-2">${product.name}</h3>
      <p class="text-sm text-stone-600 mb-3 flex-grow">${product.description}</p>
      
      ${sizeOptionsHTML}

      <div class="flex items-center justify-between mt-auto pt-2">
        <span id="price-display-${product.id}" class="text-2xl font-bold text-dark">${priceDisplay}</span>
        <button 
          id="add-to-cart-btn-${product.id}"
          class="btn btn-primary text-sm py-2 px-4 rounded-full flex items-center gap-1 leading-none"
          data-product-id="${product.id}"
        >
          ${Utils.getIconSVG('plus', 'icon-18')}
          Adicionar
        </button>
      </div>
    </div>
  `;
  
  const addButton = card.querySelector(`#add-to-cart-btn-${product.id}`);
  const priceDisplayEl = card.querySelector(`#price-display-${product.id}`);
  
  addButton.addEventListener('click', () => {
    let size = null;
    if (isPizza) {
      const select = card.querySelector(`#size-select-${product.id}`);
      size = select.value;
    }
    State.CartStore.addItem(product, size);
  });
  
  if (isPizza) {
    const select = card.querySelector(`#size-select-${product.id}`);
    select.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const newPrice = selectedOption.getAttribute('data-price');
      priceDisplayEl.textContent = Utils.formatCurrency(parseFloat(newPrice));
    });
  }

  return card;
}

// --- 2. Header ---
export function renderHeader() {
  const root = document.getElementById('root');
  let header = root.querySelector('header');
  
  if (!header) {
    header = document.createElement('header');
    header.className = 'sticky top-0 z-40 bg-white shadow-md border-b border-stone-100 animate-in fade-in duration-300';
    root.prepend(header); 
  }

  const { totalItems } = State.CartStore.getCartSummary();
  
  header.innerHTML = `
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <div id="logo" class="flex items-center cursor-pointer">
        <img src="pizza-icon-32x32.png" alt="Nona's Pizzeria Logo" class="h-8 w-8 mr-2"/>
        <h1 class="font-serif text-2xl font-bold text-dark">Nona's Pizzeria</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <div id="category-selector" class="flex items-center bg-stone-100 rounded-full p-1 text-sm font-medium">
          ${Object.values(State.CATEGORIES).map(category => `
            <button 
              class="category-btn px-4 py-2 rounded-full transition-all ${State.appState.selectedCategory === category ? 'bg-primary text-white shadow-md' : 'text-stone-600 hover-text-primary'}"
              data-category="${category}"
            >
              ${category}
            </button>
          `).join('')}
        </div>

        <button 
          id="toggle-cart-btn" 
          class="btn btn-outline btn-icon-square relative"
          aria-label="Abrir carrinho de compras"
        >
          ${Utils.getIconSVG('shopping-cart', 'icon-20')}
          ${totalItems > 0 ? `<span class="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-secondary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">${totalItems}</span>` : ''}
        </button>
      </div>
    </div>
  `;
  
  header.querySelector('#logo').addEventListener('click', () => {
    State.setView(State.APP_VIEWS.MENU);
  });

  header.querySelector('#toggle-cart-btn').addEventListener('click', () => {
    State.toggleCart();
  });
  
  header.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const category = e.currentTarget.getAttribute('data-category');
      State.setSelectedCategory(category);
    });
  });
}

// --- 3. Cart Drawer ---
export function renderCartDrawer() {
  const root = document.getElementById('root');
  let drawer = root.querySelector('#cart-drawer');
  const { items, finalTotal, totalItems } = State.CartStore.getCartSummary();
  const isCartOpen = State.appState.isCartOpen;
  
  if (!drawer) {
    drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    root.appendChild(drawer);
  }
  
  drawer.className = `fixed inset-0 z-50 flex justify-end transition-all ${isCartOpen ? 'pointer-events-auto' : 'pointer-events-none'}`;
  
  // Overlay
  const overlay = `<div id="cart-overlay" class="absolute inset-0 bg-dark transition-opacity duration-300 ${isCartOpen ? 'opacity-50' : 'opacity-0'}"></div>`;
  
  // Drawer Content
  const cartItemsHTML = items.length === 0 
    ? `<div class="p-4 text-center text-stone-500 flex flex-col items-center justify-center flex-grow">
          ${Utils.getIconSVG('pizza', 'icon-48 mb-3 text-stone-300')}
          <p class="text-lg font-medium">Seu carrinho está vazio.</p>
          <p class="text-sm">Que tal começar com uma Calabresa?</p>
       </div>`
    : items.map(item => `
        <div class="flex items-center bg-stone-50 p-3 rounded-lg shadow-sm animate-in slide-in-from-bottom-4 zoom-in duration-300">
          <div class="flex-grow">
            <p class="font-medium text-dark">${item.product.name} ${item.size ? `(${item.size})` : ''}</p>
            <p class="text-sm text-stone-500">${Utils.formatCurrency(item.totalPrice / item.quantity)} x ${item.quantity}</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-stretch border border-stone-300 rounded-md overflow-hidden">
                <button 
                  class="update-qty-btn p-1 bg-white hover-bg-stone-100 transition-all border-r border-stone-300 disabled:opacity-50" 
                  data-cart-id="${item.cartId}" 
                  data-delta="-1"
                  ${item.quantity <= 1 ? 'disabled' : ''}
                >
                  ${Utils.getIconSVG('minus', 'icon-18 text-dark')}
                </button>
                <span class="px-3 flex items-center text-dark font-medium bg-white">${item.quantity}</span>
                <button 
                  class="update-qty-btn p-1 bg-white hover-bg-stone-100 transition-all border-l border-stone-300" 
                  data-cart-id="${item.cartId}" 
                  data-delta="1"
                >
                  ${Utils.getIconSVG('plus', 'icon-18 text-dark')}
                </button>
            </div>
            <button 
                class="remove-item-btn p-1 text-red-600 hover-bg-red-50 rounded-full transition-all" 
                data-cart-id="${item.cartId}" 
                aria-label="Remover item"
            >
              ${Utils.getIconSVG('trash-2', 'icon-18')}
            </button>
          </div>
        </div>
      `).join('');
  
  const drawerContentHTML = `
    <div id="cart-content-container" class="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col ${isCartOpen ? 'animate-in slide-in-from-right duration-300' : ''}">
      
      <div class="p-4 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <h2 class="font-serif text-2xl font-bold">Seu Pedido (${totalItems})</h2>
        <button id="close-cart-btn" class="text-stone-500 hover-text-dark transition-all" aria-label="Fechar carrinho">
          ${Utils.getIconSVG('x', 'icon-24')}
        </button>
      </div>
      
      <div class="flex-grow overflow-y-auto p-4 space-y-3">
        ${cartItemsHTML}
      </div>
      
      <div class="p-4 border-t border-stone-100 sticky bottom-0 bg-white shadow-xl">
        <div class="flex justify-between items-center mb-3 text-lg font-bold">
          <span>Total:</span>
          <span class="text-primary">${Utils.formatCurrency(finalTotal)}</span>
        </div>
        <button 
          id="checkout-btn" 
          class="btn btn-primary w-full text-lg ${items.length === 0 ? 'btn-disabled' : ''}"
          ${items.length === 0 ? 'disabled' : ''}
        >
          Finalizar Pedido
        </button>
      </div>
    </div>
  `;
  
  drawer.innerHTML = isCartOpen ? overlay + drawerContentHTML : '';
  
  if (isCartOpen) {
    // Adiciona Listeners
    drawer.querySelector('#cart-overlay').addEventListener('click', State.toggleCart);
    drawer.querySelector('#close-cart-btn').addEventListener('click', State.toggleCart);
    
    drawer.querySelectorAll('.remove-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cartId = e.currentTarget.getAttribute('data-cart-id');
        State.CartStore.removeItem(cartId);
      });
    });
    
    drawer.querySelectorAll('.update-qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cartId = e.currentTarget.getAttribute('data-cart-id');
        const delta = parseInt(e.currentTarget.getAttribute('data-delta'));
        State.CartStore.updateQuantity(cartId, delta);
      });
    });
    
    const checkoutBtn = drawer.querySelector('#checkout-btn');
    if (checkoutBtn && !checkoutBtn.disabled) {
      checkoutBtn.addEventListener('click', () => {
        State.setView(State.APP_VIEWS.CHECKOUT);
        State.toggleCart(false);
      });
    }
  }
}

// --- 4. Review Section (Compartilhada entre views) ---
export function renderReviewsSection() {
    const section = document.createElement('section');
    section.id = 'reviews-section';
    section.className = 'bg-stone-100 py-12';
    
    const reviews = State.CUSTOMER_REVIEWS;

    const reviewCardsHTML = reviews.map(review => {
        const ratingIcons = Array(review.rating).fill(0).map(() => 
            Utils.getIconSVG('star', 'icon-16 fill-secondary text-secondary')
        ).join('');

        return `
            <div class="bg-white p-6 rounded-xl shadow-md space-y-3 zoom-in duration-500">
                <div class="flex justify-between items-center">
                    <div class="flex items-center">
                        <span class="font-bold text-lg mr-1">${review.rating}.0</span>
                        <div class="flex">
                            ${ratingIcons}
                        </div>
                    </div>
                    <span class="text-sm text-stone-500">${Utils.formatDate(review.date)}</span>
                </div>
                <p class="font-serif text-xl font-semibold text-dark">${review.title}</p>
                <p class="text-stone-600 italic">"${review.comment}"</p>
                <div class="pt-2 border-t border-stone-100 mt-auto">
                    <p class="text-sm font-medium text-dark">${review.customerName}</p>
                    <p class="text-xs text-stone-500">Cliente Verificado</p>
                </div>
            </div>
        `;
    }).join('');

    section.innerHTML = `
        <div class="container mx-auto px-4 space-y-8">
            <h2 class="font-serif text-3xl font-bold text-dark text-center">O que nossos clientes dizem</h2>
            <div class="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-4 gap-6">
                ${reviewCardsHTML}
            </div>
        </div>
    `;

    return section;
}

// --- 5. Menu ---
export function renderMenu() {
  const main = document.createElement('main');
  main.className = 'py-8 space-y-12'; 

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
  menuContent.className = 'container mx-auto px-4 space-y-12'; 
  
  // Renderiza APENAS a seção da categoria selecionada
  const categoryItems = State.MENU_ITEMS.filter(i => i.category === currentCategory);
    
  if (categoryItems.length > 0) {
    const section = document.createElement('section');
    section.id = currentCategory.toLowerCase();
    section.className = 'animate-in fade-in duration-300 scroll-mt-24'; 
    
    const title = currentCategory === State.CATEGORIES.PIZZA ? 'Pizzas Especiais' : 
                  currentCategory === State.CATEGORIES.DRINK ? 'Bebidas' : 'Sobremesas';
    const indicatorColorClass = currentCategory === State.CATEGORIES.PIZZA ? 'bg-secondary' : 'bg-stone-300';
    
    let gridClasses;
    // ALTERADO: Substituído gap-6 por gap-8 (2rem)
    if (currentCategory === State.CATEGORIES.PIZZA) {
      gridClasses = 'grid-cols-2 gap-8 product-cards-grid'; 
    } else {
      // ALTERADO: Substituído gap-6 por gap-8 (2rem)
      gridClasses = 'grid-cols-1 md-grid-cols-2 lg-grid-cols-4 gap-8 product-cards-grid';
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

  main.appendChild(heroWrapper);
  main.appendChild(menuContent);
  
  // 3. Adiciona a Seção de Avaliações
  main.appendChild(renderReviewsSection()); 

  heroWrapper.querySelector('#scroll-to-menu-btn').addEventListener('click', () => {
    document.getElementById(State.CATEGORIES.PIZZA.toLowerCase())?.scrollIntoView({ behavior: 'smooth' });
    State.setSelectedCategory(State.CATEGORIES.PIZZA);
  });

  return main;
}

// --- 6. Checkout Form ---
let customerData = State.loadCustomerData();
let validationErrors = {};
let isSubmitting = false;

function validateForm() {
    validationErrors = {};
    const data = customerData;
    
    // Simple validation (can be expanded)
    if (!data.fullName || data.fullName.length < 3) validationErrors.fullName = 'Nome completo é obrigatório.';
    if (!data.phone || data.phone.length < 14) validationErrors.phone = 'Telefone inválido (mín. 11 dígitos).';
    if (!data.email || !data.email.includes('@')) validationErrors.email = 'Email inválido.';
    if (!data.address.street || data.address.street.length < 3) validationErrors.street = 'Rua é obrigatória.';
    if (!data.address.number) validationErrors.number = 'Número é obrigatório.';
    if (!data.address.neighborhood || data.address.neighborhood.length < 3) validationErrors.neighborhood = 'Bairro é obrigatório.';
    if (!data.address.zipCode || data.address.zipCode.length < 9) validationErrors.zipCode = 'CEP inválido.';
    
    return Object.keys(validationErrors).length === 0;
}

export function renderCheckoutForm() {
  const main = document.createElement('main');
  main.className = 'py-8 container mx-auto px-4 max-w-lg space-y-8 animate-in fade-in duration-300'; 
  
  if (isSubmitting) {
    main.innerHTML = `
        <h2 class="font-serif text-3xl font-bold text-center mb-6">Processando Pedido...</h2>
        <div class="flex justify-center items-center h-48">
            <p class="text-xl text-stone-500">Aguarde, gerando pagamento PIX...</p>
        </div>
    `;
    return main;
  }
  
  const { finalTotal, totalItems } = State.CartStore.getCartSummary();

  const errors = Object.values(validationErrors).map(msg => 
    `<li class="text-red-600 text-sm">${Utils.getIconSVG('x-circle', 'icon-14 inline-block mr-1')} ${msg}</li>`
  ).join('');

  const formHTML = `
    <h2 class="font-serif text-3xl font-bold text-center mb-6">Finalizar Pedido</h2>
    <div class="bg-white p-6 rounded-xl shadow-lg space-y-6">
        
        <div class="border-b pb-4">
            <p class="text-lg font-bold text-dark mb-2">Seu Pedido (${totalItems} itens)</p>
            <div class="flex justify-between font-medium text-xl">
                <span>Total a Pagar:</span>
                <span class="text-primary">${Utils.formatCurrency(finalTotal)}</span>
            </div>
        </div>

        ${errors ? `<ul class="bg-red-50 p-3 rounded-md border border-red-600 space-y-1">${errors}</ul>` : ''}

        <form id="checkout-form" class="space-y-4">
            <h3 class="font-serif text-xl font-bold text-dark">1. Seus Dados</h3>
            <input type="text" id="fullName" class="input-base" placeholder="Nome Completo" value="${customerData.fullName || ''}" required>
            <input type="email" id="email" class="input-base" placeholder="Email" value="${customerData.email || ''}" required>
            <input type="tel" id="phone" class="input-base" placeholder="Telefone (ex: (11) 98765-4321)" value="${customerData.phone || ''}" required maxlength="15">
            <input type="text" id="cpf" class="input-base" placeholder="CPF (Opcional, para a nota)" value="${customerData.cpf || ''}" maxlength="14">

            <h3 class="font-serif text-xl font-bold text-dark pt-4">2. Endereço de Entrega</h3>
            <input type="text" id="zipCode" class="input-base" placeholder="CEP" value="${customerData.address.zipCode || ''}" required maxlength="9">
            <input type="text" id="street" class="input-base" placeholder="Rua / Avenida" value="${customerData.address.street || ''}" required>
            <div class="grid grid-cols-2 gap-4">
                <input type="text" id="number" class="input-base" placeholder="Número" value="${customerData.address.number || ''}" required>
                <input type="text" id="neighborhood" class="input-base" placeholder="Bairro" value="${customerData.address.neighborhood || ''}" required>
            </div>
            <input type="text" id="complement" class="input-base" placeholder="Complemento (ex: Apt 101)" value="${customerData.address.complement || ''}">
            
            <h3 class="font-serif text-xl font-bold text-dark pt-4">3. Pagamento</h3>
            <div class="flex items-center p-3 border border-primary rounded-lg bg-red-50">
                <input type="radio" id="payment-pix" name="payment" value="pix" checked class="h-5 w-5 text-primary focus-ring">
                <label for="payment-pix" class="ml-3 font-medium text-dark flex items-center">
                    ${Utils.getIconSVG('zap', 'icon-20 text-green-600 mr-2')}
                    PIX (Pagamento Instantâneo)
                </label>
            </div>
            
            <p class="text-sm text-stone-500 pt-2">Ao clicar em "Pagar com PIX", o QR Code será gerado na próxima tela.</p>

            <button type="submit" class="btn btn-secondary w-full text-lg mt-6">
                Pagar com PIX ${Utils.formatCurrency(finalTotal)}
            </button>
        </form>
        
        <button id="back-to-menu-btn" class="text-sm text-stone-500 hover-text-dark transition-all w-full mt-4">
            ← Voltar ao Cardápio
        </button>
    </div>
  `;
  
  main.innerHTML = formHTML;

  // Event Listeners for input changes
  const updateData = (id, value) => {
    if (id in customerData) {
        customerData[id] = value;
    } else if (id in customerData.address) {
        customerData.address[id] = value;
    }
    State.saveCustomerData(customerData);
    // Clear error for the field being updated
    delete validationErrors[id];
  };

  main.querySelector('#fullName').addEventListener('input', (e) => updateData('fullName', e.target.value));
  main.querySelector('#email').addEventListener('input', (e) => updateData('email', e.target.value));
  main.querySelector('#phone').addEventListener('input', (e) => updateData('phone', Utils.maskPhone(e.target.value)));
  main.querySelector('#cpf').addEventListener('input', (e) => updateData('cpf', Utils.maskCPF(e.target.value)));
  main.querySelector('#zipCode').addEventListener('input', (e) => updateData('zipCode', Utils.maskZipCode(e.target.value)));
  main.querySelector('#street').addEventListener('input', (e) => updateData('street', e.target.value));
  main.querySelector('#number').addEventListener('input', (e) => updateData('number', e.target.value));
  main.querySelector('#neighborhood').addEventListener('input', (e) => updateData('neighborhood', e.target.value));
  main.querySelector('#complement').addEventListener('input', (e) => updateData('complement', e.target.value));

  main.querySelector('#back-to-menu-btn').addEventListener('click', () => {
    State.setView(State.APP_VIEWS.MENU);
  });
  
  // Form Submission
  main.querySelector('#checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (validateForm()) {
        isSubmitting = true;
        renderApp(); // Rerender for Loading State

        const finalTotal = State.CartStore.getCartSummary().finalTotal;
        const result = await Utils.executeInvictusApi(customerData, finalTotal);

        if (result.success) {
            State.setPixData(result.data);
            State.CartStore.clearCart(); 
            State.setView(State.APP_VIEWS.SUCCESS);
        } else {
            console.error("Erro no PIX:", result.error);
            alert(`Erro ao processar pagamento: ${result.error}`);
            isSubmitting = false;
            renderApp(); // Rerender to show form again
        }
    } else {
        renderApp(false); // Rerender to display errors
    }
  });

  return main;
}

// --- 7. Pix Payment Success View ---
let pixData = null; 
let error = null;
let loading = false;

export function renderPixPayment() {
  const main = document.createElement('main');
  main.className = 'py-8 container mx-auto px-4 max-w-lg space-y-8 animate-in zoom-in duration-500'; 
  
  if (!State.appState.pixData && !pixData) {
      // Caso o usuário tente acessar a URL diretamente ou recarregue
      main.innerHTML = `<div class="text-center p-8"><p class="text-xl text-red-600">Nenhum pagamento PIX ativo encontrado.</p><button id="return-menu" class="btn btn-primary mt-4">Voltar ao Cardápio</button></div>`;
      main.querySelector('#return-menu')?.addEventListener('click', () => State.setView(State.APP_VIEWS.MENU));
      return main;
  }
  
  const currentPixData = State.appState.pixData || pixData;
  const pixCode = currentPixData.pix.pix_qr_code.content;
  const qrCodeBase64 = currentPixData.pix.pix_qr_code.base64_image;
  const finalTotal = currentPixData.amount / 100;
  
  main.innerHTML = `
    <div class="bg-white p-8 rounded-xl shadow-2xl text-center space-y-6">
        ${Utils.getIconSVG('check-circle', 'icon-64 text-green-600 mx-auto')}
        <h2 class="font-serif text-3xl font-bold text-dark">Pedido Enviado com Sucesso!</h2>
        <p class="text-lg text-stone-600">Seu pedido foi registrado. Agora, finalize o pagamento abaixo para iniciarmos a produção da sua pizza.</p>
        
        <div class="p-4 bg-stone-50 rounded-lg space-y-3 border border-stone-200">
            <p class="text-xl font-bold text-primary">Total: ${Utils.formatCurrency(finalTotal)}</p>
            <div class="flex justify-center">
                <img src="data:image/png;base64,${qrCodeBase64}" alt="QR Code PIX" class="w-48 h-48 border border-stone-300 rounded-lg shadow-md">
            </div>
            
            <p class="font-medium text-dark pt-2">Pague usando o QR Code acima ou copie o código PIX:</p>
            <div class="relative">
                <input type="text" id="pix-copy-code" class="input-base text-center text-sm font-mono pr-12" value="${pixCode}" readonly>
                <button id="copy-pix-btn" class="absolute right-0 top-0 h-full p-2 text-stone-500 hover-text-primary transition-all" aria-label="Copiar código PIX">
                    ${Utils.getIconSVG('copy', 'icon-20')}
                </button>
            </div>
            <p class="text-xs text-stone-500">Validade: 24 horas</p>
        </div>
        
        <p class="text-sm text-stone-600">A confirmação do pagamento é instantânea.</p>

        <button id="return-to-menu-btn" class="btn btn-primary w-full mt-4">
            Voltar ao Cardápio
        </button>
    </div>
  `;
  
  main.querySelector('#copy-pix-btn').addEventListener('click', (e) => {
    const copyText = main.querySelector('#pix-copy-code');
    copyText.select();
    document.execCommand('copy');
    
    // Feedback visual
    const iconContainer = e.currentTarget;
    iconContainer.innerHTML = Utils.getIconSVG('check', 'icon-20 text-green-600');
    setTimeout(() => {
        iconContainer.innerHTML = Utils.getIconSVG('copy', 'icon-20');
    }, 2000);
  });
  
  main.querySelector('#return-to-menu-btn').addEventListener('click', () => {
    State.setView(State.APP_VIEWS.MENU);
    State.setPixData(null); // Clear PIX data after navigating away
  });

  return main;
}


// --- III. INITIALIZATION ---

// Inicializa a aplicação após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
    // Carrega o estado do carrinho do localStorage e renderiza
    State.CartStore.init(renderApp);
    
    // Renderiza a aplicação principal
    renderApp();
});
