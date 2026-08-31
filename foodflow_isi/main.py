from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from sqlalchemy import text
import os

from database import engine, SessionLocal
import models
from security import hash_password
from routers import auth, users, restaurants, products, cart, coupons, achievements, payments, orders, admin, reviews

load_dotenv()


def admin_create():
    db = SessionLocal()
    try:
        admin_account = db.query(models.Uzytkownik).filter(
            models.Uzytkownik.email == "admin@admin.com"
        ).first()

        if not admin_account:
            admin_account = models.Uzytkownik(
                imie="admin",
                nazwisko="admin",
                email="admin@admin.com",
                haslo=hash_password("admin"),
                id_typ_konta=3,
                punkty=9999
            )
            db.add(admin_account)
            db.commit()
            db.refresh(admin_account)

            koszyk = db.query(models.Koszyk).filter(
                models.Koszyk.id_uzytkownik == admin_account.id_uzytkownik
            ).first()
            if not koszyk:
                db.add(models.Koszyk(id_uzytkownik=admin_account.id_uzytkownik))
                db.commit()
    except Exception as e:
        print(f"blad tworzenia admina: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("static/avatars", exist_ok=True)
    os.makedirs("static/products", exist_ok=True)

    admin_create()
    yield


app = FastAPI(title="FoodFlow API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


os.makedirs("static/avatars", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def root():
    return {"status": "online", "message": "FoodFlow dziala", "docs": "/docs"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(restaurants.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(coupons.router)
app.include_router(achievements.router)
app.include_router(payments.router)
app.include_router(orders.router)
app.include_router(admin.router)
app.include_router(reviews.router)