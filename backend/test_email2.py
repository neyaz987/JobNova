from app.services.email_service import EmailService
import sys
try:
    success = EmailService.send_email("khanneyaz50@gmail.com", "JobNova Test Email", "<h1>This is a test email from JobNova</h1><p>If you see this, the email system works!</p>")
    print(f"Success: {success}")
except Exception as e:
    print(f"Exception: {e}")
