from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import models
import schemas
from database import get_db
from auth_jwt import get_current_user
from services import achievements_service

router = APIRouter(tags=["achievements"])


@router.get("/uzytkownik/{user_id}/osiagniecia", response_model=List[schemas.OsiagniecieOut])
def pobierz_osiagniecia(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do podglądu osiągnięć tego użytkownika."
        )
    return achievements_service.get_user_achievements(db, user_id)


@router.post("/uzytkownik/{user_id}/osiagniecia/{id_osiagniecia}/odbierz")
def odbierz_punkty_za_osiagniecie(
    user_id: int,
    id_osiagniecia: int,
    db: Session = Depends(get_db),
    current_user: models.Uzytkownik = Depends(get_current_user)
):
    if current_user.id_typ_konta != 3 and current_user.id_uzytkownik != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień do odbierania punktów w imieniu innego użytkownika."
        )
    return achievements_service.claim_achievement_reward(db, user_id, id_osiagniecia)