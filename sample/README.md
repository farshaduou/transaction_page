# Sample website (integrator)

This folder contains a minimal “merchant” website that integrates with the `transaction_page` service.

It demonstrates the typical flow:

- Create a transaction via `POST /transactions`
- Display the returned `address` and `amountSats`
- Refresh status via `GET /transactions/:id`

## Run it

1) Start the transaction service (Node/TS version):

```bash
npm run dev
```

This should start the API on `http://localhost:3033` (unless you set `PORT`).

2) In a second terminal, start the sample website.

### Option A: Run the sample with Node

```bash
npm run sample
```

Then open `http://localhost:3000` (or `:3001`, `:3002`, etc. if 3000 is already in use).

### Option B: Run the sample with Python (FastAPI)

```bash
source .venv/bin/activate
uvicorn sample.server:app --reload --port 3000
```

Then open `http://localhost:3000` (or pick another `--port` if 3000 is in use).

## Configuration

- `TRANSACTION_API_BASE`: base URL for the transaction API (default `http://localhost:3033`)

Example:

```bash
TRANSACTION_API_BASE="http://localhost:3033" uvicorn sample.server:app --reload --port 3000
```

