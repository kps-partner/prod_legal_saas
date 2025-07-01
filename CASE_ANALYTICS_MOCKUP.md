# Case Management Analytics - Visual Mockup

## 📊 Analytics Section Layout (Above Kanban Board)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           CASE MANAGEMENT ANALYTICS                             │
│                                                                                 │
│  Time Period: [Last 30 Days ▼]                                    📅 Dec 2024  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ 📊 NEW LEADS│  │ 📅 CONSULTS │  │ ✅ ENGAGED  │  │ 📈 AVG TIME │           │
│  │             │  │             │  │             │  │             │           │
│  │     24      │  │     18      │  │     12      │  │   8.5 days  │           │
│  │             │  │             │  │             │  │             │           │
│  │ Total leads │  │ Scheduled   │  │ Signed      │  │ To engage   │           │
│  │ this period │  │ meetings    │  │ clients     │  │ clients     │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ 🎯 ENGAGE   │  │ 📞 CONSULT  │  │ 📋 PIPELINE │  │ ⏱️ AVG CLOSE│           │
│  │    RATE     │  │    RATE     │  │   VALUE     │  │    TIME     │           │
│  │             │  │             │  │             │  │             │           │
│  │    50%      │  │    75%      │  │   $45,000   │  │  15.2 days  │           │
│  │             │  │             │  │             │  │             │           │
│  │ Conversion  │  │ Show rate   │  │ Potential   │  │ To close    │           │
│  │ to signed   │  │ for meetings│  │ revenue     │  │ cases       │           │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                        📈 SIGNED CLIENTS OVER TIME                             │
│                                                                                 │
│   12 ┤                                                                         │
│      │                                          ●                              │
│   10 ┤                                      ●       ●                         │
│      │                                  ●               ●                     │
│    8 ┤                              ●                       ●                 │
│      │                          ●                               ●             │
│    6 ┤                      ●                                       ●         │
│      │                  ●                                               ●     │
│    4 ┤              ●                                                       ● │
│      │          ●                                                             │
│    2 ┤      ●                                                                 │
│      │  ●                                                                     │
│    0 └──┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬──│
│        Dec1 Dec5 Dec9 Dec13Dec17Dec21Dec25Dec29 Jan2 Jan6 Jan10Jan14Jan18Jan22│
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🎨 Visual Design Specifications

### KPI Cards Design
```
┌─────────────────────┐
│ 🎯 ENGAGE RATE     │  ← Icon + Title (Bold, 14px)
│                     │
│       50%           │  ← Big Number (32px, Bold, Color-coded)
│                     │
│ ↗️ +5% from last    │  ← Trend Indicator (12px, Green/Red)
│   period            │
│                     │
│ Conversion to       │  ← Description (12px, Gray)
│ signed clients      │
└─────────────────────┘
```

### Color Coding
- **New Leads**: Blue (#3B82F6)
- **Consultations**: Orange (#F59E0B) 
- **Engaged Clients**: Green (#10B981) - **HIGHLIGHTED**
- **Time Metrics**: Purple (#8B5CF6)
- **Rates**: Teal (#14B8A6)

### Time Period Selector
```
┌─────────────────────────────────────┐
│ Time Period: [Last 30 Days    ▼]   │
├─────────────────────────────────────┤
│ All Time                            │
│ This Week                           │
│ This Month                          │
│ Last 7 Days                         │
│ Last 30 Days                    ✓   │
│ This Quarter                        │
└─────────────────────────────────────┘
```

## 📱 Responsive Behavior

### Desktop (1200px+)
- 4 columns of KPI cards
- Full-width line chart
- Time selector in top-right

### Tablet (768px - 1199px)
- 2 columns of KPI cards
- Full-width line chart
- Time selector above cards

### Mobile (< 768px)
- 1 column of KPI cards
- Scrollable chart
- Time selector full-width

## 📊 Sample Data Display

### KPI Cards with Real Data
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│📊 NEW LEADS │  │📅 CONSULTS  │  │✅ ENGAGED   │  │📈 AVG TIME  │
│             │  │             │  │             │  │             │
│     24      │  │     18      │  │     12      │  │   8.5 days  │
│             │  │             │  │             │  │             │
│↗️ +12% vs   │  │↗️ +6% vs    │  │↗️ +25% vs   │  │↘️ -2.1 days │
│last period  │  │last period  │  │last period  │  │vs last      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘

┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│🎯 ENGAGE    │  │📞 CONSULT   │  │📋 PIPELINE  │  │⏱️ AVG CLOSE │
│   RATE      │  │   RATE      │  │   VALUE     │  │   TIME      │
│             │  │             │  │             │  │             │
│    50%      │  │    75%      │  │  $45,000    │  │  15.2 days  │
│             │  │             │  │             │  │             │
│↗️ +8% vs    │  │↘️ -3% vs    │  │↗️ +$12K vs  │  │↗️ +1.8 days │
│last period  │  │last period  │  │last period  │  │vs last      │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

## 🔄 Interactive Features

### Hover States
- KPI cards: Subtle shadow and scale effect
- Chart points: Show exact values and dates
- Time selector: Highlight options

### Loading States
- Skeleton placeholders for KPI cards
- Loading spinner for chart
- Shimmer effect during data fetch

### Empty States
- "No data available for selected period"
- Suggestion to "Try a different time range"
- Link to "Set up intake forms" if no cases exist

## 📍 Integration with Existing Page

### Current Page Structure
```
┌─────────────────────────────────────────────────────────────┐
│ [← Back] Case Management                    [Show Archived] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                  🆕 ANALYTICS SECTION                       │
│                     (New Addition)                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    KANBAN BOARD                            │
│                   (Existing)                               │
│                                                             │
│  NEW LEADS  │ SCHEDULED │ REVIEW │ ENGAGED │ CLOSED        │
│             │           │        │         │               │
│    [Card]   │  [Card]   │ [Card] │ [Card]  │  [Card]       │
│    [Card]   │  [Card]   │        │ [Card]  │  [Card]       │
│             │           │        │         │               │
└─────────────────────────────────────────────────────────────┘
```

This mockup shows how the analytics section will integrate seamlessly above the existing Kanban board, providing valuable insights while maintaining the current workflow.