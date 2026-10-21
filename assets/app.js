import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzoRt7XmRIi42tHHKzdL5XdwjBGFSxF7o",
  authDomain: "mylocation-web.firebaseapp.com",
  projectId: "mylocation-web",
  storageBucket: "mylocation-web.firebasestorage.app",
  messagingSenderId: "913735299256",
  appId: "1:913735299256:web:b1a0c1c628adb0f27a844d"
};

const DEFAULT_NAME = "محمد حيدر بركات";
const DOC_PATH = ["profile", "mohamed-heidar"];

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const profileRef = doc(db, ...DOC_PATH);
const cvRef = doc(db, "cv", "mohamed-heidar");

const nameEl = document.getElementById("displayName");
const statusEl = document.getElementById("statusText");
const connBadge = document.getElementById("connBadge");
const timeEl = document.getElementById("timeText");
const inputEl = document.getElementById("nameInput");
const saveBtn = document.getElementById("saveBtn");
const reloadBtn = document.getElementById("reloadBtn");
const formEl = document.getElementById("nameForm");

function setStatus(text, cls = "") {
  statusEl.textContent = text;
  statusEl.className = "sub " + cls;
}

function setBadge(text, cls = "") {
  connBadge.textContent = text;
  connBadge.className = "badge " + cls;
}

function renderName(name) {
  nameEl.textContent = "";
  const span = document.createElement("span");
  span.textContent = name;
  nameEl.appendChild(span);
}

function formatTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return "آخر تحديث: " + d.toLocaleString("ar-EG", { hour12: false });
}

async function saveName(name, { silent = false } = {}) {
  const value = (name || "").trim() || DEFAULT_NAME;
  await setDoc(profileRef, { name: value, updatedAt: serverTimestamp() }, { merge: true });
  if (!silent) {
    renderName(value);
    setStatus("تم حفظ الاسم في قاعدة البيانات السحابية بنجاح.", "ok");
  }
  return value;
}

async function loadName() {
  setStatus("جارٍ الاتصال بقاعدة البيانات السحابية…");
  setBadge("… جارٍ الاتصال");
  try {
    const snap = await getDoc(profileRef);

    if (!snap.exists()) {
      // أول زيارة: نخزّن الاسم الافتراضي في القاعدة
      await setDoc(profileRef, { name: DEFAULT_NAME, updatedAt: serverTimestamp() }, { merge: true });
      renderName(DEFAULT_NAME);
      setStatus("تم إنشاء السجل في Firestore وعرض الاسم.", "ok");
    } else {
      const data = snap.data();
      renderName(data.name || DEFAULT_NAME);
      setStatus("تم قراءة الاسم من قاعدة بيانات Firebase Firestore.", "ok");
      timeEl.textContent = formatTime(data.updatedAt);
    }
    setBadge("متصل بـ Firestore", "ok");
    if (inputEl.value === "") inputEl.value = DEFAULT_NAME;
  } catch (err) {
    console.error(err);
    renderName(DEFAULT_NAME);
    setStatus("تعذّر الوصول إلى القاعدة: " + err.message, "err");
    setBadge("غير متصل", "err");
  }
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  saveBtn.disabled = true;
  try {
    await saveName(inputEl.value);
  } catch (err) {
    console.error(err);
    setStatus("خطأ أثناء الحفظ: " + err.message, "err");
  } finally {
    saveBtn.disabled = false;
  }
});

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  try {
    await saveName(DEFAULT_NAME);
    inputEl.value = DEFAULT_NAME;
  } catch (err) {
    console.error(err);
    setStatus("خطأ أثناء الحفظ: " + err.message, "err");
  } finally {
    saveBtn.disabled = false;
  }
});

reloadBtn.addEventListener("click", loadName);

/* ===================== السيرة الذاتية ===================== */

const $ = (id) => document.getElementById(id);

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function fillList(target, items, renderItem) {
  target.textContent = "";
  (items || []).forEach((item) => target.appendChild(renderItem(item)));
}

function renderCv(cv) {
  $("cvFullName").textContent = cv.fullName || "";
  $("cvTitle").textContent = cv.title || "";
  $("cvTagline").textContent = cv.tagline || "";
  $("cvSummary").textContent = cv.summary || "";

  const contact = $("cvContact");
  contact.textContent = "";
  (cv.emails || []).forEach((m) => {
    const li = el("li");
    li.appendChild(el("span", "ci", "✉"));
    li.appendChild(el("a", null, m)).href = "mailto:" + m;
    contact.appendChild(li);
  });
  (cv.phones || []).forEach((p) => {
    const li = el("li");
    li.appendChild(el("span", "ci", "☎"));
    li.appendChild(el("a", null, p)).href = "tel:" + p;
    contact.appendChild(li);
  });
  if (cv.location) {
    const li = el("li");
    li.appendChild(el("span", "ci", "⌖"));
    li.appendChild(el("span", null, cv.location));
    contact.appendChild(li);
  }

  fillList($("cvEducation"), cv.education, (e) => {
    const li = el("li", "cv-item");
    li.appendChild(el("strong", null, e.degree));
    li.appendChild(el("span", "cv-sub", e.institution));
    li.appendChild(el("span", "cv-date", e.from + " — " + e.to));
    return li;
  });

  fillList($("cvSkills"), cv.skills, (s) => {
    const li = el("li", "cv-item");
    li.appendChild(el("strong", null, s.title));
    li.appendChild(el("span", "cv-sub", s.detail));
    return li;
  });

  fillList($("cvSystems"), cv.systems, (s) => {
    const li = el("li", null, s);
    return li;
  });

  fillList($("cvExperience"), cv.experience, (x) => {
    const li = el("li", "cv-exp-item");
    const head = el("div", "cv-exp-head");
    head.appendChild(el("strong", null, x.role));
    head.appendChild(el("span", "cv-date", x.period));
    li.appendChild(head);
    li.appendChild(el("span", "cv-sub", x.org));
    if (x.detail) li.appendChild(el("span", "cv-detail", x.detail));
    return li;
  });

  fillList($("cvGoals"), cv.goals, (g) => {
    const li = el("li", "cv-item");
    li.appendChild(el("span", null, g));
    return li;
  });

  $("cvWrap").hidden = false;
}

async function loadCv() {
  const status = $("cvStatus");
  try {
    const snap = await getDoc(cvRef);
    if (!snap.exists()) {
      status.textContent = "لا يوجد مستند سيرة ذاتية في القاعدة بعد.";
      status.className = "section-lead err";
      return;
    }
    renderCv(snap.data());
    status.textContent = "السيرة الذاتية محمّلة من قاعدة بيانات Firebase Firestore.";
    status.className = "section-lead ok";
  } catch (err) {
    console.error(err);
    status.textContent = "تعذّر تحميل السيرة الذاتية: " + err.message;
    status.className = "section-lead err";
  }
}

loadName();
loadCv();
