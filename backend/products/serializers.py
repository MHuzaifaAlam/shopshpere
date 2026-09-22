from rest_framework import serializers
from .models import Product, ProductImage,Categeory


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            "id",
            "product",
            "image",
            "alt_text",
            "is_primary",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = "__all__"

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Categeory
        fields = "__all__"