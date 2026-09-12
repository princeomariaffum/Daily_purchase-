from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q
import pandas as pd
from django.contrib.auth.models import User
from .models import (
    Region, District, Zone, OfficerSociety, Farmer, Farm, Season, 
    Delivery, DeliveryUpdate, PurchaseSession, PurchaseRecord
)
from .serializers import (
    RegionSerializer, DistrictSerializer, ZoneSerializer, OfficerSocietySerializer,
    FarmerSerializer, FarmSerializer, SeasonSerializer, DeliverySerializer,
    DeliveryUpdateSerializer, PurchaseSessionSerializer, PurchaseRecordSerializer, UserSerializer
)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class RegionViewSet(viewsets.ModelViewSet):
    queryset = Region.objects.all().order_by('region_name')
    serializer_class = RegionSerializer
    permission_classes = [IsAuthenticated]

class DistrictViewSet(viewsets.ModelViewSet):
    queryset = District.objects.all().order_by('district_name')
    serializer_class = DistrictSerializer
    permission_classes = [IsAuthenticated]

class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all().order_by('zone_name')
    serializer_class = ZoneSerializer
    permission_classes = [IsAuthenticated]

class OfficerSocietyViewSet(viewsets.ModelViewSet):
    queryset = OfficerSociety.objects.all().order_by('-assigned_at')
    serializer_class = OfficerSocietySerializer
    permission_classes = [IsAuthenticated]

class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.all().order_by('-start_at')
    serializer_class = SeasonSerializer
    permission_classes = [IsAuthenticated]

class FarmViewSet(viewsets.ModelViewSet):
    queryset = Farm.objects.all().order_by('-created_at')
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated]

class DeliveryViewSet(viewsets.ModelViewSet):
    queryset = Delivery.objects.all().order_by('-delivery_date')
    serializer_class = DeliverySerializer
    permission_classes = [IsAuthenticated]

class DeliveryUpdateViewSet(viewsets.ModelViewSet):
    queryset = DeliveryUpdate.objects.all().order_by('-updated_at')
    serializer_class = DeliveryUpdateSerializer
    permission_classes = [IsAuthenticated]

class PurchaseSessionViewSet(viewsets.ModelViewSet):
    queryset = PurchaseSession.objects.all().order_by('-created_at')
    serializer_class = PurchaseSessionSerializer
    permission_classes = [IsAuthenticated]

class PurchaseRecordViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRecord.objects.all().order_by('-date')
    serializer_class = PurchaseRecordSerializer
    permission_classes = [IsAuthenticated]

class FarmerViewSet(viewsets.ModelViewSet):
    queryset = Farmer.objects.all().order_by('name')
    serializer_class = FarmerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Farmer.objects.all().order_by('name')
        try:
            profile = user.fieldagentprofile
            if profile.assigned_societies:
                return Farmer.objects.filter(
                    Q(society__in=profile.assigned_societies) | Q(district_society__district_name__in=profile.assigned_societies)
                ).order_by('name')
            return Farmer.objects.none()
        except Exception:
            return Farmer.objects.none()

    @action(detail=True, methods=['get'])
    def lifetime_history(self, request, pk=None):
        farmer = self.get_object()
        
        # Match deliveries by FK or KK ID or Name
        deliveries = Delivery.objects.filter(
            Q(farmer=farmer) | Q(farmer__cocobod_id=farmer.cocobod_id) | Q(farmer__kk_id_num=farmer.kk_id_num)
        ).select_related('season', 'farm').order_by('-delivery_date')

        # Also match legacy PurchaseRecords
        records = PurchaseRecord.objects.filter(
            Q(kk_id=farmer.kk_id_num) | Q(farmer_name__iexact=farmer.name)
        ).select_related('session').order_by('-date')

        seasons_dict = {}
        records_list = []

        # Process Deliveries (New ERD Schema)
        for d in deliveries:
            season_str = d.season.season_name if d.season else '2025/2026'
            if season_str not in seasons_dict:
                seasons_dict[season_str] = {
                    'season': season_str,
                    'kilos': 0.0,
                    'bags': 0.0,
                    'amount': 0.0,
                    'bonus': 0.0,
                    'count': 0
                }
            kilos = d.volume_delivered_kilos or 0.0
            bags = d.volume_delivered_bags or round(kilos / 62.5, 2)
            amount = d.amount_ghc
            bonus = round(kilos * 1.12, 2)

            seasons_dict[season_str]['kilos'] += kilos
            seasons_dict[season_str]['bags'] = round(seasons_dict[season_str]['kilos'] / 62.5, 2)
            seasons_dict[season_str]['amount'] += amount
            seasons_dict[season_str]['bonus'] = round(seasons_dict[season_str]['kilos'] * 1.12, 2)
            seasons_dict[season_str]['count'] += 1

            records_list.append({
                'id': f"DEL-{d.delivery_id}",
                'date': str(d.delivery_date),
                'session_id': d.delivery_id,
                'waybill_no': d.waybill_number or '—',
                'season': season_str,
                'society': farmer.district_society.district_name if farmer.district_society else (farmer.society or '—'),
                'kilos': kilos,
                'bags': bags,
                'amount_ghc': amount,
                'bonus_ghc': bonus
            })

        # Process legacy PurchaseRecords if no deliveries or in addition
        if not deliveries.exists():
            for r in records:
                season_str = r.session.cocoa_season if r.session else '2025/2026'
                if season_str not in seasons_dict:
                    seasons_dict[season_str] = {
                        'season': season_str,
                        'kilos': 0.0,
                        'bags': 0.0,
                        'amount': 0.0,
                        'bonus': 0.0,
                        'count': 0
                    }
                seasons_dict[season_str]['kilos'] += r.kilos
                seasons_dict[season_str]['bags'] = round(seasons_dict[season_str]['kilos'] / 62.5, 2)
                seasons_dict[season_str]['amount'] += r.amount_ghc
                seasons_dict[season_str]['bonus'] = round(seasons_dict[season_str]['kilos'] * 1.12, 2)
                seasons_dict[season_str]['count'] += 1

                records_list.append({
                    'id': f"REC-{r.id}",
                    'date': str(r.date),
                    'session_id': r.session.id if r.session else None,
                    'waybill_no': r.session.waybill_no if r.session else '—',
                    'season': season_str,
                    'society': r.session.society_district_name if r.session else (farmer.society or '—'),
                    'kilos': r.kilos,
                    'bags': round(r.kilos / 62.5, 2),
                    'amount_ghc': r.amount_ghc,
                    'bonus_ghc': round(r.kilos * 1.12, 2)
                })

        total_kilos = sum(s['kilos'] for s in seasons_dict.values()) or (farmer.volume or 0)
        total_bags = round(total_kilos / 62.5, 2)
        total_amount = sum(s['amount'] for s in seasons_dict.values()) or (total_kilos * 52.0)
        bonus_entitled = round(total_kilos * 1.12, 2)
        
        field_size = farmer.actual_farm_size or farmer.field_size or 0
        yield_per_hectare = round(total_kilos / field_size, 2) if field_size > 0 else 0

        return Response({
            'farmer': FarmerSerializer(farmer).data,
            'summary': {
                'total_kilos': round(total_kilos, 2),
                'total_bags': total_bags,
                'total_amount_ghc': round(total_amount, 2),
                'bonus_entitled': bonus_entitled,
                'yield_per_hectare': yield_per_hectare,
                'total_transactions': len(records_list)
            },
            'seasons_breakdown': list(seasons_dict.values()),
            'records': records_list
        })

    @action(detail=False, methods=['post'])
    def import_excel(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_excel(file)
            df.columns = [str(col).strip().lower() for col in df.columns]
            
            created_count = 0
            updated_count = 0
            
            with transaction.atomic():
                for _, row in df.iterrows():
                    def safe_get(key):
                        val = row.get(key)
                        if pd.isna(val) or str(val).lower() == 'nan':
                            return None
                        return str(val).strip()

                    kk_id = safe_get('kkidnum') or safe_get('cocobod_id') or safe_get('farmer_id')
                    if not kk_id:
                        continue

                    dist_name = safe_get('society') or safe_get('depot') or safe_get('district')
                    district_obj = None
                    if dist_name:
                        district_obj, _ = District.objects.get_or_create(district_name=dist_name)

                    zone_name = safe_get('zone')
                    station_mark = safe_get('societiesstationmark') or safe_get('station_mark')
                    zone_obj = None
                    if zone_name or station_mark:
                        s_mark = station_mark or f"ST-{zone_name[:4].upper()}" if zone_name else "ST-001"
                        zone_obj, _ = Zone.objects.get_or_create(
                            station_mark=s_mark,
                            defaults={'zone_name': zone_name or s_mark, 'district': district_obj}
                        )
                        
                    defaults = {
                        'society': dist_name,
                        'zone': zone_name,
                        'station_mark': station_mark,
                        'district_society': district_obj,
                        'zone_fk': zone_obj,
                        'name': safe_get('member') or safe_get('first_name') or 'Unknown Farmer',
                        'gender': safe_get('gender'),
                        'phone_numbers': safe_get('phonenumbers') or safe_get('contact'),
                        'contact': safe_get('phonenumbers') or safe_get('contact'),
                        'id_card_number': safe_get('idcardnumber') or safe_get('gh_card'),
                        'gh_card': safe_get('idcardnumber') or safe_get('gh_card'),
                        'cocobod_id': kk_id,
                        'farmer_id': kk_id,
                    }
                    
                    try:
                        yob = row.get('yearofbirth')
                        defaults['year_of_birth'] = int(yob) if pd.notna(yob) else None
                    except (ValueError, TypeError):
                        defaults['year_of_birth'] = None
                        
                    try:
                        fsize = row.get('fieldsize') or row.get('actual_farm_size')
                        defaults['field_size'] = float(fsize) if pd.notna(fsize) else None
                        defaults['actual_farm_size'] = defaults['field_size']
                    except (ValueError, TypeError):
                        defaults['field_size'] = None
                        
                    try:
                        vol = row.get('volume')
                        defaults['volume'] = float(vol) if pd.notna(vol) else None
                    except (ValueError, TypeError):
                        defaults['volume'] = None
                        
                    try:
                        bags = row.get('bags')
                        defaults['bags'] = float(bags) if pd.notna(bags) else None
                    except (ValueError, TypeError):
                        defaults['bags'] = None

                    obj, created = Farmer.objects.update_or_create(
                        kk_id_num=kk_id,
                        defaults=defaults
                    )
                    
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

            return Response({
                "message": f"Successfully imported farmers. Created {created_count}, Updated {updated_count}."
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
