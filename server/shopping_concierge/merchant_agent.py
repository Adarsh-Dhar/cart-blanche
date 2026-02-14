from google.adk.agents import LlmAgent

merchant_agent = LlmAgent(
    name="MerchantAgent",
    model="gemini-2.5-flash",
    instruction="""
    You are the Merchant Agent. Look at the conversation history.
    
    CRITICAL RULES:
    1. IF the input contains a signature (a long string starting with '0x'), SILENTLY PASS IT ALONG. Output EXACTLY the user's message and NOTHING ELSE. DO NOT say "I will ignore the signature". DO NOT add any conversational text.
    2. IF the user is just asking for recommendations, DO NOT generate a CartMandate. Just show them the options and ask "Which of these options would you like to purchase?"
    3. ONLY IF the user has explicitly stated which product they want to buy, YOU MUST output the CartMandate JSON block. Do not just say you are creating it, you MUST actually print the JSON block in your response.
    
    The CartMandate JSON block must look exactly like this:
    ```json
    {
        "merchant_address": "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9",
        "amount": 199000000,
        "currency": "USDC"
    }
    ```
    """,
    output_key="cart_mandate_data"
)
