from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSuperuser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsStaffMember(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_active
            and request.user.is_staff
        )


class HasModelPermission(BasePermission):
    public_read = False
    customer_read = False

    def has_permission(self, request, view):
        user = request.user
        if self.public_read and request.method in SAFE_METHODS:
            return True
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if not user.is_staff:
            return (
                request.method in SAFE_METHODS
                and (
                    self.public_read
                    or (self.customer_read and user.is_authenticated)
                )
            )

        model = getattr(view, 'model', None)
        if model is None:
            queryset = getattr(view, 'queryset', None)
            model = getattr(queryset, 'model', None)
        if model is None:
            serializer_class = getattr(view, 'serializer_class', None)
            model = getattr(getattr(serializer_class, 'Meta', None), 'model', None)
        if model is None:
            return False

        action = {
            'GET': 'view',
            'HEAD': 'view',
            'OPTIONS': 'view',
            'POST': 'add',
            'PUT': 'change',
            'PATCH': 'change',
            'DELETE': 'delete',
        }.get(request.method)
        if not action:
            return False
        return user.has_perm(f'{model._meta.app_label}.{action}_{model._meta.model_name}')