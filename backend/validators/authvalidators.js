const {body} = require("express-validator");

const loginValidator = () =>{
    return [
        body("username","Enter a valid username").notEmpty(),
        body("password", "Password atleast 5 charactor").isLength({min : 5})
    ];
};

const singupValidator = () =>{
    return [
        body("username", "Username atleast 3 charactor.").isLength({min : 3}),
        body("email", "Enter a valid Email").isEmail(),
        body("password", "password atleast 5 charactor").isLength({min : 5})
    ]
}

module.exports = {
    loginValidator,
    singupValidator
}