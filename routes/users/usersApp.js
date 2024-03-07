import express from 'express'
import { annoucementsModel, notifyAdminModel, usersModel } from '../../models/models.js'
import errorMessage from '../../apiErrorMessage.js'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

export const usersApp  = express.Router()

usersApp.get("/getUserData", async (req, res) => {
    try {
        const userId = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id;
        
        const data = await usersModel.findOne({ _id: userId }, { projection: { 'web_data.hash': false, 'web_data.salt': false } }).populate({ path: "locker_id", populate: { path: 'location', model: "locker_locations"}});
        console.log(data)
        return res.status(200).json({
            status: 200,
            msg: "User data retrieved",
            userData: data
        });
    } catch (error) {
        return errorMessage(error, res);
    }
});

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