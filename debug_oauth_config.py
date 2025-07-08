#!/usr/bin/env python3
"""
Debug script to validate Google OAuth configuration in production.
Run this script to check if the environment variables and configuration are correct.
"""

import os
import sys
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

try:
    from app.core.config import settings
    
    print("🔍 GOOGLE OAUTH CONFIGURATION DIAGNOSTIC")
    print("=" * 50)
    
    # Check environment variables
    print("\n📋 Environment Variables:")
    print(f"BACKEND_URL: {os.getenv('BACKEND_URL', 'NOT SET')}")
    print(f"GOOGLE_CLIENT_ID: {'SET' if os.getenv('GOOGLE_CLIENT_ID') else 'NOT SET'}")
    print(f"GOOGLE_CLIENT_SECRET: {'SET' if os.getenv('GOOGLE_CLIENT_SECRET') else 'NOT SET'}")
    print(f"GOOGLE_REDIRECT_URI: {os.getenv('GOOGLE_REDIRECT_URI', 'NOT SET')}")
    
    # Check settings configuration
    print("\n⚙️ Settings Configuration:")
    print(f"settings.BACKEND_URL: {settings.BACKEND_URL}")
    print(f"settings.GOOGLE_REDIRECT_URI: {settings.GOOGLE_REDIRECT_URI}")
    print(f"settings.FRONTEND_URL: {settings.FRONTEND_URL}")
    
    # Expected vs Actual
    print("\n✅ Expected Configuration:")
    expected_redirect = f"{settings.BACKEND_URL}/api/v1/integrations/google/callback"
    print(f"Expected GOOGLE_REDIRECT_URI: {expected_redirect}")
    print(f"Actual GOOGLE_REDIRECT_URI: {settings.GOOGLE_REDIRECT_URI}")
    
    if settings.GOOGLE_REDIRECT_URI == expected_redirect:
        print("✅ Configuration is CORRECT")
    else:
        print("❌ Configuration MISMATCH detected!")
        
        if settings.BACKEND_URL == "http://localhost:8000":
            print("🚨 BACKEND_URL is still set to localhost - this needs to be updated in production!")
            print("   Set BACKEND_URL=https://legal-intake.onrender.com in your Render.com environment variables")
    
    # Check if we're in production
    print(f"\n🌍 Environment Detection:")
    if "localhost" in settings.BACKEND_URL:
        print("📍 Running in DEVELOPMENT mode")
    else:
        print("📍 Running in PRODUCTION mode")
        
    print("\n🔧 Next Steps:")
    if settings.BACKEND_URL == "http://localhost:8000":
        print("1. Set BACKEND_URL=https://legal-intake.onrender.com in Render.com environment variables")
        print("2. Redeploy your backend application")
        print("3. Update Google Cloud Console with the correct redirect URI:")
        print(f"   {expected_redirect}")
    else:
        print("1. Update Google Cloud Console with the correct redirect URI:")
        print(f"   {settings.GOOGLE_REDIRECT_URI}")
        print("2. Remove any old frontend redirect URIs from Google Cloud Console")
        
except ImportError as e:
    print(f"❌ Failed to import settings: {e}")
    print("Make sure you're running this from the project root directory")
except Exception as e:
    print(f"❌ Error: {e}")