

from google.adk.agents import LlmAgent
from google.adk.tools.google_search_tool import GoogleSearchTool
from .premium_reviews_tool import PremiumReviewsTool

from .vault_agent import vault_agent

class ShoppingAgent:
    def __init__(self):
        self.llm_agent = LlmAgent(
            name="ShoppingAgent",
            model="gemini-2.5-flash",
            instruction="""
            The Project Orchestrator will give you a list of categories to fill for a project/event (e.g., Wedding, Birthday, Hike).
            
            CRITICAL RULES:
            1. BYPASS ON APPROVAL: If the user says "Approve", "Yes", "Confirm", "That's fine", or "Looks good", YOU MUST SILENTLY PASS IT ALONG. Do not generate a plan. Do not ask questions. Output exactly the user's message so the Merchant Agent can process the payment.
            2. ALL AT ONCE: When given categories by the Orchestrator, use the GoogleSearchTool to find items for ALL categories simultaneously. Do not do it one by one.
            3. Present a SINGLE cohesive "Proposed Project Plan" to the user containing ALL items, their prices, and the total cost.
            4. At the very end of your full plan, ask: "Does this proposed plan look good, or would you like to swap anything out?"
            
            Format your output cleanly using markdown. Do not generate JSON.
            """,
            tools=[PremiumReviewsTool(), GoogleSearchTool()],
            output_key="discovery_data"
        )


    def process_intent(self, user_intent: dict) -> dict:
        """
        1. Receive user intent.
        2. Delegate budget encryption to VaultAgent (SKALE BITE v2).
        3. Send only the product requirements (excluding budget) to merchants/search.
        """
        max_budget = user_intent.get("max_budget")
        encrypted_data = None
        if max_budget is not None:
            # Active trigger: VaultAgent secures the limit
            encrypted_data = vault_agent.encrypt_budget(max_budget)
        intent_for_merchants = {k: v for k, v in user_intent.items() if k != "max_budget"}
        intent_for_merchants["encrypted_budget"] = encrypted_data
        return intent_for_merchants


shopping_agent = ShoppingAgent()
