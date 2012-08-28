#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'json'
require 'pg'


=begin
Database: dsi
Table: kml

id       | integer           | not null default nextval('kml_id_seq'::regclass)
kmlname  | character varying |
name     | character varying |
descr    | character varying |
the_geom | geometry          |   
imgname  | character varying |
=end

def insert_kml(kmlname,name,descr,imgname,loc)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
  sql = "INSERT INTO kml (kmlname,name,descr,imgname,the_geom) "
  sql += "VALUES('#{kmlname}','#{name}','#{descr}','#{imgname}',geometryfromtext(\'#{loc}\',4326))"
  res = con.exec(sql)
  con.close
end

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
name = c['name']
layer = c['icon'].split('_').last

# strip icon1 -> 1 -> layer_1
layer = layer.gsub(/icon/,'')

kmlname = "layer_#{layer}"
descr = c['description']
imgname = c['imgname']
loc = c['location']

insert_kml(kmlname,name,descr,imgname,loc)

data = {}
data['success'] = true

print <<EOF
Content-type: text/html

#{data.to_json}
EOF

#generate_kml(kmlname)
