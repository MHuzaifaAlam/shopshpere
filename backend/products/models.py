from django.db import models

class Categeory(models.Model):

    name= models.CharField(max_length=100,unique=True)
    slug=models.SlugField(unique=True)
    description=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now=True)

    class Meta:
        ordering=["name"]

    def __str__(self):
        return self.name

class Product(models.Model):
    category=models.ForeignKey(
        Categeory,
        on_delete=models.CASCADE,
        related_name="products"    
        )
    name=models.CharField(max_length=100)
    slug=models.SlugField(unique=True)
    description=models.TextField()
    price=models.DecimalField(max_digits=10,decimal_places=2)
    stock=models.PositiveIntegerField(default=0)
    is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now=True)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        ordering=["-created_at"]
    def __str__(self):
        return self.name

class ProductImage(models.Model):
    product=models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images"
    )
    image=models.ImageField(upload_to="products/")
    alt_text=models.CharField(max_length=255,blank=True)
    is_primary=models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [
        models.UniqueConstraint(
            fields=["product"],
            condition=models.Q(is_primary=True),
            name="unique_primary_image_per_product",
        )
    ]
    def __str__(self):
        return f"{self.product.name} Image"