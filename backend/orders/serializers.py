from rest_framework import serializers
from .models import Order, OrderItem,Cart,CartItem
from decimal import Decimal
class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id','order', 'product', 'product_name', 'quantity', 'price']
        read_only_fields = ['id',"price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer_username = serializers.CharField(source='customer.username', read_only=True)
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    def total_amount(self, obj):
        return obj.total_amount   

    class Meta:
        model = Order
        fields = ['id', 'customer', 'customer_username', 'customer_email', 'status', 'items','total_amount', 'created_at', 'updated_at']
        read_only_fields = ['id','customer', 'created_at','updated_at', 'total_amount']

class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True
    )

    product_price = serializers.DecimalField(
        source="product.price",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity",
            "subtotal",
        ]
        read_only_fields = [
            "id",
            "product_name",
            "product_price",
            "subtotal",
        ]

    def get_subtotal(self, obj):
        return obj.product.price * obj.quantity
    
class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(
        many=True,
        read_only=True
    )

    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "user",
            "items",
            "total_amount",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "items",
            "total_amount",
            "created_at",
            "updated_at",
        ]

    def get_total_amount(self, obj):
        return sum(
            (
                item.product.price * item.quantity
                for item in obj.items.all()
            ),
            Decimal("0.00")
        )
    
class OrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices = Order.Status.choices
    )
