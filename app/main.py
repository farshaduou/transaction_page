from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from app.config import config
from app.models import BitcoinOnchainTransaction, CreateTransactionRequest, TransactionType
from app.services.bitcoin_onchain import (
    create_bitcoin_onchain_transaction,
    get_bitcoin_onchain_transaction,
)

app = FastAPI(
    title="transaction_page (Python)",
    description=(
        "Web-based service to accept and settle decentralized transactions.\n\n"
        "This Python implementation mirrors the Node/TypeScript API and currently "
        "supports only Bitcoin on-chain transactions. Lightning and stablecoins are "
        "left as TODOs and return HTTP 501."
    ),
    version="0.1.0",
)


@app.get("/health")
async def health() -> dict:
    return {"ok": True}


@app.post(
    "/transactions",
    response_model=BitcoinOnchainTransaction,
    responses={
        400: {"description": "Invalid request"},
        501: {"description": "Transaction type not yet implemented"},
    },
)
async def create_transaction(request: CreateTransactionRequest):
    if request.type is TransactionType.bitcoin_onchain:
        try:
            tx = create_bitcoin_onchain_transaction(config.bitcoin_rpc, request)
            return tx
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    # TODO: Implement Lightning and stablecoin transaction types.
    return JSONResponse(
        status_code=501,
        content={
            "error": "This transaction type is not yet implemented.",
            "type": request.type,
        },
    )


@app.get(
    "/transactions/{transaction_id}",
    response_model=BitcoinOnchainTransaction,
    responses={404: {"description": "Transaction not found"}},
)
async def get_transaction(transaction_id: str):
    tx = get_bitcoin_onchain_transaction(transaction_id)
    if tx is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx


# Note: You typically start this with:
#   uvicorn app.main:app --reload --port 3033
# or let PORT from the environment control the port.

