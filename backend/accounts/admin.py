from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

admin.site.unregister(User)

@admin.register(User)
class ShopSphereUserAdmin(UserAdmin):
	list_display = ('username', 'email', 'is_active', 'is_staff', 'is_superuser', 'last_login')
	list_filter = ('is_active', 'is_staff', 'is_superuser', 'groups')
	search_fields = ('username', 'email', 'first_name', 'last_name')
	readonly_fields = ('last_login', 'date_joined')
