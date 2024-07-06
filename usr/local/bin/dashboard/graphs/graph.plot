#!/usr/bin/gnuplot

# Output SVG file
set terminal svg enhanced size 600,300
set output '/var/www/html/img/forecast.svg'

# Remove title
unset title

# Remove axis labels
unset xlabel
unset ylabel

# Set multiplot layout (2 rows, 1 column)
set multiplot layout 2,1
set lmargin at screen 0.15
set rmargin at screen 0.95

# Set grid and border color
set style line 11 lc rgb "#777777" lt 1 lw 1
set border 0 front ls 11
set grid xtics lt 0 lw 1 lc rgb "#777777"
set grid mxtics lt 0 lw 1 lc rgb "#444444"

# Plot 1: Cloud cover
set size 1,0.2
set origin 0,0.85
unset xtics
unset ytics
set yrange [100:0]
set style fill solid 0.5 noborder
set datafile separator ","
#set boxwidth 0.9

# Plot bars from data file (assuming column 6 is cloud cover data)
plot '/tmp/plot2.csv' using 1:6 with boxes lc rgb "#E3FBFF" notitle
unset yrange

# Plot 2: Temperature
set border 3 front ls 11
set size 1,0.75
set origin 0,0.2
set grid xtics lt 1 lw 1 lc rgb "#444444"
set grid ytics lt 1 lw 1 lc rgb "#444444"
set xtics timedate
set xtics format "%H:%M"
set ytics scale 0
set xtics scale 0

# Get dynamic temperature values from files
max_temp = real(system("cat /var/www/html/48h/temp.max"))
min_temp = real(system("cat /var/www/html/48h/temp.min"))
max_plus = int(( max_temp + 1 ))
min_minus = int(( min_temp -1 ))
set yrange [min_minus:max_plus]

# Limit the number of ytics
num_ytics = 4  # Maximum number of ytics
tic_interval = int((max_temp - min_temp) / (num_ytics - 1))
set ytics min_temp, tic_interval, max_temp format "%.0f"

# Plot temperature (with conditional color based on freezing point)
plot '/tmp/plot2.csv' using 1:($3 >= 0 ? $3 : NaN):xtic(2) with lines lc rgb "red" notitle, \
     '' using 1:($3 < 0 ? $3 : NaN) with lines lc rgb "blue" notitle, \
     '' using 1:($7 >= 0 ? NaN : $7) with lines lc rgb "#000088" notitle, \
     '' using 1:($7 < 0 ? NaN : $7) with lines lc rgb "#65398E" notitle, \
     '' using 1:(column(10) == 1 ? 8 : NaN) with lines lt 2 lc rgb "#444444" notitle, \
     '' using 1:(column(10) == 0 ? 8 : NaN) with lines lt 2 lc rgb "#777777" notitle

#plot '/tmp/plot2.csv' using 1:($3 >= 0 ? $3 : NaN):xtic(2) with lines lc rgb "red" notitle, \
#     '' using 1:($3 < 0 ? $3 : NaN) with lines lc rgb "blue" notitle, \
#     '' using 1:($7 >= 0 ? NaN : $7) with lines lc rgb "#000088" notitle, \
#     '' using 1:($7 < 0 ? NaN : $7) with lines lc rgb "#65398E" notitle, \
#     '' using 1:8 with lines lt 2 lc rgb "black" notitle, \
#     '' using 1:(column(10) == 1 ? 8 : NaN) with lines lt 2 lc rgb "#444444" notitle, \
#     '' using 1:(column(10) == 0 ? 8 : NaN) with lines lt 2 lc rgb "#777777" notitle

unset xtics
unset ytics

# Reset multiplot
unset multiplot
