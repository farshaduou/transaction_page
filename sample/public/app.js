const $ = (id) => document.getElementById(id);

const els = {
  healthPill: $("healthPill"),
  form: $("createForm"),
  amountSats: $("amountSats"),
  description: $("description"),
  loadLastBtn: $("loadLastBtn"),
  clearBtn: $("clearBtn"),
  refreshBtn: $("refreshBtn"),
  copyAddressBtn: $("copyAddressBtn"),
  txEmpty: $("txEmpty"),
  txPanel: $("txPanel"),
  txId: $("txId"),
  txAmount: $("txAmount"),
  txAddress: $("txAddress"),
  txStatus: $("txStatus"),
  log: $("log")
};

const STORAGE_KEY = "sample:lastTransactionId";

function logLine(line) {
  const ts = new Date().toISOString();
  els.log.textContent = `${ts}  ${line}\n${els.log.textContent || ""}`;
}

async function api(method, path, body) {
  const init = { method, headers: { Accept: "application/json" } };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`/api${path}`, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const msg = json?.detail || json?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

function setHealth(ok, detail) {
  if (ok) {
    els.healthPill.classList.remove("bad");
    els.healthPill.classList.add("ok");
    els.healthPill.textContent = "API: healthy";
  } else {
    els.healthPill.classList.remove("ok");
    els.healthPill.classList.add("bad");
    els.healthPill.textContent = `API: down${detail ? ` (${detail})` : ""}`;
  }
}

function renderTx(tx) {
  if (!tx) {
    els.txEmpty.classList.remove("hidden");
    els.txPanel.classList.add("hidden");
    return;
  }

  els.txEmpty.classList.add("hidden");
  els.txPanel.classList.remove("hidden");

  els.txId.textContent = tx.transactionId || "";
  els.txAmount.textContent = `${tx.amountSats} sats`;
  els.txAddress.textContent = tx.address || "";

  const status = tx.status || "pending";
  els.txStatus.textContent = status;
  els.txStatus.classList.remove("pending", "settled");
  els.txStatus.classList.add(status);
}

async function refreshHealth() {
  try {
    const res = await api("GET", "/health");
    setHealth(Boolean(res?.ok), "");
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    setHealth(false, message);
  }
}

async function createTx() {
  const amountSats = Number(els.amountSats.value);
  const description = (els.description.value || "").trim();

  const payload = {
    type: "bitcoin_onchain",
    amountSats,
    ...(description ? { description } : {})
  };

  logLine(`POST /transactions ${JSON.stringify(payload)}`);
  const tx = await api("POST", "/transactions", payload);
  logLine(`Created ${tx.transactionId} (status=${tx.status})`);

  localStorage.setItem(STORAGE_KEY, tx.transactionId);
  renderTx(tx);
}

async function loadTx(id) {
  if (!id) throw new Error("Missing transaction id");
  logLine(`GET /transactions/${id}`);
  const tx = await api("GET", `/transactions/${encodeURIComponent(id)}`);
  renderTx(tx);
  return tx;
}

els.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await createTx();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logLine(`Error: ${message}`);
    alert(message);
  }
});

els.refreshBtn.addEventListener("click", async () => {
  try {
    const id = els.txId.textContent.trim();
    await loadTx(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logLine(`Error: ${message}`);
    alert(message);
  }
});

els.copyAddressBtn.addEventListener("click", async () => {
  const address = els.txAddress.textContent.trim();
  if (!address) return;
  try {
    await navigator.clipboard.writeText(address);
    logLine("Copied address to clipboard");
  } catch {
    logLine("Clipboard copy failed (browser permission)");
  }
});

els.loadLastBtn.addEventListener("click", async () => {
  const id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    alert("No saved transaction yet.");
    return;
  }
  try {
    await loadTx(id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logLine(`Error: ${message}`);
    alert(message);
  }
});

els.clearBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  els.amountSats.value = "";
  els.description.value = "";
  els.log.textContent = "";
  renderTx(null);
  logLine("Cleared state");
});

(async function init() {
  await refreshHealth();
  const last = localStorage.getItem(STORAGE_KEY);
  if (last) {
    try {
      await loadTx(last);
    } catch {
      // ignore
    }
  }
})();

