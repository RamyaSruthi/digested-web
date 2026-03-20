/** @type {string} */
const DEFAULT_BASE_URL = "http://localhost:3000";

// ── DOM refs ──────────────────────────────────────────────────────────────────
const setupScreen    = document.getElementById("setup-screen");
const saveScreen     = document.getElementById("save-screen");
const tokenInput     = document.getElementById("token-input");
const baseUrlInput   = document.getElementById("base-url-input");
const connectBtn     = document.getElementById("connect-btn");
const setupStatus    = document.getElementById("setup-status");
const saveBtn        = document.getElementById("save-btn");
const saveStatus     = document.getElementById("save-status");
const folderSelect   = document.getElementById("folder-select");
const currentUrlEl   = document.getElementById("current-url");
const faviconImg     = document.getElementById("favicon");
const headerBadge    = document.getElementById("header-badge");
const disconnectBtn  = document.getElementById("disconnect-btn");
const settingsLink   = document.getElementById("settings-link");

// ── Helpers ───────────────────────────────────────────────────────────────────
function showStatus(el, message, type) {
  el.textContent = message;
  el.className = `status ${type}`;
}

function clearStatus(el) {
  el.className = "status";
  el.textContent = "";
}

function setLoading(btn, loading, text) {
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> ${text}`;
  } else {
    btn.disabled = false;
    btn.textContent = text;
  }
}

// ── Storage ───────────────────────────────────────────────────────────────────
function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["token", "baseUrl"], (result) => {
      resolve({
        token:   result.token   ?? null,
        baseUrl: result.baseUrl ?? DEFAULT_BASE_URL,
      });
    });
  });
}

function saveConfig(token, baseUrl) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ token, baseUrl }, resolve);
  });
}

function clearConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(["token", "baseUrl"], resolve);
  });
}

// ── Current tab ───────────────────────────────────────────────────────────────
function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0] ?? null);
    });
  });
}

// ── API calls ─────────────────────────────────────────────────────────────────
async function fetchFolders(baseUrl, token) {
  const res = await fetch(`${baseUrl}/api/extension/folders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch folders");
  return res.json();
}

async function saveLink(baseUrl, token, payload) {
  const res = await fetch(`${baseUrl}/api/extension/save`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 409) return { alreadySaved: true };
    throw new Error(data.error ?? "Failed to save link");
  }
  return { alreadySaved: false, link: data };
}

// ── Show save screen ──────────────────────────────────────────────────────────
async function showSaveScreen(config) {
  setupScreen.style.display = "none";
  saveScreen.style.display  = "block";
  headerBadge.style.display = "block";
  disconnectBtn.style.display = "block";

  // Load current tab
  const tab = await getCurrentTab();
  const url = tab?.url ?? "";
  currentUrlEl.textContent = url;

  // Favicon
  try {
    const origin = new URL(url).origin;
    faviconImg.src = `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
    faviconImg.onerror = () => { faviconImg.style.display = "none"; };
  } catch {
    faviconImg.style.display = "none";
  }

  // Load folders
  try {
    const folders = await fetchFolders(config.baseUrl, config.token);
    folderSelect.innerHTML = '<option value="">No folder (Inbox)</option>';
    folders.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.id;
      opt.textContent = f.name;
      folderSelect.appendChild(opt);
    });
  } catch {
    // Folders are optional — just leave the default
  }
}

// ── Connect ───────────────────────────────────────────────────────────────────
connectBtn.addEventListener("click", async () => {
  clearStatus(setupStatus);
  const token   = tokenInput.value.trim();
  const baseUrl = (baseUrlInput.value.trim() || DEFAULT_BASE_URL).replace(/\/$/, "");

  if (!token) {
    showStatus(setupStatus, "Please paste your API token.", "error");
    return;
  }

  setLoading(connectBtn, true, "Connecting…");

  try {
    // Verify the token by fetching folders
    await fetchFolders(baseUrl, token);
    await saveConfig(token, baseUrl);
    settingsLink.href = `${baseUrl}/app/settings`;
    await showSaveScreen({ token, baseUrl });
  } catch {
    showStatus(setupStatus, "Connection failed. Check your token and App URL.", "error");
  } finally {
    setLoading(connectBtn, false, "Connect");
  }
});

// ── Save ──────────────────────────────────────────────────────────────────────
saveBtn.addEventListener("click", async () => {
  clearStatus(saveStatus);
  const tab = await getCurrentTab();
  const url = tab?.url ?? "";

  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    showStatus(saveStatus, "Cannot save this page — not a valid URL.", "error");
    return;
  }

  const config = await getConfig();
  const folderId = folderSelect.value || null;

  setLoading(saveBtn, true, "Saving…");

  try {
    const result = await saveLink(config.baseUrl, config.token, {
      url,
      title: tab.title ?? null,
      folder_id: folderId,
    });

    if (result.alreadySaved) {
      showStatus(saveStatus, "Already in your Digested list.", "warning");
    } else {
      showStatus(saveStatus, "Saved! Open Digested to read it.", "success");
      saveBtn.textContent = "Saved ✓";
      saveBtn.disabled = true;
    }
  } catch (e) {
    showStatus(saveStatus, e.message ?? "Something went wrong. Try again.", "error");
    setLoading(saveBtn, false, "Save to Digested");
  }
});

// ── Disconnect ────────────────────────────────────────────────────────────────
disconnectBtn.addEventListener("click", async () => {
  await clearConfig();
  setupScreen.style.display = "block";
  saveScreen.style.display  = "none";
  headerBadge.style.display = "none";
  disconnectBtn.style.display = "none";
  tokenInput.value = "";
  baseUrlInput.value = "";
  clearStatus(saveStatus);
});

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  const config = await getConfig();
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  settingsLink.href = `${baseUrl}/app/settings`;
  baseUrlInput.value = baseUrl === DEFAULT_BASE_URL ? "" : baseUrl;

  if (config.token) {
    try {
      await showSaveScreen(config);
    } catch {
      // Token invalid — show setup screen
      await clearConfig();
    }
  }
})();
