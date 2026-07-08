const today = ()=>{

  const d = new Date();

  return d.toISOString().split("T")[0];
};

module.exports = {today};