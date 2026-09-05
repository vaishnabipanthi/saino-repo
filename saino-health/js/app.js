/**
 * SAINO HEALTH - Core Frontend Application Controller
 * Handles Routing, State, Search/Filters, Modals, WhatsApp Engine, and Carousel
 */

// Application State
const AppState = {
  activeView: 'marketplace', // 'marketplace' | 'campaigns' | 'providers-showcase' | 'boost' | 'about' | 'contact'
  activeBigScreenIndex: 0,
  bigScreenDisplayMode: 'billboard', // 'billboard' | 'spotlight' | 'mobile'
  selectedLocation: 'all',
  selectedCategory: 'all',
  selectedVerification: 'all',
  selectedBookingType: 'all',
  searchQuery: '',
  sortBy: 'recommended',
  currentAdIndex: 0,
  adAutoPlayInterval: null,
  bigScreenAutoPlayInterval: null,
  providers: [],
  activeProvider: null,
  toastTimeout: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  // Deep clone initial data so user likes/reviews mutate locally
  AppState.providers = JSON.parse(JSON.stringify(window.SAINO_DATA.providers));
  
  initNavigation();
  initAdCarousel();
  initBigScreenAutoPlay();
  renderApp();
  initGlobalEventListeners();
  
  // Refresh Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Navigation Controller
function initNavigation() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const target = el.getAttribute('data-nav');
      navigateTo(target);
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}

  // Update active nav links
  function navigateTo(viewName) {
  AppState.activeView = viewName;
  
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
    mobileMenu.classList.add('hidden');
  }

  renderApp();
}

// Render Master Controller
 // Render Master Controller
function renderApp() {
  const heroSection = document.getElementById('homeHeroSection');
  const isSubPage = ['discovery', 'providers-showcase', 'discussions', 'all-reviews'].includes(AppState.activeView);

  // Sirf hero section hide/show ka logic rahega
  if (heroSection) {
    heroSection.style.setProperty('display', isSubPage ? 'none' : 'block', 'important');
  }

  const mainContainer = document.getElementById('mainContent');
  if (!mainContainer) return;

  switch (AppState.activeView) {
    case 'marketplace':
      mainContainer.innerHTML = renderMarketplaceView();
      bindMarketplaceEvents();
      break;

    case 'discovery':
    case 'providers-showcase':
      mainContainer.innerHTML = renderDiscoveryView();
      bindProvidersShowcaseEvents();
      break;
      
    case 'all-reviews':
      mainContainer.innerHTML = typeof window.renderAllReviewsView === 'function' 
        ? window.renderAllReviewsView() 
        : '<p class="p-8 text-center text-slate-500">Review view function not found.</p>';
      break;

    case 'discussions':
      mainContainer.innerHTML = typeof window.renderAllDiscussionsView === 'function' 
        ? window.renderAllDiscussionsView() 
        : renderDiscoveryView();
      break;
    default:
      mainContainer.innerHTML = renderMarketplaceView();
      bindMarketplaceEvents();
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
// ==========================================
// 1. MARKETPLACE VIEW RENDERING
// ==========================================
function renderMarketplaceView() {
  const filteredProviders = getFilteredProviders();

  return `
    <!-- Top Healthcare Promotional Ads Carousel (7-8 Scrolling Ads) -->
    <section class="mb-10">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">
            ★ SPONSORED PROMOTIONS
          </span>
          <h2 class="text-sm md:text-base font-semibold text-slate-700">Trending Healthcare Offers in Nepal</h2>
        </div>
        <div class="flex items-center space-x-3">
          <button onclick="navigateTo('campaigns')" class="text-xs font-bold text-rose-600 hover:text-rose-700 transition flex items-center space-x-1">
            <i data-lucide="tv" class="w-3.5 h-3.5"></i>
            <span>Big Screen Showcase →</span>
          </button>
          <div class="flex items-center space-x-1.5">
            <button id="prevAdBtn" class="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm" title="Previous Ad">
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>
            <div id="adIndicators" class="flex space-x-1.5">
              ${window.SAINO_DATA.promotionalAds.map((_, i) => `
                <button onclick="goToAd(${i})" class="w-2 h-2 rounded-full transition-all ${i === AppState.currentAdIndex ? 'bg-rose-600 w-5' : 'bg-slate-300'}"></button>
              `).join('')}
            </div>
            <button id="nextAdBtn" class="p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm" title="Next Ad">
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Scrolling Ad Card -->
      <div class="relative overflow-hidden rounded-2xl shadow-lg border border-slate-200 bg-slate-900 text-white min-h-[220px] md:min-h-[200px]">
        <div id="adTrack" class="carousel-track h-full">
          ${window.SAINO_DATA.promotionalAds.map((ad, idx) => `
            <div class="w-full flex-shrink-0 relative overflow-hidden bg-gradient-to-r ${ad.bgGradient} p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div class="z-10 max-w-xl text-left">
                <div class="flex items-center space-x-2 mb-2">
                  <span class="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
                    ${ad.tag}
                  </span>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-slate-950">
                    ${ad.badge}
                  </span>
                </div>
                <h3 class="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">${ad.title}</h3>
                <p class="text-slate-100 text-xs md:text-sm mb-4 leading-relaxed">${ad.subtitle}</p>
                <div class="flex flex-wrap items-center gap-3">
                  <button onclick="openAdWhatsApp('${ad.id}')" class="inline-flex items-center space-x-2 px-4 py-2 bg-white text-slate-900 rounded-lg text-xs md:text-sm font-semibold hover:bg-slate-100 transition shadow-md">
                    <i data-lucide="message-circle" class="w-4 h-4 text-emerald-600"></i>
                    <span>${ad.actionText}</span>
                  </button>
                  <span class="text-xs text-white/80 font-medium">${ad.company}</span>
                </div>
              </div>
              <div class="hidden md:block relative z-10 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/30 flex-shrink-0">
                <img src="${ad.image}" alt="${ad.title}" class="w-full h-full object-cover">
              </div>
              <!-- Decorative background circles -->
              <div class="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none"></div>
              <div class="absolute right-32 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none"></div>
            </div>
          `).join('')}
        </div>
      </div>
      
    </section>

    <!-- 4-STEP PATIENT CAROUSEL BANNER (Exact specification from User Design) -->
    <section class="mb-12 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 overflow-hidden">
      <div class="flex flex-col lg:flex-row items-center justify-between gap-8 mb-6">
        <div class="max-w-xs text-left">
          <div class="text-xs font-black tracking-widest text-rose-600 uppercase mb-1">CAROUSEL IDEA – For Patients</div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            Find the care you need in <span class="text-rose-600">4 simple steps</span>
          </h2>
          <div class="w-12 h-1 bg-rose-600 rounded-full mt-3"></div>
        </div>

        <!-- 4 Steps Visual Flow -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 w-full">
          <!-- Step 01 -->
          <div class="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-200 transition">
            <span class="text-xs font-black text-rose-600 mb-1">01</span>
            <div class="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-2">
              <i data-lucide="search" class="w-6 h-6 text-rose-600"></i>
            </div>
            <strong class="text-sm font-bold text-slate-900">Search</strong>
            <span class="text-[11px] text-slate-500 mt-0.5">Find what you need</span>
          </div>

          <!-- Step 02 -->
          <div class="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-200 transition">
            <span class="text-xs font-black text-rose-600 mb-1">02</span>
            <div class="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-2">
              <i data-lucide="map-pin" class="w-6 h-6 text-rose-600"></i>
            </div>
            <strong class="text-sm font-bold text-slate-900">Discover</strong>
            <span class="text-[11px] text-slate-500 mt-0.5">Explore providers near you</span>
          </div>

          <!-- Step 03 -->
          <div class="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-200 transition">
            <span class="text-xs font-black text-rose-600 mb-1">03</span>
            <div class="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-2">
              <i data-lucide="clipboard-list" class="w-6 h-6 text-rose-600"></i>
            </div>
            <strong class="text-sm font-bold text-slate-900">Compare</strong>
            <span class="text-[11px] text-slate-500 mt-0.5">Compare services & details</span>
          </div>

          <!-- Step 04 -->
          <div class="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-rose-200 transition">
            <span class="text-xs font-black text-rose-600 mb-1">04</span>
            <div class="w-14 h-14 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-2">
              <i data-lucide="handshake" class="w-6 h-6 text-rose-600"></i>
            </div>
            <strong class="text-sm font-bold text-slate-900">Connect</strong>
            <span class="text-[11px] text-slate-500 mt-0.5">Get in touch and book</span>
          </div>
        </div>
      </div>

      <!-- Bottom Brand Bar in Solid Crimson Red -->
      <div class="rounded-2xl bg-gradient-to-r from-[#881337] via-[#991b1b] to-[#881337] py-3.5 px-6 text-center text-white text-xs sm:text-sm font-bold shadow-md tracking-wide">
        Saino Health – One Marketplace. Every Care You Need.
      </div>
    </section>

    <!-- 9 Healthcare Categories Grid -->
    <section class="mb-12">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg md:text-xl font-bold text-slate-900">Browse Healthcare Categories</h2>
          <p class="text-xs md:text-sm text-slate-500">Discover verified doctors, clinics, diagnostics and emergency care</p>
        </div>
        <button onclick="filterCategory('all')" class="text-xs md:text-sm font-semibold text-rose-600 hover:text-rose-700">
          View All Categories (${window.SAINO_DATA.providers.length}+ Providers)
        </button>
      </div>

      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
        ${window.SAINO_DATA.categories.map(cat => {
          const isActive = AppState.selectedCategory === cat.id;
          return `
            <button onclick="filterCategory('${cat.id}')" 
              class="category-card flex flex-col items-center p-3.5 rounded-xl border text-center transition-all ${
                isActive 
                  ? 'bg-sky-50 border-sky-500 shadow-md ring-2 ring-sky-500/20' 
                  : 'bg-white border-slate-200 hover:border-sky-300'
              }">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
                isActive ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
              }">
                <i data-lucide="${cat.icon}" class="w-5 h-5"></i>
              </div>
              <span class="text-xs font-semibold leading-tight text-slate-800 line-clamp-2">${cat.name}</span>
              <span class="text-[10px] text-slate-400 mt-1">${cat.count} listings</span>
            </button>
          `;
        }).join('')}
      </div>
    </section>

    <!-- 8 Booking Quick Action Pills -->
    <section class="mb-10 p-5 rounded-2xl bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white shadow-xl">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <span class="text-[11px] uppercase tracking-wider font-bold text-sky-300">Fast-Track Healthcare Access</span>
          <h3 class="text-base md:text-lg font-bold">What service do you want to book today?</h3>
        </div>
        <div class="flex items-center space-x-2 text-xs text-slate-300">
          <i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i>
          <span>Direct WhatsApp Booking & Instant Triage</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <button onclick="filterBookingType('all')" 
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            AppState.selectedBookingType === 'all' 
              ? 'bg-white text-slate-900 shadow' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }">
          All Booking Types
        </button>
        ${window.SAINO_DATA.bookingCategories.map(bk => `
          <button onclick="filterBookingType('${bk.id}')" 
            class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              AppState.selectedBookingType === bk.id 
                ? 'bg-sky-400 text-slate-950 font-bold shadow' 
                : 'bg-white/10 text-white hover:bg-white/20'
            }">
            <i data-lucide="${bk.icon}" class="w-3.5 h-3.5"></i>
            <span>${bk.title}</span>
          </button>
        `).join('')}
      </div>
    </section>

    <!-- Main Marketplace Directory Section (20-25 Rich Providers) -->
    <section class="mb-14">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div class="flex items-center space-x-2">
            <h2 class="text-xl md:text-2xl font-extrabold text-slate-900">Healthcare Providers Marketplace</h2>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
              ${filteredProviders.length} Available
            </span>
          </div>
          <p class="text-xs md:text-sm text-slate-500 mt-1">
            Verified doctors, hospitals, clinics, diagnostic centers and emergency services in Nepal
          </p>
        </div>

        <!-- Verification Filter Pills & Sorting -->
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="inline-flex rounded-lg p-1 bg-slate-100 border border-slate-200 text-xs">
            <button onclick="filterVerification('all')" class="px-3 py-1 rounded-md font-semibold transition ${AppState.selectedVerification === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
              All Badges
            </button>
            <button onclick="filterVerification('pro')" class="px-3 py-1 rounded-md font-semibold transition ${AppState.selectedVerification === 'pro' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
              ✓ SAINO Pro
            </button>
            <button onclick="filterVerification('prime')" class="px-3 py-1 rounded-md font-semibold transition ${AppState.selectedVerification === 'prime' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
              ✓ SAINO Prime
            </button>
            <button onclick="filterVerification('listed')" class="px-3 py-1 rounded-md font-semibold transition ${AppState.selectedVerification === 'listed' ? 'bg-slate-300 text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
              Free Listed
            </button>
          </div>

          <!-- Sort Selector -->
          <select id="sortSelect" onchange="changeSort(this.value)" class="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="recommended" ${AppState.sortBy === 'recommended' ? 'selected' : ''}>Recommended (Tier Rank)</option>
            <option value="rating" ${AppState.sortBy === 'rating' ? 'selected' : ''}>Highest Rated (★ 5.0)</option>
            <option value="likes" ${AppState.sortBy === 'likes' ? 'selected' : ''}>Most Liked (♥)</option>
            <option value="reviews" ${AppState.sortBy === 'reviews' ? 'selected' : ''}>Most Reviews</option>
          </select>
        </div>
      </div>

      <!-- Provider Listings Grid -->
      ${filteredProviders.length === 0 ? `
        <div class="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <i data-lucide="search-x" class="w-12 h-12 mx-auto text-slate-400 mb-3"></i>
          <h3 class="text-base font-bold text-slate-700 mb-1">No healthcare providers found</h3>
          <p class="text-xs text-slate-500 mb-4">Try clearing your filters or changing search keywords.</p>
          <button onclick="resetAllFilters()" class="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-700 transition">
            Reset Filters
          </button>
        </div>
      ` : `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${filteredProviders.map(p => renderProviderCard(p)).join('')}
        </div>
      `}
    </section>

    <!-- Dedicated Health Insurance Space Banner (Page 11 Requirement) -->
    <section class="mb-14 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-cyan-900 via-sky-900 to-indigo-950 text-white shadow-xl border border-cyan-700/40 relative overflow-hidden">
      <div class="relative z-10 max-w-3xl">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-400 text-slate-950 mb-3">
          HEALTH INSURANCE SPOTLIGHT
        </span>
        <h3 class="text-xl md:text-2xl font-bold mb-2">Protect Your Family with Cashless Health Insurance in Nepal</h3>
        <p class="text-xs md:text-sm text-cyan-100 mb-4 leading-relaxed">
          Compare verified group and individual medical insurance plans offering 100% cashless coverage at 85+ hospitals across Kathmandu Valley and all 7 provinces.
        </p>
        <div class="flex flex-wrap items-center gap-3">
          <button onclick="filterCategory('insurance')" class="px-4 py-2 bg-white text-slate-900 font-bold rounded-lg text-xs md:text-sm hover:bg-cyan-50 transition shadow">
            Compare Insurance Providers
          </button>
          <button onclick="openCustomWhatsApp('Health Insurance Inquiry', 'Hi SAINO, I would like guidance on choosing a Cashless Health Insurance plan in Nepal.')" class="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs md:text-sm hover:bg-emerald-700 transition shadow flex items-center space-x-1.5">
            <i data-lucide="message-circle" class="w-4 h-4"></i>
            <span>Instant WhatsApp Consultation</span>
          </button>
        </div>
      </div>
      <div class="absolute right-0 bottom-0 opacity-15 pointer-events-none">
        <i data-lucide="shield-check" class="w-64 h-64 text-white"></i>
      </div>
    </section>

  `;
}

// Render Individual Provider Card (Matching Exact Layout from Page 9 & 10)
function renderProviderCard(p) {
  let badgeHtml = '';
  if (p.verification === 'pro') {
    badgeHtml = `<span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold badge-pro"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>✓ SAINO Verified Pro</span></span>`;
  } else if (p.verification === 'prime') {
    badgeHtml = `<span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold badge-prime"><i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i><span>✓ SAINO Verified Prime</span></span>`;
  } else {
    badgeHtml = `<span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium badge-listed"><span>Saino Listed</span></span>`;
  }

  const categoryObj = window.SAINO_DATA.categories.find(c => c.id === p.category);
  const categoryName = categoryObj ? categoryObj.name : p.category;

  return `
    <div class="provider-card bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
      <div>
        <!-- Provider Photo / Header Cover -->
        <div class="relative h-44 w-full bg-slate-100 overflow-hidden">
          <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
          
          <!-- Top Badge & Category -->
          <div class="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div>${badgeHtml}</div>
            <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm">
              ${categoryName}
            </span>
          </div>

          <!-- Bottom Title on Image -->
          <div class="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div class="text-white">
              <h3 class="text-base font-bold leading-tight drop-shadow-sm">${p.name}</h3>
              <p class="text-xs text-slate-200 flex items-center mt-0.5">
                <i data-lucide="map-pin" class="w-3 h-3 mr-1 text-sky-400"></i>
                <span>${p.location}</span>
              </p>
            </div>
            <!-- Provider Logo Thumb -->
            <div class="w-11 h-11 rounded-xl bg-white p-0.5 shadow-md flex-shrink-0 overflow-hidden border border-white">
              <img src="${p.logo}" alt="Logo" class="w-full h-full object-cover rounded-lg">
            </div>
          </div>
        </div>

        <!-- Provider Metrics & Details (Page 9 spec) -->
        <div class="p-4">
          <!-- Rating & Engagement Stats -->
          <div class="flex items-center justify-between text-xs pb-3 mb-3 border-b border-slate-100">
            <div class="flex items-center space-x-1 text-amber-500 font-bold">
              <span>⭐</span>
              <span class="text-slate-900">${p.rating}</span>
              <span class="text-slate-400 font-normal">(${p.reviewsCount} Reviews)</span>
            </div>
            <div class="flex items-center space-x-3 text-slate-500">
              <span class="flex items-center space-x-1">
                <span class="text-rose-500">♥</span>
                <span>${(p.likesCount).toLocaleString()}</span>
              </span>
              <span class="flex items-center space-x-1">
                <span class="text-sky-500">👥</span>
                <span>${p.interestedCount} Interested</span>
              </span>
            </div>
          </div>

          <!-- Lead Specialist / Doctor -->
          ${p.leadDoctor ? `
            <div class="mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                ${p.leadDoctor.charAt(0)}
              </div>
              <div class="text-xs truncate">
                <span class="font-bold text-slate-900 block truncate">${p.leadDoctor}</span>
                <span class="text-[11px] text-slate-500 truncate block">${p.leadDoctorRole}</span>
              </div>
            </div>
          ` : ''}

          <!-- Departments Tags -->
          <div class="mb-3">
            <span class="text-[11px] font-semibold text-slate-400 block mb-1">Departments / Services:</span>
            <div class="flex flex-wrap gap-1">
              ${p.departments.slice(0, 3).map(dept => `
                <span class="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md">
                  ${dept}
                </span>
              `).join('')}
              ${p.departments.length > 3 ? `<span class="px-1.5 py-0.5 text-slate-400 text-[10px]">+${p.departments.length - 3} more</span>` : ''}
            </div>
          </div>

          <!-- Opening Hours & Phone -->
          <div class="text-xs text-slate-600 space-y-1 mb-2">
            <div class="flex items-center space-x-1.5">
              <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i>
              <span class="truncate">${p.openingHours}</span>
            </div>
            ${p.showPhone ? `
              <div class="flex items-center space-x-1.5">
                <i data-lucide="phone" class="w-3.5 h-3.5 text-slate-400"></i>
                <span>${p.phone}</span>
              </div>
            ` : `
              <div class="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
                <span>Phone / Social Links (Not Disclosed - Saino Listed)</span>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Action Buttons (Spec Page 9: Like, Interested, View Hospital, Book Appointment) -->
      <div class="p-4 pt-0">
        <!-- Interactive Engagement Row -->
        <div class="flex items-center justify-between text-xs py-2 border-t border-slate-100 mb-3">
          <button onclick="toggleLike('${p.id}')" class="flex items-center space-x-1 transition ${p.isLiked ? 'text-rose-600 font-bold' : 'text-slate-500 hover:text-rose-600'}">
            <span>${p.isLiked ? '❤️' : '♡'}</span>
            <span>${p.isLiked ? 'Liked' : 'Like'}</span>
          </button>

          <button onclick="toggleInterested('${p.id}')" class="flex items-center space-x-1 transition ${p.isInterested ? 'text-sky-600 font-bold' : 'text-slate-500 hover:text-sky-600'}">
            <span>${p.isInterested ? '★' : '☆'}</span>
            <span>${p.isInterested ? 'Interested' : 'Mark Interested'}</span>
          </button>

          <button onclick="openProviderModal('${p.id}')" class="text-sky-600 hover:text-sky-800 font-semibold flex items-center space-x-0.5">
            <span>View Profile</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- WhatsApp Book Now Button -->
        <button onclick="openBookingWhatsApp('${p.id}')" class="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 transition shadow-sm">
          <i data-lucide="message-circle" class="w-4 h-4"></i>
          <span>Book Appointment via WhatsApp</span>
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 1.5 PROMOTIONAL HEALTHCARE CAMPAIGNS & BIG SCREEN SHOWCASE VIEW
// ==========================================
function renderCampaignsView() {
  const campaigns = window.SAINO_DATA.bigScreenCampaigns || [];
  const currentCamp = campaigns[AppState.activeBigScreenIndex] || campaigns[0];
  const mode = AppState.bigScreenDisplayMode || 'billboard';

  return `
    <div class="max-w-6xl mx-auto mb-16">
      
      <!-- Top Title & Description -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold mb-3 shadow-xs">
          <i data-lucide="tv" class="w-4 h-4 text-rose-600"></i>
          <span class="uppercase tracking-wider">BIG SCREEN HEALTHCARE SHOWCASE · NEPAL</span>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
          Promotional Campaigns & Big Screen Displays
        </h1>
        <p class="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
          Explore prominent healthcare awareness campaigns, super-speciality checkup drives, emergency bloodlines, and group health insurance schemes verified by SAINO HEALTH.
        </p>
      </div>

      <!-- Display Mode Selector & Controls -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center space-x-2 text-xs font-bold text-slate-600">
          <i data-lucide="monitor" class="w-4 h-4 text-rose-600"></i>
          <span>Display Mode:</span>
          <div class="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs">
            <button onclick="setBigScreenMode('billboard')" class="px-3 py-1 rounded-lg font-bold transition ${mode === 'billboard' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'}">
              Digital Billboard (16:9)
            </button>
            <button onclick="setBigScreenMode('spotlight')" class="px-3 py-1 rounded-lg font-bold transition ${mode === 'spotlight' ? 'bg-rose-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}">
              Spotlight Card
            </button>
            <button onclick="setBigScreenMode('mobile')" class="px-3 py-1 rounded-lg font-bold transition ${mode === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'}">
              App Takeover Screen
            </button>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-xs text-slate-500 font-medium hidden sm:inline">Auto-Sliding Active</span>
          <button onclick="prevBigScreenCampaign()" class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition" title="Previous Campaign">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
          <span class="text-xs font-bold text-slate-700 px-2">
            ${AppState.activeBigScreenIndex + 1} / ${campaigns.length}
          </span>
          <button onclick="nextBigScreenCampaign()" class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition" title="Next Campaign">
            <i data-lucide="chevron-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <!-- BIG SCREEN DISPLAY UNIT -->
      <div class="mb-12">
        <div class="big-screen-frame overflow-hidden relative text-white shadow-2xl p-4 sm:p-6 md:p-8">
          
          <!-- Inner Billboard Container with Dynamic Background -->
          <div class="relative rounded-2xl overflow-hidden min-h-[420px] md:min-h-[460px] flex flex-col justify-between p-6 md:p-10"
               style="background: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.75) 50%, rgba(15, 23, 42, 0.95) 100%), url('${currentCamp.bannerImage}') center/cover no-repeat;">
            
            <!-- Screen Glare Effect -->
            <div class="absolute inset-0 screen-glare pointer-events-none"></div>

            <!-- Top Header on Big Screen -->
            <div class="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/15">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 rounded-xl bg-white p-1 shadow-lg overflow-hidden border border-white/50 flex-shrink-0">
                  <img src="${currentCamp.sponsorLogo}" alt="Sponsor" class="w-full h-full object-cover rounded-lg">
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <span class="text-xs font-bold text-white tracking-wide">${currentCamp.sponsor}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm">
                      ${currentCamp.sponsorTier}
                    </span>
                  </div>
                  <span class="text-[11px] text-rose-300 font-bold uppercase tracking-widest block mt-0.5">
                    ${currentCamp.tag}
                  </span>
                </div>
              </div>

              <!-- Discount & Validity Badge -->
              <div class="flex items-center space-x-2">
                <span class="px-3 py-1 rounded-xl text-xs font-black bg-amber-400 text-slate-950 shadow-md">
                  ★ ${currentCamp.discountBadge}
                </span>
                <span class="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/20">
                  ${currentCamp.validTill}
                </span>
              </div>
            </div>

            <!-- Middle Headline & Key Statistics -->
            <div class="relative z-10 my-6 max-w-3xl">
              <div class="inline-block px-2.5 py-0.5 rounded bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-rose-300 mb-2">
                ${currentCamp.tagline}
              </div>
              <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3 drop-shadow-md">
                ${currentCamp.title}
              </h2>
              <p class="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed mb-6">
                ${currentCamp.subtitle}
              </p>

              <!-- Live KPI Stat Pills -->
              <div class="grid grid-cols-3 gap-3 mb-6 max-w-lg">
                ${currentCamp.stats.map(s => `
                  <div class="bg-black/40 backdrop-blur-md border border-white/15 p-2.5 rounded-xl text-center">
                    <span class="text-xs sm:text-sm font-black text-rose-400 block">${s.val}</span>
                    <span class="text-[10px] text-slate-300 font-medium block truncate">${s.label}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Perks Checklist -->
              <ul class="space-y-1.5 text-xs text-slate-100 mb-6">
                ${currentCamp.highlights.map(h => `
                  <li class="flex items-center space-x-2">
                    <span class="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">✓</span>
                    <span>${h}</span>
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Bottom Big Screen Actions -->
            <div class="relative z-10 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/15">
              <div class="flex flex-wrap items-center gap-3">
                <button onclick="openCustomWhatsApp('${currentCamp.title}', '${currentCamp.whatsappMsg}')" class="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-xl transition flex items-center space-x-2">
                  <i data-lucide="message-circle" class="w-4 h-4"></i>
                  <span>Book Campaign Offer via WhatsApp</span>
                </button>
                <button onclick="navigateTo('marketplace')" class="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm transition border border-white/20">
                  Explore Related Providers
                </button>
              </div>

              <!-- Screen Indicator Tabs -->
              <div class="flex items-center space-x-1.5">
                ${campaigns.map((c, idx) => `
                  <button onclick="setBigScreenCampaign(${idx})" 
                    class="h-2.5 rounded-full transition-all ${idx === AppState.activeBigScreenIndex ? 'w-8 bg-rose-500 shadow-md' : 'w-2.5 bg-white/40 hover:bg-white/70'}"
                    title="${c.title}">
                  </button>
                `).join('')}
              </div>
            </div>

          </div>
        </div>

        <!-- Big Screen Stand Aesthetic -->
        <div class="big-screen-stand hidden md:block"></div>
        <div class="big-screen-base hidden md:block"></div>
      </div>

      <!-- Quick Selector Thumbnails for all 6 Campaigns -->
      <div class="mb-14">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base md:text-lg font-bold text-slate-900">Featured Mega Campaigns in Nepal</h3>
          <span class="text-xs text-slate-500">Click any card to load on Big Screen</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          ${campaigns.map((camp, idx) => {
            const isActive = idx === AppState.activeBigScreenIndex;
            return `
              <div onclick="setBigScreenCampaign(${idx})" 
                class="p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive 
                    ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/20 shadow-md scale-[1.02]' 
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${isActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'}">
                      ${camp.tag}
                    </span>
                    <span class="text-[11px] font-bold text-amber-600">${camp.discountBadge}</span>
                  </div>
                  <h4 class="text-xs font-bold text-slate-900 leading-snug mb-1">${camp.title}</h4>
                  <p class="text-[11px] text-slate-500 line-clamp-2 mb-3">${camp.subtitle}</p>
                </div>
                <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span class="font-semibold text-slate-700 truncate">${camp.sponsor}</span>
                  <span class="text-rose-600 font-bold flex-shrink-0">View Screen →</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- "Advertise on SAINO Big Screen" Promotion Portal (For Hospitals & Advertisers) -->
      <div class="p-6 md:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10 max-w-3xl">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white mb-3">
            FOR HEALTHCARE ADVERTISERS & HOSPITALS
          </span>
          <h3 class="text-xl md:text-3xl font-black mb-2">Launch Your Healthcare Campaign on SAINO Big Screen</h3>
          <p class="text-xs md:text-sm text-slate-300 mb-6 leading-relaxed">
            Reach over 150,000+ monthly patients across Kathmandu Valley with premier billboard takeovers, category top pinning, and direct WhatsApp appointment leads.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10">
              <strong class="text-lg md:text-xl font-black text-rose-400 block">150,000+</strong>
              <span class="text-xs text-slate-300">Monthly Patient Views</span>
            </div>
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10">
              <strong class="text-lg md:text-xl font-black text-emerald-400 block">450+ Leads</strong>
              <span class="text-xs text-slate-300">Avg WhatsApp Inquiries / Mo</span>
            </div>
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10">
              <strong class="text-lg md:text-xl font-black text-amber-400 block">#1 Top Rank</strong>
              <span class="text-xs text-slate-300">Category Search Priority</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button onclick="openCustomWhatsApp('Big Screen Campaign Booking', 'Hi SAINO Advertising Team, I would like to book a Big Screen Healthcare Campaign on SAINO Health.')" class="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center space-x-2">
              <i data-lucide="send" class="w-4 h-4"></i>
              <span>Book Big Screen Campaign Slot</span>
            </button>
            <button onclick="openUpgradeBadgeModal('pro')" class="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm transition border border-white/20">
              View Advertising Rates & Tiers
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}

function setBigScreenCampaign(index) {
  AppState.activeBigScreenIndex = index;
  renderApp();
  const screenEl = document.querySelector('.big-screen-frame');
  if (screenEl) {
    screenEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function setBigScreenMode(mode) {
  AppState.bigScreenDisplayMode = mode;
  renderApp();
}

function nextBigScreenCampaign() {
  const total = (window.SAINO_DATA.bigScreenCampaigns || []).length;
  AppState.activeBigScreenIndex = (AppState.activeBigScreenIndex + 1) % total;
  renderApp();
}

function prevBigScreenCampaign() {
  const total = (window.SAINO_DATA.bigScreenCampaigns || []).length;
  AppState.activeBigScreenIndex = (AppState.activeBigScreenIndex - 1 + total) % total;
  renderApp();
}

function initBigScreenAutoPlay() {
  if (AppState.bigScreenAutoPlayInterval) {
    clearInterval(AppState.bigScreenAutoPlayInterval);
  }
  AppState.bigScreenAutoPlayInterval = setInterval(() => {
    if (AppState.activeView === 'campaigns') {
      const total = (window.SAINO_DATA.bigScreenCampaigns || []).length;
      AppState.activeBigScreenIndex = (AppState.activeBigScreenIndex + 1) % total;
      renderApp();
    }
  }, 8000);
}

function bindCampaignsEvents() {}

   // ==========================================
// 2. DISCOVERY VIEW
// ==========================================
  function renderDiscoveryView() {
  const discoverySlides = [
    {
      badge: 'FEATURED HEALTH CAMPAIGN',
      tier: 'VVIP',
      titleHtml: 'Know your <span class="text-[#3b82f6]">health.</span><br>Don\'t wait for symptoms.',
      hospital: 'Grande International Hospital · Kathmandu',
      note: 'Get a comprehensive health screening<br>from trusted healthcare providers of Nepal.',
      middleLabel: 'Includes:',
      middleContent: `
        <ul class="space-y-0.5 text-slate-300 font-medium text-[11px]">
          <li class="flex items-center space-x-1.5"><span class="text-[10px] text-slate-400">✓</span> <span>40+ Health Tests</span></li>
          <li class="flex items-center space-x-1.5"><span class="text-[10px] text-slate-400">✓</span> <span>Doctor Consultation</span></li>
          <li class="flex items-center space-x-1.5"><span class="text-[10px] text-slate-400">✓</span> <span>ECG</span></li>
          <li class="flex items-center space-x-1.5"><span class="text-[10px] text-slate-400">✓</span> <span>Blood & Urine Tests</span></li>
        </ul>
      `,
      packageName: 'Full Body Health Checkup',
      price: 'NPR 2,999',
      image: 'assets/grande.jpg'
    },
    {
      badge: 'FEATURED HEALTH CAMPAIGN',
      tier: 'VVIP',
      titleHtml: 'Expert <span class="text-[#3b82f6]">Care,</span><br>Closer to you.',
      hospital: 'Norvic International Hospital · Kathmandu',
      note: 'Consult experienced specialists<br>through trusted providers on Saino.',
      middleLabel: 'Specialities:',
      middleContent: `
        <p class="text-[11px] text-slate-200 font-semibold tracking-wide">
          CARDIOLOGY • NEUROLOGY • ORTHOPEDICS
        </p>
      `,
      packageName: 'SPECIALIST CONSULTATION',
      price: 'Consultation from NPR 800',
      image: 'assets/norvic.jpg'
    },
    {
      badge: 'FEATURED HEALTH CAMPAIGN',
      tier: 'VVIP',
      titleHtml: 'Your health <span class="text-[#3b82f6]">deserves</span><br>attention too.',
      hospital: 'Nepal Mediciti · Kathmandu',
      note: 'Comprehensive women\'s health screening package.',
      middleLabel: 'Specialities:',
      middleContent: `
        <p class="text-[11px] text-slate-200 font-semibold tracking-wide">
          CARDIOLOGY • NEUROLOGY • ORTHOPEDICS
        </p>
      `,
      packageName: "WOMEN'S HEALTH",
      price: 'Consultation from NPR 1,999',
      image: 'assets/mediciti.jpg'
    }
  ];

  window._discoverySlides = discoverySlides;
  if (typeof AppState.discoverySlideIndex === 'undefined') {
    AppState.discoverySlideIndex = 0;
  }

  const s = discoverySlides[AppState.discoverySlideIndex];

  return `
    <div class="w-full mb-16 px-0">  
       <section class="relative overflow-hidden bg-[#0a0f1d] text-white shadow-xl mb-8 border-y border-slate-800 w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] h-[600px]">
            <a 
                href="#video-library" 
                onclick="navigateTo('marketplace')" 
                class="absolute top-8 right-24 z-20 inline-flex items-center space-x-2 px-4 py-2.5 rounded-md bg-[#334155]/60 hover:bg-[#202d47] border border-slate-400/40 text-slate-200 hover:text-white text-xs font-medium tracking-wide shadow-sm transition-all duration-150 cursor-pointer select-none">
                
                <svg class="w-4 h-4 text-slate-200 shrink-0 stroke-[2]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="2" y="3" width="20" height="14" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="8" y1="21" x2="16" y2="21" stroke-linecap="round"/>
                  <line x1="12" y1="17" x2="12" y2="21" stroke-linecap="round"/>
                  <polygon points="10 7 15 10 10 13" fill="currentColor" stroke="none"/>
                </svg>
                <span class="text-xs">Video Library</span>
                <svg class="w-3 h-3 text-slate-400 stroke-[2.2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
            </a>
        <div class="absolute inset-y-0 right-0 w-[450px] md:w-[610px] bg-gradient-to-l from-slate-800 via-slate-800/60 to-transparent pointer-events-none z-0"></div>
        <div class="flex flex-row items-stretch h-full">
          <div class="w-[280px] md:w-[470px] h-[550px] mt-[19px] mb-[16px] ml-20 relative overflow-hidden p-2 shrink-0">
            <img 
              id="discSlideImg" 
              src="${s.image}" 
              alt="${s.hospital}" 
              class="w-full h-full object-cover rounded-[12px] select-none"
              style="image-rendering: -webkit-optimize-contrast;"
              loading="eager">
          </div>
          <div class="flex-1 py-8 px-8 md:px-12 flex flex-col justify-center text-left h-full overflow-hidden">
            <div>
              <div class="flex items-center space-x-2.5 mb-3">
              <a 
                  href="#featured-campaign" 
                  onclick="navigateTo('marketplace')" 
                  id="discSlideBadge" 
                  class="px-4 py-2 rounded-lg text-xs md:text-sm font-bold tracking-wider uppercase bg-[#142952] text-[#3b82f6] border border-[#1d4ed8]/40 hover:bg-[#1a3668] transition cursor-pointer select-none inline-flex items-center justify-center">
                  ${s.badge || 'FEATURED HEALTH CAMPAIGN'}
                </a>
               <a 
                  href="#vvip-info" 
                  onclick="navigateTo('marketplace')" 
                  id="discSlideTier" 
                  class="px-5 py-2 rounded-lg text-xs md:text-sm font-bold tracking-wide text-purple-300 bg-[#162032] border-2 border-purple-500 hover:border-purple-400 hover:bg-purple-950/40 transition-all duration-150 inline-flex items-center justify-center cursor-pointer select-none">
                  ${s.tier || 'VVIP'}
                </a>
            </div>

        <h2 id="discSlideTitle" class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3 drop-shadow-md">
          ${s.titleHtml}
        </h2>

        <h3 id="discSlideHospital" class="mt-1 text-xs sm:text-[13px] font-bold text-white mb-2">
          ${s.hospital || 'Grande International Hospital · Kathmandu'}
        </h3>

        <p id="discSlideNote" class="text-[11px] sm:text-xs text-slate-300 max-w-sm leading-relaxed mb-3.5">
          ${s.note || 'Get a comprehensive health screening<br>from trusted healthcare providers of Nepal.'}
        </p>

        <div class="mb-3.5 text-[11px] text-slate-300 min-h-[72px]">
          <span id="discSlideMiddleLabel" class="text-[10px] text-slate-400 font-medium block mb-1">${s.middleLabel}</span>
          <div id="discSlideMiddleBox">
            ${s.middleContent}
          </div>
        </div>
        
      <div class="mb-3.5 leading-tight">
        <span class="text-[11px] text-slate-300 font-medium block mb-0.5">Full Body Health Checkup</span>
        <span class="text-xs font-bold text-white tracking-wide">NPR 2,999</span>
        </div>
      </div>

      <div class="flex items-center space-x-3 mt-4 mb-2 z-20">
           <button 
            type="button"
          onclick="triggerCampaignWhatsApp()" 
          class="h-10 px-6 rounded-full border border-slate-600 bg-[#152136] hover:bg-[#1c2c47] text-white text-xs font-medium tracking-wide flex items-center justify-center space-x-2 transition shadow-sm cursor-pointer">
          <span>Watch Campaign</span>
        </button>

          <button 
            onclick="navigateTo('marketplace')" 
            class="h-10 px-6 rounded-full bg-white hover:bg-slate-100 text-[#881337] text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition cursor-pointer">
            <span>View Package</span>
            <span class="text-xs font-black leading-none text-[#881337]">→</span>
          </button>
      </div>
      <p id="discSlideValidity" class="text-xs sm:text-[13px] text-slate-400/60 font-normal tracking-wide mt-3 select-none">
        ${s.validity || 'Valid until 30 September 2026'}
      </p>
            <button onclick="nextDiscoverySlide()" class="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl z-30">
              <svg class="w-5 h-5 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
        
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3.5 z-30">
              <button onclick="goToDiscoverySlide(0)" class="p-1 cursor-pointer">
                <span class="disc-dot block rounded-full transition-all duration-300 ${AppState.discoverySlideIndex === 0 ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}"></span>
              </button>
            <button onclick="goToDiscoverySlide(1)" class="p-1 cursor-pointer">
              <span class="disc-dot block rounded-full transition-all duration-300 ${AppState.discoverySlideIndex === 1 ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}"></span>
            </button>
            <button onclick="goToDiscoverySlide(2)" class="p-1 cursor-pointer">
            <span class="disc-dot block rounded-full transition-all duration-300 ${AppState.discoverySlideIndex === 2 ? 'w-2.5 h-2.5 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}"></span>
            </button>
        </div>
      </section>

      <!-- MAIN SIDE-BY-SIDE GRID LAYOUT -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full px-4 sm:px-6">

        <!-- ================= LEFT COLUMN: NEARBY PROVIDERS ================= -->
        <div class="lg:col-span-5 space-y-4 text-left">
          <div>
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-slate-900 tracking-tight">Nearby Healthcare Providers</h3>
              <span class="text-xs text-slate-500 font-medium">4 results found</span>
            </div>
            <div class="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              <span>Kathmandu, Nepal</span>
            </div>
          </div>

          <div class="relative w-full">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </span>
            <input 
              type="text" 
              id="providerSearchInput"
              oninput="handleProviderSearch(this.value)"
              placeholder="Explore hospitals, clinics, and doctors in this area..." 
              class="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          <div class="flex flex-wrap items-center gap-2 pt-0.5">
            <div class="relative">
              <select id="nearbyLocationSelect" class="appearance-none bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold py-2 pl-3.5 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs">
                <option value="all">📍 All Locations</option>
                <option value="lalitpur">Lalitpur</option>
                <option value="bhaktapur">Bhaktapur</option>
                <option value="pokhara">Pokhara</option>
                <option value="biratnagar">Biratnagar</option>
                <option value="chitwan">Chitwan</option>
                <option value="banepa">Banepa</option>
              </select>
              <span class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </span>
            </div>

            <div class="relative">
              <select id="nearbyCategorySelect" class="appearance-none bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold py-2 pl-3.5 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs">
                <option value="all">Select Category</option>
                <option value="hospital">Hospitals</option>
                <option value="clinic">Clinics</option>
                <option value="diagnostic">Diagnostic Centres</option>
                <option value="wellness">Wellness Centres</option>
                <option value="ambulance">Ambulance</option>
                <option value="bloodbank">Blood Banks</option>
                <option value="homecare">Homecare Centers</option>
                <option value="insurance">Insurance</option>
              </select>
              <span class="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
              </span>
            </div>
            <button type="button" 
              id="applyFiltersBtn"
              onclick="applyProviderFilters()" 
              class="flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-[#B91C1C] hover:text-white hover:border-[#B91C1C] active:scale-95 text-slate-700 text-xs font-semibold py-2 px-4 rounded-xl shadow-xs transition-all duration-200 cursor-pointer">
              <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              <span>Apply Filters</span>
            </button>
          </div>

          <!-- 4 Cards Stack -->
          <div id="nearbyProvidersList" class="flex flex-col gap-4 pt-1">
            <!-- Card 1: Grande International Hospital -->
            <div data-location="baneshwor" data-category="hospital" class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-5 items-start">
              <div class="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200/90 block hover:scale-[1.02] transition-transform duration-200"
                   style="background-color: #f8fafc; background-image: repeating-linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%, #f1f5f9), repeating-linear-gradient(45deg, #f1f5f9 25%, #f8fafc 25%, #f8fafc 75%, #f1f5f9 75%, #f1f5f9); background-position: 0 0, 8px 8px; background-size: 16px 16px;"></div>
              <div class="flex-1 w-full">
                <h4 class="text-base sm:text-lg font-bold text-slate-900 leading-snug">Grande International Hospital</h4>
                <div class="flex items-center space-x-1.5 mt-1">
                  <svg class="w-3.5 h-3.5 text-emerald-500 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                  <span class="text-xs font-semibold text-emerald-700">Saino Verified</span>
                </div>
                <div class="flex items-center space-x-2 mt-2 text-xs">
                  <span class="text-amber-500 font-bold">★ 4.5</span>
                  <span class="text-slate-500">(324 reviews)</span>
                  <span class="text-slate-300">•</span>
                  <span class="text-slate-500">28 Discussions</span>
                </div>
                <p class="text-xs font-semibold text-slate-700 mt-2">Multi-Specialty Hospital</p>
                <div class="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Emergency Services</span>
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Orthopedics</span>
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">ENT Services</span>
                  
                  <span id="card-1-more" class="hidden flex-wrap gap-1.5 transition-all duration-300">
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Cardiology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Neurology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Pediatrics</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Oncology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Gynecology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Dermatology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Radiology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Gastroenterology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Urology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">General Surgery</span>
                  </span>
                  
                  <button type="button" id="card-1-btn" onclick="toggleSpecialties('card-1')" class="text-[11px] font-medium bg-transparent text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-md border border-dashed border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                    + 10 more specialties
                  </button>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div><span>Baneshwor, Kathmandu</span> • <span>3 km away</span></div>
                  <span class="text-emerald-600 font-medium">Open now. Closes at 8:00 PM</span>
                </div>
              </div>
            </div>

            <!-- Card 2: City Hospital -->
            <div data-location="baneshwor" data-category="hospital" class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-5 items-start">
              <div class="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200/90 block hover:scale-[1.02] transition-transform duration-200"
                   style="background-color: #f8fafc; background-image: repeating-linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%, #f1f5f9), repeating-linear-gradient(45deg, #f1f5f9 25%, #f8fafc 25%, #f8fafc 75%, #f1f5f9 75%, #f1f5f9); background-position: 0 0, 8px 8px; background-size: 16px 16px;"></div>
              <div class="flex-1 w-full">
                <h4 class="text-base sm:text-lg font-bold text-slate-900 leading-snug">City Hospital</h4>
                <div class="flex items-center space-x-1.5 mt-1">
                  <svg class="w-3.5 h-3.5 text-amber-500 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                  <span class="text-xs font-semibold text-amber-700">Saino VIP</span>
                </div>
                <div class="flex items-center space-x-2 mt-2 text-xs">
                  <span class="text-amber-500 font-bold">★ 4.5</span>
                  <span class="text-slate-500">(24 reviews)</span>
                  <span class="text-slate-300">•</span>
                  <span class="text-slate-500">283 Discussions</span>
                </div>
                <p class="text-xs font-semibold text-slate-700 mt-2">Multi-Specialty Hospital</p>
                <div class="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Emergency Services</span>
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Orthopedics</span>
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">ENT Services</span>
                  
                  <span id="card-2-more" class="hidden flex-wrap gap-1.5 transition-all duration-300">
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">General Medicine</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">ICU Care</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Dental Care</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Ophthalmology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Physiotherapy</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Pathology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Psychiatry</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Pulmonology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Nephrology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Anesthesiology</span>
                  </span>
                  
                  <button type="button" id="card-2-btn" onclick="toggleSpecialties('card-2')" class="text-[11px] font-medium bg-transparent text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-md border border-dashed border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                    + 10 more specialties
                  </button>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div><span>Baneshwor, Kathmandu</span> • <span>3 km away</span></div>
                  <span class="text-emerald-600 font-medium">Open now. Closes at 8:00 PM</span>
                </div>
              </div>
            </div>

            <div data-location="bhaktapur" data-category="hospital" class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-5 items-start">
              <div class="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200/90 block hover:scale-[1.02] transition-transform duration-200"
                   style="background-color: #f8fafc; background-image: repeating-linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%, #f1f5f9), repeating-linear-gradient(45deg, #f1f5f9 25%, #f8fafc 25%, #f8fafc 75%, #f1f5f9 75%, #f1f5f9); background-position: 0 0, 8px 8px; background-size: 16px 16px;"></div>
              <div class="flex-1 w-full">
                <h4 class="text-base sm:text-lg font-bold text-slate-900 leading-snug">Madhyapur Hospital</h4>
                <div class="flex items-center space-x-1.5 mt-1">
                  <svg class="w-3.5 h-3.5 text-amber-500 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                  <span class="text-xs font-semibold text-amber-700">Saino VVIP</span>
                </div>
                <div class="flex items-center space-x-2 mt-2 text-xs">
                  <span class="text-amber-500 font-bold">★ 4.5</span>
                  <span class="text-slate-500">(32 reviews)</span>
                  <span class="text-slate-300">•</span>
                  <span class="text-slate-500">128 Discussions</span>
                </div>
                <p class="text-xs font-semibold text-slate-700 mt-2">Multi-Specialty Hospital</p>
                <div class="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Emergency Services</span>
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Orthopedics</span>
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">ENT Services</span>
                  
                  <span id="card-3-more" class="hidden flex-wrap gap-1.5 transition-all duration-300">
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Pediatric Care</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Maternity Ward</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">General Surgery</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Dialysis Center</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Cardiology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Internal Medicine</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Radiology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Ultrasound</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Trauma Care</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Pharmacy</span>
                  </span>
                  
                  <button type="button" id="card-3-btn" onclick="toggleSpecialties('card-3')" class="text-[11px] font-medium bg-transparent text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-md border border-dashed border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                    + 10 more specialties
                  </button>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div><span>Baneshwor, Kathmandu</span> • <span>3 km away</span></div>
                  <span class="text-emerald-600 font-medium">Open now. Closes at 8:00 PM</span>
                </div>
              </div>
            </div>
            <!-- Card 4: Bhaktapur Hospital -->
            <div data-location="bhaktapur" data-category="hospital" class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row gap-5 items-start">
              <div class="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200/90 block hover:scale-[1.02] transition-transform duration-200"
                   style="background-color: #f8fafc; background-image: repeating-linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%, #f1f5f9), repeating-linear-gradient(45deg, #f1f5f9 25%, #f8fafc 25%, #f8fafc 75%, #f1f5f9 75%, #f1f5f9); background-position: 0 0, 8px 8px; background-size: 16px 16px;"></div>
              <div class="flex-1 w-full">
                <h4 class="text-base sm:text-lg font-bold text-slate-900 leading-snug">Bhaktapur Hospital</h4>
                <div class="flex items-center space-x-1.5 mt-1">
                  <svg class="w-3.5 h-3.5 text-blue-500 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                  <span class="text-xs font-semibold text-blue-700">Saino Pro</span>
                </div>
                <div class="flex items-center space-x-2 mt-2 text-xs">
                  <span class="text-amber-500 font-bold">★ 4.5</span>
                  <span class="text-slate-500">(394 reviews)</span>
                  <span class="text-slate-300">•</span>
                  <span class="text-slate-500">58 Discussions</span>
                </div>
                <p class="text-xs font-semibold text-slate-700 mt-2">Multi-Specialty Hospital</p>
                <div class="flex flex-wrap items-center gap-1.5 mt-2.5">
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Emergency Services</span>
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Orthopedics</span>
                  <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">ENT Services</span>
                  
                  <span id="card-4-more" class="hidden flex-wrap gap-1.5 transition-all duration-300">
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Community Health</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Gynecology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Dermatology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Blood Bank</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Pathology Lab</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Burn Unit</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Family Medicine</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Endocrinology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Gastroenterology</span>
                    <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">Orthopedic Surgery</span>
                  </span>
                  
                  <button type="button" id="card-4-btn" onclick="toggleSpecialties('card-4')" class="text-[11px] font-medium bg-transparent text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-md border border-dashed border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-pointer">
                    + 10 more specialties
                  </button>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <div><span>Baneshwor, Kathmandu</span> • <span>3 km away</span></div>
                  <span class="text-emerald-600 font-medium">Open now. Closes at 8:00 PM</span>
                </div>
              </div>
            </div>

          </div>

          <button onclick="navigateTo('marketplace')" class="w-full py-3 mt-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-xs cursor-pointer">
            Load More Providers
          </button>
        </div>

        <!-- ================= RIGHT COLUMN: SAINO RATED ================= -->
        <div class="lg:col-span-7 space-y-4 text-left min-w-0">
          
          <!-- Header: Title & Red LIVE Badge -->
          <div class="flex items-center justify-between pb-1">
            <h3 class="text-xl font-bold text-slate-900 tracking-tight">Saino Rated</h3>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#B91C1C] text-white uppercase tracking-wider">
              LIVE
            </span>
          </div>

          <!-- 2x2 Grid (Hospitals, Clinics, Diagnostic Centers, Wellness Centers) -->
          <div class="grid grid-cols-2 gap-4 w-full min-w-0">

            <!-- 1. Hospitals -->
            <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm min-w-0">
              <h4 class="text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">Hospitals</h4>
              <div class="flex flex-col gap-1 text-[11px] min-w-0">
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">01</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">B&B</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">B&B Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">56 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">02</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NO</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Norvic International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.7</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">41 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">03</span><span class="w-5 h-5 rounded bg-purple-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">GR</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Grande International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.8</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">28 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">04</span><span class="w-5 h-5 rounded bg-emerald-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Medical College</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">23 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">05</span><span class="w-5 h-5 rounded bg-amber-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NE</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Nepal Mediciti Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">21 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">06</span><span class="w-5 h-5 rounded bg-blue-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">OM</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Om Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">19 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">07</span><span class="w-5 h-5 rounded bg-teal-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">HA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">HAMS Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.6</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">19 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">08</span><span class="w-5 h-5 rounded bg-indigo-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">PA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Patan Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">17 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">09</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">DH</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Dhulikhel Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">14 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">10</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Model Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">13 disc.</span></div>

                </div>

            </div>

            <!-- 2. Clinics -->
            <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm min-w-0">
              <h4 class="text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">Clinics</h4>
                <div class="flex flex-col gap-1 text-[11px] min-w-0">
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">01</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">B&B</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">B&B Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">56 disc.</span></div>
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">02</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NO</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Norvic International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.7</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">41 disc.</span></div>
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">03</span><span class="w-5 h-5 rounded bg-purple-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">GR</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Grande International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.8</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">28 disc.</span></div>
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">04</span><span class="w-5 h-5 rounded bg-emerald-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Medical College</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">23 disc.</span></div>
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">05</span><span class="w-5 h-5 rounded bg-amber-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NE</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Nepal Mediciti Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">21 disc.</span></div>
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">06</span><span class="w-5 h-5 rounded bg-blue-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">OM</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Om Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">19 disc.</span></div>
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">07</span><span class="w-5 h-5 rounded bg-teal-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">HA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">HAMS Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.6</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">19 disc.</span></div>
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">08</span><span class="w-5 h-5 rounded bg-indigo-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">PA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Patan Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">17 disc.</span></div>
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">09</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">DH</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Dhulikhel Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">14 disc.</span></div>
              <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">10</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Model Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">13 disc.</span></div>
            </div>
            </div>

            <!-- 3. Diagnostic Centers -->
            <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm min-w-0">
              <h4 class="text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">Diagnostic Centers</h4>
              <div class="flex flex-col gap-1 text-[11px] min-w-0">
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">01</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">B&B</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">B&B Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">56 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">02</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NO</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Norvic International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.7</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">41 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">03</span><span class="w-5 h-5 rounded bg-purple-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">GR</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Grande International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.8</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">28 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">04</span><span class="w-5 h-5 rounded bg-emerald-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Medical College</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">23 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">05</span><span class="w-5 h-5 rounded bg-amber-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NE</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Nepal Mediciti Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">21 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">06</span><span class="w-5 h-5 rounded bg-blue-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">OM</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Om Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">19 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">07</span><span class="w-5 h-5 rounded bg-teal-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">HA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">HAMS Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.6</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">19 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">08</span><span class="w-5 h-5 rounded bg-indigo-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">PA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Patan Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">17 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">09</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">DH</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Dhulikhel Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">14 disc.</span></div>
                <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">10</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Model Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">13 disc.</span></div>
              </div>
            </div>

            <!-- 4. Wellness Centers -->
            <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm min-w-0">
              <h4 class="text-xs font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">Wellness Centers</h4>
               <div class="flex flex-col gap-1 text-[11px] min-w-0"> 
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">01</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">B&B</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">B&B Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">56 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">02</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NO</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Norvic International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.7</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">41 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">03</span><span class="w-5 h-5 rounded bg-purple-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">GR</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Grande International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.8</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">28 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">04</span><span class="w-5 h-5 rounded bg-emerald-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Medical College</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">23 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">05</span><span class="w-5 h-5 rounded bg-amber-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NE</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Nepal Mediciti Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">21 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">06</span><span class="w-5 h-5 rounded bg-blue-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">OM</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Om Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">19 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">07</span><span class="w-5 h-5 rounded bg-teal-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">HA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">HAMS Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.6</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">19 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">08</span><span class="w-5 h-5 rounded bg-indigo-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">PA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Patan Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">17 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">09</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">DH</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Dhulikhel Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">14 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">10</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Model Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.3</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">13 disc.</span></div>
                </div>
              </div>
             <!-- 5. Ambulance -->
            <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm min-w-0">
              <h4 class="text-xs font-bold text-slate-800 mb-2 pb-1.5 border-b border-slate-100">Ambulance</h4>
              <div class="flex flex-col gap-1 text-[11px] min-w-0">
                     <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">01</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">B&B</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">B&B Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">56 disc.</span></div>
                    <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">02</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NO</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Norvic International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.7</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">41 disc.</span></div>
                    <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">03</span><span class="w-5 h-5 rounded bg-purple-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">GR</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Grande International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.8</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">28 disc.</span></div>
                    <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">04</span><span class="w-5 h-5 rounded bg-emerald-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Medical College</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">23 disc.</span></div>
                    <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">05</span><span class="w-5 h-5 rounded bg-amber-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NE</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Nepal Mediciti Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">21 disc.</span></div>
                  </div>
                </div>

                 <!-- 6. Blood bank -->
                <div class="bg-white border border-slate-200/90 rounded-xl p-3 shadow-sm min-w-0">
              <h4 class="text-xs font-bold text-slate-800 mb-2 pb-1.5 border-b border-slate-100">Blood Bank</h4>
              <div class="flex flex-col gap-1 text-[11px] min-w-0">
                   <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">01</span><span class="w-5 h-5 rounded bg-slate-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">B&B</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">B&B Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">56 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">02</span><span class="w-5 h-5 rounded bg-emerald-900 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NO</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Norvic International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.7</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">41 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-extrabold text-[#B91C1C] w-4 shrink-0 pt-0.5">03</span><span class="w-5 h-5 rounded bg-purple-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">GR</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Grande International Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★★</span><span class="text-[10px] text-slate-500 font-medium">4.8</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">28 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">04</span><span class="w-5 h-5 rounded bg-emerald-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">KA</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Kathmandu Medical College</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.5</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">23 disc.</span></div>
                  <div class="flex items-start justify-between py-1 min-w-0 gap-2 text-left"><div class="flex items-start space-x-2 min-w-0 flex-1 text-left"><span class="font-medium text-slate-400 w-4 shrink-0 pt-0.5">05</span><span class="w-5 h-5 rounded bg-amber-950 text-white text-[8px] font-bold flex items-center justify-center shrink-0 mt-0.5">NE</span><div class="min-w-0 flex-1 text-left"><span class="font-semibold text-slate-800 block leading-snug truncate">Nepal Mediciti Hospital</span><div class="flex items-center space-x-1 mt-0.5"><span class="text-amber-500 text-[10px]">★★★★☆</span><span class="text-[10px] text-slate-500 font-medium">4.4</span></div></div></div><span class="text-[10px] text-slate-400 shrink-0 pt-0.5">21 disc.</span></div>
                </div>
              </div>
          </div>
          </div>

        </div>

      </div>
      <!-- 1. People Are Talking About -->
      <section class="mt-14 px-4 sm:px-6">
        <div class="flex items-center justify-between mb-6">
        <div>
            <span class="text-xs font-bold uppercase tracking-wider text-rose-600">COMMUNITY</span>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-800">People Are Talking About</h2>
          </div>
           <a href="#discussions" onclick="navigateTo('discussions')" class="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 cursor-pointer">View All Discussions →</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          <!-- Grande -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">GI</div>
                <div><h4 class="font-bold text-slate-900 text-xs">Grande International Hospital</h4><span class="text-[11px] text-slate-400">2 hours ago</span></div>
              </div>
              <p class="text-xs text-slate-700 font-medium mb-4">"Has anyone recently visited their emergency department?"</p>
            </div>
            <div>
              <div class="text-[11px] text-slate-500 mb-3">14 replies • 9 helpful</div>
              <button onclick="openDiscussionModal('disc-grande')" class="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">View Discussion</button>
              
            </div>
          </div>
          <!-- Norvic -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-bold text-xs">NI</div>
                <div><h4 class="font-bold text-slate-900 text-xs">Norvic International Hospital</h4><span class="text-[11px] text-slate-400">5 hours ago</span></div>
              </div>
              <p class="text-xs text-slate-700 font-medium mb-4">"How was your experience with the cardiology department?"</p>
            </div>
            <div>
              <div class="text-[11px] text-slate-500 mb-3">22 replies • 17 helpful</div>
             <button onclick="openDiscussionModal('disc-norvic')" class="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">View Discussion</button>
            </div>
          </div>
          <!-- HAMS -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-purple-950 text-white flex items-center justify-center font-bold text-xs">HA</div>
                <div><h4 class="font-bold text-slate-900 text-xs">HAMS Hospital</h4><span class="text-[11px] text-slate-400">Yesterday</span></div>
              </div>
              <p class="text-xs text-slate-700 font-medium mb-4">"Anyone know about their dermatology OPD timing and wait time?"</p>
            </div>
            <div>
              <div class="text-[11px] text-slate-500 mb-3">8 replies • 5 helpful</div>
              <button onclick="openDiscussionModal('disc-hams')" class="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">View Discussion</button>
            </div>
          </div>
          <!-- B&B -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">BB</div>
                <div><h4 class="font-bold text-slate-900 text-xs">B&B Hospital</h4><span class="text-[11px] text-slate-400">2 days ago</span></div>
              </div>
              <p class="text-xs text-slate-700 font-medium mb-4">"Is the diabetes specialist available on weekends at B&B?"</p>
            </div>
            <div>
              <div class="text-[11px] text-slate-500 mb-3">11 replies • 8 helpful</div>
              <button onclick="openDiscussionModal('disc-bb')" class="w-full py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50">View Discussion</button>
            </div>
          </div>
        </div>
      </section>

      <hr class="border-slate-200 my-10 mx-4 sm:px-6" />

      <!-- 2. What Patients Are Saying -->
      <section class="mb-14 px-4 sm:px-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-rose-600">PATIENT VOICES</span>
            <h2 class="text-xl sm:text-2xl font-bold text-slate-900">What Patients Are Saying</h2>
          </div>
          <div class="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button class="px-3 py-1.5 bg-white shadow-xs rounded-lg text-slate-900 font-bold">Most Recent</button>
            <button class="px-3 py-1.5 hover:text-slate-900">Highest Rated</button>
            <button class="px-3 py-1.5 hover:text-slate-900">Lowest Rated</button>
          </div>
        </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          <!-- Priya -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2.5">
                  <div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">PM</div>
                  <div><span class="font-bold text-slate-900 text-xs block">Priya Maharjan</span><span class="text-[10px] text-slate-400">3 days ago</span></div>
                </div>
                <div class="text-amber-400 text-xs">★★★★★</div>
              </div>
              <p class="text-xs text-slate-600 mb-4">"The emergency department at Grande was incredibly efficient. My father was admitted within minutes and the staff was professional throughout."</p>
              <div class="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-4 text-[11px]">
                <span class="font-bold text-slate-900 block mb-0.5">Provider Response</span>
                <p class="text-slate-600">Thank you for your kind words. We're glad your father received prompt care.</p>
              </div>
            </div>
            <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <div class="mb-2 text-slate-600 font-medium">Grande International Hospital</div>
              <div class="flex justify-between"><span>👍 Helpful (24)</span><span>💬 3</span></div>
            </div>
          </div>
          <!-- Rajesh -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2.5">
                  <div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">RT</div>
                  <div><span class="font-bold text-slate-900 text-xs block">Rajesh Thapa</span><span class="text-[10px] text-slate-400">1 week ago</span></div>
                </div>
                <div class="text-amber-400 text-xs">★★★★☆</div>
              </div>
              <p class="text-xs text-slate-600 mb-4">"Good cardiologist but the waiting time is long. Arrived at 10am, waited nearly 2 hours before seeing Dr. Shrestha. The consultation was thorough."</p>
            </div>
            <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <div class="mb-2 text-slate-600 font-medium">Norvic International Hospital</div>
              <div class="flex justify-between"><span>👍 Helpful (18)</span><span>💬 5</span></div>
            </div>
          </div>
          <!-- Sunita -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2.5">
                  <div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">SG</div>
                  <div><span class="font-bold text-slate-900 text-xs block">Sunita Gurung</span><span class="text-[10px] text-slate-400">2 weeks ago</span></div>
                </div>
                <div class="text-amber-400 text-xs">★★★★★</div>
              </div>
              <p class="text-xs text-slate-600 mb-4">"Excellent physiotherapy unit at HAMS. Three weeks of treatment for my knee injury and I'm back to normal. The therapists genuinely care."</p>
            </div>
            <div class="pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <div class="mb-2 text-slate-600 font-medium">HAMS Hospital</div>
              <div class="flex justify-between"><span>👍 Helpful (31)</span><span>💬 7</span></div>
            </div>
          </div>
        </div>

       <div class="mt-8 text-center">
        <button type="button" onclick="window.navigateTo('all-reviews')" class="px-6 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-xs cursor-pointer">See More Reviews</button>
      </div>
      </section>
    </div>
  `;
}
function renderProvidersShowcaseView() {
  return renderDiscoveryView();
}

// ==========================================
// 3. DEDICATED "LIST YOUR CARE" / "LIST YOUR BUSINESS" VIEW (PAGE 1 - 8 OFFICIAL SPEC)
// ==========================================
function renderListYourCareView() {
  return `
    <div class="max-w-6xl mx-auto mb-16">
      
      <!-- Top Title & Description (Page 1 Spec) -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold mb-3 shadow-xs">
          <i data-lucide="plus-circle" class="w-4 h-4 text-rose-600"></i>
          <span class="uppercase tracking-wider">LIST YOUR BUSINESS & HEALTHCARE SERVICES</span>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-3">
          Built to Host Every Part of Your Healthcare Ecosystem
        </h1>
        <p class="text-sm sm:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed">
          After successful collaboration with Healthcare Organizations, we are equipped to bring and connect the healthcare experience better via SAINO.
        </p>
      </div>

      <!-- WHAT CAN YOU LIST? 9 CATEGORY ILLUSION CARDS (Page 1 Spec) -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base md:text-lg font-bold text-slate-900">What Can You List on SAINO HEALTH?</h3>
          <span class="text-xs text-rose-600 font-bold">9 Healthcare Categories</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          ${[
            { title: 'Healthcare Facilities', sub: 'Hospitals, Nursing Homes, Specialty Centres', icon: 'building-2', color: 'rose' },
            { title: 'Healthcare Professionals', sub: 'Consultants, Surgeons, Dentists, General Practitioners', icon: 'stethoscope', color: 'blue' },
            { title: 'Diagnostics & Medical Services', sub: 'Pathology Labs, 3.0T MRI, CT Scans, Ultrasound', icon: 'microscope', color: 'emerald' },
            { title: 'Online Medical Retail', sub: 'Verified Pharmacies, Surgical & Medical Supplies', icon: 'pill', color: 'amber' },
            { title: 'Healthcare at Home', sub: 'Bedside Nursing, Elderly Care, Post-Op Rehabilitation', icon: 'home', color: 'indigo' },
            { title: 'Healthcare Organizations Campaigns', sub: 'Health Drives, Bloodline Networks, Charity Drives', icon: 'tv', color: 'rose' },
            { title: 'Healthcare Awareness', sub: 'Preventative Screening, Patient Education Catalogues', icon: 'heart-pulse', color: 'teal' },
            { title: 'Wellness Facilities', sub: 'Ayurveda, Physiotherapy, Yoga & Mental Wellness', icon: 'sparkles', color: 'violet' },
            { title: 'Health INSURANCE', sub: 'Cashless Mediclaim, Family Health Cover Policies', icon: 'shield-check', color: 'sky' }
          ].map(c => `
            <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:border-rose-300 transition flex items-start space-x-3.5">
              <div class="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-rose-100">
                <i data-lucide="${c.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-xs sm:text-sm font-bold text-slate-900 leading-tight">${c.title}</h4>
                <p class="text-[11px] text-slate-500 mt-0.5 leading-snug">${c.sub}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- WHAT ARE THE SERVICES WE OFFER: VISUAL REPRESENTATION (Page 1 & 2 Spec) -->
      <div class="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl shadow-xl mb-12">
        <div class="max-w-3xl mb-6">
          <span class="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
            SERVICES WE OFFER
          </span>
          <h3 class="text-xl md:text-3xl font-extrabold mt-2 mb-2">Comprehensive Healthcare Technology Suite</h3>
          <p class="text-xs md:text-sm text-slate-300 leading-relaxed">
            Apart from healthcare hosting, SAINO Health also provides SEO services, appointment management, integrated payment gateways, and walk-in/walk-out booking intelligence — all accessible from a single platform.
          </p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          ${[
            { title: 'Trusted Badges', icon: 'award' },
            { title: 'Online Discovery & Content', icon: 'compass' },
            { title: 'Appointment Management', icon: 'calendar-check' },
            { title: 'Digital Unified Marketplace', icon: 'layout-grid' },
            { title: 'Reports & Business Insights', icon: 'bar-chart-3' },
            { title: 'Easy Booking Experience', icon: 'message-circle' },
            { title: 'Healthcare Importance to Public', icon: 'users' },
            { title: 'Medical Travel', icon: 'plane', comingSoon: true },
            { title: 'Surgery Queries', icon: 'activity', comingSoon: true },
            { title: 'Quickies by Saino', icon: 'zap', comingSoon: true },
            { title: 'SAINO Health App', icon: 'smartphone', comingSoon: true },
            { title: 'SAINO Corp Health', icon: 'briefcase', comingSoon: true }
          ].map(s => `
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10 flex items-center space-x-2.5">
              <i data-lucide="${s.icon}" class="w-4 h-4 text-rose-400 flex-shrink-0"></i>
              <span class="font-semibold text-slate-100 text-[11px] leading-tight">${s.title}</span>
              ${s.comingSoon ? `<span class="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-slate-950 font-black">Soon</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- INTERACTIVE TWO-COLUMN ONBOARDING PORTAL (Page 2 Specification) -->
      <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12 grid grid-cols-1 lg:grid-cols-12">
        
        <!-- Left Side: SAINO Logo & Do It Yourself Sign-In / Register Form -->
        <div class="lg:col-span-5 p-6 sm:p-8 bg-slate-50 border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div class="mb-6">
              <img src="assets/logo.png" alt="SAINO HEALTH" class="h-16 w-auto object-contain">
              <h3 class="text-base font-extrabold text-slate-900 mt-4">Do it yourself</h3>
              <p class="text-xs text-slate-500">Sign in or register your healthcare business</p>
            </div>

            <form onsubmit="handleListYourCareSubmit(event)" class="space-y-3.5 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Email ID</label>
                <input type="email" id="lycEmail" required placeholder="admin@careclinic.np" class="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Password</label>
                <input type="password" id="lycPassword" required placeholder="••••••••" class="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none">
              </div>
              <button type="submit" class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl transition shadow-md">
                Proceed to Register / Manage
              </button>
              <div class="flex items-center justify-between text-[11px] pt-1">
                <a href="#" onclick="showToast('Password reset link dispatched to email!')" class="text-rose-600 hover:underline font-semibold">Forgot Password</a>
                <a href="#" onclick="showToast('OTP sent to verified business mobile!')" class="text-slate-600 hover:underline font-semibold">Log in with OTP</a>
              </div>
            </form>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-200 text-slate-500 text-[11px]">
            <p class="font-bold text-slate-700">Didn't Have an Account? <a href="#tierComparisonSection" class="text-rose-600 hover:underline font-black">Sign up below</a></p>
            <p class="mt-1">In case of any query, please write to: <a href="mailto:support@sainotechventures.com" class="text-rose-600 font-bold underline">support@sainotechventures.com</a></p>
          </div>
        </div>

        <!-- Right Side: Visual Feature Pillars (Page 2 Specification) -->
        <div class="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            <span class="text-xs font-black uppercase text-rose-600 tracking-wider">SUPERFAST ONBOARDING</span>
            <h3 class="text-xl font-bold text-slate-900 mt-1 mb-6">Why Healthcare Providers Choose SAINO</h3>

            <div class="space-y-4">
              <div class="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="file-check" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 leading-tight">Complete your registration with Company ID and PAN Details.</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Seamless compliance and legal entity verification across Nepal.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="zap" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 leading-tight">Take your listing and badge superfast.</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Instant marketplace directory publication and SEO indexing.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="message-square" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 leading-tight">Manage Reviews, Campaigns & Appointment Booking Superfast.</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Direct WhatsApp appointment routing with zero patient friction.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="trending-up" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-900 leading-tight">Monitor Insights and Analytics easily.</h4>
                  <p class="text-[11px] text-slate-500 mt-0.5">Live tracking of patient views, click-to-book ratios, and reach.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- 4-TIER SUBSCRIPTION PRICING PLANS (Page 3 - 7 Official Specification) -->
      <div id="tierComparisonSection" class="mb-14">
        <div class="text-center mb-8">
          <span class="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 uppercase tracking-wider">
            SUBSCRIPTION TIERS & VERIFIED BADGES
          </span>
          <h2 class="text-xl md:text-3xl font-extrabold text-slate-900 mt-2 mb-2">Choose the Right Growth Plan for Your Facility</h2>
          <p class="text-xs md:text-sm text-slate-500">From free directory listings to flagship enterprise growth packages</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          ${window.SAINO_DATA.subscriptionTiers.map(plan => `
            <div class="rounded-3xl border ${plan.highlight ? 'border-2 border-rose-500 shadow-xl bg-rose-50/20 ring-4 ring-rose-500/10' : 'border-slate-200 bg-white shadow-sm'} p-5 sm:p-6 flex flex-col justify-between relative">
              ${plan.popularTag ? `
                <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-0.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow">
                  ${plan.popularTag}
                </div>
              ` : ''}

              <div>
                <div class="mb-4">
                  <span class="text-xs font-black text-rose-700 uppercase tracking-wider">${plan.name}</span>
                  <div class="text-xl sm:text-2xl font-black text-slate-900 mt-1">${plan.price}</div>
                  <span class="text-[11px] text-slate-400 font-medium">${plan.period}</span>
                </div>

                <ul class="space-y-2 mb-6 text-xs text-slate-700">
                  ${plan.features.map(f => `
                    <li class="flex items-start space-x-2">
                      <i data-lucide="check" class="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5"></i>
                      <span class="leading-snug">${f}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>

              <button onclick="openUpgradeBadgeModal('${plan.id}')" class="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition ${
                plan.highlight 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }">
                ${plan.cta}
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- DOCUMENT UPLOAD & COMPLIANCE GUIDE FOR PAID BADGES (Page 3 & 4 Specification) -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm mb-12">
        <div class="mb-6 pb-4 border-b border-slate-100">
          <div class="flex items-center space-x-2 text-rose-600 text-xs font-bold uppercase mb-1">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
            <span>COMPLIANCE & VERIFICATION STANDARDS</span>
          </div>
          <h3 class="text-lg md:text-xl font-bold text-slate-900">Required Verification Documents for Paid Badges</h3>
          <p class="text-xs text-slate-500 mt-0.5">All documents must be crisp 200 DPI scans (PDF, JPEG, or PNG up to 5MB with 4 outer corners visible).</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <!-- Hospital & Clinic -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="building-2" class="w-4 h-4 text-rose-600"></i>
              <span>Hospital & Clinic</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-slate-600">
              <li>• Facility Operating Licence</li>
              <li>• Clinical Establishment Act Reg.</li>
              <li>• Biomedical waste (BMW) mgmt</li>
              <li>• Fire Safety and NOC</li>
              <li>• Professional Indemnity Insurance</li>
              <li>• Tax & Incorporation Documents</li>
              <li>• PAN / Corporate Charter</li>
            </ul>
          </div>

          <!-- Diagnostic Centres -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="microscope" class="w-4 h-4 text-rose-600"></i>
              <span>Diagnostic & Labs</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-slate-600">
              <li>• Lab Accreditation Certificate</li>
              <li>• PNDT Act Registration</li>
              <li>• AERB / Radiation Safety Approval</li>
              <li>• Signatory Doctor Qualifications</li>
            </ul>
          </div>

          <!-- Blood Banks -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="droplet" class="w-4 h-4 text-rose-600"></i>
              <span>Blood Banks</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-slate-600">
              <li>• Drug & Component License</li>
              <li>• Medical Officer Credentials</li>
              <li>• Equipment Calibration Logs</li>
            </ul>
          </div>

          <!-- Homecare Centres -->
          <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 class="font-bold text-slate-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="home" class="w-4 h-4 text-rose-600"></i>
              <span>Homecare Centres</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-slate-600">
              <li>• Nursing Agency/Trade License</li>
              <li>• Staff Background Clearances</li>
              <li>• Staff Medical Certifications</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- INTERACTIVE FACILITY REGISTRATION FORM (Pages 3 & 4 Specification) -->
      <div class="bg-gradient-to-br from-slate-900 via-[#881337] to-slate-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div class="max-w-2xl mb-8">
          <span class="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider">
            INSTANT ONBOARDING
          </span>
          <h3 class="text-xl sm:text-3xl font-extrabold mt-3 mb-2">Register Your Healthcare Facility on SAINO</h3>
          <p class="text-xs sm:text-sm text-rose-100">Submit your organization details below. Our compliance team will review and activate your profile within 4 hours.</p>
        </div>

        <form onsubmit="handleFacilityRegistration(event)" class="space-y-5 text-xs max-w-3xl">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-200 mb-1">Organisation Name</label>
              <input type="text" id="regOrgName" required placeholder="e.g. Kathmandu City Care Hospital" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-slate-200 mb-1">Organisation Address / Location</label>
              <input type="text" id="regOrgAddress" required placeholder="e.g. Lazimpat, Kathmandu" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-slate-200 mb-1">Company Registration No.</label>
              <input type="text" id="regOrgRegNo" required placeholder="e.g. REG-784920/081" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-slate-200 mb-1">Organisation VAT / PAN No.</label>
              <input type="text" id="regOrgPan" required placeholder="e.g. 601928471" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold text-slate-200 mb-1">Contact Person Full Name</label>
              <input type="text" id="regContactName" required placeholder="Dr. Ramesh Sharma" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-slate-200 mb-1">Mobile Number</label>
              <input type="tel" id="regMobile" required placeholder="9801234567" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-slate-200 mb-1">Official Email Address</label>
              <input type="email" id="regEmail" required placeholder="contact@hospital.np" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-200 mb-1">Choose Verification Plan</label>
            <select id="regPlanSelect" class="w-full bg-slate-900 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-400">
              <option value="listed">SAINO LISTED (Free Listing - NPR 0)</option>
              <option value="pro" selected>SAINO PRO (✓ Pro Verified - NPR 3,600 / month)</option>
              <option value="vip">SAINO VIP (👑 VIP Verified - NPR 5,900 / month)</option>
              <option value="vvip">SAINO HEALTH VVIP (🏆 Flagship Growth - NPR 9,999 / month)</option>
            </select>
          </div>

          <div class="pt-2 flex flex-wrap items-center gap-4">
            <button type="submit" class="px-6 py-3.5 bg-white hover:bg-rose-50 text-rose-950 font-black rounded-2xl shadow-xl transition transform hover:scale-105 text-xs sm:text-sm">
              Submit Facility for Verification →
            </button>
            <span class="text-[11px] text-rose-200">🔒 256-Bit SSL Encrypted & Legal Sign Agreement via SAINO</span>
          </div>
        </form>
      </div>

    </div>
  `;
}

function bindListYourCareEvents() {}

function handleListYourCareSubmit(e) {
  if (e) e.preventDefault();
  showToast('Logged in to SAINO Business Dashboard!');
}

function handleFacilityRegistration(e) {
  if (e) e.preventDefault();
  const org = document.getElementById('regOrgName')?.value || 'Your Facility';
  showToast(`Registration submitted for ${org}! Compliance team will verify your license.`);
}

// ==========================================
// 3. SAINO BOOST / ADVERTISERS VIEW (PAGE 4 SPEC)
// ==========================================
function renderBoostView() {
  return `
    <div class="max-w-5xl mx-auto mb-16">
      <!-- Hero Banner -->
      <div class="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white mb-10 shadow-xl relative overflow-hidden">
        <div class="relative z-10 max-w-2xl">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
            SAINO BOOST & HEALTHCARE CAMPAIGNS
          </span>
          <h1 class="text-2xl md:text-4xl font-extrabold mt-3 mb-3">
            Accelerate Patient Reach with Precision Healthcare Advertising
          </h1>
          <p class="text-xs md:text-sm text-purple-100 leading-relaxed mb-6">
            Showcase your hospital departments, special diagnostic packages, or insurance schemes to targeted patients actively searching for care in your district.
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <button onclick="openAdCampaignModal()" class="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-xs md:text-sm hover:bg-slate-100 transition shadow">
              Launch Advertising Campaign
            </button>
            <button onclick="navigateTo('contact')" class="px-5 py-2.5 bg-white/10 text-white font-bold rounded-xl text-xs md:text-sm hover:bg-white/20 transition border border-white/20">
              Speak with Sales Team
            </button>
          </div>
        </div>
      </div>

      <!-- Feature Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
            <i data-lucide="trending-up" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900 mb-2">Category Search Pinning</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Appear at the #1 position when patients search for specific specialities like "Cardiologist in Kathmandu" or "24/7 Ambulance".
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
            <i data-lucide="layers" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900 mb-2">Home Banner Showcase</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Interactive top carousel placement with 8 rotating sponsored slots linking straight to your WhatsApp triage booking team.
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-slate-900 mb-2">Transparent ROI Analytics</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Real-time measurement of patient card impressions, WhatsApp appointment initiates, profile clicks, and phone leads.
          </p>
        </div>
      </div>

      <!-- Advertising FAQ Section (Page 4 Requirement) -->
      <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mb-10">
        <h3 class="text-lg font-bold text-slate-900 mb-4">Advertising & Payment Policies FAQ</h3>
        <div class="space-y-4">
          ${window.SAINO_DATA.boostFaqs.map(faq => `
            <div class="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 class="text-xs md:text-sm font-bold text-slate-800 mb-1 flex items-center space-x-2">
                <i data-lucide="help-circle" class="w-4 h-4 text-sky-600 flex-shrink-0"></i>
                <span>${faq.q}</span>
              </h4>
              <p class="text-xs text-slate-600 leading-relaxed pl-6">${faq.a}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 4. ABOUT US VIEW (PAGE 4, 5, 6 SPEC)
// ==========================================
function renderAboutView() {
  return `
    <div class="max-w-4xl mx-auto mb-16">
      <!-- Mission & Hero with Large Official Logo -->
      <div class="text-center mb-12">
        <div class="inline-block p-5 sm:p-7 bg-white rounded-3xl shadow-xl border border-slate-200 mb-6">
          <img src="assets/logo.png" alt="SAINO HEALTH" class="h-28 sm:h-36 md:h-40 w-auto max-w-[360px] object-contain mx-auto">
        </div>
        <div class="block">
          <span class="px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold bg-rose-100 text-rose-800 uppercase tracking-widest">
            CONNECTED. SIMPLIFIED. BETTER HEALTH.
          </span>
        </div>
        <h1 class="text-2xl md:text-4xl font-extrabold text-slate-900 mt-4 mb-2">
          Discover. Explore. Choose. Book with Confidence.
        </h1>
        <p class="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          At SAINO Health, we bring together accurate, relevant, and thoughtfully presented information about healthcare providers and services, enabling users to discover, explore, and make more informed healthcare decisions with confidence.
        </p>
      </div>

      <!-- Core Quote 1 (Page 4 spec) -->
      <div class="quote-box p-6 md:p-8 rounded-2xl mb-12 shadow-sm">
        <p class="text-base md:text-lg font-medium text-slate-800 italic leading-relaxed mb-3">
          “Healthcare should not be a collection of disconnected services. It should be a connected ecosystem where people, providers, and information come together to make better decisions.”
        </p>
        <span class="text-xs font-bold text-sky-700 tracking-wider uppercase">— SAINO Health</span>
      </div>

      <!-- Our Offerings (Page 4 & 5 spec) -->
      <div class="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm mb-12">
        <h3 class="text-lg font-bold text-slate-900 mb-4">Our Offerings</h3>
        <div class="space-y-4">
          <div class="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
            <div>
              <strong class="text-xs md:text-sm text-slate-900 block">Comprehensive Healthcare Directory</strong>
              <p class="text-xs text-slate-600 mt-0.5">Detailed and verified information on healthcare providers, helping users discover doctors, clinics, hospitals, diagnostic centres, and healthcare services.</p>
            </div>
          </div>

          <div class="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
            <div>
              <strong class="text-xs md:text-sm text-slate-900 block">Online Appointment Booking</strong>
              <p class="text-xs text-slate-600 mt-0.5">Explore provider profiles, services, reviews, and availability, and book appointments conveniently through SAINO Health WhatsApp integration.</p>
            </div>
          </div>

          <div class="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
            <div>
              <strong class="text-xs md:text-sm text-slate-900 block">Connected Healthcare Services</strong>
              <p class="text-xs text-slate-600 mt-0.5">Access a growing network of healthcare providers and services through one trusted, connected marketplace.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Core Quote 2 (Page 5 spec) -->
      <div class="quote-box p-6 md:p-8 rounded-2xl mb-12 shadow-sm">
        <p class="text-base md:text-lg font-medium text-slate-800 italic leading-relaxed mb-3">
          “The best care is more than a service—it is the feeling of being genuinely understood, cared for, and supported by someone you can trust.”
        </p>
        <span class="text-xs font-bold text-sky-700 tracking-wider uppercase">— Our Care Philosophy</span>
      </div>

      <!-- 4 Pillars: Connect · Trust · Transparency · Choice (Page 5 & 6 spec) -->
      <div class="mb-12">
        <div class="text-center mb-8">
          <span class="text-xs font-bold uppercase tracking-wider text-sky-600">Our Approach to Healthcare</span>
          <h2 class="text-xl md:text-2xl font-bold text-slate-900 mt-1">Connecting People with Healthcare They Can Trust</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
              <i data-lucide="link" class="w-5 h-5"></i>
            </div>
            <h3 class="text-base font-bold text-slate-900 mb-2">Connect</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Healthcare is more than finding a doctor or booking an appointment. It is about creating meaningful connections between people and the healthcare providers they choose. SAINO Health helps bring patients and providers closer through easier discovery, access, and communication.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <h3 class="text-base font-bold text-slate-900 mb-2">Trust</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Trust is at the heart of healthcare. We are committed to providing reliable provider information and maintaining a responsible verification system, helping people explore healthcare options with greater confidence.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <i data-lucide="eye" class="w-5 h-5"></i>
            </div>
            <h3 class="text-base font-bold text-slate-900 mb-2">Transparency</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              We believe people deserve clarity when making healthcare decisions. We strive to present provider information, services, reviews, activities, and promotional placements clearly, so users can explore their options and make informed choices.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <i data-lucide="sparkles" class="w-5 h-5"></i>
            </div>
            <h3 class="text-base font-bold text-slate-900 mb-2">Choice</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Every individual has different healthcare needs. We believe people should have the freedom to explore relevant providers and services, understand their options, and choose the care that feels right for them.
            </p>
          </div>
        </div>
      </div>

      <!-- Data Privacy & Security (Page 6 spec) -->
      <div class="bg-slate-900 text-white rounded-3xl p-6 md:p-8 mb-12 shadow-xl">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <i data-lucide="lock" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold">Data Privacy and Security is Our Top Priority</h3>
            <p class="text-xs text-emerald-400 font-semibold">Your data has only one owner. YOU.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 mb-6">
          <div class="flex items-center space-x-2">
            <i data-lucide="shield" class="w-4 h-4 text-emerald-400"></i>
            <span>SAINO does not have access to your private medical data.</span>
          </div>
          <div class="flex items-center space-x-2">
            <i data-lucide="shield" class="w-4 h-4 text-emerald-400"></i>
            <span>SAINO does not sell or share your data with any third party.</span>
          </div>
          <div class="flex items-center space-x-2">
            <i data-lucide="key" class="w-4 h-4 text-emerald-400"></i>
            <span>256-Bit Military-Grade Encryption Standards</span>
          </div>
          <div class="flex items-center space-x-2">
            <i data-lucide="users" class="w-4 h-4 text-emerald-400"></i>
            <span>Role-Based Strict Access Governance</span>
          </div>
        </div>
      </div>

      <!-- Health Care Investors (Page 6 spec) -->
      <div class="p-6 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 class="text-base font-bold text-slate-900">HEALTH CARE INVESTORS</h4>
          <p class="text-xs text-slate-600">Let’s build the future of connected healthcare together.</p>
        </div>
        <button onclick="navigateTo('contact')" class="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition shadow-sm">
          [Investor Relations →]
        </button>
      </div>
    </div>
  `;
}

// ==========================================
// 5. CONTACT US VIEW (PAGE 7 & 8 SPEC)
// ==========================================
function renderContactView() {
  return `
    <div class="max-w-5xl mx-auto mb-16">
      <div class="text-center mb-10">
        <span class="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 uppercase tracking-wider">
          Contact SAINO Health
        </span>
        <h1 class="text-2xl md:text-4xl font-extrabold text-slate-900 mt-3 mb-2">
          We’re Here to Connect
        </h1>
        <p class="text-sm md:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Whether you’re looking to discover healthcare, join SAINO Health as a provider, promote your services, partner with us, or learn more about our platform, our team is here to help.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left: Audience Information Router (Page 7 spec) -->
        <div class="lg:col-span-5 space-y-4">
          <h3 class="text-sm font-bold uppercase tracking-wider text-slate-400">How can we help?</h3>

          <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h4 class="text-xs font-bold text-slate-900 flex items-center space-x-1.5 mb-1">
              <i data-lucide="user" class="w-4 h-4 text-sky-600"></i>
              <span>For Patients & Users</span>
            </h4>
            <p class="text-xs text-slate-600">Questions about finding providers, appointments, profiles, reviews, or using SAINO Health.</p>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h4 class="text-xs font-bold text-slate-900 flex items-center space-x-1.5 mb-1">
              <i data-lucide="stethoscope" class="w-4 h-4 text-emerald-600"></i>
              <span>For Healthcare Providers</span>
            </h4>
            <p class="text-xs text-slate-600">Join SAINO Health, create or manage your profile, get verified, reach more users, or learn about provider services.</p>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h4 class="text-xs font-bold text-slate-900 flex items-center space-x-1.5 mb-1">
              <i data-lucide="building" class="w-4 h-4 text-purple-600"></i>
              <span>For Healthcare Businesses & Advertisers</span>
            </h4>
            <p class="text-xs text-slate-600">Explore visibility, campaigns, promotions, and other opportunities to grow your presence on SAINO Health.</p>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <h4 class="text-xs font-bold text-slate-900 flex items-center space-x-1.5 mb-1">
              <i data-lucide="handshake" class="w-4 h-4 text-amber-600"></i>
              <span>For Partnerships & Investors</span>
            </h4>
            <p class="text-xs text-slate-600">Connect with us for strategic healthcare networks, technology collaborations, and investment opportunities.</p>
          </div>

          <!-- Office Details (Page 8 spec) -->
          <div class="p-5 rounded-2xl bg-slate-900 text-white shadow-md">
            <h4 class="text-xs font-bold uppercase tracking-wider text-sky-400 mb-2">Our Office: KATHMANDU, NEPAL</h4>
            <p class="text-xs text-slate-300 leading-relaxed mb-3">
              <strong>SAINO Tech Ventures Pvt. Ltd.</strong><br>
              Tejasswee Girls Hostel, opp<br>
              Suruchi Marg, Kathmandu-31<br>
              Kathmandu 44600, Nepal
            </p>
            <div class="space-y-1 text-xs text-slate-300 mb-3">
              <div>✉ info@sainotechventures.com</div>
              <div>✉ sales@sainotechventures.com</div>
              <div>✉ support@sainohealth.com</div>
            </div>
            <button onclick="showToast('Opening Google Maps Directions to Kathmandu Office')" class="text-xs font-bold text-sky-400 hover:text-sky-300 inline-flex items-center space-x-1">
              <span>Get Directions →</span>
            </button>
          </div>
        </div>

        <!-- Right: Interactive Inquiry Form (Page 8 spec) -->
        <div class="lg:col-span-7">
          <div class="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 class="text-lg font-bold text-slate-900 mb-2">Send an Inquiry</h3>
            <p class="text-xs text-slate-500 mb-6">Have a question, suggestion, or opportunity to share? Reach out to us.</p>

            <form id="contactForm" onsubmit="handleContactSubmit(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Interested In: (BOX)</label>
                <select id="contactTopic" required class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="Patient Appointment Inquiry">Patient Appointment / Healthcare Finding</option>
                  <option value="Healthcare Provider Verification & Badge Upgrade">Healthcare Provider Verification & Badge Upgrade</option>
                  <option value="Healthcare Business Advertising & Campaigns (SAINO Boost)">Healthcare Business Advertising & Campaigns (SAINO Boost)</option>
                  <option value="Corporate / Health Insurance Partnership">Corporate / Health Insurance Partnership</option>
                  <option value="Investor Relations & Strategic Support">Investor Relations & Strategic Support</option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input type="text" id="contactName" required placeholder="e.g. Dr. Ramesh Karki / Sita Sharma" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp Number</label>
                  <input type="tel" id="contactPhone" required placeholder="+977-98XXXXXXXX" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input type="email" id="contactEmail" required placeholder="your.email@provider.com" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Message / Requirements</label>
                <textarea id="contactMessage" rows="4" required placeholder="Describe your inquiry, clinic details, or advertising timeline..." class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
              </div>

              <button type="submit" class="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs md:text-sm transition shadow-md flex items-center justify-center space-x-2">
                <i data-lucide="send" class="w-4 h-4"></i>
                <span>Submit Inquiry</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ==========================================
// 6. AD CAROUSEL CONTROLLER (7-8 Scrolling Ads)
// ==========================================
function initAdCarousel() {
  if (AppState.adAutoPlayInterval) {
    clearInterval(AppState.adAutoPlayInterval);
  }
  AppState.adAutoPlayInterval = setInterval(() => {
    nextAd();
  }, 6000);
}

function nextAd() {
  const total = window.SAINO_DATA.promotionalAds.length;
  AppState.currentAdIndex = (AppState.currentAdIndex + 1) % total;
  updateAdTrack();
}

function prevAd() {
  const total = window.SAINO_DATA.promotionalAds.length;
  AppState.currentAdIndex = (AppState.currentAdIndex - 1 + total) % total;
  updateAdTrack();
}

function goToAd(index) {
  AppState.currentAdIndex = index;
  updateAdTrack();
}

function updateAdTrack() {
  const track = document.getElementById('adTrack');
  if (track) {
    track.style.transform = `translateX(-${AppState.currentAdIndex * 100}%)`;
  }
  const indicators = document.querySelectorAll('#adIndicators button');
  indicators.forEach((btn, idx) => {
    if (idx === AppState.currentAdIndex) {
      btn.className = 'w-5 h-2 rounded-full transition-all bg-sky-600';
    } else {
      btn.className = 'w-2 h-2 rounded-full transition-all bg-slate-300';
    }
  });
}

// ==========================================
// 7. FILTERS & SEARCH LOGIC
// ==========================================
function getFilteredProviders() {
  return AppState.providers.filter(p => {
    // Category match
    if (AppState.selectedCategory !== 'all' && p.category !== AppState.selectedCategory) {
      return false;
    }
    // Location match
    if (AppState.selectedLocation !== 'all') {
      const matchLoc = (p.city && p.city.toLowerCase().includes(AppState.selectedLocation.toLowerCase())) ||
                       (p.location && p.location.toLowerCase().includes(AppState.selectedLocation.toLowerCase()));
      if (!matchLoc) return false;
    }
    // Verification badge match
    if (AppState.selectedVerification !== 'all' && p.verification !== AppState.selectedVerification) {
      return false;
    }
    // Search query match (name, departments, lead doctor, city)
    if (AppState.searchQuery.trim() !== '') {
      const q = AppState.searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchDept = p.departments.some(d => d.toLowerCase().includes(q));
      const matchDoc = p.leadDoctor && p.leadDoctor.toLowerCase().includes(q);
      const matchLoc = p.location.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
      if (!matchName && !matchDept && !matchDoc && !matchLoc) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    if (AppState.sortBy === 'rating') return b.rating - a.rating;
    if (AppState.sortBy === 'likes') return b.likesCount - a.likesCount;
    if (AppState.sortBy === 'reviews') return b.reviewsCount - a.reviewsCount;
    // Default recommended: Pro first, then Prime, then Listed
    const rank = { pro: 3, prime: 2, listed: 1 };
    return (rank[b.verification] || 0) - (rank[a.verification] || 0);
  });
}

function filterCategory(catId) {
  AppState.selectedCategory = catId;
  renderApp();
}

function filterBookingType(bookingId) {
  AppState.selectedBookingType = bookingId;
  // Map booking type to most relevant category if needed
  if (bookingId === 'ambulance') {
    AppState.searchQuery = 'Ambulance';
  } else if (bookingId === 'bloodbank_booking') {
    AppState.selectedCategory = 'bloodbank';
  } else if (bookingId === 'home_nurse' || bookingId === 'home_doc') {
    AppState.selectedCategory = 'homecare';
  } else if (bookingId === 'wellness_booking') {
    AppState.selectedCategory = 'wellness';
  }
  renderApp();
}

function filterVerification(tier) {
  AppState.selectedVerification = tier;
  renderApp();
}

function changeSort(val) {
  AppState.sortBy = val;
  renderApp();
}

function resetAllFilters() {
  AppState.selectedCategory = 'all';
  AppState.selectedLocation = 'all';
  AppState.selectedVerification = 'all';
  AppState.selectedBookingType = 'all';
  AppState.searchQuery = '';
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.value = '';
  renderApp();
}

// ==========================================
// 8. INTERACTIVE MODALS & WHATSAPP ENGINE
// ==========================================

// Like & Interested Toggles
function toggleLike(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;
  p.isLiked = !p.isLiked;
  p.likesCount += p.isLiked ? 1 : -1;
  renderApp();
  showToast(p.isLiked ? `Liked ${p.name}` : `Unliked ${p.name}`);
}

function toggleInterested(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;
  p.isInterested = !p.isInterested;
  p.interestedCount += p.isInterested ? 1 : -1;
  renderApp();
  showToast(p.isInterested ? `Marked Interested in ${p.name}` : `Removed Interest`);
}

// Provider Profile Detail Modal (Pages 10 & 11)
function openProviderModal(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;
  AppState.activeProvider = p;

  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <!-- Modal Top Bar with Cover & Doctor Spotlight -->
        <div class="relative bg-gradient-to-r from-sky-900 via-indigo-900 to-slate-900 text-white p-6 md:p-8 flex-shrink-0">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 rounded-2xl bg-white p-1 overflow-hidden shadow-lg border-2 border-white/40 flex-shrink-0">
                <img src="${p.logo}" alt="${p.name}" class="w-full h-full object-cover rounded-xl">
              </div>
              <div>
                <div class="flex items-center space-x-2 mb-1">
                  <h2 class="text-xl md:text-2xl font-bold">${p.name}</h2>
                  ${p.verification === 'pro' ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500 text-white">✓ SAINO Pro</span>` : ''}
                  ${p.verification === 'prime' ? `<span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white">✓ SAINO Prime</span>` : ''}
                </div>
                <p class="text-xs text-sky-200 flex items-center">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 mr-1"></i>
                  <span>${p.location}, ${p.city}</span>
                </p>
              </div>
            </div>

            <!-- Top CTA -->
            <button onclick="openBookingWhatsApp('${p.id}')" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs md:text-sm shadow-md transition flex items-center space-x-2">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Book Appointment via WhatsApp</span>
            </button>
          </div>

          <!-- Doctor Sub-Bar (Page 10 Spec) -->
          ${p.leadDoctor ? `
            <div class="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <strong class="text-white font-bold">${p.leadDoctor}</strong> · 
                <span class="text-sky-200">${p.leadDoctorRole} (${p.leadDoctorExperience})</span>
              </div>
              <div class="flex items-center space-x-3 text-slate-200">
                <span>⭐ ${p.rating} (${p.reviewsCount} Reviews)</span>
                <span>♥ ${(p.likesCount).toLocaleString()} Likes</span>
                <span>👥 ${p.interestedCount} Interested</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Navigation Tabs (Page 10 & 11 Spec) -->
        <div class="border-b border-slate-200 px-6 bg-slate-50 flex space-x-6 text-xs font-bold text-slate-600 overflow-x-auto no-scrollbar flex-shrink-0">
          <button onclick="switchProviderTab('about')" id="tabBtn-about" class="py-3 border-b-2 border-sky-600 text-sky-600">About</button>
          <button onclick="switchProviderTab('services')" id="tabBtn-services" class="py-3 border-b-2 border-transparent hover:text-slate-900">Services & Fees</button>
          <button onclick="switchProviderTab('reviews')" id="tabBtn-reviews" class="py-3 border-b-2 border-transparent hover:text-slate-900">Reviews (${p.reviews ? p.reviews.length : 0})</button>
          <button onclick="switchProviderTab('activity')" id="tabBtn-activity" class="py-3 border-b-2 border-transparent hover:text-slate-900">Activity & Updates</button>
          <button onclick="switchProviderTab('photos')" id="tabBtn-photos" class="py-3 border-b-2 border-transparent hover:text-slate-900">Photos Gallery</button>
          <button onclick="switchProviderTab('availability')" id="tabBtn-availability" class="py-3 border-b-2 border-transparent hover:text-slate-900">Doctor Availability</button>
        </div>

        <!-- Tab Content Area -->
        <div id="providerTabContent" class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs text-slate-700">
          ${renderProviderAboutTab(p)}
        </div>

        <!-- Modal Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs flex-shrink-0">
          <div class="text-slate-500">
            Opening Hours: <strong>${p.openingHours}</strong>
          </div>
          <div class="flex items-center space-x-3">
            <button onclick="openWriteReviewModal('${p.id}')" class="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition">
              ✍ Write a Review
            </button>
            <button onclick="openBookingWhatsApp('${p.id}')" class="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition">
              Book on WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function switchProviderTab(tabName) {
  const p = AppState.activeProvider;
  if (!p) return;

  document.querySelectorAll('[id^="tabBtn-"]').forEach(btn => {
    btn.className = 'py-3 border-b-2 border-transparent hover:text-slate-900';
  });
  const activeBtn = document.getElementById(`tabBtn-${tabName}`);
  if (activeBtn) {
    activeBtn.className = 'py-3 border-b-2 border-sky-600 text-sky-600 font-bold';
  }

  const container = document.getElementById('providerTabContent');
  if (!container) return;

  switch (tabName) {
    case 'about':
      container.innerHTML = renderProviderAboutTab(p);
      break;
    case 'services':
      container.innerHTML = `
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-slate-900">Available Consultation & Service Packages</h4>
          <div class="space-y-2">
            ${p.services.map(s => `
              <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <strong class="text-xs text-slate-900 block">${s.name}</strong>
                  <span class="text-[11px] text-slate-500">Consultant: ${s.doctor}</span>
                </div>
                <div class="text-right">
                  <span class="text-xs font-bold text-sky-700 block">${s.fee}</span>
                  <button onclick="openBookingWhatsAppWithService('${p.id}', '${s.name}')" class="mt-1 px-2.5 py-1 bg-emerald-600 text-white font-bold rounded text-[10px] hover:bg-emerald-700 transition">
                    Book Service
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      break;
    case 'reviews':
      container.innerHTML = `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-slate-900">Patient Reviews & Experiences</h4>
            <button onclick="openWriteReviewModal('${p.id}')" class="text-xs font-bold text-sky-600 hover:text-sky-700">
              + Add Your Review
            </button>
          </div>
          <div class="space-y-3">
            ${p.reviews && p.reviews.length > 0 ? p.reviews.map(r => `
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="font-bold text-slate-800 text-xs">${r.user}</span>
                  <span class="text-[11px] text-slate-400">${r.date}</span>
                </div>
                <div class="text-amber-500 text-xs mb-1">
                  ${'★'.repeat(Math.round(r.rating))} (${r.rating})
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">"${r.comment}"</p>
              </div>
            `).join('') : '<p class="text-xs text-slate-400">No reviews submitted yet.</p>'}
          </div>
        </div>
      `;
      break;
    case 'activity':
      container.innerHTML = `
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-slate-900">Recent Facility Activity & Health Drives</h4>
          <ul class="space-y-2 text-xs">
            ${p.activity.map(act => `
              <li class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2.5">
                <i data-lucide="check-circle" class="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5"></i>
                <span class="text-slate-700">${act}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
      break;
    case 'photos':
      container.innerHTML = `
        <div>
          <h4 class="text-sm font-bold text-slate-900 mb-3">Facility & Infrastructure Photos</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            ${p.photos.map(photo => `
              <div class="h-36 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                <img src="${photo}" class="w-full h-full object-cover">
              </div>
            `).join('')}
          </div>
        </div>
      `;
      break;
    case 'availability':
      container.innerHTML = `
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-slate-900">Doctor OPD & Consultation Availability</h4>
          <div class="space-y-2">
            ${p.availability.map(av => `
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <strong class="text-slate-900 block">${av.doctor}</strong>
                  <span class="text-slate-500">${av.day}</span>
                </div>
                <span class="px-2.5 py-1 rounded bg-sky-100 text-sky-800 font-bold">${av.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      break;
  }

  if (window.lucide) window.lucide.createIcons();
}

function renderProviderAboutTab(p) {
  return `
    <div class="space-y-4">
      <div>
        <h4 class="text-sm font-bold text-slate-900 mb-1">About Facility</h4>
        <p class="text-xs text-slate-600 leading-relaxed">${p.about}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Location & Directions</span>
          <p class="text-xs text-slate-800 font-semibold">${p.location}, ${p.city}</p>
          ${p.website ? `<a href="${p.website}" target="_blank" class="text-xs text-sky-600 hover:underline mt-1 block">Visit Official Website →</a>` : ''}
        </div>

        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emergency & OPD Schedule</span>
          <p class="text-xs text-slate-800 font-semibold">${p.openingHours}</p>
          <span class="text-[11px] text-emerald-600 font-semibold block mt-1">✓ Instant WhatsApp Booking Enabled</span>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-bold text-slate-900 mb-2">Speciality Departments</h4>
        <div class="flex flex-wrap gap-1.5">
          ${p.departments.map(d => `<span class="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 text-xs font-semibold">${d}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

// WhatsApp Booking Modal Flow (Page 1 & 9 Requirement: Book via WhatsApp)
function openBookingWhatsApp(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;

  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <div class="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white relative">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
          <div class="flex items-center space-x-2 text-emerald-200 text-xs font-bold mb-1">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>SAINO HEALTHCARE FAST-BOOKING</span>
          </div>
          <h3 class="text-lg font-bold">Book Appointment via WhatsApp</h3>
          <p class="text-xs text-emerald-100 mt-0.5">${p.name}</p>
        </div>

        <form onsubmit="handleWhatsAppBookingSubmit(event, '${p.id}')" class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Select Service / Department</label>
            <select id="wbService" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              ${p.services.map(s => `<option value="${s.name}">${s.name} (${s.fee})</option>`).join('')}
              <option value="General OPD Consultation">General OPD Consultation</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Patient Full Name</label>
              <input type="text" id="wbPatientName" required placeholder="e.g. Binod Shrestha" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Preferred Date</label>
              <input type="date" id="wbDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Brief Symptoms or Notes (Optional)</label>
            <textarea id="wbNotes" rows="2" placeholder="e.g. Chest discomfort since 2 days, need ECG & consultation..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div class="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] flex items-center space-x-2 border border-emerald-100">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
            <span>Your booking request is routed directly to ${p.name}'s verified WhatsApp triage desk.</span>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-md flex items-center space-x-2">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Launch WhatsApp Chat</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function openBookingWhatsAppWithService(providerId, serviceName) {
  openBookingWhatsApp(providerId);
  setTimeout(() => {
    const sel = document.getElementById('wbService');
    if (sel) sel.value = serviceName;
  }, 50);
}

function handleWhatsAppBookingSubmit(e, providerId) {
  e.preventDefault();
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;

  const service = document.getElementById('wbService').value;
  const name = document.getElementById('wbPatientName').value;
  const date = document.getElementById('wbDate').value;
  const notes = document.getElementById('wbNotes').value;

  const textMsg = `Hello ${p.name} (via SAINO HEALTH),%0A%0AI would like to book an appointment:%0A- Patient Name: ${encodeURIComponent(name)}%0A- Service: ${encodeURIComponent(service)}%0A- Preferred Date: ${encodeURIComponent(date)}%0A- Notes: ${encodeURIComponent(notes || 'N/A')}%0A%0APlease confirm available time slots.`;
  
  // Nepal generic triage WhatsApp number or dummy support number
  const whatsappUrl = `https://wa.me/9779800000000?text=${textMsg}`;
  
  window.open(whatsappUrl, '_blank');
  closeModal();
  showToast(`WhatsApp booking link launched for ${p.name}!`);
}

function openCustomWhatsApp(topic, message) {
  const whatsappUrl = `https://wa.me/9779800000000?text=${encodeURIComponent(`[SAINO HEALTH - ${topic}] ` + message)}`;
  window.open(whatsappUrl, '_blank');
  showToast(`Opened WhatsApp chat for ${topic}`);
}

function openAdWhatsApp(adId) {
  const ad = window.SAINO_DATA.promotionalAds.find(a => a.id === adId);
  if (!ad) return;
  openCustomWhatsApp(ad.title, ad.whatsappMsg);
}

// Upgrade Badge Modal (Page 2 & 3: Upgrade your Badge takes to payment subscription)
function openUpgradeBadgeModal(preselectedTier = 'prime') {
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <div class="bg-gradient-to-r from-[#881337] via-[#991b1b] to-[#7f1d1d] p-6 text-white relative">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
          <div class="flex items-center space-x-2 text-amber-300 text-xs font-black tracking-widest uppercase mb-1">
            <i data-lucide="award" class="w-4 h-4"></i>
            <span>SAINO VENDOR BADGE & SUBSCRIPTION</span>
          </div>
          <h3 class="text-xl font-bold">Upgrade Your Provider Badge & Visibility</h3>
          <p class="text-xs text-rose-100 mt-0.5">Select a verified subscription plan to gain patient trust and click-to-book leads.</p>
        </div>

        <form onsubmit="handleUpgradeSubmit(event)" class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Select Verification Tier</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              ${window.SAINO_DATA.subscriptionTiers.map(t => `
                <label class="p-3.5 rounded-2xl border ${t.id === preselectedTier ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20' : 'border-slate-200 bg-slate-50'} flex flex-col justify-between cursor-pointer">
                  <div class="flex items-center justify-between mb-2">
                    <input type="radio" name="tierPlan" value="${t.id}" ${t.id === preselectedTier ? 'checked' : ''} class="text-rose-600">
                    <span class="text-[9px] font-black uppercase ${t.type === 'paid' ? 'text-rose-700' : 'text-slate-400'}">${t.name}</span>
                  </div>
                  <strong class="text-slate-900 text-xs">${t.badge}</strong>
                  <span class="text-rose-700 font-bold text-xs mt-1">${t.price}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Hospital / Clinic / Provider Name</label>
              <input type="text" id="upgOrgName" required placeholder="e.g. Kathmandu Care Clinic" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Contact Person & Phone</label>
              <input type="text" id="upgContact" required placeholder="e.g. Dr. Karki / 98XXXXXXXX" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
            </div>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Business Email</label>
            <input type="email" id="upgEmail" required placeholder="admin@careclinic.np" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Payment Method (Esewa / Khalti / FonePay / Bank Transfer)</label>
            <select class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800">
              <option>eSewa Digital Wallet</option>
              <option>Khalti Digital Wallet</option>
              <option>FonePay Direct QR</option>
              <option>Corporate Bank Transfer / Invoice</option>
            </select>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md">
              Proceed to Verification & Badge Upgrade
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function handleUpgradeSubmit(e) {
  e.preventDefault();
  closeModal();
  showToast('Badge Upgrade request submitted! Our onboarding team will verify your medical license within 4 hours.');
}

// Write Review Modal
function openWriteReviewModal(providerId) {
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;

  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <div class="bg-slate-900 p-6 text-white relative">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
          <h3 class="text-base font-bold">Write a Review</h3>
          <p class="text-xs text-slate-400 mt-0.5">${p.name}</p>
        </div>

        <form onsubmit="handleReviewSubmit(event, '${p.id}')" class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Your Full Name</label>
            <input type="text" id="revName" required placeholder="e.g. Pooja Sharma" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Rating (1 - 5 Stars)</label>
            <select id="revRating" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800">
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars (Outstanding Experience)</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars (Very Good)</option>
              <option value="3">⭐⭐⭐ 3 Stars (Satisfactory)</option>
              <option value="2">⭐⭐ 2 Stars (Needs Improvement)</option>
              <option value="1">⭐ 1 Star (Poor)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-700 mb-1">Your Review & Feedback</label>
            <textarea id="revComment" rows="3" required placeholder="Share your experience with the doctors, staff, facility hygiene, and waiting time..." class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-md">
              Submit Review
            </button>
          </div>
        </form>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function handleReviewSubmit(e, providerId) {
  e.preventDefault();
  const p = AppState.providers.find(x => x.id === providerId);
  if (!p) return;

  const name = document.getElementById('revName').value;
  const rating = parseFloat(document.getElementById('revRating').value);
  const comment = document.getElementById('revComment').value;

  if (!p.reviews) p.reviews = [];
  p.reviews.unshift({
    user: name,
    rating: rating,
    date: 'Just now',
    comment: comment
  });
  p.reviewsCount += 1;

  closeModal();
  renderApp();
  showToast(`Thank you! Your verified review for ${p.name} has been published.`);
}

function openProviderSignInModal(defaultTab = 'patient') {
  const modalContainer = document.getElementById('modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header with SAINO Crimson Theme -->
        <div class="bg-gradient-to-r from-[#881337] via-[#991b1b] to-[#7f1d1d] p-6 text-white relative">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
          <div class="flex items-center space-x-2 text-amber-300 text-xs font-black tracking-widest uppercase mb-1">
            <i data-lucide="shield-check" class="w-4 h-4"></i>
            <span>SAINO HEALTH PORTAL</span>
          </div>
          <h3 class="text-xl font-bold">Sign In to Your Account</h3>
          <p class="text-xs text-rose-100 mt-0.5">Choose your account type below to continue</p>
        </div>

        <!-- Role Tab Switcher: Patient / Customer vs Provider -->
        <div class="p-6 pb-2">
          <div class="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold mb-4">
            <button type="button" id="tabBtnPatient" onclick="switchLoginTab('patient')" class="py-2.5 rounded-xl transition ${defaultTab === 'patient' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
              👤 Patient / Customer
            </button>
            <button type="button" id="tabBtnProvider" onclick="switchLoginTab('provider')" class="py-2.5 rounded-xl transition ${defaultTab === 'provider' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}">
              🏥 Doctor / Provider
            </button>
          </div>
        </div>

        <!-- Patient Login Form -->
        <div id="loginFormPatient" class="${defaultTab === 'patient' ? 'block' : 'hidden'} px-6 pb-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Mobile Number or Email</label>
            <input type="text" required placeholder="e.g. 9801234567 or pooja@gmail.com" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Password / 4-Digit OTP</label>
            <input type="password" required placeholder="••••••••" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <label class="flex items-center space-x-1.5 text-slate-600 cursor-pointer">
              <input type="checkbox" checked class="rounded text-rose-600">
              <span>Remember me</span>
            </label>
            <a href="#" onclick="showToast('OTP sent to your mobile number!')" class="text-rose-600 font-bold hover:underline">Get Login OTP</a>
          </div>
          <button type="button" onclick="handlePatientSignInSubmit(event)" class="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-md">
            Sign In as Patient / Customer
          </button>
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-900 leading-relaxed">
            💡 <strong>Fast Access:</strong> You can also browse providers and book via WhatsApp as a guest without signing in!
          </div>
        </div>

        <!-- Provider Login Form -->
        <div id="loginFormProvider" class="${defaultTab === 'provider' ? 'block' : 'hidden'} px-6 pb-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Provider ID / Official Email</label>
            <input type="text" required placeholder="doctor@clinic.np or NORVIC-ADMIN" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Hospital Admin Password</label>
            <input type="password" required placeholder="••••••••" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <button type="button" onclick="handleProviderSignInSubmit(event)" class="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-md">
            Sign In to Hospital Dashboard
          </button>
          <div class="text-center text-slate-500 text-[11px]">
            New Healthcare Provider? <button type="button" onclick="openUpgradeBadgeModal('prime')" class="text-rose-600 font-bold hover:underline">Register Facility Here</button>
          </div>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();
}

function switchLoginTab(tab) {
  const patientForm = document.getElementById('loginFormPatient');
  const providerForm = document.getElementById('loginFormProvider');
  const tabBtnPatient = document.getElementById('tabBtnPatient');
  const tabBtnProvider = document.getElementById('tabBtnProvider');

  if (tab === 'patient') {
    if (patientForm) patientForm.classList.remove('hidden');
    if (providerForm) providerForm.classList.add('hidden');
    if (tabBtnPatient) {
      tabBtnPatient.className = 'py-2.5 rounded-xl transition bg-white text-rose-700 shadow-sm';
    }
    if (tabBtnProvider) {
      tabBtnProvider.className = 'py-2.5 rounded-xl transition text-slate-500 hover:text-slate-800';
    }
  } else {
    if (patientForm) patientForm.classList.add('hidden');
    if (providerForm) providerForm.classList.remove('hidden');
    if (tabBtnProvider) {
      tabBtnProvider.className = 'py-2.5 rounded-xl transition bg-white text-rose-700 shadow-sm';
    }
    if (tabBtnPatient) {
      tabBtnPatient.className = 'py-2.5 rounded-xl transition text-slate-500 hover:text-slate-800';
    }
  }
}

function handlePatientSignInSubmit(e) {
  if (e) e.preventDefault();
  closeModal();
  showToast('Welcome back! Signed in to your SAINO Patient Account.');
}

function handleProviderSignInSubmit(e) {
  if (e) e.preventDefault();
  closeModal();
  showToast('Signed in to SAINO Provider Portal successfully!');
}

function openAdCampaignModal() {
  openUpgradeBadgeModal('pro');
}

function closeModal() {
  const modalContainer = document.getElementById('modalContainer');
  if (modalContainer) modalContainer.innerHTML = '';
}

function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('contactName').value;
  const topic = document.getElementById('contactTopic').value;
  showToast(`Thank you ${name}! Your inquiry regarding "${topic}" has been sent to our Kathmandu office.`);
  e.target.reset();
}

// Toast notification helper
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const toastText = document.getElementById('toastMessage');
  if (!toast || !toastText) return;

  toastText.innerText = message;
  toast.classList.remove('translate-y-24', 'opacity-0', 'pointer-events-none');
  toast.classList.add('translate-y-0', 'opacity-100');

  if (AppState.toastTimeout) clearTimeout(AppState.toastTimeout);
  AppState.toastTimeout = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0', 'pointer-events-none');
  }, 4000);
}

// Global Event Listeners (Search Bar & Keyboard Escape)
function initGlobalEventListeners() {
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      if (AppState.activeView !== 'marketplace') {
        AppState.activeView = 'marketplace';
      }
      renderApp();
    });
  }

  const locationSelect = document.getElementById('globalLocationSelect');
  if (locationSelect) {
    locationSelect.addEventListener('change', (e) => {
      AppState.selectedLocation = e.target.value;
      if (AppState.activeView !== 'marketplace') {
        AppState.activeView = 'marketplace';
      }
      renderApp();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

function bindMarketplaceEvents() {
  const prevBtn = document.getElementById('prevAdBtn');
  const nextBtn = document.getElementById('nextAdBtn');
  if (prevBtn) prevBtn.addEventListener('click', prevAd);
  if (nextBtn) nextBtn.addEventListener('click', nextAd);
}

function bindProvidersShowcaseEvents() {}
function bindBoostEvents() {}
function bindAboutEvents() {}
function bindContactEvents() {}
// Discovery Slider Transition Engine
function nextDiscoverySlide() {
  if (!window._discoverySlides) return;
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex + 1) % window._discoverySlides.length;
  updateDiscoverySlide();
}

function prevDiscoverySlide() {
  if (!window._discoverySlides) return;
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex - 1 + window._discoverySlides.length) % window._discoverySlides.length;
  updateDiscoverySlide();
}

function goToDiscoverySlide(idx) {
  AppState.discoverySlideIndex = idx;
  updateDiscoverySlide();
}

function updateDiscoverySlide() {
  const slide = window._discoverySlides[AppState.discoverySlideIndex];
  const img = document.getElementById('discSlideImg');
  const title = document.getElementById('discSlideTitle');
  const hosp = document.getElementById('discSlideHospital');
  const note = document.getElementById('discSlideNote');

  if (img && title && hosp && note) {
    img.style.opacity = '0.2';
    img.style.transform = 'scale(0.97)';
    setTimeout(() => {
      img.src = slide.image;
      title.innerText = slide.title;
      hosp.innerText = slide.hospital;
      note.innerText = slide.note;
      img.style.opacity = '1';
      img.style.transform = 'scale(1)';
    }, 200);
  } else {
    renderApp();
  }
}
window.goToDiscoverySlide = function(index) {
  if (!window._discoverySlides || !window._discoverySlides[index]) return;
  AppState.discoverySlideIndex = index;
  syncDiscoverySlideDOM();
};

window.nextDiscoverySlide = function() {
  if (!window._discoverySlides || window._discoverySlides.length === 0) return;
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex + 1) % window._discoverySlides.length;
  syncDiscoverySlideDOM();
};

function syncDiscoverySlideDOM() {
  if (typeof renderApp === 'function') {
    renderApp();
    return;
  }

  const s = window._discoverySlides[AppState.discoverySlideIndex];
  if (!s) return;

  const img = document.getElementById('discSlideImg');
  const title = document.getElementById('discSlideTitle');
  const hosp = document.getElementById('discSlideHospital');
  const note = document.getElementById('discSlideNote');

  if (img) img.src = s.image;
  if (hosp) hosp.innerText = s.hospital;
  if (note) note.innerHTML = s.desc || s.note || '';
  if (title) {
    title.innerHTML = `${s.titlePart1 || ''}<span class="text-[#3b82f6]">${s.titleHighlight || ''}</span><br>${s.titlePart2 || ''}`;
  }
}

  // 1. Data Fetch Controller
async function loadNearbyProviders() {
  const target = document.getElementById('nearbyProvidersList');
  if (!target) return;

  target.innerHTML = `<div class="p-6 text-center text-slate-400 text-sm">Loading providers...</div>`;

  try {
    const res = await fetch('/api/providers'); // backend endpoint
    if (!res.ok) throw new Error('API fetch failed');
    const data = await res.json();
    const list = Array.isArray(data) ? data : (data.providers || []);

    if (list.length > 0) {
      target.innerHTML = list.map((p, i) => renderHospitalCard(p, i)).join('');
      return;
    }
  } catch (err) {
    console.warn('Backend fetch failed, using fallback:', err);
  }

  // Fallback data agar API na mile
  if (window.REAL_MAP_PROVIDERS) {
    target.innerHTML = window.REAL_MAP_PROVIDERS.map((p, i) => renderHospitalCard(p, i)).join('');
  }
}

    // 2. Card Generator UI
    function renderHospitalCard(prov, index) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prov.mapQuery || prov.name)}`;
  const initialThree = (prov.departments || []).slice(0, 3);
  const extraCount = Math.max(0, (prov.departments || []).length - 3) || 10;

  // Badge icon aur color mapping
  const isVip = prov.badge && (prov.badge.includes('VIP') || prov.badge.includes('VVIP'));
  const isPro = prov.badge && prov.badge.includes('Pro');
  const badgeColorClass = isVip ? 'text-amber-700' : (isPro ? 'text-blue-700' : 'text-emerald-700');
  const badgeIconColor = isVip ? 'text-amber-500' : (isPro ? 'text-blue-500' : 'text-emerald-500');

  return `
    <div class="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-5 items-start">
      
      <!-- Pattern Placeholder Box (Matches Screenshot) -->
      <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" 
         class="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl border border-slate-200/90 block transition-transform hover:scale-[1.02]"
         style="background-color: #f8fafc; background-image: repeating-linear-gradient(45deg, #f1f5f9 25%, transparent 25%, transparent 75%, #f1f5f9 75%, #f1f5f9), repeating-linear-gradient(45deg, #f1f5f9 25%, #f8fafc 25%, #f8fafc 75%, #f1f5f9 75%, #f1f5f9); background-position: 0 0, 8px 8px; background-size: 16px 16px;">
      </a>

      <!-- Details Section -->
      <div class="flex-1 w-full">
        
        <!-- Hospital Name (Click to Maps) -->
        <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="hover:text-blue-600 transition-colors inline-block">
          <h4 class="text-base sm:text-lg font-bold text-slate-900 leading-snug">${prov.name}</h4>
        </a>

        <!-- Verification Badge -->
        <div class="flex items-center space-x-1.5 mt-1">
          <svg class="w-3.5 h-3.5 ${badgeIconColor} fill-current" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span class="text-xs font-semibold ${badgeColorClass}">${prov.badge || 'Saino Verified'}</span>
        </div>

        <!-- Rating + Reviews + Discussions -->
        <div class="flex items-center space-x-2 mt-2 text-xs">
          <span class="text-amber-500 font-bold">★ ${prov.rating}</span>
          <span class="text-slate-500">(${prov.reviews})</span>
          <span class="text-slate-300">•</span>
          <div class="flex items-center space-x-1 text-slate-500">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <span>${prov.discussions}</span>
          </div>
        </div>

        <!-- Specialty Type -->
        <p class="text-xs font-semibold text-slate-700 mt-2">${prov.type}</p>

        <!-- Department Chips + Clickable More Button with Unique Index -->
        <div class="flex flex-wrap items-center gap-1.5 mt-2.5">
          ${initialThree.map(d => `<span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">${d}</span>`).join('')}
          
          <span id="card-${index}-more" class="hidden flex-wrap gap-1.5 transition-all duration-300">
            ${(prov.departments || []).slice(3).map(dept => `
              <span class="text-[11px] font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200/80">${dept}</span>
            `).join('')}
          </span>

          <button 
            type="button" 
            id="card-${index}-btn"
            onclick="toggleSpecialties('card-${index}')" 
            class="text-[11px] font-medium bg-transparent text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-md border border-dashed border-slate-200 hover:border-slate-300 transition-all duration-200 cursor-pointer">
            + ${extraCount} more specialties
          </button>
        </div>

        <!-- Location + Timing Status -->
        <div class="flex flex-wrap items-center justify-between gap-y-1.5 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div class="flex items-center space-x-2">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
              </svg>
              ${prov.location}
            </span>
            <span class="text-slate-300">•</span>
            <span>${prov.distance}</span>
          </div>
          <div class="flex items-center space-x-1.5 font-medium text-emerald-600">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>${prov.timing}</span>
          </div>
        </div>

      </div>

    </div>
  `;
  }
  window.navigateToHospitalPage = function(encodedName, index) {
  const hospitalName = decodeURIComponent(encodedName);
  if (window.AppState) {
    window.AppState.currentView = 'providers-showcase';
    window.AppState.selectedHospital = hospitalName;
    if (typeof renderApp === 'function') {
      renderApp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }
  window.location.hash = `#providers?hospital=${encodeURIComponent(hospitalName)}`;
};

// Global toggle function (Ye bilkul bahar hona chahiye)
window.toggleSpecialties = function(cardId) {
  const moreSpan = document.getElementById(cardId + '-more');
  const btn = document.getElementById(cardId + '-btn');
  
  if (moreSpan && btn) {
    if (moreSpan.classList.contains('hidden')) {
      moreSpan.classList.remove('hidden');
      moreSpan.classList.add('flex');
      btn.textContent = '- Show less specialties';
    } else {
      moreSpan.classList.add('hidden');
      moreSpan.classList.remove('flex');
      btn.textContent = '+ 10 more specialties';
    }
  }
};
// =========================================================
// DISCUSSION & FACEBOOK COMMENT ENGINE (End of File)
// =========================================================

// Fallback data (Agar backend se 404 aaye tab bhi chalega)
 window.DISCUSSIONS_STORE = {
  'disc-grande': {
    id: 'disc-grande',
    hospital: 'Grande International Hospital',
    logo: 'GI',
    time: '2 hours ago',
    question: 'Has anyone recently visited their emergency department?',
    likes: 9,
    comments: [
      {
        id: 'c1', author: 'Rohan Shrestha', time: '1 hour ago', text: 'Visited last night around 11 PM with severe chest discomfort. Triage was exceptionally quick and the duty doctor was right there within minutes.', likes: 9, isLiked: false,
        replies: [
          { id: 'r1', author: 'Pooja Karki', text: 'Did they ask for an upfront cash deposit before starting treatment?' },
          { id: 'r2', author: 'Rohan Shrestha', text: 'No upfront cash deposit asked. They prioritized stabilization first.' },
          { id: 'r3', author: 'Manoj Bajracharya', text: 'That is reassuring to know, thank you for sharing.' },
          { id: 'r4', author: 'Sunita Maharjan', text: 'Their emergency team is quite professional during late hours.' },
          { id: 'r5', author: 'Karan KC', text: 'Was the billing counter crowded when you checked out?' },
          { id: 'r6', author: 'Anil Pandey', text: 'Billing takes a bit of time if insurance verification is pending.' },
          { id: 'r7', author: 'Deepa Adhikari', text: 'Always keep your insurance card handy for faster clearance.' },
          { id: 'r8', author: 'Bibek Thapa', text: 'Glad to hear you recovered well, Rohan.' },
          { id: 'r9', author: 'Rajesh Thapa', text: 'Grande ER is definitely one of the better-managed ones in Kathmandu.' },
          { id: 'r10', author: 'Sita Sharma', text: 'Do they have dedicated pediatric emergency bays as well?' },
          { id: 'r11', author: 'Dr. A. Sharma', text: 'Yes Sita, we run separate pediatric resuscitation units 24/7.' },
          { id: 'r12', author: 'Gita Shrestha', text: 'Very helpful thread, saving this for future reference.' },
          { id: 'r13', author: 'Ram Prasad', text: 'Appreciate the detailed breakdown from everyone here.' }
        ]
      }
    ]
  },
  'disc-norvic': { 
    id: 'disc-norvic', 
    hospital: 'Norvic International Hospital', 
    logo: 'NI', 
    time: '5 hours ago', 
    question: 'How was your experience with the cardiology department?', 
    likes: 17, 
    comments: [
      {
        id: 'nc1', author: 'Rajesh Thapa', time: '4 hours ago', text: 'Consultation with Dr. Shrestha was extremely thorough, though the wait time at the OPD lobby crossed nearly two hours.', likes: 17, isLiked: false,
        replies: [
          { id: 'nr1', author: 'Sunita Gurung', text: 'The morning slots are always packed, better book past noon.' },
          { id: 'nr2', author: 'Karan KC', text: 'Did you book your token online or through their app?' },
          { id: 'nr3', author: 'Rajesh Thapa', text: 'Walk-in token, which is why it took longer.' },
          { id: 'nr4', author: 'Deepa Adhikari', text: 'Online booking saves at least an hour of waiting.' },
          { id: 'nr5', author: 'Bibek Thapa', text: 'Their cath lab facilities are top-notch though.' },
          { id: 'nr6', author: 'Pooja Karki', text: 'Is valet parking easily available during peak hours?' },
          { id: 'nr7', author: 'Manoj Bajracharya', text: 'Valet gets crowded by 11 AM, better park in the basement.' },
          { id: 'nr8', author: 'Hari Prasad', text: 'How are the consultation fees for senior cardiologists?' },
          { id: 'nr9', author: 'Rajesh Thapa', text: 'It was around NPR 1500 for the senior consultant slot.' },
          { id: 'nr10', author: 'Gita Shrestha', text: 'Thank you for sharing your experience, Rajesh.' },
          { id: 'nr11', author: 'Ram Prasad', text: 'Norvic staff is very courteous once you get inside.' },
          { id: 'nr12', author: 'Binod Shrestha', text: 'Cardiology wing is well-maintained.' },
          { id: 'nr13', author: 'Prakash Adhikari', text: 'Did they recommend any follow-up blood tests?' },
          { id: 'nr14', author: 'Nisha Karki', text: 'Their in-house lab reports are generated quite fast.' },
          { id: 'nr15', author: 'Dipesh Lama', text: 'Good to know, planning a visit this Thursday.' },
          { id: 'nr16', author: 'Suman Shrestha', text: 'Take care of your health, Rajesh.' },
          { id: 'nr17', author: 'Bikash Shrestha', text: 'Very informative discussion thread.' },
          { id: 'nr18', author: 'Rohan Shrestha', text: 'Agree with the online booking tip.' },
          { id: 'nr19', author: 'Aayush Koirala', text: 'Norvic has always maintained high clinical standards.' },
          { id: 'nr20', author: 'Pradeep Joshi', text: 'Appreciate the honest feedback.' },
          { id: 'nr21', author: 'Puja Lama', text: 'Thanks for the parking tip too!' }
        ]
      }
    ] 
  },
  'disc-hams': { 
    id: 'disc-hams', 
    hospital: 'HAMS Hospital', 
    logo: 'HA', 
    time: 'Yesterday', 
    question: 'Anyone know about their dermatology OPD timing and wait time?', 
    likes: 5, 
    comments: [
      {
        id: 'hc1', author: 'Sunita Gurung', time: 'Yesterday', text: 'Dermatology OPD starts right around 10 AM. Reaching by 9:30 AM helps secure a lower token number.', likes: 5, isLiked: false,
        replies: [
          { id: 'hr1', author: 'Bikash Shrestha', text: 'Can we collect tokens over a phone call a day prior?' },
          { id: 'hr2', author: 'Karan KC', text: 'Phone booking works if you call before 9 AM.' },
          { id: 'hr3', author: 'Anil Pandey', text: 'Is weekend OPD available for skin consultation?' },
          { id: 'hr4', author: 'Sunita Gurung', text: 'Only Saturday morning slots are open for limited hours.' },
          { id: 'hr5', author: 'Bibek Thapa', text: 'Thanks for the precise timing details.' },
          { id: 'hr6', author: 'Pooja Karki', text: 'This will save me a wasted trip tomorrow.' },
          { id: 'hr7', author: 'Manoj Bajracharya', text: 'Great community insight!' }
        ]
      }
    ] 
  },
  'disc-bnb': { 
    id: 'disc-bnb', 
    hospital: 'B&B Hospital', 
    logo: 'BB', 
    time: '2 days ago', 
    question: 'Is the diabetes specialist available on weekends at B&B?', 
    likes: 8, 
    comments: [
      {
        id: 'bc1', author: 'Binod Shrestha', time: '2 days ago', text: 'Endocrinology consultation is available only on Saturday mornings. Sundays are closed for specialized OPDs.', likes: 8, isLiked: false,
        replies: [
          { id: 'br1', author: 'Sita Sharma', text: 'Is prior appointment mandatory for Saturday slots?' },
          { id: 'br2', author: 'Hari Prasad', text: 'Yes, because the queue fills up by Friday evening.' },
          { id: 'br3', author: 'Gita Shrestha', text: 'Good to know before heading out.' },
          { id: 'br4', author: 'Ram Prasad', text: 'B&B orthopedics is famous, but endocrinology is good too.' },
          { id: 'br5', author: 'Karan KC', text: 'Thanks for saving my weekend plan.' },
          { id: 'br6', author: 'Anil Pandey', text: 'Are lab tests done on the same floor?' },
          { id: 'br7', author: 'Deepa Adhikari', text: 'Lab collection center is right down the hall.' },
          { id: 'br8', author: 'Bibek Thapa', text: 'Very helpful community response.' },
          { id: 'br9', author: 'Pooja Karki', text: 'Will book in advance for this Saturday.' },
          { id: 'br10', author: 'Manoj Bajracharya', text: 'Appreciate the clear update.' }
        ]
      }
    ] 
  },
  'disc-mediciti': {
    id: 'disc-mediciti',
    hospital: 'Nepal Mediciti Hospital',
    logo: 'NE',
    time: '3 days ago',
    question: 'How are the room charges and insurance claim process at Mediciti?',
    likes: 12,
    comments: [
      {
        id: 'mc1', author: 'Prakash Adhikari', time: '3 days ago', text: 'The cashless insurance desk is well-structured, though insurance discharge approval took about an hour during final billing.', likes: 12, isLiked: false,
        replies: [
          { id: 'mr1', author: 'Nisha Karki', text: 'Did they accept your corporate health card without hassle?' },
          { id: 'mr2', author: 'Dipesh Lama', text: 'Pre-authorization letter from the insurance provider speeds it up.' },
          { id: 'mr3', author: 'Suman Shrestha', text: 'Room rates are on the higher side compared to government setups.' },
          { id: 'mr4', author: 'Bikash Shrestha', text: 'Nursing care and hygiene standards justify the cost though.' },
          { id: 'mr5', author: 'Rohan Shrestha', text: 'Were deluxe rooms covered under your policy tier?' },
          { id: 'mr6', author: 'Prakash Adhikari', text: 'Only semi-private was covered under my base corporate plan.' },
          { id: 'mr7', author: 'Pradeep Joshi', text: 'Good information regarding room tiers.' },
          { id: 'mr8', author: 'Puja Lama', text: 'Mediciti infrastructure is world-class.' },
          { id: 'mr9', author: 'Karan KC', text: 'Thanks for sharing the discharge timeline details.' },
          { id: 'mr10', author: 'Anil Pandey', text: 'Helps a lot in financial planning.' },
          { id: 'mr11', author: 'Deepa Adhikari', text: 'The billing staff is cooperative if documents are complete.' },
          { id: 'mr12', author: 'Bibek Thapa', text: 'Glad your discharge went smoothly eventually.' },
          { id: 'mr13', author: 'Pooja Karki', text: 'Noting this down for future insurance claims.' },
          { id: 'mr14', author: 'Manoj Bajracharya', text: 'Very detailed patient perspective.' },
          { id: 'mr15', author: 'Hari Prasad', text: 'Thanks Prakash.' },
          { id: 'mr16', author: 'Gita Shrestha', text: 'Very useful thread.' },
          { id: 'mr17', author: 'Ram Prasad', text: 'Clear and honest feedback.' },
          { id: 'mr18', author: 'Sita Sharma', text: 'Appreciate it!' }
        ]
      }
    ]
  },
  'disc-patan': {
    id: 'disc-patan',
    hospital: 'Patan Hospital',
    logo: 'PA',
    time: '4 days ago',
    question: 'Is prior appointment mandatory for general surgery OPD?',
    likes: 10,
    comments: [
      {
        id: 'pc1', author: 'Hari Prasad', time: '4 days ago', text: 'General OPD operates entirely on a token system. Reaching early around 7:30 AM ensures you get an early slot.', likes: 10, isLiked: false,
        replies: [
          { id: 'pr1', author: 'Gita Shrestha', text: 'Can we obtain tokens via their ticketing counter?' },
          { id: 'pr2', author: 'Ram Prasad', text: 'Yes, counter opens sharply at 8 AM.' },
          { id: 'pr3', author: 'Karan KC', text: 'Is the crowd manageable on weekdays?' },
          { id: 'pr4', author: 'Hari Prasad', text: 'Mondays and Thursdays are unusually crowded.' },
          { id: 'pr5', author: 'Deepa Adhikari', text: 'Good tip about avoiding Mondays.' },
          { id: 'pr6', author: 'Bibek Thapa', text: 'Patan Hospital doctors are extremely dedicated.' },
          { id: 'pr7', author: 'Pooja Karki', text: 'Affordable and reliable healthcare option.' },
          { id: 'pr8', author: 'Manoj Bajracharya', text: 'Thanks for the early morning advice.' },
          { id: 'pr9', author: 'Sunita Gurung', text: 'Very helpful community guidance.' },
          { id: 'pr10', author: 'Binod Shrestha', text: 'Will keep this in mind.' },
          { id: 'pr11', author: 'Prakash Adhikari', text: 'Appreciate the breakdown.' },
          { id: 'pr12', author: 'Nisha Karki', text: 'Thanks Hari.' },
          { id: 'pr13', author: 'Dipesh Lama', text: 'Very clear guidance.' },
          { id: 'pr14', author: 'Suman Shrestha', text: 'Helpful notes.' }
        ]
      }
    ]
  },
  'disc-kmc': {
    id: 'disc-kmc',
    hospital: 'Kathmandu Medical College (KMC)',
    logo: 'KA',
    time: '5 days ago',
    question: 'Best pediatrician for newborn vaccination schedule here?',
    likes: 6,
    comments: [
      {
        id: 'kc1', author: 'Suman Shrestha', time: '5 days ago', text: 'The pediatric vaccination clinic runs Sunday through Friday. The nursing staff handles infants with great care.', likes: 6, isLiked: false,
        replies: [
          { id: 'kr1', author: 'Bikash Shrestha', text: 'Are government immunization vaccines available too?' },
          { id: 'kr2', author: 'Rohan Shrestha', text: 'Both private and regular national schedule vaccines are stocked.' },
          { id: 'kr3', author: 'Aayush Koirala', text: 'Do we need prior pediatrician consultation before each shot?' },
          { id: 'kr4', author: 'Suman Shrestha', text: 'A quick pediatrician checkup is done right before administration.' },
          { id: 'kr5', author: 'Puja Lama', text: 'That makes it very convenient for parents.' },
          { id: 'kr6', author: 'Karan KC', text: 'Thanks for sharing the schedule details.' }
        ]
      }
    ]
  },
  'disc-om': {
    id: 'disc-om',
    hospital: 'Om Hospital & Research Centre',
    logo: 'OM',
    time: '1 week ago',
    question: 'ENT department consultation fees and doctor availability?',
    likes: 9,
    comments: [
      {
        id: 'oc1', author: 'Dipesh Lama', time: '1 week ago', text: 'Consultation fees range between NPR 800 and 1200 depending on the seniority of the ENT consultant. Evening shifts are available.', likes: 9, isLiked: false,
        replies: [
          { id: 'or1', author: 'Anil Pandey', text: 'Are evening slots available on Saturdays?' },
          { id: 'or2', author: 'Deepa Adhikari', text: 'Saturday evening OPD is usually closed.' },
          { id: 'or3', author: 'Bibek Thapa', text: 'Good to know about the fee structure.' },
          { id: 'or4', author: 'Pooja Karki', text: 'Dr. Rana in ENT is exceptionally good.' },
          { id: 'or5', author: 'Manoj Bajracharya', text: 'Thanks for confirming the consultant fees.' },
          { id: 'or6', author: 'Hari Prasad', text: 'Very helpful community post.' },
          { id: 'or7', author: 'Gita Shrestha', text: 'Will check their evening timings.' },
          { id: 'or8', author: 'Ram Prasad', text: 'Om Hospital parking is quite spacious now.' },
          { id: 'or9', author: 'Sita Sharma', text: 'Appreciate the exact price range.' },
          { id: 'or10', author: 'Binod Shrestha', text: 'Thanks for the recommendation.' },
          { id: 'or11', author: 'Prakash Adhikari', text: 'Helpful details.' },
          { id: 'or12', author: 'Nisha Karki', text: 'Thanks Dipesh.' },
          { id: 'or13', author: 'Suman Shrestha', text: 'Great thread.' }
        ]
      }
    ]
  }
};
window.activeDiscussionId = null;

function getOrCreateModalContainer() {
  let container = document.getElementById('modalContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'modalContainer';
    document.body.appendChild(container);
  }
  return container;
}

// Open Modal (DB se try karega, 404 aane par bhi fallback se show karega)
window.openDiscussionModal = async function(discussionId) {
  window.activeDiscussionId = discussionId;
  window.renderFBCommentModal();

  try {
    const res = await fetch(`/api/discussions/${discussionId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.comments && data.comments.length > 0) {
        window.DISCUSSIONS_STORE[discussionId] = data;
        window.renderFBCommentModal();
      }
    }
  } catch (err) {}
};

window.renderFBCommentModal = function() {
  const container = getOrCreateModalContainer();
  const d = window.DISCUSSIONS_STORE[window.activeDiscussionId] || { hospital: 'Community', question: 'Q&A', likes: 0, comments: [] };
  const comments = d.comments || [];
  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0);

  container.innerHTML = `
    <div class="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
        
        <div class="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              ${d.logo || 'H'}
            </div>
            <div>
              <h3 class="font-bold text-slate-900 text-sm leading-tight">${d.hospital}</h3>
              <span class="text-[11px] text-slate-400">Community Discussion • ${d.time || 'Recent'}</span>
            </div>
          </div>
          <button onclick="window.closeDiscussionModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold">✕</button>
        </div>

        <div class="p-5 border-b border-slate-100 bg-slate-50 flex-shrink-0">
          <p class="text-sm sm:text-base font-bold text-slate-900 leading-snug">"${d.question}"</p>
          <div class="flex items-center space-x-4 mt-3 text-xs text-slate-500">
            <span>❤️ ${d.likes || 0} Helpful</span>
            <span>💬 ${totalCount} Comments</span>
          </div>
        </div>

        <div id="commentsStream" class="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          ${comments.map(c => `
            <div class="flex items-start space-x-2.5">
              <div class="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                ${(c.author || 'User').slice(0, 2).toUpperCase()}
              </div>
              <div class="flex-1 min-w-0">
                <div class="bg-slate-100 rounded-2xl px-4 py-2.5 inline-block max-w-full">
                  <span class="font-bold text-slate-900 block leading-tight">${c.author}</span>
                  <p class="text-slate-700 mt-1 text-xs leading-relaxed whitespace-pre-wrap">${c.text}</p>
                </div>
                <div class="flex items-center space-x-3 mt-1 ml-2 text-[11px] text-slate-500">
                  <span>${c.time || 'Just now'}</span>
                  <button onclick="window.toggleCommentLike('${c.id}')" class="flex items-center space-x-1 font-bold transition ${c.isLiked ? 'text-rose-600' : 'text-slate-500 hover:text-slate-800'}">
                    <svg class="w-3.5 h-3.5 ${c.isLiked ? 'fill-rose-600 text-rose-600' : 'text-slate-400'}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Like ${c.likes > 0 ? `(${c.likes})` : ''}</span>
                  </button>
                                    <button onclick="window.toggleReplyBox('${c.id}')" class="font-bold hover:text-slate-800">Reply</button>
                </div>

                ${c.replies && c.replies.length > 0 ? `
                  <div class="ml-3 pl-3 border-l-2 border-slate-200 mt-2.5 space-y-2">
                    ${c.replies.map(r => `
                      <div class="flex items-start space-x-2">
                        <div class="w-6 h-6 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-[9px] flex-shrink-0 mt-0.5">
                          ${(r.author || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div class="bg-slate-100 rounded-xl px-3 py-1.5 inline-block max-w-full">
                          <span class="font-bold text-slate-900 block text-[11px]">${r.author}</span>
                          <p class="text-slate-700 text-[11px] mt-0.5">${r.text}</p>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}

                <div id="replyBox-${c.id}" class="hidden mt-2.5 ml-3 pl-3 border-l-2 border-slate-200">
                  <div class="flex items-center space-x-2">
                    <input type="text" id="replyInput-${c.id}" placeholder="Write a reply..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800">
                    <button onclick="window.submitReply('${c.id}')" class="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold">Reply</button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="p-3 sm:p-4 bg-white border-t border-slate-200 flex-shrink-0">
          <form onsubmit="window.submitDiscussionComment(event)" class="flex items-center space-x-2">
            <input type="text" id="fbCommentInput" required placeholder="Write a public comment..." class="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 text-xs">
            <button type="submit" class="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-2xl text-xs">Post</button>
          </form>
        </div>

      </div>
    </div>
  `;
};

window.submitDiscussionComment = function(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('fbCommentInput');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const currentDisc = window.DISCUSSIONS_STORE[window.activeDiscussionId];
  if (!currentDisc) return;

  if (!currentDisc.comments) currentDisc.comments = [];
  currentDisc.comments.push({
    id: 'c_' + Date.now(),
    author: 'You (Patient)',
    time: 'Just now',
    text: text,
    likes: 0,
    isLiked: false,
    replies: []
  });

  window.renderFBCommentModal();
  setTimeout(() => {
    const stream = document.getElementById('commentsStream');
    if (stream) stream.scrollTop = stream.scrollHeight;
  }, 50);
};

window.toggleReplyBox = function(commentId) {
  const box = document.getElementById(`replyBox-${commentId}`);
  if (box) box.classList.toggle('hidden');
};

window.submitReply = function(commentId) {
  const input = document.getElementById(`replyInput-${commentId}`);
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const currentDisc = window.DISCUSSIONS_STORE[window.activeDiscussionId];
  const comment = currentDisc?.comments?.find(c => c.id === commentId);
  if (!comment) return;

  if (!comment.replies) comment.replies = [];
  comment.replies.push({ id: 'r_' + Date.now(), author: 'You', time: 'Just now', text: text });
  window.renderFBCommentModal();
};

window.toggleCommentLike = function(commentId) {
  const currentDisc = window.DISCUSSIONS_STORE[window.activeDiscussionId];
  const c = currentDisc?.comments?.find(x => x.id === commentId);
  if (!c) return;
  c.isLiked = !c.isLiked;
  c.likes = (c.likes || 0) + (c.isLiked ? 1 : -1);
  window.renderFBCommentModal();
};

window.closeDiscussionModal = function() {
  const container = getOrCreateModalContainer();
  if (container) container.innerHTML = '';
};

// View All Discussions Page
window.renderAllDiscussionsView = function() {
  const list = [
    { id: 'disc-grande', hospital: 'Grande International Hospital', logo: 'GI', time: '2 hours ago', question: 'Has anyone recently visited their emergency department?', replies: 14, helpful: 9 },
    { id: 'disc-norvic', hospital: 'Norvic International Hospital', logo: 'NI', time: '5 hours ago', question: 'How was your experience with the cardiology department?', replies: 22, helpful: 17 },
    { id: 'disc-hams', hospital: 'HAMS Hospital', logo: 'HA', time: 'Yesterday', question: 'Anyone know about their dermatology OPD timing and wait time?', replies: 8, helpful: 5 },
    { id: 'disc-bnb', hospital: 'B&B Hospital', logo: 'BB', time: '2 days ago', question: 'Is the diabetes specialist available on weekends at B&B?', replies: 11, helpful: 8 },
    { id: 'disc-mediciti', hospital: 'Nepal Mediciti Hospital', logo: 'NE', time: '3 days ago', question: 'How are the room charges and insurance claim process at Mediciti?', replies: 19, helpful: 12 },
    { id: 'disc-patan', hospital: 'Patan Hospital', logo: 'PA', time: '4 days ago', question: 'Is prior appointment mandatory for general surgery OPD?', replies: 15, helpful: 10 },
    { id: 'disc-kmc', hospital: 'Kathmandu Medical College (KMC)', logo: 'KA', time: '5 days ago', question: 'Best pediatrician for newborn vaccination schedule here?', replies: 7, helpful: 6 },
    { id: 'disc-om', hospital: 'Om Hospital & Research Centre', logo: 'OM', time: '1 week ago', question: 'ENT department consultation fees and doctor availability?', replies: 13, helpful: 9 }
  ];

  return `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 mb-16">
      <div class="mb-8">
        <button onclick="navigateTo('discovery')" class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 mb-3 cursor-pointer">
          <span>← Back to Discovery</span>
        </button>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Healthcare Community Discussions</h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">Ask questions, read patient experiences, and discuss care across hospitals in Nepal.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        ${list.map(item => `
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  ${item.logo}
                </div>
                <div>
                  <h4 class="font-bold text-slate-900 text-xs leading-tight">${item.hospital}</h4>
                  <span class="text-[11px] text-slate-400">${item.time}</span>
                </div>
              </div>
              <p class="text-xs text-slate-700 font-medium mb-4 leading-relaxed">
                "${item.question}"
              </p>
            </div>
            <div>
              <div class="text-[11px] text-slate-500 mb-3">
                ${item.replies} replies • ${item.helpful} helpful
              </div>
              <button onclick="window.openDiscussionModal('${item.id}')" class="w-full py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer">
                View Discussion
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};
// 1. LocalStorage Store & Filter States
window.REVIEWS_STORE = JSON.parse(localStorage.getItem('NEPAL_HEALTH_REVIEWS')) || {
  'disc-grande': [
    { id: 'rev-1', author: 'Priya Maharjan', rating: 5, timestamp: Date.now() - 259200000, date: '3 days ago', text: 'The emergency department at Grande was incredibly efficient. My father was admitted within minutes and the staff was professional throughout.', hospitalName: 'Grande International Hospital', providerResponse: "Thank you for your kind words. We're glad your father received prompt care.", helpful: 24, commentsCount: 3 }
  ],
  'disc-norvic': [
    { id: 'rev-1', author: 'Rajesh Thapa', rating: 4, timestamp: Date.now() - 604800000, date: '1 week ago', text: 'Good cardiologist but the waiting time is long. Arrived at 10am, waited nearly 2 hours before seeing Dr. Shrestha. The consultation was thorough.', hospitalName: 'Norvic International Hospital', helpful: 18, commentsCount: 5 }
  ],
  'disc-hams': [
    { id: 'rev-1', author: 'Sunita Gurung', rating: 5, timestamp: Date.now() - 1209600000, date: '2 weeks ago', text: "Excellent physiotherapy unit at HAMS. Three weeks of treatment for my knee injury and I'm back to normal. The therapists genuinely care.", hospitalName: 'HAMS Hospital', helpful: 31, commentsCount: 7 }
  ]
};

window.currentReviewFilter = window.currentReviewFilter || 'recent';

window.setPatientVoiceFilter = function(filterType) {
  window.currentReviewFilter = filterType;
  if (typeof renderApp === 'function') renderApp();
};

window.setReviewFilter = function(filterType) {
  window.currentReviewFilter = filterType;
  if (typeof AppState !== 'undefined') AppState.activeView = 'all-reviews';
  if (typeof renderApp === 'function') renderApp();
};

// 2. Global Review Submit Handler
window.handleGlobalReviewSubmit = function(e) {
  if (e) e.preventDefault();
  const hospitalSelect = document.getElementById('globalReviewHospital');
  if (!hospitalSelect) return;
  
  const hospitalId = hospitalSelect.value;
  const hospitalName = hospitalSelect.options[hospitalSelect.selectedIndex].text;
  const ratingVal = parseInt(document.getElementById('globalReviewRating').value);
  const textVal = document.getElementById('globalReviewText').value.trim();
  if (!textVal) return;

  if (!window.REVIEWS_STORE[hospitalId]) window.REVIEWS_STORE[hospitalId] = [];

  window.REVIEWS_STORE[hospitalId].unshift({
    id: 'rev_' + Date.now(),
    author: 'You (Verified Patient)',
    rating: ratingVal,
    timestamp: Date.now(),
    date: 'Just now',
    text: textVal,
    hospitalName: hospitalName,
    helpful: 0,
    commentsCount: 0
  });

  localStorage.setItem('NEPAL_HEALTH_REVIEWS', JSON.stringify(window.REVIEWS_STORE));
  if (typeof renderApp === 'function') renderApp();
};

// 3. Full Reviews Page View Renderer
window.renderAllReviewsView = function() {
  let allReviews = [];
  const store = window.REVIEWS_STORE || {};
  Object.keys(store).forEach(hId => {
    const list = store[hId] || [];
    list.forEach(r => allReviews.push({ ...r, hospitalId: hId }));
  });

  const filter = window.currentReviewFilter || 'recent';
  const searchQuery = window.currentReviewSearch || '';

  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase();
    allReviews = allReviews.filter(r => 
      (r.hospitalName && r.hospitalName.toLowerCase().includes(q)) || 
      (r.text && r.text.toLowerCase().includes(q)) ||
      (r.author && r.author.toLowerCase().includes(q))
    );
  }

  if (filter === 'recent') {
    allReviews.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  } else if (filter === 'highest') {
    allReviews.sort((a, b) => b.rating - a.rating);
  } else if (filter === 'lowest') {
    allReviews.sort((a, b) => a.rating - b.rating);
  }

  return `
    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 mb-16 text-left">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onclick="navigateTo('discovery')" class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 mb-3 cursor-pointer">
            <span>← Back to Discovery</span>
          </button>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900">All Patient Reviews & Experiences</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Browse verified patient feedback across healthcare providers or share your own experience.</p>
        </div>

        <div class="inline-flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 self-start sm:self-auto">
          <button onclick="window.setReviewFilter('recent')" class="px-3 py-1.5 rounded-lg transition cursor-pointer ${filter === 'recent' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}">Most Recent</button>
          <button onclick="window.setReviewFilter('highest')" class="px-3 py-1.5 rounded-lg transition cursor-pointer ${filter === 'highest' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}">Highest Rated</button>
          <button onclick="window.setReviewFilter('lowest')" class="px-3 py-1.5 rounded-lg transition cursor-pointer ${filter === 'lowest' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}">Lowest Rated</button>
        </div>
      </div>

      <!-- Reviews List Feed -->
      <div class="space-y-4">
        ${allReviews.length === 0 ? '<p class="text-slate-400 text-center py-8 text-xs">No matching reviews found.</p>' : ''}
        ${allReviews.map(r => {
          const stars = Array.from({length: 5}, (_, i) => `<span class="${i < r.rating ? 'text-amber-400' : 'text-slate-300'}">★</span>`).join('');
          const initials = r.author ? r.author.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'VP';
          return `
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center space-x-2.5">
                    <div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">${initials}</div>
                    <div>
                      <span class="font-bold text-slate-900 text-xs block">${r.author}</span>
                      <span class="text-[10px] text-slate-400">${r.date || 'Just now'} / Verified Patient</span>
                    </div>
                  </div>
                  <div class="text-xs">${stars}</div>
                </div>
                <p class="text-xs text-slate-600 mb-3">"${r.text}"</p>
              </div>
              <div class="pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-700">
                ${r.hospitalName || 'Healthcare Provider'}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
};
window.setStarRating = function(rating) {
  const input = document.getElementById('selectedStarRating');
  if (input) input.value = rating;
  const ratingText = document.getElementById('ratingText');
  if (ratingText) ratingText.innerText = `(${rating}/5 ${labels[rating]})`;

  const stars = document.querySelectorAll('#starContainer .star-btn');
  stars.forEach((s, idx) => {
    if (idx < rating) {
      s.classList.remove('text-slate-300');
      s.classList.add('text-amber-400');
    } else {
      s.classList.remove('text-amber-400');
      s.classList.add('text-slate-300');
    }
  });
};

window.previewStarRating = function(rating) {
  const stars = document.querySelectorAll('#starContainer .star-btn');
  stars.forEach((s, idx) => {
    if (idx < rating) {
      s.classList.add('text-amber-200');
    } else {
      s.classList.remove('text-amber-200');
    }
  });
};