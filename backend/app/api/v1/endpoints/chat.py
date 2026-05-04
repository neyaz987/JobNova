from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db, SessionLocal
from app.core.dependencies import get_current_user, get_user_from_token
from app.models.models import User, UserRole
from app.schemas.schemas import ConversationOut, MessageOut, MessageCreate
from app.services import chat_service
from app.core.websocket import manager

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.get("/conversations", response_model=List[ConversationOut])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for the current user."""
    return chat_service.get_user_conversations(db, current_user.id)

@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageOut])
def get_messages(
    conversation_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get message history for a conversation."""
    return chat_service.get_conversation_messages(db, conversation_id, current_user.id, limit, skip)

@router.post("/conversations/{conversation_id}/messages", response_model=MessageOut)
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message to a conversation."""
    return await chat_service.send_message(db, conversation_id, current_user.id, message_data.content)

@router.post("/initiate/{other_user_id}", response_model=ConversationOut)
def initiate_conversation(
    other_user_id: int,
    job_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initiate a conversation with another user."""
    if current_user.id == other_user_id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")
    
    # Determine roles
    if current_user.role == UserRole.recruiter:
        recruiter_id = current_user.id
        candidate_id = other_user_id
    else:
        recruiter_id = other_user_id
        candidate_id = current_user.id
        
    return chat_service.get_or_create_conversation(db, recruiter_id, candidate_id, job_id)

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """WebSocket endpoint for real-time messaging."""
    db = SessionLocal()
    try:
        user = get_user_from_token(token, db)
        if not user:
            await websocket.close(code=1008) # Policy Violation
            return

        await manager.connect(user.id, websocket)
        try:
            while True:
                # Keep connection alive
                await websocket.receive_text()
        except WebSocketDisconnect:
            manager.disconnect(user.id, websocket)
    finally:
        db.close()
