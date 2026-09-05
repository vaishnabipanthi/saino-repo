# SAINO HEALTH - Healthcare Marketplace Frontend Application

A modern, responsive, and connected healthcare marketplace web application for **SAINO HEALTH** (*Saino Tech Ventures Pvt. Ltd.*, 2026), built to fulfill the complete 11-page design and functionality specification.

---

## 🌟 Core Concepts & Tagline
> **"SEARCH, DISCOVER, REVIEW and BOOK YOUR APPOINTMENT"**  
> *"Connecting People with Healthcare They Can Trust"*  
> *(Connect · Trust · Transparency · Choice)*

---

## 🚀 How to Run & Preview the Application

1. **Direct Browser Preview**:
   - Simply open [`index.html`](file:///C:/Users/USER/.gemini/antigravity/scratch/saino-health/index.html) in any modern web browser (Chrome, Edge, Firefox, Safari).

2. **Using a Local Server** (Optional for Live Reloading):
   - Using VSCode Live Server or `npx serve` inside `C:\Users\USER\.gemini\antigravity\scratch\saino-health\`.

---

## 📋 Features Implemented Against Specification

### 1. Header & Navigation (Page 1)
- Clean brand logo with medical pulse symbol.
- Location-wise selector (Kathmandu, Lalitpur, Bhaktapur, Pokhara, Biratnagar, Chitwan, Banepa/Kavre).
- Seamless view switching: **Marketplace**, **Healthcare Providers (30 Logos)**, **SAINO Boost**, **About Us**, and **Contact Us**.
- Quick CTAs: `List Your Business` and `Provider Login`.

### 2. Multi-Parameter Search & Filters (Page 1)
- Location-wise, service-wise, and category-wise search.
- Search input with real-time matching across provider names, departments, doctor names, and cities.
- Quick filter pills for all **9 Healthcare Categories**:
  1. *Hospital Providers*
  2. *Clinic*
  3. *Diagnostic Centre*
  4. *Physiotherapy*
  5. *Wellness Centre*
  6. *Health Insurance or Group Insurance*
  7. *Blood Bank Services*
  8. *Pharmacy*
  9. *Homecare Centre*

### 3. Fast-Track Booking Categories & WhatsApp Engine (Pages 1, 2, 9 & 10)
- 8 Booking categories:
  - *Hospital Doctor Consultation Appointment Bookings*
  - *Homecare Doctor*
  - *Home Care Nurse*
  - *Clinic Appointment*
  - *Dr Appointment Booking*
  - *Physical Wellness Centre Service Booking*
  - *Ambulance Booking*
  - *Bloodbank Booking*
- Interactive WhatsApp booking generator modal: automatically prepares pre-formatted message with patient name, selected doctor/service, date, and notes.

### 4. Promotional Ads Carousel (7–8 Scrolling Ads + Health Insurance Space) (Pages 1, 2 & 11)
- 8 auto-rotating and touch/button scrollable sponsored campaign banners.
- Dedicated **Health Insurance Space Banner** connecting users with cashless health insurance policies in Nepal.

### 5. Marketplace Listings & 3-Tier Verification Badges (Pages 1, 2, 9 & 10)
- 25 rich Nepalese provider listings across Kathmandu Valley and major cities.
- **3 Verification Tiers**:
  - `Saino Pro`: Paid verified profile, up to 15 users, verified badge, top ranking, advanced analytics tool.
  - `Saino Prime`: Paid verified profile, 5 doctors/users listing fee, verified badge, priority ranking.
  - `Saino Listed`: Free listing, 2 booking services, manual WhatsApp inquiry, basic ranking.
- Interactive engagement:
  - Live toggleable `♡ Like` and `👥 Interested` counters.
  - ⭐ Rating and review counters.
  - Service hours, opening/closing times, and department tags.

### 6. Comprehensive Provider Profile Detail Modal (Pages 10 & 11)
- Interactive tabbed view:
  - **About**: Facility overview, accreditation, address.
  - **Services & Fees**: List of consultation and test packages with direct booking triggers.
  - **Reviews**: Patient feedback with live review submission form.
  - **Activity**: Recent community health camps and tech upgrades.
  - **Photos**: High-res medical facility and lab photos.
  - **Doctor Availability**: Day and time slots for senior specialists.

### 7. Community Engagement: "Talk of the Town" (Page 11)
- **Review and Talk of Town**: Trending patient experiences.
- **Hospital's Talk**: Announcements from major hospitals like Norvic and CityCare.
- **Best Clinic Talk**: Pediatric and specialist healthcare tips from clinic leads.

### 8. Healthcare Providers Showcase (30 Dummy Logos) (Page 3)
- 30 logos displaying **Verified vs. Non-Verified** providers side-by-side to stimulate vendor competition.
- Verified logos are clickable to view their profile.
- Unverified logos link to the **Upgrade Badge** subscription onboarding flow.

### 9. SAINO Boost & Advertiser Portal (Page 4)
- Category search boost, home banner placements, and ROI analytics.
- Advertising FAQ, payment terms, and campaign policies.

### 10. About Us Page (Pages 4, 5, 6)
- Mission: *"To make healthcare easier to discover, explore, and access."*
- Full brand quotes and offerings checklist.
- **4 Care Pillars**: *Connect · Trust · Transparency · Choice*.
- **Data Privacy & Security**: *"Your data has only one owner. YOU."* (256-Bit encryption, zero third-party data sharing).
- **Health Care Investors**: Investor relations pathway.

### 11. Contact Us Page (Pages 7 & 8)
- Multi-audience inquiry selector (*Patients & Users, Healthcare Providers, Healthcare Businesses, Partnerships, Investors*).
- Contact form with topic dropdown, phone, email, and message.
- Office details: *SAINO Tech Ventures Pvt. Ltd., Tejasswee Girls Hostel opp, Suruchi Marg, Kathmandu-31, Kathmandu 44600, Nepal*.

### 12. Full-Fledged Footer (Pages 2, 3, 6)
- Company logo, categorized patient links, provider portal, advertiser links, wiki, and `2026 all rights reserved SainoTechVentures` copyright notice.

---

## 📁 File Structure

```
saino-health/
├── index.html            # Main HTML layout, search bar, header, and footer
├── css/
│   └── custom.css        # Verification badges, glassmorphism, animations & scrollbar styles
├── js/
│   ├── data.js           # 25 providers, 30 vendor logos, 8 ads, 9 categories, talks & FAQs
│   └── app.js            # Reactive state controller, search/filter algorithms, modals, WhatsApp link builder
└── README.md             # Project documentation & instructions
```
