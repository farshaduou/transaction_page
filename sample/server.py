from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional

import requests
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles


def _join_url(base: str, p: str) -> str:
    return f"{base.rstrip('/')}/{p.lstrip('/')}"


TRANSACTION_API_BASE = os.getenv("TRANSACTION_API_BASE", "http://localhost:3033")

app = FastAPI(title="transaction_page sample site (Python)")

def _proxy_json(method: str, path: str, body: Optional[Dict[str, Any]]) -> Response:
    url = _join_url(TRANSACTION_API_BASE, path)
    headers = {"Accept": "application/json"}

    try:
        resp = requests.request(
            method=method,
            url=url,
            headers={**headers, **({"Content-Type": "application/json"} if body is not None else {})},
            json=body,
            timeout=10,
        )
    except requests.RequestException as exc:
        raise HTTPException(
            status_code=502,
            detail={
                "error": "Failed to reach transaction API",
                "details": str(exc),
                "transactionApiBase": TRANSACTION_API_BASE,
            },
        ) from exc

    content_type = resp.headers.get("content-type", "")
    if "application/json" in content_type:
        try:
            return JSONResponse(status_code=resp.status_code, content=resp.json())
        except ValueError:
            return JSONResponse(status_code=resp.status_code, content=None)

    return Response(status_code=resp.status_code, content=resp.content, media_type=content_type or None)


@app.get("/api/health")
def api_health() -> Response:
    return _proxy_json("GET", "/health", None)


@app.post("/api/transactions")
async def api_create_transaction(request: Request) -> Response:
    body = await request.json()
    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail={"error": "JSON body must be an object"})
    return _proxy_json("POST", "/transactions", body)


@app.get("/api/transactions/{transaction_id}")
def api_get_transaction(transaction_id: str) -> Response:
    return _proxy_json("GET", f"/transactions/{transaction_id}", None)


# Mount the static frontend last so /api/* routes win.
public_dir = Path(__file__).resolve().parent / "public"
app.mount("/", StaticFiles(directory=str(public_dir), html=True), name="static")

