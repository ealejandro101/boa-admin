// This file is part of BoA - https://github.com/boa-project
//
// BoA is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// BoA is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with BoA.  If not, see <http://www.gnu.org/licenses/>.
//
// The latest code can be found at <https://github.com/boa-project/>.
 
/**
 * This is a one-line short description of the file/class.
 *
 * You can have a rather longer description of the file/class as well,
 * if you like, and it can span multiple lines.
 *
 * @package    [PACKAGE]
 * @category   [CATEGORY]
 * @copyright  2017 BoA Project
 * @license    https://www.gnu.org/licenses/agpl-3.0.html GNU Affero GPL v3 or later
 */

/**
 * Abstract container for data
 */
Class.create("ManifestNode", {
	/**
	 * Constructor
	 * @param path String
	 * @param isLeaf Boolean
	 * @param label String
	 * @param icon String
	 * @param iNodeProvider IManifestNodeProvider
	 */
	initialize : function(path, isLeaf, label, icon, iNodeProvider){
		this._path = path;
		if(this._path && this._path.length && this._path.length > 1){
			if(this._path[this._path.length-1] == "/"){
				this._path = this._path.substring(0, this._path.length-1);
			}
		}
		this._metadata = $H();
		this._isLeaf = isLeaf || false;
		this._label = label || '';
		this._icon = icon || '';
		this._children = $A([]);
		this._isRoot = false;
		
		this._isLoaded = false;
		this.fake = false;
		this._iNodeProvider = iNodeProvider;
		
	},
	/**
	 * The node is loaded or not
	 * @returns Boolean
	 */
	isLoaded : function(){
		return this._isLoaded;
	},
	/**
	 * Changes loaded status
	 * @param bool Boolean
	 */
	setLoaded : function(bool){
		this._isLoaded = bool;
	},
	/**
	 * Loads the node using its own provider or the one passed
	 * @param iManifestNodeProvider IManifestNodeProvider Optionnal
	 */
	load : function(iManifestNodeProvider){		
		if(this.isLoading) return;		
		if(!iManifestNodeProvider){
			if(this._iNodeProvider){
				iManifestNodeProvider = this._iNodeProvider;
			}else{
				iManifestNodeProvider = new RemoteNodeProvider();
			}
		}
		this.isLoading = true;
		this.notify("loading");
		if(this._isLoaded){
			this.isLoading = false;
			this.notify("loaded");
			return;
		}
		iManifestNodeProvider.loadNode(this, function(node){
			this._isLoaded = true;
			this.isLoading = false;
			this.notify("loaded");
			this.notify("first_load");
		}.bind(this));		
	},
	/**
	 * Remove children and reload node
	 * @param iManifestNodeProvider IManifestNodeProvider Optionnal
	 */
	reload : function(iManifestNodeProvider){
		this._children.each(function(child){
			this.removeChild(child);
		}.bind(this));
		this._isLoaded = false;		
		this.load(iManifestNodeProvider);
	},
	/**
	 * Unload child and notify "force_clear"
	 */
	clear : function(){
		this._children.each(function(child){
			this.removeChild(child);
		}.bind(this));
		this._isLoaded = false;		
		this.notify("force_clear");
	},
	/**
	 * Sets this ManifestNode as being the root parent
	 */
	setRoot : function(){
		this._isRoot = true;
	},
	/**
	 * Set the node children as a bunch
	 * @param nodes ManifestNodes[]
	 */
	setChildren : function(nodes){
		this._children = $A(nodes);
		this._children.invoke('setParent', this);
	},
	/**
	 * Get all children as a bunch
	 * @returns ManifestNode[]
	 */
	getChildren : function(){
		return this._children;
	},
	/**
	 * Adds a child to children
	 * @param node ManifestNode The child
	 */
	addChild : function(node){
		node.setParent(this);
		if(this._iNodeProvider) node._iNodeProvider = this._iNodeProvider;
        var existingNode = this.findChildByPath(node.getPath());
		if(existingNode && !Object.isString(existingNode)){
			existingNode.replaceBy(node, "override");
		}else{			
			this._children.push(node);
			this.notify("child_added", node.getPath());
		}
	},
	/**
	 * Removes the child from the children
	 * @param node ManifestNode
	 */
	removeChild : function(node){
		var removePath = node.getPath();
		node.notify("node_removed");
        node._parentNode = null;
		this._children = this._children.without(node);
		this.notify("child_removed", removePath);
	},
	/**
	 * Replaces the current node by a new one. Copy all properties deeply
	 * @param node ManifestNode
	 */
	replaceBy : function(node, metaMerge){
		this._isLeaf = node._isLeaf;
        if(node.getPath() && this._path != node.getPath()){
            this._path = node.getPath();
        }
		if(node._label){
			this._label = node._label;
		}
		if(node._icon){
			this._icon = node._icon;
		}
		if(node._iNodeProvider){
			this._iNodeProvider = node._iNodeProvider;
		}
		this._isRoot = node._isRoot;
		this._isLoaded = node._isLoaded;
		this.fake = node.fake;
		node.getChildren().each(function(child){
			this.addChild(child);
		}.bind(this) );		
		var meta = node.getMetadata();
        if(metaMerge == "override") this._metadata = $H();
		meta.each(function(pair){
            if(metaMerge == "override"){
                this._metadata.set(pair.key, pair.value);
            }else{
                if(this._metadata.get(pair.key) && pair.value === ""){
                    return;
                }
                this._metadata.set(pair.key, pair.value);
            }
		}.bind(this) );
		this.notify("node_replaced", this);		
	},
	/**
	 * Finds a child node by its path
	 * @param path String
	 * @returns ManifestNode
	 */
	findChildByPath : function(path){
		return $A(this._children).find(function(child){
			return (child.getPath() == path);
		});
	},
	/**
	 * Sets the metadata as a bunch
	 * @param data $H() A prototype Hash
	 */
	setMetadata : function(data){
		this._metadata = data;
	},
	/**
	 * Gets the metadat
	 * @returns $H()
	 */
	getMetadata : function(){
		return this._metadata;
	},
	/**
	 * Is this node a leaf
	 * @returns Boolean
	 */
	isLeaf : function(){
		return this._isLeaf;
	},
	/**
	 * @returns String
	 */
	getPath : function(){
		return this._path;
	},
	/**
	 * @returns String
	 */
	getLabel : function(){
		return this._label;
	},
	/**
	 * @returns String
	 */
	getIcon : function(){
		return this._icon;
	},
	/**
	 * @returns Boolean
	 */
	isRecycle : function(){
		return (this.getMime() == 'recycle');
	},
	/**
	 * NOT IMPLEMENTED, USE hasMimeInBranch instead
	 */	
	inZip : function(){
		
	},
	/**
	 * Search the mime type in the parent branch
	 * @param mime String
	 * @returns Boolean
	 */
	hasMimeInBranch: function(mime){
		if(this.getMime() == mime.toLowerCase()) return true;
		var parent, crt = this;
		while(parent =crt._parentNode){
			if(parent.getMime() == mime.toLowerCase()){return true;}
			crt = parent;
		}
		return false;
	},	
	/**
	 * Search the mime type in the parent branch
	 * @param mime String
	 * @returns Boolean
	 */
	hasMetadataInBranch: function(metadataKey, metadataValue){
		if(this.getMetadata().get(metadataKey)) {
            if(metadataValue) {
                return this.getMetadata().get(metadataKey) == metadataValue;
            }else {
                return true;
            }
        }
		var parent, crt = this;
		while(parent =crt._parentNode){
			if(parent.getMetadata().get(metadataKey)){
                if(metadataValue){
                    return (parent.getMetadata().get(metadataKey) == metadataValue);
                }else{
                    return true;
                }
            }
			crt = parent;
		}
		return false;
	},
	/**
	 * Sets a reference to the parent node
	 * @param parentNode ManifestNode
	 */
	setParent : function(parentNode){
		this._parentNode = parentNode;
	},
	/**
	 * Gets the parent Node
	 * @returns ManifestNode
	 */
	getParent : function(){
		return this._parentNode;
	},
	/**
	 * Finds this node by path if it already exists in arborescence 
	 * @param rootNode ManifestNode
	 * @param fakeNodes ManifestNode[]
	 */
	findInArbo : function(rootNode, fakeNodes){
		if(!this.getPath()) return;
		var pathParts = this.getPath().split("/");
		var parentNodes = $A();
		var crtPath = "";
		var crtNode, crtParentNode = rootNode;
		for(var i=0;i<pathParts.length;i++){
			if(pathParts[i] == "") continue;
			crtPath = crtPath + "/" + pathParts[i];
            var node = crtParentNode.findChildByPath(crtPath);
			if(node && !Object.isString(node)){
				crtNode = node;
			}else{
                if(fakeNodes === undefined) return false;
				crtNode = new ManifestNode(crtPath, false, getBaseName(crtPath));
				crtNode.fake = true;				
				fakeNodes.push(crtNode);
				crtParentNode.addChild(crtNode);
			}
			crtParentNode = crtNode;
		}
		return crtNode;
	},
	/**
	 * @returns Boolean
	 */
	isRoot : function(){
		return this._isRoot;
	},
	/**
	 * Check if it's the parent of the given node
	 * @param node ManifestNode
	 * @returns Boolean
	 */
	isParentOf : function(node){
		var childPath = node.getPath();
		var parentPath = this.getPath();
		return (childPath.substring(0,parentPath.length) == parentPath);
	},
	/**
	 * Check if it's a child of the given node
	 * @param node ManifestNode
	 * @returns Boolean
	 */
	isChildOf : function(node){
		var childPath = this.getPath();
		var parentPath = node.getPath();
		return (childPath.substring(0,parentPath.length) == parentPath);
	},	
	/**
	 * Gets the current's node mime type, either by APP_mime or by extension.
	 * @returns String
	 */
	getMime : function(){
		if(this._metadata && this._metadata.get("APP_mime")) return this._metadata.get("APP_mime").toLowerCase();
		if(this._metadata && this.isLeaf()) return getMimeType(this._metadata).toLowerCase();
		return "";
	}
});