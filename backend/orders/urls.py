from django.urls import path
from .views import (
    OrderListCreateView,
    OrderDetailView,
    OrderItemCreateView,
    CartView,
    CartItemCreateView,
    CartItemDetailView,
    CheckoutView,
    OrderCancelView
)
urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'), 
    path('items/',OrderItemCreateView.as_view(),name="order-items-create"),

    path('cart/',CartView.as_view(),name='order-item-create'),
    path('cart/items/<int:pk>/',CartItemDetailView.as_view(),name="cart-item-detail"),

    path('<int:pk>/cancel/',OrderCancelView.as_view(),name="order-detail"),
    
    path('checkout/',CheckoutView.as_view(),name="checkout"),
    path('<int:pk>/',OrderDetailView.as_view(), name='order-detail'),
]