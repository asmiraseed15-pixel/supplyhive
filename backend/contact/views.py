
import json

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.core.mail import send_mail
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import ContactMessage


@csrf_exempt
@require_POST
def submit_contact(request):
    # 1. Read and validate request data
    try:
        data = json.loads(request.body or "{}")

        if not isinstance(data, dict):
            return JsonResponse(
                {
                    "success": False,
                    "message": "Invalid request data.",
                },
                status=400,
            )

    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {
                "success": False,
                "message": "Invalid request data.",
            },
            status=400,
        )

    # 2. Extract form fields
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip()
    phone = str(data.get("phone", "")).strip()
    message = str(data.get("message", "")).strip()

    # 3. Check required fields
    if not name or not email or not message:
        return JsonResponse(
            {
                "success": False,
                "message": "Please enter your name, email and message.",
            },
            status=400,
        )

    # 4. Validate email address
    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse(
            {
                "success": False,
                "message": "Please enter a valid email address.",
            },
            status=400,
        )

    # 5. Validate field lengths
    if len(name) > 150 or len(phone) > 20:
        return JsonResponse(
            {
                "success": False,
                "message": "Name or phone number is too long.",
            },
            status=400,
        )

    if len(email) > 254:
        return JsonResponse(
            {
                "success": False,
                "message": "Email address is too long.",
            },
            status=400,
        )

    if len(message) > 10000:
        return JsonResponse(
            {
                "success": False,
                "message": "Message is too long. Please shorten it.",
            },
            status=400,
        )

    # 6. Save message in the database
    try:
        contact = ContactMessage.objects.create(
            name=name,
            email=email,
            phone=phone,
            message=message,
        )
    except Exception as error:
        print("Supplyhive database error:", str(error))

        return JsonResponse(
            {
                "success": False,
                "message": "Unable to save your message. Please try again.",
            },
            status=500,
        )

    # 7. Send email notification
    receiver_email = getattr(
        settings,
        "CONTACT_RECEIVER_EMAIL",
        "asmiraseed15@gmail.com",
    )

    try:
        sent_count = send_mail(
            subject=f"New Supplyhive Contact Message from {name}",
            message=(
                "You received a new message from Supplyhive.\n\n"
                f"Name: {name}\n"
                f"Email: {email}\n"
                f"Phone: {phone or 'Not provided'}\n\n"
                f"Message:\n{message}\n\n"
                f"Message ID: {contact.id}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[receiver_email],
            fail_silently=False,
        )

        if sent_count != 1:
            raise RuntimeError("Email provider did not confirm delivery.")

    except Exception as error:
        print("Supplyhive email error:", str(error))

        return JsonResponse(
            {
                "success": False,
                "message": (
                    "Your message was saved, but the email notification "
                    "could not be sent. Please try again later."
                ),
                "saved": True,
                "id": contact.id,
            },
            status=500,
        )

    # 8. Return success response
    return JsonResponse(
        {
            "success": True,
            "message": (
                "Message successfully sent! "
                "Thank you for contacting Supplyhive."
            ),
            "id": contact.id,
        },
        status=201,
    )
