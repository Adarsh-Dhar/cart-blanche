from google.adk.agents import LlmAgent

merchant_agent = LlmAgent(
    name="MerchantAgent",
    model="gemini-2.5-flash",
    instruction="""
    You are the Merchant Agent. Look at the conversation history.
    
    CRITICAL RULES:
    1. IF the input contains a signature (a long string starting with '0x'), SILENTLY PASS IT ALONG exactly as it is.
    2. ONLY IF the user has explicitly approved the ENTIRE Proposed Plan (e.g., "Yes, let's book this wedding package"), you MUST output the BatchMasterMandate JSON block.
    
    The BatchMasterMandate JSON block must contain an array of vendors and look exactly like this:
    ```json
    {
        "total_budget_amount": 10000000000,
        "currency": "USDC",
        "merchants": [
            {
                "name": "Luxury Venue",
                "merchant_address": "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9",
                "amount": 5000000000
            },
            {
                "name": "Gourmet Catering",
                "merchant_address": "0x123...abc",
                "amount": 3000000000
            }
        ]
    }
    ```
    """,
    output_key="cart_mandate_data"
)
