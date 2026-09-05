const API_BASE_URL = 'http://localhost:4000/api';

// ==========================================
// 1. CORE FETCH & SEARCH ENGINE
// ==========================================
async function fetchProviders(query, city) {
  try {
    let url = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}`;
    if (city) {
      url += `&city=${encodeURIComponent(city)}`;
    }
    const res = await fetch(url);
    const result = await res.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error('API Fetch Error:', error);
    return null;
  }
}

function renderDropdownList(providers, container) {
  if (!container) return;

  if (providers === null) {
    container.innerHTML = `
      <div class="p-3 text-xs text-rose-600 font-semibold">
        Backend is not responding (Check port 4000).
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }

  if (providers.length === 0) {
    container.innerHTML = `
      <div class="p-3 text-xs text-slate-500 text-center font-medium">
        No healthcare providers found.
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }

  container.innerHTML = providers.map((item) => `
    <div class="p-3 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer flex items-center justify-between group">
      <div>
        <div class="flex items-center space-x-2">
          <span class="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-[#B91C1C] transition">${item.name}</span>
          ${item.is_verified ? '<span class="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Verified</span>' : ''}
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">
          <span class="font-semibold text-slate-700">${item.category}</span> &bull; ${item.city} ${item.address ? `(${item.address})` : ''}
        </p>
      </div>
      ${item.phone ? `<span class="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded hidden sm:inline-block">${item.phone}</span>` : ''}
    </div>
  `).join('');

  container.classList.remove('hidden');
}

function closeDropdown(container) {
  if (container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }
}

function setupLiveSearch({ inputId, selectId, dropdownId, btnId }) {
  const input = document.getElementById(inputId);
  const select = document.getElementById(selectId);
  const dropdown = document.getElementById(dropdownId);
  const btn = document.getElementById(btnId);

  let debounceTimer = null;

  const triggerSearch = () => {
    const q = input ? input.value.trim() : '';
    const city = select ? select.value : '';

    if (q.length < 2) {
      closeDropdown(dropdown);
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const data = await fetchProviders(q, city);
      renderDropdownList(data, dropdown);
    }, 300);
  };

  if (input) input.addEventListener('input', triggerSearch);
  if (select) select.addEventListener('change', triggerSearch);
  if (btn) btn.addEventListener('click', triggerSearch);

  document.addEventListener('click', (e) => {
    if (input && dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
      closeDropdown(dropdown);
    }
  });
}

// Setup Search Bars
setupLiveSearch({
  inputId: 'globalSearchInput',
  selectId: 'globalLocationSelect',
  dropdownId: 'globalResultsDropdown',
  btnId: 'globalSearchBtn'
});

setupLiveSearch({
  inputId: 'heroSearchInput',
  selectId: 'heroLocationSelect',
  dropdownId: 'searchResultsDropdown',
  btnId: 'heroSearchBtn'
});


// ==========================================
// 2. DISCOVERY SLIDER ENGINE
// ==========================================
window.nextDiscoverySlide = function() {
  if (!window._discoverySlides) return;
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex + 1) % window._discoverySlides.length;
  animateDiscoverySlideTransition();
};

window.prevDiscoverySlide = function() {
  if (!window._discoverySlides) return;
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex - 1 + window._discoverySlides.length) % window._discoverySlides.length;
  animateDiscoverySlideTransition();
};

window.goToDiscoverySlide = function(idx) {
  if (!window._discoverySlides || !window._discoverySlides[idx]) return;
  AppState.discoverySlideIndex = idx;
  animateDiscoverySlideTransition();
};

function animateDiscoverySlideTransition() {
  const slide = window._discoverySlides[AppState.discoverySlideIndex];
  const img = document.getElementById('discSlideImg');
  const title = document.getElementById('discSlideTitle');
  const hosp = document.getElementById('discSlideHospital');
  const note = document.getElementById('discSlideNote');

  if (img && title && hosp && note) {
    img.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    img.style.opacity = '0';
    img.style.transform = 'scale(0.96)';

    setTimeout(() => {
      img.src = slide.image;
      title.innerHTML = slide.titleHtml || slide.title;
      hosp.innerText = slide.hospital;
      note.innerHTML = slide.note;
      
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    }, 300);
  } else {
    if (typeof renderApp === 'function') renderApp();
  }
}


// ==========================================
// 3. NAVIGATION & VIEW CONTROLLER
// ==========================================
function navigateTo(viewName) {
  AppState.activeView = viewName;
  
  const navLinks = document.querySelectorAll('nav a[data-nav]');
  navLinks.forEach(link => {
    const targetNav = link.getAttribute('data-nav');
    if (targetNav === viewName) {
      link.classList.add('text-[#B91C1C]', 'font-bold');
      link.classList.remove('text-slate-700', 'font-medium');
    } else {
      link.classList.remove('text-[#B91C1C]', 'font-bold');
      link.classList.add('text-slate-700', 'font-medium');
    }
  });

  if (typeof renderApp === 'function') {
    renderApp();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


// ==========================================
// 4. UI INTERACTIVITY & TEXT-ONLY ACTIVE STATES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

  // Persistent red fill for Action / Filter / Load More buttons
  const persistentRedButtons = document.querySelectorAll('#applyFiltersBtn, button[onclick*="Load More"], button[onclick*="navigateTo"]');
  persistentRedButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      this.classList.add('active-red-fill');
    });
  });

  // General buttons scale effect
  const allActionButtons = document.querySelectorAll('button, .category-card');
  allActionButtons.forEach(el => {
    el.addEventListener('click', function() {
      this.classList.add('btn-clicked-active');
      setTimeout(() => {
        this.classList.remove('btn-clicked-active');
      }, 250);
    });
  });

  // Cards click effect (shrink + shadow)
  const allCards = document.querySelectorAll('.provider-card, [data-location], .bg-white.rounded-2xl, .bg-white.rounded-xl');
  allCards.forEach(card => {
    card.classList.add('interactive-card');
    card.addEventListener('click', function() {
      this.classList.add('card-clicked');
      setTimeout(() => {
        this.classList.remove('card-clicked');
      }, 200);
    });
  });

});

document.addEventListener('click', (e) => {
  const target = e.target.closest('nav a, .category-option, [data-category], .category-card');
  if (!target) return;

  //
  const container = target.parentElement;
  if (container) {
    const siblings = container.querySelectorAll('nav a, .category-option, [data-category], .category-card');
    siblings.forEach(el => el.classList.remove('nav-link-active', 'category-item-active'));
  }

  target.classList.add('category-item-active');
});