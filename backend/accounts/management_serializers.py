from django.contrib.auth.models import Group, Permission, User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from orders.serializers import OrderSerializer


MANAGED_PERMISSION_FILTER = {
    'content_type__app_label__in': ['products', 'orders', 'accounts'],
    'content_type__model__in': ['product', 'productimage', 'categeory', 'order', 'managedcustomer'],
    'codename__in': [
        'view_product', 'add_product', 'change_product', 'delete_product',
        'view_productimage', 'add_productimage', 'change_productimage', 'delete_productimage',
        'view_categeory', 'add_categeory', 'change_categeory', 'delete_categeory',
        'view_order', 'change_order', 'view_customers', 'change_customers',
    ],
}


class ManagementPermissionSerializer(serializers.ModelSerializer):
    app_label = serializers.CharField(source='content_type.app_label', read_only=True)
    model = serializers.CharField(source='content_type.model', read_only=True)

    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename', 'app_label', 'model']


class ManagementGroupSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.filter(**MANAGED_PERMISSION_FILTER),
        required=False,
    )

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions']


class StaffManagementSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False,
    )
    permissions = serializers.PrimaryKeyRelatedField(
        source='user_permissions',
        many=True,
        queryset=Permission.objects.filter(**MANAGED_PERMISSION_FILTER),
        required=False,
    )
    group_names = serializers.SlugRelatedField(
        source='groups',
        many=True,
        slug_field='name',
        read_only=True,
    )
    permission_codes = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'is_active', 'date_joined', 'password',
            'groups', 'group_names', 'permissions', 'permission_codes',
        ]
        read_only_fields = ['id', 'date_joined', 'group_names', 'permission_codes']

    def validate_password(self, value):
        try:
            validate_password(value, user=self.instance)
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages) from error
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'A password is required for new staff.'})
        if 'groups' in attrs:
            for group in attrs['groups']:
                if group.permissions.exclude(**MANAGED_PERMISSION_FILTER).exists():
                    raise serializers.ValidationError({'groups': 'A staff group contains permissions outside product and order management.'})
        return attrs

    def get_permission_codes(self, user):
        return sorted(user.get_all_permissions())

    def create(self, validated_data):
        password = validated_data.pop('password')
        groups = validated_data.pop('groups', [])
        permissions = validated_data.pop('user_permissions', [])
        user = User.objects.create_user(password=password, is_staff=True, **validated_data)
        user.groups.set(groups)
        user.user_permissions.set(permissions)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        groups = validated_data.pop('groups', None)
        permissions = validated_data.pop('user_permissions', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        if groups is not None:
            instance.groups.set(groups)
        if permissions is not None:
            instance.user_permissions.set(permissions)
        return instance


class CustomerManagementSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'date_joined', 'last_login']
        read_only_fields = ['id', 'username', 'email', 'date_joined', 'last_login']


class CustomerDetailSerializer(CustomerManagementSerializer):
    orders = serializers.SerializerMethodField()

    class Meta(CustomerManagementSerializer.Meta):
        fields = CustomerManagementSerializer.Meta.fields + ['orders']
        read_only_fields = fields

    def get_orders(self, user):
        return OrderSerializer(user.orders.all().order_by('-created_at'), many=True).data