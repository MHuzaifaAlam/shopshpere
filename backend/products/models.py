from django.db import models

class Catageory(models.Model):

    name= models.CharField(max_length=100,unique=True)
    slug=models.SlugField(unique=True)
    description=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now=True)

    class Meta:
        ordering=["name"]

    def __str__(self):
        return self.name

class Product(models.Model):
    catageory=models.ForeignKey(
        Catageory,
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
        ordering=["created_at"]
    def __str__(self):
        return self.created_at
