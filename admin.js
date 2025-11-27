
import { supabase } from './state.js';

// ============================================================
// LÓGICA MOBILE MENU & NAVEGAÇÃO
// ============================================================
const mobileBtn = document.getElementById('mobile-menu-btn');
const sidebar = document.getElementById('admin-sidebar');

if(mobileBtn && sidebar) {
    mobileBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        const icon = mobileBtn.querySelector('i');
        if (sidebar.classList.contains('open')) {
            icon.classList.replace('fa-bars', 'fa-xmark');
        } else {
            icon.classList.replace('fa-xmark', 'fa-bars');
        }
    });
}

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Fecha menu mobile
        if(window.innerWidth <= 1024 && sidebar) {
            sidebar.classList.remove('open');
            mobileBtn.querySelector('i').classList.replace('fa-xmark', 'fa-bars');
        }

        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const tab = e.currentTarget.dataset.tab;
        document.querySelectorAll('.admin-view').forEach(v => v.classList.add('hidden'));
        document.getElementById(`view-${tab}`).classList.remove('hidden');

        if (tab === 'orders') loadOrders();
        if (tab === 'products') loadProducts();
        if (tab === 'customers') loadCustomers();
        if (tab === 'config') loadConfig();
    });
});

// Inicializa
loadOrders();

// ============================================================
// 1. PEDIDOS (ORDERS)
// ============================================================

window.updateStatus = async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) {
        showToast("Erro ao atualizar status", 'error');
        console.error(error);
    } else {
        showToast("Status atualizado!");
        loadOrders();
    }
};

async function loadOrders() {
    const listPending = document.getElementById('list-pending');
    const listActive = document.getElementById('list-active');
    const listCompleted = document.getElementById('list-completed');

    [listPending, listActive, listCompleted].forEach(el => el.innerHTML = '<div class="text-center p-4"><i class="fa-solid fa-circle-notch fa-spin"></i></div>');

    const { data: orders, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    [listPending, listActive, listCompleted].forEach(el => el.innerHTML = '');

    orders.forEach(order => {
        const card = createOrderCard(order);
        if (['PENDING', 'PAID'].includes(order.status)) listPending.appendChild(card);
        else if (['PREPARING', 'DELIVERY'].includes(order.status)) listActive.appendChild(card);
        else listCompleted.appendChild(card);
    });
}

function createOrderCard(order) {
    const el = document.createElement('div');
    el.className = `order-card status-${order.status}`;
    
    let customer, items;
    try {
        customer = typeof order.customer_data === 'string' ? JSON.parse(order.customer_data) : order.customer_data;
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch (e) {
        customer = { fullName: "Erro", address: { street: "" } };
        items = [];
    }
    
    const itemsDesc = Array.isArray(items) 
        ? items.map(i => `${i.quantity}x ${i.product.name}`).join(', ')
        : 'Itens indisponíveis';

    let actionsHtml = '';
    if (order.status === 'PENDING') actionsHtml += `<button class="btn-xs btn-advance" onclick="updateStatus('${order.id}', 'PAID')">Pago</button>`;
    if (order.status === 'PAID') actionsHtml += `<button class="btn-xs btn-advance" onclick="updateStatus('${order.id}', 'PREPARING')">Preparar</button>`;
    if (order.status === 'PREPARING') actionsHtml += `<button class="btn-xs btn-advance" onclick="updateStatus('${order.id}', 'DELIVERY')">Entrega</button>`;
    if (order.status === 'DELIVERY') actionsHtml += `<button class="btn-xs btn-advance bg-green-100 text-green-700" onclick="updateStatus('${order.id}', 'COMPLETED')">Concluir</button>`;

    let proofHtml = '';
    if (customer && customer.paymentProof) {
        proofHtml = `
            <button onclick="viewProof('${order.id}')" class="w-full mt-2 text-xs bg-blue-50 text-blue-600 border border-blue-200 py-1 rounded flex items-center justify-center gap-1 hover:bg-blue-100">
                <i class="fa-solid fa-file-invoice"></i> Ver Comprovante
            </button>
        `;
        window[`proof_${order.id}`] = customer.paymentProof;
    }

    el.innerHTML = `
        <div class="order-header">
            <span>#${order.id.slice(0, 6)}</span>
            <span>${new Date(order.created_at).toLocaleTimeString().slice(0,5)}</span>
        </div>
        <div class="order-customer">${customer?.fullName || 'Cliente'}</div>
        <div class="text-xs text-gray-500 mb-2">${customer?.address?.street || ''}</div>
        <div class="order-items">${itemsDesc}</div>
        <div class="flex justify-between items-center mt-2">
            <span class="font-bold text-sm">R$ ${order.total}</span>
            <span class="text-xs font-bold px-2 py-1 rounded bg-gray-100">${order.status}</span>
        </div>
        ${proofHtml}
        <div class="order-actions">${actionsHtml}</div>
    `;

    return el;
}

window.viewProof = (orderId) => {
    const base64 = window[`proof_${orderId}`];
    if(base64) {
        const win = window.open("");
        win.document.write(`<img src="${base64}" style="max-width:100%; margin: 20px auto; display:block;" />`);
    } else alert("Erro ao abrir comprovante.");
};

document.getElementById('refresh-orders').addEventListener('click', loadOrders);


// ============================================================
// 2. PRODUTOS (PRODUCTS) - CRUD
// ============================================================
const formProd = document.getElementById('product-form');
let isEditingProd = false;
let allProducts = [];

async function loadProducts() {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '<tr><td colspan="5" class="text-center p-4">Carregando...</td></tr>';
    
    const { data, error } = await supabase.from('products').select('*').order('name', { ascending: true });
    if(error) {
        list.innerHTML = '<tr><td colspan="5" class="text-center text-red-500">Erro.</td></tr>';
        return;
    }
    
    allProducts = data;
    renderProductTable(allProducts);
}

function renderProductTable(products) {
    const list = document.getElementById('admin-product-list');
    list.innerHTML = '';
    
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.image_url || 'assets/pizza-icon-32x32.png'}" class="prod-thumb"></td>
            <td class="font-bold text-sm text-gray-700">${p.name}</td>
            <td><span class="text-xs bg-gray-100 px-2 py-1 rounded">${p.category}</span></td>
            <td class="font-mono text-sm">R$ ${p.base_price}</td>
            <td>
                <div class="action-cell">
                    <button class="btn-xs btn-edit" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&#39;")})'><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-xs btn-delete" onclick="deleteProd('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        list.appendChild(tr);
    });
}

// SEARCH FILTER
document.getElementById('search-product').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    renderProductTable(filtered);
});

// GLOBAL SCOPE FOR HTML CLICK
window.editProduct = (p) => {
    isEditingProd = true;
    document.getElementById('form-title').innerText = "Editar Produto";
    document.getElementById('btn-cancel').classList.remove('hidden');
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-category').value = p.category;
    document.getElementById('prod-price').value = p.base_price;
    document.getElementById('prod-desc').value = p.description;
    document.getElementById('prod-img').value = p.image_url;
    document.querySelector('.products-layout').scrollIntoView({ behavior: 'smooth' });
};

window.deleteProd = async (id) => {
    if(!confirm("Apagar produto?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if(error) showToast("Erro ao apagar", 'error');
    else {
        showToast("Produto removido");
        loadProducts();
    }
};

formProd.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-category').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const desc = document.getElementById('prod-desc').value;
    const img = document.getElementById('prod-img').value;

    const payload = {
        name, category, base_price: price, description: desc, image_url: img,
        price_modifiers: category === 'PIZZA' ? { M: price, G: parseFloat((price * 1.4).toFixed(2)), F: parseFloat((price * 1.7).toFixed(2)) } : null
    };

    let error;
    if (isEditingProd && id) {
        const res = await supabase.from('products').update(payload).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('products').insert([payload]);
        error = res.error;
    }

    if (!error) {
        showToast("Produto Salvo!");
        resetFormProd();
        loadProducts();
    } else {
        showToast("Erro: " + error.message, 'error');
    }
});

function resetFormProd() {
    isEditingProd = false;
    document.getElementById('form-title').innerText = "Novo Produto";
    document.getElementById('btn-cancel').classList.add('hidden');
    formProd.reset();
    document.getElementById('prod-id').value = '';
}
document.getElementById('btn-cancel').addEventListener('click', resetFormProd);


// ============================================================
// 3. CLIENTES & CONFIG (Mantido Igual)
// ============================================================
// ... (Código de Clientes e Config já existente, apenas re-renderizado pelo HTML atualizado)
// Recopiando lógica para garantir funcionamento no arquivo novo:

const formCust = document.getElementById('customer-form');
let isEditingCust = false;

window.prepareNewCustomer = () => {
    resetFormCust();
    document.getElementById('customer-form-container').classList.remove('hidden');
};

window.closeCustomerForm = () => {
    document.getElementById('customer-form-container').classList.add('hidden');
};

async function loadCustomers() {
    const tbody = document.getElementById('customer-list-body');
    tbody.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
    const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
    if(error) return;
    tbody.innerHTML = '';
    data.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><div class="font-bold">${c.full_name || 'Sem nome'}</div><div class="text-xs text-gray-500">${c.email || ''}</div></td>
            <td>${c.phone || '-'}</td>
            <td>${c.cpf || '-'}</td>
            <td><button class="btn-xs btn-advance" onclick='editCust(${JSON.stringify(c)})'><i class="fa-solid fa-pen"></i></button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.editCust = (c) => {
    isEditingCust = true;
    document.getElementById('customer-form-container').classList.remove('hidden');
    document.getElementById('cust-form-title').innerText = "Editar Cliente";
    document.getElementById('cust-id').value = c.id;
    document.getElementById('cust-name').value = c.full_name || '';
    document.getElementById('cust-cpf').value = c.cpf || '';
    document.getElementById('cust-phone').value = c.phone || '';
    document.getElementById('cust-email').value = c.email || '';
};

formCust.addEventListener('submit', async (e) => {
    e.preventDefault();
    // Lógica igual ao anterior
    const id = document.getElementById('cust-id').value;
    const payload = {
        full_name: document.getElementById('cust-name').value,
        cpf: document.getElementById('cust-cpf').value,
        phone: document.getElementById('cust-phone').value,
        email: document.getElementById('cust-email').value,
        updated_at: new Date()
    };
    let error;
    if (isEditingCust && id) error = (await supabase.from('profiles').update(payload).eq('id', id)).error;
    else error = (await supabase.from('profiles').insert([payload])).error;

    if (!error) { showToast("Salvo!"); closeCustomerForm(); loadCustomers(); }
});

function resetFormCust() {
    isEditingCust = false;
    document.getElementById('cust-form-title').innerText = "Novo Cliente";
    formCust.reset();
    document.getElementById('cust-id').value = '';
}

async function loadConfig() {
    const { data } = await supabase.from('store_config').select('*').single();
    if(!data) return;
    document.getElementById('conf-open').checked = data.is_open;
    document.getElementById('store-status-text').innerText = data.is_open ? "Loja Aberta" : "Loja Fechada";
    document.getElementById('conf-fee').value = data.delivery_fee;
    document.getElementById('conf-promo').value = data.promo_message || '';
    document.getElementById('conf-open').onchange = (e) => {
        document.getElementById('store-status-text').innerText = e.target.checked ? "Loja Aberta" : "Loja Fechada";
    };
}
document.getElementById('config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('store_config').update({
        is_open: document.getElementById('conf-open').checked,
        delivery_fee: parseFloat(document.getElementById('conf-fee').value),
        promo_message: document.getElementById('conf-promo').value
    }).eq('id', 1);
    if (!error) showToast("Configurações salvas!");
});

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast'; t.innerText = msg;
    if(type === 'error') t.style.borderLeft = '4px solid #ef4444';
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
