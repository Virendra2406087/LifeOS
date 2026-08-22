const Task = require("../models/Task");

exports.syncCalendarTasks = async (events, userId) => {
  let created = 0;

  for (const event of events) {
    const title = event.summary || "Untitled Event";

    const exists = await Task.findOne({
      user: userId,
      text: title,
    });

    if (exists) continue;

    await Task.create({
      user: userId,
      text: title,
      description: event.description || "",
      time: event.start?.dateTime || event.start?.date,
      completed: false,
      priority: "Medium",
      source: "Google Calendar",
    });

    created++;
  }

  return created;
};