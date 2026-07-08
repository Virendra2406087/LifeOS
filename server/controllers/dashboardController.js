const Task = require("../models/Task");

exports.getDashboard = async(req,res)=>{

  const tasks = await Task.find({user:req.user.id});

  res.json({
    totalTasks:tasks.length,
    completed:tasks.filter(t=>t.completed).length
  });

};