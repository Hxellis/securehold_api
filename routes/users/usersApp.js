import express from 'express'
import { usersAppModel } from '../../models/models.js'

export const usersApp  = express.Router()

usersApp.post("/insertUserApp", async (req, res) => {
    const settings = JSON.parse(req.body.settings)
    delete req.body.settings
    req.body.settings = settings
    await usersAppModel.create(req.body)
    .then(() => {
        res.status(200).json({
            status: 200,
            msg: "User inserted",
            user: req.body
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
