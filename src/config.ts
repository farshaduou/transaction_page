import dotenv from "dotenv";

dotenv.config();

export interface BitcoinRpcConfig {
  url: string;
  username: string;
  password: string;
}

export interface AppConfig {
  port: number;
  bitcoinRpc?: BitcoinRpcConfig;
}

function getBitcoinRpcConfig(): BitcoinRpcConfig | undefined {
  const url = process.env.BITCOIN_RPC_URL;
  const username = process.env.BITCOIN_RPC_USER;
  const password = process.env.BITCOIN_RPC_PASSWORD;

  if (!url || !username || !password) {
    // TODO: Consider enforcing Bitcoin Core RPC configuration in production.
    return undefined;
  }

  return { url, username, password };
}

export const config: AppConfig = {
  port: Number(process.env.PORT) || 3033,
  bitcoinRpc: getBitcoinRpcConfig()
};

