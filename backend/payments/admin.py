
from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product",
        "product_name",
        "unit_price",
        "quantity",
        "line_total",
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "user",
        "total_amount",
        "payment_method",
        "payment_status",
        "order_status",
        "created_at",
    )
    list_filter = (
        "payment_method",
        "payment_status",
        "order_status",
    )
    search_fields = (
        "order_number",
        "user__username",
        "user__email",
        "phone",
    )
    readonly_fields = (
        "order_number",
        "created_at",
        "updated_at",
    )
    inlines = [OrderItemInline]
