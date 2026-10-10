document.addEventListener("DOMContentLoaded", () => {

    lucide.createIcons();

    initDashboard();
    initNavigation();
    initMobileMenu();

});


function initDashboard() {

    const data = ADMIN_DATA;

    document.getElementById("totalUsers").textContent =
        data.stats.totalUsers.toLocaleString();

    document.getElementById("totalProviders").textContent =
        data.stats.totalProviders.toLocaleString();

    document.getElementById("verifiedProviders").textContent =
        data.stats.verifiedProviders.toLocaleString();

    document.getElementById("totalAppointments").textContent =
        data.stats.appointments.toLocaleString();

    document.getElementById("totalReviews").textContent =
        data.stats.reviews.toLocaleString();

    document.getElementById("activeCampaigns").textContent =
        data.stats.campaigns.toLocaleString();


    renderActivities();
    renderVerificationQueue();

}


function renderActivities() {

    const container = document.getElementById("activityList");

    container.innerHTML = ADMIN_DATA.activities.map(activity => {

        return `
            <div class="activity-item">

                <div class="activity-icon ${activity.type}">
                    <i data-lucide="${activity.icon}"></i>
                </div>

                <div class="activity-content">

                    <strong>${activity.title}</strong>

                    <p>${activity.description}</p>

                </div>

                <time>${activity.time}</time>

            </div>
        `;

    }).join("");

    lucide.createIcons();

}


function renderVerificationQueue() {

    const container = document.getElementById("verificationList");

    container.innerHTML = ADMIN_DATA.verification.map(item => {

        return `
            <div class="mini-list-item">

                <div class="provider-mini-avatar">
                    ${getInitials(item.provider)}
                </div>

                <div class="mini-list-content">

                    <strong>${item.provider}</strong>

                    <span>
                        ${item.category} · ${item.location}
                    </span>

                </div>

                <span class="status-badge pending">
                    Pending
                </span>

            </div>
        `;

    }).join("");

}


function getInitials(name) {

    return name
        .split(" ")
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();

}


/* ==========================================
   NAVIGATION
========================================== */

function initNavigation() {

    document.addEventListener("click", event => {

        const target = event.target.closest("[data-page]");

        if (!target) return;

        event.preventDefault();

        const page = target.dataset.page;

        setActiveNavigation(target);

        changePage(page);

    });

}


function setActiveNavigation(target) {

    document
        .querySelectorAll(".nav-item")
        .forEach(item => item.classList.remove("active"));

    if (target.classList.contains("nav-item")) {

        target.classList.add("active");

    }

}


function changePage(page) {

    const titleMap = {

        dashboard: "Dashboard",
        providers: "Providers",
        doctors: "Doctors",
        categories: "Categories",
        services: "Services",
        featured: "Featured Listings",

        verification: "Verification Queue",
        "verification-rules": "Verification Rules",

        appointments: "Appointments",
        reviews: "Reviews & Moderation",
        users: "Users",
        reports: "Reports & Complaints",

        ads: "Advertisements",
        campaigns: "Campaigns",
        boosts: "Boosts",
        "ad-inventory": "Ad Inventory",

        homepage: "Homepage",
        banners: "Banners",
        articles: "Articles & FAQs",
        pages: "Static Pages",
        seo: "SEO",

        analytics: "Analytics",
        search: "Search & Discovery",
        recommendations: "Recommendations",

        notifications: "Notifications",
        features: "Feature Controls",
        roles: "Roles & Permissions",
        audit: "Audit Logs",
        settings: "Settings"

    };


    const title = titleMap[page] || "Dashboard";

    document.getElementById("pageTitle").textContent = title;
    document.getElementById("breadcrumbPage").textContent = title;


    if (page === "dashboard") {

        showDashboard();

        return;

    }

    if (page === "providers") {

        showProvidersPage();

        return;

    }

    if (page === "verification") {

        showProviderChangesPage();

        return;

    }


    showComingSoon(page, title);

}


function showDashboard() {

    const pageContent = document.getElementById("pageContent");

    pageContent.innerHTML = `
        <div id="dashboardPage" class="page active-page">

            <div class="page-intro">

                <div>
                    <p class="eyebrow">MARKETPLACE OVERVIEW</p>
                    <h2>Good evening, Admin.</h2>
                    <p class="muted">
                        Here's what's happening across SAINO today.
                    </p>
                </div>

                <button class="primary-button">
                    <i data-lucide="plus"></i>
                    Quick Action
                </button>

            </div>

            <div class="stats-grid">

                ${statCard(
                    "users",
                    "Total Users",
                    ADMIN_DATA.stats.totalUsers.toLocaleString(),
                    "↑ 8.4% this month"
                )}

                ${statCard(
                    "building-2",
                    "Total Providers",
                    ADMIN_DATA.stats.totalProviders,
                    "↑ 12 new this week"
                )}

                ${statCard(
                    "badge-check",
                    "Verified Providers",
                    ADMIN_DATA.stats.verifiedProviders,
                    "72.4% of providers"
                )}

                ${statCard(
                    "calendar-check",
                    "Appointments",
                    ADMIN_DATA.stats.appointments.toLocaleString(),
                    "↑ 14.2% this month"
                )}

                ${statCard(
                    "star",
                    "Total Reviews",
                    ADMIN_DATA.stats.reviews.toLocaleString(),
                    "18 awaiting moderation"
                )}

                ${statCard(
                    "megaphone",
                    "Active Campaigns",
                    ADMIN_DATA.stats.campaigns,
                    "8 pending approval"
                )}

            </div>

            <div class="section-heading">
                <div>
                    <h3>Quick Actions</h3>
                    <p>Frequently used administration tools.</p>
                </div>
            </div>

            <div class="quick-actions">

                ${quickAction(
                    "building-2",
                    "Add Provider",
                    "Create a marketplace listing",
                    "providers"
                )}

                ${quickAction(
                    "shield-check",
                    "Review Verification",
                    "24 providers waiting",
                    "verification"
                )}

                ${quickAction(
                    "message-square-warning",
                    "Moderate Reviews",
                    "18 require attention",
                    "reviews"
                )}

                ${quickAction(
                    "megaphone",
                    "Create Advertisement",
                    "Manage marketplace ads",
                    "ads"
                )}

            </div>

            <div class="dashboard-grid">

                <div class="panel">

                    <div class="panel-header">

                        <div>
                            <h3>Recent Activity</h3>
                            <p>Latest actions across the marketplace.</p>
                        </div>

                        <button class="text-button">
                            View All
                        </button>

                    </div>

                    <div class="activity-list">

                        ${ADMIN_DATA.activities.map(activity => `

                            <div class="activity-item">

                                <div class="activity-icon ${activity.type}">
                                    <i data-lucide="${activity.icon}"></i>
                                </div>

                                <div class="activity-content">

                                    <strong>${activity.title}</strong>
                                    <p>${activity.description}</p>

                                </div>

                                <time>${activity.time}</time>

                            </div>

                        `).join("")}

                    </div>

                </div>


                <div class="panel">

                    <div class="panel-header">

                        <div>
                            <h3>Verification Queue</h3>
                            <p>Providers awaiting review.</p>
                        </div>

                        <button class="text-button"
                                data-page="verification">
                            View Queue
                        </button>

                    </div>

                    <div class="mini-list">

                        ${ADMIN_DATA.verification.map(item => `

                            <div class="mini-list-item">

                                <div class="provider-mini-avatar">
                                    ${getInitials(item.provider)}
                                </div>

                                <div class="mini-list-content">

                                    <strong>${item.provider}</strong>

                                    <span>
                                        ${item.category} · ${item.location}
                                    </span>

                                </div>

                                <span class="status-badge pending">
                                    Pending
                                </span>

                            </div>

                        `).join("")}

                    </div>

                </div>

            </div>

            <div class="panel marketplace-health">

                <div class="panel-header">

                    <div>
                        <h3>Marketplace Health</h3>
                        <p>Current platform performance.</p>
                    </div>

                    <span class="live-badge">
                        <span></span> Live
                    </span>

                </div>

                <div class="health-grid">

                    ${healthItem("Search → Profile", "38.6%", 38.6)}
                    ${healthItem("Profile → Booking", "14.8%", 14.8)}
                    ${healthItem("Provider Verification", "72.4%", 72.4)}
                    ${healthItem("Profile Completion", "81.2%", 81.2)}

                </div>

            </div>
        </div>
    `;

    lucide.createIcons();

}


function statCard(icon, title, value, subtitle) {

    return `
        <div class="stat-card">

            <div class="stat-icon">
                <i data-lucide="${icon}"></i>
            </div>

            <div class="stat-content">

                <span>${title}</span>

                <strong>${value}</strong>

                <small>${subtitle}</small>

            </div>

        </div>
    `;

}


function quickAction(icon, title, description, page) {

    return `
        <button class="quick-action" data-page="${page}">

            <span class="quick-icon red">
                <i data-lucide="${icon}"></i>
            </span>

            <span>
                <strong>${title}</strong>
                <small>${description}</small>
            </span>

        </button>
    `;

}


function healthItem(label, value, percentage) {

    return `
        <div class="health-item">

            <span>${label}</span>

            <strong>${value}</strong>

            <div class="progress">
                <i style="width:${percentage}%"></i>
            </div>

        </div>
    `;

}


function showComingSoon(page, title) {

    const pageContent = document.getElementById("pageContent");

    pageContent.innerHTML = `

        <div class="module-placeholder">

            <div class="placeholder-icon">
                <i data-lucide="construction"></i>
            </div>

            <p class="eyebrow">ADMIN MODULE</p>

            <h2>${title}</h2>

            <p>
                This module is part of the SAINO Super Admin system.
                Its complete management interface will be added here.
            </p>

            <div class="placeholder-note">

                <i data-lucide="database"></i>

                <span>
                    Currently using mock data.
                    This module is API-ready for future backend integration.
                </span>

            </div>

        </div>

    `;

    lucide.createIcons();

}


/* ==========================================
   MOBILE
========================================== */

function initMobileMenu() {

    const button = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");

    if (!button) return;

    button.addEventListener("click", () => {

        sidebar.classList.toggle("open");

    });

}