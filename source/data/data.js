/**
	For simple applications, you might define all of your models, collections,
	and sources in this file.  For more complex applications, you might choose to separate
	these kind definitions into multiple files under this folder.
*/

enyo.kind({
        name: "WorldMap.Source",
        kind: "enyo.AjaxSource",
       	urlRoot: "http://localhost/image_map_hackathon/source/data/world.json",
        fetch: function(opts) {
          opts.url=this.urlRoot;
          this.inherited(arguments);
        }
});


enyo.store.addSources({WorldMap: "WorldMap.Source"});


enyo.kind({
        name: "WorldMap.MapModel",
        kind: "enyo.Model",
        primaryKey: "id",
        parse: function(data) {      
            return data;        
        }
    });
    
enyo.kind({
        name: "WorldMap.AreasCollection",
        kind: "enyo.Collection",
        model: "WorldMap.MapModel",
		defaultSource: "WorldMap",
        fetch:function(opts){
        	//opts.callbackName="callback",
		return this.inherited(arguments);    
	},
        parse: function(data) {       
            return data.areas;       
        }
    });
