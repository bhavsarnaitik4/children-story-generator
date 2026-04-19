import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add the parent directory (Short_stories) to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import torch
import jwt
from tokenizers import Tokenizer
from google import genai
import re

from generate import load_model, generate
from database import engine, get_db
import models, auth

models.Base.metadata.create_all(bind=engine)


app = FastAPI(title="Story Generator API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
class ModelContext:
    model = None
    tokenizer = None
    cfg = None
    device = None
    gemini_client = None

ctx = ModelContext()

@app.on_event("startup")
def startup_event():
    import os
    import torch
    ctx.device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading model on {ctx.device}...")
    
    # Search for checkpoint
    possible_ckpt_paths = [
        os.path.join(str(Path(__file__).parent.parent), "checkpoints", "ckpt_best.pt"),
        os.path.join(str(Path(__file__).parent.parent), "ckpt_best.pt")
    ]
    
    ckpt_path = None
    for p in possible_ckpt_paths:
        if os.path.exists(p):
            ckpt_path = p
            break
            
    if not ckpt_path:
        print(f"ERROR: Could not find ckpt_best.pt in any of: {possible_ckpt_paths}")
        return

    try:
        ctx.model, ctx.cfg = load_model(ckpt_path, ctx.device)
        
        # Search for tokenizer
        tokenizer_path = ctx.cfg.tokenizer_path
        if not os.path.isabs(tokenizer_path):
            # Try a few locations: relative to root, in tokenizer/ folder, or in root itself
            possible_tokenizer_paths = [
                os.path.join(str(Path(__file__).parent.parent), tokenizer_path),
                os.path.join(str(Path(__file__).parent.parent), "tokenizer", tokenizer_path),
                os.path.join(str(Path(__file__).parent.parent), "tokenizer.json")
            ]
            
            final_tokenizer_path = None
            for p in possible_tokenizer_paths:
                if os.path.exists(p):
                    final_tokenizer_path = p
                    break
            
            if final_tokenizer_path:
                tokenizer_path = final_tokenizer_path
            else:
                # Fallback to the original logic if nothing found, but it will likely fail
                tokenizer_path = os.path.join(str(Path(__file__).parent.parent), tokenizer_path)
            
        print(f"Loading tokenizer from {tokenizer_path}")
        ctx.tokenizer = Tokenizer.from_file(tokenizer_path)
        print("Model and Tokenizer loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
    
    # Initialize GenAI Client
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        ctx.gemini_client = genai.Client(api_key=api_key)
        print("Google GenAI client initialized.")
    else:
        print("WARNING: GEMINI_API_KEY not found in environment. Rating functionality will fail.")

# --- Authentication & Memory Routes ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

class UserCreate(BaseModel):
    username: str
    password: str

@app.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

class StorySave(BaseModel):
    prompt: str
    content: str
    rating_json: str

@app.post("/stories")
def save_story(req: StorySave, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_story = models.Story(
        prompt=req.prompt,
        content=req.content,
        rating_json=req.rating_json,
        owner_id=current_user.id
    )
    db.add(db_story)
    db.commit()
    db.refresh(db_story)
    return {"id": db_story.id, "msg": "Saved"}

@app.get("/stories")
def get_stories(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    stories = db.query(models.Story).filter(models.Story.owner_id == current_user.id).order_by(models.Story.created_at.desc()).all()
    res = []
    for s in stories:
        res.append({
            "id": s.id,
            "prompt": s.prompt,
            "content": s.content,
            "rating_json": s.rating_json,
            "created_at": s.created_at.isoformat() if s.created_at else None
        })
    return res

class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = 300
    temperature: float = 0.8
    top_p: float = 0.9

class RateRequest(BaseModel):
    story: str
    
@app.post("/generate")
def generate_story_endpoint(req: GenerateRequest):
    if not ctx.model or not ctx.tokenizer:
        raise HTTPException(status_code=500, detail="Model is not loaded properly.")
    
    try:
        story = generate(ctx.model, ctx.tokenizer, req.prompt, ctx.cfg, ctx.device,
                         max_tokens=req.max_tokens, temperature=req.temperature, top_p=req.top_p)
        return {"story": story}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/rate")
def rate_story_endpoint(req: RateRequest):
    if not ctx.gemini_client:
        raise HTTPException(status_code=500, detail="Google GenAI client is not initialized (missing API Key).")
    target_age = "5-7 years old"
    prompt = f"""You are an expert children's literature evaluator and child development specialist. Your task is to evaluate a generated children's story.

Evaluate the story based on the following rubric. Provide a score from 1 to 5 for each category (1 = Poor, 5 = Excellent).

RUBRIC:
1. Age Appropriateness: Are the vocabulary, sentence complexity, and themes suitable for children who are {target_age}?
2. Narrative Flow: Does the story have a clear beginning, middle, and end? Are the transitions smooth?
3. Creativity & Engagement: Is the concept imaginative? Does it use engaging imagery or fun characters?
4. Wholesomeness: Is the tone positive? Does it successfully avoid scary, overly complex, or inappropriate elements?

INSTRUCTIONS:
- You must output your response in strict JSON format. 
- Do not include markdown code blocks (like ```json) in your final output, just the raw JSON object.
- Always provide your reasoning BEFORE providing the integer score. This improves evaluation accuracy.

TARGET AGE: {target_age}

STORY TO EVALUATE:
\"\"\"
{req.story}
\"\"\"

REQUIRED JSON OUTPUT:
{{
  "age_appropriateness": {{
    "reasoning": "<short explanation>",
    "score": <int>
  }},
  "narrative_flow": {{
    "reasoning": "<short explanation>",
    "score": <int>
  }},
  "creativity": {{
    "reasoning": "<short explanation>",
    "score": <int>
  }},
  "wholesomeness": {{
    "reasoning": "<short explanation>",
    "score": <int>
  }},
  "overall_score": <int>
}}
"""
    try:
        # gemma-4-31b-it from Google AI Studio
        response = ctx.gemini_client.models.generate_content(
            model='models/gemma-4-31b-it',
            contents=prompt,
        )
        
        # Clean up any potential markdown formatting the LLM might have output despite instructions
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        elif raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()
        
        return {"rating": raw_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
