from rest_framework import serializers
from .models import Order, OrderItem

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

