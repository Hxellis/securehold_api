import express from "express";
import { adminsModel, pendingApprovalsModel, signupCodesModel, forgetCodesModel } from '../../models/models.js'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import errorMessage from "../../apiErrorMessage.js";

dotenv.config()

export const admins  = express.Router()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.email,
      pass: process.env.google_app_password,
    },
});

admins.post("/login", async (req, res) => {
    const user = await adminsModel.findOne({username: req.body.username})
    .catch( (e) => {
        return errorMessage(e, res)
    })
    if (!user) {
        //status 200 here to prevent frontend axios reading as API failed
        return res.status(200).json({
            status: 401,
            error: "User not found"
        })
    } 

    const inputPass = crypto.pbkdf2Sync(req.body.password, user.salt, 1000, 64, "sha512").toString('hex')
    if (inputPass == user.hash) {

        const signUser = user.toObject()
        delete signUser.hash
        delete signUser.salt
        const token = jwt.sign(signUser, process.env.JWT_KEY, { expiresIn: '12h' })
        return res
        .header('Access-Control-Allow-Credentials', true)
        .setHeader('Cache-Control', 'no-store')
        .cookie('access_token',token,{
            expires: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
            httpOnly: true,
            domain: 'localhost',
            secure: true,
            sameSite: 'none',
        })
        .status(200)
        .json({
            status: 200,
            error: "Login successful"
        })
    }
    return  res.status(200).json({
        status: 401,
        error: "Invalid Password"
    })
})

admins.post("/submitApproval", async (req, res) => {
    const username = req.body.username
    const email = req.body.email
    const password = req.body.password
    const code = req.body.code

    //email checking
    const existingEmail = await adminsModel.findOne({ email: email })
    .catch( (e) => {
        return errorMessage(e, res)
    })
    if (existingEmail) {
        return res.status(200).json({
            status: 409,
            error: "Email already in use"
        })
    }
    
    //verification code check
    const signupCodes = await signupCodesModel.findOne( { email: email })
    .catch( (e) => {
        return errorMessage(e,res)
    })
    if (!signupCodes) {
        return res.status(200).json({
            status: 400,
            msg: "Verification code was never sent"
        })
    }
    if (signupCodes.code !== code) {
        return res.status(200).json({
            status: 401,
            msg: "Verification code not matching"
        })
    }
    const expiryTime = 10 * 60 * 1000
    if ((Date.now() - signupCodes.timestamp) > expiryTime) {
        return res.status(200).json({
            status: 401,
            msg: "Verification code expired"
        })
    }
    await signupCodesModel.findOneAndDelete({ email: email })

    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString('hex')

    const newAdmin = {
        username: username,
        email: email,
        hash: hash,
        salt: salt
    }

    await pendingApprovalsModel.create(newAdmin)
    .then((data) => {
        return res.status(200).json({
            status: 200,
            error: "Admin sent for approval",
            user: data
        })
    })
    .catch((e) => {
        return errorMessage(e, res)
    })
})

admins.post("/sendCode", async (req, res) => {
    const email = req.body.email

    const existingEmail = await signupCodesModel.findOne({ email: email })
    .catch( (e) => {
        return errorMessage(e, res)
    })
    if (existingEmail) {
        await signupCodesModel.findOneAndDelete({ email: email })
    }

    // 6 is the current code length
    const code = crypto.randomBytes(Math.ceil(6 * 3 / 4)).toString('base64').slice(0, 6).replace(/\+/g, '0').replace(/\//g, '0');
    const currentTime = Date.now()
    await signupCodesModel.create({ email: email, code: code, timestamp: currentTime})
    .catch( (e) => {
        return errorMessage(e, res)
    }) 

    transporter.sendMail({
		from: {
			name: 'Securehold',
			address: process.env.email
		},
		to: email,
		subject: "Securehold Security Code",
		text: "Your code is " + code,
		html: `
        <table style="width: 100%; border: 5px solid black; border-radius: 20px; padding: 50px; text-align: center; font-family: 'Trebuchet MS';">
            <tr>
                <td style=" font-size: 30px;">
                    Your code for registering is:
                </td>
            </tr>
            <tr>
                <td style="padding-top:20px; font-size: 40px; font-weight: bold;">
                    ${code}
                </td>
            </tr>
            <tr>
                <td style="padding-top:50px; font-size: 15px">
                    The code will last for 10 minutes, make sure to finish registration by then.
                </td>
            </tr>
        </table>
    `})
    .catch ( (e) => {
        return errorMessage(e, res)
    })

    return res.status(200).json({
        status: 200,
        error: "Code sent to email",
        email: email,
    })
})


admins.post("/sendForgetCode", async (req, res) => {
    const email = req.body.email

    const existingEmail = await forgetCodesModel.findOne({ email: email })
    .catch( (e) => {
        return errorMessage(e, res)
    })
    if (existingEmail) {
        await forgetCodesModel.findOneAndDelete({ email: email })
    }

    const code = crypto.randomBytes(Math.ceil(6 * 3 / 4)).toString('base64').slice(0, 6).replace(/\+/g, '0').replace(/\//g, '0');
    const currentTime = Date.now()
    await forgetCodesModel.create({ email: email, code: code, timestamp: currentTime})
    .catch( (e) => {
        return errorMessage(e, res)
    })

    transporter.sendMail({
		from: {
			name: 'Securehold',
			address: process.env.email
		},
		to: email,
		subject: "Securehold Security Code",
		text: "Your code is " + code,
		html: `
        <table style="width: 100%; border: 5px solid black; border-radius: 20px; padding: 50px; text-align: center; font-family: 'Trebuchet MS';">
            <tr>
                <td style=" font-size: 30px;">
                    Your code for resetting your password is:
                </td>
            </tr>
            <tr>
                <td style="padding-top:20px; font-size: 40px; font-weight: bold;">
                    ${code}
                </td>
            </tr>
            <tr>
                <td style="padding-top:50px; font-size: 15px">
                    The code will last for 10 minutes, make sure to finish reset process by then.
                </td>
            </tr>
        </table>
    `})
    .catch ( (e) => {
        return errorMessage(e, res)
    })

    return res.status(200).json({
        status: 200,
        error: "Code sent to email",
        email: email,
    })
})

admins.post("/resetPassword", async (req,res) => {
    const email = req.body.email
    const password = req.body.password
    const code = req.body.code

    //email checking
    const existingEmail = await adminsModel.findOne({ email: email })
    .catch( (e) => {
        return errorMessage(e, res)
    })
    if (!existingEmail) {
        return res.status(200).json({
            status: 409,
            error: "Email not registered"
        })
    }
    
    //verification code check
    const signupCodes = await forgetCodesModel.findOne( { email: email })
    .catch( (e) => {
        return errorMessage(e,res)
    })
    if (!signupCodes) {
        return res.status(200).json({
            status: 400,
            msg: "Verification code was never sent"
        })
    }
    if (signupCodes.code !== code) {
        return res.status(200).json({
            status: 401,
            msg: "Verification code not matching"
        })
    }
    const expiryTime = 10 * 60 * 1000
    if ((Date.now() - signupCodes.timestamp) > expiryTime) {
        return res.status(200).json({
            status: 401,
            msg: "Verification code expired"
        })
    }
    await forgetCodesModel.findOneAndDelete({ email: email })

    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString('hex')

    await adminsModel.findOneAndUpdate({email: email}, { $set: { hash: hash, salt: salt}})
    .then((data) => {
        return res.status(200).json({
            status: 200,
            error: "Admin password updated",
            user: data
        })
    })
    .catch((e) => {
        return errorMessage(e, res)
    })
})

