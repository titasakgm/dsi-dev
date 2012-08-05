/**
 * @requires OpenLayers/Handler/Feature.js
 * @requires OpenLayers/Handler/Keyboard.js
 * @requires OpenLayers/Handler/Box.js
 */

/**
 * Class: OpenLayers.Control.DeleteFeature
 * Control to delete multiple features with a user-friendly interface.  When
 *     activated, you can basically do 3 actions :
 *     1) Select feature(s)
 *        a) Click on a feature to select a single feature
 *        b) Click on a feature while holding ctrlKey to select an additionnal
 *           feature.
 *        c) If this.box == true, hold shiftKey to select features within
 *           a box.
 *        d) If this.box == true, hold shiftKey and ctrlKey to add features
 *           within a box to the selection.
 *     2) Unselect feature(s)
 *        a) Click on a selected feature while holding ctrlKey to unselect it.
 *        b) Press the escKey to unselect all features
 *     3) Delete the selected feature(s) with the deleteKey or dKey by default.
 *
 * Inherits From:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.DeleteFeature = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Constant: EVENT_TYPES
     * {Array(String)} Supported application event types.  Register a listener
     *     for a particular event with the following syntax:
     * (code)
     * control.events.register(type, obj, listener);
     * (end)
     *
     *  - *beforefeaturesdeleted* Triggered before features are deleted.  Can
     *      be used to
     *  - *deletefeatures* Triggered 
     */
    EVENT_TYPES: ["beforefeaturesdeleted","deletefeatures"],

    /**
     * Property: features
     * {Array(<OpenLayers.Feature.Vector>)} Features to be deleted.
     */
    features: null,

    /**
     * Property: handlers
     * {Object}
     */
    handlers: null,

    /**
     * APIProperty: deleteCodes
     * {Array(Integer)} Keycodes for deleting features.  Set to null to disable
     *     feature deltion by keypress.  If non-null, keypresses with codes
     *     in this array will delete features in this.features array. Default
     *     is 46 and 68, the 'delete' and lowercase 'd' keys.
     */
    deleteCodes : null,

    /**
     * APIProperty: unselectAllCodes
     * {Array(Integer)} Keycodes for unselecting all features.  Set to null to
     *     disable feature unselection by keypress.  If non-null, keypresses
     *     with codes in this array will unselect features in this.features
     *     array. Default is 27, the 'esc' key.
     */
    unselectAllCodes : null,

    /**
     * APIProperty: box
     * {Boolean} Allow feature selection by drawing a box.
     */
    box: false,

    /**
     * Constructor: OpenLayers.Control.DeleteFeature
     * Create a new delete feature control.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>} Layer that contains features that
     *     will be deleted.
     * options - {Object} Optional object whose properties will be set on the
     *     control.
     */
    initialize: function(layer, options) {
        // concatenate events specific to this control with those from the base
        this.EVENT_TYPES =
            OpenLayers.Control.DeleteFeature.prototype.EVENT_TYPES.concat(
            OpenLayers.Control.prototype.EVENT_TYPES
        );

        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.features = [];
        this.layer = layer;
        this.deleteCodes = [46, 68];
        this.unselectAllCodes = [27];

        var featureOptions = {
          click: this.clickFeature
        };
        var keyboardOptions = {
          keydown: this.handleKeypress
        };
        this.handlers = {
          feature: new OpenLayers.Handler.Feature(this, layer, featureOptions),
          keyboard: new OpenLayers.Handler.Keyboard(this, keyboardOptions)
        };

        if (this.box) {
            this.handlers.box = new OpenLayers.Handler.Box(
                this, {done: this.selectBox},
                {boxDivClassName: "olHandlerBoxSelectFeature",
                 keyMask:OpenLayers.Handler.MOD_SHIFT}
            );
            this.handlers.boxCtrlKey = new OpenLayers.Handler.Box(
                this, {done: this.selectBox},
                {boxDivClassName: "olHandlerBoxSelectFeature",
                 keyMask:OpenLayers.Handler.MOD_SHIFT |
                         OpenLayers.Handler.MOD_CTRL}
            );  
        }
    },

    /**
     * Method: clickFeature
     * Using a feature handler, the clicked feature becomes selected and its
     * State is set to DELETE.  Holding the ctrl key while clicking on a feature
     * enables multiselection and unselection.
     *
     * Parameters :
     * feature - {OpenLayers.Feature.Vector}
     */
    clickFeature: function(feature) {
        if(!this.handlers.feature.evt.ctrlKey) { // single feature selection
            this.unselectAllFeatures();
        }
        
        if(feature.fid == undefined) {
            //oHoverRoadControl.resetHoverFeature(); // ### HARDCODED LINE ###
            this.layer.destroyFeatures([feature]);
        } else if (feature.state != OpenLayers.State.DELETE){
            this.selectFeature(feature);
        } else {
            this.unselectFeature(feature);
        }
    },

    /**
     * Method: selectBox
     * Callback from the handlers.box set up when <box> selection is true
     *     on.
     *
     * Parameters:
     * position - {<OpenLayers.Bounds>}
     */
    selectBox: function(position) {
        var selectBoxOnly = !this.handlers.box.dragHandler.evt.ctrlKey;     

        if (position instanceof OpenLayers.Bounds) {
            var minXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel(position.left, position.bottom)
            );
            var maxXY = this.map.getLonLatFromPixel(
                new OpenLayers.Pixel(position.right, position.top)
            );
            var bounds = new OpenLayers.Bounds(
                minXY.lon, minXY.lat, maxXY.lon, maxXY.lat
            );

            for(var i=0, len = this.layer.features.length; i<len; ++i) {
                var feature = this.layer.features[i];
                if (this.geometryTypes == null || OpenLayers.Util.indexOf(
                        this.geometryTypes, feature.geometry.CLASS_NAME) > -1) {
                    if (bounds.toGeometry().intersects(feature.geometry)) {
                        if (!this.isFeatureSelected(feature) &&
                           (selectBoxOnly || OpenLayers.Util.indexOf(this.features, feature) == -1)) {
                            this.selectFeature(feature);
                        }
                    } else if(selectBoxOnly && this.isFeatureSelected(feature)) {
                        this.unselectFeature(feature);
                    }
                }
            }
        }

    },

    /**
     * Method: selectFeature
     * Add feature to this.features array, set its renderIntent to
     * "select" and its state to DELETE.  Redraw the feature in the end.
     *
     * Parameters:
     * feature - {OpenLayers.Feature.Vector}
     */
    selectFeature: function(feature){
        this.features.push(feature);
        feature.state = OpenLayers.State.DELETE;
        feature.renderIntent = "select";
        this.layer.drawFeature(feature);        
    },

    /**
     * Method: unselectFeature
     * Remove feature from this.features array, reset its renderIntent to
     * default and its state to null.  Redraw the feature in the end.
     *
     * Parameters:
     * feature - {OpenLayers.Feature.Vector}
     */
    unselectFeature: function(feature){
        this.features = OpenLayers.Util.removeItem(this.features, feature);
        feature.state = null;
        feature.renderIntent = "default";
        this.layer.drawFeature(feature);    
    },

    /**
     * Method: isFeatureSelected
     * Check if the given feature is selected.
     *
     * Parameters:
     * feature - {OpenLayers.Feature.Vector}
     *
     * Returns:
     * {Boolean} The feature was selected.
     */
    isFeatureSelected: function(feature){
        return feature.renderIntent == "select";
    },

    /**
     * Method: unselectAllFeatures
     * Browse this.features array and unselect each feature in it.
     */
    unselectAllFeatures: function(){
        for (var i=this.features.length-1; i>=0; i--){
            this.unselectFeature(this.features[i]);
        }
    },

    /**
     * Method: handleKeypress
     * Called by the feature handler on keypress.  This is used to delete
     *     vertices. If the <deleteCode> property is set, vertices will
     *     be deleted when a feature is selected for modification and
     *     the mouse is over a vertex.
     *
     * Parameters:
     * {Integer} Key code corresponding to the keypress event.
     */
    handleKeypress: function(evt) {
        var code = evt.keyCode;

        var delKey = OpenLayers.Util.indexOf(this.deleteCodes, code) != -1;
        if(delKey && this.features && this.features.length > 0) {
            this.deleteFeatures();
            return;
        }

        var escKey = OpenLayers.Util.indexOf(this.unselectAllCodes, code) != -1;
        if(escKey){
            this.unselectAllFeatures();
        }
    },

    /**
     * Method: deleteFeatures
     * Empties the features array if beforefeaturesdeleted event returns true.
     * 
     * options - {Object}
     *     if {silent: true}, the function will skip the beforefeaturesdeleted
     *     and trigger deletefeatures
     */
    deleteFeatures: function (options){
        var silent = options && options.silent;
        var ret;
        var event = {features: this.features};
        
        if (!silent){
            ret = this.events.triggerEvent("beforefeaturesdeleted");
        } else {
            ret = true;
        }

        if(ret === true) {
            this.events.triggerEvent("deletefeatures", event);
            this.features = [];
        }
    },

    /**
     * Method: setMap
     * Set the map property for the control and all handlers.
     *
     * Parameters:
     * map - {<OpenLayers.Map>} The control's map.
     */
    setMap: function(map) {
        this.handlers.feature.setMap(map);
        this.handlers.keyboard.setMap(map);
        if (this.box) {
            this.handlers.box.setMap(map);
            this.handlers.boxCtrlKey.setMap(map);
        }
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },

    /**
     * Method: activate
     * Explicitly activates a control and it's associated
     * handlers if one has been set.  Controls can be
     * deactivated by calling the deactivate() method.
     * 
     * Returns:
     * {Boolean}  True if the control was successfully activated or
     *            false if the control was already active.
     */
    activate: function () {
        if (this.active) {
            return false;
        }
        if (this.handlers) {
            for (var key in this.handlers){
                this.handlers[key].activate();                
            }
        }
        this.active = true;
        this.events.triggerEvent("activate");
        return true;
    },

    /**
     * Method: deactivate
     * Deactivates a control and it's associated handlers if any.  Unselect all
     * selected features.
     * 
     * Returns:
     * {Boolean} True if the control was effectively deactivated or false
     *           if the control was already inactive.
     */
    deactivate: function () {
        if (this.active) {
            if (this.handlers) {
                for (var key in this.handlers){
                    this.handlers[key].deactivate();                
                }
            }
            this.active = false;
            this.unselectAllFeatures();
            this.events.triggerEvent("deactivate");
            return true;
        }
        return false;
    },
    CLASS_NAME: "OpenLayers.Control.DeleteFeature"
});
