// state.js
// --- 1. CONSTANTS ---
export const PIZZA_SIZES = { M: 'M', G: 'G', F: 'F' };
export const CATEGORIES = { PIZZA: 'PIZZA', DRINK: 'BEBIDA', DESSERT: 'SOBREMESA', REVIEW: 'AVALIAÇÕES' };
export const APP_VIEWS = { MENU: 'MENU', CHECKOUT: 'CHECKOUT', SUCCESS: 'SUCCESS', PROFILE: 'PROFILE' };

export const API_INVICTUS_TOKEN = "wsxiP0Dydmf2TWqjOn1iZk9CfqwxdZBg8w5eQVaTLDWHnTjyvuGAqPBkAiGU";
export const API_INVICTUS_ENDPOINT = "https://api.invictuspay.app.br/api";
export const OFFER_HASH_DEFAULT = "png8aj6v6p"; 
export const CART_STORAGE_KEY = 'nona-pizzeria-cart-v1';

export const MENU_ITEMS = [
  // LÓGICA DE PREÇO: O valor aqui é o valor REAL DE VENDA (Promocional).
  // Calabresa
  { id: 1, name: "Calabresa", description: "Mussarela, calabresa fatiada, cebola e azeitonas.", category: CATEGORIES.PIZZA, basePrice: 24.95, priceModifiers: { M: 24.95, G: 34.90, F: 42.90 }, imageUrl: "assets/pizza-calabresa.jpg" },
  // Marguerita
  { id: 2, name: "Marguerita", description: "Mussarela, rodelas de tomate, manjericão fresco e parmesão ralado.", category: CATEGORIES.PIZZA, basePrice: 27.50, priceModifiers: { M: 27.50, G: 38.50, F: 46.50 }, imageUrl: "assets/pizza-marguerita.jpg" },
  // Portuguesa
  { id: 3, name: "Portuguesa", description: "Mussarela, presunto, ovos, cebola, azeitonas e ervilha.", category: CATEGORIES.PIZZA, basePrice: 26.00, priceModifiers: { M: 26.00, G: 36.40, F: 44.00 }, imageUrl: "assets/pizza-portuguesa.jpg" },
  // 4 Queijos
  { id: 4, name: "Quatro Queijos", description: "Mussarela, provolone, gorgonzola e catupiry.", category: CATEGORIES.PIZZA, basePrice: 29.95, priceModifiers: { M: 29.95, G: 41.90, F: 50.90 }, imageUrl: "assets/pizza-queijos.jpg" },
  // Bebidas
  { id: 5, name: "Coca-Cola Lata", description: "Refrigerante clássico (350ml).", category: CATEGORIES.DRINK, basePrice: 3.50, imageUrl: "assets/coca-lata.jpg" },
  { id: 6, name: "Guaraná Antarctica 2L", description: "Refrigerante de Guaraná (2 litros).", category: CATEGORIES.DRINK, basePrice: 7.00, imageUrl: "assets/guarana-2l.jpg" },
  // Sobremesas
  { id: 7, name: "Brownie de Chocolate", description: "Brownie quente com nozes e cobertura de chocolate.", category: CATEGORIES.DESSERT, basePrice: 8.50, imageUrl: "assets/brownie.jpg" },
  { id: 8, name: "Petit Gateau", description: "Bolo de chocolate com recheio cremoso e sorvete de baunilha.", category: CATEGORIES.DESSERT, basePrice: 10.90, imageUrl: "assets/petit-gateau.jpg" },
];

// --- 2. APP STATE ---
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
};

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

// --- 3. CART STORE ---
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
    // Pega o preço já promocional do array MENU_ITEMS
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