# ADK invocation context and session service setup for FastAPI endpoints

from google.adk.agents.invocation_context import InvocationContext
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.adk.sessions.session import Session

# Singleton in-memory session service for demo
SESSION_SERVICE = InMemorySessionService()

async def get_or_create_session(app_name: str, user_id: str = "user", state: dict = None) -> Session:
    # Try to find an existing session, else create one
    sessions = await SESSION_SERVICE.list_sessions(app_name=app_name, user_id=user_id)
    if sessions.sessions:
        return sessions.sessions[0]
    return await SESSION_SERVICE.create_session(app_name=app_name, user_id=user_id, state=state or {})

def build_invocation_context(agent, session, session_service, state=None, user_content=None):
    return InvocationContext(
        agent=agent,
        session=session,
        session_service=session_service,
        agent_states={},
        end_of_agents={},
        end_invocation=False,
        invocation_id="e-" + session.id,
        user_content=user_content,
        state=state or {},
    )
