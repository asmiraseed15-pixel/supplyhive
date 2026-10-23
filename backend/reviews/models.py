
from django.db import models


class ProductReview(models.Model):
    product_id = models.CharField(max_length=100, db_index=True)
    reviewer_name = models.CharField(max_length=150)
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=200)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product_id} - {self.rating}/5 - {self.reviewer_name}"
