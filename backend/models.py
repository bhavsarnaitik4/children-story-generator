from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    stories = relationship("Story", back_populates="owner")

class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True)
    prompt = Column(String, index=True)
    content = Column(Text)
    rating_json = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="stories")
