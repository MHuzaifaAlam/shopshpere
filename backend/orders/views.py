from rest_framework import generics,serializers
from .models import Order,OrderItem
from .serializers import OrderSerializer, OrderItemSerializer
from rest_framework.permissions import IsAuthenticated


class OrderListCreateView(generics.ListCreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes=[IsAuthenticated]
    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)

    def perform_create(self, serializer):
        return serializer.save(customer=self.request.user)
    
class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OrderSerializer
    permission_classes=[IsAuthenticated]
    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)


class OrderItemCreateView(generics.CreateAPIView):
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        order = serializer.validated_data.get("order")
        product = serializer.validated_data.get("product")
        quantity=serializer.validated_data.get("quantity")
        if order.customer != self.request.user:
            raise serializers.ValidationError(
                "You can only add items to your own orders."
            )
        if quantity>product.stock:
            raise serializers.ValidationError(
                f"Only {product.stock} units of {product.name} are available."
            )
        serializer.save(price=product.price)

