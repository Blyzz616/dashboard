#!/bin/bash

#######################################
#### REMEMBER TO ADD YOUR DETAILS! ####
#######################################

# OpenWeatherMap API credentials
#LAT=""
#LON=""
#APP_ID=""
EXCLUDE="minutely,timezone,timezone_offset"
DATESTAMP=$(date +%s)
FULL_TEMP="/tmp/full.json"
FULL_FILE="/var/www/html/json/full.json"
CURRENTLY_FILE="/var/www/html/json/currently.json"
HOURLY_FILE="/var/www/html/json/hourly.json"
DAILY_FILE="/var/www/html/json/daily.json"

curl -s "https://api.openweathermap.org/data/3.0/onecall?lat=${LAT}&lon=${LON}&exclude=${EXCLUDE}&units=metric&appid=${APP_ID}" -o "$FULL_TEMP" && \
rm -f /var/www/html/json/*.json && \
mv "$FULL_TEMP" "$FULL_FILE"

ALERTS=$(jq -r '.alerts[]? | .description //empty' "$FULL_FILE" | sed 's/\\n/<br>/g' | sed 's/"//g' 2>/dev/null) || unset ALERTS

# Currently file
jq '.current | {dt, sunrise, sunset, temp, pressure, humidity, dew_point, uvi, clouds, wind_speed, wind_deg, wind_gust, rain, snow, weather: .weather[0].icon}' "$FULL_FILE" > "$CURRENTLY_FILE"

FILE_CURRENT_WEATHER="/var/www/html/current/weather.txt"
FILE_CURRENT_ICON="/var/www/html/current/icon.txt"
FILE_CURRENT_WINDSPD="/var/www/html/current/windspd.txt"
FILE_CURRENT_WINDDEG="/var/www/html/current/winddeg.txt"
FILE_CURRENT_TEMP="/var/www/html/current/temp.txt"
FILE_CURRENT_CLOUD="/var/www/html/current/cloud.txt"
FILE_CURRENT_QNE="/var/www/html/current/qne.txt"
FILE_CURRENT_DEW="/var/www/html/current/dew.txt"
FILE_CURRENT_UVI="/var/www/html/current/uvi.txt"
FILE_SUN_UP="/var/www/html/current/sun_up.txt"
FILE_SUN_DN="/var/www/html/current/sun_dn.txt"
FILE_CURRENT_HUMIDITY="/var/www/html/current/humidity.txt"
FILE_CURRENT_RAIN="/var/www/html/current/rain.txt"
FILE_CURRENT_SNOW="/var/www/html/current/snow.txt"
FILE_ALERTS="/var/www/html/current/alerts.txt"
FILE_MOON_UP="/var/www/html/current/moonup.txt"
FILE_MOON_DN="/var/www/html/current/moondn.txt"
FILE_MOON_PHASE="/var/www/html/current/moon-phase.txt"

# Renaming icon and Inserting weather
sed -i 's/weather/icon/g' ${CURRENTLY_FILE}
CURRENT_WEATHER=$(jq '.hourly[0].weather[].description' "$FULL_FILE" | sed 's/"//g' | sed 's/.*/\u&/')
sed -i "/gust/a \  \"weather\": \"$CURRENT_WEATHER\"," "$CURRENTLY_FILE"

CURRENT_WEATHER=$(jq '.weather' "$CURRENTLY_FILE" | sed 's/"//g')
CURRENT_ICON=$(jq '.icon' "$CURRENTLY_FILE")
CURRENT_WINDSPD=$(printf "%.1f" $(jq '.wind_speed' "$CURRENTLY_FILE" | bc -l))
CURRENT_WINDDEG=$(jq '.wind_deg' "$CURRENTLY_FILE")
CURRENT_TEMP=$(jq '.temp' "$CURRENTLY_FILE")
CURRENT_CLOUD=$(jq '.clouds' "$CURRENTLY_FILE")
CURRENT_QNE=$(jq '.pressure' "$CURRENTLY_FILE")
CURRENT_DEW=$(jq '.dew_point' "$CURRENTLY_FILE")
CURRENT_UVI=$(jq '.uvi' "$CURRENTLY_FILE")
SUN_UP=$(jq '.sunrise' "$CURRENTLY_FILE")
SUN_DN=$(jq '.sunset' "$CURRENTLY_FILE")
CURRENT_HUMIDITY=$(jq '.humidity' "$CURRENTLY_FILE")
CURRENT_RAIN=$(jq '.rain' "$CURRENTLY_FILE")
CURRENT_SNOW=$(jq '.snow' "$CURRENTLY_FILE")
MOON_UP=$(jq '.daily[0].moonrise' "$FULL_FILE")
MOON_DN=$(jq '.daily[0].moonset' "$FULL_FILE")
MOON_PHASE=$(jq '.daily[0].moon_phase' "$FULL_FILE")

echo "$CURRENT_WEATHER" > "$FILE_CURRENT_WEATHER"
echo "$CURRENT_ICON" > "$FILE_CURRENT_ICON"
echo "$CURRENT_WINDSPD" > "$FILE_CURRENT_WINDSPD"
echo "$CURRENT_WINDDEG" > "$FILE_CURRENT_WINDDEG"
echo "$CURRENT_TEMP" > "$FILE_CURRENT_TEMP"
echo "$CURRENT_CLOUD" > "$FILE_CURRENT_CLOUD"
echo "$CURRENT_QNE" > "$FILE_CURRENT_QNE"
echo "$CURRENT_DEW" > "$FILE_CURRENT_DEW"
echo "$CURRENT_UVI" > "$FILE_CURRENT_UVI"
echo "$SUN_UP" > "$FILE_SUN_UP"
echo "$SUN_DN" > "$FILE_SUN_DN"
echo "$CURRENT_HUMIDITY" > "$FILE_CURRENT_HUMIDITY"
echo "$MOON_UP" > "$FILE_MOON_UP"
echo "$MOON_DN" > "$FILE_MOON_DN"
echo "$MOON_PHASE" > "$FILE_MOON_PHASE"

NULL_REGEX="^NULL$|^null$"

# Handle Rain
if [[ -z "$CURRENT_RAIN" || "$CURRENT_RAIN" =~ $NULL_REGEX ]]; then
  echo "0" > "$FILE_CURRENT_RAIN"
else
  echo "$CURRENT_RAIN" > "$FILE_CURRENT_RAIN"
fi

# Handle Snow
if [[ -z "$CURRENT_SNOW" || "$CURRENT_SNOW" =~ $NULL_REGEX ]]; then
  echo "0" > "$FILE_CURRENT_SNOW"
else
  echo "$CURRENT_SNOW" > "$FILE_CURRENT_SNOW"
fi

# HAndle Alerts
if [[ -n "$ALERTS" ]]; then
  echo "$ALERTS" > "$FILE_ALERTS"
else
  if [[ -f "$FILE_ALERTS" ]]; then
    rm "$FILE_ALERTS"
  fi
fi

# Hourly File
jq '.hourly[] | {dt,temp,pressure,dew_point,uvi,clouds,wind_speed,wind_deg,rain,snow}' "$FULL_FILE" > "$HOURLY_FILE"
jq '.dt' "$HOURLY_FILE" > /tmp/epoch.txt
jq -r '.clouds' "$HOURLY_FILE" > /tmp/cloud_data.txt
jq '.hourly[].temp' "$FULL_FILE" > /tmp/temp_data.txt
jq -r '. | if has("rain") and .rain."1h" != null then .rain."1h" else 0 end' "$HOURLY_FILE" > /tmp/rain_data.txt
jq -r '. | if has("snow") and .snow."1h" != null then .snow."1h" else 0 end' "$HOURLY_FILE" > /tmp/snow_data.txt
jq '.dew_point' "$HOURLY_FILE" > /tmp/dew_data.txt
jq '.wind_speed' "$HOURLY_FILE" > /tmp/wnd_spd.txt
jq '.wind_deg' "$HOURLY_FILE" > /tmp/wnd_deg.txt

# Save min/max temps in /var/www/html/48h/ as temp.min and temp.max
jq '.hourly[].temp' "$FULL_FILE" | sort -n | tail -n1 > /var/www/html/48h/temp.max
jq '.hourly[].temp' "$FULL_FILE" | sort -n | head -n1 > /var/www/html/48h/temp.min


# Daily File
jq '.daily' "$FULL_FILE" > "$DAILY_FILE"
jq '.daily[1] | {dt, summary, min: .temp.min, max: .temp.max, icon: .weather[0].icon, clouds, pop, uvi}' "$FULL_FILE" > /var/www/html/daily/plus1.json
jq '.daily[2] | {dt, summary, min: .temp.min, max: .temp.max, icon: .weather[0].icon, clouds, pop, uvi}' "$FULL_FILE" > /var/www/html/daily/plus2.json
jq '.daily[3] | {dt, summary, min: .temp.min, max: .temp.max, icon: .weather[0].icon, clouds, pop, uvi}' "$FULL_FILE" > /var/www/html/daily/plus3.json
jq '.daily[4] | {dt, summary, min: .temp.min, max: .temp.max, icon: .weather[0].icon, clouds, pop, uvi}' "$FULL_FILE" > /var/www/html/daily/plus4.json
jq '.daily[5] | {dt, summary, min: .temp.min, max: .temp.max, icon: .weather[0].icon, clouds, pop, uvi}' "$FULL_FILE" > /var/www/html/daily/plus5.json
jq '.daily[6] | {dt, summary, min: .temp.min, max: .temp.max, icon: .weather[0].icon, clouds, pop, uvi}' "$FULL_FILE" > /var/www/html/daily/plus6.json
jq '.daily[7] | {dt, summary, min: .temp.min, max: .temp.max, icon: .weather[0].icon, clouds, pop, uvi}' "$FULL_FILE" > /var/www/html/daily/plus7.json

# get the time values into the times file
for i in $(jq '.' "$HOURLY_FILE" | grep dt | awk '{print $2}' | rev | cut -c2- | rev); do date -d @$i +%H:%M; done > /tmp/time_data.txt

# REMOVE ALL THE HOURS THAT AREN'T 0,6,12,18
sed -i -E 's/(0[1-5]|0[7-9]|1[0-1]|1[3-7]|19|2[0-3]):00/ /g' /tmp/time_data.txt

# for those lovely lovely vertical lines.
cp /tmp/time_data.txt /tmp/quarter.txt
sed -i -e 's/.*:00/1/g' /tmp/quarter.txt
sed -i -e 's/^[[:blank:]]*$/0/g' /tmp/quarter.txt

RAIN_MAX(){
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

SNOW_MAX(){
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

SNOW_MAX
RAIN_MAX

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

# 1 EPOCH - 2 TIME - 3 TEMPERATURE - 4 RAIN - 5 SNOW - 6 CLOUD - 7 DEW - 8 WINDSPEED - 9 WINDDIRECTION - 10 QUARTER
paste -d , /tmp/epoch.txt /tmp/time_data.txt /tmp/temp_data.txt /tmp/rain_data.txt /tmp/snow_data.txt /tmp/cloud_data.txt /tmp/dew_data.txt /tmp/wnd_spd.txt /tmp/wnd_deg.txt /tmp/quarter.txt > /tmp/plot2.csv

awk -F, '$10 == 1 {if($8 > max) max=$8} END {print max}' /tmp/plot2.csv > /tmp/max_wind_speed.txt

# Run Gnuplot script
gnuplot /usr/local/bin/dashboard/graphs/graph.plot 2>/dev/null

date > /var/log/call.log
