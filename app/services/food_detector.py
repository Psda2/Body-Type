"""
Food Detection Service
-----------------------
Uses a trained YOLOv8 segmentation model to detect Sri Lankan
foods in an uploaded image and estimate total calorie content.

Place your trained model weights at:
  app/models/sl_food_best.pt
"""

import io
import os
from pathlib import Path
from typing import Optional

# Lazy-loaded model — only loads on first call
_model = None
MODEL_PATH = Path(__file__).parent.parent / "models" / "sl_food_best.pt"


def _get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"YOLO model not found at {MODEL_PATH}. "
                "Please train the model in Google Colab and place best.pt at app/models/sl_food_best.pt"
            )
        from ultralytics import YOLO
        _model = YOLO(str(MODEL_PATH))
    return _model


def detect_and_estimate_calories(image_bytes: bytes) -> dict:
    """
    Run YOLO inference on the uploaded image and return
    detected foods with individual and total calorie estimates.

    Args:
        image_bytes: Raw bytes of the uploaded image file.

    Returns:
        {
          "detected_foods": [
            { "food": str, "confidence": float,
              "estimated_calories": int, "portion_g": int }
          ],
          "total_calories": int,
          "model_used": str
        }
    """
    from PIL import Image
    from ..data.sl_food_calories import get_calories  # go up to app/, then into data/

    # Load image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    model = _get_model()
    results = model(image, conf=0.25, iou=0.45)[0]  # single image

    detected_foods = []
    seen_classes: dict[str, int] = {}  # track duplicates per plate
    total_calories = 0

    for box in results.boxes:
        class_id   = int(box.cls[0])
        class_name = model.names[class_id]
        confidence = float(box.conf[0])

        # Count occurrences (e.g. 3 rotis on the plate)
        seen_classes[class_name] = seen_classes.get(class_name, 0) + 1
        count = seen_classes[class_name]

        cal_info      = get_calories(class_name)
        cal_per_100g  = cal_info["cal_per_100g"]
        portion_g     = cal_info["avg_portion_g"]
        item_calories = round((cal_per_100g * portion_g) / 100)

        total_calories += item_calories

        detected_foods.append({
            "food":                class_name,
            "confidence":          round(confidence, 3),
            "estimated_calories":  item_calories,
            "portion_g":           portion_g,
            "cal_per_100g":        cal_per_100g,
            "occurrence":          count,
        })

    # Sort by calories descending for readability
    detected_foods.sort(key=lambda x: x["estimated_calories"], reverse=True)

    return {
        "detected_foods":  detected_foods,
        "total_calories":  total_calories,
        "items_detected":  len(detected_foods),
        "model_used":      "YOLOv8m-seg (Sri Lankan Food)",
    }


def is_model_ready() -> bool:
    """Returns True if the model weights file exists."""
    return MODEL_PATH.exists()
