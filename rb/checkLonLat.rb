#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
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

con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
sql = "select name_th from national_park where contains(the_geom, geometryfromtext('POINT(#{lon} #{lat})',4326))"
res = con.exec(sql)
con.close

found = res.num_tuples

if (found > 0)
  name = res[0][0]
  msg = "พิกัด #{ladd}&deg; #{lamm}&apos; #{lass}&quot; N "
  msg += "#{lodd}&deg; #{lomm}&apos; #{loss}&quot; E<br><br>"
  msg += "<b><font color=\"red\">อยู่ในเขตอุทยานแห่งชาติ#{name}</font></b>"
else
  msg = "พิกัด #{ladd}&deg; #{lamm}&apos; #{lass}&quot; N "
  msg += "#{lodd}&deg; #{lomm}&apos; #{loss}&quot; E<br><br>"
  msg += "<b><font color=\"green\">ไม่อยู่ในเขตอุทยานแห่งชาติ</font></b>"
end

data = "{'msg':'#{msg}','lon':'#{lon}','lat':'#{lat}'}"

print <<EOF
Content-type: text/html

#{data}
EOF
