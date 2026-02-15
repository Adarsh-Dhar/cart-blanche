import asyncio
import os
import json
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_typed_data

# Import your actual tool
from shopping_concierge.x402_settlement_tool import X402SettlementTool

# 1. Create a dummy "User" wallet to sign the mandate
# (This is just a random throwaway key used solely for generating a valid signature)
dummy_user_key = "0x" + "1" * 64
user_account = Account.from_key(dummy_user_key)

# 2. Build the exact Batch CartMandate payload your frontend generates
cart_mandate = {
    "chain_id": 324705682,
    "merchant_address": "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9",
    "amount": 250, # $250 total project cost
    "currency": "USDC",
    "merchants": [
        {
            "name": "Test Vendor 1 (Backpack)",
            "merchant_address": "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9",
            "amount": 50
        },
        {
            "name": "Test Vendor 2 (Shoes)",
            "merchant_address": "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9",
            "amount": 200
        }
    ]
}

# 3. Mathematically construct the EIP-712 Signature
domain = {
    "name": "CartBlanche",
    "version": "1",
    "chainId": cart_mandate["chain_id"],
    "verifyingContract": "0x0000000000000000000000000000000000000000"
}
message = {
    "merchant_address": cart_mandate["merchant_address"],
    "amount": cart_mandate["amount"],
    "currency": cart_mandate["currency"]
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

signable_bytes = encode_typed_data(domain_data=domain, message_types={"CartMandate": types["CartMandate"]}, message_data=message)
signed_message = Account.sign_message(signable_bytes, private_key=user_account.key)
signature = signed_message.signature.hex()

print(f"👤 Mock User Address: {user_account.address}")
print(f"✍️ Generated Signature: {signature[:15]}...\n")

# 4. Package it exactly like the LLM does
payment_mandate = {
    "signature": signature,
    "cart_mandate": cart_mandate,
    "user_wallet_address": user_account.address
}

async def run_test():
    # Make sure we have the Agent's private key to pay the gas/funds!
    if not os.environ.get("SKALE_AGENT_PRIVATE_KEY"):
        print("❌ ERROR: SKALE_AGENT_PRIVATE_KEY is missing from your environment!")
        print("Run: export SKALE_AGENT_PRIVATE_KEY='your_key_here' first.")
        return

    tool = X402SettlementTool()
    
    print("🚀 Firing X402 Settlement Tool (Real SKALE TX)...\n")
    try:
        # Run the tool asynchronously (we pass None for context since the tool doesn't use it)
        result = await tool.run_async(args={"payment_mandate": payment_mandate}, tool_context=None)
        
        print("\n========================================")
        print("✅ SETTLEMENT SUCCESSFUL!")
        print("========================================")
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print("\n❌ SETTLEMENT FAILED!")
        print(e)

if __name__ == "__main__":
    # Ensure the script runs in the correct directory context
    from dotenv import load_dotenv
    load_dotenv() # Loads the .env file containing your SKALE agent key
    
    asyncio.run(run_test())