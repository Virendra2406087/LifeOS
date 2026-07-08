import React from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { format, subDays } from "date-fns";

export default function ProductivityHeatmap({ tasks }) {

  const today = new Date();
  const startDate = subDays(today, 90);

  const data = {};

  tasks.forEach(task => {

    if (!task.date) return;

    const d = format(new Date(task.date), "yyyy-MM-dd");

    if (!data[d]) data[d] = 0;

    if (task.completed) data[d] += 1;

  });

  const heatmapData = Object.keys(data).map(date => ({
    date,
    count: data[date]
  }));

  return (

    <div className="glass-card">

      <h3>🔥 Productivity Heatmap</h3>

      <CalendarHeatmap
        startDate={startDate}
        endDate={today}
        values={heatmapData}
        classForValue={(value) => {
          if (!value) return "color-empty";
          if (value.count >= 4) return "color-github-4";
          if (value.count >= 3) return "color-github-3";
          if (value.count >= 2) return "color-github-2";
          return "color-github-1";
        }}
      />

    </div>
  );
}