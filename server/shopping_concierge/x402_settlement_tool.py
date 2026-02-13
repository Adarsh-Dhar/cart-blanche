from google.adk.tools.base_tool import BaseTool, ToolContext
from typing import Any
import httpx
from eip712.messages import EIP712Message
from eth_account import Account

# Define the EIP-712 Domain and Types on the server
class CartMandate(EIP712Message):
    _name_ = "CartMandate"
    _version_ = "1"
    _chainId_ = 11155111
    
    merchant_address: 'address'
    amount: 'uint256'
    currency: 'string'

class X402SettlementTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="x402_settlement",
            description="Executes a verifiable payment to a merchant URL."
        )

    async def run_async(self, *, args: dict[str, Any], tool_context: ToolContext) -> Any:
        from .adk_context_utils import get_x402_client

        # Retrieve the mandate and the signature from the session state
        mandate_data = tool_context.session.state.get("cart_mandate", {})
        payment_mandate = tool_context.session.state.get("payment_mandate", {})
        
        signature = payment_mandate.get("signature")
        if not signature:
            return {"status": "error", "reason": "No MetaMask signature provided."}

        # Reconstruct the mandate to verify the signature
        try:
            mandate = CartMandate(
                merchant_address=mandate_data.get("merchant_address"),
                amount=int(mandate_data.get("amount", 0)),
                currency=mandate_data.get("currency")
            )
            
            # Recover the signer address from the signature
            signer_address = Account.recover_message(mandate.signable_message, signature=signature)
            print(f"[X402_TOOL] ✅ Verified signature from: {signer_address}")
        except Exception as e:
            return {"status": "error", "reason": f"Signature verification failed: {str(e)}"}

        merchant_url = "http://localhost:8001/checkout"
        print(f"\n[X402_TOOL] Target merchant URL: {merchant_url}")

        try:
            client = get_x402_client()
            print(f"[X402_TOOL] Executing automated gasless payment handshake...")
            from x402.http.clients import x402HttpxClient
            async with x402HttpxClient(client) as http:
                
                # Forward the verified payload to the merchant endpoint
                payload = {
                    "mandate": mandate_data,
                    "signature": signature,
                    "signer": signer_address
                }
                response = await http.post(merchant_url, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"[X402_TOOL] ✅ Payment Successful!")
                    return {
                        "status": "settled",
                        "network": "sepolia",
                        "tx_id": data.get("tx_id", "Processed by Facilitator"),
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