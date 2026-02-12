import uvicorn
from typing import Any
from fastapi import FastAPI
from x402.http import FacilitatorConfig, HTTPFacilitatorClient
from x402.http.middleware.fastapi import PaymentMiddlewareASGI
from x402.http.types import RouteConfig
from x402.mechanisms.evm.exact import ExactEvmServerScheme
from x402.server import x402ResourceServer

app = FastAPI()

# 1. Merchant Configuration
RECIPIENT_ADDRESS = "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9" 
NETWORK_ID = "eip155:84532" # Base Sepolia

# 2. Setup x402 Server
facilitator = HTTPFacilitatorClient(
    FacilitatorConfig(url="https://x402.org/facilitator")
)
server = x402ResourceServer(facilitator)
server.register(NETWORK_ID, ExactEvmServerScheme())

# 3. Define the Product (The "Headphones" or Cart)
routes: dict = {
    "GET /checkout": RouteConfig(
        {
            "amount": "0.01", 
            "token": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", # Base Sepolia USDC
            "recipient": RECIPIENT_ADDRESS,
            "network": NETWORK_ID
        },
        mime_type="application/json",
        description="Checkout Payment for Headphones",
    ),
}

app.add_middleware(PaymentMiddlewareASGI, routes=routes, server=server)

@app.get("/checkout")
async def checkout_endpoint() -> dict[str, Any]:
    return {
        "status": "paid", 
        "message": "Payment successful! Your order #12345 is confirmed."
    }

if __name__ == "__main__":
    print("Merchant Server running on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)
