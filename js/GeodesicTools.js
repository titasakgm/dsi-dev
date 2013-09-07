function handleMeasurements(event){
    var geometry = event.geometry, units = event.units, order = event.order;
    var measure = event.measure, out = "", winname = 'measWin';
    var win = Ext.WindowMgr.get(winname);
    
    if (order == 1) {
        out += "Line Length: " + measure.toFixed(2) + " " + units;
    }
    else {
        out += "Shape Area: " + measure.toFixed(2) + " " + units + "<sup>2</" + "sup>";
    }
    
    if (!win) {
        win = new Ext.Window({
            id: winname,
            autoHeight: true,
            width: 200,
            resizable: true,
            title: 'Measure Tool',
            items: [{
                xtype: 'panel',
                html: out,
                bodyStyle: 'padding:5px;font-size:11px;background-color:#ffffff;'
            }]
        });
        
        //get the map DIV id
        win.show();
        var mapId = event.object.map.div.id;
        win.alignTo(Ext.getDom(mapId), 'bl-bl', [6, -80]);
    }
    else {
        win.items.items[0].body.update(out);
        if (!win.visible) {
            win.show();
        }
    }
}

function showWin(map, vectorLayer){

    var winname = "radii";
    var win = new Ext.Window({
        id: winname,
        //height: 200,
        width: 200,
        constrain: true,
        collapsible: true,
        layout: 'fit',
        title: 'Circle Options',
        items: [{
            xtype: 'combo',
            allowBlank: false,
            name: 'Radius',
            forceSelection: true, //limit vals to list
            editable: false, //prevent text being entered
            fieldLabel: 'Radius',
            emptyText: 'Select a Radius...',
            store: new Ext.data.SimpleStore({
                fields: ['radius', 'value'],
                data: [["5 km", "5000"], ["10 km", "10000"], ["20 km", "20000"], ["50 km", "50000"], ["100 km", "100000"], ["200 km", "200000"]]
            }),
            displayField: 'radius',
            valueField: 'value',
            selectOnFocus: true,
            mode: 'local',
            triggerAction: 'all',
            listeners: {
                select: function(combo, record, index){
                    var radius = record.data.value;
                    var feature = vectorLayer.features[vectorLayer.features.length - 1];
                    if (feature) {
                        var centroid = feature.geometry.getCentroid();
                        var projection = map.getProjectionObject();
                        
                        var sides = 40;
                        var new_geom = OpenLayers.Geometry.Polygon.createGeodesicPolygon(centroid, radius, sides, 45, projection);
                        
                        var new_feature = new OpenLayers.Feature.Vector(new_geom);
                        vectorLayer.addFeatures([new_feature]);
                    }
                }
            }
        }]
    });
    win.show();
    var mapId = map.div.id;
    win.alignTo(Ext.getDom(mapId), 'tr-tr', [-150, 6]);
}

function startApp(){
    var map = new OpenLayers.Map('map');
    var vectorLayer = new OpenLayers.Layer.Vector();
    
    map.addLayer(vectorLayer);
    
    var osmLayer = new OpenLayers.Layer.OSM("OpenStreetMap", "http://tile.openstreetmap.org/${z}/${x}/${y}.png", {
        'sphericalMercator': true
    });
    
    
    
    
    var pointControl = new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point, {
        'displayClass': 'olControlDrawFeaturePoint',
        handlerOptions: {
            persist: true
        }
    });
    
    
    var measureControl = new OpenLayers.Control.Measure(OpenLayers.Handler.Path, {
        'displayClass': 'olControlDrawFeaturePath',
        persist: true,
        geodesic: true,
        title: 'Line Measure: draw a line to see distances on the map',
        handlerOptions: {
            persist: true
        }
    });
    
    measureControl.events.on({
        "measure": handleMeasurements,
        "measurepartial": handleMeasurements
    });
    
    var panelControls = [new OpenLayers.Control.Navigation(), pointControl, measureControl];
    
    var toolbar = new OpenLayers.Control.Panel({
        displayClass: 'olControlEditingToolbar',
        defaultControl: panelControls[0]
    });
    
    toolbar.addControls(panelControls);
    map.addControl(toolbar);
    map.addLayer(osmLayer);
    map.setCenter(new OpenLayers.LonLat(-959997.02, 6921270.79), 9);
    
    showWin(map, vectorLayer);
}

