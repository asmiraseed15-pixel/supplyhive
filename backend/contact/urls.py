
from django.urls import path
from .views import submit_contact

urlpatterns = [
    path("", submit_contact, name="submit-contact"),
]
