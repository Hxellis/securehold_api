import express from "express";
import path from 'path'

const dbTest  = express.Router()

dbTest.get('/', (req, res) => {
    res.status(200).json({
        status: 200,
        msg: "entered route dbTest"
    })
})

//standard get
dbTest.get('/insult', (req, res) => {
    res.status(200).send("fuck you")
})

//chaining the same route, diffrent request method
dbTest.route("/chainRoute")
    .get((req, res) => { res.send("a") })
    .post((req, res) => { res.send("b") })


//dynamic ID
dbTest.get('/:id', (req, res) => {
    res.status(200).send(`ligma ${req.params.id}`)
})

//param
dbTest.param("id", (req, res, next, id) => {
    console.log(id)
    next()
})

export default dbTest