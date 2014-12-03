Ext.require([
  'Ext.container.Viewport',
  'Ext.layout.container.Border',
  'GeoExt.tree.Panel',
  'Ext.tree.plugin.TreeViewDragDrop',
  'Ext.selection.CheckboxModel',
  'GeoExt.panel.Map',
  'GeoExt.tree.OverlayLayerContainer',
  'GeoExt.tree.BaseLayerContainer',
  'GeoExt.data.LayerTreeModel',
  'GeoExt.tree.View',
  'GeoExt.tree.Column',
  'GeoExt.ux.GoogleEarthPanel',
  'GeoExt.ux.GoogleEarthClick',

  // Add print Preview + Create PDF 05/08/2012
  'GeoExt.data.MapfishPrintProvider',
  'GeoExt.panel.PrintMap',

  // Add popup + Input Form 05/08/2012
  'GeoExt.window.Popup',
  'Ext.form.Panel',
  'Ext.layout.container.Column',
  'Ext.layout.container.Accordion',
  'Ext.layout.container.Border',
  'Ext.tab.Panel',
  'Ext.form.field.ComboBox',
  'Ext.form.field.Date',
  'Ext.form.field.HtmlEditor',

  // Add kml store
  'GeoExt.data.FeatureStore',
  'GeoExt.data.proxy.Protocol'

]);

Ext.define('Polygon', {
  extend: 'Ext.data.Model',
  fields: [
    {
      name: 'lat',
      type: 'float'
    }, {
      name: 'lon',
      type: 'float'
    }
  ]
});

Ext.application({
  name: 'Tree',
  launch: function() {
    // DSI location
    var center = new OpenLayers.LonLat(100.5657899,13.89071588);
    var dsi = center.transform(gcs,merc);

    var ctrl = new OpenLayers.Control.NavigationHistory();
    // Add Bing Map
    // API key for http://203.151.201.129/dsi
    var apiKey = "AnXErkelqCPb0UC5K-lCookgNa4-IwF1Cehgg9En9wcFz7iGblBxbZfm4484_qqK";

    OpenLayers.ProxyHost = "/cgi-bin/proxy.cgi?url=";

    map = new OpenLayers.Map({
      projection: new OpenLayers.Projection("EPSG:900913"),
      displayProjection: new OpenLayers.Projection("EPSG:4326"),
      units: "m",
      maxResolution: 156543.0339,
      maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,20037508.34, 20037508.34),
      controls: [
        new OpenLayers.Control.PanZoomBar(),
        new OpenLayers.Control.MousePosition(),
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.LayerSwitcher(),
        new OpenLayers.Control.OverviewMap(),
        new OpenLayers.Control.ScaleLine({geodesic: true}),
        ctrl
      ]
    });

    map.events.register("click", map, function(e){
      var lonlat = map.getLonLatFromViewPortPx(e.xy).transform(merc, gcs);
      var activelayers = map.getLayersBy("visibility", true);
      for(i=0;i<activelayers.length;i++) {
        if (activelayers[i].name.search('เขต') != -1 || activelayers[i].name.search('ชายเลน') != -1)
        check_forest_info(activelayers[i].name, lonlat);
      }
    });

    map.events.register('changelayer', null, function(evt){
      if (evt.layer.name == 'Google Earth') {
      var o = Ext.getCmp('id_east');
      if (o.collapsed)
        o.expand();
      else
        o.collapse();
      }
    });

    // Create all objects declared in map_utils.js
    create_styles();
    create_layer_vectorLayer();
    create_layer_markers();
    create_layer_hili();

    //should WAIT until user click Add Custom Layer
    //create_layer_pointLayer();

    var toolbarItems = [], action;

    action = Ext.create('GeoExt.Action',{
      tooltip: 'กลับสู่แผนที่เริ่มต้น',
      iconCls: 'zoomfull',
      handler: function(){
        map.setCenter(dsi, 5);
      },
      allowDepress: false
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    // Add my_location
    action = Ext.create('GeoExt.Action',{
      tooltip: 'ไปยังตำแหน่งปัจจุบัน',
      iconCls: 'my_location',
      handler: function(){
        Ext.Ajax.request({
          url: 'rb/get_lonlat_from_ip.rb'
          ,params: {
            method: 'GET'
            ,format: 'json'
          }
          ,failure: function(response, opts){
            alert("get_lonlat_from_ip.rb > failure");
            return false;
          }
          ,success: function(response, opts){
            // var data = eval( '(' + response.responseText + ')' );
            // No response from IE
            var data = Ext.decode(response.responseText);
            var lon = parseFloat(data.lon);
            var lat = parseFloat(data.lat);

            var p1 = new OpenLayers.LonLat(lon,lat);
            p2 = p1.transform(gcs,merc);
            map.setCenter(p2, 8);

            var size = new OpenLayers.Size(48,48);
            var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
            var icon = new OpenLayers.Icon('img/my_locationx.png', size, offset);
            markers.addMarker(new OpenLayers.Marker(p2,icon));
          }
        });
      },
      allowDepress: false
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    toolbarItems.push("-");

    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.ZoomBox(),
      tooltip: 'ขยายขนาดภาพแผนที่ (กดปุ่ม Shift ค้างไว้จากนั้น Click Mouse ปุ่มซ้ายมือค้างไว้แล้วลากเป็นกรอบสี่เหลี่ยมได้)',
      map: map,
      iconCls: 'zoomin',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.ZoomBox({
        out: true
      }),
      tooltip: 'ย่อขนาดภาพแผนที่ (กดปุ่ม Shift ค้างไว้จากนั้น Click Mouse ปุ่มซ้ายมือค้างไว้แล้วลากเป็นกรอบสี่เหลี่ยมได้)',
      map: map,
      iconCls: 'zoomout',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DragPan({
        isDefault: true
      }),
      tooltip: 'เลื่อนแผนที่ไปในทิศทางต่างๆ',
      map: map,
      iconCls: 'pan',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    toolbarItems.push("-");

    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point),
      tooltip: 'วางจุดบนแผนที่',
      map: map,
      iconCls: 'drawpoint',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    function showWin(map, vectorLayer){
      var winname = "radii";
      
        var win = new Ext.Window({
          id: winname,
          autoHeight: true,
          width: 300,
          constrain: true,
          collapsible: true,
          closable: true,
          layout: 'form',
          title: 'ระบุรัศมีที่ต้องการ',
          items: [  
            {
              xtype: 'fieldset',
              border: false,
              defaults: {
                labelWidth: 89,
                anchor: '100%',
                layout: {
                  type: 'hbox',
                  defaultMargins: {
                    top: 0,
                    right: 5,
                    bottom: 0,
                    left: 0
                  }
                }
              },
              items: [{
                xtype: 'fieldcontainer',
                fieldLabel: 'รัศมี',
                labelWidth: 29,
                combineErrors: false,
                defaults: {
                    hideLabel: true
                },
                items: [{
                    id: 'radius',
                    xtype: 'textfield',
                    width: 150,
                    allowBlank: false
                }, {
                    xtype: 'displayfield',
                    value: 'เมตร'
                }]
              }]
            },
            {
                xtype: 'displayfield',
                value: '** ใส่ Buffer ที่ต้องการคั่นด้วยลูกน้ำเช่น 1000,2000,3000 (มีหน่วยเป็นเมตร)',
                anchor: '100%'
            }
          ],
          buttons: [{
            text: "ยืนยัน",
            handler: function(){
              var style_color= [{
                strokeColor: "#FF0000",
                fillColor: "#FF7373",
                fillOpacity: 0.5
              },{
                strokeColor: "#FFE400",
                fillColor: "#FFF073",
                fillOpacity: 0.5
              },{
                strokeColor: "#2BBE00",
                fillColor: "#92ED6B",
                fillOpacity: 0.5
              }];
              radius = Ext.getCmp("radius");
              raduis_val = radius.getValue();
              raduis_val = raduis_val.split(",");
              $.each(raduis_val, function(idx, val){ 
                val = Number(val.trim());
                if(val && val != 0){
                  
                  var style = style_color[idx % 3];

                  var radius = val;
                  var feature = vectorLayer.features[vectorLayer.features.length - 1];
                  if (feature) {
                    var centroid = feature.geometry.getCentroid();
                    var projection = map.getProjectionObject();
                    var sides = 40;
                    var new_geom = OpenLayers.Geometry.Polygon.createGeodesicPolygon(centroid, radius, sides, 45, projection);
                    //var new_feature = new OpenLayers.Feature.Vector(new_geom);

                    
                    var new_feature = new OpenLayers.Feature.Vector(new_geom,null,style);

                    vectorLayer.addFeatures([new_feature]);
                  }

                  
                  
                }
              });
            }
          }]
        });
      
      win.show();
      var mapId = map.div.id;
      win.alignTo(Ext.getDom(mapId), 'tr-tr', [-150, 6]);
    }

    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.SelectFeature(vectorLayer, {
        hover: false,
        eventListeners: {
          featurehighlighted: function() {
            showWin(map, vectorLayer);
          },
          featureunhighlighted: function() {
            if(Ext.getCmp('radii')){
              Ext.getCmp('radii').close();
            }
            Ext.MessageBox.show({
              title:'คำแนะนำ',
              msg: 'ท่านสามารถกดปุ่ม <img src="img/delete.png"/> เพื่อลบการแสดงผล Buffer Zone',
              buttons: Ext.MessageBox.OK,
              icon: Ext.MessageBox.INFO
            })
          }
        }
      }),
      tooltip: 'วาด Buffer รอบจุดที่ต้องการบนแผนที ก่อนใช้งาน กรุณาสร้างจุดที่ต้องการก่อนโดยใช้เครื่องมือ วางจุดบนแผนที่ก่อน กดปุ่มเลือกเครื่องมือนี้ จากนั้นนำ mouse ไป click เลือกจุดดังกล่าว',
      map: map,
      iconCls: 'add_buffer',
      toggleGroup: 'map',
      allowDepress: true
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Path),
      tooltip: 'วาดเส้นตรงบนแผนที่',
      map: map,
      iconCls: 'drawline',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Polygon),
      tooltip: 'วาดรูปหลายเหลี่ยมบนแผนที่',
      map: map,
      iconCls: 'drawpolygon',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    action = Ext.create('GeoExt.Action',{
      tooltip: 'วาดรูปหลายเหลี่ยมบนแผนที่โดยสร้างจากจุดพิกัด',
      iconCls: 'grid',
      handler: function(){
        var cellEditing = Ext.create('Ext.grid.plugin.CellEditing', {
          clicksToEdit: 1,
          listeners:{
            edit: function( editor, context, eOpts ){
              context.record.commit();
            }
          }
        });
        var sm = Ext.create('Ext.selection.CheckboxModel');
        var store_polygon = Ext.create('Ext.data.ArrayStore', {
          fields: [{
            name: 'lat',
            type: 'float'
          }, {
            name: 'lon',
            type: 'float'
          }],
          data: []
        });
        var grid_polygon = Ext.create('Ext.grid.Panel', {
          id: 'grid_polygon',
          selModel: sm,
          store: store_polygon,
          height: 300,
          plugins: [cellEditing],
          columns: [{
            text: 'ละติจูด',
            flex: 1,
            dataIndex: 'lat',
            field: {
              xtype: 'numberfield',
              decimalPrecision: 6
            }
          }, {
            text: 'ลองติจูด',
            flex: 1,
            dataIndex: 'lon',
            field: {
              xtype: 'numberfield',
              decimalPrecision: 6
            }
          }],
          viewConfig: {
            stripeRows: true
          },
          tbar: [{
            text: 'เพิ่มจุดพิกัด',
            iconCls: "add",
            handler: function() {
              var r = Ext.ModelManager.create({lat: '', lon: ''}, 'Polygon');
              var grid = Ext.getCmp("grid_polygon");
              var len = grid.store.data.items.length;
              store_polygon.insert(len, r);
              cellEditing.startEditByPosition({row: len, column: 0});
            }
          }, {
            text: "ลบจุดพิกัด",
            iconCls: 'deleteallfeature',
            handler: function(){
              var grid = Ext.getCmp("grid_polygon");
              var selection = grid.getSelectionModel().getSelection();
              if (selection) {
                grid.store.remove(selection);
              }
            }
          }]
        });

        var win_polygon = new Ext.Window({
          autoHeight: true,
          width: 300,
          constrain: true,
          collapsible: true,
          closable: true,
          layout: 'fit',
          title: 'ระบุจุดพิกัด',
          modal: true,
          items: [grid_polygon],
          buttons: [{
            text: "ยืนยัน",
            handler: function(){
              var grid = Ext.getCmp("grid_polygon");
              var sitePoints = [];
              datas = grid.store.data.items;
              $.each(datas, function(idx, val){
                var coord = val.data;
                if(Number(coord.lon) && Number(coord.lat)){
                  var point = new OpenLayers.Geometry.Point(coord.lon, coord.lat);
                  point.transform(gcs, map.getProjectionObject());
                  sitePoints.push(point);
                }
              });
              if(sitePoints.length > 2){
                sitePoints.push(sitePoints[0]);
                var linearRing = new OpenLayers.Geometry.LinearRing(sitePoints);
                var geometry = new OpenLayers.Geometry.Polygon([linearRing]);
                var polygonFeature = new OpenLayers.Feature.Vector(geometry);
                vectorLayer.addFeatures([polygonFeature]);
                alert(getArea(polygonFeature.geometry.getArea()/1000));
              }
            }
          }]
        });
        win_polygon.show();
      }
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));


    toolbarItems.push("-");

    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.ModifyFeature(vectorLayer),
      tooltip: 'แก้ไขจุดที่ปรากฏบนแผนที่ (ต้อง Click Mouse บนจุด/เส้น/รูปหลายเหลี่ยม เพื่อกำหนดสิ่งที่ต้องการก่อนทำการแก้ไข)',
      map: map,
      iconCls: 'modifyfeature',
      toggleGroup: 'map'
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    action = Ext.create('GeoExt.Action', {
      control: new OpenLayers.Control.DeleteFeature(vectorLayer),
      tooltip: "ลบทีละรายการ จุด/เส้น/รูปหลายเหลี่ยม",
      map: map,
      iconCls: "deletefeature",
      toggleGroup: "map",
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    // Remove all features replace with DeleteFeature.js (1 at a time)
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.SelectFeature(vectorLayer),
      tooltip: 'ลบทุกรายการที่ปรากฏบนแผนที่',
      map: map,
      iconCls: 'deleteallfeature',
      toggleGroup: 'map',
      handler: function() {
        if (vectorLayer && vectorLayer.features)
          vectorLayer.removeFeatures(vectorLayer.features);
        if (kml && kml.features) {
          kml.removeFeatures(kml.features);
          map.removeLayer(kml);
        }
        if (Ext.getCmp('radii')) {
          Ext.getCmp('radii').hide();
        }
      },
      allowDepress: true
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    toolbarItems.push("-");

    var show_gsv = function(feat) {
      lon = feat.geometry.x;
      lat = feat.geometry.y;
      var pt = new OpenLayers.LonLat(lon,lat);
      pt.transform(merc, gcs);
      lon = pt.lon;
      lat = pt.lat;
      var img_url = 'http://maps.googleapis.com/maps/api/streetview?size=400x400&location=' + lat + ',' + lon;
      img_url += '&sensor=false&key=AIzaSyBa-Aed1-QisFrEs2Vnc0f3hfu_fWgXIl4';
      var html = "<center><img src='" + img_url + "' /></center>";
      Ext.create("Ext.window.Window", {
        title: "<a href='http://maps.google.com/maps?q=&layer=c&cbll=" + lat + "," + lon + "&cbp=12,0,0,0,0&output=svembed' target='_blank'>Google Street View</a> <font color='red'><b>ท่านสามารถใช้เม้าส์คลิกที่ link ด้านซ้ายมือได้</b></font>",
        width: 450,
        height: 450,
        layout: 'fit',
        closable: true,
        html: html
      }).show();
    }

    // Add Google Street View Control
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point, { 'featureAdded': show_gsv}),
      tooltip: 'แสดงภาพจาก Google Street View',
      map: map,
      iconCls: 'show_gsv',
      toggleGroup: 'map',
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    toolbarItems.push("-");

    // Add Input Form 05/08/2012
    action = Ext.create('GeoExt.Action', {
      iconCls: "info"
      ,id: 'id_select_feat'
      ,control: frm_input_ctrl
      ,tooltip: 'แบบฟอร์มนำเข้าข้อมูลจากผู้ใช้งาน'
      ,map: map
      ,enableToggle: true
      ,toggleGroup: "map"
      ,allowDepress: true
      ,handler: function() {
        if (pointLayer && pointLayer.visibility == true)
          pointLayer.setVisibility(false);
      }
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    // Add Button Custom Layer (pointLayer) to map
    var pl_tta = "เพิ่มชั้นข้อมูลของผู้ใช้งาน";
    var pl_ttx = "ลบชั้นข้อมูลของผู้ใช้งาน";
    var btn_custom_layer = new Ext.Button({
      iconCls: 'add_layer'
      ,tooltip: pl_tta
      ,enableToggle: false
      ,pressed: false
      ,handler: function() {
        if (this.iconCls == 'add_layer') {
          if (pointLayer) { // just in case
            map.removeLayer(pointLayer);
            pointLayer = null;
          }
          create_layer_pointLayer();
          map.addLayer(pointLayer);
          this.setIconCls('del_layer');
          this.setTooltip(pl_ttx);
        } else {
          map.removeLayer(pointLayer);
          pointLayer = null;
          this.setIconCls('add_layer');
          this.setTooltip(pl_tta);
        }
      }
    });
    toolbarItems.push(btn_custom_layer);

    // Add button to delete a feature from pointLayer and kml table in dsi database
    var btn_del_feat = new Ext.Button({
      iconCls: 'del_feature_in_layer'
      ,tooltip: 'ลบข้อมูลออกจากฐานข้อมูล โดย click mouse ณ ตำแหน่งที่ต้องการลบ'
      ,enableToggle: true
      ,handler: function(toggled){
        if (toggled.pressed) {
          ctrl_popup_pointLayer.deactivate();
          del_feat_ctrl.activate();
        } else {
          ctrl_popup_pointLayer.activate();
          del_feat_ctrl.deactivate();
        }
      },
      toggleGroup: "map",
      pressed: false
    });
    toolbarItems.push(btn_del_feat);

    toolbarItems.push("-");

    // Measure Length control
    ctrl_measure_length = new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
      persist: true
      ,geodesic: true
      ,displaySystem: 'metric'
      ,eventListeners: {
        measure: function(evt) {
          //evt.units --> 'km' , 'm'
          var unit = (evt.units == 'km') ? 'กิโลเมตร' : 'เมตร';

          Ext.Msg.show({
            title: 'Result'
            ,msg: "ระยะทางรวม ประมาณ " + numberWithCommas(evt.measure.toFixed(2)) + ' ' + unit
            ,buttons: Ext.Msg.OK
            ,icon: Ext.Msg.INFO
          });
        }
      }
    });
    map.addControl(ctrl_measure_length);

    var btn_measure_length = new Ext.Button({
      iconCls: 'measure_length',
      tooltip: "วัดระยะทาง",
      enableToggle: false,
      handler: function(toggled){
        if (toggled.pressed) {
          ctrl_measure_area.deactivate();
          ctrl_measure_length.activate();
        } else {
          ctrl_measure_length.deactivate();
        }
      },
      toggleGroup: "grp_measure",
      pressed: false
    });
    toolbarItems.push(btn_measure_length);

    // Measure Area control
    ctrl_measure_area = new OpenLayers.Control.Measure(OpenLayers.Handler.Polygon, {
      eventListeners: {
        measure: function(evt) {
          //evt.units --> 'km' , 'm'
          var unit = (evt.units == 'km') ? 'ตารางกิโลเมตร' : 'ตารางเมตร';

          Ext.Msg.show({
            title: 'Result'
            ,msg: "พื้นที่รวม ประมาณ " + numberWithCommas(evt.measure.toFixed(2)) + ' ' + unit
            ,buttons: Ext.Msg.OK
            ,icon: Ext.Msg.INFO
          });
        }
      }
    });
    map.addControl(ctrl_measure_area);

    var btn_measure_area = new Ext.Button({
      iconCls: 'measure_area',
      tooltip: "คำนวณพื้นที่",
      enableToggle: false,
      handler: function(toggled){
        if (toggled.pressed) {
          //alert('btn_area: active btn_length: deactivate');
          ctrl_measure_length.deactivate();
          ctrl_measure_area.activate();
        } else {
          ctrl_measure_area.deactivate();
        }
      },
      toggleGroup: "grp_measure",
      pressed: false
    });
    toolbarItems.push(btn_measure_area);

    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.SelectFeature(vectorLayer, {
        hover: false,
        eventListeners: {
          featurehighlighted: function(evt) {
            feature = evt.feature;
            if(feature.geometry.CLASS_NAME == "OpenLayers.Geometry.Polygon"){
              alert(getArea(feature.geometry.getArea()/1000));
            }
          }
        }
      }),
      tooltip: 'แสดงขนาดพื้นที่ของวัตถุหลายเหลี่ยม',
      map: map,
      iconCls: 'select_feat',
      toggleGroup: 'map',
      allowDepress: true
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));


    // Add Lat/Long Button
    var llgrid = null;
    button = Ext.create('Ext.Button',{
      tooltip: 'แสดง Lat/Long Grid',
      iconCls: 'grid1',
      enableToggle: true,
      handler: function() {
        var g = c = map.getControlsByClass("OpenLayers.Control.Graticule");
        if (g.length == 1) { // Graticule (Lat/Long Grid) is displayed in map
          llgrid.destroy();
          llgrid = null;
        } else { // No Graticule (Lat/Long Grid)
          llgrid = new OpenLayers.Control.Graticule({
            layerName: 'Lat/Long Grid',
            displayInLayerSwitcher: false,
            hideInTree: true,
            lineSymbolizer: {
              strokeColor: "#FFFF7F",
              strokeWidth: 1,
              strokeOpacity: 0.5,
            },
            labelSymbolizer: {
              fontColor: "#FFFF00",
              fontWeight: "bold"
            }
          });
          map.addControl(llgrid);
        }
      }
    });
    toolbarItems.push(button);


    // Add UTM Button
    button = Ext.create('Ext.Button',{
      tooltip: 'แสดง UTM Grid',
      iconCls: 'grid2',
      enableToggle: true,
      handler: function() {
        if (utmgrid.visibility == false)
          utmgrid.setVisibility(true);
        else
          utmgrid.setVisibility(false);
      }
    });
    toolbarItems.push(button);

    toolbarItems.push("-");

    action = Ext.create('GeoExt.Action',{
       tooltip: "Previous view",
       control: ctrl.previous,
       iconCls: 'back',
       disabled: true
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    action = Ext.create('GeoExt.Action',{
      tooltip: "Next view",
      control: ctrl.next,
      iconCls: 'next',
      disabled: true
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    toolbarItems.push("->");

    //////
    counter = {
      xtype: 'button',
      text: 'Visit No.:<span id="id_cnt">00000000</span>',
      handler: function(){
        window.open("http://www.google.com/analytics/", "_blank");
      }
    };
    toolbarItems.push(counter);

    // Add print Preview + Print Action ( Create PDF ERROR!!! )
    var printDialog, printProvider;

    // The PrintProvider that connects us to the print service
    printProvider = Ext.create('GeoExt.data.MapfishPrintProvider', {
      method: "GET", // "POST" recommended for production use
      capabilities: printCapabilities, // provide url instead for lazy loading
      customParams: {
        mapTitle: "GeoExt Printing Demo",
        comment: "This demo shows how to use GeoExt.PrintMapPanel"
      }
    });
    var btn_print = new Ext.Button({
      iconCls: 'print_preview',
      tooltip: 'ดูภาพ Preview และพิมพ์แผนที่ (กรุณา Zoom แผนที่ตามความต้องการอีกครั้ง)',
      handler: function(){
        printDialog = Ext.create('Ext.Window', {
          title: "<font color='#FF7000'>Print Preview</font>",
          id: 'id_printDialog',
          layout: "fit",
          width: 400,
          autoHeight: true,
          items: [{
            xtype: "gx_printmappanel",
            id: 'id_preview',
            sourceMap: mapPanel,
            printProvider: printProvider
          }],
          bbar: [{
            iconCls: 'print',
            tooltip: 'Print Map',
            //handler: function(){ printDialog.items.get(0).print(); }
            //ERROR: when preesing this button -->
            handler: function(){
              $("#id_preview-body").printElement({printMode:'popup'});
              //$("#id_preview").printArea();
              return false;
            }
          },'->',{
            iconCls: 'close',
            tooltip: 'Close',
            handler: function(){
              Ext.getCmp('id_printDialog').close();
            }
          }]
        });
        printDialog.center();
        printDialog.show();
      }
    });
    toolbarItems.push(btn_print);

    var numicon = new Ext.form.ComboBox({
      width: 55
      ,id: 'id_icon_num'
      ,emptyText: 'Icon'
      ,listConfig: {
        getInnerTpl: function() {
          // here you place the images in your combo
          var tpl = '<div>'+
                    '<img src="img/{icon}.png" align="center" width="16" height="16" /></div>';
          return tpl;
        }
      }
      ,store : new Ext.data.SimpleStore({
        // Add more layers in dropdown here
        data : [['x1', '1'],['x2','2'],['x3','3'],['x4','4'],['x5','5'],['x6','6'],['x7','7'],['x8','8'],['x9','9']]
        ,id : 0
        ,fields : ['icon','text']
      })
      ,valueField : 'icon'
      ,displayField : 'text'
      ,triggerAction : 'all'
      ,editable : false
      ,name : 'icon_num'
      ,handler: function() {
        pointLayer.styleMap = styleMapNumber;
      }
    });
    //toolbarItems.push(numicon);

    var utmgrid = new OpenLayers.Layer.WMS(
      "UTM Grid",
      "http://203.151.201.129/cgi-bin/mapserv",
      {
        map: '/ms603/map/wms-thai.map',
        layers: "utm_wgs",
        transparent: true
      },
      { isBaseLayer: false, visibility: false}
    );
    utmgrid.displayInLayerSwitcher = false;
    utmgrid.hideInTree = true;
    utmgrid.setVisibility(false);

    // Add Bing Map
    bing_road = new OpenLayers.Layer.Bing({
      name: "Bing Road",
      key: apiKey,
      type: "Road",
      iconCls: 'bing'
    });
    bing_road.isBaseLayer = true;

    bing_hybrid = new OpenLayers.Layer.Bing({
      name: "Bing Hybrid",
      key: apiKey,
      type: "AerialWithLabels",
      iconCls: 'bing'
    });
    bing_hybrid.isBaseLayer = true;

    bing_aerial = new OpenLayers.Layer.Bing({
      name: "Bing Aerial",
      key: apiKey,
      type: "Aerial",
      iconCls: 'bing'
    });
    bing_aerial.isBaseLayer = true;

    mapPanel = Ext.create('GeoExt.panel.Map', {
      border: true,
      region: "center",
      margins: '5 5 0 0',
      map: map,
      center: dsi,
      zoom: 6,
      layers: [
        new OpenLayers.Layer.WMS(
          "ป่าชายเลน ปี 2552",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'mangrove_2552', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "ป่าชายเลน ปี 2543",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'mangrove_2543', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "ป่าชายเลน ปี 2530",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'mangrove_2530', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "เขตป่าสงวน",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'rforest', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'rforest'}
        ),
        new OpenLayers.Layer.WMS(
          "เขตอุทยานแห่งชาติ",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'npark', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'npark'}
        ),
        new OpenLayers.Layer.WMS(
          "พื้นที่สปก.",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_22_spk', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "แหล่งแร่",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_14_mineral', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "ธรณีวิทยา",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_13_geology', transparent: true},
          {isBaseLayer: false,visibility: false}
        ),
        new OpenLayers.Layer.WMS(
          "หมู่บ้าน",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_06_muban', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'village', singleTile: true}
        ),
        new OpenLayers.Layer.WMS(
          "ตำบล",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_04_tambon', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'tambon'}
        ),
        new OpenLayers.Layer.WMS(
          "อำเภอ",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_03_amphoe', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'amphur'}
        ),
        new OpenLayers.Layer.WMS(
          "จังหวัด",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'no_02_province', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'changwat'}
        ),
        new OpenLayers.Layer.WMS(
          "ชั้นความสูง",
          "http://203.151.201.129/cgi-bin/mapserv",
          {map: '/ms603/map/wms-dsi.map', layers: 'contour', transparent: true},
          {isBaseLayer: false,visibility: false, iconCls: 'dem'}
        ),

        bing_road, bing_hybrid, bing_aerial,

        new OpenLayers.Layer.Google(
          "Google Hybrid",
          {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20,sphericalMercator: true, iconCls: 'google' }
        ),
        new OpenLayers.Layer.Google(
          "Google Physical",
          {type: google.maps.MapTypeId.TERRAIN,sphericalMercator: true, iconCls: 'google' }
        ),

        utmgrid,

       /*
        new OpenLayers.Layer.Yahoo(
          "Yahoo Street",
          {sphericalMercator: true}
        ),
        new OpenLayers.Layer.Yahoo(
          "Yahoo Satellite",
          {'type': YAHOO_MAP_SAT, sphericalMercator: true}
        ),
        new OpenLayers.Layer.Yahoo(
          "Yahoo Hybrid",
          {'type': YAHOO_MAP_HYB, sphericalMercator: true}
        ),
        */

        hili,
        markers,
        vectorLayer

      ],
      dockedItems: [{
        xtype: 'toolbar',
        dock: 'top',
        items: toolbarItems
      }]
    });

    overlay = Ext.create('GeoExt.tree.OverlayLayerContainer',{
      loader: {
        filter: function(record) {
          var layer = record.getLayer();
          if (layer.hideIntree || layer.displayInLayerSwitcher == false){
            return false;
          } else {
          return !(layer.displayInLayerSwitcher === true &&
            layer.isBaseLayer === true);
          }
        }
      }
    });

    store = Ext.create('Ext.data.TreeStore', {
      model: 'GeoExt.data.LayerTreeModel',
      root: {
        expanded: true,
        children: [
          {
            plugins: ['gx_baselayercontainer'],
            expanded: false,
            text: "Base Maps"
          }, {
            plugins: [overlay],
            expanded: true
          }
        ]
        //children: tree_child
      }
    });

    ///////////////////////////////////
    // TREE
    ///////////////////////////////////
    tree = Ext.create('GeoExt.tree.Panel', {
      border: true,
      title: "เลือกชั้นข้อมูล",
      width: 250,
      split: true,
      collapsible: true,
      autoScroll: true,
      store: store,
      rootVisible: true,
      lines: false
    });

    panel_west = Ext.create("Ext.Panel",{
      region: 'west',
      title: '<span class="logo"><font color="red">DSIMAP</font><br />กรมสอบสวนคดีพิเศษ</span>',
      width: 270,
      border: true,
      margins: '5 0 0 5',
      frame: false,
      split: true,
      layout: 'accordion',
      items: [
        tree,gps2,gps_utm,gps_utm_indian,searchquery,loadxls
      ],
      listeners: {
        render: {
          fn: function() {
            this.header.insert(0,{
              xtype: 'panel',
              html: '<img src="img/logo_dsi.png" width="50" height="65" />'
            });
          }
        }
      }
    });

    earth = Ext.create('Ext.Panel', {
      region: 'east'
      ,id: 'id_east'
      ,margins: '5 5 0 0'
      ,width: 400
      ,layout: 'fit'
      ,collapsible: true
      ,items: [
        {
          xtype: 'gxux_googleearthpanel'
          ,id: 'googleEarthPanelItem'
          ,map: map
          ,altitude: 50
          ,heading: 190
          ,tilt: 90
          ,range: 75
          ,streetViewControl: true
        }
      ]
    });

    Ext.create('Ext.Viewport', {
      layout: 'fit'
      ,hideBorders: true
      ,items: {
        layout: 'border'
        ,deferredRender: false
        //items: [mapPanel, panel_west, earth]
        ,items: [
          mapPanel, 
          panel_west,
          {
            xtype: "panel",
            region: "south",
            height: 30,
            html: '<div class="marquee" style="font-size:20px;height:30px;">ข้อมูลภาพแผนที่ใช้เพื่อการตรวจสอบข้อมูลเบื้องต้นเท่านั้น ...</div>'
        }]
      }
    });

    // Set BaseLayer to bing_road
    map.setBaseLayer(bing_road);

    //Ajax call Counter
    Ext.Ajax.request({
      url : 'rb/analytic.rb',
      method:'GET',
      scope : this,
      success : function(resp){
        cnt = resp.responseText.replace("\n", "");
        $("#id_cnt").html(cnt);
      }
    });

    // Add marquee animation here
    $('.marquee').marquee({pauseOnHover: true, duration: 10000});

  }

});

