/**
	For simple applications, you might define all of your views in this file.  
	For more complex applications, you might choose to separate these kind definitions 
	into multiple files under this folder.
*/

enyo.kind({
	name: "myapp.MainView",
	kind: "moon.Panels",
	classes: "moon enyo-fit main-view",
	pattern:"activity",
	components: [
		{kind: "enyo.Signals", onkeyup: "paintNextRegion"},
		{kind: "moon.Panel", name: "mappanel", title: "Hello World Map Image!", headerComponents: [
			// {kind: "moon.IconButton", src: "assets/icon-like.png"}
		], components: [
			// {kind: "moon.BodyText", content: "Your content here"}		
			{kind: "enyo.MyImageView", name: "mapimage", src: "assets/demo_world_bigger.png", 
			scale: "auto", ontap: "mapTapped", fit: true, onZoom: "scaleChanged", components: [
			{tag: "canvas", name: "mapoverlay", style: "position: absolute; width: 6400px; height: 6400px; top: 0px; left: 0px; pointer-events: none; z-index: 100;"}
			]
			},
			{tag: "map", name:"world", allowHtml: true, attributes:{name: "world"}}
		]},
	],
	create: function() {
		this.inherited(arguments);
		this.set("areas", new WorldMap.AreasCollection());
		this.get("areas").fetch({
			success: enyo.bindSafely(this, 'createMapTagString') 
		});
	},
	rendered: function() {
		this.inherited(arguments);
		this.$.mapoverlay.setAttribute("height", 6400);
		this.$.mapoverlay.setAttribute("width", 6400);
		this._currentRegion = 0;
		// console.log("rendered");
	},
	paintRegion: function(regionID) {
		this._currentRegion = regionID;
		var i = regionID;
		var obj = this.areas.at(i);
		this.$.mappanel.setSubTitleBelow(obj.get("name"));
		var context = this.$.mapoverlay.hasNode().getContext("2d");
		
		var coords = obj.get("coords");
		
		// console.log(coords);
		
		context.fillStyle="#cf0652";
		
		context.clearRect(0, 0, 6400, 6400);

		context.beginPath();
				
		var x_shift =  (this.$.mappanel.getBounds().width - (this.$.mapimage.scale*1600)) / 2;
		// alert(x_shift);
		if (x_shift < 0) x_shift = 0;
		var y_shift =  0;
		
		
		var scale = this.$.mapimage.scale;
		
		context.moveTo(coords[0]*scale + x_shift, coords[1]*scale + y_shift);

		for(i=2; i < coords.length; i+=2) {
			context.lineTo(coords[i]*scale + x_shift, coords[i+1]*scale + y_shift);
		}
		
		context.closePath();
		
		context.fill();		
	},
	clearCanvas: function() {
		var context = this.$.mapoverlay.hasNode().getContext("2d");
		context.clearRect(0, 0, 6400, 6400);
	},

	scaleChanged: function(inSender, inEvent) {
		// console.log("scale Changed");
		this.clearCanvas();
		this.$.mappanel.setSubTitleBelow("");
		this.$.mappanel.setTitleBelow("Scale: " + Math.round(this.$.mapimage.scale*100)/100);
	},
	mapTapped: function(inSender, inEvent) {
		this.$.mappanel.setTitleBelow("clientX: " + inEvent.clientX + " clientY: " + inEvent.clientY + " scale: " + this.$.mapimage.scale);
		var i = Math.floor(Math.random()*this.areas.length);
		
		this.paintRegion(i);
	},
	paintNextRegion: function(inSender, inEvent) {
		// console.log("onkeyup NextRegion");
		// console.log(this._currentRegion);
		var next, currName, nextName;
		currName = this.areas.at(this._currentRegion).get("name");
		next = this._currentRegion;
		while (true) {
			next = (next < (this.areas.length -2)) ? (next+1) : 0;
			// console.log(next);
			nextName = this.areas.at(next).get("name");
			if (currName != nextName) {
				this.paintRegion(next);
				break;
			}
		}
	},
	createMapTagString: function(rec, opts, res) {
		var mapString, areaString, area, arname, arcoords;
		var scale = this.$.mapimage.scale;
		scale = 1;
		// mapString = "<map name=\"world\"\n";
		mapString = "\n";
		
		for (i = 0; i < this.areas.length; i++) {
			area = this.areas.at(i);
			arname = area.get("name");
			arcoords = area.get("coords");
			// console.log(arname);
			// console.log (arcoords);
			areaString = "\t<area shape=\"poly\" areaid=\""+ i+ "\" title=\"" +
			arname + "\" alt=\"" + arname + "\" href=\"#\" onmouseover=\"area51(this)\" coords=\"";
			for (j =0; j < arcoords.length; j++) {
				areaString += Math.round(arcoords[j]*scale);
				if (j < arcoords.length-1) {
					areaString += ", ";
				}
			}
			areaString += "\">\n";
			mapString += areaString;
		}
		// mapString += "</map>\n";
		mapString += "\n";
		// console.log("areas parsed");
		// console.log(mapString);
		this.$.world.setContent(mapString);
		// console.log(this.$.mapimage.$.image);
		this.$.mapimage.$.image.setAttribute("usemap","#world");
	}
});


enyo.kind({
	name: "enyo.MyImageView",
	kind: "enyo.ImageView"
	// scaleChanged: enyo.inherit(function(sup) {
	// 	return function() {
	// 		sup.apply(this, arguments);
	// 		console.log(this.getBounds());
	// 	};
	// }),
});


function area51(node) {
	// console.log("area51");
	// console.log(node);
	var mainView = enyo.$['app_mainView'];
	
	// console.log(node.getAttribute("areaid"));
	
	var i = parseInt(node.getAttribute("areaid"));
	
	mainView.paintRegion(i);	
}

function area52(node) {
	// console.log("area52");
	// console.log(node);
}