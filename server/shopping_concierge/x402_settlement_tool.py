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
        print("\n" + "="*80)
        print("[X402_TOOL] EXECUTING x402_settlement tool!")
        print("="*80)
        
        # Try to import get_x402_client
        try:
            from .adk_context_utils import get_x402_client
            print("[X402_TOOL] ✅ Successfully imported get_x402_client")
        except ImportError as e:
            print(f"[X402_TOOL] ❌ FAILED to import get_x402_client: {e}")
            print("[X402_TOOL] This means adk_context_utils.py doesn't have the function!")
            import traceback
            traceback.print_exc()
            return {"status": "error", "reason": f"Import failed: {e}"}
        except Exception as e:
            print(f"[X402_TOOL] ❌ Unexpected error during import: {e}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "reason": f"Unexpected import error: {e}"}
        
        # The merchant server must be running on this port
        merchant_url = "http://localhost:8001/checkout"
        print(f"[X402_TOOL] Target merchant URL: {merchant_url}")

        try:
            # Get the x402 client
            print("[X402_TOOL] Creating x402 client...")
            client = get_x402_client()
            print("[X402_TOOL] ✅ x402 client created successfully")
            
            # 1. Prepare request
            print(f"[X402_TOOL] Preparing GET request to {merchant_url}")
            request = httpx.Request("GET", merchant_url)
            
            # 2. Negotiate payment manually to capture TX Hash
            print(f"[x402] Negotiating payment with Facilitator for {merchant_url}...")
            try:
                payment = await client.pay_for_request(request)
                print(f"[x402] ✅ Payment negotiated successfully")
            except Exception as e:
                print(f"[x402] ❌ Payment negotiation failed: {e}")
                import traceback
                traceback.print_exc()
                return {"status": "error", "reason": f"Payment negotiation failed: {e}"}
            
            # 3. Extract the hash from the payment object
            tx_hash = getattr(payment, 'tx_hash', None)
            if not tx_hash:
                print(f"[x402] ⚠️  Warning: No tx_hash attribute on payment object")
                print(f"[x402] Payment object attributes: {dir(payment)}")
                tx_hash = "Hash not available"
            
            print(f"[x402] ✅ Transaction Hash: {tx_hash}")
            
            # 4. Finish the request to the merchant with proof of payment headers
            print(f"[x402] Adding payment headers to request...")
            request.headers.update(payment.to_headers())
            
            print(f"[x402] Sending final request to merchant...")
            async with httpx.AsyncClient() as http:
                try:
                    response = await http.send(request)
                    print(f"[x402] Merchant response status: {response.status_code}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        print(f"[x402] ✅ Merchant accepted payment!")
                        print(f"[x402] Response: {data}")
                        
                        return {
                            "status": "settled",
                            "tx_id": tx_hash,
                            "network": "base-sepolia",
                            "message": data.get("message", "Payment successful")
                        }
                    else:
                        print(f"[x402] ❌ Merchant rejected payment: {response.status_code}")
                        print(f"[x402] Response text: {response.text}")
                        return {
                            "status": "error", 
                            "reason": f"Merchant rejected: HTTP {response.status_code} - {response.text}"
                        }
                        
                except httpx.ConnectError as e:
                    print(f"[x402] ❌ Cannot connect to merchant at {merchant_url}")
                    print(f"[x402] Error: {e}")
                    print(f"[x402] Make sure the merchant server is running on port 8001!")
                    return {
                        "status": "error",
                        "reason": f"Cannot connect to merchant at {merchant_url}. Is the server running?"
                    }
                except Exception as e:
                    print(f"[x402] ❌ Error sending request to merchant: {e}")
                    import traceback
                    traceback.print_exc()
                    return {"status": "error", "reason": f"Merchant request failed: {e}"}

        except ValueError as e:
            # This catches "AGENT_PRIVATE_KEY not set" error
            print(f"[X402_TOOL] ❌ Configuration error: {e}")
            print(f"[X402_TOOL] Check your .env file has AGENT_PRIVATE_KEY set")
            return {"status": "error", "reason": str(e)}
        except Exception as e:
            print(f"[X402_TOOL] ❌ Unexpected error during payment: {e}")
            import traceback
            traceback.print_exc()
            return {"status": "error", "reason": f"Unexpected error: {e}"}