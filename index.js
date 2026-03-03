// 🔽 auto date to TODAY() for fields📅
document.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  const localISODate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
  document
    .querySelectorAll("#f-date1, #f-date2")
    .forEach((el) => (el.value = localISODate));
});

// document.getElementById('load-btn').addEventListener('click', autoFillFromClipboard);

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('load-btn');
  if (!btn) return; // element not found; safely exit

  btn.addEventListener('click', autoFillFromClipboard);
});


// 🔽 Save to LocalStorage for user name @ p2🤺 
document.addEventListener("DOMContentLoaded", () => {
  const id = "f-staff";
  const key = "persist:" + id; // localStorage key

  const el = document.getElementById(id);
  if (!el) return;

  // Restore saved value if present
  const saved = localStorage.getItem(key);
  if (saved !== null) {
    el.value = saved;
  }

  // Save whenever the user edits
  const save = () => localStorage.setItem(key, el.value);
  el.addEventListener("input", save);
  el.addEventListener("change", save);
});

// 🔽 Normalize AccountContacts__r into an array
function getAccountContactsArray(obj) {
  if (!obj || typeof obj !== 'object') return [];

  let ac = obj.AccountContacts__r;

  // If not at root, scan shallowly for the field
  if (!ac) {
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val && typeof val === 'object' && 'AccountContacts__r' in val) {
        ac = val.AccountContacts__r;
        break;
      }
    }
  }

  // Normalize common Salesforce shapes:
  // 1) AccountContacts__r: [...]
  // 2) AccountContacts__r: { records: [...] }
  if (Array.isArray(ac)) return ac;
  if (ac && typeof ac === 'object' && Array.isArray(ac.records)) return ac.records;

  return [];
}

async function autoFillFromClipboard() {
  const text = await navigator.clipboard.readText(); // requires user gesture
  try {
    const data = JSON.parse(text);
    const contacts = getAccountContactsArray(data);
    console.log(contacts);
    const contactArray = contacts[0].Contact__r; //⬅ this is the obj for filling
    console.log(contactArray);
    const timestamp = contactArray.Birthdate; // milliseconds since Jan 1, 1970
    const date = new Date(timestamp);

    // Convert to a readable format
    const readableDate = date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const fillData = {

      street: contactArray.MailingStreet,
      email: contactArray.Email,
      phone: contactArray.HomePhone,
      fullName: contactArray.Name,
    };


    // Map JSON keys to input IDs
    const idMap = {
      fullName: "fullName",
      street: "f-address",
      email: "f-email",
      phone: "f-phone",
    };

    Object.entries(idMap).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el && fillData[key] != null) {
        el.value = String(fillData[key]);
      }
    });
  } catch (err) {
    // console.error('Failed to read/parse clipboard:', err?.message || err);
    alert("⚠Please COPY OBJECT from avocado first!\n\nDetails:\n" + (err.message || String(err)));
  }
}


// index.js — options modal integration
// Idempotent initializer you can call from anywhere in your app
(function (global) {
  const DEFAULT_CFG = {
    openBtn: '#openOptionsBtn',
    overlay: '#optionsModalOverlay',
    modal: '.modal',
    cancelBtn: '#cancelBtn',
    confirmBtn: '#confirmBtn',
    form: '#optionsForm',
    requiredFields: ['plan', 'billing'] // names in your <select name="...">
  };

  let state = {
    initialized: false,
    cfg: null,
    els: null,
    lastFocusedElement: null,
    // Keep references to handlers so we can remove them
    handlers: {}
  };


  function resetState() {
    state = {
      initialized: false,
      cfg: null,
      els: null,
      lastFocusedElement: null,
      handlers: {}
    };
  }

  function qs(root, sel) {
    const el = root.querySelector(sel);
    if (!el) throw new Error(`[OptionsModal] Missing element for selector: ${sel}`);
    return el;
  }

  function getFocusableElements(overlay) {
    return Array.from(
      overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('disabled'));
  }

  function openModal() {
    const { overlay, modal } = state.els;
    state.lastFocusedElement = document.activeElement;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    const focusable = getFocusableElements(overlay);
    (focusable[0] || modal).focus();

    // listeners added on open, removed on close
    document.addEventListener('keydown', state.handlers.handleKeydown);
    document.addEventListener('focus', state.handlers.trapFocus, true);
  }

  function closeModal() {
    const { overlay } = state.els;

    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    document.removeEventListener('keydown', state.handlers.handleKeydown);
    document.removeEventListener('focus', state.handlers.trapFocus, true);

    if (state.lastFocusedElement) state.lastFocusedElement.focus();
    state.lastFocusedElement = null;
    state.handlers = {};

  }

  function confirmSelection() {
    function getRate(memberType) {
      switch (memberType) {
        case 'Adult (26-64)':
          return 90.20;
        case '+ONE Adult (26-64)':
          return 55.20;
        case 'Senior (65+)':
          return 58.95
        case '+ONE Senior (65+)':
          return 55.20;
        case 'Young Adult (18-25)':
          return 71.25;
        case '+ONE Young Adult (18-25)':
          return 43.55;
        case 'Youth (12-17)':
          return 43.90;
        case '+ONE Youth (12-17)':
          return 11.55;
        case 'Child (10-11)':
          return 38.10;
        case '+ONE Child (10-11)':
          return 9.96;
          case 'Child (0-9)':
          return 35.6;
        case '+ONE Child (2-9)':
          return 6.80;  
        default:
          return ' ';
      }
    }

    function getDayWithSuffix() {
      const day = new Date().getDate();
      const dayStr = day.toString().padStart(2, '0');

      if (day >= 11 && day <= 13) {
        return dayStr + 'th';
      }

      switch (day % 10) {
        case 1: return dayStr + 'st';
        case 2: return dayStr + 'nd';
        case 3: return dayStr + 'rd';
        default: return dayStr + 'th';
      }
    }

    function getPayDate(billing) {
      switch (billing) {
        case 'today':
          return getDayWithSuffix();
        case 'eft4':
          return '04th';
        case 'eft17':
          return '17th'
        default:
          return getDayWithSuffix();
      }
    }

    const { form } = state.els;
    const data = new FormData(form);
    console.log(data)
    const payload = Object.fromEntries(data.entries());

    const missing = state.cfg.requiredFields.filter(k => !payload[k]);
    if (missing.length) {
      // You can swap this for inline validation if you prefer
      alert('Please select: ' + missing.join(', '));
      return;
    }

    // Your integration hook — replace/extend as needed
    // e.g., send to server, update UI state, etc.
    console.log('[OptionsModal] Selected options:', payload);

    // Dispatch a custom event so other parts of your app can react
    const evt = new CustomEvent('options:selected', { detail: payload });
    window.dispatchEvent(evt);

    document.getElementById("f-amount").value = getRate(payload.plan);
    document.getElementById("f-paydate").value = getPayDate(payload.billing);
    closeModal();
  }

  function handleKeydown(e) {
    const { confirmBtn } = state.els;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = getFocusableElements(state.els.overlay);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    if (e.key === 'Enter' && document.activeElement === confirmBtn) {
      e.preventDefault();
      confirmSelection();
    }
  }

  function trapFocus(e) {
    const { overlay, modal } = state.els;
    if (!overlay.classList.contains('open')) return;
    if (!overlay.contains(e.target)) {
      const focusable = getFocusableElements(overlay);
      (focusable[0] || modal).focus();
    }
  }

  function clickOutsideToClose(e) {
    const { overlay } = state.els;
    if (e.target === overlay) closeModal();
  }

  /**
   * Initialize modal behavior.
   * Safe to call multiple times; it will re-bind only if not already initialized.
   * @param {Object} cfg - optional overrides for selectors & required fields
   */
  function init(cfg = {}) {
    if (state.initialized) return; // idempotent guard

    state.cfg = { ...DEFAULT_CFG, ...cfg };

    const overlay = document.querySelector(state.cfg.overlay);
    if (!overlay) {
      console.warn('[OptionsModal] Overlay not found. Skipping init until DOM is ready.');
      // If you load this before DOM is ready, retry after DOMContentLoaded
      document.addEventListener('DOMContentLoaded', () => init(cfg), { once: true });
      return;
    }

    // Resolve elements once
    const els = {
      overlay,
      modal: qs(overlay, state.cfg.modal),
      cancelBtn: document.querySelector(state.cfg.cancelBtn),
      confirmBtn: document.querySelector(state.cfg.confirmBtn),
      openBtn: document.querySelector(state.cfg.openBtn),
      form: document.querySelector(state.cfg.form)
    };

    // Sanity checks
    Object.entries(els).forEach(([k, v]) => {
      if (!v) throw new Error(`[OptionsModal] Missing element: ${k}`);
    });

    state.els = els;

    // Bind handlers with stable references
    state.handlers = {
      handleKeydown,
      trapFocus,
      clickOutsideToClose
    };

    // Wire up events
    els.openBtn.addEventListener('click', openModal);
    els.cancelBtn.addEventListener('click', closeModal);
    els.confirmBtn.addEventListener('click', confirmSelection);
    els.overlay.addEventListener('click', state.handlers.clickOutsideToClose);

    state.initialized = true;
    console.info('[OptionsModal] Initialized.');
  }

  // Auto-init when DOM is ready if elements already present
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(), { once: true });
  } else {
    // DOM already parsed
    try { init(); } catch (e) { /* May run before HTML exists; will retry on DOMContentLoaded above */ }
  }

  // Optional: expose a small API for manual re-init with custom selectors
  global.OptionsModal = {
    init,
    open: () => { if (!state.initialized) init(); openModal(); },
    close: closeModal
  };
})(window);


// ⬇⬇⬇ tie this one below to the auto fill

// Example: update another form on the page when user confirms the modal
window.addEventListener('options:selected', (e) => {
  const { plan, billing, region } = e.detail || {};
  // const { plan, billing, region } = e.detail || {};

  // 1) Get your target form & fields (change selectors to match your DOM)
  const targetForm = document.getElementById('page1'); // or '#profileForm'
  if (!targetForm) {
    console.warn('[OptionsModal] Target form not found');
    return;
  }

  const memType = targetForm.querySelector('input[name="memberTypes"]');
  const billingField = targetForm.querySelector('input[name="billing_cycle"]');
  const priceField = targetForm.querySelector('input[name="payAmount"]');


  //  Assign values into the other form (only if fields exist)
  if (memType) memType.value = plan || '';
  if (billingField) billingField.value = billing || '';

  // if (priceField) priceField.value = String(priceAfterDiscount);
  // if (discountField) discountField.value = String(appliedDiscountPct);

  // if (summaryField) {
  //   summaryField.value =
  //     `Plan: ${capitalize(plan)}\n` +
  //     `Billing: ${capitalize(billing)}\n` +
  //     // `Region: ${region ?? '—'}\n` +
  //     `Price: $${priceAfterDiscount} USD${appliedDiscountPct ? ` (includes ${appliedDiscountPct}% annual discount)` : ''}`;
  // }

  // // 4) (Optional) trigger change/input events so any listeners react
  // [planField, billingField, regionField, priceField, discountField, summaryField]
  //   .filter(Boolean)
  //   .forEach(el => {
  //     el.dispatchEvent(new Event('input', { bubbles: true }));
  //     el.dispatchEvent(new Event('change', { bubbles: true }));
  //   });

  // 5) (Optional) Enable/disable related UI or submit button
  const submitBtn = targetForm.querySelector('[type="submit"]');
  if (submitBtn) submitBtn.disabled = !(plan && billing);
});

// tiny helper
function capitalize(s) {
  return (s || '').charAt(0).toUpperCase() + (s || '').slice(1);
}
