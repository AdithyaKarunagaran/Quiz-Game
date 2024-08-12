from django.core.validators import RegexValidator
from django.utils import timezone
from django.db import models
from django.utils.timezone import now
from django.dispatch import receiver
from django.db.models.signals import post_save


class JSQuestion(models.Model):
    question = models.CharField(max_length=1024)
    choices = models.JSONField()
    answer = models.IntegerField()
    created_by = models.CharField(max_length=100, default='Adithya')
    created_date = models.DateField(default=now)
    update_by = models.CharField(max_length=100, null=True, blank=True)
    update_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.question


# user details table
class User_Register(models.Model):
    name = models.CharField(max_length=100)
    e_mail = models.EmailField(unique=True)
    ph_no = models.CharField(
        max_length=10,
        validators=[RegexValidator(r'^\d{10}$', message='Phone number must be 10 digits')]
    )
    quiz_marks = models.JSONField(default=list)
    quiz_attempts = models.IntegerField(default=0)
    created_date = models.DateTimeField(default=timezone.now)
    updated_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.e_mail

    def append_score(self, score):
        self.quiz_marks.append(score)
        self.quiz_attempts += 1
        self.save()


class admin_model(models.Model):
    name = models.CharField(max_length=100)
    password = models.CharField(max_length=10)
    is_superior = models.BooleanField(default=False)
    created_date = models.DateTimeField(default=timezone.now)
    updated_date = models.DateTimeField(auto_now=True)
    access = models.OneToOneField('AdminAccess', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name
    
    
class AdminAccess(models.Model):
    admin = models.OneToOneField(admin_model, on_delete=models.CASCADE, primary_key=True)
    edit_question = models.BooleanField(default=False)
    add_question = models.BooleanField(default=False)
    edit_question_status = models.CharField(max_length=20, default='pending', choices=[('pending', 'Pending'), ('waiting', 'Waiting for approval'), ('approved', 'Approved'), ('denied', 'Denied')])
    add_question_status = models.CharField(max_length=20, default='pending', choices=[('pending', 'Pending'), ('waiting', 'Waiting for approval'), ('approved', 'Approved'), ('denied', 'Denied')])

    def __str__(self):
        return f"{self.admin.name}'s Access"

    class Meta:
        verbose_name_plural = "Admin Access Permissions"


@receiver(post_save, sender=admin_model)
def create_admin_access(sender, instance, created, **kwargs):
    if created and not instance.access:
        AdminAccess.objects.create(admin=instance)

@receiver(post_save, sender=admin_model)
def save_admin_access(sender, instance, **kwargs):
    if instance.access:
        instance.access.save()