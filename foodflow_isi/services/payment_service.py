import os
import stripe
from fastapi import HTTPException, status
from typing import Optional

import models


def get_stripe_key() -> str:
    stripe_key = os.getenv("STRIPE_SECRET_KEY")
    if not stripe_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Brak skonfigurowanego klucza STRIPE_SECRET_KEY w pliku .env"
        )
    return stripe_key


def create_payment_intent(amount: float, current_user: Optional[models.Uzytkownik] = None) -> dict:
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kwota płatności musi być większa od 0."
        )

    stripe.api_key = get_stripe_key()

    try:
        kwota_w_groszach = int(round(amount * 100))
        intent = stripe.PaymentIntent.create(
            amount=kwota_w_groszach,
            currency="pln",
            automatic_payment_methods={"enabled": True},
            metadata={"user_id": str(current_user.id_uzytkownik) if current_user else "guest"}
        )
        return {
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


def verify_payment(payment_intent_id: str) -> dict:
    stripe.api_key = get_stripe_key()

    try:
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        return {
            "id": intent.id,
            "status": intent.status,
            "amount": intent.amount / 100 if hasattr(intent, "amount") and intent.amount else 0,
            "currency": getattr(intent, "currency", "pln"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Błąd weryfikacji płatności: {str(e)}"
        )
