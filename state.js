// state.js
// CONSOLIDATED FILE: Constants + AppState + CartStore

// --- 1. CONSTANTS ---
export const PIZZA_SIZES = {
  M: 'M', G: 'G', F: 'F',
};

export const CATEGORIES = {
  PIZZA: 'PIZZA', DRINK: 'BEBIDA', DESSERT: 'SOBREMESA',
};

export const APP_VIEWS = {
  MENU: 'MENU', CHECKOUT: 'CHECKOUT', SUCCESS: 'SUCCESS',
};

export const API_INVICTUS_TOKEN = "wsxiP0Dydmf2TWqjOn1iZk9CfqwxdZBg8w5eQVaTLDWHnTjyvuGAqPBkAiGU";
export const API_INVICTUS_ENDPOINT = "https://api.invictuspay.app.br/api";
export const OFFER_HASH_DEFAULT = "png8aj6v6p"; 
export const PIX_KEY_MOCK = '12345678901@pix.com.br'; 
export const CART_STORAGE_KEY = 'nona-pizzeria-cart-v1';

export const MENU_ITEMS = [
  { id: 1, name: "Calabresa", description: "Mussarela, calabresa fatiada, cebola e azeitonas.", category: CATEGORIES.PIZZA, basePrice: 40.0, priceModifiers: { M: 40.0, G: 55.0, F: 68.0 }, imageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1920&auto=format&fit=crop" },
  { id: 2, name: "Marguerita", description: "Mussarela, rodelas de tomate, manjericão fresco e parmesão ralado.", category: CATEGORIES.PIZZA, basePrice: 45.0, priceModifiers: { M: 45.0, G: 60.0, F: 75.0 }, imageUrl: "https://images.unsplash.com/photo-1574126154517-d1e0d89ef734?q=80&w=1920&auto=format&fit=crop" },
  { id: 3, name: "Portuguesa", description: "Mussarela, presunto, ovos, cebola, azeitonas e ervilha.", category: CATEGORIES.PIZZA, basePrice: 42.0, priceModifiers: { M: 42.0, G: 58.0, F: 70.0 }, imageUrl: "https://images.unsplash.com/photo-1565299624942-434062d73287?q=80&w=1920&auto=format&fit=crop" },
  { id: 4, name: "Quatro Queijos", description: "Mussarela, provolone, gorgonzola e catupiry.", category: CATEGORIES.PIZZA, basePrice: 48.0, priceModifiers: { M: 48.0, G: 65.0, F: 80.0 }, imageUrl: "https://images.unsplash.com/photo-1549480398-31950e3262ce?q=80&w=1920&auto=format&fit=crop" },
  { id: 5, name: "Coca-Cola Lata", description: "Refrigerante clássico (350ml).", category: CATEGORIES.DRINK, basePrice: 6.0, imageUrl: "https://images.unsplash.com/photo-1553530366-5d6c8e31a0e1?q=80&w=1920&auto=format&fit=crop" },
  { id: 6, name: "Guaraná Antarctica 2L", description: "Refrigerante de Guaraná (2 litros).", category: CATEGORIES.DRINK, basePrice: 12.0, imageUrl: "https://images.unsplash.com/photo-1543825968-07e5f32a7e78?q=80&w=1920&auto=format&fit=crop" },
  { id: 7, name: "Brownie de Chocolate", description: "Brownie quente com nozes e cobertura de chocolate.", category: CATEGORIES.DESSERT, basePrice: 15.0, imageUrl: "https://images.unsplash.com/photo-1575971485603-9d8a3d5e2e8e?q=80&w=1920&auto=format&fit=crop" },
  { id: 8, name: "Petit Gateau", description: "Bolo de chocolate com recheio cremoso e sorvete de baunilha.", category: CATEGORIES.DESSERT, basePrice: 18.0, imageUrl: "https://images.unsplash.com/photo-1558231908-410a6245d8b7?q=80&w=1920&auto=format&fit=crop" },
];


// --- 2. APP STATE (Funções de navegação) ---
let renderAppRef = () => console.error("renderApp not initialized");

export function initRenderAppRef(ref) {
  renderAppRef = ref;
}

export const appState = {
  currentView: APP_VIEWS.MENU,
  selectedCategory: CATEGORIES.PIZZA,
  customerData: null,
};

export function navigate(view) {
  appState.currentView = view;
  if (view === APP_VIEWS.MENU) {
      appState.selectedCategory = CATEGORIES.PIZZA;
  }
  renderAppRef();
}

export function setSelectedCategory(category) {
    appState.selectedCategory = category;
    renderAppRef();
}

export function setCustomerData(data) {
    appState.customerData = data;
}


// --- 3. CART STORE ---
export const CartStore = {
  items: [],
  isCartOpen: false,
  
  updateUI() {
    renderAppRef(true); // Passa true para onlyCartUpdate
  },

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
    this.updateUI(); 
    
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

  saveAndRender() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items));
    this.updateUI();
  },

  get cartTotal() {
    return this.items.reduce((acc, item) => acc + item.totalPrice, 0);
  },

  get itemsCount() {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  },

  addItem(product, size) {
    const isPizza = product.category === CATEGORIES.PIZZA;
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

    this.isCartOpen = true; 
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
