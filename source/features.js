/* Gramrahi add-on: load AFTER script.js */
(function () {
  const esc = escapeChildText;

  /* ================= 1. FIRST-AID GUIDE (text + voice, EN/HI) ================= */
  const FA = {
    snake: {
      icon: "🐍", img: "images/snake-bite.jpg",
      title: { en: "Snake Bite", hi: "सांप का काटना" },
      steps: {
        en: [
          "Stay calm and move away from the snake. Panic makes the venom spread faster.",
          "Press the red Emergency Help button on this website to request an ambulance, or go to the nearest hospital at once. Anti-snake venom is given only in hospitals.",
          "Make the person lie down. Keep the bitten limb still, at about heart level.",
          "Remove rings, watches, bangles and tight clothes before swelling starts.",
          "Gently wash the area with water, cover with a clean loose cloth, and splint the limb like a fracture so it cannot move.",
          "NO: do not cut the wound, do not suck out venom, do not tie a tight band, do not apply ice, herbs or oil, and do not go to a faith healer first.",
          "Do not try to catch or kill the snake. Remember its colour and shape, or take a photo from a safe distance.",
          "Note the time of the bite. Watch the breathing. If breathing stops, give rescue breaths and CPR until help arrives."
        ],
        hi: [
          "शांत रहें और सांप से दूर हट जाएं। घबराने से ज़हर तेज़ी से फैलता है।",
          "तुरंत इस वेबसाइट का लाल इमरजेंसी हेल्प बटन दबाकर एम्बुलेंस बुलाएं, या नज़दीकी अस्पताल जाएं। सांप के ज़हर की दवा केवल अस्पताल में मिलती है।",
          "मरीज़ को लिटा दें। काटे गए अंग को हिलने न दें और दिल के स्तर पर रखें।",
          "सूजन आने से पहले अंगूठी, घड़ी, चूड़ियां और तंग कपड़े उतार दें।",
          "जगह को पानी से हल्के से धोएं, साफ ढीले कपड़े से ढकें और अंग को टूटी हड्डी की तरह पट्टी से स्थिर रखें।",
          "ये न करें: घाव को काटें नहीं, मुंह से ज़हर न चूसें, कसकर पट्टी न बांधें, बर्फ, जड़ी-बूटी या तेल न लगाएं, और पहले झाड़-फूंक वाले के पास न जाएं।",
          "सांप को पकड़ने या मारने की कोशिश न करें। उसका रंग और आकार याद रखें, या दूर से फोटो लें।",
          "काटने का समय नोट करें। सांस पर नज़र रखें। सांस रुक जाए तो मदद आने तक कृत्रिम सांस और सीपीआर दें।"
        ]
      }
    },
    heart: {
      icon: "❤️‍🩹", img: "images/heart-attack.jpg",
      title: { en: "Heart Attack", hi: "दिल का दौरा" },
      steps: {
        en: [
          "Warning signs: chest pain, pressure or heaviness, pain spreading to the arm, jaw or back, sweating, breathlessness, nausea or dizziness.",
          "Press the red Emergency Help button on this website right away to request an ambulance. Do not wait for the pain to pass.",
          "Make the person sit and rest, half-reclined with knees bent. Keep them calm. Do not let them walk or climb stairs.",
          "Loosen tight clothing and give fresh air.",
          "If the person is not allergic to aspirin, has no bleeding problem and is an adult, let them chew one 300 mg aspirin tablet. Do not swallow whole.",
          "Do not give any other food, drink or medicine.",
          "If the person becomes unresponsive and is not breathing normally, lay them flat on a hard surface and start CPR: push hard and fast in the centre of the chest, about 100 to 120 times a minute, until help arrives.",
          "Do not drive yourself. Wait for the ambulance or ask someone to take you. Show the Gramrahi Patient ID or QR code at the hospital."
        ],
        hi: [
          "चेतावनी के लक्षण: सीने में दर्द, दबाव या भारीपन, दर्द का हाथ, जबड़े या पीठ में फैलना, पसीना, सांस फूलना, मितली या चक्कर।",
          "तुरंत इस वेबसाइट का लाल इमरजेंसी हेल्प बटन दबाकर एम्बुलेंस बुलाएं। दर्द अपने आप ठीक होने का इंतज़ार न करें।",
          "मरीज़ को बैठाकर आराम दें, आधा पीछे टिकाकर और घुटने मोड़कर। उन्हें शांत रखें। चलने या सीढ़ियां चढ़ने न दें।",
          "तंग कपड़े ढीले करें और ताज़ी हवा आने दें।",
          "अगर मरीज़ वयस्क है, एस्पिरिन से एलर्जी नहीं है और खून बहने की समस्या नहीं है, तो 300 मिलीग्राम की एक एस्पिरिन गोली चबाने दें। साबुत न निगलें।",
          "कोई और खाना, पेय या दवा न दें।",
          "अगर मरीज़ बेहोश हो जाए और सामान्य रूप से सांस न ले रहा हो, तो उसे सख्त सतह पर सीधा लिटाएं और सीपीआर शुरू करें: सीने के बीच में ज़ोर से और तेज़ी से, लगभग 100 से 120 बार प्रति मिनट दबाएं, जब तक मदद न आ जाए।",
          "खुद गाड़ी न चलाएं। एम्बुलेंस का इंतज़ार करें या किसी से ले चलने को कहें। अस्पताल में गम्रही पेशेंट आईडी या क्यूआर कोड दिखाएं।"
        ]
      }
    }
  };
  const UI = {
    en: { pick: "Choose the emergency", call: "🚑 Emergency Help", listen: "🔊 Listen", stop: "⏹ Stop", step: "Step",
          warn: "This is first-aid guidance, not a substitute for a doctor. Use the Emergency Help button first.", novoice: "Voice is not supported on this device." },
    hi: { pick: "आपातकाल चुनें", call: "🚑 इमरजेंसी हेल्प", listen: "🔊 सुनें", stop: "⏹ रोकें", step: "चरण",
          warn: "यह प्राथमिक उपचार की जानकारी है, डॉक्टर का विकल्प नहीं। सबसे पहले इमरजेंसी हेल्प बटन का इस्तेमाल करें।", novoice: "इस डिवाइस पर आवाज़ समर्थित नहीं है।" }
  };
  let faLang = "en", faKey = null;

  function speak(text) {
    if (!("speechSynthesis" in window)) { showToast(UI[faLang].novoice); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const code = faLang === "hi" ? "hi-IN" : "en-IN";
    u.lang = code; u.rate = 0.9;
    const voices = speechSynthesis.getVoices();
    const v = voices.find(x => x.lang.replace("_", "-") === code) || voices.find(x => x.lang.toLowerCase().startsWith(code.slice(0, 2)));
    if (v) u.voice = v;
    else if (faLang === "hi") showToast("Hindi voice may not be installed on this device. Check text-to-speech settings.");
    speechSynthesis.speak(u);
  }
  window.faImgErr = (el, icon) => {
    const d = document.createElement("div"); d.className = "fa-emoji"; d.textContent = icon; el.replaceWith(d);
  };
  window.faSetLang = l => { faLang = l; if ("speechSynthesis" in window) speechSynthesis.cancel(); renderFA(); };
  window.faSelect = k => { faKey = k; if ("speechSynthesis" in window) speechSynthesis.cancel(); renderFA(); };
  window.faSay = i => { const s = FA[faKey].steps[faLang]; speak(UI[faLang].step + " " + (i + 1) + ". " + s[i]); };
  window.faSayAll = () => {
    const f = FA[faKey], s = f.steps[faLang];
    speak(f.title[faLang] + ". " + s.map((t, i) => UI[faLang].step + " " + (i + 1) + ". " + t).join(" "));
  };
  window.faStop = () => { if ("speechSynthesis" in window) speechSynthesis.cancel(); };

  function renderFA() {
    const box = document.getElementById("faBody"); if (!box) return;
    const t = UI[faLang];
    let h = `<div class="fa-bar"><button class="lang ${faLang === "en" ? "on" : ""}" onclick="faSetLang('en')">English</button>
      <button class="lang ${faLang === "hi" ? "on" : ""}" onclick="faSetLang('hi')">हिंदी</button>
      <button class="primary-btn" onclick="showPage('ambulance')">${t.call}</button></div>
      <h2 style="margin-bottom:14px">${t.pick}</h2><div class="fa-pick">`;
    Object.keys(FA).forEach(k => {
      const f = FA[k];
      h += `<button class="fa-card ${faKey === k ? "sel" : ""}" onclick="faSelect('${k}')">
        <img src="${f.img}" alt="${esc(f.title.en)}" onerror="faImgErr(this,'${f.icon}')"><h3>${f.title[faLang]}</h3></button>`;
    });
    h += `</div>`;
    if (faKey) {
      const f = FA[faKey];
      h += `<div class="fa-bar"><h2 style="flex:1">${f.title[faLang]}</h2>
        <button class="secondary-btn" onclick="faSayAll()">${t.listen}</button>
        <button class="secondary-btn" onclick="faStop()">${t.stop}</button></div><ol class="fa-steps">` +
        f.steps[faLang].map((s, i) => `<li class="${/^(NO|ये न करें)/.test(s) ? "no" : ""}"><b>${i + 1}</b><span>${esc(s)}</span><button onclick="faSay(${i})" aria-label="${t.listen}">🔊</button></li>`).join("") + `</ol>`;
    }
    h += `<p class="child-note">${t.warn}</p>`;
    box.innerHTML = h;
  }

  /* ================= 2. BLOOD AVAILABILITY ================= */
  const BG = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  // DEMO stock. Replace with data from your backend or hospital feed.
  const BANKS = [
    { n: "Community Health Centre", km: 1.2, s: { "A+": 12, "A-": 2, "B+": 9, "B-": 0, "AB+": 3, "AB-": 0, "O+": 15, "O-": 1 } },
    { n: "Primary Health Centre", km: 2.8, s: { "A+": 4, "A-": 0, "B+": 6, "B-": 1, "AB+": 0, "AB-": 0, "O+": 8, "O-": 0 } },
    { n: "District Government Hospital Blood Bank", km: 5.4, s: { "A+": 25, "A-": 5, "B+": 30, "B-": 4, "AB+": 8, "AB-": 2, "O+": 40, "O-": 6 } }
  ];
  const DONOR_KEY = "gramrahiDonors_v1";
  const getDonors = () => { try { return JSON.parse(localStorage.getItem(DONOR_KEY) || "[]"); } catch (_) { return []; } };

  window.renderBlood = function () {
    const box = document.getElementById("bloodBody"); if (!box) return;
    const g = (document.getElementById("bbGroup") || {}).value || "";
    const opts = `<option value="">All groups</option>` + BG.map(x => `<option ${x === g ? "selected" : ""}>${x}</option>`).join("");
    const cls = n => n === 0 ? "none" : n < 5 ? "low" : "ok";
    const banks = [...BANKS].sort((a, b) => a.km - b.km).map(b => `
      <div class="bb-card"><h3>🩸 ${esc(b.n)}</h3><p class="distance">📍 ${b.km} km away</p>
      ${g ? `<p><strong>${g}:</strong> ${b.s[g] ? b.s[g] + " units available" : "Not available"}</p>` : ""}
      <div class="bb-chips">${BG.map(x => `<span class="bb-chip ${cls(b.s[x])} ${x === g ? "hit" : ""}">${x}: ${b.s[x]}</span>`).join("")}</div></div>`).join("");
    const donors = getDonors().filter(d => !g || d.group === g).map(d => `
      <div class="child-record"><h3>🧑 ${esc(d.name)} · ${esc(d.group)}</h3><p>📍 ${esc(d.area || "Not added")}</p>
      <button onclick="callNumber('${esc(d.phone)}')">📞 Call ${esc(d.phone)}</button></div>`).join("");
    box.innerHTML = `<div class="form-group"><label for="bbGroup">Blood group needed</label><select id="bbGroup" onchange="renderBlood()">${opts}</select></div>
      <div class="child-status yellow"><strong>Demo stock.</strong> These units are sample data. Always confirm with the blood bank before travelling. For live national stock, use
      <a href="https://eraktkosh.mohfw.gov.in" target="_blank" rel="noopener">e-RaktKosh</a>.</div>
      <div class="bb-grid">${banks}</div>
      <div class="child-panel" style="margin-top:26px"><h2>🤝 Local blood donors</h2>
        <div class="child-grid">
          <div class="form-group"><label>Name</label><input id="dnName" maxlength="60"></div>
          <div class="form-group"><label>Blood group</label><select id="dnGroup">${BG.map(x => `<option>${x}</option>`).join("")}</select></div>
          <div class="form-group"><label>Village / area</label><input id="dnArea" maxlength="60"></div>
          <div class="form-group"><label>Mobile number</label><input id="dnPhone" type="tel" maxlength="10"></div>
        </div>
        <button class="primary-btn" onclick="addDonor()">Register as donor</button>
        <p class="child-note">Demo: donors are saved only in this browser. A live version needs a server and the donor's consent to show their number.</p>
        <div class="child-list">${donors || `<p class="child-note">No donors${g ? " for " + g : ""} registered yet.</p>`}</div></div>`;
  };
  window.addDonor = function () {
    const v = id => document.getElementById(id).value.trim();
    const d = { name: v("dnName"), group: v("dnGroup"), area: v("dnArea"), phone: v("dnPhone") };
    if (!d.name || !/^[0-9]{10}$/.test(d.phone)) { showToast("Enter a name and a valid 10 digit mobile number."); return; }
    const all = getDonors(); all.unshift(d);
    localStorage.setItem(DONOR_KEY, JSON.stringify(all.slice(0, 50)));
    showToast("Thank you! You are registered as a donor."); renderBlood();
  };

  /* ================= 3. PROFILE QR CODE ================= */
  function profileQrText() {
    const g = k => hsGet(k, "-");
    return ["GRAMRAHI PATIENT PROFILE", "ID: " + g("patientId"), "Name: " + g("patientName"), "Age: " + g("patientAge"),
      "Gender: " + g("patientGender"), "Blood Group: " + g("bloodGroup"), "Conditions: " + g("medicalCondition"),
      "Allergies: " + g("allergies"), "Past Issues: " + g("pastIssues"), "Treatment: " + g("currentTreatment"),
      "Ayushman/ABHA: " + g("ayushmanId"), "Emergency Contact: " + g("emergencyContact"), "Phone: " + g("patientPhone")].join("\n");
  }
  function renderQR() {
    const el = document.getElementById("profileQR"); if (!el) return;
    el.innerHTML = "";
    if (!hsGet("patientName")) { el.innerHTML = `<small>Complete your profile to get your QR code.</small>`; return; }
    if (typeof QRCode === "undefined") { el.innerHTML = `<small>QR library could not load. Check your internet connection.</small>`; return; }
    new QRCode(el, { text: profileQrText(), width: 190, height: 190, correctLevel: QRCode.CorrectLevel.L });
  }
  window.downloadQR = function () {
    const c = document.querySelector("#profileQR canvas");
    if (!c) { showToast("QR code not ready yet."); return; }
    const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "gramrahi-qr-" + hsGet("patientId", "profile") + ".png"; a.click();
  };

  /* ================= INJECT UI ================= */
  const pageHtml = (id, sub, h1, p, body) => `<div class="page" id="${id}"><nav><div class="nav-container">
    <div class="brand" onclick="showPage('home')"><div class="brand-logo">🏥</div><div><h2>Gramrahi</h2><span>${sub}</span></div></div>
    <button class="secondary-btn" onclick="goBack()">← Back</button></div></nav>
    <div class="page-header"><h1>${h1}</h1><p>${p}</p></div><div class="content-area"><div id="${body}" class="notranslate" translate="no"></div></div></div>`;
  const anchor = document.querySelector("script[src='script.js']") || document.body.lastElementChild;
  anchor.insertAdjacentHTML("beforebegin",
    pageHtml("firstaid", "First-Aid Emergency Guide", "🩹 Emergency First-Aid Guide", "Tap an emergency. Read the steps or listen in Hindi or English.", "faBody") +
    pageHtml("blood", "Blood Availability", "🩸 Blood Availability Nearby", "Find blood banks and donors in your locality.", "bloodBody"));

  const grid = document.querySelector("#home .services-grid");
  if (grid) grid.insertAdjacentHTML("beforeend",
    `<div class="service-card"><div class="service-icon">🩹</div><h3>Emergency First Aid</h3><p>Snake bite and heart attack steps with voice in Hindi and English.</p><button class="card-link" onclick="showPage('firstaid')">Open Guide →</button></div>
     <div class="service-card"><div class="service-icon">🩸</div><h3>Blood Availability</h3><p>Check blood stock and donors in your locality.</p><button class="card-link" onclick="showPage('blood')">Find Blood →</button></div>`);
  const login = document.querySelector("#home .nav-login");
  if (login) login.insertAdjacentHTML("beforebegin", `<button onclick="showPage('firstaid')">First Aid</button><button onclick="showPage('blood')">Blood</button>`);

  const idBox = document.querySelector("#profile .patient-id-box");
  if (idBox) idBox.insertAdjacentHTML("afterend",
    `<div class="qr-box"><strong>📱 Your Health QR Code</strong><div id="profileQR"></div>
     <button class="secondary-btn" onclick="downloadQR()">⬇ Download QR</button>
     <small>Scanning this code with any phone camera shows your profile details. Share it only with people you trust, such as hospital staff.</small></div>`);

  /* ================= HOOKS ================= */
  const _show = window.showPage;
  window.showPage = function (id) {
    _show(id);
    if (id === "firstaid") renderFA();
    if (id === "blood") renderBlood();
  };
  const _load = window.loadPatientProfile;
  window.loadPatientProfile = function () { _load(); renderQR(); };
  const _ai = window.getAIResponse;
  window.getAIResponse = function (m) {
    if (/snake|saanp|sanp|सांप/.test(m) || /heart|attack|chest|दिल/.test(m))
      return `🩹 Here are first-aid steps with voice in Hindi and English.<br><br><button class="card-link" onclick="showPage('firstaid')">Open First-Aid Guide →</button>`;
    if (/blood|donor|रक्त|खून/.test(m))
      return `🩸 You can check nearby blood stock and donors here.<br><br><button class="card-link" onclick="showPage('blood')">Find Blood →</button>`;
    return _ai(m);
  };
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
})();
