# crm-backend/worker.py
import os
import httpx
from celery import Celery
from database import SessionLocal
from models import CommunicationLog

# Pull from environment variables, fallback to localhost for local testing
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CHANNEL_STUB_URL = os.getenv("CHANNEL_STUB_URL", "http://localhost:8001")

# Configure Celery
celery_app = Celery(
    "crm_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

@celery_app.task(bind=True, max_retries=3)
def dispatch_message(self, communication_id: int, recipient: str, channel: str, message: str):
    db = SessionLocal()
    try:
        # 1. Mark as sent locally
        log = db.query(CommunicationLog).filter(CommunicationLog.id == communication_id).first()
        if log:
            log.status = "SENT"
            db.commit()

        # 2. Call the Channel Stub
        payload = {
            "communication_id": communication_id,
            "recipient": recipient,
            "channel": channel,
            "message": message
        }
        
        # 3. Fire the request using the dynamic CHANNEL_STUB_URL
        response = httpx.post(f"{CHANNEL_STUB_URL}/send", json=payload, timeout=5.0)
        response.raise_for_status()
        return f"Dispatched ID {communication_id}"

    except Exception as exc:
        # Exponential backoff for retries if the channel stub is down
        db.rollback()
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
    finally:
        db.close()