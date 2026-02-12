


import os
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx
from dotenv import load_dotenv

# REMOVED: from google.genai.types import Content, Part 

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

from google.adk.cli.fast_api import get_fast_api_app
from server.shopping_concierge.shopping_agent import shopping_agent
from server.shopping_concierge.merchant_agent import merchant_agent
from server.shopping_concierge.adk_context_utils import SESSION_SERVICE, get_or_create_session, build_invocation_context

import os
import traceback
import json
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx
from dotenv import load_dotenv

# --- NOTE: Removed google.genai.types imports (Content, Part) as they confuse the ADK ---

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

from google.adk.cli.fast_api import get_fast_api_app
from server.shopping_concierge.shopping_agent import shopping_agent
from server.shopping_concierge.merchant_agent import merchant_agent
from server.shopping_concierge.adk_context_utils import SESSION_SERVICE, get_or_create_session, build_invocation_context

app: FastAPI = get_fast_api_app(
    agents_dir=os.path.join(os.path.dirname(__file__), "shopping_concierge"),
    web=False,
    allow_origins=["http://localhost:3000"]
)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/apps/shopping_concierge/run")
async def shopping_concierge_run(request: Request):
    # --- DEBUG START ---
    body = await request.json()
    print(f"\n[DEBUG] 1. Received Body: {json.dumps(body, indent=2)}")
    
    raw_input = body.get("new_message") or body.get("user_content")
    print(f"[DEBUG] 2. Raw Input: {raw_input} (Type: {type(raw_input)})")
    # --- DEBUG END ---

    # Extraction Logic
    user_text = ""
    if isinstance(raw_input, str):
        user_text = raw_input
    elif isinstance(raw_input, dict):
        if "text" in raw_input:
            user_text = raw_input["text"]
        elif "parts" in raw_input:
            # Handle {parts: [{text: ...}]}
            p = raw_input["parts"][0]
            if isinstance(p, dict):
                user_text = p.get("text", "")
            elif hasattr(p, "text"):
                user_text = p.text
    
    print(f"[DEBUG] 3. Extracted Text: '{user_text}'")

    if not user_text:
        print("[DEBUG] WARNING: User text empty! Defaulting to 'Start'")
        user_text = "Start"

    # CRITICAL FIX: Use a simple Dictionary, not a Content object
    user_content_dict = {
        "role": "user",
        "parts": [{"text": user_text}]
    }

    intent_mandate = body.get("intent_mandate")

    try:
        session = await get_or_create_session(app_name="shopping_concierge", user_id="user")

        context = build_invocation_context(
            agent=shopping_agent,
            session=session,
            session_service=SESSION_SERVICE,
            state={"intent_mandate": intent_mandate} if intent_mandate else {},
            user_content=user_content_dict 
        )

        print("[DEBUG] 4. Agent Running...")
        agen = shopping_agent.run_async(context)
        last_event = None
        async for event in agen:
            last_event = event
        
        print("[DEBUG] 5. Agent Finished.")

        # Retrieve Data
        discovery_data = context.session.state.get("discovery_data")
        print(f"[DEBUG] 6. Discovery Data from State: {discovery_data}")
        
        agent_text = ""
        if last_event and last_event.content and last_event.content.parts:
            agent_text = last_event.content.parts[0].text or ""

        # Fail-safe
        if not discovery_data and agent_text:
            discovery_data = {"text_result": agent_text}

        return JSONResponse({
            "discovery_data": discovery_data or {},
            "agent_response": agent_text
        })

    except Exception as e:
        tb = traceback.format_exc()
        print(f"[ERROR] SERVER ERROR: {tb}")
        return JSONResponse({"error": str(e), "traceback": tb}, status_code=500)
    except Exception as e:
        tb = traceback.format_exc()
        return JSONResponse({"error": str(e), "traceback": tb}, status_code=500)

# --- Real AI orchestration for /apps/main/run ---
@app.post("/apps/main/run")
async def main_run(request: Request):
    body = await request.json()
    # Accepts user_message (string) or legacy fields
    user_message = body.get("user_message")
    if not user_message:
        # Try to build user_message from legacy fields
        user_message = body.get("text") or body.get("input")
    if not user_message:
        # Fallback: try to reconstruct from intent fields
        intent = body.get("intent")
        product_category = body.get("product_category")
        price_constraint = body.get("price_constraint", {})
        if intent and product_category:
            features = []
            if "noise-canceling" in product_category.lower():
                features.append("noise-canceling")
            price_max = price_constraint.get("max_price", 200)
            user_message = f"I want to {intent.replace('_', ' ')} {product_category} with features {features} under ${price_max}"
    if not user_message:
        return JSONResponse({"result": {"text": "Missing user message or legacy fields."}}, status_code=400)

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # ShoppingAgent: send user_message (string), get discovery_data
            shopping_agent_url = "http://localhost:8000/apps/shopping_concierge/run"
            shopping_resp = await client.post(shopping_agent_url, json=user_message)
            if shopping_resp.status_code == 200:
                shopping_result = shopping_resp.json()
                discovery_data = shopping_result.get("discovery_data", {})
            else:
                return JSONResponse({"result": {"text": "ShoppingAgent error."}}, status_code=500)

            # MerchantAgent: send intent_mandate and discovery_data, get cart_mandate
            # (This part may need to be updated to use the actual intent_mandate from the agent output)
            intent_mandate = discovery_data.get("intent_mandate") if isinstance(discovery_data, dict) else None
            merchant_agent_url = "http://localhost:8000/apps/shopping_concierge/merchant/run"
            merchant_payload = {
                "intent_mandate": intent_mandate,
                "discovery_data": discovery_data
            }
            merchant_resp = await client.post(merchant_agent_url, json=merchant_payload)
            if merchant_resp.status_code == 200:
                merchant_result = merchant_resp.json()
                cart_mandate = merchant_result.get("cart_mandate")
            else:
                return JSONResponse({"result": {"text": "MerchantAgent error."}}, status_code=500)

            if not cart_mandate:
                return JSONResponse({"result": {"text": "No suitable product found."}})

            cart_details = {
                "cart_id": cart_mandate.get("cart_id"),
                "items": cart_mandate.get("items", []),
                "total_price": cart_mandate.get("total_price"),
                "price_valid_until": cart_mandate.get("price_valid_until"),
                "source_agent": cart_mandate.get("source_agent")
            }
            return JSONResponse({
                "result": {
                    "text": "Here are the cart details for the noise-canceling headphones:",
                    "cart": cart_details
                }
            })
    except Exception as e:
        return JSONResponse({"result": {"text": f"Error: {str(e)}"}}, status_code=500)
