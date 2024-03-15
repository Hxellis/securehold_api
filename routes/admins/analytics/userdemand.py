import numpy as np
from sklearn.linear_model import LinearRegression

def userDemand():
    # Define the data
    xArrayud = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"]
    yArrayud_day1 = [1, 0, 5, 8, 3, 4, 1]
    yArrayud_day2 = [0, 3, 8, 10, 5, 8, 2]
    yArrayud_day3 = [2, 1, 5, 3, 7, 4, 3]
    yArrayud_day4 = [1, 0, 9, 7, 6, 3, 4]

    # Combine the data for all days
    X = np.array([yArrayud_day1, yArrayud_day2, yArrayud_day3, yArrayud_day4])
    y = np.mean(X, axis=0)  # Calculate the average for each time point

    # Reshape the data for sklearn LinearRegression
    X = X.T  # Transpose X to have samples as rows and features as columns

    # Define and train the linear regression model
    model = LinearRegression()
    model.fit(X, y)

    # Make predictions for each time point
    predicted_values = model.predict(X)

    predictArr = []
    # Display the results
    for time, value in zip(xArrayud, predicted_values):
        predictArr.append({
            'time': time,
            'value': value
        })

    return predictArr