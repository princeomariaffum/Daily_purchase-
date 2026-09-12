from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from purchases.models import (
    Region, District, Zone, Season, Farmer, Farm, Delivery, PurchaseRecord
)
import datetime

class Command(BaseCommand):
    help = 'Seeds initial ERD records (Regions, Districts, Zones, Seasons) and migrates legacy purchase records'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting ERD database seeding & data migration..."))

        # 1. Regions
        r_wn, _ = Region.objects.get_or_create(region_name="Western North")
        r_ash, _ = Region.objects.get_or_create(region_name="Ashanti")
        r_ah, _ = Region.objects.get_or_create(region_name="Ahafo")
        r_ea, _ = Region.objects.get_or_create(region_name="Eastern")

        self.stdout.write(f"Seeded 4 Regions.")

        # 2. Districts
        d_offinso, _ = District.objects.get_or_create(
            district_name="Offinso District Society",
            defaults={'region': r_ash, 'location': 'Offinso Depot'}
        )
        d_goaso, _ = District.objects.get_or_create(
            district_name="Goaso District Society",
            defaults={'region': r_ah, 'location': 'Goaso Main Depot'}
        )
        d_sefwi, _ = District.objects.get_or_create(
            district_name="Sefwi Wiawso District Society",
            defaults={'region': r_wn, 'location': 'Sefwi Depot'}
        )
        d_asankra, _ = District.objects.get_or_create(
            district_name="Asankrangwa District Society",
            defaults={'region': r_wn, 'location': 'Asankrangwa Depot'}
        )

        self.stdout.write(f"Seeded 4 Districts.")

        # 3. Zones
        z_off, _ = Zone.objects.get_or_create(
            station_mark="OFF-01",
            defaults={'zone_name': "Offinso Central Zone", 'district': d_offinso, 'status': 'Active'}
        )
        z_goa, _ = Zone.objects.get_or_create(
            station_mark="GOA-01",
            defaults={'zone_name': "Goaso Main Zone", 'district': d_goaso, 'status': 'Active'}
        )
        z_sef, _ = Zone.objects.get_or_create(
            station_mark="SEF-01",
            defaults={'zone_name': "Sefwi North Zone", 'district': d_sefwi, 'status': 'Active'}
        )
        z_asa, _ = Zone.objects.get_or_create(
            station_mark="ASA-01",
            defaults={'zone_name': "Asankrangwa East Zone", 'district': d_asankra, 'status': 'Active'}
        )

        self.stdout.write(f"Seeded 4 Zones.")

        # 4. Seasons
        s_current, _ = Season.objects.get_or_create(
            season_name="2025/2026 Main Crop",
            defaults={'start_at': datetime.date(2025, 10, 1), 'is_active': True}
        )
        s_past, _ = Season.objects.get_or_create(
            season_name="2024/2025 Light Crop",
            defaults={'start_at': datetime.date(2024, 10, 1), 'end_at': datetime.date(2025, 9, 30), 'is_active': False}
        )

        self.stdout.write(f"Seeded Seasons.")

        # 5. Connect existing Farmers to Districts, Zones & Seed Farms
        admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()

        farmers = Farmer.objects.all()
        farm_count = 0
        for farmer in farmers:
            if not farmer.district_society:
                farmer.district_society = d_offinso
            if not farmer.zone_fk:
                farmer.zone_fk = z_off
            farmer.save()

            # Create default Farm if none exists
            if not farmer.farms.exists():
                Farm.objects.create(
                    farmer=farmer,
                    district_society=farmer.district_society,
                    zone=farmer.zone_fk or z_off,
                    coordinates="6.7333, -1.6500",
                    farm_size_ha=farmer.actual_farm_size or farmer.field_size or 2.5,
                    polygon=[
                        {"lat": 6.7333, "lng": -1.6500},
                        {"lat": 6.7350, "lng": -1.6520},
                        {"lat": 6.7360, "lng": -1.6480},
                        {"lat": 6.7333, "lng": -1.6500}
                    ],
                    status="Active",
                    estimated_yield_kg=(farmer.actual_farm_size or 2.5) * 450.0,
                    created_by=admin_user
                )
                farm_count += 1

        self.stdout.write(f"Linked {farmers.count()} Farmers and created {farm_count} Farm polygons.")

        # 6. Migrate PurchaseRecord instances to Delivery instances
        legacy_records = PurchaseRecord.objects.all()
        deliv_count = 0
        for rec in legacy_records:
            farmer = Farmer.objects.filter(kk_id_num=rec.kk_id).first() or Farmer.objects.filter(name__iexact=rec.farmer_name).first()
            if farmer:
                farm = farmer.farms.first()
                season_name = rec.session.cocoa_season if rec.session else "2025/2026 Main Crop"
                season_obj, _ = Season.objects.get_or_create(season_name=season_name)

                Delivery.objects.get_or_create(
                    farmer=farmer,
                    delivery_date=rec.date,
                    volume_delivered_kilos=rec.kilos,
                    defaults={
                        'farm': farm,
                        'season': season_obj,
                        'volume_delivered_bags': round(rec.kilos / 62.5, 2),
                        'DPR_serial_number': rec.session.dprs_number if rec.session else "DPR-000",
                        'waybill_number': rec.session.waybill_no if rec.session else "WAY-000",
                        'created_by': admin_user
                    }
                )
                deliv_count += 1

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated {deliv_count} purchase transactions into Delivery records!"))
