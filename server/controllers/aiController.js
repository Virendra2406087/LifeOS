const {optimizeTasks} = require("../services/aiService");

exports.optimize = (req,res)=>{

  const optimized = optimizeTasks(req.body.tasks);

  res.json(optimized);

};