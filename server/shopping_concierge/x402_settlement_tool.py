from google.adk.tools.base_tool import BaseTool, ToolContext
from typing import Any
import httpx
from google.adk.tools.base_tool import BaseTool, ToolContext
from typing import Any

from x402.http.clients import x402HttpxClient

class X402SettlementTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="x402_settlement",
            description="Executes a payment to a merchant URL. Call this with empty args: {}"
        )

    async def run_async(self, *, args: dict[str, Any], tool_context: ToolContext) -> Any:
        from .adk_context_utils import get_x402_client
        
        # The merchant server must be running on this port
        merchant_url = "http://localhost:8001/checkout"

        try:
            client = get_x402_client()
            
            # 1. Prepare request
            request = httpx.Request("GET", merchant_url)
            
            # 2. Negotiate payment manually to capture TX Hash
            print(f"\n[x402] Negotiating payment with Facilitator for {merchant_url}...")
            payment = await client.pay_for_request(request)
            
            # 3. Extract the hash from the payment object!
            tx_hash = getattr(payment, 'tx_hash', 'Hash not available')
            print(f"[x402] ✅ Transaction Hash Generated: {tx_hash}")
            
            # 4. Finish the request to the merchant with proof of payment headers
            request.headers.update(payment.to_headers())
            
            async with httpx.AsyncClient() as http:
                response = await http.send(request)
                
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": "settled",
                        "tx_id": tx_hash,
                        "network": "base-sepolia",
                        "message": data.get("message", "Success")
                    }
                else:
                    return {"status": "error", "reason": f"Merchant rejected: {response.text}"}

        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"status": "error", "reason": str(e)}
