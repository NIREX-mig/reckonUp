const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const EventResponse = require("./EventResponse");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const sendForgotPasswordEmail = require("./sendEmail");
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

log.transports.file.level = 'info';
autoUpdater.logger = log;

// common variables
const URI = 'mongodb://localhost:27017/';
const client = new MongoClient(URI);
const tempSecret = 'sdkfjasdkjfsifuoewfosadhfksdjfdjfdskjfue0iweu09230';

// common function
function genrateOtp(length) {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

async function connectToDb() {
  await client.connect();
}

let win;

const createWindow = () => {
  win = new BrowserWindow({
    title: "ReckonUp (Developed By Nirex)",
    width: 1366,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
    },
    icon: path.join(__dirname, './assets/reckonUp_256x256.ico')
  });
  // win.loadFile(path.join(__dirname, "./build/index.html"));
  win.loadURL("http://localhost:3000");
  win.removeMenu();
  win.setMinimumSize(1300, 750);
  win.webContents.openDevTools();
};

app.whenReady().then(() => {

  connectToDb();
  // Expose events using IPC
  // -----------------------------
  //     User Events
  // -----------------------------
  ipcMain.on('login', async (event, args) => {
    try {
      const db = client.db('reckonup');
      const collection = db.collection('users');

      // finding the user
      const user = await collection.findOne({ username: args.username });

      if (!user) {
        throw new EventResponse(false, 'Invalid Credential!');
      }

      // check the password
      const isPasswordCorrect = await bcrypt.compare(args.password, user.password);

      if (!isPasswordCorrect) {
        throw new EventResponse(false, 'Invalid Credential!');
      }
      
      // create response and emmit event
      const response = new EventResponse(true, 'Login successfully.', user);
      event.sender.send('login', response);
    } catch (err) {
      event.reply('login', err);
    }
  });

  // ForgotPassword email send Event
  ipcMain.on('forgotpasswordemail', async (event, args) => {
    try {
      const db = client.db('reckonup');
      const { username } = args;

      // connecting with database
      const collection = db.collection('users');

      // finding the user
      const user = await collection.findOne({ username });

      if (!user) {
        throw new EventResponse(false, 'Invalid Username!');
      }

      // Genrate otp
      const otp = genrateOtp(6);

      // send forgot password email
      sendForgotPasswordEmail(user.email, user.username, otp);

      // create otp hash
      const salt = await bcrypt.genSalt(10);
      const otphash = await bcrypt.hash(otp.toString(), salt);

      // genrate token for forgot email
      const payload = {
        id: user._id,
        username : user.username
      };

      const tempToken = jwt.sign(payload, tempSecret, {
        expiresIn: '10m',
      });

      // update otphash in database
      await collection.updateOne({ username }, { $set: { forgotOtpHash: otphash } });

      // create response and emmit event
      const response = new EventResponse(true, 'Otp Sent To Your Email.', tempToken);
      event.sender.send('forgotpasswordemail', response);
    } catch (err) {
      event.sender.send('forgotpasswordemail', err);
    }
  });

  // validate otp Event
  ipcMain.on('validateotp', async (event, args) => {
    try {
      const { otp, token } = args;

      const db = client.db('reckonup');
      const collection = db.collection('users');

      // decord the token
      const decoredeToken = jwt.verify(token, tempSecret);

      // finding the user
      const user = await collection.findOne({ username: decoredeToken.username });

      if(!user) {
        throw new EventResponse(false, "Something Went Wrong!")
      }

      // compair otp hash
      const isOtpCorrect = await bcrypt.compare(otp, user?.forgotOtpHash);

      if (!isOtpCorrect) {
        throw new EventResponse(false, 'Incorrect Opt!');
      }

      // update otp validation in database
      collection.updateOne(
        { username: decoredeToken.username },
        { $set: { otpValidation: 'success' } }
      );

      // create response and emmit event
      const response = new EventResponse(true, 'success');
      event.sender.send('validateotp', response);
    } catch (err) {
      event.sender.send('validateotp', err);
    }
  });

  // forgot password Event
  ipcMain.on('forgotpassword', async (event, args) => {
    try {
      const { newpassword, token } = args;

      const db = client.db('reckonup');
      const collection = db.collection('users');

      if (!token) {
        throw new EventResponse(false, 'Unautherized Access!');
      }
      // decord the token
      const decoredeToken = jwt.verify(token, tempSecret);

      // finding the user
      const user = await collection.findOne({ username: decoredeToken.username });

      if (!user) {
        throw new EventResponse(false, 'Unautherized Access!');
      }

      if (!user.otpValidation) {
        throw new EventResponse(false, 'Unautherized Access!');
      }
      
      // create hash of new password 
      const salt = await bcrypt.genSalt(10);
      const hashPass = await bcrypt.hash(newpassword,salt);

      // update password
      await collection.updateOne(
        { username: decoredeToken.username },
        { $set: { password: hashPass } }
      );

      // remove password hash and otpvalidation
      await collection.updateOne(
        { username: decoredeToken.username },
        {
          $unset: {
            forgotOtpHash: 1,
            otpValidation: 1,
          },
        },
        {
          new: true,
        }
      );

      // create response and emmit event
      const response = new EventResponse(true, 'Successfully Changed Password.');
      event.sender.send('forgotpassword', response);
    } catch (err) {
      event.sender.send('forgotpassword', err);
    }
  });

  // -----------------------------
  //     Invoice Events
  // ----------------------------

  ipcMain.on('createinvoice', async (event, args) => {
    try {
      const { fullInvoiceData } = args;

      const db = client.db('reckonup');
      const collection = db.collection('invoices');

      // create invoice object
      const invoiceObj = {
        customerName: fullInvoiceData.customerName,
        customerPhone: fullInvoiceData.customerPhone,
        customerAddress: fullInvoiceData.customerAddress,
        invoiceNo: fullInvoiceData.invoiceNo,
        productList: fullInvoiceData.productList,
        grossAmt: fullInvoiceData.grossAmt,
        makingCost: fullInvoiceData.makingCost,
        netAmt: fullInvoiceData.netAmt,
        GST: fullInvoiceData.GST,
        gstAmt: fullInvoiceData.gstAmt,
        sgst: fullInvoiceData.sgst,
        cgst: fullInvoiceData.cgst,
        exchangeAmt: fullInvoiceData.exchangeAmt,
        exchangeCategory: fullInvoiceData.exchangeCategory,
        exchangePercentage: fullInvoiceData.exchangePercentage,
        exchangeWeight: fullInvoiceData.exchangeWeight,
        createdAt : new Date()
      };

      const invoice = await collection.insertOne(invoiceObj);

      // create response and emmit event
      const response = new EventResponse(true, 'Invoice Saved SuccessFully.');
      event.sender.send('createinvoice', response);
    } catch (err) {
      event.sender.send('createinvoice', err);
    }
  });

  // fetch invoice by InvoiceNo Event
  ipcMain.on('fetchbyinvoiceno', async (event, args) => {
    try {
      const { invoiceNo } = args;

      const db = client.db('reckonup');
      const collection = db.collection('invoices');

      // find invoice
      const invoice = await collection.find({ invoiceNo }).toArray();


      if (!invoice || invoice.length === 0) {
        throw new EventResponse(false, 'Invalid Invoice Number!');
      }

      // create response and emmit event
      const response = new EventResponse(true, 'Success', invoice);
      event.sender.send('fetchbyinvoiceno', response);
    } catch (err) {
      event.sender.send('fetchbyinvoiceno', err);
    }
  });

  // fetch invoice by Customer name Event
  ipcMain.on('fetchbycustomername', async (event, args) => {
    try {
      const { customerName } = args;

      const db = client.db('reckonup');
      const collection = db.collection('invoices');

      // find invoice
      const invoices = await collection.find({ customerName }).toArray();

      if (!invoices || invoices.length === 0) {
        throw new EventResponse(false, 'Invalid Customer Name!');
      }

      // create response and emmit event
      const response = new EventResponse(true, 'Success', invoices);
      event.sender.send('fetchbycustomername', response);
    } catch (err) {
      event.sender.send('fetchbycustomername', err);
    }
  });

  // fetch invoice by date Range Event
  ipcMain.on('fetchbydaterange', async (event, args) => {
    try {
      const { startingDate, endingDate } = args;

      const db = client.db('reckonup');
      const collection = db.collection('invoices');

      // create date
      const start = new Date(startingDate);
      const end = new Date(endingDate);

      // find invoice
      const filter = {
        createdAt: {
          $gte: new Date(start),
          $lte: new Date(end),
        },
      };

      const invoices = await collection.find(filter).toArray();

      // create response and emmit event
      const response = new EventResponse(true, 'Success', invoices);
      event.sender.send('fetchbydaterange', response);
    } catch (err) {
      event.sender.send('fetchbydaterange', err);
    }
  });

  // // fetch today invoice Event
  ipcMain.on('fetchtodayinvoice', async (event) => {
    try {
      const db = client.db('reckonup');
      const collection = db.collection('invoices');

      // create today date
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      // find invoice
      const filter = {
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        }
      };

      const invoices = await collection.find(filter).toArray();
 
      // create response and emmit event
      const response = new EventResponse(true, 'Success', invoices);
      event.sender.send('fetchtodayinvoice', response);
    } catch (err) {
      event.sender.send('fetchtodayinvoice', err);
    }
  });

  // total count of invoice Event
  ipcMain.on('totalcountofinvoice', async (event) => {
    try {

      const db = client.db('reckonup');
      const collection = db.collection('invoices');

      // count invoice
      const count = await collection.countDocuments();

      // create response and emmit event
      const response = new EventResponse(true, 'Success', count);
      event.sender.send('totalcountofinvoice', response);

    } catch (err) {

      event.sender.send('totalcountofinvoice', err);

    }
  });

  // tracks Event
  ipcMain.on('tracks', async (event) => {
    try {
      const db = client.db('reckonup');
      const collection = db.collection('invoices');

      // create date
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

      let todayTracks = await collection.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalTodayAmt: { $sum: '$netAmt' },
            totalTodayInvoice: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]).toArray();

      const lastMonthTrack = await collection.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startOfLastMonth,
              $lt: startOfCurrentMonth,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalLastMonthAmt: { $sum: '$netAmt' },
            totalLastMonthInvoice: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]).toArray();

      const tracksData = {
        totalTodayAmt: todayTracks[0]?.totalTodayAmt,
        totalTodayInvoice: todayTracks[0]?.totalTodayInvoice,
        totalLastMonthAmt: lastMonthTrack[0]?.totalLastMonthAmt,
        totalLastMonthInvoice: lastMonthTrack[0]?.totalLastMonthInvoice,
      };

      // create response and emmit event
      const response = new EventResponse(true, 'Success', tracksData);
      event.sender.send('tracks', response);
    } catch (err) {
      event.sender.send('tracks', err);
    }
  });

  // -----------------------------
  //     Setting Events
  // ----------------------------

  ipcMain.on('createsetting', async (event, args) => {
    try {
      const { ownerName, mobileNumber, whatsappNumber, address, GSTNO } = args;

      const db = client.db('reckonup');
      const collection = db.collection('settings');

      // check existed setting
      const existedSetting = await collection.findOne({ ownerName });

      if (existedSetting) {
        await collection.updateOne(
          { ownerName },
          {
            $set: {
              ownerName,
              mobileNumber,
              whatsappNumber,
              address,
              GSTNO,
            },
          }
        );

        const response = new EventResponse(true, 'Updated Successfully');
        event.sender.send('createsetting', response);
      }

      const settingData = {
        ownerName: ownerName,
        mobileNumber: mobileNumber,
        whatsappNumber: whatsappNumber,
        address: address,
        GSTNO: GSTNO,
        createdAt : new Date()
      };

      await collection.insertOne(settingData);

      // create response and emmit event
      const response = new EventResponse(true, 'Updated Successfully.');
      event.sender.send('createsetting', response);
    } catch (err) {
      event.sender.send('createsetting', err);
    }
  });

  // fetch setting Event
  ipcMain.on('fetchsetting', async (event) => {
    try {

      const db = client.db('reckonup');
      const collection = db.collection('settings');

      const setting = await collection.find().toArray();

      const newSetting = setting[0];

      if (setting.length === 0) {
        throw new EventResponse(false, 'something went wrong!');
      }

      // create response and emmit event
      const response = new EventResponse(true, 'Success', newSetting);
      event.sender.send('fetchsetting', response);
    } catch (err) {
      event.sender.send('fetchsetting', err);
    }
  });

  // invoice logo update Event
  ipcMain.on('invoicelogupdate', async (event, args) => {
    try {
      const { filedata } = args;

      const db = client.db('reckonup');
      const collection = db.collection('settings');

      const setting = await collection.find().toArray();

      if (setting.length === 0) {
        throw new EventResponse(false, 'something went wrong!');
      }

      if (!setting[0]?.invoiceLogo) {
        await collection.updateOne(
          { ownerName: setting[0].ownerName },
          { $set: { invoiceLogo: filedata.toString() } }
        );

        const response = new EventResponse(
          true,
          'Successfully logo update.',
          filedata.toString()
        );
        event.sender.send('invoicelogupdate', response);
      }

      await collection.updateOne(
        { ownerName: setting[0].ownerName },
        { $set: { invoiceLogo: filedata.toString() } }
      );

      // create response and emmit event
      const response = new EventResponse(
        true,
        'Successfully logo update.',
        filedata.toString()
      );

      event.sender.send('invoicelogupdate', response);
    } catch (err) {
      event.sender.send('invoicelogupdate', err);
    }
  });

  // fetch invoice logo Event
  ipcMain.on('fetchinvoicelogo', async (event) => {
    try {

      const db = client.db('reckonup');
      const collection = db.collection('settings');

      const setting = await collection.find().toArray();
      const filedata = setting[0].invoiceLogo;

      if (!filedata) {
        throw new EventResponse(false);
      }

      // create response and emmit event
      const response = new EventResponse(true, 'Success', filedata);
      event.sender.send('fetchinvoicelogo', response);
    } catch (err) {
      event.sender.send('fetchinvoicelogo', err);
    }
  });

  createWindow();

  autoUpdater.checkForUpdatesAndNotify();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  app.on("quit", () => {
    client.close();
  })
}).catch((error) => {
  console.log(error)
})

autoUpdater.on('update-available', () => {
  log.info('Update available.');
});

autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
  log.info('Update downloaded.');
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? releaseNotes : releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  };

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
  });
});

autoUpdater.on('error', (message) => {
  log.error('There was a problem updating the application');
  log.error(message);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
});