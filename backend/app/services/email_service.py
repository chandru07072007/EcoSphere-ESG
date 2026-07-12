import logging
from typing import Optional
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.config import settings

logger = logging.getLogger(__name__)


def _get_mail_config() -> Optional[ConnectionConfig]:
    if not settings.MAIL_SERVER or not settings.MAIL_USERNAME:
        return None
    return ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )


BASE_STYLE = """
<style>
  body { font-family: Arial, sans-serif; background: #f4f7f0; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 10px;
               overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
  .header { background: linear-gradient(135deg, #1a6b3a 0%, #2d9e5f 100%); padding: 30px 40px;
            text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; }
  .header p { color: #b8e6c8; margin: 5px 0 0; font-size: 14px; }
  .body { padding: 30px 40px; }
  .body h2 { color: #1a6b3a; font-size: 20px; margin-top: 0; }
  .body p { color: #444; line-height: 1.7; }
  .badge { display: inline-block; padding: 6px 14px; border-radius: 20px;
           font-size: 12px; font-weight: bold; text-transform: uppercase; }
  .badge-critical { background: #fde8e8; color: #c0392b; }
  .badge-high { background: #fef3e2; color: #e67e22; }
  .badge-medium { background: #fefce2; color: #b7950b; }
  .badge-low { background: #e8f8f0; color: #1a6b3a; }
  .badge-legendary { background: #f3e5ff; color: #7d3c98; }
  .badge-epic { background: #e8eaff; color: #2e4bce; }
  .badge-rare { background: #e2f4ff; color: #1a78c2; }
  .badge-common { background: #e8f8f0; color: #1a6b3a; }
  .cta-button { display: inline-block; margin-top: 20px; padding: 12px 30px;
                background: #1a6b3a; color: #ffffff !important; border-radius: 6px;
                text-decoration: none; font-weight: bold; font-size: 14px; }
  .footer { background: #f4f7f0; text-align: center; padding: 20px; font-size: 12px; color: #888; }
  .info-box { background: #e8f8f0; border-left: 4px solid #1a6b3a; padding: 15px 20px;
              border-radius: 0 6px 6px 0; margin: 15px 0; }
  .info-box p { margin: 0; color: #1a6b3a; font-weight: 500; }
</style>
"""


def _wrap_template(body_html: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">{BASE_STYLE}</head>
<body>
<div class="container">
  <div class="header">
    <h1>🌿 EcoSphere ESG</h1>
    <p>Sustainability Intelligence Platform</p>
  </div>
  {body_html}
  <div class="footer">
    <p>© 2024 EcoSphere ESG Platform. All rights reserved.</p>
    <p>This is an automated message. Please do not reply to this email.</p>
  </div>
</div>
</body>
</html>
"""


class EmailService:
    def __init__(self):
        self._config = _get_mail_config()
        self._fastmail = FastMail(self._config) if self._config else None

    async def _send(self, to: str, subject: str, html: str):
        if not self._fastmail:
            logger.warning(
                "Email not configured. Skipping send to %s: %s", to, subject
            )
            return
        message = MessageSchema(
            subject=subject,
            recipients=[to],
            body=html,
            subtype=MessageType.html,
        )
        try:
            await self._fastmail.send_message(message)
            logger.info("Email sent to %s: %s", to, subject)
        except Exception as exc:
            logger.error("Failed to send email to %s: %s", to, exc)

    async def send_welcome_email(self, email: str, name: str):
        body = f"""
<div class="body">
  <h2>Welcome to EcoSphere, {name}! 🌱</h2>
  <p>We're thrilled to have you on board. EcoSphere ESG is your organisation's hub
     for environmental, social, and governance sustainability tracking.</p>
  <div class="info-box"><p>Your account has been successfully created and is ready to use.</p></div>
  <p>Here's what you can do on the platform:</p>
  <ul>
    <li>📊 Track carbon emissions and environmental goals</li>
    <li>🤝 Participate in CSR activities and sustainability challenges</li>
    <li>🏆 Earn badges and rewards for your contributions</li>
    <li>📋 Stay informed on compliance and governance policies</li>
  </ul>
  <p>
    <a href="{settings.FRONTEND_URL}/dashboard" class="cta-button">Get Started →</a>
  </p>
</div>
"""
        await self._send(
            email, "Welcome to EcoSphere ESG! 🌿", _wrap_template(body)
        )

    async def send_compliance_alert(
        self, email: str, name: str, issue_title: str, severity: str, due_date: str
    ):
        badge_class = f"badge-{severity.lower()}"
        body = f"""
<div class="body">
  <h2>Compliance Issue Assigned</h2>
  <p>Dear {name},</p>
  <p>A new compliance issue has been assigned to you and requires your attention:</p>
  <div class="info-box">
    <p><strong>{issue_title}</strong></p>
    <p>Severity: <span class="badge {badge_class}">{severity.upper()}</span></p>
    <p>Due Date: <strong>{due_date}</strong></p>
  </div>
  <p>Please log in to the EcoSphere platform to review the full details and take necessary action.</p>
  <p>
    <a href="{settings.FRONTEND_URL}/governance/compliance" class="cta-button">View Issue →</a>
  </p>
</div>
"""
        await self._send(
            email,
            f"⚠️ Compliance Issue Assigned: {issue_title}",
            _wrap_template(body),
        )

    async def send_badge_unlock(
        self, email: str, name: str, badge_name: str, badge_rarity: str
    ):
        badge_class = f"badge-{badge_rarity.lower()}"
        body = f"""
<div class="body">
  <h2>🏆 You've Unlocked a New Badge!</h2>
  <p>Congratulations, {name}!</p>
  <p>Your commitment to sustainability has been recognised. You've just earned:</p>
  <div class="info-box">
    <p><strong>{badge_name}</strong>
       <span class="badge {badge_class}">{badge_rarity.upper()}</span></p>
  </div>
  <p>Keep up the amazing work and continue contributing to a greener, more sustainable future!</p>
  <p>
    <a href="{settings.FRONTEND_URL}/social/badges" class="cta-button">View Your Badges →</a>
  </p>
</div>
"""
        await self._send(
            email,
            f"🏆 New Badge Unlocked: {badge_name}",
            _wrap_template(body),
        )

    async def send_csr_decision(
        self, email: str, name: str, activity_title: str, decision: str
    ):
        is_approved = decision == "approved"
        colour = "#1a6b3a" if is_approved else "#c0392b"
        icon = "✅" if is_approved else "❌"
        msg = (
            "Your participation has been approved! Your XP and points have been credited."
            if is_approved
            else "Unfortunately, your participation was not approved. Please contact your manager for more details."
        )
        body = f"""
<div class="body">
  <h2>{icon} CSR Participation {decision.title()}</h2>
  <p>Dear {name},</p>
  <div class="info-box">
    <p>Activity: <strong>{activity_title}</strong></p>
    <p style="color:{colour}; font-weight:bold;">{decision.upper()}</p>
  </div>
  <p>{msg}</p>
  <p>
    <a href="{settings.FRONTEND_URL}/social/csr" class="cta-button">View Activities →</a>
  </p>
</div>
"""
        await self._send(
            email,
            f"{icon} CSR Participation {decision.title()}: {activity_title}",
            _wrap_template(body),
        )

    async def send_policy_reminder(
        self, email: str, name: str, policy_title: str, deadline: str
    ):
        body = f"""
<div class="body">
  <h2>📋 Policy Acknowledgement Required</h2>
  <p>Dear {name},</p>
  <p>A new policy has been published that requires your acknowledgement:</p>
  <div class="info-box">
    <p><strong>{policy_title}</strong></p>
    <p>Please acknowledge by: <strong>{deadline}</strong></p>
  </div>
  <p>Please review and acknowledge this policy at your earliest convenience to remain compliant.</p>
  <p>
    <a href="{settings.FRONTEND_URL}/governance/policies" class="cta-button">Review Policy →</a>
  </p>
</div>
"""
        await self._send(
            email,
            f"📋 Action Required: Acknowledge Policy — {policy_title}",
            _wrap_template(body),
        )

    async def send_overdue_alert(
        self, email: str, name: str, issue_title: str, days_overdue: int
    ):
        body = f"""
<div class="body">
  <h2>🚨 Overdue Compliance Issue</h2>
  <p>Dear {name},</p>
  <p>A compliance issue assigned to you is now overdue:</p>
  <div class="info-box">
    <p><strong>{issue_title}</strong></p>
    <p style="color:#c0392b; font-weight:bold;">
      Overdue by {days_overdue} day{'s' if days_overdue != 1 else ''}
    </p>
  </div>
  <p>Please take immediate action to resolve this issue and update its status in the platform.</p>
  <p>
    <a href="{settings.FRONTEND_URL}/governance/compliance" class="cta-button">Resolve Issue →</a>
  </p>
</div>
"""
        await self._send(
            email,
            f"🚨 OVERDUE: {issue_title} ({days_overdue}d overdue)",
            _wrap_template(body),
        )


email_service = EmailService()
