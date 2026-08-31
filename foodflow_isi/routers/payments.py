from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

import models
from auth_jwt import get_current_user_optional
from services import payment_service

router = APIRouter(tags=["payments"])


class PaymentIntentRequest(BaseModel):
    amount: float = Field(..., ge=0.50, le=100000.00)


@router.post("/create-payment-intent")
def create_payment_intent(
    dane: PaymentIntentRequest,
    current_user: models.Uzytkownik | None = Depends(get_current_user_optional)
):
    return payment_service.create_payment_intent(dane.amount, current_user)


@router.get("/payments/verify/{payment_intent_id}")
def verify_payment(payment_intent_id: str):
    return payment_service.verify_payment(payment_intent_id)