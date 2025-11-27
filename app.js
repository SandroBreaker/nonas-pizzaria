
import * as State from './state.js';
import * as Views from './views.js';
import * as Components from './components.js';

// --- I. CORE CONTROLLER LOGIC ---

export function renderApp(onlyCartUpdate = false) {
  Components.updateHeaderUI();
  Components.updateCartUI();
  Components.renderFooter(); 

  if (onlyCartUpdate) return;
  
  const mainContent = document.getElementById('main-content');
  
  if (State.MENU_ITEMS.length === 0 && State.appState.currentView === State.APP_VIEWS.MENU) {
      // return; 
  }

  mainContent.innerHTML = ''; 
  
  let newContent;
  switch (State.appState.currentView) {
    case State.APP_VIEWS.LOGIN:
      newContent = Views.renderLogin();
      break;
    case State.APP_VIEWS.CHECKOUT:
      newContent = Views.renderCustomerForm('CHECKOUT');
      break;
    case State.APP_VIEWS.SUCCESS:
      newContent = Views.renderPixPayment();
      break;
    case State.APP_VIEWS.PROFILE:
      newContent = Views.renderProfileRouter();
      break;
    case State.APP_VIEWS.FAQ:
      newContent = Views.renderFAQ();
      break;
    case State.APP_VIEWS.CONTACT:
      newContent = Views.renderContact();
      break;
    case State.APP_VIEWS.MENU:
    default:
      newContent = Views.renderMenu();
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

// --- II. INITIALIZATION ---

document.addEventListener('DOMContentLoaded', async () => {
    State.initRenderAppRef(renderApp, Components.showToast);
    
    // Inicialização Assíncrona do Banco de Dados
    await State.initApp();
    
    // Remove o loader
    const loader = document.getElementById('app-loader');
    if(loader) loader.remove();

    State.CartStore.init();

    Components.startCountdown();
    Components.startSalesPop();

    // --- EVENT LISTENERS GLOBAIS ---
    
    document.getElementById('nav-to-menu-logo').addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
    const navBtn = document.getElementById('nav-to-menu-btn');
    if(navBtn) navBtn.addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
    
    const loginBtn = document.getElementById('login-nav-btn');
    if(loginBtn) {
        loginBtn.addEventListener('click', () => {
            State.navigate(State.APP_VIEWS.PROFILE); 
        });
    }
    
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
                State.navigate(State.APP_VIEWS.LOGIN);
            }
        });
    }

    renderApp();
});
