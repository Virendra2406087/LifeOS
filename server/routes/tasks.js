router.post("/tasks", async (req, res) => {

  try {

    console.log("BODY:", req.body); // debug

    const task = new Task(req.body);

    const savedTask = await task.save();

    res.json(savedTask);

  } catch (error) {

    console.error(error);

    res.status(500).json({ error: error.message });

  }

});