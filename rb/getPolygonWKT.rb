#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'pg'

def log(msg)
  log = open("/tmp/getPolygonWKT","a")
  log.write(msg)
  log.write("\n")
  log.close
end

c = CGI::new
table = c['table']
gid = c['gid']

con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
sql = "SELECT gid,astext(the_geom) "
sql += "FROM #{table} "
sql += "WHERE gid=#{gid} "

log("sql: #{sql}")

res = con.exec(sql)
con.close

gidx = res[0][0]
geometry = res[0][1]

log("gidx: #{gidx}")
log("geometry: #{geometry}")

#geometry = "MULTIPOLYGON((104.97 16.27,105 16,104.5 16,104.97 16.27))"

print <<EOF
Content-type: text/html

#{geometry}
EOF

