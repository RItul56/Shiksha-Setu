"""Train a small, interpretable engagement-band classifier on Kaggle xAPI-Edu-Data.

This is an offline research/demo pipeline, not an automated decision system. The
480-row dataset is too small and context-specific for production predictions.
"""
from pathlib import Path
import json
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / "data" / "xAPI-Edu-Data.csv"
OUTPUT = ROOT / "artifacts" / "engagement-model.joblib"
FEATURES = ["raisedhands", "VisITedResources", "AnnouncementsView", "Discussion", "StudentAbsenceDays"]
TARGET = "Class"


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Dataset not found: {SOURCE}\nDownload it from Kaggle per README and review its CC BY-SA 4.0 terms first.")
    frame = pd.read_csv(SOURCE)
    missing = sorted(set(FEATURES + [TARGET]) - set(frame.columns))
    if missing:
        raise SystemExit(f"Unexpected dataset schema; missing columns: {', '.join(missing)}")
    X = frame[FEATURES].copy()
    y = frame[TARGET].astype(str)
    numeric = ["raisedhands", "VisITedResources", "AnnouncementsView", "Discussion"]
    categorical = ["StudentAbsenceDays"]
    transform = ColumnTransformer([
        ("numeric", Pipeline([("impute", SimpleImputer(strategy="median")), ("scale", StandardScaler())]), numeric),
        ("categorical", Pipeline([("impute", SimpleImputer(strategy="most_frequent")), ("encode", OneHotEncoder(handle_unknown="ignore"))]), categorical),
    ])
    model = Pipeline([("features", transform), ("classifier", LogisticRegression(max_iter=2000, class_weight="balanced"))])
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    model.fit(X_train, y_train)
    print(classification_report(y_test, model.predict(X_test), zero_division=0))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, OUTPUT)
    (OUTPUT.parent / "metadata.json").write_text(json.dumps({
        "dataset": "Kaggle xAPI-Edu-Data", "source": "https://www.kaggle.com/datasets/aljarah/xAPI-Edu-Data",
        "license": "CC BY-SA 4.0 (attribute dataset creator and share adaptations under same license)",
        "features": FEATURES, "target": TARGET,
        "limitations": ["480 records", "not a dialogue dataset", "not validated for individual student decisions", "research/demo only"]
    }, indent=2), encoding="utf-8")
    print(f"Saved {OUTPUT}")


if __name__ == "__main__":
    main()
