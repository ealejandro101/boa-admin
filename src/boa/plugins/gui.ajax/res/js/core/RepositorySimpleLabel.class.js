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
 * A selector for displaying repository list. Will hook to app:repository_list_refreshed.
 */
Class.create("RepositorySimpleLabel", AppPane, {

    _defaultString:'',
    _defaultIcon : 'network-wired.png',
    options : {},

    initialize : function($super, oElement, options){

        $super(oElement, options);

        this.htmlElement.update('<div class="repository_legend">Workspace</div>');
        this.htmlElement.insert('<div class="repository_title"></div>');
        document.observe("app:repository_list_refreshed", function(e){

            this.htmlElement.down("div.repository_title").update(this._defaultString);
            var repositoryList = e.memo.list;
            var repositoryId = e.memo.active;
            if(repositoryList && repositoryList.size()){
                repositoryList.each(function(pair){
                    var repoObject = pair.value;
                    var key = pair.key;
                    var selected = (key == repositoryId ? true:false);
                    if(selected){
                        this.htmlElement.down("div.repository_title").update(repoObject.getLabel());
                    }
                }.bind(this) );
            }
        }.bind(this));
    }

});