const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcryptjs');
const userSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:[true,'Please enter your name!']
        },
        email:{
            type:String,
            required:[true,'Please enter your email!'],
            unique:true,
            lowercase:true,
            validate:[validator.isEmail,'Please enter valid email!']
        },
        password:{
            type:String,
            required:[true,'Please enter your password!'],
            minlength:8,
            select:false
        },

        passwordConfirm:{
            type:String,
            required:[true,'Please enter your password!'],
            validate:{
                //only works on create / save
                validator: function(el)
                {
                    return el===this.password;
                },
                message:'Please enter same password'
            }
            
        },
    }
);

userSchema.pre('save',async function(next)
{
    //only run this function if password was actually modified
    if(!this.isModified('password'))
        return next();

    this.password=await bcrypt.hash(this.password,12)

    this.passwordConfirm=undefined;

    next();
});

userSchema.methods.correctPassword = async function(candidatePassword,userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};
const users = mongoose.model("users", userSchema);

module.exports = users;