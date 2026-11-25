let previousPage = "home";

function showPage(pageId) {
    const activePage = document.querySelector(".page.active");

    if (activePage && activePage.id !== pageId) {
     previousPage = activePage.id;
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");

    if (pageId === "profile") {
        loadPatientProfile();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function goBack() {
    showPage(previousPage);
}

function showToast(message) {
 const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3500);
}

function showStep(stepNumber) {
    document.querySelectorAll(".form-step").forEach(step => {
        step.classList.remove("active-step");
    });

    document.getElementById("step" + stepNumber).classList.add("active-step");

    document.querySelectorAll(".step-dot").forEach((dot, index) => {
        dot.classList.remove("active");
        dot.classList.remove("completed");

        if (index + 1 < stepNumber) {
            dot.classList.add("completed");
        } else if (index + 1 === stepNumber) {
            dot.classList.add("active");
        }
    });
}

let authMode = "register";
function toggleAuthMode() {
    authMode = authMode === "register" ? "login" : "register";
    document.getElementById("authSubtitle").textContent = authMode === "register" ? "Create your secure account with your email address." : "Sign in using your registered email and password.";
    document.getElementById("authSubmit").textContent = authMode === "register" ? "Create Account →" : "Sign In →";
    document.getElementById("confirmPasswordGroup").style.display = authMode === "register" ? "block" : "none";
    document.getElementById("authSwitchText").textContent = authMode === "register" ? "Already registered?" : "New to Gramrahi?";
    document.getElementById("authSwitch").textContent = authMode === "register" ? "Sign in" : "Create account";
    document.getElementById("accountPassword").autocomplete = authMode === "register" ? "new-password" : "current-password";
}
async function submitEmailAuth() {
    const email = document.getElementById("accountEmail").value.trim().toLowerCase();
    const password = document.getElementById("accountPassword").value;
    const confirm = document.getElementById("confirmPassword").value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast("Enter a valid email address.");
    if (password.length < 8) return showToast("Password must contain at least 8 characters.");
    if (authMode === "register" && password !== confirm) return showToast("Passwords do not match.");
    const button = document.getElementById("authSubmit");
    button.disabled = true; button.textContent = "Please wait…";
    try {
        const result = await gramrahiApi(authMode === "register" ? "/api/auth/register" : "/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
        localStorage.setItem("gramrahiAccessToken", result.accessToken);
        localStorage.setItem("patientEmail", email);
        showToast(authMode === "register" ? "Account created successfully!" : "Welcome back!");
        showStep(3);
    } catch (error) {
        showToast(error.message || "Unable to sign in. Check the backend and try again.");
    } finally {
        button.disabled = false; button.textContent = authMode === "register" ? "Create Account →" : "Sign In →";
    }
}

async function completeProfile() {
    const name = document.getElementById("patientName").value.trim();
    const age = document.getElementById("patientAge").value;
    const gender = document.getElementById("patientGender").value;
    const blood = document.getElementById("bloodGroup").value;
    const condition = document.getElementById("medicalCondition").value;
    const allergies = document.getElementById("allergies").value.trim();
    const emergency = document.getElementById("emergencyContact").value.trim();

    if (name === "" || age === "" || gender === "" || blood === "") {
        showToast("Please complete all required profile information.");
        return;
    }

    localStorage.setItem("patientName", name);
    localStorage.setItem("patientAge", age);
    localStorage.setItem("patientGender", gender);
    localStorage.setItem("bloodGroup", blood);
    localStorage.setItem("medicalCondition", condition || "Not Added");
    localStorage.setItem("allergies", allergies || "None Added");
    localStorage.setItem("emergencyContact", emergency || "Not Added");

    saveEmergencyExtras();
    registerPatient();
    showToast("Profile completed successfully!");

    setTimeout(() => {
        showPage("profile");
    }, 700);
}

function loadPatientProfile() {
    const name = localStorage.getItem("patientName");
    const age = localStorage.getItem("patientAge");
    const gender = localStorage.getItem("patientGender");
    const blood = localStorage.getItem("bloodGroup");
    const condition = localStorage.getItem("medicalCondition");
    const allergies = localStorage.getItem("allergies");
    const emergency = localStorage.getItem("emergencyContact");
    const email = localStorage.getItem("patientEmail");

    document.getElementById("profileName").innerText = name || "Citizen";
    document.getElementById("profileAge").innerText = age || "Not Added";
    document.getElementById("profileGender").innerText = gender || "Not Added";
    document.getElementById("profileBlood").innerText = blood || "Not Added";
    document.getElementById("profileCondition").innerText = condition || "Not Added";
    document.getElementById("profileAllergies").innerText = allergies || "Not Added";
    document.getElementById("profileEmergency").innerText = emergency || "Not Added";
    document.getElementById("profilePhone").innerText = email ? "✉️ " + email : "✉️ Not Added";
}

function handleEnter(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

function quickQuestion(question) {
    document.getElementById("chatInput").value = question;
    sendMessage();
}

function sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();

    if (!message) return;

    const messages = document.getElementById("messages");

    messages.innerHTML += `
        <div class="message user-message">
            ${message}
        </div>
    `;

    input.value = "";
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
        const response = getAIResponse(message.toLowerCase());

        messages.innerHTML += `
            <div class="message bot-message">
                ${response}
            </div>
        `;

        messages.scrollTop = messages.scrollHeight;
    }, 600);
}

function getAIResponse(message) {
    if (
        message.includes("clinic") ||
        message.includes("hospital") ||
        message.includes("nearby")
    ) {
        return `
            📍 I can help you find healthcare facilities near your location.
            <br><br>
            <button class="card-link" onclick="showPage('locator')">
                Find Nearby Clinics →
            </button>
        `;
    }

    if (
        message.includes("scheme") ||
        message.includes("eligibility")
    ) {
        return `
            📋 You can check available healthcare schemes
            using our Scheme Eligibility Checker.
            <br><br>
            <button class="card-link" onclick="showPage('schemes')">
                Check Schemes →
            </button>
        `;
    }

    if (
        message.includes("ambulance") ||
        message.includes("emergency")
    ) {
        return `
            🚨 If you need emergency assistance,
            please use the Emergency Ambulance service.
            <br><br>
            <button class="card-link" onclick="showPage('ambulance')">
                Request Emergency Assistance →
            </button>
        `;
    }

    if (message.includes("profile")) {
        return `
            👤 Your Patient Profile stores your basic
            healthcare information.
            <br><br>
            <button class="card-link" onclick="showPage('profile')">
                Open Patient Profile →
            </button>
        `;
    }

    return `
        Namaste! 😊
        <br><br>
        I can help you with:
        <br><br>
        📍 Finding nearby clinics
        <br>
        📋 Healthcare schemes
        <br>
        🚑 Emergency assistance
        <br>
        👤 Patient profile guidance
        <br><br>
        Please tell me what you need help with.
    `;
}

function checkSchemes() {
    const age = parseInt(document.getElementById("schemeAge").value);
    const condition = document.getElementById("schemeCondition").value;

    if (!age || !condition) {
        showToast("Please enter your age and select a medical condition.");
        return;
    }

    let results = `
        <h2>Matching Healthcare Support</h2>

        <p style="color:#62728a; margin:10px 0 20px;">
            Based on your provided information.
        </p>

        <div class="scheme-card">
            <h3>Healthcare Coverage Support</h3>
            <p>
                Explore applicable healthcare support
                based on official eligibility criteria.
            </p>
            <span class="eligible">✓ Potentially Relevant</span>
        </div>
    `;

    if (condition === "Pregnancy") {
        results += `
            <div class="scheme-card">
                <h3>Maternal Healthcare Support</h3>
                <p>
                    Explore healthcare services related
                    to maternal and pregnancy care.
                </p>
                <span class="eligible">✓ Relevant to Your Need</span>
            </div>
        `;
    }

    if (age >= 60) {
        results += `
            <div class="scheme-card">
                <h3>Senior Citizen Healthcare Support</h3>
                <p>
                    Explore healthcare support services
                    available for senior citizens.
                </p>
                <span class="eligible">✓ Age-Based Support</span>
            </div>
        `;
    }

    document.getElementById("schemeResults").innerHTML = results;
}

function getLocation() {
    const status = document.getElementById("locationStatus");

    if (navigator.geolocation) {
        status.innerHTML = "📡 Detecting your current location...";

        navigator.geolocation.getCurrentPosition(
            function (position) {
                status.innerHTML = `
                    📍 Location shared successfully
                    <br>
                    Latitude: ${position.coords.latitude.toFixed(4)}
                    <br>
                    Longitude: ${position.coords.longitude.toFixed(4)}
                `;
            },
            function () {
                status.innerHTML = "⚠️ Unable to access location. Please enable location permission.";
            }
        );
    } else {
        status.innerHTML = "⚠️ Location services are not supported by this browser.";
    }
}

function requestAmbulance() {
    const confirmed = confirm("Are you sure you want to request emergency ambulance assistance?");

    if (confirmed) {
        showToast("Emergency request submitted. Please keep your phone available.");
    }
}

function callNumber(number) {
    window.location.href = "tel:" + number;
}

const CHILD_STORE_KEY = "gramrahiChildProfiles_v1";
const VACCINE_CHECKLIST = [
    {id:"birth", label:"Birth-dose records (verify against vaccination card)"},
    {id:"6w", label:"Around 6 weeks — verify due doses with health worker"},
    {id:"10w", label:"Around 10 weeks — verify due doses with health worker"},
    {id:"14w", label:"Around 14 weeks — verify due doses with health worker"},
    {id:"9m", label:"Around 9 months — verify due doses with health worker"},
    {id:"16m", label:"Later infant / toddler doses — confirm exact timing locally"},
    {id:"school", label:"School-age / adolescent doses — confirm current national/state schedule"}
];

function getChildren() {
    try { return JSON.parse(localStorage.getItem(CHILD_STORE_KEY) || "[]"); }
    catch (_) { return []; }
}
function putChildren(children) {
    localStorage.setItem(CHILD_STORE_KEY, JSON.stringify(children));
}
function escapeChildText(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function saveChild(event) {
    event.preventDefault();
    const child = {
        id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
        name: document.getElementById("childName").value.trim(),
        ageMonths: Number(document.getElementById("childAgeMonths").value),
        sex: document.getElementById("childSex").value,
        weight: document.getElementById("childWeight").value,
        height: document.getElementById("childHeight").value,
        allergies: document.getElementById("childAllergies").value.trim(),
        conditions: document.getElementById("childConditions").value.trim(),
        vaccines: {}
    };
    if (!child.name || !Number.isFinite(child.ageMonths) || child.ageMonths < 0 || child.ageMonths > 204) {
        showToast("Enter the child's name and a valid age (0–204 months)."); return;
    }
    const children = getChildren();
    children.push(child);
    try { putChildren(children); }
    catch (_) { showToast("Could not save in this browser. Check storage settings."); return; }
    document.getElementById("childForm").reset();
    renderChildren();
    showToast("Child profile saved on this device.");
}
function renderChildren() {
    const children = getChildren();
    const list = document.getElementById("childProfiles");
    const options = children.map(c => `<option value="${escapeChildText(c.id)}">${escapeChildText(c.name)} (${c.ageMonths} months)</option>`).join("");
    ["vaccineChild","growthChild"].forEach(id => {
        const el = document.getElementById(id), old = el.value;
        el.innerHTML = `<option value="">Choose child</option>${options}`;
        if (children.some(c => c.id === old)) el.value = old;
    });
    list.innerHTML = children.length ? children.map(c => `
        <div class="child-record"><h3>👶 ${escapeChildText(c.name)}</h3>
        <p>Age: ${c.ageMonths} months · Sex: ${c.sex === "female" ? "Female" : "Male"}</p>
        <p>Weight: ${c.weight ? escapeChildText(c.weight)+" kg" : "Not added"} · Height: ${c.height ? escapeChildText(c.height)+" cm" : "Not added"}</p>
        <p>Allergies: ${escapeChildText(c.allergies || "Not added")}</p><p>Conditions: ${escapeChildText(c.conditions || "Not added")}</p>
        <button onclick="removeChild('${escapeChildText(c.id)}')">Remove profile</button></div>`).join("") : `<p class="child-note">No child profiles yet. Add your first child above.</p>`;
    renderVaccines();
}
function removeChild(id) {
    if (!confirm("Remove this child profile and its demo vaccination checklist from this browser?")) return;
    putChildren(getChildren().filter(c => c.id !== id));
    renderChildren();
}
function renderVaccines() {
    const id = document.getElementById("vaccineChild").value;
    const child = getChildren().find(c => c.id === id);
    const target = document.getElementById("vaccineTracker");
    if (!child) { target.innerHTML = `<p class="child-note">Choose a saved child to view the checklist.</p>`; return; }
    target.innerHTML = `<h3>${escapeChildText(child.name)}'s checklist</h3><table class="child-table"><thead><tr><th>Checkpoint</th><th>Record</th></tr></thead><tbody>` +
        VACCINE_CHECKLIST.map(v => `<tr><td>${escapeChildText(v.label)}</td><td><label><input type="checkbox" ${child.vaccines[v.id] ? "checked" : ""} onchange="markVaccine('${child.id}','${v.id}',this.checked)"> Dose record checked</label></td></tr>`).join("") +
        `</tbody></table><p class="child-note">Checkboxes only record what you mark; they do not mean the dose is medically due or completed. Use the child's official vaccination card.</p>` ;
}
function markVaccine(childId, vaccineId, checked) {
    const children = getChildren(), child = children.find(c => c.id === childId);
    if (!child) return;
    child.vaccines = child.vaccines || {};
    child.vaccines[vaccineId] = checked;
    putChildren(children);
}
function remindVaccines() {
    const child = getChildren().find(c => c.id === document.getElementById("vaccineChild").value);
    if (!child) { showToast("Choose a child first."); return; }
    showToast("Demo only: reminders are not sent. Ask your health worker about the next due dose.");
}
function fillGrowth() {
    const child = getChildren().find(c => c.id === document.getElementById("growthChild").value);
    document.getElementById("growthWeight").value = child?.weight || "";
    document.getElementById("growthHeight").value = child?.height || "";
    document.getElementById("growthResult").innerHTML = "";
}
function checkGrowth() {
    const child = getChildren().find(c => c.id === document.getElementById("growthChild").value);
    const w = Number(document.getElementById("growthWeight").value), h = Number(document.getElementById("growthHeight").value);
    const result = document.getElementById("growthResult");
    if (!child || !(w > 0) || !(h > 0)) { showToast("Choose a child and enter valid height and weight."); return; }
    child.weight = String(w); child.height = String(h);
    const children = getChildren(); putChildren(children);
    renderChildren();
    result.innerHTML = `<div class="child-status yellow"><strong>Measurements recorded — clinical interpretation needed.</strong><br>Age: ${child.ageMonths} months; weight: ${w} kg; height/length: ${h} cm. This demo does not calculate a nutrition category. Ask an Anganwadi worker or health professional to plot these measurements on the appropriate age- and sex-specific growth chart, especially if weight is falling, feeding is difficult, or you are concerned.</div>`;
}
function checkChildSymptoms() {
    const age = Number(document.getElementById("symptomAge").value);
    const symptom = document.getElementById("childSymptom").value;
    const danger = document.getElementById("dangerSign").value;
    const out = document.getElementById("symptomResult");
    if (!Number.isFinite(age) || age < 0 || age > 204 || !symptom) { showToast("Enter age and select the main symptom."); return; }
    if (danger !== "no" || (symptom === "Fever" && age < 3)) {
        out.innerHTML = `<div class="child-status red"><strong>Seek urgent medical care now.</strong><br>Warning signs can indicate a serious illness. For a baby younger than 3 months with fever, seek urgent medical assessment. If the child has difficulty breathing, is hard to wake, has a seizure, cannot drink, or is rapidly worsening, use emergency services. Do not delay care to use this website.</div>`;
    } else {
        out.innerHTML = `<div class="child-status yellow"><strong>Contact a qualified health worker for advice.</strong><br>Monitor drinking/feeding, urination, breathing and alertness. Seek prompt care if symptoms worsen, persist, the child is very young, or you are worried. Do not give medicines or antibiotics without appropriate clinical advice.</div>`;
    }
}
function startChildEmergency() {
    const age = document.getElementById("emergencyChildAge").value;
    const symptoms = document.getElementById("emergencyChildSymptoms").value.trim();
    if (age === "" || !symptoms) { showToast("Enter the child's age and symptoms first."); return; }
    const summary = document.getElementById("childEmergencySummary");
    summary.style.display = "block";
    summary.textContent = "Child emergency details (demo): age " + age + " months; symptoms: " + symptoms + ". This information has not been sent to emergency services.";
    showPage("ambulance");
}
document.addEventListener("DOMContentLoaded", renderChildren);

let currentLanguage = "en";

function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        {
            pageLanguage: "en",
            includedLanguages: "en,hi",
            autoDisplay: false
        },
        "google_translate_element"
    );
}

function toggleLanguage() {
    const button = document.getElementById("languageBtn");
    const select = document.querySelector(".goog-te-combo");

    if (!select) {
        if (typeof showToast === "function") {
            showToast("Translation is loading. Please try again.");
        } else {
            alert("Translation is still loading. Please try again.");
        }
        return;
    }

    const targetLanguage = select.value === "hi" ? "en" : "hi";

    select.value = targetLanguage;
    select.dispatchEvent(new Event("change", {bubbles: true}));

    button.textContent =
        targetLanguage === "hi"
            ? "🌐 View in English"
            : "🌐 हिंदी में देखें";
}

const GRAMRAHI_API = ""; // Same-origin API: frontend and backend share one Render URL.
const HANDOFF_ENDPOINT = GRAMRAHI_API + "/api/emergency";
async function gramrahiApi(path, options = {}) {
    const response = await fetch(GRAMRAHI_API + path, { headers: { "Content-Type": "application/json", ...(localStorage.getItem("gramrahiAccessToken") ? { "Authorization": "Bearer " + localStorage.getItem("gramrahiAccessToken") } : {}), ...(options.headers || {}) }, ...options });
    if (!response.ok) throw new Error("API error " + response.status);
    return response.json();
}
const HANDOFF_LOG_KEY = "gramrahiEmergencyLog_v1";
const HANDOFF_HOSPITALS = [
    {id: "chc", name: "Community Health Centre", km: 1.2},
    {id: "phc", name: "Primary Health Centre", km: 2.8},
    {id: "dh", name: "District Government Hospital", km: 5.4}
];

function hsGet(key, fallback) {
    const v = localStorage.getItem(key);
    return (v === null || v === "") ? (fallback || "") : v;
}
function hsMask(id) {
    if (!id) return "Not added";
    return id.length > 4 ? "•••• " + id.slice(-4) : id;
}
function hsSleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function saveEmergencyExtras() {
    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ""; };
    localStorage.setItem("pastIssues", val("pastIssues"));
    localStorage.setItem("currentTreatment", val("currentTreatment"));
    localStorage.setItem("ayushmanId", val("ayushmanId"));
    const c = document.getElementById("shareConsent");
    localStorage.setItem("shareConsent", c && c.checked ? "yes" : "no");
    registerPatient();
}

const _origLoadPatientProfile = loadPatientProfile;
window.loadPatientProfile = function () {
    _origLoadPatientProfile();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    set("profileAyushman", hsMask(hsGet("ayushmanId")));
    set("profilePast", hsGet("pastIssues", "Not Added"));
    set("profileTreatment", hsGet("currentTreatment", "Not Added"));
    set("profileShare", hsGet("shareConsent") === "yes" ? "On — sent to hospital in emergencies" : "Off");
};

const _origShowPage = showPage;
window.showPage = function (id) {
    _origShowPage(id);
    if (id === "ambulance") refreshHandoffPanel();
};

function refreshHandoffPanel() {
    const patientSel = document.getElementById("handoffPatient");
    if (!patientSel) return;
    const oldPatient = patientSel.value;

    const me = hsGet("patientName", "Myself");
    let opts = `<option value="self">${escapeChildText(me)} (myself)</option>`;
    getChildren().forEach(c => {
        opts += `<option value="${escapeChildText(c.id)}">${escapeChildText(c.name)} (child, ${c.ageMonths} months)</option>`;
    });
    patientSel.innerHTML = opts;
    if ([...patientSel.options].some(o => o.value === oldPatient)) patientSel.value = oldPatient;

    const auto = nearestHospital();
    document.getElementById("handoffHospitalAuto").textContent = "📍 Sent automatically to the nearest hospital: " + auto.name + " (" + auto.km + " km)";

    document.getElementById("handoffShare").checked = hsGet("shareConsent") === "yes";
    renderHandoffPreview();
}

function handoffPatientData() {
    const who = document.getElementById("handoffPatient").value;
    if (who !== "self") {
        const c = getChildren().find(x => x.id === who);
        if (c) return {
            type: "child", patientId: hsGet("patientId"), name: c.name, age: c.ageMonths + " months",
            gender: c.sex === "female" ? "Female" : "Male",
            weight: c.weight ? c.weight + " kg" : "",
            allergies: c.allergies || "None added",
            conditions: c.conditions || "None added",
            pastIssues: hsGet("pastIssues", "None added"),
            treatment: c.conditions || "None added",
            bloodGroup: "",
            ayushman: hsGet("ayushmanId"),
            emergencyContact: hsGet("emergencyContact"),
            phone: hsGet("patientPhone")
        };
    }
    if (!hsGet("patientName")) return null;
    return {
        type: "adult", patientId: hsGet("patientId"), name: hsGet("patientName"), age: hsGet("patientAge") + " years",
        gender: hsGet("patientGender"), bloodGroup: hsGet("bloodGroup"),
        conditions: hsGet("medicalCondition", "None added"),
        allergies: hsGet("allergies", "None added"),
        pastIssues: hsGet("pastIssues", "None added"),
        treatment: hsGet("currentTreatment", "None added"),
        ayushman: hsGet("ayushmanId"),
        emergencyContact: hsGet("emergencyContact"),
        phone: hsGet("patientPhone")
    };
}

function renderHandoffPreview() {
    const box = document.getElementById("handoffPreview");
    const p = handoffPatientData();
    if (!p) {
        box.innerHTML = `<div class="handoff-warn">No health profile saved yet, so no health details can be sent. You can still request an ambulance, but please <button class="card-link" onclick="showPage('login');showStep(3)">complete your health profile</button> to use this feature.</div>`;
        return;
    }
    const item = (l, v) => `<div><span>${l}</span>${escapeChildText(v || "Not added")}</div>`;
    box.innerHTML = `<p class="child-note" style="margin-top:0">Details that will be sent:</p><div class="handoff-preview">` +
        item("Gramrahi Patient ID", p.patientId) + item("Name", p.name) + item("Age", p.age) + item("Gender", p.gender) + item("Blood group", p.bloodGroup) +
        item("Previous health issues", p.pastIssues) + item("Current treatment", p.treatment) +
        item("Medical conditions", p.conditions) + item("Allergies", p.allergies) +
        item("Ayushman card / ABHA", hsMask(p.ayushman)) + item("Emergency contact", p.emergencyContact) +
        `</div>`;
}

function handoffLocation() {
    const t = (document.getElementById("locationStatus") || {}).textContent || "";
    const m = t.match(/Latitude:\s*(-?[\d.]+)[\s\S]*?Longitude:\s*(-?[\d.]+)/);
    return m ? {lat: Number(m[1]), lng: Number(m[2])} : null;
}

function handoffRow(i, text, state) {
    const icon = {wait: "○", run: "⏳", done: "✅", fail: "❌"}[state];
    const row = document.getElementById("hp" + i);
    if (row) { row.className = "hp-row " + state; row.innerHTML = `<span>${icon}</span><span>${text}</span>`; }
}

async function transmitHandoff(payload) {
    if (HANDOFF_ENDPOINT) {
        const r = await fetch(HANDOFF_ENDPOINT, {
            method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(payload)
        });
        if (!r.ok) throw new Error("Hospital system returned " + r.status);
        return {simulated: true, response: await r.json().catch(() => ({}))};
    }
    await hsSleep(1100);
    return {simulated: true};
}

window.requestAmbulance = async function () {
    if (!confirm("Are you sure you want to request emergency ambulance assistance?")) return;

    const btn = document.querySelector(".request-ambulance");
    const hosp = nearestHospital();
    const share = document.getElementById("handoffShare").checked;
    const patient = handoffPatientData();
    const childBox = document.getElementById("childEmergencySummary");

    const payload = {
        requestId: "GRM-" + Date.now().toString(36).toUpperCase(),
        sentAt: new Date().toISOString(),
        hospital: hosp.name,
        healthDataShared: !!(share && patient),
        patient: (share && patient) ? patient : {phone: hsGet("patientPhone")},
        location: handoffLocation(),
        incident: (childBox && childBox.style.display !== "none") ? childBox.textContent : ""
    };

    const prog = document.getElementById("handoffProgress");
    const rec = document.getElementById("handoffReceipt");
    rec.style.display = "none"; rec.innerHTML = "";
    prog.style.display = "block";
    prog.innerHTML = [0, 1, 2, 3].map(i => `<div class="hp-row wait" id="hp${i}"></div>`).join("");
    const labels = [
        "Ambulance request created",
        share && patient ? "Collecting health profile and Ayushman card details" : "Preparing request (health details not shared)",
        "Sending to " + hosp.name,
        "Request recorded by Swasthrahi server (demo; hospital not contacted)"
    ];
    labels.forEach((t, i) => handoffRow(i, t, "wait"));
    btn.disabled = true;

    try {
        handoffRow(0, labels[0], "run"); await hsSleep(500); handoffRow(0, labels[0], "done");
        handoffRow(1, labels[1], "run"); await hsSleep(600); handoffRow(1, labels[1], "done");
        handoffRow(2, labels[2], "run");
        const res = await transmitHandoff(payload);
        handoffRow(2, labels[2], "done");
        handoffRow(3, labels[3] + (res.simulated ? " (demo)" : ""), "run"); await hsSleep(500);
        handoffRow(3, labels[3] + (res.simulated ? " (demo)" : ""), "done");

        try {
            const log = JSON.parse(localStorage.getItem(HANDOFF_LOG_KEY) || "[]");
            log.unshift({requestId: payload.requestId, sentAt: payload.sentAt, hospital: payload.hospital, shared: payload.healthDataShared});
            localStorage.setItem(HANDOFF_LOG_KEY, JSON.stringify(log.slice(0, 10)));
        } catch (_) {}

        showHospitalReceipt(payload, hosp, res.simulated);
        showToast("Emergency request sent to " + hosp.name + ".");
    } catch (err) {
        const failedIdx = [0, 1, 2, 3].find(i => !document.getElementById("hp" + i).classList.contains("done")) ?? 2;
        handoffRow(failedIdx, "Could not reach the hospital system", "fail");
        rec.style.display = "block";
        rec.style.borderColor = "var(--danger)";
        rec.innerHTML = `<div class="hr-head" style="background:var(--danger)">⚠️ Request not delivered</div><div class="hr-body"><p>Please use the Emergency Help button again.</p><div class="child-actions"><button class="primary-btn" onclick="requestAmbulance()">🚑 Use Emergency Help</button></div></div>`;
    } finally {
        btn.disabled = false;
    }
};

function showHospitalReceipt(p, hosp, simulated) {
    const rec = document.getElementById("handoffReceipt");
    const d = p.patient || {};
    const row = (l, v) => v ? `<div><span>${l}</span>${escapeChildText(v)}</div>` : "";
    let body;
    if (p.healthDataShared) {
        body = `<div class="handoff-preview">` +
            row("Gramrahi Patient ID", d.patientId) + row("Patient", d.name) + row("Age", d.age) + row("Gender", d.gender) + row("Blood group", d.bloodGroup) +
            row("Previous health issues", d.pastIssues) + row("Current treatment", d.treatment) +
            row("Medical conditions", d.conditions) + row("Allergies", d.allergies) +
            row("Ayushman card / ABHA", d.ayushman) + row("Emergency contact", d.emergencyContact) +
            row("Phone", d.phone) +
            row("Location", p.location ? p.location.lat.toFixed(4) + ", " + p.location.lng.toFixed(4) : "Not shared") +
            row("Incident details", p.incident) + `</div>`;
    } else {
        body = `<p>Health details were <strong>not</strong> shared. Only the callback number${p.location ? " and location" : ""} reached the hospital.</p>`;
    }
    rec.style.display = "block";
    rec.style.borderColor = "var(--green)";
    rec.innerHTML = `<div class="hr-head">🏥 ${escapeChildText(hosp.name)} — Incoming emergency patient</div>
        <div class="hr-body"><p style="margin-bottom:10px"><strong>Reference:</strong> ${escapeChildText(p.requestId)}</p>${body}</div>
        <div class="hr-foot">${simulated ? "Demo mode: this shows what the hospital's reception screen would display. No real hospital or ambulance has been contacted. In a real emergency, use the Emergency Help button." : "Delivered to the hospital system. If help has not arrived, use the Emergency Help button again."}</div>`;
    rec.scrollIntoView({behavior: "smooth", block: "center"});
}

const PATIENT_REGISTRY_KEY = "gramrahiPatientRegistry_v1";
const ACCESS_LOG_KEY = "gramrahiAccessLog_v1";
let pendingLookupId = null;

function nearestHospital() {
    return [...HANDOFF_HOSPITALS].sort((a, b) => a.km - b.km)[0];
}
function getRegistry() {
    try { return JSON.parse(localStorage.getItem(PATIENT_REGISTRY_KEY) || "{}"); }
    catch (_) { return {}; }
}
function generatePatientId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const reg = getRegistry();
    let id;
    do {
        const n = new Uint32Array(8);
        (window.crypto || {getRandomValues: a => a.map(() => Math.random() * 4294967296)}).getRandomValues(n);
        const t = Array.from(n, v => chars[v % chars.length]).join("");
        id = "GRM-" + t.slice(0, 4) + "-" + t.slice(4);
    } while (reg[id]);
    return id;
}
function registerPatient() {
    if (!hsGet("patientName")) return;
    let id = hsGet("patientId");
    if (!id) { id = generatePatientId(); localStorage.setItem("patientId", id); }
    const reg = getRegistry();
    reg[id] = {
        id: id, name: hsGet("patientName"), age: hsGet("patientAge"), gender: hsGet("patientGender"),
        bloodGroup: hsGet("bloodGroup"), conditions: hsGet("medicalCondition", "None added"),
        allergies: hsGet("allergies", "None added"), pastIssues: hsGet("pastIssues", "None added"),
        treatment: hsGet("currentTreatment", "None added"), ayushman: hsGet("ayushmanId"),
        emergencyContact: hsGet("emergencyContact"), phone: hsGet("patientPhone"),
        consent: hsGet("shareConsent"), updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PATIENT_REGISTRY_KEY, JSON.stringify(reg));
    gramrahiApi("/api/patients", { method: "POST", body: JSON.stringify({
        patientId: id, phone: hsGet("patientPhone"), email: hsGet("patientEmail"), name: hsGet("patientName"), age: hsGet("patientAge"),
        gender: hsGet("patientGender"), bloodGroup: hsGet("bloodGroup"), conditions: hsGet("medicalCondition"),
        allergies: hsGet("allergies"), pastIssues: hsGet("pastIssues"), treatment: hsGet("currentTreatment"),
        ayushman: hsGet("ayushmanId"), emergencyContact: hsGet("emergencyContact"), consent: hsGet("shareConsent") === "yes"
    }) }).then(() => { const s = document.getElementById("backendStatus"); if (s) s.textContent = "Synced with Swasthrahi server"; })
      .catch(() => { const s = document.getElementById("backendStatus"); if (s) s.textContent = "Saved on this device · server offline"; });
    const el = document.getElementById("profilePatientId");
    if (el) el.innerText = id;
}

const _loadProfileV2 = window.loadPatientProfile;
window.loadPatientProfile = function () {
    _loadProfileV2();
    if (hsGet("patientName") && !hsGet("patientId")) registerPatient();
    const el = document.getElementById("profilePatientId");
    if (el) el.innerText = hsGet("patientId", "Complete your profile to get an ID");
};

function copyPatientId() {
    const id = hsGet("patientId");
    if (!id) { showToast("Complete your profile first to get your Patient ID."); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(id).then(() => showToast("Patient ID copied: " + id), () => showToast("Your ID: " + id));
    else showToast("Your ID: " + id);
}

function logAccess(entry) {
    try {
        const log = JSON.parse(localStorage.getItem(ACCESS_LOG_KEY) || "[]");
        log.unshift(entry);
        localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(log.slice(0, 15)));
    } catch (_) {}
    renderAccessLog();
}
function renderAccessLog() {
    const box = document.getElementById("accessLog");
    if (!box) return;
    let log = [];
    try { log = JSON.parse(localStorage.getItem(ACCESS_LOG_KEY) || "[]"); } catch (_) {}
    box.innerHTML = log.length
        ? log.map(l => `<div>${escapeChildText(l.id)} viewed by ${escapeChildText(l.hospital)} · ${new Date(l.time).toLocaleString()}</div>`).join("")
        : `<div>No records accessed yet.</div>`;
}

function lookupPatient() {
    const out = document.getElementById("lookupResult");
    const id = document.getElementById("lookupId").value.trim().toUpperCase();
    if (!/^GRM-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(id)) {
        out.innerHTML = `<div class="child-status red">Enter a valid ID in the format GRM-XXXX-XXXX.</div>`;
        return;
    }
    const rec = getRegistry()[id];
    if (!rec) {
        out.innerHTML = `<div class="child-status red">No patient found with this ID. Please check the ID and try again.</div>`;
        return;
    }
    if (rec.consent !== "yes") {
        pendingLookupId = id;
        out.innerHTML = `<div class="child-status yellow"><strong>Patient approval needed.</strong><br>This patient has not switched on automatic sharing. Ask the patient for the one-time code sent to their registered mobile (demo code: 123456).</div>
            <div class="form-group" style="margin-top:14px"><label for="lookupOtp">One-time code</label><input id="lookupOtp" type="text" maxlength="6" placeholder="Enter code"></div>
            <button class="primary-btn" onclick="verifyLookupOtp()">Verify and view details</button>`;
        return;
    }
    showPatientRecord(rec);
}

function verifyLookupOtp() {
    const code = document.getElementById("lookupOtp").value.trim();
    if (code !== "123456") { showToast("Incorrect code."); return; }
    const rec = getRegistry()[pendingLookupId];
    if (rec) showPatientRecord(rec);
}

function showPatientRecord(rec) {
    const out = document.getElementById("lookupResult");
    const hospital = document.getElementById("lookupHospital").value;
    const item = (l, v) => `<div><span>${l}</span>${escapeChildText(v || "Not added")}</div>`;
    const kids = (rec.id === hsGet("patientId")) ? getChildren() : [];
    out.innerHTML = `<div class="hospital-receipt" style="display:block">
        <div class="hr-head">✅ ${escapeChildText(rec.name)} · ${escapeChildText(rec.id)}</div>
        <div class="hr-body">` +

        `<div class="handoff-preview">` +
        item("Age", rec.age + " years") + item("Gender", rec.gender) + item("Blood group", rec.bloodGroup) +
        item("Medical conditions", rec.conditions) + item("Previous health issues", rec.pastIssues) +
        item("Current treatment", rec.treatment) + item("Allergies", rec.allergies) +
        item("Ayushman card / ABHA", rec.ayushman) + item("Emergency contact", rec.emergencyContact) +
        item("Phone", rec.phone) + `</div>` +

        (kids.length ? `<h4 style="margin:16px 0 6px">Children linked to this ID</h4><div class="handoff-preview">` +
            kids.map(c => item(c.name, c.ageMonths + " months · Allergies: " + (c.allergies || "None added") + " · Conditions: " + (c.conditions || "None added"))).join("") + `</div>` : "") +
        `</div><div class="hr-foot">Record shared with ${escapeChildText(hospital)}. This access has been logged. Last updated ${new Date(rec.updatedAt).toLocaleString()}.</div></div>`;
    logAccess({id: rec.id, hospital: hospital, time: new Date().toISOString()});
    pendingLookupId = null;
}

const _showPageV3 = window.showPage;
window.showPage = function (id) {
    _showPageV3(id);
    if (id === "hospital") renderAccessLog();
};


/* ===== New features: First Aid and Emergency Profile QR ===== */
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
    },
    burns: {
      icon: "🔥", img: "images/burns.jpg",
      title: { en: "Burns", hi: "जलना / झुलसना" },
      steps: {
        en: [
          "Move the person away from the heat source and make sure the area is safe.",
          "Cool the burn under cool or lukewarm running water for 20 minutes. Do not use ice or iced water.",
          "Remove jewellery and loose clothing near the burn before swelling, but do not pull away anything stuck to the skin.",
          "After cooling, cover loosely with a sterile non-fluffy dressing or clean plastic film. Do not wrap tightly.",
          "Do not apply butter, oil, toothpaste, creams or home remedies, and do not break blisters.",
          "Get urgent medical help for large, deep, chemical or electrical burns, or burns on the face, hands, feet, genitals or major joints. Call emergency services if severe.",
          "For chemical burns, protect yourself, remove contaminated clothing and rinse with plenty of running water while arranging urgent medical help."
        ],
        hi: [
          "व्यक्ति को गर्मी या आग के स्रोत से दूर सुरक्षित जगह पर ले जाएं।",
          "जले हुए हिस्से को 20 मिनट तक ठंडे या सामान्य ठंडे बहते पानी के नीचे रखें। बर्फ या बहुत ठंडा पानी न लगाएं।",
          "सूजन से पहले पास के गहने और ढीले कपड़े हटा दें, लेकिन त्वचा से चिपकी चीज़ को न खींचें।",
          "ठंडा करने के बाद साफ, बिना रोएँ वाली पट्टी या साफ प्लास्टिक फिल्म से ढीला ढकें। कसकर न बांधें।",
          "मक्खन, तेल, टूथपेस्ट, क्रीम या घरेलू नुस्खे न लगाएं और फफोले न फोड़ें।",
          "बड़े, गहरे, रासायनिक या बिजली से हुए जलने पर, या चेहरे, हाथ, पैर, जननांग या जोड़ों पर जलने पर तुरंत चिकित्सा सहायता लें। गंभीर स्थिति में आपातकालीन सेवा बुलाएं।",
          "रासायनिक जलन में खुद को सुरक्षित रखें, दूषित कपड़े हटाएं और तुरंत चिकित्सा सहायता लेते हुए बहुत सारे बहते पानी से धोएं।"
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

  /* ================= 2. PROFILE QR CODE ================= */
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
    pageHtml("firstaid", "First-Aid Emergency Guide", "🩹 Emergency First-Aid Guide", "Tap an emergency. Read the steps or listen in Hindi or English.", "faBody"));

  const grid = document.querySelector("#home .services-grid");
  if (grid) grid.insertAdjacentHTML("beforeend",
    `<div class="service-card"><div class="service-icon">🩹</div><h3>Emergency First Aid</h3><p>Snake bite and heart attack steps with voice in Hindi and English.</p><button class="card-link" onclick="showPage('firstaid')">Open Guide →</button></div>
`);
  const login = document.querySelector("#home .nav-login");
  if (login) login.insertAdjacentHTML("beforebegin", `<button onclick="showPage('firstaid')">First Aid</button>`);

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
  };
  const _load = window.loadPatientProfile;
  window.loadPatientProfile = function () { _load(); renderQR(); };
  const _ai = window.getAIResponse;
  window.getAIResponse = function (m) {
    if (/snake|saanp|sanp|सांप/.test(m) || /heart|attack|chest|दिल/.test(m))
      return `🩹 Here are first-aid steps with voice in Hindi and English.<br><br><button class="card-link" onclick="showPage('firstaid')">Open First-Aid Guide →</button>`;

    return _ai(m);
  };
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
})();


function gramrahiLogout() {
    localStorage.removeItem("gramrahiAccessToken");
    localStorage.removeItem("patientEmail");
    showToast("You have been signed out on this device.");
    showPage("home");
}


/* ===== Swasthrahi: Health Vault, Medicine Tracker and Emergency QR ===== */
function featureAuthHeaders(){const token=localStorage.getItem("gramrahiAccessToken");if(!token)throw new Error("Please sign in first to use your personal health tools.");return {Authorization:"Bearer "+token};}
async function featureRequest(path,options={}){const headers={...featureAuthHeaders(),...(options.headers||{})};const res=await fetch(GRAMRAHI_API+path,{...options,headers});let data={};try{data=await res.json()}catch{}if(!res.ok)throw new Error(data.detail||"Request failed. Please check the backend.");return data;}
function escapeFeature(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function loadVault(){const box=document.getElementById("vaultList");if(!box)return;try{const d=await featureRequest("/api/health-vault/documents");box.innerHTML=d.documents.length?d.documents.map(x=>`<div class="feature-item"><div><h3>${escapeFeature(x.title)}</h3><p>${escapeFeature(x.document_type)} · ${escapeFeature(x.file_name||"File")}</p><p>${new Date(x.created_at).toLocaleDateString()}</p></div><div><button class="secondary-btn" onclick="downloadVaultFile('${x.id}')">Open / Download</button> <button class="secondary-btn" onclick="deleteVaultFile('${x.id}')">Delete</button></div></div>`).join(""):`<p>No reports uploaded yet.</p>`;}catch(e){box.textContent=e.message;}}
async function downloadVaultFile(id){try{const res=await fetch(GRAMRAHI_API+`/api/health-vault/documents/${id}/download`,{headers:featureAuthHeaders()});if(!res.ok)throw new Error("Could not open file");const blob=await res.blob();const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="health-document";a.click();URL.revokeObjectURL(url);}catch(e){showToast(e.message);}}
async function deleteVaultFile(id){if(!confirm("Delete this medical document permanently?"))return;try{await featureRequest(`/api/health-vault/documents/${id}`,{method:"DELETE"});loadVault();showToast("Document deleted.");}catch(e){showToast(e.message);}}
document.getElementById("vaultForm")?.addEventListener("submit",async e=>{e.preventDefault();const file=document.getElementById("vaultFile").files[0];if(!file)return;const fd=new FormData();fd.append("title",document.getElementById("vaultTitle").value);fd.append("document_type",document.getElementById("vaultType").value);fd.append("file",file);try{const res=await fetch(GRAMRAHI_API+"/api/health-vault/upload",{method:"POST",headers:featureAuthHeaders(),body:fd});const d=await res.json();if(!res.ok)throw new Error(d.detail||"Upload failed");e.target.reset();loadVault();showToast("Medical report saved in your vault.");}catch(err){showToast(err.message);}});
async function loadMedicines(){const box=document.getElementById("medicineList");if(!box)return;try{const d=await featureRequest("/api/medicines");const today=[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,"0"),String(new Date().getDate()).padStart(2,"0")].join("-");box.innerHTML=d.medicines.length?d.medicines.map(m=>{const taken=m.takenDates.includes(today);return `<div class="feature-item"><div><h3>${escapeFeature(m.medicine)} · ${escapeFeature(m.dosage)}</h3><p>${escapeFeature(m.schedule)}</p><p>${escapeFeature(m.start_date)}${m.end_date?" → "+escapeFeature(m.end_date):""}</p><p>${escapeFeature(m.notes||"")}</p><p class="feature-status">${taken?"Marked taken today":"Not marked taken today"}</p></div><div><button class="secondary-btn" onclick="markMedicine('${m.id}',${!taken})">${taken?"Undo today":"Mark taken"}</button> <button class="secondary-btn" onclick="deleteMedicine('${m.id}')">Delete</button></div></div>`}).join(""):`<p>No medicine schedules yet.</p>`;}catch(e){box.textContent=e.message;}}
document.getElementById("medicineForm")?.addEventListener("submit",async e=>{e.preventDefault();const payload={medicine:medicineName.value.trim(),dosage:medicineDosage.value.trim(),schedule:medicineSchedule.value.trim(),startDate:medicineStart.value,endDate:medicineEnd.value||null,notes:medicineNotes.value.trim()};try{await featureRequest("/api/medicines",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});if("Notification" in window && Notification.permission==="default") await Notification.requestPermission();e.target.reset();loadMedicines();showToast("Medicine schedule saved. Keep Swasthrahi open for browser reminders.");}catch(err){showToast(err.message);}});
async function markMedicine(id,taken){try{await featureRequest(`/api/medicines/${id}/taken`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({taken})});loadMedicines();}catch(e){showToast(e.message);}}async function deleteMedicine(id){if(!confirm("Delete this medicine schedule?"))return;try{await featureRequest(`/api/medicines/${id}`,{method:"DELETE"});loadMedicines();}catch(e){showToast(e.message);}}
document.getElementById("qrForm")?.addEventListener("submit",async e=>{e.preventDefault();const payload={patientId:qrPatientId.value,name:qrName.value.trim(),age:qrAge.value,gender:qrGender.value,phone:qrPhone.value,bloodGroup:qrBlood.value,allergies:qrAllergies.value,conditions:qrConditions.value,pastIssues:qrPastIssues.value,treatment:qrTreatment.value,ayushman:qrAyushman.value,emergencyContact:qrEmergency.value,medications:qrMeds.value,sharePatientId:sharePatientId.checked,shareAge:shareAge.checked,sharePhone:sharePhone.checked,sharePastIssues:sharePastIssues.checked,shareAyushman:shareAyushman.checked,shareBloodGroup:shareBlood.checked,shareAllergies:shareAllergies.checked,shareConditions:shareConditions.checked,shareEmergencyContact:shareEmergency.checked,shareMedications:shareMeds.checked};try{const d=await featureRequest("/api/emergency-qr",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const url=location.origin+location.pathname+"?emergency-card="+d.token;const box=document.getElementById("qrResult");box.innerHTML=`<h3>Your Emergency QR Card is ready</h3><div id="qrCodeCanvas"></div><p><a href="${url}" target="_blank" rel="noopener">Open emergency card</a></p><button class="secondary-btn" onclick="navigator.clipboard.writeText('${url}')">Copy QR link</button><p class="feature-note">Keep this QR private. Anyone who scans it can view the selected fields.</p>`;if(window.QRCode)new QRCode(document.getElementById("qrCodeCanvas"),{text:url,width:220,height:220});else box.insertAdjacentHTML("beforeend","<p>QR library did not load. Use the link above.</p>");showToast("Emergency QR card generated.");}catch(err){showToast(err.message);}});
async function revokeEmergencyQR(){if(!confirm("Revoke your current emergency QR? The old QR link will stop working."))return;try{await featureRequest("/api/emergency-qr/revoke",{method:"POST"});document.getElementById("qrResult").textContent="Your emergency QR card has been revoked.";}catch(e){showToast(e.message);}}
async function loadPublicEmergencyCard(token){const box=document.getElementById("publicQRCard");if(!box)return;try{const r=await fetch(GRAMRAHI_API+"/api/emergency-qr/"+encodeURIComponent(token));const d=await r.json();if(!r.ok)throw new Error(d.detail||"Card unavailable");const c=d.card;const rows=[["Patient ID",c.patientId],["Name",c.name],["Age",c.age],["Gender",c.gender],["Phone",c.phone],["Blood group",c.bloodGroup],["Allergies",c.allergies],["Medical conditions",c.conditions],["Past health issues",c.pastIssues],["Current treatment",c.treatment],["Ayushman / ABHA",c.ayushman],["Emergency contact",c.emergencyContact],["Current medicines",c.medications]].filter(x=>x[1]);box.innerHTML="<h2>Emergency details</h2>"+rows.map(x=>`<div class="feature-item"><strong>${escapeFeature(x[0])}</strong><span>${escapeFeature(x[1])}</span></div>`).join("")+`<p class="feature-note">${escapeFeature(d.notice)}</p>`;}catch(e){box.textContent=e.message;}}
const emergencyToken=new URLSearchParams(location.search).get("emergency-card");if(emergencyToken){showPage("emergency-card");loadPublicEmergencyCard(emergencyToken);}
const _swasthrahiShowPage=window.showPage;window.showPage=function(page){_swasthrahiShowPage(page);if(page==="vault")loadVault();if(page==="medicines")loadMedicines();if(page==="qr-card"){qrPatientId.value=localStorage.getItem("patientId")||"";qrName.value=localStorage.getItem("patientName")||"";qrAge.value=localStorage.getItem("patientAge")||"";qrGender.value=localStorage.getItem("patientGender")||"";qrPhone.value=localStorage.getItem("patientPhone")||"";qrPastIssues.value=localStorage.getItem("pastIssues")||"";qrTreatment.value=localStorage.getItem("currentTreatment")||"";qrAyushman.value=localStorage.getItem("ayushmanId")||"";qrBlood.value=localStorage.getItem("bloodGroup")||"";qrAllergies.value=localStorage.getItem("allergies")||"";qrConditions.value=localStorage.getItem("medicalCondition")||"";qrEmergency.value=localStorage.getItem("emergencyContact")||"";}};

async function checkMedicineNotifications(){if(!("Notification" in window)||Notification.permission!=="granted"||!localStorage.getItem("gramrahiAccessToken"))return;try{const d=await featureRequest("/api/medicines");const now=new Date();const hhmm=now.toTimeString().slice(0,5);const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");for(const m of d.medicines){const start=m.start_date||"";const end=m.end_date||"";if(m.schedule===hhmm&&today>=start&&(!end||today<=end)&&!m.takenDates.includes(today)){const key="swasthrahi-notified-"+m.id+"-"+today;if(!localStorage.getItem(key)){new Notification("Medicine reminder",{body:`Time for ${m.medicine} · ${m.dosage}`});localStorage.setItem(key,"1");}}}}catch(_){}}
setInterval(checkMedicineNotifications,30000);

/* Accessible theme toggle */
(function(){const KEY="swasthrahi-theme";function apply(){document.body.classList.toggle("dark-mode",localStorage.getItem(KEY)==="dark");document.querySelectorAll("#themeToggle").forEach(b=>b.textContent=document.body.classList.contains("dark-mode")?"☀️ Light mode":"🌙 Dark mode");}window.toggleTheme=function(){localStorage.setItem(KEY,document.body.classList.contains("dark-mode")?"light":"dark");apply();};document.addEventListener("DOMContentLoaded",()=>{const nav=document.querySelector("#home .language-switch");if(nav&&!document.getElementById("themeToggle")){const b=document.createElement("button");b.id="themeToggle";b.type="button";b.className="theme-toggle";b.onclick=toggleTheme;nav.appendChild(b);}apply();});apply();})();
