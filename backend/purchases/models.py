from django.db import models
from django.utils import timezone

class PurchaseSession(models.Model):
    cocoa_season = models.CharField(max_length=50)
    zone_name = models.CharField(max_length=100)
    society_district_name = models.CharField(max_length=100)
    zone_station = models.CharField(max_length=100, blank=True, null=True)
    waybill_no = models.CharField(max_length=100)
    dprs_number = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    
    @property
    def total_kilos(self):
        return sum(record.kilos for record in self.records.all())
        
    @property
    def total_bags(self):
        # Using 62.5 kg per bag as per physical book standard
        return self.total_kilos / 62.5 if self.total_kilos else 0
        
    @property
    def total_amount(self):
        return sum(record.amount_ghc for record in self.records.all())

    def __str__(self):
        return f"Waybill: {self.waybill_no} - {self.society_district_name}"

class PurchaseRecord(models.Model):
    session = models.ForeignKey(PurchaseSession, on_delete=models.CASCADE, related_name='records')
    date = models.DateField(default=timezone.now)
    farmer_name = models.CharField(max_length=200)
    farmer_status = models.CharField(max_length=50, choices=[('Existing', 'Existing'), ('New', 'New')])
    cocoa_card_id = models.CharField(max_length=100)
    kk_id = models.CharField(max_length=100, blank=True, null=True)
    kilos = models.FloatField()
    amount_ghc = models.FloatField()

    def __str__(self):
        return f"{self.farmer_name} - {self.kilos}kg"

class Farmer(models.Model):
    society = models.CharField(max_length=150, blank=True, null=True)
    zone = models.CharField(max_length=150, blank=True, null=True)
    station_mark = models.CharField(max_length=100, blank=True, null=True)
    kk_id_num = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=200)
    gender = models.CharField(max_length=20, blank=True, null=True)
    year_of_birth = models.IntegerField(blank=True, null=True)
    phone_numbers = models.CharField(max_length=200, blank=True, null=True)
    id_card_number = models.CharField(max_length=100, blank=True, null=True)
    field_size = models.FloatField(blank=True, null=True)
    volume = models.FloatField(blank=True, null=True)
    bags = models.FloatField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} - {self.kk_id_num}"

from django.contrib.auth.models import User

class FieldAgentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    assigned_societies = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
