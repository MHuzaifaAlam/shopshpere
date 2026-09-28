from django.urls import path
from .views import (
    OrderListCreateView,
    OrderDetailView,
    OrderItemCreateView,
    CartView,
)
urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'), 
    path('items/',OrderItemCreateView.as_view(),name="order-items-create"),

    path('cart/',CartView.as_view(),name='order-item-create'),
    
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
]