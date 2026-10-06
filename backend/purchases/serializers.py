from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Region, District, Zone, OfficerSociety, Farmer, Farm, Season, 
    Delivery, DeliveryUpdate, PurchaseSession, PurchaseRecord, FieldAgentProfile
)

class UserSerializer(serializers.ModelSerializer):
    assigned_societies = serializers.JSONField(source='fieldagentprofile.assigned_societies', required=False)
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('id', 'username', 'password', 'assigned_societies')

    def create(self, validated_data):
        profile_data = validated_data.pop('fieldagentprofile', {})
        societies = profile_data.get('assigned_societies', [])
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data, password=password)
        FieldAgentProfile.objects.create(user=user, assigned_societies=societies)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('fieldagentprofile', {})
        if 'assigned_societies' in profile_data:
            profile, created = FieldAgentProfile.objects.get_or_create(user=instance)
            profile.assigned_societies = profile_data['assigned_societies']
            profile.save()
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        instance.username = validated_data.get('username', instance.username)
        instance.save()
        return instance

class RegionSerializer(serializers.ModelSerializer):
    districts_count = serializers.SerializerMethodField()

    class Meta:
        model = Region
        fields = '__all__'

    def get_districts_count(self, obj):
        return obj.districts.count()

class DistrictSerializer(serializers.ModelSerializer):
    region_name = serializers.ReadOnlyField(source='region.region_name', default='')
    zones_count = serializers.SerializerMethodField()

    class Meta:
        model = District
        fields = '__all__'

    def get_zones_count(self, obj):
        return obj.zones.count()

class ZoneSerializer(serializers.ModelSerializer):
    district_name = serializers.ReadOnlyField(source='district.district_name', default='')

    class Meta:
        model = Zone
        fields = '__all__'

class OfficerSocietySerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    district_name = serializers.ReadOnlyField(source='district_society.district_name')

    class Meta:
        model = OfficerSociety
        fields = '__all__'

class SeasonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Season
        fields = '__all__'

class FarmSerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.name')
    cocobod_id = serializers.ReadOnlyField(source='farmer.cocobod_id')

    class Meta:
        model = Farm
        fields = '__all__'

class FarmerSerializer(serializers.ModelSerializer):
    district_name = serializers.ReadOnlyField(source='district_society.district_name', default='')
    zone_name_str = serializers.ReadOnlyField(source='zone.zone_name', default='')
    farms_count = serializers.SerializerMethodField()

    class Meta:
        model = Farmer
        fields = '__all__'

    def get_farms_count(self, obj):
        return obj.farms.count()

class DeliverySerializer(serializers.ModelSerializer):
    farmer_name = serializers.ReadOnlyField(source='farmer.name')
    cocobod_id = serializers.ReadOnlyField(source='farmer.cocobod_id')
    season_name = serializers.ReadOnlyField(source='season.season_name', default='2025/2026')
    created_by_user = serializers.ReadOnlyField(source='created_by.username', default='System')
    kilos = serializers.ReadOnlyField()
    bags = serializers.ReadOnlyField()
    amount_ghc = serializers.ReadOnlyField()
    waybill_no = serializers.ReadOnlyField()
    dprs_number = serializers.ReadOnlyField()

    class Meta:
        model = Delivery
        fields = '__all__'

class DeliveryUpdateSerializer(serializers.ModelSerializer):
    updated_by_user = serializers.ReadOnlyField(source='updated_by.username')

    class Meta:
        model = DeliveryUpdate
        fields = '__all__'

class PurchaseRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseRecord
        fields = '__all__'
        read_only_fields = ('session',)

class PurchaseSessionSerializer(serializers.ModelSerializer):
    records = PurchaseRecordSerializer(many=True)
    total_kilos = serializers.ReadOnlyField()
    total_bags = serializers.ReadOnlyField()
    total_amount = serializers.ReadOnlyField()

    class Meta:
        model = PurchaseSession
        fields = '__all__'

    def create(self, validated_data):
        records_data = validated_data.pop('records', [])
        client_id = validated_data.get('client_id')
        
        if client_id:
            session, created = PurchaseSession.objects.get_or_create(
                client_id=client_id,
                defaults=validated_data
            )
            if not created:
                return session
        else:
            session = PurchaseSession.objects.create(**validated_data)
            
        for record_data in records_data:
            PurchaseRecord.objects.create(session=session, **record_data)
        return session
