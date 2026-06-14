from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from ai_agent import generate_campaign_strategy
from models import Customer, Order, Campaign, CommunicationLog
from sqlalchemy.sql import func
from database import engine, Base, get_db
from worker import dispatch_message

app = FastAPI(title="Xeno AI-Native CRM")

# Allow the React frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Data Models ---
class WebhookPayload(BaseModel):
    communication_id: int
    status: str

class CampaignRequest(BaseModel):
    prompt: str

# New models to perfectly capture the React frontend's JSON structure
class StrategyModel(BaseModel):
    target_category: str
    min_order_value: float
    recommended_channel: str
    message_template: str

class LaunchRequest(BaseModel):
    strategy: StrategyModel
    audience_size: int

# --- API Routes ---

@app.get("/api/stats")
def get_campaign_stats(db: Session = Depends(get_db)):
    """Fetches real-time counts of all communication statuses for the UI chart."""
    results = db.query(
        CommunicationLog.status, 
        func.count(CommunicationLog.id)
    ).group_by(CommunicationLog.status).all()
    return [{"name": row[0], "count": row[1]} for row in results]

@app.post("/api/generate")
def generate_campaign(request: CampaignRequest, db: Session = Depends(get_db)):
    """Step 1: AI parses intent and calculates audience size."""
    try:
        strategy = generate_campaign_strategy(request.prompt)
        
        query = db.query(Customer).join(Order)
        if strategy.target_category != "All":
            query = query.filter(Order.category.ilike(f"%{strategy.target_category}%"))
            
        query = query.group_by(Customer.id).having(func.sum(Order.amount) >= strategy.min_order_value)
        matched_customers = query.all()

        return {
            "strategy": strategy.model_dump(),
            "audience_size": len(matched_customers),
            "matched_customer_ids": [c.id for c in matched_customers]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/launch")
def launch_campaign(request: LaunchRequest, db: Session = Depends(get_db)):
    """Step 2: Save campaign and dispatch thousands of Celery tasks."""
    # 1. Create the Campaign record
    new_campaign = Campaign(
        prompt_intent="Launched via Xeno Core UI",
        channel=request.strategy.recommended_channel,
        message_template=request.strategy.message_template
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    # 2. Re-fetch customers based on strategy
    query = db.query(Customer).join(Order)
    if request.strategy.target_category != "All":
        query = query.filter(Order.category.ilike(f"%{request.strategy.target_category}%"))
    query = query.group_by(Customer.id).having(func.sum(Order.amount) >= request.strategy.min_order_value)
    customers = query.all()
    
    for customer in customers:
        # Create pending log
        log = CommunicationLog(
            campaign_id=new_campaign.id, 
            customer_id=customer.id, 
            status="PENDING"
        )
        db.add(log)
        db.commit()
        db.refresh(log)

        # Personalize message
        personalized_message = request.strategy.message_template.replace("{name}", customer.name)
        
        # Fire to Celery queue
        dispatch_message.delay(
            communication_id=log.id,
            recipient=customer.phone_number if request.strategy.recommended_channel in ["WhatsApp", "SMS"] else customer.email,
            channel=request.strategy.recommended_channel,
            message=personalized_message
        )

    return {"message": "Campaign launched!", "campaign_id": new_campaign.id, "total_queued": len(customers)}

@app.post("/api/webhook/receipt")
def receive_receipt(payload: WebhookPayload, db: Session = Depends(get_db)):
    """Receives asynchronous callback from the Channel Stub."""
    log = db.query(CommunicationLog).filter(CommunicationLog.id == payload.communication_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Communication not found")
    log.status = payload.status
    db.commit()
    return {"message": "Status updated successfully"}

@app.post("/api/test/fire-event")
def test_dispatch(db: Session = Depends(get_db)):
    new_log = CommunicationLog(campaign_id=None, customer_id=1, status="PENDING")
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    dispatch_message.delay(
        communication_id=new_log.id,
        recipient="user@example.com",
        channel="Email",
        message="Test message from Xeno CRM!"
    )
    return {"message": "Test fired!", "communication_id": new_log.id}

# IMPORTANT: Execution block moved to the absolute bottom!
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)