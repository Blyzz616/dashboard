#!/bin/bash

#######################################
#### REMEMBER TO ADD YOUR DETAILS! ####
#######################################

# OpenWeatherMap API credentials
LAT=""  # Latitude for the weather data
LON=""  # Longitude for the weather data
APP_ID=""  # Your OpenWeatherMap API key
EXCLUDE="minutely,timezone,timezone_offset"  # Exclude unnecessary data categories
DATESTAMP=$(date +%s)  # Current timestamp for unique file names
FULL_FILE="/var/www/html/json/${DATESTAMP}_full.json"  # File to save the full API response
CURRENTLY_FILE="/var/www/html/json/${DATESTAMP}_currently.json"  # File for current weather data
HOURLY_FILE="/var/www/html/json/${DATESTAMP}_hourly.json"  # File for hourly weather data
DAILY_FILE="/var/www/html/json/${DATESTAMP}_daily.json"  # File for daily weather data

# Fetch weather data from OpenWeatherMap API and save to full file
curl -s "https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&exclude=${EXCLUDE}&units=metric&appid=${APP_ID}" -o "$FULL_FILE"

# Extract current weather data and save to currently file
jq '.current | {dt, sunrise, sunset, temp, pressure, humidity, dew_point, uvi, clouds, wind_speed, wind_deg, wind_gust, weather: .weather[0].icon}' "$FULL_FILE" > "$CURRENTLY_FILE"

# Extract hourly weather data and save to hourly file
jq '.hourly[] | {dt,temp,pressure,dew_point,uvi,clouds,wind_speed,wind_deg,rain,snow}' "$FULL_FILE" > "$HOURLY_FILE"

# Extract specific data fields from the hourly file and save to temporary files
jq '.dt' "$HOURLY_FILE" > /tmp/epoch.txt
jq -r '.clouds' "$HOURLY_FILE" > /tmp/cloud_data.txt
jq '.hourly[].temp' "$FULL_FILE" > /tmp/temp_data.txt
jq -r '. | if has("rain") and .rain."1h" != null then .rain."1h" else 0 end' "$HOURLY_FILE" > /tmp/rain_data.txt
jq -r '. | if has("snow") and .snow."1h" != null then .snow."1h" else 0 end' "$HOURLY_FILE" > /tmp/snow_data.txt
jq '.dew_point' "$HOURLY_FILE" > /tmp/dew_data.txt
jq '.wind_speed' "$HOURLY_FILE" > /tmp/wnd_spd.txt
jq '.wind_deg' "$HOURLY_FILE" > /tmp/wnd_deg.txt

# Get the time values into the time data file
for i in $(jq '.' "$HOURLY_FILE" | grep dt | awk '{print $2}' | rev | cut -c2- | rev); do 
    date -d @$i +%H:%M 
done > /tmp/time_data.txt

# Remove all the hours that aren't 0, 6, 12, 18 (dirty but effective)
sed -i -e 's/01:00/ /g' /tmp/time_data.txt
sed -i -e 's/02:00/ /g' /tmp/time_data.txt
sed -i -e 's/03:00/ /g' /tmp/time_data.txt
sed -i -e 's/04:00/ /g' /tmp/time_data.txt
sed -i -e 's/05:00/ /g' /tmp/time_data.txt
sed -i -e 's/07:00/ /g' /tmp/time_data.txt
sed -i -e 's/08:00/ /g' /tmp/time_data.txt
sed -i -e 's/09:00/ /g' /tmp/time_data.txt
sed -i -e 's/10:00/ /g' /tmp/time_data.txt
sed -i -e 's/11:00/ /g' /tmp/time_data.txt
sed -i -e 's/13:00/ /g' /tmp/time_data.txt
sed -i -e 's/14:00/ /g' /tmp/time_data.txt
sed -i -e 's/15:00/ /g' /tmp/time_data.txt
sed -i -e 's/16:00/ /g' /tmp/time_data.txt
sed -i -e 's/17:00/ /g' /tmp/time_data.txt
sed -i -e 's/19:00/ /g' /tmp/time_data.txt
sed -i -e 's/20:00/ /g' /tmp/time_data.txt
sed -i -e 's/21:00/ /g' /tmp/time_data.txt
sed -i -e 's/22:00/ /g' /tmp/time_data.txt
sed -i -e 's/23:00/ /g' /tmp/time_data.txt

# Prepare a file indicating quarters (1 for quarters, 0 otherwise)
cp /tmp/time_data.txt /tmp/quarter.txt
sed -i -e 's/.*:00/1/g' /tmp/quarter.txt
sed -i -e 's/^[[:blank:]]*$/0/g' /tmp/quarter.txt

# Function to calculate the maximum rain value
RAIN_MAX() {
  ABS_RAIN=$(sort -n /tmp/rain_data.txt | tail -n1)

  if (( $(echo "$ABS_RAIN > 0" | bc -l) )); then
    INT_RAIN=$(echo "$ABS_RAIN" | awk -F'.' '{print $1}')
    DEC_RAIN=$(echo "$ABS_RAIN" | awk -F'.' '{print $2}')
    if (( $(echo "$DEC_RAIN > 0" | bc -l) )); then
      MAX_RAIN=$(( INT_RAIN + 1))
    else
      MAX_RAIN="$INT_RAIN"
    fi
  else
    MAX_RAIN="0"
  fi
}

# Function to calculate the maximum snow value
SNOW_MAX() {
  ABS_SNOW=$(sort -n /tmp/snow_data.txt | tail -n1)

  if (( $(echo "$ABS_SNOW > 0" | bc -l) )); then
    INT_SNOW=$(echo "$ABS_SNOW" | awk -F'.' '{print $1}')
    DEC_SNOW=$(echo "$ABS_SNOW" | awk -F'.' '{print $2}')
    if (( $(echo "$DEC_SNOW > 0" | bc -l) )); then
      MAX_SNOW=$(( INT_SNOW + 1))
    else
      MAX_SNOW="$INT_SNOW"
    fi
  else
    MAX_SNOW="0"
  fi
}

# Calculate maximum snow and rain values
SNOW_MAX
RAIN_MAX

# Determine the maximum precipitation value
if [[ $(( MAX_RAIN + MAX_SNOW )) -gt 0 ]]; then
  if [[ "$MAX_RAIN" -gt "$MAX_SNOW" ]]; then
    MAX_PRECIP="$MAX_RAIN"
  elif [[ "$MAX_SNOW" -gt "$MAX_RAIN" ]]; then
    MAX_PRECIP="$MAX_SNOW"
  else
    echo "no way!"
  fi
else
  MAX_PRECIP=0
fi
echo "$MAX_PRECIP" > /tmp/max_precip.txt

# Calculate the maximum wind speed from plot2.csv
awk -F, '$10 == 1 {if($8 > max) max=$8} END {print max}' /tmp/plot2.csv > /tmp/max_wind_speed.txt

# Create the plot2.csv file with all required data fields
paste -d , /tmp/epoch.txt /tmp/time_data.txt /tmp/temp_data.txt /tmp/rain_data.txt /tmp/snow_data.txt /tmp/cloud_data.txt /tmp/dew_data.txt /tmp/wnd_spd.txt /tmp/wnd_deg.txt /tmp/quarter.txt > /tmp/plot2.csv

# Run the Gnuplot script to generate the graph
gnuplot /usr/local/bin/dashboard/graphs/graph.plot 2>/dev/null
