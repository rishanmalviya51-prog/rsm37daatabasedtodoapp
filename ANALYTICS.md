# Lumina Habits Analytics

## 1. BigQuery SQL Queries

Assumes the following schema:
- **`analytics.habit_logs`**: `log_id` (STRING), `user_id` (STRING), `habit_id` (STRING), `event_timestamp` (TIMESTAMP), `value` (FLOAT)
- **`analytics.habits`**: `habit_id` (STRING), `user_id` (STRING), `title` (STRING), `target_value` (FLOAT), `created_at` (TIMESTAMP)

### A. Current Streak Calculation
Calculates the consecutive days a user has logged at least one event for a specific habit.

```sql
WITH daily_logs AS (
  SELECT
    user_id,
    habit_id,
    DATE(event_timestamp) as log_date
  FROM `project.analytics.habit_logs`
  GROUP BY 1, 2, 3
),
streak_groups AS (
  SELECT
    user_id,
    habit_id,
    log_date,
    -- Create a 'group' identifier. If dates are consecutive, date - row_number will be constant.
    DATE_SUB(log_date, INTERVAL ROW_NUMBER() OVER (PARTITION BY user_id, habit_id ORDER BY log_date) DAY) as grp
  FROM daily_logs
)
SELECT
  user_id,
  habit_id,
  COUNT(*) as current_streak_days,
  MAX(log_date) as last_log_date
FROM streak_groups
GROUP BY user_id, habit_id, grp
-- Only keep the group that includes 'yesterday' or 'today' to represent an active streak
HAVING last_log_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
ORDER BY current_streak_days DESC;
```

### B. Weekly Completion Rate
Percentage of target hits over the last 7 days.

```sql
WITH date_range AS (
  SELECT date FROM UNNEST(GENERATE_DATE_ARRAY(DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY), CURRENT_DATE())) as date
),
daily_totals AS (
  SELECT
    h.user_id,
    h.habit_id,
    h.target_value,
    d.date,
    COALESCE(SUM(l.value), 0) as total_value
  FROM `project.analytics.habits` h
  CROSS JOIN date_range d
  LEFT JOIN `project.analytics.habit_logs` l
    ON h.habit_id = l.habit_id AND DATE(l.event_timestamp) = d.date
  GROUP BY 1, 2, 3, 4
)
SELECT
  user_id,
  habit_id,
  ROUND(SAFE_DIVIDE(COUNTIF(total_value >= target_value), 7) * 100, 1) as completion_rate_pct
FROM daily_totals
GROUP BY 1, 2;
```

---

## 2. Looker Studio Dashboard Layout

### **Theme: Golden Age & Solar**
- **Background**: Bone White (`#FDFCF8`) or Dark Graphite (`#050505`).
- **Accent Colors**: Amber (`#F59E0B`), Cyan (`#06B6D4`), Rose (`#F43F5E`).
- **Font**: Inter or Roboto.

### **Layout Grid (Bento Style)**

**Row 1: High-Level KPIs (Scorecards)**
1.  **Total Active Habits**: (Count distinct `habit_id` where `status = active`).
2.  **Global Completion Rate**: (Avg of all completion rates). Big bold number with sparkline.
3.  **Longest Active Streak**: (Max streak days). Display habit name below number.

**Row 2: User Engagement (Time Series)**
1.  **Daily Logs (Last 30 Days)**: Bar chart.
    *   *Dimension*: Date.
    *   *Metric*: Count of logs.
    *   *Color*: Gradient Blue to Cyan.
    *   *Interaction*: Brush to zoom.
2.  **Habit Heatmap**: Pivot Table / Heatmap.
    *   *Rows*: Habit Name.
    *   *Columns*: Day of Week (Mon-Sun).
    *   *Metric*: Avg Completion %.
    *   *Style*: Red (0%) to Green (100%).

**Row 3: Deep Dive (Table)**
1.  **Detailed Habit Performance**:
    *   Columns: `Habit Name`, `Category`, `Current Streak`, `Last 7 Days (Mini Bar Chart)`, `Completion %`.
    *   Sort by: Streak DESC.

### **Interactivity**
- **Date Range Control**: Top right. Defaults to "Last 28 Days".
- **Category Filter**: Dropdown (Health, Learning, Work).
