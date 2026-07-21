-- Smart Cab Safety System Database

CREATE TABLE User (
    User_ID INT PRIMARY KEY AUTO_INCREMENT,
    Full_Name VARCHAR(100),
    Email VARCHAR(100),
    Phone VARCHAR(15),
    Password VARCHAR(100),
    Address VARCHAR(255)
);

CREATE TABLE Driver (
    Driver_ID INT PRIMARY KEY AUTO_INCREMENT,
    Driver_Name VARCHAR(100),
    Phone VARCHAR(15),
    License_Number VARCHAR(50),
    Rating DECIMAL(2,1)
);

CREATE TABLE Cab (
    Cab_ID INT PRIMARY KEY AUTO_INCREMENT,
    Vehicle_Number VARCHAR(20),
    Vehicle_Type VARCHAR(50),
    Driver_ID INT,
    FOREIGN KEY (Driver_ID) REFERENCES Driver(Driver_ID)
);

CREATE TABLE Trip (
    Trip_ID INT PRIMARY KEY AUTO_INCREMENT,
    User_ID INT,
    Cab_ID INT,
    Pickup_Location VARCHAR(255),
    Drop_Location VARCHAR(255),
    Fare DECIMAL(10,2),
    Trip_Status VARCHAR(50),
    Start_Time DATETIME,
    End_Time DATETIME,
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Cab_ID) REFERENCES Cab(Cab_ID)
);

CREATE TABLE Emergency_Alert (
    Alert_ID INT PRIMARY KEY AUTO_INCREMENT,
    Trip_ID INT,
    User_ID INT,
    Alert_Time DATETIME,
    Alert_Status VARCHAR(50),
    FOREIGN KEY (Trip_ID) REFERENCES Trip(Trip_ID),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID)
);

CREATE TABLE Admin (
    Admin_ID INT PRIMARY KEY AUTO_INCREMENT,
    Admin_Name VARCHAR(100),
    Email VARCHAR(100),
    Password VARCHAR(100)
);
