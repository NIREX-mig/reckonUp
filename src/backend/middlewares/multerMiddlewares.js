const fs = require("fs");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    if (!fs.existsSync(__dirname  + "/invoice/logo")) {

      // If the directory does not exist, create it
      fs.mkdirSync(__dirname + "/invoice/logo", { recursive: true });

      cb(null, __dirname + '/invoice/logo/');

    } else {

      cb(null, __dirname + '/invoice/logo/');
    }

  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({ storage });

module.exports = upload;