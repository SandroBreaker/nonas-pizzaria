

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
    'Edit': 'fa-pen-to-square',
    'Upload': 'fa-upload',
    'FileText': 'fa-file-lines',
    // New Social Icons
    'Instagram': 'fa-brands fa-instagram',
    'Facebook': 'fa-brands fa-facebook',
    'Whatsapp': 'fa-brands fa-whatsapp'
  };

  // Se o ícone já tiver "fa-brands", não adiciona "fa-solid"
  const isBrand = iconMap[iconName] && iconMap[iconName].includes('fa-brands');
  const faClass = iconMap[iconName] || 'fa-solid fa-circle-question'; 
  
  // Se for brand, retorna direto, senão prefixa com fa-solid (compatibilidade com lógica anterior)
  let fullClass = faClass;
  if (!isBrand && !faClass.includes('fa-')) {
      fullClass = `fa-solid ${faClass}`;
  } else if (!isBrand && !faClass.includes('fa-brands')) {
       // Mantém lógica antiga para os ícones que só retornavam o nome (ex: fa-cart-shopping)
       // MAS meu iconMap acima já retorna as classes completas em alguns casos novos? 
       // Vamos simplificar: se no map não tem espaço, assume que é só o sufixo do solid.
       if(!faClass.includes(' ')) fullClass = `fa-solid ${faClass}`;
  }

  const extraClass = iconName === 'LoaderCircle' ? 'fa-spin' : '';

  return `<i class="${fullClass} ${extraClass} ${className}"></i>`;
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

// --- FUNÇÃO DE CEP COM FALLBACK (ROBUSTA) ---
export async function fetchAddressByZipCode(zipCode) {
    const cleanZip = zipCode.replace(/\D/g, '');
    if (cleanZip.length !== 8) return null;

    // Tentativa 1: ViaCEP
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanZip}/json/`);
        if (!response.ok) throw new Error('ViaCEP error');
        
        const data = await response.json();
        if (data.erro) return null; // CEP não existe

        return {
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            complement: data.complemento 
        };
    } catch (error) {
        console.warn("ViaCEP falhou ou indisponível. Tentando OpenCEP...", error);
        
        // Tentativa 2: OpenCEP (Fallback)
        try {
            const response2 = await fetch(`https://opencep.com/v1/${cleanZip}`);
            if (!response2.ok) throw new Error('OpenCEP error');

            const data2 = await response2.json();
            return {
                street: data2.logradouro,
                neighborhood: data2.bairro,
                city: data2.localidade,
                state: data2.uf,
                complement: data2.complemento
            };
        } catch (error2) {
            console.error("Todas as APIs de CEP falharam.", error2);
            return null;
        }
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

// --- NOTIFICAÇÕES (Browser API) ---
export async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return Notification.permission === 'granted';
}

export function sendSystemNotification(title, body) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
        try {
             new Notification(title, {
                body: body,
                icon: 'assets/pizza-icon-32x32.png', // Fallback icon path
                vibrate: [200, 100, 200]
            });
        } catch (e) {
            console.warn("Notificação falhou:", e);
        }
    }
}

// --- IMAGEM COMPRESSION (Para comprovantes) ---
export function compressImage(file, maxWidth = 800, quality = 0.6) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Retorna Base64 JPEG comprimido
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}