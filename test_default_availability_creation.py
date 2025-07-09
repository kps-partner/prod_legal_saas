#!/usr/bin/env python3
"""
🧪 TEST SCRIPT: Default Availability Settings Creation
Tests that firms without availability settings get default Mon-Fri 9am-5pm settings created automatically
"""

import sys
import os
sys.path.append('/Users/dessykadriyani/Desktop/Vibecamp/Vibecamp_prod/backend')

from app.core.db import get_database
from bson import ObjectId
from datetime import datetime

def test_default_availability_creation():
    """Test that default availability settings are created for firms without settings"""
    
    print("🧪 TESTING DEFAULT AVAILABILITY SETTINGS CREATION")
    print("=" * 70)
    
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
        print("   All firms already have availability settings configured")
        return
    
    firm_id = str(test_firm['_id'])
    firm_name = test_firm.get('name', 'Unknown Firm')
    
    print(f"🏢 Testing with firm without settings: {firm_name}")
    print(f"   Firm ID: {firm_id}")
    print("📋 Expected behavior: Create default Mon-Fri 9am-5pm availability settings")
    
    # Verify no settings exist before test
    existing_settings = db.availability_settings.find_one({'firm_id': firm_id})
    if existing_settings:
        print("⚠️  WARNING: Firm already has settings - test may not be valid")
        return
    
    print("\n🚀 CALLING PUBLIC AVAILABILITY FUNCTION")
    print("-" * 50)
    
    try:
        from app.modules.public.services import get_firm_availability
        
        result = get_firm_availability(firm_id)
        available_slots = result.get('available_slots', [])
        
        print(f"📊 Total slots returned: {len(available_slots)}")
        
        # Check if default settings were created
        created_settings = db.availability_settings.find_one({'firm_id': firm_id})
        
        if created_settings:
            print("\n✅ SUCCESS: Default availability settings were created!")
            print(f"   Settings ID: {created_settings['_id']}")
            print(f"   Created at: {created_settings.get('created_at', 'N/A')}")
            
            # Verify the default schedule
            weekly_schedule = created_settings.get('weekly_schedule', {})
            expected_enabled = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
            expected_disabled = ['saturday', 'sunday']
            
            print("\n📋 CREATED DEFAULT SETTINGS:")
            days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            all_correct = True
            
            for day in days:
                day_settings = weekly_schedule.get(day, {})
                enabled = day_settings.get('enabled', False)
                start_time = day_settings.get('start_time', 'N/A')
                end_time = day_settings.get('end_time', 'N/A')
                status = "✅ ENABLED" if enabled else "❌ DISABLED"
                print(f"   {day.capitalize()}: {status} ({start_time}-{end_time})")
                
                # Validate expected behavior
                if day in expected_enabled:
                    if not enabled:
                        print(f"      🚨 ERROR: {day} should be enabled by default!")
                        all_correct = False
                    elif start_time != "09:00" or end_time != "17:00":
                        print(f"      🚨 ERROR: {day} should be 09:00-17:00, got {start_time}-{end_time}")
                        all_correct = False
                elif day in expected_disabled:
                    if enabled:
                        print(f"      🚨 ERROR: {day} should be disabled by default!")
                        all_correct = False
            
            # Check other default settings
            timezone = created_settings.get('timezone', 'N/A')
            slot_duration = created_settings.get('slot_duration_minutes', 'N/A')
            buffer_time = created_settings.get('buffer_time_minutes', 'N/A')
            advance_days = created_settings.get('advance_booking_days', 'N/A')
            
            print(f"\n📋 OTHER DEFAULT SETTINGS:")
            print(f"   Timezone: {timezone}")
            print(f"   Slot duration: {slot_duration} minutes")
            print(f"   Buffer time: {buffer_time} minutes")
            print(f"   Advance booking days: {advance_days}")
            
            # Validate other settings
            if slot_duration != 60:
                print(f"   🚨 ERROR: Slot duration should be 60 minutes, got {slot_duration}")
                all_correct = False
            if buffer_time != 15:
                print(f"   🚨 ERROR: Buffer time should be 15 minutes, got {buffer_time}")
                all_correct = False
            if advance_days != 60:
                print(f"   🚨 ERROR: Advance booking days should be 60, got {advance_days}")
                all_correct = False
            
            # Analyze returned slots if any (may be 0 due to calendar auth issues)
            if available_slots:
                print(f"\n📈 SLOT ANALYSIS:")
                day_counts = {}
                
                for slot in available_slots:
                    try:
                        start_time = slot.get('start_time', '')
                        if isinstance(start_time, str):
                            dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                        else:
                            dt = start_time
                        
                        day_name = dt.strftime('%A').lower()
                        day_counts[day_name] = day_counts.get(day_name, 0) + 1
                        
                    except Exception as e:
                        print(f"   ⚠️  Error parsing slot: {e}")
                        continue
                
                for day in days:
                    count = day_counts.get(day, 0)
                    is_expected_enabled = day in expected_enabled
                    
                    if is_expected_enabled and count > 0:
                        print(f"   ✅ {day.capitalize()}: {count} slots (CORRECTLY ENABLED)")
                    elif is_expected_enabled and count == 0:
                        print(f"   ⚠️  {day.capitalize()}: {count} slots (ENABLED but no slots - likely calendar/auth issue)")
                    elif not is_expected_enabled and count > 0:
                        print(f"   🚨 {day.capitalize()}: {count} slots (SHOULD BE DISABLED - BUG!)")
                        all_correct = False
                    else:
                        print(f"   ✅ {day.capitalize()}: {count} slots (CORRECTLY DISABLED)")
            else:
                print(f"\n📈 SLOT ANALYSIS:")
                print("   ⚠️  No slots returned - likely due to calendar connection or authentication issues")
                print("   ⚠️  This is expected for firms without Google Calendar connected")
            
            print(f"\n🎯 OVERALL RESULT:")
            if all_correct:
                print("   ✅ SUCCESS: Default availability settings created correctly!")
                print("   ✅ SUCCESS: Mon-Fri 9am-5pm schedule established!")
                print("   ✅ SUCCESS: Weekend days properly disabled!")
                print("   ✅ SUCCESS: All default values are correct!")
            else:
                print("   ❌ FAILURE: Some default settings are incorrect!")
                print("   ❌ FAILURE: Review the errors above!")
            
        else:
            print("\n❌ FAILURE: Default settings were not created!")
            print("   The system should automatically create default settings")
            print("   when a firm has no availability settings configured")
    
    except Exception as e:
        print(f"\n❌ Error testing default availability creation: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 70)

def test_existing_settings_preserved():
    """Test that firms with existing settings don't get overwritten"""
    
    print("\n🧪 TESTING EXISTING SETTINGS PRESERVATION")
    print("=" * 70)
    
    db = get_database()
    
    # Find a firm with existing settings
    firm_with_settings = db.availability_settings.find_one({})
    if not firm_with_settings:
        print("❌ No firm with existing settings found for testing")
        return
    
    firm_id = firm_with_settings['firm_id']
    
    # Get firm name
    firm = db.firms.find_one({'_id': ObjectId(firm_id)})
    firm_name = firm.get('name', 'Unknown Firm') if firm else 'Unknown Firm'
    
    print(f"🏢 Testing with firm with existing settings: {firm_name}")
    print(f"   Firm ID: {firm_id}")
    
    # Store original settings for comparison
    original_settings = dict(firm_with_settings)
    original_weekly_schedule = original_settings.get('weekly_schedule', {})
    
    print("\n📋 ORIGINAL SETTINGS:")
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for day in days:
        day_settings = original_weekly_schedule.get(day, {})
        enabled = day_settings.get('enabled', False)
        start_time = day_settings.get('start_time', 'N/A')
        end_time = day_settings.get('end_time', 'N/A')
        status = "✅ ENABLED" if enabled else "❌ DISABLED"
        print(f"   {day.capitalize()}: {status} ({start_time}-{end_time})")
    
    print("\n🚀 CALLING PUBLIC AVAILABILITY FUNCTION")
    print("-" * 50)
    
    try:
        from app.modules.public.services import get_firm_availability
        
        result = get_firm_availability(firm_id)
        available_slots = result.get('available_slots', [])
        
        print(f"📊 Total slots returned: {len(available_slots)}")
        
        # Check that settings were not modified
        current_settings = db.availability_settings.find_one({'firm_id': firm_id})
        
        if current_settings:
            current_weekly_schedule = current_settings.get('weekly_schedule', {})
            
            print("\n🔍 COMPARING SETTINGS:")
            settings_unchanged = True
            
            for day in days:
                original_day = original_weekly_schedule.get(day, {})
                current_day = current_weekly_schedule.get(day, {})
                
                if original_day != current_day:
                    print(f"   🚨 {day.capitalize()}: CHANGED!")
                    print(f"      Original: {original_day}")
                    print(f"      Current:  {current_day}")
                    settings_unchanged = False
                else:
                    print(f"   ✅ {day.capitalize()}: UNCHANGED")
            
            print(f"\n🎯 OVERALL RESULT:")
            if settings_unchanged:
                print("   ✅ SUCCESS: Existing settings were preserved!")
                print("   ✅ SUCCESS: No unwanted modifications occurred!")
            else:
                print("   ❌ FAILURE: Existing settings were modified!")
                print("   ❌ FAILURE: System should not change existing settings!")
        
        else:
            print("\n❌ FAILURE: Settings were deleted!")
            print("   The system should preserve existing settings")
    
    except Exception as e:
        print(f"\n❌ Error testing settings preservation: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 70)

if __name__ == "__main__":
    test_default_availability_creation()
    test_existing_settings_preserved()