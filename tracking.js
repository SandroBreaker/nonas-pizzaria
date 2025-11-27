

import * as Utils from './utils.js';
import * as State from './state.js';

let trackingInterval = null;
let pollingInterval = null; // Nova variável para polling de status

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
    
    // Garante que a assinatura realtime está ativa ao entrar na tela
    if (order) {
        State.subscribeToOrder(order.id);
        startStatusPolling(order.id); // Inicia verificação extra
    }

    const container = document.createElement('div');
    container.className = "profile-container animate-in";

    if (!order || !customer) {
        // Se chamado diretamente sem pedido, mostra estado vazio
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

    const hasProof = customer.paymentProof ? true : false;
    const isPending = order.status === 'PENDING';

    container.innerHTML = `
        <div class="tracking-card">
            <div class="flex justify-between items-center mb-4">
                <h3 class="card-title mb-0">Acompanhar Pedido</h3>
                <button id="btn-force-refresh" class="text-xs bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                    <i class="fa-solid fa-rotate-right"></i> Atualizar Status
                </button>
            </div>
            
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

            <!-- PAYMENT PROOF SECTION -->
            ${isPending ? `
            <div id="proof-section" class="mt-6 pt-4 border-t border-dashed border-gray-200">
                ${hasProof ? `
                    <div class="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-3">
                        ${Utils.getIcon('FileText', 'icon-24 text-blue-500')}
                        <div class="flex-1">
                            <p class="text-sm font-bold text-blue-800">Comprovante Enviado</p>
                            <p class="text-xs text-blue-600">Aguardando validação do atendente.</p>
                        </div>
                        ${Utils.getIcon('Check', 'icon-20 text-blue-500')}
                    </div>
                ` : `
                    <div class="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                        <div class="flex items-start gap-3 mb-3">
                            ${Utils.getIcon('TriangleAlert', 'icon-20 text-yellow-600')}
                            <div>
                                <p class="text-sm font-bold text-yellow-800">Pagamento não identificado?</p>
                                <p class="text-xs text-yellow-700">Se você já fez o PIX, anexe o comprovante abaixo para agilizar.</p>
                            </div>
                        </div>
                        <input type="file" id="proof-upload-input" accept="image/*" class="hidden">
                        <button id="btn-upload-proof" class="w-full bg-white border border-yellow-300 text-yellow-800 hover:bg-yellow-100 font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                            ${Utils.getIcon('Upload', 'icon-14')} Enviar Comprovante
                        </button>
                    </div>
                `}
            </div>
            ` : ''}
            
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

    // Logic for Proof Upload
    if (isPending && !hasProof) {
        const btn = container.querySelector('#btn-upload-proof');
        const input = container.querySelector('#proof-upload-input');
        
        btn.addEventListener('click', () => input.click());
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if(!file) return;
            
            btn.innerHTML = `${Utils.getIcon('LoaderCircle', 'fa-spin')} Enviando...`;
            btn.disabled = true;

            try {
                // Comprime e converte para base64
                const base64 = await Utils.compressImage(file);
                
                // Envia para o estado/banco
                const res = await State.submitPaymentProof(order.id, base64);
                
                if(res.success) {
                    State.triggerToastRef("Comprovante enviado!");
                    State.navigate(State.APP_VIEWS.PROFILE); // Reload view
                } else {
                    alert("Erro ao enviar: " + res.message);
                    btn.innerHTML = 'Tentar Novamente';
                    btn.disabled = false;
                }
            } catch(err) {
                console.error(err);
                alert("Erro ao processar imagem.");
                btn.innerHTML = 'Tentar Novamente';
                btn.disabled = false;
            }
        });
    }
    
    // Logic for Manual Refresh
    container.querySelector('#btn-force-refresh').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const icon = btn.querySelector('i');
        icon.classList.add('fa-spin');
        
        await State.initApp(); // Força recarregar status do banco
        
        setTimeout(() => icon.classList.remove('fa-spin'), 1000);
        State.triggerToastRef("Status atualizado");
    });

    startTrackingLogic(container, order.status);

    return container;
}

// Polling de segurança: a cada 15s verifica se mudou algo no banco
function startStatusPolling(orderId) {
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
        // Apenas verifica silenciosamente
        const savedOrder = localStorage.getItem(State.LAST_ORDER_KEY);
        if (savedOrder) {
            try {
                const localOrder = JSON.parse(savedOrder);
                const { data: freshOrder } = await State.supabase
                    .from('orders')
                    .select('status')
                    .eq('id', localOrder.id)
                    .single();
                
                if (freshOrder && freshOrder.status !== localOrder.status) {
                    // Se mudou e o socket não pegou, força refresh
                    console.log("Polling detectou mudança de status:", freshOrder.status);
                    State.initApp();
                }
            } catch(e) { console.error("Polling error", e); }
        }
    }, 15000);
}

function startTrackingLogic(container, backendStatus) {
    if (trackingInterval) clearInterval(trackingInterval);

    const statusTitle = container.querySelector('#status-title');
    const statusDesc = container.querySelector('#status-desc');
    const statusIcon = container.querySelector('.status-icon-large');
    const progressBar = container.querySelector('#progress-bar-fill');
    const motoMarker = container.querySelector('#moto-icon');
    const timerDisplay = container.querySelector('#delivery-timer');
    
    // Mapeamento REAL do status do banco para a barra de progresso
    let progressPercent = 10;
    
    if (backendStatus === 'PENDING') {
        progressPercent = 10;
        statusTitle.innerText = "Aguardando Pagamento";
        statusDesc.innerText = "Realize o PIX para iniciarmos.";
        statusIcon.innerHTML = Utils.getIcon('Clock', 'icon-48 text-yellow');
    } else if (backendStatus === 'PAID') {
        progressPercent = 25;
        statusTitle.innerText = "Pagamento Confirmado";
        statusDesc.innerText = "Pedido enviado para a cozinha.";
        statusIcon.innerHTML = Utils.getIcon('CheckCircle2', 'icon-48 text-green');
    } else if (backendStatus === 'PREPARING') {
        progressPercent = 50;
        statusTitle.innerText = "Preparando seu Pedido";
        statusDesc.innerText = "A pizza está no forno!";
        statusIcon.innerHTML = Utils.getIcon('Pizza', 'icon-48 text-orange');
    } else if (backendStatus === 'DELIVERY') {
        progressPercent = 80;
        statusTitle.innerText = "Saiu para Entrega";
        statusDesc.innerText = "O motoboy está a caminho.";
        statusIcon.innerHTML = Utils.getIcon('Motorcycle', 'icon-48 text-primary');
        timerDisplay.classList.remove('hidden');
    } else if (backendStatus === 'COMPLETED') {
        progressPercent = 100;
        statusTitle.innerText = "Pedido Entregue";
        statusDesc.innerText = "Bom apetite!";
        statusIcon.innerHTML = Utils.getIcon('Home', 'icon-48 text-green');
        timerDisplay.classList.add('hidden');
    }

    // Anima a barra suavemente até a porcentagem do status real
    setTimeout(() => {
        progressBar.style.width = `${progressPercent}%`;
        motoMarker.style.left = `${progressPercent}%`;
    }, 100);
}
