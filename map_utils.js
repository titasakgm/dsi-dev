Ext.Loader.setConfig({
    enabled: true,
    disableCaching: false,
    paths: {
        GeoExt: "geoext2/src/GeoExt",
        Ext: "extjs4/src",
        "GeoExt.ux": "geoext_ux"
    }
});

// Global variables

//define variable for framed cloud
//disable the autosize for the purpose of our matrix
OpenLayers.Popup.FramedCloud.prototype.autoSize = false;
AutoSizeFramedCloud = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true
});

AutoSizeFramedCloudMinSize = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true,
  'minSize': new OpenLayers.Size(400,400)
});

AutoSizeFramedCloudMaxSize = OpenLayers.Class(OpenLayers.Popup.FramedCloud, {
  'autoSize': true,
  'maxSize': new OpenLayers.Size(100,100)
});

var gcs = new OpenLayers.Projection("EPSG:4326");
var merc = new OpenLayers.Projection("EPSG:900913");
var utm = new OpenLayers.Projection("EPSG:32647");
var indian = new OpenLayers.Projection("EPSG:24047");

// Revised codes
var map, mapPanel, tree, store;
var bing_road, bing_hybrid, bing_aerial;
var overlay, panel_west, ge;
var styles, create_styles;
var v_style, v_style_map, sym_lookup;
var create_layer_vectorLayer, vectorLayer, frm_input_ctrl, frm_input, popup_vectorLayer;
var create_layer_markers, marker, markers, popup_marker;
var create_layer_hili, hili;
var create_layer_pointLayer, pointLayer, ctrl_popup_pointLayer, popup_pointLayer, del_feat_ctrl;
var create_layer_kml, kml, select_kml;

google.load("earth", "1");

//////////////////////////////////////////////
// Utilty functions
//////////////////////////////////////////////

function info(title, msg) {
  Ext.Msg.show({
    title: title,
    msg: msg,
    minWidth: 200,
    modal: true,
    icon: Ext.Msg.INFO,
    buttons: Ext.Msg.OK
  });
};

create_styles = function() {
  // Modify drawpoint from default orange point
  styles = new OpenLayers.StyleMap({
    "default": new OpenLayers.Style(null, {
      rules: [
        new OpenLayers.Rule({
          symbolizer: {
            "Point": {
              pointRadius: 5,
              graphicName: "square",
              fillColor: "#EC940C",
              fillOpacity: 0.75,
              strokeWidth: 1,
              strokeOpacity: 1,
              strokeColor: "#3333aa"
            },
            "Line": {
              strokeWidth: 2,
              strokeOpacity: 1,
              strokeColor: "#006600"
            },
            "Polygon": {
              strokeWidth: 2,
              strokeOpacity: 1,
              fillColor: "#6666aa",
              strokeColor: "#2222aa"
            }
          }
        })
      ]
    }),
    "select": new OpenLayers.Style(null, {
      rules: [
        new OpenLayers.Rule({
          symbolizer: {
            "Point": {
              pointRadius: 5,
              graphicName: "square",
              fillColor: "#EC940C",
              fillOpacity: 0.25,
              strokeWidth: 2,
              strokeOpacity: 1,
              strokeColor: "#0000ff"
            },
            "Line": {
              strokeWidth: 3,
              strokeOpacity: 1,
              strokeColor: "#0000ff"
            },
            "Polygon": {
              strokeWidth: 2,
              strokeOpacity: 1,
              fillColor: "#0000ff",
              strokeColor: "#0000ff"
            }
          }
        })
      ]
    }),
    "temporary": new OpenLayers.Style(null, {
      rules: [
        new OpenLayers.Rule({
          symbolizer: {
            "Point": {
              graphicName: "square",
              pointRadius: 5,
              fillColor: "#EC940C",
              fillOpacity: 0.25,
              strokeWidth: 2,
              strokeColor: "#0000ff"
            },
            "Line": {
              strokeWidth: 3,
              strokeOpacity: 1,
              strokeColor: "#0000ff"
            },
            "Polygon": {
              strokeWidth: 2,
              strokeOpacity: 1,
              strokeColor: "#0000ff",
              fillColor: "#0000ff"
            }
          }
        })
      ]
    })
  });
}

create_layer_vectorLayer = function() {
  vectorLayer = new OpenLayers.Layer.Vector("vectorLayer", {
    displayInLayerSwitcher: true
    ,hideIntree: true
    ,styleMap: styles
  });

  // Add Popup: create popup on "featureselected" 05/08/2012
  vectorLayer.events.on({
    featureselected: function(e) {
      var chk = Ext.getCmp('id_select_feat').pressed;
      if (chk == false)
        return false;
      else
        create_popup_vectorLayer(e.feature);
    }
  });

  // Add Popup: create select feature control 05/08/2012
  frm_input_ctrl = new OpenLayers.Control.SelectFeature(vectorLayer);

  function create_popup_vectorLayer(feature) {
    // convert from merc(900913) to gcs(4326)
    var feat = feature.clone();
    feat.geometry.transform(merc, gcs);

    var curr_loc = feat.geometry.toString();
    Ext.getCmp('id_location').setValue(curr_loc);

    if (!popup_vectorLayer) {
      popup_vectorLayer = Ext.create('GeoExt.window.Popup', {
        title: 'DSI Popup'
        ,id: 'id_popup'
        ,location: feature
        ,width:604
        ,items: [ frm_input ]
        ,maximizable: true
        ,collapsible: true
        ,closeAction: 'hide'
        ,anchorPosition: 'auto'
      });
      // unselect feature when the popup is closed
      popup_vectorLayer.on({
        close: function() {
          if(OpenLayers.Util.indexOf(vectorLayer.selectedFeatures, this.feature) > -1) {
            frm_input_ctrl.unselect(this.feature);
          }
        }
      });
    }
    //popup_vectorLayer.center(); ERROR: popup has no method center ??
    popup_vectorLayer.show();
  }

  // Add Popup: define "create_popup_vectorLayer" function + Input Form
  frm_input = Ext.create('Ext.form.Panel', {
    title: 'Inner Tabs'
    ,id: 'id_frm_input'
    ,url: 'rb/process_input.rb'
    ,bodyStyle:'padding:5px'
    ,width: 600
    ,fieldDefaults: {
      labelAlign: 'top'
      ,msgTarget: 'side'
    }
    ,defaults: {
      anchor: '100%'
    }
    ,items: [{
      layout:'column'
      ,border:false
      ,items:[{
        columnWidth:.5
        ,border:false
        ,layout: 'anchor'
        ,defaultType: 'textfield'
        ,items: [{
          fieldLabel: 'First Name'
          ,name: 'first'
          ,anchor:'95%'
        },{
          fieldLabel: 'Company'
          ,name: 'company'
          ,anchor:'95%'
        }]
      },{
        columnWidth:.5
        ,border:false
        ,layout: 'anchor'
        ,defaultType: 'textfield'
        ,items: [{
          fieldLabel: 'Last Name'
          ,name: 'last'
          ,anchor:'95%'
        },{
          fieldLabel: 'Email'
          ,name: 'email'
          ,vtype:'email'
          ,anchor:'95%'
        }]
      }]
    },{
      xtype:'tabpanel'
      ,plain:true
      ,activeTab: 0
      ,height:235
      ,defaults:{bodyStyle:'padding:10px'}
      ,items:[{
        title:'Demo Input'
        ,defaults: {width: 200}
        ,items: [{
          xtype: 'textfield'
          ,fieldLabel: 'Title'
          ,name: 'name'
          ,allowBlank:false
          //CHECK!!!
          ,enableKeyEvents: true
          ,listeners: {
            keyup: function() {
              Ext.getCmp('id_upload_title').setValue(this.value);
            }
          }
        },{
          xtype : 'combo'
          ,fieldLabel : 'Select Layer'
          ,id: 'id_icon'
          ,listConfig: {
            getInnerTpl: function() {
              // here you place the images in your combo
              var tpl = '<div>'+
                        '<img src="img/{icon}.png" align="left" width="16" height="16" >&nbsp;&nbsp;'+
                        '{text}</div>';
              return tpl;
            }
          }
          ,store : new Ext.data.SimpleStore({
            // Add more layers in dropdown here
            data :  [
                     ['icon1', 'Layer 1']
                    ,['icon2','Layer 2']
                    ,['x1','Label 1']
                    ,['x2','Label 2']
                    ,['x3','Label 3']
                    ,['x4','Label 4']
                    ,['x5','Label 5']
                    ,['x6','Label 6']
                    ,['x7','Label 7']
                    ,['x8','Label 8']
                    ,['x9','Label 9']
                    ]
            ,id : 0
            ,fields : ['icon','text']
          })
          ,valueField : 'icon'
          ,displayField : 'text'
          ,triggerAction : 'all'
          ,editable : false
          ,name : 'icon'
        },{
          xtype: 'textfield'
          ,fieldLabel: 'Description'
          ,name: 'description'
          ,allowBlank:false
        },{
          xtype: 'textareafield'
          ,fieldLabel: 'Location'
          ,name: 'location'
          ,id: 'id_location'
          ,width: '100%'
          ,anchor: '100%'
        }]
      },{
        xtype: 'form'
        ,title:'Upload Photo'
        ,width: 500
        ,frame: true
        ,title: 'Upload photo'
        ,bodyPadding: '10 10 0'
        ,defaults: {
          anchor: '100%'
          ,xtype: 'textfield'
          ,msgTarget: 'side'
          ,labelWidth: 50
        }
        ,items: [{
          fieldLabel: 'Title'
          ,id: 'id_upload_title'
          ,name: 'upload_title'
          ,disabled: true
        },{
          xtype: 'filefield'
          ,name: 'file'
          ,id: 'id_file'
          ,fieldLabel: 'Photo'
          ,labelWidth: 50
          ,msgTarget: 'side'
          ,allowBlank: true
          ,buttonText: ''
          ,buttonConfig: {
            iconCls: 'upload'
          }
        },{
          fieldLabel: 'File saved'
          ,name: 'origname'
          ,id: 'id_origname'
        },{
          xtype: 'hidden'
          ,name: 'imgname'
          ,id: 'id_imgname'
        }]
        ,buttons: [{
          text: 'Upload'
          ,handler: function() {
            var form = this.up('form').getForm();
            if (form.isValid()) {
              form.submit({
                url: 'rb/file-upload.rb'
                ,waitMsg: 'Uploading photo...'
                //,success: function(response, opts) { NOT WORKING ?!?!?
                ,success: function(fp, o) {
                  var data = Ext.decode(o.response.responseText);
                  var imgname = data.imgname;
                  var origname = data.origname;
                  Ext.getCmp('id_imgname').setValue(imgname);
                  Ext.getCmp('id_origname').setValue(origname);
                  info('Success', 'File ' + origname + ' has been uploaded!');
                }
              })
            }
          }
        },{
          text: 'Reset',
          handler: function() {
            this.up('form').getForm().reset();
          }
        }]
      },{
        cls: 'x-plain'
        ,title: 'WYSIWYG'
        ,layout: 'fit'
        ,items: {
          xtype: 'htmleditor'
          ,name: 'wysiwyg'
          ,fieldLabel: 'WYSIWYG'
        }
      }]
    }],
    buttons: [{
      text: 'Save'
      ,handler: function() {
        frm_input.getForm().submit({
          success: function(f,a) {
            Ext.Msg.show({
              title: 'Info'
              ,msg: '1 feature added!'
              ,buttons: Ext.Msg.OK
              ,icon: Ext.Msg.INFO
              ,fn: function(btn) {
                // Remove all features
                // Reset input form
                // Hide popup
                // Refresh pointLayer
                vectorLayer.removeAllFeatures();
                frm_input.getForm().reset();
                popup_vectorLayer.hide();
                // Update new feature in pointLayer ?? better solution ??
                if (pointLayer) {
                  map.removeLayer(pointLayer);
                  map.removeControl(ctrl_popup_pointLayer);
                  pointLayer = null;
                  ctrl_popup_pointLayer = null;
                }
                create_layer_pointLayer();
                map.addLayer(pointLayer);
                frm_input_ctrl.deactivate();
              }
            });
          }
          ,failure: function(f,a) {
            Ext.Msg.alert('Error', 'Failed!!');
          }
        })
      }
    },{
      text: 'Cancel'
      ,handler: function() {
        var o = Ext.getCmp('id_location');
        // Remember current location
        var curr_loc = o.getValue();
        frm_input.getForm().reset();
        // Set current location back to form
        o.setValue(curr_loc);
      }
    }]
  });
}


create_layer_pointLayer = function() {
  // Blank style
  // v_style = new OpenLayers.Style({});
  var v_style = new OpenLayers.Style({
    'fillColor': '#ffffff'
    ,'fillOpacity': .8
    ,'strokeColor': '#aa0000'
    ,'strokeWidth': 2
    ,'pointRadius': 3
  });
  var v_style_map = new OpenLayers.StyleMap({'default': v_style});
  var sym_lookup = {
    'layer_1': {
                  'backgroundGraphic': 'img/icon_marker_green.png'
                  ,'backgroundWidth': 32
                  ,'backgroundHeight': 32
                  ,'backgroundYOffset': -32
                }
    ,'layer_2': {
                  'backgroundGraphic': 'img/icon_marker_blue.png'
                  ,'backgroundWidth': 32
                  ,'backgroundHeight': 32
                  ,'backgroundYOffset': -32
                }
    ,'layer_x1': {
                  'backgroundGraphic': 'img/x1.png'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }
    ,'layer_x2': {
                  'backgroundGraphic': 'img/x2.png'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }
    ,'layer_x3': {
                  'backgroundGraphic': 'img/x3.png'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }
    ,'layer_x4': {
                  'backgroundGraphic': 'img/x4.png'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }
    ,'layer_x5': {
                  'backgroundGraphic': 'img/x5.png'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }
    ,'layer_x6': {
                  'backgroundGraphic': 'img/x6.png'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }
    ,'layer_x7': {
                  'backgroundGraphic': 'img/x7.png'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }
    ,'layer_x8': {
                  'backgroundGraphic': 'img/x8.png'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }
    ,'layer_x9': {
                  'backgroundGraphic': 'img/x9.png'
                  ,'backgroundWidth': 27
                  ,'backgroundHeight': 27
                  ,'backgroundYOffset': -27
                }

  };
  v_style_map.addUniqueValueRules('default','kmlname',sym_lookup);

  // Create pointLayer here
  // Load features from postgis
  // default featurePrefix for mapserver is "ms" BUT must specify in map file
  // projection gcs MUST be included to display features correctly
  pointLayer = new OpenLayers.Layer.Vector("Custom Layer", {
    projection: gcs
    ,strategies: [new OpenLayers.Strategy.BBOX(), new OpenLayers.Strategy.Refresh()]
    ,protocol: new OpenLayers.Protocol.WFS({
                  srsName: 'EPSG:4326'
                  ,url: "http://127.0.0.1/cgi-bin/mapserv?map=/ms603/map/wfs-postgis.map&SERVICE=WFS&srsName=EPSG:4326"
                  ,featureType: "kml"
                  ,featurePrefix: "feature"
                })
    ,styleMap: v_style_map
  });

  // Add popup when feature in pointLayer is clicked
  ctrl_popup_pointLayer = new OpenLayers.Control.SelectFeature(pointLayer, {
    hover: true
    ,toggle: true
    ,clickOut: false
    ,multiple: false
    ,box: false
    ,eventListeners: {
      featurehighlighted: onPointFeatureSelect
      ,featureunhighlighted: onPointFeatureUnselect
    }
  });
  map.addControl(ctrl_popup_pointLayer);
  ctrl_popup_pointLayer.activate();

  function onPointFeatureSelect(feat){
    // Open framedCloud popup on feat
    sel_feat = feat;
    var lon = feat.feature.geometry.x;
    var lat = feat.feature.geometry.y;
    var lonlat = new OpenLayers.LonLat(lon,lat); // This is merc already!

    feature = feat.feature;
    var id = feature.attributes.id;
    var name = feature.attributes.name;
    var img = feature.attributes.imgname;
    var imgurl = "./photos/" + feature.attributes.imgname;
    var descr = feature.attributes.descr;

    // Will be displayed in popup on click at feature
    content = "<h2>" + name + "(id:" + id + ")</h2>";
    if (img) {
      content += "<img class='imgpopup' src='" + imgurl + "' />";
    }
    content += descr;

    popup_pointLayer = new OpenLayers.Popup.FramedCloud("chicken",
            feature.geometry.getBounds().getCenterLonLat(),
            new OpenLayers.Size(250,180),
            content,
            null, true, onPointPopupClose);
    feature.popup = popup_pointLayer;

    // Force the popup to always open to the top-right
    popup_pointLayer.calculateRelativePosition = function() {
        return 'tr';
    };
    map.addPopup(popup_pointLayer);
  }

  function onPointFeatureUnselect(event) {
    var feature = event.feature;
    if(feature.popup) {
      map.removePopup(feature.popup);
      feature.popup.destroy();
      delete feature.popup;
    }
  }

  function onPointPopupClose(evt) {
    ctrl_popup_pointLayer.unselectAll();
  }

  // Delete Feature in pointLayer both in map and database
  var deleteFromDatabase = function(feature){
    var id = feature.attributes.id;
    var name = feature.attributes.name;

    Ext.Ajax.request({
      url: 'rb/kml_delete.rb'
      ,params: { id: id }
      ,success: function(resp,opt) {
        info('Result', 'ลบรายการ ' + name + ' ออกจากฐานข้อมูลเรียบร้อยแล้ว');
      }
      ,failure: function(resp, opt) {
        Ext.Msg.alert('Warning', 'เกิดข้อผิดพลาดไม่สามารถลบรายการที่ต้องการได้');
      }
    });
  };

  var featureRemove = function(feature) {
    var question = "ต้องการลบ  " + feature.attributes.name + " ออกจากฐานข้อมูล ใช่หรือไม่ ?";
    Ext.Msg.confirm(
      'Confirm'
      ,question
      ,function (btn){
        if(btn=='yes') {
          pointLayer.removeFeatures(feature);
          //delete this feature from database
          deleteFromDatabase(feature);
        }
      }
    )
  };

  var removeOptions = {
    clickout: true
    ,onSelect: featureRemove
    ,toggle: true
    ,multiple: false
    ,hover: false
  };

  del_feat_ctrl = new OpenLayers.Control.SelectFeature(pointLayer, removeOptions);
  map.addControl(del_feat_ctrl);
  // del_feat_ctrl is not activated yet
}

create_layer_markers = function() {
  markers = new OpenLayers.Layer.Markers( "Markers", {
    displayInLayerSwitcher: true,
    hideIntree: true
  });
}

create_layer_hili = function() {
  hili = new OpenLayers.Layer.WMS("Hili"
    ,"http://203.151.201.129/cgi-bin/mapserv"
    ,{
      map: '/ms603/map/hili.map'
      ,layers: 'hili'
      ,'transparent': true
    },{
      isBaseLayer: false
      ,displayInLayerSwitcher: true
      ,singleTile: true
      ,ratio: 1
      ,hideIntree: true
    }
  );
  hili.setOpacity(0);
}

create_layer_kml = function(kmlname) {
  if (kml)
    kml = null;

  kml = new OpenLayers.Layer.Vector("KML", {
    projection: map.displayProjection
    ,strategies: [new OpenLayers.Strategy.Fixed()]
    ,protocol: new OpenLayers.Protocol.HTTP({
      url: kmlname
      ,format: new OpenLayers.Format.KML({
        externalProjection: new OpenLayers.Projection("ESPG:4326")
        ,internalProjection: new OpenLayers.Projection("ESPG:900913")
        ,extractStyles: true
        ,extractAttributes: true
      })
    })
  });
  map.addLayer(kml);




  select_kml = new OpenLayers.Control.SelectFeature(kml);
  kml.events.on({
      "featureselected": onFeatureSelectKml,
      "featureunselected": onFeatureUnselectKml
  });

  map.addControl(select_kml);
  select_kml.activate();

 function onPopupKmlClose(evt) {
            select_kml.unselectAll();
        }
        function onFeatureSelectKml(event) {
            var feature = event.feature;
            // Since KML is user-generated, do naive protection against
            // Javascript.
            var content = "<h2>"+feature.attributes.name + "</h2>" + feature.attributes.description;
            if (content.search("<script") != -1) {
                content = "Content contained Javascript! Escaped content below.<br>" + content.replace(/</g, "&lt;");
            }

            popupClass = AutoSizeFramedCloud;

            popup = new OpenLayers.Popup.FramedCloud("chicken",
              feature.geometry.getBounds().getCenterLonLat(),
              new OpenLayers.Size(100,100),
              content,
              null, true, onPopupKmlClose
            );
            feature.popup = popup;
            map.addPopup(popup);
        }
        function onFeatureUnselectKml(event) {
            var feature = event.feature;
            if(feature.popup) {
                map.removePopup(feature.popup);
                feature.popup.destroy();
                delete feature.popup;
            }
        }


}

//////////////////////////////////////////////
// GPS
//////////////////////////////////////////////

function dms2dd(ddd,mm,ss){
  var d = parseFloat(ddd);
  var m = parseFloat(mm)/60.0;
  var s = parseFloat(ss)/3600.0;
  return d + m + s;
}

function dd2dms(ll){
  //debugger;
  var d1 = ll;
  var d2 = parseInt(d1 / 100 * 100);
  var d3 = d1 - d2;
  var d4 = d3 * 60;
  var d5 = parseInt(d4);
  var d6 = d4 - d5;
  var d7 = d6 * 60;
  var dms = [];
  dms[0] = d2;
  dms[1] = d5;
  dms[2] = d7.toFixed(2);
  return dms;
}

function setMarker(lon, lat, msg){
  var lonLatMarker = new OpenLayers.LonLat(lon, lat).transform(gcs,merc);
  var feature = new OpenLayers.Feature(markers, lonLatMarker);
  feature.closeBox = true;
  feature.popupClass = OpenLayers.Class(OpenLayers.Popup.AnchoredBubble,
    {maxSize: new OpenLayers.Size(120, 75) } );
  feature.data.popupContentHTML = msg;
  feature.data.overflow = "hidden";

  var size = new OpenLayers.Size(64,64);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
  var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
  var marker = new OpenLayers.Marker(lonLatMarker, icon);
  marker.feature = feature;

  var markerClick = function(evt) {
    if (this.popup == null) {
      this.popup = this.create_popup_marker(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    OpenLayers.Event.stop(evt);
  };
  markers.addMarker(marker);
  //map.events.register("click", feature, markerClick);
}

function addMarkers() {

  var ll, popupClass, popupContentHTML;
  //anchored bubble popup wide short text contents autosize closebox
  ll = new OpenLayers.LonLat(13, 100);
  popupClass = AutoSizeFramedCloud;
  popupContentHTML = '<div style="background-color:red;">Popup.FramedCloud<br>autosize - wide short text<br>closebox<br>' + samplePopupContentsHTML_WideShort + '</div>'
  addMarker(ll, popupClass, popupContentHTML, true);
}

function addMarker(ll, popupClass, popupContentHTML, closeBox, overflow) {
  var feature = new OpenLayers.Feature(markers, ll);
  feature.closeBox = closeBox;
  feature.popupClass = popupClass;
  feature.data.popupContentHTML = popupContentHTML;
  feature.data.overflow = (overflow) ? "auto" : "hidden";

  marker = feature.createMarker();

  var markerClick = function (evt) {
    if (this.popup == null) {
      this.popup = this.create_popup_marker(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    currentPopup = this.popup;
    OpenLayers.Event.stop(evt);
  };
  marker.events.register("mousedown", feature, markerClick);

  markers.addMarker(marker);
}

function onFeatureSelect(feature) {
  selectedFeature = feature;
  popup_marker = new OpenLayers.Popup.FramedCloud(
    ""
    ,feature.geometry.getBounds().getCenterLonLat()
    ,new OpenLayers.Size(100,100)
    ,"<div style='padding:15px 5px 5px 10px;'>" +
    "<table style='font-size:13px;color:red'>" + "<tr>" +
    "<td width='40%'>Name</td>"+ "<td width='5%'>:</td>"+
    "<td>"+feature.attributes.label+"</td>"+ "</tr>"+
    "</table></div>"
    ,null
    ,true
    ,onMarkerPopupClose
  );
  feature.popup = popup_marker;
  map.addPopup(popup_marker);
}

function onMarkerPopupClose(evt) {
  frm_input_ctrl.unselectAll();
}

function onFeatureUnselect(feature) {
  map.removePopup(feature.popup);
  feature.popup.destroy();
  feature.popup = null;
}

var test_gps = function() {
  Ext.getCmp('londd').setValue(100);
  Ext.getCmp('lonmm').setValue(33);
  Ext.getCmp('lonss').setValue(57.9126);
  Ext.getCmp('latdd').setValue(13);
  Ext.getCmp('latmm').setValue(53);
  Ext.getCmp('latss').setValue(26.757);
}

var check_gps = function(){
  var lodd = Ext.getCmp('londd').getValue();
  var lomm = Ext.getCmp('lonmm').getValue();
  var loss = Ext.getCmp('lonss').getValue();
  var ladd = Ext.getCmp('latdd').getValue();
  var lamm = Ext.getCmp('latmm').getValue();
  var lass = Ext.getCmp('latss').getValue();

  report(lodd,lomm,loss,ladd,lamm,lass);
}

var report = function(lodd,lomm,loss,ladd,lamm,lass) {
  Ext.Ajax.request({
    url: 'rb/checkLonLat2.rb'
    ,params: {
      method: 'GET'
      ,lodd: lodd
      ,lomm: lomm
      ,loss: loss
      ,ladd: ladd
      ,lamm: lamm
      ,lass: lass
      ,format: 'json'
    }
    ,failure: function(response, opts){
      alert("checkLonLat2 > failure");
      return false;
    }
    ,success: function(response, opts){
      // var data = eval( '(' + response.responseText + ')' );
      // No response from IE
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);
      map.setCenter(p2, 14);

      var size = new OpenLayers.Size(48,48);
      var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2,icon));
      info('Result',data.msg);
    }
  });
};

var gps = Ext.create("Ext.form.Panel",{
  title: 'ตำแหน่งพิกัด GPS (Geographic)'
  ,id: 'id_gps'
  ,frame: true
  ,items: [{
    xtype: 'fieldcontainer'
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelSeparator: ''
      ,labelAlign: 'top'
      ,margin: '0 5 0 0'
    }
    ,items: [{
      xtype:'textfield'
      ,id: 'londd'
      ,fieldLabel: 'Lon:DD'
      ,width:50
    },{
      xtype:'textfield'
      ,id: 'lonmm'
      ,fieldLabel: 'Lon:MM'
      ,width:50
    },{
      xtype:'textfield'
      ,id: 'lonss'
      ,fieldLabel: 'Lon:SS'
      ,width:50
    },{
      xtype: 'displayfield'
      ,fieldLabel: '&nbsp;'
      ,value: 'E'
    }]
  },{
    xtype: 'fieldcontainer'
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelSeparator: ''
      ,labelAlign: 'top'
      ,margin: '0 5 0 0'
    }
    ,items: [{
      xtype:'textfield'
      ,id: 'latdd'
      ,fieldLabel: 'Lat:DD'
      ,width:50
    },{
      xtype:'textfield'
      ,id: 'latmm'
      ,fieldLabel: 'Lat:MM'
      ,width:50
    },{
      xtype:'textfield'
      ,id: 'latss'
      ,fieldLabel: 'Lat:SS'
      ,width:50
    },{
      xtype: 'displayfield'
      ,fieldLabel: '&nbsp;'
      ,value: 'N'
    }]
  },{
    xtype: 'fieldcontainer'
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelSeparator: ''
      ,labelAlign: 'top'
      ,margin: '0 5 0 0'
    }
    ,items: [{
      xtype: 'button'
      ,text: 'Check'
      ,handler: check_gps
      ,width: 80
    },{
      xtype: 'button'
      ,text: 'Clear'
      ,handler: function(){
        gps.getForm().reset();
        markers.clearMarkers();
      }
      ,width: 80
    },{
      xtype: 'button'
      ,text: 'Test'
      ,handler: test_gps
      ,width: 80
    }]
  }]
});

//////////////////////////////////////////////
// GPS2 support multiformat input
//////////////////////////////////////////////
var gps_format = 0;

var gps_tip = "รูปแบบค่าพิกัดที่สามารถเลือกใช้ได้ <br>";
gps_tip += "100.56578<br>";
gps_tip += "100 33 56.808<br>";
gps_tip += "100d 33m 56.808s<br>";
gps_tip += "100DD 33MM 56.808SS<br>";

function dms2dd(ddd,mm,ss){
  var d = parseFloat(ddd);
  var m = parseFloat(mm)/60.0;
  var s = parseFloat(ss)/3600.0;
  return d + m + s;
}

function dd2dms(ll){
  //debugger;
  var d1 = ll;
  var d2 = parseInt(d1 / 100 * 100);
  var d3 = d1 - d2;
  var d4 = d3 * 60;
  var d5 = parseInt(d4);
  var d6 = d4 - d5;
  var d7 = d6 * 60;
  var dms = [];
  dms[0] = d2;
  dms[1] = d5;
  dms[2] = d7.toFixed(2);
  return dms;
}

function setMarker(lon, lat, msg){
  var lonLatMarker = new OpenLayers.LonLat(lon, lat).transform(gcs,merc);
  var feature = new OpenLayers.Feature(markers, lonLatMarker);
  feature.closeBox = true;
  feature.popupClass = OpenLayers.Class(OpenLayers.Popup.AnchoredBubble,
    {maxSize: new OpenLayers.Size(120, 75) } );
  feature.data.popupContentHTML = msg;
  feature.data.overflow = "hidden";

  var size = new OpenLayers.Size(64,64);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
  var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
  var marker = new OpenLayers.Marker(lonLatMarker, icon);
  marker.feature = feature;

  var markerClick = function(evt) {
    if (this.popup == null) {
      this.popup = this.create_popup_marker(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    OpenLayers.Event.stop(evt);
  };
  markers.addMarker(marker);
  //map.events.register("click", feature, markerClick);
}

function addMarkers() {

  var ll, popupClass, popupContentHTML;
  //anchored bubble popup wide short text contents autosize closebox
  ll = new OpenLayers.LonLat(13, 100);
  popupClass = AutoSizeFramedCloud;
  popupContentHTML = '<div style="background-color:red;">Popup.FramedCloud<br>autosize - wide short text<br>closebox<br>' + samplePopupContentsHTML_WideShort + '</div>'
  addMarker(ll, popupClass, popupContentHTML, true);
}

function addMarker(ll, popupClass, popupContentHTML, closeBox, overflow) {
  var feature = new OpenLayers.Feature(markers, ll);
  feature.closeBox = closeBox;
  feature.popupClass = popupClass;
  feature.data.popupContentHTML = popupContentHTML;
  feature.data.overflow = (overflow) ? "auto" : "hidden";

  marker = feature.createMarker();

  var markerClick = function (evt) {
    if (this.popup == null) {
      this.popup = this.create_popup_marker(this.closeBox);
      map.addPopup(this.popup);
      this.popup.show();
    } else {
      this.popup.toggle();
    }
    currentPopup = this.popup;
    OpenLayers.Event.stop(evt);
  };
  marker.events.register("mousedown", feature, markerClick);

  markers.addMarker(marker);
}

function onFeatureSelect(feature) {
  selectedFeature = feature;
  popup_marker = new OpenLayers.Popup.FramedCloud(
    ""
    ,feature.geometry.getBounds().getCenterLonLat()
    ,new OpenLayers.Size(100,100)
    ,"<div style='padding:15px 5px 5px 10px;'>" +
    "<table style='font-size:13px;color:red'>" + "<tr>" +
    "<td width='40%'>Name</td>"+ "<td width='5%'>:</td>"+
    "<td>"+feature.attributes.label+"</td>"+ "</tr>"+
    "</table></div>"
    ,null
    ,true
    ,onMarkerPopupClose
  );
  feature.popup = popup_marker;
  map.addPopup(popup_marker);
}

function onMarkerPopupClose(evt) {
  frm_input_ctrl.unselectAll();
}

function onFeatureUnselect(feature) {
  map.removePopup(feature.popup);
  feature.popup.destroy();
  feature.popup = null;
}

var test_gps2 = function() {
  //gps_tip += "100.56578<br>";
  //gps_tip += "100 33 56.808<br>";
  //gps_tip += "100d 33m 56.808s<br>";
  //gps_tip += "100DD 33MM 56.808SS<br>";
  var gps_test_lon;
  var gps_test_lat;

  gps_format += 1
  if (gps_format == 1)
  {
    gps_test_lon = "100.56578";
    gps_test_lat = "13.89072";
  }
  else if (gps_format == 2)
  {
    gps_test_lon = "100 33 56.808";
    gps_test_lat = "13 53 26.592";
  }
  else if (gps_format == 3)
  {
    gps_test_lon = "100d 33m 56.808s";
    gps_test_lat = "13d 53m 26.592s";
  }
  else if (gps_format == 4)
  {
    gps_format = 0;
    gps_test_lon = "100DD 33MM 56.808SS";
    gps_test_lat = "13DD 53MM 26.592SS";
  }

  Ext.getCmp('gps_lon').setValue(gps_test_lon);
  Ext.getCmp('gps_lat').setValue(gps_test_lat);
}

//Add squeeze prototype
String.prototype.strip = function() { return this.replace(/^\s+|\s+$/g, ''); }

//Replace many white spaces to 1
//str.replace(/\s+/g, ' ')

//Combine both
//"  1    2    3   ".replace(/\s+/g, ' ').strip().split(/\s/g)
//["1", "2", "3"]

//Remove non-digits from string BUT left out decimal .
//str.replace(/[A-Za-z$-]/g, "");

var gps_msg;

var check_gps2 = function(){
  var gps_lon = Ext.getCmp('gps_lon').getValue();
  var gps_lat = Ext.getCmp('gps_lat').getValue();
  var lon,lat;

  //Reformat gps_lon and gps_lat
  var lon_arr = gps_lon.replace(/\s+/g, ' ').strip().replace(/[A-Za-z$-]/g, "").split(/\s/g);
  var lat_arr = gps_lat.replace(/\s+/g, ' ').strip().replace(/[A-Za-z$-]/g, "").split(/\s/g);

  if (lon_arr.length == 1 && lat_arr.length == 1) //Decimal Degree
  {
    lon = lon_arr[0];
    lat = lat_arr[0];
    gps_msg = "พิกัด " + lon + " E " + lat + " N<br>";
  }
  else if (lon_arr.length == 3 && lat_arr.length == 3) //DD MM SS
  {
    lon = dms2dd(lon_arr[0],lon_arr[1],lon_arr[2]);
    lat = dms2dd(lat_arr[0],lat_arr[1],lat_arr[2]);
    gps_msg = "พิกัด " + lon_arr[0] + "&deg; " + lon_arr[1] + "&apos; " + lon_arr[2] + "&quot; E "
    gps_msg += lat_arr[0] + "&deg; " + lat_arr[1] + "&apos; " + lat_arr[2] + "&quot; N<br>"
  }
  else
  {
    alert("ข้อมูลที่บันทึกในช่อง Longitude และ/หรือ  Latitude ไม่ถูกต้อง");
    return false;
  }
  gps_report(lon,lat);
}

var gps_report = function(lon,lat) {
  Ext.Ajax.request({
    url: 'rb/checkLonLatDD.rb'
    ,params: {
      method: 'GET'
      ,lon: lon
      ,lat: lat
      ,format: 'json'
    }
    ,failure: function(response, opts){
      alert("checkLonLatDD > failure");
      return false;
    }
    ,success: function(response, opts){
      // var data = eval( '(' + response.responseText + ')' );
      // No response from IE
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;
      gps_msg += msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);
      map.setCenter(p2, 14);

      var size = new OpenLayers.Size(48,48);
      var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2,icon));
      info('Result',gps_msg);
    }
  });
};

var gps2 = Ext.create("Ext.form.Panel",{
  title: 'ตำแหน่งพิกัด GPS'
  ,id: 'id_gps2'
  ,frame: true
  ,items: [{
    xtype: 'fieldcontainer'
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelSeparator: ''
      ,labelAlign: 'top'
      ,margin: '0 5 0 0'
    }
    ,items: [{
      xtype:'textfield'
      ,id: 'gps_lon'
      ,fieldLabel: 'Longitude'
      ,width: 150
    },{
      xtype: 'displayfield'
      ,fieldLabel: '&nbsp;'
      ,value: 'E'
    }]
  },{
    xtype: 'fieldcontainer'
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelSeparator: ''
      ,labelAlign: 'top'
      ,margin: '0 5 0 0'
    }
    ,items: [{
      xtype:'textfield'
      ,id: 'gps_lat'
      ,fieldLabel: 'Latitude'
      ,width: 150
    },{
      xtype: 'displayfield'
      ,fieldLabel: '&nbsp;'
      ,value: 'N'
    }]
  },{
    xtype: 'fieldcontainer'
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelSeparator: ''
      ,labelAlign: 'top'
      ,margin: '0 5 0 0'
    }
    ,items: [{
      xtype: 'button'
      ,text: 'Check'
      ,handler: check_gps2
      ,width: 80
    },{
      xtype: 'button'
      ,text: 'Clear'
      ,handler: function(){
        gps2.getForm().reset();
        markers.clearMarkers();
      }
      ,width: 80
    },{
      xtype: 'button'
      ,text: 'Test'
      ,tooltip: gps_tip
      ,handler: test_gps2
      ,width: 80
    }]
  },{
    xtype: 'panel'
    ,border: false
    ,items: [{
      html: '<center><font color="green">Click ที่ปุ่ม [Test]<br>เพื่อเปลี่ยนรูปแบบของ GPS<br>ที่สามารถใช้งานได้</font></center>'
    }]
  }]
});

//////////////////////////////////////////////
// UTM
//////////////////////////////////////////////

var check_gps_utm = function(){
  var utmn = Ext.getCmp('utmn').getValue();
  var utme = Ext.getCmp('utme').getValue();
  var zone47 = Ext.getCmp('zone47').checked;
  if (zone47 == true)
    zone = '47';
  else
    zone = '48';
  report_utm(utmn, utme, zone);
}

var report_utm = function(utmn, utme, zone) {
  Ext.Ajax.request({
    url: 'rb/checkUTM.rb'
    ,params: {
      method: 'GET'
      ,utmn: utmn
      ,utme: utme
      ,zone: zone
      ,format: 'json'
    }
    ,failure: function(response, opts){
      alert("checkUTM > failure");
      return false;
    }
    ,success: function(response, opts){
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);
      map.setCenter(p2, 14);

      var size = new OpenLayers.Size(48,48);
      var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2,icon));
      info('Result', data.msg);
    }
  });
};

var test_gps_utm = function(){
  if (Ext.getCmp('zone47').checked) {
    Ext.getCmp('utmn').setValue(1536195.1807);
    Ext.getCmp('utme').setValue(669189.2284);
  } else {
    Ext.getCmp('utmn').setValue(1540101.0761);
    Ext.getCmp('utme').setValue(20494.2993);
  }
}

var gps_utm = Ext.create("Ext.form.Panel", {
  id: 'id_gps_utm'
  ,frame: true
  ,title: 'ตำแหน่งพิกัด GPS (UTM WGS 1984)'
  ,items: [{
    xtype: 'fieldcontainer'
    ,hideLabel: true
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelAlign: 'top'
      ,margin: '0 5 0 0'
      ,labelWidth: 90
      ,labelSeparator: ''
    }
    ,items: [{
      xtype:'textfield'
      ,fieldLabel: 'Easting:Meters'
      ,id: 'utme'
    },{
      xtype: 'displayfield'
      ,fieldLabel: '&nbsp;'
      ,value: 'E'
    }]
  },{
    xtype: 'fieldcontainer'
    ,hideLabel: true
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelAlign: 'top'
      ,margin: '0 5 0 0'
      ,labelWidth: 90
      ,labelSeparator: ''
    }
    ,items: [{
      xtype:'textfield'
      ,fieldLabel: 'Northing:Meters'
      ,id: 'utmn'
    },{
      xtype: 'displayfield'
      ,fieldLabel: '&nbsp;'
      ,value: 'N'
    }]
  },{
    xtype: 'fieldcontainer'
    ,hideLabel: true
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelAlign: 'top'
      ,margin: '0 40 0 0'
      ,labelWidth: 90
      ,labelSeparator: ''
    }
    ,items: [{
      xtype: 'radio'
      ,id: 'zone47'
      ,name: 'zone'
      ,fieldLabel: 'Zone 47'
      ,checked: true
    },{
      xtype: 'radio'
      ,id: 'zone48'
      ,name: 'zone'
      ,fieldLabel: 'Zone 48'
    }]
  },{
    xtype: 'fieldcontainer'
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelSeparator: ''
      ,labelAlign: 'top'
      ,margin: '0 5 0 0'
    }
    ,items: [{
      xtype: 'button'
      ,text: 'Check'
      ,handler: check_gps_utm
      ,width: 80
    },{
      xtype: 'button'
      ,text: 'Clear'
      ,handler: function(){
        gps_utm.getForm().reset();
        markers.clearMarkers();
      }
      ,width: 80
    },{
      xtype: 'button'
      ,text: 'Test'
      ,handler: test_gps_utm
      ,width: 80
    }]
  }]
});

var check_gps_utm = function(){
  var utmn = Ext.getCmp('utmn').getValue();
  var utme = Ext.getCmp('utme').getValue();
  var zone47 = Ext.getCmp('zone47').checked;
  if (zone47 == true)
    zone = '47';
  else
    zone = '48';
  report_utm(utmn, utme, zone);
}

var report_utm = function(utmn, utme, zone) {
  Ext.Ajax.request({
    url: 'rb/checkUTM.rb'
    ,params: {
      method: 'GET'
      ,utmn: utmn
      ,utme: utme
      ,zone: zone
      ,format: 'json'
    }
    ,failure: function(response, opts){
      alert('checkUTM > failure');
      return false;
    }
    ,success: function(response, opts){
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);
      map.setCenter(p2, 14);

      var size = new OpenLayers.Size(48,48);
      var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2,icon));
      info('Result', data.msg);
    }
  });
};

//////////////////////////////////////////////
// UTM INDIAN
//////////////////////////////////////////////

var check_gps_utm_indian = function(){
  var utmni = Ext.getCmp('utmni').getValue();
  var utmei = Ext.getCmp('utmei').getValue();
  var zone47i = Ext.getCmp('zone47i').checked;
  if (zone47i == true)
    zonei = '47';
  else
    zonei = '48';
  report_utm_indian(utmni, utmei, zonei);
}

var report_utm_indian = function(utmni, utmei, zonei) {
  Ext.Ajax.request({
    url: 'rb/checkUTMIndian.rb'
    ,params: {
      method: 'GET'
      ,utmn: utmni
      ,utme: utmei
      ,zone: zonei
      ,format: 'json'
    }
    ,failure: function(response, opts){
      alert('checkUTMIndian > failure');
      return false;
    }
    ,success: function(response, opts){
      var data = Ext.decode(response.responseText);
      var lon = parseFloat(data.lon);
      var lat = parseFloat(data.lat);
      var msg = data.msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);
      map.setCenter(p2, 14);

      var size = new OpenLayers.Size(48,48);
      var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
      var icon = new OpenLayers.Icon('img/icon_marker.png', size, offset);
      markers.addMarker(new OpenLayers.Marker(p2,icon));
      info('Result', data.msg);
    }
  });
};

var test_gps_utm_indian = function(){
  if (Ext.getCmp('zone47i').checked) {
    Ext.getCmp('utmni').setValue(1535891.7973);
    Ext.getCmp('utmei').setValue(669523.2828);
  } else {
    Ext.getCmp('utmni').setValue(1539787.7522);
    Ext.getCmp('utmei').setValue(20913.1788);
  }
}

var gps_utm_indian = Ext.create("Ext.form.Panel",{
  id: 'id_gps_utm_indian'
  ,frame: true
  ,title: 'ตำแหน่งพิกัด GPS (UTM Indian 1975)'
  ,bodyStyle: 'padding:5px 5px 5px'
  ,items: [{
    xtype: 'fieldcontainer'
    ,hideLabel: true
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelAlign: 'top'
      ,margin: '0 5 0 0'
      ,labelWidth: 90
      ,labelSeparator: ''
    }
    ,items: [{
      xtype:'textfield'
      ,fieldLabel: 'Easting:Meters'
      ,id: 'utmei'
    },{
      xtype: 'displayfield'
      ,fieldLabel: '&nbsp;'
      ,value: 'E'
    }]
  },{
    xtype: 'fieldcontainer'
    ,hideLabel: true
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelAlign: 'top'
      ,margin: '0 5 0 0'
      ,labelWidth: 90
      ,labelSeparator: ''
    }
    ,items: [{
      xtype:'textfield'
      ,fieldLabel: 'Easting:Meters'
      ,id: 'utmni'
    },{
      xtype: 'displayfield'
      ,fieldLabel: '&nbsp;'
      ,value: 'N'
    }]
  },{
    xtype: 'fieldcontainer'
    ,hideLabel: true
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelAlign: 'top'
      ,margin: '0 40 0 0'
      ,labelWidth: 90
      ,labelSeparator: ''
    }
    ,items: [{
      xtype: 'radio'
      ,id: 'zone47i'
      ,name: 'zonei'
      ,fieldLabel: 'Zone 47'
      ,checked: true
    },{
      xtype: 'radio'
      ,id: 'zone48i'
      ,name: 'zonei'
      ,fieldLabel: 'Zone 48'
    }]
  },{
    xtype: 'fieldcontainer'
    ,layout: {
      type: 'hbox'
      ,padding:'5'
      ,pack:'center'
    }
    ,fieldDefaults: {
      labelSeparator: ''
      ,labelAlign: 'top'
      ,margin: '0 5 0 0'
    }
    ,items: [{
      xtype: "button"
      ,text: 'Check'
      ,handler: check_gps_utm_indian
      ,width: 80
    },{
      xtype: "button"
      ,text: 'Clear'
      ,handler: function(){
        gps_utm_indian.getForm().reset();
        markers.clearMarkers();
      }
      ,width: 80
    },{
      xtype: "button"
      ,text: 'Test'
      ,handler: test_gps_utm_indian
      ,width: 80
    }]
  }]
});

//////////////////////////////////////////////
// SEARCH
//////////////////////////////////////////////

var search_query = function(){
  var query = Ext.getCmp('id_query').getValue();
  search(query);
}

var search = function(query) {
  Ext.Ajax.request({
    url: 'rb/search-googlex.rb'
    ,params: {
      method: 'GET'
      ,query: query
      ,exact: 1
    }
    ,success: function(response, opts){
      var data = Ext.decode(response.responseText);
      var gid = data.records[0].loc_gid;
      var text = data.records[0].loc_text;
      var table = data.records[0].loc_table;
      var lon = parseFloat(data.records[0].lon).toFixed(2);
      var lat = parseFloat(data.records[0].lat).toFixed(2);
      var zoom = 14;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);

      if (text)
      {
        map.setLayerIndex(markers, 0);
        map.setLayerIndex(hili, 0);
        if (text.indexOf("จ.") == 0) {
          map.setLayerIndex(hili, 99);
          zoom = 8;
        }
        else if (text.indexOf("อ.") == 0) {
          map.setLayerIndex(hili, 99);
          zoom = 10;
        }
        else if (text.indexOf("ต.") == 0) {
          map.setLayerIndex(hili, 99);
          zoom = 12;
        }
        else {
          zoom = 14;
          map.setLayerIndex(markers, 99);
          setMarker(lon, lat, text);
        }
      }
      map.setCenter(p2, zoom);
      info('Result',text + '<br>lat:' + lat + ' lon:' + lon);
      if (text.search(/จ./) == 0 || text.search(/อ./) == 0 || text.search(/ต./) == 0 || text.search(/บ้าน/) == 0)
      {
        hili.setOpacity(.5);
        //addWKT(table, gid);
      }
    }
  });
};

function addWKT(table, gid){
  var url = "rb/getPolygonWKT.rb?table=" + table + "&gid=" + gid;
  OpenLayers.loadURL(url, '', this, function(response) {
    geom = response.responseText;
    addWKTFeatures(geom);
  });
}

function addWKTFeatures(wktString){
  wkt = new OpenLayers.Format.WKT();
  features = wkt.read(wktString);
  var bounds;
  if(features) {
    if(features.constructor != Array) {
      features = [features];
    }
    for(var i=0; i<features.length; ++i) {
      if (!bounds) {
        bounds = features[i].geometry.getBounds();
        bounds = bounds.transform(gcs, merc);
      } else {
        bounds.extend(features[i].geometry.getBounds().transform(gcs,merc));
      }
    }
  }
  vectorLayer.removeAllFeatures();
  vectorLayer.addFeatures(features[0].geometry.transform(gcs, merc));
  map.zoomToExtent(bounds);
}

var myTextField = Ext.create("GeoExt.ux.QryComboBox",{
  id: 'id_query'
  ,fieldLabel: 'ค้นหา'
  ,labelSeparator: ':'
  ,labelWidth: 50
  ,fieldStore: ['loc_table','loc_gid','loc_text']
  ,hiddenField: ['loc_table','loc_gid']
  ,displayField: 'loc_text'
  ,urlStore: 'rb/search-googlex.rb'
  ,width: '110'
  ,minListWidth: '300'
  ,anchor: '95%'
});

myTextField.on({
  'select': {fn: function(){Ext.getCmp("btn_search").enable();}, scope: this}
});

myTextField.on("specialkey", specialKey, this);

function specialKey(field, e) {
  if ( e.getKey() == e.RETURN || e.getKey() == e.ENTER ) {
    search_query();
  }
}

var searchquery = Ext.create("Ext.form.Panel",{
  id: 'id_searchquery'
  ,labelAlign: 'left'
  ,align: 'center'
  ,frame: true
  ,title: 'ค้นหาสถานที่'
  ,bodyStyle: 'padding:5px 5px 5px'
  ,width: 300
  ,items: [{
    layout: 'form'
    ,labelWidth: 30
    ,items: [ myTextField ]
    ,bodyCfg: {tag: 'center'}
    ,frame: true
    ,buttons: [{
      text: 'Search'
      ,id: 'btn_search'
      ,handler: search_query
      ,disabled: true
    },{
      text: 'Clear'
      ,handler: function(){
        searchquery.getForm().reset();
        markers.clearMarkers();
        hili.setOpacity(0);
        Ext.getCmp('id_query').focus();
        Ext.getCmp('btn_search').disable();
      }
    }]
  }]
});

var loadxls = Ext.create("Ext.form.Panel",{
  id: 'id_loadxls'
  ,title: 'Upoad XLS (with Geom)'
  ,width: 500
  ,frame: true
  ,title: 'Upload XLS'
  ,bodyPadding: '10 10 0'
  ,defaults: {
    anchor: '100%'
    ,xtype: 'textfield'
    ,msgTarget: 'side'
    ,labelWidth: 50
  }
  ,items: [{
    xtype: 'filefield'
    ,name: 'file'
    ,id: 'id_file_xls'
    ,fieldLabel: 'XLS'
    ,labelWidth: 50
    ,msgTarget: 'side'
    ,allowBlank: true
    ,buttonText: ''
    ,buttonConfig: {
      iconCls: 'upload'
    }
  }]
  ,buttons: [{
    text: 'Upload'
    ,handler: function() {
      var form = this.up('form').getForm();
      if (form.isValid()) {
        form.submit({
          url: 'rb/file-upload-xls.rb'
          ,waitMsg: 'Uploading XLS...'
          //,success: function(response, opts) { NOT WORKING ?!?!?
          ,success: function(fp, o) {
            var data = Ext.decode(o.response.responseText);
            var kmlname = data.kmlname;
            create_layer_kml(kmlname);
          }
        })
      }
    }
  },{
    text: 'Reset',
    handler: function() {
      this.up('form').getForm().reset();
    }
  }]
});

function numberWithCommas(x) {
  x = x.toString();
  var pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x))
      x = x.replace(pattern, "$1,$2");
  return x;
}

var check_forest_info = function(layer,ll) {
  lon = ll.lon;
  lat = ll.lat;

  if (layer == 'เขตอุทยานแห่งชาติ')
  layer = 'national_park';
  else if (layer == 'เขตป่าสงวน')
  layer = 'reserve_forest';
  else if (layer == 'ป่าชายเลน ปี 2530')
      layer = 'mangrove_2530';
  else if (layer == 'ป่าชายเลน ปี 2543')
      layer = 'mangrove_2543';
  else if (layer == 'ป่าชายเลน ปี 2552')
      layer = 'mangrove_2552';

  Ext.Ajax.request({
    url: 'rb/check_forest_info.rb'
    ,params: {
      method: 'GET'
      ,layer: layer
      ,lon: lon
      ,lat: lat
      ,format: 'json'
    }
    ,success: function(response, opts){
      var data = Ext.decode(response.responseText);
      var lon = data.lon;
      var lat = data.lat;
      var msg = data.msg;

      var p1 = new OpenLayers.LonLat(lon,lat);
      var p2 = p1.transform(gcs,merc);

      if (msg != 'NA')
        info('Result', msg);
    }
    ,failure: function(response, opts){
      alert('check forest info > failure');
      return false;
    }
  });
};
