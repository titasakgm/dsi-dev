#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
#require 'rubygems'
require 'pg'

def dms2dd(dd,mm,ss)
  d = dd.to_f
  m = mm.to_f / 60.0
  s = ss.to_f / 3600.0
  decimal_degree = d + m + s
end

c = CGI::new
lodd = c['lodd']
lomm = c['lomm']
loss = c['loss']
ladd = c['ladd']
lamm = c['lamm']
lass = c['lass']

lon = dms2dd(lodd,lomm,loss)
lat = dms2dd(ladd,lamm,lass)

def check_npark(lon,lat)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select name_th from national_park where contains(the_geom,"
  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  name = "NA"
  if (found == 1)
    res.each do |rec|
      name = rec['name_th']
    end
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
    res.each do |rec|
      name = rec['name_th']
    end
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

npark = check_npark(lon,lat)
rforest = check_rforest(lon,lat)
#uforest = check_uforest(lon,lat)

msg = "พิกัด #{ladd}&deg; #{lamm}&apos; #{lass}&quot; N "
msg += "#{lodd}&deg; #{lomm}&apos; #{loss}&quot; E<br>"

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
