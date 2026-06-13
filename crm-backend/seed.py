# crm-backend/seed.py
import random
from faker import Faker
from database import engine, SessionLocal, Base
from models import Customer, Order

fake = Faker()
CATEGORIES = ["Fashion", "Coffee", "Beauty", "Electronics"]

def seed_data():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if we already seeded to prevent duplicates
    if db.query(Customer).first():
        print("Database already seeded! Skipping.")
        db.close()
        return

    print("Generating 100 mock customers...")
    customers = []
    for _ in range(100):
        customer = Customer(
            name=fake.name(),
            email=fake.unique.email(),
            phone_number=fake.phone_number(),
        )
        db.add(customer)
        customers.append(customer)
    
    db.commit()

    print("Generating 300 historical orders...")
    for _ in range(300):
        random_customer = random.choice(customers)
        order = Order(
            customer_id=random_customer.id,
            amount=round(random.uniform(10.0, 500.0), 2),
            category=random.choice(CATEGORIES),
            purchased_at=fake.date_time_between(start_date='-1y', end_date='now')
        )
        db.add(order)

    db.commit()
    db.close()
    print("Database seeding complete! Your CRM has data.")

if __name__ == "__main__":
    seed_data()