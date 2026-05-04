from app.core.config import settings
print(f"User: {settings.SMTP_USER}")
print(f"Pass length: {len(settings.SMTP_PASSWORD)}")
