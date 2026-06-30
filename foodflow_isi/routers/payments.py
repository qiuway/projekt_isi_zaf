from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import stripe

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class PaymentIntentRequest(BaseModel):
    amount: float

@router.post("/create-payment-intent")
def create_payment_intent(dane: PaymentIntentRequest):
    try:
        kwota_w_groszach = int(dane.amount * 100)

        intent = stripe.PaymentIntent.create(
            amount=kwota_w_groszach,
            currency="pln",
            automatic_payment_methods={"enabled": True},
        )
        return {"client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))