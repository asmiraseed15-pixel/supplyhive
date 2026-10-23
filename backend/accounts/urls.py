


from django.urls import path
from . import views

urlpatterns = [
    path("send-otp/", views.send_otp, name="send-otp"),
    path("verify-otp/", views.verify_otp, name="verify-otp"),
    path("register/", views.register, name="register"),
    path("login/", views.login, name="login"),
    path("profile/", views.profile, name="profile"),
]
