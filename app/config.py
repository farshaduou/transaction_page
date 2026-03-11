from __future__ import annotations

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass
class BitcoinRpcConfig:
    url: str
    username: str
    password: str


@dataclass
class AppConfig:
    port: int
    bitcoin_rpc: BitcoinRpcConfig | None


def _get_bitcoin_rpc_config() -> BitcoinRpcConfig | None:
    url = os.getenv("BITCOIN_RPC_URL")
    username = os.getenv("BITCOIN_RPC_USER")
    password = os.getenv("BITCOIN_RPC_PASSWORD")

    if not url or not username or not password:
        # TODO: Consider making Bitcoin Core RPC configuration mandatory in production.
        return None

    return BitcoinRpcConfig(url=url, username=username, password=password)


config = AppConfig(
    port=int(os.getenv("PORT") or "3033"),
    bitcoin_rpc=_get_bitcoin_rpc_config(),
)

