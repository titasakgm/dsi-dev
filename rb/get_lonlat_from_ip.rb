#!/usr/local/rvm/bin/ruby

require 'rubygems'
require 'geo_ip'

GeoIp.api_key = 'c17f7c8328438300c26954b002775b8b79b17636647426c1d5115af423c51d71'
GeoIp.timeout = 10

ip = ENV['REMOTE_ADDR']
h = GeoIp.geolocation(ip)

lon = h[:longitude]
lat = h[:latitude]

data = "{success:true, 'lon':#{lon}, 'lat':#{lat}}"

print <<EOF
Content-type: text/html

#{data}
EOF

