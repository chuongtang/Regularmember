// 🔽 auto date to TODAY() for fields📅
      document.addEventListener("DOMContentLoaded", () => {
        const now = new Date();
        const localISODate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
          .toISOString()
          .split("T")[0];
        document
          .querySelectorAll("#p1_Date, #p2_Date_2, #p2_Date_3, #p1_Start_Date")
          .forEach((el) => (el.value = localISODate));
      });
      // 🔽 auto add 1 year for renwal date📅
      document.addEventListener("DOMContentLoaded", () => {
        const el = document.getElementById("p1_Renewal_Cut-off");
        if (!el) return;

        if (el.value && el.value.trim() !== "") return;

        const now = new Date();
        const localToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(localToday);
        target.setFullYear(target.getFullYear() + 1);
        target.setDate(target.getDate() - 1);

        const formatted = new Intl.DateTimeFormat("en-CA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(target);

        el.value = formatted; // e.g., "2026-12-22" if today is 2025-12-23
      });


      // 🔽 Save to LocalStorage for user name @ p2🤺 
      document.addEventListener("DOMContentLoaded", () => {
        const id = "p2_Staff_First_and_Last_Name";
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
            lastName: contactArray.LastName,
            firstName: contactArray.FirstName,
            street: contactArray.MailingStreet,
            email: contactArray.Email,
            city: contactArray.MailingCity,
            province: contactArray.MailingState,
            phone: contactArray.HomePhone,
            birthdate: readableDate,
            postalCode: contactArray.MailingPostalCode,
            fullName: contactArray.Name,
          };


          // Map JSON keys to input IDs
          const idMap = {
            fullName: "fullName",
            // firstName: "p1_First_Name",
            street: "p1_Street",
            email: "p1_Email",
            city: "p1_City",
            province: "p1_Province",
            phone: "p1_Phone_Home",
            birthdate: "p1_Text1",
            postalCode: "p1_Postal_Code"
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

      document.getElementById('load-btn').addEventListener('click', autoFillFromClipboard);