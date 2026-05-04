import logging
from typing import Optional, List
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, html_content: str):
        """
        Sends a real email using SMTP.
        """
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.info(f"📧 MOCK EMAIL (No Credentials): {to_email}")
            print(f"--- MOCK EMAIL ---\nTo: {to_email}\nSubject: {subject}\nCode: {html_content}\n----------------")
            return True

        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        try:
            msg = MIMEMultipart()
            msg['From'] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(html_content, 'html'))

            with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"✅ Email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to send email: {e}")
            return False

    @staticmethod
    def send_verification_otp(to_email: str, otp: str):
        subject = f"{otp} is your JobNova verification code"
        logo_url = f"{settings.FRONTEND_URL}/logo.png"
        html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; text-align: center;">
            <img src="{logo_url}" alt="JobNova" style="width: 64px; height: 64px; margin-bottom: 15px; border-radius: 12px;">
            <h2 style="color: #6366f1; margin: 0;">JobNova</h2>
            <p>Welcome! Use the code below to verify your email address.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #6366f1;">
                {otp}
            </div>
            <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">The JobNova Team</p>
        </div>
        """
        return EmailService.send_email(to_email, subject, html)

    @staticmethod
    def send_application_received(candidate_name: str, job_title: str, to_email: str):
        subject = f"Application Received: {job_title}"
        logo_url = f"{settings.FRONTEND_URL}/logo.png"
        html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="{logo_url}" alt="JobNova" style="width: 48px; height: 48px; border-radius: 10px;">
                <h2 style="color: #6366f1; margin: 5px 0;">JobNova</h2>
            </div>
            <p>Hi {candidate_name},</p>
            <p>We've received your application for the <strong>{job_title}</strong> position.</p>
            <p>The hiring team will review your profile and get back to you if there's a match.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">You're receiving this because you applied on JobNova.</p>
        </div>
        """
        return EmailService.send_email(to_email, subject, html)

    @staticmethod
    def send_status_update(candidate_name: str, job_title: str, status: str, to_email: str):
        subject = f"Update on your application for {job_title}"
        logo_url = f"{settings.FRONTEND_URL}/logo.png"
        html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="{logo_url}" alt="JobNova" style="width: 48px; height: 48px; border-radius: 10px;">
                <h2 style="color: #6366f1; margin: 5px 0;">JobNova</h2>
            </div>
            <p>Hi {candidate_name},</p>
            <p>Your application status for <strong>{job_title}</strong> has been updated to: <span style="color: #6366f1; font-weight: bold; text-transform: uppercase;">{status}</span></p>
            <p>Log in to your dashboard to see more details.</p>
            <div style="margin: 30px 0; text-align: center;">
                <a href="{settings.FRONTEND_URL}/dashboard" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Best of luck, <br>The JobNova Team</p>
        </div>
        """
        return EmailService.send_email(to_email, subject, html)

    @staticmethod
    def send_interview_invite(candidate_name: str, job_title: str, date_str: str, meeting_link: Optional[str], to_email: str):
        subject = f"Interview Invitation: {job_title}"
        logo_url = f"{settings.FRONTEND_URL}/logo.png"
        html = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="{logo_url}" alt="JobNova" style="width: 48px; height: 48px; border-radius: 10px;">
                <h2 style="color: #6366f1; margin: 5px 0;">JobNova</h2>
            </div>
            <p>Hi {candidate_name},</p>
            <p>Great news! The hiring team for <strong>{job_title}</strong> would like to invite you for an interview.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #1e293b;">Time: {date_str}</p>
                {f'<p style="margin: 10px 0 0 0;">Link: <a href="{meeting_link}">{meeting_link}</a></p>' if meeting_link else ''}
            </div>
            <p>Please confirm your availability as soon as possible.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #999;">Best of luck, <br>The JobNova Team</p>
        </div>
        """
        return EmailService.send_email(to_email, subject, html)
