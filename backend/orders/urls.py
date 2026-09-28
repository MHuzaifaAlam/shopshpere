from django.urls import path
from .views import (
    OrderListCreateView,
    OrderDetailView,
    OrderItemCreateView,
    CartView,
    CartItemCreateView,
    CartItemDetailView,
    CheckoutView
)
urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'), 
    path('items/',OrderItemCreateView.as_view(),name="order-items-create"),

    path('cart/',CartView.as_view(),name='order-item-create'),
    path('cart/items/',CartItemCreateView.as_view(),name="cart-Item-create"),
    path('cart/items/<int:pk>/',CartItemDetailView.as_view(),name="cart-item-detail"),

    path('checkout/',CheckoutView.as_view(),name="checkout"),
    path('<int:pk>/',OrderDetailView.as_view(), name='order-detail'),
]