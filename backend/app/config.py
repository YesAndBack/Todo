from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    JWT_SECRET_KEY: str = "8f42a73e5ec3495c86d32b56df2c1dbca94fb7892e5d4b3fa1c3843a6c8a5710"
    JWT_REFRESH_SECRET_KEY: str = "e9b6fcd82f814a29b0ae4e05eb1609dcf26a3724f0d14fd89c3a5d4f0a8e17b5"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    DATABASE_URL: str = "sqlite:///./todo.db"
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()