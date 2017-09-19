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
Class.create("LomMetaEditor", AbstractEditor, {
    _node: null,
    _optionSetsCache: null,
    tab: null,
    spec: null,
    formManager: null,
    metaTag: '',
    initialize: function($super, oFormObject){
        $super(oFormObject, {fullscreen:false});
        this.oForm = oFormObject;
        this.formManager = this.getFormManager();
        this._optionSetsCache = {};
    },
    show: function(selection){
        var node = this._node = selection.getNode(0);
        var type = 'DIGITAL_RESOURCE_OBJECT'; //By default open with the digital resource object spec
        if (node.getMime() == 'dco') {//If it is a DCO object, then read the type from the object
            type = node.getMetadata().get('type_id');
        }
        var params = new Hash();
        params.set("get_action", "get_spec_by_id");
        params.set("spec_id", type);
        var connexion = new Connexion();
        connexion.setParameters(params);        
        connexion.onComplete = function(transport){
            var xmlData = transport.responseXML;
            this.createSpecEditor(xmlData);
        }.bind(this);
        connexion.sendAsync();
    },
    createSpecEditor: function(spec){        
        this.spec = spec;
        this.updateHeader();
        this.tab = new SimpleTabs(this.oForm.down("#categoryTabulator"));
        var categories = XPathSelectNodes(spec, '//fields/*[@type="category"]');
        var metadata = this._node.getMetadata().get("lommetadata");
        metadata = (metadata && metadata.evalJSON())||{};
        $A(categories).each(function(cat){
            var pane = new Element("div");
            var catName = this.getMetaNodeTranslation(cat, 'meta.fields.');
            if (this.prepareCategoryMetaEntry(cat, pane, (metadata[cat.nodeName]||{})))
                this.tab.addTab(catName, pane);
        }.bind(this));

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

        this.oForm.observe('form:language_changing', function (e){
            if (e.memo.current == 'none') {
                var missing = this.formManager.serializeParametersInputs(this.element.down("#categoryTabulator"), new Hash(), 'DCO_');
                if(missing){
                    app.displayMessage("ERROR", MessageHash['meta_lom.missing_fields']);
                    Event.stop(e);
                }
            }
        }.bind(this));

        this.setClean();
    },
    updateHeader: function(){
        this.element.down("span.header_label").update(this._node.getMetadata().get("text"));
        var icon = resolveImageSource(this._node.getIcon(), "/images/mimes/64");
        this.element.down("span.header_label").setStyle(
            {
                backgroundImage:"url('"+icon+"')",
                backgroundSize : '34px'
            });
    },
    /**
     * Process a metadata category to prepare form entry fields for it.
     * @param category xmlNode|null
     * @param container Element|null
     */
    prepareCategoryMetaEntry: function(category, container, metadata){
        var form = new Element("div", {className:'meta_form_container'});
        var dicprefix = 'meta_lom.setup.table.col.';
        var fields = new $A([]);
        var values = new Hash();
        $A(category.children).each(function(field){
            var fieldSettings = this.prepareMetaFieldEntry(field, form, 1, 'meta.fields.'+category.nodeName+'.', metadata, values);

            if (!fieldSettings) return;
            if (fieldSettings.length){
                for(var k=0; k<fieldSettings.length; k++){
                    fields.push(fieldSettings[k]);
                }
            }
            else{
                fields.push(fieldSettings);
            }
        }.bind(this));

        if (fields.length > 0){
            container.insert(form);
            form.paneObject = this;
            this.formManager.createParametersInputs(form, fields, true, values, null, true);
            this.formManager.observeFormChanges(form, this.setDirty.bind(this));
            return true;
        }        
        return false;
        //function(form, parametersDefinitions, showTip, values, disabled, skipAccordion, addFieldCheckbox, startAccordionClosed)
    },

    /**
     * Process a metadata field to prepare form entry fields for it
     * @param field xmlNode|null
     * @param form Element|null Target form where to insert the meta entry fields
     */
    prepareMetaFieldEntry: function(field, container, level, dicprefix, metadata, values){
        var type = field.getAttribute('type');
        var enabled = field.getAttribute('enabled');
        if (enabled !== 'true') return;

        var isContainer = type == 'container';
        var fname = field.nodeName;
        var name = isContainer?dicprefix.replace(/\.$/, ''):dicprefix+fname;
        var label = this.getMetaNodeTranslation(isContainer?name:field.nodeName, isContainer?'':dicprefix);
        level = level || 1;
        var options = null;
        if (type=='composed' || isContainer){
            var result = [$H({
                type:'label',
                label: label,
                name: name,
                description: field.firstChild!=null&&field.firstChild.nodeType==field.firstChild.TEXT_NODE?field.firstChild.wholeText.trim():""
            })];
            var isCollection = field.getAttribute("collection") === 'true';
            var isRequired = field.getAttribute("required") === 'true';
            var isFixed = field.getAttribute("fixed") === 'true';

            var nameSuffix = isContainer ? '' : fname+'.'; 
            var data = isContainer ? metadata : metadata[fname];

            $A(field.children).each(function(child){
                options = this.prepareMetaFieldEntry(child, container, level+1, dicprefix+nameSuffix, (data||{}), values);
                if (!options) return;
                options.set('replicationGroup', name);
                options.set('groupRequired', isRequired);
                options.set('groupFixed', isFixed);
                if (!isCollection){
                    options.set('replicatable', false);
                }
                result.push(options);
            }.bind(this));
            return result;
        }
        else {
            options = {
                text: label,
                description: field.firstChild!=null?field.firstChild.wholeText.trim():"",
                name: name,
                type: "string"
            };
            if (Array.isArray(metadata)){
                for(var i=0; i < metadata.length; i++){
                    if (i > 0 && /duration|vcard/.test(type)) {
                        $A(Object.keys(metadata[i][fname])).each(function(key){
                            values.set(name+'.'+key+(i==0?'':'_'+i),metadata[i][fname][key]);
                        });
                    }
                    else if (metadata[i].hasOwnProperty(fname)){
                        values.set(name+(i==0?'':'_'+i),metadata[i][fname]);
                    }
                }
            }
            else if (metadata != undefined && metadata.hasOwnProperty(fname)){
                values.set(name, metadata[fname]);
            }
            return $H(Object.extend(options, this.getControlSettings({type:type, meta:field, text: label, name: name, values: values})));
        }
    },

    getMetaNodeTranslation: function(key, prefix, type){
        var key = key.nodeName?key.nodeName:key;
        type = type || 'label';
        return this.getMetaTranslation(key+'.'+type, prefix);
    },

    getMetaTranslation: function(key, prefix){
        prefix = ('meta_lom.' + (prefix || '')).replace(/\.$/, '');
        var text = MessageHash[prefix+'.'+key];
        return text||key;
    },

    /**
     * Create a Form control with specific options
     * @param options object|null, key value pair properties to create the form control
     */
    createFormControl: function(options){
        var $this = this;
        var ctrl;
        switch(options.type){
            case 'checkbox':
                ctrl = new Element('input', {type:'checkbox', className:"SF_fieldCheckBox", name: options.name});
                ctrl.checked = options.defaultValue?true:false;
                break;
            case 'text':
                ctrl = new Element('input', {type:'text', className:"SF_Input", name: options.name});
                ctrl.checked = options.defaultValue?true:false;
                break;
            case 'longtext':
                ctrl = new Element('textarea', {type:'text', className:"SF_Input", name: options.name});
                //element = '<textarea class="SF_input" style="height:70px;" data-ctrl_type="'+type+'" data-mandatory="'+(mandatory?'true':'false')+'" name="'+name+'"'+disabledString+'>'+defaultValue+'</textarea>'
                ctrl.checked = options.defaultValue?true:false;
                break;
            case 'label':
                ctrl = new Element('span').update(options.text);
                break;
            case 'date':
                ctrl = new Element('input', {type:'date', className:"SF_Input", name: options.name});
                break;
            case 'optionset':
                var multiple = options.multiple?'multiple="true"':'';
                var ctrl = new Element('select', {className:'SF_input', name:options.name, 'data-mandatory':options.mandatory?true:false});
                if (multiple) ctrl.multiple = true;

                var choices = '';
                if(!options.mandatory && !multiple) choices += '<option value=""></option>';
                var optionsetname=options.meta.getAttribute('optionset-name');
                var optionset = XPathSelectSingleNode(this.metadata, '//optionsets/optionset[@name="'+optionsetname+'"]');

                if (optionset){
                    $A(optionset.getAttribute('values').split('|')).each(function(choice){
                        choices += '<option value="'+choice+'">'+$this.getMetaTranslation(choice, 'optionset.'+optionsetname)+'</option>';
                    });
                }
                ctrl.update(choices);
                break;
        }

        return ctrl;
    },

    /**
     * Create a Form control with specific options
     * @param options object|null, key value pair properties to create the form control
     */
    getControlSettings: function(options){
        var settings = {};
        settings.mandatory = options.meta.getAttribute('required');
        settings.readonly = options.meta.getAttribute('editable') !== "true";
        settings.defaultValue = "";
        settings.label = options.text;
        settings.translatable = options.meta.getAttribute('translatable') === 'true';

        if (settings.translatable){
            settings.languages = this.getOptionSet('languages');
        }
        switch(options.type){
            case 'checkbox':
                settings.type = 'checkbox';
                break;
            case 'keywords':
                settings.type = 'keywords';
                break;
            case 'text':
            case 'string':
            case null:
                settings.type = 'string';
                break;
            case 'longtext':
                settings.type = 'textarea';
                break;
            case 'label':
                settings.type = 'string';
                break;
            case 'date':
            case 'datetime':
                settings.type = options.type;
                break;
            case 'duration':
                settings.type = 'duration';
                break;
            case 'int':
                settings.type = 'integer';
                break;
            case 'optionset':
                settings.type = 'select';
                settings.multiple = options.meta.getAttribute('multiple') === "true";
                var choices = [];
                var optionsetname=options.meta.getAttribute('optionset-name');
                //Set the option set name based on the value of another field in the collection
                if (/\{(.*?)\}/.test(optionsetname)) {
                    var matches = optionsetname.match(/\{(.*?)\}/g);
                    for(var i = 0; i < matches.length; i++){
                        var ph = options.name.split('.').slice(0,-1).join('.')+'.'+matches[i].slice(1, -1);
                        if (options.values && options.values.get(ph)){
                            optionsetname = optionsetname.replace(matches[i], options.values.get(ph));
                        }
                    }    
                }
                var optionset = this.getOptionSet(optionsetname);
                //var optionset = XPathSelectSingleNode(this.spec, '//optionsets/optionset[@name="'+optionsetname+'"]');
                if (optionset){
                    $A(Object.keys(optionset)).each(function(choice){
                        choices.push(choice+"|"+optionset[choice]);
                    });
                }
                settings.choices = choices;
                break;
            default:
                var type = XPathSelectSingleNode(this.spec, '//types/type[@name="'+options.type+'"]')
                if (type != null){
                    var childSettings = [];

                    $A(type.children).each(function(it){
                        var options = {
                            label: MessageHash[it.getAttribute("labelId")] || it.getAttribute("labelId"),
                            name: it.nodeName,
                            type: it.getAttribute("type"),
                            mandatory: it.getAttribute('required')
                        };
                        childSettings.push($H(options));
                    }.bind(this));
                    settings.type = 'composed';
                    settings.typeName = options.type;
                    settings.childs = childSettings;
                }
                else 
                    return {};
        }
        return settings;
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
    getSpecId: function(){
        return XPathSelectSingleNode(this.spec, "/spec/id").firstChild.nodeValue;
    },
    save: function(){
        if(!this.isDirty()) return;

        var toSubmit = new Hash();
        toSubmit.set("action", "save_dcometa");
        toSubmit.set("plugin_id", 'meta.lom');
        toSubmit.set("dir", app.getContextNode().getPath());
        toSubmit.set("file", this._node.getPath());
        toSubmit.set('spec_id', this.getSpecId());
        var missing = this.formManager.serializeParametersInputs(this.element.down("#categoryTabulator"), toSubmit, 'DCO_');
        if(missing){
            app.displayMessage("ERROR", MessageHash['boaconf.36']);
        }else{
            var conn = new Connexion();
            conn.setParameters(toSubmit);
            conn.setMethod("post");
            conn.onComplete = function(transport){
                //app.actionBar.parseXmlMessage(transport.responseXML);
                this._node.getMetadata().set('lommetadata', transport.responseText);
                this.setClean();
            }.bind(this);
            conn.sendAsync();
        }


    },
    getOptionSet: function(optionsetname){
        if (this._optionSetsCache[optionsetname]){
            return this._optionSetsCache[optionsetname];
        }
        //var optionsetname=options.meta.getAttribute('optionset-name');
        var optionset = XPathSelectSingleNode(this.spec, '//optionsets/optionset[@name="'+optionsetname+'"]');
        var choices = [];

        if (optionset){
            $A(optionset.getAttribute('values').split('||')).each(function(set){
                if (/::/.test(set)){
                    var parts = set.split('::');
                    choices["_grp_"+parts[0]] = this.getMetaTranslation(parts[0], 'optionset.'+optionsetname);
                    set = parts[1];
                }
                $A(set.split('|')).each(function(choice){
                    choices[choice] = this.getMetaTranslation(choice, 'optionset.'+optionsetname);
                }.bind(this));
            }.bind(this));
        }
        return (this._optionSetsCache[optionsetname] = choices);
    }
});
