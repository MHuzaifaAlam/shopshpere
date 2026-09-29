from django.urls import path

from .views import (
    OrderListCreateView,
    OrderDetailView,
    CartView,
    CartItemCreateView,
    CartItemDetailView,
    CheckoutView,
    OrderCancelView,
)

urlpatterns = [
    path(
        '',
        OrderListCreateView.as_view(),
        name='order-list-create'
    ),

    path(
        'cart/',
        CartView.as_view(),
        name='cart'
    ),

    path(
        'cart/items/',
        CartItemCreateView.as_view(),
        name='cart-item-create'
    ),

    path(
        'cart/items/<int:pk>/',
        CartItemDetailView.as_view(),
        name='cart-item-detail'
    ),

    path(
        'checkout/',
        CheckoutView.as_view(),
        name='checkout'
    ),

    path(
        '<int:pk>/cancel/',
        OrderCancelView.as_view(),
        name='order-cancel'
    ),

    path(
        '<int:pk>/',
        OrderDetailView.as_view(),
        name='order-detail'
    ),
]