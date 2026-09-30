from django.contrib.auth.models import Permission, User
from django.test import TestCase
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken


class ManagementApiTests(TestCase):
	def setUp(self):
		self.admin = User.objects.create_superuser('rootadmin', 'root@example.com', 'StrongPass123')
		self.staff = User.objects.create_user('staffuser', password='StrongPass123', is_staff=True)
		self.customer = User.objects.create_user('customeruser', password='StrongPass123')

	def authorize(self, user):
		token = str(RefreshToken.for_user(user).access_token)
		self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
		return token

	def test_admin_dashboard_is_superuser_only(self):
		self.authorize(self.staff)
		self.assertEqual(self.client.get(reverse('admin-dashboard-api')).status_code, 403)

		self.authorize(self.admin)
		response = self.client.get(reverse('admin-dashboard-api'))

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['staff'], 1)
		self.assertIn('delivered_revenue', response.data)

	def test_superuser_can_create_staff_with_model_permissions(self):
		self.authorize(self.admin)
		add_product = Permission.objects.get(codename='add_product')

		response = self.client.post(
			reverse('admin-staff-list'),
			{
				'username': 'catalogmanager',
				'email': 'catalog@example.com',
				'password': 'CatalogPass123',
				'is_active': True,
				'permissions': [add_product.id],
			},
			content_type='application/json',
		)

		self.assertEqual(response.status_code, 201, response.data)
		managed_user = User.objects.get(username='catalogmanager')
		self.assertTrue(managed_user.is_staff)
		self.assertTrue(managed_user.has_perm('products.add_product'))
		self.assertNotIn('password', response.data)

	def test_disabling_staff_blocks_staff_dashboard(self):
		token = self.authorize(self.staff)
		self.authorize(self.admin)
		response = self.client.patch(
			reverse('admin-staff-detail', args=[self.staff.id]),
			{'is_active': False},
			content_type='application/json',
		)
		self.assertEqual(response.status_code, 200, response.data)

		self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'
		self.assertEqual(self.client.get(reverse('staff-dashboard-api')).status_code, 401)

	def test_customer_cannot_access_management_endpoints(self):
		self.authorize(self.customer)

		self.assertEqual(self.client.get(reverse('admin-staff-list')).status_code, 403)
		self.assertEqual(self.client.get(reverse('admin-customer-list')).status_code, 403)

	def test_staff_customer_access_requires_explicit_permissions(self):
		self.authorize(self.staff)
		self.assertEqual(self.client.get(reverse('staff-customer-list')).status_code, 403)

		self.staff.user_permissions.add(Permission.objects.get(codename='view_customers'))
		self.assertEqual(self.client.get(reverse('staff-customer-list')).status_code, 200)
		self.assertEqual(
			self.client.patch(
				reverse('staff-customer-detail', args=[self.customer.id]),
				{'is_active': False},
				content_type='application/json',
			).status_code,
			403,
		)
		self.staff.user_permissions.add(Permission.objects.get(codename='change_customers'))
		response = self.client.patch(
			reverse('staff-customer-detail', args=[self.customer.id]),
			{'is_active': False},
			content_type='application/json',
		)
		self.assertEqual(response.status_code, 200, response.data)
		self.customer.refresh_from_db()
		self.assertFalse(self.customer.is_active)


from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class CurrentUserRoleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username='customer',
            email='customer@example.com',
            password='StrongPass123!'
        )
        self.staff = get_user_model().objects.create_user(
            username='staff',
            email='staff@example.com',
            password='StrongPass123!',
            is_staff=True,
        )
        self.admin = get_user_model().objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='StrongPass123!'
        )

    def test_customer_user_has_role_flags(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/me/')

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['is_staff'])
        self.assertFalse(response.data['is_superuser'])

    def test_staff_and_admin_users_expose_roles(self):
        for user in (self.staff, self.admin):
            self.client.force_authenticate(user=user)
            response = self.client.get('/api/me/')

            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.data['is_staff'])
            self.assertEqual(response.data['is_superuser'], user.is_superuser)
