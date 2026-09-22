from django.urls import path
from .views import ProductListCreateView, ProductDetailViewS

urlpatterns = [path("",ProductListCreateView.as_view(), name="product-list-create"),
               path("<int:pk>/", ProductDetailViewS.as_view(), name="product-detail"),
               ]

