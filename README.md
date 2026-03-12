# transaction_page

web-based solution to accept and settle decentralized transactions

## Description of the project

This project is a **standalone web service** that other applications can call whenever they need to conduct a transaction with a user.  
The calling application sends a request to this service, and receives back **payment instructions** (for example, a Bitcoin address to pay to) and a **transaction identifier** that can be used to check status later.

In the long term, the goal is to support multiple decentralized payment methods:

- **Bitcoin on-chain transactions**
- **Bitcoin Lightning Network transactions**
- **Stablecoin transactions (e.g. USDT)**

In this first draft implementation, **only Bitcoin on-chain transactions are supported**. Lightning and stablecoins are marked as TODOs in the code and return “not implemented” responses.

---

## Current capabilities (first draft)

### Stack

- **Node.js + TypeScript** (original implementation)
  - Express.js HTTP server
  - Optional integration with a local Bitcoin Core node via JSON-RPC
- **Python (FastAPI)** implementation
  - FastAPI app with automatic docs UI (`/docs`, `/redoc`)
  - Same basic endpoints and behavior as the Node/TS version

### HTTP API (subject to change)

#### Health check

- **`GET /health`**  
  - Returns a simple JSON object confirming that the service is running.

#### Create a transaction

- **`POST /transactions`**
  - **Request body (Bitcoin on-chain, implemented):**

    ```json
    {
      "type": "bitcoin_onchain",
      "amountSats": 100000,
      "description": "Invoice #123",        // optional
      "callbackUrl": "https://example.com"  // optional, reserved for future use
    }
    ```

  - **Response (Bitcoin on-chain, implemented):**

    ```json
    {
      "transactionId": "UUID",
      "type": "bitcoin_onchain",
      "amountSats": 100000,
      "address": "bc1q....",
      "status": "pending"
    }
    ```

  - **Other types (Lightning, stablecoins):**
    - Currently return **HTTP 501 Not Implemented** with a short JSON error.
    - The corresponding code paths contain TODOs for future implementation.

#### Get transaction status

- **`GET /transactions/:id`**
  - Returns the stored transaction object if it exists.
  - For now, Bitcoin on-chain transactions stay in `pending` status; settlement tracking is a planned enhancement.

---

## How Bitcoin on-chain transactions are handled

1. **Another backend calls this service**  
   - It sends a `POST /transactions` request with `type: "bitcoin_onchain"` and an `amountSats` value.

2. **The service creates a payment address**
   - If a Bitcoin Core node is available and configured:
     - The service uses the node’s JSON-RPC API (`getnewaddress`) to obtain a **fresh Bech32 address** dedicated to this transaction.
   - If a node is not configured:
     - The service returns a **mock address** so that clients can already integrate with the API and build UIs.

3. **The service responds with a transaction record**
   - It includes:
     - A `transactionId` (UUID) that uniquely identifies this payment.
     - The `address` where the user should send Bitcoin.
     - The requested `amountSats`.
     - A `status` field (`"pending"` in this first draft).

4. **The calling application shows payment instructions to the user**
   - It displays the address and amount (e.g. as text and QR code).
   - The user pays using their own Bitcoin wallet.

5. **Status tracking (planned)**
   - The current draft stores transactions in memory and does not yet confirm them on-chain.
   - Future versions will:
     - Poll the Bitcoin Core node (or subscribe to wallet notifications).
     - Mark transactions as settled after a configurable number of confirmations.
     - Optionally send callbacks to the `callbackUrl` provided by the integrator.

---

## Configuration and Bitcoin Core integration

If you want to use a local or remote Bitcoin Core node, run `bitcoind` with RPC enabled and configure the following environment variables:

- `BITCOIN_RPC_URL` – e.g. `http://127.0.0.1:8332`
- `BITCOIN_RPC_USER` – RPC username
- `BITCOIN_RPC_PASSWORD` – RPC password

Optional:

- `PORT` – HTTP port for this service (default: `3033`)

> **Best practice:** Run this service and Bitcoin Core on a private network, secure RPC credentials, and do not expose RPC directly to the public internet.

---

## Roadmap / planned transaction types

### Bitcoin on-chain transactions

- [x] Create transaction records and dedicated payment addresses.
- [x] Basic HTTP API for creation and lookup.
- [ ] Persist transactions in a real database instead of in-memory.
- [ ] Implement on-chain confirmation tracking and automatic status updates.
- [ ] Optional webhooks back to calling services on settlement.

### Bitcoin Lightning Network transactions

- [ ] Add `type: "bitcoin_lightning"` support in `POST /transactions`.
- [ ] Integrate with a Lightning node or LSP to create invoices.
- [ ] Track invoice settlement and expose it over the API.

### Stablecoin transactions (e.g. USDT)

- [ ] Add `type: "stablecoin"` support in `POST /transactions`.
- [ ] Decide supported chains and providers.
- [ ] Implement issuance/transfer and settlement tracking per chain.

---

## Development

### Prerequisites

- Node.js (LTS recommended) – for the TypeScript implementation
- Python 3.10+ – for the FastAPI implementation
- Optional: a running Bitcoin Core node with RPC enabled

### Node/TypeScript service

```bash
npm install
npm run dev
```

The service will start on `http://localhost:3033` by default (or another port if `PORT` is set).

### Sample website (integrator demo)

There is a minimal “merchant/integrator” website in `sample/` that calls this service’s API to create a transaction and display payment instructions.

Run the API, then in a second terminal:

```bash
npm run sample
```

Open `http://localhost:3000`.

### Python/FastAPI service (with simple UI via docs)

Install dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Run the FastAPI app with uvicorn (port 3033 is a good default here to avoid 3000 clashes):

```bash
uvicorn app.main:app --reload --port 3033
```

Then open in a browser:

- Interactive API docs (Swagger UI): `http://localhost:3033/docs`
- Alternative docs (ReDoc): `http://localhost:3033/redoc`

You can create transactions and inspect responses directly from the docs UI without writing any client code.

---

## Project status

See `STATUS.md` for a concise, up-to-date summary of what is implemented and what is still TODO.

