from rest_framework import generics, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.db import transaction

from .models import Order, OrderItem, Cart, CartItem
from .serializers import (
    OrderSerializer,
    CartSerializer,
    CartItemSerializer,
    OrderStatusSerializer
)

from .permissions import IsStaffUser

class OrderListCreateView(generics.ListAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user
        )



class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user
        )



class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        cart, created = Cart.objects.get_or_create(
            user=self.request.user
        )

        return cart


class CartItemCreateView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        product = serializer.validated_data.get("product")
        quantity = serializer.validated_data.get("quantity")

        # Product must be available
        if not product.is_active:
            raise serializers.ValidationError(
                f"The product {product.name} is not available."
            )

        # Get/create current user's cart
        cart, created = Cart.objects.get_or_create(
            user=self.request.user
        )

        # Check if product already exists in cart
        cart_item = CartItem.objects.filter(
            cart=cart,
            product=product
        ).first()

        # Calculate final quantity
        new_quantity = quantity

        if cart_item:
            new_quantity = cart_item.quantity + quantity

        # Check stock
        if new_quantity > product.stock:
            raise serializers.ValidationError(
                f"Only {product.stock} units of "
                f"{product.name} are available."
            )

        # Update existing item
        if cart_item:
            cart_item.quantity = new_quantity
            cart_item.save(
                update_fields=["quantity"]
            )

        # Create new item
        else:
            serializer.save(
                cart=cart
            )


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(
            cart__user=self.request.user
        )

    def perform_update(self, serializer):
        cart_item = self.get_object()

        new_quantity = serializer.validated_data.get(
            "quantity",
            cart_item.quantity
        )

        if new_quantity > cart_item.product.stock:
            raise serializers.ValidationError(
                f"Only {cart_item.product.stock} units of "
                f"{cart_item.product.name} are available."
            )

        serializer.save()


class CheckoutView(generics.CreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):

        with transaction.atomic():

            # Get and lock the user's cart
            cart = (
                Cart.objects
                .select_for_update()
                .filter(user=request.user)
                .first()
            )

            if not cart:
                raise serializers.ValidationError(
                    "Your cart does not exist."
                )

            # Get cart items
            cart_items = list(
                cart.items.select_related("product")
            )

            if not cart_items:
                raise serializers.ValidationError(
                    "Your cart is empty."
                )

            # Lock all products involved in checkout
            product_ids = [
                item.product_id
                for item in cart_items
            ]

            products = {
                product.id: product
                for product in (
                    cart_items[0]
                    .product.__class__.objects
                    .select_for_update()
                    .filter(id__in=product_ids)
                )
            }

            # Validate stock
            for cart_item in cart_items:

                product = products[
                    cart_item.product_id
                ]

                if not product.is_active:
                    raise serializers.ValidationError(
                        f"{product.name} is no longer available."
                    )

                if cart_item.quantity > product.stock:
                    raise serializers.ValidationError(
                        f"Only {product.stock} units of "
                        f"{product.name} are available."
                    )

            # Create order
            order = Order.objects.create(
                customer=request.user
            )

            # Create order items and reduce stock
            for cart_item in cart_items:

                product = products[
                    cart_item.product_id
                ]

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=cart_item.quantity,
                    price=product.price,
                )

                product.stock -= cart_item.quantity

                product.save(
                    update_fields=["stock"]
                )

            # Empty the cart
            cart.items.all().delete()

        # Serialize the newly created order
        serializer = self.get_serializer(order)

        return Response(
            serializer.data,
            status=201
        )


class OrderCancelView(generics.GenericAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(
            customer=self.request.user
        )

    def post(self, request, *args, **kwargs):

        with transaction.atomic():

            order = (
                Order.objects
                .select_for_update()
                .prefetch_related("items__product")
                .filter(
                    id=kwargs["pk"],
                    customer=request.user
                )
                .first()
            )

            if not order:
                raise serializers.ValidationError(
                    "Order not found."
                )

            if order.status != Order.Status.PENDING:
                raise serializers.ValidationError(
                    "Only pending orders can be cancelled."
                )

            # Restore stock
            for order_item in order.items.all():

                product = (
                    order_item.product.__class__.objects
                    .select_for_update()
                    .get(pk=order_item.product_id)
                )

                product.stock += order_item.quantity

                product.save(
                    update_fields=["stock"]
                )

            # Cancel order
            order.status = Order.Status.CANCELLED

            order.save(
                update_fields=["status", "updated_at"]
            )

        serializer = self.get_serializer(order)

        return Response(
            serializer.data,
            status=200
        )

class OrderStatusUpdateView(generics.GenericAPIView):
    serializer_class = OrderStatusSerializer
    permission_classes = [
        IsAuthenticated,
        IsStaffUser,
    ]

    def get_queryset(self):
        return Order.objects.all()

    def patch(self, request, *args, **kwargs):

        order = self.get_queryset().filter(
            pk=kwargs["pk"]
        ).first()

        if not order:
            raise serializers.ValidationError(
                "Order not found."
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["status"]
        current_status = order.status

        allowed_transitions = {
            Order.Status.PENDING: [
                Order.Status.PROCESSING,
                Order.Status.CANCELLED,
            ],
            Order.Status.PROCESSING: [
                Order.Status.SHIPPED,
            ],
            Order.Status.SHIPPED: [
                Order.Status.DELIVERED,
            ],
            Order.Status.DELIVERED: [],
            Order.Status.CANCELLED: [],
        }

        if new_status not in allowed_transitions[current_status]:
            raise serializers.ValidationError(
                f"Cannot change order status "
                f"from '{current_status}' "
                f"to '{new_status}'."
            )

        order.status = new_status
        order.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        response_serializer = OrderSerializer(order)

        return Response(
            response_serializer.data,
            status=200
        )