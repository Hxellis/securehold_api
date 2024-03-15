import numpy as np
from sklearn.linear_model import LinearRegression

# 3 meays 3 days ago, 2 means 2 days ago, and so on and today is 0
# in terms of showing, only todays value will change for example, we have 22/25, but since we only have one locker ocmpartment to be assigned so it will update 23/25

def occupancy():
    num_days = np.array([3, 2, 1, 0]).reshape(-1, 1)

    #locker occupancy count increases by each day i think
    yArrayud_day1 = [3]
    yArrayud_day2 = [5]
    yArrayud_day3 = [7]
    yArrayud_day4 = [7]

    combined_yArrayud = np.concatenate([yArrayud_day1, yArrayud_day2, yArrayud_day3, yArrayud_day4])

    model = LinearRegression()
    model.fit(num_days, combined_yArrayud)

    # Predict the value for tomorrow (represented as -1)
    y_predicted_tomorrow = model.predict([[-1]])

    # print("Predicted value for tomorrow:", y_predicted_tomorrow)
    return y_predicted_tomorrow