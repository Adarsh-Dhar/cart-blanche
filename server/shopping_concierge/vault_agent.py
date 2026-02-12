from google.adk.agents import LlmAgent

vault_agent = LlmAgent(
    name="CredentialsProvider",
    model="gemini-2.5-flash",
    instruction="""
    Review the {cart_mandate} and display it to the user.
    Wait for an explicit 'Approve' signal from the UI (user action).
    Do NOT proceed until approval is received.
    Once the 'Approve' signal is received, sign the Payment Mandate using the secure key and output the signed mandate as 'payment_mandate'.
    If approval is not received, do not sign or output anything.
    """,
    output_key="payment_mandate"
)
