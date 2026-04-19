# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for psycopg2 and other libraries
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container at /app
COPY backend/requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project into the container
COPY . .

# Set environment variables
ENV PYTHONPATH=/app
ENV JWT_SECRET="7aaf4eb9-abc1-43e6-a0c8-cac49f74014d"
# Note: DATABASE_URL and GEMINI_API_KEY should be set in the HF Space secrets

# Expose the port the app runs on
EXPOSE 7860

# Command to run the application
# We use 0.0.0.0 to allow external connections (Hugging Face requirement)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]
