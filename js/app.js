/**
 * SAINO HEALTH - Core Frontend Application Controller
 * Handles Routing, State, Search/Filters, Modals, WhatsApp Engine, and Carousel
 */

// Application State
const AppState = {
  activeView: 'marketplace', // 'marketplace' | 'discovery' | 'campaigns' | 'boost' | 'about' | 'contact' | 'list-your-care'
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
  discoverySlideIndex: 0,
  discoveryReviewIndex: 0,
  discoveryRatedTab: 'hospitals',
  discoverySelectedLocation: 'loc-1',
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

function navigateTo(viewName, filterParams = null) {
  AppState.activeView = viewName;
  
  // Close mobile menu if open
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
    mobileMenu.classList.add('hidden');
  }

  // Update active nav links
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.getAttribute('data-nav') === viewName) {
      link.classList.add('text-saino-red', 'font-semibold');
      link.classList.remove('text-saino-gray-600');
    } else {
      link.classList.remove('text-saino-red', 'font-semibold');
      link.classList.add('text-saino-gray-600');
    }
  });

  if (filterParams) {
    if (filterParams.category) AppState.selectedCategory = filterParams.category;
    if (filterParams.location) AppState.selectedLocation = filterParams.location;
    if (filterParams.bookingType) AppState.selectedBookingType = filterParams.bookingType;
  }

  renderApp();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render Master Controller
function renderApp() {
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
    case 'list-your-care':
      mainContainer.innerHTML = renderListYourCareView();
      bindListYourCareEvents();
      break;
    case 'campaigns':
      mainContainer.innerHTML = renderCampaignsView();
      bindCampaignsEvents();
      break;
    case 'boost':
      mainContainer.innerHTML = renderBoostView();
      bindBoostEvents();
      break;
    case 'about':
      mainContainer.innerHTML = renderAboutView();
      bindAboutEvents();
      break;
    case 'contact':
      mainContainer.innerHTML = renderContactView();
      bindContactEvents();
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
// 1. MARKETPLACE VIEW RENDERING (EXACT FIGMA HOMEPAGE SPEC)
// ==========================================
function renderMarketplaceView() {

  const allProviders = AppState.providers || window.SAINO_DATA.providers || [];

  // ==========================================
  // PROVIDER GROUPS
  // ==========================================

  const hospitals = allProviders
    .filter(p => p.category === 'hospital')
    .slice(0, 3);

  const clinics = allProviders
    .filter(p => p.category === 'clinic')
    .slice(0, 3);

  const diagnostics = allProviders
    .filter(p => p.category === 'diagnostic')
    .slice(0, 3);

  const wellness = allProviders
    .filter(p => p.category === 'wellness')
    .slice(0, 3);

  const homecare = allProviders
    .filter(p => p.category === 'homecare')
    .slice(0, 3);

  const insurance = allProviders
    .filter(p => p.category === 'insurance')
    .slice(0, 3);

  const diagnosticPackages =
    window.SAINO_DATA.diagnosticPackages || [];

  const talkReviews =
    window.SAINO_DATA.talkOfTheTown || [];

  const onlineDoctors =
    window.SAINO_DATA.onlineDoctors || [];

  const emergencyBloodBanks =
    window.SAINO_DATA.sainoRated?.bloodBanks?.slice(0, 3) || [];

  const emergencyAmbulances =
    window.SAINO_DATA.sainoRated?.ambulances?.slice(0, 3) || [];


  // ==========================================
  // QUICK HEALTHCARE SERVICES
  // ==========================================

  const quickServices = [
    {
      id: 'hospital',
      title: 'Hospital',
      icon: 'building-2',
      description: 'Hospitals & specialist care'
    },
    {
      id: 'clinic',
      title: 'Clinic',
      icon: 'stethoscope',
      description: 'Doctors & OPD clinics'
    },
    {
      id: 'diagnostic',
      title: 'Diagnostic / Lab',
      icon: 'activity',
      description: 'Labs, MRI, CT & scans'
    },
    {
      id: 'packages',
      title: 'Diagnostic Packages',
      icon: 'package-check',
      description: 'Health screening packages'
    },
    {
      id: 'wellness',
      title: 'Wellness Centre',
      icon: 'sparkles',
      description: 'Wellness & preventive care'
    },
    {
      id: 'homecare',
      title: 'Homecare & Elderly',
      icon: 'heart-handshake',
      description: 'Care at your doorstep'
    },
    {
      id: 'insurance',
      title: 'Health Insurance',
      icon: 'shield-check',
      description: 'Protect your health'
    },
    {
      id: 'bloodbank',
      title: 'Blood Bank',
      icon: 'droplets',
      description: 'Emergency blood services'
    }
  ];


  // ==========================================
  // HERO / SEARCH
  // ==========================================

  return `



    <!-- ==========================================
         2. CATALOGUE / ADS
    =========================================== -->

    <section class="mb-8 rounded-xl bg-saino-red text-white h-[180px] flex items-center justify-center shadow-md relative overflow-hidden">

      <div class="text-center relative z-10 px-4">

        <h2
          id="adTitle"
          class="text-sm sm:text-base font-bold mb-1 transition-opacity duration-500">
          Catalogue / Ads Section
        </h2>

        <p
          id="adDescription"
          class="text-[9px] sm:text-[10px] text-white/70 mb-2 transition-opacity duration-500">
          Rotating healthcare promotions, sponsored placements & platform announcements
        </p>

        <div class="flex justify-center items-center gap-1.5">

          <span class="ad-dot w-1.5 h-1.5 rounded-full bg-white"></span>
          <span class="ad-dot w-1.5 h-1.5 rounded-full bg-white/40"></span>
          <span class="ad-dot w-1.5 h-1.5 rounded-full bg-white/40"></span>
          <span class="ad-dot w-1.5 h-1.5 rounded-full bg-white/40"></span>

        </div>

      </div>

    </section>



    <!-- ==========================================
         4. QUICK HEALTHCARE SERVICES
    =========================================== -->

    <section class="mb-14">

      <div class="flex items-center justify-between mb-6">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Healthcare Services
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Explore Healthcare
          </h2>

          <p class="text-xs text-saino-gray-500 mt-1">
            Everything you need across the healthcare journey.
          </p>

        </div>

      </div>


      <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">

        ${quickServices.map(service => `

          <button
            onclick="${
              service.id === 'packages'
                ? "document.getElementById('diagnostic-packages-section')?.scrollIntoView({behavior:'smooth'})"
                : `filterCategory('${service.id}')`
            }"
            class="group bg-white rounded-2xl border border-saino-gray-200 p-4 text-center hover:border-saino-red/30 hover:shadow-md transition">

            <div class="w-11 h-11 mx-auto rounded-xl bg-saino-red/10 text-saino-red flex items-center justify-center group-hover:bg-saino-red group-hover:text-white transition">

              <i data-lucide="${service.icon}" class="w-5 h-5"></i>

            </div>

            <h3 class="mt-3 text-[11px] sm:text-xs font-black text-saino-gray-900">
              ${service.title}
            </h3>

            <p class="mt-1 text-[9px] text-saino-gray-500 leading-tight">
              ${service.description}
            </p>

          </button>

        `).join('')}

      </div>

    </section>


    <!-- ==========================================
         5. HOSPITALS
    =========================================== -->

    <section class="mb-14">

      <div class="flex items-center justify-between mb-6 pb-3 border-b border-saino-gray-200">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Trusted Healthcare Providers
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Hospitals
          </h2>

        </div>

        <button
          onclick="filterCategory('hospital')"
          class="text-xs font-bold text-saino-red hover:underline">
          View All →
        </button>

      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        ${hospitals.map(p => renderProviderCard(p)).join('')}

      </div>

    </section>


    <!-- ==========================================
         6. CLINICS + REVIEWS
    =========================================== -->

    <section class="mb-14">

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <!-- CLINICS -->

        <div class="lg:col-span-7">

          <div class="flex items-center justify-between mb-5 pb-2 border-b border-saino-gray-200">

            <h2 class="text-base sm:text-lg font-black text-saino-gray-900 uppercase tracking-wide">
              Clinics
            </h2>

            <button
              onclick="filterCategory('clinic')"
              class="text-xs font-bold text-saino-red hover:underline">
              View All →
            </button>

          </div>

          <div class="space-y-4">

            ${clinics.map(c => renderProviderCard(c)).join('')}

          </div>

        </div>


        <!-- PATIENT REVIEWS -->

        <div class="lg:col-span-5">

          <div class="flex items-center justify-between mb-5 pb-2 border-b border-saino-gray-200">

            <div>

              <span class="text-xs font-black uppercase tracking-wider text-saino-red">
                Community
              </span>

              <h2 class="text-base sm:text-lg font-black text-saino-gray-900">
                Patient Reviews
              </h2>

            </div>

            <button
              onclick="navigateTo('discovery')"
              class="text-xs font-bold text-saino-red hover:underline">
              Read All →
            </button>

          </div>

          <div class="space-y-3">

            ${talkReviews.slice(0, 5)
              .map((r, i) => renderTalkReviewItem(r, i))
              .join('')}

          </div>

        </div>

      </div>

    </section>


    <!-- ==========================================
         7. DISCOVERY / SOCIAL ENGAGEMENT
    =========================================== -->

    <section class="mb-14 rounded-3xl bg-saino-gray-50 border border-saino-gray-200 p-6 sm:p-8">

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            SAINO Discovery
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900 mt-1">
            Like · Comment · Interested · Saved
          </h2>

          <p class="text-xs sm:text-sm text-saino-gray-600 mt-1 max-w-2xl">
            Discover healthcare providers, read real patient experiences,
            share your opinion and save providers for later.
          </p>

        </div>

        <button
          onclick="navigateTo('discovery')"
          class="px-5 py-3 rounded-xl bg-white border border-saino-gray-200 text-saino-gray-800 text-xs font-black hover:border-saino-red/30 hover:text-saino-red transition shadow-xs">
          EXPLORE DISCOVERY
        </button>

      </div>

    </section>


    <!-- ==========================================
         8. DIAGNOSTICS / LABS
    =========================================== -->

    <section class="mb-14">

      <div class="flex items-center justify-between mb-6">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Diagnostics & Laboratory
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Diagnostic Centres & Labs
          </h2>

          <p class="text-xs text-saino-gray-500 mt-1">
            Pathology · MRI · CT · Ultrasound · X-Ray · Home Sample Collection
          </p>

        </div>

        <button
          onclick="filterCategory('diagnostic')"
          class="text-xs font-bold text-saino-red hover:underline">
          View All →
        </button>

      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        ${diagnostics.map(p => renderProviderCard(p)).join('')}

      </div>

    </section>


    <!-- ==========================================
         9. DIAGNOSTIC PACKAGES
    =========================================== -->

    <section
      id="diagnostic-packages-section"
      class="mb-14">

      <div class="flex items-center justify-between mb-6">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Preventive Healthcare
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Diagnostic Packages
          </h2>

          <p class="text-xs text-saino-gray-500 mt-1">
            Choose complete health screening packages for you and your family.
          </p>

        </div>

      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        ${diagnosticPackages
          .slice(0, 6)
          .map(pkg => renderDiagnosticPackageCard(pkg))
          .join('')}

      </div>

    </section>


    <!-- ==========================================
         10. HOMECARE & ELDERLY CARE
    =========================================== -->

    <section class="mb-14">

      <div class="rounded-3xl bg-white border border-saino-gray-200 shadow-sm overflow-hidden">

        <div class="p-6 sm:p-8">

          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-7">

            <div>

              <span class="text-xs font-black uppercase tracking-wider text-saino-red">
                Care at Home
              </span>

              <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900 mt-1">
                Homecare & Elderly Care
              </h2>

              <p class="text-xs sm:text-sm text-saino-gray-600 mt-1 max-w-2xl">
                Professional healthcare support at home — from elderly care
                and home nursing to doctor visits and post-operative support.
              </p>

            </div>

            <button
              onclick="filterCategory('homecare')"
              class="px-5 py-2.5 rounded-xl bg-saino-red text-white text-xs font-black hover:bg-saino-red-dark transition">
              VIEW HOMECARE
            </button>

          </div>


          <!-- HOMECARE SERVICES -->

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-7">

            <button
              onclick="filterBookingType('home_nurse')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">

              <i data-lucide="heart-handshake"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>

              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Home Nurse
              </span>

            </button>


            <button
              onclick="filterBookingType('home_doc')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">

              <i data-lucide="stethoscope"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>

              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Home Doctor
              </span>

            </button>


            <button
              onclick="filterCategory('homecare')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">

              <i data-lucide="accessibility"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>

              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Elderly Care
              </span>

            </button>


            <button
              onclick="filterCategory('homecare')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">

              <i data-lucide="heart-pulse"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>

              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Post-Op Care
              </span>

            </button>


            <button
              onclick="filterCategory('homecare')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">

              <i data-lucide="activity"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>

              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Home Physio
              </span>

            </button>


            <button
              onclick="filterCategory('homecare')"
              class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200 hover:border-saino-red/30 transition">

              <i data-lucide="pill"
                 class="w-5 h-5 text-saino-red mx-auto">
              </i>

              <span class="block mt-2 text-[10px] font-black text-saino-gray-800">
                Care Support
              </span>

            </button>

          </div>


          <!-- HOMECARE PROVIDERS -->

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">

            ${homecare.map(p => renderProviderCard(p)).join('')}

          </div>


          <div class="mt-6">

            <button
              onclick="filterBookingType('home_nurse')"
              class="w-full sm:w-auto px-7 py-3 rounded-xl bg-saino-red hover:bg-saino-red-dark text-white text-xs font-black shadow-md transition">

              BOOK HOMECARE

            </button>

          </div>

        </div>

      </div>

    </section>


    <!-- ==========================================
         11. HEALTH INSURANCE
    =========================================== -->

    <section class="mb-14">

      <div class="rounded-3xl bg-white border border-saino-gray-200 shadow-sm p-6 sm:p-8">

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-7">

          <div>

            <span class="text-xs font-black uppercase tracking-wider text-saino-red">
              Healthcare Protection
            </span>

            <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900 mt-1">
              Health Insurance
            </h2>

            <p class="text-xs sm:text-sm text-saino-gray-600 mt-1">
              Protect your health and your family with the right healthcare coverage.
            </p>

          </div>

          <button
            onclick="filterCategory('insurance')"
            class="px-5 py-2.5 rounded-xl bg-saino-red text-white text-xs font-black hover:bg-saino-red-dark transition">
            EXPLORE INSURANCE
          </button>

        </div>


        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-7">

          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">

            <i data-lucide="user"
               class="w-5 h-5 text-saino-red mb-2">
            </i>

            <strong class="text-xs font-black text-saino-gray-900 block">
              Individual Plans
            </strong>

            <span class="text-[10px] text-saino-gray-500">
              Personal healthcare protection
            </span>

          </div>


          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">

            <i data-lucide="users"
               class="w-5 h-5 text-saino-red mb-2">
            </i>

            <strong class="text-xs font-black text-saino-gray-900 block">
              Family Plans
            </strong>

            <span class="text-[10px] text-saino-gray-500">
              Protect your whole family
            </span>

          </div>


          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">

            <i data-lucide="building-2"
               class="w-5 h-5 text-saino-red mb-2">
            </i>

            <strong class="text-xs font-black text-saino-gray-900 block">
              Corporate Plans
            </strong>

            <span class="text-[10px] text-saino-gray-500">
              Employee healthcare coverage
            </span>

          </div>


          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">

            <i data-lucide="badge-check"
               class="w-5 h-5 text-saino-red mb-2">
            </i>

            <strong class="text-xs font-black text-saino-gray-900 block">
              Cashless Networks
            </strong>

            <span class="text-[10px] text-saino-gray-500">
              Partner hospital networks
            </span>

          </div>

        </div>


        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

          ${insurance.map(p => renderProviderCard(p)).join('')}

        </div>

      </div>

    </section>


    <!-- ==========================================
         12. WELLNESS CENTRES
    =========================================== -->

    <section class="mb-14">

      <div class="flex items-center justify-between mb-6">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Preventive & Lifestyle Care
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Wellness Centres
          </h2>

          <p class="text-xs text-saino-gray-500 mt-1">
            Ayurveda · Yoga · Physiotherapy · Mental Wellness · Preventive Care
          </p>

        </div>

        <button
          onclick="filterCategory('wellness')"
          class="text-xs font-bold text-saino-red hover:underline">
          View All →
        </button>

      </div>


      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

        ${wellness.map(p => renderProviderCard(p)).join('')}

      </div>

    </section>


    <!-- ==========================================
         13. COMPARE BEFORE YOU BOOK
    =========================================== -->

    <section class="mb-14 bg-white rounded-3xl border border-saino-gray-200 p-6 sm:p-8 shadow-sm">

      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            Decision Helper
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900 mt-1">
            Compare Before You Book
          </h2>

          <p class="text-xs sm:text-sm text-saino-gray-600 mt-1 max-w-2xl">
            Compare ratings, reviews, services, pricing, availability and
            SAINO badge levels before making your healthcare decision.
          </p>

        </div>

        <button
          onclick="navigateTo('discovery')"
          class="px-6 py-3 rounded-xl bg-saino-red hover:bg-saino-red-dark text-white text-xs font-black shadow-md transition">
          COMPARE PROVIDERS
        </button>

      </div>

    </section>


    <!-- ==========================================
         14. EMERGENCY / BLOOD BANK
    =========================================== -->

    <section class="mb-14">

      <div class="flex items-center justify-between mb-6 pb-3 border-b border-saino-gray-200">

        <div>

          <span class="text-xs font-black uppercase tracking-wider text-saino-red">
            24/7 Rapid Response
          </span>

          <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
            Emergency Care & Blood Banks
          </h2>

        </div>

        <button
          onclick="navigateTo('discovery')"
          class="text-xs font-bold text-saino-red hover:underline">
          Emergency Directory →
        </button>

      </div>


      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">


        <!-- BLOOD BANK -->

        <div class="bg-white rounded-2xl border border-saino-gray-200 p-5 shadow-xs">

          <div class="flex items-center justify-between mb-4 pb-2 border-b border-saino-gray-100">

            <h3 class="text-xs font-black uppercase text-saino-gray-700 flex items-center gap-2">

              <i data-lucide="droplet"
                 class="w-4 h-4 text-saino-red">
              </i>

              Blood Banks

            </h3>

            <span class="text-[10px] text-saino-gray-400 font-semibold">
              Emergency
            </span>

          </div>


          <div class="space-y-3">

            ${emergencyBloodBanks.map(b => `

              <div class="p-3 rounded-xl bg-saino-gray-50 border border-saino-gray-100">

                <strong class="text-xs text-saino-gray-900 block">
                  ${b.name}
                </strong>

                <span class="text-[10px] text-saino-gray-500 block mt-1">
                  ${b.area || ''}
                </span>

                <button
                  onclick="openCustomWhatsApp('Blood Bank Enquiry: ${b.name}', 'Hello SAINO, I need blood availability information from ${b.name}.')"
                  class="mt-2 px-3 py-1.5 bg-saino-red text-white rounded-lg text-[10px] font-bold">
                  Enquire Now
                </button>

              </div>

            `).join('')}

          </div>

        </div>


        <!-- AMBULANCE -->

        <div class="bg-white rounded-2xl border border-saino-gray-200 p-5 shadow-xs">

          <div class="flex items-center justify-between mb-4 pb-2 border-b border-saino-gray-100">

            <h3 class="text-xs font-black uppercase text-saino-gray-700 flex items-center gap-2">

              <i data-lucide="truck"
                 class="w-4 h-4 text-saino-red">
              </i>

              Ambulance

            </h3>

            <span class="text-[10px] text-saino-gray-400 font-semibold">
              24/7 Dispatch
            </span>

          </div>


          <div class="space-y-3">

            ${emergencyAmbulances.map(a => `

              <div class="p-3 rounded-xl bg-saino-gray-50 border border-saino-gray-100">

                <strong class="text-xs text-saino-gray-900 block">
                  ${a.name}
                </strong>

                <span class="text-[10px] text-saino-gray-500 block mt-1">
                  ${a.area || ''}
                </span>

                <button
                  onclick="openCustomWhatsApp('Ambulance Dispatch: ${a.name}', 'Hello SAINO, I need an ambulance dispatch enquiry for ${a.name}.')"
                  class="mt-2 px-3 py-1.5 bg-saino-red text-white rounded-lg text-[10px] font-bold">
                  Request Ambulance
                </button>

              </div>

            `).join('')}

          </div>

        </div>

      </div>

    </section>


    <!-- ==========================================
         15. DOCTOR OPD
    =========================================== -->

    <section class="mb-14">

      <div class="mb-6">

        <span class="text-xs font-black uppercase tracking-wider text-saino-red">
          Direct Healthcare Booking
        </span>

        <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
          Doctor Consultation & OPD
        </h2>

        <p class="text-xs text-saino-gray-500 mt-1">
          Discover doctors and request OPD consultation bookings.
        </p>

      </div>


      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">

        ${onlineDoctors.slice(0, 10).map(doc => `

          <div class="bg-white rounded-2xl border border-saino-gray-200 p-4 text-center shadow-xs">

            <div class="relative w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border-2 border-saino-red/20">

              <img
                src="${doc.image}"
                alt="${doc.name}"
                class="w-full h-full object-cover">

            </div>

            <strong class="text-xs font-bold text-saino-gray-900 block truncate">
              ${doc.name}
            </strong>

            <span class="text-[10px] text-saino-gray-500 block truncate mt-1">
              ${doc.role}
            </span>

            <span class="text-[10px] text-sky-700 font-semibold block truncate mt-1">
              ${doc.hospital}
            </span>

            <button
              onclick="openCustomWhatsApp('Doctor OPD Consultation: ${doc.name}', 'Hi SAINO Health, I would like to book an OPD consultation with ${doc.name} at ${doc.hospital}.')"
              class="mt-3 w-full py-2 bg-saino-red hover:bg-saino-red-dark text-white font-bold rounded-xl text-[10px]">
              BOOK OPD
            </button>

          </div>

        `).join('')}

      </div>

    </section>


    <!-- ==========================================
         16. PROVIDER ONBOARDING
    =========================================== -->

    <section class="mb-14 bg-saino-gray-50 rounded-3xl border border-saino-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">

      <div>

        <span class="text-xs font-black uppercase tracking-wider text-saino-red block mb-1">
          SAINO Provider Network
        </span>

        <h2 class="text-xl sm:text-2xl font-black text-saino-gray-900">
          Are you a Healthcare Provider?
        </h2>

        <p class="text-xs sm:text-sm text-saino-gray-600 mt-1">
          List your hospital, clinic, diagnostic centre, wellness centre,
          homecare service or health insurance business on SAINO HEALTH.
        </p>

      </div>

      <button
        onclick="navigateTo('list-your-care')"
        class="px-6 py-3 bg-saino-red hover:bg-saino-red-dark text-white font-black rounded-full text-xs sm:text-sm shadow-md transition whitespace-nowrap">
        LIST YOUR CARE
      </button>

    </section>
      <!-- 11. DIGITALLY CONNECTED (NEPAL MAP GRAPHIC) -->
    <section class="mb-14 bg-gradient-to-r from-sky-50 via-white to-sky-50 rounded-3xl border border-sky-100 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
      <div class="max-w-md">
        <h2 class="text-2xl sm:text-3xl font-black text-saino-gray-900 mb-2">
          Digitally <span class="text-saino-red">Connected</span>
        </h2>
        <p class="text-xs sm:text-sm text-saino-gray-600 leading-relaxed">
          An all-in-one healthcare directory linking patients to verified providers across all 7 provinces of Nepal.
        </p>
      </div>
      <div class="flex-1 flex justify-center">
        <div class="relative w-full max-w-md h-36 bg-sky-100/50 rounded-2xl border border-sky-200/60 p-4 flex items-center justify-center overflow-hidden">
          <div class="text-center text-xs font-bold text-sky-800 space-y-1">
            <i data-lucide="network" class="w-8 h-8 mx-auto text-saino-red"></i>
            <span>Kathmandu · Pokhara · Chitwan · Biratnagar · Butwal · Nepalgunj · Dhangadhi</span>
            <span class="text-[10px] text-saino-gray-500 block">7 Provinces Connected</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

    



// Render Horizontal Clinic Card (Matching Figma 2-Column Left Layout)
function renderHorizontalClinicCard(c) {
  return `
    <div class="bg-white rounded-2xl border border-saino-gray-200 p-4 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row gap-4">
      <div class="w-full sm:w-36 h-32 sm:h-auto rounded-xl overflow-hidden bg-saino-gray-100 flex-shrink-0 relative">
        <img src="${c.image}" alt="${c.name}" class="w-full h-full object-cover">
        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-black bg-saino-red text-white shadow-xs">
          ${c.badge || 'SAINO PRO'}
        </span>
      </div>
      <div class="flex-1 flex flex-col justify-between text-xs">
        <div>
          <div class="flex items-center justify-between mb-1">
            <h4 class="text-sm font-bold text-saino-gray-900 leading-tight">${c.name}</h4>
          </div>
          <div class="flex items-center space-x-1 text-amber-500 font-bold text-xs mb-1.5">
            <span>⭐</span>
            <span class="text-saino-gray-900">${c.rating}</span>
            <span class="text-saino-gray-400 font-normal">(${c.reviews} Reviews)</span>
          </div>
          <div class="text-[11px] text-saino-gray-600 mb-1">
            <strong class="text-saino-gray-800">${c.doctor || c.special || 'Specialist Consultant'}</strong>
          </div>
          <div class="text-[11px] text-saino-gray-500 flex items-center mb-2">
            <i data-lucide="map-pin" class="w-3 h-3 mr-1 text-saino-red flex-shrink-0"></i>
            <span class="truncate">${c.area || 'Kathmandu, Nepal'}</span>
          </div>
        </div>
        <div class="pt-2 border-t border-saino-gray-100 flex items-center justify-between">
          <button onclick="openCustomWhatsApp('Clinic Booking: ${c.name}', 'Hi SAINO, I want to book an appointment at ${c.name}.')" class="px-3.5 py-1.5 bg-saino-red hover:bg-saino-red-dark text-white font-bold rounded-lg text-[11px] transition shadow-xs">
            Book on WhatsApp
          </button>
          <button onclick="filterCategory('clinic')" class="text-sky-600 hover:text-sky-800 font-semibold text-[11px] flex items-center space-x-0.5">
            <span>View Profile</span>
            <i data-lucide="chevron-right" class="w-3 h-3"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Render Patient Review in Right Column (Talk of the Town)
function renderTalkReviewItem(t, idx) {
  const avatarColors = ['bg-emerald-600', 'bg-sky-600', 'bg-purple-600', 'bg-rose-600', 'bg-amber-600'];
  const colorClass = avatarColors[idx % avatarColors.length];
  const initials = t.author ? t.author.split(' ').map(n => n[0]).join('').substring(0, 2) : 'PT';

  return `
    <div class="bg-white rounded-2xl border border-saino-gray-200 p-4 shadow-xs hover:shadow-md transition text-xs">
      <div class="flex items-center space-x-3 mb-2">
        <div class="w-8 h-8 rounded-full ${colorClass} text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-xs">
          ${initials}
        </div>
        <div class="truncate flex-1">
          <strong class="text-saino-gray-900 block font-bold text-xs truncate">${t.author}</strong>
          <div class="flex items-center space-x-1 text-amber-500 text-[10px]">
            <span>★★★★★</span>
            <span class="text-saino-gray-400">· 5.0</span>
          </div>
        </div>
        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          Verified
        </span>
      </div>
      <p class="text-saino-gray-600 text-[11px] italic leading-relaxed mb-2">
        "${t.body || t.title}"
      </p>
      <div class="text-[10px] text-saino-gray-400 flex items-center justify-between pt-1 border-t border-saino-gray-100">
        <span>Care at: <strong class="text-saino-gray-700">${t.provider}</strong></span>
        <button onclick="showToast('Liked review!')" class="text-saino-red font-bold hover:underline">
          ♥ Helpful
        </button>
      </div>
    </div>
  `;
}

// Render Patient Story Card (Horizontal 3-card Showcase)
function renderPatientStoryCard(s) {
  return `
    <div class="bg-white rounded-3xl border border-saino-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-1 text-amber-500 text-sm">
            <span>★★★★★</span>
          </div>
          <span class="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            Verified Patient
          </span>
        </div>
        <h4 class="text-sm font-bold text-saino-gray-900 mb-2 leading-snug">${s.title}</h4>
        <p class="text-xs text-saino-gray-600 mb-4 leading-relaxed italic">"${s.body}"</p>
      </div>
      <div class="pt-3 border-t border-saino-gray-100 flex items-center justify-between text-xs">
        <div>
          <strong class="text-saino-gray-900 block font-bold">${s.author}</strong>
          <span class="text-[11px] text-saino-gray-500">${s.role} · <span class="text-saino-red font-semibold">${s.provider}</span></span>
        </div>
      </div>
    </div>
  `;
}

// Render Diagnostic Package Card
function renderDiagnosticPackageCard(pkg) {
  return `
    <div class="bg-white rounded-3xl border border-saino-gray-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between mb-3">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-saino-red/10 text-saino-red-dark border border-saino-red/20">
            ${pkg.badge}
          </span>
          <span class="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
            ${pkg.discount}
          </span>
        </div>
        <h4 class="text-base font-bold text-saino-gray-900 mb-2 leading-snug">${pkg.title}</h4>
        <p class="text-xs text-saino-gray-600 mb-4 leading-relaxed">${pkg.testsCount}</p>
        <div class="text-xs text-saino-gray-400 mb-4">
          Partner: <strong class="text-saino-gray-700">${pkg.hospital}</strong>
        </div>
      </div>
      <div class="pt-4 border-t border-saino-gray-100 flex items-center justify-between">
        <div>
          <span class="text-xs text-saino-gray-400 line-through block">${pkg.originalPrice}</span>
          <strong class="text-base font-black text-saino-gray-900">${pkg.discountedPrice}</strong>
        </div>
        <button onclick="openCustomWhatsApp('Diagnostic Package: ${pkg.title}', 'Hi SAINO, I would like to book the ${pkg.title} (${pkg.discountedPrice}) with home sample collection / lab visit.')" class="px-4 py-2 bg-saino-red hover:bg-saino-red-dark text-white font-bold rounded-xl text-xs transition shadow-xs">
          BOOK NOW
        </button>
      </div>
    </div>
  `;
}

// Render Individual Provider Card (Matching Exact Layout from Screenshot & Figma)
function renderProviderCard(p) {
 let badgeHtml = '';

const verification = String(p.verification || '').toLowerCase();

if (verification === 'vvip') {

  badgeHtml = `
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
      text-xs font-black
      bg-gradient-to-r from-indigo-600 to-purple-700
      text-white shadow-md">

      <i data-lucide="award" class="w-4 h-4 text-amber-300"></i>

      <span>🏆 SAINO VVIP</span>

    </span>
  `;

} else if (verification === 'vip') {

  badgeHtml = `
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
      text-xs font-black
      bg-gradient-to-r from-amber-500 to-amber-600
      text-saino-gray-950 shadow-md">

      <i data-lucide="crown" class="w-4 h-4"></i>

      <span>👑 SAINO VIP</span>

    </span>
  `;

} else if (verification === 'pro') {

  badgeHtml = `
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
      text-xs font-black
      bg-saino-red text-white shadow-md">

      <i data-lucide="check-circle-2" class="w-4 h-4"></i>

      <span>✓ SAINO Pro</span>

    </span>
  `;

} else {

  // prime / listed / undefined
  // Everything else becomes the free Discovery badge.

  badgeHtml = `
    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
      text-xs font-black
      bg-saino-gray-800 text-white shadow-md">

      <i data-lucide="compass" class="w-4 h-4"></i>

      <span>🆓 SAINO Discovery</span>

    </span>
  `;
}
  const categoryObj = window.SAINO_DATA.categories.find(c => c.id === p.category);
  const categoryName = categoryObj ? categoryObj.name : p.category;

  const leadInitial = p.leadDoctor ? p.leadDoctor.replace('Dr. ', '').replace('Pharm. ', '').charAt(0) : 'D';

  return `
    <div class="provider-card bg-white rounded-3xl border border-saino-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div>
        <!-- Provider Photo / Header Cover with Top Badges -->
        <div class="relative h-48 sm:h-52 w-full bg-saino-gray-100 overflow-hidden">
          <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
          
          <!-- Top Badge & Category (Exact Match to User Screenshot) -->
          <div class="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
            <div>${badgeHtml}</div>
            <span class="px-3 py-1 rounded-xl text-xs font-bold bg-white text-saino-gray-800 shadow-md backdrop-blur-sm">
              ${categoryName}
            </span>
          </div>

          <!-- Bottom Title on Image with Location and Logo Thumbnail -->
          <div class="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between z-10">
            <div class="text-white max-w-[75%]">
              <h3 class="text-base sm:text-lg font-black leading-tight drop-shadow">${p.name}</h3>
              <p class="text-xs text-sky-200 flex items-center mt-1">
                <i data-lucide="map-pin" class="w-3.5 h-3.5 mr-1 text-sky-400 flex-shrink-0"></i>
                <span class="truncate">${p.location}</span>
              </p>
            </div>
            <!-- Provider Logo Thumbnail -->
            <div class="w-12 h-12 rounded-2xl bg-white p-1 shadow-lg flex-shrink-0 overflow-hidden border border-white">
              <img src="${p.logo}" alt="Logo" class="w-full h-full object-cover rounded-xl">
            </div>
          </div>
        </div>

        <!-- Provider Metrics & Details -->
        <div class="p-5 space-y-4">
          <!-- Rating & Engagement Stats Row -->
          <div class="flex items-center justify-between text-xs pb-3 border-b border-saino-gray-100">
            <div class="flex items-center space-x-1 text-amber-500 font-extrabold text-sm">
              <span>⭐</span>
              <span class="text-saino-gray-900">${p.rating}</span>
              <span class="text-saino-gray-400 font-medium text-xs">(${p.reviewsCount} Reviews)</span>
            </div>
            <div class="flex items-center space-x-3 text-xs">
              <span class="flex items-center space-x-1 text-saino-gray-600 font-semibold">
                <span class="text-saino-red">♥</span>
                <span>${(p.likesCount).toLocaleString()}</span>
              </span>
              <span class="flex items-center space-x-1 text-sky-700 font-semibold">
                <span class="text-sky-500">👥</span>
                <span>${p.interestedCount} Interested</span>
              </span>
            </div>
          </div>

          <!-- Lead Specialist / Doctor Card (Pill Container) -->
          ${p.leadDoctor ? `
            <div class="bg-saino-gray-50 p-3 rounded-2xl border border-saino-gray-100 flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0 font-extrabold text-sm">
                ${leadInitial}
              </div>
              <div class="text-xs truncate">
                <span class="font-extrabold text-saino-gray-900 block truncate text-xs sm:text-sm leading-snug">${p.leadDoctor}</span>
                <span class="text-[11px] text-saino-gray-500 truncate block mt-0.5">${p.leadDoctorRole}</span>
              </div>
            </div>
          ` : ''}

          <!-- Departments / Services Tags -->
          <div>
            <span class="text-xs font-bold text-saino-gray-500 block mb-2">Departments / Services:</span>
            <div class="flex flex-wrap gap-1.5">
              ${p.departments.slice(0, 3).map(dept => `
                <span class="px-3 py-1 bg-sky-50 text-sky-800 border border-sky-100 text-xs font-semibold rounded-xl">
                  ${dept}
                </span>
              `).join('')}
              ${p.departments.length > 3 ? `
                <span class="px-2 py-1 bg-saino-gray-100 text-saino-gray-500 text-xs font-bold rounded-xl">+${p.departments.length - 3} more</span>
              ` : ''}
            </div>
          </div>

          <!-- Opening Hours & Phone -->
          <div class="text-xs text-saino-gray-600 space-y-1.5 pt-1">
            <div class="flex items-center space-x-2">
              <i data-lucide="clock" class="w-4 h-4 text-saino-gray-400 flex-shrink-0"></i>
              <span class="truncate font-medium">${p.openingHours}</span>
            </div>
            ${p.showPhone ? `
              <div class="flex items-center space-x-2">
                <i data-lucide="phone" class="w-4 h-4 text-saino-gray-400 flex-shrink-0"></i>
                <span class="font-semibold text-saino-gray-800">${p.phone}</span>
              </div>
            ` : `
              <div class="flex items-center space-x-2 text-saino-gray-400 text-[11px]">
                <i data-lucide="shield-alert" class="w-4 h-4 flex-shrink-0"></i>
                <span>Direct Triage via SAINO WhatsApp</span>
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- Action Buttons & Large WhatsApp Booking CTA -->
      <div class="p-5 pt-0 space-y-3">
        <!-- Interactive Engagement Row (Like, Interested, View Profile) -->
        <div class="flex items-center justify-between text-xs py-2 border-t border-saino-gray-100">
          <button onclick="toggleLike('${p.id}')" class="flex items-center space-x-1 transition font-bold ${p.isLiked ? 'text-saino-red' : 'text-saino-gray-600 hover:text-saino-red'}">
            <span>${p.isLiked ? '❤️' : '♡'}</span>
            <span>${p.isLiked ? 'Liked' : 'Like'}</span>
          </button>

          <button onclick="toggleInterested('${p.id}')" class="flex items-center space-x-1 transition font-bold ${p.isInterested ? 'text-sky-600' : 'text-saino-gray-600 hover:text-sky-600'}">
            <span>${p.isInterested ? '★' : '☆'}</span>
            <span>${p.isInterested ? 'Interested' : 'Mark Interested'}</span>
          </button>

          <button onclick="openProviderModal('${p.id}')" class="text-[#0284c7] hover:text-sky-800 font-extrabold flex items-center space-x-0.5">
            <span>View Profile</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Prominent Green WhatsApp Appointment Button -->
        <button onclick="openBookingWhatsApp('${p.id}')" class="w-full py-3 px-4 rounded-2xl bg-[#059669] hover:bg-[#047857] text-white text-xs sm:text-sm font-black flex items-center justify-center space-x-2 transition shadow-md hover:shadow-lg">
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
        <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-saino-red/10 border border-saino-red/20 text-saino-red-dark text-xs font-bold mb-3 shadow-xs">
          <i data-lucide="tv" class="w-4 h-4 text-saino-red"></i>
          <span class="uppercase tracking-wider">BIG SCREEN HEALTHCARE SHOWCASE · NEPAL</span>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-saino-gray-900 tracking-tight leading-tight mb-3">
          Promotional Campaigns & Big Screen Displays
        </h1>
        <p class="text-sm sm:text-base text-saino-gray-600 max-w-3xl mx-auto leading-relaxed">
          Explore prominent healthcare awareness campaigns, super-speciality checkup drives, emergency bloodlines, and group health insurance schemes verified by SAINO HEALTH.
        </p>
      </div>

      <!-- Display Mode Selector & Controls -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-saino-gray-200 shadow-sm">
        <div class="flex items-center space-x-2 text-xs font-bold text-saino-gray-600">
          <i data-lucide="monitor" class="w-4 h-4 text-saino-red"></i>
          <span>Display Mode:</span>
          <div class="inline-flex rounded-xl p-1 bg-saino-gray-100 border border-saino-gray-200 text-xs">
            <button onclick="setBigScreenMode('billboard')" class="px-3 py-1 rounded-lg font-bold transition ${mode === 'billboard' ? 'bg-saino-gray-900 text-white shadow' : 'text-saino-gray-600 hover:text-saino-gray-900'}">
              Digital Billboard (16:9)
            </button>
            <button onclick="setBigScreenMode('spotlight')" class="px-3 py-1 rounded-lg font-bold transition ${mode === 'spotlight' ? 'bg-saino-red text-white shadow' : 'text-saino-gray-600 hover:text-saino-gray-900'}">
              Spotlight Card
            </button>
            <button onclick="setBigScreenMode('mobile')" class="px-3 py-1 rounded-lg font-bold transition ${mode === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-saino-gray-600 hover:text-saino-gray-900'}">
              App Takeover Screen
            </button>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <span class="text-xs text-saino-gray-500 font-medium hidden sm:inline">Auto-Sliding Active</span>
          <button onclick="prevBigScreenCampaign()" class="p-2 rounded-xl bg-saino-gray-100 hover:bg-saino-gray-200 text-saino-gray-700 transition" title="Previous Campaign">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
          </button>
          <span class="text-xs font-bold text-saino-gray-700 px-2">
            ${AppState.activeBigScreenIndex + 1} / ${campaigns.length}
          </span>
          <button onclick="nextBigScreenCampaign()" class="p-2 rounded-xl bg-saino-gray-100 hover:bg-saino-gray-200 text-saino-gray-700 transition" title="Next Campaign">
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
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-saino-red text-white shadow-sm">
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
                <span class="px-3 py-1 rounded-xl text-xs font-black bg-amber-400 text-saino-gray-950 shadow-md">
                  ★ ${currentCamp.discountBadge}
                </span>
                <span class="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/10 text-saino-gray-200 border border-white/20">
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
              <p class="text-xs sm:text-sm md:text-base text-saino-gray-200 leading-relaxed mb-6">
                ${currentCamp.subtitle}
              </p>

              <!-- Live KPI Stat Pills -->
              <div class="grid grid-cols-3 gap-3 mb-6 max-w-lg">
                ${currentCamp.stats.map(s => `
                  <div class="bg-black/40 backdrop-blur-md border border-white/15 p-2.5 rounded-xl text-center">
                    <span class="text-xs sm:text-sm font-black text-rose-400 block">${s.val}</span>
                    <span class="text-[10px] text-saino-gray-300 font-medium block truncate">${s.label}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Perks Checklist -->
              <ul class="space-y-1.5 text-xs text-saino-gray-100 mb-6">
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
          <h3 class="text-base md:text-lg font-bold text-saino-gray-900">Featured Mega Campaigns in Nepal</h3>
          <span class="text-xs text-saino-gray-500">Click any card to load on Big Screen</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          ${campaigns.map((camp, idx) => {
            const isActive = idx === AppState.activeBigScreenIndex;
            return `
              <div onclick="setBigScreenCampaign(${idx})" 
                class="p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive 
                    ? 'bg-saino-red/10 border-saino-red ring-2 ring-saino-red/20 shadow-md scale-[1.02]' 
                    : 'bg-white border-saino-gray-200 hover:border-saino-gray-300 shadow-xs'
                }">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${isActive ? 'bg-saino-red text-white' : 'bg-saino-gray-100 text-saino-gray-600'}">
                      ${camp.tag}
                    </span>
                    <span class="text-[11px] font-bold text-amber-600">${camp.discountBadge}</span>
                  </div>
                  <h4 class="text-xs font-bold text-saino-gray-900 leading-snug mb-1">${camp.title}</h4>
                  <p class="text-[11px] text-saino-gray-500 line-clamp-2 mb-3">${camp.subtitle}</p>
                </div>
                <div class="pt-2 border-t border-saino-gray-100 flex items-center justify-between text-[11px]">
                  <span class="font-semibold text-saino-gray-700 truncate">${camp.sponsor}</span>
                  <span class="text-saino-red font-bold flex-shrink-0">View Screen →</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- "Advertise on SAINO Big Screen" Promotion Portal (For Hospitals & Advertisers) -->
      <div class="p-6 md:p-10 rounded-3xl bg-gradient-to-r from-saino-gray-900 via-indigo-950 to-saino-gray-900 text-white shadow-xl relative overflow-hidden">
        <div class="relative z-10 max-w-3xl">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-saino-red text-white mb-3">
            FOR HEALTHCARE ADVERTISERS & HOSPITALS
          </span>
          <h3 class="text-xl md:text-3xl font-black mb-2">Launch Your Healthcare Campaign on SAINO Big Screen</h3>
          <p class="text-xs md:text-sm text-saino-gray-300 mb-6 leading-relaxed">
            Reach over 150,000+ monthly patients across Kathmandu Valley with premier billboard takeovers, category top pinning, and direct WhatsApp appointment leads.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10">
              <strong class="text-lg md:text-xl font-black text-rose-400 block">150,000+</strong>
              <span class="text-xs text-saino-gray-300">Monthly Patient Views</span>
            </div>
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10">
              <strong class="text-lg md:text-xl font-black text-emerald-400 block">450+ Leads</strong>
              <span class="text-xs text-saino-gray-300">Avg WhatsApp Inquiries / Mo</span>
            </div>
            <div class="p-3.5 rounded-xl bg-white/10 border border-white/10">
              <strong class="text-lg md:text-xl font-black text-amber-400 block">#1 Top Rank</strong>
              <span class="text-xs text-saino-gray-300">Category Search Priority</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button onclick="openCustomWhatsApp('Big Screen Campaign Booking', 'Hi SAINO Advertising Team, I would like to book a Big Screen Healthcare Campaign on SAINO Health.')" class="px-5 py-3 rounded-xl bg-saino-red hover:bg-saino-red-dark text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center space-x-2">
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
// 2. DISCOVERY VIEW (BOOKMYSHOW SCREEN CAROUSEL, GOOGLE MAP FORMAT, SAINO RATED MATRICES & BADGES)
// ==========================================
function renderDiscoveryView() {
  const campaigns = window.SAINO_DATA.bigScreenCampaigns || [];
  const currentSlide = campaigns[AppState.discoverySlideIndex] || campaigns[0];
  const ratedData = window.SAINO_DATA.sainoRated || {};
  const activeRatedList = ratedData[AppState.discoveryRatedTab] || ratedData.hospitals || [];
  const locations = window.SAINO_DATA.mapLocations || [];
  const activeLocation = locations.find(l => l.id === AppState.discoverySelectedLocation) || locations[0];
  const reviews = window.SAINO_DATA.talkOfTheTown || [];

  // 3 reviews window for carousel
  const revCount = reviews.length;
  const rIdx = AppState.discoveryReviewIndex % revCount;
  const visibleReviews = [
    reviews[rIdx],
    reviews[(rIdx + 1) % revCount],
    reviews[(rIdx + 2) % revCount]
  ];

  return `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
      
      <!-- Top Title & Navigation Quick Jump -->
      <div class="text-center mb-8 pt-2">
        <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-saino-red/10 border border-saino-red/20 text-saino-red-dark text-xs font-black mb-3 shadow-xs">
          <i data-lucide="compass" class="w-4 h-4 text-saino-red"></i>
          <span class="uppercase tracking-wider">HEALTHCARE DISCOVERY PORTAL · NEPAL</span>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-saino-gray-900 tracking-tight leading-tight mb-2">
          Discovery & Verified Healthcare Map
        </h1>
        <p class="text-xs sm:text-sm text-saino-gray-600 max-w-2xl mx-auto leading-relaxed">
          Explore BookMyShow-style hospital campaigns, interactive Nepal medical maps, SAINO Rated top providers, and verified badges.
        </p>
      </div>

      <!-- ========================================================================= -->
      <!-- 1. TOP SECTION: BOOKMYSHOW SCREEN PAGE / CINEMA CAROUSEL (< > & DOTS)     -->
      <!-- ========================================================================= -->
      <div class="relative bg-saino-gray-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-saino-gray-800 mb-14">
        
        <!-- Screen Marquee Header Bar -->
        <div class="px-6 py-3 bg-gradient-to-r from-saino-gray-900 via-saino-red/40 to-saino-gray-900 border-b border-white/10 flex items-center justify-between">
          <div class="flex items-center space-x-2 text-xs">
            <span class="w-2.5 h-2.5 rounded-full bg-saino-red animate-pulse"></span>
            <span class="font-extrabold uppercase tracking-widest text-rose-400">SAINO BIG SCREEN · BOOKMYSHOW FORMAT</span>
          </div>
          <div class="flex items-center space-x-2 text-xs text-saino-gray-400">
            <span>Slide <strong>${AppState.discoverySlideIndex + 1}</strong> of ${campaigns.length}</span>
          </div>
        </div>

        <!-- Carousel Slide Content -->
        <div class="relative min-h-[360px] md:min-h-[420px] p-6 sm:p-10 md:p-12 flex flex-col justify-between overflow-hidden">
          
          <!-- Background Banner with Dark Overlay -->
          <div class="absolute inset-0 z-0">
            <img src="${currentSlide.bannerImage}" alt="${currentSlide.title}" class="w-full h-full object-cover opacity-25 filter blur-[1px] transform scale-105 transition-all duration-700">
            <div class="absolute inset-0 bg-gradient-to-r from-saino-gray-950 via-saino-gray-950/90 to-saino-gray-900/70"></div>
          </div>

          <!-- Slide Content Layer -->
          <div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div class="lg:col-span-8 space-y-4">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-3 py-1 rounded-full bg-saino-red text-white text-[10px] font-black uppercase tracking-wider shadow">
                  ${currentSlide.tagline || 'PREMIER HEALTHCARE'}
                </span>
                <span class="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-rose-200 text-[10px] font-bold">
                  ${currentSlide.tag || currentSlide.sponsorTier}
                </span>
                ${currentSlide.discountBadge ? `
                  <span class="px-3 py-1 rounded-full bg-amber-400 text-saino-gray-950 text-[10px] font-black shadow">
                    ⭐ ${currentSlide.discountBadge}
                  </span>
                ` : ''}
              </div>

              <h2 class="text-xl sm:text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                ${currentSlide.title}
              </h2>

              <p class="text-xs sm:text-sm text-saino-gray-300 max-w-2xl leading-relaxed">
                ${currentSlide.subtitle}
              </p>

              <!-- Stats Pill Matrix -->
              <div class="grid grid-cols-3 gap-3 pt-2 max-w-lg">
                ${currentSlide.stats.map(st => `
                  <div class="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                    <span class="text-sm sm:text-base font-black text-rose-400 block">${st.val}</span>
                    <span class="text-[10px] text-saino-gray-400 block truncate">${st.label}</span>
                  </div>
                `).join('')}
              </div>

              <!-- Action CTAs -->
              <div class="pt-3 flex flex-wrap items-center gap-3">
                <button onclick="openCustomWhatsApp('${currentSlide.title}', '${currentSlide.whatsappMsg}')" class="px-6 py-3 bg-saino-red hover:bg-saino-red-dark text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-xl transition transform hover:scale-105 flex items-center space-x-2">
                  <i data-lucide="message-circle" class="w-4 h-4"></i>
                  <span>Direct WhatsApp Booking</span>
                </button>
                <button onclick="navigateTo('marketplace')" class="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-2xl text-xs transition">
                  Explore on Marketplace →
                </button>
                <span class="text-[11px] text-saino-gray-400 font-medium ml-1">
                  ⏱ ${currentSlide.validTill || 'Open Booking 2026'}
                </span>
              </div>
            </div>

            <!-- Sponsor Card on Right -->
            <div class="lg:col-span-4 hidden lg:block">
              <div class="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-2xl text-center space-y-3">
                <div class="w-20 h-20 rounded-2xl overflow-hidden mx-auto border-2 border-saino-red shadow-md">
                  <img src="${currentSlide.sponsorLogo}" class="w-full h-full object-cover">
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white leading-snug">${currentSlide.sponsor}</h4>
                  <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-saino-red/20 text-rose-300 border border-saino-red/30">
                    ${currentSlide.sponsorTier}
                  </span>
                </div>
                <div class="pt-2 border-t border-white/10 text-[11px] text-saino-gray-300">
                  <p class="leading-relaxed">Official medical campaign partner on SAINO HEALTH platform.</p>
                </div>
              </div>
            </div>

          </div>

          <!-- Carousel Controls: Left (<) & Right (>) Navigation Arrows -->
          <button onclick="prevDiscoverySlide()" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-11 h-11 rounded-full bg-saino-gray-900/80 hover:bg-saino-red text-white border border-white/20 flex items-center justify-center transition shadow-xl z-20" title="Previous Slide">
            <i data-lucide="chevron-left" class="w-6 h-6"></i>
          </button>
          <button onclick="nextDiscoverySlide()" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-11 h-11 rounded-full bg-saino-gray-900/80 hover:bg-saino-red text-white border border-white/20 flex items-center justify-center transition shadow-xl z-20" title="Next Slide">
            <i data-lucide="chevron-right" class="w-6 h-6"></i>
          </button>

          <!-- Carousel Dot Indicators (o o o o o o) -->
          <div class="relative z-10 flex items-center justify-center space-x-2 pt-6">
            ${campaigns.map((_, idx) => `
              <button onclick="setDiscoverySlide(${idx})" class="w-3 h-3 rounded-full transition-all duration-300 ${AppState.discoverySlideIndex === idx ? 'w-8 bg-saino-red' : 'bg-white/30 hover:bg-white/60'}" title="Go to slide ${idx + 1}"></button>
            `).join('')}
          </div>

        </div>
      </div>

      <!-- ========================================================================= -->
      <!-- 2. MIDDLE SECTION: TWO COLUMNS (GOOGLE MAP ON LEFT + SAINO RATED ON RIGHT) -->
      <!-- ========================================================================= -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 items-start">
        
        <!-- LEFT COLUMN: GOOGLE MAP FORMAT ("Google map kind of.") -->
        <div class="lg:col-span-5 bg-white rounded-3xl border border-saino-gray-200 shadow-sm p-5 sm:p-6 space-y-4 sticky top-24">
          
          <div class="flex items-center justify-between pb-3 border-b border-saino-gray-100">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 rounded-xl bg-saino-red/10 text-saino-red flex items-center justify-center">
                <i data-lucide="map-pin" class="w-4 h-4"></i>
              </div>
              <div>
                <h3 class="text-sm font-extrabold text-saino-gray-900">Healthcare Map View</h3>
                <p class="text-[11px] text-saino-gray-500">Google Map Format · Nepal Medical Corridors</p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-saino-gray-100 text-saino-gray-700 text-[10px] font-bold">
              6 Active Hubs
            </span>
          </div>

          <!-- Interactive Simulated Map Canvas -->
          <div class="relative w-full h-64 sm:h-72 rounded-2xl bg-gradient-to-br from-saino-gray-100 via-sky-50 to-saino-gray-200 border border-saino-gray-300 overflow-hidden shadow-inner flex items-center justify-center">
            
            <!-- Map Grid Texture -->
            <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            <!-- River / Geography Graphic Paths -->
            <svg class="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 400 300">
              <path d="M 10 180 Q 120 140 220 190 T 390 120" fill="none" stroke="#38bdf8" stroke-width="8" stroke-linecap="round"/>
              <path d="M 80 20 Q 150 100 240 70 T 360 260" fill="none" stroke="#cbd5e1" stroke-width="4" stroke-dasharray="6,6"/>
            </svg>

            <!-- Map Location Pins -->
            ${locations.map((loc, i) => {
              const isSelected = loc.id === activeLocation.id;
              // Map coordinate positions on SVG canvas
              const pos = [
                { top: '35%', left: '42%' }, // Kathmandu
                { top: '52%', left: '48%' }, // Lalitpur
                { top: '42%', left: '68%' }, // Bhaktapur
                { top: '28%', left: '22%' }, // Pokhara
                { top: '65%', left: '30%' }, // Chitwan
                { top: '75%', left: '78%' }  // Biratnagar
              ][i] || { top: '50%', left: '50%' };

              return `
                <div onclick="setDiscoveryLocation('${loc.id}')" 
                  style="top: ${pos.top}; left: ${pos.left};" 
                  class="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10">
                  
                  <div class="relative flex flex-col items-center">
                    ${isSelected ? `
                      <span class="w-8 h-8 rounded-full bg-saino-red/30 animate-ping absolute -top-1"></span>
                    ` : ''}
                    <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-saino-red text-white ring-4 ring-saino-red/20' : 'bg-saino-gray-900 text-white hover:bg-saino-red'} flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-110">
                      <i data-lucide="hospital" class="w-4 h-4"></i>
                    </div>
                    <span class="mt-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold whitespace-nowrap shadow-sm border ${isSelected ? 'bg-saino-red text-white border-saino-red-dark' : 'bg-white text-saino-gray-800 border-saino-gray-200'}">
                      ${loc.city}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}

            <!-- Map Zoom & Center Indicator -->
            <div class="absolute bottom-2.5 right-2.5 bg-white/90 backdrop-blur-md rounded-xl px-2.5 py-1 text-[10px] font-bold text-saino-gray-700 border border-saino-gray-200 shadow-sm">
              📍 Kathmandu Valley & Provinces
            </div>
          </div>

          <!-- Active Location Detail Card -->
          <div class="p-4 rounded-2xl bg-saino-red/5 border border-saino-red/20 space-y-2">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-[10px] font-black uppercase text-saino-red-dark tracking-wider">SELECTED MEDICAL CLUSTER</span>
                <h4 class="text-sm font-bold text-saino-gray-900">${activeLocation.name}</h4>
                <p class="text-[11px] text-saino-gray-600">${activeLocation.address}</p>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] font-extrabold bg-saino-red text-white">Active</span>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <div class="p-2 rounded-xl bg-white border border-saino-red/10 text-center">
                <strong class="text-sm font-black text-saino-gray-900 block">${activeLocation.hospitalCount}</strong>
                <span class="text-[10px] text-saino-gray-500">Verified Hospitals</span>
              </div>
              <div class="p-2 rounded-xl bg-white border border-saino-red/10 text-center">
                <strong class="text-sm font-black text-saino-gray-900 block">${activeLocation.clinicCount}</strong>
                <span class="text-[10px] text-saino-gray-500">Specialist Clinics</span>
              </div>
            </div>

            <div class="pt-1 text-[11px] text-saino-gray-600">
              <strong class="text-saino-gray-800">Featured in Hub:</strong> ${activeLocation.featured}
            </div>

            <button onclick="navigateTo('marketplace', { location: '${activeLocation.city}' })" class="w-full py-2 bg-saino-gray-900 hover:bg-saino-gray-800 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-sm">
              <i data-lucide="compass" class="w-3.5 h-3.5 text-rose-400"></i>
              <span>View All ${activeLocation.city} Providers →</span>
            </button>
          </div>

          <!-- Location Selector Directory List -->
          <div class="space-y-1.5 pt-1">
            <span class="text-[10px] font-black uppercase text-saino-gray-400 tracking-wider block mb-1">ALL NEPAL MEDICAL HUBS</span>
            <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              ${locations.map(loc => `
                <div onclick="setDiscoveryLocation('${loc.id}')" class="p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${loc.id === activeLocation.id ? 'border-saino-red bg-saino-red/10 font-bold text-saino-red-dark' : 'border-saino-gray-100 bg-saino-gray-50 hover:bg-saino-gray-100 text-saino-gray-700'}">
                  <div class="flex items-center space-x-2">
                    <i data-lucide="map-pin" class="w-3.5 h-3.5 ${loc.id === activeLocation.id ? 'text-saino-red' : 'text-saino-gray-400'}"></i>
                    <span>${loc.city} (${loc.hospitalCount} Hosp, ${loc.clinicCount} Clin)</span>
                  </div>
                  <span class="text-[10px] text-saino-red font-bold">Select</span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- RIGHT COLUMN: SAINO RATED MATRICES (Hospital 10, Clinic 10, Diag 5, Ambulance 5, Labs 5, Blood 5) -->
        <div class="lg:col-span-7 bg-white rounded-3xl border border-saino-gray-200 shadow-sm p-5 sm:p-6 space-y-5">
          
          <div>
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center space-x-2">
                <span class="px-2.5 py-0.5 rounded-full bg-saino-red text-white text-[10px] font-black uppercase tracking-wider">
                  SAINO RATED
                </span>
                <h3 class="text-base sm:text-lg font-black text-saino-gray-900">Top Rated Healthcare Services</h3>
              </div>
              <span class="text-xs text-saino-gray-400 font-medium">Ranked by Patient Reviews</span>
            </div>
            <p class="text-xs text-saino-gray-500">
              Validated healthcare establishments in Nepal categorized by speciality and accreditation.
            </p>
          </div>

          <!-- Category Navigation Pills (Hospital 10, Clinic 10, Diag 5, Ambulance 5, Labs 5, Blood 5) -->
          <div class="flex flex-wrap gap-2 pb-2 border-b border-saino-gray-100 text-xs">
            ${[
              { key: 'hospitals', label: 'Hospital 10', icon: 'building-2', count: 10 },
              { key: 'clinics', label: 'Clinic 10', icon: 'stethoscope', count: 10 },
              { key: 'diagnostics', label: 'Diag 5', icon: 'microscope', count: 5 },
              { key: 'ambulances', label: 'Ambulance 5', icon: 'truck', count: 5 },
              { key: 'labs', label: 'Labs 5', icon: 'flask-conical', count: 5 },
              { key: 'bloodBanks', label: 'Blood 5', icon: 'droplet', count: 5 }
            ].map(tab => {
              const isActive = AppState.discoveryRatedTab === tab.key;
              return `
                <button onclick="setDiscoveryRatedTab('${tab.key}')" class="px-3 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                  isActive 
                    ? 'bg-saino-red text-white shadow-md' 
                    : 'bg-saino-gray-100 hover:bg-saino-gray-200 text-saino-gray-700'
                }">
                  <i data-lucide="${tab.icon}" class="w-3.5 h-3.5"></i>
                  <span>${tab.label}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- List of Rated Providers for Selected Tab -->
          <div class="space-y-3.5 max-h-[620px] overflow-y-auto pr-1">
            ${activeRatedList.map((item, idx) => `
              <div class="p-4 rounded-2xl border border-saino-gray-200 bg-white hover:border-saino-red hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div class="flex items-start space-x-3.5">
                  <div class="w-10 h-10 rounded-xl bg-saino-gray-900 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                    #${idx + 1}
                  </div>
                  <div>
                    <div class="flex flex-wrap items-center gap-1.5 mb-1">
                      <h4 class="text-xs sm:text-sm font-bold text-saino-gray-900 leading-tight">${item.name}</h4>
                      <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                         item.badgeType === 'saino discovery' ? 'bg-indigo-100 text-indigo-800' :
                        item.badgeType === 'vvip' ? 'bg-indigo-100 text-indigo-800' :
                        item.badgeType === 'vip' ? 'bg-amber-100 text-amber-900' :
                        item.badgeType === 'pro' ? 'bg-saino-red/10 text-saino-red-dark' :
                        'bg-saino-gray-100 text-saino-gray-600'
                      }">
                        ${item.badge}
                      </span>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-[11px] text-saino-gray-500">
                      <span class="flex items-center text-amber-500 font-bold">
                        ★ ${item.rating} <span class="text-saino-gray-400 font-normal ml-0.5">(${item.reviews} reviews)</span>
                      </span>
                      <span>•</span>
                      <span>📍 ${item.area}</span>
                    </div>

                    <p class="text-[11px] text-saino-gray-600 mt-1 leading-snug">
                      <strong class="text-saino-gray-800">Speciality:</strong> ${item.special}
                    </p>

                    <div class="flex items-center space-x-3 text-[10px] text-saino-gray-500 mt-1">
                      <span>🕒 ${item.opd}</span>
                      <span>•</span>
                      <span class="text-saino-red-dark font-bold">${item.fee}</span>
                    </div>
                  </div>
                </div>

                <!-- Right Action Button -->
                <div class="flex-shrink-0 sm:self-center">
                  <button onclick="openCustomWhatsApp('${item.name}', 'Hello, I want to book an appointment with ${item.name} via SAINO Rated Directory.')" class="w-full sm:w-auto px-4 py-2 bg-saino-red hover:bg-saino-red-dark text-white font-extrabold rounded-xl text-xs transition shadow-sm flex items-center justify-center space-x-1.5">
                    <i data-lucide="message-circle" class="w-3.5 h-3.5"></i>
                    <span>Book on WhatsApp</span>
                  </button>
                </div>

              </div>
            `).join('')}
          </div>

        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 3. LOWER SECTION: WHY VERIFICATION BADGES MATTER (EXACT SPECIFICATION)    -->
      <!-- ========================================================================= -->
      <div class="p-6 md:p-10 bg-white rounded-3xl border border-saino-gray-200 shadow-sm mb-14">
        
        <div class="text-center max-w-3xl mx-auto mb-10">
          <h2 class="text-xl sm:text-3xl font-extrabold text-saino-gray-900 tracking-tight mb-2">
            Why Verification Badges Matter for Healthcare
          </h2>
          <p class="text-xs sm:text-sm text-saino-gray-600 leading-relaxed">
            Because healthcare is sensitive, SAINO validates government registrations, medical operating licenses, and doctor qualifications before granting badges.
          </p>
        </div>

        <!-- 4 Badges Cards (Free, Pro Badge, VIP Badge, VVIP Advantage) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <!-- Card 1: FREE - Saino Listed -->
          <div class="p-5 rounded-2xl bg-saino-gray-50/80 border border-saino-gray-200 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-saino-gray-200 text-saino-gray-700 uppercase tracking-wider mb-3">
                free
              </span>
              <h3 class="text-sm font-bold text-saino-gray-900 mb-2">saino discovery</h3>
              <p class="text-xs text-saino-gray-600 leading-relaxed">
                Basic directory entry. Free for all legal healthcare providers in Nepal. WhatsApp inquiries routed via manual triage.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-saino-gray-200/60">
              <span class="text-[11px] font-bold text-saino-gray-500">NPR 0 · Free Forever</span>
            </div>
          </div>

          <!-- Card 2: PRO BADGE - ✓ SAINO Pro -->
          <div class="p-5 rounded-2xl bg-saino-red/10 border border-saino-red/20 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-saino-red text-white uppercase tracking-wider mb-3">
                PRO BADGE
              </span>
              <h3 class="text-sm font-bold text-saino-gray-900 mb-2">✓ SAINO Pro</h3>
              <p class="text-xs text-saino-gray-600 leading-relaxed">
                For specialist doctors & clinics. Includes rating stars, review replies, 5 service packages, and direct WhatsApp dispatch.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-saino-red/20">
              <span class="text-[11px] font-bold text-saino-red-dark">NPR 3,600 / month</span>
            </div>
          </div>

          <!-- Card 3: VIP BADGE - 👑 SAINO VIP -->
          <div class="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-saino-gray-950 uppercase tracking-wider mb-3">
                VIP BADGE
              </span>
              <h3 class="text-sm font-bold text-saino-gray-900 mb-2">👑 SAINO VIP</h3>
              <p class="text-xs text-saino-gray-600 leading-relaxed">
                For polyclinics & mid-size hospitals. 15 service packages, intelligent appointment management, and 1 monthly Big Screen campaign.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-amber-200/60">
              <span class="text-[11px] font-bold text-amber-800">NPR 5,900 / month</span>
            </div>
          </div>

          <!-- Card 4: VVIP ADVANTAGE - 🏆 SAINO VVIP -->
          <div class="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-200 flex flex-col justify-between hover:shadow-md transition">
            <div>
              <span class="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white uppercase tracking-wider mb-3">
                VVIP ADVANTAGE
              </span>
              <h3 class="text-sm font-bold text-saino-gray-900 mb-2">🏆 SAINO VVIP</h3>
              <p class="text-xs text-saino-gray-600 leading-relaxed">
                Flagship presence for multispeciality hospital enterprises. Includes SEO growth, local optimization, and 2 monthly billboard campaigns.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-indigo-200/60">
              <span class="text-[11px] font-bold text-indigo-800">NPR 9,999 / month</span>
            </div>
          </div>

        </div>

      </div>

      <!-- ========================================================================= -->
      <!-- 4. REVIEWS SECTION: PATIENT REVIEWS SLIDER (Review < >)                  -->
      <!-- ========================================================================= -->
      <div class="bg-gradient-to-br from-saino-gray-900 via-saino-gray-950 to-saino-gray-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl mb-12">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <span class="px-2.5 py-0.5 rounded-full bg-saino-red text-white text-[10px] font-black uppercase tracking-wider">
              PATIENT EXPERIENCES
            </span>
            <h3 class="text-xl sm:text-3xl font-extrabold mt-2">What Patients Say About Healthcare Providers</h3>
            <p class="text-xs text-saino-gray-300 mt-1">Real stories and hospital feedback from verified patients in Nepal.</p>
          </div>

          <!-- Carousel Controls: Prev (<) and Next (>) Arrows -->
          <div class="flex items-center space-x-2">
            <button onclick="prevDiscoveryReview()" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-saino-red text-white flex items-center justify-center transition border border-white/10" title="Previous Reviews">
              <i data-lucide="chevron-left" class="w-5 h-5"></i>
            </button>
            <button onclick="nextDiscoveryReview()" class="w-10 h-10 rounded-xl bg-white/10 hover:bg-saino-red text-white flex items-center justify-center transition border border-white/10" title="Next Reviews">
              <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${visibleReviews.map(rev => `
            <div class="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between hover:border-white/20 transition">
              <div>
                <div class="flex items-center space-x-2 text-rose-400 text-xs font-bold mb-2">
                  <i data-lucide="${rev.icon}" class="w-4 h-4"></i>
                  <span>${rev.tag}</span>
                </div>
                <h4 class="text-sm font-bold text-white mb-2 leading-snug">"${rev.title}"</h4>
                <p class="text-xs text-saino-gray-300 leading-relaxed mb-4">"${rev.body}"</p>
              </div>
              <div class="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <div>
                  <strong class="text-white block">${rev.author}</strong>
                  <span class="text-[11px] text-saino-gray-400">${rev.role}</span>
                </div>
                <span class="text-[11px] font-semibold text-rose-300">${rev.provider}</span>
              </div>
            </div>
          `).join('')}
        </div>

      </div>

    </div>
  `;
}

function prevDiscoverySlide() {
  const campaigns = window.SAINO_DATA.bigScreenCampaigns || [];
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex - 1 + campaigns.length) % campaigns.length;
  renderApp();
}

function nextDiscoverySlide() {
  const campaigns = window.SAINO_DATA.bigScreenCampaigns || [];
  AppState.discoverySlideIndex = (AppState.discoverySlideIndex + 1) % campaigns.length;
  renderApp();
}

function setDiscoverySlide(idx) {
  AppState.discoverySlideIndex = idx;
  renderApp();
}

function setDiscoveryRatedTab(tabKey) {
  AppState.discoveryRatedTab = tabKey;
  renderApp();
}

function setDiscoveryLocation(locId) {
  AppState.discoverySelectedLocation = locId;
  renderApp();
}

function prevDiscoveryReview() {
  const reviews = window.SAINO_DATA.talkOfTheTown || [];
  AppState.discoveryReviewIndex = (AppState.discoveryReviewIndex - 1 + reviews.length) % reviews.length;
  renderApp();
}

function nextDiscoveryReview() {
  const reviews = window.SAINO_DATA.talkOfTheTown || [];
  AppState.discoveryReviewIndex = (AppState.discoveryReviewIndex + 1) % reviews.length;
  renderApp();
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
        <div class="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-saino-red/10 border border-saino-red/20 text-saino-red-dark text-xs font-bold mb-3 shadow-xs">
          <i data-lucide="plus-circle" class="w-4 h-4 text-saino-red"></i>
          <span class="uppercase tracking-wider">LIST YOUR BUSINESS & HEALTHCARE SERVICES</span>
        </div>
        <h1 class="text-2xl sm:text-4xl md:text-5xl font-black text-saino-gray-900 tracking-tight leading-tight mb-3">
          Built to Host Every Part of Your Healthcare Ecosystem
        </h1>
        <p class="text-sm sm:text-base text-saino-gray-600 max-w-3xl mx-auto leading-relaxed">
          After successful collaboration with Healthcare Organizations, we are equipped to bring and connect the healthcare experience better via SAINO.
        </p>
      </div>

      <!-- WHAT CAN YOU LIST? 9 CATEGORY ILLUSION CARDS (Page 1 Spec) -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base md:text-lg font-bold text-saino-gray-900">What Can You List on SAINO HEALTH?</h3>
          <span class="text-xs text-saino-red font-bold">9 Healthcare Categories</span>
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
            <div class="p-5 rounded-2xl bg-white border border-saino-gray-200 shadow-xs hover:shadow-md hover:border-saino-red/30 transition flex items-start space-x-3.5">
              <div class="w-10 h-10 rounded-xl bg-saino-red/10 text-saino-red flex items-center justify-center flex-shrink-0 mt-0.5 border border-saino-red/20">
                <i data-lucide="${c.icon}" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="text-xs sm:text-sm font-bold text-saino-gray-900 leading-tight">${c.title}</h4>
                <p class="text-[11px] text-saino-gray-500 mt-0.5 leading-snug">${c.sub}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- WHAT ARE THE SERVICES WE OFFER: VISUAL REPRESENTATION (Page 1 & 2 Spec) -->
      <div class="p-6 md:p-8 bg-gradient-to-r from-saino-gray-900 via-saino-gray-950 to-saino-gray-900 text-white rounded-3xl shadow-xl mb-12">
        <div class="max-w-3xl mb-6">
          <span class="px-2.5 py-0.5 rounded-full bg-saino-red text-white text-[10px] font-black uppercase tracking-wider">
            SERVICES WE OFFER
          </span>
          <h3 class="text-xl md:text-3xl font-extrabold mt-2 mb-2">Comprehensive Healthcare Technology Suite</h3>
          <p class="text-xs md:text-sm text-saino-gray-300 leading-relaxed">
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
              <i data-lucide="${s.icon}" class="w-4 h-4 text-saino-red flex-shrink-0"></i>
              <span class="font-semibold text-saino-gray-100 text-[11px] leading-tight">${s.title}</span>
              ${s.comingSoon ? `<span class="px-1.5 py-0.2 rounded text-[9px] bg-amber-400 text-saino-gray-950 font-black">Soon</span>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- INTERACTIVE TWO-COLUMN ONBOARDING PORTAL (Page 2 Specification) -->
      <div class="bg-white rounded-3xl border border-saino-gray-200 shadow-sm overflow-hidden mb-12 grid grid-cols-1 lg:grid-cols-12">
        
        <!-- Left Side: SAINO Logo & Do It Yourself Sign-In / Register Form -->
        <div class="lg:col-span-5 p-6 sm:p-8 bg-saino-gray-50 border-r border-saino-gray-200 flex flex-col justify-between">
          <div>
            <div class="mb-6">
              <img src="assets/logo.png" alt="SAINO HEALTH" class="h-16 w-auto object-contain">
              <h3 class="text-base font-extrabold text-saino-gray-900 mt-4">Do it yourself</h3>
              <p class="text-xs text-saino-gray-500">Sign in or register your healthcare business</p>
            </div>

            <form onsubmit="handleListYourCareSubmit(event)" class="space-y-3.5 text-xs">
              <div>
                <label class="block font-bold text-saino-gray-700 mb-1">Email ID</label>
                <input type="email" id="lycEmail" required placeholder="admin@careclinic.np" class="w-full bg-white border border-saino-gray-300 rounded-xl p-3 text-saino-gray-800 focus:ring-2 focus:ring-saino-red focus:outline-none">
              </div>
              <div>
                <label class="block font-bold text-saino-gray-700 mb-1">Password</label>
                <input type="password" id="lycPassword" required placeholder="••••••••" class="w-full bg-white border border-saino-gray-300 rounded-xl p-3 text-saino-gray-800 focus:ring-2 focus:ring-saino-red focus:outline-none">
              </div>
              <button type="submit" class="w-full py-3 bg-saino-red hover:bg-saino-red-dark text-white font-extrabold rounded-xl transition shadow-md">
                Proceed to Register / Manage
              </button>
              <div class="flex items-center justify-between text-[11px] pt-1">
                <a href="#" onclick="showToast('Password reset link dispatched to email!')" class="text-saino-red hover:underline font-semibold">Forgot Password</a>
                <a href="#" onclick="showToast('OTP sent to verified business mobile!')" class="text-saino-gray-600 hover:underline font-semibold">Log in with OTP</a>
              </div>
            </form>
          </div>

          <div class="mt-8 pt-6 border-t border-saino-gray-200 text-saino-gray-500 text-[11px]">
            <p class="font-bold text-saino-gray-700">Didn't Have an Account? <a href="#tierComparisonSection" class="text-saino-red hover:underline font-black">Sign up below</a></p>
            <p class="mt-1">In case of any query, please write to: <a href="mailto:support@sainotechventures.com" class="text-saino-red font-bold underline">support@sainotechventures.com</a></p>
          </div>
        </div>

        <!-- Right Side: Visual Feature Pillars (Page 2 Specification) -->
        <div class="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            <span class="text-xs font-black uppercase text-saino-red tracking-wider">SUPERFAST ONBOARDING</span>
            <h3 class="text-xl font-bold text-saino-gray-900 mt-1 mb-6">Why Healthcare Providers Choose SAINO</h3>

            <div class="space-y-4">
              <div class="p-4 rounded-2xl bg-saino-red/5 border border-saino-red/10 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-saino-red text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="file-check" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-saino-gray-900 leading-tight">Complete your registration with Company ID and PAN Details.</h4>
                  <p class="text-[11px] text-saino-gray-500 mt-0.5">Seamless compliance and legal entity verification across Nepal.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-amber-500 text-saino-gray-950 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="zap" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-saino-gray-900 leading-tight">Take your listing and badge superfast.</h4>
                  <p class="text-[11px] text-saino-gray-500 mt-0.5">Instant marketplace directory publication and SEO indexing.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="message-square" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-saino-gray-900 leading-tight">Manage Reviews, Campaigns & Appointment Booking Superfast.</h4>
                  <p class="text-[11px] text-saino-gray-500 mt-0.5">Direct WhatsApp appointment routing with zero patient friction.</p>
                </div>
              </div>

              <div class="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start space-x-3.5">
                <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <i data-lucide="trending-up" class="w-4 h-4"></i>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-saino-gray-900 leading-tight">Monitor Insights and Analytics easily.</h4>
                  <p class="text-[11px] text-saino-gray-500 mt-0.5">Live tracking of patient views, click-to-book ratios, and reach.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- 4-TIER SUBSCRIPTION PRICING PLANS (Page 3 - 7 Official Specification) -->
      <div id="tierComparisonSection" class="mb-14">
        <div class="text-center mb-8">
          <span class="px-3 py-1 rounded-full text-xs font-black bg-saino-red/10 text-saino-red-dark uppercase tracking-wider">
            SUBSCRIPTION TIERS & VERIFIED BADGES
          </span>
          <h2 class="text-xl md:text-3xl font-extrabold text-saino-gray-900 mt-2 mb-2">Choose the Right Growth Plan for Your Facility</h2>
          <p class="text-xs md:text-sm text-saino-gray-500">From free directory listings to flagship enterprise growth packages</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          ${window.SAINO_DATA.subscriptionTiers.map(plan => `
            <div class="rounded-3xl border ${plan.highlight ? 'border-2 border-saino-red shadow-xl bg-saino-red/10 ring-4 ring-saino-red/10' : 'border-saino-gray-200 bg-white shadow-sm'} p-5 sm:p-6 flex flex-col justify-between relative">
              ${plan.popularTag ? `
                <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-0.5 bg-saino-red text-white text-[9px] font-black uppercase tracking-wider rounded-full shadow">
                  ${plan.popularTag}
                </div>
              ` : ''}

              <div>
                <div class="mb-4">
                  <span class="text-xs font-black text-saino-red-dark uppercase tracking-wider">${plan.name}</span>
                  <div class="text-xl sm:text-2xl font-black text-saino-gray-900 mt-1">${plan.price}</div>
                  <span class="text-[11px] text-saino-gray-400 font-medium">${plan.period}</span>
                </div>

                <ul class="space-y-2 mb-6 text-xs text-saino-gray-700">
                  ${plan.features.map(f => `
                    <li class="flex items-start space-x-2">
                      <i data-lucide="check" class="w-3.5 h-3.5 text-saino-red flex-shrink-0 mt-0.5"></i>
                      <span class="leading-snug">${f}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>

              <button onclick="openUpgradeBadgeModal('${plan.id}')" class="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition ${
                plan.highlight 
                  ? 'bg-saino-red hover:bg-saino-red-dark text-white shadow-md' 
                  : 'bg-saino-gray-900 hover:bg-saino-gray-800 text-white'
              }">
                ${plan.cta}
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- DOCUMENT UPLOAD & COMPLIANCE GUIDE FOR PAID BADGES (Page 3 & 4 Specification) -->
      <div class="bg-white rounded-3xl border border-saino-gray-200 p-6 md:p-8 shadow-sm mb-12">
        <div class="mb-6 pb-4 border-b border-saino-gray-100">
          <div class="flex items-center space-x-2 text-saino-red text-xs font-bold uppercase mb-1">
            <i data-lucide="shield-alert" class="w-4 h-4"></i>
            <span>COMPLIANCE & VERIFICATION STANDARDS</span>
          </div>
          <h3 class="text-lg md:text-xl font-bold text-saino-gray-900">Required Verification Documents for Paid Badges</h3>
          <p class="text-xs text-saino-gray-500 mt-0.5">All documents must be crisp 200 DPI scans (PDF, JPEG, or PNG up to 5MB with 4 outer corners visible).</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <!-- Hospital & Clinic -->
          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">
            <h4 class="font-bold text-saino-gray-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="building-2" class="w-4 h-4 text-saino-red"></i>
              <span>Hospital & Clinic</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-saino-gray-600">
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
          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">
            <h4 class="font-bold text-saino-gray-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="microscope" class="w-4 h-4 text-saino-red"></i>
              <span>Diagnostic & Labs</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-saino-gray-600">
              <li>• Lab Accreditation Certificate</li>
              <li>• PNDT Act Registration</li>
              <li>• AERB / Radiation Safety Approval</li>
              <li>• Signatory Doctor Qualifications</li>
            </ul>
          </div>

          <!-- Blood Banks -->
          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">
            <h4 class="font-bold text-saino-gray-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="droplet" class="w-4 h-4 text-saino-red"></i>
              <span>Blood Banks</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-saino-gray-600">
              <li>• Drug & Component License</li>
              <li>• Medical Officer Credentials</li>
              <li>• Equipment Calibration Logs</li>
            </ul>
          </div>

          <!-- Homecare Centres -->
          <div class="p-4 rounded-2xl bg-saino-gray-50 border border-saino-gray-200">
            <h4 class="font-bold text-saino-gray-900 mb-2 flex items-center space-x-1.5 text-xs">
              <i data-lucide="home" class="w-4 h-4 text-saino-red"></i>
              <span>Homecare Centres</span>
            </h4>
            <ul class="space-y-1 text-[11px] text-saino-gray-600">
              <li>• Nursing Agency/Trade License</li>
              <li>• Staff Background Clearances</li>
              <li>• Staff Medical Certifications</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- INTERACTIVE FACILITY REGISTRATION FORM (Pages 3 & 4 Specification) -->
      <div class="bg-gradient-to-br from-saino-gray-900 via-saino-red-dark to-saino-gray-950 text-white rounded-3xl p-6 sm:p-10 shadow-2xl">
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
              <label class="block font-bold text-saino-gray-200 mb-1">Organisation Name</label>
              <input type="text" id="regOrgName" required placeholder="e.g. Kathmandu City Care Hospital" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-saino-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-saino-gray-200 mb-1">Organisation Address / Location</label>
              <input type="text" id="regOrgAddress" required placeholder="e.g. Lazimpat, Kathmandu" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-saino-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-bold text-saino-gray-200 mb-1">Company Registration No.</label>
              <input type="text" id="regOrgRegNo" required placeholder="e.g. REG-784920/081" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-saino-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-saino-gray-200 mb-1">Organisation VAT / PAN No.</label>
              <input type="text" id="regOrgPan" required placeholder="e.g. 601928471" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-saino-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label class="block font-bold text-saino-gray-200 mb-1">Contact Person Full Name</label>
              <input type="text" id="regContactName" required placeholder="Dr. Ramesh Sharma" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-saino-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-saino-gray-200 mb-1">Mobile Number</label>
              <input type="tel" id="regMobile" required placeholder="9801234567" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-saino-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
            <div>
              <label class="block font-bold text-saino-gray-200 mb-1">Official Email Address</label>
              <input type="email" id="regEmail" required placeholder="contact@hospital.np" class="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-saino-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400">
            </div>
          </div>

          <div>
            <label class="block font-bold text-saino-gray-200 mb-1">Choose Verification Plan</label>
            <select id="regPlanSelect" class="w-full bg-saino-gray-900 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-rose-400">
              <option value="listed">SAINO LISTED (Free Listing - NPR 0)</option>
              <option value="pro" selected>SAINO PRO (✓ Pro Verified - NPR 3,600 / month)</option>
              <option value="vip">SAINO VIP (👑 VIP Verified - NPR 5,900 / month)</option>
              <option value="vvip">SAINO HEALTH VVIP (🏆 Flagship Growth - NPR 9,999 / month)</option>
            </select>
          </div>

          <div class="pt-2 flex flex-wrap items-center gap-4">
            <button type="submit" class="px-6 py-3.5 bg-white hover:bg-rose-50 text-saino-gray-950 font-black rounded-2xl shadow-xl transition transform hover:scale-105 text-xs sm:text-sm">
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
      <div class="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-saino-gray-900 text-white mb-10 shadow-xl relative overflow-hidden">
        <div class="relative z-10 max-w-2xl">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-saino-gray-950 uppercase tracking-wider">
            SAINO BOOST & HEALTHCARE CAMPAIGNS
          </span>
          <h1 class="text-2xl md:text-4xl font-extrabold mt-3 mb-3">
            Accelerate Patient Reach with Precision Healthcare Advertising
          </h1>
          <p class="text-xs md:text-sm text-purple-100 leading-relaxed mb-6">
            Showcase your hospital departments, special diagnostic packages, or insurance schemes to targeted patients actively searching for care in your district.
          </p>
          <div class="flex flex-wrap items-center gap-3">
            <button onclick="openAdCampaignModal()" class="px-5 py-2.5 bg-white text-saino-gray-900 font-bold rounded-xl text-xs md:text-sm hover:bg-saino-gray-100 transition shadow">
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
        <div class="bg-white p-6 rounded-2xl border border-saino-gray-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
            <i data-lucide="trending-up" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-saino-gray-900 mb-2">Category Search Pinning</h3>
          <p class="text-xs text-saino-gray-600 leading-relaxed">
            Appear at the #1 position when patients search for specific specialities like "Cardiologist in Kathmandu" or "24/7 Ambulance".
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-saino-gray-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
            <i data-lucide="layers" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-saino-gray-900 mb-2">Home Banner Showcase</h3>
          <p class="text-xs text-saino-gray-600 leading-relaxed">
            Interactive top carousel placement with 8 rotating sponsored slots linking straight to your WhatsApp triage booking team.
          </p>
        </div>

        <div class="bg-white p-6 rounded-2xl border border-saino-gray-200 shadow-sm">
          <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
          </div>
          <h3 class="text-base font-bold text-saino-gray-900 mb-2">Transparent ROI Analytics</h3>
          <p class="text-xs text-saino-gray-600 leading-relaxed">
            Real-time measurement of patient card impressions, WhatsApp appointment initiates, profile clicks, and phone leads.
          </p>
        </div>
      </div>

      <!-- Advertising FAQ Section (Page 4 Requirement) -->
      <div class="bg-white p-6 md:p-8 rounded-3xl border border-saino-gray-200 shadow-sm mb-10">
        <h3 class="text-lg font-bold text-saino-gray-900 mb-4">Advertising & Payment Policies FAQ</h3>
        <div class="space-y-4">
          ${window.SAINO_DATA.boostFaqs.map(faq => `
            <div class="p-4 rounded-xl bg-saino-gray-50 border border-saino-gray-100">
              <h4 class="text-xs md:text-sm font-bold text-saino-gray-800 mb-1 flex items-center space-x-2">
                <i data-lucide="help-circle" class="w-4 h-4 text-sky-600 flex-shrink-0"></i>
                <span>${faq.q}</span>
              </h4>
              <p class="text-xs text-saino-gray-600 leading-relaxed pl-6">${faq.a}</p>
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
        <div class="inline-block p-5 sm:p-7 bg-white rounded-3xl shadow-xl border border-saino-gray-200 mb-6">
          <img src="assets/logo.png" alt="SAINO HEALTH" class="h-28 sm:h-36 md:h-40 w-auto max-w-[360px] object-contain mx-auto">
        </div>
        <div class="block">
          <span class="px-4 py-1.5 rounded-full text-xs sm:text-sm font-extrabold bg-saino-red/10 text-saino-red-dark uppercase tracking-widest">
            CONNECTED. SIMPLIFIED. BETTER HEALTH.
          </span>
        </div>
        <h1 class="text-2xl md:text-4xl font-extrabold text-saino-gray-900 mt-4 mb-2">
          Discover. Explore. Choose. Book with Confidence.
        </h1>
        <p class="text-sm md:text-base text-saino-gray-600 max-w-2xl mx-auto leading-relaxed">
          At SAINO Health, we bring together accurate, relevant, and thoughtfully presented information about healthcare providers and services, enabling users to discover, explore, and make more informed healthcare decisions with confidence.
        </p>
      </div>

      <!-- Core Quote 1 (Page 4 spec) -->
      <div class="quote-box p-6 md:p-8 rounded-2xl mb-12 shadow-sm">
        <p class="text-base md:text-lg font-medium text-saino-gray-800 italic leading-relaxed mb-3">
          “Healthcare should not be a collection of disconnected services. It should be a connected ecosystem where people, providers, and information come together to make better decisions.”
        </p>
        <span class="text-xs font-bold text-saino-red tracking-wider uppercase">— SAINO Health</span>
      </div>

      <!-- Our Offerings (Page 4 & 5 spec) -->
      <div class="bg-white rounded-3xl border border-saino-gray-200 p-6 md:p-8 shadow-sm mb-12">
        <h3 class="text-lg font-bold text-saino-gray-900 mb-4">Our Offerings</h3>
        <div class="space-y-4">
          <div class="flex items-start space-x-3 p-3 rounded-xl bg-saino-gray-50 border border-saino-gray-100">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
            <div>
              <strong class="text-xs md:text-sm text-saino-gray-900 block">Comprehensive Healthcare Directory</strong>
              <p class="text-xs text-saino-gray-600 mt-0.5">Detailed and verified information on healthcare providers, helping users discover doctors, clinics, hospitals, diagnostic centres, and healthcare services.</p>
            </div>
          </div>

          <div class="flex items-start space-x-3 p-3 rounded-xl bg-saino-gray-50 border border-saino-gray-100">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
            <div>
              <strong class="text-xs md:text-sm text-saino-gray-900 block">Online Appointment Booking</strong>
              <p class="text-xs text-saino-gray-600 mt-0.5">Explore provider profiles, services, reviews, and availability, and book appointments conveniently through SAINO Health WhatsApp integration.</p>
            </div>
          </div>

          <div class="flex items-start space-x-3 p-3 rounded-xl bg-saino-gray-50 border border-saino-gray-100">
            <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">✓</span>
            <div>
              <strong class="text-xs md:text-sm text-saino-gray-900 block">Connected Healthcare Services</strong>
              <p class="text-xs text-saino-gray-600 mt-0.5">Access a growing network of healthcare providers and services through one trusted, connected marketplace.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Core Quote 2 (Page 5 spec) -->
      <div class="quote-box p-6 md:p-8 rounded-2xl mb-12 shadow-sm">
        <p class="text-base md:text-lg font-medium text-saino-gray-800 italic leading-relaxed mb-3">
          “The best care is more than a service—it is the feeling of being genuinely understood, cared for, and supported by someone you can trust.”
        </p>
        <span class="text-xs font-bold text-saino-red tracking-wider uppercase">— Our Care Philosophy</span>
      </div>

      <!-- 4 Pillars: Connect · Trust · Transparency · Choice (Page 5 & 6 spec) -->
      <div class="mb-12">
        <div class="text-center mb-8">
          <span class="text-xs font-bold uppercase tracking-wider text-sky-600">Our Approach to Healthcare</span>
          <h2 class="text-xl md:text-2xl font-bold text-saino-gray-900 mt-1">Connecting People with Healthcare They Can Trust</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white p-6 rounded-2xl border border-saino-gray-200 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
              <i data-lucide="link" class="w-5 h-5"></i>
            </div>
            <h3 class="text-base font-bold text-saino-gray-900 mb-2">Connect</h3>
            <p class="text-xs text-saino-gray-600 leading-relaxed">
              Healthcare is more than finding a doctor or booking an appointment. It is about creating meaningful connections between people and the healthcare providers they choose. SAINO Health helps bring patients and providers closer through easier discovery, access, and communication.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-saino-gray-200 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <i data-lucide="shield-check" class="w-5 h-5"></i>
            </div>
            <h3 class="text-base font-bold text-saino-gray-900 mb-2">Trust</h3>
            <p class="text-xs text-saino-gray-600 leading-relaxed">
              Trust is at the heart of healthcare. We are committed to providing reliable provider information and maintaining a responsible verification system, helping people explore healthcare options with greater confidence.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-saino-gray-200 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <i data-lucide="eye" class="w-5 h-5"></i>
            </div>
            <h3 class="text-base font-bold text-saino-gray-900 mb-2">Transparency</h3>
            <p class="text-xs text-saino-gray-600 leading-relaxed">
              We believe people deserve clarity when making healthcare decisions. We strive to present provider information, services, reviews, activities, and promotional placements clearly, so users can explore their options and make informed choices.
            </p>
          </div>

          <div class="bg-white p-6 rounded-2xl border border-saino-gray-200 shadow-sm">
            <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
              <i data-lucide="sparkles" class="w-5 h-5"></i>
            </div>
            <h3 class="text-base font-bold text-saino-gray-900 mb-2">Choice</h3>
            <p class="text-xs text-saino-gray-600 leading-relaxed">
              Every individual has different healthcare needs. We believe people should have the freedom to explore relevant providers and services, understand their options, and choose the care that feels right for them.
            </p>
          </div>
        </div>
      </div>

      <!-- Data Privacy & Security (Page 6 spec) -->
      <div class="bg-saino-gray-900 text-white rounded-3xl p-6 md:p-8 mb-12 shadow-xl">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <i data-lucide="lock" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold">Data Privacy and Security is Our Top Priority</h3>
            <p class="text-xs text-emerald-400 font-semibold">Your data has only one owner. YOU.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-saino-gray-300 mb-6">
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
          <h4 class="text-base font-bold text-saino-gray-900">HEALTH CARE INVESTORS</h4>
          <p class="text-xs text-saino-gray-600">Let’s build the future of connected healthcare together.</p>
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
        <h1 class="text-2xl md:text-4xl font-extrabold text-saino-gray-900 mt-3 mb-2">
          We’re Here to Connect
        </h1>
        <p class="text-sm md:text-base text-saino-gray-600 max-w-2xl mx-auto leading-relaxed">
          Whether you’re looking to discover healthcare, join SAINO Health as a provider, promote your services, partner with us, or learn more about our platform, our team is here to help.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <!-- Left: Audience Information Router (Page 7 spec) -->
        <div class="lg:col-span-5 space-y-4">
          <h3 class="text-sm font-bold uppercase tracking-wider text-saino-gray-400">How can we help?</h3>

          <div class="p-4 rounded-2xl bg-white border border-saino-gray-200 shadow-xs">
            <h4 class="text-xs font-bold text-saino-gray-900 flex items-center space-x-1.5 mb-1">
              <i data-lucide="user" class="w-4 h-4 text-sky-600"></i>
              <span>For Patients & Users</span>
            </h4>
            <p class="text-xs text-saino-gray-600">Questions about finding providers, appointments, profiles, reviews, or using SAINO Health.</p>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-saino-gray-200 shadow-xs">
            <h4 class="text-xs font-bold text-saino-gray-900 flex items-center space-x-1.5 mb-1">
              <i data-lucide="stethoscope" class="w-4 h-4 text-emerald-600"></i>
              <span>For Healthcare Providers</span>
            </h4>
            <p class="text-xs text-saino-gray-600">Join SAINO Health, create or manage your profile, get verified, reach more users, or learn about provider services.</p>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-saino-gray-200 shadow-xs">
            <h4 class="text-xs font-bold text-saino-gray-900 flex items-center space-x-1.5 mb-1">
              <i data-lucide="building" class="w-4 h-4 text-purple-600"></i>
              <span>For Healthcare Businesses & Advertisers</span>
            </h4>
            <p class="text-xs text-saino-gray-600">Explore visibility, campaigns, promotions, and other opportunities to grow your presence on SAINO Health.</p>
          </div>

          <div class="p-4 rounded-2xl bg-white border border-saino-gray-200 shadow-xs">
            <h4 class="text-xs font-bold text-saino-gray-900 flex items-center space-x-1.5 mb-1">
              <i data-lucide="handshake" class="w-4 h-4 text-amber-600"></i>
              <span>For Partnerships & Investors</span>
            </h4>
            <p class="text-xs text-saino-gray-600">Connect with us for strategic healthcare networks, technology collaborations, and investment opportunities.</p>
          </div>

          <!-- Office Details (Page 8 spec) -->
          <div class="p-5 rounded-2xl bg-saino-gray-900 text-white shadow-md">
            <h4 class="text-xs font-bold uppercase tracking-wider text-saino-red-light mb-2">Our Office: KATHMANDU, NEPAL</h4>
            <p class="text-xs text-saino-gray-300 leading-relaxed mb-3">
              <strong>SAINO Tech Ventures Pvt. Ltd.</strong><br>
              Tejasswee Girls Hostel, opp<br>
              Suruchi Marg, Kathmandu-31<br>
              Kathmandu 44600, Nepal
            </p>
            <div class="space-y-1 text-xs text-saino-gray-300 mb-3">
              <div>✉ info@sainotechventures.com</div>
              <div>✉ sales@sainotechventures.com</div>
              <div>✉ support@sainohealth.com</div>
            </div>
            <button onclick="showToast('Opening Google Maps Directions to Kathmandu Office')" class="text-xs font-bold text-saino-red-light hover:text-saino-red-light/80 inline-flex items-center space-x-1">
              <span>Get Directions →</span>
            </button>
          </div>
        </div>

        <!-- Right: Interactive Inquiry Form (Page 8 spec) -->
        <div class="lg:col-span-7">
          <div class="bg-white p-6 md:p-8 rounded-3xl border border-saino-gray-200 shadow-sm">
            <h3 class="text-lg font-bold text-saino-gray-900 mb-2">Send an Inquiry</h3>
            <p class="text-xs text-saino-gray-500 mb-6">Have a question, suggestion, or opportunity to share? Reach out to us.</p>

            <form id="contactForm" onsubmit="handleContactSubmit(event)" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-saino-gray-700 mb-1">Interested In: (BOX)</label>
                <select id="contactTopic" required class="w-full text-xs bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="Patient Appointment Inquiry">Patient Appointment / Healthcare Finding</option>
                  <option value="Healthcare Provider Verification & Badge Upgrade">Healthcare Provider Verification & Badge Upgrade</option>
                  <option value="Healthcare Business Advertising & Campaigns (SAINO Boost)">Healthcare Business Advertising & Campaigns (SAINO Boost)</option>
                  <option value="Corporate / Health Insurance Partnership">Corporate / Health Insurance Partnership</option>
                  <option value="Investor Relations & Strategic Support">Investor Relations & Strategic Support</option>
                </select>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-saino-gray-700 mb-1">Full Name</label>
                  <input type="text" id="contactName" required placeholder="e.g. Dr. Ramesh Karki / Sita Sharma" class="w-full text-xs bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                </div>
                <div>
                  <label class="block text-xs font-bold text-saino-gray-700 mb-1">Phone / WhatsApp Number</label>
                  <input type="tel" id="contactPhone" required placeholder="+977-98XXXXXXXX" class="w-full text-xs bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-saino-gray-700 mb-1">Email Address</label>
                <input type="email" id="contactEmail" required placeholder="your.email@provider.com" class="w-full text-xs bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
              </div>

              <div>
                <label class="block text-xs font-bold text-saino-gray-700 mb-1">Message / Requirements</label>
                <textarea id="contactMessage" rows="4" required placeholder="Describe your inquiry, clinic details, or advertising timeline..." class="w-full text-xs bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
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
      btn.className = 'w-2 h-2 rounded-full transition-all bg-saino-gray-300';
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
    <div class="fixed inset-0 z-50 overflow-y-auto bg-saino-gray-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-saino-gray-200 modal-content animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <!-- Modal Top Bar with Cover & Doctor Spotlight -->
        <div class="relative bg-gradient-to-r from-sky-900 via-indigo-900 to-saino-gray-900 text-white p-6 md:p-8 flex-shrink-0">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>

          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 rounded-2xl bg-white p-1 overflow-hidden shadow-lg border-2 border-white/40 flex-shrink-0">
                <img src="${p.logo}" alt="${p.name}" class="w-full h-full object-cover rounded-xl">
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <h2 class="text-xl md:text-2xl font-bold">${p.name}</h2>
                  ${p.verification === 'vvip' ? `<span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md"><i data-lucide="award" class="w-3.5 h-3.5 text-amber-300"></i><span>🏆 SAINO VVIP</span></span>` : ''}
                  ${p.verification === 'vip' ? `<span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-saino-gray-950 shadow-md"><i data-lucide="crown" class="w-3.5 h-3.5 text-saino-gray-950"></i><span>👑 SAINO Verified VIP</span></span>` : ''}
                  ${p.verification === 'pro' ? `<span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-saino-red text-white shadow-md"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-white"></i><span>✓ SAINO Verified Pro</span></span>` : ''}
                  ${p.verification === 'prime' ? `<span class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#059669] text-white shadow-md"><i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-white"></i><span>✓ SAINO Verified Prime</span></span>` : ''}
                  ${p.verification === 'listed' ? `<span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/20 text-white"><i data-lucide="check" class="w-3 h-3"></i><span>Saino Listed</span></span>` : ''}
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
              <div class="flex items-center space-x-3 text-saino-gray-200">
                <span>⭐ ${p.rating} (${p.reviewsCount} Reviews)</span>
                <span>♥ ${(p.likesCount).toLocaleString()} Likes</span>
                <span>👥 ${p.interestedCount} Interested</span>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Navigation Tabs (Page 10 & 11 Spec) -->
        <div class="border-b border-saino-gray-200 px-6 bg-saino-gray-50 flex space-x-6 text-xs font-bold text-saino-gray-600 overflow-x-auto no-scrollbar flex-shrink-0">
          <button onclick="switchProviderTab('about')" id="tabBtn-about" class="py-3 border-b-2 border-saino-red text-saino-red">About</button>
          <button onclick="switchProviderTab('services')" id="tabBtn-services" class="py-3 border-b-2 border-transparent hover:text-saino-gray-900">Services & Fees</button>
          <button onclick="switchProviderTab('reviews')" id="tabBtn-reviews" class="py-3 border-b-2 border-transparent hover:text-saino-gray-900">Reviews (${p.reviews ? p.reviews.length : 0})</button>
          <button onclick="switchProviderTab('activity')" id="tabBtn-activity" class="py-3 border-b-2 border-transparent hover:text-saino-gray-900">Activity & Updates</button>
          <button onclick="switchProviderTab('photos')" id="tabBtn-photos" class="py-3 border-b-2 border-transparent hover:text-saino-gray-900">Photos Gallery</button>
          <button onclick="switchProviderTab('availability')" id="tabBtn-availability" class="py-3 border-b-2 border-transparent hover:text-saino-gray-900">Doctor Availability</button>
        </div>

        <!-- Tab Content Area -->
        <div id="providerTabContent" class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 text-xs text-saino-gray-700">
          ${renderProviderAboutTab(p)}
        </div>

        <!-- Modal Footer -->
        <div class="p-4 bg-saino-gray-50 border-t border-saino-gray-200 flex items-center justify-between text-xs flex-shrink-0">
          <div class="text-saino-gray-500">
            Opening Hours: <strong>${p.openingHours}</strong>
          </div>
          <div class="flex items-center space-x-3">
            <button onclick="openWriteReviewModal('${p.id}')" class="px-3 py-1.5 bg-white border border-saino-gray-300 text-saino-gray-700 font-semibold rounded-lg hover:bg-saino-gray-100 transition">
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
    btn.className = 'py-3 border-b-2 border-transparent hover:text-saino-gray-900';
  });
  const activeBtn = document.getElementById(`tabBtn-${tabName}`);
  if (activeBtn) {
    activeBtn.className = 'py-3 border-b-2 border-saino-red text-saino-red font-bold';
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
          <h4 class="text-sm font-bold text-saino-gray-900">Available Consultation & Service Packages</h4>
          <div class="space-y-2">
            ${p.services.map(s => `
              <div class="p-3.5 rounded-xl border border-saino-gray-200 bg-saino-gray-50/60 flex items-center justify-between">
                <div>
                  <strong class="text-xs text-saino-gray-900 block">${s.name}</strong>
                  <span class="text-[11px] text-saino-gray-500">Consultant: ${s.doctor}</span>
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
            <h4 class="text-sm font-bold text-saino-gray-900">Patient Reviews & Experiences</h4>
            <button onclick="openWriteReviewModal('${p.id}')" class="text-xs font-bold text-sky-600 hover:text-sky-700">
              + Add Your Review
            </button>
          </div>
          <div class="space-y-3">
            ${p.reviews && p.reviews.length > 0 ? p.reviews.map(r => `
              <div class="p-4 rounded-xl border border-saino-gray-200 bg-saino-gray-50">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="font-bold text-saino-gray-800 text-xs">${r.user}</span>
                  <span class="text-[11px] text-saino-gray-400">${r.date}</span>
                </div>
                <div class="text-amber-500 text-xs mb-1">
                  ${'★'.repeat(Math.round(r.rating))} (${r.rating})
                </div>
                <p class="text-xs text-saino-gray-600 leading-relaxed">"${r.comment}"</p>
              </div>
            `).join('') : '<p class="text-xs text-saino-gray-400">No reviews submitted yet.</p>'}
          </div>
        </div>
      `;
      break;
    case 'activity':
      container.innerHTML = `
        <div class="space-y-3">
          <h4 class="text-sm font-bold text-saino-gray-900">Recent Facility Activity & Health Drives</h4>
          <ul class="space-y-2 text-xs">
            ${p.activity.map(act => `
              <li class="p-3 rounded-xl bg-saino-gray-50 border border-saino-gray-100 flex items-start space-x-2.5">
                <i data-lucide="check-circle" class="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5"></i>
                <span class="text-saino-gray-700">${act}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
      break;
    case 'photos':
      container.innerHTML = `
        <div>
          <h4 class="text-sm font-bold text-saino-gray-900 mb-3">Facility & Infrastructure Photos</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            ${p.photos.map(photo => `
              <div class="h-36 rounded-xl overflow-hidden border border-saino-gray-200 shadow-xs">
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
          <h4 class="text-sm font-bold text-saino-gray-900">Doctor OPD & Consultation Availability</h4>
          <div class="space-y-2">
            ${p.availability.map(av => `
              <div class="p-3 rounded-xl bg-saino-gray-50 border border-saino-gray-100 flex items-center justify-between text-xs">
                <div>
                  <strong class="text-saino-gray-900 block">${av.doctor}</strong>
                  <span class="text-saino-gray-500">${av.day}</span>
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
        <h4 class="text-sm font-bold text-saino-gray-900 mb-1">About Facility</h4>
        <p class="text-xs text-saino-gray-600 leading-relaxed">${p.about}</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div class="p-3.5 rounded-xl bg-saino-gray-50 border border-saino-gray-100">
          <span class="text-[11px] font-bold text-saino-gray-400 uppercase tracking-wider block mb-1">Location & Directions</span>
          <p class="text-xs text-saino-gray-800 font-semibold">${p.location}, ${p.city}</p>
          ${p.website ? `<a href="${p.website}" target="_blank" class="text-xs text-sky-600 hover:underline mt-1 block">Visit Official Website →</a>` : ''}
        </div>

        <div class="p-3.5 rounded-xl bg-saino-gray-50 border border-saino-gray-100">
          <span class="text-[11px] font-bold text-saino-gray-400 uppercase tracking-wider block mb-1">Emergency & OPD Schedule</span>
          <p class="text-xs text-saino-gray-800 font-semibold">${p.openingHours}</p>
          <span class="text-[11px] text-emerald-600 font-semibold block mt-1">✓ Instant WhatsApp Booking Enabled</span>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-bold text-saino-gray-900 mb-2">Speciality Departments</h4>
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
    <div class="fixed inset-0 z-50 overflow-y-auto bg-saino-gray-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-saino-gray-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
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
            <label class="block font-bold text-saino-gray-700 mb-1">Select Service / Department</label>
            <select id="wbService" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              ${p.services.map(s => `<option value="${s.name}">${s.name} (${s.fee})</option>`).join('')}
              <option value="General OPD Consultation">General OPD Consultation</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-saino-gray-700 mb-1">Patient Full Name</label>
              <input type="text" id="wbPatientName" required placeholder="e.g. Binod Shrestha" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
            <div>
              <label class="block font-bold text-saino-gray-700 mb-1">Preferred Date</label>
              <input type="date" id="wbDate" required value="${new Date().toISOString().split('T')[0]}" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            </div>
          </div>

          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Brief Symptoms or Notes (Optional)</label>
            <textarea id="wbNotes" rows="2" placeholder="e.g. Chest discomfort since 2 days, need ECG & consultation..." class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
          </div>

          <div class="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-[11px] flex items-center space-x-2 border border-emerald-100">
            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600 flex-shrink-0"></i>
            <span>Your booking request is routed directly to ${p.name}'s verified WhatsApp triage desk.</span>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 text-saino-gray-600 font-semibold hover:bg-saino-gray-100 rounded-xl transition">
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

  const textMsg = `Hello ${p.name} (via SAINO HEALTH),%0A%0AI would like to book an appointment:%0A- Patient Name: ${encodeURIComponent(name)}%0A- Service: ${encodeURIComponent(service)}%0A- Preferred Date: ${encodeURIComponent(date)}%0A- Notes: ${encodeURIComponent(notes || 'N/A')}%0A%0AAppointment booking helpline: +977 9761427155. Please confirm available time slots.`;
  
  // Official SAINO HEALTH WhatsApp Hotline
  const whatsappUrl = `https://wa.me/9779761427155?text=${textMsg}`;
  
  window.open(whatsappUrl, '_blank');
  closeModal();
  showToast(`WhatsApp booking link launched for ${p.name}!`);
}

function openCustomWhatsApp(topic, message) {
  const whatsappUrl = `https://wa.me/9779761427155?text=${encodeURIComponent(`[SAINO HEALTH - ${topic}] ` + message)}`;
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
    <div class="fixed inset-0 z-50 overflow-y-auto bg-saino-gray-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-saino-gray-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <div class="bg-gradient-to-r from-saino-red-dark via-saino-red to-saino-red-dark p-6 text-white relative">
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
            <label class="block font-bold text-saino-gray-700 mb-1">Select Verification Tier</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              ${window.SAINO_DATA.subscriptionTiers.map(t => `
                <label class="p-3.5 rounded-2xl border ${t.id === preselectedTier ? 'border-saino-red bg-saino-red/10 ring-2 ring-saino-red/20' : 'border-saino-gray-200 bg-saino-gray-50'} flex flex-col justify-between cursor-pointer">
                  <div class="flex items-center justify-between mb-2">
                    <input type="radio" name="tierPlan" value="${t.id}" ${t.id === preselectedTier ? 'checked' : ''} class="text-saino-red">
                    <span class="text-[9px] font-black uppercase ${t.type === 'paid' ? 'text-saino-red-dark' : 'text-saino-gray-400'}">${t.name}</span>
                  </div>
                  <strong class="text-saino-gray-900 text-xs">${t.badge}</strong>
                  <span class="text-saino-red-dark font-bold text-xs mt-1">${t.price}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-saino-gray-700 mb-1">Hospital / Clinic / Provider Name</label>
              <input type="text" id="upgOrgName" required placeholder="e.g. Kathmandu Care Clinic" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-saino-red">
            </div>
            <div>
              <label class="block font-bold text-saino-gray-700 mb-1">Contact Person & Phone</label>
              <input type="text" id="upgContact" required placeholder="e.g. Dr. Karki / 98XXXXXXXX" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-saino-red">
            </div>
          </div>

          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Business Email</label>
            <input type="email" id="upgEmail" required placeholder="admin@careclinic.np" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-saino-red">
          </div>

          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Payment Method (Esewa / Khalti / FonePay / Bank Transfer)</label>
            <select class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800">
              <option>eSewa Digital Wallet</option>
              <option>Khalti Digital Wallet</option>
              <option>FonePay Direct QR</option>
              <option>Corporate Bank Transfer / Invoice</option>
            </select>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2.5 text-saino-gray-600 font-semibold hover:bg-saino-gray-100 rounded-xl transition">
              Cancel
            </button>
            <button type="submit" class="px-5 py-2.5 bg-saino-red hover:bg-saino-red-dark text-white font-bold rounded-xl transition shadow-md">
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
    <div class="fixed inset-0 z-50 overflow-y-auto bg-saino-gray-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-saino-gray-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <div class="bg-saino-gray-900 p-6 text-white relative">
          <button onclick="closeModal()" class="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
          <h3 class="text-base font-bold">Write a Review</h3>
          <p class="text-xs text-saino-gray-400 mt-0.5">${p.name}</p>
        </div>

        <form onsubmit="handleReviewSubmit(event, '${p.id}')" class="p-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Your Full Name</label>
            <input type="text" id="revName" required placeholder="e.g. Pooja Sharma" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>

          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Rating (1 - 5 Stars)</label>
            <select id="revRating" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800">
              <option value="5">⭐⭐⭐⭐⭐ 5 Stars (Outstanding Experience)</option>
              <option value="4">⭐⭐⭐⭐ 4 Stars (Very Good)</option>
              <option value="3">⭐⭐⭐ 3 Stars (Satisfactory)</option>
              <option value="2">⭐⭐ 2 Stars (Needs Improvement)</option>
              <option value="1">⭐ 1 Star (Poor)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Your Review & Feedback</label>
            <textarea id="revComment" rows="3" required placeholder="Share your experience with the doctors, staff, facility hygiene, and waiting time..." class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
          </div>

          <div class="pt-2 flex items-center justify-end space-x-3">
            <button type="button" onclick="closeModal()" class="px-4 py-2 text-saino-gray-600 font-semibold hover:bg-saino-gray-100 rounded-xl transition">
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
    <div class="fixed inset-0 z-50 overflow-y-auto bg-saino-gray-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 modal-overlay">
      <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-saino-gray-200 modal-content animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header with SAINO Crimson Theme -->
        <div class="bg-gradient-to-r from-saino-red-dark via-saino-red to-saino-red-dark p-6 text-white relative">
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
          <div class="grid grid-cols-2 gap-2 p-1 bg-saino-gray-100 rounded-2xl text-xs font-bold mb-4">
            <button type="button" id="tabBtnPatient" onclick="switchLoginTab('patient')" class="py-2.5 rounded-xl transition ${defaultTab === 'patient' ? 'bg-white text-saino-red-dark shadow-sm' : 'text-saino-gray-500 hover:text-saino-gray-800'}">
              👤 Patient / Customer
            </button>
            <button type="button" id="tabBtnProvider" onclick="switchLoginTab('provider')" class="py-2.5 rounded-xl transition ${defaultTab === 'provider' ? 'bg-white text-saino-red-dark shadow-sm' : 'text-saino-gray-500 hover:text-saino-gray-800'}">
              🏥 Doctor / Provider
            </button>
          </div>
        </div>

        <!-- Patient Login Form -->
        <div id="loginFormPatient" class="${defaultTab === 'patient' ? 'block' : 'hidden'} px-6 pb-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Mobile Number or Email</label>
            <input type="text" required placeholder="e.g. 9801234567 or pooja@gmail.com" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-saino-red">
          </div>
          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Password / 4-Digit OTP</label>
            <input type="password" required placeholder="••••••••" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-saino-red">
          </div>
          <div class="flex items-center justify-between text-[11px]">
            <label class="flex items-center space-x-1.5 text-saino-gray-600 cursor-pointer">
              <input type="checkbox" checked class="rounded text-saino-red">
              <span>Remember me</span>
            </label>
            <a href="#" onclick="showToast('OTP sent to your mobile number!')" class="text-saino-red font-bold hover:underline">Get Login OTP</a>
          </div>
          <button type="button" onclick="handlePatientSignInSubmit(event)" class="w-full py-3 bg-saino-red hover:bg-saino-red-dark text-white font-bold rounded-xl transition shadow-md">
            Sign In as Patient / Customer
          </button>
          <div class="p-3 rounded-xl bg-saino-red/10 border border-saino-red/20 text-[11px] text-saino-red-dark leading-relaxed">
            💡 <strong>Fast Access:</strong> You can also browse providers and book via WhatsApp as a guest without signing in!
          </div>
        </div>

        <!-- Provider Login Form -->
        <div id="loginFormProvider" class="${defaultTab === 'provider' ? 'block' : 'hidden'} px-6 pb-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Provider ID / Official Email</label>
            <input type="text" required placeholder="doctor@clinic.np or NORVIC-ADMIN" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-saino-red">
          </div>
          <div>
            <label class="block font-bold text-saino-gray-700 mb-1">Hospital Admin Password</label>
            <input type="password" required placeholder="••••••••" class="w-full bg-saino-gray-50 border border-saino-gray-200 rounded-xl p-3 text-saino-gray-800 focus:outline-none focus:ring-2 focus:ring-saino-red">
          </div>
          <button type="button" onclick="handleProviderSignInSubmit(event)" class="w-full py-3 bg-saino-gray-900 hover:bg-saino-gray-800 text-white font-bold rounded-xl transition shadow-md">
            Sign In to Hospital Dashboard
          </button>
          <div class="text-center text-saino-gray-500 text-[11px]">
            New Healthcare Provider? <button type="button" onclick="openUpgradeBadgeModal('prime')" class="text-saino-red font-bold hover:underline">Register Facility Here</button>
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
      tabBtnPatient.className = 'py-2.5 rounded-xl transition bg-white text-saino-red-dark shadow-sm';
    }
    if (tabBtnProvider) {
      tabBtnProvider.className = 'py-2.5 rounded-xl transition text-saino-gray-500 hover:text-saino-gray-800';
    }
  } else {
    if (patientForm) patientForm.classList.add('hidden');
    if (providerForm) providerForm.classList.remove('hidden');
    if (tabBtnProvider) {
      tabBtnProvider.className = 'py-2.5 rounded-xl transition bg-white text-saino-red-dark shadow-sm';
    }
    if (tabBtnPatient) {
      tabBtnPatient.className = 'py-2.5 rounded-xl transition text-saino-gray-500 hover:text-saino-gray-800';
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

function triggerHeaderSearch() {
  const searchInput = document.getElementById('headerSearchInput');
  const locSelect = document.getElementById('headerLocationSelect');
  if (searchInput) AppState.searchQuery = searchInput.value;
  if (locSelect) AppState.selectedLocation = locSelect.value;
  AppState.activeView = 'marketplace';
  renderApp();
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

// ========================================
// Catalogue / Ads Auto Slider
// ========================================

document.addEventListener("DOMContentLoaded", function () {

  const adTitle = document.getElementById("adTitle");
  const adDescription = document.getElementById("adDescription");
  const adDots = document.querySelectorAll(".ad-dot");

  // Stop if Ads section is not available on this page
  if (!adTitle || !adDescription || !adDots.length) {
    return;
  }

  const ads = [
    {
      title: "Catalogue / Ads Section",
      description:
        "Rotating promo banner, sponsored placements & platform announcements"
    },
    {
      title: "Discover Trusted Healthcare",
      description:
        "Explore verified hospitals, clinics, diagnostic centres & more"
    },
    {
      title: "Find the Right Care for You",
      description:
        "Compare healthcare providers and discover services across Nepal"
    },
    {
      title: "Connect with Better Healthcare",
      description:
        "Discover healthcare providers, read reviews and make informed decisions"
    }
  ];

  let currentAd = 0;

  function showAd(index) {

    // Fade out
    adTitle.style.opacity = "0";
    adDescription.style.opacity = "0";

    setTimeout(() => {

      // Change text
      adTitle.textContent = ads[index].title;
      adDescription.textContent = ads[index].description;

      // Update dots
      adDots.forEach((dot, i) => {

        if (i === index) {
          dot.classList.remove("bg-white/40");
          dot.classList.add("bg-white");
        } else {
          dot.classList.remove("bg-white");
          dot.classList.add("bg-white/40");
        }

      });

      // Fade in
      adTitle.style.opacity = "1";
      adDescription.style.opacity = "1";

    }, 300);
  }

  // Auto play every 3 seconds
  setInterval(() => {

    currentAd++;

    if (currentAd >= ads.length) {
      currentAd = 0;
    }

    showAd(currentAd);

  }, 3000);

});