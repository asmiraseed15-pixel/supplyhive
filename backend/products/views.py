

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import Product
from .serializers import ProductSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def product_list(request):
    """
    Return all active products.
    Public endpoint: login is not required.
    """
    products = Product.objects.filter(
        is_active=True
    ).order_by("-created_at")

    serializer = ProductSerializer(
        products,
        many=True,
        context={"request": request},
    )

    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([AllowAny])
def product_detail(request, pk):
    """
    Return one active product by its database ID.
    Public endpoint: login is not required.
    """
    try:
        product = Product.objects.get(
            pk=pk,
            is_active=True,
        )
    except Product.DoesNotExist:
        return Response(
            {"error": "Product not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = ProductSerializer(
        product,
        context={"request": request},
    )

    return Response(serializer.data, status=status.HTTP_200_OK)
