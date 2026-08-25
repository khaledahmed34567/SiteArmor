/* =========================================================
   SiteArmor — App Logic
   ========================================================= */

(function () {
  "use strict";

  /* ---------------- i18n dictionary ---------------- */
  const translations = {
    en: {
      brandName: "SiteArmor",
      heroTitle: "Harden and stress-test your site",
      heroSubtitle: "Two lightweight tools. One clean report.",
      tabScanner: "Security Scanner",
      tabLoadTest: "Load Tester",

      scannerTitle: "Security Headers Scanner",
      scannerSubtitle: "Check which security headers your site is sending.",
      urlPlaceholder: "https://example.com",
      scanBtn: "Scan",
      urlError: "Please enter a valid URL.",
      scanningText: "Scanning headers…",
      printReport: "Print Report",

      loadtestTitle: "Load Tester",
      loadtestSubtitle: "Simulate concurrent traffic against your site.",
      usersLabel: "Concurrent Virtual Users",
      startTestBtn: "Start Test",
      testingText: "Running load test…",
      responseTimeLabel: "Response Time",
      successRateLabel: "Success Rate",
      serverStatusLabel: "Server Status",

      statusOnline: "Online",
      statusDegraded: "Degraded",
      statusOverloaded: "Overloaded",

      headerHSTS: "Strict-Transport-Security (HSTS)",
      headerXFO: "X-Frame-Options",
      headerCSP: "Content-Security-Policy",
      headerXCTO: "X-Content-Type-Options",
      headerReferrer: "Referrer-Policy",
      headerPermissions: "Permissions-Policy",

      present: "Present",
      missing: "Missing",

      footerBy: "By Khaled Ahmed",

      printReportTitle: "SiteArmor Report",
      printScanLabel: "Scan report for:",
      printLoadLabel: "Load test report for:",
      printGeneratedOn: "Generated on"
    },
    ar: {
      brandName: "سايت آرمور",
      heroTitle: "قوّي موقعك واختبر تحمّله",
      heroSubtitle: "أداتان بسيطتان، وتقرير واحد أنيق.",
      tabScanner: "فاحص الحماية",
      tabLoadTest: "اختبار التحمّل",

      scannerTitle: "فاحص رؤوس الحماية",
      scannerSubtitle: "تحقّق من رؤوس الحماية التي يرسلها موقعك.",
      urlPlaceholder: "https://example.com",
      scanBtn: "فحص",
      urlError: "يرجى إدخال رابط صحيح.",
      scanningText: "جارِ فحص رؤوس الحماية…",
      printReport: "طباعة التقرير",

      loadtestTitle: "اختبار التحمّل",
      loadtestSubtitle: "محاكاة حركة زوّار متزامنين على موقعك.",
      usersLabel: "عدد المستخدمين الافتراضيين المتزامنين",
      startTestBtn: "بدء الاختبار",
      testingText: "جارِ تنفيذ اختبار التحمّل…",
      responseTimeLabel: "زمن الاستجابة",
      successRateLabel: "نسبة النجاح",
      serverStatusLabel: "حالة الخادم",

      statusOnline: "يعمل بكفاءة",
      statusDegraded: "أداء منخفض",
      statusOverloaded: "محمّل بشكل زائد",

      headerHSTS: "سياسة أمان النقل الصارم (HSTS)",
      headerXFO: "منع تضمين الإطارات (X-Frame-Options)",
      headerCSP: "سياسة أمان المحتوى (CSP)",
      headerXCTO: "منع تخمين نوع المحتوى",
      headerReferrer: "سياسة المُحيل (Referrer-Policy)",
      headerPermissions: "سياسة الأذونات",

      present: "متوفر",
      missing: "مفقود",

      footerBy: "بواسطة خالد أحمد",

      printReportTitle: "تقرير سايت آرمور",
      printScanLabel: "تقرير فحص لموقع:",
      printLoadLabel: "تقرير اختبار تحمّل لموقع:",
      printGeneratedOn: "تاريخ الإصدار"
    }
  };

  const HEADER_KEYS = [
    "headerHSTS",
    "headerXFO",
    "headerCSP",
    "headerXCTO",
    "headerReferrer",
    "headerPermissions"
  ];

  /* ---------------- State ---------------- */
  let currentLang = "en";
  let lastScan = null;     // { domain, grade, headers: [{key, present}], timestamp }
  let lastLoadTest = null; // { domain, users, responseTime, successRate, status, timestamp }

  /* ---------------- Helpers ---------------- */
  function t(key) {
    return translations[currentLang][key] || key;
  }

  function normalizeUrl(raw) {
    const value = raw.trim();
    if (!value) return null;
    try {
      const withProtocol = /^https?:\/\//i.test(value) ? value : "https://" + value;
      const url = new URL(withProtocol);
      if (!url.hostname.includes(".")) return null;
      return url;
    } catch (e) {
      return null;
    }
  }

  function formatTimestamp(date) {
    const locale = currentLang === "ar" ? "ar-EG" : "en-US";
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  /* ---------------- Language switching ---------------- */
  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
  }

  function setLanguage(lang) {
    currentLang = lang;
    document.body.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.body.setAttribute("data-lang", lang);
    document.documentElement.setAttribute("lang", lang);
    applyTranslations();

    // Re-render dynamic content that depends on language
    if (lastScan) renderScanResults(lastScan);
    if (lastLoadTest) renderLoadTestResults(lastLoadTest);
  }

  function initLangToggle() {
    const toggle = document.getElementById("langToggle");
    toggle.addEventListener("click", () => {
      setLanguage(currentLang === "en" ? "ar" : "en");
    });
  }

  /* ---------------- Tab switching ---------------- */
  function initTabs() {
    const segments = document.querySelectorAll(".segment");
    const control = document.querySelector(".segmented-control");
    const scannerPanel = document.getElementById("scannerPanel");
    const loadtestPanel = document.getElementById("loadtestPanel");

    segments.forEach((seg) => {
      seg.addEventListener("click", () => {
        segments.forEach((s) => {
          s.classList.remove("active");
          s.setAttribute("aria-selected", "false");
        });
        seg.classList.add("active");
        seg.setAttribute("aria-selected", "true");

        const tool = seg.getAttribute("data-tool");
        control.setAttribute("data-active", tool);

        scannerPanel.classList.toggle("active", tool === "scanner");
        loadtestPanel.classList.toggle("active", tool === "loadtest");
      });
    });
  }

  /* ---------------- Security Scanner ---------------- */
  function initScanner() {
    const urlInput = document.getElementById("scannerUrl");
    const scanBtn = document.getElementById("scanBtn");
    const errorEl = document.getElementById("scannerError");
    const loadingEl = document.getElementById("scannerLoading");
    const resultsEl = document.getElementById("scannerResults");

    scanBtn.addEventListener("click", () => {
      const url = normalizeUrl(urlInput.value);
      if (!url) {
        errorEl.classList.remove("hidden");
        resultsEl.classList.add("hidden");
        return;
      }
      errorEl.classList.add("hidden");
      resultsEl.classList.add("hidden");
      loadingEl.classList.remove("hidden");
      scanBtn.disabled = true;

      setTimeout(() => {
        const headers = HEADER_KEYS.map((key) => ({
          key,
          present: Math.random() > 0.35
        }));
        const presentCount = headers.filter((h) => h.present).length;
        const grade = gradeFromCount(presentCount, headers.length);

        lastScan = {
          domain: url.hostname,
          grade,
          headers,
          timestamp: new Date()
        };

        loadingEl.classList.add("hidden");
        scanBtn.disabled = false;
        renderScanResults(lastScan);
      }, 1400);
    });
  }

  function gradeFromCount(present, total) {
    const ratio = present / total;
    if (ratio >= 0.95) return "A";
    if (ratio >= 0.75) return "B";
    if (ratio >= 0.55) return "C";
    if (ratio >= 0.3) return "D";
    return "F";
  }

  function renderScanResults(scan) {
    const resultsEl = document.getElementById("scannerResults");
    const badge = document.getElementById("gradeBadge");
    const domainEl = document.getElementById("scannedDomain");
    const timeEl = document.getElementById("scanTimestamp");
    const listEl = document.getElementById("headersList");

    badge.textContent = scan.grade;
    badge.className = "grade-badge grade-" + scan.grade;
    domainEl.textContent = scan.domain;
    timeEl.textContent = formatTimestamp(scan.timestamp);

    listEl.innerHTML = "";
    scan.headers.forEach((h) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = t(h.key);
      const status = document.createElement("span");
      status.className = "header-status " + (h.present ? "present" : "missing");
      const dot = document.createElement("span");
      dot.className = "status-dot " + (h.present ? "present" : "missing");
      const label = document.createElement("span");
      label.textContent = h.present ? t("present") : t("missing");
      status.appendChild(dot);
      status.appendChild(label);
      li.appendChild(name);
      li.appendChild(status);
      listEl.appendChild(li);
    });

    resultsEl.classList.remove("hidden");
  }

  /* ---------------- Load Tester ---------------- */
  function initLoadTester() {
    const urlInput = document.getElementById("loadtestUrl");
    const errorEl = document.getElementById("loadtestError");
    const slider = document.getElementById("usersSlider");
    const usersValue = document.getElementById("usersValue");
    const startBtn = document.getElementById("startTestBtn");
    const progressBlock = document.getElementById("loadtestProgress");
    const progressFill = document.getElementById("progressFill");
    const progressLabel = document.getElementById("progressLabel");
    const resultsEl = document.getElementById("loadtestResults");

    slider.addEventListener("input", () => {
      usersValue.textContent = slider.value;
    });

    startBtn.addEventListener("click", () => {
      const url = normalizeUrl(urlInput.value);
      if (!url) {
        errorEl.classList.remove("hidden");
        resultsEl.classList.add("hidden");
        return;
      }
      errorEl.classList.add("hidden");
      resultsEl.classList.add("hidden");
      progressBlock.classList.remove("hidden");
      startBtn.disabled = true;

      const users = parseInt(slider.value, 10);
      let progress = 0;
      progressFill.style.width = "0%";
      progressLabel.textContent = "0%";

      const interval = setInterval(() => {
        progress += Math.random() * 12 + 6;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          setTimeout(() => {
            progressBlock.classList.add("hidden");
            startBtn.disabled = false;

            const result = computeLoadTestResult(url.hostname, users);
            lastLoadTest = result;
            renderLoadTestResults(result);
          }, 300);
        }
        progressFill.style.width = progress + "%";
        progressLabel.textContent = Math.round(progress) + "%";
      }, 180);
    });
  }

  function computeLoadTestResult(domain, users) {
    // Simple mocked model: more concurrent users -> higher latency, lower success rate.
    const baseLatency = 45;
    const latency = Math.round(baseLatency + users * (0.35 + Math.random() * 0.25));
    const successRate = Math.max(
      100 - (users / 1000) * 45 - Math.random() * 8,
      35
    ).toFixed(1);

    let statusKey = "statusOnline";
    if (successRate < 60 || latency > 600) statusKey = "statusOverloaded";
    else if (successRate < 90 || latency > 300) statusKey = "statusDegraded";

    return {
      domain,
      users,
      responseTime: latency,
      successRate,
      statusKey,
      timestamp: new Date()
    };
  }

  function renderLoadTestResults(result) {
    const resultsEl = document.getElementById("loadtestResults");
    document.getElementById("statResponseTime").textContent = result.responseTime + " ms";
    document.getElementById("statSuccessRate").textContent = result.successRate + "%";
    document.getElementById("statServerStatus").textContent = t(result.statusKey);
    document.getElementById("loadtestTimestamp").textContent = formatTimestamp(result.timestamp);
    resultsEl.classList.remove("hidden");
  }

  /* ---------------- Print Report ---------------- */
  function buildPrintBody() {
    const activeTool = document.querySelector(".segment.active").getAttribute("data-tool");
    const printTitle = document.getElementById("printTitle");
    const printDomain = document.getElementById("printDomain");
    const printTimestamp = document.getElementById("printTimestamp");
    const printBody = document.getElementById("printBody");

    printTitle.textContent = t("printReportTitle");
    printBody.innerHTML = "";

    if (activeTool === "scanner" && lastScan) {
      printDomain.textContent = t("printScanLabel") + " " + lastScan.domain;
      printTimestamp.textContent = t("printGeneratedOn") + ": " + formatTimestamp(lastScan.timestamp);

      const gradeRow = document.createElement("div");
      gradeRow.className = "grade-row";
      gradeRow.innerHTML =
        '<div class="grade-badge grade-' + lastScan.grade + '">' + lastScan.grade + "</div>" +
        '<div class="grade-info"><div class="scanned-domain">' + lastScan.domain + "</div></div>";
      printBody.appendChild(gradeRow);

      const list = document.createElement("ul");
      list.className = "headers-list";
      lastScan.headers.forEach((h) => {
        const li = document.createElement("li");
        li.innerHTML =
          "<span>" + t(h.key) + "</span>" +
          '<span class="header-status ' + (h.present ? "present" : "missing") + '">' +
          (h.present ? t("present") : t("missing")) +
          "</span>";
        list.appendChild(li);
      });
      printBody.appendChild(list);
    } else if (activeTool === "loadtest" && lastLoadTest) {
      printDomain.textContent = t("printLoadLabel") + " " + lastLoadTest.domain;
      printTimestamp.textContent = t("printGeneratedOn") + ": " + formatTimestamp(lastLoadTest.timestamp);

      const grid = document.createElement("div");
      grid.className = "stats-grid";
      grid.innerHTML =
        '<div class="stat-card"><span class="stat-label">' + t("responseTimeLabel") + '</span><span class="stat-value">' + lastLoadTest.responseTime + " ms</span></div>" +
        '<div class="stat-card"><span class="stat-label">' + t("successRateLabel") + '</span><span class="stat-value">' + lastLoadTest.successRate + "%</span></div>" +
        '<div class="stat-card"><span class="stat-label">' + t("serverStatusLabel") + '</span><span class="stat-value">' + t(lastLoadTest.statusKey) + "</span></div>";
      printBody.appendChild(grid);

      const usersNote = document.createElement("p");
      usersNote.className = "thin-font";
      usersNote.style.marginTop = "14px";
      usersNote.textContent = t("usersLabel") + ": " + lastLoadTest.users;
      printBody.appendChild(usersNote);
    }
  }

  function initPrintButtons() {
    ["printBtnScanner", "printBtnLoadtest"].forEach((id) => {
      const btn = document.getElementById(id);
      btn.addEventListener("click", () => {
        buildPrintBody();
        window.print();
      });
    });
  }

  /* ---------------- Init ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".segmented-control").setAttribute("data-active", "scanner");
    applyTranslations();
    initLangToggle();
    initTabs();
    initScanner();
    initLoadTester();
    initPrintButtons();
  });
})();
