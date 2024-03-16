import os
import sys
import json

numpy_path = '/opt/render/.local/lib/python3.7/site-packages'
if numpy_path not in sys.path:
    sys.path.append(numpy_path)
import numpy as np
from sklearn.linear_model import LinearRegression


def test1():
    return "Hello from Python"

def test2(data):
    # Check the type and shape of the input data
    input_type = type(data).__name__
    input_shape = np.array(data).shape

    result = {
        "result": data,
        "input_type": input_type,
        "input_shape": input_shape
    }

    return result

# 3 meays 3 days ago, 2 means 2 days ago, and so on and today is 0
# in terms of showing, only todays value will change for example, we have 22/25, but since we only have one locker ocmpartment to be assigned so it will update 23/25
def occupancy(data):
    num_days = np.array([3, 2, 1, 0]).reshape(-1, 1)

    #locker occupancy count increases by each day i think
    yArrayud_day1 = [data[0]]
    yArrayud_day2 = [data[1]]
    yArrayud_day3 = [data[2]]
    yArrayud_day4 = [data[3]]

    combined_yArrayud = np.concatenate([yArrayud_day1, yArrayud_day2, yArrayud_day3, yArrayud_day4])

    model = LinearRegression()
    model.fit(num_days, combined_yArrayud)

    # Predict the value for tomorrow (represented as -1)
    y_predicted_tomorrow = model.predict([[-1]])

    # print("Predicted value for tomorrow:", y_predicted_tomorrow)
    return y_predicted_tomorrow.tolist()


def userDemand(data):
    # Define the data

    yArrayud_day1, yArrayud_day2, yArrayud_day3, yArrayud_day4 = data
    
    # Combine the data for all days
    X = np.vstack([yArrayud_day1, yArrayud_day2, yArrayud_day3, yArrayud_day4])
    y = np.mean(X, axis=0) 

    # Reshape the data for sklearn LinearRegression
    X = X.T  # Transpose X to have samples as rows and features as columns

    # Define and train the linear regression model
    model = LinearRegression()
    model.fit(X, y)

    # Make predictions for each time point
    predicted_values = model.predict(X)
    return predicted_values.tolist()

if __name__ == "__main__":
    functionName = sys.argv[1]
    data = json.loads(sys.argv[2])

    if (functionName == "occupancy"):
        result = occupancy(data)
    elif (functionName == "userDemand"):
        result = userDemand(data)
    else:
        result = "Invalid function name"

    # match functionName:
    #     case "test1":
    #         result = test1()
    #     case "test2":
    #         result = test2(data)
    #     case "occupancy":
    #         result = occupancy(data)
    #     case "userDemand":
    #         result = userDemand(data)
    #     case _:
    #         result = "Invalid function name"


    print(json.dumps(result))
    sys.stdout.flush()