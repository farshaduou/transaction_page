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

2) In a second terminal, start the sample website:

```bash
node sample/server.js
```

Then open `http://localhost:3000` (or `:3001`, `:3002`, etc. if 3000 is already in use).

## Configuration

- `SAMPLE_PORT`: port for the sample website (default `3000`)
- `TRANSACTION_API_BASE`: base URL for the transaction API (default `http://localhost:3033`)

Example:

```bash
TRANSACTION_API_BASE="http://localhost:3033" SAMPLE_PORT=3000 node sample/server.js
```

