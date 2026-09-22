from django.urls import path
from .views import ProductListCreateView, ProductDetailViewS,ProductImageCreateView,CategoryListCreateView,CategoryDetailView

urlpatterns = [
                
                # Products Images
                 path("images/", ProductImageCreateView.as_view(), name="product-image-create"),

                # Categories
                path("categories/", CategoryListCreateView.as_view(), name="category-list-create"),
                path("categories/<int:pk>/", CategoryDetailView.as_view(), name="category-detail"),

                #Products
                path("",ProductListCreateView.as_view(), name="product-list-create"),
                path("images/", ProductImageCreateView.as_view(), name="product-image-create") ,
                path("<int:pk>/", ProductDetailViewS.as_view(), name="product-detail"),
              
                
               ]

