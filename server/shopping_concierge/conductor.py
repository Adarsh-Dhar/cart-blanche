


from google.adk.agents import SequentialAgent
from .orchestrator_agent import orchestrator_agent
from .shopping_agent import shopping_agent
from .merchant_agent import merchant_agent
from .vault_agent import vault_agent
from .x402_settlement import payment_processor_agent

# The new hierarchical flow

# Fix: Only pass valid fields to SequentialAgent, remove duplicate assignment
conductor = SequentialAgent(
    name="cart_blanche_conductor",
    agents=[
        orchestrator_agent,
        shopping_agent,
        merchant_agent,
        vault_agent,
        payment_processor_agent
    ]
)
