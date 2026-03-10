## Project status

**Last updated:** 2026-03-10

### Scope

This service is a standalone web-based backend that other projects can call whenever they need to initiate a decentralized transaction for a user. The first draft focuses on **Bitcoin on-chain transactions** and exposes a simple HTTP API for creating and querying transactions.

### Implemented

- **Core service**
  - Node.js + TypeScript + Express HTTP server.
  - `/health` endpoint to verify service liveness.
- **Bitcoin on-chain transactions**
  - `POST /transactions` with `type: "bitcoin_onchain"`:
    - Validates the request and required fields.
    - Creates a unique transaction record with:
      - A dedicated Bitcoin address where the user should send funds.
      - An amount in sats and a `pending` status.
    - When Bitcoin Core RPC is configured (recommended for real deployments), the address is generated via `getnewaddress` with a Bech32 address.
    - When Bitcoin Core RPC is *not* configured, a mock address is returned for integration and UI prototyping.
  - `GET /transactions/:id`:
    - Returns the stored transaction object if it exists.
    - Currently returns `status: "pending"` for all records.

### Not yet implemented (planned / TODO)

- **Settlement tracking for Bitcoin on-chain**
  - TODO: Poll Bitcoin Core for confirmations or subscribe to wallet notifications.
  - TODO: Mark transactions as `settled` when they reach the required confirmation threshold.
  - TODO: Optionally POST settlement events to an integrator-provided `callbackUrl`.
- **Bitcoin Lightning transactions**
  - TODO: Add support for `type: "bitcoin_lightning"` in `POST /transactions`.
  - TODO: Integrate with a Lightning node or Lightning Service Provider (LSP) to create invoices and track settlements.
- **Stablecoin transactions (e.g. USDT)**
  - TODO: Add support for `type: "stablecoin"` (and specific assets) in `POST /transactions`.
  - TODO: Decide on supported chains (e.g. Tron, Ethereum, Bitcoin sidechains) and providers.
- **Persistence**
  - Current implementation uses an in-memory store for transactions.
  - TODO: Replace with a durable database (e.g. PostgreSQL) and add migrations.
- **Security and authentication**
  - TODO: Add API authentication (e.g. API keys, OAuth2, mTLS) before exposing this service publicly.
  - TODO: Add rate limiting and basic request validation hardening.

### How Bitcoin on-chain transactions work in this service

1. **Another backend calls this service**  
   - Sends `POST /transactions` with JSON body:
     - `type: "bitcoin_onchain"`
     - `amountSats`: integer, amount in satoshis.
     - Optional `description` and `callbackUrl`.

2. **Service creates a payment address**
   - If Bitcoin Core RPC is configured (via `BITCOIN_RPC_URL`, `BITCOIN_RPC_USER`, `BITCOIN_RPC_PASSWORD`):
     - The service calls the node’s `getnewaddress` RPC method.
     - The returned Bech32 address is dedicated to this specific payment.
   - If Bitcoin Core RPC is **not** configured:
     - The service generates a mock address with a unique ID (for development and frontend work only).

3. **Service responds with transaction details**
   - Returns a JSON object containing:
     - `transactionId`: UUID used by integrators to query status.
     - `type`: `"bitcoin_onchain"`.
     - `amountSats`: as requested by the caller.
     - `address`: the Bitcoin address where the user should send funds.
     - `status`: currently always `"pending"` in this first draft.

4. **Caller presents payment instructions to the end user**
   - The upstream application shows:
     - The Bitcoin address (QR code and plain text).
     - The amount to send.
   - The user sends funds on-chain to that address using their wallet.

5. **Checking transaction status**
   - The caller can poll `GET /transactions/:id` to retrieve the latest record.
   - In this first draft, status does not automatically change; settlement tracking is left as a TODO.

6. **Future best practices for production**
   - Use a dedicated Bitcoin Core wallet for this service with:
     - Proper backups.
     - Role separation between hot wallet and long-term storage.
   - Run the node on the same private network as the service, not exposed to the public internet.
   - Enforce HTTPS and authentication on the HTTP API.
   - Add monitoring and alerts around:
     - RPC health.
     - Wallet balance and UTXO set.
     - Transaction confirmation delays.

