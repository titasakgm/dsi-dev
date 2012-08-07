#!/usr/bin/ruby

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
the_geom | geometry   

=end

def insert_kml(kmlname,name,descr,loc)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
  sql = "INSERT INTO kml (kmlname,name,descr,the_geom) "
  sql += "VALUES('#{kmlname}','#{name}','#{descr}',geometryfromtext(\'#{loc}\',4326))"
  res = con.exec(sql)
  con.close
end

def generate_kml(layername)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
  sql = "select id,kmlname,name,descr,astext(the_geom) as geom "
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
    place += "          <name>#{name}</name>\n"
    place += "          <styleUrl>#marker</styleUrl>\n"
    place += "          <description>#{descr}</description>\n"

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
layer = c['layer']
kmlname = "layer_#{layer}"
descr = c['description']
loc = c['location']

insert_kml(kmlname,name,descr,loc)

data = {}
data['success'] = true

print <<EOF
Content-type: text/html

#{data.to_json}
EOF

generate_kml(kmlname)