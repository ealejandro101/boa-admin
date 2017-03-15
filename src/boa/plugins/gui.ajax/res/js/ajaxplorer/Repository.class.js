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
 * Container for a Repository.
 */
Class.create("Repository", {

	/**
	 * @var String
	 */
	id:undefined,
	/**
	 * @var String
	 */
	label:'No Repository',
	/**
	 * @var String
	 */
	icon:'',
	/**
	 * @var String
	 */
	accessType:'',
	/**
	 * @var object
	 */
	nodeProviderDef: null,
	/**
	 * @var ResourcesManager
	 */
	resourcesManager:undefined,
	/**
	 * @var Boolean
	 */
	allowCrossRepositoryCopy:false,
    /**
     * @var Boolean
     */
    userEditable:false,
	/**
	 * @var String
	 */
	slug:'',
    /**
     * @var String
     */
    owner:'',

    /**
     * @var String
     */
    description:'',

	/**
	 * Constructor
	 * @param id String
	 * @param xmlDef XMLNode
	 */
	initialize:function(id, xmlDef){
		if(MessageHash){
			this.label = MessageHash[391];
		}
		this.id = id;
		this.icon = resourcesFolder+'/images/actions/16/network-wired.png';
		this.resourcesManager = new ResourcesManager();
		if(xmlDef) this.loadFromXml(xmlDef);
	},
	
	/**
	 * @returns String
	 */
	getId : function(){
		return this.id;
	},
	
	/**
	 * @returns String
	 */
	getLabel : function(){
		return this.label;
	},
	/**
	 * @param label String
	 */
	setLabel : function(label){
		this.label = label;
	},

    /**
     * @return String
     */
    getDescription: function(){
        return this.description;
    },

	/**
	 * @returns String
	 */
	getIcon : function(){
		return this.icon;
	},
	/**
	 * @param label String
	 */
	setIcon : function(icon){
		this.icon = icon;
	},

    /**
     * @return String
     */
    getOwner : function(){
        return this.owner;
    },

	/**
	 * @returns String
	 */
	getAccessType : function(){
		return this.accessType;
	},
	/**
	 * @param label String
	 */
	setAccessType : function(access){
		this.accessType = access;
	},
	
	/**
	 * Triggers ResourcesManager.load
	 */
	loadResources : function(){
		this.resourcesManager.load();
	},
	
	/**
	 * @returns Object
	 */
	getNodeProviderDef : function(){
		return this.nodeProviderDef;
	},
	
	/**
	 * @param slug String
	 */
	setSlug : function(slug){
		this.slug = slug;
	},
	
	/**
	 * @returns String
	 */
	getSlug : function(){
		return this.slug;
	},

    getOverlay : function(){
        return (this.getOwner() ? resolveImageSource("shared.png", "/images/overlays/ICON_SIZE", 8):"");
    },
	
	/**
	 * Parses XML Node
	 * @param repoNode XMLNode
	 */
	loadFromXml: function(repoNode){
		if(repoNode.getAttribute('allowCrossRepositoryCopy') && repoNode.getAttribute('allowCrossRepositoryCopy') == "true"){
			this.allowCrossRepositoryCopy = true;
		}
		if(repoNode.getAttribute('user_editable_repository') && repoNode.getAttribute('user_editable_repository') == "true"){
			this.userEditable = true;
		}
		if(repoNode.getAttribute('access_type')){
			this.setAccessType(repoNode.getAttribute('access_type'));
		}
		if(repoNode.getAttribute('repositorySlug')){
			this.setSlug(repoNode.getAttribute('repositorySlug'));
		}
		if(repoNode.getAttribute('owner')){
			this.owner = repoNode.getAttribute('owner');
		}
		for(var i=0;i<repoNode.childNodes.length;i++){
			var childNode = repoNode.childNodes[i];
            if(childNode.nodeName == "label"){
                this.setLabel(childNode.firstChild.nodeValue);
            }else if(childNode.nodeName == "description"){
                this.description = childNode.firstChild.nodeValue;
            }else if(childNode.nodeName == "client_settings"){
                if(childNode.getAttribute('icon_tpl_id')){
                    this.setIcon(window.appServerAccessPath+'&get_action=get_user_template_logo&template_id='+childNode.getAttribute('icon_tpl_id')+'&icon_format=small');
                }else{
                    this.setIcon(childNode.getAttribute('icon'));
                }
                for(var j=0; j<childNode.childNodes.length;j++){
                    var subCh = childNode.childNodes[j];
                    if(subCh.nodeName == 'resources'){
                        this.resourcesManager.loadFromXmlNode(subCh);
                    }else if(subCh.nodeName == 'node_provider'){
                        var nodeProviderName = subCh.getAttribute("appClass");
                        var nodeProviderOptions = subCh.getAttribute("appOptions").evalJSON();
                        this.nodeProviderDef = {name:nodeProviderName, options:nodeProviderOptions};
                    }
                }
            }
        }
    }
});
