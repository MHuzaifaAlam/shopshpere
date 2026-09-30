from decimal import Decimal

from django.contrib.auth.models import Group, Permission, User
from django.db.models import Count, DecimalField, ExpressionWrapper, F, Q, Sum
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from orders.models import Order
from orders.serializers import OrderSerializer
from products.models import Categeory, Product
from products.serializers import ProductSerializer

from .management_serializers import (
    CustomerDetailSerializer,
    CustomerManagementSerializer,
    MANAGED_PERMISSION_FILTER,
    ManagementGroupSerializer,
    ManagementPermissionSerializer,
    StaffManagementSerializer,
)
from .permissions import IsStaffMember, IsSuperuser


class AdminDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsSuperuser]

    def get(self, request, *args, **kwargs):
        statuses = {
            key: Order.objects.filter(status=key).count()
            for key, _ in Order.Status.choices
        }
        revenue_expression = ExpressionWrapper(
            F('items__price') * F('items__quantity'),
            output_field=DecimalField(max_digits=12, decimal_places=2),
        )
        revenue = Order.objects.filter(status=Order.Status.DELIVERED).aggregate(
            total=Sum(revenue_expression)
        )['total'] or Decimal('0.00')
        recent_orders = Order.objects.select_related('customer').prefetch_related('items').order_by('-created_at')[:8]
        recent_customers = User.objects.filter(is_staff=False, is_superuser=False).order_by('-date_joined')[:8]
        low_stock_products = Product.objects.filter(stock__lte=5).select_related('category').order_by('stock', 'name')[:8]

        return Response({
            'customers': User.objects.filter(is_staff=False, is_superuser=False).count(),
            'staff': User.objects.filter(is_staff=True, is_superuser=False).count(),
            'products': Product.objects.count(),
            'active_products': Product.objects.filter(is_active=True).count(),
            'out_of_stock_products': Product.objects.filter(stock=0).count(),
            'low_stock_products': ProductSerializer(low_stock_products, many=True).data,
            'categories': Categeory.objects.count(),
            'orders': Order.objects.count(),
            'order_statuses': statuses,
            'delivered_revenue': str(revenue),
            'recent_orders': [
                {**OrderSerializer(order).data, 'customer_username': order.customer.username}
                for order in recent_orders
            ],
            'recent_customers': CustomerManagementSerializer(recent_customers, many=True).data,
        })


class StaffListCreateView(generics.ListCreateAPIView):
    serializer_class = StaffManagementSerializer
    permission_classes = [IsAuthenticated, IsSuperuser]

    def get_queryset(self):
        queryset = User.objects.filter(is_staff=True, is_superuser=False).prefetch_related('groups', 'user_permissions')
        search = self.request.query_params.get('search', '').strip()
        status_filter = self.request.query_params.get('active')
        if search:
            queryset = queryset.filter(Q(username__icontains=search) | Q(email__icontains=search))
        if status_filter in ('true', 'false'):
            queryset = queryset.filter(is_active=status_filter == 'true')
        return queryset.order_by('username')


class StaffDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StaffManagementSerializer
    permission_classes = [IsAuthenticated, IsSuperuser]
    queryset = User.objects.filter(is_staff=True, is_superuser=False).prefetch_related('groups', 'user_permissions')

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])

    def destroy(self, request, *args, **kwargs):
        staff_user = self.get_object()
        self.perform_destroy(staff_user)
        return Response({'detail': 'Staff account disabled; history and audit data were retained.'})


class ManagementPermissionListView(generics.ListAPIView):
    serializer_class = ManagementPermissionSerializer
    permission_classes = [IsAuthenticated, IsSuperuser]
    queryset = Permission.objects.filter(
        **MANAGED_PERMISSION_FILTER,
    ).select_related('content_type').order_by('content_type__app_label', 'content_type__model', 'codename')


class ManagementGroupListCreateView(generics.ListCreateAPIView):
    serializer_class = ManagementGroupSerializer
    permission_classes = [IsAuthenticated, IsSuperuser]
    queryset = Group.objects.prefetch_related('permissions').order_by('name')


class ManagementGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ManagementGroupSerializer
    permission_classes = [IsAuthenticated, IsSuperuser]
    queryset = Group.objects.prefetch_related('permissions')


class CustomerListView(generics.ListAPIView):
    serializer_class = CustomerManagementSerializer
    permission_classes = [IsAuthenticated, IsSuperuser]

    def get_queryset(self):
        queryset = User.objects.filter(is_staff=False, is_superuser=False)
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(Q(username__icontains=search) | Q(email__icontains=search))
        return queryset.order_by('-date_joined')


class CustomerDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, IsSuperuser]
    queryset = User.objects.filter(is_staff=False, is_superuser=False)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CustomerDetailSerializer
        return CustomerManagementSerializer


class StaffDashboardView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsStaffMember]

    def get(self, request, *args, **kwargs):
        user = request.user
        permission_codes = [
            'products.view_product', 'products.add_product', 'products.change_product',
            'products.delete_product', 'products.view_categeory', 'products.add_categeory',
            'products.change_categeory', 'products.delete_categeory', 'products.add_productimage',
            'products.change_productimage', 'products.delete_productimage', 'products.view_productimage',
            'orders.view_order', 'orders.change_order',
            'accounts.view_customers', 'accounts.change_customers',
        ]
        permissions = {code: user.has_perm(code) for code in permission_codes}
        return Response({
            'username': user.username,
            'permissions': permissions,
            'sections': {
                'products': any(permissions[key] for key in permission_codes[:4]),
                'categories': any(permissions[key] for key in permission_codes[4:8]),
                'orders': permissions['orders.view_order'],
                'customers': permissions['accounts.view_customers'],
            },
            'product_count': Product.objects.count() if permissions['products.view_product'] else None,
            'order_count': Order.objects.count() if permissions['orders.view_order'] else None,
        })


class StaffCustomerAccess(IsStaffMember):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        required_permission = 'accounts.view_customers'
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            required_permission = 'accounts.change_customers'
        return request.user.has_perm(required_permission)


class StaffCustomerListView(generics.ListAPIView):
    serializer_class = CustomerManagementSerializer
    permission_classes = [IsAuthenticated, StaffCustomerAccess]

    def get_queryset(self):
        queryset = User.objects.filter(is_staff=False, is_superuser=False)
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(Q(username__icontains=search) | Q(email__icontains=search))
        return queryset.order_by('-date_joined')


class StaffCustomerDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated, StaffCustomerAccess]
    queryset = User.objects.filter(is_staff=False, is_superuser=False)

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CustomerDetailSerializer
        return CustomerManagementSerializer