// admin.js
import { supabase, CATEGORIES } from './state.js';
import * as Utils from './utils.js';

// --- I. LÓGICA DO TUTORIAL (Didática) ---
const tutorials = {
    select: {
        desc: "Para listar produtos, usamos o método `.select('*')`. Isso busca todas as colunas da tabela.",
        code: `const { data, error } = await supabase\n  .from('products')\n  .select('*')\n  .order('id', { ascending: false });`
    },
    insert: {
        desc: "Para adicionar, usamos `.insert([objeto])`. O banco gera o ID automaticamente.",
        code: `const { error } = await supabase\n  .from('products')\n  .insert([\n    {\n      name: 'Nova Pizza',\n      base_price: 30.00,\n      category: 'PIZZA',\n      active: true\n    }\n  ]);`
    },
    update: {
        desc: "Para editar, usamos `.update()` e OBRIGATORIAMENTE um `.eq()` para dizer qual ID mudar.",
        code: `const { error } = await supabase\n  .from('products')\n  .update({ name: 'Pizza Editada', base_price: 35.00 })\n  .eq('id', 15); // <--- Muito importante!`
    },
    delete: {
        desc: "Para remover, usamos `.delete()` com `.eq('id', ...)`.",
        code: `const { error } = await supabase\n  .from('products')\n  .delete()\n  .eq('id', 20);`
    }
};

document.getElementById('tutorial-select').addEventListener('change', (e) => {
    const val = e.target.value;
    const display = document.getElementById('tutorial-display');
    const codeEl = document.getElementById('tutorial-code');
    const descEl = document.getElementById('tutorial-desc');

    if (tutorials[val]) {
        display.classList.remove('hidden');
        descEl.innerText = tutorials[val].desc;
        codeEl.innerText = tutorials[val].code;
    } else {
        display.classList.add('hidden');
    }
});

// --- II. LÓGICA DO CRUD (Admin Real) ---

const form = document.getElementById('product-form');
const listContainer = document.getElementById('admin-product-list');
let isEditing = false;

// 1. Função READ (Listar)
async function loadProducts() {
    listContainer.innerHTML = '<div class="text-center py-4">Carregando...</div>';
    
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: false }); // Mais recentes primeiro

    if (error) {
        showToast("Erro ao carregar: " + error.message, 'error');
        return;
    }

    renderList(data);
}

function renderList(products) {
    listContainer.innerHTML = '';
    products.forEach(p => {
        const el = document.createElement('div');
        el.className = 'admin-item';
        el.innerHTML = `
            <div class="item-info">
                <span class="item-name">${p.name}</span>
                <span class="item-cat">${p.category}</span>
                <span class="item-price">R$ ${p.base_price}</span>
            </div>
            <div class="item-actions">
                <button class="btn-icon btn-edit" data-id="${p.id}">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon btn-delete" data-id="${p.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        
        // Botão Editar
        el.querySelector('.btn-edit').addEventListener('click', () => prepareEdit(p));
        // Botão Deletar
        el.querySelector('.btn-delete').addEventListener('click', () => deleteProduct(p.id));
        
        listContainer.appendChild(el);
    });
}

// 2. Função CREATE e UPDATE (Salvar)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-category').value;
    const price = parseFloat(document.getElementById('prod-price').value);
    const desc = document.getElementById('prod-desc').value;
    const img = document.getElementById('prod-img').value || 'assets/pizza-calabresa.jpg';

    // Criação do objeto
    const productData = {
        name: name,
        category: category,
        base_price: price,
        description: desc,
        image_url: img,
        // Se for pizza, cria tamanhos automáticos baseados no preço base
        price_modifiers: category === 'PIZZA' ? {
            M: price,
            G: parseFloat((price * 1.4).toFixed(2)),
            F: parseFloat((price * 1.7).toFixed(2))
        } : null
    };

    let error;

    if (isEditing && id) {
        // UPDATE
        const res = await supabase.from('products').update(productData).eq('id', id);
        error = res.error;
        showToast("Produto atualizado!");
    } else {
        // INSERT
        const res = await supabase.from('products').insert([productData]);
        error = res.error;
        showToast("Produto criado!");
    }

    if (error) {
        console.error(error);
        showToast("Erro ao salvar.", 'error');
    } else {
        resetForm();
        loadProducts();
    }
});

// 3. Função DELETE
async function deleteProduct(id) {
    if(!confirm("Tem certeza que deseja apagar este produto?")) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    
    if (error) showToast("Erro ao deletar.", 'error');
    else {
        showToast("Produto removido.");
        loadProducts();
    }
}

// Auxiliares
function prepareEdit(product) {
    isEditing = true;
    document.getElementById('form-title').innerText = "Editar Produto";
    document.getElementById('btn-cancel').classList.remove('hidden');
    
    document.getElementById('prod-id').value = product.id;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-price').value = product.base_price;
    document.getElementById('prod-desc').value = product.description;
    document.getElementById('prod-img').value = product.image_url;
    
    form.scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    isEditing = false;
    document.getElementById('form-title').innerText = "Novo Produto";
    document.getElementById('btn-cancel').classList.add('hidden');
    form.reset();
    document.getElementById('prod-id').value = '';
}

document.getElementById('btn-cancel').addEventListener('click', resetForm);
document.getElementById('btn-refresh').addEventListener('click', loadProducts);

// Reutilizando Toast do app principal (copie a função se necessário ou importe)
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.borderLeft = type === 'error' ? '4px solid red' : '4px solid green';
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Inicializar
loadProducts();
