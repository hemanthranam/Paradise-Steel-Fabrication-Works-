/**
 * PARADISE STEEL FABRICATION WORKS — JAVASCRIPT ENGINE
 * Handles:
 * 1. Mobile navigation drawer
 * 2. Modal system (Booking, Specs, Success, Brochure)
 * 3. Form validation, Honeypot, and Resilient Google Apps Script submission
 * 4. WhatsApp Click-to-Chat dynamic generator
 * 5. Interactive Labor Savings & ROI Calculator
 * 6. Back-to-Top scroll behavior
 */

// Configuration Constants
const CONFIG = {
  // Temporary development fallback / Active Google Apps Script Web App Endpoint
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycby2XpdlBfd1buCu0MfKQcfGktH1HJrDlXM_2nxlX94IO8CncLHsmozoyAw0KzBz3WzvDg/exec",
  PRIMARY_WHATSAPP: "917675815245",
  SECONDARY_PHONE: "919440585329",
  COMPANY_NAME: "Paradise Steel Fabrication Works"
};

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initModals();
  initLeadForm();
  initRoiCalculator();
  initBackToTop();
});

/* --------------------------------------------------------------------------
   1. NAVIGATION & MOBILE DRAWER
   -------------------------------------------------------------------------- */
function initNavigation() {
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      menuToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });

    // Close mobile nav when clicking any link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      });
    });
  }
}

/* --------------------------------------------------------------------------
   2. MODAL SYSTEM
   -------------------------------------------------------------------------- */
function initModals() {
  // Close modals via overlay click or close button
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });

    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeModal(overlay.id);
      });
    }
  });

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(modal => {
        closeModal(modal.id);
      });
    }
  });
}

function openModal(modalId, presetModel = "") {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';

  if (presetModel && modalId === 'quoteModal') {
    const selectEl = document.getElementById('leadModel');
    if (selectEl) {
      for (let i = 0; i < selectEl.options.length; i++) {
        if (selectEl.options[i].value.toLowerCase().includes(presetModel.toLowerCase()) ||
            selectEl.options[i].text.toLowerCase().includes(presetModel.toLowerCase())) {
          selectEl.selectedIndex = i;
          break;
        }
      }
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.classList.remove('open');
  document.body.style.overflow = '';
}

/* --------------------------------------------------------------------------
   3. LEAD FORM & APPS SCRIPT SUBMISSION
   -------------------------------------------------------------------------- */
function initLeadForm() {
  const form = document.getElementById('leadForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Spam Protection: Honeypot Check
    const honeypot = document.getElementById('leadHoneypot');
    if (honeypot && honeypot.value.trim() !== '') {
      console.warn("Spam bot submission intercepted.");
      return;
    }

    const submitBtn = document.getElementById('submitLeadBtn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Inquiry...';

    // Collect Data
    const payload = {
      timestamp: new Date().toISOString(),
      name: (document.getElementById('leadName')?.value || '').trim(),
      phone: (document.getElementById('leadPhone')?.value || '').trim(),
      email: (document.getElementById('leadEmail')?.value || '').trim(),
      model: document.getElementById('leadModel')?.value || 'SPEED LIFT 200',
      location: (document.getElementById('leadLocation')?.value || '').trim(),
      powerPhase: document.getElementById('leadPowerPhase')?.value || 'Not Specified',
      projectDetails: (document.getElementById('leadDetails')?.value || '').trim(),
      source: window.location.pathname.split('/').pop() || 'index.html'
    };

    // Client-side phone validation
    const cleanPhone = payload.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit phone number so our team can provide your quotation.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      return;
    }

    try {
      // Send to Apps Script using text/plain to prevent CORS preflight blocking
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      // Handle successful response
      form.reset();
      closeModal('quoteModal');
      openSuccessModal(payload);
    } catch (err) {
      console.error("Submission error:", err);
      // Fallback: If network issue, still gracefully acknowledge & offer 1-click WhatsApp transfer
      form.reset();
      closeModal('quoteModal');
      openSuccessModal(payload, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

function openSuccessModal(leadData, hasFallback = false) {
  const successModal = document.getElementById('successModal');
  if (!successModal) return;

  const leadRef = document.getElementById('successLeadRef');
  if (leadRef) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    leadRef.textContent = `PSFW-2026-${randomSuffix}`;
  }

  const fallbackNotice = document.getElementById('successFallbackNotice');
  if (fallbackNotice) {
    if (hasFallback) {
      fallbackNotice.style.display = 'block';
      const waBtn = document.getElementById('fallbackWhatsAppBtn');
      if (waBtn) {
        const msg = encodeURIComponent(`Hi Paradise Steel, I just submitted an inquiry for ${leadData.model}. Name: ${leadData.name}, Phone: ${leadData.phone}, Location: ${leadData.location || 'N/A'}. Please share the quotation.`);
        waBtn.href = `https://wa.me/${CONFIG.PRIMARY_WHATSAPP}?text=${msg}`;
      }
    } else {
      fallbackNotice.style.display = 'none';
    }
  }

  openModal('successModal');
}

/* --------------------------------------------------------------------------
   4. WHATSAPP MESSAGE GENERATOR
   -------------------------------------------------------------------------- */
function sendWhatsAppInquiry(modelName = "SPEED LIFT 200") {
  const text = encodeURIComponent(
    `Hello Paradise Steel Fabrication Works,\n\nI am interested in the ${modelName} vertical material hoist for our construction site.\n\nPlease share official pricing, site erection requirements, and delivery timeline.\n\nThank you!`
  );
  window.open(`https://wa.me/${CONFIG.PRIMARY_WHATSAPP}?text=${text}`, '_blank');
}

/* --------------------------------------------------------------------------
   5. INTERACTIVE ROI & LABOR SAVINGS CALCULATOR
   -------------------------------------------------------------------------- */
function initRoiCalculator() {
  const laborersInput = document.getElementById('calcLaborers');
  const dailyWageInput = document.getElementById('calcDailyWage');
  const workingDaysInput = document.getElementById('calcWorkingDays');

  if (!laborersInput || !dailyWageInput || !workingDaysInput) return;

  const laborersVal = document.getElementById('calcLaborersVal');
  const dailyWageVal = document.getElementById('calcDailyWageVal');
  const workingDaysVal = document.getElementById('calcWorkingDaysVal');

  const monthlySavingsEl = document.getElementById('calcMonthlySavings');
  const annualSavingsEl = document.getElementById('calcAnnualSavings');
  const paybackEl = document.getElementById('calcPaybackDays');

  function calculate() {
    const laborers = parseInt(laborersInput.value, 10) || 5;
    const wage = parseInt(dailyWageInput.value, 10) || 600;
    const days = parseInt(workingDaysInput.value, 10) || 26;

    // Display slider values
    if (laborersVal) laborersVal.textContent = laborers;
    if (dailyWageVal) dailyWageVal.textContent = `₹${wage}`;
    if (workingDaysVal) workingDaysVal.textContent = `${days} Days`;

    // Formulas:
    // Daily savings = laborers saved * daily wage
    const dailySavings = laborers * wage;
    const monthlySavings = dailySavings * days;
    const annualSavings = monthlySavings * 12;

    // Approximate investment for SPEED LIFT setup ~ ₹95,000 to ₹1,40,000
    const approxMachineCost = 115000;
    const paybackDays = Math.ceil(approxMachineCost / (dailySavings > 0 ? dailySavings : 1));

    if (monthlySavingsEl) {
      monthlySavingsEl.textContent = `₹${monthlySavings.toLocaleString('en-IN')}`;
    }
    if (annualSavingsEl) {
      annualSavingsEl.textContent = `₹${annualSavings.toLocaleString('en-IN')}`;
    }
    if (paybackEl) {
      paybackEl.textContent = `${paybackDays} Days`;
    }
  }

  laborersInput.addEventListener('input', calculate);
  dailyWageInput.addEventListener('input', calculate);
  workingDaysInput.addEventListener('input', calculate);

  // Initial calculation
  calculate();
}

/* --------------------------------------------------------------------------
   6. BACK TO TOP
   -------------------------------------------------------------------------- */
function initBackToTop() {
  const backBtn = document.getElementById('backToTopBtn');
  if (!backBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backBtn.classList.add('visible');
    } else {
      backBtn.classList.remove('visible');
    }
  }, { passive: true });

  backBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
