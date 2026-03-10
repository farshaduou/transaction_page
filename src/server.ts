import express, { Request, Response } from "express";
import { config } from "./config";
import {
  CreateTransactionRequest,
  createBitcoinOnchainTransaction,
  getBitcoinOnchainTransaction
} from "./services/bitcoinOnchainService";

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.post("/transactions", async (req: Request, res: Response) => {
  const body = req.body as CreateTransactionRequest;

  if (!body.type) {
    return res.status(400).json({ error: "type is required" });
  }

  if (body.type === "bitcoin_onchain") {
    try {
      const tx = await createBitcoinOnchainTransaction(config.bitcoinRpc, body);
      return res.status(201).json(tx);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return res.status(400).json({ error: message });
    }
  }

  // TODO: Implement support for other transaction types.
  // - "bitcoin_lightning": Integrate with a Lightning node or LSP.
  // - "stablecoin": Integrate with supported chains and issuers (e.g. USDT).
  return res.status(501).json({
    error: "This transaction type is not yet implemented.",
    type: body.type
  });
});

app.get("/transactions/:id", (req: Request, res: Response) => {
  const tx = getBitcoinOnchainTransaction(req.params.id);
  if (!tx) {
    return res.status(404).json({ error: "Transaction not found" });
  }
  return res.json(tx);
});

// TODO: Add authentication / authorization if this service will be exposed publicly.
// For now we assume this is deployed in a trusted environment and only called by other backend services.

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`transaction_page listening on port ${config.port}`);
});

