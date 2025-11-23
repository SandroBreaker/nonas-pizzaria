// tracking.js
import * as Utils from './utils.js';
import * as State from './state.js';

let trackingInterval = null;

const TRACKING_STAGES = [
    { id: 1, label: "Recebido", icon: "CheckCircle2", timeTrigger: 0 },
    { id: 2, label: "Preparando", icon: "Pizza", timeTrigger: 2 }, 
    { id: 3, label: "Saiu para Entrega", icon: "Home", timeTrigger: 4 }, 
    { id: 4, label: "A Caminho", icon: "Motorcycle", timeTrigger: 5 },
    { id: 5, label: "Ocorrência", icon: "TriangleAlert", timeTrigger: 999 } 
];

export function renderProfileView() {
    const order = State.appState.lastOrder;
    const customer = State.appState.customerData || (order ? order.customer : null);
    
    const container = document.createElement('div');
    container.className = "profile-container animate-in";

    if (!order || !customer) {
        container.innerHTML = `
            <div class="empty-state">
                ${Utils.getIcon('User', 'icon-64 text-muted')}
                <h3>Nenhum pedido ativo</h3>
                <button id="back-menu-profile" class="btn-primary mt-4">Fazer Pedido</button>
            </div>
        `;
        setTimeout(() => {
             container.querySelector('#back-menu-profile')?.addEventListener('click', () => State.navigate(State.APP_VIEWS.MENU));
        }, 0);
        return container;
    }

    container.innerHTML = `
        <div class="profile-header">
            <div class="user-info">
                <div class="avatar-circle">${customer.fullName.charAt(0)}</div>
                <div>
                    <h2 class="text-xl font-bold">${customer.fullName}</h2>
                    <p class="text-sm text-stone-500">${customer.phone}</p>
                </div>
            </div>
        </div>

        <div class="tracking-card">
            <h3 class="card-title mb-4">Acompanhar Pedido</h3>
            
            <div class="timeline-wrapper">
                <div class="progress-bar-bg"></div>
                <div id="progress-bar-fill" class="progress-bar-fill" style="width: 0%"></div>
                <div id="moto-icon" class="moto-marker" style="left: 0%">
                    ${Utils.getIcon('Motorcycle', 'text-primary icon-24')}
                </div>
            </div>

            <div id="status-display" class="status-display">
                <div class="status-icon-large pulse">
                    ${Utils.getIcon('CheckCircle2', 'icon-48 text-green')}
                </div>
                <div class="text-center mt-2">
                    <h4 id="status-title" class="text-lg font-bold">Pedido Recebido</h4>
                    <p id="status-desc" class="text-sm text-stone-500">Aguardando confirmação da cozinha.</p>
                    <p id="delivery-timer" class="delivery-timer hidden">
                        ${Utils.getIcon('Clock', 'icon-14')} Chegada em: <span>40 min</span>
                    </p>
                </div>
            </div>
            
            <div id="accident-alert" class="accident-box hidden">
                ${Utils.getIcon('TriangleAlert', 'icon-24 text-red')}
                <div>
                    <strong>Ocorrência com o entregador</strong>
                    <p class="text-sm">Houve um imprevisto. Por favor, entre em contato conosco.</p>
                    <button class="btn-whatsapp mt-2">
                         ${Utils.getIcon('MessageSquare', 'icon-14')} Chamar no WhatsApp
                    </button>
                </div>
            </div>
        </div>

        <div class="order-summary-card">
             <h3 class="card-title mb-2">Resumo do Pedido</h3>
             <p class="text-xs text-stone-400 mb-4">Realizado em ${Utils.formatDate(order.date)}</p>
             <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-row">
                        <span class="qty-badge">${item.quantity}x</span>
                        <span class="flex-1">${item.product.name} ${item.size ? `(${item.size})` : ''}</span>
                        <span class="font-bold">${Utils.formatCurrency(item.totalPrice)}</span>
                    </div>
                `).join('')}
             </div>
             <div class="order-total pt-4 mt-4 border-t border-gray-100 flex justify-between">
                <span>Total</span>
                <span class="text-xl font-bold text-primary">${Utils.formatCurrency(order.total)}</span>
             </div>
             <div class="address-box mt-4">
                <strong>Entrega em:</strong>
                <p>${customer.address.street}, ${customer.address.number}</p>
                <p>${customer.address.neighborhood}</p>
             </div>
        </div>
    `;

    startTrackingLogic(container);

    return container;
}

function startTrackingLogic(container) {
    if (trackingInterval) clearInterval(trackingInterval);

    const startTime = Date.now();
    const statusTitle = container.querySelector('#status-title');
    const statusDesc = container.querySelector('#status-desc');
    const statusIcon = container.querySelector('.status-icon-large');
    const progressBar = container.querySelector('#progress-bar-fill');
    const motoMarker = container.querySelector('#moto-icon');
    const timerDisplay = container.querySelector('#delivery-timer');
    const accidentBox = container.querySelector('#accident-alert');
    const statusDisplay = container.querySelector('#status-display');

    const FIVE_MINUTES = 5 * 60 * 1000; 
    const TWENTY_MINUTES = 20 * 60 * 1000; 
    const FORTY_MINUTES = 40 * 60 * 1000;

    const FACTOR = 1; 

    trackingInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) * FACTOR;
        
        let currentStageIdx = 0;
        let progressPercent = 0;

        if (elapsed < (2 * 60 * 1000)) {
            currentStageIdx = 0;
            progressPercent = 10;
        } else if (elapsed < (4 * 60 * 1000)) {
            currentStageIdx = 1;
            statusTitle.innerText = "Preparando seu Pedido";
            statusDesc.innerText = "A cozinha já está trabalhando.";
            statusIcon.innerHTML = Utils.getIcon('Pizza', 'icon-48 text-yellow');
            progressPercent = 30;
        } else if (elapsed < FIVE_MINUTES) {
            currentStageIdx = 2;
            statusTitle.innerText = "Saiu para Entrega";
            statusDesc.innerText = "O motoboy retirou seu pedido.";
            statusIcon.innerHTML = Utils.getIcon('Home', 'icon-48 text-primary');
            progressPercent = 50;
        } else {
            currentStageIdx = 3;
            timerDisplay.classList.remove('hidden');
            
            const timeInDelivery = elapsed - FIVE_MINUTES;
            const totalDeliveryTime = FORTY_MINUTES;
            const remainingTime = Math.max(0, totalDeliveryTime - timeInDelivery);
            
            const deliveryProgress = Math.min(1, timeInDelivery / (TWENTY_MINUTES)); 
            progressPercent = 50 + (deliveryProgress * 40); 

            const minsLeft = Math.ceil(remainingTime / 60000);
            timerDisplay.querySelector('span').innerText = `${minsLeft} min`;

            statusTitle.innerText = "Pedido a Caminho";
            statusDesc.innerText = "O entregador está indo até você.";
            statusIcon.innerHTML = Utils.getIcon('Motorcycle', 'icon-48 text-primary');

            if (timeInDelivery >= TWENTY_MINUTES) {
                clearInterval(trackingInterval);
                progressPercent = 90;
                
                statusDisplay.classList.add('hidden');
                accidentBox.classList.remove('hidden');
                accidentBox.classList.add('animate-shake'); 
                
                progressBar.style.backgroundColor = 'var(--color-error)';
                motoMarker.innerHTML = Utils.getIcon('TriangleAlert', 'text-red icon-24');
            }
        }

        progressBar.style.width = `${progressPercent}%`;
        motoMarker.style.left = `${progressPercent}%`;

    }, 1000);
}
