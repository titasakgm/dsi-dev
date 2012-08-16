#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'pg'

con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
sql = "DELETE FROM kml "
res = con.exec(sql)
sql = "ALTER SEQUENCE kml_id_seq RESTART WITH 1"
res = con.exec(sql)
con.close


