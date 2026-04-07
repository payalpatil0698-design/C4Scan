from app import app, db, Case

with app.app_context():
    cases = Case.query.all()
    print(f"Total cases: {len(cases)}")
    for c in cases:
        print(f"ID: {c.id}, Label: {c.prediction_label}, Confidence: {c.confidence_score}")
