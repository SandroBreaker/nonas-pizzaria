// utils.js
// CONSOLIDATED FILE: Helpers + Invictus API Logic

import { API_INVICTUS_ENDPOINT, API_INVICTUS_TOKEN } from './state.js';

// --- 1. HELPERS ---
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function getIconSVG(iconName, className = '') {
  if (typeof lucide === 'undefined' || !lucide.icons[iconName]) {
    console.warn(`Ícone "${iconName}" não encontrado.`);
    return `<svg class="${className}" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`; 
  }
  
  const iconFunction = lucide.icons[iconName];
  
  // CORREÇÃO: Chamamos a função do ícone (que é o que está em lucide.icons)
  // e usamos .toString() para obter a string SVG.
  if (typeof iconFunction === 'function') {
    return iconFunction({ class: className }).toString();
  }
  
  // Caso de fallback (idealmente nunca deve ser alcançado)
  return ''; 
}

export function maskPhone(value) {
  if (!value) return '';
  value = value.replace(/\D/g, ''); 
  value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); 
  value = value.replace(/(\d)(\d{4})$/, '$1-$2'); 
  return value;
}

export function isValidPhone(phone) {
  const regex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return regex.test(phone);
}

export function maskCPF(value) {
  if (!value) return '';
  value = value.replace(/\D/g, ''); 
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d)/, '$1.$2');
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return value;
}

export function isValidCPF(cpf) {
  if (!cpf) return false;
  cpf = cpf.replace(/[^\d]+/g, ''); 
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false; 
  
  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;

  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;

  if ((remainder === 10) || (remainder === 11)) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

export function maskZip(value) {
  if (!value) return '';
  value = value.replace(/\D/g, ''); 
  value = value.replace(/^(\d{5})(\d)/, '$1-$2');
  return value;
}

export async function fetchAddressByZipCode(zipCode) {
    const cleanZip = zipCode.replace(/\D/g, '');
    if (cleanZip.length !== 8) return null;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
        const data = await response.json();
        if (data.erro) {
            console.error("CEP não encontrado.");
            return null;
        }
        return {
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
        };
    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        return null;
    }
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    if (diffDays === 0) return "hoje";
    if (diffDays === 1) return "ontem";
    return `há ${diffDays} dias`;
  } else {
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }
}

// --- 2. INVICTUS API ---
export async function executeInvictusApi(payload) {
    const path = '/public/v1/transactions';
    const method = 'POST';

    try {
        const response = await fetch(`${API_INVICTUS_ENDPOINT}${path}?api_token=${API_INVICTUS_TOKEN}`, {
            method: method,
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            if (data.payment_method === 'pix' && data.pix && data.pix.pix_qr_code) {
                return { success: true, data: data };
            } else {
                return { success: false, error: "A API não retornou dados de PIX válidos." };
            }
        } else {
            console.error("Erro API Invictus:", data);
            const errorMsg = data.errors ? Object.values(data.errors).flat().join('; ') : (data.message || "Dados inválidos.");
            return { success: false, error: `Erro na API: ${errorMsg}` };
        }

    } catch (error) {
        console.error("Erro de comunicação com o sistema de pagamento:", error);
        return { success: false, error: "Erro de comunicação com o sistema de pagamento." };
    }
}
