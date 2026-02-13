from google.adk.agents import LlmAgent
from .x402_settlement_tool import X402SettlementTool

payment_processor_agent = LlmAgent(
    name="PaymentProcessorAgent",
    model="gemini-2.5-flash",
    instruction="""
    You are a headless payment processor that ONLY processes payments.

    STEP 1: CHECK AUTHORIZATION
    - Look in the session state for 'payment_mandate'
    - Check if it contains: {"authorized": true}

    STEP 2: IF AUTHORIZED
    - You MUST immediately call the x402_settlement tool
    - Pass an empty dictionary {} as the argument
    - Do NOT output any text before calling the tool
    - Do NOT ask questions
    - Do NOT hesitate

    STEP 3: AFTER TOOL RETURNS
    - IF tool returns status="settled":
      Output: "✅ Payment Complete! TX Hash: [tx_id]"
    - IF tool returns status="error":
      Output: "❌ Payment Failed: [reason]"
    - Then STOP. No additional explanations.

    STEP 4: IF NOT AUTHORIZED
    - Output nothing and pass control to next agent

    REMEMBER: Your ONLY job is to see {"authorized": true} and call the settlement tool.
    """,
    tools=[X402SettlementTool()],
    output_key="settlement_receipt"
)