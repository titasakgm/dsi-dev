#!/usr/bin/ruby
# encoding: utf-8

require 'rubygems'
require 'pg'

def insert(text, tbl, gid)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi")
  sql = "INSERT INTO locations (loc_text,loc_table,loc_gid) "
  sql += "VALUES ('#{text}','#{tbl}','#{gid}')"
  puts sql
  res = con.exec(sql)
  con.close
end

# no_02_province
tbl = "no_02_province"
con = PGconn.connect("localhost",5432,nil,nil,"dsi")
sql = "SELECT prov_nam_t,gid FROM no_02_province"
res = con.exec(sql)
con.close

res.each do |rec|
  text = rec[0].to_s.strip
  gid = rec[1]
  insert(text,tbl,gid)
end

# no_03_amphoe
tbl = "no_03_amphoe"
con = PGconn.connect("localhost",5432,nil,nil,"dsi")
sql = "SELECT amphoe_t,gid FROM no_03_amphoe"
res = con.exec(sql)
con.close

res.each do |rec|
  text = rec[0].to_s.strip
  gid = rec[1]
  insert(text,tbl,gid)
end

# no_04_tambon
tbl = "no_04_tambon"
con = PGconn.connect("localhost",5432,nil,nil,"dsi")
sql = "SELECT tam_nam_t,gid FROM no_04_tambon"
res = con.exec(sql)
con.close

res.each do |rec|
  text = rec[0].to_s.strip
  gid = rec[1]
  insert(text,tbl,gid)
end

# no_06_muban
tbl = "no_06_muban"
con = PGconn.connect("localhost",5432,nil,nil,"dsi")
sql = "SELECT muban,gid FROM no_06_muban"
res = con.exec(sql)
con.close

n = 1
res.each do |rec|
  text = rec[0].to_s.strip
  gid = rec[1]
  insert(text,tbl,gid)
  n += 1
  sleep(3) if n % 5000 == 0
  puts n
end
