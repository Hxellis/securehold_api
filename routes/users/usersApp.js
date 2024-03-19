import express from 'express'
import { annoucementsModel, lockersModel, notifyAdminModel, usersModel } from '../../models/models.js'
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
    await annoucementsModel.find({ type: "Users"}).populate("admin").sort({_id: -1})
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
        return res.status(200).json({
            status: 200,
            msg: "Notification retrieved",
        })
    }
    catch (e) {
        return errorMessage (e, res)
    }
})

usersApp.get("/openLocker", async (req, res) => {
    try {
        const userId = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id;

        await lockersModel.findOneAndUpdate({ occupied_by: userId}, { $set: { door_status: true}})

        return res.status(200).json({
            status: 200,
            msg: "Locker opened"
        })
    }
    catch (e) {
        return errorMessage(e, res)
    }
})

usersApp.get("/logout", async (req, res) => {
    try {
        const userId = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id;
        
        await usersModel.findOneAndUpdate({ _id : userId }, { $set: {'web_data.last_login': Date.now()}})

        return res.clearCookie("access_token", {
            httpOnly: true,
            // domain: 'localhost',
            secure: true,
            sameSite: 'none',
        }).status(200).json({
            status: 200,
            msg: "Token Cleared",
        })
    }
    catch (e) {
        errorMessage(e, res)
    }
    
})
