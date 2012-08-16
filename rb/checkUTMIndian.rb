#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'pg'

def log(msg)
  log = open("/tmp/checkUTMIndian.log","a")
  log.write(msg)
  log.write("\n")
  log.close
end

def dms2dd(dd,mm,ss)
  d = dd.to_f
  m = mm.to_f / 60.0
  s = ss.to_f / 3600.0
  decimal_degree = d + m + s
end

def convert_gcs(n,e,z)
  if z == '47'
    srid = 24047
  else
    srid = 24048
  end

  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "SELECT astext(transform(geometryfromtext('POINT(#{e} #{n})',#{srid}), 4326)) as geom"
  log("sql: #{sql}")
  res = con.exec(sql)
  con.close

  #POINT(100.566084211455 13.8907665943153)
  point = res[0]['geom'].to_s.split('(').last.tr(')','').split(' ')
  lon = point.first
  lat = point.last
  return [lon,lat]
end

def check_npark(lon,lat)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select name_th from national_park where contains(the_geom,"
  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  name = "NA"
  if (found == 1)
    name = res[0]['name_th']
  end
  name
end

def check_rforest(lon,lat)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select name_th from reserve_forest where contains(the_geom,"
  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  name = "NA"
  if (found == 1)
    name = res[0]['name_th']
  end
  name
end

#def check_uforest(lon,lat)
#  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
#  sql = "select forest_n from use_forest where contains(the_geom,"
#  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
#  res = con.exec(sql)
#  con.close
#  found = res.num_tuples
#  name = "NA"
#  if (found == 1)
#    name = res[0][0]
#  end
#  name
#end

c = CGI::new
utmn = c['utmn']
utme = c['utme']
zone = c['zone']

lonlat = convert_gcs(utmn, utme, zone)

lon = lonlat.first
lat = lonlat.last

npark = check_npark(lon,lat)
rforest = check_rforest(lon,lat)
#uforest = check_uforest(lon,lat)

msg = "พิกัด #{utmn}:N "
msg += "#{utme}:E<br>"
msg += "Zone #{zone} (Indian 1975)<br>"

if (npark == "NA")
  msg += "<br><b><font color=\"green\">ไม่อยู่ในเขตอุทยานแห่งชาติ</font></b>"
else
  msg += "<br><b><font color=\"red\">อยู่ในเขตอุทยานแห่งชาติ#{npark}</font></b>"
end

if (rforest == "NA")
  msg += "<br><b><font color=\"green\">ไม่อยู่ในเขตป่าสงวน</font></b>"
else
  msg += "<br><b><font color=\"red\">อยู่ในเขตป่าสงวน#{rforest}</font></b>"
end

#if (uforest == "NA")
#  msg += "<br><b><font color=\"green\">ไม่อยู่ในเขตป่า use forest</font></b>"
#else
#  msg += "<br><b><font color=\"red\">อยู่ในเขตป่า #{uforest}</font></b>"
#end

data = "{'msg':'#{msg}','lon':'#{lon}','lat':'#{lat}'}"

print <<EOF
Content-type: text/html

#{data}
EOF
