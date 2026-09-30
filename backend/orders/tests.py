from django.contrib.auth.models import Permission, User
from django.test import TestCase
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken

from products.models import Categeory, Product
from .models import Order, OrderItem


class OrderRolePermissionTests(TestCase):
	def setUp(self):
		self.customer = User.objects.create_user('customer', password='StrongPass123')
		self.other_customer = User.objects.create_user('other', password='StrongPass123')
		self.staff_user = User.objects.create_user('staff', password='StrongPass123', is_staff=True)
		category = Categeory.objects.create(name='Electronics', slug='electronics')
		product = Product.objects.create(
			category=category,
			name='Headphones',
			slug='headphones',
			description='Headphones',
			price='100.00',
			stock=5,
		)
		self.order = Order.objects.create(customer=self.customer)
		OrderItem.objects.create(order=self.order, product=product, quantity=1, price='100.00')

	def authorize(self, user):
		token = str(RefreshToken.for_user(user).access_token)
		self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'

	def test_customer_only_sees_own_orders(self):
		self.authorize(self.customer)

		response = self.client.get(reverse('order-list-create'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual([item['id'] for item in response.data], [self.order.id])

	def test_staff_needs_view_permission_to_list_orders(self):
		self.authorize(self.staff_user)

		response = self.client.get(reverse('order-list-create'))

		self.assertEqual(response.status_code, 403)

	def test_staff_can_only_update_orders_with_view_and_change_permissions(self):
		self.staff_user.user_permissions.add(
			Permission.objects.get(codename='view_order'),
			Permission.objects.get(codename='change_order'),
		)
		self.authorize(self.staff_user)

		response = self.client.patch(
			reverse('order-status-update', args=[self.order.id]),
			{'status': 'processing'},
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 200, response.data)
		self.order.refresh_from_db()
		self.assertEqual(self.order.status, Order.Status.PROCESSING)

	def test_order_status_cannot_skip_allowed_transition(self):
		self.staff_user.user_permissions.add(
			Permission.objects.get(codename='view_order'),
			Permission.objects.get(codename='change_order'),
		)
		self.authorize(self.staff_user)

		response = self.client.patch(
			reverse('order-status-update', args=[self.order.id]),
			{'status': 'shipped'},
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 400)
		self.order.refresh_from_db()
		self.assertEqual(self.order.status, Order.Status.PENDING)

	def test_product_used_by_order_cannot_be_deleted(self):
		admin = User.objects.create_superuser('admin', 'admin@example.com', 'StrongPass123')
		self.authorize(admin)
		product = self.order.items.first().product

		response = self.client.delete(reverse('product-detail', args=[product.id]))

		self.assertEqual(response.status_code, 409)
		self.assertTrue(Product.objects.filter(pk=product.id).exists())
