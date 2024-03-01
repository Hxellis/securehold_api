import express from "express";
import mongoose from "mongoose";
import { annoucementsModel, adminsModel } from "../../models/models.js";
import errorMessage from "../../apiErrorMessage.js";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export const annoucements  = express.Router()

annoucements.get("/getAllAnnoucements", async (req, res) => {
    const data = await annoucementsModel.find().sort( { timestamp: -1} )
    .catch ((e) => {
        return errorMessage(e, res)
    })

    const alteredData = await Promise.all(data.map( async (item) => {
        const admin = await adminsModel.findOne({ _id: item.admin})
        .catch ((e) => {
            return errorMessage(e, res)
        })
        const newObj = {
            _id: item._id,
            title: item.title,
            content: item.content,
            admin: admin.username,
            timestamp: item.timestamp
        }
        return newObj
    }))

    return res.status(200).json({
        status: 200,
        msg: "Annoucement list retrieved",
        data: alteredData
    })
})

annoucements.post("/insertAnnoucement", async (req, res) => {
    const title = req.body.title
    const content = req.body.content
    const admin = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id
    const timestamp = Date.now()

    await annoucementsModel.create({ title: title, content: content, admin: new mongoose.Types.ObjectId(admin), timestamp: timestamp})
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