from app.services.email_service import EmailService
import sys
try:
    success = EmailService.send_verification_otp("khanneyaz50@gmail.com", "123456")
    print(f"Success: {success}")
except Exception as e:
    print(f"Exception: {e}")
