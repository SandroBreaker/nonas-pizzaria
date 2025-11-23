// utils.js
import { API_INVICTUS_ENDPOINT, API_INVICTUS_TOKEN } from './state.js';

export function getIcon(iconName, className = '') {
  const iconMap = {
    'ShoppingCart': 'fa-cart-shopping',
    'UtensilsCrossed': 'fa-utensils',
    'X': 'fa-xmark',
    'ShoppingBag': 'fa-bag-shopping',
    'Trash2': 'fa-trash-can',
    'Minus': 'fa-minus',
    'Plus': 'fa-plus',
    'Star': 'fa-star', 
    'StarFill': 'fa-star',
    'MessageSquare': 'fa-comment',
    'Camera': 'fa-camera',
    'Pizza': 'fa-pizza-slice',
    'ChevronLeft': 'fa-chevron-left',
    'User': 'fa-user',
    'MapPin': 'fa-map-location-dot',
    'CreditCard': 'fa-credit-card',
    'LoaderCircle': 'fa-circle-notch', 
    'XCircle': 'fa-circle-xmark',
    'CheckCircle2': 'fa-circle-check',
    'Check': 'fa-check',
    'Copy': 'fa-copy',
    'Home': 'fa-house',
    'Motorcycle': 'fa-motorcycle',
    'Clock': 'fa-clock',
    'TriangleAlert': 'fa-triangle-exclamation',
    'Question': 'fa-circle-question',
    'Phone': 'fa-phone',
    'Save': 'fa-floppy-disk',
    'Edit': 'fa-pen-to-square'
  };

  const faClass = iconMap[iconName] || 'fa-circle-question'; 
  const extraClass = iconName === 'LoaderCircle' ? 'fa-spin' : '';

  return `<i class="fa-solid ${faClass} ${extraClass} ${className}"></i>`;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    if (diffDays === 0 || diffDays === 1) return "hoje"; 
    if (diffDays === 2) return "ontem";
    return `há ${diffDays} dias`;
  }
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
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
  
  let sum = 0, remainder;
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
        return data.erro ? null : {
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            complement: data.complemento 
        };
    } catch (error) {
        console.error("Erro CEP:", error);
        return null;
    }
}

export async function executeInvictusApi(payload) {
    const path = '/public/v1/transactions';
    try {
        const response = await fetch(`${API_INVICTUS_ENDPOINT}${path}?api_token=${API_INVICTUS_TOKEN}`, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (response.ok) {
            if (data.payment_method === 'pix' || (data.pix && data.pix.pix_qr_code)) {
                return { success: true, data: data };
            }
            return { success: true, data: data };
        }
        
        const errorMsg = data.errors 
            ? Object.values(data.errors).flat().join('; ') 
            : (data.message || "Erro desconhecido na API.");
            
        return { success: false, error: `Erro na API: ${errorMsg}` };
        
    } catch (error) {
        console.error("Erro Network:", error);
        return { success: false, error: "Erro de comunicação com o sistema de pagamento. Verifique sua internet." };
    }
}
