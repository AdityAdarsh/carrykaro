from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str

    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""

    kyc_provider: str = "idfy"
    kyc_api_key: str = ""
    kyc_api_secret: str = ""

    env: str = "development"
    platform_fee_percent: int = 10
    cors_origins: str = "http://localhost:5173"

    resend_api_key: str = ""
    from_email: str = "CarryKaro <onboarding@resend.dev>"
    frontend_base_url: str = "https://carrykaro.live"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
