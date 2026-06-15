# Xeno Core: Algorithmic Audience Routing

Xeno Core is an AI-native CRM and campaign execution engine. It removes the need for marketers to write complex SQL queries or build manual data filters. Instead, users input a natural-language "Mission Intent", and the system's AI agent translates it into dynamic database queries to define audiences, while an asynchronous event-driven architecture dispatches thousands of personalized messages.

## Key Features

* **Natural Language Routing:** Type intents like *"Target big spenders in Electronics over $200"* and the AI agent automatically extracts the target category, minimum spend, and recommended channel.
* **Dynamic Query Generation:** AI outputs strict JSON schemas (via Pydantic) which the backend securely parses into dynamic SQLAlchemy filters (`.filter()` and `.having()`), preventing SQL injection and ensuring precise audience sizing.
* **Asynchronous Dispatch Pipeline:** Campaign execution is offloaded to Celery background workers and a Redis message broker, ensuring the main FastAPI server never blocks or times out when sending messages to large audiences.
* **Real-Time Telemetry:** A delivery webhook endpoint receives simulated delivery statuses, which are seamlessly polled by the React frontend to power a live, responsive dashboard.
* **Modern Neon UI:** Built with Vite, React, and the newly released Tailwind CSS v4, featuring dark-mode data visualization via Recharts.

---

## Technical Stack

**Frontend**

* React 18 (TypeScript)
* Vite
* Tailwind CSS v4
* Recharts (Data Visualization)
* Axios
* Hosted on **Vercel**

**Backend**

* Python 3.10+
* FastAPI
* SQLAlchemy (ORM)
* Pydantic (Data Validation)
* Hosted on **Render**

**Infrastructure & Background Processing**

* Celery (Distributed Task Queue)
* Redis (Message Broker)
* SQLite / PostgreSQL

## System Architecture Flow

1. **Intent Engine:** Frontend UI → FastAPI (`/api/generate`) → AI Agent → Dynamic SQLAlchemy Query → Returns strategy and audience size.
2. **Dispatch Engine:** Frontend UI → FastAPI (`/api/launch`) → Campaign Saved to DB → Thousands of tasks dispatched to Celery Workers.
3. **Telemetry Loop:** External Channel Webhooks → FastAPI (`/api/webhook/receipt`) → DB Status Update → Frontend Polling (`/api/stats`) updates the Recharts UI in real-time.

## Local Installation & Setup

### Prerequisites

* Node.js (v18+)
* Python (3.10+)
* Redis Server (Running locally on default port 6379)

### 1. Backend Setup

Navigate to the backend directory and set up your Python environment:

```bash
cd crm-backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI Server (Port 8000)
uvicorn main:app --reload

In a separate terminal, start the Celery worker to process background tasks:

```bash
cd crm-backend
celery -A worker worker --loglevel=info

### 2. Frontend Setup

Navigate to the frontend directory and install the Node packages:

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server (Port 5173)
npm run dev

## Core API Endpoints

| Method | Endpoint               | Description                                                            |
| ---    | ---                    | ---                                                                    |
| `POST` | `/api/generate`        | Receives natural language prompt, returns AI strategy & audience size. |
| `POST` | `/api/launch`          | Saves campaign to DB and pushes customer messages to Celery queue.     |
| `GET`  | `/api/stats`           | Fetches aggregated communication statuses formatted for Recharts.      |
| `POST` | `/api/webhook/receipt` | Asynchronous callback endpoint for channel delivery receipts.          |
