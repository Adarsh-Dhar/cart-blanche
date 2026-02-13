# __init__.py (ADK entrypoint for /apps/shopping_concierge)
from ..conductor import conductor
from ..x402_settlement import payment_processor_agent

# The ADK looks for this variable name in this file to register the app as 'shopping_concierge'
AGENTS = [conductor, payment_processor_agent]
