// state.js
import * as Utils from './utils.js';

// --- CONFIGURAÇÃO SUPABASE ---
const SUPABASE_URL = 'SUA_URL_SUPABASE_AQUI'; 
const SUPABASE_KEY = 'SUA_KEY_ANON_AQUI';

// Inicializa o cliente usando a versão global carregada no HTML
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export const PIZZA_SIZES = { M: 'M', G: 'G', F: 'F' };
export const CATEGORIES = { PIZZA: 'PIZZA', DRINK: 'BEBIDA', DESSERT: 'SOBREMESA', REVIEW: 'AVALIAÇÕES' };
export const APP_VIEWS = { MENU: 'MENU', CHECKOUT: 'CHECKOUT', SUCCESS: 'SUCCESS', PROFILE: 'PROFILE', FAQ: 'FAQ', CONTACT: 'CONTACT' };

export const API_INVICTUS_TOKEN = "wsxiP0Dydmf2TWqjOn1iZk9CfqwxdZBg8w5eQVaTLDWHnTjyvuGAqPBkAiGU";
export const API_INVICTUS_ENDPOINT = "https://api.invictuspay.app.br/api";
export const OFFER_HASH_DEFAULT = "png8aj6v6p"; 
export const CART_STORAGE_KEY = 'nona-pizzeria-cart-v1';
export const USER_STORAGE_KEY = 'nona-pizzeria-user-v1';

// MENU_ITEMS agora começa vazio e é preenchido pelo banco
export let MENU_ITEMS = [];

let renderAppRef = () => console.error("renderApp not initialized");
let triggerToastRef = () => console.warn("Toast not initialized");

export function initRenderAppRef(renderFn, toastFn) {
  renderAppRef = renderFn;
  if(toastFn) triggerToastRef = toastFn;
}

export const appState = {
  currentView: APP_VIEWS.MENU,
  selectedCategory: CATEGORIES.PIZZA,
  customerData: null, 
  lastOrder: null, 
};

// --- DATA LAYER (SUPABASE) ---

export async function initApp() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true);
            
        if (error) throw error;
        
        // Converte snake_case (banco) para camelCase (app)
        MENU_ITEMS = data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category,
            basePrice: p.base_price,
            priceModifiers: p.price_modifiers,
            imageUrl: p.image_url
        }));

        console.log("Menu carregado:", MENU_ITEMS.length, "itens");
        return true;
    } catch (e) {
        console.error("Erro ao carregar menu:", e);
        // Fallback silencioso ou alerta
        return false;
    }
}

export async function createOrder(orderData) {
    // 1. Salva no Supabase
    const { data, error } = await supabase
        .from('orders')
        .insert([{
            customer_data: orderData.customer,
            items: orderData.items,
            total: orderData.total,
            status: 'PENDING',
            created_at: new Date()
        }])
        .select()
        .single();

    if (error) {
        console.error("Erro DB:", error);
        throw error;
    }

    // 2. Inicia escuta em tempo real para este pedido
    subscribeToOrderUpdates(data.id);
    
    return data;
}

function subscribeToOrderUpdates(orderId) {
    supabase
        .channel(`order-${orderId}`)
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
            (payload) => {
                if (payload.new.status === 'PAID') {
                    triggerToastRef("Pagamento confirmado! Iniciando preparo.");
                    if(appState.lastOrder) {
                        appState.lastOrder.status = 'PAID';
                        // Força atualização se estiver na tela de tracking
                        if(appState.currentView === APP_VIEWS.PROFILE) renderAppRef();
                    }
                }
            }
        )
        .subscribe();
}

// --- LOGIC ---

export function navigate(view) {
  appState.currentView = view;
  if (view === APP_VIEWS.MENU) appState.selectedCategory = CATEGORIES.PIZZA;
  renderAppRef();
}

export function setSelectedCategory(category) {
    appState.selectedCategory = category;
    renderAppRef();
}

export function setCustomerData(data) {
    appState.customerData = data;
}

export function confirmOrder(total, dbId = null) {
    appState.lastOrder = {
        id: dbId,
        customer: { ...appState.customerData },
        items: [...CartStore.items],
        total: total,
        date: new Date(),
        status: 'PENDING' 
    };
    CartStore.clearCart();
}

export function saveUserProfile(data) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
    triggerToastRef("Perfil salvo com sucesso!");
}

export function getUserProfile() {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
}

export const CartStore = {
  items: [],
  isCartOpen: false,
  
  updateUI() { renderAppRef(true); },

  init() {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try { this.items = JSON.parse(stored); } 
      catch (e) { this.items = []; }
    }
    this.updateUI(); 
  },

  saveAndRender() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
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
        return { ...item, quantity: newQuantity, totalPrice: unitPrice * newQuantity };
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
