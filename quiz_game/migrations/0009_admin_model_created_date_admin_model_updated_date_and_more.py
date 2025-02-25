# Generated by Django 5.0 on 2024-06-26 10:09

import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz_game', '0008_admin_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='admin_model',
            name='created_date',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name='admin_model',
            name='updated_date',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='admin_model',
            name='password',
            field=models.CharField(max_length=10),
        ),
    ]
