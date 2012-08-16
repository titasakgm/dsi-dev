#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'pg'
require 'net/http'

c = CGI::new
kw = c['kw']

def log(msg)
  File.open("/tmp/search-google","a").write(msg)
  File.open("/tmp/search-google","a").write("\n")
end

def get_center(text, table)
  text = text.split(' ').first
  if table =~ /province/
    cond = "prov_nam_t LIKE '%#{text}%'"
  elsif table =~ /amphoe/
    cond = "amphoe_t LIKE '%#{text}%'"
  elsif table =~ /tambon/
    cond = "tam_nam_t LIKE '%#{text}%'"
  elsif table =~ /muban/
    cond = "muban LIKE '%#{text}%'"
  else
    cond = "1 = 1"
  end
  con = PGconn.connect("localhost",5432,nil,nil,"dsi")
  sql = "SELECT center(the_geom) "
  sql += "FROM #{table} "
  sql += "WHERE #{cond}"
  log("sql: #{sql}")
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  lonlat = []
  if (found > 0)
    res.each do |rec|
      lonlat = rec[0].to_s.tr('()','').split(',')
    end
  end
  lonlat
end

def search_location(kw)

  con = PGconn.connect("localhost",5432,nil,nil,"dsi")
  sql = "SELECT loc_text,loc_table "
  sql += "FROM locations "
  sql += "WHERE loc_text LIKE '%#{kw}%' "
  sql += "ORDER BY id DESC"
  res = con.exec(sql)
  con.close
  data = []
  text = table = nil
  found = res.num_tuples
  match = false

  if (found > 0)
    res.each do |rec|
      xtext = rec[0]
      xtable = rec[1]
      if (xtable =~ /muban/ && !match)
        text = xtext
        table = xtable
        match = true if (text =~ /#{kw}/)
      end
      if (xtable =~ /province/)
        text = xtext
        table = xtable
        match = true if (text =~ /#{kw}/)
      end
      if (xtable =~ /amphoe/)
        text = xtext
        table = xtable
        match = true if (text =~ /#{kw}/)
      end
      if (xtable =~ /tambon/)
        text = xtext
        table = xtable
        match = true if (text =~ /#{kw}/)
      end    
    end
  end
  lonlat = get_center(text, table)
  data = [text,table] << lonlat
  data    
end

def google(kw)

  w = Net::HTTP.new("maps.google.co.th")
  req = "/maps?q=#{kw}"

  resp,data = w.get(req)

  data = data.gsub(/\}/,"\n")

  lon = lat = nil

  data.each do |line|
    l = line.chomp.gsub(/<.*?>/,'').strip
    if l =~ /viewport\:\{center\:/
      ll = l.split(/lat/).last.tr(':','').split(/\,lng/)
      lon = ll.last
      lat = ll.first
      break
    end
  end
  lonlat = [lon,lat]
end

##### Create hilight for this gid province
mysearch = search_location(kw)

#log("mysearch: #{mysearch.join('|')}")

geom = "POLYGON"
text = mysearch[0]
table = mysearch[1]
lonlat = mysearch[2]
filter = ''

if table =~ /province/
  filter = "prov_nam_t LIKE '%#{text}%'"
elsif table =~ /amphoe/
  filter = "amphoe_t LIKE '%#{text}%'"
elsif table =~ /tambon/
  filter = "tam_nam_t LIKE '%#{text}%'"
elsif table =~ /muban/
  filter = "muban LIKE '%#{text}%'"
  geom = "POINT"
end

#log("filter: #{filter}")

map = open("/ms521/map/search.tpl").readlines.to_s.gsub('#GEOM#',"#{geom}").gsub('#TABLE#',"#{table}").gsub('#FILTER#',"#{filter}")

File.open("/ms521/map/hili.map","w").write(map)
##### End of create hilight

if lonlat.nil?
  lonlat = google(kw)
end

name = kw
lon = lonlat.first
lat = lonlat.last

msg = data = "{'text':'#{text}','name':'#{name}','lon':'#{lon}','lat':'#{lat}','table':'#{table}'}"

print <<EOF
Content-type: text/html

#{data}
EOF
