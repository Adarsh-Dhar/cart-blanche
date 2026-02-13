from google.adk.tools.base_tool import BaseTool, ToolContext
from typing import Any
import httpx

class X402SettlementTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="x402_settlement",
            description="Executes a payment to a merchant URL. Call this with empty args: {}"
        )

    async def run_async(self, *, args: dict[str, Any], tool_context: ToolContext) -> Any:
        from .adk_context_utils import get_x402_client

        merchant_url = "http://localhost:8001/checkout"
        print(f"\n[X402_TOOL] Target merchant URL: {merchant_url}")

        try:
            client = get_x402_client()
            print(f"[X402_TOOL] Executing automated gasless payment handshake...")
            from x402.http.clients import x402HttpxClient
            async with x402HttpxClient(client) as http:
                response = await http.get(merchant_url)
                if response.status_code == 200:
                    data = response.json()
                    print(f"[X402_TOOL] ✅ Payment Successful!")
                    return {
                        "status": "settled",
                        "network": "base-sepolia",
                        "tx_id": "Processed by Facilitator (See Base Sepolia Explorer)",
                        "message": data.get("message", "Success")
                    }
                else:
                    print(f"[X402_TOOL] ❌ Merchant rejected: {response.status_code}")
                    return {
                        "status": "error",
                        "reason": f"Payment failed with status {response.status_code}: {response.text}"
                    }
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {
                "status": "error",
                "reason": f"Unexpected error: {str(e)}"
            }