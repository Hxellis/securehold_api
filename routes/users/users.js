import express from 'express'
import { usersModel } from '../../models/models.js'
import errorMessage from '../../apiErrorMessage.js'

export const users  = express.Router()

function formatDatabaseObject(obj) {
    const formattedObj = obj

    for (const [key, value] of Object.entries(formattedObj)) {
        if (!value) {
            delete formattedObj[key];
            continue;
        }
        if(key.includes(".")){
            const newObjKeys = key.split('.');
            let newObj = value


            for (let i = newObjKeys.length - 1; i >= 0; i--) {
                newObj = { [newObjKeys[i]]: newObj };
            }
            delete formattedObj[key]
            Object.assign(formattedObj, newObj)
        }
    }

    return formattedObj
}

users.get("/", (req, res) => {
    res.status(200).json({
        status: 200,
        msg: "Entered users"
    })
})
