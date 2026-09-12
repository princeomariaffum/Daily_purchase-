from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegionViewSet, DistrictViewSet, ZoneViewSet, OfficerSocietyViewSet,
    SeasonViewSet, FarmViewSet, DeliveryViewSet, DeliveryUpdateViewSet,
    FarmerViewSet, UserViewSet, PurchaseSessionViewSet, PurchaseRecordViewSet
)

router = DefaultRouter()
router.register(r'regions', RegionViewSet)
router.register(r'districts', DistrictViewSet)
router.register(r'zones', ZoneViewSet)
router.register(r'officer-societies', OfficerSocietyViewSet)
router.register(r'seasons', SeasonViewSet)
router.register(r'farms', FarmViewSet)
router.register(r'deliveries', DeliveryViewSet)
router.register(r'purchases', DeliveryViewSet, basename='purchases-alias') # Alias endpoint
router.register(r'delivery-updates', DeliveryUpdateViewSet)
router.register(r'farmers', FarmerViewSet)
router.register(r'users', UserViewSet)
router.register(r'sessions', PurchaseSessionViewSet)
router.register(r'records', PurchaseRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
