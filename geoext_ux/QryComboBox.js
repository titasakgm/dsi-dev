Ext.define('GeoExt.ux.QryComboBox', {
  extend: "Ext.form.ComboBox"
  ,alias: 'widget.qrycombobox'
  ,fieldStore: []
  ,rootStore: 'records'
  ,totalStore: 'totalcount'
  ,urlStore: ''
  ,initComponent: function(){
    
    Ext.define('Location', {
      extend: 'Ext.data.Model',
      fields: [
        {type: 'string', name: 'loc_gid'}
        ,{type: 'string', name: 'loc_table'}
        ,{type: 'string', name: 'loc_text'}
      ]
    });
    
    this.store = Ext.create('Ext.data.Store', {
        model: 'Location',
        proxy: {
            type: 'ajax',
            url : this.urlStore,
            reader: {
                type: 'json',
                root: this.rootStore,
                totalProperty: this.totalStore
            }
        },
        autoLoad: true,
        pageSize: 5
    });

    Ext.apply(this, {    
      editable: true
      ,minChars: 4
      ,store: this.store
      ,pageSize: 5
      ,triggerAction: 'all'
      ,emptyText: 'Search...'
      ,autoSelect: false
      
    });
    this.callParent(arguments);
  }
})