#!/usr/bin/env python3
"""
Migration script to create default 'General' case types for existing firms that don't have any case types.

This script:
1. Finds all firms that don't have any case types
2. Creates a default 'General' case type for each of these firms
3. Provides detailed logging and error handling

Usage:
    cd backend
    PYTHONPATH=/path/to/backend python3 app/modules/firms/migrate_default_case_types.py
"""

import sys
import os
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.db import db
from app.modules.firms.services import create_default_case_type


def migrate_default_case_types():
    """Create default case types for firms that don't have any."""
    print("🔄 Starting migration: Creating default case types for firms without any case types")
    print("=" * 80)
    
    try:
        # Get all firms
        firms = list(db.firms.find({}))
        print(f"📊 Found {len(firms)} total firms")
        
        firms_without_case_types = []
        firms_with_case_types = []
        
        # Check each firm for existing case types
        for firm in firms:
            firm_id = str(firm["_id"])
            firm_name = firm.get("name", "Unknown")
            
            # Check if firm has any case types
            case_type_count = db.case_types.count_documents({"firm_id": firm_id})
            
            if case_type_count == 0:
                firms_without_case_types.append({
                    "id": firm_id,
                    "name": firm_name
                })
                print(f"❌ Firm '{firm_name}' ({firm_id}) has no case types")
            else:
                firms_with_case_types.append({
                    "id": firm_id,
                    "name": firm_name,
                    "case_type_count": case_type_count
                })
                print(f"✅ Firm '{firm_name}' ({firm_id}) has {case_type_count} case type(s)")
        
        print("\n" + "=" * 80)
        print(f"📈 Summary:")
        print(f"   • Firms with case types: {len(firms_with_case_types)}")
        print(f"   • Firms without case types: {len(firms_without_case_types)}")
        
        if not firms_without_case_types:
            print("\n🎉 All firms already have case types! No migration needed.")
            return
        
        print(f"\n🔧 Creating default case types for {len(firms_without_case_types)} firms...")
        print("-" * 80)
        
        successful_migrations = 0
        failed_migrations = 0
        
        for firm in firms_without_case_types:
            firm_id = firm["id"]
            firm_name = firm["name"]
            
            try:
                print(f"🔄 Processing firm '{firm_name}' ({firm_id})...")
                
                # Create default case type
                case_type = create_default_case_type(firm_id)
                
                if case_type:
                    print(f"   ✅ Successfully created 'General' case type (ID: {case_type.id})")
                    successful_migrations += 1
                else:
                    print(f"   ⚠️ Case type creation returned None (may already exist)")
                    failed_migrations += 1
                    
            except Exception as e:
                print(f"   ❌ Failed to create case type: {str(e)}")
                failed_migrations += 1
        
        print("\n" + "=" * 80)
        print("🏁 Migration completed!")
        print(f"   • Successful migrations: {successful_migrations}")
        print(f"   • Failed migrations: {failed_migrations}")
        print(f"   • Total processed: {len(firms_without_case_types)}")
        
        if failed_migrations > 0:
            print(f"\n⚠️ {failed_migrations} migrations failed. Please check the logs above for details.")
        else:
            print(f"\n🎉 All migrations completed successfully!")
            
    except Exception as e:
        print(f"❌ Migration failed with error: {str(e)}")
        raise


if __name__ == "__main__":
    migrate_default_case_types()