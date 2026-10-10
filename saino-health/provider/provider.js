(() => {
    "use strict";

    const client = window.sainoSupabase;
    const app = document.getElementById("app");
    const PAGE_SIZE = 25;
    const sections = [
        { group: "WORKSPACE", items: [["dashboard", "Overview"], ["profile", "Profile"], ["preview", "Marketplace preview"]] },
        { group: "CARE & BOOKINGS", items: [["doctors", "Doctors"], ["services", "Services"], ["appointments", "Appointments"], ["queue", "Queue management"], ["telemedicine", "Telemedicine"], ["gallery", "Gallery"], ["reviews", "Reviews"]] },
        { group: "GROWTH", items: [["plans", "Plans & billing"], ["offers", "Campaigns & offers"], ["analytics", "Analytics"]] },
        { group: "ACCOUNT", items: [["notifications", "Notifications"], ["settings", "Settings"]] }
    ];
    const titles = Object.fromEntries(sections.flatMap(group => group.items));
    const state = { user: null, memberships: [], provider: null, page: "dashboard", notice: null };

    if (!client || !window.SAINO_SUPABASE_CONFIG?.url || !window.SAINO_SUPABASE_CONFIG?.anonKey) {
        app.className = "boot-state";
        app.innerHTML = `<section class="login-card"><div class="brand"><span class="brand-mark">S</span><strong>SAINO HEALTH</strong></div><h1>Supabase setup required</h1><p class="muted">Configure the public Supabase project URL and anon key in <code>admin/js/supabase-config.js</code> before opening the provider dashboard.</p></section>`;
        return;
    }

    client.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session && state.user?.id !== session.user.id) {
            window.setTimeout(() => loadWorkspace(session.user), 0);
        }
        if (event === "SIGNED_OUT") {
            state.user = null;
            state.provider = null;
            renderLogin();
        }
    });

    client.auth.getSession().then(({ data, error }) => {
        if (error) {
            renderLogin(error.message);
            return;
        }
        if (data.session) loadWorkspace(data.session.user);
        else renderLogin();
    });

    function renderLogin(errorMessage) {
        state.user = null;
        app.className = "login-shell";
        app.innerHTML = `
            <section class="login-card">
                <div class="brand"><span class="brand-mark">S</span><div><strong>SAINO HEALTH</strong><small>PROVIDER PORTAL</small></div></div>
                <h1>Manage your healthcare listing</h1>
                <p class="muted">Sign in using the account linked by SAINO to your provider profile.</p>
                ${errorMessage ? `<div class="login-error">${escapeHtml(errorMessage)}</div>` : ""}
                <form class="login-form" id="loginForm">
                    <label class="field"><span>Email address</span><input name="email" type="email" autocomplete="username" required></label>
                    <label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required></label>
                    <button class="primary" type="submit">Sign in to provider dashboard</button>
                </form>
            </section>`;
        document.getElementById("loginForm").addEventListener("submit", async event => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const { data, error } = await client.auth.signInWithPassword({
                email: values.get("email"),
                password: values.get("password")
            });
            if (error) {
                renderLogin(error.message);
                return;
            }
            await loadWorkspace(data.user);
        });
    }

    async function loadWorkspace(user) {
        if (state.user?.id === user.id && document.querySelector(".app-layout")) return;
        state.user = user;
        const { data, error } = await client
            .from("provider_members")
            .select("provider_id,member_role,providers(id,name,provider_type,city,plan,status,verification_status,profile_views,about,address,phone,logo_path,cover_path,opening_hours,latitude,longitude,social_links,emergency_available,telemedicine_enabled)")
            .order("created_at", { ascending: true });
        if (error) {
            renderLogin(`Could not load linked provider profiles: ${error.message}`);
            return;
        }
        state.memberships = (data || []).filter(item => item.providers);
        if (state.memberships.length === 0) {
            app.className = "login-shell";
            app.innerHTML = `
                <section class="login-card">
                    <div class="brand"><span class="brand-mark">S</span><div><strong>SAINO HEALTH</strong><small>PROVIDER PORTAL</small></div></div>
                    <h1>Provider access is not linked yet</h1>
                    <p class="muted">You are signed in as <strong>${escapeHtml(user.email)}</strong>, but no provider profile is linked to this account. Ask the SAINO team to connect your account. Once linked, sign in again to continue.</p>
                    <button class="secondary" id="providerSignOut">Sign out</button>
                </section>`;
            document.getElementById("providerSignOut").addEventListener("click", () => client.auth.signOut());
            return;
        }

        if (!state.provider || !state.memberships.some(item => item.provider_id === state.provider.id)) {
            state.provider = state.memberships[0].providers;
        } else {
            state.provider = state.memberships.find(item => item.provider_id === state.provider.id).providers;
        }
        renderShell();
        await renderPage();
    }

    function renderShell() {
        const selectedMembership = state.memberships.find(item => item.provider_id === state.provider.id);
        const selector = state.memberships.length > 1
            ? `<select id="providerSelect" aria-label="Select provider">${state.memberships.map(item => `<option value="${item.provider_id}" ${item.provider_id === state.provider.id ? "selected" : ""}>${escapeHtml(item.providers.name)}</option>`).join("")}</select>`
            : "";
        app.className = "app-layout";
        app.innerHTML = `
            <div class="mobile-overlay" id="mobileOverlay"></div>
            <aside class="sidebar" id="sidebar">
                <div class="brand"><span class="brand-mark">S</span><div><strong>SAINO</strong><small>PROVIDER PORTAL</small></div></div>
                <div class="provider-meta"><strong>${escapeHtml(state.provider.name)}</strong><span>${escapeHtml(state.provider.city)} · ${escapeHtml(label(state.provider.provider_type))}</span><span class="status ${escapeHtml(state.provider.status)}">${escapeHtml(label(state.provider.status))} · ${escapeHtml(label(state.provider.verification_status))}</span></div>
                <nav class="nav-list" aria-label="Provider dashboard">
                    ${sections.map(group => `<p class="nav-heading">${group.group}</p>${group.items.map(([key, title]) => `<button class="nav-item ${state.page === key ? "active" : ""}" data-page="${key}"><span>${iconFor(key)}</span>${title}${key === "notifications" ? '<span class="nav-count" id="unreadCount"></span>' : ""}</button>`).join("")}`).join("")}
                </nav>
                <div class="sidebar-footer"><span class="muted">${escapeHtml(label(selectedMembership.member_role))} · SAINO connected</span></div>
            </aside>
            <section class="main">
                <header class="topbar">
                    <div class="topbar-left"><button class="mobile-menu" id="mobileMenu" aria-label="Open menu">☰</button><div><small>PROVIDER DASHBOARD</small><h1>${titles[state.page]}</h1></div></div>
                    <div class="topbar-actions">${selector}<span class="muted user-email">${escapeHtml(state.user.email)}</span><button class="secondary" id="signOut">Sign out</button></div>
                </header>
                <main class="content" id="content"><p class="muted">Loading…</p></main>
            </section>
            <div class="notice-stack" id="noticeStack"></div>
            <div id="modalRoot"></div>`;

        document.getElementById("signOut").addEventListener("click", async () => {
            const { error } = await client.auth.signOut();
            if (error) notify(`Could not sign out: ${error.message}`, "error");
        });
        document.querySelectorAll("[data-page]").forEach(button => button.addEventListener("click", async () => {
            state.page = button.dataset.page;
            closeMenu();
            renderShell();
            await renderPage();
        }));
        document.getElementById("providerSelect")?.addEventListener("change", event => {
            state.provider = state.memberships.find(item => item.provider_id === event.target.value).providers;
            state.page = "dashboard";
            renderShell();
            renderPage();
        });
        document.getElementById("mobileMenu").addEventListener("click", openMenu);
        document.getElementById("mobileOverlay").addEventListener("click", closeMenu);
    }

    async function renderPage() {
        const content = document.getElementById("content");
        if (!content) return;
        content.innerHTML = '<p class="muted">Loading…</p>';
        try {
            const renderer = {
                dashboard: renderDashboard,
                profile: renderProfile,
                doctors: renderDoctors,
                services: renderServices,
                appointments: renderAppointments,
                queue: renderQueue,
                telemedicine: renderTelemedicine,
                gallery: renderGallery,
                reviews: renderReviews,
                preview: renderPreview,
                plans: renderPlans,
                offers: renderOffers,
                analytics: renderAnalytics,
                notifications: renderNotifications,
                settings: renderSettings
            }[state.page];
            await renderer();
        } catch (error) {
            if (content.isConnected) content.innerHTML = `<div class="notice error">Could not load ${escapeHtml(titles[state.page])}: ${escapeHtml(error.message)}</div>`;
        }
    }

    function providerIntro(eyebrow, title, description, action = "") {
        return `<div class="page-intro"><div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h2>${escapeHtml(title)}</h2><p class="muted">${escapeHtml(description)}</p></div>${action}</div>`;
    }

    async function exactCount(table, configure = () => {}) {
        let query = client.from(table).select("id", { count: "exact", head: true });
        query = configure(query);
        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
    }

    async function renderDashboard() {
        const id = state.provider.id;
        const planLevel = planLevelFor(state.provider.plan);
        const [doctors, services, appointments, reviews, notifications, metrics] = await Promise.all([
            exactCount("doctors", q => q.eq("provider_id", id)),
            exactCount("provider_services", q => q.eq("provider_id", id)),
            exactCount("appointments", q => q.select("id,appointment_slots!inner(provider_id)", { count: "exact", head: true }).eq("appointment_slots.provider_id", id)),
            planLevel >= 1 ? exactCount("reviews", q => q.eq("provider_id", id)) : Promise.resolve(null),
            exactCount("provider_notifications", q => q.eq("provider_id", id).is("read_at", null)),
            planLevel >= 2
                ? client.from("provider_metrics_daily").select("profile_views,searches,bookings").eq("provider_id", id).gte("metric_date", dateOffset(-6)).order("metric_date", { ascending: true })
                : Promise.resolve({ data: [], error: null })
        ]);
        if (metrics.error) throw metrics.error;
        document.getElementById("unreadCount").textContent = notifications || "";
        const profile = state.provider;
        const checks = [
            Boolean(profile.name && profile.name.trim()),
            Boolean(profile.about && profile.about.trim()),
            Boolean(profile.address && profile.address.trim()),
            Boolean(profile.city && profile.city.trim()),
            Boolean(profile.phone && profile.phone.trim()),
            Boolean(profile.opening_hours && Object.keys(profile.opening_hours).length),
            profile.latitude !== null && profile.latitude !== undefined && profile.longitude !== null && profile.longitude !== undefined
        ];
        const completion = Math.round(checks.filter(Boolean).length / checks.length * 100);
        const appointmentRows = await fetchAppointments(5, "upcoming");
        const views = metrics.data.reduce((sum, item) => sum + item.profile_views, 0);
        document.getElementById("content").innerHTML = `
            ${providerIntro("YOUR SAINO PRESENCE", `Welcome, ${profile.name}`, "Manage your listing, care team and bookings from one place.", `<button class="primary" data-navigate="profile">Complete your profile</button>`)}
            <section class="grid stats">
                ${stat("Profile completion", `${completion}%`, "Keep your marketplace information up to date")}
                ${stat("Appointments", appointments, "All booking requests")}
                ${stat("Reviews", reviews === null ? "VIP" : reviews, reviews === null ? "Upgrade to view and reply" : "Patient feedback")}
                ${stat("Profile views", planLevel >= 2 ? formatNumber(views) : "VVIP", planLevel >= 2 ? "Last 7 days" : "Upgrade for advanced analytics")}
            </section>
            <section class="grid content-grid">
                <div class="panel"><div class="panel-header"><div><h3>Upcoming appointments</h3><p class="panel-subtitle">Recent patient bookings for your provider profile.</p></div><button class="secondary" data-navigate="appointments">View appointments</button></div>${appointmentRows.length ? appointmentTable(appointmentRows) : `<div class="empty">No appointments to show yet.</div>`}</div>
                <div class="panel"><h3>Verification status</h3><p class="panel-subtitle">Marketplace publishing is controlled by SAINO approval.</p><p><span class="status ${escapeHtml(profile.verification_status)}">${escapeHtml(label(profile.verification_status))}</span></p><p class="muted">Provider listing: ${escapeHtml(label(profile.status))}<br>Subscription: ${escapeHtml(planName(profile.plan))}</p><button class="secondary" data-navigate="plans">View plan details</button></div>
            </section>
            <section class="panel"><div class="panel-header"><div><h3>Quick actions</h3><p class="panel-subtitle">Frequently used tools for your provider team.</p></div></div><div class="actions">${["doctors", "services", "appointments", "queue", "gallery", "offers"].map(page => `<button class="secondary" data-navigate="${page}">${titles[page]}</button>`).join("")}</div></section>`;
        bindNavigation();
    }

    function stat(title, value, caption) {
        return `<article class="stat-card"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(caption)}</small></article>`;
    }

    async function renderProfile() {
        const p = state.provider;
        const { data: requests, error } = await client.from("provider_change_requests").select("id,status,review_note,submitted_at").eq("provider_id", p.id).order("submitted_at", { ascending: false }).limit(5);
        if (error) throw error;
        document.getElementById("content").innerHTML = `
            ${providerIntro("LISTING PROFILE", "Profile details", "Changes to public listing details are sent to SAINO for approval before publishing.")}
            <div class="panel"><div class="panel-header"><div><h3>Provider information</h3><p class="panel-subtitle">Your current approved listing. New edits remain private until reviewed.</p></div><span class="status ${escapeHtml(p.verification_status)}">${escapeHtml(label(p.verification_status))}</span></div>
                <form id="profileForm" class="form-grid">
                    ${field("Provider name", "name", p.name, "text", true)}
                    ${selectField("Provider type", "provider_type", p.provider_type, [["hospital","Hospital"],["clinic","Clinic"],["diagnostic_centre","Diagnostic centre"],["other","Other"]])}
                    ${field("Phone", "phone", p.phone)}
                    ${field("City", "city", p.city, "text", true)}
                    ${field("Address", "address", p.address)}
                    ${field("Latitude", "latitude", p.latitude, "number", false, 'step="any" min="-90" max="90"')}
                    ${field("Longitude", "longitude", p.longitude, "number", false, 'step="any" min="-180" max="180"')}
                    ${field("About", "about", p.about, "textarea", false, "", "wide")}
                    ${field("Opening hours · JSON by day", "opening_hours", JSON.stringify(p.opening_hours || {}, null, 2), "textarea", false, "", "wide")}
                    ${field("Social links · JSON", "social_links", JSON.stringify(p.social_links || {}, null, 2), "textarea", false, "", "wide")}
                    ${uploadField("Logo", "logo", "image/*")}
                    ${uploadField("Cover photo", "cover", "image/*")}
                    <label class="check-row wide"><input type="checkbox" name="emergency_available" ${p.emergency_available ? "checked" : ""}> Emergency services are available</label>
                    <label class="check-row wide"><input type="checkbox" name="telemedicine_enabled" ${p.telemedicine_enabled ? "checked" : ""}> Enable online consultation listings</label>
                    <div class="wide actions"><button class="primary" type="submit">Submit profile changes for approval</button></div>
                </form>
            </div>
            <section class="panel"><h3>Recent change requests</h3><p class="panel-subtitle">SAINO reviews profile edits before marketplace updates.</p>${requests.length ? simpleTable(["Submitted", "Status", "Review note"], requests.map(item => [formatDate(item.submitted_at), statusTag(item.status), item.review_note || "Awaiting review"])) : `<div class="empty">No profile change requests yet.</div>`}</section>`;
        bindNavigation();
        document.getElementById("profileForm").addEventListener("submit", submitProfile);
    }

    async function submitProfile(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        let hours, social;
        try {
            hours = parseObject(form.get("opening_hours"), "Opening hours");
            social = parseObject(form.get("social_links"), "Social links");
        } catch (error) {
            notify(error.message, "error");
            return;
        }
        const latitude = nullableNumber(form.get("latitude"));
        const longitude = nullableNumber(form.get("longitude"));
        if ((latitude === null) !== (longitude === null) || (latitude !== null && (latitude < -90 || latitude > 90)) || (longitude !== null && (longitude < -180 || longitude > 180))) {
            notify("Enter both valid coordinates, or leave both blank.", "error");
            return;
        }
        const profile = {
            name: String(form.get("name")).trim(),
            provider_type: form.get("provider_type"),
            phone: String(form.get("phone") || "").trim(),
            city: String(form.get("city")).trim(),
            address: String(form.get("address") || "").trim(),
            about: String(form.get("about") || "").trim(),
            latitude, longitude, opening_hours: hours, social_links: social,
            emergency_available: form.get("emergency_available") === "on",
            telemedicine_enabled: form.get("telemedicine_enabled") === "on"
        };
        if (profile.name.length < 2 || !profile.city) {
            notify("Provider name and city are required.", "error");
            return;
        }
        try {
            for (const purpose of ["logo", "cover"]) {
                const file = form.get(purpose);
                if (file && file.size) profile[`${purpose}_path`] = await uploadMedia(file, purpose);
            }
        } catch (error) {
            notify(`Image upload failed: ${error.message}`, "error");
            return;
        }
        const { error } = await client.from("provider_change_requests").insert({
            provider_id: state.provider.id,
            submitted_by: state.user.id,
            profile
        });
        if (error) {
            notify(`Could not submit profile: ${error.message}`, "error");
            return;
        }
        notify("Profile submitted to SAINO for approval.", "success");
        await renderProfile();
    }

    async function renderDoctors() {
        const { data, error } = await client.from("doctors").select("*").eq("provider_id", state.provider.id).order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
        if (error) throw error;
        const rows = await Promise.all(data.map(async doctor => {
            let photo = "";
            if (doctor.photo_path) photo = await signedMedia(doctor.photo_path);
            return `<tr><td><strong>${escapeHtml(doctor.name)}</strong><small>${escapeHtml(doctor.specialty)} · ${escapeHtml(doctor.qualification || "Qualification not added")}</small></td><td>${doctor.consultation_fee == null ? "Not set" : `NPR ${formatNumber(doctor.consultation_fee)}`}</td><td>${statusTag(doctor.status)}</td><td>${photo ? `<img class="media-preview" src="${escapeHtml(photo)}" alt="Doctor photo">` : "—"}</td><td><button class="icon-action" data-edit-doctor="${doctor.id}">${doctor.status === "pending" ? "Edit draft" : "Request edit"}</button></td></tr>`;
        }));
        document.getElementById("content").innerHTML = `
            ${providerIntro("CARE TEAM", "Doctors", "Add doctors with qualifications, consultation fees and photos. New doctor listings need SAINO approval.", `<button class="primary" data-open-form="doctor">Add doctor</button>`)}
            <div class="panel"><div class="panel-header"><div><h3>Doctor directory</h3><p class="panel-subtitle">Maximum 25 records per page. Pending drafts can be edited before review.</p></div></div>${rows.length ? simpleTable(["Doctor", "Consultation fee", "Status", "Photo", "Actions"], rows) : `<div class="empty">No doctors added yet. Add your first doctor profile.</div>`}</div>`;
        bindActions();
    }

    async function renderServices() {
        const { data, error } = await client.from("provider_services").select("*").eq("provider_id", state.provider.id).order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
        if (error) throw error;
        const rows = data.map(item => `<tr><td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description || "No description")}</small></td><td>${item.price == null ? "Contact provider" : `${escapeHtml(item.currency)} ${formatNumber(item.price)}`}</td><td>${item.duration_minutes ? `${item.duration_minutes} min` : "—"}</td><td>${item.telemedicine_enabled ? "Online" : "In person"}</td><td>${statusTag(item.status)}</td><td><button class="icon-action" data-edit-service="${item.id}">${item.status === "pending" ? "Edit draft" : "Request edit"}</button></td></tr>`);
        const usedServices = data.filter(item => ["pending", "active"].includes(item.status)).length;
        const serviceLimit = serviceLimitFor(state.provider.plan);
        document.getElementById("content").innerHTML = `
            ${providerIntro("PROVIDER OFFERINGS", "Services", `Your ${planName(state.provider.plan)} plan includes up to ${serviceLimit} services. ${usedServices} used; pending and approved services count toward your plan.`, `<button class="primary" data-open-form="service" ${usedServices >= serviceLimit ? "disabled" : ""}>Add service</button>`)}
            ${usedServices >= serviceLimit ? `<div class="notice error">Service limit reached. Upgrade your plan for more services.</div>` : ""}
            <div class="panel">${rows.length ? simpleTable(["Service", "Price", "Duration", "Booking mode", "Status", "Actions"], rows) : `<div class="empty">No services listed yet.</div>`}</div>`;
        bindActions();
    }

    async function renderAppointments() {
        const filter = document.getElementById("appointmentFilter")?.value || "all";
        const [rows, slotsResult] = await Promise.all([
            fetchAppointments(PAGE_SIZE, filter),
            client.from("appointment_slots").select("id,doctor_id,service_id,starts_at,ends_at,capacity,booked_count,status,doctors(name),provider_services(name)").eq("provider_id", state.provider.id).order("starts_at", { ascending: true }).gte("starts_at", new Date().toISOString()).range(0, PAGE_SIZE - 1)
        ]);
        if (slotsResult.error) throw slotsResult.error;
        document.getElementById("content").innerHTML = `
            ${providerIntro("BOOKING MANAGEMENT", "Appointments", "Review bookings, update their status and manage online consultation details.")}
            <div class="panel"><div class="toolbar"><input id="appointmentSearch" placeholder="Search patient, phone or doctor"><select id="appointmentFilter"><option value="all">All appointments</option>${["booked","confirmed","completed","cancelled","no_show"].map(status => `<option value="${status}" ${filter === status ? "selected" : ""}>${label(status)}</option>`).join("")}</select></div>${rows.length ? appointmentTable(rows) : `<div class="empty">No appointments match this view.</div>`}</div>`;
        document.getElementById("content").insertAdjacentHTML("beforeend", `<div class="panel"><div class="panel-header"><div><h3>Doctor availability & slots</h3><p class="panel-subtitle">Publish availability only after SAINO approves a slot. Capacity is enforced during booking.</p></div><button class="primary" data-open-form="slot">Add slot</button></div>${slotsResult.data.length ? simpleTable(["Doctor", "Service", "Time", "Capacity", "Booked", "Status"], slotsResult.data.map(slot => `<tr><td>${escapeHtml(slot.doctors?.name || "General booking")}</td><td>${escapeHtml(slot.provider_services?.name || "—")}</td><td>${formatDate(slot.starts_at)} – ${formatDate(slot.ends_at)}</td><td>${slot.capacity}</td><td>${slot.booked_count}</td><td>${statusTag(slot.status)}</td></tr>`)) : `<div class="empty">No upcoming slots yet.</div>`}</div>`);
        document.getElementById("appointmentFilter").addEventListener("change", renderAppointments);
        const search = document.getElementById("appointmentSearch");
        search.addEventListener("input", () => {
            const q = search.value.trim().toLowerCase();
            document.querySelectorAll("#content tbody tr").forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(q); });
        });
        bindActions();
    }

    async function fetchAppointments(limit, status = "all") {
        let query = client.from("appointments")
            .select("id,status,patient_name,patient_phone,patient_note,telemedicine,created_at,appointment_slots!inner(starts_at,ends_at,doctors(name))")
            .eq("appointment_slots.provider_id", state.provider.id)
            .order("created_at", { ascending: false })
            .limit(limit);
        if (status === "upcoming") {
            query = query.in("status", ["booked", "confirmed"]).gt("appointment_slots.starts_at", new Date().toISOString());
        } else if (status !== "all") {
            query = query.eq("status", status);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }

    function appointmentTable(rows) {
        return `<div class="table-wrap"><table><thead><tr><th>Patient</th><th>Doctor · slot</th><th>Visit</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(booking => {
            const slot = booking.appointment_slots || {};
            const doctor = slot.doctors && slot.doctors.name || "Provider appointment";
            const nextStatuses = booking.status === "booked" ? ["confirmed", "cancelled"] : booking.status === "confirmed" ? ["completed", "no_show", "cancelled"] : [];
            return `<tr><td><strong>${escapeHtml(booking.patient_name || "Patient")}</strong><small>${escapeHtml(booking.patient_phone || "")}</small></td><td>${escapeHtml(doctor)}<small>${formatDate(slot.starts_at)}</small></td><td>${booking.telemedicine ? "Telemedicine" : "In person"}</td><td>${statusTag(booking.status)}</td><td>${nextStatuses.map(status => `<button class="icon-action" data-booking-id="${booking.id}" data-booking-status="${status}">${label(status)}</button>`).join(" ") || "—"}</td></tr>`;
        }).join("")}</tbody></table></div>`;
    }

    async function renderQueue() {
        const [{ data: queue, error }, { data: provider, error: providerError }] = await Promise.all([
            client.from("provider_queue_visits").select("*").eq("provider_id", state.provider.id).in("status", ["waiting", "serving"]).order("token_number").range(0, 99),
            client.from("providers").select("id,name").eq("id", state.provider.id).single()
        ]);
        if (error) throw error;
        if (providerError) throw providerError;
        const nowServing = queue.find(item => item.status === "serving");
        const waiting = queue.filter(item => item.status === "waiting");
        const averageWait = 10;
        document.getElementById("content").innerHTML = `
            ${providerIntro("FRONT-DESK OPERATIONS", "Queue management", "Issue sequential tokens, call the next patient and keep the live waiting queue in sync.")}
            <div class="grid stats">${stat("Now serving", nowServing ? `#${nowServing.token_number}` : "—", nowServing ? nowServing.patient_name : "No patient is being served")}${stat("Waiting", waiting.length, "Patients in the active queue")}${stat("Estimated wait", `${waiting.length * averageWait} min`, `Estimate at ${averageWait} min per patient`)}</div>
            <div class="panel"><h3>Add patient to queue</h3><p class="panel-subtitle">Use a display name only; avoid putting unnecessary medical details in the queue.</p><form class="inline-form" id="queueForm"><input name="patient_name" placeholder="Patient name" maxlength="180" required><button class="primary" type="submit">Issue token</button></form></div>
            <div class="panel"><h3>Live queue</h3>${queue.length ? simpleTable(["Token", "Patient", "Joined", "State", "Actions"], queue.map(item => `<tr><td class="queue-token">#${item.token_number}</td><td>${escapeHtml(item.patient_name)}</td><td>${formatDate(item.joined_at)}</td><td>${statusTag(item.status)}</td><td>${item.status === "waiting" ? `<button class="icon-action" data-queue-id="${item.id}" data-queue-status="serving">Call patient</button> <button class="icon-action" data-queue-id="${item.id}" data-queue-status="cancelled">Remove</button>` : `<button class="icon-action" data-queue-id="${item.id}" data-queue-status="completed">Complete</button>`}</td></tr>`)) : `<div class="empty">Queue is empty.</div>`}</div>`;
        bindActions();
        document.getElementById("queueForm").addEventListener("submit", async event => {
            event.preventDefault();
            const patientName = new FormData(event.currentTarget).get("patient_name").trim();
            const { error } = await client.rpc("add_provider_queue_visit", { target_provider_id: provider.id, target_patient_name: patientName });
            if (error) notify(`Could not add queue patient: ${error.message}`, "error");
            else { notify("Patient added to queue.", "success"); await renderQueue(); }
        });
    }

    async function renderTelemedicine() {
        const { data: services, error } = await client.from("provider_services").select("id,name,telemedicine_enabled,status").eq("provider_id", state.provider.id).order("name").range(0, PAGE_SIZE - 1);
        if (error) throw error;
        const slots = await fetchAppointments(PAGE_SIZE);
        document.getElementById("content").innerHTML = `
            ${providerIntro("ONLINE CARE", "Telemedicine", "Enable online consultation services and track virtual bookings. Configure provider tools and meeting links through your secure video-care workflow.")}
            <section class="grid stats">${stat("Telemedicine", state.provider.telemedicine_enabled ? "Enabled" : "Not enabled", "Provider profile setting")}${stat("Virtual bookings", slots.filter(item => item.telemedicine).length, "In the latest appointment list")}</section>
            <div class="panel"><div class="panel-header"><div><h3>Online consultation services</h3><p class="panel-subtitle">Service changes need marketplace approval before patients see them.</p></div><button class="primary" data-open-form="service">Add service</button></div>${services.length ? simpleTable(["Service", "Mode", "Approval"], services.map(service => `<tr><td>${escapeHtml(service.name)}</td><td>${service.telemedicine_enabled ? "Online" : "In person"}</td><td>${statusTag(service.status)}</td></tr>`)) : `<div class="empty">Add a service and choose online consultation as its booking mode.</div>`}</div>
            <div class="panel"><h3>Privacy reminder</h3><p class="panel-subtitle">SAINO does not create or host telemedicine meeting links in this dashboard. Use your provider's approved secure consultation platform and share links only with the booked patient.</p></div>`;
        bindActions();
    }

    async function renderGallery() {
        const { data, error } = await client.from("provider_gallery").select("*").eq("provider_id", state.provider.id).order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
        if (error) throw error;
        const cards = await Promise.all(data.map(async image => {
            const url = await signedMedia(image.storage_path);
            return `<article class="panel"><img class="media-preview" src="${escapeHtml(url)}" alt="${escapeHtml(image.caption || "Provider gallery image")}"><p><strong>${escapeHtml(image.caption || "Provider photo")}</strong></p><p>${statusTag(image.status)}</p><small class="muted">${formatDate(image.created_at)}</small>${image.status === "pending" ? `<p><button class="icon-action" data-delete-gallery="${image.id}" data-gallery-path="${escapeHtml(image.storage_path)}">Remove pending photo</button></p>` : ""}</article>`;
        }));
        document.getElementById("content").innerHTML = `
            ${providerIntro("FACILITY PHOTOS", "Gallery", "Upload facility photos for SAINO review. Only approved gallery items can be published.", `<button class="primary" data-open-form="gallery">Upload photo</button>`)}
            <div class="grid content-grid">${cards.length ? cards.join("") : `<div class="panel empty">No photos uploaded yet.</div>`}</div>`;
        bindActions();
    }

    async function renderReviews() {
        if (planLevelFor(state.provider.plan) < 1) {
            document.getElementById("content").innerHTML = `${providerIntro("SAINO VERIFIED (VIP)", "Reviews & replies", "See patient comments and reply directly when your provider has the Verified plan.")}<div class="panel"><h3>Upgrade to SAINO Verified (VIP)</h3><p class="panel-subtitle">VIP includes everything in Free Listing, up to 5 services, patient review access and replies, plus the SAINO Verified Trust Badge.</p><button class="primary" data-navigate="plans">Compare plans</button></div>`;
            bindNavigation();
            return;
        }
        const { data, error } = await client.from("reviews").select("id,rating,comment,status,created_at").eq("provider_id", state.provider.id).order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
        if (error) throw error;
        const reviewIds = data.map(review => review.id);
        const repliesResult = reviewIds.length
            ? await client.from("provider_review_responses").select("review_id,response,status").in("review_id", reviewIds)
            : { data: [], error: null };
        if (repliesResult.error) throw repliesResult.error;
        const replies = new Map((repliesResult.data || []).map(reply => [reply.review_id, reply]));
        const cards = await Promise.all(data.map(async review => {
            const reply = replies.get(review.id);
            const existing = reply ? `<div class="notice success">Provider response (${escapeHtml(label(reply.status))}): ${escapeHtml(reply.response)}</div>` : `<form class="inline-form review-reply" data-review-id="${review.id}"><input name="response" placeholder="Write a response for SAINO review" maxlength="2000" required><button class="secondary" type="submit">Submit reply</button></form>`;
            return `<article class="review-card"><div class="panel-header"><strong>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</strong>${statusTag(review.status)}</div><p>${escapeHtml(review.comment)}</p><small class="muted">${formatDate(review.created_at)}</small><div class="actions">${existing}<button class="icon-action" data-report-review="${review.id}">Report review</button></div></article>`;
        }));
        document.getElementById("content").innerHTML = `${providerIntro("PATIENT FEEDBACK", "Reviews", "Read patient feedback. Provider replies and review reports go to SAINO for moderation.")}<div class="panel">${cards.length ? cards.join("") : `<div class="empty">No reviews yet.</div>`}</div>`;
        document.querySelectorAll(".review-reply").forEach(form => form.addEventListener("submit", async event => {
            event.preventDefault();
            const response = new FormData(event.currentTarget).get("response").trim();
            const { error: submitError } = await client.from("provider_review_responses").insert({ review_id: event.currentTarget.dataset.reviewId, provider_id: state.provider.id, author_id: state.user.id, response });
            if (submitError) notify(`Could not submit response: ${submitError.message}`, "error");
            else { notify("Reply submitted to SAINO for moderation.", "success"); await renderReviews(); }
        }));
        document.querySelectorAll("[data-report-review]").forEach(button => button.addEventListener("click", () => reportReview(button.dataset.reportReview)));
    }

    async function reportReview(reviewId) {
        const reason = window.prompt("Why should SAINO review this patient comment?");
        if (reason === null) return;
        if (reason.trim().length < 3) { notify("Please provide a short reason.", "error"); return; }
        const { error } = await client.from("provider_review_reports").insert({
            review_id: reviewId, provider_id: state.provider.id, reported_by: state.user.id, reason: reason.trim()
        });
        if (error) notify(`Could not report review: ${error.message}`, "error");
        else notify("Review sent to SAINO for moderation.", "success");
    }

    async function renderPreview() {
        const p = state.provider;
        const [{ data: services, error: servicesError }, { data: doctors, error: doctorsError }, { data: reviews, error: reviewsError }] = await Promise.all([
            client.from("provider_services").select("name,price,currency").eq("provider_id", p.id).eq("status", "active").range(0, 4),
            client.from("doctors").select("name,specialty").eq("provider_id", p.id).eq("status", "active").range(0, 4),
            client.from("reviews").select("rating,comment").eq("provider_id", p.id).eq("status", "published").order("created_at", { ascending: false }).range(0, 2)
        ]);
        if (servicesError) throw servicesError;
        if (doctorsError) throw doctorsError;
        if (reviewsError) throw reviewsError;
        const isLive = p.status === "active" && p.verification_status === "verified";
        const badge = p.verification_status === "verified" ? trustBadgeFor(p.plan) : "";
        const [logoUrl, coverUrl] = await Promise.all([p.logo_path ? signedMedia(p.logo_path) : "", p.cover_path ? signedMedia(p.cover_path) : ""]);
        document.getElementById("content").innerHTML = `
            ${providerIntro("PUBLIC MARKETPLACE", "Listing preview", "Patient-facing preview of information currently approved for your marketplace listing.")}
            ${!isLive ? `<div class="notice error">This provider listing is not currently public. Listing status: ${escapeHtml(label(p.status))}; verification: ${escapeHtml(label(p.verification_status))}.</div>` : ""}
            <article class="panel preview-card"><div class="preview-cover" ${coverUrl ? `style="background:center/cover url('${escapeHtml(coverUrl)}')"` : ""}>${coverUrl ? "" : "SAINO HEALTH · PROVIDER"}</div><div class="preview-info">${logoUrl ? `<img class="media-preview" src="${escapeHtml(logoUrl)}" alt="Provider logo">` : ""}<h2>${escapeHtml(p.name)} ${badge ? `<span class="status verified">${escapeHtml(badge)} Trust Badge</span>` : ""}</h2><p class="muted">${escapeHtml(label(p.provider_type))} · ${escapeHtml(p.city)} · ${escapeHtml(p.address || "Address not listed")}</p><p>${escapeHtml(p.about || "Provider profile description has not been added.")}</p><p><strong>Hours:</strong> ${escapeHtml(JSON.stringify(p.opening_hours || {}))}</p><p>${p.emergency_available ? "Emergency care available" : "Contact provider for emergency information"} · ${p.telemedicine_enabled ? "Telemedicine available" : "In-person care"}</p><h3>Doctors</h3>${doctors.length ? doctors.map(item => `<p>${escapeHtml(item.name)} · ${escapeHtml(item.specialty)}</p>`).join("") : `<p class="muted">No approved doctors.</p>`}<h3>Services</h3>${services.length ? services.map(item => `<p>${escapeHtml(item.name)} · ${item.price == null ? "Contact provider" : `${escapeHtml(item.currency)} ${formatNumber(item.price)}`}</p>`).join("") : `<p class="muted">No approved services.</p>`}<h3>Latest reviews</h3>${reviews.length ? reviews.map(item => `<p>${"★".repeat(item.rating)} · ${escapeHtml(item.comment)}</p>`).join("") : `<p class="muted">No published reviews.</p>`}</div></article>`;
    }

    async function renderPlans() {
        const [{ data: plans, error }, { data: subscriptions, error: subError }] = await Promise.all([
            client.from("provider_plan_catalog").select("*").eq("active", true).order("monthly_price", { nullsFirst: false }),
            client.from("provider_subscriptions").select("*").eq("provider_id", state.provider.id).order("created_at", { ascending: false }).limit(5)
        ]);
        if (error) throw error;
        if (subError) throw subError;
        const cards = plans.map(plan => `<article class="panel"><div class="panel-header"><div><h3>${escapeHtml(plan.display_name)}</h3><p class="panel-subtitle">${escapeHtml(plan.description)}</p></div>${state.provider.plan === plan.plan ? `<span class="status active">Current plan</span>` : ""}</div><strong>${plan.monthly_price == null ? "Contact SAINO for pricing" : `${escapeHtml(plan.currency)} ${formatNumber(plan.monthly_price)} / month`}</strong><p><strong>${plan.service_limit} services</strong>${plan.trust_badge ? ` · ${escapeHtml(plan.trust_badge)} Trust Badge` : ""}</p><ul>${(plan.features || []).map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>${state.provider.plan !== plan.plan ? `<button class="secondary" data-request-plan="${escapeHtml(plan.plan)}">Request plan change</button>` : ""}</article>`);
        document.getElementById("content").innerHTML = `${providerIntro("SUBSCRIPTION", "Plans & billing", "View plan features and request changes. Billing, renewals and payments are handled by SAINO.")}<div class="grid stats">${cards.join("")}</div><div class="panel"><h3>Subscription history</h3>${subscriptions.length ? simpleTable(["Plan", "Status", "Starts", "Renewal"], subscriptions.map(item => `<tr><td>${escapeHtml(planName(item.plan))}</td><td>${statusTag(item.status)}</td><td>${formatDate(item.starts_at)}</td><td>${formatDate(item.renews_at)}</td></tr>`)) : `<div class="empty">Subscription details will appear when SAINO adds your plan.</div>`}</div>`;
        document.querySelectorAll("[data-request-plan]").forEach(button => button.addEventListener("click", () => submitProfileChange({ plan: button.dataset.requestPlan }, "Plan upgrade request sent to SAINO for approval.")));
    }

    async function renderOffers() {
        if (planLevelFor(state.provider.plan) < 2) {
            document.getElementById("content").innerHTML = `${providerIntro("SAINO VVIP", "Search campaigns & offers", "VVIP includes search campaigns, campaign offers and higher marketplace visibility.")}<div class="panel"><h3>Upgrade to SAINO VVIP</h3><p class="panel-subtitle">SAINO VVIP includes up to 15 services, advanced analytics, search campaigns, higher visibility and the VVIP Trust Badge.</p><button class="primary" data-navigate="plans">Compare plans</button></div>`;
            bindNavigation();
            return;
        }
        const { data, error } = await client.from("provider_offers").select("*").eq("provider_id", state.provider.id).order("created_at", { ascending: false }).range(0, PAGE_SIZE - 1);
        if (error) throw error;
        const rows = data.map(offer => `<tr><td>${escapeHtml(label(offer.campaign_type))}</td><td><strong>${escapeHtml(offer.title)}</strong><small>${escapeHtml(offer.description || "")}</small></td><td>${offer.discount_percent == null ? "—" : `${offer.discount_percent}%`}</td><td>${formatDate(offer.starts_at)} – ${formatDate(offer.ends_at)}</td><td>${statusTag(offer.status)}</td><td>${offer.status === "pending" ? `<button class="icon-action" data-delete-offer="${offer.id}">Delete draft</button>` : "—"}</td></tr>`);
        document.getElementById("content").innerHTML = `${providerIntro("VVIP MARKETPLACE PROMOTIONS", "Search campaigns & offers", "Submit searchable campaigns and time-limited health offers. SAINO approves all campaigns before public display.", `<button class="primary" data-open-form="offer">Submit campaign</button>`)}<div class="panel">${rows.length ? simpleTable(["Type", "Campaign", "Discount", "Campaign period", "Status", "Actions"], rows) : `<div class="empty">No campaigns or offers submitted.</div>`}</div>`;
        bindActions();
    }

    async function renderAnalytics() {
        if (planLevelFor(state.provider.plan) < 2) {
            document.getElementById("content").innerHTML = `${providerIntro("SAINO VVIP", "Advanced analytics", "VVIP providers get marketplace performance for views, searches, bookings and service interest.")}<div class="panel"><h3>Upgrade to SAINO VVIP</h3><p class="panel-subtitle">Advanced analytics, search campaigns and higher marketplace visibility are VVIP plan features.</p><button class="primary" data-navigate="plans">Compare plans</button></div>`;
            bindNavigation();
            return;
        }
        const [{ data, error }, { count: serviceViews, error: serviceError }] = await Promise.all([
            client.from("provider_metrics_daily").select("*").eq("provider_id", state.provider.id).gte("metric_date", dateOffset(-6)).order("metric_date", { ascending: true }),
            exactCount("provider_services", q => q.eq("provider_id", state.provider.id).eq("status", "active"))
        ]);
        if (error) throw error;
        if (serviceError) throw serviceError;
        const sums = data.reduce((acc, item) => ({
            profile_views: acc.profile_views + item.profile_views,
            searches: acc.searches + item.searches,
            bookings: acc.bookings + item.bookings,
            service_views: acc.service_views + item.service_views
        }), { profile_views: 0, searches: 0, bookings: 0, service_views: 0 });
        const max = Math.max(1, ...data.map(item => item.profile_views));
        document.getElementById("content").innerHTML = `${providerIntro("MARKETPLACE INSIGHTS", "Analytics", "Daily metrics are supplied by SAINO marketplace tracking; no patient-level details are exposed here.")}<div class="grid stats">${stat("Profile views", formatNumber(sums.profile_views), "Last 7 days")}${stat("Search appearances", formatNumber(sums.searches), "Last 7 days")}${stat("Bookings", formatNumber(sums.bookings), "Last 7 days")}${stat("Service views", formatNumber(sums.service_views), `${serviceViews} approved services`)}</div><div class="panel"><h3>Profile views · last 7 days</h3><p class="panel-subtitle">Marketplace impressions by day.</p><div class="bar-chart">${data.map(item => `<div class="bar-column"><span class="bar" title="${item.profile_views} views" style="height:${Math.max(3, item.profile_views / max * 100)}%"></span><small>${new Date(`${item.metric_date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</small></div>`).join("") || `<div class="empty">Analytics are not available yet.</div>`}</div></div>`;
    }

    async function renderNotifications() {
        const { data, error } = await client.from("provider_notifications").select("*").eq("provider_id", state.provider.id).order("created_at", { ascending: false }).range(0, 99);
        if (error) throw error;
        const unread = data.filter(item => !item.read_at).length;
        document.getElementById("unreadCount").textContent = unread || "";
        const items = data.map(item => `<article class="notification ${item.read_at ? "" : "unread"}"><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><time>${escapeHtml(label(item.notification_type))} · ${formatDate(item.created_at)}</time></div>${!item.read_at ? `<button class="icon-action" data-read-notification="${item.id}">Mark read</button>` : ""}</article>`);
        document.getElementById("content").innerHTML = `${providerIntro("ACTIVITY CENTRE", "Notifications", "Provider updates from appointments, approvals, reviews, campaigns and system messages.")}<div class="panel">${items.length ? items.join("") : `<div class="empty">You are all caught up.</div>`}</div>`;
        bindActions();
    }

    async function renderSettings() {
        const { data, error } = await client.from("provider_preferences").select("*").eq("provider_id", state.provider.id).eq("user_id", state.user.id).maybeSingle();
        if (error) throw error;
        const preferences = data?.notification_preferences || { appointments: true, reviews: true, campaigns: true, system: true };
        document.getElementById("content").innerHTML = `${providerIntro("ACCOUNT SECURITY", "Settings", "Manage sign-in security and notification preferences for this user account.")}<div class="panel"><h3>Change password</h3><p class="panel-subtitle">Use a unique password for this account.</p><form id="passwordForm" class="inline-form"><input type="password" name="password" placeholder="New password · at least 8 characters" minlength="8" required><button class="primary">Update password</button></form></div><div class="panel"><h3>Notifications</h3><form id="preferencesForm" class="form-grid">${["appointments","reviews","campaigns","system"].map(key => `<label class="check-row"><input type="checkbox" name="${key}" ${preferences[key] !== false ? "checked" : ""}> ${label(key)} updates</label>`).join("")}<div class="wide"><button class="primary">Save preferences</button></div></form></div><div class="panel"><h3>Account</h3><p class="muted">Signed in as ${escapeHtml(state.user.email)} · provider role ${escapeHtml(state.memberships.find(item => item.provider_id === state.provider.id).member_role)}</p></div>`;
        document.getElementById("passwordForm").addEventListener("submit", async event => {
            event.preventDefault();
            const password = new FormData(event.currentTarget).get("password");
            const { error: updateError } = await client.auth.updateUser({ password });
            if (updateError) notify(`Could not update password: ${updateError.message}`, "error");
            else { event.currentTarget.reset(); notify("Password updated.", "success"); }
        });
        document.getElementById("preferencesForm").addEventListener("submit", async event => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const notification_preferences = Object.fromEntries(["appointments","reviews","campaigns","system"].map(key => [key, values.get(key) === "on"]));
            const { error: saveError } = await client.from("provider_preferences").upsert({
                provider_id: state.provider.id, user_id: state.user.id, notification_preferences
            });
            if (saveError) notify(`Could not save settings: ${saveError.message}`, "error");
            else notify("Notification preferences saved.", "success");
        });
    }

    function bindActions() {
        bindNavigation();
        document.querySelectorAll("[data-open-form]").forEach(button => button.addEventListener("click", () => openForm(button.dataset.openForm)));
        document.querySelectorAll("[data-edit-doctor]").forEach(button => button.addEventListener("click", () => openForm("doctor", button.dataset.editDoctor)));
        document.querySelectorAll("[data-edit-service]").forEach(button => button.addEventListener("click", () => openForm("service", button.dataset.editService)));
        document.querySelectorAll("[data-booking-id]").forEach(button => button.addEventListener("click", () => updateAppointment(button.dataset.bookingId, button.dataset.bookingStatus)));
        document.querySelectorAll("[data-queue-id]").forEach(button => button.addEventListener("click", () => advanceQueue(button.dataset.queueId, button.dataset.queueStatus)));
        document.querySelectorAll("[data-delete-offer]").forEach(button => button.addEventListener("click", () => deleteOffer(button.dataset.deleteOffer)));
        document.querySelectorAll("[data-delete-gallery]").forEach(button => button.addEventListener("click", () => deleteGalleryItem(button.dataset.deleteGallery, button.dataset.galleryPath)));
        document.querySelectorAll("[data-read-notification]").forEach(button => button.addEventListener("click", () => markNotificationRead(button.dataset.readNotification)));
    }

    function bindNavigation() {
        document.querySelectorAll("[data-navigate]").forEach(button => button.addEventListener("click", () => {
            state.page = button.dataset.navigate;
            renderShell();
            renderPage();
        }));
    }

    async function updateAppointment(id, status) {
        const { error } = await client.from("appointments").update({ status }).eq("id", id);
        if (error) notify(`Could not update appointment: ${error.message}`, "error");
        else { notify(`Appointment marked ${label(status)}.`, "success"); await renderAppointments(); }
    }

    async function advanceQueue(id, status) {
        const { error } = await client.rpc("advance_provider_queue", { target_visit_id: id, next_status: status });
        if (error) notify(`Could not update queue: ${error.message}`, "error");
        else { notify("Queue updated.", "success"); await renderQueue(); }
    }

    async function deleteOffer(id) {
        if (!window.confirm("Delete this pending offer?")) return;
        const { error } = await client.from("provider_offers").delete().eq("id", id);
        if (error) notify(`Could not delete offer: ${error.message}`, "error");
        else { notify("Pending offer deleted.", "success"); await renderOffers(); }
    }

    async function deleteGalleryItem(id, path) {
        if (!window.confirm("Remove this pending image?")) return;
        const { error: storageError } = await client.storage.from("provider-gallery").remove([path]);
        if (storageError) {
            notify(`Could not delete image file: ${storageError.message}`, "error");
            return;
        }
        const { error: galleryError } = await client.from("provider_gallery").delete().eq("id", id).eq("status", "pending");
        if (galleryError) {
            notify(`Image file removed, but gallery record could not be deleted: ${galleryError.message}`, "error");
            return;
        }
        const { error: mediaError } = await client.from("provider_media").delete().eq("storage_path", path);
        if (mediaError) {
            notify(`Gallery item removed, but media metadata could not be deleted: ${mediaError.message}`, "error");
            return;
        }
        notify("Pending photo removed.", "success");
        await renderGallery();
    }

    async function markNotificationRead(id) {
        const { error } = await client.from("provider_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
        if (error) notify(`Could not update notification: ${error.message}`, "error");
        else await renderNotifications();
    }

    function openForm(type, id) {
        const root = document.getElementById("modalRoot");
        const forms = {
            doctor: { title: id ? "Edit doctor details" : "Add doctor", fields: `<label class="field"><span>Doctor name</span><input name="name" required maxlength="180"></label><label class="field"><span>Specialization</span><input name="specialty" required maxlength="180"></label><label class="field"><span>Qualification</span><input name="qualification" maxlength="250"></label><label class="field"><span>Consultation fee · NPR</span><input name="consultation_fee" type="number" min="0" step=".01"></label><label class="field wide"><span>About</span><textarea name="about" maxlength="3000"></textarea></label><label class="field wide"><span>Doctor photo</span><input name="photo" type="file" accept="image/*"></label>` },
            service: { title: id ? "Edit service" : "Add service", fields: `<label class="field"><span>Service name</span><input name="name" required maxlength="180"></label><label class="field"><span>Price · NPR</span><input name="price" type="number" min="0" step=".01"></label><label class="field"><span>Duration · minutes</span><input name="duration_minutes" type="number" min="5" max="1440"></label><label class="field wide"><span>Description</span><textarea name="description" maxlength="3000"></textarea></label><label class="check-row"><input type="checkbox" name="telemedicine_enabled"> Online consultation</label>` },
            slot: { title: "Add appointment slot", fields: `<label class="field"><span>Doctor</span><select name="doctor_id"><option value="">General booking</option>${(state._doctors || []).map(item => `<option value="${item.id}">${escapeHtml(item.name)} · ${escapeHtml(item.specialty)}</option>`).join("")}</select></label><label class="field"><span>Service</span><select name="service_id"><option value="">General appointment</option>${(state._services || []).map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("")}</select></label><label class="field"><span>Capacity</span><input name="capacity" type="number" min="1" max="500" value="1" required></label><label class="field"><span>Starts</span><input name="starts_at" type="datetime-local" required></label><label class="field"><span>Ends</span><input name="ends_at" type="datetime-local" required></label>` },
            gallery: { title: "Upload facility photo", fields: `<label class="field wide"><span>Photo</span><input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required></label><label class="field wide"><span>Caption</span><input name="caption" maxlength="250"></label>` },
            offer: { title: "Submit campaign for approval", fields: `${selectField("Campaign type", "campaign_type", "offer", [["offer", "Health offer"], ["search_campaign", "Search campaign"]])}<label class="field"><span>Campaign title</span><input name="title" required maxlength="180"></label><label class="field"><span>Discount · % (optional)</span><input name="discount_percent" type="number" min="0" max="100" step=".01"></label><label class="field"><span>Starts</span><input name="starts_at" type="datetime-local" required></label><label class="field"><span>Ends</span><input name="ends_at" type="datetime-local" required></label><label class="field wide"><span>Description</span><textarea name="description" maxlength="2000"></textarea></label>` }
        };
        const config = forms[type];
        if (!config) return;
        root.innerHTML = `<div class="modal-backdrop" id="modalBackdrop"><section class="modal-card" role="dialog" aria-modal="true"><h2>${config.title}</h2><form id="resourceForm" class="form-grid">${config.fields}<div class="modal-actions"><button class="secondary" type="button" id="cancelForm">Cancel</button><button class="primary" type="submit">Save</button></div></form></section></div>`;
        document.getElementById("cancelForm").addEventListener("click", closeModal);
        document.getElementById("modalBackdrop").addEventListener("click", event => { if (event.target.id === "modalBackdrop") closeModal(); });
        document.getElementById("resourceForm").addEventListener("submit", event => saveResource(event, type, id));
        if (type === "slot") loadDoctorsIntoSlot();
        if (type === "doctor" && id) loadDoctorDraft(id);
        if (type === "service" && id) loadServiceDraft(id);
    }

    async function loadDoctorsIntoSlot() {
        const [doctorsResult, servicesResult] = await Promise.all([
            client.from("doctors").select("id,name,specialty").eq("provider_id", state.provider.id).eq("status", "active").range(0, PAGE_SIZE - 1),
            client.from("provider_services").select("id,name").eq("provider_id", state.provider.id).eq("status", "active").range(0, PAGE_SIZE - 1)
        ]);
        if (doctorsResult.error || servicesResult.error) {
            notify(`Could not load doctors or services: ${(doctorsResult.error || servicesResult.error).message}`, "error");
            return;
        }
        state._doctors = doctorsResult.data || [];
        state._services = servicesResult.data || [];
        const select = document.querySelector("#resourceForm select[name='doctor_id']");
        if (select) select.innerHTML = `<option value="">General booking</option>${state._doctors.map(item => `<option value="${item.id}">${escapeHtml(item.name)} · ${escapeHtml(item.specialty)}</option>`).join("")}`;
        const serviceSelect = document.querySelector("#resourceForm select[name='service_id']");
        if (serviceSelect) serviceSelect.innerHTML = `<option value="">General appointment</option>${state._services.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("")}`;
    }

    async function loadDoctorDraft(id) {
        const { data, error } = await client.from("doctors").select("id,name,specialty,qualification,consultation_fee,about,status").eq("provider_id", state.provider.id).eq("id", id).single();
        if (error) { notify(`Could not load doctor: ${error.message}`, "error"); closeModal(); return; }
        state._doctorDraftStatus = data.status;
        const form = document.getElementById("resourceForm");
        for (const key of ["name", "specialty", "qualification", "consultation_fee", "about"]) form.elements[key].value = data[key] ?? "";
    }

    async function loadServiceDraft(id) {
        const { data, error } = await client.from("provider_services").select("id,name,price,duration_minutes,description,telemedicine_enabled,status").eq("provider_id", state.provider.id).eq("id", id).single();
        if (error) { notify(`Could not load service: ${error.message}`, "error"); closeModal(); return; }
        state._serviceDraftStatus = data.status;
        const form = document.getElementById("resourceForm");
        for (const key of ["name", "price", "duration_minutes", "description"]) form.elements[key].value = data[key] ?? "";
        form.elements.telemedicine_enabled.checked = data.telemedicine_enabled;
    }

    async function saveResource(event, type, id) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        let result;
        if (type === "doctor") {
            const payload = {
                provider_id: state.provider.id,
                name: String(form.get("name")).trim(),
                specialty: String(form.get("specialty")).trim(),
                qualification: String(form.get("qualification") || "").trim() || null,
                consultation_fee: nullableNumber(form.get("consultation_fee")),
                about: String(form.get("about") || "").trim() || null,
                status: "pending"
            };
            const photo = form.get("photo");
            if (photo && photo.size) {
                try { payload.photo_path = await uploadMedia(photo, "gallery"); }
                catch (error) { notify(`Photo upload failed: ${error.message}`, "error"); return; }
            }
            if (!id) {
                result = await client.from("doctors").insert(payload);
            } else if (state._doctorDraftStatus === "pending") {
                delete payload.provider_id;
                result = await client.from("doctors").update(payload).eq("id", id).eq("status", "pending");
            } else {
                delete payload.provider_id;
                delete payload.status;
                result = await client.from("provider_change_requests").insert({
                    provider_id: state.provider.id,
                    submitted_by: state.user.id,
                    profile: { content: { entity: "doctor", id, data: payload } }
                });
            }
        } else if (type === "service") {
            if (!id) {
                const { count, error: countError } = await client.from("provider_services")
                    .select("id", { count: "exact", head: true })
                    .eq("provider_id", state.provider.id)
                    .in("status", ["pending", "active"]);
                if (countError) { notify(`Could not check service plan limit: ${countError.message}`, "error"); return; }
                if ((count || 0) >= serviceLimitFor(state.provider.plan)) {
                    notify(`This plan allows ${serviceLimitFor(state.provider.plan)} services. Request a plan change to add more.`, "error");
                    closeModal();
                    state.page = "plans";
                    renderShell();
                    await renderPlans();
                    return;
                }
            }
            const payload = {
                name: String(form.get("name")).trim(),
                price: nullableNumber(form.get("price")),
                duration_minutes: nullableNumber(form.get("duration_minutes")),
                description: String(form.get("description") || "").trim() || null,
                telemedicine_enabled: form.get("telemedicine_enabled") === "on",
                status: "pending"
            };
            if (!id) {
                result = await client.from("provider_services").insert({ provider_id: state.provider.id, ...payload });
            } else if (state._serviceDraftStatus === "pending") {
                result = await client.from("provider_services").update(payload).eq("provider_id", state.provider.id).eq("id", id).eq("status", "pending");
            } else {
                delete payload.status;
                result = await client.from("provider_change_requests").insert({
                    provider_id: state.provider.id,
                    submitted_by: state.user.id,
                    profile: { content: { entity: "service", id, data: payload } }
                });
            }
        } else if (type === "slot") {
            const startsAt = new Date(form.get("starts_at"));
            const endsAt = new Date(form.get("ends_at"));
            if (Number.isNaN(+startsAt) || Number.isNaN(+endsAt) || endsAt <= startsAt || startsAt <= new Date()) {
                notify("Choose a future start time and an end time after the start.", "error");
                return;
            }
            result = await client.from("appointment_slots").insert({
                provider_id: state.provider.id,
                doctor_id: form.get("doctor_id") || null,
                service_id: form.get("service_id") || null,
                starts_at: startsAt.toISOString(),
                ends_at: endsAt.toISOString(),
                capacity: Number(form.get("capacity")),
                status: "pending"
            });
        } else if (type === "gallery") {
            const photo = form.get("photo");
            let path;
            try { path = await uploadMedia(photo, "gallery"); }
            catch (error) { notify(`Photo upload failed: ${error.message}`, "error"); return; }
            result = await client.from("provider_gallery").insert({
                provider_id: state.provider.id,
                storage_path: path,
                caption: String(form.get("caption") || "").trim() || null,
                status: "pending"
            });
        } else if (type === "offer") {
            const startsAt = new Date(form.get("starts_at"));
            const endsAt = new Date(form.get("ends_at"));
            if (Number.isNaN(+startsAt) || Number.isNaN(+endsAt) || endsAt <= startsAt) {
                notify("Choose an offer end time after its start.", "error");
                return;
            }
            result = await client.from("provider_offers").insert({
                provider_id: state.provider.id,
                campaign_type: form.get("campaign_type"),
                title: String(form.get("title")).trim(),
                discount_percent: nullableNumber(form.get("discount_percent")),
                description: String(form.get("description") || "").trim() || null,
                starts_at: startsAt.toISOString(),
                ends_at: endsAt.toISOString(),
                status: "pending"
            });
        }

        if (result.error) {
            notify(`Could not save ${type}: ${result.error.message}`, "error");
            return;
        }
        closeModal();
        notify((type === "doctor" && id && state._doctorDraftStatus === "pending")
            || (type === "service" && id && state._serviceDraftStatus === "pending")
            ? "Draft updated."
            : "Saved and sent to SAINO for approval.", "success");
        await renderPage();
    }

    async function uploadMedia(file, purpose) {
        if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
            throw new Error("Choose an image file smaller than 5 MB.");
        }
        const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${state.provider.id}/${state.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error } = await client.storage.from("provider-gallery").upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        const { error: metadataError } = await client.from("provider_media").insert({
            provider_id: state.provider.id, user_id: state.user.id, storage_path: path, purpose
        });
        if (metadataError) {
            const { error: removeError } = await client.storage.from("provider-gallery").remove([path]);
            if (removeError) console.error("Could not clean up unlinked uploaded media:", removeError.message);
            throw metadataError;
        }
        return path;
    }

    async function signedMedia(path) {
        const { data, error } = await client.storage.from("provider-gallery").createSignedUrl(path, 300);
        if (error) throw error;
        return data.signedUrl;
    }

    async function submitProfileChange(profile, message) {
        const { error } = await client.from("provider_change_requests").insert({
            provider_id: state.provider.id, submitted_by: state.user.id, profile
        });
        if (error) notify(`Could not submit request: ${error.message}`, "error");
        else notify(message, "success");
    }

    function field(title, name, value, type = "text", required = false, attrs = "", className = "") {
        const safeValue = escapeHtml(value == null ? "" : value);
        if (type === "textarea") return `<label class="field ${className}"><span>${escapeHtml(title)}</span><textarea name="${name}" ${attrs}>${safeValue}</textarea></label>`;
        return `<label class="field ${className}"><span>${escapeHtml(title)}</span><input name="${name}" type="${type}" value="${safeValue}" ${required ? "required" : ""} ${attrs}></label>`;
    }

    function selectField(title, name, current, options) {
        return `<label class="field"><span>${escapeHtml(title)}</span><select name="${name}">${options.map(([value, text]) => `<option value="${value}" ${current === value ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></label>`;
    }

    function uploadField(title, name, accept) {
        return `<label class="field"><span>${escapeHtml(title)} · optional</span><input name="${name}" type="file" accept="${accept}"></label>`;
    }

    function simpleTable(headers, rows) {
        return `<div class="table-wrap"><table><thead><tr>${headers.map(item => `<th>${item}</th>`).join("")}</tr></thead><tbody>${rows.map(row => row.startsWith("<tr>") ? row : `<tr>${row.map(item => `<td>${item}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    }

    function statusTag(value) {
        return `<span class="status ${escapeHtml(value)}">${escapeHtml(label(value))}</span>`;
    }

    function closeModal() {
        document.getElementById("modalRoot").innerHTML = "";
    }

    function notify(message, type = "success") {
        const stack = document.getElementById("noticeStack");
        if (!stack) return;
        const notice = document.createElement("div");
        notice.className = `notice ${type}`;
        notice.textContent = message;
        stack.replaceChildren(notice);
        setTimeout(() => notice.remove(), 5000);
    }

    function openMenu() {
        document.getElementById("sidebar").classList.add("open");
        document.getElementById("mobileOverlay").classList.add("open");
    }

    function closeMenu() {
        document.getElementById("sidebar")?.classList.remove("open");
        document.getElementById("mobileOverlay")?.classList.remove("open");
    }

    function parseObject(value, labelText) {
        try {
            const result = JSON.parse(value || "{}");
            if (!result || Array.isArray(result) || typeof result !== "object") throw new Error();
            return result;
        } catch {
            throw new Error(`${labelText} must be a valid JSON object.`);
        }
    }

    function nullableNumber(value) {
        if (value == null || String(value).trim() === "") return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function dateOffset(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString().slice(0, 10);
    }

    function formatDate(value) {
        if (!value) return "—";
        const date = new Date(value);
        return Number.isNaN(+date) ? "—" : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    }

    function formatNumber(value) {
        return Number(value || 0).toLocaleString();
    }

    function label(value) {
        return String(value || "").replaceAll("_", " ").replace(/\b\w/g, character => character.toUpperCase());
    }

    function planName(value) {
        return ({ saino_listed: "Free Listing", saino_pro: "SAINO Verified (VIP)", saino_prime: "SAINO VVIP" })[value] || label(value);
    }

    function planLevelFor(value) {
        return ({ saino_listed: 0, saino_pro: 1, saino_prime: 2 })[value] ?? 0;
    }

    function serviceLimitFor(value) {
        return ({ saino_listed: 2, saino_pro: 5, saino_prime: 15 })[value] ?? 2;
    }

    function trustBadgeFor(value) {
        return ({ saino_pro: "SAINO Verified", saino_prime: "SAINO VVIP" })[value] || "";
    }

    function iconFor(page) {
        return ({ dashboard: "◫", profile: "▣", preview: "◉", doctors: "✚", services: "≡", appointments: "▦", queue: "⌁", telemedicine: "◎", gallery: "▧", reviews: "☆", plans: "◇", offers: "％", analytics: "▥", notifications: "♧", settings: "⚙" })[page] || "·";
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        })[character]);
    }
})();
