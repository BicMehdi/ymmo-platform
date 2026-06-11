from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class PropertyBase(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    city: str = Field(min_length=2, max_length=80)
    price: float = Field(gt=0)
    area_m2: float = Field(gt=0)
    property_type: str = Field(min_length=2, max_length=50)


class PropertyCreate(PropertyBase):
    description: str = Field(default="", max_length=1000)
    rooms: int = Field(default=1, ge=1)


class PropertyOut(PropertyBase):
    id: int
    description: str
    rooms: int
    status: str
    owner_user_id: int

    model_config = {"from_attributes": True}


class AuthRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=64)
    role: str = Field(default="client", pattern="^(admin|agent|client)$")


class AuthLogin(BaseModel):
    email: EmailStr
    password: str


class AuthTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    created_at: datetime

    model_config = {"from_attributes": True}


class LeadCreate(BaseModel):
    property_id: int = Field(gt=0)
    message: str = Field(min_length=6, max_length=1200)


class LeadStatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|in_progress|closed)$")


class LeadOut(BaseModel):
    id: int
    property_id: int
    client_user_id: int
    assigned_agent_id: int | None
    message: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PriceEstimateInput(BaseModel):
    city: str
    area_m2: float = Field(gt=0)
    rooms: int = Field(ge=1)


class PriceEstimateOutput(BaseModel):
    estimated_price: float
    confidence_note: str
