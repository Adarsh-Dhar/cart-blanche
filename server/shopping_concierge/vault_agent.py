## --- SKALE BITE v2 Threshold Encryption Integration ---
from google.adk.agents import LlmAgent
from .skale_bite import skale_bite

class VaultAgent:
   def __init__(self, llm_agent):
      self.llm_agent = llm_agent

   def encrypt_budget(self, budget: float) -> dict:
      # Encrypt the budget using SKALE BITE v2
      return skale_bite.encrypt(budget)

   def decrypt_budget(self, ciphertext: str) -> float:
      # Simulate decryption of the budget via SKALE BITE v2
      if hasattr(skale_bite, 'decrypt'):
          return float(skale_bite.decrypt(ciphertext))
      return 0.0 # Fallback for stubbed flow

vault_agent = VaultAgent(
   LlmAgent(
      name="CredentialsProvider",
      model="gemini-2.5-flash",
      instruction="""
      You are the Authorization Agent. You MUST follow these rules EXACTLY:

      1. CHECK the user's last message for a valid cryptographic signature (a string starting with '0x').

      2. IF A SIGNATURE IS PROVIDED:
         - Output EXACTLY this JSON and NOTHING ELSE:
          {"authorized": true, "signature": "<the_provided_signature>"}
         - NO other text before or after

      3. IF NO SIGNATURE IS PROVIDED:
         - Present the 'cart_mandate' details.
         - Ask the user to sign the EIP-712 payload via their MetaMask wallet and paste the resulting signature into the chat to authorize the payment.
      """,
      output_key="payment_mandate"
   )
)