import express from "express";
import { adminsModel } from '../../models/models.js'
import crypto from 'crypto'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary';
import errorMessage from "../../apiErrorMessage.js";
import multer from "multer";

dotenv.config()

export const profile  = express.Router()

function signJWT(data, res) {
    const signUser = data.toObject()
    const token = jwt.sign(signUser, process.env.JWT_KEY, { expiresIn: '12h' } )

    return res
    .header('Access-Control-Allow-Credentials', true)
    .setHeader('Cache-Control', 'no-store')
    .cookie('access_token',token,{
        expires: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        // domain: 'localhost',
        secure: true,
        sameSite: 'none',
        overwrite: true
    })
    .status(200)
    .json({
        status: 200,
        error: "Profile Updated",
        admin: data
    })
     
}

profile.post("/changeAdminData", multer().array(), async (req, res) => {
    
    const _id = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id
    const username = req.body.username 
    const email = req.body.email

    const updateObj = username ? { username: username} : email ? {email: email} : null

    if (updateObj) {
        await adminsModel.findOneAndUpdate({ _id: _id}, { $set: updateObj}, { projection: { hash: false, salt: false}, new: true})
        .then( (data) => {
            return signJWT(data, res)
        })
        .catch( (e) => {
            return errorMessage(e, res)
        })
    }
    else {
        errorMessage("Field not sent", res)
    }    
})

profile.post("/changePassword", multer().array(), async (req, res) => {
    // const 
    const _id = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id
    const newPassword = req.body.newPassword
    const oldPassword = req.body.oldPassword
    
    const admin = await adminsModel.findOne({ _id: _id })
    .catch( (e) => {
        return errorMessage(e,res)
    })

    if (admin) {
        const inputPass = crypto.pbkdf2Sync(oldPassword, admin.salt, 1000, 64, "sha512").toString('hex')
        if (admin.hash == inputPass) {

            const newSalt = crypto.randomBytes(16).toString('hex')
            const newHash = crypto.pbkdf2Sync(newPassword, newSalt, 1000, 64, `sha512`).toString('hex')

            await adminsModel.findOneAndUpdate({ _id: admin._id}, { $set: { hash: newHash, salt: newSalt}}, { projection: { hash: false, salt:false }, new: true})
            .then((data) => {
                return signJWT(data, res)
            })
            .catch((e) => {
                return errorMessage(e,res)
            })
        }
        else {
            return res.status(200).json({
                status: 401,
                msg: "Incorrect current password"
            })
        }
    }
    else {
        return res.status(200).json({
            status: 400,
            msg: "Admin not found"
        })
    }

})

const upload = multer({ storage: multer.memoryStorage() })

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
})

profile.post("/changeProfilePicture", upload.array('image'), async (req, res) => {
    const image = req.files[0];
    const buffer = image.buffer;
    console.log(image)
    cloudinary.uploader.upload_stream({ resource_type: 'auto' }, async (error, result) => {
        if (error) {
            console.log(error);
            return errorMessage(error, res);
        }
        console.log(result);

        const _id = (jwt.verify(req.cookies.access_token, process.env.JWT_KEY))._id
        const newAdminData = await adminsModel.findOneAndUpdate({ _id: _id }, {$set: { profile_picture: result.secure_url}}, {  projection: { hash: false, salt:false }, new: true})
        .catch( (e) => {
            return errorMessage(e, res);
        })
        return signJWT(newAdminData, res)
    }).end(buffer);
})