
from google.adk.agents import SequentialAgent
from .shopping_agent import shopping_agent
from .merchant_agent import merchant_agent
from .skale_bite import skale_bite
from .x402_settlement import payment_processor_agent


class ShoppingConciergeConductor(SequentialAgent):
    def __init__(self):
        super().__init__(
            name="shopping_concierge",
            sub_agents=[shopping_agent.llm_agent, merchant_agent, payment_processor_agent]
        )

    def orchestrate(self, user_intent: dict):
        # 1. ShoppingAgent encrypts budget
        merchant_intent = shopping_agent.process_intent(user_intent)
        # 2. MerchantAgent receives only encrypted budget
        merchant_response = merchant_agent.handle_intent(merchant_intent)
        # 3. If merchant provides signed CartMandate, submit BITE decryption request
        if merchant_response.get("cart_mandate"):
            encrypted_budget = merchant_intent.get("encrypted_budget")
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
        return merchant_response

conductor = ShoppingConciergeConductor()
