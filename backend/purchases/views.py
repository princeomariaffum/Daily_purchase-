from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
import pandas as pd
from django.contrib.auth.models import User
from .models import PurchaseSession, PurchaseRecord, Farmer
from .serializers import PurchaseSessionSerializer, PurchaseRecordSerializer, FarmerSerializer, UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
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
                return Farmer.objects.filter(society__in=profile.assigned_societies).order_by('name')
            return Farmer.objects.none()
        except:
            return Farmer.objects.none()

    @action(detail=True, methods=['get'])
    def lifetime_history(self, request, pk=None):
        farmer = self.get_object()
        
        # Match purchase records by KK ID or Farmer Name
        from django.db.models import Q
        records = PurchaseRecord.objects.filter(
            Q(kk_id=farmer.kk_id_num) | Q(farmer_name__iexact=farmer.name)
        ).select_related('session').order_by('-date')

        total_kilos = sum(r.kilos for r in records) or (farmer.volume or 0)
        total_bags = round(total_kilos / 62.5, 2)
        total_amount = sum(r.amount_ghc for r in records) or (total_kilos * 50)
        bonus_entitled = round(total_kilos * 1.12, 2)
        
        field_size = farmer.field_size or 0
        yield_per_hectare = round(total_kilos / field_size, 2) if field_size > 0 else 0

        # Group by Cocoa Season
        seasons_dict = {}
        records_list = []

        for r in records:
            season = r.session.cocoa_season if r.session else '2025/2026'
            if season not in seasons_dict:
                seasons_dict[season] = {
                    'season': season,
                    'kilos': 0,
                    'bags': 0,
                    'amount': 0,
                    'bonus': 0,
                    'count': 0
                }
            seasons_dict[season]['kilos'] += r.kilos
            seasons_dict[season]['bags'] = round(seasons_dict[season]['kilos'] / 62.5, 2)
            seasons_dict[season]['amount'] += r.amount_ghc
            seasons_dict[season]['bonus'] = round(seasons_dict[season]['kilos'] * 1.12, 2)
            seasons_dict[season]['count'] += 1

            records_list.append({
                'id': r.id,
                'date': str(r.date),
                'session_id': r.session.id if r.session else None,
                'waybill_no': r.session.waybill_no if r.session else '—',
                'season': season,
                'society': r.session.society_district_name if r.session else farmer.society,
                'kilos': r.kilos,
                'bags': round(r.kilos / 62.5, 2),
                'amount_ghc': r.amount_ghc,
                'bonus_ghc': round(r.kilos * 1.12, 2)
            })

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
            # Normalize column names by replacing spaces and lowercasing
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

                    kk_id = safe_get('kkidnum')
                    if not kk_id:
                        continue
                        
                    defaults = {
                        'society': safe_get('society') or safe_get('depot'),
                        'zone': safe_get('zone'),
                        'station_mark': safe_get('societiesstationmark'),
                        'name': safe_get('member') or 'Unknown Farmer',
                        'gender': safe_get('gender'),
                        'phone_numbers': safe_get('phonenumbers'),
                        'id_card_number': safe_get('idcardnumber'),
                    }
                    
                    try:
                        yob = row.get('yearofbirth')
                        defaults['year_of_birth'] = int(yob) if pd.notna(yob) else None
                    except (ValueError, TypeError):
                        defaults['year_of_birth'] = None
                        
                    try:
                        fsize = row.get('fieldsize')
                        defaults['field_size'] = float(fsize) if pd.notna(fsize) else None
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

