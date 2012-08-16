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

def check_records()
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
  sql = "SELECT * FROM kml "
  res = con.exec(sql)
  found = res.num_tuples
  if (found == 0)
    sql = "ALTER SEQUENCE kml_id_seq RESTART WITH 1"
    res = con.exec(sql)
  end
  con.close
end

c = CGI::new
id = c['id']

con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
sql = "DELETE FROM kml "
sql += "WHERE id=#{id} "
res = con.exec(sql)
con.close

data = {}
data['success'] = true

print <<EOF
Content-type: text/html

#{data.to_json}
EOF

# Restart SEQUENCE to 1 if 0 record found in kml
check_records()
