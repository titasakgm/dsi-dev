Ext.require([
  'Ext.container.Viewport',
  'Ext.layout.container.Border',
  'GeoExt.tree.Panel',
  'Ext.tree.plugin.TreeViewDragDrop',
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
        if (activelayers[i].name.search('เขต') != -1)
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

    var toolbarItems = [],action;
    
    action = Ext.create('GeoExt.Action',{
      tooltip: 'กลับสู่แผนที่เริ่มต้น',
      iconCls: 'zoomfull',
      handler: function(){
        map.setCenter(dsi, 5);
      },
      allowDepress: false
    });    
    toolbarItems.push(Ext.create('Ext.button.Button', action));
    toolbarItems.push("-");
  
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.ZoomBox(),
      tooltip: 'ขยายขนาดภาพแผนที่ (กดปุ่ม Shift ค้างไว้จากนั้น  Click Mouse ปุ่มซ้ายมือค้างไว้แล้วลากเป็นกรอบสี่เหลี่ยมได้)',
      map: map,
      iconCls: 'zoomin',
      toggleGroup: 'map'
    });    
    toolbarItems.push(Ext.create('Ext.button.Button', action));
       
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.ZoomBox({
        out: true
      }),
      tooltip: 'ย่อขนาดภาพแผนที่ (กดปุ่ม Shift ค้างไว้จากนั้น  Click Mouse ปุ่มซ้ายมือค้างไว้แล้วลากเป็นกรอบสี่เหลี่ยมได้)',
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
        if (vectorLayer.features)
          vectorLayer.removeFeatures(vectorLayer.features);
      },
      allowDepress: true
    });    
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    toolbarItems.push("-");

    var show_gsv = function(feat) {
    //selectControl.activate();
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
        title: "Google Street View",
        width: 450,
        height: 450,
        layout: 'fit',
        closable: true,
        html: html
      }).show();
    }
            
    // Add Google Street View Control
    action = Ext.create('GeoExt.Action',{
      control: new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point,
                { 'featureAdded': show_gsv}),
      tooltip: 'แสดงภาพจาก Google Street View',
      map: map,
      iconCls: 'show_gsv',
      toggleGroup: 'map',
    });    
    toolbarItems.push(Ext.create('Ext.button.Button', action));   

    // Add Input Form 05/08/2012
    action = Ext.create('GeoExt.Action', {
      iconCls: "info"
      ,id: 'id_select_feat'
      ,control: selectCtrl
      ,tooltip: 'แบบฟอร์มนำเข้าข้อมูลจากผู้ใช้งาน'   
      ,map: map
      ,enableToggle: true
      ,toggleGroup: "map"
      ,allowDepress: true
      ,handler: function() {
        // Must hide pointLayer1 and pointLayer2 to enable selectCtrl on vectorLayer !!
        if (pointLayer1)
          pointLayer1.setVisibility(false);
        if (pointLayer2)
          pointLayer2.setVisibility(false);
      }
    });
    toolbarItems.push(Ext.create('Ext.button.Button', action));

    // Measure Length control
    ctrl_measure_length = new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
      eventListeners: {
        measure: function(evt) {
          Ext.Msg.show({
            title: 'Result'
            ,msg: "ระยะทางรวม ประมาณ " + numberWithCommas(evt.measure.toFixed(2)) + ' กิโลเมตร'
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
          //alert('btn_length: active btn_area: deactivate');
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
          Ext.Msg.show({
            title: 'Result'
            ,msg: "พื้นที่รวม ประมาณ " + numberWithCommas(evt.measure.toFixed(2)) + ' ตารางกิโลเมตร'
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
        //debugger;
        if (utmgrid.visibility == false)
          utmgrid.setVisibility(true);
        else
          utmgrid.setVisibility(false);
      }
    });
    toolbarItems.push(button);
    
    toolbarItems.push("-");

    // create popup1 on "featureselected"
    function createPopup1(feature) {

      info1 = "<h2>name: " + feature.attributes.name + "</h2>";
      info1 += "description: " + feature.attributes.description;
      
      if (feature.attributes.imgUrl) {
        info1 += "<p><img src='" + feature.attributes.imgUrl + "' width='100' height='100' border='1' />";
      }
      
      if (info1.search("<script") != -1) {
        info1 = info1.replace(/</g, "&lt;");
      }
      
      popup1 = Ext.create('GeoExt.window.Popup', {
          title: 'Popup for Layer 1',
          location: feature,
          width:200,
          html: info1,
          maximizable: true,
          collapsible: true,
          anchorPosition: 'auto'
      });
      // unselect feature when the popup
      // is closed
      popup1.on({
        close: function() {
          if(OpenLayers.Util.indexOf(pointLayer1.selectedFeatures,
            this.feature) > -1) {
            selectCtrl1.unselect(this.feature);
          }
        }
      });
      popup1.show();
    }

    function createPopup2(feature) {

      info2 = "<h2>name: " + feature.attributes.name + "</h2>";
      info2 += "description: " + feature.attributes.description;
      
      if (feature.attributes.imgUrl) {
        info2 += "<p><img src='" + feature.attributes.imgUrl + "' width='100' height='100' border='1' />";
      }
      
      if (info2.search("<script") != -1) {
        info2 = info2.replace(/</g, "&lt;");
      }
      
      // Add Delete button to delete feature from database
      info2 += "<input type='button' value='Delete' onclick='delete_feature(" + feature.attributes.id + ",2)' />";

      popup2 = Ext.create('GeoExt.window.Popup', {
          title: 'Popup for Layer 2',
          location: feature,
          width:200,
          html: info2,
          maximizable: true,
          collapsible: true,
          anchorPosition: 'auto'
      });
      // unselect feature when the popup is closed
      popup2.on({
          close: function() {
              if(OpenLayers.Util.indexOf(pointLayer2.selectedFeatures,
                                         this.feature) > -1) {
                  selectCtrl2.unselect(this.feature);
              }
          }
      });
      popup2.show();
    }

    

    // Add KML Button to load kml/lines.kml to vectorLayer
    var tt2a = 'แสดงชั้นข้อมูล KML Layer 2';
    var tt2x = 'ลบชั้นข้อมูล KML Layer 2';
    var btn_kml2 = new Ext.Button({
      iconCls: 'layer2'
      ,tooltip: tt2a
      ,handler: function(){
        if (this.iconCls == 'layer2') {
          pointLayer2 = new OpenLayers.Layer.Vector("Layer 2", {
            projection: gcs
            ,iconCls: 'layer2'
            ,strategies: [new OpenLayers.Strategy.Fixed()]
            ,protocol: new OpenLayers.Protocol.HTTP({
              url: "kml/layer_2.kml"
              ,format: new OpenLayers.Format.KML({
                extractStyles: true
                ,extractAttributes: true
                ,maxDepth: 1
              })
            })
          });
          pointLayer2.events.on({
            featureselected: function(e) {
              createPopup2(e.feature);
              }
          });
          selectCtrl2 = new OpenLayers.Control.SelectFeature(pointLayer2);
          map.addLayer(pointLayer2);
          map.addControl(selectCtrl2); 
          selectCtrl2.activate();
          this.setIconCls('layer2_del');
          this.setTooltip(tt2x);
        } else {
          map.removeControl(selectCtrl2);
          map.removeLayer(pointLayer2);
          this.setIconCls('layer2');
          this.setTooltip(tt2a);
        }
      }
    });
    //toolbarItems.push(btn_kml2);

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

    v_style = new OpenLayers.Style({
      'fillColor': '#669933'
      ,'fillOpacity': .8
      ,'strokeColor': '#aaee77'
      ,'strokeWidth': 3
      ,'pointRadius': 8
    });
    
    // Blank style
    v_style = new OpenLayers.Style({});    
    v_style_map = new OpenLayers.StyleMap({'default': v_style});    
    sym_lookup = {
      'layer_1': {
                    'backgroundGraphic': 'http://203.151.201.129/dsix/img/icon_marker_blue.png'
                    ,'backgroundWidth': 32
                    ,'backgroundHeight': 32
                    ,'backgroundYOffset': -32
                  }
      ,'layer_2': {
                    'backgroundGraphic': 'http://203.151.201.129/dsix/img/icon_marker_green.png'
                    ,'backgroundWidth': 32
                    ,'backgroundHeight': 32
                    ,'backgroundYOffset': -32
                  }                  
    };
    v_style_map.addUniqueValueRules('default','kmlname',sym_lookup);

    pointLayer = new OpenLayers.Layer.Vector("Custom Layer", {
      projection: gcs
      ,strategies: [new OpenLayers.Strategy.BBOX()]
      ,protocol:  new OpenLayers.Protocol.WFS({
                    srsName: 'EPSG:4326'
                    ,url: "http://127.0.0.1/cgi-bin/mapserv?map=/ms603/map/wfs-postgis.map&SERVICE=WFS&srsName=EPSG:4326"
                    ,featureType: "kml"
                    ,featurePrefix: "feature"
                  })   
      ,styleMap: v_style_map
    });
    
    mapPanel = Ext.create('GeoExt.panel.Map', {
      border: true,
      region: "center",
      margins: '5 5 0 0',
      map: map,
      center: dsi,
      zoom: 6,
      layers: [
        
        pointLayer,
        
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
       
        // Add Bing Map
        new OpenLayers.Layer.Bing({
          name: "Bing Road",
          key: apiKey,
          type: "Road",
          iconCls: 'bing' 
        }),
        new OpenLayers.Layer.Bing({
          name: "Bing Hybrid",
          key: apiKey,
          type: "AerialWithLabels",
          iconCls: 'bing' 
        }),
        new OpenLayers.Layer.Bing({
          name: "Bing Aerial",
          key: apiKey,
          type: "Aerial",
          iconCls: 'bing' 
        }),
        
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
    //  TREE
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
        tree,gps,gps_utm,gps_utm_indian,searchquery
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
          xtype: 'gxux_googleearthpanel',
          id: 'googleEarthPanelItem',
          map: map,
          altitude: 50,
          heading: 190,
          tilt: 90,
          range: 75,
          streetViewControl: true
        }
      ]
    });
    
    Ext.create('Ext.Viewport', {
      layout: 'fit',
      hideBorders: true,
      items: {
        layout: 'border',
        deferredRender: false,
        //items: [mapPanel, panel_west, earth]
        items: [mapPanel, panel_west]
      }
    });
  }
});
