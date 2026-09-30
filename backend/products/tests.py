from io import BytesIO

from django.contrib.auth.models import User
from django.contrib.auth.models import Permission
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from PIL import Image
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch

from .models import Categeory, Product, ProductImage


class ProductSeedAndCreateTests(TestCase):
	def setUp(self):
		self.staff_user = User.objects.create_user(
			username='staffuser',
			email='staff@example.com',
			password='StrongPass123',
			is_staff=True,
		)
		self.staff_user.user_permissions.add(
			Permission.objects.get(codename='add_product'),
			Permission.objects.get(codename='add_productimage'),
		)
		self.token = str(RefreshToken.for_user(self.staff_user).access_token)

	@patch('products.views.urlopen', side_effect=OSError('upstream unavailable in test'))
	def test_seed_demo_products_creates_catalog(self, mocked_urlopen):
		admin_user = User.objects.create_superuser('adminuser', 'admin@example.com', 'StrongPass123')
		admin_token = str(RefreshToken.for_user(admin_user).access_token)
		self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {admin_token}'

		response = self.client.get(reverse('seed-demo-products'))

		self.assertEqual(response.status_code, 200)
		self.assertGreater(Product.objects.count(), 0)
		self.assertGreater(Categeory.objects.count(), 0)

	def test_staff_user_can_create_product(self):
		category = Categeory.objects.create(
			name='Electronics',
			slug='electronics',
			description='Tech essentials',
		)
		self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'

		response = self.client.post(
			reverse('product-list-create'),
			{
				'name': 'Wireless Headphones',
				'slug': 'wireless-headphones',
				'description': 'Noise cancelling wireless headphones',
				'price': '199.99',
				'stock': 10,
				'category': category.id,
				'is_active': True,
			},
			format='json',
		)

		self.assertEqual(response.status_code, 201, response.data)
		self.assertTrue(Product.objects.filter(slug='wireless-headphones').exists())

	def test_staff_without_delete_permission_cannot_delete_product(self):
		category = Categeory.objects.create(name='Electronics', slug='electronics')
		product = Product.objects.create(
			category=category,
			name='Wireless Headphones',
			slug='wireless-headphones',
			description='Headphones',
			price='199.99',
			stock=10,
		)
		self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'

		response = self.client.delete(reverse('product-detail', args=[product.id]))

		self.assertEqual(response.status_code, 403)
		self.assertTrue(Product.objects.filter(pk=product.id).exists())

	def test_staff_needs_category_add_permission(self):
		self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'
		payload = {'name': 'Accessories', 'slug': 'accessories', 'description': 'Accessories'}

		self.assertEqual(self.client.post(reverse('category-list-create'), payload, format='json').status_code, 403)
		self.staff_user.user_permissions.add(Permission.objects.get(codename='add_categeory'))
		response = self.client.post(reverse('category-list-create'), payload, format='json')

		self.assertEqual(response.status_code, 201, response.data)

	def test_staff_user_can_upload_product_image(self):
		category = Categeory.objects.create(
			name='Electronics',
			slug='electronics',
			description='Tech essentials',
		)
		product = Product.objects.create(
			category=category,
			name='Wireless Headphones',
			slug='wireless-headphones',
			description='Noise cancelling wireless headphones',
			price='199.99',
			stock=10,
		)
		self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'
		image_data = BytesIO()
		Image.new('RGB', (1, 1), color='white').save(image_data, format='PNG')
		image = SimpleUploadedFile(
			'headphones.png',
			image_data.getvalue(),
			content_type='image/png',
		)

		response = self.client.post(
			reverse('product-image-create'),
			{'product': product.id, 'image': image, 'alt_text': product.name, 'is_primary': True},
			format='multipart',
		)

		self.assertEqual(response.status_code, 201, response.data)
		self.assertTrue(ProductImage.objects.filter(product=product, is_primary=True).exists())

	def test_primary_image_update_and_delete_preserve_one_primary(self):
		category = Categeory.objects.create(name='Electronics', slug='electronics')
		product = Product.objects.create(
			category=category,
			name='Wireless Headphones',
			slug='wireless-headphones',
			description='Headphones',
			price='199.99',
			stock=10,
		)
		first_image = ProductImage.objects.create(product=product, image='products/first.webp', is_primary=True)
		second_image = ProductImage.objects.create(product=product, image='products/second.webp')
		admin_user = User.objects.create_superuser('imageadmin', 'images@example.com', 'StrongPass123')
		admin_token = str(RefreshToken.for_user(admin_user).access_token)
		self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {admin_token}'

		response = self.client.patch(
			reverse('product-image-detail', args=[second_image.id]),
			{'is_primary': True},
			content_type='application/json',
		)
		self.assertEqual(response.status_code, 200, response.data)
		first_image.refresh_from_db()
		second_image.refresh_from_db()
		self.assertFalse(first_image.is_primary)
		self.assertTrue(second_image.is_primary)

		self.client.delete(reverse('product-image-detail', args=[second_image.id]))
		first_image.refresh_from_db()
		self.assertTrue(first_image.is_primary)
