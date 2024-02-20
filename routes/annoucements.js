import express from "express";
import mongoose from "mongoose";
import { annoucementsModel, adminsModel } from "../models/models.js";
import errorMessage from "../apiErrorMessage.js";

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
    console.log(alteredData)

    return res.status(200).json({
        status: 200,
        msg: "Annoucement list retrieved",
        data: alteredData
    })
})

annoucements.post("/insertAnnoucement", async (req, res) => {
    console.log("enteredthis bitch")

    const title = req.body.title
    const content = req.body.content
    const admin = new mongoose.Types.ObjectId("65cc77c59d4fac492154f424")
    const timestamp = Date.now()

    await annoucementsModel.create({ title: title, content: content, admin: admin, timestamp: timestamp})
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