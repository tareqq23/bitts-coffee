import { getStoredMenus, formatRupiah, createWhatsAppOrderLink } from './menuManager.js';

let allMenuItems = [];
let currentCategory = 'all';
let currentSearch = '';
let selectedItemForOrder = null;
let currentCms = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadCms();
  await loadCatalog();
  initLiveStatus();
  initMobileNav();
  initModalEvents();
  initAdminQuickBarAndShortcuts();

  // Auto-refresh katalog jika ada perubahan dari admin tab lain
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.includes('bitts_menu')) {
      loadCatalog();
    }
  });
});

/* =============================================
   DYNAMIC CMS LOADER
   ============================================= */
async function loadCms() {
  try {
    const res = await fetch('/api/cms');
    const result = await res.json();
    if (result.success && result.data) {
      currentCms = result.data;
      renderCmsContent(currentCms);
    }
  } catch (err) {
    console.warn('CMS API offline, using static defaults', err);
  }
}

function renderCmsContent(cms) {
  if (!cms) return;

  // Hero Section
  if (cms.storeInfo) {
    const s = cms.storeInfo;
    const badge = document.getElementById('dynHeroBadge');
    const title = document.getElementById('dynHeroTitle');
    const desc  = document.getElementById('dynHeroDesc');
    const img   = document.getElementById('dynHeroImg');
    const ctaP  = document.getElementById('dynHeroCtaPrimary');
    const ctaS  = document.getElementById('dynHeroCtaSecondary');

    if (badge && s.heroBadge) badge.textContent = `✦ ${s.heroBadge}`;
    if (title && s.slogan)    title.innerHTML = s.slogan.replace(/\n/g, '<br>');
    if (desc  && s.description) desc.textContent = s.description;
    if (img   && s.heroImage) img.src = s.heroImage;
    if (ctaP  && s.heroCtaPrimary)   ctaP.childNodes[ctaP.childNodes.length-1].textContent = ' ' + s.heroCtaPrimary;
    if (ctaS  && s.heroCtaSecondary) ctaS.childNodes[ctaS.childNodes.length-1].textContent = ' ' + s.heroCtaSecondary;
  }

  // Highlights / Value Pills
  if (cms.highlights && Array.isArray(cms.highlights) && cms.highlights.length > 0) {
    const row = document.getElementById('dynHighlightsRow');
    if (row) {
      row.innerHTML = cms.highlights.map(h => `
        <div class="value-pill-card">
          <div class="value-pill-icon">${h.icon || '✦'}</div>
          <div>
            <div class="value-pill-title">${h.title}</div>
            <div class="value-pill-desc">${h.desc}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // Sanctuary Space
  if (cms.sanctuary) {
    const sn = cms.sanctuary;
    const st = document.getElementById('dynSanctuaryTitle');
    const sd = document.getElementById('dynSanctuaryDesc');
    const am = document.getElementById('dynAmenitiesList');

    if (st && sn.title) st.textContent = sn.title;
    if (sd && sn.desc)  sd.textContent = sn.desc;
    if (am && Array.isArray(sn.amenities) && sn.amenities.length > 0) {
      am.innerHTML = sn.amenities.map(a => `<span class="amenity-chip">✨ ${a}</span>`).join('');
    }
  }

  // Location, Hours & Contacts
  if (cms.contact) {
    const c = cms.contact;
    const addr       = document.getElementById('dynStoreAddress');
    const maps       = document.getElementById('dynMapsLink');
    const wa         = document.getElementById('dynWaLink');
    const waDisp     = document.getElementById('dynWaDisplay');
    const iframe     = document.getElementById('dynMapsIframe');
    const igFooter   = document.getElementById('dynInstagramFooter');
    const waFooter   = document.getElementById('dynWhatsAppFooter');
    const visitIG    = document.getElementById('dynVisitInstagram');
    const visitWA    = document.getElementById('dynVisitWA');
    const navWaBtn   = document.getElementById('navWaBtn');
    const statusMaps = document.getElementById('dynStatusMapsLink');
    const footerMaps = document.getElementById('dynFooterMaps');
    const footerAddr = document.getElementById('dynFooterAddress');
    const footerWaDisp = document.getElementById('dynWaDisplay');

    if (addr     && c.address)      addr.innerHTML = c.address.replace(/\n/g, '<br>');
    if (maps     && c.mapsUrl)      maps.href = c.mapsUrl;
    if (wa       && c.whatsapp)     wa.href = `https://wa.me/${c.whatsapp}`;
    if (waDisp   && c.whatsappDisplay) waDisp.textContent = c.whatsappDisplay;
    if (iframe) {
      let embedUrl = (c.mapsEmbed || '').trim();
      // Handle pasted iframe tags
      if (embedUrl.includes('<iframe')) {
        const match = embedUrl.match(/src=["']([^"']+)["']/);
        if (match) embedUrl = match[1];
      }
      // If not starting with http/https, build Google Maps embed from address
      if (!embedUrl.startsWith('http://') && !embedUrl.startsWith('https://')) {
        const query = embedUrl || c.address || 'BITTS Coffee Pandeglang';
        embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
      } else if (!embedUrl.includes('output=embed') && !embedUrl.includes('/embed')) {
        const query = c.address || 'BITTS Coffee Pandeglang';
        embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
      }
      iframe.src = embedUrl;
    }
    if (igFooter && c.instagramUrl) igFooter.href = c.instagramUrl;
    if (waFooter && c.whatsapp)     waFooter.href = `https://wa.me/${c.whatsapp}`;
    if (visitIG  && c.instagramUrl) { visitIG.href = c.instagramUrl; if (c.instagram) visitIG.lastChild.textContent = ` @${c.instagram}`; }
    if (visitWA  && c.whatsapp)     visitWA.href = `https://wa.me/${c.whatsapp}`;
    if (navWaBtn && c.whatsapp)     navWaBtn.href = `https://wa.me/${c.whatsapp}`;
    if (statusMaps && c.mapsUrl)    statusMaps.href = c.mapsUrl;
    if (footerMaps && c.mapsUrl)    footerMaps.href = c.mapsUrl;
    if (footerAddr && c.address)    footerAddr.innerHTML = c.address.replace(/\n/g, '<br>');
  }

  if (cms.hours) {
    const h = cms.hours;
    const hw    = document.getElementById('dynHoursWeekday');
    const hwe   = document.getElementById('dynHoursWeekend');
    const fhw   = document.getElementById('dynFooterWeekday');
    const fhwe  = document.getElementById('dynFooterWeekend');

    if (hw   && h.weekday)  hw.textContent  = h.weekday;
    if (hwe  && h.weekend)  hwe.textContent = h.weekend;
    if (fhw  && h.weekday)  fhw.textContent  = h.weekday;
    if (fhwe && h.weekend)  fhwe.textContent = h.weekend;
  }

  // Story & Filosofi Section
  if (cms.story) {
    const st = cms.story;
    const tag   = document.getElementById('dynStoryTag');
    const title = document.getElementById('dynStoryTitle');
    const lead  = document.getElementById('dynStoryLead');
    const p1    = document.getElementById('dynStoryP1');
    const p2    = document.getElementById('dynStoryP2');
    const quote = document.getElementById('dynStoryQuote');

    if (tag   && st.tag)   tag.textContent   = st.tag;
    if (title && st.title) title.innerHTML   = st.title.replace(/\n/g, '<br>');
    if (lead  && st.lead)  lead.textContent  = st.lead;
    if (p1    && st.p1)    p1.textContent    = st.p1;
    if (p2    && st.p2)    p2.textContent    = st.p2;
    if (quote && st.quote) quote.textContent = st.quote;
  }

  // Footer text
  if (cms.footer) {
    const f = cms.footer;
    const ftag  = document.getElementById('dynFooterTagline');
    const fcopy = document.getElementById('dynFooterCopyright');
    if (ftag  && f.tagline)   ftag.textContent  = f.tagline;
    if (fcopy && f.copyright) fcopy.textContent = f.copyright;
  }

  // Floating WhatsApp Button
  renderFloatingWA(cms);

  // Hero Animations
  if (cms.animations && cms.animations.heroEntrance) {
    initHeroAnimations();
  }
}

function renderFloatingWA(cms) {
  const wrap   = document.getElementById('floatingWAWrap');
  const btn    = document.getElementById('floatingWABtn');
  const tooltip = document.getElementById('floatingWATooltip');
  if (!wrap || !btn) return;

  const waConf = cms.floatingWA || {};
  const enabled = waConf.enabled !== false; // default true

  if (!enabled) { wrap.style.display = 'none'; return; }

  wrap.style.display = 'flex';
  const waNum = cms.contact?.whatsapp || '6285179929290';
  const msg   = encodeURIComponent(waConf.message || 'Halo BITTS Coffee! Saya ingin memesan.');
  btn.href = `https://wa.me/${waNum}?text=${msg}`;

  if (tooltip && waConf.message) {
    tooltip.textContent = waConf.message.length > 40
      ? waConf.message.slice(0, 40) + '…'
      : waConf.message;
  }
}

function initHeroAnimations() {
  const elements = document.querySelectorAll('.hero-animate');
  elements.forEach(el => {
    // Ensure animation runs even if CSS has already been parsed
    el.style.opacity = '0';
    el.style.animation = 'none';
    // Force reflow
    el.getBoundingClientRect();
    el.style.animation = '';
  });
}


/* =============================================
   LIVE STORE STATUS (WIB)
   ============================================= */
function initLiveStatus() {
  const livePill = document.getElementById('livePill');
  const liveText = document.getElementById('liveStatusText');
  const hoursDetail = document.getElementById('liveHoursDetail');
  if (!livePill) return;

  function parseMinutes(timeStr, fallback) {
    if (!timeStr || !timeStr.includes(':')) return fallback;
    const [hh, mm] = timeStr.split(':').map(Number);
    return (hh || 0) * 60 + (mm || 0);
  }

  function updateStatus() {
    const now = new Date();
    const wibStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const wib = new Date(wibStr);
    const day = wib.getDay();
    const isWeekend = day === 0 || day === 6;
    const mins = wib.getHours() * 60 + wib.getMinutes();

    // Default: 08:00 - 22:00 (weekday) / 23:00 (weekend)
    let openMin = 8 * 60;
    let closeMin = isWeekend ? 23 * 60 : 22 * 60;

    if (currentCms && currentCms.hours) {
      if (isWeekend) {
        openMin = parseMinutes(currentCms.hours.weekendOpen, 8 * 60);
        closeMin = parseMinutes(currentCms.hours.weekendClose, 23 * 60);
      } else {
        openMin = parseMinutes(currentCms.hours.weekdayOpen, 8 * 60);
        closeMin = parseMinutes(currentCms.hours.weekdayClose, 22 * 60);
      }
    }

    const isOpen = mins >= openMin && mins < closeMin;

    if (liveText) liveText.textContent = isOpen ? 'Buka Sekarang' : 'Sedang Tutup';

    livePill.style.background = isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)';
    livePill.style.color = isOpen ? '#10B981' : '#EF4444';
    const dot = livePill.querySelector('.pulse-dot');
    if (dot) dot.style.background = 'currentColor';

    if (hoursDetail) {
      if (isOpen) {
        const closeHourStr = currentCms?.hours ? (isWeekend ? currentCms.hours.weekendClose : currentCms.hours.weekdayClose) : (isWeekend ? '23:00' : '22:00');
        hoursDetail.textContent = `Tutup pukul ${closeHourStr} WIB hari ini`;
      } else {
        const openHourStr = currentCms?.hours ? (isWeekend ? currentCms.hours.weekendOpen : currentCms.hours.weekdayOpen) : '08:00';
        hoursDetail.textContent = `Buka kembali mulai ${openHourStr} WIB`;
      }
    }
  }

  updateStatus();
  setInterval(updateStatus, 60000);
}

/* =============================================
   MOBILE NAV
   ============================================= */
function initMobileNav() {
  const toggleBtn = document.getElementById('mobileNavToggle');
  const navList = document.getElementById('navLinksList');
  if (!toggleBtn || !navList) return;

  toggleBtn.addEventListener('click', () => {
    navList.classList.toggle('open');
    toggleBtn.textContent = navList.classList.contains('open') ? '✕' : '☰';
  });

  navList.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navList.classList.remove('open');
      toggleBtn.textContent = '☰';
    });
  });
}

/* =============================================
   CATALOG INIT, FILTER & SEARCH
   ============================================= */
async function loadCatalog() {
  try {
    const res = await fetch('/api/menu');
    const result = await res.json();
    if (result.success && Array.isArray(result.data)) {
      allMenuItems = result.data;
    } else {
      allMenuItems = getStoredMenus();
    }
  } catch (err) {
    console.warn('API menu offline, fallback to localStorage', err);
    allMenuItems = getStoredMenus();
  }

  renderMenu();
  setupFilters();
}

function renderMenu() {
  const grid = document.getElementById('compactMenuGrid');
  if (!grid) return;

  const filtered = allMenuItems.filter(item => {
    let matchCat = true;
    if (currentCategory === 'signature') {
      matchCat = !!(item.badge && (item.badge === 'Best Seller' || item.badge === 'Signature'));
    } else if (currentCategory !== 'all') {
      const itemCat = (item.category || '').toLowerCase();
      const targetCat = currentCategory.toLowerCase();
      matchCat = itemCat === targetCat ||
        (targetCat === 'pastry' && itemCat === 'dessert') ||
        (targetCat === 'dessert' && itemCat === 'pastry');
    }
    const q = currentSearch.toLowerCase().trim();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-catalog-box"><p>Tidak ada menu yang cocok 🥲</p><p style="font-size:0.8rem;color:#666;margin-top:6px;">Coba kata kunci lain atau ubah filter kategori</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <article class="compact-menu-card" data-id="${item.id}">
      <div class="card-img-wrap">
        <img src="${item.image}" alt="${item.name}" loading="lazy" onerror="this.src='assets/images/menu-coffee.jpg'">
        ${item.badge ? `<span class="card-badge-pill">${item.badge}</span>` : ''}
        ${!item.isAvailable ? `<div class="card-sold-out-overlay">SOLD OUT</div>` : ''}
      </div>
      <div class="card-content-wrap">
        <span class="card-cat-label">${item.categoryName || item.category}</span>
        <h3 class="card-title">${item.name}</h3>
        <p class="card-desc">${item.description || ''}</p>
        <div class="card-footer-row">
          <span class="card-price">${formatRupiah(item.price)}</span>
          <button class="btn-card-wa" onclick="window.openOrderModal('${item.id}')" ${!item.isAvailable ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            Pesan
          </button>
        </div>
      </div>
    </article>
  `).join('');
}

function setupFilters() {
  const container = document.getElementById('categoryPillFilters');
  if (container && Array.isArray(allMenuItems) && allMenuItems.length > 0) {
    const iconMap = {
      'coffee': '☕',
      'non-coffee': '🍵',
      'snack': '🍟',
      'food': '🥪',
      'pastry': '🥐',
      'dessert': '🥐',
      'kopi-literan': '🫙',
      'seasonal': '✨',
      'coldbrew': '🧊',
      'signature': '⭐'
    };
    const labelMap = {
      'coffee': 'Coffee',
      'non-coffee': 'Non-Coffee',
      'snack': 'Snack & Camilan',
      'food': 'Meals & Food',
      'pastry': 'Pastry & Sweets',
      'dessert': 'Pastry & Sweets',
      'kopi-literan': 'Kopi Literan',
      'seasonal': 'Minuman Seasonal',
      'coldbrew': 'Cold Brew',
      'signature': 'Signature Series'
    };

    const distinctCats = [...new Set(allMenuItems.map(i => i.category).filter(Boolean))];
    const hasSignature = allMenuItems.some(i => i.badge === 'Best Seller' || i.badge === 'Signature');

    let html = `<button class="cat-pill-btn ${currentCategory === 'all' ? 'active' : ''}" data-cat="all">Semua Menu</button>`;
    if (hasSignature) {
      html += `<button class="cat-pill-btn ${currentCategory === 'signature' ? 'active' : ''}" data-cat="signature">⭐ Signature</button>`;
    }

    distinctCats.forEach(cat => {
      const icon = iconMap[cat.toLowerCase()] || '🏷️';
      const sampleItem = allMenuItems.find(i => i.category === cat);
      const label = (sampleItem && sampleItem.categoryName) || labelMap[cat.toLowerCase()] || (cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' '));
      const isActive = currentCategory.toLowerCase() === cat.toLowerCase() ? 'active' : '';
      html += `<button class="cat-pill-btn ${isActive}" data-cat="${cat}">${icon} ${label}</button>`;
    });

    container.innerHTML = html;
  }

  // Category filter pills
  document.querySelectorAll('.cat-pill-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.cat-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-cat');
      renderMenu();
    };
  });

  // Live search
  const searchInput = document.getElementById('liveSearchInput');
  if (searchInput) {
    searchInput.oninput = (e) => {
      currentSearch = e.target.value;
      renderMenu();
    };
  }
}

/* =============================================
   ORDER MODAL & WHATSAPP INTEGRATION
   ============================================= */
function initModalEvents() {
  const backdrop = document.getElementById('clientOrderModal');
  const closeBtn = document.getElementById('closeOrderModalBtn');
  const sendBtn = document.getElementById('sendWaOrderBtn');

  if (closeBtn && backdrop) {
    closeBtn.addEventListener('click', () => backdrop.classList.remove('active'));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) backdrop.classList.remove('active'); });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      if (!selectedItemForOrder) return;
      const notes = document.getElementById('modalNotes')?.value || '';
      
      let link = createWhatsAppOrderLink(selectedItemForOrder, notes);
      // If customized WA number exists in CMS, swap the number
      if (currentCms?.contact?.whatsapp) {
        link = link.replace(/wa\.me\/\d+/, `wa.me/${currentCms.contact.whatsapp}`);
      }
      window.open(link, '_blank');
      backdrop.classList.remove('active');
    });
  }
}

window.openOrderModal = function(itemId) {
  const item = allMenuItems.find(i => i.id === itemId);
  if (!item) return;
  selectedItemForOrder = item;

  const el = (id) => document.getElementById(id);
  if (el('modalTitle')) el('modalTitle').textContent = 'Detail Pesanan';
  if (el('modalName')) el('modalName').textContent = item.name;
  if (el('modalPrice')) el('modalPrice').textContent = formatRupiah(item.price);
  if (el('modalDesc')) el('modalDesc').textContent = item.description || '';
  if (el('modalImg')) { el('modalImg').src = item.image; el('modalImg').alt = item.name; }
  if (el('modalNotes')) el('modalNotes').value = '';

  document.getElementById('clientOrderModal')?.classList.add('active');
};

/* =============================================
   ADMIN QUICK-BAR & SHORTCUTS (Ctrl+Shift+A)
   ============================================= */
function initAdminQuickBarAndShortcuts() {
  const token = localStorage.getItem('bitts_admin_token') || sessionStorage.getItem('bitts_admin_token');
  const user  = localStorage.getItem('bitts_admin_user')  || sessionStorage.getItem('bitts_admin_user') || 'admin';
  const quickBar = document.getElementById('bittsAdminQuickBar');
  const userSpan = document.getElementById('adminQuickUserName');
  const logoutBtn = document.getElementById('quickLogoutBtn');

  // 1. Tampilkan Admin Quick Bar jika token valid
  if (token && quickBar) {
    // Validasi token ke server di latar belakang
    fetch('/api/auth/check', { headers: { 'Authorization': 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => {
        if (d && d.authenticated) {
          quickBar.style.display = 'block';
          if (userSpan) userSpan.textContent = user;
        } else {
          // Token kadaluarsa atau tidak valid di server
          localStorage.removeItem('bitts_admin_token');
          sessionStorage.removeItem('bitts_admin_token');
          quickBar.style.display = 'none';
        }
      })
      .catch(() => {
        // Fallback: tampilkan jika offline
        quickBar.style.display = 'block';
        if (userSpan) userSpan.textContent = user;
      });

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
          });
        } catch(_) {}
        localStorage.removeItem('bitts_admin_token');
        localStorage.removeItem('bitts_admin_user');
        sessionStorage.removeItem('bitts_admin_token');
        sessionStorage.removeItem('bitts_admin_user');
        quickBar.style.display = 'none';
      });
    }
  }

  // 2. Pintasan Keyboard: Ctrl + Shift + A (atau Cmd + Shift + A)
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault();
      // Langsung menuju ke portal /admin
      window.location.href = '/admin';
    }
  });
}

