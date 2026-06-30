from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

from routers import auth, users, restaurants, products, cart, coupons, achievements, payments, orders

load_dotenv()

app = FastAPI(title="FoodFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static/avatars", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(restaurants.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(coupons.router)
app.include_router(achievements.router)
app.include_router(payments.router)
app.include_router(orders.router)