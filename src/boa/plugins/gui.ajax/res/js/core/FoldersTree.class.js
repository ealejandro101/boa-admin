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
 * The tree object. Encapsulate the webfx tree.
 */
Class.create("FoldersTree", AppPane, {
    
    __implements : ["IFocusable", "IContextMenuable"],

    /**
     * Constructor
     * @param $super klass Superclass reference
     * @param oElement HTMLElement
     * @param options Object
     */
    initialize: function ($super, oElement, options)
    {
        $super(oElement, options);
        this.treeContainer = new Element('div', {id:'tree_container', style:'overflow:auto;height:100%;width:100%;'});
        if(this.options.replaceScroller){
            this.scroller = new Element('div', {id:'tree_scroller', className:'scroller_track', style:"right:"+(parseInt(oElement.getStyle("marginRight"))-parseInt(oElement.getStyle("paddingRight")))+"px"});
            this.scroller.insert('<div id="scrollbar_handle" class="scroller_handle"></div>');
            oElement.insert(this.scroller);
            this.treeContainer.setStyle({overflow:"hidden"});
        }
        this.registeredObservers = $H();
        oElement.insert(this.treeContainer);
        disableTextSelection(this.treeContainer);
        if(this.options.replaceScroller){
            this.scrollbar = new Control.ScrollBar('tree_container','tree_scroller');
            var scrollbarLayoutObserver = this.scrollbar.recalculateLayout.bind(this.scrollbar);
            document.observe("app:tree_change",  scrollbarLayoutObserver);
            this.registeredObservers.set("app:tree_change", scrollbarLayoutObserver);
        }


        this.options = {};
        if(options){
            this.options = options;
        }
        var thisObject = this;
        var action = function(e){
            if(!app) return;
            app.focusOn(thisObject);
            if(this.node){
                if(app.getUserSelection().getContextNode() != this.node){
                    app.actionBar.fireDefaultAction("dir", this.node);
                }
                app.getUserSelection().setSelectedNodes([this.node], thisObject);
            }
        };
        
        var filter = this.createFilter();
        var fakeRootNode = new ManifestNode("/", true, MessageHash[391], "folder.png");
        fakeRootNode._isLoaded = true;
        this.tree = new CustomXTree(fakeRootNode,  action, filter);     
                
        this.treeContainer.update(this.tree.toString());
        $(this.tree.id).node = this.tree.node;  
        $(this.tree.id).observe("click", function(e){
            this.action(e);
            Event.stop(e);
        }.bind(this.tree));

        AppDroppables.add(this.tree.id, this.tree.node);
        if(!this.tree.open && !this.tree.loading) {
            this.tree.toggle();     
        }
        this.treeContainer.observe("click", function(){         
            app.focusOn(this);
        }.bind(this));
    
        this.rootNodeId = this.tree.id;
        this.hasFocus;

        var ctxChangedObs =function(event){
            var path = event.memo.getPath();
            window.setTimeout(function(e){
                this.setSelectedPath(path);
            }.bind(this), 100);
        }.bind(this);
        document.observe("app:context_changed",  ctxChangedObs);
        this.registeredObservers.set("app:context_changed", ctxChangedObs);

        var rootNodeObs = function(event){
            var rootNode = event.memo;
            this.tree.setRootNode(rootNode);
            this.changeRootLabel(rootNode.getLabel(), rootNode.getIcon());
        }.bind(this);
        document.observe("app:root_node_changed", rootNodeObs);
        this.registeredObservers.set("app:root_node_changed", rootNodeObs);

        var compConfChanged = function(event){
            if(event.memo.className == "FoldersTree"){
                var config = event.memo.classConfig.get('all');
                var options = XPathSelectNodes(config, 'property');
                for(var i=0;i<options.length;i++){
                    this.options[options[i].getAttribute('name')] = options[i].getAttribute('value');
                }
                if(this.tree){
                    this.tree.filter = this.createFilter();
                }
            }
        }.bind(this);
        document.observe("app:component_config_changed",  compConfChanged);
        this.registeredObservers.set("app:component_config_changed", compConfChanged);
    },

    destroy : function(){
        this.registeredObservers.each(function (pair){
            document.stopObserving(pair.key, pair.value);
        });
        if(this.scrollbar) this.scrollbar.destroy();
        if(this.tree) this.tree.destroy();
        if(window[this.htmlElement.id]){
            try{delete window[this.htmlElement.id];}catch(e){}
        }
    },

    /**
     * Create a filtering function based on the options display
     * @returns Function
     */
    createFilter : function(){
        var displayOptions = this.options.display || "dz";
        if(displayOptions.indexOf("a") > -1) displayOptions = "dzf";
        if(displayOptions.indexOf("z") > -1 && window.zipEnabled === false) displayOptions = displayOptions.split("z").join("");
        this.options.display  = displayOptions;

        var d = (displayOptions.indexOf("d") > -1);
        var z = (displayOptions.indexOf("z") > -1);
        var f = (displayOptions.indexOf("f") > -1);
        var filter = function(node){
            return (((d && !node.isLeaf()) || (f && node.isLeaf()) || (z && (node.getMime()=="zip" || node.getMime()=="browsable_archive"))) && (node.getParent().getMime() != "recycle"));
        };
        return filter;      
    },
    
    /**
     * Focus implementation of IAppWidget
     */
    focus: function(){
        if(webFXTreeHandler.selected)
        {
            webFXTreeHandler.selected.focus();
            if(webFXTreeHandler.selected.node){
                app.getUserSelection().setSelectedNodes([webFXTreeHandler.selected.node], this);
            }
        }
        webFXTreeHandler.setFocus(true);
        this.hasFocus = true;
    },
    
    /**
     * Blur implementation of IAppWidget
     */
    blur: function(){
        if(webFXTreeHandler.selected)
        {
            webFXTreeHandler.selected.blur();
        }
        webFXTreeHandler.setFocus(false);
        this.hasFocus = false;
    },
        
    /**
     * Resize implementation of IAppWidget
     */
    resize : function(){
        fitHeightToBottom(this.treeContainer, null);
        if(this.scrollbar){
            this.scroller.setStyle({height:parseInt(this.treeContainer.getHeight())+'px'});
            this.scrollbar.recalculateLayout();
        }
        document.fire("app:resize-FoldersTree-" + this.htmlElement.id, this.htmlElement.getDimensions());
    },
    
    /**
     * ShowElement implementation of IAppWidget
     */
    showElement : function(show){
        if (show) this.treeContainer.show();
        else this.treeContainer.hide();
    },
    
    /**
     * Sets the contextual menu
     * @param protoMenu Proto.Menu 
     */
    setContextualMenu: function(protoMenu){
        Event.observe(this.rootNodeId+'','contextmenu', function(event){
            this.select();
            this.action();
            Event.stop(event);
        }.bind(webFXTreeHandler.all[this.rootNodeId]));
         protoMenu.addElements('#'+this.rootNodeId+'');
        webFXTreeHandler.contextMenu = protoMenu;
    },
    
    /**
     * Find a tree node by its path
     * @param path String
     * @returns WebFXTreeItem
     */
    getNodeByPath : function(path){
        for(var key in webFXTreeHandler.all){
            if(webFXTreeHandler.all[key] && webFXTreeHandler.all[key].node && webFXTreeHandler.all[key].node.getPath() == path){
                return webFXTreeHandler.all[key];
            }
        }
    },
    
    /**
     * Finds the node and select it
     * @param path String
     */
    setSelectedPath : function(path){
        if(path == "" || path == "/"){
            this.tree.select();
            return;
        }
        var parts = this.cleanPathToArray(path);
        var crtPath = "";
        for(var i=0;i<parts.length;i++){
            crtPath += "/" + parts[i];
            var node = this.getNodeByPath(crtPath);
            if(node && node.childNodes.length){
                node._webfxtree_expand();
            }           
        }
        if(node){
            node.select();
        }
    },
        
    /**
     * Transforms url to a path array
     * @param url String
     * @returns Array
     */
    cleanPathToArray: function(url){
        var splitPath = url.split("/");
        var path = new Array();
        var j = 0;
        for(i=0; i<splitPath.length; i++)
        {
            if(splitPath[i] != '') 
            {
                path[j] = splitPath[i];
                j++;
            }
        }
        return path;        
    },
        
    /**
     * Change the root node label
     * @param newLabel String
     * @param newIcon String
     */
    changeRootLabel: function(newLabel, newIcon){
        this.changeNodeLabel(this.tree.id, newLabel, newIcon);  
    },
    
    /**
     * Change a node label
     * @param nodeId String the Id of the node (webFX speaking)
     * @param newLabel String
     * @param newIcon String
     */
    changeNodeLabel: function(nodeId, newLabel, newIcon){   
        var node = $(nodeId+'-label').update(newLabel);
        if(newIcon){
            var realNode = webFXTreeHandler.all[nodeId];
            realNode.icon = newIcon;
            realNode.openIcon = newIcon;
        }
    },


    /**
     * Inline Editing of label
     * @param callback Function Callback after the label is edited.
     */
    switchCurrentLabelToEdition : function(callback){
        var sel = webFXTreeHandler.selected;
        if(!sel) return;
        var nodeId = webFXTreeHandler.selected.id;
        var item = this.treeContainer.down('#' + nodeId); // We assume this action was triggered with a single-selection active.
        var offset = {top:0,left:0};
        var scrollTop = 0;

        var span = item.down('a');
        var posSpan = item;
        offset.top=1;
        offset.left=43;
        scrollTop = this.treeContainer.scrollTop;

        var pos = posSpan.cumulativeOffset();
        var text = span.innerHTML;
        var edit = new Element('input', {value:item.node.getLabel('text'), id:'editbox'}).setStyle({
            zIndex:5000,
            position:'absolute',
            marginLeft:'0px',
            marginTop:'0px',
            height:'24px',
               padding: 0
        });
        $(document.getElementsByTagName('body')[0]).insert({bottom:edit});
        modal.showContent('editbox', (posSpan.getWidth()-offset.left)+'', '20', true, false, {opacity:0.25, backgroundColor:'#fff'});
        edit.setStyle({left:(pos.left+offset.left)+'px', top:(pos.top+offset.top-scrollTop)+'px'});
        window.setTimeout(function(){
            edit.focus();
            var end = edit.getValue().lastIndexOf("\.");
            if(end == -1){
                edit.select();
            }else{
                var start = 0;
                if(edit.setSelectionRange)
                {
                    edit.setSelectionRange(start,end);
                }
                else if (edit.createTextRange) {
                    var range = edit.createTextRange();
                    range.collapse(true);
                    range.moveStart('character', start);
                    range.moveEnd('character', end);
                    range.select();
                }
            }

        }, 300);
        var onOkAction = function(){
            var newValue = edit.getValue();
            hideLightBox();
            modal.close();
            callback(item.node, newValue);
        };
        edit.observe("keydown", function(event){
            if(event.keyCode == Event.KEY_RETURN){
                Event.stop(event);
                onOkAction();
            }
        }.bind(this));
        // Add ok / cancel button, for mobile devices among others
        var buttons = modal.addSubmitCancel(edit, null, false, "after");
        buttons.addClassName("inlineEdition");
        var ok = buttons.select('input[name="ok"]')[0];
        ok.observe("click", onOkAction);
        var origWidth = edit.getWidth()-44;
        var newWidth = origWidth;
        if(origWidth < 70){
            // Offset edit box to be sure it's always big enough.
            edit.setStyle({left:pos.left+offset.left - 70 + origWidth});
            newWidth = 70;
        }
        edit.setStyle({width:newWidth+'px'});

        buttons.select('input').invoke('setStyle', {
            margin:0,
            width:'22px',
            border:0,
            backgroundColor:'transparent'
        });
        buttons.setStyle({
            position:'absolute',
            width:'46px',
            zIndex:2500,
            left:(pos.left+offset.left+origWidth)+'px',
            top:((pos.top+offset.top-scrollTop)-1)+'px'
        });
        var closeFunc = function(){
            span.setStyle({color:''});
            edit.remove();
            buttons.remove();
        };
        span.setStyle({color:'#ddd'});
        modal.setCloseAction(closeFunc);
    }

});