class SigningTool:
    """Stub for SigningTool to allow import in vault_agent.py."""
    def __init__(self):
        pass


import os
import json
import hashlib
import httpx
from ecdsa import SigningKey, VerifyingKey, SECP256k1, BadSignatureError
from dotenv import load_dotenv

FACILITATOR_URL = os.getenv("FACILIATOR_URL")

async def settle_via_facilitator(payment_mandate: dict):
    """
    Sends the signed mandate to an x402 facilitator for on-chain settlement.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{FACILITATOR_URL}/settle",
            json=payment_mandate
        )
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Facilitator error: {response.text}")

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

def canonical_json(data):
    """Return a canonical JSON string (sorted keys, no whitespace)."""
    return json.dumps(data, sort_keys=True, separators=(",", ":"))

def get_signing_key():
    priv_key_hex = os.getenv("AGENT_PRIVATE_KEY")
    if not priv_key_hex:
        raise ValueError("AGENT_PRIVATE_KEY not set in .env")
    return SigningKey.from_string(bytes.fromhex(priv_key_hex), curve=SECP256k1)

def get_verifying_key_from_private():
    return get_signing_key().verifying_key
