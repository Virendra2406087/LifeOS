exports.generateSchedule = (tasks)=>{

  return tasks.map((t,i)=>({
    ...t,
    order:i
  }));

};