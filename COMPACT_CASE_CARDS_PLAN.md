# Compact Case Cards with AI Recommendations - Implementation Plan

## Overview
Create ultra-compact case cards for the Kanban board that show only essential information and AI recommendations.

## Updated Design Requirements
Based on user feedback:
- **Remove**: Priority badges and status badges (status shown by column)
- **Layout**: Client name at top, AI recommendation badge below
- **Action Button**: Small button in top-right corner
- **AI Badge**: Positioned below client name with tooltip

## Visual Layout
```
┌─────────────────────────────────┐
│ Client Name            [Action] │
│ 🧠 AI Recommendation            │
└─────────────────────────────────┘
```

## Components to Create

### 1. AIRecommendationBadge.tsx
- Display AI recommendation with brain icon
- Color coding: Green (approve), Red (reject), Yellow (undecided)
- Tooltip with AI summary and confidence score
- Handle loading and error states

### 2. CompactCaseCard.tsx
- Minimal layout with client name and AI badge
- Small action button for status changes
- Hover effects and drag/drop functionality
- Click to navigate to case details

### 3. hooks/useAIInsights.ts
- Custom hook to fetch AI insights for multiple cases
- Batch API calls for efficiency
- Caching and error handling
- Loading states management

## Data Structure Updates

### AI Insight Interface (already exists)
```typescript
interface AIInsight {
  case_id: string;
  summary: string;
  recommendations: string;
  recommendation_type: 'approve' | 'reject' | 'undecided';
  confidence_score: number;
  generated_at: string;
  status: 'processing' | 'completed' | 'failed';
}
```

### Extended Case Interface
```typescript
interface Case {
  // existing fields...
  ai_insight?: AIInsight;
}
```

## Implementation Steps

1. **Create AIRecommendationBadge component**
   - Brain icon with color-coded background
   - Tooltip with AI details
   - Handle no-insight state

2. **Create useAIInsights hook**
   - Fetch insights for array of case IDs
   - Return loading states and data
   - Cache results to avoid re-fetching

3. **Create CompactCaseCard component**
   - Ultra-minimal design
   - Integrate AI badge
   - Maintain drag/drop and click functionality

4. **Update KanbanBoard**
   - Replace existing cards with compact version
   - Integrate AI insights fetching
   - Handle loading states

5. **Test and refine**
   - Ensure proper spacing and alignment
   - Verify AI recommendations display correctly
   - Test drag/drop functionality

## API Integration
- Use existing `/api/v1/ai/insights/{caseId}` endpoint
- Batch requests for multiple cases
- Handle 404 responses (no insights available)
- Cache responses to improve performance

## Styling Approach
- Use existing Tailwind classes for consistency
- Maintain hover and focus states
- Ensure accessibility with proper ARIA labels
- Responsive design for different screen sizes