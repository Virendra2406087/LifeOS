exports.calculateStats = (tasks)=>{

  const completed = tasks.filter(t=>t.completed).length;

  return {
    total:tasks.length,
    completed
  };

};