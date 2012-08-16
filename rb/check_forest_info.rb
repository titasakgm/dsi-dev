#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'pg'

def log(msg)
  log = open("/tmp/dsimapcloud.log","a")
  log.write(msg)
  log.write("\n")
  log.close
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
    res.each do |rec|
      name = '<b><bi>เขตอุทยาน' << rec['name_th'] << '</i></b>'
    end
  end
  name
end

def check_rforest(lon,lat)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select name_th,mapsheet,area_decla,dec_date,ratchakija,ton "
  sql += "from reserve_forest "
  sql += "where contains(the_geom,"
  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
  log("check_rforest-sql: #{sql}")
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  msg = "NA"
  if (found == 1)
    res.each do |rec|
      name = rec['name_th']
      mapsheet = rec['mapsheet']
      area_decla = rec['area_decla']
      # Add comma to large number
      area_decla = area_decla.to_s.reverse.gsub(/(\d{3})(?=\d)/, '\\1,').reverse
      dec_date = rec['dec_date']
      ratchakija = rec['ratchakija']
      ton = rec['ton']
      msg = "<font face=\"time, serif\" size=\"4\"><b><i>เขตป่าสงวน#{name}</i></b><br />ระวาง: #{mapsheet}<br/>"
      msg += "เนื้อที่: #{area_decla} ไร่<br />"
      msg += "ประกาศเมื่อ: #{dec_date}<br />"
      msg += "ราชกิจจานุเบกษา เล่ม: #{ratchakija} ตอนที่: #{ton}</font>"
    end
  end
  #log("check_rforest-msg: #{msg}")
  msg 
end

def check_m30forest(lon,lat)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select area,rai "
  sql += "from mangrove_2530 "
  sql += "where contains(the_geom,"
  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
  #log("check_m30forest-sql: #{sql}")
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  msg = "NA"
  if (found == 1)
    res.each do |rec|
      area = sprintf("%.2f", rec['area'].to_f)
      rai = sprintf("%.2f", rec['rai'].to_f)
      msg = "<font face=\"time, serif\" size=\"4\"><b><i>เขตป่าชายเลน 2530</i></b><br />"
      msg += "พื้นที่:#{area} ตร.ม. (#{rai} ไร่)</font>"
    end
  end
  #log("check_m30forest-msg: #{msg}")
  msg 
end

def check_m43forest(lon,lat)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select area,rai "
  sql += "from mangrove_2543 "
  sql += "where contains(the_geom,"
  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
  #log("check_m43forest-sql: #{sql}")
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  msg = "NA"
  if (found == 1)
    res.each do |rec|
      area = sprintf("%.2f", rec['area'].to_f)
      rai = sprintf("%.2f", rec['rai'].to_f)
      msg = "<font face=\"time, serif\" size=\"4\"><b><i>เขตป่าชายเลน 2543</i></b><br />"
      msg += "พื้นที่:#{area} ตร.ม. (#{rai} ไร่)</font>"
    end
  end
  #log("check_m43forest-msg: #{msg}")
  msg 
end

def check_m52forest(lon,lat)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select lu52_nam,amphoe_t,prov_nam_t,sq_km "
  sql += "from mangrove_2552 "
  sql += "where contains(the_geom,"
  sql += "geometryfromtext('POINT(#{lon} #{lat})',4326))"
  #log("check_m52forest-sql: #{sql}")
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  msg = "NA"
  if (found == 1)
    res.each do |rec|
      name = rec['lu52_nam']
      amp = rec['amphoe_t']
      prov = rec['prov_nam_t']
      area = sprintf("%.2f", rec['sq_km'].to_f)
      msg = "<font face=\"time, serif\" size=\"4\"><b><i>เขต#{name} 2552</i></b><br />"
      msg += "#{amp} #{prov}<br />"
      msg += "พื้นที่:#{area} ตร.ม.</font>"
    end
  end
  #log("check_m52forest-msg: #{msg}")
  msg 
end

c = CGI::new
layer = c['layer']
lon = c['lon'].to_f
lat = c['lat'].to_f

msg = nil

if layer == 'national_park'
  msg = check_npark(lon,lat)
elsif layer == 'reserve_forest'
  msg = check_rforest(lon,lat)
elsif layer == 'mangrove_2530'
  msg = check_m30forest(lon,lat)
elsif layer == 'mangrove_2543'
  msg = check_m43forest(lon,lat)
elsif layer == 'mangrove_2552'
  msg = check_m52forest(lon,lat)
end

data = "{'msg':'#{msg}','lon':'#{lon}','lat':'#{lat}'}"

print <<EOF
Content-type: text/html

#{data}
EOF
