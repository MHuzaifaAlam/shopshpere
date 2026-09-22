from django.urls import path
from .views import ProductListCreateView, ProductDetailViewS,ProductImageCreateView

urlpatterns = [ path("",ProductListCreateView.as_view(), name="product-list-create"),
                           path("images/", ProductImageCreateView.as_view(), name="product-image-create") ,
                path("<int:pk>/", ProductDetailViewS.as_view(), name="product-detail"),
     
               ]

