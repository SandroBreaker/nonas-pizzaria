

import * as State from './state.js';
import * as Utils from './utils.js';
import * as Components from './components.js';
import * as Tracking from './tracking.js';

// --- VIEW RENDERERS ---

export function renderLogin() {
    const container = document.createElement('div');
    container.className = "form-container animate-in";
    
    let activeTab = 'CLIENT'; 
    let isRegistering = false; 

    const renderContent = () => {
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto border border-gray-100">
                <div class="bg-gradient-to-r from-red-600 to-red-800 p-6 text-center text-white">
                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                        <i class="fa-solid fa-user-lock text-2xl"></i>
                    </div>
                    <h2 class="text-2xl font-serif font-bold">Acesse sua Conta</h2>
                    <p class="text-red-100 text-sm">Gerencie seus pedidos e endereço</p>
                </div>
                
                <div class="p-8">
                    <div class="login-toggle-container mb-8">
                        <button class="toggle-btn ${activeTab === 'CLIENT' ? 'active' : ''}" id="tab-client">
                            <i class="fa-regular fa-user mr-2"></i> Cliente
                        </button>
                        <button class="toggle-btn ${activeTab === 'ADMIN' ? 'active' : ''}" id="tab-admin">
                            <i class="fa-solid fa-shield-halved mr-2"></i> Admin
                        </button>
                    </div>

                    <div id="client-view" class="${activeTab === 'CLIENT' ? '' : 'hidden'}">
                        
                        <div id="login-form-box" class="${isRegistering ? 'hidden' : ''} space-y-5">
                            <form id="client-login-form" class="flex flex-col gap-4">
                                <div class="input-group">
                                    <label class="font-bold text-gray-700 text-sm">Email</label>
                                    <div class="relative">
                                        <i class="fa-solid fa-envelope absolute left-3 top-3 text-gray-400"></i>
                                        <input type="email" id="login-email" class="input-field pl-10" placeholder="seu@email.com" required>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label class="font-bold text-gray-700 text-sm">Senha <span class="text-xs font-normal text-gray-400">(4 primeiros dígitos do CPF)</span></label>
                                    <div class="relative">
                                        <i class="fa-solid fa-key absolute left-3 top-3 text-gray-400"></i>
                                        <input type="password" id="login-pass" class="input-field pl-10" placeholder="••••" maxlength="4" required>
                                    </div>
                                </div>
                                <button type="submit" class="btn-primary btn-full py-3 text-base shadow-lg hover:shadow-xl transform transition-all">
                                    Entrar
                                </button>
                            </form>
                            
                            <div class="text-center mt-6 pt-6 border-t border-gray-100">
                                <p class="text-sm text-stone-500 mb-2">Ainda não tem cadastro?</p>
                                <button id="btn-go-register" class="text-primary font-bold hover:underline">Criar conta agora</button>
                            </div>
                        </div>

                        <div id="register-form-box" class="${isRegistering ? '' : 'hidden'} animate-in">
                            <div class="flex items-center gap-2 mb-6">
                                <button id="btn-back-login" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                    <i class="fa-solid fa-arrow-left text-gray-600"></i>
                                </button>
                                <span class="font-bold text-gray-700">Voltar para Login</span>
                            </div>
                            <div id="client-form-wrapper"></div>
                        </div>

                    </div>

                    <div id="admin-view" class="${activeTab === 'ADMIN' ? '' : 'hidden'} animate-in">
                        <form id="admin-form" class="flex flex-col gap-5">
                            <div class="p-4 bg-yellow-50 border border-yellow-100 rounded-lg flex gap-3 items-start mb-2">
                                <i class="fa-solid fa-triangle-exclamation text-yellow-600 mt-1"></i>
                                <p class="text-xs text-yellow-800 leading-relaxed">Área restrita para colaboradores. O acesso é monitorado.</p>
                            </div>

                            <div class="input-group">
                                <label class="font-bold text-gray-700 text-sm">Usuário</label>
                                <div class="relative">
                                    <i class="fa-solid fa-user-shield absolute left-3 top-3 text-gray-400"></i>
                                    <input type="text" id="admin-user" class="input-field pl-10" placeholder="admin">
                                </div>
                            </div>
                            <div class="input-group">
                                <label class="font-bold text-gray-700 text-sm">Senha</label>
                                <div class="relative">
                                    <i class="fa-solid fa-lock absolute left-3 top-3 text-gray-400"></i>
                                    <input type="password" id="admin-pass" class="input-field pl-10" placeholder="••••••">
                                </div>
                            </div>
                            <button type="submit" class="btn-primary btn-full bg-slate-800 hover:bg-slate-900 py-3 mt-2">
                                Acessar Painel
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        container.querySelector('#tab-client').addEventListener('click', () => { activeTab = 'CLIENT'; renderContent(); });
        container.querySelector('#tab-admin').addEventListener('click', () => { activeTab = 'ADMIN'; renderContent(); });

        if(activeTab === 'CLIENT') {
            if (!isRegistering) {
                container.querySelector('#btn-go-register').addEventListener('click', () => {
                    isRegistering = true;
                    renderContent();
                });

                container.querySelector('#client-login-form').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const email = document.getElementById('login-email').value;
                    const pass = document.getElementById('login-pass').value;
                    
                    const btn = e.target.querySelector('button');
                    const originalText = btn.innerHTML;
                    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Verificando...`;
                    btn.disabled = true;
                    
                    const res = await State.loginUser(email, pass);
                    
                    if(res.success) {
                        Components.showToast(`Bem-vindo, ${State.appState.customerData.fullName.split(' ')[0]}!`);
                        State.navigate(State.APP_VIEWS.PROFILE);
                    } else {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        Components.showToast(res.message, 'error');
                        btn.classList.add('animate-shake');
                        setTimeout(() => btn.classList.remove('animate-shake'), 500);
                    }
                });
            } else {
                container.querySelector('#btn-back-login').addEventListener('click', () => {
                    isRegistering = false;
                    renderContent();
                });

                const wrapper = container.querySelector('#client-form-wrapper');
                const formElement = renderCustomerForm('PROFILE'); 
                const innerCard = formElement.querySelector('.form-card');
                
                if(innerCard) {
                    const header = innerCard.querySelector('.form-header');
                    if(header) header.remove();
                    innerCard.style.boxShadow = 'none';
                    innerCard.style.padding = '0';
                    innerCard.style.border = 'none';
                    wrapper.appendChild(innerCard);
                } else {
                    wrapper.appendChild(formElement);
                }
            }
        }

        if(activeTab === 'ADMIN') {
            container.querySelector('#admin-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const user = document.getElementById('admin-user').value;
                const pass = document.getElementById('admin-pass').value;

                if (user === 'admin' && pass === 'admin') {
                    Components.showToast("Login autorizado!");
                    setTimeout(() => {
                        window.location.href = 'admin.html';
                    }, 500);
                } else {
                    Components.showToast("Credenciais inválidas", 'error');
                    const btn = e.target.querySelector('button');
                    btn.classList.add('animate-shake');
                    setTimeout(() => btn.classList.remove('animate-shake'), 500);
                }
            });
        }
    };

    renderContent();
    return container;
}

export function renderProfileRouter() {
    const user = State.getUserProfile();
    
    if (!user) {
        return renderLogin();
    }
    
    const mainContainer = document.createElement('div');
    mainContainer.className = "container py-4 space-y-8 animate-in";
    
    // Placeholder de carregamento
    const contentArea = document.createElement('div');
    contentArea.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 text-stone-400">
            ${Utils.getIcon('LoaderCircle', 'fa-spin text-primary icon-32 mb-4')}
            <p>Carregando perfil...</p>
        </div>
    `;
    mainContainer.appendChild(contentArea);

    // Fetch Orders & Render
    State.fetchUserOrders(user.cpf).then(orders => {
        // Separa pedido ativo de histórico
        const activeOrder = orders.find(o => ['PENDING', 'PAID', 'PREPARING', 'DELIVERY'].includes(o.status));
        const historyOrders = orders.filter(o => o.id !== activeOrder?.id);

        contentArea.innerHTML = '';
        
        // 1. HEADER & STATS
        contentArea.appendChild(renderUserHeader(user, orders.length));

        // 2. ACTIVE TRACKING (Hero)
        if (activeOrder) {
            // Sync global state
            State.appState.lastOrder = { ...activeOrder, customer: user }; 
            
            const trackingWrapper = document.createElement('div');
            trackingWrapper.className = "mb-10";
            trackingWrapper.innerHTML = `
                <div class="flex items-center gap-2 mb-4 text-primary font-bold animate-pulse">
                    ${Utils.getIcon('Clock', 'icon-20')}
                    <span>Acompanhamento em Tempo Real</span>
                </div>
            `;
            trackingWrapper.appendChild(Tracking.renderProfileView());
            contentArea.appendChild(trackingWrapper);
        }

        // 3. MAIN GRID (Profile Details + History)
        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-3 gap-8";
        
        // Coluna Esquerda: Dados do Usuário
        const colLeft = document.createElement('div');
        colLeft.className = "md:col-span-1";
        colLeft.appendChild(renderUserProfileDetails(user));
        grid.appendChild(colLeft);

        // Coluna Direita: Histórico
        const colRight = document.createElement('div');
        colRight.className = "md:col-span-2";
        
        if (historyOrders.length > 0) {
            colRight.innerHTML = `<h3 class="text-lg font-bold mb-6 flex items-center gap-2">${Utils.getIcon('ShoppingBag', 'text-stone-400')} Histórico de Pedidos</h3>`;
            const list = document.createElement('div');
            list.className = "space-y-4";
            
            historyOrders.forEach(ord => {
                list.appendChild(renderOrderHistoryItem(ord));
            });
            colRight.appendChild(list);
        } else {
            colRight.innerHTML = `
                <div class="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
                    <div class="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-300">
                        ${Utils.getIcon('Pizza', 'icon-32')}
                    </div>
                    <h3 class="font-bold text-stone-600 mb-2">Seu histórico está vazio</h3>
                    <p class="text-stone-400 text-sm mb-4">Que tal pedir sua primeira pizza hoje?</p>
                    <button id="go-menu-empty" class="btn-primary text-sm">Ver Cardápio</button>
                </div>
            `;
            setTimeout(() => {
                const btn = colRight.querySelector('#go-menu-empty');
                if(btn) btn.addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
            }, 0);
        }
        
        grid.appendChild(colRight);
        contentArea.appendChild(grid);
    });

    return mainContainer;
}

function renderUserHeader(user, totalOrders = 0) {
    const div = document.createElement('div');
    div.className = "bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 mb-8";
    
    div.innerHTML = `
        <div class="flex items-center gap-4 w-full md:w-auto">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center text-2xl font-serif font-bold shadow-md border-2 border-white ring-2 ring-red-100">
                ${user.fullName.charAt(0)}
            </div>
            <div>
                <h2 class="font-bold text-xl text-gray-800">${user.fullName}</h2>
                <p class="text-sm text-stone-500 flex items-center gap-2">
                    ${Utils.getIcon('User', 'icon-14')} Cliente VIP
                </p>
            </div>
        </div>

        <div class="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div class="text-center px-4 border-l border-gray-100">
                <span class="block font-bold text-xl text-primary">${totalOrders}</span>
                <span class="text-xs text-stone-400 uppercase font-bold tracking-wider">Pedidos</span>
            </div>
            <button id="btn-logout" class="flex items-center gap-2 text-stone-500 hover:text-red-600 transition-colors text-sm font-medium px-4 py-2 hover:bg-red-50 rounded-lg">
                ${Utils.getIcon('X', 'rotate-180')} Sair
            </button>
        </div>
    `;

    div.querySelector('#btn-logout').addEventListener('click', () => {
        State.setCustomerData(null); 
        localStorage.removeItem(State.USER_STORAGE_KEY); 
        Components.showToast("Você saiu da conta.");
        State.navigate(State.APP_VIEWS.LOGIN);
    });

    return div;
}

function renderUserProfileDetails(user) {
    const div = document.createElement('div');
    div.className = "bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden relative group";
    
    div.innerHTML = `
        <div class="p-5 border-b border-stone-100 flex justify-between items-start bg-gradient-to-b from-stone-50/50 to-white">
            <div>
                <h3 class="font-bold text-stone-800 text-lg">Meus Dados</h3>
                <p class="text-xs text-stone-400">Informações de entrega e contato</p>
            </div>
            <button id="btn-edit-profile" class="text-sm font-semibold text-primary bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2">
                ${Utils.getIcon('Edit', 'icon-14')} Editar
            </button>
        </div>
        
        <!-- SECTION: ADDRESS (HERO) -->
        <div class="p-6 relative">
            <div class="absolute right-6 top-6 opacity-10 text-stone-300">
                ${Utils.getIcon('MapPin', 'icon-48')}
            </div>
            
            <label class="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">Endereço de Entrega</label>
            
            <div class="mb-1">
                <span class="text-xl font-bold text-stone-800 block leading-tight">${user.address.street}, ${user.address.number}</span>
                <span class="text-sm text-stone-500 font-medium">${user.address.neighborhood} • ${user.address.zipCode}</span>
            </div>

            ${user.address.complement ? `
                <div class="mt-3 inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-md border border-yellow-100 text-xs font-bold">
                     <i class="fa-regular fa-note-sticky"></i>
                     Comp: ${user.address.complement}
                </div>
            ` : ''}
        </div>
        
        <!-- SECTION: PERSONAL INFO (GRID) -->
        <div class="bg-stone-50/50 border-t border-stone-100 p-5 grid grid-cols-2 gap-y-4 gap-x-2">
            <div>
                <label class="text-[10px] font-bold text-stone-400 uppercase block mb-1">Telefone</label>
                <div class="flex items-center gap-2 text-stone-700 font-medium text-sm">
                    <div class="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 shadow-sm text-xs">
                        <i class="fa-solid fa-phone"></i>
                    </div>
                    ${user.phone}
                </div>
            </div>
            
            <div>
                <label class="text-[10px] font-bold text-stone-400 uppercase block mb-1">CPF</label>
                <div class="flex items-center gap-2 text-stone-700 font-medium text-sm">
                     <div class="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 shadow-sm text-xs">
                        <i class="fa-solid fa-id-card"></i>
                    </div>
                    ${user.cpf}
                </div>
            </div>

            <div class="col-span-2">
                <label class="text-[10px] font-bold text-stone-400 uppercase block mb-1">Email</label>
                <div class="flex items-center gap-2 text-stone-700 font-medium text-sm overflow-hidden">
                     <div class="w-6 h-6 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 shadow-sm text-xs flex-shrink-0">
                        <i class="fa-solid fa-envelope"></i>
                    </div>
                    <span class="truncate">${user.email}</span>
                </div>
            </div>
        </div>
    `;

    div.querySelector('#btn-edit-profile').addEventListener('click', () => {
        const form = renderCustomerForm('PROFILE');
        div.replaceWith(form);
    });

    return div;
}

function renderOrderHistoryItem(ord) {
    const items = typeof ord.items === 'string' ? JSON.parse(ord.items) : ord.items;
    const itemsDesc = items.map(i => `${i.quantity}x ${i.product.name}`).join(', ');
    
    // Status styling
    const statusMap = {
        'PENDING': { color: 'bg-yellow-100 text-yellow-700', label: 'Pendente' },
        'PAID': { color: 'bg-blue-100 text-blue-700', label: 'Pago' },
        'PREPARING': { color: 'bg-orange-100 text-orange-700', label: 'Preparando' },
        'DELIVERY': { color: 'bg-purple-100 text-purple-700', label: 'Em Rota' },
        'COMPLETED': { color: 'bg-green-100 text-green-700', label: 'Entregue' },
        'CANCELLED': { color: 'bg-red-100 text-red-700', label: 'Cancelado' }
    };
    
    const st = statusMap[ord.status] || { color: 'bg-gray-100 text-gray-600', label: ord.status };
    
    const el = document.createElement('div');
    el.className = "bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group";
    
    el.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 group-hover:bg-primary group-hover:text-white transition-colors">
                    <i class="fa-solid fa-receipt"></i>
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-stone-800">Pedido #${ord.id.slice(0,6)}</span>
                        <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${st.color}">${st.label}</span>
                    </div>
                    <p class="text-xs text-stone-400">${Utils.formatDate(ord.created_at)}</p>
                </div>
            </div>
            <p class="font-bold text-stone-800">${Utils.formatCurrency(ord.total)}</p>
        </div>
        
        <div class="pl-[52px]">
            <p class="text-sm text-stone-600 line-clamp-2">${itemsDesc}</p>
             <button class="mt-3 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Ver Detalhes ${Utils.getIcon('ChevronLeft', 'rotate-180 icon-14')}
            </button>
        </div>
    `;
    
    el.addEventListener('click', () => {
        Components.showToast(`Pedido de ${Utils.formatCurrency(ord.total)} em ${new Date(ord.created_at).toLocaleDateString()}`);
    });

    return el;
}

export function renderCustomerForm(mode = 'CHECKOUT') {
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

                    <div class="flex gap-2">
                         ${!isCheckout ? `<button type="button" id="cancel-edit" class="btn-ghost flex-1">Cancelar</button>` : ''}
                        <button type="submit" class="btn-primary flex-1 text-lg">
                            ${isCheckout 
                                ? `${Utils.getIcon('CreditCard', 'icon-20 text-white')} Ir para Pagamento` 
                                : `${Utils.getIcon('Save', 'icon-20 text-white')} Salvar`
                            }
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        const form = container.querySelector('#customer-form');
        
        if (!isCheckout) {
             container.querySelector('#cancel-edit').addEventListener('click', () => {
                 State.navigate(State.APP_VIEWS.PROFILE);
             });
        }

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
                Components.showToast("Dados salvos com sucesso!");

                if (isCheckout) {
                    State.setCustomerData(formData);
                    State.navigate(State.APP_VIEWS.SUCCESS);
                } else {
                    State.navigate(State.APP_VIEWS.PROFILE);
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

export function renderMenu() {
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
  
  // RENDERIZA CATEGORIA SELECIONADA
  const categoryItems = State.MENU_ITEMS.filter(i => i.category === currentCategory);
  if (categoryItems.length > 0) {
      const sectionTitle = document.createElement('h2');
      sectionTitle.className = "section-title";
      const indicatorClass = currentCategory === State.CATEGORIES.PIZZA ? 'bg-indicator-pizza' : 'bg-indicator-default';
      sectionTitle.innerHTML = `<span class="section-indicator ${indicatorClass}"></span> ${currentCategory === State.CATEGORIES.PIZZA ? 'Pizzas Especiais' : 'Nossa Seleção'}`;
      
      const grid = document.createElement('div');
      grid.className = `products-grid ${currentCategory === State.CATEGORIES.PIZZA ? 'pizza-grid' : ''}`;
      
      categoryItems.forEach(item => grid.appendChild(Components.renderProductCard(item)));
      
      menuSection.appendChild(sectionTitle);
      menuSection.appendChild(grid);
  } else {
      menuSection.innerHTML = `<div class="text-center py-8 text-stone-500">Nenhum produto nesta categoria.</div>`;
  }

  container.appendChild(menuSection);
  
  // AVALIAÇÕES SEMPRE NO FINAL DA HOME
  const reviewsContainer = document.createElement('div');
  reviewsContainer.className = "mt-12 mb-8";
  reviewsContainer.appendChild(renderReviewsSection());
  container.appendChild(reviewsContainer);

  container.querySelector('#hero-cta')?.addEventListener('click', () => menuSection.scrollIntoView({ behavior: 'smooth' }));

  return container;
}

function renderReviewsSection() {
    const REVIEWS = [
        { id: 1, author: "Matheus Freitas", rating: 5, date: "2024-03-20", text: "Café da manhã excelente! Pão de queijo muito bom." },
        { id: 2, author: "José Alberto", rating: 5, date: "2024-03-18", text: "Atendimento com excelência. Recomendo o salmão." },
        { id: 3, author: "Carla Nunes", rating: 5, date: "2024-03-22", text: "A melhor pizza da região. A massa é incrivelmente leve!" },
        { id: 4, author: "Felipe Costa", rating: 4, date: "2024-03-21", text: "Entrega rápida e chegou bem quente." },
        { id: 7, author: "Pizzaria Boa Sorte", rating: null, date: "2024-03-12", text: "Obrigado! 👏👏👏", isOwner: true }
    ];

    const section = document.createElement('div');
    section.className = "reviews-section-container";
    
    section.innerHTML = `
        <div class="reviews-header">
            <div>
                <h2 class="section-title mb-0">Avaliações dos Clientes</h2>
                <p class="text-stone-500 text-sm">O que dizem sobre nós</p>
            </div>
            <div class="rating-badge">
                <span class="text-2xl font-bold text-yellow-500">4.8</span>
                <div class="flex text-yellow-400 text-xs">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star-half-stroke"></i>
                </div>
            </div>
        </div>

        <div class="reviews-grid">
            ${REVIEWS.map(r => `
                <div class="review-card-premium ${r.isOwner ? 'owner-reply' : ''}">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${r.isOwner ? 'bg-primary' : 'bg-gradient-to-br from-stone-400 to-stone-600'}">
                            ${r.isOwner ? Utils.getIcon('Pizza', 'icon-16') : r.author.charAt(0)}
                        </div>
                        <div>
                            <p class="font-bold text-sm text-stone-800">${r.author}</p>
                            ${!r.isOwner ? `
                                <div class="flex text-yellow-400 text-[10px] gap-0.5">
                                    ${Array(r.rating).fill('<i class="fa-solid fa-star"></i>').join('')}
                                </div>
                            ` : '<span class="text-[10px] bg-primary text-white px-1.5 rounded uppercase font-bold">Resposta</span>'}
                        </div>
                        <span class="ml-auto text-[10px] text-stone-400">${Utils.formatDate(r.date)}</span>
                    </div>
                    <p class="text-sm text-stone-600 leading-relaxed">"${r.text}"</p>
                </div>
            `).join('')}
        </div>
        
        <div class="text-center mt-6">
            <button class="btn-secondary mx-auto text-sm">Ver todas as avaliações no Google</button>
        </div>
    `;
    return section;
}

export function renderFAQ() {
    const div = document.createElement('div');
    div.className = "container py-8 animate-in max-w-3xl";
    div.innerHTML = `
        <div class="text-center mb-10">
            <h2 class="text-3xl font-serif font-bold mb-3">Perguntas Frequentes</h2>
            <p class="text-stone-500">Tire suas dúvidas sobre entrega, pagamento e produtos.</p>
        </div>

        <div class="faq-category mb-8">
            <h3 class="faq-category-title">${Utils.getIcon('Motorcycle', 'text-primary')} Entrega e Pedidos</h3>
            <div class="faq-list">
                <details class="faq-item">
                    <summary>Qual a área de entrega e o valor da taxa?</summary>
                    <p>Atendemos um raio de 8km a partir do centro. A taxa varia de R$ 5,00 a R$ 15,00 dependendo da distância exata. O valor é calculado automaticamente no checkout.</p>
                </details>
                <details class="faq-item">
                    <summary>Quanto tempo demora a entrega?</summary>
                    <p>Nossas entregas levam em média 30 a 50 minutos. Em dias de chuva ou alta demanda (sextas e sábados), pode chegar a 60-80 minutos.</p>
                </details>
                <details class="faq-item">
                    <summary>Posso agendar um pedido?</summary>
                    <p>Sim! Você pode entrar em contato via WhatsApp para agendar entregas para eventos ou horários específicos.</p>
                </details>
            </div>
        </div>

        <div class="faq-category mb-8">
            <h3 class="faq-category-title">${Utils.getIcon('CreditCard', 'text-primary')} Pagamentos</h3>
            <div class="faq-list">
                <details class="faq-item">
                    <summary>Quais as formas de pagamento?</summary>
                    <p>No site aceitamos PIX com aprovação imediata. Na entrega (via maquininha), aceitamos Crédito, Débito e Vale Refeição (Alelo, Sodexo, VR).</p>
                </details>
                <details class="faq-item">
                    <summary>O pagamento via site é seguro?</summary>
                    <p>Sim, utilizamos um gateway de pagamento criptografado. Seus dados não ficam salvos em nosso banco de dados.</p>
                </details>
            </div>
        </div>
        
        <div class="faq-category">
             <h3 class="faq-category-title">${Utils.getIcon('Pizza', 'text-primary')} Produtos</h3>
             <div class="faq-list">
                <details class="faq-item">
                    <summary>A massa contém glúten?</summary>
                    <p>Sim, nossa massa tradicional é feita com farinha de trigo. Não dispomos de cozinha separada para celíacos (risco de contaminação cruzada).</p>
                </details>
             </div>
        </div>

        <div class="mt-12 bg-stone-50 p-6 rounded-xl text-center border border-stone-200">
            <p class="font-bold text-stone-700 mb-2">Ainda tem dúvidas?</p>
            <p class="text-sm text-stone-500 mb-4">Nossa equipe está pronta para te atender.</p>
            <a href="#" class="btn-primary text-sm inline-flex items-center gap-2">
                ${Utils.getIcon('Whatsapp')} Falar no WhatsApp
            </a>
        </div>
    `;
    return div;
}

export function renderContact() {
    const div = document.createElement('div');
    div.className = "container py-8 animate-in text-center max-w-lg mx-auto";
    
    div.innerHTML = `
        <h2 class="section-title justify-center mb-6">Fale Conosco</h2>
        
        <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8 space-y-4">
            <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                 ${Utils.getIcon('Phone')}
            </div>
            <h3 class="text-xl font-bold mb-2">Atendimento</h3>
            <p class="text-stone-500">Estamos disponíveis todos os dias das 18h às 23h.</p>
            
            <a href="#" class="btn-primary btn-full bg-green-500 hover:bg-green-600 text-lg py-4 shadow-green-200">
                ${Utils.getIcon('Whatsapp', 'text-white text-xl')} (11) 99999-9999
            </a>
            <p class="text-xs text-stone-400">Clique para abrir o WhatsApp</p>
        </div>

        <div class="grid grid-cols-2 gap-4 mb-8">
            <a href="#" class="social-btn instagram">
                ${Utils.getIcon('Instagram', 'text-2xl')}
                <span>Instagram</span>
            </a>
            <a href="#" class="social-btn facebook">
                ${Utils.getIcon('Facebook', 'text-2xl')}
                <span>Facebook</span>
            </a>
        </div>

        <div class="bg-white p-6 rounded-xl border border-gray-200 text-left relative overflow-hidden space-y-4">
            <div class="absolute right-[-20px] top-[-20px] text-stone-100 text-[100px] pointer-events-none">
                ${Utils.getIcon('MapPin')}
            </div>
            <h3 class="font-bold text-lg mb-2 flex items-center gap-2">
                ${Utils.getIcon('MapPin', 'text-primary')} Onde Estamos
            </h3>
            <p class="text-stone-600 mb-1"><strong>Rua Augusta, 1500</strong></p>
            <p class="text-stone-500 text-sm mb-4">Consolação, São Paulo - SP</p>
            
            <div id="map" class="w-full h-48 bg-stone-200 rounded-lg text-stone-400 text-sm">
                <!-- Mapa será renderizado aqui -->
            </div>
            <p class="text-xs text-stone-400 text-center mt-2">Localização exata da unidade</p>
        </div>
    `;

    // Initialize Map Logic (Leaflet - OpenStreetMap)
    setTimeout(() => {
        if (!document.getElementById('map')) return;

        const initMap = (lat, lng, userLat, userLng) => {
            // Se já existe mapa, remove para evitar erro de inicialização dupla
            if (window.leafletMap) {
                window.leafletMap.remove();
            }

            // Cria o mapa
            const map = L.map('map').setView([lat, lng], 14);
            window.leafletMap = map;

            // Adiciona camada do OpenStreetMap
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Adiciona marcador da pizzaria (FIXO EM TERRA FIRME - Ex: Rua Augusta/Paulista)
            L.marker([lat, lng]).addTo(map)
                .bindPopup('<b>Nona\'s Pizzeria</b><br>Rua Augusta, 1500')
                .openPopup();
                
            // Se tiver localização do usuário, tenta ajustar o zoom para mostrar ambos (simulando rota)
            if (userLat && userLng) {
                L.marker([userLat, userLng], {
                    icon: L.divIcon({
                        className: 'user-marker',
                        html: '<div style="background:blue;width:12px;height:12px;border-radius:50%;border:2px solid white;"></div>'
                    })
                }).addTo(map).bindPopup('Você está aqui');
                
                // Traça uma linha simples
                L.polyline([[userLat, userLng], [lat, lng]], {color: 'blue', dashArray: '5, 10'}).addTo(map);
                
                const group = new L.featureGroup([
                    L.marker([lat, lng]),
                    L.marker([userLat, userLng])
                ]);
                map.fitBounds(group.getBounds().pad(0.2));
            }
        };

        // Coordenada FIXA da Pizzaria (Ex: Av Paulista/Augusta - Garantia de não ser água)
        const PIZZERIA_LAT = -23.5555;
        const PIZZERIA_LNG = -46.6610;

        // Tenta pegar localização do usuário APENAS para mostrar a distância relativa
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                initMap(PIZZERIA_LAT, PIZZERIA_LNG, userLat, userLng);
            }, () => {
                // Fallback sem user location
                initMap(PIZZERIA_LAT, PIZZERIA_LNG);
            });
        } else {
            // Fallback sem suporte a geo
            initMap(PIZZERIA_LAT, PIZZERIA_LNG);
        }

    }, 100);

    return div;
}
export function renderPixPayment() {
    const container = document.createElement('div');
    container.className = "pix-container animate-in";
    const total = State.CartStore.cartTotal;
    const customer = State.appState.customerData;
    
    const renderState = (state, data = null) => {
        if (state === 'LOADING') {
             container.innerHTML = `
                <div class="pix-card">
                    ${Utils.getIcon('LoaderCircle', 'icon-64 text-primary fa-spin')}
                    <h2 class="text-xl font-bold mt-4">Gerando Pedido...</h2>
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

        try {
            // 1. Cria Pedido no Banco de Dados (Supabase)
            let orderId = State.appState.lastOrder ? State.appState.lastOrder.id : null;
            
            if(!orderId) {
                const dbOrder = await State.createOrder({
                    customer: customer,
                    items: State.CartStore.items,
                    total: currentTotal
                });
                
                // Atualiza estado local
                State.confirmOrder(currentTotal, dbOrder.id);
                orderId = dbOrder.id;
            }

            // 2. Chama API de Pagamento
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
                    "title": `Nona Pizza #${orderId.slice(0,6)}`, 
                    "price": Math.round(currentTotal * 100), 
                    "quantity": 1, 
                    "tangible": true,
                    "operation_type": 1 
                }],
                "external_reference": orderId,
                "expire_in_days": 1
            };

            const res = await Utils.executeInvictusApi(payload);
            
            if(res.success) {
                renderState('SUCCESS', res.data.pix || res.data);
            } else {
                renderState('ERROR', res.error);
            }
            
        } catch(e) {
            console.error(e);
            renderState('ERROR', "Falha ao registrar pedido. Tente novamente.");
        }
    })();

    return container;
}
