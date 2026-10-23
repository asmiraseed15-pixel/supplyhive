
import uuid

from django.conf import settings
from django.db import models


class Order(models.Model):
    class PaymentMethod(models.TextChoices):
        COD = "COD", "Cash on Delivery"
        RAZORPAY = "RAZORPAY", "Online Payment"

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"

    class OrderStatus(models.TextChoices):
        PLACED = "PLACED", "Order Placed"
        CONFIRMED = "CONFIRMED", "Confirmed"
        PACKED = "PACKED", "Packed"
        SHIPPED = "SHIPPED", "Shipped"
        OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY", "Out for Delivery"
        DELIVERED = "DELIVERED", "Delivered"
        CANCELLED = "CANCELLED", "Cancelled"

    order_number = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False,
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="supplyhive_orders",
    )

    # Delivery details saved when the order is created.
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=10)

    # Order amount details.
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )
    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    # Payment details.
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    # Order tracking status.
    order_status = models.CharField(
        max_length=30,
        choices=OrderStatus.choices,
        default=OrderStatus.PLACED,
        db_index=True,
    )

    # Razorpay details.
    razorpay_order_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )
    razorpay_payment_id = models.CharField(
        max_length=100,
        blank=True,
    )

    # Timestamps.
    created_at = models.DateTimeField(
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return (
            f"Order {self.order_number} - "
            f"{self.payment_status} - "
            f"{self.order_status}"
        )


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.PROTECT,
    )

    # Snapshot of product details at order time.
    product_name = models.CharField(max_length=200)

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    quantity = models.PositiveIntegerField()

    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"
