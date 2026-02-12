
from google.adk.agents import LlmAgent
from .x402_settlement_tool import X402SettlementTool

from google.adk.agents import LlmAgent
from .x402_settlement_tool import X402SettlementTool

payment_processor_agent = LlmAgent(
    name="PaymentProcessorAgent",
    model="gemini-2.5-flash",
    instruction="""
    You are the Settlement Layer using x402.

    1. CHECK AUTHORIZATION:
       - Look at 'payment_mandate'.
       - IF it contains "authorized": true (or is a valid JSON confirming approval):
         IMMEDIATELY call the tool `x402_settlement`.
       
       - IF NO AUTHORIZATION:
         Reply: "Waiting for user approval..."
         STOP.

    2. RESULT:
       - If tool returns "settled":
         Reply: "✅ Payment Complete! The merchant has released the goods."
       - If tool returns error, show the reason.
    """,
    tools=[X402SettlementTool()],
    output_key="settlement_receipt"
)
