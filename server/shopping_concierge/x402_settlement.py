# x402 Settlement Tool for Payment Processor Agent
# This is a stub for blockchain settlement. Replace with real x402 logic as needed.

from google.adk.agents import LlmAgent
from server.shopping_concierge.x402_settlement_tool import X402SettlementTool

# Example Payment Processor Agent using the tool
payment_processor_agent = LlmAgent(
    name="PaymentProcessorAgent",
    instruction="""Receive payment_mandate and trigger x402 settlement.\nReturn settlement receipt.""",
    tools=[X402SettlementTool()],
    output_key="settlement_receipt"
)
