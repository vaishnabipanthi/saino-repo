/* ============================================================
   HOSPITAL DIRECTORY & PROFILE VIEW (CLEAN & ERROR-FREE)
   ============================================================ */

/* 1. Hospital Directory View (List Page) */
function renderHospitalDirectoryView() {
  const allProviders = (window.AppState && window.AppState.providers) || (window.SAINO_DATA && window.SAINO_DATA.providers) || [];
  const hospitals = allProviders.filter(p => p && p.category === "hospital");

  return `
    <div class="max-w-7xl mx-auto px-4 py-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-black">Hospitals</h1>
          <p class="text-slate-500 text-sm">
            Find hospitals and healthcare facilities based on your needs.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-red-600 text-sm font-semibold cursor-pointer">
            Clear Filters
          </span>
          <select class="border rounded-lg px-3 py-2 text-sm">
            <option>Recommended</option>
          </select>
        </div>
      </div>

      <!-- Layout -->
      <div class="grid grid-cols-12 gap-6">
        <!-- Left Filter Sidebar -->
        <div class="col-span-3">
          <div class="bg-white border rounded-xl p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold">Filters</h3>
              <button class="text-red-600 text-sm">Clear All</button>
            </div>

            <div class="space-y-4">
              
              <!-- Location -->
              <div class="border-b pb-3">
                <button
                  onclick="toggleFilterSection('locationOptions','locationArrow')"
                  class="w-full flex items-center justify-between font-medium">
                  <div class="flex items-center gap-2">
                    <i data-lucide="map-pin" class="w-4 h-4 text-black"></i>
                    <span>Location</span>
                  </div>
                  <span id="locationArrow">⌄</span>
                </button>
                <div id="locationOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="Kathmandu" class="w-4 h-4 accent-red-700">
                    <span>Kathmandu</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="Lalitpur" class="w-4 h-4 accent-red-700">
                    <span>Lalitpur</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="Bhaktapur" class="w-4 h-4 accent-red-700">
                    <span>Bhaktapur</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="Pokhara" class="w-4 h-4 accent-red-700">
                    <span>Pokhara</span>
                  </label>
                </div>
              </div>

              <!-- Distance -->
              <div class="border-b pb-3">
                <button
                  onclick="toggleFilterSection('distanceOptions','distanceArrow')"
                  class="w-full flex items-center justify-between font-medium">
                  <div class="flex items-center gap-2">
                    <i data-lucide="map-pin" class="w-4 h-4 text-black"></i>
                    <span>Distance</span>
                  </div>
                  <span id="distanceArrow">⌄</span>
                </button>
                <div id="distanceOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="2km" class="w-4 h-4 accent-red-700">
                    <span>Within 2 km</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="5km" class="w-4 h-4 accent-red-700">
                    <span>Within 5 km</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="8km" class="w-4 h-4 accent-red-700">
                    <span>Within 8 km</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="10km" class="w-4 h-4 accent-red-700">
                    <span>Within 10 km</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="15km" class="w-4 h-4 accent-red-700">
                    <span>Within 15 km</span>
                  </label>
                </div>
              </div>

              <!-- Speciality -->
              <div class="border-b pb-3">
                <button
                  onclick="toggleFilterSection('specialityOptions','specialityArrow')"
                  class="w-full flex items-center justify-between font-medium">
                  <div class="flex items-center gap-2">
                    <i data-lucide="map-pin" class="w-4 h-4 text-black"></i>
                    <span>Speciality</span>
                  </div>
                  <span id="specialityArrow">⌄</span>
                </button>
                <div id="specialityOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="Cardiology" class="w-4 h-4 accent-red-700">
                    <span>Cardiology</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="Neurology" class="w-4 h-4 accent-red-700">
                    <span>Neurology</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="Orthopedics" class="w-4 h-4 accent-red-700">
                    <span>Orthopedics</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="Pediatrics" class="w-4 h-4 accent-red-700">
                    <span>Pediatrics</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm">
                    <input type="checkbox" value="General Surgery" class="w-4 h-4 accent-red-700">
                    <span>General Surgery</span>
                  </label>
                </div>
              </div>
                <!-- Services -->
            <div class="border-b pb-3">
                <button
                  type="button"
                  onclick="toggleFilterSection('servicesOptions','servicesArrow')"
                  class="w-full flex items-center justify-between font-semibold text-sm text-slate-900">
                  <div class="flex items-center gap-2">
                    <i data-lucide="map-pin" class="w-4 h-4 text-black"></i>
                    <span>Services</span>
                  </div>
                  <span id="distanceArrow">⌄</span>
                </button>
                <div id="servicesOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="Emergency" class="w-4 h-4 accent-red-700">
                    <span>Emergency Care</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="ICU" class="w-4 h-4 accent-red-700">
                    <span>ICU / NICU</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="Pharmacy" class="w-4 h-4 accent-red-700">
                    <span>24/7 Pharmacy</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="Laboratory" class="w-4 h-4 accent-red-700">
                    <span>Laboratory & Diagnostics</span>
                  </label>
                </div>
              </div>

              <!-- 5. Availability -->
              <div class="border-b pb-3">
                <button
                  type="button"
                  onclick="toggleFilterSection('availabilityOptions','availabilityArrow')"
                  class="w-full flex items-center justify-between font-semibold text-sm text-slate-900">
                  <div class="flex items-center gap-2">
                    <i data-lucide="stethoscope" class="w-4 h-4 text-black"></i>
                    <span>Availability</span>
                  </div>
                  <span id="availabilityArrow">⌄</span>
                </button>
                <div id="availabilityOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="24_7" class="w-4 h-4 accent-red-700">
                    <span>Open 24/7</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="today" class="w-4 h-4 accent-red-700">
                    <span>Available Today</span>
                  </label>
                </div>
              </div>

              <!-- 6. SAINO Status -->
              <div class="border-b pb-3">
                <button
                  type="button"
                  onclick="toggleFilterSection('sainoOptions','sainoArrow')"
                  class="w-full flex items-center justify-between font-semibold text-sm text-slate-900">
                  <div class="flex items-center gap-2">
                    <i data-lucide="stethoscope" class="w-4 h-4 text-black"></i>
                    <span>SAINO Status</span>
                  </div>
                  <span id="sainoArrow">⌄</span>
                </button>
                <div id="sainoOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="verified" class="w-4 h-4 accent-red-700">
                    <span>Verified Partner</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="featured" class="w-4 h-4 accent-red-700">
                    <span>Featured</span>
                  </label>
                </div>
              </div>

              <!-- 7. Rating -->
              <div class="border-b pb-3">
                <button
                  type="button"
                  onclick="toggleFilterSection('ratingOptions','ratingArrow')"
                  class="w-full flex items-center justify-between font-semibold text-sm text-slate-900">
                  <div class="flex items-center gap-2">
                    <i data-lucide="stethoscope" class="w-4 h-4 text-black"></i>
                    <span>Rating</span>
                  </div>
                  <span id="ratingArrow">⌄</span>
                </button>
                <div id="ratingOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="4_star" class="w-4 h-4 accent-red-700">
                    <span>4 Stars & Above</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="3_star" class="w-4 h-4 accent-red-700">
                    <span>3 Stars & Above</span>
                  </label>
                </div>
              </div>

              <!-- 8. Insurance -->
              <div class="border-b pb-3">
                <button
                  type="button"
                  onclick="toggleFilterSection('insuranceOptions','insuranceArrow')"
                  class="w-full flex items-center justify-between font-semibold text-sm text-slate-900">
                  <div class="flex items-center gap-2">
                    <i data-lucide="stethoscope" class="w-4 h-4 text-black"></i>
                    <span>Insurance</span>
                  </div>
                  <span id="insuranceArrow">⌄</span>
                </button>
                <div id="insuranceOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="government" class="w-4 h-4 accent-red-700">
                    <span>Government Insurance / Health Scheme</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="private" class="w-4 h-4 accent-red-700">
                    <span>Private Insurance Accepted</span>
                  </label>
                </div>
              </div>

              <!-- 9. Facilities -->
              <div class="border-b pb-3">
                <button
                  type="button"
                  onclick="toggleFilterSection('facilitiesOptions','facilitiesArrow')"
                  class="w-full flex items-center justify-between font-semibold text-sm text-slate-900">
                  <div class="flex items-center gap-2">
                    <i data-lucide="stethoscope" class="w-4 h-4 text-black"></i>
                    <span>Facilities</span>
                  </div>
                  <span id="facilitiesArrow">⌄</span>
                </button>
                <div id="facilitiesOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="parking" class="w-4 h-4 accent-red-700">
                    <span>Parking Available</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="cafeteria" class="w-4 h-4 accent-red-700">
                    <span>Cafeteria</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="atm" class="w-4 h-4 accent-red-700">
                    <span>ATM</span>
                  </label>
                </div>
              </div>

              <!-- 10. Hospital Type -->
              <div class="border-b pb-3">
                <button
                  type="button"
                  onclick="toggleFilterSection('typeOptions','typeArrow')"
                  class="w-full flex items-center justify-between font-semibold text-sm text-slate-900">
                  <div class="flex items-center gap-2">
                    <i data-lucide="stethoscope" class="w-4 h-4 text-black"></i>
                    <span>Hospital Type</span>
                  </div>
                  <span id="typeArrow">⌄</span>
                </button>
                <div id="typeOptions" class="hidden mt-3 space-y-2">
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="government" class="w-4 h-4 accent-red-700">
                    <span>Government / Public</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="private" class="w-4 h-4 accent-red-700">
                    <span>Private</span>
                  </label>
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 cursor-pointer">
                    <input type="checkbox" value="community" class="w-4 h-4 accent-red-700">
                    <span>Community / Trust</span>
                  </label>
                </div>
              </div>

              <!-- Clear Filters Button -->
              <div class="mt-5 pt-2">
                <button 
                  onclick="if(typeof clearAllFilters === 'function') clearAllFilters();" 
                  class="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 transition text-sm">
                  <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                  Clear all filters
                </button>
              </div>

            </div>
          </div>
        </div>

        <!-- Right Content List -->
        <div class="col-span-9">
          ${hospitals.length === 0 ? `
            <div class="bg-white border rounded-xl p-10 text-center text-slate-500 font-medium">
              No hospitals found.
            </div>
          ` : hospitals.map((p, index) => {
            const imgSrc = (p && p.image) ? p.image : 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=500&q=80';
            const hospName = (p && p.name) ? p.name : 'Hospital';
            const hospRating = (p && p.rating) ? p.rating : '4.7';
            const hospLocation = (p && p.location) ? p.location : 'Kathmandu';
            const hospDistance = (p && p.distance) ? p.distance : '5.0km';
            const hospOpd = (p && p.opd) ? p.opd : 'Mon–Sat, 9:30 AM – 6:00 PM';
            const hospPhone = (p && p.phone) ? p.phone : '+977-9876543329';
            const deps = (p && Array.isArray(p.departments)) ? p.departments : [];
            const hospId = (p && (p.id || p.name)) ? p.id || p.name : 'norvic';

            return `
              <div class="bg-white border rounded-xl p-5 mb-4">
                <div class="flex gap-4">
                  <!-- Image -->
                  <div class="flex-shrink-0 self-start rounded-xl overflow-hidden bg-slate-100" style="width:240px; height:320px;">
                    <img src="${imgSrc}" alt="${hospName}" class="w-full h-full object-cover">
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0 border rounded-xl p-4">
                    <div class="flex items-center justify-between mb-1">
                      <h2 class="text-2xl font-bold text-slate-900">${hospName}</h2>
                      <span class="flex items-center gap-1 text-emerald-700 text-xs font-medium whitespace-nowrap shrink-0">
                        <svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/>
                          <path d="m8.5 12 2.5 2.5 4.5-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Saino Verified
                      </span>
                    </div>

                    <!-- Rating -->
                    <div class="flex items-center gap-3 text-xs text-slate-600 mb-2">
                      <span class="flex items-center gap-1 text-amber-500 font-bold">
                        <i data-lucide="star" class="w-4 h-4 fill-amber-500 text-amber-500"></i> ${hospRating}
                      </span>
                      <span class="font-medium">Reviews</span>
                      <span class="flex items-center gap-1 font-medium">
                        <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Discussions
                      </span>
                    </div>

                    <!-- Status -->
                    <div class="flex flex-wrap items-center gap-3 text-sm mb-2 font-semibold">
                      <span class="text-emerald-700 font-semibold flex items-center gap-1"><i data-lucide="clock" class="w-4 h-4 text-emerald-600"></i> Open Now</span>
                      <span class="flex items-center gap-1 text-red-700 font-bold">
                        <svg class="w-5 h-5 text-red-600 -scale-x-100" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 8a2 2 0 0 1 2-2h8a1 1 0 0 1 1 1v1h2.4a2 2 0 0 1 1.7.95l2.1 3.4a2 2 0 0 1 .3 1.05V16a1 1 0 0 1-1 1h-.6a2.5 2.5 0 0 1-4.8 0H9.4a2.5 2.5 0 0 1-4.8 0H4a1 1 0 0 1-1-1V8Z"/>
                          <circle cx="7" cy="17.5" r="1.5" fill="#fff"/>
                          <circle cx="17" cy="17.5" r="1.5" fill="#fff"/>
                        </svg>
                        24/7 Emergency
                      </span>
                    </div>

                    <div class="text-slate-600 text-sm mb-1 font-medium">
                      ${hospLocation} ·${hospDistance}
                    </div>

                    <div class="text-slate-700 text-sm font-semibold mb-1">
                      OPD: ${hospOpd}
                    </div>

                    <div class="text-slate-800 text-sm font-bold mb-3">
                      ${hospPhone}
                    </div>

                    <!-- Departments -->
                    <div class="flex flex-wrap items-center gap-2 mt-3">
                      ${deps.slice(0, 3).map(dep => `
                        <span class="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-medium">
                          ${dep}
                        </span>
                      `).join('')}

                      <div id="extra-deps-${index}" class="hidden flex flex-wrap gap-2">
                        ${deps.slice(3).map(dep => `
                          <span class="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-medium">
                            ${dep}
                          </span>
                        `).join('')}
                      </div>

                      ${deps.length > 3 ? `
                        <button
                          type="button"
                          onclick="toggleDepartments(${index})"
                          id="more-btn-${index}"
                          class="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold hover:bg-slate-300 transition">
                          +${deps.length - 3}
                        </button>
                      ` : ''}
                    </div>
                  </div>

                  <!-- Right Actions Column -->
                  <div class="w-56 flex-shrink-0 flex flex-col">
                    <div class="flex justify-end items-center gap-3 mb-6 text-slate-700">
                      <button type="button" class="hover:text-red-700 transition" aria-label="Share">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                          <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
                        </svg>
                      </button>
                      <button type="button" class="hover:text-red-700 transition" aria-label="Save">
                        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                        </svg>
                      </button>
                    </div>

                    <div class="text-xs text-slate-500">Consultation Fee</div>
                    <div class="text-sm font-bold mb-4">Rs. 4,000</div>

                    <button type="button" onclick="openAppointmentBooking('${hospId}')" class="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white py-3 rounded-xl font-semibold text-sm mb-3 transition shadow-xs">
                      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                      Book Appointment
                    </button>

                    <button type="button" onclick="openHospitalProfile('${hospId}')" class="w-full border border-red-700 hover:bg-red-50 text-red-700 py-3 rounded-xl font-semibold text-sm transition">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

/* 2. Hospital Profile View (Single Profile Page) */
function renderHospitalProfileView(hospitalId) {
  return `
    <div id="hospital-profile-container" class="bg-slate-50 min-h-screen pb-16">
      
      <!-- Breadcrumb -->
      <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2">
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <button type="button" onclick="navigateTo('marketplace')" class="hover:underline">Home</button>
          <span>›</span>
          <button type="button" onclick="backToHospitalList()" class="hover:underline">Hospitals</button>
          <span>›</span>
          <span class="text-slate-800 font-semibold">Norvic Hospital</span>
        </div>
      </div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">

        <!-- Banner -->
        <div class="relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white p-6 sm:p-8 flex flex-col justify-between shadow-sm" style="min-height: 190px;">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-bold text-xl">
                NH
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-2xl font-bold">Norvic Hospital</h1>
                  <span class="text-[11px] font-semibold bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-2 py-0.5 rounded-full">
                    Saino Verified
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs text-emerald-100/80 mt-1">
                  <span>Multispecialty Hospital</span>
                  <span>•</span>
                  <span>24/7 Emergency</span>
                </div>
                <div class="flex items-center gap-1.5 text-xs text-amber-300 mt-2">
                  <span>★</span>
                  <span class="font-bold text-white">4.7</span>
                  <span class="text-emerald-100/70">(2,560 reviews)</span>
                </div>
              </div>
            </div>

            <div>
              <button type="button" onclick="openAppointmentBooking()" class="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-6 py-3 rounded-xl transition shadow-sm">
                Book appointment
              </button>
            </div>
          </div>
        </div>

        <!-- About & Meta -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
            <h2 class="text-base font-bold text-slate-900 mb-2">About</h2>
            <p class="text-xs text-slate-600 leading-relaxed">
              Norvic Clinic is a multi-specialty polyclinic serving Thapathali and the wider Kathmandu Valley, offering general consultations, diagnostic services to specialized 24/7 emergency services. Norvic strives for reliable healthcare with standard medical equipment and professional care.
            </p>
          </div>
          
          <div class="bg-white rounded-2xl border border-slate-200 p-5 text-xs space-y-3">
            <div class="flex justify-between border-b border-slate-100 pb-2">
              <span class="text-slate-400">Address</span>
              <span class="font-semibold text-slate-800 text-right">Thapathali, Kathmandu</span>
            </div>
            <div class="flex justify-between border-b border-slate-100 pb-2">
              <span class="text-slate-400">Hours</span>
              <span class="font-semibold text-slate-800">Open 24 hours</span>
            </div>
            <div class="flex justify-between border-b border-slate-100 pb-2">
              <span class="text-slate-400">Phone</span>
              <span class="font-semibold text-slate-800">+977 1-4258554</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Distance</span>
              <span class="font-semibold text-slate-800">3km</span>
            </div>
          </div>
        </div>

        <!-- Available Doctors -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-slate-900">Available doctors</h2>
            <span class="text-xs text-slate-400 font-medium">3 Doctors Active</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="border border-slate-200 rounded-xl p-4 text-center">
              <div class="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 mb-2">AK</div>
              <h3 class="text-xs font-bold text-slate-900">Dr. Anup Karki</h3>
              <p class="text-[11px] text-slate-500 mb-3">General physician</p>
              <button type="button" onclick="alert('Booking Dr. Anup Karki')" class="w-full bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                Book Appointment
              </button>
            </div>

            <div class="border border-slate-200 rounded-xl p-4 text-center">
              <div class="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 mb-2">SS</div>
              <h3 class="text-xs font-bold text-slate-900">Dr. Sabina Shrestha</h3>
              <p class="text-[11px] text-slate-500 mb-3">General physician</p>
              <button type="button" onclick="alert('Booking Dr. Sabina Shrestha')" class="w-full bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                Book Appointment
              </button>
            </div>

            <div class="border border-slate-200 rounded-xl p-4 text-center">
              <div class="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 mb-2">AP</div>
              <h3 class="text-xs font-bold text-slate-900">Dr. Ashina Pradhan</h3>
              <p class="text-[11px] text-slate-500 mb-3">Gynaecologist</p>
              <button type="button" onclick="alert('Booking Dr. Ashina Pradhan')" class="w-full bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                Book Appointment
              </button>
            </div>
          </div>
        </div>

        <!-- Available Slots -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900">Doctor's available slots</h2>
            <span class="text-xs text-slate-400">Today, 24 Oct</span>
          </div>

          <div>
            <div class="text-xs font-bold text-slate-800 mb-3">General medicine</div>
            <div class="space-y-3">
              <div class="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">SS</div>
                  <div>
                    <div class="text-xs font-bold text-slate-900">Dr. Sabina Shrestha</div>
                    <div class="text-[10px] text-slate-400">General physician</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">10:00 AM</button>
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">02:30 PM</button>
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">4:00 PM</button>
                </div>
              </div>

              <div class="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">AK</div>
                  <div>
                    <div class="text-xs font-bold text-slate-900">Dr. Anup Karki</div>
                    <div class="text-[10px] text-slate-400">General physician</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">11:00 AM</button>
                  <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">03:30 PM</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="text-xs font-bold text-slate-800 mb-3">Maternity & Gynaecology</div>
            <div class="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">AP</div>
                <div>
                  <div class="text-xs font-bold text-slate-900">Dr. Ashina Pradhan</div>
                  <div class="text-[10px] text-slate-400">Gynaecologist</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">10:00 AM</button>
                <button type="button" class="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg hover:bg-amber-100">11:30 AM</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Gallery -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-base font-bold text-slate-900 mb-4">Gallery</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">Photo 1</div>
            <div class="h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">Photo 2</div>
            <div class="h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">Photo 3</div>
            <div class="h-32 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs">Photo 4</div>
          </div>
        </div>

        <!-- Reviews -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-base font-bold text-slate-900 mb-4">Reviews</h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="border border-slate-200 rounded-xl p-5 text-center flex flex-col justify-center">
              <div class="text-4xl font-black text-slate-900">4.7</div>
              <div class="text-amber-500 text-sm mt-1">★★★★★</div>
              <div class="text-[11px] text-slate-400 mt-1">Based on 2,560 reviews</div>
              <div class="mt-4 space-y-1 text-[10px] text-slate-500">
                <div class="flex items-center gap-2"><span>5</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[80%]"></div></div></div>
                <div class="flex items-center gap-2"><span>4</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[15%]"></div></div></div>
                <div class="flex items-center gap-2"><span>3</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[3%]"></div></div></div>
                <div class="flex items-center gap-2"><span>2</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[1%]"></div></div></div>
                <div class="flex items-center gap-2"><span>1</span><div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="bg-amber-400 h-full w-[1%]"></div></div></div>
              </div>
            </div>

            <div class="lg:col-span-2 space-y-4">
              <div class="border-b border-slate-100 pb-3">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold text-slate-800">Sujata R.</span>
                  <span class="text-slate-400">1 month ago</span>
                </div>
                <p class="text-xs text-slate-600">Great experience overall. Doctor took time explaining issues and the rest of the nursing was smooth.</p>
              </div>

              <div class="border-b border-slate-100 pb-3">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold text-slate-800">Bikash T.</span>
                  <span class="text-slate-400">2 weeks ago</span>
                </div>
                <p class="text-xs text-slate-600">Clean premises, well mannered staff, quick lab turnaround times, highly recommend.</p>
              </div>

              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold text-slate-800">Alisha M.</span>
                  <span class="text-slate-400">3 days ago</span>
                </div>
                <p class="text-xs text-slate-600">Very professional gynaecology department. Felt well cared for.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- More Hospitals -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-base font-bold text-slate-900">More hospitals</h2>
            <button type="button" onclick="backToHospitalList()" class="text-xs text-red-700 font-semibold hover:underline">View all</button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div class="h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400">Hospital Image</div>
              <div class="p-3.5">
                <h3 class="text-xs font-bold text-slate-900">Norvic Hospital</h3>
                <p class="text-[10px] text-slate-500 mt-0.5">Thapathali • 3km</p>
                <button type="button" onclick="openHospitalProfile('norvic')" class="w-full mt-3 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                  Book Appointment →
                </button>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div class="h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400">Hospital Image</div>
              <div class="p-3.5">
                <h3 class="text-xs font-bold text-slate-900">Madhyapur Hospital</h3>
                <p class="text-[10px] text-slate-500 mt-0.5">Thimi • 6km</p>
                <button type="button" onclick="openHospitalProfile('madhyapur')" class="w-full mt-3 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                  Book Appointment →
                </button>
              </div>
            </div>

            <div class="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div class="h-28 bg-slate-100 flex items-center justify-center text-xs text-slate-400">Hospital Image</div>
              <div class="p-3.5">
                <h3 class="text-xs font-bold text-slate-900">Everest Hospital</h3>
                <p class="text-[10px] text-slate-500 mt-0.5">New Baneshwor • 4km</p>
                <button type="button" onclick="openHospitalProfile('everest')" class="w-full mt-3 bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-2 rounded-lg transition">
                  Book Appointment →
                </button>
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

window.openHospitalProfile = function(hospitalId) {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = renderHospitalProfileView(hospitalId);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }
};

window.backToHospitalList = function() {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = renderHospitalDirectoryView();
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
  const currentDoc = window.BOOKING_STATE.doctorName;
  const currentDay = window.BOOKING_STATE.selectedDay;
  const currentSlot = window.BOOKING_STATE.timeSlot;

  return `
    <div id="appointment-booking-container" class="bg-[#f8fafc] min-h-screen text-slate-800 font-sans pb-24">
      
      <!-- Top Breadcrumb & Hospital Header -->
      <div class="bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <nav class="flex items-center gap-2 text-[11px] text-slate-400 mb-3">
            <button type="button" onclick="navigateTo('marketplace')" class="hover:text-slate-600">Home</button>
            <span>›</span>
            <button type="button" onclick="backToHospitalList()" class="hover:text-slate-600">Hospitals</button>
            <span>›</span>
            <button type="button" onclick="openHospitalProfile('norvic')" class="hover:text-slate-600">Norvic Hospital</button>
            <span>›</span>
            <span class="text-red-700 font-semibold">Book Appointment</span>
          </nav>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-700 font-black text-sm">
                NC
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-xl font-bold text-slate-900 leading-tight">Norvic Hospital</h1>
                  <span class="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z"/></svg>
                    Saino Verified
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">Thapathali, Kathmandu · Multi-specialty hospital</p>
              </div>
            </div>

            <button type="button" onclick="openHospitalProfile('norvic')" class="text-xs font-semibold text-slate-600 hover:text-red-700 flex items-center gap-1">
              ← Back to Profile
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
              <h2 class="text-sm font-bold text-slate-900 mb-4">1. Choose an Available Doctor</h2>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <!-- Doctor 1: Dr. Aayush Shrestha -->
                <div id="doc-card-aayush" 
                     onclick="selectBookingDoctor('Dr. Aayush Shrestha', 'Senior Cardiologist')" 
                     class="cursor-pointer rounded-2xl p-4 relative transition ${currentDoc === 'Dr. Aayush Shrestha' ? 'border-2 border-red-600 bg-red-50/20' : 'border border-slate-200 bg-white hover:border-slate-300'}">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-full bg-red-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        AS
                      </div>
                      <div>
                        <h3 class="text-xs font-bold text-slate-900">Dr. Aayush Shrestha</h3>
                        <p class="text-[11px] text-slate-500">Senior Cardiologist</p>
                      </div>
                    </div>
                    <span id="doc-radio-aayush" class="w-4 h-4 rounded-full flex items-center justify-center ${currentDoc === 'Dr. Aayush Shrestha' ? 'border-2 border-red-700' : 'border-2 border-slate-300'}">
                      <span class="w-2 h-2 rounded-full bg-red-700 ${currentDoc === 'Dr. Aayush Shrestha' ? '' : 'hidden'}"></span>
                    </span>
                  </div>
                  <div class="mt-3 text-[11px] text-slate-500">
                    <div class="text-amber-500 font-medium">★ ★ ★ ★ ★ <span class="text-slate-700 font-bold">4.8</span> <span class="text-slate-400">(240 reviews)</span></div>
                    <div class="mt-1">Experience: <strong class="text-slate-700 font-semibold">12 Years</strong></div>
                  </div>
                </div>

                <!-- Doctor 2: Dr. Rekha Shrestha -->
                <div id="doc-card-rekha" 
                     onclick="selectBookingDoctor('Dr. Rekha Shrestha', 'General Physician')" 
                     class="cursor-pointer rounded-2xl p-4 relative transition ${currentDoc === 'Dr. Rekha Shrestha' ? 'border-2 border-red-600 bg-red-50/20' : 'border border-slate-200 bg-white hover:border-slate-300'}">
                  <div class="flex items-start justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        RS
                      </div>
                      <div>
                        <h3 class="text-xs font-bold text-slate-900">Dr. Rekha Shrestha</h3>
                        <p class="text-[11px] text-slate-500">General Physician</p>
                      </div>
                    </div>
                    <span id="doc-radio-rekha" class="w-4 h-4 rounded-full flex items-center justify-center ${currentDoc === 'Dr. Rekha Shrestha' ? 'border-2 border-red-700' : 'border-2 border-slate-300'}">
                      <span class="w-2 h-2 rounded-full bg-red-700 ${currentDoc === 'Dr. Rekha Shrestha' ? '' : 'hidden'}"></span>
                    </span>
                  </div>
                  <div class="mt-3 text-[11px] text-slate-500">
                    <div class="text-amber-500 font-medium">★ ★ ★ ★ ★ <span class="text-slate-700 font-bold">5.0</span> <span class="text-slate-400">(180 reviews)</span></div>
                    <div class="mt-1">Experience: <strong class="text-slate-700 font-semibold">8 Years</strong></div>
                  </div>
                </div>

              </div>
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
                <label class="block text-xs font-semibold text-slate-700 mb-1.5">Reason for Appointment / Symptoms</label>
                <textarea id="patientSymptoms" rows="3" placeholder="Explain symptoms briefly here..." class="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-600 transition"></textarea>
              </div>

              <div class="flex items-center gap-2 pt-2">
                <input type="checkbox" id="consentBox" checked class="w-4 h-4 accent-red-700 rounded cursor-pointer">
                <label for="consentBox" class="text-[11px] text-slate-600 cursor-pointer">
                  I consent to sharing this basic healthcare details with Narnia Clinic for clinical review.
                </label>
              </div>
            </div>

          </div>

          <!-- RIGHT COLUMN: Sticky Booking Summary -->
          <div class="lg:col-span-4 sticky top-6">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h3 class="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Booking Summary</h3>
              
              <dl class="text-xs space-y-3 py-4 border-b border-slate-100">
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">Hospital</dt>
                  <dd id="summaryHospital" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.hospitalName}</dd>
                </div>
                <div class="flex justify-between items-center">
                  <dt class="text-slate-400">Doctor</dt>
                  <dd id="summaryDoctor" class="font-bold text-slate-800 text-right">${window.BOOKING_STATE.doctorName}</dd>
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
                <span class="text-xs font-semibold text-slate-600">Consultation Fee</span>
                <span class="text-base font-black text-red-700">${window.BOOKING_STATE.fee}</span>
              </div>

              <button type="button" onclick="confirmAppointment()" class="w-full bg-[#991b1b] hover:bg-red-800 text-white text-xs font-bold py-3.5 rounded-xl transition shadow-xs">
                Confirm & Book Appointment
              </button>

              <p class="text-[10px] text-slate-400 text-center mt-3">
                No booking charges. Pay at the clinic.
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

  // Update Summary Card
  const summaryDoc = document.getElementById("summaryDoctor");
  if (summaryDoc) summaryDoc.textContent = doctorName;

  // Update Visual Card Borders & Radio Dots
  const cardAayush = document.getElementById("doc-card-aayush");
  const cardRekha = document.getElementById("doc-card-rekha");
  const radioAayush = document.querySelector("#doc-radio-aayush span");
  const radioRekha = document.querySelector("#doc-radio-rekha span");
  const radioAayushCircle = document.getElementById("doc-radio-aayush");
  const radioRekhaCircle = document.getElementById("doc-radio-rekha");

  if (doctorName === "Dr. Aayush Shrestha") {
    if (cardAayush) {
      cardAayush.className = "cursor-pointer rounded-2xl p-4 relative transition border-2 border-red-600 bg-red-50/20";
    }
    if (cardRekha) {
      cardRekha.className = "cursor-pointer rounded-2xl p-4 relative transition border border-slate-200 bg-white hover:border-slate-300";
    }
    if (radioAayushCircle) radioAayushCircle.className = "w-4 h-4 rounded-full border-2 border-red-700 flex items-center justify-center";
    if (radioRekhaCircle) radioRekhaCircle.className = "w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center";
    if (radioAayush) radioAayush.classList.remove("hidden");
    if (radioRekha) radioRekha.classList.add("hidden");
  } else {
    if (cardRekha) {
      cardRekha.className = "cursor-pointer rounded-2xl p-4 relative transition border-2 border-red-600 bg-red-50/20";
    }
    if (cardAayush) {
      cardAayush.className = "cursor-pointer rounded-2xl p-4 relative transition border border-slate-200 bg-white hover:border-slate-300";
    }
    if (radioRekhaCircle) radioRekhaCircle.className = "w-4 h-4 rounded-full border-2 border-red-700 flex items-center justify-center";
    if (radioAayushCircle) radioAayushCircle.className = "w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center";
    if (radioRekha) radioRekha.classList.remove("hidden");
    if (radioAayush) radioAayush.classList.add("hidden");
  }
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

// 4. Open Booking Page
window.openAppointmentBooking = function() {
  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = window.renderAppointmentBookingView();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
};

// 5. Booking Confirmation
window.confirmAppointment = function() {
  const name = document.getElementById("patientName") ? document.getElementById("patientName").value.trim() : "";
  const phone = document.getElementById("patientPhone") ? document.getElementById("patientPhone").value.trim() : "";
  
  if (!name) {
    alert("Please enter the patient's full name.");
    document.getElementById("patientName")?.focus();
    return;
  }
  if (!phone) {
    alert("Please enter a phone number.");
    document.getElementById("patientPhone")?.focus();
    return;
  }

  alert(
    "Booking Successful!\n\n" +
    "Patient: " + name + "\n" +
    "Hospital: " + window.BOOKING_STATE.hospitalName + "\n" +
    "Doctor: " + window.BOOKING_STATE.doctorName + " (" + window.BOOKING_STATE.doctorRole + ")\n" +
    "Date: " + window.BOOKING_STATE.date + "\n" +
    "Time: " + window.BOOKING_STATE.timeSlot + "\n" +
    "Fee: " + window.BOOKING_STATE.fee + " (Pay at clinic)"
  );
};
/* ============================================================
   BOOKING CONFIRMATION SUCCESS VIEW (1:1 SCREENSHOT REPLICA)
   ============================================================ */

window.renderAppointmentSuccessView = function(patientData) {
  const patientName = patientData.name || "John Doe";
  const patientPhone = patientData.phone || "+977 98510XXXXX";
  const patientEmail = patientData.email || "johndoe@gmail.com";
  const patientReason = patientData.symptoms || "Routine cardiovascular check-up. Experiencing minor shortness of breath during light workouts over the past week.";
  const bookingRef = "SAINO-2026-" + Math.floor(1000 + Math.random() * 9000);

  return `
    <div id="booking-confirmation-container" class="bg-[#fbfcfd] min-h-screen text-slate-800 font-sans pb-24">
      
      <!-- Breadcrumb -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 pt-5 pb-4">
        <nav class="flex items-center gap-2 text-[11px] text-slate-400">
          <button type="button" onclick="navigateTo('marketplace')" class="hover:text-slate-600">Home</button>
          <span>›</span>
          <button type="button" onclick="backToHospitalList()" class="hover:text-slate-600">Hospitals</button>
          <span>›</span>
          <button type="button" onclick="openHospitalProfile('norvic')" class="hover:text-slate-600">Norvic Hospital</button>
          <span>›</span>
          <span class="text-red-700 font-medium">Booking Confirmed</span>
        </nav>
      </div>

      <div class="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">

        <!-- 1. Top Success Hero Card -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-10 text-center shadow-2xs">
          <!-- Green Shield Icon -->
          <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>

          <h1 class="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Appointment Booked Successfully!</h1>
          <p class="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
            Your booking is confirmed. Norvic Hospital has been notified of your appointment.
          </p>

          <!-- Booking Reference Pill -->
          <div class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-slate-200 bg-slate-50/70 text-xs text-slate-500 mt-5">
            <span>Booking Reference:</span>
            <strong class="font-bold text-red-700">${bookingRef}</strong>
          </div>
        </div>

        <!-- 2. Dual Column Details (Appointment Summary & Patient Info) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          <!-- Left: Appointment Summary -->
          <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 class="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Appointment Summary</h2>
            
            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Clinic</span>
              <div class="flex items-center gap-1 text-xs font-bold text-slate-900 mt-0.5">
                <svg class="w-3.5 h-3.5 text-red-600 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
                <span>${window.BOOKING_STATE.hospitalName}</span>
              </div>
              <p class="text-[11px] text-slate-500 ml-4.5">Thapathali, Kathmandu · Multi-specialty</p>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Doctor</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${window.BOOKING_STATE.doctorName}</div>
              <p class="text-[11px] text-slate-500">${window.BOOKING_STATE.doctorRole} (12 Yrs Experience)</p>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Date & Time</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${window.BOOKING_STATE.date}</div>
              <div class="text-[11px] font-bold text-red-700 mt-0.5">At ${window.BOOKING_STATE.timeSlot} (Morning Slot)</div>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Consultation Fee</span>
              <div class="text-sm font-black text-red-700 mt-0.5">${window.BOOKING_STATE.fee}</div>
              <p class="text-[10px] text-slate-400">Pay at the clinic counter during checkout</p>
            </div>
          </div>

          <!-- Right: Patient Information -->
          <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
            <h2 class="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">Patient Information</h2>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Patient Name</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${patientName}</div>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Contact Phone</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${patientPhone}</div>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Email Address</span>
              <div class="text-xs font-bold text-slate-900 mt-0.5">${patientEmail}</div>
            </div>

            <div>
              <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Reason for Visit</span>
              <p class="text-xs text-slate-600 mt-0.5 leading-relaxed font-normal">${patientReason}</p>
            </div>
          </div>

        </div>

        <!-- 3. Important Guidelines & Instructions -->
        <div class="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-3">
          <h2 class="text-xs font-bold text-slate-900 tracking-tight">Important Guidelines & Instructions</h2>
          <ul class="space-y-2 text-xs text-slate-600 list-disc list-inside">
            <li class="leading-relaxed">
              Please arrive at Norvic Hospital at least <strong class="text-red-700 font-semibold">15 minutes early</strong> to complete physical check-in and registry procedures.
            </li>
            <li class="leading-relaxed">
              Bring a valid <strong class="text-red-700 font-semibold">Government-issued Photo ID</strong> (Citizenship Card, Passport, or License) along with any previous medical/cardiology reports.
            </li>
            <li class="leading-relaxed">
              If you need to reschedule or cancel your slot, please notify the platform or clinic at least 4 hours before the scheduled time slot.
            </li>
          </ul>
        </div>

        <!-- 4. Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-4 pt-2">
          <button type="button" 
                  onclick="window.print()" 
                  class="flex-1 py-3 px-4 border border-red-700 text-red-700 hover:bg-red-50 text-xs font-bold rounded-xl transition text-center shadow-2xs">
            Download Confirmation PDF
          </button>
          
          <button type="button" 
                  onclick="navigateTo('marketplace')" 
                  class="flex-1 py-3 px-4 bg-[#991b1b] hover:bg-red-800 text-white text-xs font-bold rounded-xl transition text-center shadow-xs">
            Go Back to Homepage
          </button>
        </div>

      </div>
    </div>
  `;
};

// Confirm Button Handler with Form Data Extraction
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

  const patientPayload = {
    name: name,
    phone: phone,
    email: email || "johndoe@gmail.com",
    symptoms: symptoms || "Routine cardiovascular check-up. Experiencing minor shortness of breath during light workouts over the past week."
  };

  const main = document.getElementById("mainContent") || document.getElementById("main-content") || document.querySelector("main");
  if (main) {
    main.innerHTML = window.renderAppointmentSuccessView(patientPayload);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
};