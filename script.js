// ======================================================
// SiteArmor — frontend logic
// IMPORTANT: set this to your deployed Cloudflare Worker URL
// e.g. "https://sitearmor.YOUR-SUBDOMAIN.workers.dev"
// ======================================================
const WORKER_URL = "https://sitearmor.YOUR-SUBDOMAIN.workers.dev";

// ---------- i18n ----------
const I18N = {
  ar: {
    hero_title: "درع موقعك يبدأ من هنا",
    hero_sub: "افحص رؤوس الحماية الحقيقية لموقعك، وقِس أداءه بأمان — بعد إثبات ملكيتك للنطاق.",
    tab_scanner: "فاحص رؤوس الحماية",
    tab_loadtest: "اختبار الأداء",
    url_label: "رابط الموقع",
    url_placeholder: "https://example.com",
    scan_btn: "فحص",
    scan_generated: "تقرير حقيقي بناءً على استجابة الخادم الفعلية",
    print_btn: "طباعة التقرير",
    verify_explain: "لحماية المواقع من إساءة الاستخدام، لازم تثبت إنك مالك النطاق قبل تشغيل أي اختبار حقيقي.",
    domain_label: "النطاق",
    domain_placeholder: "example.com",
    gen_token_btn: "إنشاء رمز التحقق",
    verify_step1: "١. أنشئ ملفًا في نطاقك على المسار التالي بالضبط:",
    verify_step2: "٢. ضع بداخله هذا الرمز فقط، بدون أي مسافات إضافية:",
    verify_btn: "تحقق من الملكية",
    locked_note: "إثبات ملكية النطاق مطلوب لتفعيل الاختبار",
    target_label: "رابط الاختبار",
    requests_label: "عدد طلبات الاختبار",
    requests_cap_note: "الحد الأقصى 30 طلبًا — أداة قياس أداء آمنة، وليست أداة ضغط أو هجوم.",
    start_test_btn: "بدء الاختبار",
    stat_avg: "متوسط زمن الاستجابة",
    stat_success: "نسبة النجاح",
    stat_status: "حالة الخادم",
    footer_credit: "بواسطة خالد أحمد",
    err_enter_url: "من فضلك أدخل رابطًا صحيحًا",
    err_scan_failed: "تعذّر الوصول إلى الموقع. تأكد من الرابط وحاول مجددًا",
    err_enter_domain: "من فضلك أدخل النطاق أولًا",
    verify_checking: "جارِ التحقق…",
    verify_ok: "تم التحقق من ملكية النطاق ✓",
    verify_fail: "لم يتم العثور على رمز التحقق في الملف. تأكد من رفعه بشكل صحيح.",
    server_up: "يعمل",
    server_down: "متوقف",
    headers: {
      hsts: "HSTS — فرض الاتصال الآمن",
      csp: "CSP — سياسة أمان المحتوى",
      xfo: "X-Frame-Options — الحماية من Clickjacking",
      xcto: "X-Content-Type-Options",
      referrer: "Referrer-Policy",
      permissions: "Permissions-Policy",
    },
    present: "موجود",
    missing: "مفقود",
  },
  en: {
    hero_title: "Your site's shield starts here",
    hero_sub: "Scan your site's real security headers, and safely measure its performance — after verifying you own the domain.",
    tab_scanner: "Security Headers Scanner",
    tab_loadtest: "Load Tester",
    url_label: "Website URL",
    url_placeholder: "https://example.com",
    scan_btn: "Scan",
    scan_generated: "Real report based on the actual server response",
    print_btn: "Print Report",
    verify_explain: "To protect sites from abuse, you must prove domain ownership before running any real test.",
    domain_label: "Domain",
    domain_placeholder: "example.com",
    gen_token_btn: "Generate Verification Token",
    verify_step1: "1. Create a file on your domain at exactly this path:",
    verify_step2: "2. Put only this token inside it, with no extra spaces:",
    verify_btn: "Verify Ownership",
    locked_note: "Domain ownership verification is required to run tests",
    target_label: "Target URL",
    requests_label: "Test Requests",
    requests_cap_note: "Capped at 30 requests — a safe performance-benchmarking tool, not a stress or attack tool.",
    start_test_btn: "Start Test",
    stat_avg: "Avg Response Time",
    stat_success: "Success Rate",
    stat_status: "Server Status",
    footer_credit: "By Khaled Ahmed",
    err_enter_url: "Please enter a valid URL",
    err_scan_failed: "Couldn't reach the site. Check the URL and try again",
    err_enter_domain: "Please enter a domain first",
    verify_checking: "Verifying…",
    verify_ok: "Domain ownership verified ✓",
    verify_fail: "Token not found in the file. Make sure it was uploaded correctly.",
    server_up: "Up",
    server_down: "Down",
    headers: {
      hsts: "HSTS — Enforces secure connections",
      csp: "CSP — Content Security Policy",
      xfo: "X-Frame-Options — Clickjacking protection",
      xcto: "X-Content-Type-Options",
      referrer: "Referrer-Policy",
      permissions: "Permissions-Policy",
    },
    present: "Present",
    missing: "Missing",
  },
};

let state = {
  lang: "ar",
  verifiedDomain: null,
  proof: null,
  lastScan: null,
  lastLoadTest: null,
};

// ---------- language ----------
function applyLanguage() {
  const dict = I18N[state.lang];
  document.body.setAttribute("data-lang", state.lang);
  document.body.setAttribute("dir", state.lang === "ar" ? "rtl" : "ltr");
  document.documentElement.setAttribute("lang", state.lang);
  document.documentElement.setAttribute("dir", state.lang === "ar" ? "rtl" : "ltr");
  document.getElementById("langToggle").textContent = state.lang === "ar" ? "EN" : "AR";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.placeholder = dict[key];
  });
}

document.getElementById("langToggle").addEventListener("click", () => {
  state.lang = state.lang === "ar" ? "en" : "ar";
  applyLanguage();
  if (state.lastScan) renderScanResult(state.lastScan);
  if (state.lastLoadTest) renderLoadResult(state.lastLoadTest);
});

// ---------- tabs ----------
document.querySelectorAll(".segment").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".segment").forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    document.getElementById("panel-" + btn.dataset.tab).classList.add("active");
  });
});

// ---------- Scanner ----------
document.getElementById("scanBtn").addEventListener("click", runScan);
document.getElementById("scanUrl").addEventListener("keydown", (e) => { if (e.key === "Enter") runScan(); });

async function runScan() {
  const dict = I18N[state.lang];
  const input = document.getElementById("scanUrl");
  const errEl = document.getElementById("scanError");
  errEl.classList.add("hidden");

  const target = normalizeUrl(input.value);
  if (!target) {
    errEl.textContent = dict.err_enter_url;
    errEl.classList.remove("hidden");
    return;
  }

  const btn = document.getElementById("scanBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "…";

  try {
    const res = await fetch(`${WORKER_URL}/scan?url=${encodeURIComponent(target)}`);
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "scan_failed");
    state.lastScan = data;
    renderScanResult(data);
  } catch (err) {
    errEl.textContent = dict.err_scan_failed;
    errEl.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function renderScanResult(data) {
  const dict = I18N[state.lang];
  const card = document.getElementById("scanResult");
  card.classList.remove("hidden");

  const badge = document.getElementById("gradeBadge");
  badge.textContent = data.grade;
  badge.className = "grade-badge grade-" + data.grade;

  document.getElementById("scanDomain").textContent = new URL(data.url).hostname;

  const list = document.getElementById("headersList");
  list.innerHTML = "";
  data.results.forEach((r) => {
    const row = document.createElement("div");
    row.className = "header-item";
    const label = document.createElement("span");
    label.textContent = dict.headers[r.id] || r.id;
    const status = document.createElement("span");
    status.className = "header-status " + (r.present ? "present" : "missing");
    status.textContent = r.present ? dict.present : dict.missing;
    row.appendChild(label);
    row.appendChild(status);
    list.appendChild(row);
  });
}

document.getElementById("printScanBtn").addEventListener("click", () => {
  if (!state.lastScan) return;
  buildPrintArea("scan", state.lastScan);
  window.print();
});

// ---------- Domain verification ----------
document.getElementById("genTokenBtn").addEventListener("click", () => {
  const dict = I18N[state.lang];
  const domainInput = document.getElementById("verifyDomain");
  const domain = normalizeDomain(domainInput.value);
  const errBox = document.getElementById("verifyStatus");

  if (!domain) {
    errBox.textContent = dict.err_enter_domain;
    errBox.className = "verify-status fail";
    return;
  }

  const token = generateToken();
  document.getElementById("tokenValue").textContent = token;
  document.getElementById("tokenBox").classList.remove("hidden");
  document.getElementById("verifyStatus").textContent = "";
  document.getElementById("verifyStatus").className = "verify-status";
  document.getElementById("verifyBtn").dataset.token = token;
  document.getElementById("verifyBtn").dataset.domain = domain;
});

document.getElementById("verifyBtn").addEventListener("click", async () => {
  const dict = I18N[state.lang];
  const btn = document.getElementById("verifyBtn");
  const domain = btn.dataset.domain;
  const token = btn.dataset.token;
  const statusEl = document.getElementById("verifyStatus");

  statusEl.textContent = dict.verify_checking;
  statusEl.className = "verify-status";
  btn.disabled = true;

  try {
    const res = await fetch(`${WORKER_URL}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, token }),
    });
    const data = await res.json();

    if (data.verified) {
      state.verifiedDomain = domain;
      state.proof = data.proof;
      statusEl.textContent = dict.verify_ok;
      statusEl.className = "verify-status ok";
      unlockLoadTester(domain);
    } else {
      statusEl.textContent = dict.verify_fail;
      statusEl.className = "verify-status fail";
    }
  } catch {
    statusEl.textContent = dict.verify_fail;
    statusEl.className = "verify-status fail";
  } finally {
    btn.disabled = false;
  }
});

function unlockLoadTester(domain) {
  document.getElementById("loadtestCard").classList.add("unlocked");
  document.getElementById("lockOverlay").style.display = "none";
  const loadUrlInput = document.getElementById("loadUrl");
  loadUrlInput.disabled = false;
  loadUrlInput.value = "https://" + domain;
  document.getElementById("requestsSlider").disabled = false;
  document.getElementById("startTestBtn").disabled = false;
}

function generateToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return "sitearmor-" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---------- Load tester ----------
const slider = document.getElementById("requestsSlider");
slider.addEventListener("input", () => {
  document.getElementById("requestsValue").textContent = slider.value;
});

document.getElementById("startTestBtn").addEventListener("click", runLoadTest);

async function runLoadTest() {
  if (!state.verifiedDomain || !state.proof) return;
  const dict = I18N[state.lang];
  const targetUrl = normalizeUrl(document.getElementById("loadUrl").value) || `https://${state.verifiedDomain}`;
  const requests = Number(slider.value);

  const btn = document.getElementById("startTestBtn");
  const progressWrap = document.getElementById("testProgress");
  const fill = document.getElementById("progressFill");
  const resultCard = document.getElementById("loadResult");

  btn.disabled = true;
  resultCard.classList.add("hidden");
  progressWrap.classList.remove("hidden");
  fill.style.width = "0%";

  let pct = 0;
  const ticker = setInterval(() => {
    pct = Math.min(90, pct + Math.random() * 15);
    fill.style.width = pct + "%";
  }, 200);

  try {
    const res = await fetch(`${WORKER_URL}/loadtest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: targetUrl,
        domain: state.verifiedDomain,
        requests,
        proof: state.proof,
      }),
    });
    const data = await res.json();
    clearInterval(ticker);
    fill.style.width = "100%";

    if (!res.ok || data.error) throw new Error(data.error);
    state.lastLoadTest = data;
    setTimeout(() => renderLoadResult(data), 250);
  } catch (err) {
    clearInterval(ticker);
    progressWrap.classList.add("hidden");
    alert(dict.err_scan_failed);
  } finally {
    btn.disabled = false;
  }
}

function renderLoadResult(data) {
  const dict = I18N[state.lang];
  document.getElementById("testProgress").classList.add("hidden");
  const resultCard = document.getElementById("loadResult");
  resultCard.classList.remove("hidden");

  document.getElementById("statAvg").textContent = data.avgResponseTimeMs !== null ? data.avgResponseTimeMs + " ms" : "—";
  document.getElementById("statSuccess").textContent = data.successRate + "%";
  document.getElementById("statStatus").textContent = data.successRate >= 50 ? dict.server_up : dict.server_down;
}

document.getElementById("printLoadBtn").addEventListener("click", () => {
  if (!state.lastLoadTest) return;
  buildPrintArea("loadtest", state.lastLoadTest);
  window.print();
});

// ---------- Print ----------
function buildPrintArea(type, data) {
  const dict = I18N[state.lang];
  const titleEl = document.getElementById("printTitle");
  const bodyEl = document.getElementById("printBody");
  bodyEl.innerHTML = "";

  if (type === "scan") {
    titleEl.textContent = dict.tab_scanner + " — " + new URL(data.url).hostname;
    const gradeP = document.createElement("p");
    gradeP.style.fontSize = "20px";
    gradeP.style.fontWeight = "700";
    gradeP.textContent = (state.lang === "ar" ? "التقييم: " : "Grade: ") + data.grade;
    bodyEl.appendChild(gradeP);

    data.results.forEach((r) => {
      const line = document.createElement("p");
      line.style.margin = "6px 0";
      line.textContent = `${dict.headers[r.id] || r.id}: ${r.present ? dict.present : dict.missing}`;
      bodyEl.appendChild(line);
    });
  } else {
    titleEl.textContent = dict.tab_loadtest + " — " + new URL(data.url).hostname;
    [
      [dict.stat_avg, (data.avgResponseTimeMs ?? "—") + " ms"],
      [dict.stat_success, data.successRate + "%"],
      [state.lang === "ar" ? "عدد الطلبات" : "Requests sent", data.requestsSent],
    ].forEach(([label, value]) => {
      const line = document.createElement("p");
      line.style.margin = "6px 0";
      line.textContent = `${label}: ${value}`;
      bodyEl.appendChild(line);
    });
  }

  const now = new Date();
  document.getElementById("printTimestamp").textContent =
    (state.lang === "ar" ? "تاريخ الفحص: " : "Scan date: ") + now.toLocaleString(state.lang === "ar" ? "ar-EG" : "en-US");
}

// ---------- helpers ----------
function normalizeUrl(raw) {
  if (!raw) return null;
  let v = raw.trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) v = "https://" + v;
  try {
    return new URL(v).toString();
  } catch {
    return null;
  }
}

function normalizeDomain(raw) {
  if (!raw) return null;
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
  return d || null;
}

// ---------- init ----------
applyLanguage();
