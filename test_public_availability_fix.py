#!/usr/bin/env python3
"""
🧪 TEST SCRIPT: Public Availability Fix Validation
Tests that disabled days are properly excluded from booking slots
"""

import sys
import os
sys.path.append('/Users/dessykadriyani/Desktop/Vibecamp/Vibecamp_prod/backend')

from app.core.db import get_database
from bson import ObjectId
from datetime import datetime, timedelta

def test_public_availability_fix():
    """Test the public availability fix with comprehensive validation"""
    
    print("🧪 TESTING PUBLIC AVAILABILITY FIX")
    print("=" * 60)
    
    db = get_database()
    
    # Find a firm with availability settings
    firm = db.firms.find_one({'name': 'Another Test Firm'})
    if not firm:
        print("❌ Could not find test firm")
        return
        
    firm_id = str(firm['_id'])
    print(f"🏢 Testing with: {firm.get('name')} (ID: {firm_id})")
    
    # Check availability settings
    settings = db.availability_settings.find_one({'firm_id': firm_id})
    if not settings:
        print("❌ No availability settings found for test firm")
        return
    
    print("\n📋 AVAILABILITY SETTINGS:")
    weekly_schedule = settings.get('weekly_schedule', {})
    
    enabled_days = []
    disabled_days = []
    
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for day in days:
        day_settings = weekly_schedule.get(day, {})
        enabled = day_settings.get('enabled', False)
        status = "✅ ENABLED" if enabled else "❌ DISABLED"
        print(f"   {day.capitalize()}: {status}")
        
        if enabled:
            enabled_days.append(day)
        else:
            disabled_days.append(day)
    
    print(f"\n📊 Summary: {len(enabled_days)} enabled, {len(disabled_days)} disabled days")
    print(f"   Enabled: {', '.join(enabled_days)}")
    print(f"   Disabled: {', '.join(disabled_days)}")
    
    # Test the public availability function
    print("\n🧪 TESTING PUBLIC AVAILABILITY FUNCTION")
    print("-" * 50)
    
    try:
        from app.modules.public.services import get_firm_availability
        
        result = get_firm_availability(firm_id)
        available_slots = result.get('available_slots', [])
        
        print(f"📊 Total slots returned: {len(available_slots)}")
        
        if available_slots:
            # Analyze which days are being generated
            print("\n📈 DAYS ANALYSIS:")
            day_counts = {}
            sample_slots = {}
            
            for slot in available_slots:
                try:
                    start_time = slot.get('start_time', '')
                    if isinstance(start_time, str):
                        dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    else:
                        dt = start_time
                    
                    day_name = dt.strftime('%A').lower()
                    day_counts[day_name] = day_counts.get(day_name, 0) + 1
                    
                    # Store sample slot for each day
                    if day_name not in sample_slots:
                        sample_slots[day_name] = slot.get('formatted_time', str(dt))
                        
                except Exception as e:
                    print(f"   ⚠️  Error parsing slot: {e}")
                    continue
            
            # Validate results
            print("\n🔍 VALIDATION RESULTS:")
            all_correct = True
            
            for day in days:
                count = day_counts.get(day, 0)
                is_enabled = day in enabled_days
                
                if is_enabled and count > 0:
                    print(f"   ✅ {day.capitalize()}: {count} slots (CORRECTLY ENABLED)")
                    if day in sample_slots:
                        print(f"      Sample: {sample_slots[day]}")
                elif is_enabled and count == 0:
                    print(f"   ⚠️  {day.capitalize()}: {count} slots (ENABLED but no slots - might be calendar/auth issue)")
                elif not is_enabled and count > 0:
                    print(f"   🚨 {day.capitalize()}: {count} slots (DISABLED but showing slots - BUG!)")
                    if day in sample_slots:
                        print(f"      Sample: {sample_slots[day]}")
                    all_correct = False
                else:
                    print(f"   ✅ {day.capitalize()}: {count} slots (CORRECTLY DISABLED)")
            
            print(f"\n🎯 OVERALL RESULT:")
            if all_correct:
                print("   ✅ SUCCESS: All disabled days are properly excluded!")
                print("   ✅ SUCCESS: Availability settings are correctly applied!")
            else:
                print("   ❌ FAILURE: Some disabled days are still showing slots!")
                print("   ❌ FAILURE: Fix needs additional work!")
                
        else:
            print("❌ No available slots returned")
            print("   This could be due to:")
            print("   - No calendar connection")
            print("   - Authentication issues")
            print("   - All days disabled")
            print("   - No availability settings (FIXED behavior)")
    
    except Exception as e:
        print(f"❌ Error testing public availability: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)

def test_no_settings_scenario():
    """Test behavior when firm has no availability settings"""
    
    print("\n🧪 TESTING NO SETTINGS SCENARIO")
    print("=" * 60)
    
    db = get_database()
    
    # Find a firm without settings
    firms = list(db.firms.find({}, {'_id': 1, 'name': 1}).limit(5))
    test_firm = None
    
    for firm in firms:
        firm_id = str(firm['_id'])
        if not db.availability_settings.find_one({'firm_id': firm_id}):
            test_firm = firm
            break
    
    if not test_firm:
        print("❌ No firm without settings found for testing")
        return
    
    firm_id = str(test_firm['_id'])
    firm_name = test_firm.get('name', 'Unknown Firm')
    
    print(f"🏢 Testing with firm without settings: {firm_name} (ID: {firm_id})")
    
    try:
        from app.modules.public.services import get_firm_availability
        
        result = get_firm_availability(firm_id)
        available_slots = result.get('available_slots', [])
        
        print(f"📊 Total slots returned: {len(available_slots)}")
        
        if len(available_slots) == 0:
            print("✅ SUCCESS: No slots returned for firm without settings!")
            print("✅ SUCCESS: This prevents the 'disabled days showing slots' bug!")
        else:
            print("❌ FAILURE: Slots returned for firm without settings!")
            print("❌ FAILURE: This could cause the original bug!")
            
            # Show sample slots
            for i, slot in enumerate(available_slots[:3]):
                formatted_time = slot.get('formatted_time', 'N/A')
                print(f"   Sample slot {i+1}: {formatted_time}")
    
    except Exception as e:
        print(f"❌ Error testing no settings scenario: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_public_availability_fix()
    test_no_settings_scenario()