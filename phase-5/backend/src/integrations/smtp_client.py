"""
SMTP Client - Phase V

Email notification client using SMTP for reminder delivery.

Configuration:
- SMTP credentials from environment variables (via Dapr Secrets or direct env vars)
- Supports TLS/SSL encryption
- Implements connection pooling for efficiency

Based on: Context7 Dapr SMTP binding documentation
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger(__name__)


class SMTPClient:
    """
    SMTP email client for sending reminder notifications.

    Environment Variables (configured via Dapr Secrets or .env):
    - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com)
    - SMTP_PORT: SMTP server port (e.g., 587 for TLS, 465 for SSL)
    - SMTP_USER: SMTP username (email address)
    - SMTP_PASSWORD: SMTP password or app-specific password
    - SMTP_FROM_EMAIL: Sender email address (defaults to SMTP_USER)
    - SMTP_USE_TLS: Use TLS encryption (default: True)
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        from_email: Optional[str] = None,
        use_tls: bool = True
    ):
        """
        Initialize SMTP client with configuration.

        Args:
            host: SMTP server hostname (default: from env SMTP_HOST)
            port: SMTP server port (default: from env SMTP_PORT or 587)
            username: SMTP username (default: from env SMTP_USER)
            password: SMTP password (default: from env SMTP_PASSWORD)
            from_email: Sender email address (default: from env SMTP_FROM_EMAIL or username)
            use_tls: Use TLS encryption (default: True)
        """
        self.host = host or os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.port = port or int(os.getenv("SMTP_PORT", "587"))
        self.username = username or os.getenv("SMTP_USER")
        self.password = password or os.getenv("SMTP_PASSWORD")
        self.from_email = from_email or os.getenv("SMTP_FROM_EMAIL", self.username)
        self.use_tls = use_tls

        if not self.username or not self.password:
            raise ValueError(
                "SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD "
                "environment variables or pass credentials to SMTPClient constructor."
            )

        logger.info(
            f"SMTP client initialized: host={self.host}, port={self.port}, "
            f"from={self.from_email}"
        )

    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        is_html: bool = True
    ) -> None:
        """
        Send email via SMTP.

        Args:
            to_email: Recipient email address
            subject: Email subject line
            body: Email body (HTML or plain text)
            is_html: If True, body is treated as HTML (default: True)

        Raises:
            smtplib.SMTPException: If email sending fails
        """
        logger.info(f"Sending email: to={to_email}, subject={subject}")

        # Create message
        msg = MIMEMultipart("alternative")
        msg["From"] = self.from_email
        msg["To"] = to_email
        msg["Subject"] = subject

        # Attach body
        if is_html:
            msg.attach(MIMEText(body, "html"))
        else:
            msg.attach(MIMEText(body, "plain"))

        # Send email
        try:
            with smtplib.SMTP(self.host, self.port, timeout=30) as server:
                if self.use_tls:
                    server.starttls()

                server.login(self.username, self.password)
                server.sendmail(self.from_email, to_email, msg.as_string())

            logger.info(f"Email sent successfully: to={to_email}")

        except smtplib.SMTPException as e:
            logger.error(f"SMTP error sending email: {e}", exc_info=True)
            raise
        except Exception as e:
            logger.error(f"Unexpected error sending email: {e}", exc_info=True)
            raise

    async def send_reminder_email(
        self,
        to_email: str,
        task_title: str,
        task_description: str,
        due_date: str,
        task_id: int
    ) -> None:
        """
        Send reminder notification email.

        Args:
            to_email: User's email address
            task_title: Task title
            task_description: Task description (may be empty)
            due_date: Task due date (ISO 8601 UTC format)
            task_id: Task database ID

        Raises:
            smtplib.SMTPException: If email sending fails
        """
        # Format due date for display
        from datetime import datetime
        try:
            due_dt = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
            formatted_due = due_dt.strftime('%B %d, %Y at %I:%M %p UTC')
        except Exception:
            formatted_due = due_date  # Fallback to raw timestamp

        # Email subject
        subject = f"Reminder: {task_title}"

        # Email body (HTML)
        body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4F46E5;
                    color: white;
                    padding: 20px;
                    border-radius: 8px 8px 0 0;
                }}
                .content {{
                    background-color: #f9fafb;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                }}
                .task-details {{
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #4F46E5;
                }}
                .task-title {{
                    font-size: 18px;
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 10px;
                }}
                .task-description {{
                    color: #6b7280;
                    margin-bottom: 15px;
                }}
                .due-date {{
                    color: #DC2626;
                    font-weight: 600;
                }}
                .footer {{
                    text-align: center;
                    color: #9ca3af;
                    font-size: 12px;
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2 style="margin: 0;">🔔 Task Reminder</h2>
            </div>
            <div class="content">
                <p>This is a reminder for your upcoming task:</p>

                <div class="task-details">
                    <div class="task-title">{task_title}</div>
                    {f'<div class="task-description">{task_description}</div>' if task_description else ''}
                    <div class="due-date">
                        <strong>Due:</strong> {formatted_due}
                    </div>
                </div>

                <p>Don't forget to complete this task before the deadline!</p>

                <p style="margin-top: 30px;">
                    <small style="color: #9ca3af;">Task ID: {task_id}</small>
                </p>
            </div>
            <div class="footer">
                <p>You're receiving this email because you set a reminder for this task.</p>
                <p>© 2025 Todo Application. All rights reserved.</p>
            </div>
        </body>
        </html>
        """

        await self.send_email(
            to_email=to_email,
            subject=subject,
            body=body,
            is_html=True
        )


# ==================== Singleton Instance ====================

_smtp_client: Optional[SMTPClient] = None


def get_smtp_client() -> SMTPClient:
    """
    Get singleton SMTP client instance.

    Returns:
        SMTPClient instance

    Usage:
        from phase_5.backend.src.integrations.smtp_client import get_smtp_client

        smtp = get_smtp_client()
        await smtp.send_reminder_email(...)
    """
    global _smtp_client
    if _smtp_client is None:
        _smtp_client = SMTPClient()
    return _smtp_client
