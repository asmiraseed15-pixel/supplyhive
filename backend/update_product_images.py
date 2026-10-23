
from pathlib import Path
import shutil

from django.conf import settings
from products.models import Product


# Frontend assets folder
assets_dir = settings.BASE_DIR.parent / "assets"

# Backend media/products folder
media_dir = settings.MEDIA_ROOT / "products"
media_dir.mkdir(parents=True, exist_ok=True)

# Product name -> existing image filename
image_mapping = {
    "Ruled Note": "note.png",
    "Premium File Folder": "files.png",
    "Document Clip Set": "note-clip.png",
    "Classic Ball Pen": "pen.png",
    "Pen and Writing Set": "pen-notepad.png",
    "Premium Notebook": "note1.png",
    "Spiral Notebook": "note2.png",
    "Study Notes Book": "note3.png",
    "Sketch Notebook": "sketch.png",
    "School Text Book": "book.png",
    "Geometry Box": "geometry.png",
    "Student Calculator": "calculator.png",
    "Eraser Set": "eraser.png",
    "School Backpack": "bag1.png",
    "Daily Use School Bag": "bag2.png",
    "Trending Stationery Kit": "trending1.png",
    "Student Essentials Kit": "stationary.png",
}

updated = 0

for product_name, filename in image_mapping.items():
    source = assets_dir / filename

    if not source.is_file():
        print(f"IMAGE FILE NOT FOUND: {source}")
        continue

    product = Product.objects.filter(
        name=product_name
    ).first()

    if product is None:
        print(f"PRODUCT NOT FOUND: {product_name}")
        continue

    destination = media_dir / filename
    shutil.copy2(source, destination)

    # Store a relative path in the ImageField
    product.image.name = f"products/{filename}"
    product.save(update_fields=["image"])

    print(f"UPDATED: {product.name} -> {product.image.name}")
    updated += 1

print(f"\nCompleted. Products updated: {updated}")
