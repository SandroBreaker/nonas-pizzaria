// product_seeder.js
// Importe este arquivo APENAS UMA VEZ para popular o banco.
import { supabase, CATEGORIES } from './state.js';

// Lista expandida com +5 itens por categoria
const NEW_PRODUCTS = [
  // --- PIZZAS ---
  { name: "Calabresa", description: "Mussarela, calabresa fatiada, cebola e azeitonas.", category: CATEGORIES.PIZZA, base_price: 24.95, price_modifiers: { M: 24.95, G: 34.90, F: 42.90 }, image_url: "assets/pizza-calabresa.jpg" },
  { name: "Marguerita", description: "Mussarela, rodelas de tomate, manjericão fresco e parmesão ralado.", category: CATEGORIES.PIZZA, base_price: 27.50, price_modifiers: { M: 27.50, G: 38.50, F: 46.50 }, image_url: "assets/pizza-marguerita.jpg" },
  { name: "Portuguesa", description: "Mussarela, presunto, ovos, cebola, azeitonas e ervilha.", category: CATEGORIES.PIZZA, base_price: 26.00, price_modifiers: { M: 26.00, G: 36.40, F: 44.00 }, image_url: "assets/pizza-portuguesa.jpg" },
  { name: "Quatro Queijos", description: "Mussarela, provolone, gorgonzola e catupiry.", category: CATEGORIES.PIZZA, base_price: 29.95, price_modifiers: { M: 29.95, G: 41.90, F: 50.90 }, image_url: "assets/pizza-queijos.jpg" },
  // 5 NOVAS PIZZAS
  { name: "Frango com Catupiry", description: "Frango desfiado temperado coberto com Catupiry original.", category: CATEGORIES.PIZZA, base_price: 28.90, price_modifiers: { M: 28.90, G: 39.90, F: 48.90 }, image_url: "assets/pizza-frango.jpg" },
  { name: "Baiana", description: "Calabresa moída, ovos, pimenta e cebola.", category: CATEGORIES.PIZZA, base_price: 26.50, price_modifiers: { M: 26.50, G: 37.00, F: 45.00 }, image_url: "assets/pizza-baiana.jpg" },
  { name: "Bacon", description: "Mussarela coberta com fatias crocantes de bacon.", category: CATEGORIES.PIZZA, base_price: 29.00, price_modifiers: { M: 29.00, G: 40.00, F: 49.00 }, image_url: "assets/pizza-bacon.jpg" },
  { name: "Napolitana", description: "Mussarela, tomate, parmesão e alho frito.", category: CATEGORIES.PIZZA, base_price: 27.00, price_modifiers: { M: 27.00, G: 38.00, F: 46.00 }, image_url: "assets/pizza-napolitana.jpg" },
  { name: "Peperoni", description: "Mussarela e fatias generosas de salame peperoni.", category: CATEGORIES.PIZZA, base_price: 32.00, price_modifiers: { M: 32.00, G: 44.00, F: 54.00 }, image_url: "assets/pizza-peperoni.jpg" },

  // --- BEBIDAS ---
  { name: "Coca-Cola Lata", description: "Refrigerante clássico (350ml).", category: CATEGORIES.DRINK, base_price: 3.50, image_url: "assets/coca-lata.jpg" },
  { name: "Guaraná Antarctica 2L", description: "Refrigerante de Guaraná (2 litros).", category: CATEGORIES.DRINK, base_price: 7.00, image_url: "assets/guarana-2l.jpg" },
  // 5 NOVAS BEBIDAS
  { name: "Fanta Laranja Lata", description: "Refrigerante de laranja (350ml).", category: CATEGORIES.DRINK, base_price: 3.50, image_url: "assets/fanta.jpg" },
  { name: "Sprite 2L", description: "Refrigerante de limão (2 litros).", category: CATEGORIES.DRINK, base_price: 7.00, image_url: "assets/sprite-2l.jpg" },
  { name: "Suco Del Valle Uva", description: "Suco de uva lata (290ml).", category: CATEGORIES.DRINK, base_price: 4.50, image_url: "assets/suco-uva.jpg" },
  { name: "Água sem Gás", description: "Água mineral 500ml.", category: CATEGORIES.DRINK, base_price: 2.50, image_url: "assets/agua.jpg" },
  { name: "Heineken Long Neck", description: "Cerveja Premium 330ml.", category: CATEGORIES.DRINK, base_price: 9.00, image_url: "assets/heineken.jpg" },

  // --- SOBREMESAS ---
  { name: "Brownie de Chocolate", description: "Brownie quente com nozes e cobertura de chocolate.", category: CATEGORIES.DESSERT, base_price: 8.50, image_url: "assets/brownie.jpg" },
  { name: "Petit Gateau", description: "Bolo de chocolate com recheio cremoso e sorvete de baunilha.", category: CATEGORIES.DESSERT, base_price: 10.90, image_url: "assets/petit-gateau.jpg" },
  // 5 NOVAS SOBREMESAS
  { name: "Pizza Doce Chocolate", description: "Pizza brotinho de chocolate ao leite e granulado.", category: CATEGORIES.DESSERT, base_price: 18.00, image_url: "assets/pizza-doce.jpg" },
  { name: "Churros", description: "Porção de 6 mini churros com doce de leite.", category: CATEGORIES.DESSERT, base_price: 12.00, image_url: "assets/churros.jpg" },
  { name: "Mousse de Maracujá", description: "Mousse caseiro aerado.", category: CATEGORIES.DESSERT, base_price: 7.00, image_url: "assets/mousse.jpg" },
  { name: "Torta de Limão", description: "Fatia de torta de limão com merengue.", category: CATEGORIES.DESSERT, base_price: 9.50, image_url: "assets/torta-limao.jpg" },
  { name: "Sorvete Häagen-Dazs", description: "Pote mini (100ml) sabor Baunilha.", category: CATEGORIES.DESSERT, base_price: 15.00, image_url: "assets/sorvete.jpg" },
];

export async function seedProducts() {
    console.log("Iniciando inserção de produtos no banco...");
    const { error } = await supabase.from('products').insert(NEW_PRODUCTS);
    
    if(error) {
        console.error("Erro ao importar produtos:", error);
        alert("Erro ao importar. Verifique o console.");
    } else {
        console.log("Sucesso! Produtos cadastrados.");
        alert("Produtos cadastrados com sucesso no banco!");
    }
}
