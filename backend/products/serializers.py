
from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "description",
            "price",
            "stock",
            "category",
            "image",
            "is_active",
            "created_at",
        ]

    def get_image(self, obj):
        request = self.context.get("request")

        if obj.image:
            image_url = obj.image.url
            if request:
                return request.build_absolute_uri(image_url)
            return image_url

        return None
