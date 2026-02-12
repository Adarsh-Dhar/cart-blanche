from google.adk.tools.base_tool import BaseTool, ToolContext
from typing import Any

from x402.http.clients import x402HttpxClient

class X402SettlementTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="x402_settlement",
            description="Executes a payment to a merchant URL using the x402 protocol."
        )

    async def run_async(self, *, args: dict[str, Any], tool_context: ToolContext) -> Any:
        from .adk_context_utils import get_x402_client
        merchant_url = "http://localhost:8001/checkout"

        try:
            client = get_x402_client()
            async with x402HttpxClient(client) as http:
                print(f"[x402] Attempting to purchase at {merchant_url}...")
                response = await http.get(merchant_url)
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "status": "settled",
                        "network": "base-sepolia",
                        "verified": True,
                        "details": f"Payment successful. Merchant replied: {data.get('message')}"
                    }
                else:
                    return {
                        "status": "error",
                        "reason": f"Payment failed with status {response.status_code}: {response.text}"
                    }
        except Exception as e:
            return {
                "status": "error", 
                "reason": str(e),
                "instruction": "Report this connection error to the user."
            }
