

import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import httpx

# Ensure .env is loaded for GOOGLE_API_KEY and other settings
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

from google.adk.cli.fast_api import get_fast_api_app

# --- NEW IMPORT: Required for the Agent to "hear" the user ---
from google.genai.types import Content, Part

# Provide agents_dir and web as required by ADK version
app: FastAPI = get_fast_api_app(
    agents_dir=os.path.join(os.path.dirname(__file__), "shopping_concierge"),
    web=False,
    allow_origins=["http://localhost:3000"]
)

# --- Import agents for direct invocation ---

from server.shopping_concierge.shopping_agent import shopping_agent
from server.shopping_concierge.merchant_agent import merchant_agent
from server.shopping_concierge.adk_context_utils import SESSION_SERVICE, get_or_create_session, build_invocation_context

@app.get("/health")
async def health():
    return {"status": "ok"}

# --- Expose /apps/shopping_concierge/run endpoint ---
import traceback


@app.post("/apps/shopping_concierge/run")
async def shopping_concierge_run(request: Request):
    body = await request.json()


    # 1. Extract the raw input
    raw_input = body.get("new_message") or body.get("user_content")
    intent_mandate = body.get("intent_mandate")


    # 2. Extract the text string (Handle all formats)
    user_text = ""
    if isinstance(raw_input, str):
        user_text = raw_input
    elif isinstance(raw_input, dict):
        if "text" in raw_input:
            user_text = raw_input["text"]
        elif "parts" in raw_input and isinstance(raw_input["parts"], list):
            part = raw_input["parts"][0]
            if isinstance(part, dict):
                user_text = part.get("text", "")
            elif hasattr(part, "text"):
                user_text = part.text

    if not user_text:
        # Fallback to prevent crash
        user_text = "Hello"

    # 3. CRITICAL FIX: Wrap text in the official Content object
    # This ensures the LLM sees it as a valid user turn
    user_content_obj = Content(
        role="user",
        parts=[Part(text=user_text)]
    )

    try:
        session = await get_or_create_session(app_name="shopping_concierge", user_id="user")

        # 4. Build Context with the OBJECT, not a dict
        context = build_invocation_context(
            agent=shopping_agent,
            session=session,
            session_service=SESSION_SERVICE,
            state={"intent_mandate": intent_mandate} if intent_mandate else {},
            user_content=user_content_obj
        )

        # 3. Run Agent and Consume ALL Events
        agen = shopping_agent.run_async(context)
        last_event = None
        async for event in agen:
            last_event = event
            # Optional: Print events to console to see what's happening
            # print(f"Event: {event}")

        # 4. Retrieve Data from SESSION STATE
        discovery_data = context.session.state.get("discovery_data")

        # 5. Get the text response from the last event (if available)
        agent_text = ""
        if last_event and last_event.content and last_event.content.parts:
            agent_text = last_event.content.parts[0].text or ""

        # 6. Fail-safe: If discovery_data is empty, use the text as discovery data
        if not discovery_data and agent_text:
            discovery_data = {"text_result": agent_text}

        return JSONResponse({
            "discovery_data": discovery_data or {},
            "agent_response": agent_text
        })

    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"SERVER ERROR: {tb}")
        return JSONResponse({"error": str(e), "traceback": tb}, status_code=500)

# --- Expose /apps/shopping_concierge/merchant/run endpoint ---

@app.post("/apps/shopping_concierge/merchant/run")
async def shopping_concierge_merchant_run(request: Request):
    body = await request.json()
    intent_mandate = body.get("intent_mandate")
    discovery_data = body.get("discovery_data", {})
    if not intent_mandate:
        return JSONResponse({"error": "Missing intent_mandate"}, status_code=400)
    try:
        session = await get_or_create_session(app_name="shopping_concierge", user_id="user")
        context = build_invocation_context(
            agent=merchant_agent,
            session=session,
            session_service=SESSION_SERVICE,
            state={"intent_mandate": intent_mandate, "discovery_data": discovery_data},
            user_content=None
        )
        agen = merchant_agent.run_async(context)
        result = None
        async for r in agen:
            result = r
            break
        if result is None:
            return JSONResponse({"error": "No result from agent."}, status_code=500)
        return JSONResponse({"cart_mandate": result.get("cart_mandate", {})})
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
