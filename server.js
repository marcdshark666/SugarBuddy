const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");

loadLocalEnv();

const app = express();
const sessions = new Map();
const pendingStates = new Map();

const PORT = Number(process.env.PORT || 3000);
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "sockervan_sid";
const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID || "";
const DEXCOM_CLIENT_SECRET = process.env.DEXCOM_CLIENT_SECRET || "";
const DEFAULT_REGION = sanitizeRegion(process.env.DEXCOM_REGION || "EU");
const DEFAULT_ENVIRONMENT = sanitizeEnvironment(process.env.DEXCOM_ENVIRONMENT || "sandbox");

app.disable("x-powered-by");
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "sugarbuddy-dexcom-bridge",
    hasDexcomCredentials: Boolean(DEXCOM_CLIENT_ID && DEXCOM_CLIENT_SECRET),
  });
});

app.get("/auth/dexcom/start", (req, res) => {
  cleanupPendingStates();

  if (!DEXCOM_CLIENT_ID || !DEXCOM_CLIENT_SECRET) {
    return redirectToFrontend(req, res, {
      dexcom_error: "missing_server_credentials",
    });
  }

  const appBaseUrl = getAppBaseUrl(req);
  const frontendReturn = String(req.query.frontend || process.env.FRONTEND_URL || `${appBaseUrl}/`);
  const region = sanitizeRegion(req.query.region || DEFAULT_REGION);
  const environment = sanitizeEnvironment(req.query.environment || DEFAULT_ENVIRONMENT);
  const crossSite = isCrossSite(frontendReturn, appBaseUrl);
  const session = getOrCreateSession(req, res, { crossSite });
  const state = crypto.randomUUID();

  pendingStates.set(state, {
    sid: session.id,
    frontendReturn,
    region,
    environment,
    createdAt: Date.now(),
  });

  const redirectUri = new URL("/auth/dexcom/callback", appBaseUrl).toString();
  const params = new URLSearchParams({
    client_id: DEXCOM_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "offline_access",
    state,
  });

  res.redirect(`${resolveDexcomBase(region, environment)}/v3/oauth2/login?${params.toString()}`);
});

app.get("/auth/dexcom/callback", async (req, res) => {
  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  const oauthError = String(req.query.error || "");
  const pending = pendingStates.get(state);

  if (!pending) {
    return redirectToFrontend(req, res, {
      dexcom_error: oauthError || "invalid_state",
    });
  }

  pendingStates.delete(state);

  if (oauthError) {
    return redirectToFrontend(req, res, {
      frontend: pending.frontendReturn,
      dexcom_error: oauthError,
    });
  }

  if (!code) {
    return redirectToFrontend(req, res, {
      frontend: pending.frontendReturn,
      dexcom_error: "missing_code",
    });
  }

  try {
    const appBaseUrl = getAppBaseUrl(req);
    const redirectUri = new URL("/auth/dexcom/callback", appBaseUrl).toString();
    const tokenResponse = await fetch(`${resolveDexcomBase(pending.region, pending.environment)}/v3/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: DEXCOM_CLIENT_ID,
        client_secret: DEXCOM_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const payload = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok) {
      throw new Error(payload.error_description || payload.error || "Dexcom token exchange failed");
    }

    const session = sessions.get(pending.sid) || createSession(pending.sid);
    session.tokens = normalizeTokens(payload);
    session.region = pending.region;
    session.environment = pending.environment;
    session.lastSyncAt = null;
    sessions.set(session.id, session);

    return redirectToFrontend(req, res, {
      frontend: pending.frontendReturn,
      dexcom: "connected",
    });
  } catch (error) {
    return redirectToFrontend(req, res, {
      frontend: pending.frontendReturn,
      dexcom_error: sanitizeQueryValue(error.message),
    });
  }
});

app.get("/api/dexcom/status", async (req, res) => {
  const session = getSession(req);
  if (!session || !session.tokens) {
    return res.json({ connected: false });
  }

  try {
    await ensureAccessToken(session);
    res.json({
      connected: true,
      region: session.region,
      environment: session.environment,
      lastSyncAt: session.lastSyncAt,
    });
  } catch (error) {
    clearSessionAuth(session);
    res.status(401).json({
      connected: false,
      error: error.message,
    });
  }
});

app.get("/api/dexcom/summary", async (req, res) => {
  const session = getSession(req);
  if (!session || !session.tokens) {
    return res.status(401).json({
      error: "Dexcom is not connected for this session.",
    });
  }

  try {
    session.region = sanitizeRegion(req.query.region || session.region || DEFAULT_REGION);
    session.environment = sanitizeEnvironment(req.query.environment || session.environment || DEFAULT_ENVIRONMENT);
    await ensureAccessToken(session);

    const hours = clampInteger(Number(req.query.hours || 24), 1, 72);
    const records = await fetchEgvs(session, hours);
    session.lastSyncAt = new Date().toISOString();

    res.json({
      connected: true,
      lastSyncAt: session.lastSyncAt,
      region: session.region,
      environment: session.environment,
      records: records.map((record) => ({
        value: record.value,
        trend: record.trend,
        trendRate: record.trendRate,
        systemTime: record.systemTime,
        displayTime: record.displayTime,
        unit: record.unit,
        displayDevice: record.displayDevice,
        transmitterGeneration: record.transmitterGeneration,
      })),
      summary: buildSummary(records),
    });
  } catch (error) {
    clearSessionAuth(session);
    res.status(500).json({
      error: error.message || "Failed to load Dexcom data.",
    });
  }
});

app.post("/api/dexcom/logout", (req, res) => {
  const session = getSession(req);
  if (session) {
    clearSessionAuth(session);
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ ok: true });
});

app.use(express.static(__dirname));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`SugarBuddy running on http://localhost:${PORT}`);
});

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) return;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  });
}

function createSession(id = crypto.randomUUID()) {
  const session = { id, tokens: null, region: DEFAULT_REGION, environment: DEFAULT_ENVIRONMENT, lastSyncAt: null };
  sessions.set(id, session);
  return session;
}

function getSession(req) {
  const sid = req.cookies[COOKIE_NAME];
  if (!sid) return null;
  return sessions.get(sid) || null;
}

function getOrCreateSession(req, res, { crossSite = false } = {}) {
  const existing = getSession(req);
  if (existing) return existing;
  const session = createSession();
  setSessionCookie(req, res, session.id, crossSite);
  return session;
}

function setSessionCookie(req, res, sid, crossSite) {
  const secureRequest = isSecureRequest(req);
  const sameSite = crossSite && secureRequest ? "none" : "lax";
  res.cookie(COOKIE_NAME, sid, {
    httpOnly: true,
    sameSite,
    secure: sameSite === "none",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });
}

function isSecureRequest(req) {
  return req.secure || req.headers["x-forwarded-proto"] === "https";
}

function getAppBaseUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

function sanitizeRegion(value) {
  const normalized = String(value || "EU").toUpperCase();
  return ["US", "EU", "JP"].includes(normalized) ? normalized : "EU";
}

function sanitizeEnvironment(value) {
  const normalized = String(value || "sandbox").toLowerCase();
  return normalized === "production" ? "production" : "sandbox";
}

function resolveDexcomBase(region, environment) {
  if (environment === "sandbox") return "https://sandbox-api.dexcom.com";
  if (region === "US") return "https://api.dexcom.com";
  if (region === "JP") return "https://api.dexcom.jp";
  return "https://api.dexcom.eu";
}

function normalizeTokens(payload) {
  const expiresInSeconds = Number(payload.expires_in || 0);
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 60) * 1000,
  };
}

async function ensureAccessToken(session) {
  if (!session.tokens) {
    throw new Error("Dexcom session is missing tokens.");
  }

  if (Date.now() < session.tokens.expiresAt) return session.tokens.accessToken;
  if (!session.tokens.refreshToken) {
    throw new Error("Dexcom refresh token is missing.");
  }

  const response = await fetch(`${resolveDexcomBase(session.region, session.environment)}/v3/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: DEXCOM_CLIENT_ID,
      client_secret: DEXCOM_CLIENT_SECRET,
      refresh_token: session.tokens.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Dexcom token refresh failed");
  }

  session.tokens = normalizeTokens(payload);
  return session.tokens.accessToken;
}

async function fetchEgvs(session, hours) {
  const accessToken = await ensureAccessToken(session);
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);
  const query = new URLSearchParams({
    startDate: formatDexcomDate(startDate),
    endDate: formatDexcomDate(endDate),
  });

  const response = await fetch(`${resolveDexcomBase(session.region, session.environment)}/v3/users/self/egvs?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Dexcom EGV fetch failed");
  }

  return Array.isArray(payload.records) ? payload.records : [];
}

function formatDexcomDate(date) {
  return date.toISOString().slice(0, 19);
}

function buildSummary(records) {
  const sorted = [...records]
    .filter((record) => Number.isFinite(record.value))
    .sort((left, right) => new Date(left.displayTime || left.systemTime).getTime() - new Date(right.displayTime || right.systemTime).getTime());

  const values = sorted.map((record) => Number(record.value));
  const average = mean(values);
  const inRangePct = percentage(values, (value) => value >= 81 && value <= 126);
  const abovePct = percentage(values, (value) => value > 126);
  const belowPct = percentage(values, (value) => value < 81);
  const latest = sorted[sorted.length - 1] || null;
  const previous = sorted[sorted.length - 2] || null;
  const delta = latest && previous ? latest.value - previous.value : 0;
  const stdDev = standardDeviation(values, average);
  const bedtimeValues = valuesForHours(sorted, [21, 22, 23, 0, 1, 2, 3]);
  const wakeValues = valuesForHours(sorted, [5, 6, 7, 8, 9]);

  return {
    averageMgdl: round(average, 1),
    inRangePct: round(inRangePct, 0),
    abovePct: round(abovePct, 0),
    belowPct: round(belowPct, 0),
    gmi: round((average + 46.7) / 28.7, 1),
    stdDev: round(stdDev, 0),
    highCount: countEpisodes(values, (value) => value > 126),
    lowCount: countEpisodes(values, (value) => value < 81),
    bedtimeAvgMgdl: round(mean(bedtimeValues), 1),
    wakeUpAvgMgdl: round(mean(wakeValues), 1),
    quartilesMgdl: [0.25, 0.5, 0.75].map((ratio) => round(quantile(values, ratio), 1)),
    fluxGrade: getFluxGrade(stdDev, inRangePct),
    deltaMgdl: round(delta, 1),
    latestTrend: latest ? latest.trend : "unknown",
  };
}

function valuesForHours(records, allowedHours) {
  return records
    .filter((record) => {
      const date = new Date(record.displayTime || record.systemTime);
      return allowedHours.includes(date.getHours());
    })
    .map((record) => Number(record.value))
    .filter(Number.isFinite);
}

function countEpisodes(values, predicate) {
  let total = 0;
  let active = false;
  values.forEach((value) => {
    const matches = predicate(value);
    if (matches && !active) total += 1;
    active = matches;
  });
  return total;
}

function quantile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = (sorted.length - 1) * ratio;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const blend = index - lower;
  return sorted[lower] + (sorted[upper] - sorted[lower]) * blend;
}

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values, average = mean(values)) {
  if (!values.length) return 0;
  const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function percentage(values, predicate) {
  if (!values.length) return 0;
  return (values.filter(predicate).length / values.length) * 100;
}

function getFluxGrade(stdDev, inRangePct) {
  if (stdDev <= 18 && inRangePct >= 80) return "A";
  if (stdDev <= 28 && inRangePct >= 60) return "B";
  if (stdDev <= 40 && inRangePct >= 40) return "C";
  return "D";
}

function round(value, decimals = 0) {
  const factor = 10 ** decimals;
  return Math.round((Number.isFinite(value) ? value : 0) * factor) / factor;
}

function clampInteger(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.round(value), min), max);
}

function redirectToFrontend(req, res, params) {
  const appBaseUrl = getAppBaseUrl(req);
  const frontend = params.frontend || process.env.FRONTEND_URL || `${appBaseUrl}/`;
  const target = new URL(frontend);
  Object.entries(params).forEach(([key, value]) => {
    if (key === "frontend") return;
    if (value) target.searchParams.set(key, value);
  });
  res.redirect(target.toString());
}

function sanitizeQueryValue(value) {
  return String(value || "").replace(/[^\w.-]+/g, "_");
}

function clearSessionAuth(session) {
  if (!session) return;
  session.tokens = null;
  session.lastSyncAt = null;
}

function cleanupPendingStates() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  pendingStates.forEach((value, key) => {
    if (value.createdAt < cutoff) pendingStates.delete(key);
  });
}

function isCrossSite(frontendReturn, appBaseUrl) {
  try {
    return new URL(frontendReturn).origin !== new URL(appBaseUrl).origin;
  } catch {
    return false;
  }
}
