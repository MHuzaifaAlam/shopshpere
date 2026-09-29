from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Product, ProductImage
from .serializers import (
    ProductSerializer, 
    ProductImageSerializer,
    CategorySerializer
    )

from .permissions import IsStaffUserOrReadOnly


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes=[IsStaffUserOrReadOnly]


class ProductDetailViewS(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes=[IsStaffUserOrReadOnly]


class ProductImageCreateView(generics.CreateAPIView):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    parser_classes = [MultiPartParser, FormParser]

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = CategorySerializer
    
class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = CategorySerializer