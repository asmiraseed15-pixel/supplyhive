

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # Contact API
    path("api/contact/", include("contact.urls")),

    # Authentication API
    path("api/auth/", include("accounts.urls")),

    # Reviews API
    path("api/reviews/", include("reviews.urls")),

    # Products API
    path("api/products/", include("products.urls")),

    # Payments and orders API
    path("api/payments/", include("payments.urls")),
]

# Serve uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )
