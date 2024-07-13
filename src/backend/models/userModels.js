const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        index : true,
    },

    email : {
        type : String, 
        required : true, 
    },

    accessToken : {
        type : String
    },

    forgotOtpHash : {
        type : String
    },

    otpValidation :{
        type : String
    },

    password : {
        type : String,
        required : true,
    }

}, {timestamps : true});

UserSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
};

UserSchema.methods.genrateAccessToken = function(){
    const payload = {
        id : this._id
    }

    return jwt.sign(
        payload,
        "sdkfjasdkjfsifuoewfosadhfksdjfdjfdskjfue0iweu09230[ejr[023-we[09-32",
        {
            expiresIn : "1d"
        }
    );
};


const User = mongoose.model("User", UserSchema);

module.exports = User;