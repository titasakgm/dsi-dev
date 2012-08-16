#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'json'
require 'pg'

def generate_kml(layername)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
  sql = "select id,kmlname,name,descr,imgname,astext(the_geom) as geom "
  sql += "FROM kml "
  sql += "WHERE kmlname = '#{layername}' "
  res = con.exec(sql)
  con.close
  
  header = open("#{layername}-header").readlines.join()
  footer = open("#{layername}-footer").readlines.join()

  place = nil
  
  n = 0
  res.each do |rec|
    n += 1
    id = rec['id']
    kmlname = rec['kmlname']
    name = rec['name']
    descr = rec['descr']
    imgname = rec['imgname']
    geom = rec['geom']
    coord = 'NA'
    if geom =~ /POINT/
      ll = geom.split('POINT(').last.split(')').first
      coord = ll.tr(' ',',')
    end

    if (n == 1)
      place =  "        <Placemark>\n"
    else
      place +=  "        <Placemark>\n"
    end
    place += "          <id>#{id}</id>\n"
    place += "          <name>#{name}</name>\n"
    place += "          <styleUrl>#marker</styleUrl>\n"
    place += "          <description>#{descr}</description>\n"

    if (imgname.to_s.length > 0)
      place += "          <imgUrl>http://203.151.201.129/dsix/photos/#{imgname}</imgUrl>\n"
    end
    
    if (geom =~ /POINT/)
      place += "          <Point>\n"
      place += "            <coordinates>#{coord}</coordinates>\n"
      place += "          </Point>\n"
      place += "        </Placemark>\n"
    end    
  end
  kml = header << place << footer
  
  # Write new kml to file
  File.open("../kml/#{layername}.kml","w").write(kml)
end

c = CGI::new
id = c['id']
layer = c['layer']

con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
sql = "DELETE FROM kml "
sql += "WHERE id='#{id}' "
res = con.exec(sql)
con.close

# Rebuild KML for this layer (1/2)
generate_kml(layer)
