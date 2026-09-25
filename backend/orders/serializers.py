from rest_framework import serializers
from .models import Order, OrderItem,Cart,CartItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id','order', 'product', 'quantity', 'price']
        read_only_fields = ['id',"price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    def total_amount(self, obj):
        return obj.total_amount   

    class Meta:
        model = Order
        fields = ['id', 'customer', 'status', 'items','total_amount', 'created_at', 'updated_at']
        read_only_fields = ['id','customer', 'created_at','updated_at', 'total_amount']

class CartItemSerializer(serializers.ModelSerializer):
    product_name=serializers.CharField(
        source="product.name",
        read_only=True
    )
    product_price=serializers.DecimalField(
        source="product.price",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    subtotal=serializers.SerializerMethodField()

    class Meta:
        model=CartItem
        feilds=[
            "id",
            "product",
            "product_name",
            "product_price",
            "quantity",
            "subtotal",
        ]
        read_only_feilds=[
            "id",
            "product_name",
            "product_price",
            "subtotal",
        ]

        def get_subtotal(self,obj):
            return obj.product.price * obj.quantity

class CartSerializer(serializers.ModelSerializer):
    items=CartItemSerializer(
        many=True,
        read_only=True
    )

    total_amount=serializers.SerializerMethodField()

    class Meta:
        model=Cart
        feilds=[
            "id",
            "product_name",
            "product_price",
            "quantity",
            "subtotal",

                            ]
        read_only_feilds=[
            "id",
            "product_name",
            "product_price",
            "subtotal",
        ]
    def get_subtotal(self,obj):
        return obj.product.price*obj.quantity