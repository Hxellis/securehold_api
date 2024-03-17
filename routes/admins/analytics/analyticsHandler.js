import { matrix, size, concat, mean, transpose } from 'mathjs';
import { linearRegression } from 'simple-statistics';

function test1() {
    return "Hello from JavaScript";
}

function test2(data) {
    // Check the type and shape of the input data
    const input_type = typeof data;
    const input_shape = size(data);

    const result = {
        "result": data,
        "input_type": input_type,
        "input_shape": input_shape
    };

    return result;
}

function occupancy(data) {
    const numDaysArr = Array.from({ length: data.length }, (_, index) => index);
    const regressionLine = linearRegression(numDaysArr.map((day, index) => [day, data[index]]));
    const y_predicted_tomorrow = regressionLine.m * (data.length) + regressionLine.b;

    return Math.floor(y_predicted_tomorrow);
}

function userDemand(data) {
    const numDays = data.length
    const numIntervals = data[0].length;

    const predictedValues = []
    for ( let x  = 0; x < numIntervals; x++ ) {
        const parsedData = data.map((intervals, index) => {
            return [index, intervals[x]]
        })
        const regressionLine = linearRegression(parsedData);
        const predictedNum = ( regressionLine.m * (numDays)) + regressionLine.b
        predictedValues.push(Math.floor(predictedNum))
    }

    return predictedValues;
}

export default function analyticsHandler(functionName, data) {
    let result;
    switch (functionName) {
        case "test1":
            result = test1();
            break;
        case "test2":
            result = test2(data);
            break;
        case "occupancy":
            result = occupancy(data);
            break;
        case "userDemand":
            result = userDemand(data);
            break;
        default:
            result = "Invalid function name";
    }
    
    return(result)
}

