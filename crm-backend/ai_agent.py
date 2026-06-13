# crm-backend/ai_agent.py
import instructor
from groq import Groq
from pydantic import BaseModel, Field
from typing import List

import os
from dotenv import load_dotenv
# Load the variables from the .env file
load_dotenv()
# Grab the specific key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# Initialize the Groq client and patch it with Instructor
# Replace "gsk_..." with your actual Groq API key
client = instructor.from_groq(Groq(api_key=GROQ_API_KEY))

# 1. Define the exact JSON structure we want the AI to return
class CampaignStrategy(BaseModel):
    min_order_value: float = Field(
        description="Minimum total spend of the customer. Default to 0 if not specified."
    )
    target_category: str = Field(
        description="The product category to target (e.g., 'Fashion', 'Coffee', 'Beauty', 'Electronics'). Return 'All' if none specified."
    )
    recommended_channel: str = Field(
        description="Must be strictly one of: 'WhatsApp', 'SMS', 'Email', or 'RCS'"
    )
    message_template: str = Field(
        description="The tailored message text. Must include '{name}' as a placeholder for the customer's name."
    )

def generate_campaign_strategy(user_prompt: str) -> CampaignStrategy:
    """
    Takes natural language from the marketer and translates it into structured SQL parameters and marketing copy.
    """
    system_prompt = """
    You are an expert AI marketing assistant inside a CRM. 
    Your job is to translate the marketer's natural language goal into specific database query parameters, 
    pick the highest-converting channel, and write a compelling personalized message.
    """

    # We use Llama 3 70B via Groq for excellent reasoning and speed
    strategy = client.chat.completions.create(
        model="llama3-70b-8192", 
        response_model=CampaignStrategy,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    )
    
    return strategy