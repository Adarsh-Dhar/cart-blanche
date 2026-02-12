from google.adk.agents import LlmAgent


merchant_agent = LlmAgent(
    name="MerchantAgent",
    # FIX: Added 'openrouter/' prefix. The full string has two parts: provider + model_id
    model="gemini-2.5-flash",
    instruction="""
    1. Pick the best product from 'discovery_data'.
    2. Generate a 'cart_mandate' JSON with REAL data.
    3. CRITICAL MANDATE FIELDS:
       - 'merchant_address': '0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9'
       - 'chain_id': 11155111
       - 'currency': 'USDC'
    4. Format as valid JSON only.
    """,
    output_key="cart_mandate"
)
