from django.urls import path

from .management_views import (
    AdminDashboardView,
    CustomerDetailView,
    CustomerListView,
    ManagementGroupDetailView,
    ManagementGroupListCreateView,
    ManagementPermissionListView,
    StaffDashboardView,
    StaffCustomerDetailView,
    StaffCustomerListView,
    StaffDetailView,
    StaffListCreateView,
)

urlpatterns = [
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard-api'),
    path('admin/staff/', StaffListCreateView.as_view(), name='admin-staff-list'),
    path('admin/staff/<int:pk>/', StaffDetailView.as_view(), name='admin-staff-detail'),
    path('admin/staff/permissions/', ManagementPermissionListView.as_view(), name='admin-staff-permissions'),
    path('admin/groups/', ManagementGroupListCreateView.as_view(), name='admin-group-list'),
    path('admin/groups/<int:pk>/', ManagementGroupDetailView.as_view(), name='admin-group-detail'),
    path('admin/customers/', CustomerListView.as_view(), name='admin-customer-list'),
    path('admin/customers/<int:pk>/', CustomerDetailView.as_view(), name='admin-customer-detail'),
    path('staff/dashboard/', StaffDashboardView.as_view(), name='staff-dashboard-api'),
    path('staff/customers/', StaffCustomerListView.as_view(), name='staff-customer-list'),
    path('staff/customers/<int:pk>/', StaffCustomerDetailView.as_view(), name='staff-customer-detail'),
]