/**
 * PARADISE STEEL FABRICATION WORKS — JAVASCRIPT ENGINE
 * Handles:
 * 1. Mobile navigation drawer
 * 2. Modal system (Booking, Specs, Success)
 * 3. Form validation, Honeypot, and Resilient Google Apps Script submission
 * 4. WhatsApp Click-to-Chat with prefilled model inquiries
 * 5. Interactive Three.js 3D Machine Presentation (SPEED LIFT 250 & 500)
 * 6. Page Loading State & Micro-interactions
 * 7. Interactive Labor Savings & ROI Calculator
 * 8. Back-to-Top scroll behavior
 */

// Global Configuration
const CONFIG = {
  // Production Google Apps Script Web App Endpoint
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycby2XpdlBfd1buCu0MfKQcfGktH1HJrDlXM_2nxlX94IO8CncLHsmozoyAw0KzBz3WzvDg/exec",
  PRIMARY_WHATSAPP: "919440585329",
  PRIMARY_PHONE: "+91 94405 85329",
  SECONDARY_PHONE: "+91 76758 15245",
  COMPANY_NAME: "Paradise Steel Fabrication Works"
};

document.addEventListener('DOMContentLoaded', () => {
  initPageLoader();
  initNavigation();
  initModals();
  initLeadForm();
  init3DMachine();
  initRoiCalculator();
  initBackToTop();
});

/* --------------------------------------------------------------------------
   0. PAGE LOADER
   -------------------------------------------------------------------------- */
function initPageLoader() {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('loaded');
    }, 250);
  });

  // Fallback in case load event already fired or took too long
  setTimeout(() => {
    if (loader && !loader.classList.contains('loaded')) {
      loader.classList.add('loaded');
    }
  }, 1200);
}

/* --------------------------------------------------------------------------
   1. NAVIGATION & MOBILE DRAWER
   -------------------------------------------------------------------------- */
function initNavigation() {
  const header = document.getElementById('header');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        header.classList.add('header-scrolled');
      } else {
        header.classList.remove('header-scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  const menuToggle = document.getElementById('menuToggle') || document.querySelector('.mobile-nav-toggle');
  const mobileNav = document.getElementById('mobileNav') || document.querySelector('.mobile-nav-wrapper');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      menuToggle.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
      });
    });
  }
}

/* --------------------------------------------------------------------------
   2. MODAL SYSTEM
   -------------------------------------------------------------------------- */
function initModals() {
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

    const payload = {
      timestamp: new Date().toISOString(),
      name: (document.getElementById('leadName')?.value || '').trim(),
      phone: (document.getElementById('leadPhone')?.value || '').trim(),
      email: (document.getElementById('leadEmail')?.value || '').trim(),
      model: document.getElementById('leadModel')?.value || 'SPEED LIFT 250',
      location: (document.getElementById('leadLocation')?.value || '').trim(),
      powerPhase: document.getElementById('leadPowerPhase')?.value || 'Not Specified',
      projectDetails: (document.getElementById('leadDetails')?.value || '').trim(),
      source: window.location.pathname.split('/').pop() || 'index.html'
    };

    const cleanPhone = payload.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit phone number so our engineering team can provide your quotation.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      return;
    }

    try {
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      let result = null;
      try {
        result = await response.json();
      } catch (jsonErr) {
        console.warn("Could not parse JSON response:", jsonErr);
      }

      if (response.ok && result && result.status === 'success') {
        form.reset();
        closeModal('quoteModal');
        openSuccessModal(payload, result.inquiryId || "PSFW-RECEIVED", false);
      } else {
        console.error("Backend error response:", result);
        handleSubmissionFailure(payload, result ? result.message : "Service temporarily busy");
      }
    } catch (err) {
      console.error("Submission error:", err);
      handleSubmissionFailure(payload, "Network connection issue");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

function handleSubmissionFailure(leadData, reason) {
  const fallbackMsg = `Hi, I tried submitting an inquiry on your website for ${leadData.model}. Name: ${leadData.name}, Phone: ${leadData.phone}, Location: ${leadData.location || "AP"}. Please share quotation.`;
  const waUrl = `https://wa.me/${CONFIG.PRIMARY_WHATSAPP}?text=${encodeURIComponent(fallbackMsg)}`;
  
  const proceed = confirm(`Notice: The online inquiry service encountered a delay (${reason}).\n\nWould you like to connect directly with our engineering desk on WhatsApp now to receive your quotation?`);
  if (proceed) {
    window.open(waUrl, '_blank');
  }
}

function openSuccessModal(leadData, actualLeadId, hasFallback = false) {
  const successModal = document.getElementById('successModal');
  if (!successModal) return;

  const leadRef = document.getElementById('successLeadRef');
  if (leadRef) {
    leadRef.textContent = actualLeadId;
  }

  const fallbackNotice = document.getElementById('successFallbackNotice');
  if (fallbackNotice) {
    if (hasFallback) {
      fallbackNotice.style.display = 'block';
      const waBtn = document.getElementById('fallbackWhatsAppBtn');
      if (waBtn) {
        const msg = encodeURIComponent(`Hi, I am interested in ${leadData.model}. Inquiry Ref: ${actualLeadId}. Please share specifications.`);
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
function sendWhatsAppInquiry(modelName = "SPEED LIFT 250") {
  let text = `Hi, I am interested in ${modelName}. Please share the equipment specifications, delivery estimate and site photos.`;
  const url = `https://wa.me/${CONFIG.PRIMARY_WHATSAPP}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

/* --------------------------------------------------------------------------
   5. THREE.JS 3D MACHINE PRESENTATION
   Represents the physical Paradise Steel SPEED LIFT machine:
   - Yellow A-frame/tripod base
   - Heavy-duty yellow vertical mast & forward boom jib
   - Green rear-mounted motor gearbox with brake & wire winch drum
   - Top guide pulley wheel & hoisting cable
   - High-tensile steel material carrier bucket
   - Interactive orbit, model toggle (250 vs 500), and component highlights
   -------------------------------------------------------------------------- */
let machine3D = {
  scene: null,
  camera: null,
  renderer: null,
  machineGroup: null,
  model150Group: null,
  model250Group: null,
  model500Group: null,
  isRotating: true,
  currentModel: '250',
  isDragging: false,
  inViewport: true,
  previousMousePosition: { x: 0, y: 0 }
};

function init3DMachine() {
  const canvas = document.getElementById('machine3dCanvas');
  const container = document.getElementById('machine3dContainer');
  if (!canvas || !container || typeof THREE === 'undefined') return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    machine3D.isRotating = false;
  }

  try {
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene setup
    const scene = new THREE.Scene();
    machine3D.scene = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(4.5, 3.2, 5.8);
    camera.lookAt(0, 1.3, 0);
    machine3D.camera = camera;

    // WebGL Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    machine3D.renderer = renderer;

    // Lighting (Industrial engineering studio lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
    mainLight.position.set(6, 10, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.45);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const groundLight = new THREE.DirectionalLight(0xffedd5, 0.25);
    groundLight.position.set(0, -4, 0);
    scene.add(groundLight);

    // Build Machine Assemblies
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    machine3D.machineGroup = rootGroup;

    // Create Models for all 3 official capacities
    machine3D.model150Group = buildSpeedLiftModel('150');
    machine3D.model250Group = buildSpeedLiftModel('250');
    machine3D.model500Group = buildSpeedLiftModel('500');

    machine3D.model150Group.visible = false;
    machine3D.model250Group.visible = true;
    machine3D.model500Group.visible = false;

    rootGroup.add(machine3D.model150Group);
    rootGroup.add(machine3D.model250Group);
    rootGroup.add(machine3D.model500Group);

    // Ground platform grid
    const gridHelper = new THREE.GridHelper(10, 20, 0xd1d5db, 0xe5e7eb);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Interactive Drag Orbit & Wheel Zoom
    setupCanvasControls(container);

    // IntersectionObserver to suspend WebGL rendering when off-screen (Battery & CPU conservation)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          machine3D.inViewport = entry.isIntersecting;
        });
      }, { threshold: 0.1 });
      observer.observe(container);
    }

    // Render loop
    function animate() {
      requestAnimationFrame(animate);

      if (machine3D.inViewport) {
        if (machine3D.isRotating && !machine3D.isDragging) {
          rootGroup.rotation.y += 0.005;
        }
        renderer.render(scene, camera);
      }
    }
    requestAnimationFrame(animate);

    // Responsive Resize Handler
    window.addEventListener('resize', () => {
      if (!container || !machine3D.renderer || !machine3D.camera) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      machine3D.camera.aspect = newWidth / newHeight;
      machine3D.camera.updateProjectionMatrix();
      machine3D.renderer.setSize(newWidth, newHeight);
    });

  } catch (e) {
    console.warn("WebGL 3D Machine initialization error or not supported:", e);
    const fallback = document.getElementById('machine3dFallback');
    if (fallback) fallback.style.display = 'block';
    if (canvas) canvas.style.display = 'none';
  }
}

/**
 * Setup canvas mouse & touch drag orbit and clamped zoom
 */
function setupCanvasControls(container) {
  let isPointerDown = false;
  let startX = 0;
  let startY = 0;
  let initialPinchDistance = null;

  container.addEventListener('pointerdown', (e) => {
    isPointerDown = true;
    machine3D.isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    container.style.cursor = 'grabbing';
  });

  window.addEventListener('pointermove', (e) => {
    if (!isPointerDown || !machine3D.machineGroup) return;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    machine3D.machineGroup.rotation.y += deltaX * 0.008;

    if (machine3D.camera) {
      machine3D.camera.position.y = Math.max(1.0, Math.min(6.5, machine3D.camera.position.y - deltaY * 0.006));
      machine3D.camera.lookAt(0, 1.3, 0);
    }

    startX = e.clientX;
    startY = e.clientY;
  });

  window.addEventListener('pointerup', () => {
    isPointerDown = false;
    machine3D.isDragging = false;
    container.style.cursor = 'grab';
  });

  // Clamped Wheel Zoom (Distance min: 3.5, max: 9.5)
  container.addEventListener('wheel', (e) => {
    if (!machine3D.camera) return;
    e.preventDefault();

    const zoomSpeed = 0.0025;
    const factor = 1 + e.deltaY * zoomSpeed;
    const targetPos = machine3D.camera.position.clone().multiplyScalar(factor);
    const dist = targetPos.length();

    if (dist >= 3.5 && dist <= 9.5) {
      machine3D.camera.position.copy(targetPos);
      machine3D.camera.lookAt(0, 1.3, 0);
    }
  }, { passive: false });

  // Touch Pinch Zoom Support
  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && machine3D.camera) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);

      if (initialPinchDistance) {
        const pinchDelta = initialPinchDistance - currentDist;
        const factor = 1 + pinchDelta * 0.004;
        const targetPos = machine3D.camera.position.clone().multiplyScalar(factor);
        const dist = targetPos.length();

        if (dist >= 3.5 && dist <= 9.5) {
          machine3D.camera.position.copy(targetPos);
          machine3D.camera.lookAt(0, 1.3, 0);
        }
      }
      initialPinchDistance = currentDist;
    }
  }, { passive: false });

  container.addEventListener('touchend', () => {
    initialPinchDistance = null;
  });
}

/**
 * Switch 3D Model between SPEED LIFT 150, 250 and 500
 */
function switch3DModel(modelKey) {
  if (!machine3D.model250Group) return;

  const btn150 = document.getElementById('btnModel150');
  const btn250 = document.getElementById('btnModel250');
  const btn500 = document.getElementById('btnModel500');

  const tag150 = document.getElementById('modelTag150');
  const tag250 = document.getElementById('modelTag250');
  const tag500 = document.getElementById('modelTag500');

  // Deactivate all buttons
  [btn150, btn250, btn500].forEach(btn => { if (btn) btn.classList.remove('active'); });
  [tag150, tag250, tag500].forEach(tag => { if (tag) tag.style.display = 'none'; });

  // Hide all model groups
  if (machine3D.model150Group) machine3D.model150Group.visible = false;
  if (machine3D.model250Group) machine3D.model250Group.visible = false;
  if (machine3D.model500Group) machine3D.model500Group.visible = false;

  if (modelKey === '150' && machine3D.model150Group) {
    machine3D.model150Group.visible = true;
    machine3D.currentModel = '150';
    if (btn150) btn150.classList.add('active');
    if (tag150) tag150.style.display = 'inline-block';
  } else if (modelKey === '500' && machine3D.model500Group) {
    machine3D.model500Group.visible = true;
    machine3D.currentModel = '500';
    if (btn500) btn500.classList.add('active');
    if (tag500) tag500.style.display = 'inline-block';
  } else {
    if (machine3D.model250Group) machine3D.model250Group.visible = true;
    machine3D.currentModel = '250';
    if (btn250) btn250.classList.add('active');
    if (tag250) tag250.style.display = 'inline-block';
  }
}

/**
 * Toggle auto rotation of 3D Machine
 */
function toggle3DRotation() {
  machine3D.isRotating = !machine3D.isRotating;
  const rotBtn = document.getElementById('btn3DRotate');
  if (rotBtn) {
    rotBtn.innerHTML = machine3D.isRotating
      ? '<i class="fa-solid fa-pause"></i> Pause'
      : '<i class="fa-solid fa-play"></i> Auto-Rotate';
  }
}

/**
 * Reset 3D Camera View
 */
function reset3DView() {
  if (!machine3D.machineGroup || !machine3D.camera) return;
  machine3D.machineGroup.rotation.y = 0;
  machine3D.camera.position.set(4.5, 3.2, 5.8);
  machine3D.camera.lookAt(0, 1.3, 0);
}

/**
 * Builds the procedural 3D model representing the SPEED LIFT
 * @param {string|boolean} variant - '150', '250', '500' (or legacy boolean isHeavyDuty)
 */
function buildSpeedLiftModel(variant = '250') {
  const group = new THREE.Group();

  // Normalize variant
  let isHeavyDuty = variant === '500' || variant === true;
  let isCompact = variant === '150';

  // Materials based on authentic Paradise Steel machinery
  const yellowPaint = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Industrial yellow
    roughness: 0.35,
    metalness: 0.25
  });

  const greenMotorPaint = new THREE.MeshStandardMaterial({
    color: 0x047857, // Industrial dark green gearbox housing
    roughness: 0.4,
    metalness: 0.4
  });

  const darkSteel = new THREE.MeshStandardMaterial({
    color: 0x1f2937, // Heavy structural steel
    roughness: 0.5,
    metalness: 0.7
  });

  const wireSilver = new THREE.MeshStandardMaterial({
    color: 0x9ca3af, // Steel wire rope
    roughness: 0.2,
    metalness: 0.9
  });

  const orangeAccent = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.3,
    metalness: 0.3
  });

  const scaleMultiplier = isHeavyDuty ? 1.15 : (isCompact ? 0.85 : 1.0);
  const mastThickness = isHeavyDuty ? 0.16 : (isCompact ? 0.10 : 0.12);

  // 1. BASE FRAME: Triangular / A-Frame outrigger base with mounting plates
  const baseGroup = new THREE.Group();

  // Longitudinal channel beams
  const baseGeom = new THREE.BoxGeometry(0.12, 0.08, 2.6 * scaleMultiplier);
  const baseLeft = new THREE.Mesh(baseGeom, darkSteel);
  baseLeft.position.set(-0.65 * scaleMultiplier, 0.04, 0);
  baseLeft.castShadow = true;
  baseGroup.add(baseLeft);

  const baseRight = new THREE.Mesh(baseGeom, darkSteel);
  baseRight.position.set(0.65 * scaleMultiplier, 0.04, 0);
  baseRight.castShadow = true;
  baseGroup.add(baseRight);

  // Cross members
  const crossGeom = new THREE.BoxGeometry(1.4 * scaleMultiplier, 0.08, 0.12);
  const crossFront = new THREE.Mesh(crossGeom, darkSteel);
  crossFront.position.set(0, 0.04, 1.1 * scaleMultiplier);
  baseGroup.add(crossFront);

  const crossBack = new THREE.Mesh(crossGeom, darkSteel);
  crossBack.position.set(0, 0.04, -1.1 * scaleMultiplier);
  baseGroup.add(crossBack);

  const crossMid = new THREE.Mesh(crossGeom, darkSteel);
  crossMid.position.set(0, 0.04, 0);
  baseGroup.add(crossMid);

  // Leveling foot pads (4 corners)
  const padGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.05, 16);
  const padPositions = [
    [-0.65 * scaleMultiplier, 0.025, 1.2 * scaleMultiplier],
    [0.65 * scaleMultiplier, 0.025, 1.2 * scaleMultiplier],
    [-0.65 * scaleMultiplier, 0.025, -1.2 * scaleMultiplier],
    [0.65 * scaleMultiplier, 0.025, -1.2 * scaleMultiplier]
  ];
  padPositions.forEach(pos => {
    const pad = new THREE.Mesh(padGeom, darkSteel);
    pad.position.set(...pos);
    baseGroup.add(pad);
  });

  group.add(baseGroup);

  // 2. VERTICAL TOWER / MAST: Dual yellow box truss columns
  const mastHeight = (isHeavyDuty ? 3.4 : 3.0);
  const mastGeom = new THREE.BoxGeometry(mastThickness, mastHeight, mastThickness);

  const mastLeft = new THREE.Mesh(mastGeom, yellowPaint);
  mastLeft.position.set(-0.35 * scaleMultiplier, mastHeight / 2, 0.2);
  mastLeft.castShadow = true;
  group.add(mastLeft);

  const mastRight = new THREE.Mesh(mastGeom, yellowPaint);
  mastRight.position.set(0.35 * scaleMultiplier, mastHeight / 2, 0.2);
  mastRight.castShadow = true;
  group.add(mastRight);

  // Diagonal structural lacing braces on mast
  const braceSteps = isHeavyDuty ? 7 : 6;
  const braceGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.85 * scaleMultiplier, 8);
  for (let i = 0; i < braceSteps; i++) {
    const yPos = 0.4 + i * (mastHeight / braceSteps);
    const brace = new THREE.Mesh(braceGeom, yellowPaint);
    brace.position.set(0, yPos, 0.2);
    brace.rotation.z = (i % 2 === 0 ? 0.75 : -0.75);
    group.add(brace);
  }

  // Rear diagonal mast support struts connecting to rear base
  const strutGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.8 * scaleMultiplier, 12);
  const strutLeft = new THREE.Mesh(strutGeom, yellowPaint);
  strutLeft.position.set(-0.35 * scaleMultiplier, 1.3, -0.4 * scaleMultiplier);
  strutLeft.rotation.x = -0.58;
  group.add(strutLeft);

  const strutRight = new THREE.Mesh(strutGeom, yellowPaint);
  strutRight.position.set(0.35 * scaleMultiplier, 1.3, -0.4 * scaleMultiplier);
  strutRight.rotation.x = -0.58;
  group.add(strutRight);

  // 3. JIB / BOOM ARM: Forward projection beam with head pulley
  const jibLength = 1.8 * scaleMultiplier;
  const jibGeom = new THREE.BoxGeometry(mastThickness * 0.9, 0.14, jibLength);
  const jib = new THREE.Mesh(jibGeom, yellowPaint);
  jib.position.set(0, mastHeight - 0.05, 0.2 + jibLength / 2 - 0.2);
  jib.rotation.x = 0.08; // slight upward industrial angle
  jib.castShadow = true;
  group.add(jib);

  // Top tie-rod support backstay
  const tieRodGeom = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
  const tieRod = new THREE.Mesh(tieRodGeom, darkSteel);
  tieRod.position.set(0, mastHeight + 0.2, 0.6);
  tieRod.rotation.x = -0.5;
  group.add(tieRod);

  // Tip Pulley Wheel (Cast iron sheave)
  const pulleyGeom = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 24);
  pulleyGeom.rotateZ(Math.PI / 2);
  const tipPulley = new THREE.Mesh(pulleyGeom, darkSteel);
  const pulleyTipZ = 0.2 + jibLength - 0.2;
  tipPulley.position.set(0, mastHeight + 0.05, pulleyTipZ);
  group.add(tipPulley);

  // 4. POWER UNIT: Heavy Duty Electric Motor & Magnetic Brake Gearbox
  // Located at rear frame on base, green housing with silver motor fins
  const motorGroup = new THREE.Group();
  motorGroup.position.set(0, 0.5, -0.7 * scaleMultiplier);

  // Green Main Gearbox Housing
  const gearGeom = new THREE.BoxGeometry(0.7 * scaleMultiplier, 0.5 * scaleMultiplier, 0.55 * scaleMultiplier);
  const gearBox = new THREE.Mesh(gearGeom, greenMotorPaint);
  gearBox.castShadow = true;
  motorGroup.add(gearBox);

  // Electric Motor Cylindrical Body
  const motorBodyGeom = new THREE.CylinderGeometry(0.18 * scaleMultiplier, 0.18 * scaleMultiplier, 0.55 * scaleMultiplier, 20);
  motorBodyGeom.rotateZ(Math.PI / 2);
  const motorBody = new THREE.Mesh(motorBodyGeom, darkSteel);
  motorBody.position.set(0.45 * scaleMultiplier, 0, 0);
  motorGroup.add(motorBody);

  // Magnetic Brake Safety Disc Housing
  const brakeGeom = new THREE.CylinderGeometry(0.22 * scaleMultiplier, 0.22 * scaleMultiplier, 0.12 * scaleMultiplier, 20);
  brakeGeom.rotateZ(Math.PI / 2);
  const brakeHousing = new THREE.Mesh(brakeGeom, orangeAccent);
  brakeHousing.position.set(0.75 * scaleMultiplier, 0, 0);
  motorGroup.add(brakeHousing);

  // Winch Rope Drum
  const drumGeom = new THREE.CylinderGeometry(0.19 * scaleMultiplier, 0.19 * scaleMultiplier, 0.45 * scaleMultiplier, 20);
  drumGeom.rotateZ(Math.PI / 2);
  const drum = new THREE.Mesh(drumGeom, darkSteel);
  drum.position.set(-0.45 * scaleMultiplier, 0.08, 0);
  motorGroup.add(drum);

  // Steel wire wrapped on drum
  const wireSpoolGeom = new THREE.CylinderGeometry(0.17 * scaleMultiplier, 0.17 * scaleMultiplier, 0.4 * scaleMultiplier, 20);
  wireSpoolGeom.rotateZ(Math.PI / 2);
  const wireSpool = new THREE.Mesh(wireSpoolGeom, wireSilver);
  wireSpool.position.set(-0.45 * scaleMultiplier, 0.08, 0);
  motorGroup.add(wireSpool);

  // Electrical Control Switch Box
  const switchBoxGeom = new THREE.BoxGeometry(0.22, 0.32, 0.16);
  const switchBox = new THREE.Mesh(switchBoxGeom, yellowPaint);
  switchBox.position.set(0, 0.4 * scaleMultiplier, 0.2);
  motorGroup.add(switchBox);

  group.add(motorGroup);

  // 5. STEEL WIRE HOIST ROPE
  // Running from drum up to head pulley and dropping down
  const wireMat = new THREE.LineBasicMaterial({ color: 0x9ca3af, linewidth: 2 });
  const wirePoints = [
    new THREE.Vector3(-0.45 * scaleMultiplier, 0.6, -0.7 * scaleMultiplier), // Drum
    new THREE.Vector3(0, mastHeight, 0.2),                                  // Mast top guide
    new THREE.Vector3(0, mastHeight + 0.05, pulleyTipZ),                    // Tip Pulley
    new THREE.Vector3(0, 1.4, pulleyTipZ)                                   // Hook / Bucket
  ];
  const wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
  const wireLine = new THREE.Line(wireGeom, wireMat);
  group.add(wireLine);

  // 6. MATERIAL BUCKET / CARRIER
  // Authentic construction material bucket hanging from pulley
  const bucketGroup = new THREE.Group();
  bucketGroup.position.set(0, 0.7, pulleyTipZ);

  // Hook & Shackle
  const hookGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8);
  const hook = new THREE.Mesh(hookGeom, darkSteel);
  hook.position.set(0, 0.7, 0);
  bucketGroup.add(hook);

  // Bucket bail handle
  const bailGeom = new THREE.TorusGeometry(0.4 * scaleMultiplier, 0.025, 8, 24, Math.PI);
  const bail = new THREE.Mesh(bailGeom, darkSteel);
  bail.position.set(0, 0.4, 0);
  bail.rotation.x = Math.PI;
  bucketGroup.add(bail);

  // Bucket Body (Steel hopper)
  const bucketWidth = isHeavyDuty ? 0.8 : 0.65;
  const bucketDepth = isHeavyDuty ? 0.8 : 0.65;
  const bucketHeight = isHeavyDuty ? 0.65 : 0.55;

  const bucketGeom = new THREE.BoxGeometry(bucketWidth, bucketHeight, bucketDepth);
  const bucketMesh = new THREE.Mesh(bucketGeom, yellowPaint);
  bucketMesh.position.set(0, 0.1, 0);
  bucketMesh.castShadow = true;
  bucketGroup.add(bucketMesh);

  // Bucket rim band
  const rimGeom = new THREE.BoxGeometry(bucketWidth + 0.04, 0.06, bucketDepth + 0.04);
  const rimMesh = new THREE.Mesh(rimGeom, darkSteel);
  rimMesh.position.set(0, 0.38, 0);
  bucketGroup.add(rimMesh);

  // Brand Badge on Bucket
  const badgeGeom = new THREE.PlaneGeometry(0.35, 0.12);
  const badgeMat = new THREE.MeshBasicMaterial({ color: 0x111827, side: THREE.DoubleSide });
  const badge = new THREE.Mesh(badgeGeom, badgeMat);
  badge.position.set(0, 0.1, bucketDepth / 2 + 0.005);
  bucketGroup.add(badge);

  group.add(bucketGroup);

  return group;
}


/* --------------------------------------------------------------------------
   6. ROI & LABOR SAVINGS CALCULATOR
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

    if (laborersVal) laborersVal.textContent = laborers;
    if (dailyWageVal) dailyWageVal.textContent = `₹${wage}`;
    if (workingDaysVal) workingDaysVal.textContent = `${days} Days`;

    const dailySavings = laborers * wage;
    const monthlySavings = dailySavings * days;
    const annualSavings = monthlySavings * 12;

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

  calculate();
}

/* --------------------------------------------------------------------------
   7. BACK TO TOP
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

/* --------------------------------------------------------------------------
   8. SERVICE WORKER REGISTRATION (OFFLINE READINESS)
   -------------------------------------------------------------------------- */
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.log('SW registration note:', err);
    });
  });
}

