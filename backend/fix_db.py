from app import app, db, Case

with app.app_context():
    # Find cases with None predictions
    bad_cases = Case.query.filter(Case.prediction_label == None).all()
    print(f"Found {len(bad_cases)} cases with None predictions.")
    
    if bad_cases:
        for c in bad_cases:
            db.session.delete(c)
        db.session.commit()
        print("Deleted bad cases.")
    else:
        print("No bad cases found.")
