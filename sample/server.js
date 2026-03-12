const path = require("path");
const express = require("express");

const app = express();

const PORT = Number(process.env.SAMPLE_PORT) || 3000;
const TRANSACTION_API_BASE = process.env.TRANSACTION_API_BASE || "http://localhost:3033";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function joinUrl(base, p) {
  return `${String(base).replace(/\/+$/, "")}/${String(p).replace(/^\/+/, "")}`;
}

async function proxyJson(req, res, { method, path: p }) {
  const url = joinUrl(TRANSACTION_API_BASE, p);
  const headers = { Accept: "application/json" };

  const init = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(req.body ?? {});
  }

  let upstream;
  try {
    upstream = await fetch(url, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return res.status(502).json({
      error: "Failed to reach transaction API",
      details: message,
      transactionApiBase: TRANSACTION_API_BASE
    });
  }

  const contentType = upstream.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await upstream.json().catch(() => null) : await upstream.text();

  if (isJson) return res.status(upstream.status).json(body);
  return res.status(upstream.status).send(body);
}

app.get("/api/health", (req, res) =>
  proxyJson(req, res, { method: "GET", path: "/health" })
);

app.post("/api/transactions", (req, res) =>
  proxyJson(req, res, { method: "POST", path: "/transactions" })
);

app.get("/api/transactions/:id", (req, res) =>
  proxyJson(req, res, { method: "GET", path: `/transactions/${req.params.id}` })
);

function listenWithFallback(startPort, maxAttempts = 20) {
  let port = startPort;
  let attemptsLeft = maxAttempts;

  const server = app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Sample site running on http://localhost:${port}`);
    // eslint-disable-next-line no-console
    console.log(`Using transaction API at ${TRANSACTION_API_BASE}`);
    if (port !== startPort) {
      // eslint-disable-next-line no-console
      console.log(`Note: ${startPort} was busy, fell back to ${port}`);
    }
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE" && attemptsLeft > 0) {
      attemptsLeft -= 1;
      port += 1;
      server.close(() => {
        // eslint-disable-next-line no-console
        console.log(`Port in use, trying ${port}...`);
        listenWithFallback(port, attemptsLeft);
      });
      return;
    }

    // eslint-disable-next-line no-console
    console.error("Sample site failed to start:", err);
    process.exitCode = 1;
  });
}

listenWithFallback(PORT);

