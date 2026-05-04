from sqlalchemy.orm import Session
from app.models.models import AuditLog
from typing import Optional, Any

class AuditService:
    @staticmethod
    def log(db: Session, action: str, user_id: Optional[int] = None, details: Optional[Any] = None, ip_address: Optional[str] = None):
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
        return log_entry
