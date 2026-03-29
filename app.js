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

const GLUCOSE_RULES = {
  lowSleepyMax: 72,
  targetMin: 81,
  targetMax: 126,
  highSadMin: 135,
  veryHighMin: 216,
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
  auth: storage.get("sockervan-auth", {
    status: "locked",
    lastProvider: "demo",
  }),
  motion: {
    scrollY: window.scrollY || 0,
    overlayScrollY: 0,
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
  onboardingPanel: document.querySelector(".onboarding-panel"),
  authGate: document.getElementById("authGate"),
  authPanel: document.getElementById("authPanel") || document.querySelector(".auth-panel"),
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
  authBuddyEmoji: document.getElementById("authBuddyEmoji"),
  authBuddyName: document.getElementById("authBuddyName"),
  authBuddySubtitle: document.getElementById("authBuddySubtitle"),
  authCompanion: document.getElementById("authCompanion"),
  authBubble: document.getElementById("authBubble"),
  authGateMessage: document.getElementById("authGateMessage"),
  authGateStatus: document.getElementById("authGateStatus"),
  authDexcomButton: document.getElementById("authDexcomButton"),
  authDemoButton: document.getElementById("authDemoButton"),
  authBackButton: document.getElementById("authBackButton"),
  authSetupButton: document.getElementById("authSetupButton"),
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
    if (value >= GLUCOSE_RULES.targetMin && value <= GLUCOSE_RULES.targetMax) {
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
    if (value >= GLUCOSE_RULES.targetMin && value <= GLUCOSE_RULES.targetMax) {
      current += 30;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  });
  return best;
}

function getMoodState(reading, trend, streakMinutes) {
  if (reading.value < GLUCOSE_RULES.lowSleepyMax) {
    return {
      statusKey: "low",
      moodClass: "sleepy",
      label: "Lågt",
      petText: "ar somnig och lite lag.",
      summary: "Under 4.0 mmol/L blir din buddy somnig och tappar fart tills varden kommer upp igen.",
    };
  }

  if (reading.value < GLUCOSE_RULES.targetMin) {
    return {
      statusKey: "edge-low",
      moodClass: "cautious",
      label: "Lite lågt",
      petText: "kanner sig lite skakig och forsiktig.",
      summary: "Mellan 4.0 och 4.5 mmol/L blir din buddy mer forsiktig och vill att kurvan stiger lite.",
    };
  }

  if (reading.value > GLUCOSE_RULES.veryHighMin) {
    return {
      statusKey: "very-high",
      moodClass: "sleepy",
      label: "Mycket högt",
      petText: "ar hangig, tung och valdigt trott.",
      summary: "Over 12 mmol/L blir din buddy hangig och riktigt seg i kroppen.",
    };
  }

  if (reading.value >= GLUCOSE_RULES.highSadMin) {
    return {
      statusKey: "high",
      moodClass: "cautious",
      label: "Lite högt",
      petText: "ar lite ledsen och mindre lekfull.",
      summary: "Mellan 7.5 och 12 mmol/L blir din buddy lite ledsen och mindre avslappnad.",
    };
  }

  if (reading.value > GLUCOSE_RULES.targetMax || trend.key.includes("up")) {
    return {
      statusKey: "edge-high",
      moodClass: "cautious",
      label: "Pa vag upp",
      petText: "kanner att kurvan ligger lite over kanten.",
      summary: "Mellan 7.0 och 7.5 mmol/L ar din buddy inte ledsen an, men den blir mer vaksam.",
    };
  }

  if (streakMinutes >= 60) {
    return {
      statusKey: "sparkly",
      moodClass: "sparkly",
      label: "Optimal zon",
      petText: "glittrar efter en lang fin stund i zonen.",
      summary: "Over en timme mellan 4.5 och 7.0 mmol/L gor din buddy riktigt glad.",
    };
  }

  if (streakMinutes >= 30) {
    return {
      statusKey: "playful",
      moodClass: "playful",
      label: "I mal",
      petText: "borjar leka och mjukna upp.",
      summary: "Efter ungefar 30 minuter mellan 4.5 och 7.0 mmol/L blir din buddy mer lekfull.",
    };
  }

  return {
    statusKey: "steady",
    moodClass: "calm",
    label: "Stabil",
    petText: "ar lugn och trygg.",
    summary: "Mellan 4.5 och 7.0 mmol/L mar din buddy bra och kanner sig trygg.",
  };
}

function calculateMetrics() {
  const values = state.dailyWindow.map((entry) => entry.value);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const tir = values.filter((value) => value >= GLUCOSE_RULES.targetMin && value <= GLUCOSE_RULES.targetMax).length / values.length;
  const high = values.filter((value) => value > GLUCOSE_RULES.targetMax).length / values.length;
  const low = values.filter((value) => value < GLUCOSE_RULES.targetMin).length / values.length;
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
  if (!target) return;
  const roleClass =
    target.id === "desktopPet" ? "desktop-pet" :
    target.id === "authCompanion" ? "auth-companion" :
    "";
  target.className = ["companion-avatar", roleClass, speciesClass, `mood-${moodClass}`]
    .filter(Boolean)
    .join(" ");
}

function renderNeeds(statusKey, value, streakMinutes) {
  let heart = 84;
  let snack = 86;
  let water = 88;
  let heartNote = "Stabil rytm nar kurvan ligger fint.";
  let snackNote = "Matt och nojd utan stresspaslag.";
  let waterNote = "God ork och ingen torstig kansla.";
  let insightTitle = "Nar vardena ligger mellan 4.5 och 7.0 mar din buddy bra.";
  let insightBody = "Det ar den nya glada zonen i appen, och all companionlogik bygger pa just den spannvidden.";

  if (statusKey === "low") {
    heart = 34; snack = 22; water = 64;
    heartNote = "Under 4.0 mmol/L blir kompisen somnig.";
    snackNote = "Snabb energi behovs for att komma tillbaka.";
    waterNote = "Vatskan ar okej, men sockret behover hjalp forst.";
    insightTitle = "Under 4.0 mmol/L blir buddy somnig och tung.";
    insightBody = "Det ska synas tydligt i figuren att laget ar lagre och att den tappat fart.";
  } else if (statusKey === "edge-low") {
    heart = 58; snack = 46; water = 74;
    heartNote = "Lite lagt gor buddy mer forsiktig.";
    snackNote = "Den vill ha lite mer trygg energi.";
    waterNote = "Ingen stor torst, bara mindre ork.";
    insightTitle = "Mellan 4.0 och 4.5 mmol/L blir buddy pa sin vakt.";
    insightBody = "Det ar inte kraschat, men det ar heller inte helt avslappnat.";
  } else if (statusKey === "very-high") {
    heart = 42; snack = 48; water = 22;
    heartNote = "Over 12 mmol/L blir buddy riktigt hangig.";
    snackNote = "Allt kanns tungt och segt.";
    waterNote = "Tydlig torstsignal. Vatten blir viktigt.";
    insightTitle = "Over 12 mmol/L blir buddy hangig och trott.";
    insightBody = "Det har ar det tyngsta hoga laget, med mindre ork och mer dropp i rorelserna.";
  } else if (statusKey === "high") {
    heart = 68; snack = 62; water = 42;
    heartNote = "Mellan 7.5 och 12 mmol/L blir buddy lite ledsen.";
    snackNote = "Maten och rytmen kanns inte lika harmoniska.";
    waterNote = "Mer torstig kansla an i malzonen.";
    insightTitle = "Mellan 7.5 och 12 mmol/L blir buddy lite ledsen.";
    insightBody = "Det ar har du ville ha en mjukare sorgsen reaktion i stallet for full kris.";
  } else if (statusKey === "edge-high") {
    heart = 78; snack = 74; water = 70;
    heartNote = "Kurvan ar lite over kanten.";
    snackNote = "Det borjar bli mindre harmoniskt.";
    waterNote = "Latt torst innan det blir hogt pa riktigt.";
    insightTitle = "Mellan 7.0 och 7.5 mmol/L blir buddy mer vaksam.";
    insightBody = "Det ar over okej-zonen, men inte i det ledsna laget an.";
  } else if (statusKey === "playful") {
    heart = 94; snack = 88; water = 92;
    heartNote = "Jamn kurva ger trygg energi.";
    snackNote = "Lugn mage och mjuk rytm i dagen.";
    waterNote = "Piggt lage utan torstpaslag.";
    insightTitle = "Efter 30 minuter mellan 4.5 och 7.0 blir kompisen lekfull.";
    insightBody = "Just har borjar figuren rora sig mer, bli social och ge positiva reaktioner under grafen.";
  } else if (statusKey === "sparkly") {
    heart = 99; snack = 94; water = 95;
    heartNote = "Maxad trygghet med lang balansstreak.";
    snackNote = "Stabil energi och ett mjukt flow.";
    waterNote = "Bra vatskeniva och latt kansla i kroppen.";
    insightTitle = "Over en timme i 4.5 till 7.0 mmol/L laser upp gladast laget.";
    insightBody = "Har blir buddy riktigt lycklig, med mer studs och roligare animering.";
  }

  if (value > GLUCOSE_RULES.veryHighMin) water = 18;
  if (streakMinutes > 75 && !["low", "very-high", "high"].includes(statusKey)) heart = clamp(heart + 4, 0, 100);

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
    icon:
      mood.statusKey === "sparkly" ? "✨" :
      mood.statusKey === "playful" ? "🫶" :
      mood.statusKey === "low" ? "😴" :
      mood.statusKey === "high" ? "🥲" :
      mood.statusKey === "very-high" ? "🥵" :
      "📈",
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

  updateCompanionClasses(elements.mainCompanion, companion.species, mood.moodClass);
  updateCompanionClasses(elements.desktopPet, companion.species, mood.moodClass);
  updateCompanionClasses(elements.authCompanion, companion.species, mood.moodClass);
  elements.body.dataset.mood = mood.moodClass;
  elements.brandAvatar.textContent = companion.emoji;
  elements.buddyName.textContent = companion.name;
  elements.profileEmoji.textContent = companion.emoji;
  elements.profileBuddyName.textContent = companion.name;
  elements.profileBuddySpecies.textContent = companion.subtitle;
  elements.moodBubble.textContent = `${companion.name} ${mood.petText}`;
  elements.desktopBubble.textContent = `${companion.name} ${mood.petText}`;
  if (elements.authBubble) elements.authBubble.textContent = `${companion.name} ${mood.petText}`;
  elements.heroMood.textContent = `${companion.name}: ${mood.label.toLowerCase()}`;
  elements.readingSummary.textContent = mood.summary;
  elements.currentValue.textContent = formatGlucose(latest.value);
  elements.currentUnit.textContent = state.unit === "mgdl" ? "mg/dL" : "mmol/L";
  elements.trendPill.textContent = trend.label;
  elements.lastSync.textContent = formatRelativeTime(latest.time);
  elements.streakValue.textContent = `${streakMinutes} min`;

  renderNeeds(mood.statusKey, latest.value, streakMinutes);
  renderInsights();
  renderTimeline(mood, latest, trend);
  renderChart();
}

function saveAuthState() {
  storage.set("sockervan-auth", state.auth);
}

function showAuthGate(visible) {
  elements.authGate.classList.toggle("is-visible", visible);
  elements.body.classList.toggle("auth-open", visible);
  if (visible && elements.authPanel) {
    elements.authPanel.scrollTop = 0;
    state.motion.overlayScrollY = elements.authPanel.scrollTop || 0;
  }
}

function updateAuthGate() {
  const companion = companions[state.selectedCompanion];
  elements.authBuddyEmoji.textContent = companion.emoji;
  elements.authBuddyName.textContent = companion.name;
  elements.authBuddySubtitle.textContent = companion.subtitle;
  elements.authDexcomButton.textContent = state.dexcom.clientId ? "Oppna Dexcoms login" : "Forbered Dexcom-login";

  if (state.auth.status === "authorized") {
    elements.authGateMessage.textContent =
      `${companion.name} ar redo. Dexcom-handoff ar klar och du kan ga tillbaka till grafen med samma figur ovanfor kurvan.`;
    elements.authGateStatus.textContent =
      "Authorization code kom tillbaka till appen. For riktigt token-utbyte och livevardeshamtning behovs fortfarande backend enligt Dexcoms dokumentation.";
    return;
  }

  if (state.dexcom.clientId) {
    elements.authGateMessage.textContent =
      `${companion.name} foljer med direkt fran valrutan hit, och samma figur ligger sedan kvar ovanfor grafen nar du kommer vidare.`;
    elements.authGateStatus.textContent =
      "Efter klick oppnas Dexcoms egen inloggningssida med anvandarnamn och losenord. Pa en statisk GitHub Pages-sida behovs fortfarande backend for det sista token-steget.";
    return;
  }

  elements.authGateMessage.textContent =
    `${companion.name} ar vald och visas redan i login-steget. Du kan ga vidare i demo direkt, eller fylla i Dexcom-uppgifterna i Profil och sedan oppna Dexcoms riktiga login.`;
  elements.authGateStatus.textContent =
    "For att oppna Dexcoms login behover du minst ett Dexcom Client ID. Redirect URI kan vara denna Pages-URL om den finns registrerad i din Dexcom-app.";
}

function showOnboarding(visible) {
  elements.onboarding.classList.toggle("is-visible", visible);
  elements.body.classList.toggle("onboarding-open", visible);
  if (visible) {
    elements.onboardingPanel.scrollTop = 0;
    state.motion.overlayScrollY = elements.onboardingPanel.scrollTop || 0;
    showAuthGate(false);
  }
}

function selectCompanion(key) {
  state.selectedCompanion = key;
  storage.set("sockervan-companion", key);
  elements.choiceButtons.forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.companion === key);
  });
  elements.confirmCompanion.textContent = `Fortsatt till Dexcom med ${companions[key].name}`;
  updateAuthGate();
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

function getCurrentRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function buildDexcomAuthUrl() {
  const { clientId, redirectUri, region, environment } = state.dexcom;
  const resolvedRedirectUri = redirectUri || getCurrentRedirectUrl();
  if (!clientId) return "Lagg in Client ID for att skapa en Dexcom OAuth-lank.";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: resolvedRedirectUri,
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
    elements.cloudStatus.textContent = state.auth.status === "demo" ? "Demo-lage aktivt" : "Mockad Dexcom-strom aktiv";
  } else {
    const regionLabel = state.dexcom.environment === "sandbox" ? "Sandbox" : state.dexcom.region;
    elements.integrationSummary.textContent = `Dexcom ${regionLabel} är valt. Riktig inloggning bör skickas via backend eftersom Dexcom vill ha tokens lagrade på servern.`;
    elements.cloudStatus.textContent = state.auth.status === "authorized" ? `Dexcom ${regionLabel} handoff klar` : `Dexcom ${regionLabel} forberedd`;
  }

  if (state.dexcom.environment === "sandbox") {
    elements.sandboxHint.innerHTML = 'För G7-test i sandbox rekommenderas kontot <code>SandboxUser7</code> enligt Dexcoms dokumentation.';
  } else if (state.dexcom.region === "EU") {
    elements.sandboxHint.innerHTML = 'EU-läge använder <code>api.dexcom.eu</code>. Dexcom anger dessutom att data från mobilappen normalt har cirka 3 timmars fördröjning utanför USA.';
  } else {
    elements.sandboxHint.innerHTML = 'US-läge använder <code>api.dexcom.com</code>. I USA anger Dexcom cirka 1 timmes datafördröjning för mobiluppladdad data.';
  }

  updateAuthGate();
}

function saveDexcomState() {
  storage.set("sockervan-dexcom", state.dexcom);
  renderDexcomPanel();
}

function handleDexcomReturn() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error");

  if (code) {
    state.auth.status = "authorized";
    state.auth.lastProvider = "dexcom";
    state.dexcom.mode = "live";
    saveAuthState();
    storage.set("sockervan-dexcom", state.dexcom);
    window.history.replaceState({}, document.title, getCurrentRedirectUrl());
    return;
  }

  if (oauthError) {
    state.auth.status = "locked";
    state.auth.lastProvider = "dexcom";
    saveAuthState();
    window.history.replaceState({}, document.title, getCurrentRedirectUrl());
  }
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

function updateOverlayScrollMotion(event) {
  const nextY = event.currentTarget.scrollTop || 0;
  const delta = nextY - state.motion.overlayScrollY;
  state.motion.overlayScrollY = nextY;
  state.motion.scrollImpulse = clamp(state.motion.scrollImpulse + delta * 0.22, -24, 24);
}

function animateScene(now) {
  const speedMap = { calm: 0.32, playful: 0.56, sparkly: 0.72, sleepy: 0.18, weak: 0.12, cautious: 0.42 };
  const currentMood = document.body.dataset.mood || "calm";
  const speed = speedMap[currentMood] || 0.32;
  const maxPosition = Math.max(18, window.innerWidth - 280);
  const sceneTime = now / 1000;
  const scrollWave = state.motion.scrollImpulse;
  const onboardingVisible = elements.onboarding.classList.contains("is-visible");
  const authVisible = elements.authGate.classList.contains("is-visible");
  const choiceBoost = onboardingVisible ? 1.45 : 1;

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

  if (elements.authCompanion && authVisible) {
    const authBob = Math.sin(sceneTime * 3.2 + 0.5) * 5.2 + Math.cos(sceneTime * 2.1) * 1.6;
    const authTilt = Math.sin(sceneTime * 2.4 + 0.4) * 1.8 + scrollWave * 0.18;
    elements.authCompanion.style.transform =
      `translateX(-50%) translateY(${(authBob - scrollWave * 0.28).toFixed(2)}px) rotate(${authTilt.toFixed(2)}deg)`;
    elements.authBubble.style.transform =
      `translateX(-50%) translateY(${(Math.sin(sceneTime * 2.7 + 0.2) * 2.8 - scrollWave * 0.12).toFixed(2)}px)`;
  }

  elements.choiceButtons.forEach((button, index) => {
    const isSelected = button.dataset.companion === state.selectedCompanion;
    const phase = index * 0.85;
    const bob = Math.sin(sceneTime * 3.4 + phase) * 5.5 + Math.cos(sceneTime * 1.9 + phase) * 1.4;
    const tilt = Math.sin(sceneTime * 2.6 + phase) * 1.5 + scrollWave * (index % 2 === 0 ? 0.05 : -0.05);
    const lift = isSelected ? -6 : 0;
    button.style.transform =
      `translateY(${(lift + bob * 0.28 * choiceBoost - scrollWave * 0.1).toFixed(2)}px) rotate(${(tilt * choiceBoost).toFixed(2)}deg)`;
  });

  elements.choiceArts.forEach((art, index) => {
    const phase = index * 0.8;
    const bounce = Math.sin(sceneTime * 3.8 + phase) * 6 + Math.cos(sceneTime * 2.3 + phase) * 2;
    const twist = Math.sin(sceneTime * 2.7 + phase) * 4.6;
    const scale = 1 + Math.sin(sceneTime * 2.1 + phase) * 0.035;
    art.style.transform =
      `translateY(${(bounce * choiceBoost).toFixed(2)}px) rotate(${(twist * choiceBoost).toFixed(2)}deg) scale(${(scale + (choiceBoost - 1) * 0.04).toFixed(3)})`;
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
    if (state.auth.status === "locked") {
      updateAuthGate();
      showAuthGate(true);
    }
  });

  [elements.changeBuddyButton, elements.profileChangeBuddy].forEach((button) => {
    button.addEventListener("click", () => showOnboarding(true));
  });

  elements.authBackButton.addEventListener("click", () => {
    showAuthGate(false);
    showOnboarding(true);
  });

  elements.authDemoButton.addEventListener("click", () => {
    state.auth.status = "demo";
    state.auth.lastProvider = "demo";
    state.dexcom.mode = "mock";
    saveAuthState();
    saveDexcomState();
    showAuthGate(false);
    switchScreen("home");
  });

  elements.authSetupButton.addEventListener("click", () => {
    showAuthGate(false);
    switchScreen("profile");
  });

  elements.authDexcomButton.addEventListener("click", () => {
    const authUrl = buildDexcomAuthUrl();
    if (!state.dexcom.clientId) {
      elements.authGateStatus.textContent =
        "Fyll i Dexcom Client ID under Profil for att kunna starta Dexcom-login. Redirect URI kan vara denna Pages-URL om den ar registrerad.";
      showAuthGate(false);
      switchScreen("profile");
      return;
    }
    state.auth.lastProvider = "dexcom";
    saveAuthState();
    state.dexcom.mode = "live";
    saveDexcomState();
    window.location.href = authUrl;
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
  elements.onboardingPanel.addEventListener("scroll", updateOverlayScrollMotion, { passive: true });
  if (elements.authPanel) {
    elements.authPanel.addEventListener("scroll", updateOverlayScrollMotion, { passive: true });
  }
  window.addEventListener("resize", () => {
    desktopPosition = clamp(desktopPosition, 18, Math.max(18, window.innerWidth - 280));
  });
}

function init() {
  handleDexcomReturn();
  elements.unitButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.unit === state.unit);
  });
  selectCompanion(state.selectedCompanion);
  switchScreen("home");
  renderDexcomPanel();
  showOnboarding(state.showOnboarding);
  showAuthGate(!state.showOnboarding && state.auth.status === "locked");
  bindEvents();
  window.setInterval(stepSimulation, 6000);
  window.requestAnimationFrame(animateScene);
}

init();
