from google.adk.agents import SequentialAgent
from .shopping_agent import shopping_agent
from .merchant_agent import merchant_agent

from .vault_agent import vault_agent
from .x402_settlement import payment_processor_agent

conductor = SequentialAgent(
    name="shopping_concierge",
    sub_agents=[
        shopping_agent,
        merchant_agent,
        vault_agent,
        payment_processor_agent
    ]
)
