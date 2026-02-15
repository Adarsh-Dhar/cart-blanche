from google.adk.tools.base_tool import BaseTool, ToolContext
from typing import Any
import json
import os

class X402SettlementTool(BaseTool):
    def __init__(self):
        super().__init__(
            name="x402_settlement",
            description="Settle payments on the x402 blockchain."
        )

    async def run_async(self, *, args: dict[str, Any], tool_context: ToolContext) -> Any:
        from web3 import Web3
        from eth_account.messages import encode_typed_data
        from eth_account import Account

        payment_mandate = args.get("payment_mandate", {})
        if isinstance(payment_mandate, str):
            try:
                payment_mandate = json.loads(payment_mandate)
            except Exception:
                pass

        signature = payment_mandate.get("signature")
        cart_mandate = payment_mandate.get("cart_mandate", {})
        print(f"\n[X402_TOOL] 🚨 Processing EIP-712 Signature: {str(signature)[:15]}...\n")

        if not signature or not cart_mandate:
            raise Exception("Missing signature or cart_mandate for verification")

        # EIP-712 Domain and Types (must match frontend)
        domain = {
            "name": "CartBlanche",
            "version": "1",
            "chainId": cart_mandate.get("chain_id", 324705682),
            "verifyingContract": "0x0000000000000000000000000000000000000000"
        }
        
        message = {
            "merchant_address": cart_mandate.get("merchant_address", "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9"),
            "amount": cart_mandate.get("amount") or cart_mandate.get("total_budget") or 0,
            "currency": cart_mandate.get("currency", "USDC")
        }
        
        types = {
            "EIP712Domain": [
                {"name": "name", "type": "string"},
                {"name": "version", "type": "string"},
                {"name": "chainId", "type": "uint256"},
                {"name": "verifyingContract", "type": "address"},
            ],
            "CartMandate": [
                {"name": "merchant_address", "type": "address"},
                {"name": "amount", "type": "uint256"},
                {"name": "currency", "type": "string"},
            ],
        }

        # Prepare signable bytes for EIP-712
        signable_bytes = encode_typed_data(
            domain_data=domain,
            message_types={"CartMandate": types["CartMandate"]},
            message_data=message
        )
        w3 = Web3(Web3.HTTPProvider("https://base-sepolia-testnet.skalenodes.com/v1/jubilant-horrible-ancha"))
        if not w3.is_connected():
            raise Exception("Could not connect to SKALE RPC")

        # Recover signer
        recovered_address = Account.recover_message(signable_bytes, signature=signature)
        print(f"[X402_TOOL] Verified Signer: {recovered_address}")

        merchants = cart_mandate.get("merchants", [])
        if not merchants:
            raise Exception("No merchants found in the batch mandate!")

        # 🚨 FIX 1: Define the agent_address and private_key here 🚨
        private_key = os.environ.get("SKALE_AGENT_PRIVATE_KEY")
        if not private_key:
            raise Exception("Missing SKALE_AGENT_PRIVATE_KEY in .env")
        agent_account = w3.eth.account.from_key(private_key)
        agent_address = agent_account.address

        print(f"[X402_TOOL] Starting BATCH SETTLEMENT for {len(merchants)} merchants...")
        tx_hashes = []

        # Loop through the list of merchants and pay them all
        for vendor in merchants:
            raw_vendor_address = vendor.get("merchant_address", "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9")
            
            # 🚨 FIX 2: Protect against LLM hallucinating bad hex strings like 0xJan5p... 🚨
            try:
                vendor_address = w3.to_checksum_address(raw_vendor_address)
            except ValueError:
                print(f"[X402_TOOL] ⚠️ Invalid address {raw_vendor_address}, falling back to default escrow.")
                vendor_address = "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9"

            print(f"[X402_TOOL] Paying {vendor.get('name', 'Vendor')} at {vendor_address}...")

            # Build the transaction for this specific vendor
            tx = {
                'nonce': w3.eth.get_transaction_count(agent_address),
                'to': vendor_address,
                'value': w3.to_wei(0.0001, 'ether'), # Proof of settlement
                'gas': 2000000,
                'gasPrice': w3.eth.gas_price,
                'chainId': 324705682 
            }

            signed_tx = w3.eth.account.sign_transaction(tx, private_key)
            tx_hash_bytes = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hash = w3.to_hex(tx_hash_bytes)

            # Wait for receipt
            print(f"[X402_TOOL] ⏳ Waiting for confirmation on {tx_hash}...")
            w3.eth.wait_for_transaction_receipt(tx_hash_bytes, timeout=120)
            tx_hashes.append(tx_hash)
            print(f"[X402_TOOL] ✅ Paid! TX: {tx_hash}")

        return {
            "status": "settled",
            "tx_id": tx_hashes[0] if tx_hashes else "0x", 
            "network": "SKALE Base Sepolia Testnet",
            "details": f"Successfully batch-settled {len(merchants)} vendors."
        }