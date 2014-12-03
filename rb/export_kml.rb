#!/usr/local/rvm/bin/ruby

require 'cgi'
c = CGI::new
title = c['title']
polygon = c['polygon']
desc = c['desc']
kml = <<EOF
<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<kml xmlns=\"http://www.opengis.net/kml/2.2\" xmlns:gx=\"http://www.google.com/kml/ext/2.2\" xmlns:kml=\"http://www.opengis.net/kml/2.2\" xmlns:atom=\"http://www.w3.org/2005/Atom\">
<Document>
  <name>#{title}</name>
  <Style id=\"background\">
    <PolyStyle>
      <color>ff6871ff</color>
    </PolyStyle>
  </Style>
  <Placemark>
    <name>#{title}</name>
    <description>
      #{desc}
    </description>
    <styleUrl>#background</styleUrl>
    <Polygon>
      <tessellate>1</tessellate>
      <outerBoundaryIs>
        <LinearRing>
          <coordinates>
            #{polygon}
          </coordinates>
        </LinearRing>
      </outerBoundaryIs>
    </Polygon>
  </Placemark>
</Document>
</kml>
EOF

print <<EOF
Content-type: application/xml
Content-Disposition: attachment; filename="#{title}.kml"

#{kml}

EOF