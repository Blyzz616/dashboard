#!/bin/bash

# Database credentials
DB_USER=""
DB_PASS=""
DB_NAME=""

# JSON file path
JSON_FILE="/var/www/html/json/currently.json"

# Extract values from JSON file
DT=$(jq -r '.dt' $JSON_FILE)
SUNRISE=$(jq -r '.sunrise' $JSON_FILE)
SUNSET=$(jq -r '.sunset' $JSON_FILE)
TEMP=$(jq -r '.temp' $JSON_FILE)
PRESSURE=$(jq -r '.pressure' $JSON_FILE)
HUMIDITY=$(jq -r '.humidity' $JSON_FILE)
DEW_POINT=$(jq -r '.dew_point' $JSON_FILE)
UVI=$(jq -r '.uvi' $JSON_FILE)
CLOUDS=$(jq -r '.clouds' $JSON_FILE)
WIND_SPEED=$(jq -r '.wind_speed' $JSON_FILE)
WIND_DEG=$(jq -r '.wind_deg' $JSON_FILE)
RAIN=$(< /var/www/html/current/rain.txt)
SNOW=$(< /var/www/html/current/snow.txt)

# Insert data into MariaDB
mysql -u $DB_USER -p$DB_PASS $DB_NAME -e "
INSERT INTO openweathermap (timestamp, dt, temp, qnh, humidity, dew, uvi, clouds, wind_spd, wind_deg, rain, snow)
VALUES (NOW(), $DT, $TEMP, $PRESSURE, $HUMIDITY, $DEW_POINT, $UVI, $CLOUDS, $WIND_SPEED, $WIND_DEG, $RAIN, $SNOW);
"

date > /var/log/db_write.log
