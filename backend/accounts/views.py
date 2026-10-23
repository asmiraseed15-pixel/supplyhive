

import hashlib
import json
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailOTP, UserProfile

User = get_user_model()


def json_error(message, code=400):
    return JsonResponse(
        {"success": False, "message": message},
        status=code,
    )


def read_json(request):
    try:
        return json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return None


def hash_otp(otp):
    return hashlib.sha256(otp.encode()).hexdigest()


def get_user_name(user):
    name = user.first_name.strip()
    if name:
        return name

    full_name = user.get_full_name().strip()
    if full_name:
        return full_name

    return user.username


@csrf_exempt
@require_POST
def send_otp(request):
    data = read_json(request)

    if data is None:
        return json_error("Invalid JSON")

    email = str(data.get("email", "")).strip().lower()

    try:
        validate_email(email)
    except ValidationError:
        return json_error("Enter a valid email address")

    otp = f"{secrets.randbelow(1000000):06d}"

    EmailOTP.objects.filter(
        email=email,
        is_verified=False,
    ).delete()

    EmailOTP.objects.create(
        email=email,
        otp_hash=hash_otp(otp),
        expires_at=timezone.now() + timedelta(minutes=5),
    )

    try:
        send_mail(
            subject="Your Supplyhive verification code",
            message=f"Your OTP is {otp}. It expires in 5 minutes.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception:
        EmailOTP.objects.filter(
            email=email,
            is_verified=False,
        ).delete()

        return json_error(
            "Unable to send OTP. Please try again.",
            500,
        )

    return JsonResponse({
        "success": True,
        "message": "OTP sent successfully",
    })


@csrf_exempt
@require_POST
def verify_otp(request):
    data = read_json(request)

    if data is None:
        return json_error("Invalid JSON")

    email = str(data.get("email", "")).strip().lower()
    otp = str(data.get("otp", "")).strip()

    if not email or not otp:
        return json_error("Email and OTP are required")

    otp_record = EmailOTP.objects.filter(
        email=email,
        is_verified=False,
    ).order_by("-created_at").first()

    if not otp_record:
        return json_error("OTP not found. Request a new OTP.")

    if otp_record.is_expired:
        otp_record.delete()
        return json_error("OTP expired. Request a new OTP.")

    if otp_record.attempts >= 5:
        otp_record.delete()
        return json_error("Too many attempts. Request a new OTP.")

    otp_record.attempts += 1
    otp_record.save(update_fields=["attempts"])

    if otp_record.otp_hash != hash_otp(otp):
        return json_error("Invalid OTP")

    otp_record.is_verified = True
    otp_record.save(update_fields=["is_verified"])

    return JsonResponse({
        "success": True,
        "message": "Email verified successfully",
    })


@csrf_exempt
@require_POST
def register(request):
    data = read_json(request)

    if data is None:
        return json_error("Invalid JSON")

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not name or not email or not password:
        return json_error("Name, email and password are required")

    try:
        validate_email(email)
    except ValidationError:
        return json_error("Enter a valid email address")

    if User.objects.filter(email__iexact=email).exists():
        return json_error("Email already registered")

    # Preserve email OTP verification for registration.
    otp_record = EmailOTP.objects.filter(
        email=email,
        is_verified=True,
    ).order_by("-created_at").first()

    if not otp_record or otp_record.is_expired:
        return json_error("Please verify your email first")

    try:
        validate_password(password)
    except ValidationError as exc:
        return json_error(" ".join(exc.messages))

    with transaction.atomic():
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=name,
        )

        UserProfile.objects.get_or_create(user=user)

        otp_record.delete()

    refresh = RefreshToken.for_user(user)

    return JsonResponse({
        "success": True,
        "message": "Registration successful",
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.pk,
            "name": get_user_name(user),
            "email": user.email,
        },
    }, status=201)


@csrf_exempt
@require_POST
def login(request):
    data = read_json(request)

    if data is None:
        return json_error("Invalid JSON")

    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return json_error("Email and password are required")

    user_by_email = User.objects.filter(
        email__iexact=email,
    ).first()

    if not user_by_email:
        return json_error("Invalid email or password", 401)

    user = authenticate(
        request,
        username=user_by_email.username,
        password=password,
    )

    if user is None:
        return json_error("Invalid email or password", 401)

    refresh = RefreshToken.for_user(user)

    return JsonResponse({
        "success": True,
        "message": "Login successful",
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": user.pk,
            "name": get_user_name(user),
            "email": user.email,
        },
    })


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user

    profile_data, _ = UserProfile.objects.get_or_create(
        user=user,
    )

    if request.method == "PUT":
        name = request.data.get("name")
        email = request.data.get("email")
        mobile_number = request.data.get("mobile_number")

        if name is not None:
            name = str(name).strip()

            if not name:
                return Response(
                    {
                        "success": False,
                        "message": "Name is required",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.first_name = name

        if email is not None:
            email = str(email).strip().lower()

            try:
                validate_email(email)
            except ValidationError:
                return Response(
                    {
                        "success": False,
                        "message": "Enter a valid email address",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if User.objects.filter(
                email__iexact=email,
            ).exclude(pk=user.pk).exists():
                return Response(
                    {
                        "success": False,
                        "message": "Email already exists",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.email = email
            user.username = email

        if mobile_number is not None:
            mobile_number = str(mobile_number).strip()

            if len(mobile_number) > 15:
                return Response(
                    {
                        "success": False,
                        "message": "Mobile number must not exceed 15 characters",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            profile_data.mobile_number = mobile_number

        with transaction.atomic():
            user.save()

            if mobile_number is not None:
                profile_data.save()

    return Response(
        {
            "success": True,
            "user": {
                "id": user.pk,
                "name": get_user_name(user),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "mobile_number": profile_data.mobile_number,
            },
        },
        status=status.HTTP_200_OK,
    )
