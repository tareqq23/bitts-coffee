/**
 * BITTS Coffee CMS Studio
 * Comprehensive Admin Engine for REST API + Full CMS Management
 */

import { formatRupiah, DEFAULT_MENU } from './menuManager.js';
import { apiFetch, requireUser } from './supabaseClient.js';

let currentItems = [];
let currentCmsData = {};
let searchQuery = '';
let selectedCategory = 'all';
let deleteCandidateId = null;

// ── Auth Helper ──
function authHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

function handleUnauthorized() {
  window.location.href = '/admin-login.html';
  return true;
}

function normalizeInstagramUrl(value) {
  const input = String(value || '').trim();
  if (!input) return '';
  const urlMatch = input.match(/instagram\.com\/(?:https?:\/\/(?:www\.)?instagram\.com\/)?([^\/?#]+)/i);
  const handle = urlMatch ? urlMatch[1] : input.replace(/^@+/, '').replace(/^\/+|\/+$/g, '');
  return `https://www.instagram.com/${handle}/`;
}

function normalizeInstagramHandle(value) {
  const url = normalizeInstagramUrl(value);
  const match = url.match(/instagram\.com\/([^/]+)/i);
  return match ? match[1] : '';
}

// Helper: Show Toast Notification
function showToast(message, isError = false) {
  const toast = document.getElementById('toastNotification');
  const text = document.getElementById('toastMessage');
  if (!toast || !text) return;

  text.textContent = message;
  toast.className = 'toast-notify active' + (isError ? ' error' : '');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('active');
  }, 3500);
}

// Convert File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// Upload Image to /api/upload
async function uploadImageToServer(file) {
  const base64 = await fileToBase64(file);
  const res = await apiFetch('/api/upload', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      dataUrl: base64,
      fileName: file.name
    })
  });
  const data = await res.json();
  if (res.status === 401) { handleUnauthorized(data); return ''; }
  if (!data.success) throw new Error(data.error || 'Gagal mengunggah gambar');
  return data.url;
}

document.addEventListener('DOMContentLoaded', () => {
  requireUser().then(user => {
    if (!user) window.location.replace('/admin-login.html');
  });
  initTabs();
  loadAllData();
  setupMenuListeners();
  setupCmsForms();
  setupBackupTab();
  setupSettingsTab();
});

/* ══════════════════════════════════════════════════════════
   1. TABS MANAGEMENT
   ══════════════════════════════════════════════════════════ */
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-nav-btn');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');

      // Refresh media if tab opened
      if (targetId === 'tab-media') loadMediaGallery();
    });
  });
}

/* ══════════════════════════════════════════════════════════
   2. DATA LOADING & STATS
   ══════════════════════════════════════════════════════════ */
async function loadAllData() {
  const user = await requireUser();
  if (!user) {
    window.location.replace('/admin-login.html');
    return;
  }
  await loadMenuData();
  await loadCmsData(); // CMS data must load first — testimoni & settings depend on it
}

async function loadMenuData() {
  try {
    const res = await apiFetch('/api/menu');
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      currentItems = result.data;
      if (result.source === 'local-backup') {
        // Replace demo/default rows with the existing custom menu backup once.
        const existingItems = await apiFetch('/api/menu', { preferDatabase: true });
        const existingResult = await existingItems.json();
        if (!existingItems.ok) throw new Error(existingResult.error || 'Tidak dapat membaca menu Supabase.');
        const databaseItems = existingResult.source === 'supabase' ? existingResult.data : [];
        if (result.removeDefault) {
          for (const item of databaseItems) {
            if (!item.id) continue;
            const deleteRes = await apiFetch(`/api/menu/${item.id}`, { method: 'DELETE', headers: authHeaders() });
            if (!deleteRes.ok) {
              const deleteResult = await deleteRes.json();
              throw new Error(deleteResult.error || 'Menu demo tidak dapat dihapus. Periksa policy RLS.');
            }
          }
        }
        const seeded = [];
        for (const item of currentItems) {
          const createRes = await apiFetch('/api/menu', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(item)
          });
          const created = await createRes.json();
          if (!createRes.ok || !created.data) {
            throw new Error(created.error || `Menu "${item.name}" gagal dipindahkan ke Supabase.`);
          }
          seeded.push(created.data);
        }
        if (seeded.length === currentItems.length) currentItems = seeded;
      }
    }
  } catch (err) {
    console.warn('API menu offline, fallback to localStorage', err);
    showToast(err.message || 'Migrasi menu gagal. Periksa policy Supabase.', true);
    try {
      const local = localStorage.getItem('bitts_menu_items_v2');
      if (local) currentItems = JSON.parse(local);
    } catch (_) {}
  }
  updateStats();
  updateCategoryFilter(); // Update filter dropdown dengan kategori terkini (termasuk kustom)
  renderTable();
}

async function loadCmsData() {
  try {
    const res = await apiFetch('/api/cms');
    const result = await res.json();
    if (result.success && result.data) {
      currentCmsData = result.data;
      populateCmsForms(currentCmsData);
      populateSettingsForms(currentCmsData);
      if (result.source === 'local-backup') {
        const seedRes = await apiFetch('/api/cms', {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(currentCmsData)
        });
        const seedResult = await seedRes.json();
        if (!seedRes.ok || !seedResult.success) {
          throw new Error(seedResult.error || 'CMS lokal gagal dipindahkan ke Supabase.');
        }
        currentCmsData = seedResult.data;
      }
    }
  } catch (err) {
    console.error('Failed to load CMS from API:', err);
  }
}

function updateStats() {
  const total = currentItems.length;
  const ready = currentItems.filter(i => i.isAvailable !== false).length;
  const soldOut = currentItems.filter(i => i.isAvailable === false).length;
  const categories = new Set(currentItems.map(i => (i.category || '').toLowerCase().trim()).filter(Boolean)).size;

  const elTotal = document.getElementById('statTotal');
  const elReady = document.getElementById('statReady');
  const elSoldOut = document.getElementById('statSoldOut');
  const elCategories = document.getElementById('statCategories');

  if (elTotal) elTotal.textContent = total;
  if (elReady) elReady.textContent = ready;
  if (elSoldOut) elSoldOut.textContent = soldOut;
  if (elCategories) elCategories.textContent = categories;
}

/**
 * Populate the category filter dropdown dynamically from all
 * unique categories currently in the menu data, including custom ones.
 */
function updateCategoryFilter() {
  const catFilter = document.getElementById('adminCategoryFilter');
  if (!catFilter) return;

  // Collect unique categories from current data
  const uniqueCategories = [...new Set(currentItems.map(i => i.category).filter(Boolean))].sort();

  // Preserve known labels for built-in categories
  const knownLabels = {
    'coffee':       'Coffee',
    'non-coffee':   'Non-Coffee',
    'snack':        'Snack & Camilan',
    'Snack':        'Snack & Camilan',
    'food':         'Meals & Food',
    'pastry':       'Pastry & Sweets',
    'kopi-literan': 'Kopi Literan',
    'seasonal':     'Minuman Seasonal',
    'coldbrew':     'Cold Brew',
    'signature':    'Signature Series',
  };

  const currentVal = catFilter.value; // preserve selected value

  // Rebuild options
  catFilter.innerHTML = '<option value="all">Semua Kategori</option>';
  uniqueCategories.forEach(cat => {
    const label = knownLabels[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' '));
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = label;
    catFilter.appendChild(opt);
  });

  // Restore previous selection if still valid
  if (currentVal && [...catFilter.options].some(o => o.value === currentVal)) {
    catFilter.value = currentVal;
  }
}

/* ══════════════════════════════════════════════════════════
   3. MENU TABLE & ACTIONS
   ══════════════════════════════════════════════════════════ */
function renderTable() {
  const tbody = document.getElementById('menuTableBody');
  if (!tbody) return;

  const filtered = currentItems.filter(item => {
    const itemCat = (item.category || '').toLowerCase();
    const targetCat = (selectedCategory || '').toLowerCase();
    const matchCat = (selectedCategory === 'all') || (itemCat === targetCat);
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 48px; color: #888;">
          Tidak ada menu yang sesuai dengan filter atau kata kunci.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => `
    <tr data-id="${item.id}">
      <td>
        <img src="${item.image}" alt="${item.name}" class="item-thumb" onerror="this.src='assets/images/menu-coffee.jpg'">
      </td>
      <td>
        <div class="item-name-cell">${item.name}</div>
        <div class="item-desc-cell">${item.description || '-'}</div>
      </td>
      <td>
        <span class="category-tag">${item.categoryName || item.category}</span>
      </td>
      <td>
        <span class="price-tag">${formatRupiah(item.price)}</span>
      </td>
      <td>
        ${item.badge ? `<span class="badge-tag">${item.badge}</span>` : '<span style="color:#888;">-</span>'}
      </td>
      <td>
        <div class="status-switch ${item.isAvailable ? 'available' : 'sold-out'}" onclick="window.toggleAvailability('${item.id}')" title="Klik untuk ubah status">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:currentColor;"></span>
          ${item.isAvailable ? 'Tersedia' : 'Habis'}
        </div>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-icon-action" onclick="window.openEditModal('${item.id}')" title="Ubah Menu & Foto">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-icon-action delete" onclick="window.openDeleteModal('${item.id}')" title="Hapus Menu">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Global actions exposed for inline click handlers
window.toggleAvailability = async function(id) {
  try {
    const res = await apiFetch(`/api/menu/${id}/availability`, {
      method: 'PATCH',
      headers: authHeaders()
    });
    const data = await res.json();
    if (res.status === 401) { handleUnauthorized(data); return; }
    if (data.success) {
      const item = currentItems.find(m => m.id === id);
      if (item) item.isAvailable = data.isAvailable;
      renderTable();
      showToast(`Status ketersediaan berhasil diubah ke: ${data.isAvailable ? 'Tersedia' : 'Habis'}`);
    }
  } catch (err) {
    showToast('Gagal mengubah status ketersediaan', true);
  }
};

window.openEditModal = function(id) {
  const item = currentItems.find(m => m.id === id);
  if (!item) return;

  document.getElementById('menuId').value = item.id;
  document.getElementById('menuName').value = item.name;
  // Works for both <input> and <select> elements
  document.getElementById('menuCategory').value = item.category;
  document.getElementById('menuPrice').value = item.price;
  document.getElementById('menuBadge').value = item.badge || '';
  document.getElementById('menuStatus').value = item.isAvailable ? 'true' : 'false';
  document.getElementById('menuDesc').value = item.description || '';
  document.getElementById('menuImage').value = item.image || '';
  document.getElementById('imagePreview').src = item.image || 'assets/images/menu-coffee.jpg';

  document.getElementById('formModalTitle').textContent = 'Ubah Data Menu';
  document.getElementById('menuFormModal').classList.add('active');
};

window.openDeleteModal = function(id) {
  const item = currentItems.find(m => m.id === id);
  if (!item) return;
  deleteCandidateId = id;
  document.getElementById('deleteItemName').textContent = item.name;
  document.getElementById('deleteConfirmModal').classList.add('active');
};

function setupMenuListeners() {
  // Search & Category
  const searchInput = document.getElementById('adminSearchInput');
  const catFilter = document.getElementById('adminCategoryFilter');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderTable();
    });
  }
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      selectedCategory = e.target.value;
      renderTable();
    });
  }

  // Quick refresh
  const refreshBtn = document.getElementById('quickRefreshMenuBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadMenuData();
      showToast('Katalog menu berhasil dimuat ulang!');
    });
  }

  // Open Add Modal
  const openAddBtn = document.getElementById('openAddModalBtn');
  const formModal = document.getElementById('menuFormModal');
  if (openAddBtn) {
    openAddBtn.addEventListener('click', () => {
      document.getElementById('menuItemForm').reset();
      document.getElementById('menuId').value = '';
      document.getElementById('imagePreview').src = 'assets/images/menu-coffee.jpg';
      document.getElementById('menuImage').value = 'assets/images/menu-coffee.jpg';
      document.getElementById('formModalTitle').textContent = 'Tambah Menu Baru';
      formModal.classList.add('active');
    });
  }

  // Close modals
  const closeForm = () => formModal.classList.remove('active');
  const closeDelete = () => document.getElementById('deleteConfirmModal').classList.remove('active');

  document.getElementById('closeFormModalBtn')?.addEventListener('click', closeForm);
  document.getElementById('cancelFormBtn')?.addEventListener('click', closeForm);
  document.getElementById('closeDeleteModalBtn')?.addEventListener('click', closeDelete);
  document.getElementById('cancelDeleteBtn')?.addEventListener('click', closeDelete);

  // Form submit (Add or Edit)
  const menuForm = document.getElementById('menuItemForm');
  if (menuForm) {
    menuForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('menuId').value;
      const rawCategory = document.getElementById('menuCategory').value.trim();
      // Derive a display-friendly categoryName from the raw category slug
      const categoryName = rawCategory
        ? rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).replace(/-/g, ' ')
        : rawCategory;
      const payload = {
        name: document.getElementById('menuName').value.trim(),
        category: rawCategory,
        categoryName,
        price: Number(document.getElementById('menuPrice').value) || 0,
        badge: document.getElementById('menuBadge').value.trim(),
        isAvailable: document.getElementById('menuStatus').value === 'true',
        description: document.getElementById('menuDesc').value.trim(),
        image: document.getElementById('menuImage').value.trim() || 'assets/images/menu-coffee.jpg'
      };

      try {
        let res;
        if (id) {
          // Update
          res = await apiFetch(`/api/menu/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload)
          });
        } else {
          // Add new
          res = await apiFetch('/api/menu', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
          });
        }

        const data = await res.json();
        if (data.success) {
          closeForm();
          await loadMenuData();
          showToast(id ? 'Menu berhasil diperbarui!' : 'Menu baru berhasil ditambahkan!');
        } else {
          showToast(data.error || 'Gagal menyimpan menu', true);
        }
      } catch (err) {
        showToast('Koneksi ke backend gagal: ' + err.message, true);
      }
    });
  }

  // Delete Confirm
  document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!deleteCandidateId) return;
    try {
      const res = await apiFetch(`/api/menu/${deleteCandidateId}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (res.status === 401) { handleUnauthorized(data); return; }
      if (data.success) {
        closeDelete();
        await loadMenuData();
        showToast('Menu berhasil dihapus dari katalog!');
      } else {
        showToast(data.error || 'Gagal menghapus menu', true);
      }
    } catch (err) {
      showToast('Koneksi ke backend gagal: ' + err.message, true);
    }
  });

  // Modal Image upload handling
  const imageFileInput = document.getElementById('imageFileInput');
  const menuImageInput = document.getElementById('menuImage');
  const imagePreview = document.getElementById('imagePreview');

  if (imageFileInput) {
    imageFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast('Mengunggah gambar ke server...');
        const uploadedUrl = await uploadImageToServer(file);
        menuImageInput.value = uploadedUrl;
        imagePreview.src = uploadedUrl;
        showToast('Gambar berhasil diunggah!');
      } catch (err) {
        showToast('Gagal unggah gambar: ' + err.message, true);
      }
    });
  }

  if (menuImageInput) {
    menuImageInput.addEventListener('input', (e) => {
      imagePreview.src = e.target.value || 'assets/images/menu-coffee.jpg';
    });
  }
}

/* ══════════════════════════════════════════════════════════
   4. CMS FORMS (HERO, STORY, LOCATION)
   ══════════════════════════════════════════════════════════ */
function populateCmsForms(cms) {
  if (!cms) return;

  // Hero form
  if (cms.storeInfo) {
    const s = cms.storeInfo;
    const b = document.getElementById('heroBadgeInput');
    const t = document.getElementById('heroTitleInput');
    const d = document.getElementById('heroDescInput');
    const img = document.getElementById('heroImageInput');
    const prev = document.getElementById('heroImagePreview');
    if (b) b.value = s.heroBadge || '';
    if (t) t.value = s.slogan || '';
    if (d) d.value = s.description || '';
    if (img) img.value = s.heroImage || '';
    if (prev) prev.src = s.heroImage || 'assets/images/hero-coffee.jpg';

    const ctaP = document.getElementById('heroCtaPrimaryInput');
    const ctaS = document.getElementById('heroCtaSecondaryInput');
    if (ctaP) ctaP.value = s.heroCtaPrimary || '';
    if (ctaS) ctaS.value = s.heroCtaSecondary || '';
  }

  if (cms.sanctuary) {
    const sn = cms.sanctuary;
    const st = document.getElementById('sanctuaryTitleInput');
    const sd = document.getElementById('sanctuaryDescInput');
    const am = document.getElementById('amenitiesInput');
    if (st) st.value = sn.title || '';
    if (sd) sd.value = sn.desc || '';
    if (am) am.value = Array.isArray(sn.amenities) ? sn.amenities.join(', ') : '';
  }

  // Story form
  if (cms.story) {
    const st = cms.story;
    const tag = document.getElementById('storyTagInput');
    const tit = document.getElementById('storyTitleInput');
    const lead = document.getElementById('storyLeadInput');
    const p1 = document.getElementById('storyP1Input');
    const p2 = document.getElementById('storyP2Input');
    const q = document.getElementById('storyQuoteInput');
    if (tag) tag.value = st.tag || '';
    if (tit) tit.value = st.title || '';
    if (lead) lead.value = st.lead || '';
    if (p1) p1.value = st.p1 || '';
    if (p2) p2.value = st.p2 || '';
    if (q) q.value = st.quote || '';
  }

  // Location & Contact form
  if (cms.contact) {
    const c = cms.contact;
    const addr = document.getElementById('contactAddressInput');
    const wa = document.getElementById('contactWaInput');
    const waDisp = document.getElementById('contactWaDisplayInput');
    const ig = document.getElementById('contactIgInput');
    const maps = document.getElementById('contactMapsUrlInput');
    const embed = document.getElementById('contactMapsEmbedInput');
    if (addr) addr.value = c.address || '';
    if (wa) wa.value = c.whatsapp || '';
    if (waDisp) waDisp.value = c.whatsappDisplay || '';
    if (ig) ig.value = c.instagram || '';
    if (maps) maps.value = c.mapsUrl || '';
    if (embed) embed.value = c.mapsEmbed || '';
  }

  if (cms.hours) {
    const h = cms.hours;
    const hw = document.getElementById('hoursWeekdayInput');
    const hwe = document.getElementById('hoursWeekendInput');
    const hwo = document.getElementById('hoursWeekdayOpenInput');
    const hwc = document.getElementById('hoursWeekdayCloseInput');
    const hweo = document.getElementById('hoursWeekendOpenInput');
    const hwec = document.getElementById('hoursWeekendCloseInput');
    if (hw) hw.value = h.weekday || '';
    if (hwe) hwe.value = h.weekend || '';
    if (hwo) hwo.value = h.weekdayOpen || '08:00';
    if (hwc) hwc.value = h.weekdayClose || '22:00';
    if (hweo) hweo.value = h.weekendOpen || '08:00';
    if (hwec) hwec.value = h.weekendClose || '23:00';
  }
}

function setupCmsForms() {
  // Hero Image upload
  const heroImageInput = document.getElementById('heroImageInput');
  const heroImagePreview = document.getElementById('heroImagePreview');
  const heroImageUploadBtn = document.getElementById('heroImageUploadBtn');
  const heroImageFileInput = document.getElementById('heroImageFileInput');

  if (heroImageUploadBtn && heroImageFileInput) {
    heroImageUploadBtn.addEventListener('click', () => heroImageFileInput.click());
    heroImageFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        showToast('Mengunggah gambar hero...');
        const url = await uploadImageToServer(file);
        heroImageInput.value = url;
        heroImagePreview.src = url;
        showToast('Gambar hero berhasil diunggah!');
      } catch (err) {
        showToast('Gagal unggah foto hero: ' + err.message, true);
      }
    });
  }

  if (heroImageInput) {
    heroImageInput.addEventListener('input', (e) => {
      heroImagePreview.src = e.target.value;
    });
  }

  // Submit: Hero & Beranda
  const heroForm = document.getElementById('cmsHeroForm');
  if (heroForm) {
    heroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const amenitiesArr = (document.getElementById('amenitiesInput').value || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const payload = {
        storeInfo: {
          ...currentCmsData.storeInfo,
          heroBadge: document.getElementById('heroBadgeInput').value.trim(),
          slogan: document.getElementById('heroTitleInput').value.trim(),
          description: document.getElementById('heroDescInput').value.trim(),
          heroImage: document.getElementById('heroImageInput').value.trim(),
          heroCtaPrimary: (document.getElementById('heroCtaPrimaryInput')?.value || '').trim() || 'Jelajahi Menu',
          heroCtaSecondary: (document.getElementById('heroCtaSecondaryInput')?.value || '').trim() || 'Chat via WhatsApp'
        },
        sanctuary: {
          title: document.getElementById('sanctuaryTitleInput').value.trim(),
          desc: document.getElementById('sanctuaryDescInput').value.trim(),
          amenities: amenitiesArr
        }
      };

      await saveCmsToServer(payload, 'Konten Beranda & Hero');
    });
  }

  // Submit: Story & Filosofi
  const storyForm = document.getElementById('cmsStoryForm');
  if (storyForm) {
    storyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        story: {
          tag: document.getElementById('storyTagInput').value.trim(),
          title: document.getElementById('storyTitleInput').value.trim(),
          lead: document.getElementById('storyLeadInput').value.trim(),
          p1: document.getElementById('storyP1Input').value.trim(),
          p2: document.getElementById('storyP2Input').value.trim(),
          quote: document.getElementById('storyQuoteInput').value.trim()
        }
      };
      await saveCmsToServer(payload, 'Kisah & Filosofi');
    });
  }

  // Submit: Location & Jam Buka
  const locationForm = document.getElementById('cmsLocationForm');
  if (locationForm) {
    locationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        contact: {
          address: document.getElementById('contactAddressInput').value.trim(),
          whatsapp: document.getElementById('contactWaInput').value.trim(),
          whatsappDisplay: document.getElementById('contactWaDisplayInput').value.trim(),
          instagram: normalizeInstagramHandle(document.getElementById('contactIgInput').value),
          instagramUrl: normalizeInstagramUrl(document.getElementById('contactIgInput').value),
          mapsUrl: document.getElementById('contactMapsUrlInput').value.trim(),
          mapsEmbed: document.getElementById('contactMapsEmbedInput').value.trim()
        },
        hours: {
          weekday: document.getElementById('hoursWeekdayInput').value.trim(),
          weekend: document.getElementById('hoursWeekendInput').value.trim(),
          weekdayOpen: document.getElementById('hoursWeekdayOpenInput').value.trim() || '08:00',
          weekdayClose: document.getElementById('hoursWeekdayCloseInput').value.trim() || '22:00',
          weekendOpen: document.getElementById('hoursWeekendOpenInput').value.trim() || '08:00',
          weekendClose: document.getElementById('hoursWeekendCloseInput').value.trim() || '23:00'
        }
      };
      await saveCmsToServer(payload, 'Lokasi, Jam & Kontak');
    });
  }
}

async function saveCmsToServer(partialPayload, sectionName) {
  try {
    const res = await apiFetch('/api/cms', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(partialPayload)
    });
    const data = await res.json();
    if (res.status === 401) { handleUnauthorized(data); return; }
    if (data.success) {
      currentCmsData = data.data;
      showToast(`${sectionName} berhasil diperbarui di backend!`);
    } else {
      showToast(data.error || 'Gagal menyimpan perubahan CMS', true);
    }
  } catch (err) {
    showToast('Koneksi ke server gagal: ' + err.message, true);
  }
}


window.copyToClipboard = function(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`URL berhasil disalin: ${text}`);
  }).catch(() => {
    prompt('Salin URL ini:', text);
  });
};

/* ══════════════════════════════════════════════════════════
   6. BACKUP & RESTORE TAB
   ══════════════════════════════════════════════════════════ */
function setupBackupTab() {
  const exportBtn = document.getElementById('exportFullBackupBtn');
  const restoreInput = document.getElementById('restoreBackupInput');

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const res = await apiFetch('/api/backup', { headers: authHeaders() });
        const backup = await res.json();
        if (res.status === 401) { handleUnauthorized(backup); return; }
        if (!backup.success) throw new Error(backup.error || 'Backup gagal dibuat');
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bitts_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('File backup berhasil diunduh!');
      } catch (err) {
        showToast('Gagal membuat file backup: ' + err.message, true);
      }
    });
  }

  if (restoreInput) {
    restoreInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          const res = await apiFetch('/api/restore', {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(parsed)
          });
          const result = await res.json();
          if (res.status === 401) { handleUnauthorized(result); return; }
          if (result.success) {
            showToast('Seluruh data berhasil dipulihkan dari backup!');
            await loadAllData();
          } else {
            showToast(result.error || 'Gagal restore data', true);
          }
        } catch (err) {
          showToast('File backup JSON tidak valid: ' + err.message, true);
        }
      };
      reader.readAsText(file);
    });
  }
}



/* ══════════════════════════════════════════════════════════
   8. SETTINGS TAB
   ══════════════════════════════════════════════════════════ */
function populateSettingsForms(cms) {
  if (!cms) return;
  if (cms.floatingWA) {
    const en  = document.getElementById('floatingWAEnabledInput');
    const msg = document.getElementById('floatingWAMessageInput');
    if (en)  en.value  = cms.floatingWA.enabled !== false ? 'true' : 'false';
    if (msg) msg.value = cms.floatingWA.message || '';
  }
  if (cms.footer) {
    const ftag  = document.getElementById('footerTaglineInput');
    const fcopy = document.getElementById('footerCopyrightInput');
    if (ftag)  ftag.value  = cms.footer.tagline   || '';
    if (fcopy) fcopy.value = cms.footer.copyright || '';
  }
  if (cms.animations) {
    const anim = document.getElementById('animHeroEntranceInput');
    if (anim) anim.value = cms.animations.heroEntrance !== false ? 'true' : 'false';
  }
}

function setupSettingsTab() {
  // Note: initial form population is handled by loadCmsData() for reliable timing.
  const settingsForm = document.getElementById('cmsSettingsForm');
  if (!settingsForm) return;
  settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      floatingWA: {
        enabled: document.getElementById('floatingWAEnabledInput').value === 'true',
        message: document.getElementById('floatingWAMessageInput').value.trim()
      },
      footer: {
        ...(currentCmsData.footer || {}),
        tagline: document.getElementById('footerTaglineInput').value.trim(),
        copyright: document.getElementById('footerCopyrightInput').value.trim()
      },
      animations: {
        heroEntrance: document.getElementById('animHeroEntranceInput').value === 'true'
      }
    };
    await saveCmsToServer(payload, 'Pengaturan Lanjutan');
    if (currentCmsData) {
      currentCmsData.floatingWA  = payload.floatingWA;
      currentCmsData.footer      = payload.footer;
      currentCmsData.animations  = payload.animations;
    }
  });
}
