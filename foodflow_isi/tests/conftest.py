import os
import sys
import types

os.environ["TEST_DATABASE_URL"] = "sqlite://"

fake_stripe = types.SimpleNamespace()

class FakePaymentIntent:
    @staticmethod
    def create(amount, currency, automatic_payment_methods):
        return types.SimpleNamespace(client_secret="pi_test_secret")

fake_stripe.PaymentIntent = FakePaymentIntent
fake_stripe.api_key = "sk_test_fake"
sys.modules.setdefault("stripe", fake_stripe)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
from database import Base, get_db
from main import app

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

@event.listens_for(engine, "connect")
def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture()
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture()
def seeded_catalog(db_session):
    user = models.Uzytkownik(
        imie="Jan",
        nazwisko="Kowalski",
        email="jan@example.com",
        haslo="test123",
        id_typ_konta=2,
        punkty=100,
        adres="Testowa 1",
    )
    category = models.Kategoria(nazwa="Dania główne")
    db_session.add_all([user, category])
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(category)

    restaurant = models.Restauracja(
        nazwa="TestBar",
        opis="Opis",
        adres="Adres",
        numer_telefonu=123456789,
        czynne=True,
        id_uzytkownik=user.id_uzytkownik,
    )
    db_session.add(restaurant)
    db_session.commit()
    db_session.refresh(restaurant)

    product = models.Produkt(
        id_restauracja=restaurant.id_restauracja,
        id_kategoria=category.id_kategoria,
        nazwa="Burger",
        cena=25.00,
        dostepny=True,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    return {
        "user": user,
        "category": category,
        "restaurant": restaurant,
        "product": product,
    }