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

