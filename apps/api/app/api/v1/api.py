from fastapi import APIRouter

from app.api.v1.routes.admin import router as admin_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.branches import router as branches_router
from app.api.v1.routes.members import router as members_router
from app.api.v1.routes.memberships import router as memberships_router
from app.api.v1.routes.notifications import router as notifications_router
from app.api.v1.routes.training import router as training_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(members_router)
api_router.include_router(memberships_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)
api_router.include_router(branches_router)
api_router.include_router(training_router)
