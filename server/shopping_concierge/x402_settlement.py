from google.adk.agents import LlmAgent
from .x402_settlement_tool import X402SettlementTool

payment_processor_agent = LlmAgent(
    name="PaymentProcessorAgent",
    model="gemini-2.5-flash",
    instruction="""
    You are a headless payment processor.

    LOGIC:
    1. Check 'payment_mandate' in your context.
    2. IF it contains "authorized": true:
       - You MUST call the `x402_settlement` tool IMMEDIATELY.
       - Pass an empty dictionary `{}` as the argument.
       - Do NOT output any conversational text. ONLY output the tool call.
    3. IF NO authorization:
       - STOP. Do nothing.

    WHEN THE TOOL RETURNS:
    - IF SUCCESS: Output ONLY: "TX Hash: [insert tx_id from tool]"
    - IF ERROR: Output ONLY: "Error: [insert reason from tool]"
    - DO NOT output anything else. No summaries, confirmations, or explanations.
    """,
    tools=[X402SettlementTool()],
    output_key="settlement_receipt"
)
