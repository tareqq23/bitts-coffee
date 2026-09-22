/**
 * BITTS COFFEE - MENU MANAGER & STORAGE SERVICE
 * Mengelola penyimpanan menu secara independen (LocalStorage + Default Seed + Import/Export JSON).
 * Siap sinkron otomatis antara halaman publik (index.html) dan portal pengelola (admin.html).
 */

const STORAGE_KEY = 'bitts_menu_items_v2';
const WHATSAPP_NUMBER = '6285179929290';

// Seed default menu berkualitas tinggi
export const DEFAULT_MENU = [
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
    name: "Caramel Macchiato Velvet",
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
  }
];

/**
 * Mengambil semua menu dari LocalStorage atau default seed
 */
export function getStoredMenus() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading localStorage:", e);
  }
  
  // Jika belum ada di LocalStorage, inisialisasi dengan DEFAULT_MENU
  saveMenusToStorage(DEFAULT_MENU);
  return DEFAULT_MENU;
}

/**
 * Menyimpan array menu ke LocalStorage
 */
export function saveMenusToStorage(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    // Trigger custom event agar tab atau window lain langsung tahu ada perubahan data
    window.dispatchEvent(new CustomEvent('bitts_menu_changed', { detail: items }));
    return true;
  } catch (e) {
    console.error("Error saving to localStorage:", e);
    return false;
  }
}

/**
 * Menambahkan Menu Baru (Create)
 */
export function addMenu(newItem) {
  const current = getStoredMenus();
  const id = 'menu_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  const created = {
    id,
    name: newItem.name.trim(),
    category: newItem.category || 'coffee',
    categoryName: getCategoryLabel(newItem.category),
    price: Number(newItem.price) || 0,
    description: newItem.description ? newItem.description.trim() : '',
    badge: newItem.badge ? newItem.badge.trim() : '',
    image: newItem.image || 'assets/images/menu-coffee.jpg',
    tags: newItem.tags || [],
    isAvailable: newItem.isAvailable !== false
  };

  current.unshift(created); // Letakkan paling atas
  saveMenusToStorage(current);
  return created;
}

/**
 * Mengubah Menu (Update)
 */
export function updateMenu(id, updateData) {
  const current = getStoredMenus();
  const index = current.findIndex(item => item.id === id);
  if (index === -1) return null;

  current[index] = {
    ...current[index],
    ...updateData,
    categoryName: updateData.category ? getCategoryLabel(updateData.category) : current[index].categoryName
  };

  saveMenusToStorage(current);
  return current[index];
}

/**
 * Menghapus Menu (Delete)
 */
export function deleteMenu(id) {
  const current = getStoredMenus();
  const filtered = current.filter(item => item.id !== id);
  saveMenusToStorage(filtered);
  return filtered;
}

/**
 * Reset kembali ke Menu Bawaan Pabrik
 */
export function resetMenuDefaults() {
  saveMenusToStorage(DEFAULT_MENU);
  return DEFAULT_MENU;
}

/**
 * Ekspor Data sebagai file JSON yang bisa diunduh
 */
export function exportMenuJSON() {
  const data = getStoredMenus();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bitts-coffee-menu-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Impor Data dari String JSON
 */
export function importMenuJSON(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      saveMenusToStorage(parsed);
      return { success: true, count: parsed.length };
    }
    return { success: false, error: 'Format JSON bukan array menu yang valid' };
  } catch (e) {
    return { success: false, error: e.message };
  }
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
  let message = `Halo Admin BITTS Coffee! 👋\n\nSaya ingin memesan:\n• *${item.name}* (${formatRupiah(item.price)})`;
  if (customerNotes && customerNotes.trim()) {
    message += `\n• Catatan: ${customerNotes.trim()}`;
  }
  message += `\n\nMohon konfirmasi ketersediaan dan total pembayarannya ya. Terima kasih! ☕✨`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getCategoryLabel(cat) {
  switch (cat) {
    case 'coffee': return 'Coffee';
    case 'non-coffee': return 'Non-Coffee';
    case 'food': return 'Meals & Food';
    case 'dessert': return 'Dessert & Pastry';
    default: return 'Specialty';
  }
}
