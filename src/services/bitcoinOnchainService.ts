import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { BitcoinRpcConfig } from "../config";

export type TransactionType = "bitcoin_onchain" | "bitcoin_lightning" | "stablecoin";

export interface CreateTransactionRequest {
  type: TransactionType;
  amountSats: number;
  description?: string;
  // In a real deployment, this could be a callback URL where we POST settlement events.
  callbackUrl?: string;
}

export interface CreateBitcoinOnchainTransactionResult {
  transactionId: string;
  type: "bitcoin_onchain";
  amountSats: number;
  // Address where the user should send funds.
  address: string;
  // Simplified status for now; see notes below.
  status: "pending" | "settled";
}

// In-memory store just for the first draft.
// TODO: Replace with persistent storage (database or external state store).
const inMemoryTxStore = new Map<string, CreateBitcoinOnchainTransactionResult>();

async function callBitcoinRpc<T>(
  rpcConfig: BitcoinRpcConfig,
  method: string,
  params: unknown[]
): Promise<T> {
  const auth = Buffer.from(`${rpcConfig.username}:${rpcConfig.password}`).toString("base64");

  const response = await axios.post<T>(
    rpcConfig.url,
    {
      jsonrpc: "1.0",
      id: "transaction_page",
      method,
      params
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`
      }
    }
  );

  // Note: axios here is typed to return T, but Bitcoin Core actually wraps results
  // in { result, error, id }. For simplicity in this first draft we type this loosely.
  // TODO: Add a proper RPC client type and error handling.
  // @ts-expect-error - loosened typing for first draft.
  if (response.data.error) {
    // @ts-expect-error - loosened typing for first draft.
    throw new Error(response.data.error.message || "Bitcoin RPC error");
  }

  // @ts-expect-error - loosened typing for first draft.
  return response.data.result;
}

export async function createBitcoinOnchainTransaction(
  rpcConfig: BitcoinRpcConfig | undefined,
  request: CreateTransactionRequest
): Promise<CreateBitcoinOnchainTransactionResult> {
  if (request.amountSats <= 0) {
    throw new Error("amountSats must be positive");
  }

  if (!rpcConfig) {
    // If no RPC is configured, we still return a stubbed payment address
    // so that the API contract is clear for integrators.
    // TODO: Require RPC configuration in production environments.
    const transactionId = uuidv4();
    const mockAddress = `btc-test-${transactionId}`;

    const tx: CreateBitcoinOnchainTransactionResult = {
      transactionId,
      type: "bitcoin_onchain",
      amountSats: request.amountSats,
      address: mockAddress,
      status: "pending"
    };

    inMemoryTxStore.set(transactionId, tx);
    return tx;
  }

  // Best-practice path: ask Bitcoin Core for a new address dedicated to this payment.
  // This allows wallet-side labeling and future accounting.
  const address = await callBitcoinRpc<string>(rpcConfig, "getnewaddress", [
    request.description || "transaction_page",
    "bech32"
  ]);

  const transactionId = uuidv4();

  const tx: CreateBitcoinOnchainTransactionResult = {
    transactionId,
    type: "bitcoin_onchain",
    amountSats: request.amountSats,
    address,
    status: "pending"
  };

  inMemoryTxStore.set(transactionId, tx);
  return tx;
}

export function getBitcoinOnchainTransaction(
  transactionId: string
): CreateBitcoinOnchainTransactionResult | undefined {
  return inMemoryTxStore.get(transactionId);
}

// TODO: Implement background job or webhook logic to poll Bitcoin Core for confirmations
// and mark transactions as "settled" once they reach the required confirmation threshold.

