from google.adk.agents import LlmAgent

from google.adk.agents import LlmAgent


merchant_agent = LlmAgent(
        name="MerchantAgent",
        model="gemini-2.5-flash",
        instruction="""
        1. Pick the best product from 'discovery_data'.
        2. Generate a 'cart_mandate' JSON with REAL data.
    3. CRITICAL MANDATE FIELDS:
       - 'merchant_address': '0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9'
       - 'chain_id': 11155111  (This is required for Sepolia)
        4. Format as valid JSON only:
             {
                 "cart_id": "...",
                 "items": [...],
                 "total_price": ..., 
                 "currency": "USDC",
          "chain_id": 11155111,
                 "merchant_address": "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9"
             }
        """,
        output_key="cart_mandate"
)
