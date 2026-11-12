from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User, AuditEvent
from backend.app.schemas import UserCreate, UserLogin, UserResponse, Token
from backend.app.services.auth_service import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check existing email
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )

    hashed_pw = get_password_hash(user_in.password)
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pw,
        full_name=user_in.full_name,
        role=user_in.role,
        facility_name=user_in.facility_name,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log audit event
    audit = AuditEvent(
        user_id=new_user.id,
        action="REGISTER",
        resource_type="USER",
        resource_id=new_user.id,
        details={"email": new_user.email, "role": new_user.role}
    )
    db.add(audit)
    db.commit()

    return new_user

@router.post("/login", response_model=Token)
def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated."
        )

    # Issue JWT token
    access_token = create_access_token(data={"sub": user.id, "role": user.role, "email": user.email})

    # Log audit event
    audit = AuditEvent(
        user_id=user.id,
        action="LOGIN",
        resource_type="AUTH",
        resource_id=user.id,
        details={"role": user.role}
    )
    db.add(audit)
    db.commit()

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user
