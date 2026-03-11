from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, PositiveInt


class TransactionType(str, Enum):
    bitcoin_onchain = "bitcoin_onchain"
    bitcoin_lightning = "bitcoin_lightning"
    stablecoin = "stablecoin"


class CreateTransactionRequest(BaseModel):
    type: TransactionType
    amountSats: PositiveInt = Field(..., description="Amount in satoshis")
    description: Optional[str] = Field(
        default=None,
        description="Optional human-readable description for this transaction",
    )
    callbackUrl: Optional[str] = Field(
        default=None,
        description="Optional callback URL for future settlement notifications (not yet implemented)",
    )


class TransactionStatus(str, Enum):
    pending = "pending"
    settled = "settled"


class BitcoinOnchainTransaction(BaseModel):
    transactionId: str
    type: TransactionType = Field(
        default=TransactionType.bitcoin_onchain,
        description="Must always be 'bitcoin_onchain' for this model",
    )
    amountSats: PositiveInt
    address: str
    status: TransactionStatus = Field(TransactionStatus.pending)


