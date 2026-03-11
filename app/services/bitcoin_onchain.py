from __future__ import annotations

import base64
import uuid
from typing import Dict

import requests

from app.config import BitcoinRpcConfig
from app.models import BitcoinOnchainTransaction, CreateTransactionRequest, TransactionType


_store: Dict[str, BitcoinOnchainTransaction] = {}


def _call_bitcoin_rpc(
    rpc: BitcoinRpcConfig,
    method: str,
    params: list,
) -> object:
    payload = {
        "jsonrpc": "1.0",
        "id": "transaction_page_python",
        "method": method,
        "params": params,
    }

    auth = base64.b64encode(f"{rpc.username}:{rpc.password}".encode("utf-8")).decode("ascii")

    response = requests.post(
        rpc.url,
        json=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {auth}",
        },
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    if data.get("error"):
        raise RuntimeError(data["error"].get("message") or "Bitcoin RPC error")

    return data.get("result")


def create_bitcoin_onchain_transaction(
    rpc: BitcoinRpcConfig | None,
    request: CreateTransactionRequest,
) -> BitcoinOnchainTransaction:
    if request.type is not TransactionType.bitcoin_onchain:
        raise ValueError("create_bitcoin_onchain_transaction expects type=bitcoin_onchain")

    if rpc is None:
        # No RPC configured: return a mock address so integrators can still test the flow.
        tx_id = str(uuid.uuid4())
        mock_address = f"btc-test-{tx_id}"
        tx = BitcoinOnchainTransaction(
            transactionId=tx_id,
            amountSats=request.amountSats,
            address=mock_address,
        )
        _store[tx.transactionId] = tx
        return tx

    address = str(
        _call_bitcoin_rpc(
            rpc,
            "getnewaddress",
            [request.description or "transaction_page_python", "bech32"],
        )
    )

    tx_id = str(uuid.uuid4())
    tx = BitcoinOnchainTransaction(
        transactionId=tx_id,
        amountSats=request.amountSats,
        address=address,
    )
    _store[tx.transactionId] = tx
    return tx


def get_bitcoin_onchain_transaction(transaction_id: str) -> BitcoinOnchainTransaction | None:
    return _store.get(transaction_id)


# TODO: Add background task or scheduled job to query Bitcoin Core for confirmations
# and update the `status` field to `settled` once the required number of confirmations
# is reached.

