from rest_framework import serializers
from .models import PurchaseSession, PurchaseRecord, Farmer
from django.contrib.auth.models import User
from .models import PurchaseSession, PurchaseRecord, Farmer, FieldAgentProfile

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

class FarmerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Farmer
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
        session = PurchaseSession.objects.create(**validated_data)
        for record_data in records_data:
            PurchaseRecord.objects.create(session=session, **record_data)
        return session
