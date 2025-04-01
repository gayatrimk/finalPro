const User = require("../models/user_model");
const catchAsync = require("./../utils/catchAsync");
const jwt=require('jsonwebtoken');
const AppError=require('./../utils/appError');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};


exports.signup=catchAsync(async(req,res,next)=>{
    
  const newUser=await User.create({name:req.body.name,
      email:req.body.email,
      password:req.body.password,
      passwordConfirm:req.body.passwordConfirm});

  const token=signToken(newUser._id);

  console.log(newUser);
  res.status(200).json({
      status:'success',
      token
  });
});

exports.signin= catchAsync (async (req,res,next)=>{
  const {email,password}=req.body;

  //1.email&password exist
  if(!email || !password)
  {
      return next(new AppError('Please provide email and Password!',400));
  }

  const user=await User.findOne({email}).select('+password');
  console.log(user);
  //2.user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }
  const token=signToken(user._id);
  res.status(200).json({
      status:'success',
      token
  });
});