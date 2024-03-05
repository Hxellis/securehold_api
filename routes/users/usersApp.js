import express from 'express'
import { annoucementsModel, notifyAdminModel } from '../../models/models.js'
import errorMessage from '../../apiErrorMessage.js'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

export const usersApp  = express.Router()

usersApp.get("/getAnnouncements", async (req, res) => {
    await annoucementsModel.find({ type: "Users"}).populate("admin")
    .then( (resp) => {
        return res.status(200).json({
            status: 200,
            msg: "Announcements retrieved",
            ann: resp
        })
    })
    .catch((e) => errorMessage(e,res))
})

usersApp.post("/notifyAdmin", async (req, res) => {
    try {
        const _id = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id
        const message = req.body.message

        await notifyAdminModel.create({ message:message, user: _id })

    }
    catch (e) {
        return errorMessage (e, res)
    }
})