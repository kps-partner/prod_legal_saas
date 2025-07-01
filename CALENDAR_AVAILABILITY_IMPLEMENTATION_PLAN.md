# Calendar Availability Management Implementation Plan

## 📋 Project Overview

**Objective**: Add availability management and block-out date features to the Google Calendar integration page, allowing law firms to set their working hours and block specific dates from client booking.

**Requirements Summary**:
- Database-backed availability settings and blocked dates
- Simple single schedule for all appointment types
- US timezone support only
- Block dates without titles/reasons
- Work alongside Google Calendar (both must be free)
- Basic conflict warnings for existing appointments

## 🏗️ Technical Architecture

### Database Design (MongoDB Collections)

#### 1. `firm_availability` Collection
```javascript
{
  _id: ObjectId,
  firm_id: String,
  timezone: String, // e.g., "America/Los_Angeles"
  weekly_schedule: {
    monday: { enabled: Boolean, start_time: String, end_time: String },
    tuesday: { enabled: Boolean, start_time: String, end_time: String },
    wednesday: { enabled: Boolean, start_time: String, end_time: String },
    thursday: { enabled: Boolean, start_time: String, end_time: String },
    friday: { enabled: Boolean, start_time: String, end_time: String },
    saturday: { enabled: Boolean, start_time: String, end_time: String },
    sunday: { enabled: Boolean, start_time: String, end_time: String }
  },
  created_at: Date,
  updated_at: Date
}
```

#### 2. `blocked_dates` Collection
```javascript
{
  _id: ObjectId,
  firm_id: String,
  start_date: Date,
  end_date: Date,
  created_at: Date
}
```

### API Endpoints

#### Availability Management
- `GET /api/v1/integrations/availability` - Get firm availability settings
- `PUT /api/v1/integrations/availability` - Update firm availability settings

#### Blocked Dates Management
- `GET /api/v1/integrations/blocked-dates` - Get blocked dates
- `POST /api/v1/integrations/blocked-dates` - Add blocked date/range
- `DELETE /api/v1/integrations/blocked-dates/{id}` - Remove blocked date

#### Enhanced Booking Logic
- Update existing `get_calendar_availability()` to respect availability + blocked dates
- Add conflict detection for blocked dates vs existing appointments

## 🎨 Frontend Components

### Enhanced Calendar Integration Page
```
/settings/integrations
├── Tab Navigation (Availability | Block-Out Dates)
├── Availability Tab
│   ├── Timezone Selector (US timezones)
│   ├── Weekly Schedule Grid
│   │   ├── Day Toggle Switches
│   │   └── Time Range Inputs (start/end)
│   └── Save Button
└── Block-Out Dates Tab
    ├── Blocked Dates List
    ├── Add Date Range Button
    └── Date Range Cards with Delete Actions
```

### New Components to Create
- `AvailabilityTab.tsx` - Weekly schedule management
- `BlockedDatesTab.tsx` - Date blocking interface  
- `TimeRangeInput.tsx` - Time selection component
- `DateRangePicker.tsx` - Date range selection
- `ConflictWarning.tsx` - Warning for scheduling conflicts

## 🔄 Integration Logic

### Enhanced Availability Flow
```
Client Booking Request
├── Get Firm Availability Settings
├── Get Google Calendar Busy Times  
├── Get Blocked Dates
├── Filter Available Slots:
│   ├── Check if within business hours
│   ├── Check if date is blocked
│   └── Check if calendar is busy
└── Return Filtered Available Slots
```

### Conflict Detection
- When adding blocked dates, check for existing appointments
- Show warning dialog with conflicted appointments
- Allow user to proceed or cancel

## 📱 UI/UX Specifications

### Availability Tab
- **Timezone Dropdown**: US timezones (Pacific, Mountain, Central, Eastern)
- **Weekly Grid**: 7 rows (days) with toggle + time inputs
- **Default Schedule**: Monday-Friday 9:00 AM - 5:00 PM
- **Bulk Actions**: "Set Business Hours" and "Clear All" buttons
- **Auto-save**: Save changes automatically with success feedback

### Block-Out Dates Tab  
- **Date List**: Cards showing "MM/DD/YYYY - MM/DD/YYYY" format
- **Add Button**: Opens date picker modal for single date or range
- **Delete Action**: Trash icon on each card with confirmation
- **Conflict Warning**: Show appointments that would be affected

### Responsive Design
- **Mobile**: Stack days vertically, use native time pickers
- **Tablet**: 2-column layout for availability grid
- **Desktop**: Full horizontal layout as shown in screenshots

## 🚀 Implementation Phases

### Phase 1: Backend Foundation
1. **Create new module**: `backend/app/modules/availability/`
2. **Database models**: Pydantic schemas for availability and blocked dates
3. **API endpoints**: CRUD operations for availability and blocked dates
4. **Enhanced services**: Update existing scheduling logic

### Phase 2: Frontend Components
1. **Tab navigation**: Add tabs to existing integrations page
2. **Availability interface**: Weekly schedule with toggles and time inputs
3. **Blocked dates interface**: List view with add/delete functionality
4. **Form validation**: Client-side validation and error handling

### Phase 3: Integration & Logic
1. **API integration**: Connect frontend to new backend endpoints
2. **Booking logic**: Update availability filtering in booking flow
3. **Conflict detection**: Implement warnings for scheduling conflicts
4. **Testing**: End-to-end testing of availability filtering

### Phase 4: Polish & Deployment
1. **Loading states**: Add spinners and skeleton loading
2. **Error handling**: Comprehensive error messages and recovery
3. **Responsive design**: Mobile and tablet optimizations
4. **Documentation**: Update API docs and user guides

## 🔧 Technical Implementation Details

### Backend Structure
```
backend/app/modules/availability/
├── __init__.py
├── models.py          # Pydantic schemas
├── router.py          # API endpoints
├── services.py        # Business logic
└── schemas.py         # Request/response models
```

### Frontend Structure
```
frontend/src/components/calendar/
├── AvailabilityTab.tsx
├── BlockedDatesTab.tsx
├── TimeRangeInput.tsx
├── DateRangePicker.tsx
└── ConflictWarning.tsx
```

### Database Indexes
```javascript
// firm_availability collection
db.firm_availability.createIndex({ "firm_id": 1 }, { unique: true })

// blocked_dates collection  
db.blocked_dates.createIndex({ "firm_id": 1 })
db.blocked_dates.createIndex({ "start_date": 1, "end_date": 1 })
```

## 📊 Data Flow Examples

### Setting Availability
```
User sets Monday 9AM-5PM
├── Frontend validates time format
├── API call: PUT /api/v1/integrations/availability
├── Backend updates firm_availability collection
├── Success response with updated settings
└── Frontend shows success message
```

### Blocking Dates
```
User blocks July 4-6, 2025
├── Frontend opens date picker modal
├── User selects date range
├── API call: POST /api/v1/integrations/blocked-dates
├── Backend checks for conflicts
├── Shows warning if appointments exist
├── User confirms or cancels
└── Backend saves blocked date range
```

### Client Booking Flow
```
Client requests available slots
├── API call: GET /api/v1/public/availability/{firm_id}
├── Backend gets firm availability settings
├── Backend gets Google Calendar busy times
├── Backend gets blocked dates
├── Filter slots: business_hours AND !calendar_busy AND !blocked
└── Return available slots to client
```

## ✅ Success Criteria

1. **Availability Management**: Law firms can set weekly business hours
2. **Date Blocking**: Law firms can block specific dates/ranges
3. **Integration**: Blocked dates and hours respected in client booking
4. **Conflict Detection**: Warnings shown for existing appointment conflicts
5. **User Experience**: Intuitive interface matching provided screenshots
6. **Performance**: Fast loading and responsive interactions
7. **Mobile Support**: Fully functional on mobile devices

## 🔍 Testing Strategy

### Unit Tests
- Availability filtering logic
- Date range validation
- Conflict detection algorithms

### Integration Tests  
- API endpoint functionality
- Database operations
- Google Calendar integration

### E2E Tests
- Complete booking flow with availability restrictions
- Availability settings persistence
- Blocked date management workflow

---

**Implementation Timeline**: 3-4 days
**Priority**: High - Core booking functionality enhancement
**Dependencies**: Existing Google Calendar integration, MongoDB, shadcn/ui components