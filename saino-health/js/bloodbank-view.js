/* ============================================================
   BLOOD BANK DIRECTORY VIEW (SAFE & FULLY WORKING)
   ============================================================ */

const BLOOD_GROUPS = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O-", "O+"];

const BLOOD_BANK_LIST = [
  { 
    id: "bb-1", 
    name: "Nepal Red Cross Society", 
    tier: "verified", 
    distanceKm: 3.0,
    isOpen24Hours: true,
    location: "Kathmandu, 3km, delivery in about 45 min", 
    updated: "Updated 12 min ago", 
    stock: { "A+": "available", "A-": "available", "B+": "available", "B-": "available", "AB+": "available", "AB-": "low", "O-": "low", "O+": "available" } 
  },
  { 
    id: "bb-2", 
    name: "Emergency Relief Fund", 
    tier: "verified", 
    distanceKm: 5.0,
    isOpen24Hours: true,
    location: "Lalitpur, 5km, delivery in about 30 min", 
    updated: "Updated 10 min ago", 
    stock: { "A+": "low", "A-": "available", "B+": "available", "B-": "unavailable", "AB+": "available", "AB-": "unavailable", "O-": "available", "O+" : "available" } 
  },
  { 
    id: "bb-3", 
    name: "Humanitarian Aid Network", 
    tier: "verified", 
    distanceKm: 7.0,
    isOpen24Hours: false,
    location: "Bhaktapur, 7km, delivery in about 60 min", 
    updated: "Updated 15 min ago", 
    stock: { "A+": "available", "A-": "low", "B+": "available", "B-": "available", "AB+": "available", "AB-": "low", "O-": "unavailable", "O+": "available" } 
  },
  { 
    id: "bb-4", 
    name: "Global Health Initiative", 
    tier: "verified", 
    distanceKm: 10.0,
    isOpen24Hours: true,
    location: "Bhaktapur, 10km, delivery in about 90 min", 
    updated: "Updated 20 min ago", 
    stock: { "A+": "low", "A-": "available", "B+": "available", "B-": "unavailable", "AB+": "available", "AB-": "available", "O-": "available", "O+": "available" } 
  }
];

let BLOOD_STATE = { group: "A+", within5km: false, open24Hours: false };

function bloodStockClass(status) {
  if (status === "available") return "bg-emerald-100 text-emerald-800 font-bold border border-emerald-300";
  if (status === "low") return "bg-amber-100 text-amber-800 font-bold border border-amber-300";
  return "bg-slate-200 text-slate-500 border border-slate-300";
}

function getFilteredBloodBanks() {
  return BLOOD_BANK_LIST.filter(bank => {
    if (!bank || !bank.stock) return false;

    // Blood group match
    if (BLOOD_STATE.group !== "All") {
      const status = bank.stock[BLOOD_STATE.group];
      if (!status || status === "unavailable") return false;
    }
    // Distance filter
    if (BLOOD_STATE.within5km && (bank.distanceKm || 0) > 5) {
      return false;
    }
    // 24 Hours filter
    if (BLOOD_STATE.open24Hours && !bank.isOpen24Hours) {
      return false;
    }
    return true;
  });
}

function renderBloodBankDirectoryView() {
  const filteredList = getFilteredBloodBanks();

  return `
    <div id="blood-bank-main-container">
      <div class="bg-white border-y border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-5">
          <button onclick="navigateTo('marketplace')" class="text-xs font-bold text-red-700 hover:underline mb-2 flex items-center gap-1">
            ← Back to Marketplace
          </button>
          <h1 class="text-2xl font-black text-slate-900">Find Blood</h1>
          <p class="text-sm text-slate-500 mt-1">Choose a blood group to see which blood banks have it in stock.</p>
        </div>
      </div>

      <div class="bg-slate-50 min-h-screen py-8">
        <div class="max-w-6xl mx-auto px-4 sm:px-6">

          <!-- Filters -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-xs">
            <div class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Blood group</div>
            <div class="flex flex-wrap gap-2 mb-4">
              ${BLOOD_GROUPS.map(g => `
                <button type="button" onclick="selectBloodGroup('${g}')"
                  class="px-4 py-2 rounded-xl text-sm font-bold transition shadow-xs
                  ${g === BLOOD_STATE.group ? "bg-red-700 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}">
                  ${g}
                </button>`).join("")}
            </div>

            <div class="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
              <button type="button" onclick="toggleBloodFilter('within5km')" 
                class="px-4 py-2 rounded-xl border text-xs font-semibold transition ${BLOOD_STATE.within5km ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}">
                ${BLOOD_STATE.within5km ? '✓ Within 5 km' : 'Within 5 km'}
              </button>
              <button type="button" onclick="toggleBloodFilter('open24Hours')" 
                class="px-4 py-2 rounded-xl border text-xs font-semibold transition ${BLOOD_STATE.open24Hours ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}">
                ${BLOOD_STATE.open24Hours ? '✓ Open 24 hours' : 'Open 24 hours'}
              </button>
            </div>
          </div>

          <!-- Header count -->
          <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
            <h2 class="text-sm font-bold text-slate-800">
              ${filteredList.length} blood banks for ${BLOOD_STATE.group}
            </h2>
            <div class="flex items-center gap-4 text-xs text-slate-600">
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-emerald-200 border border-emerald-400"></span> Available</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-200 border border-amber-400"></span> Low</span>
              <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-slate-300 border border-slate-400"></span> Unavailable</span>
            </div>
          </div>

          <!-- Cards List -->
          <div class="space-y-4 mb-10">
            ${filteredList.length === 0 ? `
              <div class="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-500 font-semibold text-sm">
                No blood banks available with this criteria.
              </div>
            ` : filteredList.map(bank => `
              <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div class="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <button type="button" onclick="openProviderByName('${bank.name.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}', 'bloodbank')" class="text-left text-base font-bold text-slate-900 hover:text-red-700">${bank.name}</button>
                      <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        ✓ Saino Verified
                      </span>
                    </div>
                    <p class="text-xs text-slate-500 mt-1">${bank.location}</p>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ${BLOOD_STATE.group !== 'All' ? `${BLOOD_STATE.group} available` : 'Stock Active'}
                    </span>
                    <button onclick="requestBlood('${bank.name}')" class="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm">
                      Request blood
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-4 sm:grid-cols-8 gap-2 my-4 pt-3 border-t border-slate-100">
                  ${Object.entries(bank.stock || {}).map(([grp, status]) => `
                    <div class="text-center py-1.5 rounded-lg text-xs ${bloodStockClass(status)} ${grp === BLOOD_STATE.group ? 'ring-2 ring-red-600 ring-offset-1 font-black' : ''}">
                      ${grp}
                    </div>
                  `).join("")}
                </div>

                <div class="text-[11px] text-slate-400">${bank.updated}</div>
              </div>
            `).join("")}
          </div>

        </div>
      </div>
    </div>
  `;
}

function refreshBloodBankDOM() {
  const main = document.getElementById("mainContent") || document.getElementById("main-content");
  if (main) {
    main.innerHTML = renderBloodBankDirectoryView();
  }
}

window.selectBloodGroup = function(group) {
  BLOOD_STATE.group = group;
  refreshBloodBankDOM();
};

window.toggleBloodFilter = function(filterKey) {
  BLOOD_STATE[filterKey] = !BLOOD_STATE[filterKey];
  refreshBloodBankDOM();
};

window.requestBlood = function(bankName) {
  alert(`Blood request initiated with ${bankName} for group ${BLOOD_STATE.group}.`);
};
/* ============================================================
   BLOOD BANK COURIER TRACKING VIEW (EXACT SCREENSHOT MATCH)
   ============================================================ */

function renderBloodDeliveryTrackingView(bankName, bloodGroup) {
  const unitsCount = 2;
  const currentGroup = (bloodGroup && bloodGroup !== 'All') ? bloodGroup : 'O+';

  return `
    <!-- Top Header -->
    <div class="bg-white border-y border-slate-200">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 py-5">
        <button onclick="backToBloodBanks()" class="text-xs font-bold text-red-700 hover:underline mb-2 flex items-center gap-1">
          ← Back to Blood Banks
        </button>
        <h1 class="text-2xl font-black text-slate-900">Blood Bank</h1>
        <p class="text-sm text-slate-500 mt-1">Find the ambulance according to you needs.</p>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-8 mb-16">
      
      <!-- Heading & Subtitle -->
      <div class="mb-6">
        <div class="text-[11px] text-slate-400 font-medium mb-1">Delivery #SB-77210</div>
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900">Blood is on its way to Norvic Hospital</h2>
        <p class="text-xs text-slate-500 mt-1">You'll get a call from the courier just before arrival.</p>
      </div>

      <!-- Courier Card -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div class="flex items-center gap-3.5">
          ${window.renderUserProfileIcon("w-12 h-12", "w-6 h-6")}
          <div>
            <div class="text-sm font-bold text-slate-900">Sunita Maharjan</div>
            <div class="text-xs text-slate-500">Cold-chain courier · Bike</div>
            <div class="flex items-center gap-1 text-xs mt-0.5">
              <span class="text-amber-500">★★★★★</span>
              <span class="text-slate-600 font-medium">4.8</span>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-2 w-full sm:w-44">
          <button onclick="alert('Calling courier: +977-9800000000')" class="w-full bg-[#991b1b] hover:bg-red-800 text-white text-xs font-semibold py-2.5 rounded-lg transition text-center">
            Call courier
          </button>
          <button onclick="alert('Opening chat...')" class="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium py-2 rounded-lg transition text-center">
            Message
          </button>
        </div>
      </div>

      <!-- Blood Details Card -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
        <div class="text-sm font-bold text-slate-900">${currentGroup} · ${unitsCount} units</div>
        <div class="text-xs text-slate-500 mt-0.5">${bankName || "Nepal Red Cross Blood Bank"}</div>
        <div class="flex items-center gap-2 mt-3">
          <span class="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
            Saino Verified
          </span>
          <span class="inline-flex items-center text-[11px] font-medium text-cyan-800 bg-cyan-50 border border-cyan-200 px-2.5 py-0.5 rounded-md">
            Cold-chain box
          </span>
        </div>
      </div>

      <!-- Need Help Card -->
      <div class="bg-white border border-slate-300 rounded-2xl p-5 mb-4">
        <div class="text-xs font-bold text-slate-900">Need help with this delivery?</div>
        <p class="text-xs text-slate-500 mt-1 mb-3.5">Reach the blood bank directly or report an issue.</p>
        <button onclick="alert('Connecting to blood bank helpdesk...')" class="w-full bg-[#1e293b] hover:bg-slate-800 text-white text-xs font-semibold py-3 rounded-lg transition text-center">
          Contact blood bank
        </button>
      </div>

      <!-- Delivery Info List -->
      <dl class="bg-white border border-slate-200 rounded-2xl px-6 py-2 text-xs divide-y divide-slate-100 mb-6">
        <div class="flex justify-between items-center py-3">
          <dt class="text-slate-400">Deliver to</dt>
          <dd class="font-medium text-slate-800 text-right">Norvic Hospital, Ward 4</dd>
        </div>
        <div class="flex justify-between items-center py-3">
          <dt class="text-slate-400">Requested by</dt>
          <dd class="font-medium text-slate-800 text-right">You, for patient</dd>
        </div>
      </dl>

      <!-- Step Tracker -->
      <div class="bg-white border border-slate-200 rounded-2xl px-6 py-5 mb-6">
        <div class="relative">
          <div class="absolute top-[5px] left-[12%] right-[12%] h-[2px] bg-slate-200">
            <div class="h-full bg-red-700" style="width: 33%;"></div>
          </div>
          <div class="relative grid grid-cols-4 text-center">
            <div class="flex flex-col items-center">
              <span class="w-3 h-3 rounded-full bg-red-700"></span>
              <span class="mt-2 text-[10px] font-bold text-slate-900">Confirmed</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="w-3 h-3 rounded-full bg-red-700 ring-4 ring-red-100"></span>
              <span class="mt-2 text-[10px] font-bold text-slate-900">Courier Assigned</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="w-3 h-3 rounded-full bg-white border-2 border-slate-300"></span>
              <span class="mt-2 text-[10px] text-slate-400">En Route</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="w-3 h-3 rounded-full bg-white border-2 border-slate-300"></span>
              <span class="mt-2 text-[10px] text-slate-400">Delivered</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Tracking Card (Exact Screenshot Alignment) -->
      <div class="relative bg-[#eaf4f6] border border-cyan-100 rounded-2xl overflow-hidden" style="height: 250px;">
        
        <!-- ETA Floating Badge -->
        <div class="absolute top-4 left-4 bg-white rounded-xl shadow-sm px-4 py-2.5 flex items-center gap-3 z-10 border border-slate-100">
          <div>
            <div class="text-base font-black text-slate-900 leading-none">22 min</div>
            <div class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">ETA</div>
          </div>
          <span class="w-px h-6 bg-slate-200"></span>
          <div>
            <div class="text-base font-black text-slate-900 leading-none">5.1 km</div>
            <div class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">away</div>
          </div>
        </div>

        <!-- SVG Dotted Path & Dots -->
        <svg class="w-full h-full" viewBox="0 0 1000 250" preserveAspectRatio="none">
          <!-- Soft Grey Curved Dotted Route -->
          <path d="M 120 70 Q 380 230 580 200 T 830 200" 
                fill="none" 
                stroke="#94a3b8" 
                stroke-width="2.5" 
                stroke-dasharray="4 8" 
                stroke-linecap="round" />

          <!-- Middle Checkpoint / Courier Red Dot -->
          <circle cx="365" cy="140" r="5" fill="#b91c1c" />

          <!-- Destination End Red Dot -->
          <circle cx="830" cy="200" r="8" fill="#b91c1c" />
        </svg>

      </div>
  `;
}

/* Updated Trigger */
window.requestBlood = function(bankName) {
  const main = document.getElementById("mainContent") || document.getElementById("main-content");
  if (main) {
    main.innerHTML = renderBloodDeliveryTrackingView(bankName, BLOOD_STATE.group);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
};

window.backToBloodBanks = function() {
  refreshBloodBankDOM();
  window.scrollTo({ top: 0, behavior: "instant" });
};