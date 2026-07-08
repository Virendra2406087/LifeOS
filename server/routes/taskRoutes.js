const router     = require("express").Router();
const controller = require("../controllers/taskController");
const auth       = require("../middleware/authMiddleware");

// All task routes require a valid token
router.get("/",    auth, controller.getTasks);
router.post("/",   auth, controller.createTask);
router.delete("/:id", auth, controller.deleteTask);
router.patch("/:id",  auth, controller.completeTask);

module.exports = router;