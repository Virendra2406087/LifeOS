const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

exports.register = async(req,res)=>{

  const hashed = await bcrypt.hash(req.body.password,10);

  const user = await User.create({
    name:req.body.name,
    email:req.body.email,
    password:hashed
  });

  res.json(user);
};

exports.login = async(req,res)=>{

  const user = await User.findOne({email:req.body.email});

  if(!user) return res.status(400).json("User not found");

  const valid = await bcrypt.compare(req.body.password,user.password);

  if(!valid) return res.status(400).json("Wrong password");

  res.json({
    token:generateToken(user._id)
  });

};