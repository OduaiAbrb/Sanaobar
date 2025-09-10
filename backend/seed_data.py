import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import hashlib
import uuid

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")

async def seed_database():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.ecoreceipt
    
    # Clear existing data
    await db.users.delete_many({})
    await db.receipts.delete_many({})
    
    # Create demo user
    user_id = str(uuid.uuid4())
    demo_user = {
        "id": user_id,
        "email": "demo@ecoreceipt.com",
        "name": "Demo User",
        "password": hashlib.sha256("password123".encode()).hexdigest(),
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(demo_user)
    print(f"Created demo user: {demo_user['email']} / password123")
    
    # Create demo receipts
    demo_receipts = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "retailer": "Green Grocers",
            "logo": "https://placehold.co/50x50/4CAF50/FFFFFF?text=GG",
            "date": "2025-01-15",
            "time": "14:30",
            "items": [
                {"name": "Organic Apples", "quantity": 2, "price": 8.99},
                {"name": "Whole Grain Bread", "quantity": 1, "price": 4.50},
                {"name": "Free Range Eggs", "quantity": 1, "price": 6.99},
                {"name": "Almond Milk", "quantity": 2, "price": 12.98}
            ],
            "subtotal": 33.46,
            "tax": 3.35,
            "total": 45.50,
            "category": "Groceries",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "retailer": "EcoMart",
            "logo": "https://placehold.co/50x50/2E7D32/FFFFFF?text=EM",
            "date": "2025-01-14",
            "time": "11:45",
            "items": [
                {"name": "Bamboo Toothbrush Set", "quantity": 1, "price": 15.99},
                {"name": "Reusable Water Bottle", "quantity": 1, "price": 24.99},
                {"name": "Organic Shampoo", "quantity": 2, "price": 32.50}
            ],
            "subtotal": 73.48,
            "tax": 7.35,
            "total": 89.25,
            "category": "Personal Care",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "retailer": "Fresh Foods",
            "logo": "https://placehold.co/50x50/66BB6A/FFFFFF?text=FF",
            "date": "2025-01-13",
            "time": "18:20",
            "items": [
                {"name": "Organic Salmon", "quantity": 1, "price": 18.99},
                {"name": "Mixed Vegetables", "quantity": 1, "price": 12.50},
                {"name": "Quinoa", "quantity": 2, "price": 19.98}
            ],
            "subtotal": 51.47,
            "tax": 5.15,
            "total": 67.80,
            "category": "Groceries",
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "retailer": "Local Cafe",
            "logo": "https://placehold.co/50x50/81C784/FFFFFF?text=LC",
            "date": "2025-01-12",
            "time": "09:15",
            "items": [
                {"name": "Oat Milk Latte", "quantity": 1, "price": 4.50},
                {"name": "Avocado Toast", "quantity": 1, "price": 6.95}
            ],
            "subtotal": 11.45,
            "tax": 1.00,
            "total": 12.45,
            "category": "Dining",
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.receipts.insert_many(demo_receipts)
    print(f"Created {len(demo_receipts)} demo receipts")
    
    print("\nDemo data created successfully!")
    print("Login credentials: demo@ecoreceipt.com / password123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())