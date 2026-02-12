
from google.adk.agents import LlmAgent
from google.adk.tools.google_search_tool import GoogleSearchTool


shopping_agent = LlmAgent(
    name="ShoppingAgent",
    model="gemini-2.5-flash",
    instruction="""
    1. Translate user intent into an Intent Mandate.
    2. Use the GoogleSearchTool to find specific products, prices, and merchants.
    3. Output a list of at least 3 specific product options (Name, Price, Merchant, URL) to 'discovery_data'.
    4. If the user hasn't picked a specific model, present the options found.
    """,
    tools=[GoogleSearchTool()],
    output_key="discovery_data"
)
