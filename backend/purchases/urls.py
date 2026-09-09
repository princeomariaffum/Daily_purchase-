from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseSessionViewSet, PurchaseRecordViewSet, FarmerViewSet, UserViewSet

router = DefaultRouter()
router.register(r'sessions', PurchaseSessionViewSet)
router.register(r'records', PurchaseRecordViewSet)
router.register(r'farmers', FarmerViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
