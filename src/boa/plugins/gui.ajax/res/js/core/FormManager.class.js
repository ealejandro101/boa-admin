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
 * An simple form generator 
 */
Class.create("FormManager", {

    _lang: null,
    modalParent : null,
    availableLanguages: null,    

	initialize: function(modalParent){
        if(modalParent) this.modalParent = modalParent;
	},

    parseParameters : function (xmlDocument, query){
        var res = $A();
        $A(XPathSelectNodes(xmlDocument, query)).each(function(node){
            res.push(this.parameterNodeToHash(node));
        }.bind(this));
        return res;
    },

    setAvailableLanguages: function (availableLanguages){
        this.availableLanguages = availableLanguages;
    },

	parameterNodeToHash : function(paramNode){
        var paramsAtts = paramNode.attributes;
		var paramsHash = new Hash();
        var collectCdata = false;
        for(var i=0; i<paramsAtts.length; i++){
            var attName = paramsAtts.item(i).nodeName;
            var value = paramsAtts.item(i).nodeValue;
            if( (attName == "label" || attName == "description" || attName == "group" || attName.indexOf("group_switch_") === 0) && MessageHash[value] ){
                value = MessageHash[value];
            }
            if( attName == "cdatavalue" ){
                collectCdata = true;
                continue;
            }
            if(attName == 'editable'){
                paramsHash.set('readonly', value != "true");
            }
            else{
                paramsHash.set(attName, value);
            }
		}
        if(collectCdata){
            paramsHash.set("value", paramNode.firstChild.nodeValue);
        }
        paramsHash.set("xmlNode", paramNode);
		return paramsHash;
	},
	
	createParametersInputs : function(form, parametersDefinitions, showTip, values, disabled, skipAccordion, addFieldCheckbox, startAccordionClosed){
        var b=document.body;
        var groupDivs = $H({});
        var replicableGroups = $H({});

		parametersDefinitions.each(function(param){		
            var dataEl = null;
			var label = param.get('label');
			if(param.get('labelId')){
				label = MessageHash[param.get('labelId')];
			}
            if(param.get('group_switch_name')) {
                return;
            }
			var name = param.get('name');
			var type = param.get('type');
			var desc = param.get('description');
            var translatable = param.get('translatable');
            var languages = null;
            if (translatable){
                languages = param.get('languages') || [];
            }

            if (name == 'btnaddnew') {
                console.log(type);
            }
            // deduplicate
            if(form.down('[name="'+name+'"]')) return;

			if(param.get('descriptionId')){
				desc = MessageHash[param.get('descriptionId')];
			}
            var group = param.get('group') || MessageHash[439];
            if(param.get('groupId')){
                group = MessageHash[param.get('groupId')];
            }

			var mandatory = false;
			if(param.get('mandatory') && param.get('mandatory')=='true') mandatory = true;

            var defaultValue = '';
            if(values && values.get(name) !== undefined){
                defaultValue = values.get(name);
            }else if(param.get('default') !== undefined){
                defaultValue = param.get('default');
            }
			var element;
			var disabledString = (disabled || param.get('readonly')?' disabled="true" ':'');
            var commonAttributes = {
                'name'                  : name,
                'data-ctrl_type'        : type,
                'data-mandatory'   : (mandatory?'true':'false')
            };

            if(disabled || param.get('readonly')){
                commonAttributes['disabled'] = 'true';
            }
			if(type == 'string' || type == 'integer' || type == 'array' || type == "hidden"){
                if (type == 'string' && translatable) {
                    element = this.createTranslatable(type, defaultValue, languages, commonAttributes);
                }
                else {
                    element = new Element('input', Object.extend({type: (type == "hidden" ? 'hidden' : 'text'), className:'SF_input', value:defaultValue}, commonAttributes));
                }
            }
            else if (type == 'date' || type == 'datetime'){
                element = new Element('div', { className: 'input-group date', id: name })
                    .insert(new Element('input', Object.extend({type: 'text', className: 'form-control'}, commonAttributes)).store('date', defaultValue))
                    .insert('<span class="input-group-addon datepickerbutton"><span class="glyphicon glyphicon-calendar"></span></span>');
            }
            else if(type == 'keywords'){
                if (defaultValue && defaultValue.join){
                    defaultValue = defaultValue.join(',');    
                }
                
                element = translatable ? this.createTranslatable(type, defaultValue, languages, commonAttributes) :
                    new Element('input', Object.extend({type: 'text', className:'SF_input', value:defaultValue}, commonAttributes));
            }
            else if (type == 'duration'){
                element = new Element('div', { className: 'SF_inputContainer' });
                var layout = { _row1: ['years', 'months', 'days'], _row2: ['hours', 'minutes', 'seconds']};
                for(var row in layout){
                    var div = new Element('div', { className: 'input-group', id:name+row });
                    element.insert(div);
                    for(var i = 0; i < layout[row].length; i++){
                        var f = layout[row][i];
                        div.insert('<span class="input-group-addon">'+MessageHash['duration_'+f]+'</span>')
                            .insert(new Element('input', { type: 'text', className: 'form-control small', name: name+'.'+f, value: (defaultValue && defaultValue[f])||'' }));
                    }
                }
            }
            else if (type == 'composed'){
                element = new Element('div', { className: 'SF_inputContainer' });
                $A(param.get('childs')).each(function (child){
                    var childName = child.get('name');
                    var childType = child.get('type');
                    var childMandatory = child.get('mandatory') && child.get('mandatory') == 'true';
                    var childTranslatable = child.get('translatable') === 'true';

                    var inputGroup = new Element('div', { className: 'input-group', id:name+'.'+childName});
                    element.insert(inputGroup);
                    inputGroup.insert('<span class="input-group-addon">'+child.get('label')+(childMandatory?'*':'')+'</span>');

                    if (childType == 'string' || childType == "integer" || childType == 'email') {
                        if (childType == 'string' && childTranslatable){
                            inputGroup.insert(this.createTranslatable('childstring', 
                                (defaultValue && defaultValue[childName]), 
                                languages,
                                { name: name+"."+childName, 'data-mandatory': childMandatory?'true':'false'}));
                        }
                        else {
                            inputGroup.insert(new Element('input', { 
                                type: 'text',
                                className: 'form-control',
                                name: name+"."+childName,
                                value: (defaultValue && defaultValue[childName])||'',
                                'data-mandatory': childMandatory?'true':'false'
                            }));                        
                        }
                    }
                    if (childType == 'date' || childType == 'datetime') {
                        inputGroup.addClassName('date')
                            .insert(new Element('input', {type: 'text',
                                className: 'form-control',
                                name:name+"."+childName,
                                'data-ctrl_type': childType,
                                'data-mandatory': childMandatory?'true':'false'
                            }).store('date', (defaultValue && defaultValue[childName])||''))
                            .insert('<span class="input-group-addon datepickerbutton"><span class="glyphicon glyphicon-calendar"></span></span>');
                    }
                });
            }
            else if(type == 'button'){
                element = new Element('div', {className:'SF_input SF_inlineButton'}).update('<span class="icon-play-circle"></span>'+param.get('description'));
                element.observe("click", function(event){
                    element.addClassName('SF_inlineButtonWorking');
                    var testValues = $H();
                    this.serializeParametersInputs(form, testValues, "DRIVER_OPTION_");
                    var conn = new Connexion();

                    var choicesValue = param.get("choices").split(":");
                    testValues.set('get_action', choicesValue.shift());
                    if(choicesValue.length > 1){
                        testValues.set("action_plugin_id", choicesValue.shift());
                        testValues.set("action_plugin_method", choicesValue.shift());
                    }
                    if(name.indexOf("/") !== -1){
                        testValues.set("button_key", getRepName(name));
                    }
                    conn.setMethod('post');
                    conn.setParameters(testValues);
                    conn.onComplete = function(transport){
                        element.removeClassName('SF_inlineButtonWorking');
                        if(transport.responseText.startsWith('SUCCESS:')){
                            app.displayMessage("SUCCESS", transport.responseText.replace("SUCCESS:", ""));
                        }else{
                            app.displayMessage("ERROR", transport.responseText.replace("ERROR:", ""));
                        }
                        element.siblings().each(function(el){
                            if(el.pe) el.pe.onTimerEvent();
                        });
                    };
                    conn.sendAsync();
                }.bind(this));

            }else if(type == 'monitor'){

                element = new Element('div', {className:'SF_input SF_inlineMonitoring'}).update('loading...');
                element.pe = new PeriodicalExecuter(function(){
                    element.addClassName('SF_inlineMonitoringWorking');
                    var testValues = $H();
                    this.serializeParametersInputs(form, testValues, "DRIVER_OPTION_");
                    var conn = new Connexion();

                    var choicesValue = param.get("choices").split(":");
                    testValues.set('get_action', choicesValue.shift());
                    if(choicesValue.length > 1){
                        testValues.set("action_plugin_id", choicesValue.shift());
                        testValues.set("action_plugin_method", choicesValue.shift());
                    }
                    if(name.indexOf("/") !== -1){
                        testValues.set("button_key", getRepName(name));
                    }
                    conn.discrete = true;
                    conn.setMethod('post');
                    conn.setParameters(testValues);
                    conn.onComplete = function(transport){
                        element.removeClassName('SF_inlineMonitoringWorking');
                        element.update(transport.responseText);
                    };
                    conn.sendAsync();

                }.bind(this), 10);
                // run now
                element.pe.onTimerEvent();

            }else if(type == 'textarea'){
                if (translatable) {
                    if (!/^\s*$/.test(disabledString)) commonAttributes['disabled'] = true;
                    element = this.createTranslatable(type, defaultValue, languages, commonAttributes);
                }
                else {
                    if(defaultValue) defaultValue = defaultValue.replace(new RegExp("__LBR__", "g"), "\n");
                    element = '<textarea class="SF_input" style="height:70px;" data-ctrl_type="'+type+'" data-mandatory="'+(mandatory?'true':'false')+'" name="'+name+'"'+disabledString+'>'+defaultValue+'</textarea>'
                }
		    }else if(type == 'password'){
				element = '<input type="password" autocomplete="off" data-ctrl_type="'+type+'" data-mandatory="'+(mandatory?'true':'false')+'" name="'+name+'" value="'+defaultValue+'"'+disabledString+' class="SF_input">';
			}else if(type == 'boolean'){
				var selectTrue, selectFalse;
				if(defaultValue !== undefined){
					if(defaultValue == "true" || defaultValue == "1" || defaultValue === true ) selectTrue = true;
					if(defaultValue == "false" || defaultValue == "0" || defaultValue === false) selectFalse = true;
				}
                if(!selectTrue && !selectFalse) selectFalse = true;
				element = '<input type="radio" data-ctrl_type="'+type+'" class="SF_box" name="'+name+'" id="'+name+'-true" value="true" '+(selectTrue?'checked':'')+''+disabledString+'><label for="'+name+'-true">'+MessageHash[440]+'</label>';
				element = element + '<input type="radio" data-ctrl_type="'+type+'" class="SF_box" name="'+name+'" id="'+name+'-false"  '+(selectFalse?'checked':'')+' value="false"'+disabledString+'><label for="'+name+'-false">'+MessageHash[441] + '</label>';
				element = '<div class="SF_input">'+element+'</div>';
			}else if(type == 'select'){
                var achoices, json_list;
                var pchoices = param.get("choices");
                var dependencies = '';
                if(Object.isString(pchoices)){
                    if(pchoices.startsWith("json_list:")){
                        achoices = ["loading|"+MessageHash[466]+"..."];
                        json_list = pchoices.split(":")[1];
                    }else if(pchoices == "APP_AVAILABLE_LANGUAGES"){
                        var object = window._bootstrap.parameters.get("availableLanguages");
                        achoices = [];
                        for(var key in object){
                            achoices.push(key + "|" + object[key]);
                        }
                    }else{
                        achoices = pchoices.split(",");
                    }
                }else if (Object.isFunction(pchoices)){
                    achoices = pchoices(param.get('dependencies'));
                }
                else{
                    achoices = pchoices;
                }
                if(!achoices) achoices = [];

                if (param.get('dependencies')){
                    dependencies = ' data-dependencies="true" ';
                }

                var multiple = param.get("multiple") ? "multiple='true'":"";
                element = '<select class="SF_input" name="'+name+'" data-mandatory="'+(mandatory?'true':'false')+'"'+dependencies+multiple+disabledString+'>';
                var createOptions = function(choices){
                    var optionset = '';
                    if(!mandatory && !multiple) optionset += '<option value=""></option>';
                    var groupOpened = false;
                    var selected;
                    if (param.get("multiple")){
                        selected = Object.isArray(defaultValue) ? defaultValue : defaultValue.split(",");
                    }
                    var group = '';
                    choices = $A(choices).map(function (it) {
                        var cSplit = it.split('|'), cValue = cSplit[0], cLabel = cSplit[cSplit.length-1];
                        var isGroup = /^_grp_/.test(cValue);
                        group = isGroup ? cLabel : group;
                        return { value: cValue, label: cLabel, sortKey : [group, '::', isGroup ? '' : cLabel].join('') };
                    }).sort(function(a,b){
                        return a.sortKey.localeCompare(b.sortKey);
                    });

                    for(var k=0;k<choices.length;k++){
                        var cLabel, cValue;
                        cValue = choices[k].value;
                        cLabel = choices[k].label;
                        var selectedString = '';
                        if (/^_grp_/.test(cValue)){
                            if (groupOpened) {
                                optionset += '</optgroup>';    
                            }
                            optionset += '<optgroup label="'+cLabel+'">';
                        }
                        else {
                            if(param.get("multiple")){
                                $A(selected).each(function(defV){
                                    if(defV == cValue) selectedString = ' selected';
                                });
                            }else{
                                selectedString = (defaultValue == cValue ? ' selected' : '');
                            }
                            optionset += '<option value="'+cValue+'"'+selectedString+'>'+cLabel+'</option>';
                        }                    
                    }
                    if (groupOpened) {
                        optionset += '</optgroup>';    
                    }
                    return optionset;
                }
                element += createOptions(achoices);
                element += '</select>';
                var dependencies = param.get('dependencies');
                if (dependencies){
                    dataEl = { dependencies: dependencies, createOptions: createOptions, getChoices: pchoices };
                }
            }else if(type == "image" && param.get("uploadAction")){
                if(defaultValue && !param.get('useDefaultImage')){
                    var conn = new Connexion();
                    var imgSrc = conn._baseUrl + "&get_action=" +param.get("loadAction") + "&binary_id=" + defaultValue;
                    if(param.get("binary_context")){
                        imgSrc += "&" + param.get("binary_context");
                    }
                }else if(param.get("defaultImage")){
                    imgSrc = param.get("defaultImage");
                }
                element = "<div class='SF_image_block'><img src='"+imgSrc+"' class='SF_image small'><span class='SF_image_link image_update'>"+
                    (param.get("uploadLegend")?param.get("uploadLegend"):MessageHash[457])+"</span><span class='SF_image_link image_remove'>"+
                    (param.get("removeLegend")?param.get("removeLegend"):MessageHash[458])+"</span>" +
                    "<input type='hidden' name='"+param.get("name")+"' data-ctrl_type='binary'>" +
                    "<input type='hidden' name='"+param.get("name")+"_original_binary' value='"+ defaultValue +"' data-ctrl_type='string'></div>";
            }else if(type.indexOf("group_switch:") === 0){

                // Get all values
                var switchName = type.split(":")[1];
                var switchValues = {};
                defaultValue = "";
                if(values && values.get(name)){
                    defaultValue = values.get(name);
                }
                var potentialSubSwitches = $A();
                parametersDefinitions.each(function(p){
                    "use strict";
                    if(!p.get('group_switch_name')) return;
                    if(p.get('group_switch_name') != switchName){
                        p = new Hash(p._object);
                        potentialSubSwitches.push(p);
                        return;
                    }
                    if(! switchValues[p.get('group_switch_value')] ){
                        switchValues[p.get('group_switch_value')] = {label :p.get('group_switch_label'), fields : [], values : $H()};
                    }
                    p = new Hash(p._object);
                    p.unset('group_switch_name');
                    p.set('name', name + '/' + p.get('name'));
                    switchValues[p.get('group_switch_value')].fields.push(p);
                    var vKey = p.get("name");
                    if(values && values.get(vKey)){
                        switchValues[p.get('group_switch_value')].values.set(vKey, values.get(vKey));
                    }
                });
                var selector = new Element('select', {className:'SF_input', name:name, "data-mandatory":(mandatory?'true':'false'), "data-ctrl_type":type});
                if(!mandatory){
                    selector.insert(new Element('option'));
                }
                $H(switchValues).each(function(pair){
                    "use strict";
                    var options = {value:pair.key};
                    if(defaultValue && defaultValue == pair.key) options.selected = "true";
                    selector.insert(new Element('option', options).update(pair.value.label));
                    if(potentialSubSwitches.length){
                        potentialSubSwitches.each(function(sub){
                            pair.value.fields.push(sub);
                        });
                    }
                });
                selector.SWITCH_VALUES = $H(switchValues);
                element = new Element("div").update(selector);
                var subFields = new Element("div");
                element.insert(subFields);
                if(form.paneObject) subFields.paneObject = form.paneObject;
                selector.FIELDS_CONTAINER = subFields;

                selector.observe("change", function(e){
                    "use strict";
                    var target = e.target;
                    target.FIELDS_CONTAINER.update("");
                    if(!target.getValue()) return;
                    var data = target.SWITCH_VALUES.get(target.getValue());
                    this.createParametersInputs(
                        target.FIELDS_CONTAINER,
                        data.fields,
                        true,
                        values,
                        false,
                        true);
                }.bind(this));

                if(selector.getValue()){
                    var data = selector.SWITCH_VALUES.get(selector.getValue());
                    this.createParametersInputs(
                        selector.FIELDS_CONTAINER,
                        data.fields,
                        true,
                        values,
                        false,
                        true
                    );
                }

            }
            var div;
            // INSERT LABEL
            if(type != "legend"){
                div = new Element('div', {className:"SF_element" + (addFieldCheckbox?" SF_elementWithCheckbox":"")});
                if(type == "hidden") div.setStyle({display:"none"});
                div.insert(new Element('div', {className:"SF_label"}).update(label+(mandatory?'*':'')+' :'));
                // INSERT CHECKBOX
                if(addFieldCheckbox){
                    cBox = new Element('input', {type:'checkbox', className:'SF_fieldCheckBox', name:'SFCB_'+name, autocomplete:'off'});
                    cBox.checked = defaultValue?true:false;
                    div.insert(cBox);
                }
                // INSERT ELEMENT
                div.insert(element);
                if (dataEl){
                    div.down('.SF_input').store(dataEl);
                }
            }else{
                div = new Element('div', {className:'dialogLegend'}).update(desc);
            }
            if(type == "image"){
                div.down("span.SF_image_link.image_update").observe("click", function(){
                    this.createUploadForm(form, div.down('img'), param);
                }.bind(this));
                div.down("span.SF_image_link.image_remove").observe("click", function(){
                    this.confirmExistingImageDelete(form, div.down('img'), div.down('input[name="'+param.get("name")+'"]'), param);
                }.bind(this));
            }
			if(desc && type != "legend"){
				modal.simpleTooltip(div.select('.SF_label')[0], '<div class="simple_tooltip_title">'+label+'</div>'+desc);
			}
            if(json_list){
                var conn = new Connexion();
                element = div.down("select");
                if(defaultValue) element.defaultValue = defaultValue;
                var opts = json_list.split('|');
                var reqpar = {get_action:opts[0]};
                if (opts.length > 1) reqpar.plugin_id = opts[1];
                conn.setParameters(reqpar);
                conn.onComplete = function(transport){
                    var json = transport.responseJSON;
                    
                    element.down("option").update(json.LEGEND ? json.LEGEND : "Select...");
                    element.setAttribute("data-empty", element.down("option").value);
                    if(json.HAS_GROUPS){
                        for(var key in json.LIST){
                            var opt = new Element("OPTGROUP", {label:key});
                            element.insert(opt);
                            for (var index=0;index<json.LIST[key].length;index++){
                                var option = new Element("OPTION").update(json.LIST[key][index].action);
                                element.insert(option);
                            }
                        }
                    }else{
                        for (var key in json.LIST){
                            var option = new Element("OPTION", {value:key}).update(json.LIST[key]);
                            if(key == defaultValue) option.setAttribute("selected", "true");
                            element.insert(option);
                        }
                    }
                };
                conn.sendAsync();
            }

            if(param.get('replicationGroup')){
                var repGroupName = param.get('replicationGroup');
                var repGroup;
                if(replicableGroups.get(repGroupName)) {
                    repGroup = replicableGroups.get(repGroupName);
                }else {
                    var replicatable = true;
                    if (param.get('replicatable') !== null && param.get('replicatable') !== undefined){
                        replicatable = param.get('replicatable');
                    }
                    var groupRequired = param.get('groupRequired');
                    groupRequired = (groupRequired === null || groupRequired === undefined || groupRequired);
                    var groupFixed = param.get('groupFixed'); 
                    repGroup = new Element("div", {id:"replicable_"+repGroupName, className:'SF_replicableGroup', "data-replicatable":replicatable?'true':'false'}).update('<div class="SF_Content" data-required="'+groupRequired+'" data-fixed="'+groupFixed+'"/>');
                }
                repGroup.down('.SF_Content').insert(div);
                replicableGroups.set(repGroupName, repGroup);
                div = repGroup;
            }

            if(skipAccordion){
			    form.insert({'bottom':div});
            }else{
                var gDiv = groupDivs.get(group) || new Element('div', {className:'accordion_content'});
                b.insert(div);
                var ref = parseInt(form.getWidth()) + (Prototype.Browser.IE?40:0);
                if(ref > (Prototype.Browser.IE?40:0)){
                    var lab = div.down('.SF_label');
                    if(lab){
                        lab.setStyle({fontSize:'11px'});
                        lab.setStyle({width:parseInt(39*ref/100)+'px'});
                        if( parseInt(lab.getHeight()) > Math.round(parseFloat(lab.getStyle('lineHeight')) + Math.round(parseFloat(lab.getStyle('paddingTop'))) + Math.round(parseFloat(lab.getStyle('paddingBottom')))) ){
                            lab.next().setStyle({marginTop:lab.getStyle('lineHeight')});
                        }
                        lab.setStyle({width:'39%'});
                    }
                }
                gDiv.insert(div);
                groupDivs.set(group, gDiv);
            }

		}.bind(this));
        if(replicableGroups.size()){
            replicableGroups.each(function(pair){
                var repGroup = pair.value;
                var replicatable = repGroup.getAttribute('data-replicatable');
                var contentPane = repGroup.down('.SF_Content');
                var groupRequired = !(contentPane.getAttribute('data-required') === 'false');
                var groupFixed = (contentPane.getAttribute('data-fixed') === 'true');
                var valuesLike = values && values.keys().filter(function(key) { return key.replace(pair.key+'.', '') != key}).length > 0;
                if (replicatable === null || replicatable === 'true'){
                    if (!groupFixed){
                        var replicationButton = new Element("a", {className:'SF_replication_Add', title:'Replicate this group'}).update("&nbsp;").observe("click", function(event){
                            if ($(event.target).match('.SF_disabled')) return;
                            this.replicateRow(repGroup,  1, form, null, $(event.target).up('.SF_replicableGroup'));    
                        }.bind(this));
                        repGroup.insert({bottom:replicationButton});
                        if (!groupRequired && valuesLike){
                            var removeButton = new Element('a', {className:'SF_replication_Remove', title:'Remove this group'})
                                .update('&nbsp;')
                                .observe('click', function(){
                                    if(form.paneObject) $continue = form.paneObject.notify('before_remove_replicated_row', repGroup);
                                    contentPane.hide();
                                    removeButton.stopObserving('click');
                                    removeButton.remove();
                                    if(form.paneObject) form.paneObject.notify('after_remove_replicated_row', repGroup);
                                });            
                            repGroup.insert(removeButton);
                        }
                    }
                    repGroup.insert({bottom:new Element('div', {className:'SF_rgClear'})});
                }
                if(values){ //There is data
                    var hasReplicates = true;
                    var replicIndex = 1;
                    var lastRow = repGroup;
                    while(hasReplicates){
                        var repInputs = repGroup.select('input,select,textarea');
                        if(!repInputs.length) break;
                        repInputs.each(function(element){
                            var name = element.name;
                            hasReplicates &= (values.get(name+"_"+replicIndex) != null);
                        });
                        if(hasReplicates){
                            lastRow = this.replicateRow(repGroup, 1, form, values, lastRow);
                            replicIndex++;
                        }
                    }

                    if (!groupRequired && !valuesLike && replicatable === 'true'){
                        contentPane.hide();
                    }
                }
                else {
                    if (!groupRequired && replicatable === 'true'){
                        contentPane.hide();
                    }
                }
            }.bind(this));
        }
        //Create form toolbar
        this.createFormToolbar(form);
        this.createDatePickers(form);

        if(addFieldCheckbox){
            form.select("input.SF_fieldCheckBox").each(function(cb){
                cb.checked = false;
                cb.observe("click", this.fieldCheckboxClick);
                this.fieldCheckboxClick({target: cb});
            }.bind(this));
        }        

        if(!groupDivs.size()) return;
        var firstGroup = true;
        groupDivs.each(function(pair){
            var title = new Element('div',{className:'accordion_toggle', tabIndex:0}).update(pair.key);
            title.observe('focus', function(){
                if(form.SF_accordion && form.SF_accordion.showAccordion!=title.next(0)) {
                    form.SF_accordion.activate(title);
                }
            });
            form.insert(title);
            form.insert(pair.value);
        });
        form.SF_accordion = new accordion(form, {
            classNames : {
                toggle : 'accordion_toggle',
                toggleActive : 'accordion_toggle_active',
                content : 'accordion_content'
            },
            defaultSize : {
                width : '360px',
                height: null
            },
            direction : 'vertical'
        });
        if(!startAccordionClosed) form.SF_accordion.activate(form.down('div.accordion_toggle'));
	},

    fieldCheckboxClick: function(event){
        var cbox = event.target;
        var state = !cbox.checked;
        var fElement = cbox.next("input.SF_input,select.SF_input,div.SF_input,div.SF_inputContainer,textarea.SF_input,div.input-group.date");
        var fElements;
        var isDiv = fElement && fElement.nodeName.toLowerCase() == "div";
        if( isDiv) {
            fElements = fElement.select("input,select");
        }else{
            fElements = $A(fElement ? [fElement] : []);
        }
        fElements.invoke((state?"disable":"enable"));
        var nextDiv = cbox.up(0).next('div');
        if (nextDiv && nextDiv.match('.SF_replicableGroup')){
            var addBtn = nextDiv.down('.SF_replication_Add');
            if (addBtn && state) {
                nextDiv.down('.SF_replication_Add').addClassName("SF_disabled");
            }
            else if (addBtn) {
                nextDiv.down('.SF_replication_Add').removeClassName("SF_disabled");
            }
        }
        if(state){
            cbox.previous("div.SF_label").addClassName("SF_disabled");
        }else{
            cbox.previous("div.SF_label").removeClassName("SF_disabled");
        }
    },

    createFormToolbar: function(form){
        if (!form.down('[data-language]')) return;
        var formToolbar = new Element('div', { name: '_form_toolbar_container', className:'formToolbar'});
        var languageSelect = new Element('select', { name: '_translateto_lang'})
        formToolbar.insert(new Element('div').insert(languageSelect));
        var languages = this.availableLanguages;
        if (!languages || Object.keys(languages).length == 0){
            languages = window._bootstrap.parameters.get("availableLanguages");
        }
        var choices = [];
        choices.push('<option value="none" selected="selected">'+MessageHash[480]+'</option>');
        $A(Object.keys(languages)).each(function(key){
            if (key != 'none') 
                choices.push('<option value="'+key+'">'+languages[key]+'</option>');
        });
        languageSelect.update(choices.join(''));
        this._lang = 'none';
        languageSelect.observe("change", function(e){
            "use strict";
            if (this._ignoreLanguageChanging || !this.changeInputLanguage(form, e.target.value)) {
                Event.stop(e);
                languageSelect.setValue(this._lang);
            }
            this._ignoreLanguageChanging = true;
            form.up('form').select('select[name="_translateto_lang"]').each(function(el){el.setValue(e.target.value)});
            delete this._ignoreLanguageChanging;
        }.bind(this));

        form.insert({top:formToolbar});
    },

    changeInputLanguage: function(form, lang) {
        if (Event.fire(form.up('form'), 'form:language_changing', { current: this._lang, next: lang }).stopped) return false;
        $A(form.up('form').select('[data-language]')).each(function (item){
            var data = item.retrieve('translations');
            data[this._lang] = item.getValue ? item.getValue() : (item.value || '');
            item.store('translations', data);
            item.setValue('');
            item.setValue(data[lang]);
            item.setAttribute('data-language', lang);
        }.bind(this));
        this._lang = lang;        
        return true;
    },

    createTranslatable: function(type, value, languages, httpAttributes){
        var defaultLang = null;
        var translations = [];
        var defaultValue = value ? value['none'] : '';

        switch(type){
            case 'keywords':
            case 'string':
                element = new Element('input', Object.extend({type: 'text', className:'SF_input', value:defaultValue}, httpAttributes));
                break;
            case 'childstring':
                element = new Element('input', Object.extend({type: 'text', className: 'form-control', value: defaultValue}, httpAttributes));
                break;
            case 'textarea':
                if(defaultValue) defaultValue = defaultValue.replace(new RegExp("__LBR__", "g"), "\n");
                var dtype = httpAttributes['data-ctrl_type'];
                var mandatory = httpAttributes['data-mandatory'];
                //var disabledString = httpAttributes['disabled'];
                //element = '<textarea class="SF_input" style="height:70px;" data-ctrl_type="'+dtype+'" data-mandatory="'+(mandatory?'true':'false')+'" name="'+name+'"'+disabledString+'>'+defaultValue+'</textarea>'
                element = new Element('textarea', Object.extend({ className: 'SF_input', style: 'height:70px;'}, httpAttributes)).update(defaultValue);
                break;
        }

        element.store('translations', value || {});
        element.writeAttribute("data-language", 'none');
        return element;
    },

    createUploadForm : function(modalParent, imgSrc, param){
        if(this.modalParent) modalParent = this.modalParent;
        var conn = new Connexion();
        var url = conn._baseUrl + "&get_action=" + param.get("uploadAction");
        if(param.get("binary_context")){
            url += "&" + param.get("binary_context");
        }
        if(!$("formManager_hidden_iframe")){
            $('hidden_frames').insert(new Element("iframe", {id:"formManager_hidden_iframe", name:"formManager_hidden_iframe"}));
        }
        var paramName = param.get("name");
        var pane = new Element("div");
        pane.update("<form id='formManager_uploader' enctype='multipart/form-data' target='formManager_hidden_iframe' method='post' action='"+url+"'>" +
            "<div class='dialogLegend'>Select an image on your computer</div> " +
            "<input type='file' name='userfile' style='width: 270px;'>" +
            "</form>");
        modal.showSimpleModal(modalParent, pane, function(){
            window.formManagerHiddenIFrameSubmission = function(result){
                imgSrc.src = conn._baseUrl + "&get_action=" + param.get("loadAction")+"&tmp_file="+result.trim();
                imgSrc.next("input[type='hidden']").setValue(result.trim());
                this.triggerEvent(imgSrc.next("input[type='hidden']"), 'change');
                imgSrc.next("input[type='hidden']").setAttribute("data-ctrl_type", "binary");
                window.formManagerHiddenIFrameSubmission = null;
            }.bind(this);
            pane.down("#formManager_uploader").submit();
            return true;
        }.bind(this) , function(){
            return true;
        }.bind(this) );

    },

    triggerEvent : function(element, eventName) {
        // safari, webkit, gecko
        if (document.createEvent)
        {
            var evt = document.createEvent('HTMLEvents');
            evt.initEvent(eventName, true, true);
            return element.dispatchEvent(evt);
        }

        // Internet Explorer
        if (element.fireEvent) {
            return element.fireEvent('on' + eventName);
        }
    },

    observeFormChanges : function(form, callback, bufferize){
        var realCallback;
        var randId = 'timer-'+parseInt(Math.random()*1000);
        if(bufferize){
            realCallback = function(){
                if(window[randId]) window.clearTimeout(window[randId]);
                window[randId] = window.setTimeout(function(){
                    callback();
                }, bufferize);
            };
        }else{
            realCallback = callback;
        }
        form.select("div.SF_element").each(function(element){
            element.select("input,textarea,select").invoke("observe", "change", realCallback);
            element.select(".input-group.date").invoke("observe", "dp:change", realCallback);
            element.select("input,textarea").invoke("observe", "keydown", function(event){
                if(event.keyCode == Event.KEY_DOWN || event.keyCode == Event.KEY_UP || event.keyCode == Event.KEY_RIGHT || event.keyCode == Event.KEY_LEFT || event.keyCode == Event.KEY_TAB){
                    return;
                }
                realCallback(event);
            });
        }.bind(this) );
        if(form.paneObject){
            form.paneObject.observe("after_replicate_row", function(replicate){
                replicate.select("div.SF_element").each(function(element){
                    element.select("input,textarea,select").invoke("observe", "change", realCallback);
                    element.select(".input-group.date").invoke("observe", "dp:change", realCallback);
                    element.select("input,textarea").invoke("observe", "keydown", function(event){
                        if(event.keyCode == Event.KEY_DOWN || event.keyCode == Event.KEY_UP || event.keyCode == Event.KEY_RIGHT || event.keyCode == Event.KEY_LEFT || event.keyCode == Event.KEY_TAB){
                            return;
                        }
                        realCallback(event);
                    });
                }.bind(this) );
            });
            //set Dirty if a replicated row is removed
            form.paneObject.observe("after_remove_replicated_row", function(replicate){
                realCallback(replicate);
            });
        }
    },

    confirmExistingImageDelete : function(modalParent, imgSrc, hiddenInput, param){
        if(window.confirm('Do you want to remove the current image?')){
            hiddenInput.setValue("remove-original");
            imgSrc.src = param.get('defaultImage');
            this.triggerEvent(imgSrc.next("input[type='hidden']"), 'change');
        }
    },

	serializeParametersInputs : function(form, parametersHash, prefix, skipMandatoryWarning){
		prefix = prefix || '';
		var missingMandatory = $A();
        var checkboxesActive = false;
		form.select('input,textarea').each(function(el){
            var dataLanguage = el.getAttribute('data-language');
			if(el.type == "text" || el.type == "hidden" || el.type == "password" || el.nodeName.toLowerCase() == 'textarea'){
                if(el.up('.SF_Content') && !el.up('.SF_Content').visible()) return; //Ignore non required collections
                var oValue = dataLanguage ? el.retrieve('translations') || {} : el.value;
                if (dataLanguage) oValue[dataLanguage] = el.value;
                var value = dataLanguage ? (oValue['none'] || '') : oValue;
				if(el.getAttribute('data-mandatory') == 'true' 
                    && value == '' && !el.disabled){
					missingMandatory.push(el);
				}
                var data_type = el.getAttribute('data-ctrl_type');
                if (/(date|datetime)/i.test(data_type)){
                    parametersHash.set(prefix+el.name, el.retrieve('date'));
                }
                /*else if (data_type == 'keywords'){
                    parametersHash.set(prefix+el.name, el.value.split(','));
                }*/
                else if (dataLanguage) {
                    el.store('translations', oValue);
                    parametersHash.set(prefix+el.name, JSON.stringify(oValue));
                }
                else {
				    parametersHash.set(prefix+el.name, el.value);
                }
			}
			else if(el.type=="radio" && el.checked){
				parametersHash.set(prefix+el.name, el.value)
			};
			if(el.getAttribute('data-ctrl_type')){
				parametersHash.set(prefix+el.name+'_apptype', el.getAttribute('data-ctrl_type'));
			}
            var refEl = form.down('[name="SFCB_'+el.name+'"]');
            if(refEl){
                checkboxesActive = true;
                parametersHash.set(prefix+el.name+'_checkbox', refEl.checked?'checked':'unchecked');
            }
            refEl = el.up('.SF_replicableGroup');
            if(refEl){
                var group = refEl.id;
                parametersHash.set(prefix+el.name+'_replication', refEl.id);
            }
            refEl = el.up('.SF_inputContainer');
            if(refEl){
                if (refEl.previous().match('input.SF_fieldCheckBox')){
                    checkboxesActive = true;
                    parametersHash.set(prefix+el.name+'_checkbox', refEl.previous().checked?'checked':'unchecked');
                }
            }
		});
		form.select('select').each(function(el){
			if(el.getAttribute("data-mandatory") == 'true' && (el.getValue() == '' ||  el.getValue() == el.getAttribute('data-empty')) && !el.disabled){
				missingMandatory.push(el);
			}
            if(el.getAttribute('data-ctrl_type')){
                parametersHash.set(prefix+el.name+'_apptype', el.getAttribute('data-ctrl_type'));
            }
            parametersHash.set(prefix+el.name, el.getValue());
            if(form.down('[name="SFCB_'+el.name+'"]')){
                checkboxesActive = true;
                parametersHash.set(prefix+el.name+'_checkbox', form.down('[name="SFCB_'+el.name+'"]').checked?'checked':'unchecked');
            }
            if(el.up('.SF_replicableGroup')){
                parametersHash.set(prefix+el.name+'_replication', el.up('.SF_replicableGroup').id);
            }
		});
        if(checkboxesActive){
            parametersHash.set("sf_checkboxes_active", "true");
        }
        if(!skipMandatoryWarning){
	        missingMandatory.each(function(el){
	        	el.addClassName("SF_failed");
	        	if(form.SF_accordion && el.up('div.accordion_content').previous('div.accordion_toggle')){
	        		el.up('div.accordion_content').previous('div.accordion_toggle').addClassName('accordion_toggle_failed');
	        	}
	        });
        }
        // Reorder keys
        var allKeys = parametersHash.keys();
        allKeys.sort();
        allKeys.reverse();
        var treeKeys = {};
        allKeys.each(function(key){
            if(key.indexOf("/") === -1) return;
            if(key.endsWith("_apptype")) return;
            var typeKey = key + "_apptype";
            var parts = key.split("/");
            var parentName = parts.shift();
            var parentKey;
            while(parts.length > 0){
                if(!parentKey){
                    parentKey = treeKeys;
                }
                if(!parentKey[parentName]) {
                    parentKey[parentName] = {};
                }
                parentKey = parentKey[parentName];
                parentName = parts.shift();
            }
            var type = parametersHash.unset(typeKey);
            if(parentKey && !parentKey[parentName]) {
                if(type == "boolean"){
                    var v = parametersHash.get(key);
                    parentKey[parentName] = (v == "true" || v == 1 || v === true );
                }else if(type == "integer"){
                    parentKey[parentName] = parseInt(parametersHash.get(key));
                }else{
                    parentKey[parentName] = parametersHash.get(key);
                }
            }else if(parentKey && type.startsWith('group_switch:')){
                parentKey[parentName]["group_switch_value"] = parametersHash.get(key);
            }
            parametersHash.unset(key);
        });
        $H(treeKeys).each(function(pair){
            if(parametersHash.get(pair.key + '_apptype') && parametersHash.get(pair.key + '_apptype').startsWith('group_switch:')
                && !pair.value['group_switch_value']){
                pair.value['group_switch_value'] = parametersHash.get(pair.key);
            }
            parametersHash.set(pair.key, Object.toJSON(pair.value));
            parametersHash.set(pair.key+"_apptype", "text/json");
        });

		return missingMandatory.size();
	},		
	
	/**
	 * Replicate a template row
	 * @param templateRow HTMLElement
	 * @param number Integer
	 * @param form HTMLForm
	 */
	replicateRow: function(templateRow, number, form, values, lastRow){
        if(form.paneObject) form.paneObject.notify('before_replicate_row', templateRow);
        var contentPane = lastRow.down('.SF_Content');
        var isFixed = contentPane.getAttribute('data-fixed') === 'true';
        if (!contentPane.visible()){
            templateRow.select('input', 'select', 'textarea').each(function(el) { el.setValue('')});
            if (!isFixed){
                var removeButton = new Element('a', {className:'SF_replication_Remove', title:'Remove this group'})
                    .update('&nbsp;')
                    .observe('click', function(){
                        if(form.paneObject) $continue = form.paneObject.notify('before_remove_replicated_row', templateRow);
                        contentPane.hide();
                        removeButton.stopObserving('click');
                        removeButton.remove();
                        if(form.paneObject) form.paneObject.notify('after_remove_replicated_row', templateRow);
                    });            
                lastRow.insert(removeButton);
            }
            contentPane.show();
            return;
        }


        var repIndex = templateRow.getAttribute('data-replication-index');
        if(repIndex === null){
            repIndex = 0;
        }else{
            repIndex = parseInt(repIndex);
        }
		for(var index=0;index < number ;index++){
            repIndex ++;
            templateRow.setAttribute('data-replication-index', repIndex);
			var tr = $(templateRow.cloneNode(true));
			if(tr.id) tr.id = tr.id+'_'+repIndex;
			var inputs = tr.select('input', 'select', 'textarea');
			inputs.each(function(input){
				var newName = input.getAttribute('name')+'_'+repIndex;
				input.setAttribute('name', newName);
				if(form && Prototype.Browser.IE){form[newName] = input;}
                if(values && values.get(newName)){
                    if (/(date|datetime)/.test(input.getAttribute('data-ctrl_type'))){
                        input.store('date', values.get(newName));
                    }
                    else {                    
                        input.setValue(values.get(newName));
                    }
                }else{
                    input.setValue('');
                }
			});

            if (lastRow) {
                lastRow.insert({after: tr});
                if (!isFixed){
                    if(tr.select('.SF_replication_Add').length){
                        tr.select('.SF_replication_Add').invoke("remove");
                    }

                    tr.insert(lastRow.select('.SF_replication_Add')[0]);                
                }
            }
            else {
                templateRow.insert({after:tr});
            }

            if (!isFixed){
                var removeButton = new Element('a', {className:'SF_replication_Remove', title:'Remove this group'})
                    .update('&nbsp;')
                    .observe('click', function(){
                        if(form.paneObject) $continue = form.paneObject.notify('before_remove_replicated_row', tr);
                        if(tr.select('.SF_replication_Add').length){
                            tr.previous('.SF_replicableGroup').insert(tr.select('.SF_replication_Add')[0]);
                        }
                        tr.remove();
                        if(form.paneObject) form.paneObject.notify('after_remove_replicated_row', tr);
                    });
                tr.insert(removeButton);
            }
            this.createDatePickers(tr);
            if(form.paneObject) form.paneObject.notify('after_replicate_row', tr);
            lastRow = tr;
		}
        return lastRow;
        /*
		templateRow.select('input', 'select', 'textarea').each(function(origInput){
			var newName = origInput.getAttribute('name')+'_0';
			origInput.setAttribute('name', newName);
			if(form && Prototype.Browser.IE){form[newName] = origInput;}
		});
		*/
	},

    /**
     * @param form HTMLForm
     */
    createDatePickers: function(form){
        form.select('.input-group.date').each(function(el){
            try{
                var hasTime = el.down('input').readAttribute('data-ctrl_type') == 'datetime';
                new DateTimePicker(el, { debug: false, locale: app.currentLanguage, format: 'YYYY-MM-DD'+(hasTime?' LT':'') }); //'L'+(hasTime?' h:mm A':'')
            }
            catch(err){
                console.log(err);
            }
        });
    },
	
	/**
	 * @param form HTMLForm
	 * @param fields Array
	 * @param value Object
	 * @param suffix String
	 */
	fetchValueToForm : function(form, fields, value, suffix){
		$A(fields).each(function(fieldName){
			if(!value[fieldName]) return;
			if(suffix != null){
				realFieldName = fieldName+'_'+suffix;
			}else{
				realFieldName = fieldName;
			}
			var element = form[realFieldName];
			if(!element)return;
			var nodeName = element.nodeName.toLowerCase();
			switch(nodeName){
				case 'input':
					if(element.getAttribute('type') == "checkbox"){
						if(element.value == value[fieldName]) element.checked = true;
					}else{
						element.value = value[fieldName];
					}
				break;
				case 'select':
					element.select('option').each(function(option){
						if(option.value == value[fieldName]){
							option.selected = true;
						}
					});
				break;
				case 'textarea':
					element.update(value[fieldName]);
					element.value = value[fieldName];
				break;
				default:
				break;
			}
		});
	},
	
	/**
	 * @param form HTMLForm
	 * @param fields Object
	 * @param values Array
	 */
	fetchMultipleValueToForm : function(form, fields, values){
		var index = 0;
		$A(values).each(function(value){
			this.fetchValueToForm(form, fields, value, index);
			index++;
		}.bind(this));
	},

    destroyForm : function(form){
        form.select("div.SF_inlineMonitoring").each(function(el){
            if(el.pe) el.pe.stop();
        });
    }
});