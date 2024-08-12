# add_superior_admin.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from quiz_game.models import admin_model


class Command(BaseCommand):
    help = 'Create a superior admin'

    def handle(self, *args, **kwargs):
        # Check if a superior admin already exists
        if admin_model.objects.filter(name='Aadhi').exists():
            self.stdout.write(self.style.WARNING('Superior admin already exists. Skipping creation.'))
        else:
            # Create the superior admin
            admin_model.objects.create(
                name='Aadhi', 
                password='2223',
                is_superior=True,
                created_date=timezone.now(),
                updated_date=timezone.now()
            )
            self.stdout.write(self.style.SUCCESS('Superior admin created successfully.'))
