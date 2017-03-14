webFXTreeConfig.loadingText = "Loading...";

function splitOverlayIcons(node){
    if(!node.getMetadata().get("overlay_icon")  || !Modernizr.multiplebgs) return false;
    var ret = [];
    $A(node.getMetadata().get("overlay_icon").split(",")).each(function(el){
        ret.push(resolveImageSource(el, "/images/overlays/ICON_SIZE", 8));
    });
    return ret;
}

function AJXPTree(rootNode, sAction, filter) {
	this.WebFXTree = WebFXTree;
	this.loaded = true;
	this.node = rootNode;
	var icon = rootNode.getIcon();
	if(icon.indexOf(resourcesFolder+"/") != 0){
		icon = resolveImageSource(icon, "/images/mimes/ICON_SIZE", 16);
	}
	var openIcon = rootNode.getMetadata().get("openicon");
	if(openIcon){
		if(openIcon.indexOf(resourcesFolder+"/") != 0){
			openIcon = resolveImageSource(openIcon, "/images/mimes/ICON_SIZE", 16);
		}
	}else{
		openIcon = icon;
	}
	
	this.WebFXTree(rootNode.getLabel(), sAction, 'explorer', icon, openIcon);
	// setup default property values
	this.loading = false;
	this.loaded = false;
	this.errorText = "";
	if(filter){
		this.filter = filter;
 	}
    this.overlayIcon = splitOverlayIcons(rootNode);

	this._loadingItem = new WebFXTreeItem(MessageHash?MessageHash[466]:webFXTreeConfig.loadingText);
	if(this.open) this.node.load();
	else{
		this.add(this._loadingItem);
	}
};

AJXPTree.prototype = new WebFXTree;

AJXPTree.prototype._webfxtree_expand = WebFXTree.prototype.expand;
AJXPTree.prototype.expand = function() {
	if(!this.node.fake){
		this.node.load();
	}
	this._webfxtree_expand();
};

AJXPTree.prototype.destroy = function(){
    if(this.node) this.node.stopObserving();
};

AJXPTree.prototype.setAjxpRootNode = function(rootNode){
	if(this.node){
		var oldNode = this.node;
	}
	this.node = rootNode;	
	var clear = function(){
		this.open = false;
		while (this.childNodes.length > 0)
			this.childNodes[this.childNodes.length - 1].remove();
		this.loaded = false;
	};
	this.node.observe("force_clear",  clear.bind(this));
	this.node.observe("node_replaced",  clear.bind(this));
	this.attachListeners(this, rootNode);
	if(oldNode){
		oldNode.notify("node_replaced");
	}
	//this.node.load();
};

AJXPTree.prototype.attachListeners = function(jsNode, node){
	node.observe("child_added", function(childPath){
		if(node.getMetadata().get('paginationData')){
			var pData = node.getMetadata().get('paginationData');
			if(!this.paginated){
				this.paginated = true;
				if(pData.get('dirsCount')!="0"){
					this.updateLabel(this.text + " (" + MessageHash[pData.get('overflowMessage')]+ ")");
				}
			}
			//return;
		}else if(this.paginated){
			this.paginated = false;
			this.updateLabel(this.text);
		}
		var child = node.findChildByPath(childPath);
		if(child){
			var jsChild = _nodeToTree(child, this);
			if(jsChild){
				this.attachListeners(jsChild, child);
			}
		}
	}.bind(jsNode));
	node.observe("node_replaced", function(newNode){
		// Should refresh label / icon
		if(jsNode.updateIcon){ 
			var ic = resolveImageSource(node.getIcon(), "/images/mimes/ICON_SIZE", 16);
			var oic = ic;
			if(node.getMetadata().get("openicon")){
				oic = resolveImageSource(node.getMetadata().get("openicon"), "/images/mimes/ICON_SIZE", 16);
			}
			jsNode.updateIcon(ic, oic);
            jsNode.overlayIcon = splitOverlayIcons(node);
		}
		if(jsNode.updateLabel) jsNode.updateLabel(node.getLabel());
	}.bind(jsNode));
    var remover = function(e){
        jsNode.remove();
        window.setTimeout(function(){
            node.stopObserving("node_removed", remover);
        }, 200);
    };
	node.observe("node_removed", remover);
	node.observe("loading", function(){
		//this.add(this._loadingItem);
	}.bind(jsNode) );
	node.observe("loaded", function(){
		this._loadingItem.remove();
		if(this.childNodes.length){
			this._webfxtree_expand();
		}
	}.bind(jsNode) );
};

function AJXPTreeItem(node, sAction, eParent) {
	this.WebFXTreeItem = WebFXTreeItem;
	this.node = node;
	var icon = node.getIcon();
	if(icon.indexOf(resourcesFolder+"/") != 0){
		icon = resolveImageSource(icon, "/images/mimes/ICON_SIZE", 16);
	}
	var openIcon = node.getMetadata().get("openicon");
	if(openIcon){
		if(openIcon.indexOf(resourcesFolder+"/") != 0){
			openIcon = resolveImageSource(openIcon, "/images/mimes/ICON_SIZE", 16);
		}
	}else{
		openIcon = icon;
	}
	
	this.folder = true;
	this.WebFXTreeItem(
        node.getLabel(),
        sAction,
        eParent,
        icon,
        (openIcon?openIcon:resolveImageSource("folder_open.png", "/images/mimes/ICON_SIZE", 16)),
        splitOverlayIcons(node)
    );

	this.loading = false;
	this.loaded = false;
	this.errorText = "";

	this._loadingItem = new WebFXTreeItem(MessageHash?MessageHash[466]:webFXTreeConfig.loadingText);
	if (this.open) {
		this.node.load();
	}else{
		this.add(this._loadingItem);
	}
	webFXTreeHandler.all[this.id] = this;
};

AJXPTreeItem.prototype = new WebFXTreeItem;

AJXPTreeItem.prototype._webfxtree_expand = WebFXTreeItem.prototype.expand;
AJXPTreeItem.prototype.expand = function() {
	this.node.load();
	this._webfxtree_expand();
};

AJXPTreeItem.prototype.attachListeners = AJXPTree.prototype.attachListeners;


/*
 * Helper functions
 */
// Converts an xml tree to a js tree. See article about xml tree format
function _nodeToTree(node, parentNode) {
	if(parentNode.filter && !parentNode.filter(node)){
		return false;
	}
	var jsNode = new AJXPTreeItem(node, null, parentNode);	
	if(node.isLoaded())
	{
		jsNode.loaded = true;
	}
	jsNode.filename = node.getPath();	
	if(parentNode.filter){
		jsNode.filter = parentNode.filter;
	}
    jsNode.overlayIcon = splitOverlayIcons(node);

	node.getChildren().each(function(child){
		var newNode = _nodeToTree(child, jsNode);
		if(newNode){
			if(jsNode.filter){
				newNode.filter = jsNode.filter;
			}
            newNode.overlayIcon = splitOverlayIcons(child);
			jsNode.add( newNode , false );
		}
	});	
	return jsNode;	
};