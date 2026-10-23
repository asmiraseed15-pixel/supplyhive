
import os
import logging
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

import razorpay

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from rest_framework_simplejwt.authentication import JWTAuthentication

from products.models import Product
from .models import Order, OrderItem


logger = logging.getLogger(__name__)


# ---------------------------------------------------------
# HELPER: PRODUCT IMAGE URL
# ---------------------------------------------------------

def get_product_image_url(request, product):
    """
    Return the absolute image URL for a product.
    Returns None when no image is available.
    """
    if not product or not product.image:
        return None

    try:
        return request.build_absolute_uri(product.image.url)
    except (ValueError, AttributeError):
        return None


# ---------------------------------------------------------
# RAZORPAY CONFIGURATION
# ---------------------------------------------------------

def get_razorpay_client():
    key_id = (
        getattr(settings, "RAZORPAY_KEY_ID", None)
        or os.getenv("RAZORPAY_KEY_ID")
    )

    key_secret = (
        getattr(settings, "RAZORPAY_KEY_SECRET", None)
        or os.getenv("RAZORPAY_KEY_SECRET")
    )

    if not key_id or not key_secret:
        return None, None

    client = razorpay.Client(
        auth=(key_id, key_secret)
    )

    return client, key_id


# ---------------------------------------------------------
# HELPER: TRACKING INFORMATION
# ---------------------------------------------------------

def get_tracking_details(order):
    tracking_steps = [
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
    ]

    cancelled = order.order_status == "CANCELLED"

    if cancelled:
        current_step_index = -1
    else:
        current_step_index = (
            tracking_steps.index(order.order_status)
            if order.order_status in tracking_steps
            else 0
        )

    return {
        "tracking_steps": [
            {
                "status": step,
                "label": step.replace("_", " ").title(),
                "completed": (
                    not cancelled
                    and index <= current_step_index
                ),
            }
            for index, step in enumerate(tracking_steps)
        ],
        "current_step_index": current_step_index,
        "is_cancelled": cancelled,
        "is_delivered": order.order_status == "DELIVERED",
    }


# ---------------------------------------------------------
# CREATE ORDER
# POST /api/payments/create-order/
# ---------------------------------------------------------

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_order(request):
    data = request.data

    full_name = str(data.get("full_name", "")).strip()
    phone = str(data.get("phone", "")).strip()
    address = str(data.get("address", "")).strip()
    city = str(data.get("city", "")).strip()
    state_name = str(data.get("state", "")).strip()
    postal_code = str(data.get("postal_code", "")).strip()

    payment_method = str(
        data.get("payment_method", "COD")
    ).strip().upper()

    items_data = data.get("items")

    # Validate delivery details
    required_fields = {
        "full_name": full_name,
        "phone": phone,
        "address": address,
        "city": city,
        "state": state_name,
        "postal_code": postal_code,
    }

    missing_fields = [
        field
        for field, value in required_fields.items()
        if not value
    ]

    if missing_fields:
        return Response(
            {
                "success": False,
                "message": "Please provide all delivery details.",
                "missing_fields": missing_fields,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate payment method
    if payment_method not in ["COD", "RAZORPAY"]:
        return Response(
            {
                "success": False,
                "message": "Payment method must be COD or RAZORPAY.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate items
    if not isinstance(items_data, list) or not items_data:
        return Response(
            {
                "success": False,
                "message": "Your cart is empty.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_items = []
    subtotal = Decimal("0.00")

    try:
        for item in items_data:
            if not isinstance(item, dict):
                return Response(
                    {
                        "success": False,
                        "message": "Invalid product item.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            product_id = item.get("product_id")
            quantity = item.get("quantity")

            if product_id is None or quantity is None:
                return Response(
                    {
                        "success": False,
                        "message": (
                            "Each item requires product_id and quantity."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                product_id = int(product_id)
                quantity = int(quantity)
            except (TypeError, ValueError):
                return Response(
                    {
                        "success": False,
                        "message": "Invalid product ID or quantity.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if product_id <= 0 or quantity < 1 or quantity > 99:
                return Response(
                    {
                        "success": False,
                        "message": "Invalid product ID or quantity.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            product = Product.objects.filter(
                id=product_id,
                is_active=True,
            ).first()

            if product is None:
                return Response(
                    {
                        "success": False,
                        "message": (
                            f"Product ID {product_id} is unavailable."
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if product.stock < quantity:
                return Response(
                    {
                        "success": False,
                        "message": (
                            f"Insufficient stock for {product.name}."
                        ),
                        "available_stock": product.stock,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            unit_price = Decimal(str(product.price)).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )

            line_total = (unit_price * quantity).quantize(
                Decimal("0.01"),
                rounding=ROUND_HALF_UP,
            )

            subtotal += line_total

            validated_items.append(
                {
                    "product": product,
                    "product_name": product.name,
                    "unit_price": unit_price,
                    "quantity": quantity,
                    "line_total": line_total,
                }
            )

    except (InvalidOperation, TypeError, ValueError):
        return Response(
            {
                "success": False,
                "message": "Invalid product or price information.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    subtotal = subtotal.quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )

    # Current delivery fee is zero.
    delivery_fee = Decimal("0.00")
    total_amount = subtotal + delivery_fee

    # Create the order and its items in the database.
    with transaction.atomic():
        order = Order.objects.create(
            user=request.user,
            full_name=full_name,
            phone=phone,
            address=address,
            city=city,
            state=state_name,
            postal_code=postal_code,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            payment_method=payment_method,
            payment_status="PENDING",
            order_status="PLACED",
        )

        for item in validated_items:
            OrderItem.objects.create(
                order=order,
                product=item["product"],
                product_name=item["product_name"],
                unit_price=item["unit_price"],
                quantity=item["quantity"],
                line_total=item["line_total"],
            )

    # Cash on Delivery
    if payment_method == "COD":
        return Response(
            {
                "success": True,
                "message": "Cash on Delivery order created successfully.",
                "order_number": str(order.order_number),
                "payment_method": order.payment_method,
                "payment_status": order.payment_status,
                "order_status": order.order_status,
                "subtotal": str(order.subtotal),
                "delivery_fee": str(order.delivery_fee),
                "total_amount": str(order.total_amount),
                "currency": "INR",
            },
            status=status.HTTP_201_CREATED,
        )

    # Razorpay
    client, key_id = get_razorpay_client()

    if client is None:
        return Response(
            {
                "success": False,
                "message": (
                    "Razorpay credentials are not configured "
                    "in the backend."
                ),
                "order_number": str(order.order_number),
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        gateway_order = client.order.create(
            {
                "amount": int(
                    (
                        total_amount * Decimal("100")
                    ).quantize(
                        Decimal("1"),
                        rounding=ROUND_HALF_UP,
                    )
                ),
                "currency": "INR",
                "receipt": str(order.order_number),
                "notes": {
                    "order_number": str(order.order_number),
                    "user_id": str(request.user.id),
                },
            }
        )

        order.razorpay_order_id = gateway_order["id"]
        order.save(update_fields=["razorpay_order_id"])

        return Response(
            {
                "success": True,
                "message": "Razorpay order created successfully.",
                "order_number": str(order.order_number),
                "razorpay_order_id": gateway_order["id"],
                "razorpay_key_id": key_id,
                "amount": gateway_order["amount"],
                "currency": gateway_order["currency"],
                "payment_method": order.payment_method,
                "payment_status": order.payment_status,
                "total_amount": str(order.total_amount),
            },
            status=status.HTTP_201_CREATED,
        )

    except Exception:
        logger.exception(
            "Razorpay order creation failed for %s",
            order.order_number,
        )

        return Response(
            {
                "success": False,
                "message": (
                    "Unable to create the Razorpay payment order. "
                    "Please try again."
                ),
                "order_number": str(order.order_number),
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )


# ---------------------------------------------------------
# VERIFY RAZORPAY PAYMENT
# POST /api/payments/verify-payment/
# ---------------------------------------------------------

@api_view(["POST"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    data = request.data

    order_number = data.get("order_number")
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")

    if not all(
        [
            order_number,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        ]
    ):
        return Response(
            {
                "success": False,
                "message": "Missing Razorpay payment details.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    order = get_object_or_404(
        Order,
        order_number=order_number,
        user=request.user,
    )

    if order.payment_method != "RAZORPAY":
        return Response(
            {
                "success": False,
                "message": "This order does not use Razorpay.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    if order.payment_status == "PAID":
        return Response(
            {
                "success": True,
                "message": "Payment has already been verified.",
                "order_number": str(order.order_number),
                "payment_status": order.payment_status,
                "order_status": order.order_status,
                "total_amount": str(order.total_amount),
            },
            status=status.HTTP_200_OK,
        )

    if order.razorpay_order_id != razorpay_order_id:
        return Response(
            {
                "success": False,
                "message": "Razorpay order ID does not match.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    client, _ = get_razorpay_client()

    if client is None:
        return Response(
            {
                "success": False,
                "message": "Razorpay credentials are not configured.",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    try:
        client.utility.verify_payment_signature(
            {
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "razorpay_signature": razorpay_signature,
            }
        )

        payment = client.payment.fetch(razorpay_payment_id)

        if payment.get("order_id") != razorpay_order_id:
            return Response(
                {
                    "success": False,
                    "message": "Payment belongs to a different order.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        expected_amount = int(
            (
                order.total_amount * Decimal("100")
            ).quantize(
                Decimal("1"),
                rounding=ROUND_HALF_UP,
            )
        )

        if int(payment.get("amount", 0)) != expected_amount:
            return Response(
                {
                    "success": False,
                    "message": "Payment amount does not match the order.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment.get("currency") != "INR":
            return Response(
                {
                    "success": False,
                    "message": "Payment currency is invalid.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment.get("status") != "captured":
            return Response(
                {
                    "success": False,
                    "message": (
                        "Payment has not been captured yet. "
                        "Please check the payment status."
                    ),
                    "gateway_payment_status": payment.get("status"),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            order = Order.objects.select_for_update().get(
                pk=order.pk,
                user=request.user,
            )

            if order.payment_status != "PAID":
                order.payment_status = "PAID"
                order.order_status = "CONFIRMED"
                order.razorpay_payment_id = razorpay_payment_id
                order.razorpay_signature = razorpay_signature

                order.save(
                    update_fields=[
                        "payment_status",
                        "order_status",
                        "razorpay_payment_id",
                        "razorpay_signature",
                    ]
                )

        return Response(
            {
                "success": True,
                "message": "Payment verified successfully.",
                "order_number": str(order.order_number),
                "payment_status": order.payment_status,
                "order_status": order.order_status,
                "total_amount": str(order.total_amount),
            },
            status=status.HTTP_200_OK,
        )

    except razorpay.errors.SignatureVerificationError:
        return Response(
            {
                "success": False,
                "message": "Razorpay payment signature is invalid.",
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception:
        logger.exception(
            "Razorpay payment verification failed for %s",
            order.order_number,
        )

        return Response(
            {
                "success": False,
                "message": (
                    "Unable to verify the payment right now. "
                    "Please check the order status before retrying."
                ),
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )


# ---------------------------------------------------------
# GET SINGLE ORDER STATUS / TRACKING
# GET /api/payments/order-status/<order_number>/
# ---------------------------------------------------------

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def order_status(request, order_number):
    order = get_object_or_404(
        Order.objects.prefetch_related("items__product"),
        order_number=order_number,
        user=request.user,
    )

    items = []

    for item in order.items.all():
        items.append(
            {
                "product_id": item.product_id,
                "product_name": item.product_name,
                "image_url": get_product_image_url(
                    request,
                    item.product,
                ),
                "quantity": item.quantity,
                "unit_price": str(item.unit_price),
                "line_total": str(item.line_total),
            }
        )

    tracking = get_tracking_details(order)

    return Response(
        {
            "success": True,
            "order": {
                "order_number": str(order.order_number),
                "created_at": order.created_at.isoformat(),
                "full_name": order.full_name,
                "phone": order.phone,
                "address": order.address,
                "city": order.city,
                "state": order.state,
                "postal_code": order.postal_code,
                "payment_method": order.payment_method,
                "payment_status": order.payment_status,
                "order_status": order.order_status,
                "order_status_label": (
                    order.get_order_status_display()
                ),
                "subtotal": str(order.subtotal),
                "delivery_fee": str(order.delivery_fee),
                "total_amount": str(order.total_amount),
                "items": items,
                **tracking,
            },
        },
        status=status.HTTP_200_OK,
    )


# ---------------------------------------------------------
# GET MY ORDERS
# GET /api/payments/my-orders/
# ---------------------------------------------------------

@api_view(["GET"])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def my_orders(request):
    orders = (
        Order.objects
        .filter(user=request.user)
        .prefetch_related("items__product")
        .order_by("-created_at")
    )

    results = []

    for order in orders:
        items = []

        for item in order.items.all():
            items.append(
                {
                    "product_id": item.product_id,
                    "product_name": item.product_name,
                    "image_url": get_product_image_url(
                        request,
                        item.product,
                    ),
                    "quantity": item.quantity,
                    "unit_price": str(item.unit_price),
                    "line_total": str(item.line_total),
                }
            )

        results.append(
            {
                "order_number": str(order.order_number),
                "created_at": order.created_at.isoformat(),
                "payment_method": order.payment_method,
                "payment_status": order.payment_status,
                "order_status": order.order_status,
                "order_status_label": (
                    order.get_order_status_display()
                ),
                "subtotal": str(order.subtotal),
                "delivery_fee": str(order.delivery_fee),
                "total_amount": str(order.total_amount),
                "items": items,
            }
        )

    return Response(
        {
            "success": True,
            "total_orders": len(results),
            "orders": results,
        },
        status=status.HTTP_200_OK,
    )
