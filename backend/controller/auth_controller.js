// const User = require("../models/user_model");
// const catchAsync = require("./../utils/catchAsync");
// const jwt=require('jsonwebtoken');
// const AppError=require('./../utils/appError');

// const signToken = id => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN
//   });
// };


// exports.signup=catchAsync(async(req,res,next)=>{
    
//   const newUser=await User.create({name:req.body.name,
//       email:req.body.email,
//       password:req.body.password,
//       passwordConfirm:req.body.passwordConfirm});

//   const token=signToken(newUser._id);

//   console.log(newUser);
//   res.status(200).json({
//       status:'success',
//       token
//   });
// });

// exports.signin= catchAsync (async (req,res,next)=>{
//   const {email,password}=req.body;

//   //1.email&password exist
//   if(!email || !password)
//   {
//       return next(new AppError('Please provide email and Password!',400));
//   }

//   const user=await User.findOne({email}).select('+password');
//   console.log(user);
//   //2.user exists and password is correct
//   if (!user || !(await user.correctPassword(password, user.password))) {
//       return next(new AppError('Incorrect email or password', 401));
//     }
//   const token=signToken(user._id);
//   res.status(200).json({
//       status:'success',
//       token
//   });
// });

const User = require("../models/user_model");
const catchAsync = require("./../utils/catchAsync");
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)),

    httpOnly: true, // prevents XSS attacks
    secure: process.env.NODE_ENV === 'production' // only https in production
  };

  console.log('Expires at:', new Date(Date.now() + (90 * 24 * 60 * 60 * 1000)));

  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  createSendToken(newUser, 201, res);
});

exports.signin = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and Password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};
