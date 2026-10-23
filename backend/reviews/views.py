
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import ProductReview


@csrf_exempt
@require_http_methods(["GET", "POST"])
def product_reviews(request):
    if request.method == "GET":
        product_id = request.GET.get("product_id", "").strip()

        if not product_id:
            return JsonResponse(
                {"error": "product_id is required"},
                status=400,
            )

        reviews = ProductReview.objects.filter(product_id=product_id)

        data = [
            {
                "id": review.id,
                "product_id": review.product_id,
                "name": review.reviewer_name,
                "rating": review.rating,
                "title": review.title,
                "comment": review.comment,
                "date": review.created_at.strftime("%d %b %Y"),
            }
            for review in reviews
        ]

        average = (
            sum(item["rating"] for item in data) / len(data)
            if data
            else 0
        )

        return JsonResponse({
            "reviews": data,
            "total_reviews": len(data),
            "average_rating": round(average, 1),
        })

    try:
        body = json.loads(request.body or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"error": "Invalid JSON"},
            status=400,
        )

    product_id = str(body.get("product_id", "")).strip()
    name = str(body.get("name", "")).strip()
    title = str(body.get("title", "")).strip()
    comment = str(body.get("comment", "")).strip()
    rating = body.get("rating")

    if not all([product_id, name, title, comment]) or rating is None:
        return JsonResponse(
            {"error": "Product, name, rating, title and review are required"},
            status=400,
        )

    try:
        rating = int(rating)
    except (TypeError, ValueError):
        return JsonResponse({"error": "Rating must be 1 to 5"}, status=400)

    if not 1 <= rating <= 5:
        return JsonResponse({"error": "Rating must be 1 to 5"}, status=400)

    review = ProductReview.objects.create(
        product_id=product_id,
        reviewer_name=name,
        rating=rating,
        title=title,
        comment=comment,
    )

    return JsonResponse(
        {
            "message": "Review submitted successfully",
            "review": {
                "id": review.id,
                "product_id": review.product_id,
                "name": review.reviewer_name,
                "rating": review.rating,
                "title": review.title,
                "comment": review.comment,
                "date": review.created_at.strftime("%d %b %Y"),
            },
        },
        status=201,
    )
