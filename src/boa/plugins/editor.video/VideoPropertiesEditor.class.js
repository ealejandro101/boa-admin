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
Class.create("VideoPropertiesEditor", AbstractEditor, {
    _node: null,
    tab: null,
    manifest: null,
    formManager: null,
    metaTag: '',
    initialize: function($super, oFormObject){
        $super(oFormObject, {fullscreen:false});
        this.oForm = oFormObject;
        this.formManager = this.getFormManager();
    },
    show: function(selection){
        this.properties = {};
        var values = new Hash();
        if (!selection || selection.isEmpty()) return;
        this._node = selection.getNode(0);
        //if (this._node.getMime() != 'dco'){ //Manifest editor is only for DCO objects
        //    return;
        //}

        var metadata = this._node.getMetadata();
        var filename = metadata.get('filename');
        //console.log(metadata);
        var alternates = metadata.get('alternates');
        try {
            this.properties.alternates = metadata.get('alternates').evalJSON();
        }
        catch(err) {
            this.properties.alternates = [];
        }
        this.properties.thumbnail = metadata.get('customicon');
        this.properties.preview = metadata.get('preview');
        this.properties.title = metadata.get('text');

        console.log(this.properties.alternates);

        values.set('thumbnail', this.properties.thumbnail);
        values.set('preview', this.properties.preview);
        values.set('alternates', this.properties.alternates);

        var icon = this._node ? this._node.getMetadata().get('icon') : 'mime_empty.png';
        this.properties.iconsrc = resolveImageSource(icon, "/images/mimes/64");

        var TYPE_INDX = 2;
        var fields = [/*$H({ 
                name: 'dcoid',
                type: 'hidden',                
                labelId: '',
                descriptionId: '',
                mandatory: 'false',
                readonly: 'false'
            }), $H({ 
                name: 'author',
                type: 'hidden',                
                labelId: '',
                descriptionId: '',
                mandatory: 'false',
                readonly: 'false'
            }), $H({ 
                name: 'version',
                type: 'hidden',                
                labelId: '',
                descriptionId: '',
                mandatory: 'false',
                readonly: 'false'
            }), */$H({
                name: 'thumbnail',
                type: 'image',
                labelId: 'video_editor.thumbnail',
                descriptionId: 'video_editor.thumbnail.help',
                mandatory: 'false',
                editable: true,
                uploadAction: 'store_video_thumbnail',
                loadAction: 'get_video_thumbnail',
                binary_context: 'binary_path='+filename+'&t='+(+new Date()),
                useDefaultImage: false
            }), $H({
                name: 'preview',
                type: 'image',
                labelId: 'video_editor.preview',
                descriptionId: 'video_editor.preview.help',
                mandatory: 'false',
                editable: true,
                uploadAction: 'store_video_preview',
                loadAction: 'get_video_preview',
                binary_context: 'binary_path='+filename+'&t='+(+new Date()),
                useDefaultImage: false
            })
        ];
        var formats = {mp4:'', webm:'', ogv:''};
        var first = true;
        for(var format in formats) {
            if (!this.properties.alternates[format]) continue;            
            if (first) {
                first = false;
                fields.push($H({
                    name: 'alternatives',
                    type: 'legend',
                    labelId: 'video_editor.alternatives',
                    description: '<div class="SF_element">' +
                        '<div class="SF_label">'+MessageHash['video_editor.alternatives']+'</div>' + 
                        '</div>'
                }));
            }

            var name = format+'alternative';
            var label = MessageHash['video_editor.'+name];
            var content = '<ul><li>' + this.properties.alternates[format].join('</li><li>') + '</li></ul>';
            fields.push($H({
                name: name,
                type: 'legend',
                labelId: 'video_editor.'+format+'alternative',
                description: '<div class="SF_element">' +
                    '<div class="SF_label">'+label+'</div>' + 
                    '<div class="SF_image_block">'+content+'</div>'+ 
                    '</div>'
            }));
        }
                
        var settings = { 
            fields: fields,
            values: values
        };
        this.createEditor(settings);
    },
    createEditor: function(settings){
        this.updateHeader();
        var container = this.oForm.down('#properties_tabs');
        this.tab = new SimpleTabs(container);
        var pane = new Element('div');
        var form = new Element("div", {className:'form_container'});

        pane.insert(form);
        form.paneObject = this;
        this.formManager.createParametersInputs(form, settings.fields, true, settings.values, null, true);
        this.formManager.observeFormChanges(form, this.setDirty.bind(this));
        this.tab.addTab(MessageHash["video_editor.general"], pane);
        //this.actions.get("saveButton").hide(); // observe("click", this.save.bind(this));
        this.actions.get("closeButton").hide();
        form.select("span.SF_image_link.image_remove").each(function(btn) {
            btn.hide();
        });
        /*modal.setCloseValidation(function(){
            if(this.isDirty()){
                var confirm = window.confirm(MessageHash["role_editor.19"]);
                if(!confirm) return false;
            }
            return true;
        }.bind(this));*/
        modal.setCloseAction(function(){
            this.element.select(".properties_form_container").each(function(frm){
                this.formManager.destroyForm(frm);    
            }.bind(this));            
        }.bind(this));
        this.setClean();
    },
    updateHeader: function(){
        this.element.down("span.header_label").update(this.properties.title);
        this.element.down("span.header_label").setStyle({
                backgroundImage:"url('"+this.properties.iconsrc+"')",
                backgroundSize : '34px'
            });
    },

    setDirty: function(){
        //this.actions.get("saveButton").removeClassName("disabled");
    },

    setClean: function(){
        //this.actions.get("saveButton").addClassName("disabled");
    },

    isDirty: function(){
        return false; //!this.actions.get("saveButton").hasClassName("disabled");
    },
    getFormManager: function(){
        return new FormManager(this.element.down(".tabpanes"));
    },
    save: function(){
        if(!this.isDirty()) return;

        var toSubmit = new Hash();
        toSubmit.set("action", this._node?"editdco":"mkdco");
        toSubmit.set("plugin_id", 'acccess.dco');
        toSubmit.set("dir", app.getContextNode().getPath());
        toSubmit.set("file", this._node ? this._node.getPath() : '');
        var missing = this.formManager.serializeParametersInputs(this.element.down("#properties_tabs"), toSubmit, 'DCO_');
        if(missing){
            app.displayMessage("ERROR", MessageHash['boaconf.36']);
        }else{
            app.actionBar.submitForm(this.oForm);

            if (toSubmit.get('DCO_customicon') != ''){
                toSubmit.unset('DCO_customicon_original_binary');
                toSubmit.unset('DCO_customicon_original_binary_apptype');
            }
            var conn = new Connexion();
            conn.setParameters(toSubmit);
            conn.setMethod("post");
            conn.onComplete = function(transport){
                if (this._node && this._node.getMime() == 'dco'){
                    var src = this._node.findChildByPath(this._node.getPath()+'/src');
                    src && src.clear();
                }
                app.actionBar.parseXmlMessage(transport.responseXML);
                this.setClean();
                hideLightBox(true);
            }.bind(this);
            conn.sendAsync();
        }


    }
});
