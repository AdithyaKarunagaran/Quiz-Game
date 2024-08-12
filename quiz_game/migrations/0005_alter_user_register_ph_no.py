# Generated by Django 5.0 on 2024-04-13 11:47

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('quiz_game', '0004_user_register_created_date_user_register_e_mail_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user_register',
            name='ph_no',
            field=models.CharField(max_length=10, validators=[django.core.validators.RegexValidator('^\\d{10}$', message='Phone number must be 10 digits')]),
        ),
    ]
