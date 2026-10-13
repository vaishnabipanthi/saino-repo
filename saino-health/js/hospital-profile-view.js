/* ============================================================
   HOSPITAL DIRECTORY & PROFILE VIEW (CLEAN & ERROR-FREE)
   ============================================================ */

/* 1. Directory View (List Page): hospital / clinic / diagnostic / wellness / insurance
   Sab categories ke liye ek hi function. Left side filters category ke hisaab se badalte hain. */

/* ---------- Icons (inline SVG, kabhi change nahi hote) ---------- */
const DIRECTORY_ICON = (d, cls = "w-4 h-4") =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${d}</svg>`;

const DIRECTORY_ICONS = {
  location: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  distance: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  speciality: '<path d="M6 3v6a4 4 0 0 0 8 0V3"/><path d="M10 13v2a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="11" r="2"/>',
  services: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  availability: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  saino: '<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  rating: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L8 14.2 3 9.3l6.9-1L12 2Z"/>',
  facilities: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
  tests: '<path d="M10 2v7.5L4.5 19a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L14 9.5V2"/><path d="M8.5 2h7"/>',
  fee: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/>',
  plan: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  rotate: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
};

/* ---------- Category info ---------- */
const DIRECTORY_META = {
  hospital:   { title: "Hospitals",          plural: "Hospitals",          desc: "Find hospitals and healthcare facilities based on your needs.", fee: ["Consultation Fee", "Rs. 4,000"] },
  clinic:     { title: "Clinics",            plural: "Clinics",            desc: "Find verified clinics and specialist OPD consultations.",       fee: ["Consultation Fee", "Rs. 1,000"] },
  diagnostic: { title: "Diagnostic Centers", plural: "Diagnostic Centers", desc: "Find certified pathology labs, blood tests, and scans.",       fee: ["Tests starting from", "Rs. 500"] },
  wellness:   { title: "Wellness Centers",   plural: "Wellness Centers",   desc: "Find yoga, physiotherapy, and wellness retreats.",             fee: ["Sessions starting from", "Rs. 1,500"] },
  insurance:  { title: "Health Insurance",   plural: "Insurance Providers", desc: "Explore medical coverage and health insurance policies.",      fee: ["Premium starting from", "Rs. 5,000 / yr"] },
};

/* ---------- Filters: option = [value, label, keywords?, "pass"?] ---------- */
const DIRECTORY_COMMON = {
  location: { id: "location", title: "Location", icon: "location", kind: "location",
    options: [["Kathmandu", "Kathmandu"], ["Lalitpur", "Lalitpur"], ["Bhaktapur", "Bhaktapur"], ["Pokhara", "Pokhara"]] },
  distance: { id: "distance", title: "Distance", icon: "distance", kind: "distance",
    options: [["2", "Within 2 km"], ["5", "Within 5 km"], ["8", "Within 8 km"], ["10", "Within 10 km"], ["15", "Within 15 km"]] },
  saino: { id: "saino", title: "SAINO Status", icon: "saino", kind: "saino",
    options: [["verified", "Verified Partner"], ["featured", "Featured"]] },
  rating: { id: "rating", title: "Rating", icon: "rating", kind: "rating",
    options: [["4", "4 Stars & Above"], ["3", "3 Stars & Above"]] },
};
const dirText = (id, title, icon, options) => ({ id, title, icon, kind: "text", options });
const C = DIRECTORY_COMMON;

const DIRECTORY_FILTERS = {
  hospital: [
    C.location, C.distance,
    dirText("speciality", "Speciality / Treatment", "speciality", [
      ["Cardiology", "Cardiology"], ["Neurology", "Neurology"], ["Orthopedics", "Orthopedics", ["orthopedic", "ortho"]],
      ["Pediatrics", "Pediatrics", ["pediatric", "paediatric"]], ["General Surgery", "General Surgery", ["surgery"]]]),
    dirText("services", "Services", "services", [
      ["Emergency", "Emergency Care", ["emergency"]], ["ICU", "ICU / NICU", ["icu", "nicu"]],
      ["Pharmacy", "24/7 Pharmacy", ["pharmacy"]], ["Laboratory", "Laboratory & Diagnostics", ["laborator", "diagnostic", "pathology"]]]),
    dirText("availability", "Availability", "availability", [
      ["24_7", "Open 24/7", ["24/7", "24x7", "24 hours"]], ["today", "Available Today", [], "pass"]]),
    C.saino, C.rating,
    dirText("insurance", "Insurance", "plan", [
      ["government", "Government Insurance / Health Scheme", ["government", "health scheme"]],
      ["private", "Private Insurance Accepted", ["private insurance", "insurance"]]]),
    dirText("facilities", "Facilities", "facilities", [
      ["parking", "Parking Available", ["parking"]], ["cafeteria", "Cafeteria", ["cafeteria", "canteen"]], ["atm", "ATM", ["atm"]]]),
    dirText("type", "Hospital Type", "facilities", [
      ["government", "Government / Public", ["government", "public"]], ["private", "Private", ["private"]],
      ["community", "Community / Trust", ["community", "trust"]]]),
  ],
  clinic: [
    C.location, C.distance,
    dirText("speciality", "Speciality", "speciality", [
      ["General Physician", "General Physician", ["general", "physician"]], ["Dental", "Dental", ["dental", "dentist"]],
      ["Dermatology", "Dermatology", ["dermat", "skin"]], ["Pediatrics", "Pediatrics", ["pediatric", "paediatric"]],
      ["Gynecology", "Gynecology", ["gynec", "gynaec"]], ["ENT", "ENT", ["ent", "ear nose"]], ["Eye", "Eye Care", ["eye", "ophthal"]]]),
    dirText("availability", "Availability", "availability", [
      ["open_now", "Open Now", [], "pass"], ["evening", "Evening OPD", ["evening", "pm"]], ["weekend", "Open on Weekends", ["sat", "sun", "weekend"]]]),
    dirText("fee", "Consultation Fee", "fee", [
      ["fee_low", "Under Rs. 500", ["under 500"]], ["fee_mid", "Rs. 500 – 1,000", ["500"]], ["fee_high", "Above Rs. 1,000", ["above 1000"]]]),
    C.saino, C.rating,
    dirText("insurance", "Insurance", "plan", [
      ["government", "Government Insurance / Health Scheme", ["government", "health scheme"]],
      ["private", "Private Insurance Accepted", ["private insurance", "insurance"]]]),
  ],
  diagnostic: [
    C.location, C.distance,
    dirText("tests", "Tests & Scans", "tests", [
      ["Blood", "Blood Tests / Pathology", ["blood", "pathology"]], ["X-Ray", "X-Ray", ["x-ray", "xray", "x ray"]],
      ["MRI", "MRI", ["mri"]], ["CT", "CT Scan", ["ct scan", "ct"]], ["Ultrasound", "Ultrasound", ["ultrasound", "usg"]], ["ECG", "ECG", ["ecg", "ekg"]]]),
    dirText("services", "Services", "services", [
      ["home_sample", "Home Sample Collection", ["home sample", "home collection"]], ["online_report", "Online Reports", ["online report", "report"]],
      ["packages", "Health Packages", ["package"]], ["24_7", "Open 24/7", ["24/7", "24x7", "24 hours"]]]),
    dirText("accreditation", "Accreditation", "saino", [
      ["nabl", "NABL Accredited", ["nabl"]], ["iso", "ISO Certified", ["iso"]]]),
    C.saino, C.rating,
  ],
  wellness: [
    C.location, C.distance,
    dirText("services", "Services", "services", [
      ["Yoga", "Yoga", ["yoga"]], ["Physio", "Physiotherapy", ["physio"]], ["Ayurveda", "Ayurveda", ["ayurved"]],
      ["Spa", "Spa & Massage", ["spa", "massage"]], ["Meditation", "Meditation", ["meditat"]], ["Nutrition", "Nutrition & Diet", ["nutrition", "diet"]]]),
    dirText("facilities", "Facilities", "facilities", [
      ["steam", "Steam / Sauna", ["steam", "sauna"]], ["parking", "Parking Available", ["parking"]], ["female", "Female-only Sessions", ["female", "women"]]]),
    dirText("availability", "Availability", "availability", [
      ["open_now", "Open Now", [], "pass"], ["weekend", "Open on Weekends", ["sat", "sun", "weekend"]]]),
    C.saino, C.rating,
  ],
  insurance: [
    C.location,
    dirText("plan", "Plan Type", "plan", [
      ["individual", "Individual", ["individual"]], ["family", "Family Floater", ["family"]],
      ["senior", "Senior Citizen", ["senior"]], ["critical", "Critical Illness", ["critical"]]]),
    dirText("coverage", "Coverage", "fee", [
      ["cov_5", "Up to Rs. 5 lakh", ["5 lakh", "500000"]], ["cov_10", "Rs. 5 – 10 lakh", ["10 lakh", "1000000"]], ["cov_high", "Above Rs. 10 lakh", ["above 10 lakh", "20 lakh", "25 lakh"]]]),
    dirText("features", "Features", "services", [
      ["cashless", "Cashless Hospitals", ["cashless"]], ["claim", "Claim Support", ["claim"]],
      ["maternity", "Maternity Cover", ["maternity"]], ["preexisting", "Pre-existing Disease Cover", ["pre-existing", "preexisting"]]]),
    C.saino, C.rating,
  ],
};

/* ---------- Helpers ---------- */
function directoryAllProviders() {
  return (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
}
function directoryFindProvider(id) {
  const key = String(id).toLowerCase();
  return directoryAllProviders().find(p => p && ((p.id && String(p.id).toLowerCase() === key) || (p.name && p.name.toLowerCase() === key)));
}
function directoryNorm(s) { return String(s || "").toLowerCase(); }

const DIRECTORY_BLOBS = new WeakMap();
function directoryBlob(p) {
  if (!DIRECTORY_BLOBS.has(p)) {
    let t = ""; try { t = JSON.stringify(p).toLowerCase(); } catch (e) {}
    DIRECTORY_BLOBS.set(p, t);
  }
  return DIRECTORY_BLOBS.get(p);
}
function directoryIsVerified(p) {
  const v = directoryNorm(p.verification);
  return !!(p.isVerified || p.is_verified || ["verified", "pro", "prime", "vip", "vvip"].includes(v));
}
function directoryIsFeatured(p) {
  const v = directoryNorm(p.verification);
  return !!(p.featured || v === "vip" || v === "vvip");
}
function directoryHaversine(lat1, lng1, lat2, lng2) {
  const R = 6371, rad = d => d * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// Asli distance (location + lat/lng se). Data na ho to null (fake 5km nahi dikhayenge)
function directoryDistanceKm(p) {
  const lat = parseFloat(p.lat ?? p.latitude), lng = parseFloat(p.lng ?? p.longitude);
  const o = window.USER_LOCATION;
  if (o && !isNaN(lat) && !isNaN(lng)) return directoryHaversine(o.lat, o.lng, lat, lng);
  const direct = parseFloat(String(p.distance ?? "").replace(/[^\d.]/g, ""));
  return isNaN(direct) ? null : direct;
}

function directoryMatchGroup(p, group, values) {
  if (!values.length) return true;                                 // is group mein kuch tick nahi = koi rok nahi
  switch (group.kind) {
    case "location": {
      const loc = directoryNorm([p.location, p.address, p.city].filter(Boolean).join(" "));
      return values.some(v => loc.includes(v.toLowerCase()));
    }
    case "distance": {
      const d = directoryDistanceKm(p);
      return d === null ? true : d <= Math.max(...values.map(Number));
    }
    case "rating": {
      const r = parseFloat(p.rating);
      return (isNaN(r) ? 0 : r) >= Math.min(...values.map(Number));
    }
    case "saino":
      return values.some(v => (v === "verified" ? directoryIsVerified(p) : directoryIsFeatured(p)));
    default: {
      const blob = directoryBlob(p);
      return values.some(v => {
        const opt = group.options.find(o => o[0] === v);
        if (opt && opt[3] === "pass") return true;                 // data nahi hai to rok nahi lagate
        const kws = (opt && opt[2] && opt[2].length) ? opt[2] : [(opt ? opt[1] : v).toLowerCase()];
        return kws.some(k => blob.includes(k.toLowerCase()));
      });
    }
  }
}

/* ---------- Sidebar + Card HTML ---------- */
function directorySidebarHTML(groups) {
  return groups.map(g => `
    <div class="border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
      <button type="button" onclick="toggleDirectoryFilter('${g.id}')"
        class="w-full flex items-center justify-between gap-2 py-1 text-sm font-semibold text-slate-900">
        <span class="flex items-center gap-2">
          <span class="text-slate-700 shrink-0">${DIRECTORY_ICON(DIRECTORY_ICONS[g.icon] || DIRECTORY_ICONS.services)}</span>
          <span>${g.title}</span>
        </span>
        <span id="directory-arrow-${g.id}" class="text-slate-500 transition-transform duration-200 shrink-0">${DIRECTORY_ICON(DIRECTORY_ICONS.chevron)}</span>
      </button>
      <div id="directory-options-${g.id}" class="hidden mt-3 space-y-2.5">
        ${g.options.map(o => `
          <label class="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="checkbox" data-filter-group="${g.id}" value="${o[0]}" class="w-4 h-4 accent-red-700 rounded shrink-0">
            <span>${o[1]}</span>
          </label>`).join("")}
      </div>
    </div>`).join("");
}

const DIRECTORY_PILL = "bg-slate-100 text-slate-900 px-3.5 py-1.5 rounded-xl text-xs font-bold";

function directoryCardHTML(p, index, categoryType) {
  const meta = DIRECTORY_META[categoryType] || DIRECTORY_META.hospital;
  const id = p.id || p.name || "provider";
  const name = p.name || meta.title.slice(0, -1);
  const imgSrc = p.image || "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=500&q=80";
  const rating = p.rating || "4.7";
  const location = p.location || p.address || "Kathmandu";
  const opd = p.opd || p.openingHours || "Mon–Sat, 9:30 AM – 6:00 PM";
  const phone = p.phone || "+977-9876543329";
  const deps = Array.isArray(p.departments) ? p.departments : [];
  const fee = p.consultationFee || p.fee || meta.fee[1];
  const heart = (typeof savedHeartButton === "function")
    ? savedHeartButton(id)
    : "";
  const safeId = String(id).replace(/'/g, "\\'");

  return `
    <div data-directory-card data-provider-id="${id}" class="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-[13rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)_13rem] gap-4">

        <!-- Image -->
        <button type="button" onclick="openProviderProfile('${safeId}')" aria-label="Open ${name}"
          class="block w-full h-48 md:h-56 lg:h-60 self-start rounded-xl overflow-hidden bg-slate-100">
          <img src="${imgSrc}" alt="${name}" class="w-full h-full object-cover">
        </button>

        <!-- Info -->
        <div class="min-w-0 border border-slate-200 rounded-2xl p-4 flex flex-col">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h2 class="text-xl lg:text-2xl font-bold text-slate-900 min-w-0">
              <button type="button" onclick="openProviderProfile('${safeId}')" class="text-left hover:text-red-700 transition">${name}</button>
            </h2>
            ${typeof window.renderSainoTierBadge === "function"
              ? window.renderSainoTierBadge(p, true)
              : `<span class="flex items-center gap-1 text-emerald-700 text-xs font-medium whitespace-nowrap shrink-0">Saino Verified</span>`}
          </div>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mb-2">
            <span class="flex items-center gap-1 text-amber-500 font-bold">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.3-6.2 3.3L8 14.2 3 9.3l6.9-1L12 2Z"/></svg>
              ${rating}
            </span>
            <button type="button" onclick="openProviderReviews('${safeId}')" class="font-medium hover:text-red-700 hover:underline">Reviews</button>
            <button type="button" onclick="goToHospitalDiscussions('${safeId}')" class="flex items-center gap-1 font-medium hover:text-red-700 hover:underline">
              ${DIRECTORY_ICON(DIRECTORY_ICONS.chat, "w-4 h-4 text-slate-500")}
              Discussions
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-3 text-sm mb-2 font-semibold">
            <span class="text-emerald-700 flex items-center gap-1">
              ${DIRECTORY_ICON(DIRECTORY_ICONS.clock, "w-4 h-4 text-emerald-600")} Open Now
            </span>
            ${categoryType === "hospital" ? `
            <span class="flex items-center gap-1 text-red-700 font-bold">
              <svg class="w-5 h-5 text-red-600 -scale-x-100" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8a2 2 0 0 1 2-2h8a1 1 0 0 1 1 1v1h2.4a2 2 0 0 1 1.7.95l2.1 3.4a2 2 0 0 1 .3 1.05V16a1 1 0 0 1-1 1h-.6a2.5 2.5 0 0 1-4.8 0H9.4a2.5 2.5 0 0 1-4.8 0H4a1 1 0 0 1-1-1V8Z"/>
                <circle cx="7" cy="17.5" r="1.5" fill="#fff"/><circle cx="17" cy="17.5" r="1.5" fill="#fff"/>
              </svg>
              24/7 Emergency
            </span>` : ""}
          </div>

          <div class="text-slate-600 text-sm mb-1 font-medium">
            ${location}<span data-distance-for="${id}" class="text-slate-500"></span>
          </div>
          <div class="text-slate-700 text-sm font-semibold mb-1">OPD: ${opd}</div>
          <div class="text-slate-800 text-sm font-bold mb-3">${phone}</div>

          <!-- Departments (pehle 3 aur baaki ke pills ek jaise) -->
          <div class="flex flex-wrap items-center gap-2 mt-auto">
            ${deps.slice(0, 3).map(d => `<span class="${DIRECTORY_PILL}">${d}</span>`).join("")}
            <div id="extra-deps-${index}" class="hidden flex-wrap gap-2">
              ${deps.slice(3).map(d => `<span class="${DIRECTORY_PILL}">${d}</span>`).join("")}
            </div>
            ${deps.length > 3 ? `
              <button type="button" onclick="toggleDepartments(${index})" id="more-btn-${index}"
                class="bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full text-xs font-bold hover:bg-slate-300 transition">
                +${deps.length - 3}
              </button>` : ""}
          </div>
        </div>

        <!-- Actions -->
        <div class="md:col-span-2 lg:col-span-1 flex flex-col sm:flex-row lg:flex-col gap-3 sm:items-center lg:items-stretch justify-between">
          <div class="flex lg:flex-col items-center lg:items-stretch justify-between gap-3">
            <div class="flex items-center gap-3 text-slate-700 lg:justify-end lg:mb-4 order-2 lg:order-1">
              <button type="button" class="hover:text-red-700 transition" aria-label="Share">${DIRECTORY_ICON(DIRECTORY_ICONS.share, "w-5 h-5")}</button>
              ${heart}
            </div>
            <div class="order-1 lg:order-2">
              <div class="text-xs text-slate-500">${meta.fee[0]}</div>
              <div class="text-sm font-bold">${fee}</div>
            </div>
          </div>
          <div class="flex flex-col gap-3 sm:w-56 lg:w-full">
            <button type="button" onclick="openAppointmentBooking('${safeId}')"
              class="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-4 py-3 rounded-xl transition shadow-sm">
              ${DIRECTORY_ICON(DIRECTORY_ICONS.calendar, "w-5 h-5")} Book appointment
            </button>
            <button type="button" onclick="openProviderProfile('${safeId}')"
              class="w-full border border-red-700 text-red-700 hover:bg-red-50 py-3 rounded-xl font-semibold text-sm transition">
              View Profile
            </button>
          </div>
        </div>

      </div>
    </div>`;
}

/* ---------- Page ---------- */
function renderHospitalDirectoryView(categoryType = "hospital") {
  categoryType = String(categoryType || "hospital").toLowerCase();
  if (!DIRECTORY_META[categoryType]) categoryType = "hospital";
  window.__directoryCategory = categoryType;

  const meta = DIRECTORY_META[categoryType];
  const groups = DIRECTORY_FILTERS[categoryType];
  const list = directoryAllProviders().filter(p => p && directoryNorm(p.category) === categoryType);

  setTimeout(() => {                                   // HTML page par lagne ke baad
    if (typeof directoryRefreshDistances === "function") directoryRefreshDistances();
    if (typeof directoryEnsureUserLocation === "function") directoryEnsureUserLocation();
  }, 0);

  return `
    <div class="max-w-7xl mx-auto px-4 py-4" style="zoom: 0.85;">

      <!-- Header -->
      <div class="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <button type="button" onclick="navigateTo('marketplace')"
            class="flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline mb-2">
            ← Back to Marketplace
          </button>
          <h1 class="text-2xl sm:text-3xl font-black">${meta.title}</h1>
          <p class="text-slate-500 text-sm">${meta.desc}</p>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" onclick="clearAllFilters()" class="text-red-600 text-sm font-semibold hover:underline">Clear Filters</button>
          <select class="border rounded-lg px-3 py-2 text-sm">
            <option>Recommended</option>
          </select>
        </div>
      </div>

      <!-- Mobile: filters button -->
      <button type="button" onclick="toggleDirectoryFilterPanel()"
        class="md:hidden w-full flex items-center justify-center gap-2 mb-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-800">
        ${DIRECTORY_ICON(DIRECTORY_ICONS.filter)} Filters
      </button>

      <!-- Layout -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6 items-start">

        <!-- Left Filter Sidebar -->
        <div class="col-span-1 md:col-span-4 lg:col-span-3">
          <div id="directory-filter-panel" data-category="${categoryType}" class="hidden md:block bg-white border rounded-xl p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold">Filters</h3>
              <button type="button" onclick="clearAllFilters()" class="text-red-600 text-sm font-semibold hover:underline">Clear All</button>
            </div>
            <div class="space-y-4">
              ${directorySidebarHTML(groups)}
            </div>
            <div class="mt-5 pt-2">
              <button type="button" onclick="clearAllFilters()"
                class="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition text-sm">
                ${DIRECTORY_ICON(DIRECTORY_ICONS.rotate)} Clear all filters
              </button>
            </div>
          </div>
        </div>

        <!-- Right Content List -->
        <div id="directory-results" class="col-span-1 md:col-span-8 lg:col-span-9 space-y-4 min-w-0">
          <div id="directory-count" class="text-sm font-semibold text-slate-700">${list.length} ${meta.plural} found</div>
          ${list.map((p, index) => directoryCardHTML(p, index, categoryType)).join("")}
          <div id="directory-empty" class="${list.length === 0 ? "" : "hidden "}bg-white border rounded-xl p-10 text-center text-slate-500 font-medium">
            No ${meta.plural.toLowerCase()} found.
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================
   PRACTO-STYLE DETAILED CLINIC & DOCTOR PROFILE ENGINE
   (Matches Uploaded Docx & Practo Screenshots 2, 4, 7, 8)
   ============================================================ */
function renderHospitalProfileView(providerId) {
  const allProviders = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  
  // Find real provider from database or fallback to CityCare
  const p = (typeof directoryFindProvider === "function" ? directoryFindProvider(providerId) : null) ||
    allProviders.find(x => x && (String(x.id).toLowerCase() === String(providerId).toLowerCase() || String(x.name).toLowerCase() === String(providerId).toLowerCase())) ||
    {
      id: providerId,
      name: "CityCare Multispeciality Hospital",
      provider_type: "hospital",
      rating: "4.8",
      reviewsCount: 842,
      location: "Civil Lines, Raipur, Chhattisgarh",
      phone: "+91 98765 43210",
      cover_image_url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
      logo_url: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=200&q=80",
      description: "Premier multi-speciality healthcare facility in Chhattisgarh equipped with 24/7 emergency, digital OPD tokens, advanced diagnostics, and specialist care.",
      doctors: [
        {
          id: "doc-1",
          name: "Dr. Aayush Sharma",
          qualification: "MBBS, MD, DM (Cardiology)",
          department: "Senior Consultant Interventional Cardiologist",
          experience_years: 15,
          avatar_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
          opd_fee: 650,
          shift_timings: "10:00 AM - 01:00 PM, 05:00 PM - 08:00 PM",
          stories_pct: 97,
          stories_count: 512
        },
        {
          id: "doc-2",
          name: "Dr. Sunita Verma",
          qualification: "MBBS, MS (Orthopedics)",
          department: "Consultant Joint Replacement Surgeon",
          experience_years: 12,
          avatar_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80",
          opd_fee: 500,
          shift_timings: "11:00 AM - 02:00 PM",
          stories_pct: 95,
          stories_count: 328
        }
      ]
    };

  const name = p.name || "Healthcare Facility";
  const coverImg = p.cover_image_url || p.image || "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80";
  const logoImg = p.logo_url || p.logo || "assets/logo.png";
  const locationText = p.address || p.location || "Civil Lines, Raipur, Chhattisgarh";
  const ratingText = p.rating || "4.8";
  const reviewsCount = p.reviewsCount || p.reviews || 842;
  const isSolo = p.provider_type === "solo_doctor" || (p.doctors && p.doctors.length === 1);

  // Doctors list (Photo, Degrees, 15 yrs exp, ₹ Fees)
  const docs = (Array.isArray(p.doctors) && p.doctors.length) ? p.doctors : [
    {
      id: "doc-def",
      name: p.leadDoctor || "Dr. Rajesh Verma",
      qualification: "MBBS, MD",
      department: p.leadDoctorRole || "Senior Consultant Physician",
      experience_years: 14,
      avatar_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80",
      opd_fee: 500,
      shift_timings: "10:00 AM - 01:00 PM, 05:00 PM - 08:00 PM",
      stories_pct: 96,
      stories_count: 410
    }
  ];

  // Render Doctor Cards (Matches Practo Screenshot 7 & 8)
  const doctorsHtml = docs.map(d => `
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-4">
      <div class="flex items-start gap-4 text-left">
        <div class="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
          <img src="${d.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'}" alt="${d.name}" class="w-full h-full object-cover">
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-extrabold text-base text-slate-900">${d.name}</h3>
            <span class="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">✓ Medical Reg. Verified</span>
          </div>
          <p class="text-xs text-slate-600 font-medium mt-0.5">${d.qualification || 'MBBS, MD'} • <span class="text-slate-900 font-bold">${d.department || 'General Medicine'}</span></p>
          <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1.5">
            <span class="font-bold text-slate-700">${d.experience_years || 10} Years Experience</span>
            <span>•</span>
            <span class="text-emerald-700 font-bold">👍 ${d.stories_pct || 96}% (${d.stories_count || 120} Patient Stories)</span>
          </div>
          <div class="text-[11px] text-slate-500 mt-1">
            <span>🕒 Timings: <strong>${d.shift_timings || '10:00 AM - 01:00 PM'}</strong></span>
          </div>
        </div>
      </div>

      <div class="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3 shrink-0">
        <div class="text-left md:text-right">
          <div class="text-xl font-black text-slate-900">₹${d.opd_fee || 500}</div>
          <div class="text-[10px] text-slate-400 font-semibold">Consultation Fee</div>
        </div>
        <div class="flex gap-2 w-full md:w-auto">
          <button onclick="if(typeof openBookingWhatsApp==='function'){openBookingWhatsApp('${p.id}');}else{alert('Connecting video consult...');}" class="px-3.5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition">
            📹 Video Consult
          </button>
          <button onclick="if(typeof openAppointmentBooking==='function'){openAppointmentBooking('${p.id}', '${d.name}', '${d.department}');}else{alert('Opening OPD booking...');}" class="px-5 py-2.5 bg-[#ad0b0e] hover:bg-[#8f080b] text-white font-extrabold rounded-xl text-xs shadow-md transition">
            ⚡ Book Clinic Visit
          </button>
        </div>
      </div>
    </div>
  `).join("");

  return `
    <div class="bg-slate-50 min-h-screen pb-16 text-slate-900">
      
      <!-- Back Button & Breadcrumbs -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-5">
        <div class="flex items-center justify-between mb-3 text-xs">
          <button onclick="if(typeof returnToProviderSource==='function'){returnToProviderSource();}else{navigateTo('marketplace');}" class="text-slate-600 hover:text-[#ad0b0e] font-bold flex items-center gap-1 transition">
            <span>← Back to previous page</span>
          </button>
          <span class="text-slate-400">Home › Healthcare Providers › <strong class="text-slate-800">${name}</strong></span>
        </div>

        <!-- 1. FULL COVER BANNER & OVERLAPPING LOGO (Practo Screenshot 4) -->
        <div class="relative w-full rounded-3xl overflow-hidden bg-slate-900 shadow-md" style="min-height: 250px;">
          <div class="absolute inset-0 bg-cover bg-center" style="background-image: url('${coverImg}');">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent"></div>
          </div>

          <div class="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5 h-full pt-16">
            <div class="flex items-center gap-4 text-left">
              <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white shrink-0">
                <img src="${logoImg}" alt="${name}" class="w-full h-full object-cover">
              </div>
              <div class="text-white">
                <div class="flex items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-black text-white">${name}</h1>
                  <span class="bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">✓ Verified</span>
                </div>
                <p class="text-xs text-slate-200 mt-1 flex items-center gap-1">
                  <span>📍</span> ${locationText}
                </p>
                <div class="flex items-center gap-3 text-xs mt-1.5 text-amber-300 font-bold">
                  <span>★ ${ratingText} (${reviewsCount} reviews)</span>
                  <span class="text-slate-300 font-normal">• 🕒 Open Today (10:00 AM - 08:00 PM)</span>
                </div>
              </div>
            </div>

            <!-- Direction & QR Standee Buttons -->
            <div class="flex items-center gap-2">
              <button onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(name + ' ' + locationText)}', '_blank')" class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl text-xs font-bold transition">
                📍 Get Directions
              </button>
              <button onclick="alert('Standee QR: Scan at reception to book instant token without standing in queue.')" class="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 transition">
                📱 Reception QR
              </button>
            </div>
          </div>
        </div>

        <!-- 2. PRACTO SUB-NAV TABS -->
        <div class="flex items-center gap-6 border-b border-slate-200 mt-6 pb-3 text-xs font-bold text-slate-600">
          <button class="text-[#ad0b0e] border-b-2 border-[#ad0b0e] pb-3 -mb-3 font-extrabold">Overview</button>
          <button onclick="document.getElementById('profileDoctorsSec')?.scrollIntoView({behavior:'smooth'})" class="hover:text-slate-900 transition">Doctors (${docs.length})</button>
          <button onclick="if(typeof openProviderReviews==='function'){openProviderReviews('${p.id}');}" class="hover:text-slate-900 transition">Patient Stories &amp; Reviews</button>
        </div>

        <!-- 3. MAIN SECTION: CLINIC DETAILS + DOCTORS -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          
          <!-- Left: About & Doctors -->
          <div class="lg:col-span-2 space-y-6 text-left">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h2 class="font-extrabold text-sm text-slate-900 mb-2">About ${name}</h2>
              <p class="text-xs text-slate-600 leading-relaxed">${p.about || p.description || 'Verified healthcare facility offering comprehensive medical services and digital queue token tracking.'}</p>
            </div>

            <div id="profileDoctorsSec">
              <h2 class="text-base font-extrabold text-slate-900 mb-1">
                ${isSolo ? 'Consulting Specialist' : 'Doctors & Specialists Available'}
              </h2>
              <p class="text-xs text-slate-500 mb-4">Select doctor to book confirmed in-person OPD token or video consultation.</p>
              ${doctorsHtml}
            </div>
          </div>

          <!-- Right: Timings & Helpline -->
          <div class="space-y-4 text-left">
            <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 class="font-bold text-xs uppercase tracking-wider text-slate-500">Facility Information</h3>
              <div>
                <div class="text-xs font-bold text-slate-900">OPD Timings</div>
                <div class="text-xs text-slate-600 mt-0.5">Mon - Sat: 10:00 AM - 08:00 PM</div>
                <div class="text-xs text-slate-400">Sunday: Emergency On-Call</div>
              </div>
              <div class="pt-2 border-t border-slate-100">
                <div class="text-xs font-bold text-slate-900">Helpline Phone</div>
                <div class="text-xs text-slate-600 mt-0.5">${p.phone || '+91 98765 43210'}</div>
              </div>
              <div class="pt-2 border-t border-slate-100">
                <div class="text-xs font-bold text-emerald-700">Live Queue Enabled</div>
                <div class="text-[11px] text-slate-500 mt-0.5">Track live OPD waiting time directly on SAINO portal.</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;
}
/* 3. Global Click Handlers */
window.renderHospitalDirectoryView = renderHospitalDirectoryView;
window.renderHospitalProfileView = renderHospitalProfileView;

window.openProviderProfile = function(providerId) {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (!main) return;
  if (typeof window.captureProviderReturnView === "function") window.captureProviderReturnView();
  const p = directoryFindProvider(providerId);
  const cat = directoryNorm(p && p.category);
  const useClinic = cat === "clinic" && typeof window.renderClinicProfileView === "function";
  main.innerHTML = useClinic ? window.renderClinicProfileView(providerId) : renderHospitalProfileView(providerId);
  const hero = document.getElementById("heroHomeSection");
  if (hero) hero.style.display = "none";
  window.scrollTo({ top: 0, behavior: "instant" });
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
};
window.openHospitalProfile = window.openProviderProfile;
window.openClinicProfile = window.openProviderProfile;
window.openDiagnosticProfile = window.openProviderProfile;
window.openWellnessProfile = window.openProviderProfile;
window.openInsuranceProfile = window.openHospitalProfile;

// Reviews par click: profile khulta hai aur seedha Reviews section par scroll hota hai
window.openProviderReviews = function(providerId) {
  const hasReturnView = typeof window.captureProviderReturnView === "function" && window.captureProviderReturnView();
  window.openProviderProfile(providerId);
  setTimeout(function() {
    const el = document.getElementById("profile-reviews");
    if (!el) return;
    if (hasReturnView && typeof window.returnToProviderSource === "function" && !el.querySelector("[data-review-return]")) {
      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.setAttribute("data-review-return", "true");
      backButton.className = "mb-4 text-sm font-semibold text-slate-600 hover:text-red-700";
      backButton.textContent = "← Back to previous page";
      backButton.addEventListener("click", window.returnToProviderSource);
      el.insertBefore(backButton, el.firstChild);
    }
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
};


window.renderClinicDirectoryView = () => renderHospitalDirectoryView('clinic');
window.renderDiagnosticDirectoryView = () => renderHospitalDirectoryView('diagnostic');
window.renderWellnessDirectoryView = () => renderHospitalDirectoryView('wellness');
window.renderInsuranceDirectoryView = () => renderHospitalDirectoryView('insurance');

window.openCategoryPage = function(categoryName) {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = renderHospitalDirectoryView(categoryName);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
};

window.backToHospitalList = function() {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = renderHospitalDirectoryView(window.__directoryCategory || "hospital");
    window.scrollTo({ top: 0, behavior: "instant" });
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
};

window.toggleDepartments = function(index) {
  const extraDeps = document.getElementById(`extra-deps-${index}`);
  const moreBtn = document.getElementById(`more-btn-${index}`);
  if (!extraDeps || !moreBtn) return;

  const isHidden = extraDeps.classList.toggle('hidden');
  extraDeps.classList.toggle('flex', !isHidden);

  moreBtn.textContent = isHidden ? `+${extraDeps.children.length}` : 'Show less';
};
/* ============================================================
   HOSPITAL APPOINTMENT BOOKING VIEW (FULLY DYNAMIC & REACTIVE)
   ============================================================ */

window.BOOKING_STATE = {
  bookingType: "appointment",
  hospitalName: "Norvic Hospital",
  doctorName: "Dr. Aayush Shrestha",
  doctorRole: "Senior Cardiologist",
  doctorAvatar: "AS",
  doctorInitialClass: "bg-red-700 text-white",
  date: "Sept 22, 2026",
  selectedDay: 22,
  timeSlot: "11:30 AM",
  fee: "Rs. 1,000"
};

window.renderAppointmentBookingView = function() {
  const currentProviderName = window.BOOKING_STATE.hospitalName || "Selected Facility";
  const currentDoc = window.BOOKING_STATE.doctorName;
  const currentDay = window.BOOKING_STATE.selectedDay;
  const currentSlot = window.BOOKING_STATE.timeSlot;
  const isDiagnosticPackage = window.BOOKING_STATE.bookingType === "diagnostic-package";
  const providers = (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  const provider = providers.find(item =>
    String(item.id) === String(window.BOOKING_STATE.providerId) ||
    String(item.name) === String(window.BOOKING_STATE.hospitalName)
  );
  const doctorOptions = (provider && Array.isArray(provider.doctors) ? provider.doctors : [])
    .map(doctor => typeof doctor === "string" ? { name: doctor, role: "" } : doctor)
    .filter(doctor => doctor && doctor.name);
  if (provider && Array.isArray(provider.availability)) {
    provider.availability.forEach(availability => {
      const availabilityDoctor = String(availability.doctor || "");
      const doctorName = availabilityDoctor.split(" (")[0].trim();
      const matchedRole = availabilityDoctor.match(/\(([^)]+)\)/);
      if (doctorName && !doctorOptions.some(doctor => doctor.name === doctorName)) {
        doctorOptions.push({
          name: doctorName,
          role: availability.role || availability.specialty || (matchedRole && matchedRole[1]) || ""
        });
      }
    });
  }
  if (provider && provider.leadDoctor && !doctorOptions.some(doctor => doctor.name === provider.leadDoctor)) {
    doctorOptions.unshift({ name: provider.leadDoctor, role: provider.leadDoctorRole || "" });
  }
  if (currentDoc && !doctorOptions.some(doctor => doctor.name === currentDoc)) {
    doctorOptions.unshift({ name: currentDoc, role: window.BOOKING_STATE.doctorRole || "" });
  }
  if (!doctorOptions.length) {
    doctorOptions.push({ name: currentDoc || "Available Doctor", role: window.BOOKING_STATE.doctorRole || "" });
  }
  const safeBookingValue = value => String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/[\r\n]/g, " ");

  return `
    <div id="appointment-booking-container" class="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-24">
      
      <!-- Top Breadcrumb & Header -->
      <div class="bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <nav class="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
            <button type="button" onclick="navigateTo('marketplace')" class="hover:text-slate-600">Home</button>
            <span>›</span>
            <span class="text-red-700 font-semibold">${isDiagnosticPackage ? "Book Diagnostic Package" : "Book Appointment"}</span>
          </nav>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700 font-black text-sm">
                ${currentProviderName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl font-bold text-slate-900 leading-tight">${currentProviderName}</h1>
                  <span class="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Saino Verified
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">${window.BOOKING_STATE.location || "Kathmandu"}</p>
              </div>
            </div>

            <button type="button" onclick="returnToProviderSource()" class="text-xs font-semibold text-slate-600 hover:text-red-700 flex items-center gap-1">
              ← Back
            </button>
          </div>
        </div>
      </div>

      <!-- Main Booking Layout -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- LEFT COLUMN -->
          <div class="lg:col-span-8 space-y-6">

            <!-- 1. Choose an Available Doctor -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 class="text-sm font-bold text-slate-900 mb-4">${isDiagnosticPackage ? "1. Selected Diagnostic Package" : "1. Choose an Available Doctor"}</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" style="display:${isDiagnosticPackage ? "none" : "grid"}">
                ${doctorOptions.map(doctor => {
                  const selected = doctor.name === currentDoc;
                  const safeName = safeBookingValue(doctor.name);
                  const safeRole = safeBookingValue(doctor.role || "Consultant");
                  return `
                    <button type="button"
                            data-booking-doctor
                            data-doctor="${safeBookingValue(doctor.name)}"
                            aria-pressed="${selected}"
                            onclick="selectBookingDoctor('${safeName}', '${safeRole}')"
                            class="w-full text-left cursor-pointer rounded-2xl p-4 relative transition ${selected ? 'border-2 border-red-600 bg-red-50/20' : 'border border-slate-200 bg-white hover:border-slate-300'}">
                      <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                          ${window.renderUserProfileIcon("w-12 h-12", "w-6 h-6")}
                          <div>
                            <h3 class="text-xs font-bold text-slate-900">${doctor.name}</h3>
                            <p class="text-[11px] text-slate-500">${doctor.role || "Consultant"}</p>
                          </div>
                        </div>
                        <span data-doctor-radio class="w-4 h-4 rounded-full border-2 ${selected ? 'border-red-700' : 'border-slate-300'} flex items-center justify-center">
                          <span class="w-2 h-2 rounded-full bg-red-700 ${selected ? '' : 'hidden'}"></span>
                        </span>
                      </div>
                      ${doctor.experience ? `<p class="mt-3 text-[11px] text-slate-500">Experience: <strong class="text-slate-700">${doctor.experience}</strong></p>` : ""}
                    </button>
                  `;
                }).join("")}
              </div>
              ${isDiagnosticPackage ? `
                <div class="rounded-xl border border-red-100 bg-red-50/60 p-4">
                  <h3 class="text-sm font-bold text-slate-900">${window.BOOKING_STATE.packageTitle}</h3>
                  <p class="text-xs text-slate-600 mt-1">${window.BOOKING_STATE.packageTests}</p>
                  <p class="text-xs font-bold text-red-700 mt-2">${window.BOOKING_STATE.fee}</p>
                  <p class="text-[11px] text-slate-500 mt-1">Partner: ${currentProviderName}</p>
                </div>
              ` : ""}
            </div>

            <!-- 2. Select Date (September 2026) -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 class="text-sm font-bold text-slate-900 mb-4">2. Select Date (September 2026)</h2>
              
              <div class="w-full text-center text-xs">
                <div class="grid grid-cols-7 text-[11px] font-medium text-slate-400 pb-3 border-b border-slate-100">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>

                <div id="calendar-days-container" class="grid grid-cols-7 gap-y-2.5 pt-4 text-xs font-medium text-slate-700">
                  <span class="text-slate-300 py-1.5">31</span>
                  ${Array.from({ length: 30 }, (_, i) => i + 1).map(day => `
                    <button type="button" 
                            data-day="${day}" 
                            onclick="selectBookingDate(${day})" 
                            class="cal-day-btn w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition ${day === currentDay ? 'bg-[#991b1b] text-white font-bold shadow-xs' : 'hover:bg-slate-100 text-slate-700'}">
                      ${day}
                    </button>
                  `).join('')}
                  <span class="text-slate-300 py-1.5">1</span>
                  <span class="text-slate-300 py-1.5">2</span>
                  <span class="text-slate-300 py-1.5">3</span>
                  <span class="text-slate-300 py-1.5">4</span>
                </div>
              </div>
            </div>

            <!-- 3. Choose a Time Slot -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 class="text-sm font-bold text-slate-900">3. Choose a Time Slot</h2>
              
              <!-- Morning -->
              <div>
                <div class="text-[11px] font-semibold text-slate-400 mb-2">Morning Slots</div>
                <div class="flex flex-wrap gap-2.5" id="slots-morning">
                  ${['09:00 AM', '09:30 AM', '10:00 AM', '11:30 AM'].map(time => `
                    <button type="button" 
                            data-slot="${time}" 
                            onclick="selectBookingSlot('${time}')" 
                            class="slot-btn px-4 py-2 rounded-xl text-xs transition ${time === currentSlot ? 'bg-[#991b1b] text-white font-semibold shadow-xs' : 'border border-slate-200 text-slate-700 hover:border-slate-400'}">
                      ${time}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Afternoon -->
              <div>
                <div class="text-[11px] font-semibold text-slate-400 mb-2">Afternoon Slots</div>
                <div class="flex flex-wrap gap-2.5" id="slots-afternoon">
                  ${['02:00 PM', '03:15 PM', '04:30 PM'].map(time => `
                    <button type="button" 
                            data-slot="${time}" 
                            onclick="selectBookingSlot('${time}')" 
                            class="slot-btn px-4 py-2 rounded-xl text-xs transition ${time === currentSlot ? 'bg-[#991b1b] text-white font-semibold shadow-xs' : 'border border-slate-200 text-slate-700 hover:border-slate-400'}">
                      ${time}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Evening -->
              <div>
                <div class="text-[11px] font-semibold text-slate-400 mb-2">Evening Slots</div>
                <div class="flex flex-wrap gap-2.5" id="slots-evening">
                  ${['06:00 PM'].map(time => `
                    <button type="button" 
                            data-slot="${time}" 
                            onclick="selectBookingSlot('${time}')" 
                            class="slot-btn px-4 py-2 rounded-xl text-xs transition ${time === currentSlot ? 'bg-[#991b1b] text-white font-semibold shadow-xs' : 'border border-slate-200 text-slate-700 hover:border-slate-400'}">
                      ${time}
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>

            <!-- 4. Enter Patient Information -->
            <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h2 class="text-sm font-bold text-slate-900">4. Enter Patient Information</h2>
              
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Patient's Full Name</label>
                <input type="text" id="patientName" placeholder="e.g. John Doe" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition">
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input type="tel" id="patientPhone" placeholder="e.g. 98XXXXXXXX" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition">
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input type="email" id="patientEmail" placeholder="e.g. email@saino.com" class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">${isDiagnosticPackage ? "Package notes (optional)" : "Reason for Appointment / Symptoms"}</label>
                <textarea id="patientSymptoms" rows="3" placeholder="Explain symptoms briefly here..." class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition"></textarea>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input type="checkbox" id="consentBox" checked class="w-4 h-4 accent-red-700 rounded cursor-pointer">
                <label for="consentBox" class="text-[11px] text-slate-600 cursor-pointer">
                  I consent to sharing these details with ${currentProviderName} for ${isDiagnosticPackage ? "package booking" : "clinical review"}.
                </label>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: Sticky Booking Summary -->
          <div class="lg:col-span-4 sticky top-6">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 class="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">${isDiagnosticPackage ? "Package Booking Summary" : "Booking Summary"}</h3>
              
              <dl class="text-xs space-y-3 py-4 border-b border-slate-100">
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">${isDiagnosticPackage ? "Partner" : "Hospital"}</dt>
                  <dd id="summaryHospital" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.hospitalName}</dd>
                </div>
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">${isDiagnosticPackage ? "Package" : "Doctor"}</dt>
                  <dd id="summaryDoctor" class="font-bold text-slate-800 text-right">${isDiagnosticPackage ? window.BOOKING_STATE.packageTitle : window.BOOKING_STATE.doctorName}</dd>
                </div>
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">Date</dt>
                  <dd id="summaryDate" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.date}</dd>
                </div>
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">Time Slot</dt>
                  <dd id="summaryTime" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.timeSlot}</dd>
                </div>
              </dl>

              <div class="flex justify-between items-center py-4">
                <span class="text-xs font-semibold text-slate-600">${isDiagnosticPackage ? "Package Price" : "Consultation Fee"}</span>
                <span class="text-base font-black text-red-700">${window.BOOKING_STATE.fee}</span>
              </div>

              <button type="button" onclick="confirmAppointment()" class="w-full bg-[#991b1b] hover:bg-red-800 text-white text-xs font-bold py-3.5 rounded-xl transition shadow-xs">
                ${isDiagnosticPackage ? "Confirm & Book Package" : "Confirm & Book Appointment"}
              </button>

              <p class="text-[10px] text-slate-400 text-center mt-3">
                ${isDiagnosticPackage ? "No booking charges. Payment is handled by the diagnostic partner." : "No booking charges. Pay at the clinic."}
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;
};

/* ============================================================
   INTERACTIVE JS EVENT HANDLERS (LIVE DOM UPDATES)
   ============================================================ */

// 1. Doctor Selection Logic
window.selectBookingDoctor = function(doctorName, doctorRole) {
  window.BOOKING_STATE.doctorName = doctorName;
  window.BOOKING_STATE.doctorRole = doctorRole;

  const summaryDoc = document.getElementById("summaryDoctor");
  if (summaryDoc) summaryDoc.textContent = doctorName;

  document.querySelectorAll("[data-booking-doctor]").forEach(card => {
    const selected = card.getAttribute("data-doctor") === doctorName;
    card.setAttribute("aria-pressed", String(selected));
    card.className = `w-full text-left cursor-pointer rounded-2xl p-4 relative transition ${selected ? "border-2 border-red-600 bg-red-50/20" : "border border-slate-200 bg-white hover:border-slate-300"}`;
    const radio = card.querySelector("[data-doctor-radio]");
    if (radio) {
      radio.className = `w-4 h-4 rounded-full border-2 ${selected ? "border-red-700" : "border-slate-300"} flex items-center justify-center`;
      const dot = radio.querySelector("span");
      if (dot) dot.classList.toggle("hidden", !selected);
    }
  });
};

// 2. Date Selection Logic
window.selectBookingDate = function(dayNumber) {
  window.BOOKING_STATE.selectedDay = dayNumber;
  window.BOOKING_STATE.date = "Sept " + dayNumber + ", 2026";

  // Update Summary
  const summaryDate = document.getElementById("summaryDate");
  if (summaryDate) summaryDate.textContent = window.BOOKING_STATE.date;

  // Update Calendar Active Button
  const allDays = document.querySelectorAll(".cal-day-btn");
  allDays.forEach(btn => {
    const d = parseInt(btn.getAttribute("data-day"));
    if (d === dayNumber) {
      btn.className = "cal-day-btn w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition bg-[#991b1b] text-white font-bold shadow-xs";
    } else {
      btn.className = "cal-day-btn w-9 h-9 mx-auto rounded-lg flex items-center justify-center transition hover:bg-slate-100 text-slate-700";
    }
  });
};

// 3. Time Slot Selection Logic
window.selectBookingSlot = function(timeString) {
  window.BOOKING_STATE.timeSlot = timeString;

  // Update Summary
  const summaryTime = document.getElementById("summaryTime");
  if (summaryTime) summaryTime.textContent = timeString;

  // Update Slot Buttons
  const allSlots = document.querySelectorAll(".slot-btn");
  allSlots.forEach(btn => {
    const t = btn.getAttribute("data-slot");
    if (t === timeString) {
      btn.className = "slot-btn px-4 py-2 rounded-xl text-xs transition bg-[#991b1b] text-white font-semibold shadow-xs";
    } else {
      btn.className = "slot-btn px-4 py-2 rounded-xl text-xs transition border border-slate-200 text-slate-700 hover:border-slate-400";
    }
  });
};

window.openAppointmentBooking = function(providerId, doctorName, doctorRole, doctorFee) {
  const isDiagnosticPackage = window.BOOKING_STATE.bookingType === "diagnostic-package" && doctorRole === "Diagnostic Package";
  if (!isDiagnosticPackage) {
    window.BOOKING_STATE.bookingType = "appointment";
    delete window.BOOKING_STATE.packageTitle;
    delete window.BOOKING_STATE.packageTests;
    window.BOOKING_STATE.doctorName = "Dr. Aayush Shrestha";
    window.BOOKING_STATE.doctorRole = "Senior Cardiologist";
    window.BOOKING_STATE.fee = "Rs. 1,000";
  }
  if (typeof window.captureProviderReturnView === "function") window.captureProviderReturnView();
  const allProviders = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  
  // Clicked facility find karein (Clinic, Hospital, Diagnostic)
  const p = providerId ? allProviders.find(item =>
    item && (
      (item.id && String(item.id).toLowerCase() === String(providerId).toLowerCase()) ||
      (item.name && item.name.toLowerCase() === String(providerId).toLowerCase()) ||
      (item.name && item.name.toLowerCase().includes(String(providerId).toLowerCase()))
    )
  ) : null;

  if (p) {
    window.BOOKING_STATE.providerId = p.id;
    window.BOOKING_STATE.hospitalName = p.name;
    window.BOOKING_STATE.location = p.location || p.address || "Kathmandu";
    if (p.doctors && p.doctors.length > 0) {
      const firstDoctor = typeof p.doctors[0] === "string"
        ? { name: p.doctors[0], role: "" }
        : p.doctors[0];
      window.BOOKING_STATE.doctorName = firstDoctor.name;
      window.BOOKING_STATE.doctorRole = firstDoctor.role || "Consultant";
    } else if (p.leadDoctor) {
      window.BOOKING_STATE.doctorName = p.leadDoctor;
      window.BOOKING_STATE.doctorRole = p.leadDoctorRole || "Consultant";
    } else if (p.availability && p.availability.length) {
      window.BOOKING_STATE.doctorName = String(p.availability[0].doctor || "Available Doctor").split(" (")[0].trim();
      window.BOOKING_STATE.doctorRole = p.availability[0].role || p.availability[0].specialty || "Consultant";
    }
  } else if (providerId) {
    window.BOOKING_STATE.providerId = providerId;
    window.BOOKING_STATE.hospitalName = providerId;
  }

  if (doctorName) {                       // profile par kisi doctor ke "Book" se aaye ho
    window.BOOKING_STATE.doctorName = doctorName;
    if (doctorRole) window.BOOKING_STATE.doctorRole = doctorRole;
    if (doctorFee) window.BOOKING_STATE.fee = doctorFee;
  }

  // Modal ko band karein agar khula ho
  if (typeof closeModal === 'function') closeModal();

  if (typeof navigateTo === "function") {
    navigateTo("appointment-booking", {
      providerId: window.BOOKING_STATE.providerId,
      doctorName: window.BOOKING_STATE.doctorName
    });
  }
};

window.renderAppointmentSuccessView = function(patientData) {
  const patient = patientData || {};
  const bp = window.BOOKING_STATE || {};

  // 1. Generate Unique SAINO Booking ID (e.g. SAINO-2026-89412)
  const sainoBookingId = bp.sainoBookingId || ("SAINO-2026-" + Math.floor(10000 + Math.random() * 90000));
  
  // 2. Generate Live Queue Token & Room (Matches Docx: A-Citycare 21 token / Room 301)
  const tokenPrefix = (bp.hospitalName || "CityCare").substring(0, 8).replace(/\s+/g, '');
  const tokenNum = Math.floor(18 + Math.random() * 8);
  const queueToken = bp.queueToken || `A-${tokenPrefix}-${tokenNum}`;
  const nowServingToken = `A-${tokenPrefix}-${Math.max(1, tokenNum - 2)}`;
  const doctorRoom = bp.room || "Room 301";
  const estWaitTime = "12 Minutes";
  const doctorName = bp.doctorName || "Dr. Aayush Sharma";
  const hospitalName = bp.hospitalName || "CityCare Multispeciality Hospital";
  const consultationFee = bp.fee || "₹500";

  return `
    <div id="booking-confirmation-container" class="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-24 text-left">
      
      <!-- Breadcrumb Navigation -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-3">
        <nav class="flex items-center gap-2 text-xs text-slate-400">
          <button type="button" onclick="navigateTo('marketplace')" class="hover:text-slate-700">Home</button>
          <span>›</span>
          <span class="text-[#ad0b0e] font-bold">Booking Confirmed &amp; Live Boarding Pass</span>
        </nav>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">

        <!-- ================= 1. AIRPORT-STYLE DIGITAL BOARDING PASS WIDGET ================= -->
        <div class="rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative">
          
          <!-- Boarding Pass Header Ribbon -->
          <div class="p-5 sm:p-6 bg-gradient-to-r from-[#ad0b0e] via-[#8f080b] to-[#730608] flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <img src="assets/logo.png" alt="SAINO" class="w-full h-full object-contain" onerror="this.src='../assets/logo.png'">
              </div>
              <div>
                <span class="text-[10px] font-black uppercase tracking-widest text-rose-200">SAINO HEALTH • LIVE BOARDING PASS</span>
                <h2 class="text-base sm:text-lg font-black text-white leading-tight">${hospitalName}</h2>
              </div>
            </div>
            
            <div class="text-right">
              <span class="text-[10px] text-rose-200 uppercase font-bold tracking-wider block">UNIQUE BOOKING ID</span>
              <strong class="text-sm sm:text-base font-mono font-black text-white bg-black/30 px-3 py-1 rounded-lg border border-white/20 inline-block mt-0.5">
                ${sainoBookingId}
              </strong>
            </div>
          </div>

          <!-- Boarding Pass Main Body (Live Token & Queue Telemetry) -->
          <div class="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <!-- Left Col: Giant Token Display -->
            <div class="md:col-span-5 bg-white/5 rounded-2xl p-5 border border-white/10 text-center space-y-2">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">YOUR QUEUE TOKEN</span>
              <div class="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight text-emerald-400 drop-shadow">
                ${queueToken}
              </div>
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active in Queue</span>
              </div>
            </div>

            <!-- Right Col: Airport Flight-Style Telemetry Grid -->
            <div class="md:col-span-7 grid grid-cols-2 gap-4 text-left">
              <div class="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Now Serving Token</span>
                <strong class="text-base sm:text-lg font-bold text-amber-300 font-mono">${nowServingToken}</strong>
                <span class="text-[10px] text-slate-400 block mt-0.5">2 Patients Ahead</span>
              </div>

              <div class="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Doctor Room / Chamber</span>
                <strong class="text-base sm:text-lg font-bold text-white">${doctorRoom}</strong>
                <span class="text-[10px] text-emerald-400 block mt-0.5">Ground Floor Hall</span>
              </div>

              <div class="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Consulting Doctor</span>
                <strong class="text-xs sm:text-sm font-bold text-white block truncate">${doctorName}</strong>
                <span class="text-[10px] text-slate-400 block mt-0.5">Consultant Physician</span>
              </div>

              <div class="bg-white/5 p-3.5 rounded-xl border border-white/10">
                <span class="text-[10px] text-slate-400 uppercase font-semibold block">Estimated Wait Time</span>
                <strong class="text-base sm:text-lg font-bold text-sky-300">${estWaitTime}</strong>
                <span class="text-[10px] text-slate-400 block mt-0.5">Auto-updates on call</span>
              </div>
            </div>

          </div>

          <!-- Boarding Pass Tear Line -->
          <div class="relative border-t-2 border-dashed border-slate-700/80 my-1">
            <div class="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#f8fafc]"></div>
            <div class="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#f8fafc]"></div>
          </div>

          <!-- Boarding Pass Footer (Passenger Info & Quick Actions) -->
          <div class="p-5 sm:p-6 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span class="text-[10px] text-slate-400 uppercase font-bold block">Patient Name</span>
              <strong class="text-white text-sm">${patient.name || "Patient User"}</strong>
              <span class="text-[11px] text-slate-400 ml-2">(${patient.phone || "+91 98XXXXXXXX"})</span>
            </div>

            <div class="flex items-center gap-2">
              <span class="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-bold text-xs">
                Fees: ${consultationFee}
              </span>
              <button onclick="window.print()" class="px-4 py-2 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition shadow-md">
                🖨 Print Pass
              </button>
            </div>
          </div>

        </div>

        <!-- ================= 2. JOURNEY STATUS & AUTOMATED NOTIFICATIONS ================= -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 class="font-extrabold text-sm text-slate-900">Patient Consultation Journey Tracker</h3>
          
          <!-- Step Progress -->
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span class="text-[10px] font-bold text-emerald-800 uppercase block">Step 1: Confirmed</span>
              <strong class="text-emerald-900">Token Generated</strong>
              <span class="text-[10px] text-emerald-700 block mt-0.5">✓ SAINO Booking ID Ready</span>
            </div>

            <div class="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <span class="text-[10px] font-bold text-amber-800 uppercase block">Step 2: Reception</span>
              <strong class="text-amber-900">Scan at Desk</strong>
              <span class="text-[10px] text-amber-700 block mt-0.5">Instant desk verification</span>
            </div>

            <div class="p-3 rounded-xl bg-sky-50 border border-sky-200">
              <span class="text-[10px] font-bold text-sky-800 uppercase block">Step 3: Consultation</span>
              <strong class="text-sky-900">${doctorRoom}</strong>
              <span class="text-[10px] text-sky-700 block mt-0.5">Enter when token called</span>
            </div>

            <div class="p-3 rounded-xl bg-purple-50 border border-purple-200">
              <span class="text-[10px] font-bold text-purple-800 uppercase block">Step 4: Feedback</span>
              <strong class="text-purple-900">Review &amp; Rating</strong>
              <span class="text-[10px] text-purple-700 block mt-0.5">Automated post-visit prompt</span>
            </div>
          </div>

          <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-3">
            <span class="text-xl">📲</span>
            <div>
              <strong class="text-slate-900 block">Mobile Notification Bar Tracking:</strong>
              <span>CityCare OPD queue will automatically update your phone notification bar as patients ahead finish their consultations.</span>
            </div>
          </div>
        </div>

        <!-- ================= 3. BACK TO MARKETPLACE BUTTON ================= -->
        <div class="pt-2 text-center">
          <button type="button" onclick="navigateTo('marketplace')" 
                  class="px-8 py-3 bg-[#ad0b0e] hover:bg-[#8f080b] text-white font-extrabold text-xs rounded-xl shadow-lg transition">
            ← Return to SAINO Marketplace
          </button>
        </div>

      </div>
    </div>
  `;
};

// Form submit handler with SAINO Booking ID generation
window.confirmAppointment = function() {
  const nameInput = document.getElementById("patientName");
  const phoneInput = document.getElementById("patientPhone");
  const emailInput = document.getElementById("patientEmail");
  const symptomsInput = document.getElementById("patientSymptoms");

  const name = nameInput ? nameInput.value.trim() : "";
  const phone = phoneInput ? phoneInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const symptoms = symptomsInput ? symptomsInput.value.trim() : "";

  if (!name) {
    alert("Please enter the patient's full name.");
    if (nameInput) nameInput.focus();
    return;
  }
  if (!phone) {
    alert("Please enter a contact phone number.");
    if (phoneInput) phoneInput.focus();
    return;
  }

  // Generate Unique SAINO Booking ID & Token
  const bp = window.BOOKING_STATE || {};
  const uniqueBookingId = "SAINO-2026-" + Math.floor(10000 + Math.random() * 90000);
  const tokenPrefix = (bp.hospitalName || "CityCare").substring(0, 8).replace(/\s+/g, '');
  const tokenNum = Math.floor(18 + Math.random() * 8);
  const queueToken = `A-${tokenPrefix}-${tokenNum}`;

  window.BOOKING_STATE.sainoBookingId = uniqueBookingId;
  window.BOOKING_STATE.queueToken = queueToken;
  window.BOOKING_STATE.room = "Room 301";

  const patientPayload = {
    name: name,
    phone: phone,
    email: email || "patient@example.com",
    symptoms: symptoms || "Routine doctor consultation checkup.",
    bookingId: uniqueBookingId,
    queueToken: queueToken
  };

  // Save in LocalStorage & update Provider Queue
  try {
    const existing = JSON.parse(localStorage.getItem("SAINO_MY_APPOINTMENTS") || "[]");
    existing.unshift({
      bookingId: uniqueBookingId,
      token: queueToken,
      hospital: bp.hospitalName || "CityCare Hospital",
      doctor: bp.doctorName || "Dr. Aayush Sharma",
      date: bp.date || new Date().toISOString().split('T')[0],
      patient: name,
      phone: phone,
      status: "Waiting"
    });
    localStorage.setItem("SAINO_MY_APPOINTMENTS", JSON.stringify(existing));
  } catch (_) {}

  // Render Airport-Style Boarding Pass View
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = window.renderAppointmentSuccessView(patientPayload);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
};
/* ============================================================
   AUTO-SCALE FOR DESKTOP VIEW
   ============================================================ */
function applyLaptopScale() {
  const container = document.getElementById("mainContent") || 
                    document.getElementById("main-content") || 
                    document.querySelector("main") || 
                    document.body;

  if (!container) return;

  
  if (window.innerWidth >= 1024) {
    container.style.zoom = typeof AppState !== "undefined" && AppState.activeView === "marketplace" ? "0.8" : "0.85";
  } else {
    container.style.zoom = "1"; 
  }
}

window.addEventListener("resize", applyLaptopScale);
window.addEventListener("DOMContentLoaded", applyLaptopScale);


const originalRenderHospital = window.renderHospitalDirectoryView;
if (typeof originalRenderHospital === "function") {
  window.renderHospitalDirectoryView = function(...args) {
    const html = originalRenderHospital.apply(this, args);
    setTimeout(applyLaptopScale, 50);
    return html;
  };
}

// Run immediately once
applyLaptopScale();
/* ============================================================
   DIRECTORY FILTERS + CLEAR + DISTANCE + DISCUSSIONS + HOME CARD HELPERS
   (Pehle yahan runLiveFilters / clearAllFilters the. Ab filters category ke hisaab se chalte hain.)
   NOTE: purani hospital-filters.js ab nahi chahiye, usse hata dein (isme sab aa gaya hai).
   ============================================================ */

window.toggleDirectoryFilter = function(groupId) {
  const box = document.getElementById("directory-options-" + groupId);
  const arrow = document.getElementById("directory-arrow-" + groupId);
  if (!box) return;
  const nowHidden = box.classList.toggle("hidden");
  if (arrow) arrow.classList.toggle("rotate-180", !nowHidden);
};

window.toggleDirectoryFilterPanel = function() {
  const panel = document.getElementById("directory-filter-panel");
  if (panel) panel.classList.toggle("hidden");
};

window.directoryApplyFilters = function() {
  const panel = document.getElementById("directory-filter-panel");
  const cards = document.querySelectorAll("[data-directory-card]");
  if (!panel) return;
  const groups = DIRECTORY_FILTERS[panel.getAttribute("data-category")] || [];

  const selected = {};
  groups.forEach(function(g) {
    selected[g.id] = Array.from(panel.querySelectorAll('input[data-filter-group="' + g.id + '"]:checked')).map(function(i) { return i.value; });
  });

  let visible = 0;
  cards.forEach(function(card) {
    const p = directoryFindProvider(card.getAttribute("data-provider-id"));
    const ok = !!p && groups.every(function(g) { return directoryMatchGroup(p, g, selected[g.id]); });
    card.classList.toggle("hidden", !ok);
    if (ok) visible++;
  });

  const meta = DIRECTORY_META[panel.getAttribute("data-category")] || DIRECTORY_META.hospital;
  const count = document.getElementById("directory-count");
  if (count) count.textContent = visible + " " + meta.plural + " found";
  const empty = document.getElementById("directory-empty");
  if (empty) empty.classList.toggle("hidden", visible !== 0);
};

window.clearAllFilters = function() {
  document.querySelectorAll("#directory-filter-panel input[type=checkbox]").forEach(function(cb) { cb.checked = false; });
  window.directoryApplyFilters();
};

// Checkbox change par filter (sirf ek baar bind hota hai)
if (!window.__directoryFilterBound) {
  window.__directoryFilterBound = true;
  document.addEventListener("change", function(e) {
    if (e.target && e.target.matches && e.target.matches("#directory-filter-panel input[type=checkbox]")) {
      window.directoryApplyFilters();
    }
  });
}

/* ---------- Distance (har hospital ka alag, user ki location se) ---------- */
window.directoryRefreshDistances = function() {
  document.querySelectorAll("[data-distance-for]").forEach(function(el) {
    const p = directoryFindProvider(el.getAttribute("data-distance-for"));
    const d = p ? directoryDistanceKm(p) : null;
    const text = d === null ? "" : " · " + d.toFixed(1) + " km";
    if (el.textContent !== text) el.textContent = text;
  });
};

window.directoryEnsureUserLocation = function() {
  if (window.USER_LOCATION || window.__directoryAskedLocation || !navigator.geolocation) return;
  window.__directoryAskedLocation = true;
  navigator.geolocation.getCurrentPosition(function(pos) {
    window.USER_LOCATION = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    window.directoryRefreshDistances();
    window.directoryApplyFilters();
  }, function() {});
};

/* ---------- Discussions: us hospital ki discussion tak ---------- */
window.goToHospitalDiscussions = function(providerId) {
  const p = directoryFindProvider(providerId);
  if (!p) return;
  const clean = function(s) {
    return String(s || "").toLowerCase().replace(/\(.*?\)/g, " ")
      .replace(/\b(hospital|international|research|centre|center|and|pvt|ltd)\b/g, " ")
      .replace(/[^a-z0-9]+/g, " ").trim();
  };
  const store = window.DISCUSSIONS_STORE || {};
  const key = clean(p.name);
  const disc = (p.discussionId && store[p.discussionId]) ||
    Object.values(store).find(function(d) { const n = clean(d.hospital); return n && (n === key || n.includes(key) || key.includes(n)); });

  navigateTo("discussions");
  if (disc) {
    setTimeout(function() { if (typeof window.openDiscussionModal === "function") window.openDiscussionModal(disc.id); }, 60);
  } else if (typeof showToast === "function") {
    showToast("No discussion for " + p.name + " yet");
  }
};

/* ---------- Home page card: "+N more" click par baaki departments ---------- */
window.toggleHomeDepartments = function(providerId) {
  const box = document.getElementById("home-extra-" + providerId);
  const btn = document.getElementById("home-more-" + providerId);
  if (!box || !btn) return;
  const nowHidden = box.classList.toggle("hidden");
  btn.textContent = nowHidden ? btn.getAttribute("data-label") : "Show less";
};