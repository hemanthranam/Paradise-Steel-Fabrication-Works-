# Paradise Steel Fabrication Works — SPEED LIFT Construction Hoists

Official digital platform and lead capture system for **Paradise Steel Fabrication Works**, manufacturers of the **SPEED LIFT** vertical material handling systems in Madanapalle, Andhra Pradesh, India (Established 1989).

---

## 🏗️ Verified Company Information

- **Enterprise:** Paradise Steel Fabrication Works
- **Proprietor:** R. Rama Krishna
- **Established Year:** 1989
- **Headquarters & Workshop:**  
  Plot No. E-13, Industrial Development Estate,  
  Madanapalle, Chittoor District, Andhra Pradesh – 517 325, India
- **Contact Numbers:**
  - **Primary WhatsApp Channel:** `+91 76758 15245`
  - **Proprietor Line:** `+91 94405 85329`
  - **Works Office:** `+91 95157 18708`
- **Email:** `manager.psfw@gmail.com`
- **Official Domain:** `www.paradisefabrications.com`
- **Live Production (Cloudflare Workers):** `https://paradise-steel-fabrication-works.ranam.workers.dev/`
- **GitHub Pages Primary Mirror:** `https://hemanthranam.github.io/Paradise-Steel-Fabrication-Works-/`
- **Release Version:** `v2.5.0 (Master Final Lock — Production Ready)`
- **Parent Organisation:** Ranam MachineTech Pvt Ltd
- **Google Drive Storage:** `Ranam MachineTech Pvt Ltd > PSFW — Paradise Steel Fabrication Works`
- **Google Sheets CRM:** `PSFW — Business Operations Database` (`1gDPo7gaOjcPiz5yyWfSkkBlcwG3GN5acFnf3iAuYS7Y`)

---

## 🔒 Master UI & Architecture Lock (v2.5.0)

This release establishes the permanent design system, code freeze, and structural lock for the PSFW web ecosystem:
- **Design System Reference:** Follows Nexora Tech Enterprise (`Arsha` enterprise template pattern).
- **Color System:** Clean White Base (`#FFFFFF`), Industrial Dark Navy (`#37517E`), Electric Cyan (`#47B2E4`), Slate Body Text (`#444444`).
- **Layout Standards:** 100% Premium UI Cards with circular/rounded cyan icon badges (`.feature-card`, `.feature-icon`, `.about-cards-grid`, `.icon-box`). Zero unstyled raw text lists.
- **Header Clearance & Anchor Padding:** Enforced `scroll-padding-top: 100px`, `scroll-margin-top: 100px` on all sections, and `padding-top: 120px` (`105px` mobile) hero clearance. "Lifetime Machinery Support" badge and top headings remain completely unobstructed by the fixed header.
- **Mobile Form Usability:** Input fields configured to display cleanly stacked one-by-one with touch-friendly paddings and clear labels.
- **Space-Saving Horizontal Card Headers:** Headings positioned directly adjacent to icon badges for maximum screen-space efficiency on mobile and web viewports.
- **True Authentic Monkey Hoist Imagery:**
  - Hero field showcase: Clean terrace installation under clear sky without human obstruction (`speed-lift-field-terrace-ref.jpg`).
  - Studio isolated photography: Slender 4-leg yellow outrigger frame, center electric motor, dual green enclosures, coiled remote, and trolley basket on seamless pure white background (`speed-lift-150-white-ref.jpg`).
  - Engineering isometric CAD diagram: Full exploded modular view with components A through L clearly annotated (`speed-lift-150-exploded-spec.jpg`).
- **3D Machinery Viewer:** Completely removed in favor of lightweight, ultra-fast, zero-freeze static SVG/responsive picture elements.
- **Preloader Safety:** Dual JS (`initPageLoader()`) and CSS keyframe fallback (`@keyframes autoDismissPreloader`) ensuring zero freezing.
- **Google Workspace Backend:** Production-grade Google Apps Script (`google-apps-script/Code.gs`) with `LockService` concurrency, sequential `PSFW-YYYY-XXXX` lead IDs, email alerts to `manager.psfw@gmail.com`, and automated logging to `15_Audit_Log`.

---

## ⚙️ Verified Machinery Specifications

### SPEED LIFT 250 (Standard Jobsite Commercial Flagship)
- **Lifting Load Capacity:** 250 kg
- **Lifting Height:** Up to 10 Floors (~100 ft)
- **Unloading Area:** 360 Degrees Radial Slew
- **Power Supply Phase:** Single Phase / Three Phase Compatible
- **Safety System:** Automatic Electromagnetic Magnetic Brake
- **Motor Rating:** High-Torque Calibrated Electric Drive
- **Warranty:** 1-Year Motor Replacement Warranty on mechanical fault
- **Labor Savings:** Replaces up to 5 laborers/day on multi-story building sites

### SPEED LIFT 150 (Residential & Low-Rise Builders)
- **Payload Capacity:** 150 kg | **Lifting Reach:** Up to 60 ft (~4-5 Floors) | **Power Supply:** Single Phase 220V, 50 Hz

### SPEED LIFT 500 (Heavy Commercial & High-Rise Infrastructure)
- **Payload Capacity:** 500 kg | **Lifting Reach:** Up to 10 Floors | **Power Supply:** Three Phase 415V

---

## 📁 Repository Structure

```text
Paradise-Steel-Fabrication-Works-/
├── index.html                           # Homepage with hero, product cards, about cards, services & inquiry
├── about.html                           # 1989 heritage, founder history & core machinery principles
├── speed-lift-150.html                  # SPEED LIFT 150 dedicated product specs & isometric CAD exploded view
├── speed-lift-250.html                  # SPEED LIFT 250 standard commercial hoist specs & technical data
├── speed-lift-500.html                  # SPEED LIFT 500 heavy commercial hoist specs & technical data
├── capabilities.html                    # Detailed technical comparison matrix for all 3 models
├── services.html                        # Warranty, health checkups, AMC plans & spare parts support
├── projects.html                        # Authentic job site operations & material transport profile
├── contact.html                         # Workshop address, telephone lines & direct inquiry form
├── quote.html                           # Dedicated full-page quotation configurator & WhatsApp router
├── privacy.html                         # Privacy policy & data protection standards
├── terms.html                           # Terms of service & equipment warranty conditions
├── refund-policy.html                   # Cancellation, refund & deposit policy
├── cookies.html                         # Cookie notice & consent management
├── 404.html                             # Custom branded 404 error page
├── offline.html                         # Service worker offline fallback page
├── css/
│   └── style.css                        # Nexora corporate master design system & responsive layout tokens
├── js/
│   └── app.js                           # Form validation, quote modal, ROI calculator & PWA service worker
├── assets/
│   ├── images/
│   │   ├── speed-lift-150-white-ref.jpg     # True slender 4-leg hoist on pure white background
│   │   ├── speed-lift-field-terrace-ref.jpg # Clean terrace installation without humans
│   │   ├── speed-lift-150-exploded-spec.jpg # Isometric engineering CAD exploded view
│   │   ├── speed-lift-200-machine.jpg       # LOCKED MASTER ASSET (Authentic field machine photo)
│   │   ├── speed-lift-site-operation.jpg    # Authentic high-rise slab operation photo
│   │   ├── speed-lift-mechanism-closeup.jpg # Authentic motor box & horse emblem photo
│   │   └── logo-horse.svg                   # High-res industrial horse vector emblem
│   └── icons/
│       └── logo-horse.svg                   # Vector brand icon
├── google-apps-script/
│   ├── Code.gs                          # Production-ready Apps Script backend with LockService & email alerts
│   └── README.md                        # Step-by-step Google Sheet & Web App deployment instructions
├── robots.txt                           # Search engine crawling rules
├── sitemap.xml                          # Complete XML sitemap
└── README.md                            # Master project documentation & architecture lock
```

---

## 🔒 Master Asset Policy
As per strict engineering guidelines, `speed-lift-200-machine.jpg` is a **locked master asset**. It is preserved in its authentic, original state without alteration, cropping, synthetic overlays, or generative modifications. Authentic photographic and CAD blueprints are indexed in the `assets/images/` repository directory.

---

## 🚀 Production Deployment & Status

- **Cloudflare Workers Deployment:** `https://paradise-steel-fabrication-works.ranam.workers.dev/`
- **GitHub Repository:** `https://github.com/hemanthranam/Paradise-Steel-Fabrication-Works-`
- **Current Tag:** `v2.5.0` (Master Final Lock)
- **Status:** **Production Ready & Live** (All 16 pages verified and rendered without freeze)
