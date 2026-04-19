import os
from datetime import datetime, timedelta
import jwt
import bcrypt

SECRET_KEY = os.getenv("JWT_SECRET", "1234567890qwertyuiop")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days locally

def verify_password(plain_password: str, hashed_password: str):
    # checkpw expects bytes.
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str):
    # Hash requires explicit bytes
    pwd_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
