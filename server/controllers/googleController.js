const { syncCalendarTasks } = require("../services/googleTaskService");

exports.importCalendarTasks = async (req, res) => {
  try {
    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await calendar.events.list({
      calendarId: "primary",
      singleEvents: true,
      orderBy: "startTime",
    });

    const total = await syncCalendarTasks(
      response.data.items,
      req.user.id
    );

    res.json({
      success: true,
      imported: total,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Import failed",
    });
  }
};