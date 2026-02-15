

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
            You are the Cart-Blanche Shopping Agent. The Orchestrator will give you a list of categories to fill for a project (like a Wedding).
            
            1. Use the GoogleSearchTool to find the best options for EACH category requested.
            2. VERIFY COMPATIBILITY: Ensure the items make sense together (e.g., Does this caterer serve at this venue? Are they in the same city?).
            3. Present a cohesive "Proposed Project Plan" to the user, listing the chosen vendors, their prices, and the total cost.
            4. Ask the user: "Does this proposed plan look good, or would you like to swap any vendors out?"
            
            Format your output cleanly using markdown lists. Do not generate JSON.
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
