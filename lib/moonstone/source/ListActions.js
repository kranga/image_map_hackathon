/**
	_moon.ListActions_ is a control used in conjunction with a list of items, intended
	to be used within a _moon.Header_.  It combines an activating control with a drawer 
	containing a user-defined menu of selectable options.  When a menu item is selected, 
	an action--such as filtering, sorting, moving, or deleting--can be invoked in the
	applicaiton by handling change events from the selected items.
*/
enyo.kind({
	name: "moon.ListActions",
	//* @protected
	classes: "moon-list-actions",
	kind: "enyo.GroupItem",
	//* @public
	published: {
		//* If true, the drawer is expanded, showing this item's contents
		open: false,
		/**
			If true, the drawer will automatically close when the user
			selects a menu item
		*/
		autoCollapse: false,
		/**
			A block of one or more controls to be displayed inside the list actions menu.
			By default, each top-level listActions will have a defaultKind of_FitatbleRows_, 
			and should typically contain a  _moon.Divider_ identifying the category and a `fit:true`
			_moon.Scroller containing _moon.CheckboxItem_'s, _moon.ToggleItems_'s, or 
			_moon.SelectableItem_'s for setting options for the underlying panel.  Alternatively,
			a _moon.DataRepeater_ (with a _moon.Scroller_ set as its container) or a _moon.DataList_
			may be used as the `fit:true` control for populating a data-bound list of options
			(see below for limitations on using a _moon.DataList_).

			More than one option group may be added to the listActions block, and they will lay out
			horizontally by default, with each FittableRow's height constrained to the height of the
			parent Header.  However, a minimum width (300px) is enforced for each group, and if there are 
			more groups than will fit in the available horizontal space, all controls will instead 
			be stacked vertically.  In this case an outer scroller is enabled which wills scroll
			all groups vertically, and the FittableRows are reset to natural size based on their 
			content, which effectively disables any scrollers contained within, to prevent nested
			scrolling.

			Note, the vertical stacking capability poses a limitation on using _moon.DataList_.
			Since _moon.DataList_ must always be allowed to scroll, it is not suitable for use
			in a stacked scenario where only one outer scroller is used.  As such, _moon.DataList_
			cannot be used within a ListActions which may need to stack vertically.

			Each group should have a `category` property (string) set, which will decorate all
			events that bubble from the ListActions, allowing the user to identify which category
			chagned.
		*/
		listActions: null,
		/**
			Source URL for icon image
		*/
		iconSrc: "",
		/**
			By default, list action menus are 300px wide.  To have the menus be proportionally
			sized within the available space, set to true.  Note, a minimum width of 300px is still
			respected; if all menus don't fit horizontally, they will be stacked vertically.
		*/
		proportionalWidth: false
	},

	//* @protected
	events: {
		/** 
			Used internally for ListActions to request Header to add fitting components to itself.
			Not intended for use by end-developer.
		*/
		onRequestCreateListActions: ""
	},
	components:[
		{name:"activator", kind: "moon.IconButton", classes: "moon-list-actions-activator", ontap: "expandContract"}
	],
	drawerComponents: [
		{name: "drawer", kind: "moon.ListActionsDrawer", classes: "list-actions-drawer", onComplete: "drawerAnimationEnd", open: false, spotlight: "container", spotlightModal:true, components: [
			{name: "closeButton", kind: "moon.IconButton", icon: "closex", classes: "moon-popup-close moon-list-actions-close moon-neutral", ontap: "expandContract", defaultSpotlightDown:"listActions"},
			{name: "listActionsClientContainer", classes: "enyo-fit moon-list-actions-client-container moon-neutral", components: [
				{name: "listActions", kind: "moon.Scroller", classes: "enyo-fit moon-list-actions-scroller", horizontal:"hidden", vertical:"hidden", onActivate: "optionSelected", defaultSpotlightUp:"closeButton"}
			]}
		]}
	],
	bindings: [
		{from: ".open", to: ".$.drawer.open"},
		{from: ".iconSrc", to: ".$.activator.src"}
	],
	create: function() {
		this.inherited(arguments);
		this.doRequestCreateListActions({components: this.drawerComponents});
		if (!this.$.drawer) {
			throw "moon.ListActions must be created as a child of moon.Header";
		}
		this.listActionsChanged();
		this.drawerNeedsResize = true;
	},
	rendered: function() {
		this.inherited(arguments);
		if (this.open) {
			// Perform post-open work
			this.drawerAnimationEnd();
			// Update stacking
			this.resizeDrawer();
		}
	},
	destroy: function() {
		enyo.dispatcher.release(this.$.drawer);
		this.inherited(arguments);
	},
	listActionsChanged: function() {
		var owner = this.hasOwnProperty("listActions") ? this.getInstanceOwner() : this;
		this.listActions = this.listActions || [];
		this.renderListActionComponents(owner);
	},
	renderListActionComponents: function(inOwner) {
		this.noAutoCollapse = true;
		this.createListActionComponents(inOwner);
		this.noAutoCollapse = false;
	},
	createListActionComponents: function(inOwner) {
		var listAction, i;

		this.listActionComponents = [];
		for (i = 0; (listAction = this.listActions[i]); i++) {
			this.listActionComponents.push(this.createListActionComponent(listAction, inOwner));
		}

		// Increase width to 100% if there is only one list action
		if (this.proportionalWidth) {
			this.$.drawer.addClass("proportional-width");
			var w = 100 / this.listActionComponents.length;
			for (i=0; i<this.listActionComponents.length; i++) {
				this.listActionComponents[i].applyStyle("width", w + "%");
			}
		}

		if (this.hasNode()) {
			this.$.listActions.render();
		}
	},
	//* Creates a new list action component based on _inListAction_.
	createListActionComponent: function(inListAction, inOwner) {
		var listActionComponent;

		inListAction.mixins = this.addListActionMixin(inListAction);
		listActionComponent = this.$.listActions.createComponent(inListAction, {owner: inOwner, layoutKind:"FittableRowsLayout"});
		listActionComponent.addClass("moon-list-actions-menu");

		return listActionComponent;
	},
	/**
		Adds a mixin to each list action menu that decorates _activate_ events
		with the menu's _action_ property.
	*/
	addListActionMixin: function(inListAction) {
		var mixins = inListAction.mixins || [];
		if (mixins.indexOf("moon.ListActionActivationSupport") === -1) {
			mixins.push("moon.ListActionActivationSupport");
		}
		return mixins;
	},
	//* Toggles value of _this.open_.
	expandContract: function(inSender, inEvent) {
		if (this.disabled) {
			return true;
		}
		this.setOpen(!this.getOpen());
	},
	openChanged: function(){
		this.setActive(!this.getOpen());
		// If opened, show drawer and resize it if needed
		if(this.open){
			this.$.drawer.show();
			if (this.drawerNeedsResize) {
				this.resizeDrawer();
				this.drawerNeedsResize = false;
			}
			// Capture onSpotlightFocus happening outside the drawer, so that we can prevent focus
			// from landing in the header beneath the drawer
			enyo.dispatcher.capture(this.$.drawer, {onSpotlightFocus: "capturedSpotlightFocus"}, this);
		} else {
			enyo.dispatcher.release(this.$.drawer);
		}
	},
	drawerAnimationEnd: function() {
		//on closed, hide drawer and spot _this.$.activator_
		if (!this.getOpen()) {
			this.$.drawer.hide();
			if (this.generated) {
				enyo.Spotlight.spot(this.$.activator);
			}
			this.bubble("onRequestUnmuteTooltip");
		} 
		//on open, move top and spot _this.$.closeButton_
		else {
			if (this.resetScroller) {
				this.$.listActions.scrollTo(0, 0);
				this.resetScroller = false;
			}
			if (this.generated) {
				enyo.Spotlight.spot(this.$.closeButton);
			}
			this.bubble("onRequestMuteTooltip");
		}
	},
	updateStacking: function() {
		if (this.$.drawer.hasNode()) {
			this.set("stacked", this.shouldStack());
		}
	},
	shouldStack: function() {
		// Assumption: min-width of all listActionsComponents set to 300px in CSS
		return this.$.listActions.getBounds().width < (300 * this.listActionComponents.length);
	},
	stackedChanged: function() {
		if (this.stacked) {
			this.$.drawer.addClass("stacked");
			this.stackMeUp();
			// When stacked, always have vertical scroller 
			this.$.listActions.setVertical("scroll");
		}
		else {
			this.$.drawer.removeClass("stacked");
			this.unStackMeUp();
			this.$.listActions.setVertical("hidden");
		}
		this.resetScroller = true;
		this.$.listActions.resized();
	},
	stackMeUp: function() {
		var optionGroup, i;

		for (i = 0; (optionGroup = this.listActionComponents[i]); i++) {
			optionGroup.applyStyle("display", "block");
			// Stacked contols get natural height (which prevents scrolling), such that they stack
			// within outer scroller which is allowed to scroll all controls; this is a problem for
			// DataLists, which require an explicit height, making them unsuitable for use in 
			// stacked ListActions
			optionGroup.applyStyle("height", "none");
		}
	},
	unStackMeUp: function() {
		var containerHeight = this.getContainerBounds().height,
			optionGroup,
			i;

		for (i = 0; (optionGroup = this.listActionComponents[i]); i++) {
			optionGroup.applyStyle("display", "inline-block");
			optionGroup.applyStyle("height", containerHeight + "px");
		}
	},
	resizeHandler: function() {
		this.resetCachedValues();

		// If drawer is collapsed, resize it the next time it is opened
		if (this.getOpen()) {
			this.resizeDrawer();
		} else {
			this.drawerNeedsResize = true;
		}
	},
	resizeDrawer: function() {
		this.updateStacking();
	},
	optionSelected: function(inSender, inEvent) {
		if (this.getOpen() && this.autoCollapse && !this.noAutoCollapse) {
			this.startJob("expandContract", "expandContract", 300);
		}
	},
	getContainerBounds: function() {
		this.containerBounds = this.containerBounds || this.$.listActions.getBounds();
		return this.containerBounds;
	},
	resetCachedValues: function() {
		this.headerBounds = null;
		this.clientBounds = null;
		this.containerBounds = null;
	},
	capturedSpotlightFocus: function(inSender, inEvent) {
		// We need to prevent header children below the drawer from being focused
		if (inEvent.originator.isDescendantOf(this.$.drawer.parent) && 
			!inEvent.originator.isDescendantOf(this.$.drawer)) {
			enyo.Spotlight.spot(this.$.drawer);
			return true;
		}
	}
});

/**
	_moon.ListActionsDrawer_ is a control used by
	[moon.ListActions](#moon.ListActions) to house a menu of selectable options.
*/
enyo.kind({
	name: "moon.ListActionsDrawer",
	//* @public
	published: {
		open: false
	},
	//* @protected
	classes: "moon-list-actions-drawer",
	components: [
		{name: "client", classes: "moon-list-actions-drawer-client moon-neutral"},
		{name: "animator", kind: "enyo.StyleAnimator", onStep: "step"}
	],
	rendered: function() {
		this.inherited(arguments);
		// On webOS TV, 2D matrix transforms seem to perform as well as 3D
		// for this use case, and avoid a strange "layer ghosting" issue
		// the first time a drawer is opened.
		this.accel = enyo.dom.canAccelerate() && enyo.platform.webos !== 4;
		// Show drawer if default open value is true without animation
		if (this.open) {
			this.setShowing(true);
		} else {
			this.resetClientPosition();
			this.setShowing(false);
		}
	},
	// We override getBubbleTarget here so that events emanating from a ListActionsDrawer
	// instance will bubble to the owner of the associated ListActions instance, as expected.
	// This is necessary because events normally bubble to a control's DOM parent, but
	// we have sneakily arranged for the DOM parent of a ListActionsDrawer instance to be
	// not the ListActions instance but the containing Header instance.
	getBubbleTarget: function() {
		return this.owner;
	},
	openChanged: function(inOld) {
		// Skip animation before render time
		if (!this.$.client.hasNode()) { return; }
		if (this.open) {
			this.playOpenAnimation();
		} else {
			this.playCloseAnimation();
		}
	},
	resetClientPosition: function() {
		var matrix = this.generateMatrix(this.getBounds().height);
		this.$.client.applyStyle("-webkit-transform", matrix);
	},
	playOpenAnimation: function() {
		var openAnimation = this.createOpenAnimation();
		this.$.animator.play(openAnimation.name);
	},
	createOpenAnimation: function() {
		// For unknown reasons, a null transform works reliably in Chrome,
		// whereas a matrix transform setting Y translation to 0 causes a
		// a strange "layer ghosting" issue the first time a drawer is
		// opened -- the same issue we see on webOS TV with 3D matrices.
		var matrix = enyo.platform.chrome ? null : this.generateMatrix(0);
		return this.$.animator.newAnimation({
			name: "open",
			duration: 225,
			timingFunction: "linear",
			keyframes: {
				0: [{
					control: this.$.client,
					properties: {
						"-webkit-transform"  : "current"
					}
				}],
				100: [{
					control: this.$.client,
					properties: {
						"-webkit-transform" : matrix
					}
				}]
			}
		});
	},
	playCloseAnimation: function() {
		var closeAnimation = this.createCloseAnimation(this.getBounds().height);
		this.$.animator.play(closeAnimation.name);
	},
	createCloseAnimation: function(inHeight) {
		var matrix = this.generateMatrix(inHeight);
		return this.$.animator.newAnimation({
			name: "close",
			duration: 225,
			timingFunction: "linear",
			keyframes: {
				0: [{
					control: this.$.client,
					properties: {
						"-webkit-transform"  : "current"
					}
				}],
				100: [{
					control: this.$.client,
					properties: {
						"-webkit-transform" : matrix
					}
				}]
			}
		});
	},
	generateMatrix: function(inYPosition) {
		return (this.accel) ? this.assemble3dMatrix(0, inYPosition, 1, 1) : this.assemle2dMatrix(0, inYPosition, 1, 1);
	},
	assemle2dMatrix: function(inX, inY, inWidth, inHeight) {
		return "matrix(" + inWidth + ", 0, 0, " + inHeight + ", " + inX + ", " + inY + ")";
	},
	assemble3dMatrix: function(inX, inY, inWidth, inHeight) {
		return "matrix3d(" + inWidth + ", 0, 0, 0, 0, " + inHeight + ", 0, 0, 0, 0, 1, 0, " + inX + ", " + inY + ", 1, 1)";
	}
});

moon.ListActionActivationSupport = {
	name: "ListActionActivationSupport",
	handlers: {
		onActivate: "activate"
	},
	activate: function(inSender, inEvent) {
		inEvent.action = this.action;
	}
};
