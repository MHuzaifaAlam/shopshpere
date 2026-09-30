from accounts.permissions import HasModelPermission


class IsStaffUserOrReadOnly(HasModelPermission):
    public_read = True