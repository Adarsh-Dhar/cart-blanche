
from google.adk.agents import LlmAgent
from google.adk.tools.google_search_tool import GoogleSearchTool

shopping_agent = LlmAgent(
    name="ShoppingAgent",
    model="gemini-2.5-flash",
    instruction="""You are a User Proxy. \\\n+    1. Translate user intent into an Intent Mandate.\\n    2. Use the A2A protocol to find merchants via /.well-known/agent.json.\\n    3. Output the discovery results to the 'discovery_data' key.""",
    tools=[GoogleSearchTool()],
    output_key="discovery_data"
)
