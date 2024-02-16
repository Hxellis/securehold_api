import express from "express";
import { adminsModel } from '../models/models.js'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()


export const admins  = express.Router()

function errorMessage(msg, res) {
    console.log("error: " + msg)
    res.status(404).json({
        status: 404,
        msg: msg
    })
}

admins.post("/login", async (req, res) => {
    await adminsModel.findOne({username: req.body.username})
    .then( (user) => {
        if (user) {
            const inputPass = crypto.pbkdf2Sync(req.body.password, user.salt, 1000, 64, "sha512").toString('hex')
            if (inputPass == user.hash) {
                return res.status(200).json({
                    status: 200,
                    msg: "Login successful"
                })
            }
            return  res.status(200).json({
                status: 401,
                msg: "Invalid Password"
            })
            
        }
        //status 200 here to prevent frontend axios reading as API failed
        return res.status(200).json({
            status: 401,
            msg: "User not found"
        })
    })
    .catch( (e) => {
        return errorMessage(e, res)
    })
})

admins.post("/register", async (req, res) => {

    await adminsModel.find({ email: req.body.email })
    .then( async (existingEmail) => {
        if (existingEmail.length == 0) {
            const salt = crypto.randomBytes(16).toString('hex')
            const hash = crypto.pbkdf2Sync(req.body.password, salt, 1000, 64, `sha512`).toString('hex')

            const newAdmin = {
                username: req.body.username,
                email: req.body.email,
                hash: hash,
                salt: salt
            }
    
            await adminsModel.create(newAdmin)
            .then((data) => {
                return res.status(200).json({
                    status: 200,
                    msg: "User inserted",
                    user: data
                })
            })
            .catch((e) => {
                return errorMessage(e, res)
            })
        }
        return res.status(200).json({
            status:400,
            msg: "Email already exist"
        })
    })
    .catch( (e) => {
        return errorMessage(e, res)
    })
})


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

admins.post("/sendCode", async (req, res) => {

    const userEmail = req.body.email
    const code = crypto.randomBytes(3).toString('hex')

    transporter.sendMail({
		from: {
			name: 'jeff',
			address: process.env.email
		},
		to: userEmail,
		subject: "Securehold Security Code",
		text: "Your code is " + code,
		html: `
        <table style="width: 100%; border: 5px solid black; border-radius: 20px; padding: 50px; text-align: center; font-family: 'Trebuchet MS';">
            <tr>
                <td style=" font-size: 30px;">
                    Your code is:
                </td>
            </tr>
            <tr>
                <td style="padding-top:20px; font-size: 40px; font-weight: bold;">
                    `+ code +`
                </td>
            </tr>
        </table>
    `})

    return res.status(200).json({
        status: 200,
        msg: "Code sent to email",
        email: userEmail,
        code: code
    })
})
