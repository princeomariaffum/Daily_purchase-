from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Creates or resets an admin superuser account'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, default='admin')
        parser.add_argument('--password', type=str, default='Admin@2026!')
        parser.add_argument('--email', type=str, default='admin@cyhoracorelab.com')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options['email']

        user, created = User.objects.get_or_create(username=username, defaults={'email': email})
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.is_active = True
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"Successfully created superuser '{username}' with password '{password}'"))
        else:
            self.stdout.write(self.style.SUCCESS(f"Successfully updated superuser '{username}' with password '{password}'"))
