#!/usr/bin/env python3
"""
🔍 DIAGNOSTIC SCRIPT: Public Availability Settings Issue
Tests the disconnect between availability settings and booking page display
"""

import sys
import os
sys.path.append('/Users/dessykadriyani/Desktop/Vibecamp/Vibecamp_prod/backend')

from app.core.db import get_database
from bson import ObjectId
from datetime import datetime, timedelta
import pytz

def test_public_availability_issue():
    """Test the public availability endpoint vs settings"""
    
    print("🔍 TESTING PUBLIC AVAILABILITY SETTINGS ISSUE")
    print("=" * 60)
    
    db = get_database()
    
    # Find a firm to test with
    firm = db.firms.find_one()
    if not firm:
        print("❌ No firms found in database")
        return
        
    firm_id = str(firm['_id'])
    firm_name = firm.get('name', 'Test Firm')
    
    print(f"🏢 Testing with firm: {firm_name} (ID: {firm_id})")
    print()
    
    # 1. Check availability settings in database
    print("1️⃣ CHECKING AVAILABILITY SETTINGS IN DATABASE")
    print("-" * 50)
    
    availability_settings = db.availability_settings.find_one({'firm_id': firm_id})
    if availability_settings:
        print("✅ Availability settings found:")
        weekly_schedule = availability_settings.get('weekly_schedule', {})
        
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        for day in days:
            day_settings = weekly_schedule.get(day, {})
            enabled = day_settings.get('enabled', False)
            start_time = day_settings.get('start_time', 'N/A')
            end_time = day_settings.get('end_time', 'N/A')
            
            status = "✅ ENABLED" if enabled else "❌ DISABLED"
            print(f"   {day.capitalize()}: {status} ({start_time} - {end_time})")
    else:
        print("❌ No availability settings found for this firm")
        return
    
    print()
    
    # 2. Test the public availability function directly
    print("2️⃣ TESTING PUBLIC AVAILABILITY FUNCTION")
    print("-" * 50)
    
    try:
        from app.modules.public.services import get_firm_availability
        
        result = get_firm_availability(firm_id)
        available_slots = result.get('available_slots', [])
        
        print(f"📊 Total slots returned: {len(available_slots)}")
        
        if available_slots:
            print("📅 Sample slots (first 10):")
            for i, slot in enumerate(available_slots[:10]):
                start_time = slot.get('start_time', 'N/A')
                formatted_time = slot.get('formatted_time', 'N/A')
                
                # Parse the start time to get day of week
                try:
                    if isinstance(start_time, str):
                        dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    else:
                        dt = start_time
                    
                    day_name = dt.strftime('%A').lower()
                    print(f"   {i+1}. {formatted_time} ({day_name})")
                except Exception as e:
                    print(f"   {i+1}. {formatted_time} (parse error: {e})")
            
            # Analyze which days are being generated
            print("\n📈 DAYS ANALYSIS:")
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
                except:
                    continue
            
            for day, count in day_counts.items():
                day_settings = weekly_schedule.get(day, {})
                enabled = day_settings.get('enabled', False)
                status = "✅ SHOULD BE ENABLED" if enabled else "❌ SHOULD BE DISABLED"
                print(f"   {day.capitalize()}: {count} slots generated - {status}")
        else:
            print("❌ No available slots returned")
    
    except Exception as e:
        print(f"❌ Error testing public availability: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    
    # 3. Test the underlying get_calendar_availability function
    print("3️⃣ TESTING UNDERLYING get_calendar_availability FUNCTION")
    print("-" * 50)
    
    try:
        from app.modules.scheduling.services import get_calendar_availability
        
        direct_slots = get_calendar_availability(firm_id, days=7)  # Test with 7 days
        
        print(f"📊 Direct function returned: {len(direct_slots)} slots")
        
        if direct_slots:
            print("📅 Sample direct slots (first 5):")
            for i, slot in enumerate(direct_slots[:5]):
                start_time = slot.get('start_time', 'N/A')
                formatted_time = slot.get('formatted_time', 'N/A')
                
                try:
                    if isinstance(start_time, str):
                        dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    else:
                        dt = start_time
                    
                    day_name = dt.strftime('%A').lower()
                    print(f"   {i+1}. {formatted_time} ({day_name})")
                except Exception as e:
                    print(f"   {i+1}. {formatted_time} (parse error: {e})")
    
    except Exception as e:
        print(f"❌ Error testing direct calendar availability: {e}")
        import traceback
        traceback.print_exc()
    
    print()
    
    # 4. Summary and diagnosis
    print("4️⃣ DIAGNOSIS SUMMARY")
    print("-" * 50)
    
    if availability_settings:
        enabled_days = []
        disabled_days = []
        
        for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
            day_settings = weekly_schedule.get(day, {})
            if day_settings.get('enabled', False):
                enabled_days.append(day)
            else:
                disabled_days.append(day)
        
        print(f"📋 Settings show ENABLED days: {', '.join(enabled_days)}")
        print(f"📋 Settings show DISABLED days: {', '.join(disabled_days)}")
        
        if available_slots:
            generated_days = set()
            for slot in available_slots:
                try:
                    start_time = slot.get('start_time', '')
                    if isinstance(start_time, str):
                        dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                    else:
                        dt = start_time
                    
                    day_name = dt.strftime('%A').lower()
                    generated_days.add(day_name)
                except:
                    continue
            
            print(f"📋 Booking page shows slots for: {', '.join(sorted(generated_days))}")
            
            # Check for mismatches
            unexpected_days = generated_days - set(enabled_days)
            missing_days = set(enabled_days) - generated_days
            
            if unexpected_days:
                print(f"🚨 PROBLEM: Slots generated for DISABLED days: {', '.join(unexpected_days)}")
            
            if missing_days:
                print(f"⚠️  WARNING: No slots generated for ENABLED days: {', '.join(missing_days)}")
            
            if not unexpected_days and not missing_days:
                print("✅ Settings and booking page are in sync!")
        
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_public_availability_issue()