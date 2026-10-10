const PROVIDER_PAGE_SIZE = 20;
let providerPage = 0;
let providerSearchTimer;
let providerQueryVersion = 0;

function showProvidersPage() {
    const host = document.getElementById("pageContent");
    const config = window.SAINO_SUPABASE_CONFIG;

    if (!config || !config.url || !config.anonKey || !window.sainoSupabase) {
        host.innerHTML = `
            <div class="provider-message error">
                Supabase is not configured. Add your project URL and public anon key in
                <code>admin/js/supabase-config.js</code>, then run <code>supabase/schema.sql</code>
                in the Supabase SQL Editor.
            </div>`;
        return;
    }

    window.sainoSupabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            host.innerHTML = `<div class="provider-message error">${escapeHtml(error.message)}</div>`;
            return;
        }
        if (!data.session) {
            renderProviderLogin(host);
            return;
        }
        renderProviderWorkspace(host, data.session.user);
    });
}

function renderProviderLogin(host) {
    host.innerHTML = `
        <div class="page-intro">
            <div>
                <p class="eyebrow">SECURE ADMIN ACCESS</p>
                <h2>Sign in to manage providers</h2>
                <p class="muted">Use a Supabase account with the super_admin app_metadata role.</p>
            </div>
        </div>
        <div id="providerNotice" aria-live="polite"></div>
        <form class="auth-form" id="providerLoginForm">
            <input name="email" type="email" autocomplete="username" placeholder="Admin email" required>
            <input name="password" type="password" autocomplete="current-password" placeholder="Password" required>
            <button type="submit" class="primary-button">Sign in</button>
        </form>`;
    document.getElementById("providerLoginForm").addEventListener("submit", async event => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const { error } = await window.sainoSupabase.auth.signInWithPassword({
            email: form.get("email"),
            password: form.get("password")
        });
        if (error) {
            showProviderNotice(`Sign-in failed: ${error.message}`, true);
            return;
        }
        showProvidersPage();
    });
}

function renderProviderWorkspace(host, user) {
    host.innerHTML = `
        <div class="page-intro">
            <div>
                <p class="eyebrow">MARKETPLACE MANAGEMENT</p>
                <h2>Provider directory</h2>
                <p class="muted">Review listings, manage plan details and control marketplace visibility.</p>
            </div>
            <div class="provider-actions">
                <span class="muted">${escapeHtml(user.email)}</span>
                <button class="secondary-button" id="providerSignOut">Sign out</button>
                <button class="primary-button" id="addProviderBtn"><i data-lucide="plus"></i>Add provider</button>
            </div>
        </div>
        <div id="providerNotice" aria-live="polite"></div>
        <div class="panel provider-panel">
            <div class="provider-toolbar">
                <input id="providerSearch" type="search" placeholder="Search provider name or city" aria-label="Search providers">
                <select id="providerStatus" aria-label="Filter providers by status">
                    <option value="">All statuses</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>
            <div id="providerTable"></div>
            <div class="pagination" id="providerPagination"></div>
        </div>
        <div id="providerModalRoot"></div>`;

    lucide.createIcons();
    document.getElementById("providerSignOut").addEventListener("click", async () => {
        const { error } = await window.sainoSupabase.auth.signOut();
        if (error) {
            showProviderNotice(`Could not sign out: ${error.message}`, true);
            return;
        }
        showProvidersPage();
    });
    document.getElementById("addProviderBtn").addEventListener("click", () => openProviderForm());
    document.getElementById("providerSearch").addEventListener("input", () => {
        clearTimeout(providerSearchTimer);
        providerSearchTimer = setTimeout(() => {
            providerPage = 0;
            loadProviders();
        }, 300);
    });
    document.getElementById("providerStatus").addEventListener("change", () => {
        providerPage = 0;
        loadProviders();
    });
    loadProviders();
}

function showProviderChangesPage() {
    const host = document.getElementById("pageContent");
    const config = window.SAINO_SUPABASE_CONFIG;

    if (!config || !config.url || !config.anonKey || !window.sainoSupabase) {
        host.innerHTML = '<div class="provider-message error">Configure Supabase in <code>admin/js/supabase-config.js</code> to review provider changes.</div>';
        return;
    }

    window.sainoSupabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            host.innerHTML = `<div class="provider-message error">${escapeHtml(error.message)}</div>`;
            return;
        }
        if (!data.session) {
            renderProviderLogin(host);
            return;
        }
        host.innerHTML = `
            <div class="page-intro">
                <div>
                    <p class="eyebrow">MARKETPLACE APPROVALS</p>
                    <h2>Provider change requests</h2>
                    <p class="muted">Approve or reject listing, doctor, service and plan changes submitted by provider teams.</p>
                </div>
                <button class="secondary-button" id="reviewSignOut">Sign out</button>
            </div>
            <div id="providerNotice" aria-live="polite"></div>
            <div class="panel provider-panel"><div id="providerChangeList"><p class="muted">Loading requests…</p></div></div>
            <div class="panel provider-panel"><div class="panel-header"><div><h3>Pending doctors, services, slots and offers</h3><p>Provider-submitted content awaiting SAINO approval.</p></div></div><div id="providerSubmissionList"><p class="muted">Loading submissions…</p></div></div>`;
        document.getElementById("reviewSignOut").addEventListener("click", async () => {
            const { error: signOutError } = await window.sainoSupabase.auth.signOut();
            if (signOutError) showProviderNotice(`Could not sign out: ${signOutError.message}`, true);
            else renderProviderLogin(host);
        });
        loadProviderChangeRequests();
        loadProviderSubmissions();
    });
}

async function loadProviderChangeRequests() {
    const list = document.getElementById("providerChangeList");
    if (!list) return;
    const { data, error } = await window.sainoSupabase
        .from("provider_change_requests")
        .select("id,profile,status,review_note,submitted_at,providers(name,city)")
        .eq("status", "pending")
        .order("submitted_at", { ascending: true })
        .range(0, 49);
    if (error) {
        list.innerHTML = "";
        showProviderNotice(`Could not load change requests: ${error.message}`, true);
        return;
    }
    if (data.length === 0) {
        list.innerHTML = '<div class="muted">There are no pending provider changes.</div>';
        return;
    }
    list.innerHTML = `
        <div class="provider-table-wrap">
            <table class="provider-table">
                <thead><tr><th>Provider</th><th>Submission</th><th>Submitted</th><th>Actions</th></tr></thead>
                <tbody>${data.map(request => {
                    const provider = request.providers || {};
                    const type = request.profile && request.profile.content
                        ? `${request.profile.content.entity || "Provider"} update`
                        : request.profile && request.profile.plan
                            ? `Plan request: ${planLabel(request.profile.plan)}`
                            : "Provider profile";
                    return `<tr>
                        <td><strong>${escapeHtml(provider.name || "Provider")}</strong><small>${escapeHtml(provider.city || "")}</small></td>
                        <td><strong>${escapeHtml(type)}</strong><small>${escapeHtml(JSON.stringify(request.profile))}</small></td>
                        <td>${escapeHtml(new Date(request.submitted_at).toLocaleString())}</td>
                        <td><div class="provider-actions">
                            <button type="button" data-review-id="${request.id}" data-review-decision="approved">Approve</button>
                            <button type="button" data-review-id="${request.id}" data-review-decision="rejected">Reject</button>
                        </div></td>
                    </tr>`;
                }).join("")}</tbody>
            </table>
        </div>`;
    list.querySelectorAll("[data-review-id]").forEach(button => button.addEventListener("click", () => reviewProviderChange(button.dataset.reviewId, button.dataset.reviewDecision)));
}

async function reviewProviderChange(requestId, decision) {
    const reviewNote = window.prompt(`${decision === "approved" ? "Approval" : "Rejection"} note (optional):`) || null;
    const { error } = await window.sainoSupabase.rpc("review_provider_change_request", {
        target_request_id: requestId,
        decision,
        decision_note: reviewNote
    });
    if (error) {
        showProviderNotice(`Could not ${decision} change request: ${error.message}`, true);
        return;
    }
    showProviderNotice(`Provider change request ${decision}.`);
    await loadProviderChangeRequests();
}

async function loadProviderSubmissions() {
    const list = document.getElementById("providerSubmissionList");
    if (!list) return;
    const resources = [
        ["doctor", "doctors", "name,specialty"],
        ["service", "provider_services", "name,price,currency"],
        ["slot", "appointment_slots", "starts_at,ends_at,capacity"],
        ["gallery", "provider_gallery", "caption,storage_path"],
        ["offer", "provider_offers", "title,description,discount_percent"]
    ];
    const results = await Promise.all(resources.map(async ([type, table, fields]) => {
        const { data, error } = await window.sainoSupabase
            .from(table)
            .select(`id,${fields},created_at,providers(name,city)`)
            .eq("status", "pending")
            .order("created_at", { ascending: true })
            .range(0, 49);
        return { type, data, error };
    }));
    const failed = results.find(result => result.error);
    if (failed) {
        list.innerHTML = "";
        showProviderNotice(`Could not load pending ${failed.type} submissions: ${failed.error.message}`, true);
        return;
    }
    const rows = results.flatMap(result => result.data.map(item => ({ ...item, resourceType: result.type })));
    if (!rows.length) {
        list.innerHTML = '<div class="muted">No pending doctors, services, slots, gallery images or offers.</div>';
        return;
    }
    list.innerHTML = `
        <div class="provider-table-wrap"><table class="provider-table">
            <thead><tr><th>Type</th><th>Provider</th><th>Submission</th><th>Submitted</th><th>Actions</th></tr></thead>
            <tbody>${rows.map(item => {
                const provider = item.providers || {};
                const summary = item.name || item.title || item.caption || (item.starts_at ? `${new Date(item.starts_at).toLocaleString()} – ${new Date(item.ends_at).toLocaleString()}` : "Provider content");
                return `<tr>
                    <td>${escapeHtml(item.resourceType)}</td>
                    <td><strong>${escapeHtml(provider.name || "Provider")}</strong><small>${escapeHtml(provider.city || "")}</small></td>
                    <td><strong>${escapeHtml(summary)}</strong><small>${escapeHtml(item.specialty || item.description || (item.price != null ? `${item.currency} ${item.price}` : ""))}</small></td>
                    <td>${escapeHtml(new Date(item.created_at).toLocaleString())}</td>
                    <td><div class="provider-actions">
                        <button type="button" data-content-id="${item.id}" data-content-type="${item.resourceType}" data-content-decision="approved">Approve</button>
                        <button type="button" data-content-id="${item.id}" data-content-type="${item.resourceType}" data-content-decision="rejected">Reject</button>
                    </div></td>
                </tr>`;
            }).join("")}</tbody>
        </table></div>`;
    list.querySelectorAll("[data-content-id]").forEach(button => button.addEventListener("click", () => reviewProviderSubmission(button.dataset.contentType, button.dataset.contentId, button.dataset.contentDecision)));
}

async function reviewProviderSubmission(resourceType, resourceId, decision) {
    const { error } = await window.sainoSupabase.rpc("moderate_provider_submission", {
        resource_type: resourceType,
        resource_id: resourceId,
        decision
    });
    if (error) {
        showProviderNotice(`Could not ${decision} ${resourceType}: ${error.message}`, true);
        return;
    }
    showProviderNotice(`${resourceType} ${decision}.`);
    await loadProviderSubmissions();
}

async function loadProviders() {
    const table = document.getElementById("providerTable");
    if (!table) return;
    const queryVersion = ++providerQueryVersion;
    table.innerHTML = '<p class="muted">Loading providers…</p>';

    const from = providerPage * PROVIDER_PAGE_SIZE;
    const to = from + PROVIDER_PAGE_SIZE - 1;
    const search = document.getElementById("providerSearch").value.trim();
    const status = document.getElementById("providerStatus").value;
    let query = window.sainoSupabase
        .from("providers")
        .select("id,name,provider_type,city,plan,status,verification_status,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

    if (search) query = query.or(`name.ilike.%${escapePostgrest(search)}%,city.ilike.%${escapePostgrest(search)}%`);
    if (status) query = query.eq("status", status);

    const { data, error, count } = await query;
    if (queryVersion !== providerQueryVersion || !document.getElementById("providerTable")) return;
    if (error) {
        showProviderNotice(`Could not load providers: ${error.message}`, true);
        table.innerHTML = "";
        return;
    }

    if (data.length === 0) {
        table.innerHTML = '<p class="muted">No providers found.</p>';
    } else {
        table.innerHTML = `
            <div class="provider-table-wrap">
                <table class="provider-table">
                    <thead><tr><th>Provider</th><th>Location</th><th>Plan</th><th>Status</th><th>Verification</th><th>Actions</th></tr></thead>
                    <tbody>${data.map(provider => `
                        <tr>
                            <td><strong>${escapeHtml(provider.name)}</strong><small>${escapeHtml(provider.provider_type)}</small></td>
                            <td>${escapeHtml(provider.city)}</td>
                            <td>${escapeHtml(planLabel(provider.plan))}</td>
                            <td><span class="status-badge ${escapeHtml(provider.status)}">${escapeHtml(provider.status)}</span></td>
                            <td>${escapeHtml(provider.verification_status)}</td>
                            <td><div class="provider-actions">
                                <button type="button" data-provider-edit="${provider.id}">Edit</button>
                                ${provider.status === "pending" ? `<button type="button" data-provider-status="active" data-provider-id="${provider.id}">Approve</button>` : ""}
                                ${provider.status === "active" ? `<button type="button" data-provider-status="suspended" data-provider-id="${provider.id}">Suspend</button>` : ""}
                                ${provider.status === "suspended" ? `<button type="button" data-provider-status="active" data-provider-id="${provider.id}">Reactivate</button>` : ""}
                                ${provider.status === "pending" ? `<button type="button" data-provider-status="rejected" data-provider-id="${provider.id}">Reject</button>` : ""}
                            </div></td>
                        </tr>`).join("")}</tbody>
                </table>
            </div>`;
    }

    const totalPages = Math.max(1, Math.ceil((count || 0) / PROVIDER_PAGE_SIZE));
    document.getElementById("providerPagination").innerHTML = `
        <span>${count || 0} providers · Page ${providerPage + 1} of ${totalPages}</span>
        <div class="provider-actions">
            <button type="button" id="providerPrevious" ${providerPage === 0 ? "disabled" : ""}>Previous</button>
            <button type="button" id="providerNext" ${providerPage + 1 >= totalPages ? "disabled" : ""}>Next</button>
        </div>`;
    document.getElementById("providerPrevious").addEventListener("click", () => { providerPage -= 1; loadProviders(); });
    document.getElementById("providerNext").addEventListener("click", () => { providerPage += 1; loadProviders(); });

    table.querySelectorAll("[data-provider-status]").forEach(button => {
        button.addEventListener("click", () => updateProviderStatus(button.dataset.providerId, button.dataset.providerStatus));
    });
    table.querySelectorAll("[data-provider-edit]").forEach(button => {
        button.addEventListener("click", () => editProvider(button.dataset.providerEdit));
    });
}

function openProviderForm(provider) {
    const current = provider || {
        name: "", provider_type: "hospital", plan: "saino_listed", about: "",
        address: "", city: "", phone: "", opening_hours: {}, latitude: null, longitude: null, status: "pending"
    };
    const hours = typeof current.opening_hours === "object" && current.opening_hours
        ? JSON.stringify(current.opening_hours, null, 2)
        : "{}";
    document.getElementById("providerModalRoot").innerHTML = `
        <div class="provider-modal-backdrop" id="providerBackdrop">
            <section class="provider-modal" role="dialog" aria-modal="true" aria-labelledby="providerFormTitle">
                <h2 id="providerFormTitle">${provider ? "Edit provider" : "Add provider"}</h2>
                <form class="provider-form" id="providerForm">
                    <label>Provider name<input name="name" required maxlength="180" value="${escapeHtml(current.name)}"></label>
                    <label>Provider type<select name="provider_type">
                        ${["hospital", "clinic", "diagnostic_centre", "other"].map(type => `<option value="${type}" ${current.provider_type === type ? "selected" : ""}>${type.replace("_", " ")}</option>`).join("")}
                    </select></label>
                    <label>Subscription plan<select name="plan">
                        ${["saino_listed", "saino_pro", "saino_prime"].map(plan => `<option value="${plan}" ${current.plan === plan ? "selected" : ""}>${planLabel(plan)}</option>`).join("")}
                    </select></label>
                    <label>City<input name="city" required maxlength="100" value="${escapeHtml(current.city)}"></label>
                    <label>Provider account email<input name="owner_email" type="email" autocomplete="off" placeholder="Optional · link an existing Supabase account"></label>
                    <label>Phone<input name="phone" maxlength="32" value="${escapeHtml(current.phone || "")}"></label>
                    <label>Address<input name="address" maxlength="300" value="${escapeHtml(current.address || "")}"></label>
                    <label>Latitude<input name="latitude" type="number" min="-90" max="90" step="any" value="${escapeHtml(current.latitude)}"></label>
                    <label>Longitude<input name="longitude" type="number" min="-180" max="180" step="any" value="${escapeHtml(current.longitude)}"></label>
                    <label class="wide">About<textarea name="about" maxlength="5000">${escapeHtml(current.about || "")}</textarea></label>
                    <label class="wide">Opening hours (JSON)<textarea name="opening_hours">${escapeHtml(hours)}</textarea></label>
                    <div class="provider-form-actions">
                        <button type="button" class="secondary-button" id="cancelProviderForm">Cancel</button>
                        <button type="submit" class="primary-button">Save provider</button>
                    </div>
                </form>
            </section>
        </div>`;

    document.getElementById("cancelProviderForm").addEventListener("click", closeProviderForm);
    document.getElementById("providerBackdrop").addEventListener("click", event => {
        if (event.target.id === "providerBackdrop") closeProviderForm();
    });
    document.getElementById("providerForm").addEventListener("submit", event => saveProvider(event, provider && provider.id));
}

async function editProvider(id) {
    const { data, error } = await window.sainoSupabase
        .from("providers")
        .select("id,name,provider_type,plan,about,address,city,phone,opening_hours,latitude,longitude,status")
        .eq("id", id)
        .single();
    if (error) {
        showProviderNotice(`Could not open provider: ${error.message}`, true);
        return;
    }
    openProviderForm(data);
}

async function saveProvider(event, id) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let openingHours;
    try {
        openingHours = JSON.parse(form.get("opening_hours") || "{}");
        if (!openingHours || Array.isArray(openingHours) || typeof openingHours !== "object") throw new Error();
    } catch {
        showProviderNotice("Opening hours must be a valid JSON object.", true);
        return;
    }
    const latitudeText = form.get("latitude").trim();
    const longitudeText = form.get("longitude").trim();
    const latitude = latitudeText ? Number(latitudeText) : null;
    const longitude = longitudeText ? Number(longitudeText) : null;
    if ((latitude === null) !== (longitude === null)
        || (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90))
        || (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))) {
        showProviderNotice("Enter both valid latitude and longitude values, or leave both blank.", true);
        return;
    }

    const payload = {
        name: form.get("name").trim(),
        provider_type: form.get("provider_type"),
        plan: form.get("plan"),
        city: form.get("city").trim(),
        phone: form.get("phone").trim() || null,
        address: form.get("address").trim() || null,
        about: form.get("about").trim() || null,
        opening_hours: openingHours,
        latitude,
        longitude
    };
    const result = id
        ? await window.sainoSupabase.from("providers").update(payload).eq("id", id)
        : await window.sainoSupabase.from("providers").insert(payload).select("id").single();

    if (result.error) {
        showProviderNotice(`Could not save provider: ${result.error.message}`, true);
        return;
    }
    const providerId = id || result.data.id;
    const ownerEmail = form.get("owner_email").trim();
    if (ownerEmail) {
        const { error: memberError } = await window.sainoSupabase.rpc("set_provider_member_by_email", {
            target_provider_id: providerId,
            target_email: ownerEmail,
            role_name: "owner"
        });
        if (memberError) {
            closeProviderForm();
            showProviderNotice(`Provider saved, but account linking failed: ${memberError.message}`, true);
            await loadProviders();
            return;
        }
    }
    closeProviderForm();
    showProviderNotice(id ? "Provider updated." : "Provider created and awaiting approval.");
    await loadProviders();
}

async function updateProviderStatus(id, status) {
    const updates = { status };
    if (status === "active") updates.verification_status = "verified";
    const { error } = await window.sainoSupabase.from("providers").update(updates).eq("id", id);
    if (error) {
        showProviderNotice(`Could not update provider status: ${error.message}`, true);
        return;
    }
    showProviderNotice(`Provider status changed to ${status}.`);
    await loadProviders();
}

function closeProviderForm() {
    document.getElementById("providerModalRoot").innerHTML = "";
}

function showProviderNotice(message, isError) {
    const notice = document.getElementById("providerNotice");
    if (!notice) return;
    notice.innerHTML = `<div class="provider-message${isError ? " error" : ""}">${escapeHtml(message)}</div>`;
}

function planLabel(plan) {
    return ({
        saino_listed: "Free Listing",
        saino_pro: "SAINO Verified (VIP)",
        saino_prime: "SAINO VVIP"
    })[plan] || plan;
}

function escapePostgrest(value) {
    return value.replace(/[\\%_*(),."]/g, "");
}

function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}
