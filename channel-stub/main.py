# channel-stub/main.py
import asyncio
import random
import httpx
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import os

# Pull the CRM URL from environment variables, fallback to localhost
CRM_API_URL = os.getenv("CRM_API_URL", "http://localhost:8000")

app = FastAPI(title="Channel Stub Service")

class SendRequest(BaseModel):
    communication_id: int
    recipient: str
    channel: str
    message: str

async def simulate_delivery_and_callback(payload: SendRequest):
    # 1. Simulate network latency (1 to 4 seconds)
    await asyncio.sleep(random.uniform(1.0, 4.0))
    
    # 2. Simulate outcomes (Realistic distribution)
    # 70% Delivered, 15% Opened, 10% Clicked, 5% Failed
    outcomes = ["DELIVERED"] * 70 + ["OPENED"] * 15 + ["CLICKED"] * 10 + ["FAILED"] * 5
    final_status = random.choice(outcomes)
    
    # 3. Fire the webhook back to the CRM using the dynamic URL
    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                f"{CRM_API_URL}/webhook/receipt",
                json={"communication_id": payload.communication_id, "status": final_status}
            )
            print(f"Callback sent for ID {payload.communication_id}: {final_status}")
        except Exception as e:
            print(f"Failed to reach CRM webhook at {CRM_API_URL}: {e}")

@app.post("/send", status_code=202)
async def send_message(request: SendRequest, background_tasks: BackgroundTasks):
    # Immediately return 202 Accepted, process delivery in the background
    background_tasks.add_task(simulate_delivery_and_callback, request)
    return {"message": "Accepted for delivery"}

if __name__ == "__main__":
    import uvicorn
    # Run the stub on port 8001 to keep it separate from the CRM
    uvicorn.run(app, host="0.0.0.0", port=8001)