// app.js
import * as State from './state.js';
import * as Utils from './utils.js';
import * as Tracking from './tracking.js';

// --- I. CORE CONTROLLER LOGIC ---

export function renderApp(onlyCartUpdate = false) {
  updateHeaderUI();
  updateCartUI();
  renderFooter(); 

  if (onlyCartUpdate) return;
  
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = ''; 
  
  let newContent;
  switch (State.appState.currentView) {
    case State.APP_VIEWS.CHECKOUT:
      newContent = renderCustomerForm('CHECKOUT');
      break;
    case State.APP_VIEWS.SUCCESS:
      newContent = renderPixPayment();
      break;
    case State.APP_VIEWS.PROFILE:
      newContent = renderProfileRouter();
      break;
    case State.APP_VIEWS.FAQ:
      newContent = renderFAQ();
      break;
    case State.APP_VIEWS.CONTACT:
      newContent = renderContact();
      break;
    case State.APP_VIEWS.MENU:
    default:
      newContent = renderMenu();
      break;
  }
  
  mainContent.appendChild(newContent);
  
  const categoryNav = document.getElementById('category-nav-container');
  const promoBar = document.querySelector('.promo-bar');
  
  if (State.appState.currentView === State.APP_VIEWS.MENU) {
      if(categoryNav) categoryNav.classList.remove('hidden');
      if(promoBar) promoBar.classList.remove('hidden');
  } else {
      if(categoryNav) categoryNav.classList.add('hidden');
      if(promoBar) promoBar.classList.add('hidden'); 
  }
}

// --- II. NAVIGATION COMPONENTS ---

function renderFooter() {
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

// --- III. VIEW ROUTERS & RENDERERS ---

function renderProfileRouter() {
    if (State.appState.lastOrder) {
        return Tracking.renderProfileView();
    }
    
    const container = document.createElement('div');
    container.innerHTML = `
        <div class="profile-header-simple">
            <h2 class="text-2xl font-serif font-bold">Meu Perfil</h2>
            <p class="text-sm text-stone-500">Mantenha seus dados atualizados para agilizar seus pedidos.</p>
        </div>
    `;
    container.appendChild(renderCustomerForm('PROFILE'));
    return container;
}

function renderCustomerForm(mode = 'CHECKOUT') {
    const isCheckout = mode === 'CHECKOUT';
    const container = document.createElement('div');
    container.className = "form-container animate-in";
    
    const savedData = State.getUserProfile() || {};
    
    let formData = { 
        fullName: savedData.fullName || '', 
        email: savedData.email || '', 
        phone: savedData.phone || '', 
        cpf: savedData.cpf || '', 
        address: savedData.address || { zipCode: '', street: '', number: '', neighborhood: '', complement: '' }
    };
    
    let errors = {};

    const render = () => {
        container.innerHTML = `
            <div class="form-card">
                ${isCheckout ? `
                <div class="form-header">
                    <h2 class="text-2xl font-serif font-bold">Finalizar Pedido</h2>
                </div>` : ''}
                
                <form id="customer-form" class="form-body">
                    <section>
                        <h3 class="form-section-title">${Utils.getIcon('User', 'icon-20 text-primary')} Dados Pessoais</h3>
                        <div class="form-grid form-grid-2">
                            <div class="input-group col-span-2">
                                <label>Nome Completo</label>
                                <input type="text" name="fullName" value="${formData.fullName}" class="input-field ${errors.fullName ? 'error' : ''}" placeholder="João Silva">
                                ${errors.fullName ? `<span class="error-msg">${errors.fullName}</span>` : ''}
                            </div>
                            <div class="input-group">
                                <label>CPF</label>
                                <input type="text" name="cpf" value="${formData.cpf}" class="input-field ${errors.cpf ? 'error' : ''}" placeholder="000.000.000-00" maxlength="14">
                                ${errors.cpf ? `<span class="error-msg">${errors.cpf}</span>` : ''}
                            </div>
                            <div class="input-group">
                                <label>Telefone</label>
                                <input type="tel" name="phone" value="${formData.phone}" class="input-field ${errors.phone ? 'error' : ''}" placeholder="(11) 99999-9999" maxlength="15">
                                ${errors.phone ? `<span class="error-msg">${errors.phone}</span>` : ''}
                            </div>
                             <div class="input-group col-span-2">
                                <label>Email</label>
                                <input type="email" name="email" value="${formData.email}" class="input-field ${errors.email ? 'error' : ''}">
                                ${errors.email ? `<span class="error-msg">${errors.email}</span>` : ''}
                            </div>
                        </div>
                    </section>
                    
                    <section>
                        <h3 class="form-section-title">${Utils.getIcon('MapPin', 'icon-20 text-primary')} Endereço de Entrega</h3>
                        <div class="form-grid form-grid-4">
                            <div class="input-group">
                                <label>CEP</label>
                                <input type="text" name="zipCode" value="${formData.address.zipCode}" class="input-field" maxlength="9">
                            </div>
                            <div class="input-group col-span-3">
                                <label>Rua</label>
                                <input type="text" name="street" value="${formData.address.street}" class="input-field ${errors.address ? 'error' : ''}">
                            </div>
                            <div class="input-group">
                                <label>Número</label>
                                <input type="text" name="number" value="${formData.address.number}" class="input-field ${errors.address ? 'error' : ''}">
                            </div>
                            <div class="input-group col-span-2">
                                <label>Bairro</label>
                                <input type="text" name="neighborhood" value="${formData.address.neighborhood}" class="input-field ${errors.address ? 'error' : ''}">
                            </div>
                             <div class="input-group">
                                <label>Comp.</label>
                                <input type="text" name="complement" value="${formData.address.complement}" class="input-field">
                            </div>
                             ${errors.address ? `<div class="col-span-4 error-msg">${errors.address}</div>` : ''}
                        </div>
                    </section>

                    <button type="submit" class="btn-primary btn-full text-lg">
                        ${isCheckout 
                            ? `${Utils.getIcon('CreditCard', 'icon-20 text-white')} Ir para Pagamento` 
                            : `${Utils.getIcon('Save', 'icon-20 text-white')} Salvar Alterações`
                        }
                    </button>
                </form>
            </div>
        `;
        
        const form = container.querySelector('#customer-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            errors = {};
            if(!formData.fullName) errors.fullName = "Obrigatório";
            if(!Utils.isValidCPF(formData.cpf)) errors.cpf = "Inválido";
            if(!Utils.isValidPhone(formData.phone)) errors.phone = "Inválido";
            if(!formData.email.includes('@')) errors.email = "Inválido";
            if(!formData.address.street || !formData.address.number || !formData.address.neighborhood) errors.address = "Endereço incompleto";

            if (Object.keys(errors).length === 0) {
                State.saveUserProfile(formData);

                if (isCheckout) {
                    State.setCustomerData(formData);
                    State.navigate(State.APP_VIEWS.SUCCESS);
                } 
            } else {
                render(); 
            }
        });

        form.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', (e) => {
                const { name, value } = e.target;
                if(name in formData.address) formData.address[name] = value;
                else formData[name] = value;
                
                if(name === 'cpf') formData.cpf = Utils.maskCPF(value);
                if(name === 'phone') formData.phone = Utils.maskPhone(value);
                if(name === 'zipCode') {
                    formData.address.zipCode = Utils.maskZip(value);
                    if(formData.address.zipCode.replace(/\D/g,'').length === 8) {
                        Utils.fetchAddressByZipCode(formData.address.zipCode).then(addr => {
                            if(addr) {
                                formData.address = { ...formData.address, ...addr };
                                render();
                            }
                        });
                    }
                }
            });
        });
    }

    render();
    return container;
}

function renderFAQ() {
    const div = document.createElement('div');
    div.className = "container py-8 animate-in";
    div.innerHTML = `
        <h2 class="section-title">Perguntas Frequentes</h2>
        <div class="faq-list">
            <details class="faq-item">
                <summary>Quanto tempo demora a entrega?</summary>
                <p>Nossas entregas levam em média 30 a 50 minutos dependendo da região.</p>
            </details>
            <details class="faq-item">
                <summary>Aceitam Vale Refeição?</summary>
                <p>No momento aceitamos apenas PIX para pedidos online com descontos exclusivos.</p>
            </details>
            <details class="faq-item">
                <summary>Qual a área de entrega?</summary>
                <p>Atendemos um raio de 8km a partir do centro da cidade.</p>
            </details>
        </div>
    `;
    return div;
}

function renderContact() {
    const div = document.createElement('div');
    div.className = "container py-8 animate-in text-center";
    div.innerHTML = `
        <h2 class="section-title justify-center">Fale Conosco</h2>
        <div class="bg-white p-6 rounded-xl shadow-lg inline-block mt-4 border border-gray-200">
            <p class="mb-4">Dúvidas, elogios ou reclamações?</p>
            <a href="#" class="btn-primary btn-full bg-green-500 hover:bg-green-600">
                ${Utils.getIcon('Phone', 'text-white')} (11) 99999-9999
            </a>
            <p class="text-sm text-stone-500 mt-4">Atendimento das 18h às 23h</p>
        </div>
    `;
    return div;
}

function renderProductCard(product) {
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

function renderMenu() {
  const container = document.createElement('div');
  const currentCategory = State.appState.selectedCategory;

  const heroHTML = `
    <div class="hero-wrapper">
        <img src="assets/hero-pizza.jpg" alt="Hero" class="hero-img" />
        <div class="hero-content">
            <h1 class="hero-title">A Verdadeira Pizza <br/><span style="color: var(--color-primary)">Artesanal</span></h1>
            <p class="hero-text">Ingredientes selecionados, massa de fermentação natural e forno a lenha.</p>
            <button id="hero-cta" class="btn-primary">Ver Cardápio</button>
        </div>
    </div>
  `;
  container.innerHTML = heroHTML;

  const menuSection = document.createElement('div');
  
  if (currentCategory === State.CATEGORIES.REVIEW) {
      menuSection.appendChild(renderReviewsSection());
  } else {
      const categoryItems = State.MENU_ITEMS.filter(i => i.category === currentCategory);
      if (categoryItems.length > 0) {
          const sectionTitle = document.createElement('h2');
          sectionTitle.className = "section-title";
          const indicatorClass = currentCategory === State.CATEGORIES.PIZZA ? 'bg-indicator-pizza' : 'bg-indicator-default';
          sectionTitle.innerHTML = `<span class="section-indicator ${indicatorClass}"></span> ${currentCategory === State.CATEGORIES.PIZZA ? 'Pizzas Especiais' : 'Nossa Seleção'}`;
          
          const grid = document.createElement('div');
          grid.className = `products-grid ${currentCategory === State.CATEGORIES.PIZZA ? 'pizza-grid' : ''}`;
          
          categoryItems.forEach(item => grid.appendChild(renderProductCard(item)));
          
          menuSection.appendChild(sectionTitle);
          menuSection.appendChild(grid);
      }
  }

  container.appendChild(menuSection);
  container.querySelector('#hero-cta')?.addEventListener('click', () => menuSection.scrollIntoView({ behavior: 'smooth' }));

  return container;
}

function renderReviewsSection() {
    const REVIEWS = [
        { id: 1, author: "Matheus Freitas", rating: 5, date: "2024-03-20", text: "Café da manhã excelente! Pão de queijo muito bom." },
        { id: 2, author: "José Alberto", rating: 5, date: "2024-03-18", text: "Atendimento com excelência. Recomendo o salmão." },
        { id: 7, author: "Pizzaria Boa Sorte", rating: null, date: "2024-03-12", text: "Obrigado! 👏👏👏", isOwner: true }
    ];

    const section = document.createElement('div');
    section.className = "reviews-container";
    section.innerHTML = `
        <h2 class="section-title"><span class="section-indicator bg-indicator-pizza"></span> O que dizem nossos clientes</h2>
        <div>
            ${REVIEWS.map(r => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="review-avatar" style="${r.isOwner ? 'background: var(--color-primary); color: white' : ''}">
                            ${r.isOwner ? Utils.getIcon('Pizza', 'icon-20') : r.author.charAt(0)}
                        </div>
                        <div>
                            <p class="font-bold">${r.author}</p>
                            <div class="review-meta">
                                ${r.rating ? Array(r.rating).fill(Utils.getIcon('StarFill', 'icon-14 text-yellow')).join('') : ''}
                                <span>${Utils.formatDate(r.date)}</span>
                            </div>
                        </div>
                    </div>
                    <p class="review-text">${r.text}</p>
                </div>
            `).join('')}
        </div>
    `;
    return section;
}

function renderPixPayment() {
    const container = document.createElement('div');
    container.className = "pix-container animate-in";
    const total = State.CartStore.cartTotal;
    const customer = State.appState.customerData;

    if(total > 0 && customer) {
        State.confirmOrder(total);
    }
    
    const renderState = (state, data = null) => {
        if (state === 'LOADING') {
             container.innerHTML = `
                <div class="pix-card">
                    ${Utils.getIcon('LoaderCircle', 'icon-64 text-primary fa-spin')}
                    <h2 class="text-xl font-bold mt-4">Gerando PIX...</h2>
                </div>
             `;
        } else if (state === 'ERROR') {
             container.innerHTML = `
                <div class="pix-card error">
                    ${Utils.getIcon('XCircle', 'icon-64 text-red')}
                    <h2 class="text-xl font-bold mt-4">Erro no Pedido</h2>
                    <p class="text-stone-500 mb-4">${data}</p>
                    <button id="retry-home" class="btn-secondary mx-auto">Voltar ao Início</button>
                </div>
             `;
             container.querySelector('#retry-home')?.addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
        } else {
             container.innerHTML = `
                <div class="pix-card">
                    ${Utils.getIcon('CheckCircle2', 'icon-64 text-green')}
                    <h2 class="text-2xl font-serif font-bold mt-2">Pedido Recebido!</h2>
                    <p class="text-stone-500 mb-6">Pague para confirmar.</p>
                    
                    <div class="pix-value">${Utils.formatCurrency(total)}</div>
                    
                    ${data.qr_code_base64 ? `<div class="qr-code-box"><img src="data:image/png;base64,${data.qr_code_base64}" width="200" /></div>` : ''}
                    
                    <div class="text-left">
                        <label class="text-sm font-bold">Pix Copia e Cola</label>
                        <div class="copy-paste-box">
                            <input readonly value="${data.pix_qr_code}" class="copy-input" />
                            <button id="copy-btn" class="btn-primary">
                                ${Utils.getIcon('Copy', 'icon-16 text-white')} Copiar
                            </button>
                        </div>
                    </div>
                    
                    <div class="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
                        <button id="track-order-btn" class="btn-primary btn-full hidden">
                            ${Utils.getIcon('Motorcycle', 'icon-20 text-white')} Acompanhar Pedido
                        </button>
                        <button id="back-home" class="btn-ghost">Voltar ao Início</button>
                    </div>
                </div>
             `;
             
             const copyBtn = container.querySelector('#copy-btn');
             const trackBtn = container.querySelector('#track-order-btn');

             copyBtn.addEventListener('click', (e) => {
                 navigator.clipboard.writeText(data.pix_qr_code);
                 e.currentTarget.innerHTML = `${Utils.getIcon('Check', 'icon-16 text-white')} Copiado!`;
                 e.currentTarget.classList.replace('btn-primary', 'bg-green-500');
                 trackBtn.classList.remove('hidden');
                 trackBtn.classList.add('animate-in');
             });

             trackBtn.addEventListener('click', () => {
                 State.navigate(State.APP_VIEWS.PROFILE);
             });

             container.querySelector('#back-home').addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
        }
    };

    (async () => {
        renderState('LOADING');
        const currentTotal = State.appState.lastOrder ? State.appState.lastOrder.total : total;

        if (currentTotal <= 0 || !customer) {
            renderState('ERROR', "Dados inválidos.");
            return;
        }

        const payload = {
            "amount": Math.round(currentTotal * 100),
            "offer_hash": State.OFFER_HASH_DEFAULT,
            "payment_method": "pix",
            "installments": 1, 
            "customer": {
                name: customer.fullName,
                document: customer.cpf.replace(/\D/g, ''),
                phone_number: customer.phone.replace(/\D/g, ''),
                email: customer.email,
                zip_code: customer.address.zipCode.replace(/\D/g, ''),
                number: customer.address.number,
                street_name: customer.address.street,
                neighborhood: customer.address.neighborhood,
                city: customer.address.city || "Sao Paulo", 
                state: customer.address.state || "SP"
            },
            "cart": [{ 
                "product_hash": State.OFFER_HASH_DEFAULT, 
                "title": "Pedido Nona", 
                "price": Math.round(currentTotal * 100), 
                "quantity": 1, 
                "tangible": true,
                "operation_type": 1 
            }],
            "expire_in_days": 1,
            "transaction_origin": "api"
        };

        const res = await Utils.executeInvictusApi(payload);
        if(res.success) renderState('SUCCESS', res.data.pix || res.data);
        else renderState('ERROR', res.error);
    })();

    return container;
}

let countdownInterval;
function startCountdown() {
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

function startSalesPop() {
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
      <div class="sales-pop-icon">
        ${Utils.getIcon('CreditCard', 'icon-20 text-green')}
      </div>
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


function updateHeaderUI() {
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

function showToast(message) {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `${Utils.getIcon('Check', 'icon-16 text-green')} ${message}`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function renderCategoryNav() {
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

function updateCartUI() {
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

document.addEventListener('DOMContentLoaded', () => {
    State.initRenderAppRef(renderApp, showToast);
    State.CartStore.init();

    startCountdown();
    startSalesPop();

    document.getElementById('nav-to-menu-logo').addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
    const navBtn = document.getElementById('nav-to-menu-btn');
    if(navBtn) navBtn.addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
    
    document.getElementById('open-cart-btn').addEventListener('click', () => {
        State.CartStore.isCartOpen = true;
        State.CartStore.updateUI();
    });
    
    document.getElementById('close-cart-btn').addEventListener('click', () => {
        State.CartStore.isCartOpen = false;
        State.CartStore.updateUI();
    });
    
    document.getElementById('cart-backdrop').addEventListener('click', () => {
        State.CartStore.isCartOpen = false;
        State.CartStore.updateUI();
    });
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if(checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            State.CartStore.isCartOpen = false;
            
            const savedProfile = State.getUserProfile();
            const isProfileComplete = savedProfile && 
                                      savedProfile.fullName && 
                                      savedProfile.phone && 
                                      savedProfile.cpf && 
                                      savedProfile.address &&
                                      savedProfile.address.street;

            if (isProfileComplete) {
                State.setCustomerData(savedProfile);
                State.navigate(State.APP_VIEWS.SUCCESS);
            } else {
                State.navigate(State.APP_VIEWS.CHECKOUT);
            }
        });
    }

    renderApp();
});
