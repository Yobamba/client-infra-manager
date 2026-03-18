def get_user_by_email(db, email: str):
    result = db.execute(
        "SELECT id, email, hashed_password FROM users WHERE email = ?",
        [email]
    )
    row = result.fetchone()
    
    if not row:
        return None
        
    return {
        "id": row[0],
        "email": row[1],
        "hashed_password": row[2]
    }
