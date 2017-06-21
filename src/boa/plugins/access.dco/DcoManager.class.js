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
Class.create("DcoManager", {

    initialize: function(){
    },
    contextActionManager: function(action){
        var actionName = action.options.name;
        var context = app.getContextNode();        
        if (context.getMime() == "dco" || context.getPath() == "/"){
            /*var userSelection = app.getUserSelection();
            if (!/(create|delete|dcometa)/.test(actionName)){
                action.context.dir = false;
                action.hide()
            }
            else{
                action.context.dir = true;
            }

            if (!userSelection.isEmpty()){
                if (/(delete)/.test(actionName)){
                    action.resetHide();
                }
            }*/
        }
        else {
        }
    },
    selectionContextActionManager: function(action){
        var actionName = action.options.name;
        var userSelection = app.getUserSelection();

        if (!userSelection.isEmpty()){
            if (userSelection.isUnique()){
                if (userSelection.hasMime(['dco'])){
                    if (!/(delete|dcometa)/.test(actionName)){
                        action.selectionContext.dir = false;
                        action.hide();
                    }
                    else {
                        action.selectionContext.dir = true;
                        action.resetHide();
                    }
                }
                else{
                    if (/^\/[^\/]+\/(content|src)$/.test(userSelection.getUniqueFileName())){
                        action.selectionContext.dir = false;
                        action.hide();
                    }
                    else {
                        action.resetHide();
                    }
                }
            }
        }
        else {
            var context = app.getContextNode();
            if (context.getMime() == 'dco' || context.getPath == "/"){                
                if (!/(create|delete|dcometa)/.test(actionName)){
                    action.selectionContext.dir = false;
                    action.hide();
                }
                else{
                    action.selectionContext.dir = true;
                    action.resetHide();
                }
            }
        }
    },

    createMetaEditor: function(settings){
        console.log(settings);
    }
});

if (!app.dcoManager){
    app.dcoManager = new DcoManager();
}


if (!app.dcoActionRefreshHandlerAssigned){
    /*
    document.observe('app:actions_refreshed', function(event){
        console.log(app.getActionBar().getActionByName('share'));
        var context = app.getContextNode();

        if (context == null) return;

        if (context.getMime() == "dco"){
            var userSelection = app.getUserSelection();

            if (!userSelection.isEmpty()){
                $A(['delete','rename','copy','move','chmod','link','share','create']).each(function(action){
                    //app.actionBar.getActionByName(action).hide();
                });
            }
        }
        //console.log('actions refreshed');
        //console.log(event);
    });*/
    app.dcoActionRefreshHandlerAssigned = true;
}
