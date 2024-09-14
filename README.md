#  Creating a new Dashboard

This is being run on one of my home servers that will one day grow up and turn into Jarvis.

Right now, I'm just using the OpenWeatherMap API to build up a time/weather/forecast dashboard.

However, I've got a few ESP32 boards that need to be put into service to report temperatures, humidities, wind-speed, nearby aircraft (not even joking), etc, etc, etc.

Right now though, I'm just warming up!

Currently looking like this:  
![image](https://github.com/user-attachments/assets/b147a971-33ea-40a6-a663-8b7bb2e9aa56)

Now with 7-day forecast and moon position!

Also - you just gotta love these icons!

![Sunny](/var/www/html/img/weather/icon/01d.svg)  ![cloudy](/var/www/html/img/weather/icon/03d.svg)  ![Rainy](/var/www/html/img/weather/icon/10d.svg)  


I've jsut added the moon phase indicator - And I'm wondering if I should use it as the tiny little moon guy in the sun/moon position indicator on the left too.

The circle at the bottom started out life as a day-light indicator.   
   The little sun would start the day on the left at sunrise, and work its little way over the top to the right and get there at sunset time.

Now though, It's got a weather icon in the middle, and it also grew up a little bit to become a circle. not just a semi-circle

There are 3 different calculations performed throughout the day:

Basing this on my e-paper desk clock that I've been using for the last few years:  
(image lost - will replace at some point)


1. Daytime Calculation - Sunrise to Sunset:
```math
   \{x, y\} = \{250 - 150 \cos\left(\frac{\pi z}{100}\right), 200 - 150 \sin\left(\frac{\pi z}{100}\right)\}
```

2. Evening Calculation - Sunset to Midnight:
```math
\{x, y\} = \{250 - 150 \cos\left(\frac{\pi}{100} \left(100 + \frac{z}{2}\right)\right), 200 - 150 \sin\left(\frac{\pi}{100} \left(100 + \frac{z}{2}\right)\right)\}
```

3. Morning Calculation - Midnight to Sunrise:
```math
\{x, y\} = \{250 - 150 \cos\left(\frac{\pi}{100} \left(150 + \frac{z}{2}\right)\right), 200 - 150 \sin\left(\frac{\pi}{100} \left(150 + \frac{z}{2}\right)\right)\}
```

This way the day time will go from sunrise to sunset at a constant speed for the top 180°. Then from sunet until midnight at a constant speed for the next 90° and then midnight to sunrise for the last 90°.

I split up the night as there may be slight changes in the timings with the data recieved from OpenWeatherMap's API.

To do:

- [x] Create a to-do list
- [x] Move API calls to a local-server based system, so that calls happen ONCE every 5 minutes, rather than once every 5 minutes per browser accessing the page. Use PHP for this.
- ~~On page load: Render the page as quickly as possible. Then preform the calculations for the remainder of the day.~~ invalidated by previous commit
- [x] Build a nice bar/line graph showing the next 48 hours with
  - [x] Temperature line (red above 0 /blue below) (left Y)
  - [x] Precipitation bar graph (right Y)
  - [x] Can we split this?
    - [x] rain
    - [x] snow
  - [x] Cloud Cover Bar (top Y)
- [x] Disaplay alerts for 45 seconds every 5 minutes
- [x] 7-day weather forecast
   - [x] Add UVI
   - [ ] Add Probability of Precip
- [x] Windspeed and direction
   - [x] Add wind variability (weathervane wiggle)
      - [x] Maybe based on windstrength
   - [ ] Add wind randomness when speed at 0
   - [ ] fix wind direction (defaulting back to 0 after init)
- [ ] Include predicted vs actual temperatures
- [ ] include temperatures from
  - [ ] Garage
  - [ ] Deep Freeze
- [ ] Include soil Probes?
- [ ] Include SDR ADS-B?
- [ ] Include stuff from Home Assistant?
- [ ] Include stuff from Klipper? (3d Printer)
- [ ] Include Network Monitoring SNMP/SIEM events?
- [x] Moon Position
- [x] Moon Phase
- [x] fix phase to be moon's shadow - not earth's!
- [X] Update Temperature with JS

Why is it ever time I mark something as complete, I add at least 2 more items?

Damn, I got a lot to do on this!

Thanks to [Ninad Munshi](https://math.stackexchange.com/users/698724/ninad-munshi) on [Github](https://math.stackexchange.com/questions/4934077/calculating-percentage-coordinates-on-an-arc) for giving me a push-start with regards to getting the calculations for the sun position working!
