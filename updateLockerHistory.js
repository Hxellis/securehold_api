import { lockerHistoryModel } from "./models/models.js"


function updateLockerHistory() {
    if (new Date().getSeconds() == 10) {
        console.log("ayy it time")
    }
    else console.log("it aint time")
}

async function updateOccupancyCount() {
    if (newDate().getHours() == 0) {
        await lockerHistoryModel.findOne({

        })
    }
}

async function testFind() {
    const currentDate = new Date();

    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(0,0,0,0)
    
    console.log(date)
    const ligma = await lockerHistoryModel.find({
        date: date
    })
    console.log(ligma)
}

export default function lockerUpdateSchedule() {
    // setInterval(updateLockerHistory, 1000)
    // setInterval(testFind,10000)
    testFind()
    // setInterval(updateOccupancyCount, 60*60*1000)
};