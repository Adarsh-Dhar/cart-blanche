
from google.adk.agents import SequentialAgent
from .shopping_agent import shopping_agent
from .merchant_agent import merchant_agent
from .vault_agent import vault_agent
from .x402_settlement import payment_processor_agent

class ShoppingConciergeConductor(SequentialAgent):
    def __init__(self):
        super().__init__(
            name="shopping_concierge",
            sub_agents=[shopping_agent, merchant_agent, vault_agent, payment_processor_agent]
        )

    def orchestrate(self, user_intent: dict):
        # 1. ShoppingAgent encrypts budget
        merchant_intent = shopping_agent.process_intent(user_intent)
        # 2. MerchantAgent receives only encrypted budget
        merchant_response = merchant_agent.handle_intent(merchant_intent)
        # 3. If merchant provides signed CartMandate, VaultAgent decrypts budget for validation
        if merchant_response.get("cart_mandate"):
            encrypted_budget = merchant_intent.get("encrypted_budget")
            decrypted_budget = vault_agent.decrypt_budget(encrypted_budget["ciphertext"])
            # 4. Validate if CartMandate amount is within budget
            cart_amount = merchant_response["cart_mandate"].get("amount")
            if cart_amount and float(cart_amount) <= decrypted_budget:
                # Proceed to payment settlement
                return payment_processor_agent.settle(merchant_response["cart_mandate"])
            else:
                return {"error": "Cart amount exceeds authorized budget."}
        return merchant_response

conductor = ShoppingConciergeConductor()
