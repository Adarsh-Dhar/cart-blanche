

from google.adk.agents import LlmAgent
from google.adk.tools.google_search_tool import GoogleSearchTool
from .premium_reviews_tool import PremiumReviewsTool

from .skale_bite import skale_bite

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
        2. Encrypt the 'max_budget' using SKALE BITE v2 (fetch BLS public key, encrypt locally).
        3. Send only the product requirements (excluding budget) to merchants/search.
        4. Only decrypt the budget once a merchant provides a signed CartMandate to verify if it's within range.
        """
        max_budget = user_intent.get("max_budget")
        encrypted_data = None
        if max_budget is not None:
            encrypted_data = skale_bite.encrypt(max_budget)
        intent_for_merchants = {k: v for k, v in user_intent.items() if k != "max_budget"}
        intent_for_merchants["encrypted_budget"] = encrypted_data
        return intent_for_merchants

    def decrypt_budget(self, encrypted_budget: dict) -> float:
        return vault_agent.decrypt_budget(encrypted_budget["ciphertext"])

shopping_agent = ShoppingAgent()
