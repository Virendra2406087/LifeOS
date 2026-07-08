const ProductivityStat = require("../models/ProductivityStat");

exports.getStats = async(req,res)=>{

  const stats = await ProductivityStat.find({user:req.user.id});

  res.json(stats);

};