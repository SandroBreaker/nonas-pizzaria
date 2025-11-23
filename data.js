// data.js

/**
 * UTILS
 */

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(amount);
};

const maskCPF = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const maskPhone = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(\d{4})(\d)/, '$1$2');
};

const maskZip = (value) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2');
};

const isValidCPF = (cpf) => {
  // Simplificação: apenas verifica o formato e tamanho após remover a máscara
  const cleanCpf = cpf.replace(/[^\d]/g, '');
  return cleanCpf.length === 11;
};

const isValidPhone = (phone) => {
  // Simplificação: verifica se tem pelo menos 10 ou 11 dígitos após remover a máscara
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};


/**
 * CONSTANTS
 */

const PIX_KEY_MOCK = '12345678901@pix.com.br';
const CART_STORAGE_KEY = 'nona-pizzeria-cart-v1';

const Category = {
  PIZZA: 'PIZZA',
  DRINK: 'BEBIDA',
  DESSERT: 'SOBREMESA',
};

const PizzaSize = {
  M: 'M', // Média
  G: 'G', // Grande
  F: 'F', // Família
};

const AppView = {
  MENU: 'MENU',
  CHECKOUT: 'CHECKOUT',
  SUCCESS: 'SUCCESS',
};

const MENU_ITEMS = [
  {
    id: 1,
    name: "Calabresa",
    description: "Mussarela, calabresa fatiada, cebola e azeitonas.",
    category: Category.PIZZA,
    basePrice: 40.0,
    priceModifiers: { M: 40.0, G: 55.0, F: 68.0 },
    imageUrl: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Marguerita",
    description: "Mussarela, rodelas de tomate, manjericão fresco e parmesão ralado.",
    category: Category.PIZZA,
    basePrice: 45.0,
    priceModifiers: { M: 45.0, G: 60.0, F: 75.0 },
    imageUrl: "https://images.unsplash.com/photo-1574126154517-d1e0d89ef734?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Portuguesa",
    description: "Mussarela, presunto, ovos, cebola, azeitonas e ervilha.",
    category: Category.PIZZA,
    basePrice: 42.0,
    priceModifiers: { M: 42.0, G: 58.0, F: 70.0 },
    imageUrl: "https://images.unsplash.com/photo-1565299624942-434062d73287?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 4,
    name: "Quatro Queijos",
    description: "Mussarela, provolone, gorgonzola e catupiry.",
    category: Category.PIZZA,
    basePrice: 48.0,
    priceModifiers: { M: 48.0, G: 65.0, F: 80.0 },
    imageUrl: "https://images.unsplash.com/photo-1549480398-31950e3262ce?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 5,
    name: "Coca-Cola Lata",
    description: "Refrigerante clássico (350ml).",
    category: Category.DRINK,
    basePrice: 6.0,
    imageUrl: "https://images.unsplash.com/photo-1553530366-5d6c8e31a0e1?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 6,
    name: "Guaraná Antarctica 2L",
    description: "Refrigerante de Guaraná (2 litros).",
    category: Category.DRINK,
    basePrice: 12.0,
    imageUrl: "https://images.unsplash.com/photo-1543825968-07e5f32a7e78?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 7,
    name: "Brownie de Chocolate",
    description: "Brownie quente com nozes e cobertura de chocolate.",
    category: Category.DESSERT,
    basePrice: 15.0,
    imageUrl: "https://images.unsplash.com/photo-1575971485603-9d8a3d5e2e8e?q=80&w=1920&auto=format&fit=crop"
  },
  {
    id: 8,
    name: "Petit Gateau",
    description: "Bolo de chocolate com recheio cremoso e sorvete de baunilha.",
    category: Category.DESSERT,
    basePrice: 18.0,
    imageUrl: "https://images.unsplash.com/photo-1558231908-410a6245d8b7?q=80&w=1920&auto=format&fit=crop"
  },
];
