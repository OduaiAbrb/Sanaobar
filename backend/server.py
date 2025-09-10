from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
import hashlib
import uuid
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="EcoReceipt API", description="Digital Receipt Manager API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.ecoreceipt

# JWT settings
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"

# Security
security = HTTPBearer()

# Pydantic models
class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    id: str
    email: str
    name: str
    created_at: datetime

class ReceiptItem(BaseModel):
    name: str
    quantity: int
    price: float

class ReceiptCreate(BaseModel):
    retailer: str
    date: str
    time: str
    items: List[ReceiptItem]
    subtotal: float
    tax: float
    total: float
    category: str
    logo: Optional[str] = None

class Receipt(BaseModel):
    id: str
    user_id: str
    retailer: str
    date: str
    time: str
    items: List[ReceiptItem]
    subtotal: float
    tax: float
    total: float
    category: str
    logo: Optional[str] = None
    created_at: datetime

class EnvironmentalImpact(BaseModel):
    trees_saved: float
    water_saved: float
    co2_reduced: float

class SpendingAnalytics(BaseModel):
    total_spent: float
    category_breakdown: Dict[str, float]
    monthly_spending: List[Dict[str, Any]]

class AIQuery(BaseModel):
    message: str

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# API Routes

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "EcoReceipt API is running"}

@app.post("/api/auth/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token({"sub": user_id})
    
    return {
        "user": User(**user_doc),
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    # Find user
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token({"sub": user["id"]})
    
    return {
        "user": User(**user),
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.get("/api/receipts", response_model=List[Receipt])
async def get_receipts(current_user: User = Depends(get_current_user)):
    receipts = await db.receipts.find({"user_id": current_user.id}).to_list(None)
    return [Receipt(**receipt) for receipt in receipts]

@app.post("/api/receipts", response_model=Receipt)
async def create_receipt(receipt_data: ReceiptCreate, current_user: User = Depends(get_current_user)):
    receipt_id = str(uuid.uuid4())
    
    receipt_doc = {
        "id": receipt_id,
        "user_id": current_user.id,
        **receipt_data.dict(),
        "created_at": datetime.utcnow()
    }
    
    await db.receipts.insert_one(receipt_doc)
    return Receipt(**receipt_doc)

@app.get("/api/receipts/{receipt_id}", response_model=Receipt)
async def get_receipt(receipt_id: str, current_user: User = Depends(get_current_user)):
    receipt = await db.receipts.find_one({"id": receipt_id, "user_id": current_user.id})
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return Receipt(**receipt)

@app.delete("/api/receipts/{receipt_id}")
async def delete_receipt(receipt_id: str, current_user: User = Depends(get_current_user)):
    result = await db.receipts.delete_one({"id": receipt_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return {"message": "Receipt deleted successfully"}

@app.get("/api/analytics/environmental-impact", response_model=EnvironmentalImpact)
async def get_environmental_impact(current_user: User = Depends(get_current_user)):
    # Calculate environmental impact based on number of receipts
    receipt_count = await db.receipts.count_documents({"user_id": current_user.id})
    
    # Mock calculations - in real implementation, these would be more sophisticated
    trees_saved = receipt_count * 0.037  # ~0.037 trees per receipt
    water_saved = receipt_count * 6.25   # ~6.25L water per receipt
    co2_reduced = receipt_count * 1.25   # ~1.25kg CO2 per receipt
    
    return EnvironmentalImpact(
        trees_saved=round(trees_saved, 2),
        water_saved=round(water_saved, 1),
        co2_reduced=round(co2_reduced, 1)
    )

@app.get("/api/analytics/spending", response_model=SpendingAnalytics)
async def get_spending_analytics(current_user: User = Depends(get_current_user)):
    receipts = await db.receipts.find({"user_id": current_user.id}).to_list(None)
    
    if not receipts:
        return SpendingAnalytics(
            total_spent=0.0,
            category_breakdown={},
            monthly_spending=[]
        )
    
    # Calculate total spending
    total_spent = sum(receipt["total"] for receipt in receipts)
    
    # Category breakdown
    category_breakdown = {}
    for receipt in receipts:
        category = receipt["category"]
        category_breakdown[category] = category_breakdown.get(category, 0) + receipt["total"]
    
    # Monthly spending (last 6 months)
    monthly_spending = []
    months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"]
    for month in months:
        # Mock data for now - in real implementation, filter by actual dates
        month_total = total_spent / 6  # Distribute equally for demo
        monthly_spending.append({
            "month": month,
            "amount": round(month_total, 2)
        })
    
    return SpendingAnalytics(
        total_spent=round(total_spent, 2),
        category_breakdown={k: round(v, 2) for k, v in category_breakdown.items()},
        monthly_spending=monthly_spending
    )

@app.post("/api/ai/chat")
async def ai_chat(query: AIQuery, current_user: User = Depends(get_current_user)):
    try:
        # For now, return a mock response
        # TODO: Integrate with Emergent LLM key
        response_text = f"I understand you're asking about '{query.message}'. Based on your spending data, I can provide insights about your financial patterns. This is a demo response - AI integration will be added soon!"
        
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")

@app.post("/api/receipts/ocr")
async def process_receipt_ocr(current_user: User = Depends(get_current_user)):
    # Mock OCR processing since no API keys available
    # In real implementation, this would process uploaded images
    mock_receipt = {
        "retailer": "Digital Store",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M"),
        "items": [
            {"name": "Sample Item 1", "quantity": 1, "price": 15.99},
            {"name": "Sample Item 2", "quantity": 2, "price": 24.98}
        ],
        "subtotal": 40.97,
        "tax": 4.10,
        "total": 45.07,
        "category": "General",
        "logo": "https://placehold.co/50x50/4CAF50/FFFFFF?text=DS"
    }
    
    return {"parsed_receipt": mock_receipt, "message": "Receipt processed successfully (mock data)"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)