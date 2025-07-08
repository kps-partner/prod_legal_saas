#!/bin/bash

# Navigate to backend directory
cd backend

# Set Python path
export PYTHONPATH=/opt/render/project/src/backend

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI application
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}