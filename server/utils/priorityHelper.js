const sortByPriority = (tasks)=>{

  const order = {High:1,Medium:2,Low:3};

  return tasks.sort((a,b)=>order[a.priority]-order[b.priority]);
};

module.exports = sortByPriority;