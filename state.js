

import * as Utils from './utils.js';

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'https://qvkfoitbatyrwqbicwwc.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2a2ZvaXRiYXR5cndxYmljd3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NjE5NjMsImV4cCI6MjA3OTIzNzk2M30.YzaC8z3e3ut6FFiNsr4e-NJtcVQvvLX-QuOKtjd78YM';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONSTANTES ---
export const PIZZA_SIZES = { M: 'M', G: 'G', F: 'F' };
// REMOVIDO 'REVIEW' DAQUI PARA NÃO APARECER NO SCROLL DE CATEGORIAS
export const CATEGORIES = { PIZZA: 'PIZZA', DRINK: 'BEBIDA', DESSERT: 'SOBREMESA' }; 
export const APP_VIEWS = { MENU: 'MENU', CHECKOUT: 'CHECKOUT', SUCCESS: 'SUCCESS', PROFILE: 'PROFILE', FAQ: 'FAQ', CONTACT: 'CONTACT', LOGIN: 'LOGIN' };

export const API_INVICTUS_TOKEN = "wsxiP0Dydmf2TWqjOn1iZk9CfqwxdZBg8w5eQVaTLDWHnTjyvuGAqPBkAiGU";
export const API_INVICTUS_ENDPOINT = "https://api.invictuspay.app.br/api";
export const OFFER_HASH_DEFAULT = "png8aj6v6p"; 
export const CART_STORAGE_KEY = 'nona-pizzeria-cart-v1';
export const USER_STORAGE_KEY = 'nona-pizzeria-user-v1';
export const LAST_ORDER_KEY = 'nona-pizzeria-last-order-v1';

// --- ESTADO GLOBAL ---
export let MENU_ITEMS = [];

export const appState = {
  currentView: APP_VIEWS.MENU,
  selectedCategory: CATEGORIES.PIZZA,
  lastOrder: null,
  customerData: null // Dados do cliente logado
};

// Variável para gerenciar a inscrição do Realtime
let orderSubscription = null;

// Referências para callbacks (UI)
let _renderAppCallback = null;
let _showToastCallback = null;

export function initRenderAppRef(renderFn, toastFn) {
    _renderAppCallback = renderFn;
    _showToastCallback = toastFn;
}

export function triggerRender(onlyCart = false) {
    if (_renderAppCallback) _renderAppCallback(onlyCart);
}

export function triggerToastRef(msg, type = 'success') {
    if (_showToastCallback) _showToastCallback(msg, type);
}

// --- FUNÇÃO DE TRACKING REALTIME ---
export function subscribeToOrder(orderId) {
    if (orderSubscription) {
        supabase.removeChannel(orderSubscription);
    }

    const statusMessages = {
        'PAID': 'Pagamento confirmado! A cozinha vai começar o preparo.',
        'PREPARING': 'Sua pizza está no forno! O preparo foi iniciado.',
        'DELIVERY': 'Saiu para entrega! O motoboy está a caminho.',
        'COMPLETED': 'Pedido entregue! Bom apetite.',
        'CANCELLED': 'Seu pedido foi cancelado. Entre em contato.'
    };

    orderSubscription = supabase
        .channel(`order-tracking-${orderId}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
            (payload) => {
                const newStatus = payload.new.status;
                const oldStatus = appState.lastOrder?.status;

                if (appState.lastOrder && appState.lastOrder.id === orderId) {
                    appState.lastOrder.status = newStatus;
                    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(appState.lastOrder));
                    
                    triggerToastRef(`Status atualizado: ${newStatus}`);
                    
                    if (newStatus !== oldStatus && statusMessages[newStatus]) {
                        Utils.sendSystemNotification(
                            "Atualização do Pedido 🍕",
                            statusMessages[newStatus]
                        );
                    }

                    triggerRender();
                }
            }
        )
        .subscribe();
}

// --- INICIALIZAÇÃO ---
export async function initApp() {
    // 1. Carregar Produtos
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true);

    if (error) {
        console.error("Erro ao buscar produtos:", error);
        MENU_ITEMS = []; 
    } else {
        MENU_ITEMS = products.map((p, index) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            basePrice: p.base_price,
            priceModifiers: p.price_modifiers,
            imageUrl: p.image_url,
            // Simulação de Oferta (ex: a cada 4 itens, 1 é oferta)
            onSale: (index % 4 === 0) 
        }));
    }

    // 2. Carregar Usuário
    const savedUser = getUserProfile();
    if(savedUser) {
        appState.customerData = savedUser;
    }

    // 3. Carregar Último Pedido Local
    const savedOrder = localStorage.getItem(LAST_ORDER_KEY);
    if (savedOrder) {
        try {
            const localOrder = JSON.parse(savedOrder);
            const { data: freshOrder } = await supabase
                .from('orders')
                .select('*')
                .eq('id', localOrder.id)
                .single();
            
            if (freshOrder) {
                // Atualiza status local
                localOrder.status = freshOrder.status;
                // Atualiza dados do cliente caso tenha mudado (ex: comprovante anexado)
                if(freshOrder.customer_data) localOrder.customer = freshOrder.customer_data;
                
                localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(localOrder));
                appState.lastOrder = localOrder;
            }
            
            // Só inscreve no realtime se o pedido ainda não estiver concluído
            if(['PENDING', 'PAID', 'PREPARING', 'DELIVERY'].includes(localOrder.status)) {
                subscribeToOrder(localOrder.id);
                Utils.requestNotificationPermission();
            }

        } catch (e) {
            console.error("Erro ao recuperar último pedido", e);
        }
    }

    triggerRender();
}

// --- ACTIONS ---

export function navigate(view) {
    appState.currentView = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerRender();
}

export function setSelectedCategory(category) {
    appState.selectedCategory = category;
    triggerRender();
}

export function setCustomerData(data) {
    appState.customerData = data;
    if (data) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
    } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        appState.lastOrder = null;
        localStorage.removeItem(LAST_ORDER_KEY);
        if (orderSubscription) supabase.removeChannel(orderSubscription);
    }
}

export function getUserProfile() {
    try {
        return JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
    } catch(e) { return null; }
}

export function saveUserProfile(data) {
    setCustomerData(data);
    
    // Normaliza CPF (apenas números) para chave primária/relacionamento
    const cleanCpf = data.cpf.replace(/\D/g, '');

    (async () => {
        // Tenta buscar pelo CPF primeiro (chave mais estável) ou Email
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .or(`cpf.eq.${data.cpf},cpf.eq.${cleanCpf},email.eq.${data.email}`)
            .maybeSingle();

        if (existing) {
            await supabase.from('profiles').update({
                full_name: data.fullName,
                phone: data.phone,
                cpf: cleanCpf, // Salva limpo
                email: data.email, // Atualiza email caso tenha mudado
                address: data.address,
                updated_at: new Date()
            }).eq('id', existing.id);
        } else {
            await supabase.from('profiles').insert([{
                full_name: data.fullName,
                email: data.email,
                phone: data.phone,
                cpf: cleanCpf, // Salva limpo
                address: data.address
            }]);
        }
    })();
}

export async function loginUser(email, passwordInput) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !data) {
            return { success: false, message: "Email não encontrado. Faça seu cadastro." };
        }

        const cleanCpf = data.cpf ? data.cpf.replace(/\D/g, '') : '';
        const passwordCorrect = cleanCpf.substring(0, 4);

        if (passwordInput === passwordCorrect) {
            const userObj = {
                fullName: data.full_name,
                email: data.email,
                phone: data.phone,
                cpf: data.cpf, // Mantém o que veio do banco
                address: data.address || {}
            };
            setCustomerData(userObj);
            return { success: true };
        } else {
            return { success: false, message: "Senha incorreta (Use os 4 primeiros números do CPF)." };
        }

    } catch (e) {
        console.error(e);
        return { success: false, message: "Erro de conexão." };
    }
}

// NOVA FUNÇÃO: Busca histórico de pedidos via CPF
export async function fetchUserOrders(cpf) {
    if (!cpf) return [];
    
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Busca na tabela orders onde customer_cpf match
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_cpf', cleanCpf)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn("Erro ao buscar histórico (verifique se coluna customer_cpf existe):", error);
        return [];
    }
    return data;
}

// NOVA FUNÇÃO: Enviar Comprovante
export async function submitPaymentProof(orderId, proofBase64) {
    try {
        // 1. Busca o pedido atual para pegar o customer_data existente
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('customer_data')
            .eq('id', orderId)
            .single();

        if(fetchError || !order) throw new Error("Pedido não encontrado");

        // 2. Atualiza customer_data com a prova
        const updatedCustomerData = {
            ...order.customer_data,
            paymentProof: proofBase64,
            paymentProofDate: new Date().toISOString()
        };

        const { error: updateError } = await supabase
            .from('orders')
            .update({ customer_data: updatedCustomerData }) // Salva no JSON
            .eq('id', orderId);

        if(updateError) throw updateError;
        
        // Atualiza estado local
        if(appState.lastOrder && appState.lastOrder.id === orderId) {
            appState.lastOrder.customer = updatedCustomerData;
            localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(appState.lastOrder));
        }

        return { success: true };
    } catch(e) {
        console.error(e);
        return { success: false, message: e.message };
    }
}


export function confirmOrder(total, orderId) {
    appState.lastOrder = {
        id: orderId || `ORD-${Date.now()}`,
        total: total,
        date: new Date(),
        status: 'PENDING',
        customer: appState.customerData
    };
    
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(appState.lastOrder));
    Utils.requestNotificationPermission();
    subscribeToOrder(appState.lastOrder.id);
    CartStore.items = [];
    CartStore.saveAndRender();
}

export async function createOrder(orderData) {
    // Garante que temos o CPF limpo para relacionamento
    const cleanCpf = orderData.customer.cpf ? orderData.customer.cpf.replace(/\D/g, '') : null;

    const { data, error } = await supabase
        .from('orders')
        .insert([{
            customer_cpf: cleanCpf, // COLUNA DE RELACIONAMENTO (FK LÓGICA)
            customer_data: orderData.customer, // JSONB para compatibilidade
            items: orderData.items,
            total: orderData.total,
            status: 'PENDING'
        }])
        .select()
        .single();
        
    if(error) throw error;
    return data;
}

// --- CART STORE (Carrinho) ---
export const CartStore = {
  items: [],
  isCartOpen: false,

  init() {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) this.items = JSON.parse(stored);
    this.updateUI();
  },

  get cartTotal() { return this.items.reduce((acc, item) => acc + item.totalPrice, 0); },
  get itemsCount() { return this.items.reduce((acc, item) => acc + item.quantity, 0); },

  addItem(product, size) {
    const isPizza = product.category === CATEGORIES.PIZZA;
    const finalPrice = isPizza && size && product.priceModifiers ? product.priceModifiers[size] || product.basePrice : product.basePrice;

    const existingItemIndex = this.items.findIndex(item => item.product.id === product.id && item.size === size);

    if (existingItemIndex > -1) {
      const item = this.items[existingItemIndex];
      item.quantity += 1;
      item.totalPrice = item.quantity * finalPrice;
    } else {
      this.items.push({
        cartId: `${product.id}-${size || 'default'}-${Date.now()}`,
        product, size, quantity: 1, totalPrice: finalPrice,
      });
    }

    this.saveAndRender();
    triggerToastRef(`${product.name} adicionado!`); 
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
        item.quantity = newQuantity;
        item.totalPrice = newQuantity * unitPrice;
      }
      return item;
    });
    this.saveAndRender();
  },

  saveAndRender() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    this.updateUI();
  },

  updateUI() {
    triggerRender(true);
  }
};