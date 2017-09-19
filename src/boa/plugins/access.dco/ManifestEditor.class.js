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
Class.create("ManifestEditor", AbstractEditor, {
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
        this.manifest = {};
        var values = new Hash();
        if (selection && !selection.isEmpty()){
            this._node = selection.getNode(0);
            if (this._node.getMime() != 'dco'){ //Manifest editor is only for DCO objects
                return;
            }
            this.manifest = this._node.getMetadata().get('manifest') || "{}";
            this.manifest = this.manifest.evalJSON();

            values.set('dcoid', this.manifest.id);
            values.set('author', this.manifest.author);
            values.set('version', this.manifest.version);
            values.set('dcotitle', this.manifest.title);
            values.set('dcotype', this.manifest.type_id);
            values.set('dcocontype', this.manifest.conexion_type);
            values.set('dcocontype/externalurl', this.manifest.url);
            values.set('customicon', this.manifest.customicon);
        }
        var statusChoices = ['inprogress', 'ready', 'published', 'unpublished'];
        statusChoices = $A(statusChoices).map(function(it) { return [it, MessageHash['access_dco.'+it]].join('|'); }).join(',');
        //var defaultIcon = resolveImageSource(this.manifest.icon); // 'boa/plugins/gui.ajax/res/themes/umbra/images/mimes/64/dco.png';
        if (!this.manifest.customicon) {
            var icon = this._node ? this._node.getMetadata().get('icon') : 'dco.png';
            this.manifest.iconsrc = resolveImageSource(icon, "/images/mimes/64");
        }
        else {
            var extension = this.manifest.customicon.split('.').pop().toLowerCase();
            var editors = app.findEditorsForMime(extension);
            if (editors.length) {
                var node = new ManifestNode([this._node.getPath(), 'src', this.manifest.customicon].join('/'), true);
                node.getMetadata().set("repository_id", this._node.getMetadata().get('repository_id'));
                this.manifest.iconsrc = Class.getByName(editors[0].editorClass).prototype.getThumbnailSource(node);
            }
            else {
                var icon = this._node ? this._node.getMetadata().get('icon') : 'dco.png';
                this.manifest.iconsrc = resolveImageSource(icon, "/images/mimes/64");
            }
        }

        var TYPE_INDX = 2;
        var fields = [$H({ 
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
            }), $H({
                name: 'status',
                type: 'select',
                labelId: 'access_dco.dco_status',
                descriptionId: 'access_dco.dco_status.help',
                mandatory: 'true',
                readonly: 'true',
                default: 'inprogress',
                choices: statusChoices
            }), $H({
                name: 'dcotitle',
                type: 'string',
                labelId: 'access_dco.dco_title',
                descriptionId: 'access_dco.dco_title.help',
                mandatory: 'true'
            }), $H({
                name: 'dcotype',
                type: 'select',
                labelId: 'access_dco.dco_type',
                descriptionId: 'access_dco.dco_type.help',
                mandatory: 'true',
                choices: 'json_list:get_meta_specs'
            }), $H({
                name: 'dcocontype',
                type: 'group_switch:dcocontype',
                labelId: 'access_dco.dco_contype',
                descriptionId: 'access_dco.dco_contype.help',
                mandatory: 'true'
            }), $H({
                name: 'local_dummy',
                type: 'hidden',
                label: '',
                description: '',
                mandatory: 'false',
                group_switch_name: "dcocontype",
                group_switch_label: MessageHash["access_dco.local"],
                group_switch_value: "local" 
            }), /*$H({
                name: 'adaptative_dummy',
                type: 'hidden',
                label: '',
                description: '',
                mandatory: 'false',
                group_switch_name: "dcocontype",
                group_switch_label: MessageHash["access_dco.adaptative"],
                group_switch_value: "adaptative" 
            }), */$H({
                name: 'externalurl',
                type: 'string',
                labelId: 'access_dco.dco_externalurl',
                descriptionId: 'access_dco.dco_externalurl.help',
                mandatory: 'true',
                group_switch_name: "dcocontype",
                group_switch_label: MessageHash["access_dco.external"],
                group_switch_value: "external" 
            }), $H({
                name: 'customicon',
                type: 'image',
                labelId: 'access_dco.dco_icon',
                descriptionId: 'access_dco.dco_icon.help',
                mandatory: 'false',
                editable: true,
                uploadAction: 'store_custom_dco_icon',
                loadAction: 'get_custom_dco_icon',
                useDefaultImage: true,
                defaultImage: this.manifest.iconsrc
            })
        ];
        var settings = { 
            //specs: specs && specs.LIST || [],
            fields: fields,
            values: values
        };
        this.createEditor(settings);
    },
    createEditor: function(settings){
        this.updateHeader();
        this.tab = new SimpleTabs(this.oForm.down("#dco_manifest_tabs"));
        var container = this.oForm.down('#dco_manifest_tabs');
        var pane = new Element('div');
        var form = new Element("div", {className:'manifest_form_container'});

        pane.insert(form);
        form.paneObject = this;
        this.formManager.createParametersInputs(form, settings.fields, true, settings.values, null, true);
        this.formManager.observeFormChanges(form, this.setDirty.bind(this));
        this.tab.addTab(MessageHash["access_dco.basic_info"], pane);

        this.actions.get("saveButton").observe("click", this.save.bind(this));
        modal.setCloseValidation(function(){
            if(this.isDirty()){
                var confirm = window.confirm(MessageHash["role_editor.19"]);
                if(!confirm) return false;
            }
            return true;
        }.bind(this));
        modal.setCloseAction(function(){
            this.element.select(".meta_form_container").each(function(frm){
                this.formManager.destroyForm(frm);    
            }.bind(this));            
        }.bind(this));
        this.setClean();
    },
    updateHeader: function(){
        this.element.down("span.header_label").update(this.manifest.title || MessageHash["access_dco.mkdco"]);
        this.element.down("span.header_label").setStyle({
                backgroundImage:"url('"+this.manifest.iconsrc+"')",
                backgroundSize : '34px'
            });
    },

    setDirty: function(){
        this.actions.get("saveButton").removeClassName("disabled");
    },

    setClean: function(){
        this.actions.get("saveButton").addClassName("disabled");
    },

    isDirty: function(){
        return !this.actions.get("saveButton").hasClassName("disabled");
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
        var missing = this.formManager.serializeParametersInputs(this.element.down("#dco_manifest_tabs"), toSubmit, 'DCO_');
        if(missing){
            app.displayMessage("ERROR", MessageHash['boaconf.36']);
        }else{
            app.actionBar.submitForm(this.oForm);

            var conn = new Connexion();
            conn.setParameters(toSubmit);
            conn.setMethod("post");
            conn.onComplete = function(transport){
                app.actionBar.parseXmlMessage(transport.responseXML);
                this.setClean();
                hideLightBox(true);
            }.bind(this);
            conn.sendAsync();
        }


    }
});
