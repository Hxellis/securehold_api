import express from 'express'
import { usersModel, signupCodesModel, forgetCodesModel } from '../../models/models.js'
import errorMessage from '../../apiErrorMessage.js'
import nodemailer from 'nodemailer'
import crypto from 'crypto'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

export const users  = express.Router()

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

users.get("/", (req, res) => {
    res.status(200).json({
        status: 200,
        msg: "Entered users"
    })
})

users.post("/login", async (req, res) => {
    try {
        const username = req.body.username
        const password = req.body.password


        const user = await usersModel.findOne({ 'web_data.username': username })
        if (!user) {
            return res.status(200).json({
                status: 401,
                error: "User not found"
            })
        } 

        const inputPass = crypto.pbkdf2Sync(password, user.web_data.salt, 1000, 64, "sha512").toString('hex')
        if (inputPass == user.web_data.hash) {
            const loginUser = await usersModel.findOne({ 'web_data.username': username }, { projection: {_id: true}})

            const signUser = loginUser.toObject()
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
    }
    catch(e) { return errorMessage(e, res) }
})

users.post("/signup", async (req, res) => {
    try {
        const phone = req.body.phone
        const username = req.body.username
        const email = req.body.email
        const password = req.body.password
        const code = req.body.code

        const existingEmail = await usersModel.findOne({ web_data: { email: email} })
        if (existingEmail) {
            return res.status(200).json({
                status: 409,
                error: "Email already in use"
            })
        }
        
        const signupCodes = await signupCodesModel.findOne( { email: email })
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
    
        const newUser = {
            username: username,
            email: email,
            hash: hash,
            salt: salt
        }
        const usersWebData = await usersModel.findOneAndUpdate({ phone: phone }, { $set: { 'web_data': newUser}}, { new: true })
        if( usersWebData) {
            return res.status(200).json({
                status: 200,
                msg: "User registered",
            })
        }
    }
    catch (e) {
        return errorMessage(e, res)
    } 
})

users.post("/checkPhoneNumExist", async (req, res) => {
    const phone = req.body.phone

    const user = await usersModel.findOne({ phone: phone })
    .catch ( (e) => { errorMessage(e, res) })

    if (user) {
        if (!user.web_data.user_id) {
            return res.status(200).json({
                status: 200,
                msg: "User can signup"
            })
        }
        return res.status(200).json({
            status: 409,
            msg: "User already registered"
        })
    }
    return res.status(200).json({
        status: 401,
        msg: "User phone number not registered"
    })
})

users.post("/sendCode", async (req, res) => {
    const email = req.body.email

    await signupCodesModel.findOneAndDelete({ email: email })
    .catch( (e) => { errorMessage(e)})

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
    .then( () => {
        return res.status(200).json({
            status: 200,
            error: "Code sent to email",
            email: email,
        })
    })
    .catch ( (e) => {
        return errorMessage(e, res)
    })
})

users.post("/sendForgetCode", async (req, res) => {
    try {
        const email = req.body.email

        await forgetCodesModel.findOneAndDelete({ email: email })
        
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

        return res.status(200).json({
            status: 200,
            error: "Code sent to email",
            email: email,
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }    
})

users.post("/forgotPassword", async (req, res) => {
    try{
        const email = req.body.email
        const password = req.body.password
        const code = req.body.code
    
        //email checking
        const existingEmail = await usersModel.findOne({ 'web_data.email': email })
        if (!existingEmail) {
            return res.status(200).json({
                status: 409,
                error: "Email not registered"
            })
        }
        
        //verification code check
        const signupCodes = await forgetCodesModel.findOne( { email: email })
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
    
        const newSalt = crypto.randomBytes(16).toString('hex')
        const newHash = crypto.pbkdf2Sync(password, newSalt, 1000, 64, `sha512`).toString('hex')
        await usersModel.findOneAndUpdate({email: email}, { $set: { 'web_data.hash': newHash, 'web_data.salt': newSalt}})
        .then((data) => {
            return res.status(200).json({
                status: 200,
                error: "Admin password updated",
                user: data
            })
        })
    }
    catch(e) {
        return errorMessage(e, res)
    }
})

users.post("/resetPassword", async (req, res) => {
    try {
        const curPass = req.body.curPass
        const newPass = req.body.newPass
        const _id = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id
    
        const user = await usersModel.findOne({ _id : _id})
        const hashCurPass =  crypto.pbkdf2Sync(curPass, user.web_data.salt, 1000, 64, `sha512`).toString('hex')
        if (user.web_data.hash == hashCurPass) {

            const newSalt = crypto.randomBytes(16).toString('hex')
            const newHash = crypto.pbkdf2Sync(newPass, newSalt, 1000, 64, `sha512`).toString('hex')
        
            await usersModel.findOneAndUpdate({ _id: _id}, { $set: { 'web_data.hash':  newHash, 'web_data.salt': newSalt }})
            
            return res.status(200).json({
                status: 200,
                msg: "Password reset successfully",
            }) 
        }
        else {
            return res.status(200).json({
                status: 401,
                msg: "Invalid password"
            })
        }
    
        
    }
    catch (e) {
        return errorMessage(e, res)
    }
})