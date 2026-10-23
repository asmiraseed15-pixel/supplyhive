
from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "price",
        "stock",
        "category",
        "is_active",
        "created_at",
    )
    list_filter = ("category", "is_active")
    search_fields = ("name", "description", "category")
    list_editable = ("price", "stock", "is_active")
