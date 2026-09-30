from accounts.permissions import HasModelPermission


class IsStaffUser(HasModelPermission):
    pass


class IsStaffOrOrderOwnerReadOnly(HasModelPermission):
    customer_read = True


class HasOrderChangePermission(IsStaffUser):
    def has_permission(self, request, view):
        allowed = super().has_permission(request, view)
        if not allowed or request.user.is_superuser:
            return allowed
        return request.user.has_perm('orders.view_order')