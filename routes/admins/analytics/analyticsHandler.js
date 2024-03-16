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
    const num_days = [3, 2, 1, 0];
    const occupancy_data = data;

    const regressionLine = linearRegression(num_days.map((day, index) => [day, occupancy_data[index]]));
    const slope = regressionLine.m;
    const intercept = regressionLine.b;

    // Predict the value for tomorrow (represented as -1)
    const y_predicted_tomorrow = slope * (-1) + intercept;

    return y_predicted_tomorrow;
}

function userDemand(data) {
    const numRows = data.length;
    const numCols = data[0].length;

    // Calculate the average demand for each day
    const averageDemand = new Array(numCols).fill(0);

    for (let i = 0; i < numCols; i++) {
        let sum = 0;
        for (let j = 0; j < numRows; j++) {
            sum += data[j][i];
        }
        averageDemand[i] = sum / numRows;
    }

    // Generate an array representing the number of days (1, 2, 3, ...)
    const numDays = Array.from({ length: numCols }, (_, index) => index + 1);

    // Perform linear regression
    const regressionLine = linearRegression(numDays.map((day, index) => [day, averageDemand[index]]));
    const slope = regressionLine.m;
    const intercept = regressionLine.b;

    // Predict the demand for each day
    const predictedDemand = numDays.map(day => slope * day + intercept);

    return predictedDemand;
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

