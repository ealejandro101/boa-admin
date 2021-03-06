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
 * Container for location components, go to parent, refresh.
 */
Class.create("Breadcrumb", {
	__implements : ["IAppWidget"],
    currentPath : "",
	/**
	 * Constructor
	 * @param oElement HTMLElement
	 * @param options Object
	 */
	initialize : function(oElement, options){
		this.element = oElement;
		this.element.paneObject = this;
        this.options = options || {};
        this.element.update('Files');
        document.observe("app:context_changed", function(event){
            var newNode = event.memo;
            if(Object.isString(newNode)){
                newNode = new ManifestNode(newNode);
            }
            var newPath = newNode.getPath();
            var parts = $H();
            var crtPath = "";
            $A(newPath.split("/")).each(function(element){
                if(!element) return;
                crtPath += "/" + element;
                parts.set(crtPath, element);
            });
            if(getBaseName(newPath) != newNode.getLabel()){
                parts.set(newPath, newNode.getLabel());
            }

            var clickPath = "<span class='icon-home goto-link' data-goTo='/' title='"+MessageHash[459]+"'></span>";
            var lastValue = parts.values().last();
            parts.each(function(pair){
                var refresh = '';
                if(pair.value == lastValue){
                    refresh = '<span class="icon-refresh goto-link-refresh" title="'+MessageHash[149]+'"></span>';
                }
                clickPath += "<span class='icon-chevron-right'></span>" + "<span class='goto-link' data-goTo='"+pair.key+"'>"+pair.value+refresh+"</span>";
            });
            this.element.update("<div class='inner_bread'>" + clickPath + "</div>");

            this.element.select("span.goto-link").invoke("observe", "click", function(event){
                "use strict";
                var target = event.target.getAttribute("data-goTo");
                event.target.setAttribute("title", "Go to " + target);
                if(event.target.down('span.goto-link-refresh')){
                    window.app.fireContextRefresh();
                }else{
                    window.app.goTo(target);
                }
            });

        }.bind(this) );
	},

	/**
	 * Resize widget
	 */
	resize : function(){
        if(!this.element) return;
		if(this.options.flexTo){
			var parentWidth = $(this.options.flexTo).getWidth();
			var siblingWidth = 0;
			this.element.siblings().each(function(s){
				if(s.paneObject && s.paneObject.getActualWidth){
					siblingWidth+=s.paneObject.getActualWidth();
				}else{
					siblingWidth+=s.getWidth();
				}
			});
            var buttonsWidth = 0;
            this.element.select("div.inlineBarButton,div.inlineBarButtonLeft,div.inlineBarButtonRight").each(function(el){
                buttonsWidth += el.getWidth();
            });
			var newWidth = (parentWidth-siblingWidth-30);
			if(newWidth < 5){
				this.element.hide();
			}else{
				this.element.show();
				this.element.setStyle({width:newWidth + 'px'});
			}
		}
	},
	
	/**
	 * Implementation of the IAppWidget methods
	 */	
	getDomNode : function(){
		return this.element;
	},
	
	/**
	 * Implementation of the IAppWidget methods
	 */	
	destroy : function(){
		this.element = null;
	},

	/**
	 * Do nothing
	 * @param show Boolean
	 */
	showElement : function(show){

    }
});