(() => {
  "use strict";
  const API_BASE = "https://saino-backend-td51.onrender.com/api/provider";
  const app = document.getElementById("app");

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "◫" },
    { id: "appointments", label: "Appointments", icon: "▦" },
    { id: "queue", label: "Live Queue", icon: "✚" },
    { id: "doctors", label: "Doctors", icon: "🩺" },
    { id: "services", label: "Services", icon: "≡" },
    { id: "telemedicine", label: "Telemedicine", icon: "📹" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "reviews", label: "Reviews & Feedback", icon: "⭐" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "qr_marketplace", label: "QR Management", icon: "📱" },
    { id: "reports", label: "Reports", icon: "📊" },
    { id: "staff", label: "Staff & Reception", icon: "👤" },
    { id: "settings", label: "Settings", icon: "⚙" },
    { id: "billing", label: "Billing", icon: "🧾" }
  ];

  const state = {
    page: "dashboard",
    activeModal: null,
    appointmentFilter: "all",
    provider: { name: "Norvic International Hospital", tier: "VIP Tier", city: "Kathmandu, Nepal", rating: 4.7, reviews_count: 328, plan: "hospital", doctor_limit: 5, service_limit: 5 },
    user: { name: "Dr. Aayush Shrestha", role: "Provider Admin" },
    stats: { total: 42, marketplace: 18, walkin: 12, qr: 7, telemedicine: 5, waiting: 9 },
    queue: { serving: { token: 'A-023', patient_name: 'Ram Thapa', doctor: 'Dr. Rekha Shrestha', room: 'Room 102' }, waiting: [], stats: { waiting: 8, completed: 25, issued: 34, avg_consult: 14 } },
    doctors: [],
    services: [],
    appointments: [],
    payments: [],
    staff: [],
    paymentTotals: { total: 142850, cash: 48200, digital: 84150 }
  };

  async function loadData() {
    // Sync local marketplace bookings into provider dashboard
    try {
      const localAppts = JSON.parse(localStorage.getItem("SAINO_MY_APPOINTMENTS") || "[]");
      if (localAppts.length) {
        state.appointments = [...localAppts.map(b => ({
          token: b.token,
          booking_ref: b.bookingId,
          patient_name: b.patient,
          patient_phone: b.phone,
          doctor: b.doctor,
          room: "Room 301",
          source: "marketplace",
          slot_time: "10:30 AM",
          fee: 500,
          status: b.status || "Waiting"
        })), ...state.appointments];
      }
    } catch (_) {}
    try {
      const currentEmail =localStorage.getItem("currentProviderEmail") || "";
      const headers = {
        "Content-Type": "application/json",
        "x-provider-email": currentEmail
      };

      const [dashRes, docsRes, srvRes, apptRes, staffRes, payRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard?email=${encodeURIComponent(currentEmail)}`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/doctors?email=${encodeURIComponent(currentEmail)}`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/services?email=${encodeURIComponent(currentEmail)}`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/appointments?email=${encodeURIComponent(currentEmail)}`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/staff?email=${encodeURIComponent(currentEmail)}`, { headers }).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE}/payments?email=${encodeURIComponent(currentEmail)}`, { headers }).then(r => r.json()).catch(() => null)
      ]);

      if (dashRes && dashRes.success) {
        state.provider = dashRes.provider || state.provider;
        state.user = dashRes.user || state.user;
        state.stats = dashRes.stats || state.stats;
        state.queue = dashRes.queue || state.queue;
      }
      if (docsRes && docsRes.success) state.doctors = docsRes.rows || [];
      if (srvRes && srvRes.success) state.services = srvRes.rows || [];
      if (apptRes && apptRes.success) state.appointments = apptRes.rows || [];
      if (staffRes && staffRes.success) state.staff = staffRes.rows || [];
      if (payRes && payRes.success) {
        state.payments = payRes.rows || [];
        state.paymentTotals = payRes.totals || state.paymentTotals;
      }
    } catch (e) {
      console.error("API error:", e);
    }
    render();
  }

  function playAirportChime() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5 Note
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5 Note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (_) {}
  }

  async function triggerQueueAction(action) {
    if (!state.queue) state.queue = { serving: null, waiting: [], stats: { waiting: 0, completed: 0, issued: 0 } };
    if (!state.queue.waiting) state.queue.waiting = [];
    if (!state.queue.stats) state.queue.stats = { waiting: 0, completed: 0, issued: 0 };

    if (action === "call-next") {
      playAirportChime(); // 🔔 Airport ding-dong sound alert

      if (state.queue.waiting.length > 0) {
        const nextPatient = state.queue.waiting.shift();
        state.queue.serving = {
          token: nextPatient.token,
          patient_name: nextPatient.patient_name || nextPatient.patient,
          doctor: nextPatient.doctor || state.user.name,
          room: nextPatient.room || "Room 301"
        };
        state.queue.stats.waiting = Math.max(0, state.queue.waiting.length);
      } else {
        const currentNum = state.queue.serving ? parseInt(state.queue.serving.token.replace(/[^0-9]/g, ''), 10) || 20 : 20;
        const nextToken = `A-${currentNum + 1}`;
        state.queue.serving = {
          token: nextToken,
          patient_name: "Walk-in Patient",
          doctor: state.user.name || "Dr. Rajesh Verma",
          room: "Room 301"
        };
      }

      localStorage.setItem("SAINO_NOW_SERVING", state.queue.serving.token);
      render();
    } 
    else if (action === "done") {
      // 1. Consultation Complete
      const finishedPatient = state.queue.serving;
      state.queue.stats.completed = (state.queue.stats.completed || 0) + 1;

      // 2. Automated Post-Consultation Feedback Loop
      if (finishedPatient) {
        const patientName = finishedPatient.patient_name || "Verified Patient";
        const newReview = {
          id: "rev_" + Date.now(),
          user: patientName,
          rating: 5,
          date: "Just now",
          comment: `Consultation with ${finishedPatient.doctor || 'doctor'} completed smoothly. Excellent clinical care via SAINO queue.`
        };

        try {
          const reviewsStore = JSON.parse(localStorage.getItem("SAINO_PROVIDER_REVIEWS") || "{}");
          const pid = state.provider.id || "clinic";
          if (!reviewsStore[pid]) reviewsStore[pid] = [];
          reviewsStore[pid].unshift(newReview);
          localStorage.setItem("SAINO_PROVIDER_REVIEWS", JSON.stringify(reviewsStore));
        } catch (_) {}
      }

      // 3. Move to next patient automatically
      triggerQueueAction("call-next");
    } 
    else if (action === "skip") {
      if (state.queue.serving) {
        state.queue.waiting.push({
          token: state.queue.serving.token,
          patient_name: state.queue.serving.patient_name,
          doctor: state.queue.serving.doctor,
          room: state.queue.serving.room,
          status: "Waiting",
          source: "Skipped"
        });
      }
      triggerQueueAction("call-next");
    }

    // Background sync to backend port 4000
    try {
      await fetch(API_BASE + "/queue/" + action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state.queue)
      });
    } catch (_) {}
  }

  function kpiCard(title, val, sub, colorClass, badge) {
    const badgeHtml = badge ? '<span class="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">' + badge + '</span>' : '';
    return '<div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">' +
      '<div class="flex items-center justify-between"><span class="text-[11px] font-semibold text-slate-500">' + title + '</span>' + badgeHtml + '</div>' +
      '<div class="text-2xl font-black text-slate-900 my-1">' + val + '</div>' +
      '<div class="text-[10px] font-bold ' + colorClass + '">' + sub + '</div>' +
    '</div>';
  }

  function statusBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'in_consultation') return '<span class="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">In Consultation</span>';
    if (s === 'waiting') return '<span class="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px]">Waiting</span>';
    if (s === 'completed') return '<span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-[10px]">Completed</span>';
    if (s === 'cancelled') return '<span class="bg-red-50 text-red-700 px-2 py-0.5 rounded font-bold text-[10px]">Cancelled</span>';
    return '<span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">' + status + '</span>';
  }
/* ============================================================
     RENDER MASTER CONTROLLER (SOLO DOCTOR VS HOSPITAL POCKET DESK)
     ============================================================ */
  function render() {
    if (!app) return;

    // 1. Detect: Single Doctor Clinic vs Large Hospital
    const isSolo = (state.provider && state.provider.provider_type === 'solo_doctor') || 
                   (state.provider && state.provider.plan === 'clinic') || 
                   (state.doctors && state.doctors.length <= 1);

    // Solo Doctor gets clean 5-tool Pocket Console; Hospitals get all tabs
    const visibleNavItems = isSolo 
      ? navItems.filter(item => ['dashboard', 'appointments', 'doctors', 'qr_marketplace', 'settings'].includes(item.id))
      : navItems;

    let navHtml = '';
    for (let i = 0; i < visibleNavItems.length; i++) {
      const item = visibleNavItems[i];
      const active = state.page === item.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200';
      navHtml += '<button class="nav-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition ' + active + '" data-page="' + item.id + '">' +
        '<span class="text-sm">' + item.icon + '</span><span>' + item.label + '</span>' +
      '</button>';
    }

    // 2. Real Clinic Name & Location (Raipur, Chhattisgarh Context)
    const clinicName = state.provider.name || "Saino Partner Clinic";
    const clinicCity = state.provider.city ? (state.provider.city + ', Chhattisgarh') : "Raipur, Chhattisgarh";
    const planBadge = isSolo ? 'Solo Doctor Plan' : (state.provider.plan_name || 'Hospital VIP Plan');

    app.innerHTML = '<div class="flex min-h-screen">' +
      '<aside class="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800">' +
        '<div class="p-5 border-b border-slate-800 flex items-center gap-3">' +
          '<div class="bg-red-500 text-white font-bold w-8 h-8 rounded-lg flex items-center justify-center text-lg">S</div>' +
          '<div>' +
            '<div class="font-bold text-white text-sm tracking-wide">SAINO Health</div>' +
            '<div class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">' + (isSolo ? 'DOCTOR POCKET DESK' : 'PROVIDER NETWORK') + '</div>' +
          '</div>' +
        '</div>' +
        '<nav class="flex-1 p-3 space-y-1 overflow-y-auto">' + navHtml + '</nav>' +
        '<div class="p-4 m-3 bg-slate-950/60 border border-slate-800 rounded-xl">' +
          '<div class="text-xs font-bold text-slate-200">Reception QR Standee</div>' +
          '<div class="text-[11px] text-slate-400 mt-0.5">' + clinicName + ' Instant Token</div>' +
          '<button class="nav-item mt-3 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg border border-slate-700 transition" data-page="qr_marketplace">⬇ View &amp; Print Standee</button>' +
        '</div>' +
      '</aside>' +
      '<div class="flex-1 flex flex-col min-w-0 overflow-x-hidden">' +
        '<header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">' +
          '<div class="w-96"><input type="text" placeholder="Search patients, tokens, appointments..." class="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"></div>' +
          '<div class="flex items-center gap-6">' +
            '<div class="text-right">' +
              '<div class="text-xs font-bold text-slate-900 flex items-center gap-1.5 justify-end">' + 
                clinicName + 
                '<span class="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded border border-emerald-200 font-bold">' + planBadge + '</span>' +
              '</div>' +
              '<div class="text-[11px] text-slate-500">' + clinicCity + '</div>' +
            '</div>' +
            '<button class="modal-trigger flex items-center gap-3 pl-4 border-l border-slate-200 hover:opacity-80 transition cursor-pointer text-left" data-modal="settings">' +
              '<div class="text-right"><div class="text-xs font-bold text-slate-900">' + state.user.name + ' ⚙</div><div class="text-[10px] text-slate-500">' + state.user.role + '</div></div>' +
              '<div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">DR</div>' +
            '</button>' +
          '</div>' +
        '</header>' +
        '<main class="flex-1 p-6 overflow-y-auto">' + renderPageContent() + '</main>' +
      '</div>' +
    '</div>' + renderModal();

    bindEvents();
  }

  function renderPageContent() {
    switch (state.page) {
      case "dashboard": return renderDashboard();
      case "appointments": return renderAppointments();
      case "queue": return renderQueue();
      case "doctors": return renderDoctors();
      case "services": return renderServices();
      case "telemedicine": return renderTelemedicine();
      case "payments": return renderPayments();
      case "reviews": return renderReviews();
      case "notifications": return renderNotifications();
      case "qr_marketplace": return renderQRMarketplace();
      case "reports": return renderReports();
      case "staff": return renderStaff();
      case "settings": return renderSettings();
      case "billing": return renderBilling();
      default: return renderDashboard();
    }
  }

  // 1. DASHBOARD
  function renderDashboard() {
    // A. Live Queue variables (servToken define ho gaya)
    const s = (state.queue && state.queue.serving) || null;
    const servToken = s ? s.token : 'A-023';
    const servName = s ? s.patient_name : 'Patient Name';
    const servDoc = (s && s.doctor) ? ('• ' + s.doctor) : '• Assigned Doctor';
    const waitCount = (state.queue && state.queue.stats && state.queue.stats.waiting) || 8;

    // B. Profile Completeness variables
    const p = state.provider || {};
    const doctors = state.doctors || [];

    const hasBasic = Boolean(p.name && p.name.length > 2 && p.phone && p.description);
    const hasAddress = Boolean(p.address || p.address_line);
    const hasMedia = Boolean(p.logo_url && p.cover_image_url);
    const hasDoctor = Boolean(doctors.length > 0);
    const hasPayment = Boolean(p.upi_id);

    let score = 0;
    if (hasBasic) score += 20;
    if (hasAddress) score += 20;
    if (hasMedia) score += 20;
    if (hasDoctor) score += 20;
    if (hasPayment) score += 20;

    // C. 0% - 100% Naukri Style Completeness Card
    const completenessCardHtml = '<div class="mb-6 p-5 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md">' +
      '<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">' +
        '<div>' +
          '<div class="flex items-center gap-2">' +
            '<span class="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider">Required For Marketplace Listing</span>' +
            '<span class="text-xs font-bold text-slate-300">Profile Completeness: <strong class="text-white text-sm">' + score + '%</strong></span>' +
          '</div>' +
          '<h3 class="text-sm font-extrabold text-white mt-1">Complete your facility profile to start accepting patient bookings</h3>' +
          '<p class="text-xs text-slate-400 mt-0.5">Patients discover your clinic, view doctor details and book OPD tokens only after your profile reaches 100%.</p>' +
        '</div>' +
        '<button class="modal-trigger px-4 py-2.5 bg-[#ad0b0e] hover:bg-[#8f080b] text-white text-xs font-bold rounded-xl transition shadow-md shrink-0 flex items-center gap-2" data-modal="profile_editor">' +
          '<span>Complete Profile</span> <span>➜</span>' +
        '</button>' +
      '</div>' +
      '<div class="w-full bg-slate-700/60 rounded-full h-2 mt-4 overflow-hidden">' +
        '<div class="bg-gradient-to-r from-red-500 to-emerald-400 h-2 rounded-full transition-all duration-500" style="width: ' + score + '%;"></div>' +
      '</div>' +
      '<div class="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-slate-700/60 text-[11px]">' +
        '<div class="flex items-center gap-1.5 ' + (hasBasic ? 'text-emerald-400 font-semibold' : 'text-slate-400') + '">' +
          '<span>' + (hasBasic ? '✓' : '○') + '</span> Basic Bio (20%)' +
        '</div>' +
        '<div class="flex items-center gap-1.5 ' + (hasAddress ? 'text-emerald-400 font-semibold' : 'text-slate-400') + '">' +
          '<span>' + (hasAddress ? '✓' : '○') + '</span> Address & Maps (20%)' +
        '</div>' +
        '<div class="flex items-center gap-1.5 ' + (hasMedia ? 'text-emerald-400 font-semibold' : 'text-slate-400') + '">' +
          '<span>' + (hasMedia ? '✓' : '○') + '</span> Logo & Cover (20%)' +
        '</div>' +
        '<div class="flex items-center gap-1.5 ' + (hasDoctor ? 'text-emerald-400 font-semibold' : 'text-slate-400') + '">' +
          '<span>' + (hasDoctor ? '✓' : '○') + '</span> Doctor & Fee (20%)' +
        '</div>' +
        '<div class="flex items-center gap-1.5 ' + (hasPayment ? 'text-emerald-400 font-semibold' : 'text-slate-400') + '">' +
          '<span>' + (hasPayment ? '✓' : '○') + '</span> Payout UPI ID (20%)' +
        '</div>' +
      '</div>' +
    '</div>';

    // D. Upcoming Queue list
    let upHtml = '';
    const waitingList = (state.queue && state.queue.waiting && state.queue.waiting.length) ? state.queue.waiting : [
      { token: 'A-024', patient_name: 'Sita Verma', doctor: 'Dr. Rajesh Verma', room: 'Chamber 1', source: 'Marketplace', status: 'Waiting', wait: '4m' },
      { token: 'A-025', patient_name: 'Bishal Sharma', doctor: 'Dr. Rajesh Verma', room: 'Chamber 1', source: 'QR Booking', status: 'Arrived', wait: '8m' }
    ];

    for (let i = 0; i < waitingList.length; i++) {
      const w = waitingList[i];
      upHtml += '<div class="px-4 py-3 flex items-center justify-between border-b border-slate-100">' +
        '<div class="flex items-center gap-3">' +
          '<span class="font-bold text-slate-900 text-xs w-12">' + w.token + '</span>' +
          '<div>' +
            '<div class="text-xs font-bold text-slate-800">' + w.patient_name + '</div>' +
            '<div class="text-[11px] text-slate-500">' + (w.doctor || 'Doctor Assigned') + ' • ' + (w.room || 'Chamber 1') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
          '<span class="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">' + w.source + '</span>' +
          '<span class="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded font-bold">' + w.status + '</span>' +
          '<span class="text-xs text-slate-400 w-16 text-right">' + (w.wait || '8m') + '</span>' +
        '</div>' +
      '</div>';
    }

    // E. Final Dashboard Return
    return completenessCardHtml +
      '<div class="flex items-center justify-between mb-6">' +
        '<div>' +
          '<h1 class="text-xl font-bold text-slate-900">Good morning, ' + state.user.name + '</h1>' +
          '<p class="text-xs text-slate-500 mt-0.5">Thursday, 8 Oct 2026 • ' + state.provider.name + ', ' + state.provider.city + '</p>' +
        '</div>' +
        '<button class="modal-trigger px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition" data-modal="token">+ Issue Token</button>' +
      '</div>' +

      '<div class="grid grid-cols-6 gap-4 mb-6">' +
        kpiCard("Appointments today", state.stats.total || 42, "+8 vs yesterday", "text-emerald-600") +
        kpiCard("Marketplace bookings", state.stats.marketplace || 18, "+4 vs yesterday", "text-emerald-600") +
        kpiCard("Walk-ins", state.stats.walkin || 12, "+1 vs yesterday", "text-emerald-600") +
        kpiCard("QR bookings", state.stats.qr || 7, "+3 vs yesterday", "text-emerald-600") +
        kpiCard("Telemedicine", state.stats.telemedicine || 5, "-1 vs yesterday", "text-slate-500") +
        kpiCard("Waiting now", state.stats.waiting || 9, "In OPD holding", "text-red-500", "Avg 14m") +
      '</div>' +

      '<div class="grid grid-cols-3 gap-6">' +
        '<div class="col-span-2 space-y-4">' +
          '<div class="flex items-center justify-between">' +
            '<div class="flex items-center gap-2">' +
              '<h2 class="text-sm font-bold text-slate-900">Live Queue</h2>' +
              '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">● Live</span>' +
            '</div>' +
            '<div class="text-xs text-slate-500">Department: <span class="font-semibold text-slate-700">General OPD</span></div>' +
          '</div>' +

          '<div class="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 flex items-center justify-between">' +
            '<div>' +
              '<div class="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">NOW SERVING</div>' +
              '<div class="text-3xl font-extrabold text-slate-900 my-1">' + servToken + '</div>' +
              '<div class="text-sm font-bold text-slate-900">' + servName + ' <span class="font-normal text-slate-500">' + servDoc + '</span></div>' +
              '<div class="text-xs text-slate-500 mt-1">Waiting in hall: <strong class="text-slate-700">' + waitCount + ' patients</strong> • Est. current wait: <strong class="text-slate-700">12 mins</strong></div>' +
            '</div>' +
            '<div class="flex gap-2">' +
              '<button class="queue-btn px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition" data-action="call-next">📢 Call next</button>' +
              '<button class="queue-btn px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition" data-action="skip">⏭ Skip</button>' +
              '<button class="queue-btn px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition" data-action="done">✓ Done</button>' +
            '</div>' +
          '</div>' +

          '<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">' +
            '<div class="px-4 py-3 border-b border-slate-100 flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">' +
              '<span>UPCOMING IN QUEUE</span>' +
              '<button class="modal-trigger text-xs font-bold text-slate-900 hover:underline" data-modal="token">+ Issue Token</button>' +
            '</div>' +
            '<div class="divide-y divide-slate-100">' + upHtml + '</div>' +
          '</div>' +
        '</div>' +

        '<div class="space-y-4">' +
          '<div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">' +
            '<div class="flex justify-between items-start">' +
              '<div>' +
                '<h3 class="text-sm font-bold text-slate-900">' + state.provider.name + '</h3>' +
                '<p class="text-xs text-slate-500">' + state.provider.city + '</p>' +
              '</div>' +
              '<span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">' + (state.provider.tier || 'VIP') + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-2 mt-3 text-xs">' +
              '<span class="font-bold text-slate-900">' + state.provider.rating + ' ★</span>' +
              '<span class="text-slate-500">(' + state.provider.reviews_count + ' reviews)</span>' +
              '<span class="ml-auto text-emerald-600 font-semibold text-[11px]">● Active on Marketplace</span>' +
            '</div>' +
            '<div class="grid grid-cols-2 gap-2 mt-4">' +
              '<button class="nav-item py-1.5 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50" data-page="qr_marketplace">↗ QR & Portal</button>' +
              '<button class="modal-trigger py-1.5 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50" data-modal="settings">⚙ Edit Settings</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }
  function renderAppointments() {
    const filter = state.appointmentFilter || 'all';
    const list = filter === 'all' ? state.appointments : state.appointments.filter(a => (a.source || '').toLowerCase() === filter.toLowerCase());

    let tabsHtml = '';
    const tabs = [
      { id: 'all', label: 'All', count: state.appointments.length },
      { id: 'marketplace', label: 'Marketplace', count: state.appointments.filter(a => a.source === 'marketplace').length },
      { id: 'qr', label: 'QR Booking', count: state.appointments.filter(a => a.source === 'qr').length },
      { id: 'walkin', label: 'Walk-in', count: state.appointments.filter(a => a.source === 'walkin').length },
      { id: 'phone', label: 'Phone', count: state.appointments.filter(a => a.source === 'phone').length },
      { id: 'telemedicine', label: 'Telemedicine', count: state.appointments.filter(a => a.source === 'telemedicine').length }
    ];

    for (let i = 0; i < tabs.length; i++) {
      const t = tabs[i];
      const active = filter === t.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
      tabsHtml += '<button class="filter-tab px-3 py-1.5 rounded-lg text-xs font-semibold transition ' + active + '" data-filter="' + t.id + '">' + t.label + ' <span class="ml-1 opacity-70">(' + t.count + ')</span></button>';
    }

    let rowsHtml = '';
    if (!list.length) {
      rowsHtml = '<tr><td colspan="7" class="p-8 text-center text-slate-400">No appointments in database for this filter.</td></tr>';
    } else {
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        rowsHtml += '<tr class="hover:bg-slate-50/60 border-b border-slate-100">' +
          '<td class="p-3 font-bold text-slate-900">' + (a.token || 'A-000') + '<br><span class="text-[10px] text-slate-400 font-normal">' + (a.booking_ref || '') + '</span></td>' +
          '<td class="p-3 font-semibold text-slate-800">' + (a.patient_name || 'Patient') + '<br><span class="text-[10px] text-slate-400">' + (a.patient_phone || '—') + '</span></td>' +
          '<td class="p-3 text-slate-700">' + (a.doctor || 'General OPD') + '<br><span class="text-[10px] text-slate-400">' + (a.room || 'Room 101') + '</span></td>' +
          '<td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[10px]">' + (a.source || 'walkin') + '</span></td>' +
          '<td class="p-3 text-slate-600">' + (a.slot_time || '10:00 AM') + '</td>' +
          '<td class="p-3 font-semibold text-slate-900">Rs. ' + (a.fee || 800) + '</td>' +
          '<td class="p-3">' + statusBadge(a.status) + '</td>' +
        '</tr>';
      }
    }

    return '<div class="flex items-center justify-between mb-5">' +
      '<div><h1 class="text-xl font-bold text-slate-900">Appointments Management</h1><p class="text-xs text-slate-500 mt-0.5">Manage, filter and check in hospital bookings across all channels</p></div>' +
      '<div class="flex gap-2"><button id="exportCsvBtn" class="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50">⬇ Export CSV</button><button class="modal-trigger px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800" data-modal="token">+ New appointment</button></div>' +
    '</div>' +
    '<div class="flex gap-1.5 mb-4 border-b border-slate-200 pb-3">' + tabsHtml + '</div>' +
    '<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">' +
      '<table class="w-full text-left text-xs"><thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]"><tr><th class="p-3">TOKEN & ID</th><th class="p-3">PATIENT</th><th class="p-3">DOCTOR & DEPT</th><th class="p-3">SOURCE</th><th class="p-3">SLOT TIME</th><th class="p-3">FEE</th><th class="p-3">STATUS</th></tr></thead>' +
      '<tbody class="divide-y divide-slate-100">' + rowsHtml + '</tbody></table>' +
    '</div>';
  }

  function renderQueue() {
    const s = state.queue.serving;
    const servToken = s ? s.token : 'A-023';
    const servName = s ? s.patient_name : 'Ram Thapa';
    const servDoc = (s && s.doctor) ? ('Assigned to: ' + s.doctor + ' (' + s.room + ')') : 'Assigned to: Dr. Rekha Shrestha (Room 102)';

    let wRows = '';
    if (!state.queue.waiting.length) {
      wRows = '<tr><td colspan="5" class="p-6 text-center text-slate-400">Queue is currently clear. Click "+ Issue Manual Token" to add patients.</td></tr>';
    } else {
      for (let i = 0; i < state.queue.waiting.length; i++) {
        const w = state.queue.waiting[i];
        wRows += '<tr><td class="p-3 font-bold text-slate-900">' + w.token + '</td><td class="p-3 font-semibold text-slate-800">' + w.patient_name + '</td><td class="p-3 text-slate-600">' + (w.doctor || 'General OPD') + '</td><td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">' + w.source + '</span></td><td class="p-3">' + statusBadge(w.status) + '</td></tr>';
      }
    }

    return '<div class="flex items-center justify-between mb-5">' +
      '<div><h1 class="text-xl font-bold text-slate-900">Live Queue & Digital Token Console</h1><p class="text-xs text-slate-500 mt-0.5">Real-time patient flow, room assignment & token progression</p></div>' +
      '<div class="flex items-center gap-2"><span class="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">● Connected to HIS Terminal 04</span><button class="modal-trigger px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800" data-modal="token">+ Issue Manual Token</button></div>' +
    '</div>' +
    '<div class="grid grid-cols-3 gap-6">' +
      '<div class="col-span-2 space-y-4">' +
        '<div class="bg-emerald-50 border border-emerald-200 rounded-xl p-6">' +
          '<div class="flex justify-between items-center mb-2"><span class="text-xs font-bold text-emerald-800 uppercase tracking-wider">CURRENT CONSULTATION</span><span class="text-xs font-bold text-emerald-700">Room 102 Desk Active</span></div>' +
          '<div class="text-5xl font-black text-slate-900 my-2">' + servToken + '</div>' +
          '<div class="text-lg font-bold text-slate-900">' + servName + '</div>' +
          '<div class="text-xs text-slate-600 mt-1">' + servDoc + '</div>' +
          '<div class="flex gap-2.5 mt-6">' +
            '<button class="queue-btn px-5 py-2.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition" data-action="call-next">📢 Call Next Patient</button>' +
            '<button class="queue-btn px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition" data-action="skip">⏭ Skip Patient</button>' +
            '<button class="queue-btn px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition" data-action="done">✓ Mark Done & Discharge</button>' +
          '</div>' +
        '</div>' +
        '<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">' +
          '<div class="px-4 py-3 border-b border-slate-100 flex justify-between items-center"><span class="font-bold text-xs text-slate-700">Waiting Patients in Hall (' + state.queue.waiting.length + ')</span><button class="modal-trigger text-xs font-bold text-red-600 hover:underline" data-modal="token">+ Add to Queue</button></div>' +
          '<table class="w-full text-left text-xs"><thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px]"><tr><th class="p-3">TOKEN</th><th class="p-3">PATIENT</th><th class="p-3">DOCTOR</th><th class="p-3">SOURCE</th><th class="p-3">STATUS</th></tr></thead><tbody class="divide-y divide-slate-100">' + wRows + '</tbody></table>' +
        '</div>' +
      '</div>' +
      '<div class="space-y-4">' +
        '<div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">' +
          '<h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Department Summary</h3>' +
          '<div class="space-y-2 text-xs">' +
            '<div class="flex justify-between py-1.5 border-b border-slate-100"><span class="text-slate-500">Tokens Issued Today</span><span class="font-bold text-slate-900">' + (state.queue.stats.issued || 34) + '</span></div>' +
            '<div class="flex justify-between py-1.5 border-b border-slate-100"><span class="text-slate-500">Completed Consults</span><span class="font-bold text-emerald-600">' + (state.queue.stats.completed || 25) + '</span></div>' +
            '<div class="flex justify-between py-1.5 border-b border-slate-100"><span class="text-slate-500">Currently Waiting</span><span class="font-bold text-amber-600">' + state.queue.stats.waiting + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderDoctors() {
    let dRows = '';
    if (!state.doctors.length) {
      dRows = '<tr><td colspan="6" class="p-8 text-center text-slate-400">No doctors in database. Click "+ Add Doctor" to insert into PostgreSQL.</td></tr>';
    } else {
      for (let i = 0; i < state.doctors.length; i++) {
        const d = state.doctors[i];
        dRows += '<tr class="hover:bg-slate-50/60 cursor-pointer">' +
          '<td class="p-3">' +
            '<div class="flex items-center gap-3">' +
              '<img src="' + (d.avatar_url || 'assets/default-doctor.png') + '" class="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0" onerror="this.src=\'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&q=80\'">' +
              '<div>' +
                '<strong class="text-slate-900">' + d.name + '</strong>' +
                '<div class="text-[10px] text-slate-500 font-medium">' + (d.qualification || 'MBBS') + ' • ' + (d.experience_years || 5) + ' Yrs Exp</div>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td class="p-3 text-slate-700">' + d.department + '<br><span class="text-[10px] text-slate-500 font-medium">' + (d.room || 'Chamber 1') + '</span></td>' +
          '<td class="p-3 font-bold text-slate-900">₹' + (d.opd_fee || 500) + '</td>' +
          '<td class="p-3 text-slate-600">' + (d.shift_timings || '10:00 AM - 01:00 PM') + '</td>' +
          '<td class="p-3 text-slate-500">' + (d.nmc_no || 'CGMC-Reg') + '</td>' +
          '<td class="p-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active</span></td>' +
        '</tr>';
      }
    }

    return '<div class="flex items-center justify-between mb-5">' +
      '<div><div class="flex items-center gap-2"><h1 class="text-xl font-bold text-slate-900">Doctors Management</h1><span class="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold border border-blue-200">Quota: ' + state.doctors.length + ' of ' + (state.provider.doctor_limit || 5) + ' Doctors Used</span></div><p class="text-xs text-slate-500 mt-0.5">Directory, OPD consulting schedules, consultation fees & live availability</p></div>' +
      '<button class="modal-trigger px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition" data-modal="doctor">+ Add Doctor</button>' +
    '</div>' +
    '<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">' +
      '<table class="w-full text-left text-xs"><thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]"><tr><th class="p-3">DOCTOR & NMC</th><th class="p-3">DEPARTMENT & ROOM</th><th class="p-3">OPD FEE</th><th class="p-3">DUTY DAYS</th><th class="p-3">SHIFT TIMING</th><th class="p-3">STATUS</th></tr></thead><tbody class="divide-y divide-slate-100">' + dRows + '</tbody></table>' +
    '</div>';
  }

  function renderServices() {
    let sRows = '';
    if (!state.services.length) {
      sRows = '<tr><td colspan="5" class="p-8 text-center text-slate-400">No services in database. Click "+ Add Service" to insert into PostgreSQL.</td></tr>';
    } else {
      for (let i = 0; i < state.services.length; i++) {
        const s = state.services[i];
        sRows += '<tr class="hover:bg-slate-50/60">' +
          '<td class="p-3 font-bold text-slate-900">' + s.name + '<br><span class="text-[10px] text-slate-400 font-normal">' + (s.code || 'SVC-001') + '</span></td>' +
          '<td class="p-3 text-slate-700">' + s.category + '<br><span class="text-[10px] text-slate-500">' + s.department + '</span></td>' +
          '<td class="p-3 font-semibold text-slate-900">Rs. ' + s.price + '</td>' +
          '<td class="p-3 text-slate-600">' + s.duration_min + ' mins</td>' +
          '<td class="p-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Active</span></td>' +
        '</tr>';
      }
    }

    return '<div class="flex items-center justify-between mb-5">' +
      '<div><div class="flex items-center gap-2"><h1 class="text-xl font-bold text-slate-900">Services Management</h1><span class="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-bold border border-blue-200">Quota: ' + state.services.length + ' of ' + (state.provider.service_limit || 5) + ' Services Used</span></div><p class="text-xs text-slate-500 mt-0.5">Hospital clinical services, diagnostic tests & checkup packages</p></div>' +
      '<button class="modal-trigger px-3.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition" data-modal="service">+ Add Service</button>' +
    '</div>' +
    '<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">' +
      '<table class="w-full text-left text-xs"><thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]"><tr><th class="p-3">SERVICE NAME & CODE</th><th class="p-3">CATEGORY & DEPT</th><th class="p-3">PRICE</th><th class="p-3">DURATION</th><th class="p-3">STATUS</th></tr></thead><tbody class="divide-y divide-slate-100">' + sRows + '</tbody></table>' +
    '</div>';
  }

  function renderTelemedicine() {
    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Telemedicine & Virtual Consultations</h1><p class="text-xs text-slate-500 mt-0.5">Real-time video consultation queue & room controls</p></div><button class="modal-trigger px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800" data-modal="token">+ Quick Telehealth Invite</button></div>' +
    '<div class="bg-slate-900 text-white rounded-2xl p-6 shadow-xl mb-6">' +
      '<div class="flex justify-between items-center pb-4 border-b border-slate-800"><span class="text-xs font-bold text-slate-300">CONNECTED • HD ENCRYPTED • WebRTC TLS 1.3 • Suite 201</span><span class="text-xs font-mono text-emerald-400 font-bold">⏱ 08:46 Elapsed</span></div>' +
      '<div class="py-12 text-center"><div class="text-2xl font-bold text-slate-100">Patient: Rameshwor Adhikari (48M)</div><div class="text-xs text-slate-400 mt-1">Pokhara Client Room • 1080p @ 60fps • 1.8 Mbps Fiber (Optimal)</div>' +
      '<div class="mt-6 flex justify-center gap-3"><button class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold">🎤 Mute Mic</button><button class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold">📹 Stop Cam</button><button class="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold">End & Sign Off</button></div></div>' +
    '</div>';
  }

  function renderPayments() {
    let pRows = '';
    if (!state.payments.length) {
      pRows = '<tr><td colspan="6" class="p-8 text-center text-slate-400">No payment transactions found. Click "+ Record Counter Payment" to add.</td></tr>';
    } else {
      for (let i = 0; i < state.payments.length; i++) {
        const p = state.payments[i];
        pRows += '<tr class="hover:bg-slate-50/60">' +
          '<td class="p-3 font-bold text-slate-900">' + p.receipt_no + '</td><td class="p-3 font-semibold text-slate-800">' + p.patient_name + '</td><td class="p-3 text-slate-700">' + p.service_name + '</td><td class="p-3 font-bold text-slate-900">Rs. ' + p.amount + '</td><td class="p-3"><span class="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded text-[10px]">' + p.payment_method + ' (' + (p.account_mask || '****@upi') + ')</span></td><td class="p-3"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">' + p.status + '</span></td>' +
        '</tr>';
      }
    }

    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Payments & Financial Settlements</h1><p class="text-xs text-slate-500 mt-0.5">Hospital outpatient collections, counter billing & settlements</p></div><button class="modal-trigger px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800" data-modal="payment">+ Record Counter Payment</button></div>' +
    '<div class="grid grid-cols-4 gap-4 mb-5">' +
      kpiCard("Collected Today", "Rs. " + (state.paymentTotals.total || 142850), "+12.4% vs yday", "text-emerald-600") +
      kpiCard("Cash at Counter", "Rs. " + (state.paymentTotals.cash || 48200), "Counter Drawer A", "text-slate-800") +
      kpiCard("Digital at Counter", "Rs. " + (state.paymentTotals.digital || 84150), "Fonepay • eSewa • Khalti", "text-blue-600") +
      kpiCard("Pending Collection", "Rs. 10,500", "Awaiting counter bill", "text-amber-600") +
    '</div>' +
    '<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">' +
      '<table class="w-full text-left text-xs"><thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]"><tr><th class="p-3">RECEIPT</th><th class="p-3">PATIENT</th><th class="p-3">SERVICE / DOCTOR</th><th class="p-3">AMOUNT</th><th class="p-3">METHOD (MASKED A/C)</th><th class="p-3">STATUS</th></tr></thead><tbody class="divide-y divide-slate-100">' + pRows + '</tbody></table>' +
    '</div>';
  }

  function renderReviews() {
    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Reviews & Patient Feedback</h1><p class="text-xs text-slate-500 mt-0.5">Patient experience telemetry & verified responses</p></div></div>' +
    '<div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">' +
      '<div class="flex justify-between items-start"><div><div class="font-bold text-sm text-slate-900">Sunita Lama <span class="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Verified Patient</span></div><div class="text-[11px] text-slate-400">Visited General OPD • 2 hours ago</div></div><div class="text-amber-400 text-sm font-bold">★★★★☆ (4.0)</div></div>' +
      '<p class="text-xs text-slate-700">"Dr. Rekha Shrestha was extremely attentive and explained my diagnosis thoroughly. The digital token kiosk made it super easy!"</p>' +
    '</div>';
  }

  function renderNotifications() {
    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Notifications & Communication Engine</h1><p class="text-xs text-slate-500 mt-0.5">Automated patient reminders, queue broadcasts & messaging</p></div></div>' +
    '<div class="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-xs"><div class="font-bold text-slate-900">SMS Gateway Active</div><div class="text-slate-500 mt-1">Sparrow SMS & WhatsApp Business API connected. 3,480 reminders dispatched today.</div></div>';
  }

  function renderQRMarketplace() {
    const provName = state.provider.name || "Saino Partner Clinic";
    const provCity = state.provider.city || "Raipur, Chhattisgarh";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/index.html#' + (state.provider.id || 'clinic'))}`;

    return `
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Reception QR &amp; Touchpoint Desk</h1>
          <p class="text-xs text-slate-500 mt-0.5">Physical desk QR standee generator for instant patient OPD tokens • ${provName}</p>
        </div>
        <button onclick="window.print()" class="px-4 py-2 bg-[#ad0b0e] hover:bg-[#8f080b] text-white text-xs font-bold rounded-xl shadow-md transition">
          🖨 Print Official A4 Standee
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        
        <!-- Left: Official Physical Standee Preview -->
        <div class="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center flex flex-col items-center justify-between">
          <div class="w-full">
            <span class="text-[10px] font-black uppercase tracking-widest text-[#ad0b0e] block">OFFICIAL RECEPTION STANDEE</span>
            <h3 class="text-base font-extrabold text-slate-900 mt-1">${provName}</h3>
            <p class="text-xs text-slate-500">${provCity}</p>
          </div>

          <!-- Standee QR Frame with Logo -->
          <div class="my-5 p-4 rounded-2xl bg-white border-2 border-slate-900 shadow-xl flex flex-col items-center w-56">
            <img src="${qrUrl}" alt="Reception QR" class="w-44 h-44 object-contain">
            <div class="mt-2 text-[10px] font-black text-[#ad0b0e] uppercase tracking-wider">
              SCAN FOR INSTANT OPD TOKEN
            </div>
          </div>

          <div class="text-xs text-slate-600 space-y-1">
            <p class="font-bold text-slate-900">Skip the reception queue!</p>
            <p class="text-[11px] text-slate-500">Scan via camera or WhatsApp to get your live token and track your turn live on phone.</p>
          </div>

          <button onclick="window.print()" class="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-md">
            🖨 Print Reception Desk Poster (A4)
          </button>
        </div>

        <!-- Right: Touchpoint Analytics & QR Settings -->
        <div class="lg:col-span-7 space-y-5 text-left">
          
          <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Active QR Touchpoints &amp; Scan Telemetry</h3>
            
            <div class="space-y-3 text-xs">
              <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                <div>
                  <strong class="text-slate-900 block text-xs">Main Entrance &amp; Central Reception Standee</strong>
                  <span class="text-[11px] text-slate-500">Ground floor lobby kiosk • Active</span>
                </div>
                <div class="text-right">
                  <span class="font-black text-emerald-700 text-sm block">1,840 Scans</span>
                  <span class="text-[10px] text-slate-400">82% conversion</span>
                </div>
              </div>

              <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                <div>
                  <strong class="text-slate-900 block text-xs">Doctor Chamber Room Waiting Desk</strong>
                  <span class="text-[11px] text-slate-500">Chamber 1 entrance • Active</span>
                </div>
                <div class="text-right">
                  <span class="font-black text-emerald-700 text-sm block">640 Scans</span>
                  <span class="text-[10px] text-slate-400">Direct consultations</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Benefits Card -->
          <div class="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 text-xs text-emerald-900 space-y-2">
            <h4 class="font-bold flex items-center gap-1.5 text-emerald-950">
              <span>✓</span> Zero Friction Patient Habit
            </h4>
            <p class="text-[11px] leading-relaxed text-emerald-800">
              When patients scan your reception standee, they book directly with their unique SAINO ID. Your receptionist doesn't have to manually enter paper tokens, and patients can track their turn right from the waiting room.
            </p>
          </div>

        </div>

      </div>
    `;
  }
  function renderReports() {
    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Reports & Analytics</h1><p class="text-xs text-slate-500 mt-0.5">Outpatient volume trends, revenue telemetry & patient retention</p></div><button id="exportCsvBtnReports" class="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800">Export Complete Report (CSV)</button></div>' +
    '<div class="grid grid-cols-4 gap-4 mb-5">' +
      kpiCard("Total Appointments", state.appointments.length || 42, "Real DB records", "text-emerald-600") +
      kpiCard("Gross OPD Revenue", "Rs. " + (state.paymentTotals.total || 142850), "Direct Counter + Digital", "text-emerald-600") +
      kpiCard("Patient Retention", "38.4%", "1,090 repeat visits", "text-blue-600") +
      kpiCard("Avg Queue Wait Time", "18.5 mins", "Target SLA: <20m", "text-emerald-600") +
    '</div>';
  }

  function renderStaff() {
    let sRows = '';
    if (!state.staff.length) {
      sRows = '<tr><td colspan="4" class="p-8 text-center text-slate-400">No staff members in database. Click "+ Add Staff" to insert.</td></tr>';
    } else {
      for (let i = 0; i < state.staff.length; i++) {
        const s = state.staff[i];
        sRows += '<tr class="hover:bg-slate-50/60"><td class="p-3 font-bold text-slate-900">' + s.name + '</td><td class="p-3 text-slate-600">' + s.email + '</td><td class="p-3"><span class="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">' + s.role + '</span></td><td class="p-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">Active</span></td></tr>';
      }
    }

    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Staff & Reception Management</h1><p class="text-xs text-slate-500 mt-0.5">Hospital administrative accounts & OPD counter assignments</p></div><button class="modal-trigger px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800" data-modal="staff">+ Add Staff</button></div>' +
    '<div class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">' +
      '<table class="w-full text-left text-xs"><thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]"><tr><th class="p-3">STAFF MEMBER</th><th class="p-3">EMAIL</th><th class="p-3">ROLE</th><th class="p-3">STATUS</th></tr></thead><tbody class="divide-y divide-slate-100">' + sRows + '</tbody></table>' +
    '</div>';
  }

  function renderSettings() {
    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Provider Settings & Compliance</h1><p class="text-xs text-slate-500 mt-0.5">Hospital operational credentials & profile configuration</p></div><button class="modal-trigger px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800" data-modal="settings">⚙ Edit Hospital Profile</button></div>' +
    '<div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 max-w-2xl">' +
      '<h3 class="text-sm font-bold text-slate-900">Current Hospital Information</h3>' +
      '<div class="grid grid-cols-2 gap-4 text-xs">' +
        '<div><span class="text-slate-500">Hospital Name:</span> <strong class="text-slate-900 block mt-1">' + state.provider.name + '</strong></div>' +
        '<div><span class="text-slate-500">City / Location:</span> <strong class="text-slate-900 block mt-1">' + state.provider.city + '</strong></div>' +
        '<div><span class="text-slate-500">Admin Staff:</span> <strong class="text-slate-900 block mt-1">' + state.user.name + '</strong></div>' +
        '<div><span class="text-slate-500">Active Tier:</span> <strong class="text-blue-700 block mt-1">' + (state.provider.plan_name || 'Hospital Tier') + '</strong></div>' +
      '</div>' +
      '<button class="modal-trigger mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg" data-modal="settings">Edit Details</button>' +
    '</div>';
  }

  function renderBilling() {
    return '<div class="flex items-center justify-between mb-5"><div><h1 class="text-xl font-bold text-slate-900">Subscription & Billing</h1><p class="text-xs text-slate-500 mt-0.5">Plan tier, doctor & service quotas, and upgrade options</p></div><button class="modal-trigger px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg" data-modal="settings">Change / Upgrade Plan</button></div>' +
    '<div class="grid grid-cols-3 gap-6">' +
      '<div class="bg-white border ' + (state.provider.plan === 'clinic' ? 'border-2 border-emerald-500' : 'border-slate-200') + ' rounded-2xl p-6 shadow-sm">' +
        '<div class="flex justify-between items-center"><h3 class="font-bold text-base text-slate-900">Clinic Plan</h3>' + (state.provider.plan === 'clinic' ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">CURRENT</span>' : '') + '</div>' +
        '<div class="text-2xl font-black text-slate-900 my-2">₹3,999 <span class="text-xs text-slate-500 font-normal">/ month</span></div>' +
        '<ul class="text-xs text-slate-600 space-y-1.5 my-4"><li>✓ <strong>Max 3 Doctors</strong></li><li>✓ <strong>Max 3 Services</strong></li><li>✓ 3 Staff Logins</li><li>✓ QR + ETA Queue</li></ul>' +
      '</div>' +
      '<div class="bg-white border ' + (state.provider.plan === 'hospital' ? 'border-2 border-emerald-500' : 'border-slate-200') + ' rounded-2xl p-6 shadow-sm">' +
        '<div class="flex justify-between items-center"><h3 class="font-bold text-base text-slate-900">Hospital Plan</h3>' + (state.provider.plan === 'hospital' ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">CURRENT</span>' : '') + '</div>' +
        '<div class="text-2xl font-black text-slate-900 my-2">₹5,999 <span class="text-xs text-slate-500 font-normal">/ month</span></div>' +
        '<ul class="text-xs text-slate-600 space-y-1.5 my-4"><li>✓ <strong>Max 5 Doctors</strong> (+₹500/extra)</li><li>✓ <strong>Max 5 Services</strong></li><li>✓ 8 Staff Logins</li><li>✓ Ambulance Booking</li></ul>' +
      '</div>' +
      '<div class="bg-white border ' + (state.provider.plan === 'big_hospital' ? 'border-2 border-emerald-500' : 'border-slate-200') + ' rounded-2xl p-6 shadow-sm">' +
        '<div class="flex justify-between items-center"><h3 class="font-bold text-base text-slate-900">Big Hospital</h3>' + (state.provider.plan === 'big_hospital' ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">CURRENT</span>' : '') + '</div>' +
        '<div class="text-2xl font-black text-slate-900 my-2">₹9,999 <span class="text-xs text-slate-500 font-normal">/ month</span></div>' +
        '<ul class="text-xs text-slate-600 space-y-1.5 my-4"><li>✓ <strong>Max 15 Doctors</strong></li><li>✓ <strong>Max 15 Services</strong></li><li>✓ Unlimited Staff</li><li>✓ Full Enterprise HIS</li></ul>' +
      '</div>' +
    '</div>';
  }

  function renderModal() {
    if (!state.activeModal) return '';

    if (state.activeModal === 'token') {
      let docOpts = '<option value="">Any Available Doctor</option>';
      for (let i = 0; i < state.doctors.length; i++) {
        const d = state.doctors[i];
        docOpts += '<option value="' + d.id + '">' + d.name + ' (' + d.room + ')</option>';
      }

      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          '<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">Issue Manual OPD Token</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>' +
          '<form id="issueTokenForm" class="space-y-3 text-xs">' +
            '<div><label class="font-semibold text-slate-700">Patient Full Name *</label><input name="patient_name" required placeholder="e.g. Maya Gurung" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Mobile Phone (+977)</label><input name="patient_phone" placeholder="98XXXXXXXX" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Assign Doctor</label><select name="doctor_id" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">' + docOpts + '</select></div>' +
            '<div class="grid grid-cols-2 gap-2">' +
              '<div><label class="font-semibold text-slate-700">Source</label><select name="source" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"><option value="walkin">Walk-in</option><option value="phone">Phone Booking</option><option value="qr">QR Kiosk</option></select></div>' +
              '<div><label class="font-semibold text-slate-700">Consultation Fee (Rs.)</label><input name="fee" type="number" value="800" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '</div>' +
            '<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Issue Token to Queue</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'doctor') {
      return `
        <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden border border-slate-200">
            
            <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span class="text-[10px] font-black uppercase tracking-wider text-red-400">DOCTOR CREDENTIALS</span>
                <h3 class="font-extrabold text-sm text-white">Add Doctor &amp; OPD Consultation</h3>
              </div>
              <button type="button" class="close-modal text-slate-400 hover:text-white text-lg font-bold">✕</button>
            </div>

            <form id="addDocForm" class="p-6 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              
              <!-- Doctor Name & Photo -->
              <div>
                <label class="font-bold text-slate-700 block mb-1">Doctor Full Name *</label>
                <input name="name" required placeholder="Dr. Rajesh Verma" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
              </div>

              <div>
                <label class="font-bold text-slate-700 block mb-1">Doctor Profile Photo URL *</label>
                <input name="avatar_url" required placeholder="https://images.unsplash.com/... or uploaded photo link" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
              </div>

              <!-- Qualification & Speciality -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-slate-700 block mb-1">Qualifications &amp; Degree *</label>
                  <input name="qualification" required placeholder="MBBS, MD (Medicine)" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
                <div>
                  <label class="font-bold text-slate-700 block mb-1">Medical Speciality *</label>
                  <input name="department" required placeholder="Consultant Physician" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
              </div>

              <!-- Experience & Registration -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-slate-700 block mb-1">Experience (Years) *</label>
                  <input name="experience_years" type="number" required placeholder="12" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
                <div>
                  <label class="font-bold text-slate-700 block mb-1">NMC / State Reg No. *</label>
                  <input name="nmc_no" required placeholder="CGMC-18942 / NMC-XXXX" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
              </div>

              <!-- Consultation Fees in INR ₹ -->
              <div class="border border-slate-200 rounded-xl p-3 bg-slate-50/70">
                <div class="font-bold text-slate-900 mb-2">Consultation Pricing (INR ₹)</div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="font-bold text-slate-700 block mb-1">In-Person OPD Fee (₹) *</label>
                    <input name="opd_fee" type="number" required value="500" class="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600 font-bold">
                  </div>
                  <div>
                    <label class="font-bold text-slate-700 block mb-1">Follow-up / Online Fee (₹)</label>
                    <input name="followup_fee" type="number" value="300" class="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                  </div>
                </div>
              </div>

              <!-- Timings & Room -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="font-bold text-slate-700 block mb-1">OPD Shift Hours *</label>
                  <input name="shift_timings" value="10:00 AM - 01:00 PM, 05:00 PM - 08:00 PM" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
                <div>
                  <label class="font-bold text-slate-700 block mb-1">Chamber / Room</label>
                  <input name="room" value="Chamber 1" class="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-red-600">
                </div>
              </div>

              <div class="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button type="button" class="close-modal px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 transition">Cancel</button>
                <button type="submit" class="px-5 py-2 bg-[#ad0b0e] hover:bg-[#8f080b] text-white font-extrabold rounded-lg shadow-md transition">Save Doctor Profile</button>
              </div>

            </form>
          </div>
        </div>`;
    }

    if (state.activeModal === 'service') {
      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          '<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">Add New Service</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>' +
          '<form id="addSrvForm" class="space-y-3 text-xs">' +
            '<div><label class="font-semibold text-slate-700">Service Name *</label><input name="name" required placeholder="e.g. 2D Echo or Blood Test" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div class="grid grid-cols-2 gap-2"><div><label class="font-semibold text-slate-700">Category</label><input name="category" value="Consultations" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div><div><label class="font-semibold text-slate-700">Department</label><input name="department" value="General OPD" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div></div>' +
            '<div class="grid grid-cols-2 gap-2"><div><label class="font-semibold text-slate-700">Price (Rs.)</label><input name="price" type="number" value="850" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div><div><label class="font-semibold text-slate-700">Duration (min)</label><input name="duration_min" type="number" value="15" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div></div>' +
            '<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Save Service</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'staff') {
      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          '<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">Add Staff Member</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>' +
          '<form id="addStaffForm" class="space-y-3 text-xs">' +
            '<div><label class="font-semibold text-slate-700">Full Name *</label><input name="name" required placeholder="e.g. Sangita Maharjan" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Official Email *</label><input name="email" type="email" required placeholder="sangita@norvic.com" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Role</label><select name="role" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"><option value="Receptionist">Receptionist</option><option value="Billing Clerk">Billing Clerk</option><option value="Doctor">Doctor</option><option value="Provider Admin">Provider Admin</option></select></div>' +
            '<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Save Staff</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'payment') {
      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          '<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">Record Counter Payment</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>' +
          '<form id="recordPayForm" class="space-y-3 text-xs">' +
            '<div><label class="font-semibold text-slate-700">Patient Name *</label><input name="patient_name" required placeholder="e.g. Sita Devi Sharma" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Service / Consultation</label><input name="service_name" value="General Medicine OPD" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div class="grid grid-cols-2 gap-2"><div><label class="font-semibold text-slate-700">Amount (Rs.) *</label><input name="amount" type="number" value="850" required class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div><div><label class="font-semibold text-slate-700">Payment Method</label><select name="payment_method" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"><option value="Fonepay QR">Fonepay QR</option><option value="eSewa Direct">eSewa Direct</option><option value="Cash Counter">Cash Counter</option><option value="Khalti">Khalti</option><option value="Bank Transfer">Bank Transfer</option></select></div></div>' +
            '<div><label class="font-semibold text-slate-700">Masked Account / UPI ID</label><input name="account_mask" placeholder="9841***@esewa or A/C ****4819" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Record Transaction</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'settings') {
      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">' +
          '<div class="flex justify-between items-center pb-3 border-b border-slate-100 mb-4"><h3 class="font-bold text-sm text-slate-900">Hospital Profile & Settings</h3><button class="close-modal text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button></div>' +
          '<form id="editSettingsForm" class="space-y-3 text-xs">' +
            '<div><label class="font-semibold text-slate-700">Hospital Display Name</label><input name="name" value="' + state.provider.name + '" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">City / Location</label><input name="city" value="' + state.provider.city + '" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Admin Staff Name</label><input name="admin_name" value="' + state.user.name + '" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"></div>' +
            '<div><label class="font-semibold text-slate-700">Change Subscription Plan</label><select name="tier" class="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">' +
              '<option value="Clinic Tier"' + (state.provider.tier.includes('Clinic') ? ' selected' : '') + '>Clinic Plan (₹3,999/mo - 3 Doctors)</option>' +
              '<option value="VIP Tier"' + (!state.provider.tier.includes('Clinic') && !state.provider.tier.includes('Big') ? ' selected' : '') + '>Hospital Plan (₹5,999/mo - 5 Doctors)</option>' +
              '<option value="Big Hospital Tier"' + (state.provider.tier.includes('Big') ? ' selected' : '') + '>Big Hospital Plan (₹9,999/mo - 15 Doctors)</option>' +
            '</select></div>' +
            '<div class="pt-4 flex gap-2"><button type="button" class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Cancel</button><button type="submit" class="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Save</button></div>' +
          '</form>' +
        '</div>' +
      '</div>';
    }

    if (state.activeModal === 'qr_gen') {
      return '<div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">' +
          '<h3 class="font-bold text-sm text-slate-900 mb-2">Generated Standee QR</h3>' +
          '<div class="w-40 h-40 mx-auto my-4 bg-white border-2 border-slate-900 rounded-xl p-3 flex flex-col justify-between shadow-inner"><div class="flex justify-between"><div class="w-8 h-8 bg-slate-900 rounded-sm"></div><div class="w-8 h-8 bg-slate-900 rounded-sm"></div></div><div class="text-[9px] font-bold text-red-600">NORVIC QR</div><div class="flex justify-between"><div class="w-8 h-8 bg-slate-900 rounded-sm"></div><div class="w-8 h-8 bg-slate-900 rounded-sm"></div></div></div>' +
          '<p class="text-xs text-slate-600 font-semibold">Instant OPD Check-in & Token</p>' +
          '<div class="mt-4 flex gap-2"><button class="close-modal flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">Close</button><button class="flex-1 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold" onclick="window.print()">🖨 Print QR</button></div>' +
        '</div>' +
      '</div>';
    }

    return '';
  }

  function bindEvents() {
    document.querySelectorAll(".nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        state.page = btn.dataset.page;
        render();
      });
    });

    document.querySelectorAll(".filter-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        state.appointmentFilter = tab.dataset.filter;
        render();
      });
    });

    document.querySelectorAll(".queue-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        triggerQueueAction(btn.dataset.action);
      });
    });

    document.querySelectorAll(".modal-trigger").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeModal = btn.dataset.modal;
        render();
      });
    });

    document.querySelectorAll(".close-modal").forEach(btn => {
      btn.addEventListener("click", () => {
        state.activeModal = null;
        render();
      });
    });

    const exportBtn = document.getElementById("exportCsvBtn") || document.getElementById("exportCsvBtnReports");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        window.open(API_BASE + "/reports/export-csv", "_blank");
      });
    }

    const tokenForm = document.getElementById("issueTokenForm");
    if (tokenForm) tokenForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = await fetch(API_BASE + "/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: fd.get("patient_name"),
          patient_phone: fd.get("patient_phone"),
          doctor_id: fd.get("doctor_id") || null,
          source: fd.get("source") || "walkin",
          fee: parseInt(fd.get("fee"), 10) || 800
        })
      });
      const data = await res.json();
      if (data.success) {
        state.activeModal = null;
        await loadData();
      } else {
        alert(data.message);
      }
    });

   const docForm = document.getElementById("addDocForm");
    if (docForm) {
      docForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(docForm);

        const payload = {
          name: fd.get("name"),
          avatar_url: fd.get("avatar_url"),
          qualification: fd.get("qualification"),
          department: fd.get("department"),
          experience_years: parseInt(fd.get("experience_years"), 10) || 1,
          nmc_no: fd.get("nmc_no"),
          room: fd.get("room"),
          opd_fee: parseInt(fd.get("opd_fee"), 10) || 500,
          followup_fee: parseInt(fd.get("followup_fee"), 10) || 300,
          shift_timings: fd.get("shift_timings")
        };

        try {
          const res = await fetch(API_BASE + "/doctors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (data.success) {
            state.activeModal = null;
            await loadData(); // Reloads real doctors from PostgreSQL
            render();
          } else {
            alert(data.message || "Failed to save doctor");
          }
        } catch (err) {
          console.error("API error:", err);
          state.doctors.push({ ...payload, id: Date.now() });
          state.activeModal = null;
          render();
        }
      });
    }

    const srvForm = document.getElementById("addSrvForm");
    if (srvForm) srvForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = await fetch(API_BASE + "/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          category: fd.get("category"),
          department: fd.get("department"),
          price: parseInt(fd.get("price"), 10) || 850,
          duration_min: parseInt(fd.get("duration_min"), 10) || 15
        })
      });
      const data = await res.json();
      if (data.success) {
        state.activeModal = null;
        await loadData();
      } else {
        alert(data.message);
      }
    });

    const staffForm = document.getElementById("addStaffForm");
    if (staffForm) staffForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = await fetch(API_BASE + "/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          role: fd.get("role")
        })
      });
      const data = await res.json();
      if (data.success) {
        state.activeModal = null;
        await loadData();
      } else {
        alert(data.message);
      }
    });

    const payForm = document.getElementById("recordPayForm");
    if (payForm) payForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = await fetch(API_BASE + "/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: fd.get("patient_name"),
          service_name: fd.get("service_name"),
          amount: parseInt(fd.get("amount"), 10) || 850,
          payment_method: fd.get("payment_method"),
          account_mask: fd.get("account_mask") || "****@upi"
        })
      });
      const data = await res.json();
      if (data.success) {
        state.activeModal = null;
        await loadData();
      } else {
        alert(data.message);
      }
    });

    const settingsForm = document.getElementById("editSettingsForm");
    if (settingsForm) settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = await fetch(API_BASE + "/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          city: fd.get("city"),
          admin_name: fd.get("admin_name"),
          tier: fd.get("tier")
        })
      });
      const data = await res.json();
      if (data.success) {
        state.activeModal = null;
        await loadData();
      } else {
        alert(data.message);
      }
    });
  }

  loadData();
})();