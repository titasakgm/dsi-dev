#!/usr/local/rvm/bin/ruby
# -*- encoding : utf-8 -*-

require 'cgi'

c = CGI::new
gid = c['gid']

map = open("/ms521/map/hili.tpl").readlines.to_s.gsub('XX',gid)
File.open("/ms521/map/hili.map","w").write(map)

