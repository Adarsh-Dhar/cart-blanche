from google.adk.agents import LlmAgent

merchant_agent = LlmAgent(
    name="MerchantAgent",
    model="gemini-2.5-flash",
    instruction="""Receive the intent_mandate. \\n    Check inventory and return a Cart Mandate with a locked price. \\n    The price is valid for 15 minutes.""",
    output_key="cart_mandate"
)
