import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

def train():
    # Paths
    BASE_DIR = os.path.dirname(__file__)
    DATASET_PATH = os.path.join(BASE_DIR, "../app/data/Dataset.csv")
    MODEL_PATH = os.path.join(BASE_DIR, "../app/data/mlr_somatotype_model.pkl")

    print(f"Loading dataset from {DATASET_PATH}...")
    try:
        df = pd.read_csv(DATASET_PATH)
    except FileNotFoundError:
        print(f"Error: Dataset not found at {DATASET_PATH}")
        return

    # Feature Engineering
    # Convert height to meters
    df["height_m"] = df["height"] / 100

    # Core metrics
    df["BMI"] = df["weight_kg"] / (df["height_m"] ** 2)

    # Ratios
    df["WaistHipRatio"] = df["waist"] / df["hip"]
    df["ShoulderWaistRatio"] = df["shoulder-breadth"] / df["waist"]
    df["ChestWaistRatio"] = df["chest"] / df["waist"]
    df["HeightWaistRatio"] = df["height"] / df["waist"]
    df["FrameIndex"] = df["height"] / df["wrist"]

    # Normalization
    def normalize(col):
        return (col - col.mean()) / col.std()

    for col in [
        "BMI",
        "WaistHipRatio",
        "ShoulderWaistRatio",
        "ChestWaistRatio",
        "HeightWaistRatio",
        "FrameIndex"
    ]:
        df[col + "_n"] = normalize(df[col])

    # Calculate Scores
    df["EndomorphScore"] = (
        0.5 * df["BMI_n"] +
        0.3 * df["WaistHipRatio_n"] -
        0.2 * df["HeightWaistRatio_n"]
    )

    df["MesomorphScore"] = (
        0.4 * df["ShoulderWaistRatio_n"] +
        0.4 * df["ChestWaistRatio_n"] +
        0.2 * df["FrameIndex_n"]
    )

    df["EctomorphScore"] = (
        0.6 * df["HeightWaistRatio_n"] +
        0.4 * df["FrameIndex_n"] -
        0.3 * df["BMI_n"]
    )

    # Classify
    def classify(row):
        scores = {
            "Ectomorph": row["EctomorphScore"],
            "Mesomorph": row["MesomorphScore"],
            "Endomorph": row["EndomorphScore"]
        }
        return max(scores, key=scores.get)

    df["Somatotype"] = df.apply(classify, axis=1)
    print("Somatotype distribution:")
    print(df["Somatotype"].value_counts())

    # Prepare Data for Training
    features = [
        "gender",
        "BMI",
        "WaistHipRatio",
        "ShoulderWaistRatio",
        "ChestWaistRatio",
        "HeightWaistRatio",
        "FrameIndex"
    ]

    X = df[features]
    y = df["Somatotype"]

    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Train
    print("Training model...")
    mlr_model = LogisticRegression(
        multi_class="multinomial",
        solver="lbfgs",
        max_iter=1000
    )
    mlr_model.fit(X_train, y_train)

    # Evaluate
    y_pred = mlr_model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Test Accuracy: {acc*100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    # Save
    joblib.dump(mlr_model, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train()