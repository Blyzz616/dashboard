<?php
function getLatestFile($path, $pattern) {
    $files = glob($path . '/' . $pattern);
    if (empty($files)) {
        return null; // Return null if no files are found
    }
    usort($files, function($a, $b) {
        return filemtime($b) - filemtime($a);
    });
    return $files[0];
}

$current_conditions_file = getLatestFile('/var/www/html/json', '*-current_conditions.json');
$forecast_file = getLatestFile('/var/www/html/json', '*-forecast.json');

if ($current_conditions_file === null || $forecast_file === null) {
    echo "Error: Weather data files not found.";
    exit;
}

$current_conditions = json_decode(file_get_contents($current_conditions_file), true);
$forecast = json_decode(file_get_contents($forecast_file), true);

if ($current_conditions === null || $forecast === null) {
    echo "Error: Unable to read weather data.";
    exit;
}

// Extract current conditions data
$temp = $current_conditions['main']['temp'];
$description = $current_conditions['weather'][0]['description'];
$humidity = $current_conditions['main']['humidity'];
$wind_speed = $current_conditions['wind']['speed'];
$sunrise = $current_conditions['sys']['sunrise'];
$sunset = $current_conditions['sys']['sunset'];
$weather_icon = $current_conditions['weather'][0]['icon'];

// Output HTML content
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <div class="dashboard">
    <div class="weather-container">
      <div id="weather">Temp: <?php echo number_format($temp, 1); ?>°C, <?php echo $description; ?></div>
      <div id="additional-info">
        <ul>
          <li>Humidity: <span id="humidity"><?php echo $humidity; ?></span>%</li>
          <li>Wind Speed: <span id="wind-speed"><?php echo $wind_speed; ?></span> m/s</li>
        </ul>
      </div>
    </div>
    <div class="clock-container">
      <div id="clock">
        <span id="hour"></span><span id="minute"></span><span class="second"></span>
      </div>
    </div>
    <div class="other-info-container">
      <div id="other-info"></div>
      <div class="bottom-left">
        <div id="sun-container" style="display: block;">
          <svg width="500" height="400" viewbox="0 0 1000 800">
            <defs>
              <mask id="dimmer">
                <rect x="0" y="0" width="500" height="250" fill="#ffffff" />
                <rect x="0" y="200" width="500" height="250" fill="#777777" />
              </mask>
              <mask id="icondim">
                <rect x="175" y="125" width="180" height="180" fill="#777777" />
              </mask>
            </defs>
            <circle id="arc" cx="250" cy="200" r="150" fill="none" stroke="lightblue" stroke-width="8" mask="url(#dimmer)"></circle>
            <circle id="sun" cx="250" cy="200" r="20" fill="orange" mask="url(#dimmer)"></circle>
            <image id="weather-icon" xlink:href="img/weather/icon/<?php echo $weather_icon; ?>.svg" width="200" height="200" x="150" y="100" />
            <line id="sunrise-line" x1="94" y1="201" x2="104" y2="201" style="stroke:black;stroke-width:1"></line>
            <line id="sunset-line" x1="396" y1="201" x2="404" y2="201" style="stroke:black;stroke-width:1"></line>
            <text id="sunrise-time" x="0" y="210" fill="#777777" font-size="2vw" data-timestamp="<?php echo $sunrise; ?>"><?php echo date('H:i', $sunrise); ?></text>
            <text id="sunset-time" x="430" y="210" fill="#777777" font-size="2vw" data-timestamp="<?php echo $sunset; ?>"><?php echo date('H:i', $sunset); ?></text>
          </svg>
        </div>
      </div>
    </div>
  </div>
  <script src="js/main.js"></script>
</body>
</html>
