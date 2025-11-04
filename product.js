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

// ===== GLOBALS =====
const ADMIN_PASS = "admin123";
const ref = doc(db, "websiteContent", "content");

let contentData = null;
let isEditMode = false;

// ===== INIT =====
document.addEventListener("DOMContentLoaded", async () => {
  await loadContent();
  renderContent();
  setupAdminControls();
});

async function loadContent() {
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const dataField = snap.data().data;
      contentData = typeof dataField === "string" ? JSON.parse(dataField) : dataField;
      console.log("Loaded content:", contentData);
    } else {
      console.error("No document found in Firestore!");
    }
  } catch (e) {
    console.error("Error loading content:", e);
  }
}

// ===== RENDER =====
function renderContent() {
  if (!contentData) return;

  document.getElementById("site-logo").src = contentData.header.logo || "";
  document.querySelector("[data-key='productsSection.title']").textContent = contentData.productsSection.title || "";
  document.querySelector("[data-key='productsSection.subtitle']").textContent = contentData.productsSection.subtitle || "";

  const grid = document.getElementById("products-grid");
  grid.innerHTML = "";

  contentData.productsSection.products.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${p.image}" alt="${p.title}" class="product-image" data-path="productsSection.products.${i}.image" data-editable>
      </div>
      <div class="product-content">
        <h3 class="product-title" data-path="productsSection.products.${i}.title" data-editable>${p.title}</h3>
        <p class="product-description" data-path="productsSection.products.${i}.description" data-editable>${p.description}</p>
        <a href="${p.link}" class="product-button" target="_blank">Learn More</a>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ===== EDITING =====
function enableEditing(state) {
  isEditMode = state;
  document.querySelectorAll("[data-editable]").forEach(el => {
    if (state) {
      el.setAttribute("contenteditable", "true");
      el.classList.add("editable-highlight");
      el.addEventListener("blur", saveLocalEdit);
    } else {
      el.removeAttribute("contenteditable");
      el.classList.remove("editable-highlight");
      el.removeEventListener("blur", saveLocalEdit);
    }
  });
}

function saveLocalEdit(e) {
  const el = e.target;
  const path = el.dataset.path;
  const keys = path.split(".");
  let obj = contentData;
  for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
  obj[keys[keys.length - 1]] = el.innerText.trim();
}

// ===== SAVE TO FIRESTORE =====
async function saveToFirestore() {
  try {
    await setDoc(ref, { data: JSON.stringify(contentData) });
    alert("Saved successfully to Firestore!");
  } catch (err) {
    console.error("Error saving:", err);
    alert("Save failed. Check console.");
  }
}

// ===== ADMIN CONTROLS =====
function setupAdminControls() {
  const adminBar = document.getElementById("admin-bar");
  const adminLogin = document.getElementById("admin-login");
  const adminLink = document.getElementById("adcp");

  const loginBtn = document.getElementById("admin-login-btn");
  const cancelBtn = document.getElementById("admin-cancel-btn");
  const toggleBtn = document.getElementById("toggle-edit");
  const saveBtn = document.getElementById("save-content");
  const logoutBtn = document.getElementById("logout-admin");

  adminLink.addEventListener("dblclick", () => adminLogin.style.display = "flex");
  cancelBtn.addEventListener("click", () => adminLogin.style.display = "none");

  loginBtn.addEventListener("click", () => {
    const pass = document.getElementById("admin-password").value.trim();
    if (pass === ADMIN_PASS) {
      adminLogin.style.display = "none";
      adminBar.style.display = "flex";
    } else alert("Wrong password!");
  });

  toggleBtn.addEventListener("click", () => {
    isEditMode = !isEditMode;
    toggleBtn.textContent = isEditMode ? "Exit Edit Mode" : "Enter Edit Mode";
    enableEditing(isEditMode);
  });

  saveBtn.addEventListener("click", saveToFirestore);
  logoutBtn.addEventListener("click", () => {
    adminBar.style.display = "none";
    enableEditing(false);
  });
}
// --- Sidebar menu toggle ---
document.addEventListener("DOMContentLoaded", () => {
  const menuIcon = document.querySelector(".menu-icon");
  const sidebar = document.querySelector(".sidebar");

  if (menuIcon && sidebar) {
    menuIcon.addEventListener("click", () => {
      sidebar.classList.toggle("active");
    });
  }
});
