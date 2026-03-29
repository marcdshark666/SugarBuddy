const storage = {
  get(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
  },
};

const companions = {
  sunny: { name: "Sunny", species: "species-dog", emoji: "🐶", subtitle: "Golden buddy" },
  mochi: { name: "Mochi", species: "species-cat", emoji: "🐱", subtitle: "Calico cat" },
  pickle: { name: "Pickle", species: "species-dino", emoji: "🦕", subtitle: "Green dino" },
  pingo: { name: "Pingo", species: "species-penguin", emoji: "🐧", subtitle: "Penguin pal" },
};

const daySeed = [
  104, 98, 95, 92, 88, 93, 101, 114, 126, 132, 146, 158,
  171, 186, 204, 212, 198, 183, 169, 155, 141, 129, 118, 110,
  103, 97, 91, 84, 76, 69, 72, 81, 93, 105, 111, 118,
  124, 129, 136, 142, 147, 133, 120, 112, 105, 98, 94, 102,
];

const liveScenario = [102, 108, 116, 128, 142, 154, 172, 189, 206, 214, 196, 178, 161, 143, 126, 111, 98, 84, 68, 78, 92, 104, 116, 122];

const state = {
  unit: storage.get("sockervan-unit", "mmol"),
  selectedCompanion: storage.get("sockervan-companion", "sunny"),
  currentScreen: "home",
  quickOpen: false,
  scenarioIndex: 15,
  showOnboarding: storage.get("sockervan-onboarding-dismissed", false) !== true,
  dailyWindow: daySeed.map((value, index) => ({
    value,
    time: new Date(Date.now() - (daySeed.length - index) * 30 * 60 * 1000),
  })),
  readings: [],
  events: storage.get("sockervan-events", []),
  dexcom: storage.get("sockervan-dexcom", {
    mode: "mock",
    region: "EU",
    environment: "sandbox",
    clientId: "",
    redirectUri: "",
    backendUrl: "",
  }),
  motion: {
    scrollY: window.scrollY || 0,
    scrollImpulse: 0,
  },
};

for (let index = 0; index < 12; index += 1) {
  const value = liveScenario[(state.scenarioIndex - 11 + index + liveScenario.length) % liveScenario.length];
  state.readings.push({
    value,
    time: new Date(Date.now() - (11 - index) * 5 * 60 * 1000),
  });
}

const elements = {
  body: document.body,
  onboarding: document.getElementById("onboarding"),
  confirmCompanion: document.getElementById("confirmCompanion"),
  choiceButtons: Array.from(document.querySelectorAll(".companion-choice")),
  choiceArts: Array.from(document.querySelectorAll(".choice-art")),
  changeBuddyButton: document.getElementById("changeBuddyButton"),
  profileChangeBuddy: document.getElementById("profileChangeBuddy"),
  mainCompanion: document.getElementById("mainCompanion"),
  desktopPet: document.getElementById("desktopPet"),
  desktopShell: document.querySelector(".desktop-pet-shell"),
  moodBubble: document.getElementById("moodBubble"),
  desktopBubble: document.getElementById("desktopBubble"),
  mainShadow: document.querySelector("#mainCompanion .pet-shadow"),
  desktopShadow: document.querySelector("#desktopPet .pet-shadow"),
  brandAvatar: document.getElementById("brandAvatar"),
  buddyName: document.getElementById("buddyName"),
  profileEmoji: document.getElementById("profileEmoji"),
  profileBuddyName: document.getElementById("profileBuddyName"),
  profileBuddySpecies: document.getElementById("profileBuddySpecies"),
  currentValue: document.getElementById("currentValue"),
  currentUnit: document.getElementById("currentUnit"),
  trendPill: document.getElementById("trendPill"),
  readingSummary: document.getElementById("readingSummary"),
  lastSync: document.getElementById("lastSync"),
  streakValue: document.getElementById("streakValue"),
  heartPct: document.getElementById("heartPct"),
  snackPct: document.getElementById("snackPct"),
  waterPct: document.getElementById("waterPct"),
  heartNote: document.getElementById("heartNote"),
  snackNote: document.getElementById("snackNote"),
  waterNote: document.getElementById("waterNote"),
  heartBar: document.getElementById("heartBar"),
  snackBar: document.getElementById("snackBar"),
  waterBar: document.getElementById("waterBar"),
  companionInsightTitle: document.getElementById("companionInsightTitle"),
  companionInsightBody: document.getElementById("companionInsightBody"),
  timeline: document.getElementById("timeline"),
  tirRing: document.getElementById("tirRing"),
  tirValue: document.getElementById("tirValue"),
  avgValue: document.getElementById("avgValue"),
  gmiValue: document.getElementById("gmiValue"),
  stdDevValue: document.getElementById("stdDevValue"),
  bestStreak: document.getElementById("bestStreak"),
  highValue: document.getElementById("highValue"),
  inRangeValue: document.getElementById("inRangeValue"),
  lowValue: document.getElementById("lowValue"),
  authPreview: document.getElementById("authPreview"),
  integrationSummary: document.getElementById("integrationSummary"),
  sandboxHint: document.getElementById("sandboxHint"),
  cloudStatus: document.getElementById("cloudStatus"),
  heroMood: document.getElementById("heroMood"),
  unitButtons: Array.from(document.querySelectorAll("[data-unit]")),
  navButtons: Array.from(document.querySelectorAll("[data-screen-target]")),
  screens: Array.from(document.querySelectorAll(".screen")),
  fabButton: document.getElementById("fabButton"),
  quickActions: document.getElementById("quickActions"),
  quickButtons: Array.from(document.querySelectorAll("[data-quick-action]")),
  trendArea: document.getElementById("trendArea"),
  trendLine: document.getElementById("trendLine"),
  trendDots: document.getElementById("trendDots"),
  chartLabelStart: document.getElementById("chartLabelStart"),
  chartLabelMid: document.getElementById("chartLabelMid"),
  chartLabelEnd: document.getElementById("chartLabelEnd"),
  modeButtons: Array.from(document.querySelectorAll("[data-mode]")),
  regionSelect: document.getElementById("regionSelect"),
  environmentSelect: document.getElementById("environmentSelect"),
  clientIdInput: document.getElementById("clientIdInput"),
  redirectUriInput: document.getElementById("redirectUriInput"),
  backendUrlInput: document.getElementById("backendUrlInput"),
  buildAuthButton: document.getElementById("buildAuthButton"),
  copyAuthButton: document.getElementById("copyAuthButton"),
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function mgdlToMmol(value) {
  return value / 18;
}

function round(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function formatGlucose(value) {
  return state.unit === "mgdl" ? `${Math.round(value)}` : `${round(mgdlToMmol(value), 1).toFixed(1)}`;
}

function formatAverage(value) {
  return state.unit === "mgdl" ? `${Math.round(value)} mg/dL` : `${round(mgdlToMmol(value), 1).toFixed(1)} mmol/L`;
}

function getTrend(previousValue, currentValue) {
  const diff = currentValue - previousValue;
  if (diff >= 16) return { key: "up", label: "↗ Stiger", short: "Stiger" };
  if (diff >= 8) return { key: "slightly-up", label: "↗ Lite upp", short: "Lite upp" };
  if (diff <= -16) return { key: "down", label: "↘ Sjunker", short: "Sjunker" };
  if (diff <= -8) return { key: "slightly-down", label: "↘ Lite ned", short: "Lite ned" };
  return { key: "flat", label: "→ Stabil", short: "Stabil" };
}

function computeStreak(readings) {
  let count = 0;
  for (let index = readings.length - 1; index >= 0; index -= 1) {
    const value = readings[index].value;
    if (value >= 70 && value <= 180) {
      count += 1;
    } else {
      break;
    }
  }
  return count * 5;
}

function computeBestStreak(values) {
  let best = 0;
  let current = 0;
  values.forEach((value) => {
    if (value >= 70 && value <= 180) {
      current += 30;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });
  return best;
}

function getMoodState(reading, trend, streakMinutes) {
  if (reading.value < 70) {
    return {
      mood: "weak",
      label: "Lågt",
      petText: "är skakig och vill ha snabb hjälp.",
      summary: "Lågt värde gör att din buddy blir skör och ber om snabb omtanke.",
    };
  }
  if (reading.value > 180) {
    return {
      mood: "sleepy",
      label: "Högt",
      petText: "är trött, varm och törstig.",
      summary: "Höga värden gör att din buddy blir långsam och börjar längta efter vatten.",
    };
  }
  if (trend.key.includes("up") && reading.value > 145) {
    return {
      mood: "cautious",
      label: "På väg upp",
      petText: "märker att kurvan vill stiga.",
      summary: "När kurvan börjar lyfta blir din buddy vaksam och mindre avslappnad.",
    };
  }
  if (streakMinutes >= 60) {
    return {
      mood: "sparkly",
      label: "Optimal zon",
      petText: "glittrar efter en längre stund i målområdet.",
      summary: "Över en timme i målområdet förvandlar din buddy till sitt allra gladaste läge.",
    };
  }
  if (streakMinutes >= 30) {
    return {
      mood: "playful",
      label: "I mål",
      petText: "börjar leka och mjukna upp.",
      summary: "Efter ungefär 30 minuter i målområdet blir humöret tydligt gladare och lättare.",
    };
  }
  return {
    mood: "calm",
    label: "Stabil",
    petText: "är lugn och trygg.",
    summary: "Stabila värden håller din buddy trygg, lugn och balanserad.",
  };
}

function calculateMetrics() {
  const values = state.dailyWindow.map((entry) => entry.value);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const tir = values.filter((value) => value >= 70 && value <= 180).length / values.length;
  const high = values.filter((value) => value > 180).length / values.length;
  const low = values.filter((value) => value < 70).length / values.length;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const gmi = (average + 46.7) / 28.7;
  return {
    average,
    tir: round(tir * 100),
    high: round(high * 100),
    low: round(low * 100),
    stdDev: round(stdDev),
    gmi: round(gmi, 1),
    bestStreak: computeBestStreak(values),
  };
}

function formatRelativeTime(date) {
  const diffMinutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (diffMinutes < 2) return "nyss";
  if (diffMinutes < 60) return `${diffMinutes} min sedan`;
  return `${Math.round(diffMinutes / 60)} h sedan`;
}

function formatClock(date) {
  return date.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

function updateCompanionClasses(target, speciesClass, moodClass) {
  target.className = `companion-avatar ${target.id === "desktopPet" ? "desktop-pet " : ""}${speciesClass} mood-${moodClass}`;
}

function renderNeeds(mood, value, streakMinutes) {
  let heart = 84;
  let snack = 86;
  let water = 88;
  let heartNote = "Stabil rytm när kurvan ligger fint.";
  let snackNote = "Mätt och nöjd utan stresspåslag.";
  let waterNote = "God ork och ingen törstig känsla.";
  let insightTitle = "När värdena håller sig fina börjar din buddy leka.";
  let insightBody = "Efter 30 minuter i målområdet blir humöret lättare. Efter 60 minuter kommer det riktiga glittret.";

  if (mood === "sleepy") {
    heart = 54; snack = 58; water = 34;
    heartNote = "Höga värden gör att pulsen känns trögare.";
    snackNote = "Maten känns tung när glukoset går högt.";
    waterNote = "Tydlig törstsignal. Vatten blir viktigt.";
    insightTitle = "När glukoset blir högt blir din buddy trött och törstig.";
    insightBody = "Det här är läget där figuren tappar energi, blinkar långsammare och helst vill vila tills kurvan kommer ned igen.";
  } else if (mood === "weak") {
    heart = 36; snack = 18; water = 62;
    heartNote = "Låga värden gör att kompisen blir skakig.";
    snackNote = "Snabb energi behövs för att komma tillbaka.";
    waterNote = "Vätskan är okej, men sockret behöver hjälp först.";
    insightTitle = "Vid låga värden visar buddy tydligt att något inte känns bra.";
    insightBody = "Figuren kryper ihop, rör sig mindre och ber om snabb hjälp. Det ska kännas direkt när kurvan blir för låg.";
  } else if (mood === "cautious") {
    heart = 76; snack = 72; water = 74;
    heartNote = "Kompisen känner att kurvan lutar uppåt.";
    snackNote = "Det börjar bli lite mindre harmoniskt.";
    waterNote = "Lättare törst innan det blir riktigt högt.";
    insightTitle = "Din buddy märker uppgången innan det blir fullt rött.";
    insightBody = "Det här mellanläget ska kännas som en mjuk varning: fortfarande okej, men inte lika avslappnat som i optimal zon.";
  } else if (mood === "playful") {
    heart = 94; snack = 88; water = 92;
    heartNote = "Jämn kurva ger trygg energi.";
    snackNote = "Lugn mage och mjuk rytm i dagen.";
    waterNote = "Piggt läge utan törstpåslag.";
    insightTitle = "Efter ungefär 30 minuter i målområdet blir kompisen lekfull.";
    insightBody = "Just här börjar figuren röra sig mer, bli social och ge små positiva reaktioner under grafen.";
  } else if (mood === "sparkly") {
    heart = 99; snack = 94; water = 95;
    heartNote = "Maxad trygghet med lång balansstreak.";
    snackNote = "Stabil energi och ett mjukt flow.";
    waterNote = "Bra vätskenivå och lätt känsla i kroppen.";
    insightTitle = "Över en timme i målområdet låser upp det gladaste läget.";
    insightBody = "Tanken är att du verkligen ska känna när du haft en fin period. Buddy blir stolt, rör sig mer och kan få små celebration-effekter.";
  }

  if (value > 220) water = 22;
  if (streakMinutes > 75 && mood !== "sleepy" && mood !== "weak") heart = clamp(heart + 4, 0, 100);

  elements.heartPct.textContent = `${heart}%`;
  elements.snackPct.textContent = `${snack}%`;
  elements.waterPct.textContent = `${water}%`;
  elements.heartNote.textContent = heartNote;
  elements.snackNote.textContent = snackNote;
  elements.waterNote.textContent = waterNote;
  elements.heartBar.style.width = `${heart}%`;
  elements.snackBar.style.width = `${snack}%`;
  elements.waterBar.style.width = `${water}%`;
  elements.companionInsightTitle.textContent = insightTitle;
  elements.companionInsightBody.textContent = insightBody;
}

function renderChart() {
  const points = state.readings.slice(-12).map((entry, index, list) => {
    const unitValue = state.unit === "mgdl" ? entry.value : mgdlToMmol(entry.value);
    const min = state.unit === "mgdl" ? 50 : 2.8;
    const max = state.unit === "mgdl" ? 240 : 13.3;
    const normalized = clamp((unitValue - min) / (max - min), 0, 1);
    const x = 10 + (index * 300) / (list.length - 1);
    const y = 78 - normalized * 58;
    return { x: round(x, 1), y: round(y, 1) };
  });

  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} 84 L ${points[0].x} 84 Z`;
  elements.trendLine.setAttribute("d", linePath);
  elements.trendArea.setAttribute("d", areaPath);
  elements.trendDots.innerHTML = `<circle cx="${points[points.length - 1].x}" cy="${points[points.length - 1].y}" r="5"></circle>`;

  elements.chartLabelStart.textContent = formatClock(state.readings[0].time);
  elements.chartLabelMid.textContent = formatClock(state.readings[Math.floor(state.readings.length / 2)].time);
  elements.chartLabelEnd.textContent = formatClock(state.readings[state.readings.length - 1].time);
}

function renderInsights() {
  const metrics = calculateMetrics();
  elements.tirRing.style.setProperty("--tir", metrics.tir);
  elements.tirRing.style.setProperty("--high", metrics.high);
  elements.tirValue.textContent = `${metrics.tir}%`;
  elements.avgValue.textContent = formatAverage(metrics.average);
  elements.gmiValue.textContent = `${metrics.gmi}%`;
  elements.stdDevValue.textContent = `${metrics.stdDev}`;
  elements.bestStreak.textContent = `${metrics.bestStreak} min`;
  elements.highValue.textContent = `${metrics.high}%`;
  elements.inRangeValue.textContent = `${metrics.tir}%`;
  elements.lowValue.textContent = `${metrics.low}%`;
}

function defaultEvents() {
  const now = Date.now();
  return [
    { id: "seed-walk", icon: "🚶", title: "Lätt promenad", note: "25 minuter runt kvarteret gav mjukare kurva.", value: "", time: new Date(now - 70 * 60 * 1000).toISOString() },
    { id: "seed-insulin", icon: "💉", title: "Insulin loggat", note: "4.0U snabbverkande registrerad.", value: "4.0U", time: new Date(now - 120 * 60 * 1000).toISOString() },
    { id: "seed-meal", icon: "🍽", title: "Lunch", note: "65 g kolhydrater inlagda i loggen.", value: "65g", time: new Date(now - 150 * 60 * 1000).toISOString() },
    { id: "seed-water", icon: "💧", title: "Vatten", note: "500 ml registrerat för att stötta hydrering.", value: "500ml", time: new Date(now - 185 * 60 * 1000).toISOString() },
  ];
}

function renderTimeline(mood, latest, trend) {
  const companion = companions[state.selectedCompanion];
  const systemEvent = {
    id: "system-live",
    icon: mood.mood === "sleepy" ? "😴" : mood.mood === "weak" ? "🧃" : mood.mood === "sparkly" ? "✨" : "🫶",
    title: `${companion.name} reagerar just nu`,
    note: mood.summary,
    value: state.unit === "mgdl" ? `${Math.round(latest.value)}` : `${round(mgdlToMmol(latest.value), 1).toFixed(1)}`,
    time: latest.time.toISOString(),
  };

  const combined = [systemEvent, ...state.events, ...defaultEvents()]
    .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
    .slice(0, 7);

  elements.timeline.innerHTML = combined.map((event) => `
    <article class="timeline-item">
      <div class="timeline-icon">${event.icon}</div>
      <div class="timeline-body">
        <span>${formatClock(new Date(event.time))}</span>
        <strong>${event.title}</strong>
        <p>${event.note}</p>
      </div>
      <div class="timeline-value">${event.value || trend.short}</div>
    </article>
  `).join("");
}

function renderCompanion() {
  const companion = companions[state.selectedCompanion];
  const latest = state.readings[state.readings.length - 1];
  const previous = state.readings[state.readings.length - 2] || latest;
  const trend = getTrend(previous.value, latest.value);
  const streakMinutes = computeStreak(state.readings);
  const mood = getMoodState(latest, trend, streakMinutes);

  updateCompanionClasses(elements.mainCompanion, companion.species, mood.mood);
  updateCompanionClasses(elements.desktopPet, companion.species, mood.mood);
  elements.body.dataset.mood = mood.mood;
  elements.brandAvatar.textContent = companion.emoji;
  elements.buddyName.textContent = companion.name;
  elements.profileEmoji.textContent = companion.emoji;
  elements.profileBuddyName.textContent = companion.name;
  elements.profileBuddySpecies.textContent = companion.subtitle;
  elements.moodBubble.textContent = `${companion.name} ${mood.petText}`;
  elements.desktopBubble.textContent = `${companion.name} ${mood.petText}`;
  elements.heroMood.textContent = `${companion.name}: ${mood.label.toLowerCase()}`;
  elements.readingSummary.textContent = mood.summary;
  elements.currentValue.textContent = formatGlucose(latest.value);
  elements.currentUnit.textContent = state.unit === "mgdl" ? "mg/dL" : "mmol/L";
  elements.trendPill.textContent = trend.label;
  elements.lastSync.textContent = formatRelativeTime(latest.time);
  elements.streakValue.textContent = `${streakMinutes} min`;

  renderNeeds(mood.mood, latest.value, streakMinutes);
  renderInsights();
  renderTimeline(mood, latest, trend);
  renderChart();
}

function showOnboarding(visible) {
  elements.onboarding.classList.toggle("is-visible", visible);
}

function selectCompanion(key) {
  state.selectedCompanion = key;
  storage.set("sockervan-companion", key);
  elements.choiceButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.companion === key);
  });
  elements.confirmCompanion.textContent = `Starta med ${companions[key].name}`;
  renderCompanion();
}

function switchScreen(screen) {
  state.currentScreen = screen;
  elements.screens.forEach((section) => {
    section.classList.toggle("is-active", section.dataset.screen === screen);
  });
  elements.navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.screenTarget === screen);
  });
}

function toggleQuickActions(forceOpen = !state.quickOpen) {
  state.quickOpen = forceOpen;
  elements.quickActions.classList.toggle("is-open", state.quickOpen);
  elements.quickActions.setAttribute("aria-hidden", state.quickOpen ? "false" : "true");
}

function addQuickEvent(type) {
  const timestamp = new Date().toISOString();
  const templates = {
    meal: { icon: "🍽", title: "Måltid loggad", note: "30 g kolhydrater registrerades i snabbmenyn.", value: "30g" },
    insulin: { icon: "💉", title: "Insulin loggat", note: "2.5U snabbverkande registrerat i stunden.", value: "2.5U" },
    walk: { icon: "🚶", title: "Promenad loggad", note: "18 min lugn rörelse tillagd i journalen.", value: "18m" },
    water: { icon: "💧", title: "Vatten loggat", note: "300 ml vatten lades till i journalen.", value: "300ml" },
  };
  const template = templates[type];
  if (!template) return;
  state.events.unshift({ id: `${type}-${Date.now()}`, type, time: timestamp, ...template });
  state.events = state.events.slice(0, 12);
  storage.set("sockervan-events", state.events);
  toggleQuickActions(false);
  switchScreen("journal");
  renderCompanion();
}

function resolveDexcomBase(region, environment) {
  if (environment === "sandbox") return "https://sandbox-api.dexcom.com";
  if (region === "US") return "https://api.dexcom.com";
  if (region === "JP") return "https://api.dexcom.jp";
  return "https://api.dexcom.eu";
}

function buildDexcomAuthUrl() {
  const { clientId, redirectUri, region, environment } = state.dexcom;
  if (!clientId || !redirectUri) return "Lägg in Client ID och Redirect URI för att skapa en OAuth-länk.";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "offline_access",
    state: "sockervan-demo-state",
  });
  return `${resolveDexcomBase(region, environment)}/v3/oauth2/login?${params.toString()}`;
}

function renderDexcomPanel() {
  elements.regionSelect.value = state.dexcom.region;
  elements.environmentSelect.value = state.dexcom.environment;
  elements.clientIdInput.value = state.dexcom.clientId;
  elements.redirectUriInput.value = state.dexcom.redirectUri;
  elements.backendUrlInput.value = state.dexcom.backendUrl;
  elements.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.dexcom.mode);
  });
  elements.authPreview.textContent = buildDexcomAuthUrl();

  if (state.dexcom.mode === "mock") {
    elements.integrationSummary.textContent = "Demo-läge visar en mockad Dexcom-ström och låter dig trimma buddy-reaktionerna utan att logga in.";
    elements.cloudStatus.textContent = "Mockad Dexcom-ström aktiv";
  } else {
    const regionLabel = state.dexcom.environment === "sandbox" ? "Sandbox" : state.dexcom.region;
    elements.integrationSummary.textContent = `Dexcom ${regionLabel} är valt. Riktig inloggning bör skickas via backend eftersom Dexcom vill ha tokens lagrade på servern.`;
    elements.cloudStatus.textContent = `Dexcom ${regionLabel} förberedd`;
  }

  if (state.dexcom.environment === "sandbox") {
    elements.sandboxHint.innerHTML = 'För G7-test i sandbox rekommenderas kontot <code>SandboxUser7</code> enligt Dexcoms dokumentation.';
  } else if (state.dexcom.region === "EU") {
    elements.sandboxHint.innerHTML = 'EU-läge använder <code>api.dexcom.eu</code>. Dexcom anger dessutom att data från mobilappen normalt har cirka 3 timmars fördröjning utanför USA.';
  } else {
    elements.sandboxHint.innerHTML = 'US-läge använder <code>api.dexcom.com</code>. I USA anger Dexcom cirka 1 timmes datafördröjning för mobiluppladdad data.';
  }
}

function saveDexcomState() {
  storage.set("sockervan-dexcom", state.dexcom);
  renderDexcomPanel();
}

function stepSimulation() {
  state.scenarioIndex = (state.scenarioIndex + 1) % liveScenario.length;
  const nextValue = liveScenario[state.scenarioIndex];
  const nextReading = { value: nextValue, time: new Date() };
  state.readings.push(nextReading);
  state.readings = state.readings.slice(-12);
  state.dailyWindow.push({ value: nextValue, time: new Date() });
  state.dailyWindow = state.dailyWindow.slice(-48);
  renderCompanion();
}

let desktopPosition = 18;
let desktopDirection = 1;
function updateScrollMotion() {
  const nextY = window.scrollY || window.pageYOffset || 0;
  const delta = nextY - state.motion.scrollY;
  state.motion.scrollY = nextY;
  state.motion.scrollImpulse = clamp(state.motion.scrollImpulse + delta * 0.22, -24, 24);
}

function animateScene(now) {
  const speedMap = { calm: 0.32, playful: 0.56, sparkly: 0.72, sleepy: 0.18, weak: 0.12, cautious: 0.42 };
  const currentMood = document.body.dataset.mood || "calm";
  const speed = speedMap[currentMood] || 0.32;
  const maxPosition = Math.max(18, window.innerWidth - 280);
  const sceneTime = now / 1000;
  const scrollWave = state.motion.scrollImpulse;

  desktopPosition += desktopDirection * speed;
  if (desktopPosition >= maxPosition || desktopPosition <= 18) desktopDirection *= -1;
  state.motion.scrollImpulse *= 0.88;

  const mainBob = Math.sin(sceneTime * 3) * 5 + Math.cos(sceneTime * 1.8) * 1.6;
  const mainLift = -scrollWave * 0.6;
  const mainTilt = Math.sin(sceneTime * 2.1) * 1.6 + scrollWave * 0.28;
  elements.mainCompanion.style.transform =
    `translateX(-50%) translateY(${(mainBob + mainLift).toFixed(2)}px) rotate(${mainTilt.toFixed(2)}deg)`;
  elements.moodBubble.style.transform =
    `translateX(-50%) translateY(${(Math.sin(sceneTime * 2.5 + 0.3) * 2.5 - scrollWave * 0.16).toFixed(2)}px)`;

  if (elements.mainShadow) {
    const mainShadowScale = 1 - (mainBob + mainLift) / 80 + Math.abs(scrollWave) * 0.006;
    elements.mainShadow.style.transform = `scaleX(${mainShadowScale.toFixed(3)})`;
  }

  if (elements.desktopShell) {
    const desktopBob = Math.sin(sceneTime * 3.2 + 0.6) * 4 + Math.cos(sceneTime * 2.2) * 1.4;
    const desktopTilt = Math.sin(sceneTime * 2.8) * 1.8 + scrollWave * 0.16;
    elements.desktopShell.style.transform =
      `translate3d(${desktopPosition.toFixed(2)}px, ${(desktopBob - scrollWave * 0.24).toFixed(2)}px, 0) rotate(${desktopTilt.toFixed(2)}deg)`;
    if (elements.desktopShadow) {
      const desktopShadowScale = 1 - desktopBob / 95 + Math.abs(scrollWave) * 0.004;
      elements.desktopShadow.style.transform = `scaleX(${desktopShadowScale.toFixed(3)})`;
    }
  }

  elements.choiceButtons.forEach((button, index) => {
    const isSelected = button.dataset.companion === state.selectedCompanion;
    const phase = index * 0.85;
    const bob = Math.sin(sceneTime * 3.4 + phase) * 5.5 + Math.cos(sceneTime * 1.9 + phase) * 1.4;
    const tilt = Math.sin(sceneTime * 2.6 + phase) * 1.5 + scrollWave * (index % 2 === 0 ? 0.05 : -0.05);
    const lift = isSelected ? -6 : 0;
    button.style.transform =
      `translateY(${(lift + bob * 0.28 - scrollWave * 0.08).toFixed(2)}px) rotate(${tilt.toFixed(2)}deg)`;
  });

  elements.choiceArts.forEach((art, index) => {
    const phase = index * 0.8;
    const bounce = Math.sin(sceneTime * 3.8 + phase) * 6 + Math.cos(sceneTime * 2.3 + phase) * 2;
    const twist = Math.sin(sceneTime * 2.7 + phase) * 4.6;
    const scale = 1 + Math.sin(sceneTime * 2.1 + phase) * 0.035;
    art.style.transform =
      `translateY(${bounce.toFixed(2)}px) rotate(${twist.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
  });

  window.requestAnimationFrame(animateScene);
}

function bindEvents() {
  elements.choiceButtons.forEach((button) => {
    button.addEventListener("click", () => selectCompanion(button.dataset.companion));
  });

  elements.confirmCompanion.addEventListener("click", () => {
    state.showOnboarding = false;
    storage.set("sockervan-onboarding-dismissed", true);
    showOnboarding(false);
  });

  [elements.changeBuddyButton, elements.profileChangeBuddy].forEach((button) => {
    button.addEventListener("click", () => showOnboarding(true));
  });

  elements.unitButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.unit = button.dataset.unit;
      storage.set("sockervan-unit", state.unit);
      elements.unitButtons.forEach((unitButton) => {
        unitButton.classList.toggle("is-active", unitButton.dataset.unit === state.unit);
      });
      renderCompanion();
    });
  });

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => switchScreen(button.dataset.screenTarget));
  });

  elements.fabButton.addEventListener("click", () => toggleQuickActions());
  elements.quickButtons.forEach((button) => {
    button.addEventListener("click", () => addQuickEvent(button.dataset.quickAction));
  });

  elements.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.dexcom.mode = button.dataset.mode;
      saveDexcomState();
    });
  });

  elements.regionSelect.addEventListener("change", (event) => {
    state.dexcom.region = event.target.value;
    saveDexcomState();
  });

  elements.environmentSelect.addEventListener("change", (event) => {
    state.dexcom.environment = event.target.value;
    saveDexcomState();
  });

  elements.clientIdInput.addEventListener("input", (event) => {
    state.dexcom.clientId = event.target.value.trim();
    saveDexcomState();
  });

  elements.redirectUriInput.addEventListener("input", (event) => {
    state.dexcom.redirectUri = event.target.value.trim();
    saveDexcomState();
  });

  elements.backendUrlInput.addEventListener("input", (event) => {
    state.dexcom.backendUrl = event.target.value.trim();
    saveDexcomState();
  });

  elements.buildAuthButton.addEventListener("click", () => {
    elements.authPreview.textContent = buildDexcomAuthUrl();
  });

  elements.copyAuthButton.addEventListener("click", async () => {
    const link = buildDexcomAuthUrl();
    try {
      await navigator.clipboard.writeText(link);
      elements.integrationSummary.textContent = "OAuth-länken är kopierad till urklipp.";
    } catch {
      elements.integrationSummary.textContent = "Kopiering misslyckades i denna miljö, men länken visas i rutan nedanför.";
    }
  });

  document.addEventListener("click", (event) => {
    const clickedInside = event.target.closest(".fab, .quick-actions, .soft-action");
    if (!clickedInside && state.quickOpen) toggleQuickActions(false);
  });

  window.addEventListener("scroll", updateScrollMotion, { passive: true });
  window.addEventListener("resize", () => {
    desktopPosition = clamp(desktopPosition, 18, Math.max(18, window.innerWidth - 280));
  });
}

function init() {
  elements.unitButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.unit === state.unit);
  });
  selectCompanion(state.selectedCompanion);
  switchScreen("home");
  renderDexcomPanel();
  showOnboarding(state.showOnboarding);
  bindEvents();
  window.setInterval(stepSimulation, 6000);
  window.requestAnimationFrame(animateScene);
}

init();
