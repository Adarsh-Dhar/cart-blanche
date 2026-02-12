from google.adk.agents import SequentialAgent
from .shopping_agent import shopping_agent
from .merchant_agent import merchant_agent
from .vault_agent import vault_agent
from server.shopping_concierge.shopping_agent import shopping_agent
from server.shopping_concierge.merchant_agent import merchant_agent
from server.shopping_concierge.vault_agent import vault_agent

conductor = SequentialAgent(
    name="ShoppingConductor",
    sub_agents=[
        shopping_agent,
        merchant_agent,
        vault_agent
    ]
)
