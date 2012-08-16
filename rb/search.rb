#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'pg'

c = CGI::new
kw = c['kw']

def check_ccaatt(kw)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","postgres")
  sql = "select gid,prov_nam_t,center from province where prov_nam_t LIKE '%#{kw}%' "
  sql += "ORDER BY gid"
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  name = center = nil
  lon = lat = nil
  i = []
  if (found == 1)
    gid = res[0][0]
    name = res[0][1]
    center = res[0][2]
    ll = center.split(',')
    lon = ll.first
    lat = ll.last
  else
    gid = res[0][0]
    name = res[0][1]
    center = res[0][2]
    ll = center.split(',')
    lon = ll.first
    lat = ll.last
  end
  i.push(gid)
  i.push(name)
  i.push(lon)
  i.push(lat)
  i
end

ccaatt = check_ccaatt(kw)

gid = ccaatt[0]
name = ccaatt[1]
lon = ccaatt[2]
lat = ccaatt[3]

msg = "1 record found"
data = "{'msg':'#{msg}','gid':'#{gid}','name':'#{name}','lon':'#{lon}','lat':'#{lat}'}"

# Create hilight for this gid province

map = open("/ms521/map/hili.tpl").readlines.to_s.gsub('XX',"gid = '#{gid}'")
File.open("/ms521/map/hili.map","w").write(map)

print <<EOF
Content-type: text/html

#{data}
EOF
