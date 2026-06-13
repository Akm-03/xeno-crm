# crm-backend/main.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ai_agent import generate_campaign_strategy
from models import Customer, Order, Campaign
from sqlalchemy.sql import func

from database import engine, Base, get_db
from models import CommunicationLog
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

class WebhookPayload(BaseModel):
    communication_id: int
    status: str

class CampaignRequest(BaseModel):
    prompt: str

@app.post("/webhook/receipt")
def receive_receipt(payload: WebhookPayload, db: Session = Depends(get_db)):
    """
    This endpoint receives the asynchronous callback from the Channel Stub.
    """
    log = db.query(CommunicationLog).filter(CommunicationLog.id == payload.communication_id).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Communication not found")

    # Update the status
    log.status = payload.status
    db.commit()
    
    return {"message": "Status updated successfully"}

# A simple endpoint to test the queue manually before we add AI
@app.post("/test/fire-event")
def test_dispatch(db: Session = Depends(get_db)):
    # Create a dummy log in the database
    new_log = CommunicationLog(campaign_id=None, customer_id=1, status="PENDING")
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    # Hand it off to Celery
    dispatch_message.delay(
        communication_id=new_log.id,
        recipient="user@example.com",
        channel="Email",
        message="Test message from Xeno CRM!"
    )
    return {"message": "Test fired!", "communication_id": new_log.id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.post("/api/campaign/generate")
def generate_campaign(request: CampaignRequest, db: Session = Depends(get_db)):
    """
    Step 1 of the UI workflow: The user types a prompt, the AI generates a strategy 
    and tells us how many customers match the criteria.
    """
    try:
        # 1. Ask the AI to parse the intent
        strategy = generate_campaign_strategy(request.prompt)
        
        # 2. Build the SQLAlchemy Query dynamically based on AI output
        query = db.query(Customer).join(Order)
        
        if strategy.target_category != "All":
            query = query.filter(Order.category.ilike(f"%{strategy.target_category}%"))
            
        # Group by customer and check minimum spend
        query = query.group_by(Customer.id).having(func.sum(Order.amount) >= strategy.min_order_value)
        
        # 3. Get the targeted audience size
        matched_customers = query.all()
        audience_size = len(matched_customers)

        return {
            "strategy": strategy.model_dump(),
            "audience_size": audience_size,
            "matched_customer_ids": [c.id for c in matched_customers]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/campaign/launch")
def launch_campaign(
    prompt: str, 
    channel: str, 
    message_template: str, 
    customer_ids: list[int], 
    db: Session = Depends(get_db)
):
    """
    Step 2 of the UI workflow: The user approves the AI's strategy and clicks "Launch".
    We save it to the DB and hand it off to Celery.
    """
    # 1. Create the Campaign record
    new_campaign = Campaign(
        prompt_intent=prompt,
        channel=channel,
        message_template=message_template
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    # 2. Fetch customers and dispatch to queue
    customers = db.query(Customer).filter(Customer.id.in_(customer_ids)).all()
    
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

        # Personalize message and fire to Celery queue!
        personalized_message = message_template.replace("{name}", customer.name)
        
        from worker import dispatch_message # import here to avoid circular imports
        dispatch_message.delay(
            communication_id=log.id,
            recipient=customer.phone_number if channel in ["WhatsApp", "SMS"] else customer.email,
            channel=channel,
            message=personalized_message
        )

    return {"message": "Campaign launched!", "campaign_id": new_campaign.id, "total_queued": len(customers)}

@app.get("/api/stats")
def get_campaign_stats(db: Session = Depends(get_db)):
    """
    Fetches real-time counts of all communication statuses formatted for Recharts.
    """
    results = db.query(
        CommunicationLog.status, 
        func.count(CommunicationLog.id)
    ).group_by(CommunicationLog.status).all()
    
    # Format exactly for Recharts: [{name: "DELIVERED", count: 45}, ...]
    return [{"name": row[0], "count": row[1]} for row in results]