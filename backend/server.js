const cors = require("cors");
const connectToDB = require("./db/connectToDb.js");
const cookieParser = require("cookie-parser");
const express = require("express");

connectToDB();

const app = express();

app.use(express.json({limit : "1mb"}));
app.use(express.urlencoded({extended : true}))
app.use(cookieParser());

app.use(cors(
    {
        origin: "*",
        credentials: true
    }
));

app.use("/api/v1/auth", require("./routes/userRoutes.js"));
app.use("/api/v1/invoice", require("./routes/invoiceRoutes.js"));
app.use("/api/v1/setting", require("./routes/settingRoutes.js"));


app.listen(8000,() => {
    console.log("server listing at port : 8000");
})