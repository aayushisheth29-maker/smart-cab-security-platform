# Data Dictionary

## Overview

The Data Dictionary provides detailed information about the database tables and their attributes used in the Smart Cab Safety System. It defines the purpose of each field to ensure consistency and improve database understanding.

## User Table

| Field Name | Description                     |
| ---------- | ------------------------------- |
| User_ID    | Unique identifier for each user |
| Full_Name  | Name of the user                |
| Email      | User email address              |
| Phone      | User contact number             |
| Password   | User login password             |
| Address    | Residential address of the user |

## Driver Table

| Field Name     | Description                       |
| -------------- | --------------------------------- |
| Driver_ID      | Unique identifier for each driver |
| Driver_Name    | Driver's full name                |
| Phone          | Driver contact number             |
| License_Number | Driver's license number           |
| Rating         | Driver rating provided by users   |

## Cab Table

| Field Name     | Description                    |
| -------------- | ------------------------------ |
| Cab_ID         | Unique identifier for each cab |
| Vehicle_Number | Vehicle registration number    |
| Vehicle_Type   | Type of cab (Sedan, SUV, etc.) |
| Driver_ID      | References the assigned driver |

## Trip Table

| Field Name      | Description                             |
| --------------- | --------------------------------------- |
| Trip_ID         | Unique identifier for each trip         |
| User_ID         | References the user who booked the trip |
| Cab_ID          | References the assigned cab             |
| Pickup_Location | Starting point of the trip              |
| Drop_Location   | Destination of the trip                 |
| Fare            | Total trip fare                         |
| Trip_Status     | Current trip status                     |
| Start_Time      | Trip start time                         |
| End_Time        | Trip end time                           |

## Emergency Alert Table

| Field Name   | Description                                 |
| ------------ | ------------------------------------------- |
| Alert_ID     | Unique identifier for each alert            |
| Trip_ID      | References the related trip                 |
| User_ID      | References the user who triggered the alert |
| Alert_Time   | Time when the alert was generated           |
| Alert_Status | Current alert status                        |

## Admin Table

| Field Name | Description                              |
| ---------- | ---------------------------------------- |
| Admin_ID   | Unique identifier for each administrator |
| Admin_Name | Administrator's name                     |
| Email      | Administrator email                      |
| Password   | Administrator login password             |
