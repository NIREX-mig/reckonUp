const mongoose = require("mongoose");

const connectToDB = async () => {
    try {
        const mongooseInstance = await mongoose.connect("mongodb://0.0.0.0:27017/reckonup");
        console.log(`Mongodb connected successfully. db Host : ${mongooseInstance.connection.host} \n`)
    } catch (error) {
        console.log("Mongodb Connection ERROR: " + error );
        process.exit(1);
    }
}

module.exports = connectToDB;