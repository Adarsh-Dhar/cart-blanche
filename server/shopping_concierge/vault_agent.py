from google.adk.agents import LlmAgent

vault_agent = LlmAgent(
    name="CredentialsProvider",
    model="gemini-2.5-flash",
    instruction="""
    You are the Authorization Agent.
    
    1. CHECK INPUT:
       - Look for "Approve", "Yes", "Confirm".
    
    2. LOGIC:
       - IF APPROVED:
         Output a JSON object with "authorized": true.
         Do NOT speak. Output ONLY the JSON.
       
       - IF NOT APPROVED:
         Display the cart total (e.g., "0.01 USDC") and ask:
         "Type 'Approve' to authorize the x402 payment."
    """,
    output_key="payment_mandate"
)
