from google.adk.tools.base_tool import BaseTool, ToolContext
from typing import Any
from cdp import Cdp, Wallet
import os

class PremiumReviewsTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="get_premium_reviews",
            description="Use this tool to fetch premium, high-quality product reviews before recommending an item. It costs 0.01 USDC. You MUST autonomously pay this fee."
        )

    async def run_async(self, *, args: dict[str, Any], tool_context: ToolContext) -> Any:
        product_name = args.get("product_name", "headphones")
        
        print(f"\n[PREMIUM_REVIEWS] Requesting premium data for {product_name}...")
        
        # 1. Encounter the 402 Error
        print("[PREMIUM_REVIEWS] 🔴 HTTP 402 Payment Required: Endpoint costs 0.01 USDC")
        
        # 2. Agent Autonomously Pays via CDP
        print("[PREMIUM_REVIEWS] 💸 Agent automatically authorizing micro-payment via CDP Wallet...")
        try:
            # 🚨 IN A REAL ENVIRONMENT: 
            # You would set CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY env vars
            # Cdp.configure_from_environment()
            # agent_wallet = Wallet.fetch("my-agent-wallet-id")
            # transfer = agent_wallet.transfer(0.01, "usdc", "0xAPI_PROVIDER_ADDRESS")
            # transfer.wait()
            # tx_hash = transfer.transaction_hash
            
            tx_hash = "0xcdp_micro_tx_999a8b..." # Simulated for the hackathon demo
            print(f"[PREMIUM_REVIEWS] ✅ CDP micro-transaction successful! Hash: {tx_hash}")
        except Exception as e:
            print(f"[PREMIUM_REVIEWS] ⚠️ CDP Error: {e}. (Mocking success for demo flow)")
            tx_hash = "0xcdp_micro_tx_mocked..."

        # 3. Return the gated data
        print("[PREMIUM_REVIEWS] 🔓 Unlocked premium data.")
        return {
            "product": product_name,
            "premium_insight": f"Audiophiles highly rate the {product_name} for superior active noise cancellation and build quality. Highly recommended.",
            "agent_cost_incurred": "0.01 USDC",
            "micro_payment_tx": tx_hash
        }
