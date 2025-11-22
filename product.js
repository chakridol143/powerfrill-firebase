// =============== Firebase Init ===============
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0tAtX5QR0vJ9RxQ9qUeuq8n_-d1LkCX0",
  authDomain: "powerfrill-demo.firebaseapp.com",
  projectId: "powerfrill-demo",
  storageBucket: "powerfrill-demo.firebasestorage.app",
  messagingSenderId: "884336461189",
  appId: "1:884336461189:web:32342da646d7ac052c30ec",
  measurementId: "G-E55JS1FT6Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ADMIN_PASS = "admin123";
const ref = doc(db, "websiteContent", "content");

let contentData = null;
let isEditMode = false;

function setByPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
}

function getByPath(obj, path) {
  const parts = path.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    cur = cur?.[parts[i]];
    if (cur === undefined || cur === null) return "";
  }
  return cur;
}

async function loadContent() {
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.error("No websiteContent/content document found in Firestore.");
      return;
    }

    const raw = snap.data().data; // string
    contentData = JSON.parse(raw);

    console.log("Loaded contentData:", contentData);
  } catch (err) {
    console.error("Error loading Firestore data:", err);
  }
}

function renderContent() {
  if (!contentData) return;

  // Logo
  const logoEl = document.getElementById("site-logo");
  if (logoEl) {
    logoEl.src = contentData.header?.logo || "";
    logoEl.alt = contentData.header?.title || "Logo";
  }

  // Title & Subtitle (HTML currently uses data-key)
  const titleEl = document.querySelector("[data-key='productsSection.title']");
  if (titleEl) {
    titleEl.textContent = getByPath(contentData, "productsSection.title");
    titleEl.dataset.path = "productsSection.title";
  }

  const subtitleEl = document.querySelector("[data-key='productsSection.subtitle']");
  if (subtitleEl) {
    subtitleEl.textContent = getByPath(contentData, "productsSection.subtitle");
    subtitleEl.dataset.path = "productsSection.subtitle";
  }

  // Products
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  grid.innerHTML = "";

  const products = contentData.productsSection?.products || [];

  products.forEach((p, index) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const imagePath = `productsSection.products.${index}.image`;
    const titlePath = `productsSection.products.${index}.title`;
    const descPath  = `productsSection.products.${index}.description`;

    card.innerHTML = `
      <div class="product-image-container">
        <img 
          src="${p.image || ""}" 
          alt="${p.title || ""}" 
          class="product-image" 
          data-editable 
          data-path="${imagePath}" 
          data-key="${imagePath}"
        />
      </div>
      <div class="product-content">
        <h3 
          class="product-title" 
          data-editable 
          data-path="${titlePath}" 
          data-key="${titlePath}"
        >${p.title || ""}</h3>

        <p 
          class="product-description" 
          data-editable 
          data-path="${descPath}" 
          data-key="${descPath}"
        >${p.description || ""}</p>

        <a href="${p.link || "#"}" class="product-button" target="_blank">
          Learn More
        </a>
      </div>
    `;

    grid.appendChild(card);
  });
}

function enableEditing(state) {
  isEditMode = state;

  document.querySelectorAll("[data-editable]").forEach((el) => {
    if (state) {
      if (el.tagName.toLowerCase() !== "img") {
        el.setAttribute("contenteditable", "true");
        el.addEventListener("blur", handleLocalEdit);
      } else {
        el.addEventListener("dblclick", handleImageChange);
      }
      el.classList.add("editable-highlight");
    } else {
      el.removeAttribute("contenteditable");
      el.classList.remove("editable-highlight");
      el.removeEventListener("blur", handleLocalEdit);
      if (el.tagName.toLowerCase() === "img") {
        el.removeEventListener("dblclick", handleImageChange);
      }
    }
  });
}

function handleLocalEdit(e) {
  const el = e.target;
  const path = el.dataset.path || el.dataset.key;
  if (!path || !contentData) return;

  const newVal = el.innerText.trim();
  setByPath(contentData, path, newVal);
}

function handleImageChange(e) {
  const el = e.target;
  const path = el.dataset.path || el.dataset.key;
  if (!path || !contentData) return;

  const current = getByPath(contentData, path);
  const newUrl = prompt("Enter new image URL:", current || el.src || "");
  if (newUrl !== null && newUrl.trim() !== "") {
    el.src = newUrl.trim();
    setByPath(contentData, path, newUrl.trim());
  }
}

async function saveToFirestore() {
  if (!contentData) {
    alert("Nothing to save – content not loaded.");
    return;
  }

  try {
    await setDoc(ref, { data: JSON.stringify(contentData) });
    alert("Firebase updated successfully");
  } catch (err) {
    console.error("Error saving to Firestore:", err);
    alert("Save failed. Check console.");
  }
}

function setupAdminControls() {
  const adminBar   = document.getElementById("admin-bar");
  const adminLogin = document.getElementById("admin-login");
  const adminLink  = document.getElementById("adcp");

  const loginBtn   = document.getElementById("admin-login-btn");
  const cancelBtn  = document.getElementById("admin-cancel-btn");
  const toggleBtn  = document.getElementById("toggle-edit");
  const saveBtn    = document.getElementById("save-content");
  const logoutBtn  = document.getElementById("logout-admin");

  if (!adminBar || !adminLogin || !adminLink) {
    console.warn("Admin UI elements not found. Skipping admin setup.");
    return;
  }

  adminLink.addEventListener("dblclick", () => {
    adminLogin.style.display = "flex";
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      adminLogin.style.display = "none";
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const passInput = document.getElementById("admin-password");
      const val = passInput?.value.trim() || "";

      if (val === ADMIN_PASS) {
        adminLogin.style.display = "none";
        adminBar.style.display = "flex";
      } else {
        alert("Wrong password ❌");
      }
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      isEditMode = !isEditMode;
      toggleBtn.textContent = isEditMode ? "Exit Edit Mode" : "Enter Edit Mode";
      enableEditing(isEditMode);
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", saveToFirestore);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      adminBar.style.display = "none";
      enableEditing(false);
      isEditMode = false;
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadContent();
  renderContent();
  setupAdminControls();
});
