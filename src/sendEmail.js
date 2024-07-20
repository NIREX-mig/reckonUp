const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "jarvis14220@gmail.com",
        pass: "npjbzqmynvkbsjok"
    }
});

const sendForgotPasswordEmail = async (email, username, otp) => {
    try {
        const mailOptions = {
            from: "jarvis14220@gmail.com",
            to: email,
            subject: "Forgot Password",
            html: `
            <h2>HI ${username},</h2>
            <p>There was a request to change your password!</p>
            <p>If you did not make this request then please report in our email : akay93796@gmail.com.</p>
            <p>Otherwise, Do not share the OTP.</p>
            <br>
            <p style="font-weight:bold; font-size: large; ">OTP : ${otp}</p>
            `
        };


        const info = await transporter.sendMail(mailOptions)

        // console.log("Message sent: %s", info.messageId);

    } catch (error) {
        console.log("Some Error occured during sending Email!")
        console.log(error);
    }
}

module.exports = sendForgotPasswordEmail;