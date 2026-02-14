

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
            1. Translate user intent into an Intent Mandate.
            2. Use the GoogleSearchTool to find specific products, prices, and merchants.
            3. Output a list of at least 3 specific product options (Name, Price, Merchant, URL) to 'discovery_data'.
            4. If the user hasn't picked a specific model, present the options found.

            CRITICAL RULE:
            - If the user says "Approve", "Yes", or "Confirm", YOU MUST IGNORE IT.
            - Do NOT say "Payment approved". Do NOT say "Order placed". 
            - Let the other agents handle the checkout and payment.
            
            When a user asks for product recommendations, you MUST use the `get_premium_reviews` tool to get expert opinions before suggesting items. After giving options, wait for the user to pick one before generating a CartMandate.
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
