

from django.db import models
from django.utils import timezone
from django.conf import settings


class EmailOTP(models.Model):
    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    is_verified = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)

    def __str__(self):
        return f"Email OTP for {self.email}"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_profile"
    )
    mobile_number = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"Profile - {self.user.username}"
