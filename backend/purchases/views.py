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
