from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
import uuid
from purchases.gender_detector import detect_gender

class Region(models.Model):
    region_name = models.CharField(max_length=150, unique=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.region_name

class District(models.Model):
    district_society_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True, related_name='districts')
    district_name = models.CharField(max_length=200)
    location = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.district_name} ({self.region.region_name if self.region else 'No Region'})"

class Zone(models.Model):
    station_mark = models.CharField(max_length=100, unique=True)
    zone_name = models.CharField(max_length=200)
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='zones', null=True, blank=True)
    status = models.CharField(max_length=50, default='Active', choices=[('Active', 'Active'), ('Inactive', 'Inactive')])
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.zone_name} [{self.station_mark}]"

class OfficerSociety(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='officer_societies')
    district_society = models.ForeignKey(District, on_delete=models.CASCADE, related_name='assigned_officers')
    assigned_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name_plural = "Officer societies"

    def __str__(self):
        return f"{self.user.username} -> {self.district_society.district_name}"

class Farmer(models.Model):
    farmer_id = models.CharField(max_length=100, blank=True, null=True)
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')
    other_name = models.CharField(max_length=150, blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    dob = models.DateField(blank=True, null=True)
    year_of_birth = models.IntegerField(blank=True, null=True)
    gh_card = models.CharField(max_length=100, blank=True, null=True)
    cocobod_id = models.CharField(max_length=100, blank=True, null=True)
    number_of_farms = models.IntegerField(default=1)
    
    # ERD Relational ForeignKeys
    district_society = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True, related_name='farmers')
    zone_fk = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='farmers')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_farmers')
    actual_farm_size = models.FloatField(default=0.0, blank=True, null=True)
    contact = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    last_update = models.DateTimeField(auto_now=True)

    # Legacy Database Fields (kept as CharFields to preserve existing SQLite table structure)
    society = models.CharField(max_length=150, blank=True, null=True)
    zone = models.CharField(max_length=150, blank=True, null=True)
    station_mark = models.CharField(max_length=100, blank=True, null=True)
    kk_id_num = models.CharField(max_length=100, unique=True, blank=True, null=True)
    name = models.CharField(max_length=200, blank=True, default='')
    phone_numbers = models.CharField(max_length=200, blank=True, null=True)
    id_card_number = models.CharField(max_length=100, blank=True, null=True)
    field_size = models.FloatField(blank=True, null=True)
    volume = models.FloatField(blank=True, null=True)
    bags = models.FloatField(blank=True, null=True)

    def save(self, *args, **kwargs):
        # Auto-sync legacy fields with ERD fields
        if not self.name:
            self.name = f"{self.first_name} {self.last_name}".strip()
        if not self.first_name and self.name:
            parts = self.name.split(' ', 1)
            self.first_name = parts[0]
            if len(parts) > 1:
                self.last_name = parts[1]
        if not self.kk_id_num:
            self.kk_id_num = self.cocobod_id or self.farmer_id or self.gh_card or f"KK-{uuid.uuid4().hex[:8].upper()}"
        if not self.cocobod_id:
            self.cocobod_id = self.kk_id_num
        if not self.farmer_id:
            self.farmer_id = self.kk_id_num
        if not self.contact and self.phone_numbers:
            self.contact = self.phone_numbers
        if not self.phone_numbers and self.contact:
            self.phone_numbers = self.contact
        if not self.gh_card and self.id_card_number:
            self.gh_card = self.id_card_number
        if not self.id_card_number and self.gh_card:
            self.id_card_number = self.gh_card
        if not self.actual_farm_size and self.field_size:
            self.actual_farm_size = self.field_size
        if not self.field_size and self.actual_farm_size:
            self.field_size = self.actual_farm_size
        if self.district_society and not self.society:
            self.society = self.district_society.district_name
        if self.zone_fk and not self.zone:
            self.zone = self.zone_fk.zone_name
        if not self.gender or self.gender in ['N/A', 'Unknown', '']:
            self.gender = detect_gender(self.name or f"{self.first_name} {self.last_name}")
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name or self.first_name} - {self.cocobod_id or self.kk_id_num}"

class Farm(models.Model):
    farm_id = models.AutoField(primary_key=True)
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name='farms')
    district_society = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True, related_name='farms')
    zone = models.ForeignKey(Zone, on_delete=models.SET_NULL, null=True, blank=True, related_name='farms')
    coordinates = models.CharField(max_length=255, blank=True, null=True)
    farm_size_ha = models.FloatField(default=0.0)
    polygon = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=50, default='Active', choices=[('Active', 'Active'), ('Inactive', 'Inactive')])
    estimated_yield_kg = models.FloatField(default=0.0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_farms')
    created_at = models.DateTimeField(default=timezone.now)
    last_update = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Farm {self.farm_id} - {self.farmer.name} ({self.farm_size_ha} ha)"

class Season(models.Model):
    season_name = models.CharField(max_length=100, unique=True)
    start_at = models.DateField(default=timezone.now)
    end_at = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.season_name

class Delivery(models.Model):
    delivery_id = models.AutoField(primary_key=True)
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name='deliveries')
    farm = models.ForeignKey(Farm, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    season = models.ForeignKey(Season, on_delete=models.SET_NULL, null=True, blank=True, related_name='deliveries')
    volume_delivered_kilos = models.FloatField(default=0.0)
    volume_delivered_bags = models.FloatField(default=0.0)
    DPR_serial_number = models.CharField(max_length=100, blank=True, null=True)
    waybill_number = models.CharField(max_length=100, blank=True, null=True)
    delivery_date = models.DateField(default=timezone.now)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_deliveries')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.volume_delivered_kilos and not self.volume_delivered_bags:
            self.volume_delivered_bags = round(self.volume_delivered_kilos / 62.5, 2)
        elif self.volume_delivered_bags and not self.volume_delivered_kilos:
            self.volume_delivered_kilos = self.volume_delivered_bags * 62.5
        super().save(*args, **kwargs)

    @property
    def kilos(self):
        return self.volume_delivered_kilos

    @property
    def bags(self):
        return self.volume_delivered_bags

    @property
    def amount_ghc(self):
        return round(self.volume_delivered_kilos * 52.0, 2)

    @property
    def waybill_no(self):
        return self.waybill_number or "—"

    @property
    def dprs_number(self):
        return self.DPR_serial_number or "—"

    def __str__(self):
        return f"Delivery #{self.delivery_id} - {self.farmer.name} ({self.volume_delivered_kilos} kg)"

class DeliveryUpdate(models.Model):
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, related_name='updates')
    updated_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='delivery_updates')
    updated_at = models.DateTimeField(default=timezone.now)
    remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Update on Delivery #{self.delivery.delivery_id} by {self.updated_by.username}"

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
    client_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    
    @property
    def total_kilos(self):
        return sum(record.kilos for record in self.records.all())
        
    @property
    def total_bags(self):
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

class FieldAgentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    assigned_societies = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
