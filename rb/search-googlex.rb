#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'net/http'
require 'rubygems'
require 'json'
require 'pg'

def log(msg)
  f = open("/tmp/search-googlex","a")
  f.write(msg)
  f.write("\n")
  f.close
end

def create_hili_map(table,gids)

  ##### Start create hilimap according to query with exact = 1
  geom = "POLYGON"
  filter = "gid in (#{gids.join(',')})"
  if table =~ /muban/
    geom = "POINT"
  end

  log("filter: #{filter}")
  src = open('/ms603/map/search.tpl').readlines
  dst = open('/ms603/map/hili.map','w')
  
  src.each do |line|
    if line =~ /XXGEOMXX/
      line = line.gsub(/XXGEOMXX/,"#{geom}")
    elsif line =~ /XXTABLE/
      line = line.gsub(/XXTABLEXX/,"#{table}")
    elsif line =~ /XXFILTERXX/
      line = line.gsub(/XXFILTERXX/,"#{filter}")
    end
    dst.write(line)
  end
  dst.close
  ##### End of create hilight

end

def get_center(table,gid)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
  sql = "SELECT center(the_geom) as centerx "
  sql += "FROM #{table} "
  sql += "WHERE gid=#{gid}"
  
  log("get_center:sql: #{sql}")
  
  res = con.exec(sql)
  con.close
  found = res.num_tuples
  lonlat = []
  if (found == 1)
    res.each do |rec|
      lonlat = rec['centerx'].to_s.tr('()','').split(',')
      lon = sprintf("%0.2f", lonlat[0].to_f)
      lat = sprintf("%0.2f", lonlat[1].to_f)
      lonlat = [lon,lat]
    end
  end
  lonlat
end

def search_location(query, start, limit, exact)
  lon = lat = 0.0
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
  cond = nil

  if exact == 1
    sql = "SELECT loc_gid,loc_text,loc_table "
    sql += "FROM locations "

    if query =~ /^จ./
      sql += "WHERE loc_text = '#{query}' "
    else
      sql += "WHERE loc_text = '#{query}' LIMIT 1"
    end

    res = con.exec(sql)

    gids = []
    gid = 0
    text = nil
    table = nil
    res.each do |rec|
      gid = rec['loc_gid']
      gids.push(gid)
      text = rec['loc_text']
      table = rec['loc_table']
    end
  
    lonlat = get_center(table,gids[0])
    lon = lonlat[0]
    lat = lonlat[1]  
  
    create_hili_map(table,gids)
  
    return_data = Hash.new
    return_data[:success] = true
    return_data[:totalcount] = 1
    return_data[:records] = [{
      :loc_gid => gid,
      :loc_text => text,
      :loc_table => table,
      :lon => lon, 
      :lat => lat
    }]    
    return return_data
  end
  
  # add space check in query
  if query =~ /\./ and query.strip !~ /\ /     
    cond = "loc_text LIKE '#{query}%' "
  elsif query.strip =~ /\ /
    kws = query.strip.split(' ')
    (0..kws.length-1).each do |n|
      if n == 0
        if kws[0][1..1] == '.' # ต. อ. จ.
          cond = "loc_text LIKE '#{kws[n]}%' "
        else
          cond = "loc_text LIKE '%#{kws[n]}%' "
        end
      else
        cond += "AND loc_text LIKE '%#{kws[n]}%' "
      end
    end
  else
    cond = "loc_text LIKE '%#{query}%' "
  end

  #log("cond: #{cond}")
  
  sql = "SELECT count(*) as cnt FROM locations WHERE #{cond}" 

  #log("sql: #{sql}")

  res = con.exec(sql)
  found = 0
  res.each do |rec|
    found = rec['cnt'].to_i
  end

  return_data = nil
  
  if (found > 1)
    sql = "SELECT loc_gid,loc_text,loc_table "
    sql += "FROM locations "
    sql += "WHERE #{cond} "
    sql += "ORDER BY id DESC "
    sql += "LIMIT #{limit} OFFSET #{start}"

    #log("sql:found>1: #{sql}")

    res = con.exec(sql)
    records = []
    res.each do |rec|
      gid = rec['loc_gid']
      text = rec['loc_text']
      table = rec['loc_table']
      h = {:loc_gid => "#{gid}", :loc_text => "#{text}", :loc_table => "#{table}"}
      records.push(h)
    end
    
    #log("records[]: #{records}")
    
    return_data = Hash.new
    return_data[:success] = true
    return_data[:totalcount] = found
    return_data[:records] = records
    
  elsif found == 1 # exact != 1
    sql = "SELECT loc_gid,loc_text,loc_table "
    sql += "FROM locations "
    sql += "WHERE loc_text LIKE '#{query}%' "

    #log("sql:found=1: #{sql}")

    res = con.exec(sql)
    gids = []
    gid = 0
    text = nil
    table = nil
    res.each do |rec|
      gid = rec['loc_gid']
      gids.push(gid)
      text = rec['loc_text']
      table = rec['loc_table']
    end
  
    lonlat = get_center(table,gids[0])
    lon = lonlat[0]
    lat = lonlat[1]  
  
    create_hili_map(table,gids)
  
    return_data = Hash.new
    return_data[:success] = true
    return_data[:totalcount] = 1
    return_data[:records] = [{
      :loc_gid => gid,
      :loc_text => text,
      :loc_table => table,
      :lon => lon, 
      :lat => lat
    }]
  else # found == 0
    return_data = Hash.new
    return_data[:success] = true
    return_data[:totalcount] = 0
    return_data[:records] = [{}]
  end
  con.close
  return_data
end

c = CGI::new
query = c['query']
start = c['start'].to_i
limit = c['limit'].to_i
exact = c['exact'].to_s.to_i

if start == 0
  limit = 5
end

data = search_location(query, start, limit, exact)

#if lonlat.nil?
#  lonlat = google(kw)
#end

print <<EOF
Content-type: text/html

#{data.to_json}
EOF
