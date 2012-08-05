Ext.ns('Ext.ux.form');
Ext.ux.form.QryComboBox = Ext.extend(Ext.form.ComboBox, {
  fieldStore: []
  ,rootStore: 'records'
  ,totalStore: 'totalcount'
  ,urlStore: ''
  ,initComponent: function(){
    Ext.apply(this, {    
      editable: true
      ,pageSize: 5
      ,minChars: 4
      ,store: new Ext.data.Store({
        reader: new Ext.data.JsonReader({
          fields: this.fieldStore
          ,root: this.rootStore                        
          ,totalProperty: this.totalStore
        })
        ,url: this.urlStore
      })
      ,triggerAction: 'all'
      ,emptyText: 'Search...'
      ,autoSelect: false
      ,listeners: {
        blur: function(el){
          if (el.getValue() == el.getRawValue()){
            el.clearValue();    
          }
        }
        ,beforequery: function(qry){
          delete qry.combo.lastQuery;
        } 
      }
    });
    Ext.ux.form.QryComboBox.superclass.initComponent.apply(this, arguments);
  }
})
Ext.reg('qrycombobox', Ext.ux.form.QryComboBox);
