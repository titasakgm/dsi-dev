#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'net/http'

def log(msg)
  File.open("/tmp/search-google-new","a").write(msg)
  File.open("/tmp/search-google-new","a").write("\n")
end

def google(kw)

  w = Net::HTTP.new("maps.google.co.th")
  req = "/maps?q=#{kw}"

  resp,data = w.get(req)

  data = data.gsub(/\}/,"\n")

  lon = lat = nil

  data.each do |line|
    l = line.chomp.gsub(/<.*?>/,'').strip
    if l =~ /viewport\:\{center\:/
      ll = l.split(/lat/).last.tr(':','').split(/\,lng/)
      lon = ll.last
      lat = ll.first
      break
    end
  end
  lonlat = [lon,lat]
end

c = CGI::new
kw = c['kw']

lonlat = google(kw)

name = kw
lon = lonlat.first
lat = lonlat.last

data = "{'text':'#{text}','name':'#{name}','lon':'#{lon}','lat':'#{lat}','table':'#{table}'}"

print <<EOF
Content-type: text/html

#{data}
EOF
