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
         Output ONLY a JSON object with "authorized": true.
         Do NOT speak. Do NOT output any confirmation, payment, or order messages.
         Do NOT output anything else.
       - IF NOT APPROVED:
         Display the cart total and ask:
         "Type 'Approve' to authorize the x402 payment."
    """,
    output_key="payment_mandate"
)
