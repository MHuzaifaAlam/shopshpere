from django.db import models
from django.contrib.auth.models import User


class ManagedCustomer(User):
	class Meta:
		proxy = True
		default_permissions = ()
		permissions = [
			('view_customers', 'Can view customers'),
			('change_customers', 'Can change customer accounts'),
		]
