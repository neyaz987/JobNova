from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc, func
from datetime import datetime
from typing import List, Optional
from fastapi import HTTPException
from app.models.models import Conversation, Message, User, UserRole
from app.schemas.schemas import MessageCreate
from app.core.websocket import manager


def get_or_create_conversation(db: Session, recruiter_id: int, candidate_id: int, job_id: Optional[int] = None):
    # Check if conversation already exists
    conversation = db.query(Conversation).filter(
        and_(
            Conversation.recruiter_id == recruiter_id,
            Conversation.candidate_id == candidate_id
        )
    ).first()

    if not conversation:
        conversation = Conversation(
            recruiter_id=recruiter_id,
            candidate_id=candidate_id,
            job_id=job_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    return conversation


async def send_message(db: Session, conversation_id: int, sender_id: int, content: str):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check if sender is part of conversation
    if sender_id not in [conversation.recruiter_id, conversation.candidate_id]:
        raise HTTPException(status_code=403, detail="Not a participant of this conversation")

    message = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content
    )
    db.add(message)
    
    # Update conversation timestamp
    conversation.last_message_at = datetime.utcnow()
    conversation.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(message)

    # Real-time notification via WebSocket
    recipient_id = conversation.candidate_id if sender_id == conversation.recruiter_id else conversation.recruiter_id
    
    # Create persistent notification
    from app.services import notification_service
    sender = db.query(User).filter(User.id == sender_id).first()
    sender_name = sender.full_name if sender else "Someone"
    
    notification = notification_service.create_notification(
        db,
        user_id=recipient_id,
        title="New Message",
        message=f"{sender_name} sent you a message: {content[:50]}...",
        type="message",
        link="/messages"
    )

    # Real-time notification payload
    notification_payload = {
        "type": "new_notification",
        "data": {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "link": notification.link,
            "created_at": notification.created_at.isoformat(),
            "is_read": False
        }
    }
    await manager.send_personal_message(notification_payload, recipient_id)

    payload = {
        "type": "new_message",
        "data": {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "content": message.content,
            "created_at": message.created_at.isoformat(),
            "is_read": message.is_read
        }
    }
    await manager.send_personal_message(payload, recipient_id)
    
    return message


def get_user_conversations(db: Session, user_id: int):
    # Fetch conversations where user is either recruiter or candidate
    conversations = db.query(Conversation).filter(
        or_(
            Conversation.recruiter_id == user_id,
            Conversation.candidate_id == user_id
        )
    ).order_by(desc(Conversation.last_message_at)).all()

    # Enrich with "other_user" and "unread_count"
    for conv in conversations:
        other_user_id = conv.candidate_id if user_id == conv.recruiter_id else conv.recruiter_id
        conv.other_user = db.query(User).filter(User.id == other_user_id).first()
        
        # Get unread count for this user
        conv.unread_count = db.query(Message).filter(
            and_(
                Message.conversation_id == conv.id,
                Message.sender_id != user_id,
                Message.is_read == False
            )
        ).count()
        
        # Get last message
        conv.last_message = db.query(Message).filter(
            Message.conversation_id == conv.id
        ).order_by(desc(Message.created_at)).first()

    return conversations


def get_conversation_messages(db: Session, conversation_id: int, user_id: int, limit: int = 50, skip: int = 0):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if user_id not in [conversation.recruiter_id, conversation.candidate_id]:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Mark messages as read
    db.query(Message).filter(
        and_(
            Message.conversation_id == conversation_id,
            Message.sender_id != user_id,
            Message.is_read == False
        )
    ).update({"is_read": True})
    db.commit()

    return db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
