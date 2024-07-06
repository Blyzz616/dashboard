<?php
// Prevent caching
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past

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

$current_conditions_file = getLatestFile('/var/www/html/json', '*_currently.json');
if ($current_conditions_file === null) {
    echo "Error: Current conditions file not found.";
    exit;
}

$current_conditions_content = file_get_contents($current_conditions_file);
if ($current_conditions_content === false) {
    echo "Error: Unable to read current conditions data.";
    exit;
}

$current_conditions = json_decode($current_conditions_content, true);
if ($current_conditions === null) {
    echo "Error: JSON decoding error occurred.";
    exit;
}

// Check for alerts file
$alerts_file = '/var/www/html/current/alerts.txt';
$alert_message = '';
if (file_exists($alerts_file)) {
    $alert_message = file_get_contents($alerts_file);
}

// Extract the epoch time from the filename
preg_match('/(\d+)_currently.json/', basename($current_conditions_file), $matches);
$file_epoch_time = isset($matches[1]) ? (int)$matches[1] : null;
$current_time = time();
$time_difference = $current_time - $file_epoch_time;
$is_data_stale = $time_difference > (35 * 60); // 35 minutes in seconds

// Extract current conditions data
$temp = isset($current_conditions['temp']) ? $current_conditions['temp'] : 'N/A';
$description = isset($current_conditions['weather']) ? $current_conditions['weather'] : 'N/A';
$humidity = isset($current_conditions['humidity']) ? $current_conditions['humidity'] : 'N/A';
$wind_speed = isset($current_conditions['wind_speed']) ? $current_conditions['wind_speed'] : 'N/A';
$sunrise = isset($current_conditions['sunrise']) ? $current_conditions['sunrise'] : 'N/A';
$sunset = isset($current_conditions['sunset']) ? $current_conditions['sunset'] : 'N/A';
$weather_icon = isset($current_conditions['icon']) ? $current_conditions['icon'] : 'N/A';

// Output HTML content
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <link rel="stylesheet" href="css/main.css">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="refresh" content="21600"> <!-- 6 hours in seconds -->
</head>
<body>
  <div class="dashboard">
    <div class="top-row">

      <!-- Left Column for weather information -->
      <div class="left-column">
        <div class="weather-container">
          <div id="weather">Temp: <?php echo $temp; ?>°C, <?php echo $description; ?></div>
          <div id="additional-info">
            <ul>
              <li>Humidity: <span id="humidity"><?php echo $humidity; ?></span>%</li>
              <li>Wind Speed: <span id="wind-speed"><?php echo $wind_speed; ?></span> m/s</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Right column for forecast -->
      <div class="right-column">
        <div class="forecast-container">
          <object type="image/svg+xml" data="../img/forecast.svg" width="100%" height="auto"></object>
        </div>
      </div>
    </div>

    <!-- Clock Container -->
    <div class="clock-container">
      <div id="clock">
        <span id="hour"></span><span id="minute"></span><span class="second"></span>
      </div>
    </div>

    <!-- Other information container -->
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

            <!-- Weather Icon dynamically added here -->
            <image id="weather-icon" xlink:href="img/weather/icon/<?php echo $weather_icon; ?>.svg" width="200" height="200" x="150" y="100" />
            <line id="sunrise-line" x1="94" y1="201" x2="104" y2="201" style="stroke:black;stroke-width:1"></line>
            <line id="sunset-line" x1="396" y1="201" x2="404" y2="201" style="stroke:black;stroke-width:1"></line>
            <text id="sunrise-time" x="0" y="210" fill="#777777" font-size="2vw" data-timestamp="<?php echo $sunrise; ?>"><?php echo date('H:i', $sunrise); ?></text>
            <text id="sunset-time" x="430" y="210" fill="#777777" font-size="2vw" data-timestamp="<?php echo $sunset; ?>"><?php echo date('H:i', $sunset); ?></text>
          </svg>
        </div>
      </div>
    </div>

    <!-- Alert Container -->
    <div id="alert-container" class="alert-container"></div>

  </div>
  <script src="js/main.js"></script>
</body>
</html>
