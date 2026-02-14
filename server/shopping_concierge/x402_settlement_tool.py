
from google.adk.tools.base_tool import BaseTool, ToolContext
from typing import Any
import json
from cdp import Cdp, Wallet

class X402SettlementTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="x402_settlement",
            description="Settle payments on the x402 blockchain."
        )

    async def run_async(self, *, args: dict[str, Any], tool_context: ToolContext) -> Any:
        payment_mandate = args.get("payment_mandate", {})
        if isinstance(payment_mandate, str):
            try: payment_mandate = json.loads(payment_mandate)
            except: pass
        
        signature = payment_mandate.get("signature", "No signature provided")
        print(f"\n[X402_TOOL] 🚨 Processing EIP-712 Signature: {signature[:15]}...\n")

        # Extract amount and convert from smallest unit to standard USDC
        amount_smallest = payment_mandate.get("amount", 0)
        amount_usdc = amount_smallest / 1_000_000 
        merchant_address = payment_mandate.get("merchant_address", "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9")

        print(f"[X402_TOOL] Using CDP SDK to transfer {amount_usdc} USDC to {merchant_address}...")
        
        actual_tx_hash = "0xCDP_CHECKOUT_TX_PENDING..."
        
        try:
            # 🚨 REAL CDP SDK IMPLEMENTATION 🚨
            Cdp.configure_from_environment() 
            
            wallet_id = os.environ.get("AGENT_WALLET_ID")
            agent_wallet = Wallet.fetch(wallet_id)
            
            print(f"[X402_TOOL] Executing on-chain transfer of {amount_usdc} USDC to {merchant_address}...")
            # Note: ensure your agent wallet has Base Sepolia USDC and ETH for gas
            transfer = agent_wallet.transfer(amount_usdc, "usdc", merchant_address)
            transfer.wait()
            
            actual_tx_hash = transfer.transaction_hash
            print(f"[X402_TOOL] ✅ CDP SDK Transfer executed successfully! TX: {actual_tx_hash}")
            
        except Exception as e:
            print(f"[X402_TOOL] ⚠️ CDP SDK Error: {e}")
            actual_tx_hash = f"0xCDP_FAILED_{str(e)[:15]}"
