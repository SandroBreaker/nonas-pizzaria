// state.js
// CONSOLIDATED FILE: Constants + AppState + CartStore

// --- 1. CONSTANTS ---
export const PIZZA_SIZES = {
  M: 'M', G: 'G', F: 'F',
};

export const CATEGORIES = {
  PIZZA: 'PIZZA', DRINK: 'BEBIDA', DESSERT: 'SOBREMESA', REVIEW: 'AVALIAÇÕES', 
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
  // Preços originais reduzidos em 35% (x 0.65)
  { id: 1, name: "Calabresa", description: "Mussarela, calabresa fatiada, cebola e azeitonas.", category: CATEGORIES.PIZZA, basePrice: 26.00, priceModifiers: { M: 26.00, G: 35.75, F: 44.20 }, imageUrl: "assets/pizza-calabresa.jpg" },
  { id: 2, name: "Marguerita", description: "Mussarela, rodelas de tomate, manjericão fresco e parmesão ralado.", category: CATEGORIES.PIZZA, basePrice: 29.25, priceModifiers: { M: 29.25, G: 39.00, F: 48.75 }, imageUrl: "assets/pizza-marguerita.jpg" },
  { id: 3, name: "Portuguesa", description: "Mussarela, presunto, ovos, cebola, azeitonas e ervilha.", category: CATEGORIES.PIZZA, basePrice: 27.30, priceModifiers: { M: 27.30, G: 37.70, F: 45.50 }, imageUrl: "assets/pizza-portuguesa.jpg" },
  { id: 4, name: "Quatro Queijos", description: "Mussarela, provolone, gorgonzola e catupiry.", category: CATEGORIES.PIZZA, basePrice: 31.20, priceModifiers: { M: 31.20, G: 42.25, F: 52.00 }, imageUrl: "assets/pizza-queijos.jpg" },
  { id: 5, name: "Coca-Cola Lata", description: "Refrigerante clássico (350ml).", category: CATEGORIES.DRINK, basePrice: 3.90, imageUrl: "assets/coca-lata.jpg" },
  { id: 6, name: "Guaraná Antarctica 2L", description: "Refrigerante de Guaraná (2 litros).", category: CATEGORIES.DRINK, basePrice: 7.80, imageUrl: "assets/guarana-2l.jpg" },
  { id: 7, name: "Brownie de Chocolate", description: "Brownie quente com nozes e cobertura de chocolate.", category: CATEGORIES.DESSERT, basePrice: 9.75, imageUrl: "assets/brownie.jpg" },
  { id: 8, name: "Petit Gateau", description: "Bolo de chocolate com recheio cremoso e sorvete de baunilha.", category: CATEGORIES.DESSERT, basePrice: 11.70, imageUrl: "assets/petit-gateau.jpg" },
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
