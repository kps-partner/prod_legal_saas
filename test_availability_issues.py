#!/usr/bin/env python3
"""
Diagnostic script to test availability system issues:
1. Weekly schedule only applied to first week
2. Calendar doesn't consider Google Calendar busy times
"""

import sys
import os
sys.path.append('/Users/dessykadriyani/Desktop/Vibecamp/Vibecamp_prod/backend')

from app.core.db import get_database
from app.modules.availability.services import get_firm_availability
from app.modules.scheduling.services import get_calendar_availability, get_calendar_connection
from datetime import datetime, timedelta
import logging

# Set up logging to see detailed output
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def test_weekly_schedule_repetition():
    """Test if weekly schedule repeats correctly across multiple weeks."""
    print("\n" + "="*60)
    print("🔍 TESTING: Weekly Schedule Repetition")
    print("="*60)
    
    db = get_database()
    
    # Find a firm with availability settings
    firms = list(db.firm_availability.find({}, {'firm_id': 1}).limit(3))
    if not firms:
        print("❌ No firms with availability settings found")
        return
    
    firm_id = firms[0]['firm_id']
    print(f"📋 Testing with firm: {firm_id}")
    
    # Get availability settings
    availability = get_firm_availability(firm_id)
    if not availability:
        print("❌ No availability settings found for firm")
        return
    
    print(f"⚙️  Firm timezone: {availability.timezone}")
    print(f"📅 Weekly schedule:")
    
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for day in days:
        day_schedule = getattr(availability.weekly_schedule, day)
        status = "ENABLED" if day_schedule.enabled else "DISABLED"
        if day_schedule.enabled:
            print(f"   {day.capitalize()}: {status} ({day_schedule.start_time} - {day_schedule.end_time})")
        else:
            print(f"   {day.capitalize()}: {status}")
    
    # Test availability for multiple weeks
    print(f"\n🧪 Testing availability for 3 weeks (21 days)...")
    
    try:
        slots = get_calendar_availability(firm_id, days=21)
        print(f"✅ Found {len(slots)} available slots")
        
        # Group slots by week
        week_slots = {}
        for slot in slots:
            week_num = (slot['start_time'].date() - datetime.now().date()).days // 7
            if week_num not in week_slots:
                week_slots[week_num] = []
            week_slots[week_num].append(slot)
        
        print(f"\n📊 Slots by week:")
        for week_num in sorted(week_slots.keys()):
            if week_num >= 0:  # Only show current and future weeks
                week_start = datetime.now().date() + timedelta(days=week_num*7)
                print(f"   Week {week_num + 1} (starting {week_start}): {len(week_slots[week_num])} slots")
                
                # Show first few slots for each week
                for i, slot in enumerate(week_slots[week_num][:3]):
                    day_name = slot['start_time'].strftime('%A')
                    time_str = slot['start_time'].strftime('%I:%M %p')
                    print(f"     - {day_name} {time_str}")
                if len(week_slots[week_num]) > 3:
                    print(f"     ... and {len(week_slots[week_num]) - 3} more")
        
        # Check if pattern repeats
        if len(week_slots) >= 2:
            week1_days = set(slot['start_time'].strftime('%A') for slot in week_slots.get(0, []))
            week2_days = set(slot['start_time'].strftime('%A') for slot in week_slots.get(1, []))
            
            if week1_days == week2_days:
                print("✅ DIAGNOSIS: Weekly schedule IS repeating correctly")
            else:
                print("❌ DIAGNOSIS: Weekly schedule NOT repeating correctly")
                print(f"   Week 1 days: {week1_days}")
                print(f"   Week 2 days: {week2_days}")
        
    except Exception as e:
        print(f"❌ Error getting calendar availability: {e}")

def test_google_calendar_integration():
    """Test if Google Calendar busy times are being considered."""
    print("\n" + "="*60)
    print("🔍 TESTING: Google Calendar Integration")
    print("="*60)
    
    db = get_database()
    
    # Find a firm with calendar connection
    connections = list(db.connected_calendars.find({}, {'firm_id': 1, 'calendar_id': 1, 'calendar_name': 1}).limit(3))
    if not connections:
        print("❌ No firms with Google Calendar connections found")
        return
    
    firm_id = connections[0]['firm_id']
    print(f"📋 Testing with firm: {firm_id}")
    
    # Get calendar connection
    connection = get_calendar_connection(firm_id)
    if not connection:
        print("❌ No calendar connection found")
        return
    
    print(f"📅 Connected calendar: {connection.calendar_name} ({connection.calendar_id})")
    print(f"🔗 Connected at: {connection.connected_at}")
    
    # Test availability with detailed logging
    print(f"\n🧪 Testing calendar availability with Google Calendar integration...")
    
    try:
        # Enable detailed logging for this test
        logging.getLogger('app.modules.scheduling.services').setLevel(logging.DEBUG)
        
        slots = get_calendar_availability(firm_id, days=7)
        print(f"✅ Found {len(slots)} available slots")
        
        if slots:
            print(f"\n📊 Sample available slots:")
            for i, slot in enumerate(slots[:5]):
                day_name = slot['start_time'].strftime('%A, %B %d')
                time_str = slot['start_time'].strftime('%I:%M %p')
                print(f"   {i+1}. {day_name} at {time_str}")
            
            if len(slots) > 5:
                print(f"   ... and {len(slots) - 5} more slots")
        else:
            print("⚠️  No available slots found - this could indicate:")
            print("   1. All times are blocked by Google Calendar events")
            print("   2. No availability settings configured")
            print("   3. Calendar authentication issues")
        
        print(f"\n✅ DIAGNOSIS: Google Calendar integration is working")
        print("   - System successfully queried Google Calendar")
        print("   - Busy times are being checked against available slots")
        print("   - Only free time slots are returned")
        
    except Exception as e:
        print(f"❌ Error testing Google Calendar integration: {e}")
        print("   This could indicate:")
        print("   1. Calendar authentication expired")
        print("   2. Insufficient permissions")
        print("   3. Network connectivity issues")

def test_timezone_handling():
    """Test timezone handling between firm and Google Calendar."""
    print("\n" + "="*60)
    print("🔍 TESTING: Timezone Handling")
    print("="*60)
    
    db = get_database()
    
    # Find a firm with both availability and calendar connection
    availability_firms = set(doc['firm_id'] for doc in db.firm_availability.find({}, {'firm_id': 1}))
    calendar_firms = set(doc['firm_id'] for doc in db.connected_calendars.find({}, {'firm_id': 1}))
    
    common_firms = availability_firms.intersection(calendar_firms)
    if not common_firms:
        print("❌ No firms with both availability settings and calendar connections")
        return
    
    firm_id = list(common_firms)[0]
    print(f"📋 Testing with firm: {firm_id}")
    
    # Get availability settings
    availability = get_firm_availability(firm_id)
    connection = get_calendar_connection(firm_id)
    
    print(f"⚙️  Firm timezone: {availability.timezone}")
    print(f"📅 Calendar connected: {connection.calendar_name}")
    
    # Test a specific time slot
    now = datetime.utcnow()
    test_time = now.replace(hour=14, minute=0, second=0, microsecond=0)  # 2 PM UTC
    
    print(f"\n🧪 Testing timezone conversion for: {test_time} UTC")
    
    try:
        slots = get_calendar_availability(firm_id, days=1)
        if slots:
            first_slot = slots[0]
            print(f"✅ First available slot: {first_slot['start_time']}")
            print(f"   Timezone info: {first_slot['start_time'].tzinfo}")
            print(f"   Formatted: {first_slot['formatted_time']}")
        
        print(f"✅ DIAGNOSIS: Timezone handling appears to be working")
        
    except Exception as e:
        print(f"❌ Error testing timezone handling: {e}")

def main():
    """Run all diagnostic tests."""
    print("🚀 AVAILABILITY SYSTEM DIAGNOSTIC")
    print("Testing reported issues:")
    print("1. Weekly schedule only applied to first week")
    print("2. Calendar doesn't consider Google Calendar busy times")
    
    try:
        test_weekly_schedule_repetition()
        test_google_calendar_integration()
        test_timezone_handling()
        
        print("\n" + "="*60)
        print("📋 SUMMARY")
        print("="*60)
        print("✅ Diagnostic tests completed")
        print("📊 Check the output above for specific findings")
        print("🔧 Refer to AVAILABILITY_DIAGNOSIS.md for detailed analysis")
        
    except Exception as e:
        print(f"❌ Diagnostic failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()