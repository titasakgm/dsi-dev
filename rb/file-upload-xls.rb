#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'json'
require 'roo'

# Fix error permission denied from roo: Excelx.new(...)
ENV['ROO_TMP'] = "/var/www/tmp"

def gen_kml(fn, s, h)

kmlpath = "../#{fn}"

k = open(kmlpath,"w")
kml = <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://earth.google.com/kml/2.1">
  <Folder>
    <name>kml</name>
    <Style id="gg-pin-green">
      <IconStyle>
        <Icon>
          <href>img/gg-pin-green.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="gg-pin-pink">
      <IconStyle>
        <Icon>
          <href>img/gg-pin-pink.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Style id="gg-pin-blue">
      <IconStyle>
        <Icon>
          <href>img/gg-pin-blue.png</href>
        </Icon>
      </IconStyle>
    </Style>
    <Placemark>
EOF
geom = lon = lat = nil
colx = nil
(2..10).each do |n|
  h.each do |hdr,col|
    colx = col
    if (hdr.downcase == 'x' or hdr.downcase == 'lon' or hdr.downcase == 'lng')
      lon = s.cell(col,n)
      next
    elsif (hdr.downcase == 'y' or hdr.downcase == 'lat')
      lat = s.cell(col,n)
      next
    end
    if (!lon.nil? and !lat.nil?)
      geom = "<coordinates>#{lon},#{lat}</coordinates>"
    end
    if (hdr.downcase == 'icon')
      kml << "      <styleUrl>##{s.cell(col,n)}</styleUrl>\n"
    else
      kml << "      <#{hdr}>#{s.cell(col,n)}</#{hdr}>\n"
    end
  end
  kml << "      <Point>\n"
  kml << "        #{geom}\n"
  kml << "      </Point>\n"
  kml << "    </Placemark>\n"
  break if s.cell(colx,n+1).to_s.strip.length == 0
  kml << "    <Placemark>\n"
  geom = lon = lat = nil
end
kml << "  </Folder>\n"
kml << "</kml>\n"

k.write(kml)
k.close
end

def create_kml(xls)
  s = Roo::Spreadsheet.open(xls)
  s.default_sheet = s.sheets.first

  # Check header
  h = {}
  max = 0
  ('A'..'Z').each do |c|
    hdr = s.cell(c,1)
      if hdr.nil?
      break
    end
    h[hdr] = c
  end

  orig_name = xls.split('/').last.split('.').first
  kmlname = "kml/#{orig_name}.kml"
  gen_kml(kmlname, s, h)
  kmlname
end

c = CGI::new
params = c.params
kmlname = 'NA'

if params.has_key?"file"
  file = params["file"].first 
  type = file.original_filename.split('.').last
  
  server_file = '../xls/' + file.original_filename
  if File.exists?(server_file)
    File.delete(server_file)
  end
  File.open(server_file.untaint, "w") do |f|
    f << file.read
  end
  kmlname = create_kml(server_file)
end

data = {}
data['success'] = true
data['kmlname'] = kmlname

print <<EOF
Content-type: text/html

#{data.to_json}
EOF
