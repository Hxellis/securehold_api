import express from "express";
import { pendingApprovalsModel, adminsModel, lockerLocationsModel, lockersModel } from '../../models/models.js'
import dotenv from 'dotenv'
import errorMessage from "../../apiErrorMessage.js";
import { spawn } from "child_process";

import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config()

export const dataAnalytics  = express.Router()

const pythonFilePath = dirname(fileURLToPath(import.meta.url)) + "\\analytics\\" 

dataAnalytics.get("/test", (req, res) => {

    

    const pythonProcess = spawn("python", [pythonFilePath + "test.py", "test2"]);

    let outputData = "";
    let errorData = ""; 

    //parse output
    pythonProcess.stdout.on("data", (data) => { outputData += JSON.parse(data) });

    //parse error message
    pythonProcess.stderr.on("data", (err) => { errorData += JSON.parse(err) });

    pythonProcess.on("close", (code) => {
        console.log(`child process exited with code ${code}`);
        return errorData ? errorMessage(errorData, res) : res.send(outputData);
    });
});
