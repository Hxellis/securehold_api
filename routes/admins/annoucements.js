import express from "express";
import mongoose from "mongoose";
import { annoucementsModel, notifyAdminModel } from "../../models/models.js";
import errorMessage from "../../apiErrorMessage.js";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export const annoucements  = express.Router()

annoucements.get("/getAllAnnoucements", async (req, res) => {
    await annoucementsModel.find().sort( { timestamp: -1} ).populate("admin", "username").exec()
    .then((resp) => {
        return res.status(200).json({
            status: 200,
            msg: "Annoucement list retrieved",
            data: resp
        })
    })
    .catch ((e) => {
        return errorMessage(e, res)
    })
})

annoucements.post("/insertAnnoucement", async (req, res) => {
    const type = req.body.type
    const title = req.body.title
    const content = req.body.content
    const admin = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id
    const timestamp = Date.now()

    await annoucementsModel.create({ type: type, title: title, content: content, admin: new mongoose.Types.ObjectId(admin), timestamp: timestamp})
    .then(() => {
        return res.status(200).json({
            status: 200,
            msg: "Annoucement Added"
        })
    })
    .catch((e) => {
        errorMessage(e, res)
    })
})

annoucements.post("/deleteAnnoucement", async (req, res) => {
    const _id = req.body._id

    await annoucementsModel.deleteOne({ _id: _id})
    .then(() => {
        return res.status(200).json({
            status: 200,
            msg: "Annoucement deleted"
        })
    })
    .catch( (e) => {
        return errorMessage(e, res)
    })
})

annoucements.get("/getAllAdminNotify", async (req, res) => {
    await notifyAdminModel.find({}).populate("user")
    .then((data) => {
        return res.status(200).json({
            status: 200,
            msg: "User notify retrieved",
            notifyAdmin: data
        })
    })
    .catch( (e) => {
        return errorMessage(e, res)
    })
})

annoucements.post("/deleteAdminNotify", async (req, res) => {
    const _id = req.body._id
    await notifyAdminModel.findOneAndDelete({ _id: _id })
    .then(() => {
        return res.status(200).json({
            status: 200,
            msg: "User notify deleted",
        })
    })
    .catch( (e) => {
        return errorMessage(e, res)
    })
})