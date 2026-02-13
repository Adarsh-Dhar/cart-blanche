
from google.adk.agents import LlmAgent
from google.adk.tools.google_search_tool import GoogleSearchTool
from .premium_reviews_tool import PremiumReviewsTool



shopping_agent = LlmAgent(
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
