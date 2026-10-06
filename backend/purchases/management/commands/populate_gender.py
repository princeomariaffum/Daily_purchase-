from django.core.management.base import BaseCommand
from purchases.models import Farmer
from purchases.gender_detector import detect_gender

class Command(BaseCommand):
    help = 'Re-analyzes and populates gender for all existing Farmers in the database using the Ghanaian Name Dictionary.'

    def handle(self, *args, **options):
        farmers = Farmer.objects.all()
        total_farmers = farmers.count()
        updated_count = 0
        male_count = 0
        female_count = 0

        self.stdout.write(f"Re-analyzing gender for {total_farmers} existing farmers in database...")

        batch_updates = []
        for farmer in farmers:
            full_name = farmer.name or f"{farmer.first_name} {farmer.last_name}".strip()
            detected_gender = detect_gender(full_name)
            
            if farmer.gender != detected_gender:
                farmer.gender = detected_gender
                batch_updates.append(farmer)
                updated_count += 1

            if detected_gender == 'Female':
                female_count += 1
            else:
                male_count += 1

        if batch_updates:
            Farmer.objects.bulk_update(batch_updates, ['gender'], batch_size=500)

        self.stdout.write(self.style.SUCCESS(
            f"Successfully updated gender for {updated_count} farmers! "
            f"New Demographics -> Male: {male_count} ({(male_count/total_farmers*100):.1f}%), "
            f"Female: {female_count} ({(female_count/total_farmers*100):.1f}%)."
        ))
