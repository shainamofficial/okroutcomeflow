
# Fix Timeline View Filter Logic

## Problem

The zoom level logic is inverted. The view selector names don't match what each column represents:

| View Selected | What User Expects | What Currently Happens |
|---------------|-------------------|------------------------|
| Weekly | 1 column = 1 week | 1 column = 1 day |
| Monthly | 1 column = 1 month | 1 column = 1 week |
| Quarterly | 1 column = 1 quarter | 1 column = 1 month |

## Solution

Update the `TimelineChart.tsx` to correctly map zoom levels to column intervals:

### Column Generation Changes

| View | Column Interval | Header Format | Column Width |
|------|-----------------|---------------|--------------|
| Weekly | `eachWeekOfInterval` | "Jan 6" (week start date) | 100px |
| Monthly | `eachMonthOfInterval` | "Jan 2026" | 120px |
| Quarterly | `eachQuarterOfInterval` (new import) | "Q1 2026" | 150px |

### Date Range Padding

Adjust the padding around min/max dates to match the new granularity:
- Weekly: Pad by 1-2 weeks
- Monthly: Pad by 1-2 months  
- Quarterly: Pad by 1 quarter

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/timeline/TimelineChart.tsx` | Fix zoom level switch logic and add `eachQuarterOfInterval` import |

## Technical Details

```typescript
// Updated switch statement
switch (zoomLevel) {
  case "week":
    // Each column = 1 week
    start = startOfWeek(addDays(minDate, -14), { weekStartsOn: 1 });
    end = endOfWeek(addDays(maxDate, 14), { weekStartsOn: 1 });
    cols = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    colWidth = 100;
    break;
  case "month":
    // Each column = 1 month
    start = startOfMonth(addMonths(minDate, -1));
    end = endOfMonth(addMonths(maxDate, 1));
    cols = eachMonthOfInterval({ start, end });
    colWidth = 120;
    break;
  case "quarter":
    // Each column = 1 quarter (3 months)
    start = startOfQuarter(addMonths(minDate, -3));
    end = endOfQuarter(addMonths(maxDate, 3));
    cols = eachQuarterOfInterval({ start, end });
    colWidth = 150;
    break;
}
```

```typescript
// Updated header formatting
const formatColumnHeader = (date: Date): string => {
  switch (zoomLevel) {
    case "week":
      return format(date, "MMM d");  // "Jan 6"
    case "month":
      return format(date, "MMM yyyy");  // "Jan 2026"
    case "quarter":
      return `Q${Math.ceil((date.getMonth() + 1) / 3)} ${format(date, "yyyy")}`;  // "Q1 2026"
  }
};
```

## Additional Changes

- Import `addMonths` and `eachQuarterOfInterval` from date-fns
- Update "today" highlighting logic to work with the new column granularity (check if today falls within the week/month/quarter)
