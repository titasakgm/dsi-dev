#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'rubygems'
require 'pg'

def update(gid, center)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "UPDATE province SET center='#{center}' "
  sql += "WHERE gid='#{gid}' "
  res = con.exec(sql)
  con.close
end

con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
sql = "SELECT gid,center(the_geom) "
sql += "FROM province"
res = con.exec(sql)
con.close

res.each do |rec|
  gid = rec[0]
  center = rec[1].tr('()','')
  update(gid,center)
end

