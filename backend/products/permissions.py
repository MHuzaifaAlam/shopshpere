from rest_framework.permissions import BasePermission

class IsStaffUserOrReadOnly(BasePermission):

    def has_permission(self, request, view):

        if request.method in ["GET","HEAD","OPTIONS"]:
            return True

        return(
            request.user and request.user.is_authenticated
            and request.user.is_staff
        )