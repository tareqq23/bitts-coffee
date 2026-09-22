/**
 * BITTS Coffee - Menu Data Service
 * 
 * Modul ini dirancang agar siap dihubungkan langsung ke REST API backend Anda di masa mendatang!
 * Ketika backend Anda sudah siap:
 * 1. Ubah USE_REMOTE_API menjadi true
 * 2. Masukkan endpoint URL backend Anda pada API_ENDPOINT (misal: 'https://api.bittscoffee.com/api/menu' atau '/api/menu')
 */

const CONFIG = {
  // Ubah ke true jika backend API sudah siap
  USE_REMOTE_API: false,
  API_ENDPOINT: '/api/menu',
  // Nomor WhatsApp admin BITTS Coffee (Format internasional tanpa +, contoh: 628xxxxxxxxxx)
  WHATSAPP_NUMBER: '6285179929290'
};

// Data cadangan / mock data bawaan jika belum terhubung ke database backend
const FALLBACK_MENU = [
  {
    id: "c1",
    name: "BITTS Signature Palm Sugar Latte",
    category: "coffee",
    categoryName: "Coffee",
    price: 22000,
    description: "Perpaduan espresso arabica-robusta khas BITTS dengan susu segar creamy dan gula aren murni organik.",
    badge: "Best Seller",
    image: "assets/images/menu-coffee.jpg",
    tags: ["signature", "iced", "sweet"],
    isAvailable: true
  },
  {
    id: "c2",
    name: "Bitter & Sweet Espresso Tonic",
    category: "coffee",
    categoryName: "Coffee",
    price: 25000,
    description: "Signature mocktail: double shot espresso berpadu dengan sparkling tonic water dan sentuhan citrus lemon segar.",
    badge: "Signature",
    image: "assets/images/menu-drink.jpg",
    tags: ["signature", "refreshing", "cold"],
    isAvailable: true
  },
  {
    id: "c3",
    name: "Classic Hot Cappuccino",
    category: "coffee",
    categoryName: "Coffee",
    price: 24000,
    description: "Espresso seimbang dengan steamed milk berbusa lembut dan taburan cocoa powder aromatik.",
    badge: "Favorite",
    image: "assets/images/hero-coffee.jpg",
    tags: ["hot", "classic"],
    isAvailable: true
  },
  {
    id: "c4",
    name: "Manual Brew V60 Single Origin",
    category: "coffee",
    categoryName: "Coffee",
    price: 28000,
    description: "Seduhan manual biji kopi lokal Nusantara pilihan dengan tasting notes floral, fruity, dan acidity seimbang.",
    badge: "Artisan",
    image: "assets/images/menu-coffee.jpg",
    tags: ["hot", "filter"],
    isAvailable: true
  },
  {
    id: "c5",
    name: "Americano Pandeglang Mist",
    category: "coffee",
    categoryName: "Coffee",
    price: 20000,
    description: "Ekstraksi double espresso murni dengan air mineral segar, nikmat disajikan panas maupun dingin.",
    badge: "",
    image: "assets/images/menu-coffee.jpg",
    tags: ["classic", "bold"],
    isAvailable: true
  },
  {
    id: "c6",
    name: "Caramel Macchiato",
    category: "coffee",
    categoryName: "Coffee",
    price: 26000,
    description: "Layered espresso dengan vanilla syrup, fresh milk dingin, dan topping saus karamel legit.",
    badge: "",
    image: "assets/images/menu-drink.jpg",
    tags: ["sweet", "creamy"],
    isAvailable: true
  },
  {
    id: "nc1",
    name: "Kyoto Ceremonial Matcha Latte",
    category: "non-coffee",
    categoryName: "Non-Coffee",
    price: 25000,
    description: "Matcha autentik kualitas premium dipadukan dengan fresh milk lembut, earthy dan comforting.",
    badge: "Best Seller",
    image: "assets/images/menu-drink.jpg",
    tags: ["signature", "sweet", "japanese"],
    isAvailable: true
  },
  {
    id: "nc2",
    name: "Artisan Earl Grey Berry Tea",
    category: "non-coffee",
    categoryName: "Non-Coffee",
    price: 22000,
    description: "Seduhan teh hitam bergamot aromatik dipadukan dengan sari buah beri segar dan irisan lemon.",
    badge: "Refreshing",
    image: "assets/images/menu-drink.jpg",
    tags: ["tea", "fruity"],
    isAvailable: true
  },
  {
    id: "nc3",
    name: "Dark Belgian Chocolate Velvet",
    category: "non-coffee",
    categoryName: "Non-Coffee",
    price: 24000,
    description: "Cokelat Belgia pekat dengan rasa pahit-manis mewah, disajikan dingin atau panas sesuai selera.",
    badge: "Favorite",
    image: "assets/images/menu-drink.jpg",
    tags: ["chocolate", "rich"],
    isAvailable: true
  },
  {
    id: "f1",
    name: "Truffle Chicken Pesto Panini",
    category: "food",
    categoryName: "Meals & Food",
    price: 35000,
    description: "Roti sourdough panggang isi dada ayam panggang, pesto kemangi gurih, keju leleh, dan sentuhan minyak truffle.",
    badge: "Chef's Choice",
    image: "assets/images/menu-food.jpg",
    tags: ["savory", "signature", "lunch"],
    isAvailable: true
  },
  {
    id: "f2",
    name: "BITTS Creamy Truffle Carbonara",
    category: "food",
    categoryName: "Meals & Food",
    price: 38000,
    description: "Spaghetti al dente dengan saus kuning telur gurih, smoked beef renyah, dan parmesan melimpah.",
    badge: "Favorite",
    image: "assets/images/menu-food.jpg",
    tags: ["pasta", "creamy"],
    isAvailable: true
  },
  {
    id: "f3",
    name: "Crispy Sambal Matah Rice Bowl",
    category: "food",
    categoryName: "Meals & Food",
    price: 32000,
    description: "Nasi hangat dengan ayam fillet renyah bumbu rempah dan sambal matah khas Bali yang wangi dan pedas segar.",
    badge: "",
    image: "assets/images/menu-food.jpg",
    tags: ["spicy", "asian"],
    isAvailable: true
  },
  {
    id: "f4",
    name: "Garlic Parmesan Truffle Fries",
    category: "food",
    categoryName: "Meals & Food",
    price: 22000,
    description: "Kentang goreng renyah dengan seasoning bawang putih, truffle oil, keju parmesan parut, dan dipping aioli.",
    badge: "Snack",
    image: "assets/images/menu-food.jpg",
    tags: ["snack", "savory"],
    isAvailable: true
  },
  {
    id: "d1",
    name: "Basque Burnt Cheesecake",
    category: "dessert",
    categoryName: "Dessert & Pastry",
    price: 28000,
    description: "Kue keju panggang Spanyol bertekstur lembut lumer di mulut dengan lapisan karamelisasi khas di atasnya.",
    badge: "Best Seller",
    image: "assets/images/menu-dessert.jpg",
    tags: ["sweets", "signature"],
    isAvailable: true
  },
  {
    id: "d2",
    name: "Artisan French Butter Croissant",
    category: "dessert",
    categoryName: "Dessert & Pastry",
    price: 22000,
    description: "Croissant klasik dengan lipatan butter Prancis berlapis-lapis, renyah di luar dan lembut di dalam.",
    badge: "Freshly Baked",
    image: "assets/images/menu-croissant.jpg",
    tags: ["pastry", "breakfast"],
    isAvailable: true
  },
  {
    id: "d3",
    name: "Pain au Chocolat Gourmand",
    category: "dessert",
    categoryName: "Dessert & Pastry",
    price: 24000,
    description: "Pastry renyah bermentega berisi dua batang cokelat hitam leleh yang nikmat dinikmati bersama kopi.",
    badge: "",
    image: "assets/images/menu-croissant.jpg",
    tags: ["pastry", "chocolate"],
    isAvailable: true
  },
  {
    id: "d4",
    name: "Glazed Cinnamon Roll with Cream Cheese",
    category: "dessert",
    categoryName: "Dessert & Pastry",
    price: 25000,
    description: "Roti kayu manis aromatik empuk disiram cream cheese frosting manis gurih yang memanjakan lidah.",
    badge: "Favorite",
    image: "assets/images/menu-dessert.jpg",
    tags: ["sweets", "warm"],
    isAvailable: true
  }
];

export async function fetchMenuItems() {
  if (CONFIG.USE_REMOTE_API) {
    try {
      const response = await fetch(CONFIG.API_ENDPOINT);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      return Array.isArray(data) ? data : (data.items || FALLBACK_MENU);
    } catch (err) {
      console.warn("Gagal memuat menu dari backend API, menggunakan data lokal:", err);
      return FALLBACK_MENU;
    }
  }

  // Jika menyajikan dari data/menu.json via fetch lokal
  try {
    const res = await fetch('data/menu.json');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // Jalur fallback langsung jika dijalankan via file:// protokol langsung tanpa web server
  }

  return FALLBACK_MENU;
}

export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace('IDR', 'Rp');
}

export function createWhatsAppOrderLink(item, customerNotes = '') {
  const basePhone = CONFIG.WHATSAPP_NUMBER;
  let message = `Halo Admin BITTS Coffee! 👋\n\nSaya ingin memesan menu berikut:\n• *${item.name}* (${formatRupiah(item.price)})`;
  
  if (customerNotes && customerNotes.trim()) {
    message += `\n• Catatan: ${customerNotes.trim()}`;
  }
  
  message += `\n\nMohon info ketersediaan dan total pembayarannya ya. Terima kasih! 🙏✨`;
  
  return `https://wa.me/${basePhone}?text=${encodeURIComponent(message)}`;
}

export { CONFIG };
