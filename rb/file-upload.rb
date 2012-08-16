#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'
require 'rubygems'
require 'json'
require 'pg'

# Database: dsi
# Table: photos
# Schema
#  id serial
#  filename varchar
def check_dup(fn)
  con = PGconn.connect("localhost",5432,nil,nil,"dsi","admin")
  sql = "SELECT filename FROM photos "
  sql += "WHERE filename = '#{fn}'"
  res = con.exec(sql)
  count = res.num_tuples
  if count == 0
    sql = "INSERT INTO photos (filename) "
    sql += "VALUES ('#{fn}')"
    res = con.exec(sql)
  end
  con.close
  return (count == 0) ? false : true
end

c = CGI::new
params = c.params
imgname = 'NA'

if params.has_key?"file"
  file = params["file"].first
  type = file.original_filename.split('.').last
  id = rand(100000000)
  imgname = "#{id}.#{type.downcase}"
  while check_dup(imgname)
    id = rand(100000000)
    imgname = "#{id}.#{type.downcase}"  
  end
  
  #server_file = '../photos/' + file.original_filename
  server_file = '../photos/' + "#{id}.#{type}"
  File.open(server_file.untaint, "w") do |f|
    f << file.read
  end
end

data = {}
data['success'] = true
data['imgname'] = imgname
data['origname'] = file.original_filename

print <<EOF
Content-type: text/html

#{data.to_json}
EOF
