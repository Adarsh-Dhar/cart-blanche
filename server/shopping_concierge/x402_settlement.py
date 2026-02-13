from google.adk.agents import LlmAgent
from google.adk.agents.invocation_context import InvocationContext
from google.genai.types import Content, Part, FunctionCall
from typing import AsyncIterator

from .x402_settlement_tool import X402SettlementTool
from pydantic import PrivateAttr


class ForceToolPaymentProcessor(LlmAgent):
    """
    Custom payment processor that FORCES tool execution when authorization is detected.
    
    This bypasses the LLM's decision-making and directly calls the x402_settlement tool
    when {"authorized": true} is detected in the conversation.
    """
    
    _settlement_tool: X402SettlementTool = PrivateAttr(default=None)

    def __init__(self):
        super().__init__(
            name="PaymentProcessorAgent",
            model="gemini-2.5-flash",
            instruction="""
            You execute x402 payments by calling the x402_settlement tool.
            When you see {"authorized": true}, call the tool immediately.
            """,
            tools=[],  # Temporarily empty, will set after _settlement_tool is initialized
            output_key="settlement_receipt"
        )
        self._settlement_tool = X402SettlementTool()
        self.tools = [self._settlement_tool]
    
    async def run_async(self, context: InvocationContext) -> AsyncIterator:
        """Override run to force tool execution when authorization is detected"""
        
        print("\n" + "="*80)
        print("[PAYMENT_PROCESSOR] Agent starting...")
        print("="*80)
        
        # Check if authorization exists in session state
        payment_mandate = context.session.state.get("payment_mandate")
        print(f"[PAYMENT_PROCESSOR] payment_mandate from state: {payment_mandate}")
        
        # Check if authorization is in the conversation history
        authorization_found = False
        
        # Look at the last few messages in the session
        if hasattr(context.session, 'events') and context.session.events:
            print(f"[PAYMENT_PROCESSOR] Checking {len(context.session.events)} events...")
            for i, event in enumerate(context.session.events[-5:]):  # Check last 5 events
                if hasattr(event, 'content') and event.content and hasattr(event.content, 'parts') and event.content.parts:
                    for part in event.content.parts:
                        if hasattr(part, 'text'):
                            text = part.text.strip()
                            print(f"[PAYMENT_PROCESSOR] Event {i} text: {text[:100]}...")
                            if text == '{"authorized": true}' or '"authorized": true' in text or '"authorized":true' in text:
                                authorization_found = True
                                print(f"[PAYMENT_PROCESSOR] ✅ AUTHORIZATION FOUND in event {i}!")
                                break
                if authorization_found:
                    break
        
        # Also check the payment_mandate value directly
        if payment_mandate:
            if isinstance(payment_mandate, str):
                if '{"authorized": true}' in payment_mandate or '"authorized": true' in payment_mandate:
                    authorization_found = True
                    print(f"[PAYMENT_PROCESSOR] ✅ AUTHORIZATION FOUND in payment_mandate string!")
            elif isinstance(payment_mandate, dict):
                if payment_mandate.get("authorized") == True:
                    authorization_found = True
                    print(f"[PAYMENT_PROCESSOR] ✅ AUTHORIZATION FOUND in payment_mandate dict!")
        
        if authorization_found:
            print("[PAYMENT_PROCESSOR] 🚀 FORCING TOOL EXECUTION...")
            
            # FORCE the tool to execute
            try:
                print("[PAYMENT_PROCESSOR] Calling x402_settlement tool directly...")
                
                # Import ToolContext to create proper context
                from google.adk.tools.base_tool import ToolContext
                # ToolContext expects invocation_context as first argument
                tool_context = ToolContext(context)
                # Call the tool directly
                result = await self._settlement_tool.run_async(
                    args={},
                    tool_context=tool_context
                )
                
                print(f"[PAYMENT_PROCESSOR] ✅ Tool returned: {result}")
                
                # Format the response
                if result.get("status") == "settled":
                    tx_id = result.get("tx_id", "Unknown")
                    response_text = f"✅ Payment Complete! TX Hash: {tx_id}"
                    network = result.get("network", "unknown")
                    response_text += f"\nNetwork: {network}"
                    message = result.get("message")
                    if message:
                        response_text += f"\nMerchant response: {message}"
                else:
                    reason = result.get("reason", "Unknown error")
                    response_text = f"❌ Payment Failed: {reason}"
                
                print(f"[PAYMENT_PROCESSOR] Response text: {response_text}")
                
                # Update session state
                context.session.state["settlement_receipt"] = result
                
                # Yield the response
                from google.adk.events import Event
                response_content = Content(
                    role="model",
                    parts=[Part(text=response_text)]
                )
                yield Event(
                    invocation_id=context.invocation_id,
                    author=self.name,
                    content=response_content
                )
                
            except Exception as e:
                print(f"[PAYMENT_PROCESSOR] ❌ ERROR calling tool: {e}")
                import traceback
                traceback.print_exc()
                
                # Yield error response
                from google.adk.events import Event
                error_content = Content(
                    role="model",
                    parts=[Part(text=f"❌ Payment processor error: {e}")]
                )
                yield Event(
                    invocation_id=context.invocation_id,
                    author=self.name,
                    content=error_content
                )
        else:
            print("[PAYMENT_PROCESSOR] ❌ No authorization found. Skipping payment.")
            print(f"[PAYMENT_PROCESSOR] payment_mandate was: {payment_mandate}")
            
            # No authorization - pass through silently
            # Don't yield anything, just return


# Export the custom agent
payment_processor_agent = ForceToolPaymentProcessor()

print("="*80)
print("[x402_settlement.py] ForceToolPaymentProcessor initialized")
print("="*80)