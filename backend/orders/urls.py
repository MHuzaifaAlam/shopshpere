from django.urls import path
from .views import (
    OrderListCreateView,
    OrderDetailView,
    OrderItemCreateView,
    CartView,
    CartItemCreateView,
)
urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'), 
    path('items/',OrderItemCreateView.as_view(),name="order-items-create"),

    path('cart/',CartView.as_view(),name='order-item-create'),
    path('cart/items/',CartItemCreateView.as_view(),name="cart-Item-create"),
    path('<int:pk>/',OrderDetailView.as_view(), name='order-detail'),
]