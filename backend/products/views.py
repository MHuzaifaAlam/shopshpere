import json
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import urlopen, Request
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils.text import slugify

from .models import Product, ProductImage, Categeory
from .serializers import (
    ProductSerializer,
    ProductImageSerializer,
    CategorySerializer,
    )

from .permissions import IsStaffUserOrReadOnly


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes=[IsStaffUserOrReadOnly]

    def get_queryset(self):
        queryset = Product.objects.all().select_related('category').prefetch_related('images')
        search = self.request.query_params.get('search', '').strip()
        category = self.request.query_params.get('category')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        active = self.request.query_params.get('active')
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        if category:
            queryset = queryset.filter(category_id=category)
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        if active in ('true', 'false'):
            queryset = queryset.filter(is_active=active == 'true')
        return queryset


class SeedDemoProductsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    allowed_image_hosts = {'cdn.dummyjson.com', 'images.unsplash.com'}

    def _fallback_products(self):
        return [
            {
                'title': 'Aero Pro Headphones',
                'category': 'Electronics',
                'description': 'High-fidelity wireless headphones built for productivity and travel.',
                'price': 249.99,
                'stock': 18,
                'images': ['https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=1200&q=80'],
            },
            {
                'title': 'Summit Backpack',
                'category': 'Accessories',
                'description': 'Weather-ready everyday carry backpack with padded laptop storage.',
                'price': 129.0,
                'stock': 16,
                'images': ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80'],
            },
            {
                'title': 'Harbor Ceramic Mug',
                'category': 'Home',
                'description': 'Premium ceramic mug built for slow mornings and daily rituals.',
                'price': 24.5,
                'stock': 32,
                'images': ['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=1200&q=80'],
            },
        ]

    def _save_product_image(self, product, image_url, index, title, image_record=None):
        parsed_url = urlsplit(image_url)
        if parsed_url.scheme != 'https' or parsed_url.hostname not in self.allowed_image_hosts:
            return False

        try:
            image_request = Request(image_url, headers={'User-Agent': 'ShopSphere/1.0'})
            with urlopen(image_request, timeout=6) as response:
                if not response.headers.get_content_type().startswith('image/'):
                    return False
                image_content = response.read(5 * 1024 * 1024 + 1)
                if len(image_content) > 5 * 1024 * 1024:
                    return False
                content_type = response.headers.get_content_type()
        except Exception:
            return False

        extensions = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/gif': '.gif',
        }
        extension = Path(parsed_url.path).suffix.lower()
        if extension not in extensions.values():
            extension = extensions.get(content_type, '.jpg')
        record = image_record or ProductImage(product=product)
        record.alt_text = title
        record.is_primary = index == 0 and not product.images.filter(is_primary=True).exclude(pk=record.pk).exists()
        record.image.save(f'{product.slug}-{index}{extension}', ContentFile(image_content), save=False)
        record.save()
        return True

    def _seed_products(self):
        try:
            request = Request('https://dummyjson.com/products?limit=12', headers={'User-Agent': 'ShopSphere/1.0'})
            with urlopen(request, timeout=12) as response:
                payload = json.loads(response.read().decode('utf-8'))
            product_items = payload.get('products', []) or self._fallback_products()
        except Exception:
            product_items = self._fallback_products()

        created = 0
        updated = 0

        for raw in product_items:
            category_name = (raw.get('category') or 'General').strip() or 'General'
            category_slug = slugify(category_name)
            category, _ = Categeory.objects.get_or_create(
                slug=category_slug,
                defaults={'name': category_name.title(), 'description': f'Products in {category_name}.'},
            )

            title = raw.get('title') or raw.get('name') or 'Sample Product'
            slug = slugify(title)
            if not slug:
                slug = f'product-{category_slug}-{len(Product.objects.filter(category=category)) + 1}'

            product_defaults = {
                'category': category,
                'name': title,
                'description': raw.get('description') or 'Freshly imported product data.',
                'price': raw.get('price', 39.99),
                'stock': raw.get('stock', 10),
                'is_active': True,
            }

            product, created_flag = Product.objects.get_or_create(slug=slug, defaults=product_defaults)

            if created_flag:
                created += 1
            else:
                for field, value in product_defaults.items():
                    setattr(product, field, value)
                product.save(update_fields=list(product_defaults.keys()) + ['updated_at'])
                updated += 1

            source_images = raw.get('images', [])[:4]
            for index, image_url in enumerate(source_images):
                if not isinstance(image_url, str) or not image_url:
                    continue
                existing_image = ProductImage.objects.filter(product=product, image=image_url).first()
                if existing_image or product.images.count() < len(source_images):
                    self._save_product_image(product, image_url, index, title, existing_image)

        return {
            'message': 'Demo catalog synced successfully.',
            'created': created,
            'updated': updated,
            'categories': Categeory.objects.count(),
            'products': Product.objects.count(),
        }

    def get(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({'detail': 'Staff access required.'}, status=403)
        return Response(self._seed_products())

    def post(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response({'detail': 'Staff access required.'}, status=403)
        return Response(self._seed_products())


class ProductDetailViewS(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes=[IsStaffUserOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        if product.order_items.exists():
            return Response(
                {'detail': 'Products referenced by orders cannot be deleted. Deactivate the product instead.'},
                status=409,
            )
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({'detail': 'This product is protected by existing records.'}, status=409)


class ProductImageCreateView(generics.ListCreateAPIView):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsStaffUserOrReadOnly]


class ProductImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsStaffUserOrReadOnly]

    def perform_update(self, serializer):
        with transaction.atomic():
            if serializer.validated_data.get('is_primary'):
                ProductImage.objects.filter(
                    product=serializer.instance.product,
                    is_primary=True,
                ).exclude(pk=serializer.instance.pk).update(is_primary=False)
            serializer.save()

    def perform_destroy(self, instance):
        was_primary = instance.is_primary
        product = instance.product
        instance.delete()
        if was_primary:
            next_image = product.images.order_by('created_at', 'id').first()
            if next_image:
                next_image.is_primary = True
                next_image.save(update_fields=['is_primary'])

class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Categeory.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsStaffUserOrReadOnly]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Categeory.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsStaffUserOrReadOnly]

    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        if Product.objects.filter(category=category, order_items__isnull=False).exists():
            return Response(
                {'detail': 'Categories containing products referenced by orders cannot be deleted.'},
                status=409,
            )
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response({'detail': 'This category is protected by existing records.'}, status=409)

    def get_queryset(self):
        queryset = Categeory.objects.all()
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        return queryset