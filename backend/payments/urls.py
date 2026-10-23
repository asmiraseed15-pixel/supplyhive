

from django.urls import path

from . import views


urlpatterns = [
    # Create a new COD or Razorpay order
    path(
        "create-order/",
        views.create_order,
        name="create_order",
    ),

    # Verify Razorpay payment
    path(
        "verify-payment/",
        views.verify_payment,
        name="verify_payment",
    ),

    # Get one order's details and tracking status
    path(
        "order-status/<uuid:order_number>/",
        views.order_status,
        name="order_status",
    ),

    # Get all orders belonging to the logged-in user
    path(
        "my-orders/",
        views.my_orders,
        name="my_orders",
    ),
]
