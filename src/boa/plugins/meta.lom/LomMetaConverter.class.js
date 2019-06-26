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
"use strict";
Class.create("LomMetaConverter", AbstractEditor, {
    _node: null,
    _optionSetsCache: null,
    progressBar: null,
    progressString: null,
    busy: false,
    initialize: function($super, oFormObject){
        $super(oFormObject, {fullscreen:false});
        this.oForm = oFormObject;
        //this.formManager = this.getFormManager();
        this._optionSetsCache = {};
    },
    show: function(selection){

        if (selection.isEmpty()) return;
        var node = this._node = selection.getNode(0);
        var type = 'DIGITAL_RESOURCE_OBJECT'; //By default open with the digital resource object spec
        var params = new Hash();
        this.createFormEditor();
    },
    createFormEditor: function(){
        this.updateHeader();
        this.actions.get("processButton").observe("click", this.proccess.bind(this));
        modal.setCloseValidation(function(){return !this.busy}.bind(this));
        modal.setCloseAction(function(){
            /*this.element.select(".meta_form_container").each(function(frm){
                this.formManager.destroyForm(frm);    
            }.bind(this));*/
        }.bind(this));

        this.refreshActionsToolbar();
    },
    refreshActionsToolbar: function(){
        /*var meta = this._node.getMetadata();
        var status = meta.get('status_id'),
            lastupdated = meta.get('lastupdated'),
            lastpublished = meta.get('lastpublished'),
            publishButton = this.actions.get("publishButton");
        publishButton.stopObserving('click');
        if (status == null || status == undefined || status == 'inprogress' || status == 'published' && lastpublished < lastupdated) {
            publishButton.observe("click", this.publish.bind(this));
            publishButton.removeClassName("disabled");
            var statusText = MessageHash["meta_lom.pending_to_publish"];
            if (lastpublished){
                var otherText = MessageHash["meta_lom.last_published"];
                otherText = otherText.replace('[DATE]', moment(lastpublished).format('MMMM D, YYYY hh:mm a'));
                statusText += ' ' + otherText;
                this.element.down('span.header_sublabel').update('<i class="fa-exclamation-sign" style="font-size:16px;color:#ffff00;padding:0 4px 0 0"/>');
                this.element.down('span.header_sublabel').insert(statusText);
            }
        }*/
    },
    updateHeader: function(){
        /*var meta = this._node.getMetadata();
        this.element.down("span.header_label").update(meta.get("text"));
        var icon = resolveImageSource(this._node.getIcon(), "/images/mimes/64");
        this.element.down("span.header_label").setStyle({
                backgroundImage:"url('"+icon+"')",
                backgroundSize : '34px'
            });
        var statusText = meta.get('status');
        var lastPublished = meta.get('lastpublished');
        if (lastPublished){
            statusText += moment(lastPublished).format(" (YYYY-MM-DD hh:mm a)");
        }
        this.element.down('span.header_sublabel').update(statusText);*/
    },
    setWorking: function(){
        this.busy = true;
        this.disableAction('processButton');
        this.disableAction('closeButton');
        //this.actions.get("processButton").addClassName("disabled");
        //this.actions.get("closeButton").addClassName("disabled");
        this.oForm.down("#tk-dlg-confirmation").hide();
        //Create progress bar
        var options = {
            animate        : false,                                    // Animate the progress? - default: true
            showText    : false,                                    // show text with percentage in next to the progressbar? - default : true
            width        : 154,                                        // Width of the progressbar - don't forget to adjust your image too!!!
            boxImage    : resourcesFolder+'/images/progress_box.gif',            // boxImage : image around the progress bar
            barImage    : resourcesFolder+'/images/progress_bar.gif',    // Image to use in the progressbar. Can be an array of images too.
            height        : 4                                        // Height of the progressbar - don't forget to adjust your image too!!!
        };

        this.progressBar = new JS_BRAMUS.jsProgressBar($('pgBar_total'), 0, options);
        this.progressString = this.oForm.down("#progressString");
        this.progressString.update("");
        this.oForm.down("#tk-dlg-progress").show();
    },
    setComplete: function(status){
        this.busy = false;
        this.enableAction('closeButton');
        this.progressBar.setPercentage(100, true);
        this.progressString.update(this.getMessage(status));
        app.fireContextRefresh();
    },
    proccess: function(){
        if (this.busy) return;
        
        this.setWorking();

        var recursively = this.oForm.down('input').checked;

        var params = new Hash();
        params.set("get_action", "convert_to_digital_resource");
        params.set("plugin_id", 'meta.lom');
        params.set("dir", app.getContextNode().getPath());
        params.set("file", this._node.getPath());
        params.set("recursively", recursively);

        
        var connexion = new Connexion();
        connexion.setParameters(params);
        connexion.setMethod("post");
        connexion.onComplete = this.onComplete.bind(this);
        connexion.onInteractive = this.onProgress.bind(this);
        connexion.sendAsync();
    },
    onProgress: function(transport){
        var response = this.getJSONResponse(transport);
        if (response != null){
            var message = this.getMessage(response);
            this.progressBar.setPercentage(response.percentage, true);
            this.progressString.update(message);
        }
    },
    onComplete: function(transport){
        var response = this.getJSONResponse(transport);
        this.setComplete(response);
    },
    enableAction: function(actionName){
        var actionBtn = this.actions.get(actionName);
        actionBtn.removeClassName('disabled');        
    },
    disableAction: function(actionName){
        var actionBtn = this.actions.get(actionName);
        actionBtn.addClassName('disabled');
    },
    getJSONResponse: function(transport){
        var output = transport.responseText;
        var response = $A(output.split("\\n")).last();
        if (response.isJSON()){
            return response.evalJSON();
        }
        return null;
    },
    getMessage: function(response) {
        var mess = '';
        switch(response.status) {
            case 'SCANNING':
                mess = MessageHash['meta_lom.todro.scanning'];
                break;
            case 'PROCESSING':
                mess = MessageHash['meta_lom.todro.processing'];
                break;
            case 'COMPLETED':
                mess = MessageHash['meta_lom.todro.completed'];
                break;
            case 'FAILED':
                mess = MessageHash['meta_lom.todro.failed'];
                break;
        }

        response.percentage = Math.round((response.processed / response.of) * 100, 2);
        mess = mess.replace('[PERCENTAGE]', response.percentage);
        mess = mess.replace('[PROCESSING]', response.processed);
        mess = mess.replace('[CONVERTED]', response.converted);
        mess = mess.replace('[TOTAL]', response.of);
        return mess;
    }
});
