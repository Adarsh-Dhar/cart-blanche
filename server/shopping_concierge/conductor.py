

from google.adk.agents import SequentialAgent
from .shopping_agent import shopping_agent
from .merchant_agent import merchant_agent
from .vault_agent import vault_agent
from .skale_bite import skale_bite
from .x402_settlement import payment_processor_agent


class ShoppingConciergeConductor(SequentialAgent):
    def __init__(self):
        super().__init__(
            name="shopping_concierge",
            sub_agents=[
                shopping_agent.llm_agent,  # 1. Finds products (pass the inner ADK agent)
                merchant_agent,            # 2. Generates the CartMandate
                vault_agent.llm_agent,     # 3. CRITICAL: Reads the Metamask Signature to authorize!
                payment_processor_agent    # 4. Executes the SKALE transaction
            ]
        )
        def process_decryption(self, encrypted_budget, merchant_response):
            # Submit decryption request to SKALE BITE committee
            decrypt_status = skale_bite.decrypt_request(encrypted_budget["ciphertext"])
            # In production, poll for decryption result from the chain or oracle
            # Here, simulate async confirmation (replace with real event listener in prod)
            # Assume decryption result is available and budget is valid for demo
            cart_amount = merchant_response["cart_mandate"].get("amount")
            # TODO: Fetch decrypted budget from oracle/event
            # For now, just log the decryption request status
            print(f"[BITE] Decryption request status: {decrypt_status}")
            # Proceed to payment settlement (in real flow, only after decryption result)
            return {
                "decryption_status": decrypt_status,
                "proceed_to_settlement": True,
                "cart_mandate": merchant_response["cart_mandate"]
            }
    
            # The following lines are removed as they were incorrectly indented

conductor = ShoppingConciergeConductor()
