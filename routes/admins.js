import express from "express";
import mongoose from "mongoose";
import { adminsModel } from '../models/models.js'
import crypto from 'crypto'

export const admins  = express.Router()



admins.post("/login", async (req, res) => {
    const user = await adminsModel.findOne({email: req.body.email})
    if (user) {
        const inputPass = crypto.pbkdf2Sync(req.body.password, user.salt, 1000, 64, "sha512").toString('hex')
        if (inputPass == user.hash) {
            res.status(200).json({
                status: 200,
                msg: "Login successful"
            })
            return
        }
    }
    //status 200 here to prevent frontend axios reading as API failed
    res.status(200).json({
        status: 401,
        msg: "Invalid Login"
    })
    return
})

admins.post("/insertAdmin", async (req, res) => {

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
        res.status(200).json({
            status: 200,
            msg: "User inserted",
            user: data
        })
    })
    .catch((e) => {
        console.log("error: " + e)
        res.status(404).json({
            status: 404,
            msg: e
        })
    })
})