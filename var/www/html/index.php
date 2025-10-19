<?php
// Prevent caching
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past

function getLatestFile($path, $filename) {
    $filepath = $path . '/' . $filename;
    if (!file_exists($filepath)) {
        return null; // Return null if the file is not found
    }
    return $filepath;
}

$current_conditions_file = getLatestFile('/var/www/html/json', 'currently.json');
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

// Extract the epoch time from the JSON data
$file_epoch_time = isset($current_conditions['dt']) ? (int)$current_conditions['dt'] : null;
$current_time = time();
$time_difference = $current_time - $file_epoch_time;
$is_data_stale = $time_difference > (35 * 60); // 35 minutes in seconds

// Extract current conditions data
$temp = isset($current_conditions['temp']) ? $current_conditions['temp'] : 'N/A';
$description = isset($current_conditions['weather']) ? $current_conditions['weather'] : 'N/A';
$humidity = isset($current_conditions['humidity']) ? $current_conditions['humidity'] : 'N/A';
$wind_speed = isset($current_conditions['wind_speed']) ? $current_conditions['wind_speed'] : 'N/A';
$wind_deg = isset($current_conditions['wind_deg']) ? $current_conditions['wind_deg'] : 'N/A';
$uvi = isset($current_conditions['uvi']) ? $current_conditions['uvi'] : 'N/A';
$pressure = isset($current_conditions['pressure']) ? $current_conditions['pressure'] : 'N/A';
$sunrise = isset($current_conditions['sunrise']) ? $current_conditions['sunrise'] : 'N/A';
$sunset = isset($current_conditions['sunset']) ? $current_conditions['sunset'] : 'N/A';
$weather_icon = isset($current_conditions['icon']) ? $current_conditions['icon'] : 'N/A';

function getUviClass($uvi) {
    if ($uvi < 3) return 'uvi-low';
    if ($uvi < 6) return 'uvi-moderate';
    if ($uvi < 8) return 'uvi-high';
    if ($uvi < 11) return 'uvi-very-high';
    return 'uvi-extreme';
}

$uvi_class = getUviClass($uvi);


// Path to the moon phase file
$moonPhaseFile = 'current/moon-phase.txt';

// Read the moon phase value from the file
$moonPhase = file_get_contents($moonPhaseFile);

// Extract the digits after the period
preg_match('/\.(\d{1,2})/', $moonPhase, $matches);
$moonPhaseDigits = $matches[1];

// Check if there is only one digit, and if so, add a "0" (i.e 90% would be: 0.9, becomes 9 becomes 90)
if (strlen($moonPhaseDigits) === 1) {
    $moonPhaseDigits .= '0';
}

// Path to the moon phase image
$moonPhaseImage = "img/moon/{$moonPhaseDigits}.png";

// Output HTML content
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <link rel="stylesheet" href="css/main.css">
  <link rel="icon" type="image/x-icon" href="img/favicon.ico">
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="refresh" content="21600"> <!-- 6 hours in seconds -->
</head>
<body>
  <div class="shade"></div>
  <div class="dashboard">
    <div class="top-row">
      <!-- Left Column for weather information -->
      <div class="left-column">
      <div class="date">
      <?php
        date_default_timezone_set('America/Vancouver');
        echo date("D, M j, Y");
      ?>
      </div>
        <div class="weather-container">
          <div id="temp"><?php $formatted_temp = number_format($temp, 1); echo $formatted_temp; ?>&deg;</div>
          <div id="additional-info">
            <div class="mono" id="weather"><?php echo $description; ?></div>
            <table id="weathertab">
              <tr>
                <td>Humidity: <span id="humidity"><?php echo $humidity; ?></span>%</td>
                <td>UVI: <span id="uvi" class="<?php echo $uvi_class; ?>"><?php  $formatted_uvi = number_format($uvi, 1); echo $formatted_uvi; ?></span></td>
              </tr>
              <tr>
		<td colspan="2">Wind: <span id="wind-speed" data-direction="<?php echo $wind_direction; ?>"><?php echo $wind_speed; ?></span> m/s &nbsp;&nbsp;&nbsp;&nbsp;<span class="weathervane">c</span></td>
                <!--<td colspan="2">Wind: <span id="wind-speed"><?php echo $wind_speed; ?></span> m/s <span class="weathervane"> c </span></td>-->
              <tr/>
            </table>
              <!--<li>Humidity: <span id="humidity"><?php echo $humidity; ?></span>%</li>
              <li>Wind: <span id="wind-speed"><?php echo $wind_speed; ?></span> m/s <?php echo $wind_deg; ?></li>
              <li>UVI: <span id="uvi" class="<?php echo $uvi_class; ?>"><?php  $formatted_uvi = number_format($uvi, 1); echo $formatted_uvi; ?></span></li>
              <li>Pressure: <span id="pressure"><?php echo $pressure; ?> hPa</span></li>-->
          </div>
        </div>
      </div>

      <!-- Right column for forecast -->
      <div class="right-column">
        <div class="forecast-container">
          <object id="forecast-image" type="image/svg+xml" data="../img/forecast.svg" width="100%" height="auto"></object>
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
      <div class="bottom-left">
        <div id="sun-container" style="display: block;">
          <svg id="orrery" height="280" width="300" viewbox="10 0 500 500">
            <defs>
              <mask id="dimmer">
                <rect x="0" y="0" width="500" height="250" fill="#ffffff" />
                <rect x="0" y="200" width="500" height="250" fill="#777777" />
              </mask>
            </defs>

            <circle id="arc" cx="250" cy="200" r="150" fill="none" stroke="lightblue" stroke-width="8" mask="url(#dimmer)"></circle>
            <circle id="sun" cx="250" cy="200" r="20" fill="orange"></circle>

            <line id="sunrise-line" x1="94" y1="201" x2="104" y2="201" style="stroke:black;stroke-width:1"></line>
            <line id="sunset-line" x1="396" y1="201" x2="404" y2="201" style="stroke:black;stroke-width:1"></line>

            <!-- Weather Icon dynamically added here -->
            <image id="weather-icon" xlink:href="img/weather/icon/<?php echo $weather_icon; ?>.svg" width="200" height="200" x="150" y="100" />

            <circle id="m_arc" cx="250" cy="200" r="110" fill="none" stroke="grey" stroke-width="6" mask="url(#dimmer)"></circle>
            <circle id="moon" cx="250" cy="200" r="15" fill="lightgrey"></circle>
            <!--<rect width="500" height="200" x="0" y="200" fill-opacity="0.5" fill="black" />-->
            <text id="sunrise-time" x="-10" y="210" fill="#777777" font-size="2vw" data-timestamp="<?php echo $sunrise; ?>"><?php echo date('H:i', $sunrise); ?></text>
            <text id="sunset-time" x="430" y="210" fill="#777777" font-size="2vw" data-timestamp="<?php echo $sunset; ?>"><?php echo date('H:i', $sunset); ?></text>
          </svg>
        </div>
      </div>
      <div class="bottom-center">
        <div class="seven-day">
          <?php
          // Iterate through each day div (plus1 to plus7)
          for ($i = 1; $i <= 7; $i++) {
              $jsonFile = "daily/plus$i.json"; // Adjust path as per your setup

              if (file_exists($jsonFile)) {
                  // Read JSON file
                  $jsonContents = file_get_contents($jsonFile);
                  $data = json_decode($jsonContents, true);

                  if ($data && isset($data['dt'], $data['icon'], $data['min'], $data['max'])) {
                      // Extract data
                      $timestamp = $data['dt'];
                      $icon = $data['icon'];
                      $minTemp = intval($data['min']);
                      $maxTemp = intval($data['max']);

                      // Convert epoch to abbreviated day name
                      $dayOfWeek = date('D', $timestamp);

                      // Construct weather icon path
                      $iconPath = "img/weather/icon/$icon.svg"; // Adjust path as per your setup

                      // Output HTML
                      echo "<div class='day-container'>";
                      echo "<div id='dayname-plus$i' class='dayname'>$dayOfWeek</div>";
                      echo "<div id='condition-plus$i' class='condition'><img src='$iconPath' width='32' height='32'></div>";
                      echo "<div id='min-max-plus$i' class='min-max'>$minTemp&deg; / $maxTemp&deg;</div>";
                      echo "</div>";
                  } else {
                      echo "Error: Invalid data format in plus$i.json.";
                  }
              } else {
                  echo "Error: plus$i.json not found.";
              }
          }
          ?>
        </div>
      </div>
      <div class="bottom-right">
        <div id="moon-phase">
          <img src="<?php echo $moonPhaseImage; ?>" alt="Moon Phase">
        </div>
      </div>
    </div>
  </div>
  <div id="alert-container" class="alert-container">
    <pre><?php echo $alert_message; ?></pre>
  </div>
  <script src="js/main.js"></script>
</body>
</html>
