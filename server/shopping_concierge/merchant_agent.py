from google.adk.agents import LlmAgent


merchant_agent = LlmAgent(
    name="MerchantAgent",
    model="gemini-2.5-flash",
    instruction="""
    1. Pick the best product from 'discovery_data'.
    2. Generate a 'cart_mandate' JSON with REAL data formatted for an EIP-712 signature.
    3. CRITICAL MANDATE FIELDS:
       - 'merchant_address': '0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9'
       - 'chain_id': 11155111
       - 'amount': Integer representing the total in the smallest unit (e.g., 1000000 for 1.00 USDC)
       - 'currency': 'USDC'
    4. Format as valid JSON only. Do not include markdown blocks.
    """,
    output_key="cart_mandate"
)
