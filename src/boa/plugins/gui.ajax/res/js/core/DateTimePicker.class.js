(function () {
    'use strict';
    
    var WindowSize = Class.create({
        width: function()
        {
            var myWidth = 0;
            if (typeof(window.innerWidth) == 'number')
            {
                //Non-IE
                myWidth = window.innerWidth;
            }
            else if (document.documentElement && document.documentElement.clientWidth)
            {
                //IE 6+ in 'standards compliant mode'
                myWidth = document.documentElement.clientWidth;
            }
            else if (document.body && document.body.clientWidth)
            {
                //IE 4 compatible
                myWidth = document.body.clientWidth;
            }
            return myWidth;
        },
        height: function()
        {
            var myHeight = 0;
            if (typeof(window.innerHeight) == 'number')
            {
                //Non-IE
                myHeight = window.innerHeight;
            }
            else if (document.documentElement && document.documentElement.clientHeight)
            {
                //IE 6+ in 'standards compliant mode'
                myHeight = document.documentElement.clientHeight;
            }
            else if (document.body && document.body.clientHeight)
            {
                //IE 4 compatible
                myHeight = document.body.clientHeight;
            }
            return myHeight;
        },
        scrollTop: function (){
            return document.viewport.getScrollOffsets()['top'];
        }

    });

    var dateTimePicker = function (element, options){
        var picker = {},
            date,
            viewDate,
            unset = true,
            input,
            component = false,
            widget = false,
            use24Hours,
            minViewModeNumber = 0,
            actualFormat,
            parseFormats,
            currentViewMode,
            datePickerModes = [
                {
                    clsName: 'days',
                    navFnc: 'M',
                    navStep: 1
                },
                {
                    clsName: 'months',
                    navFnc: 'y',
                    navStep: 1
                },
                {
                    clsName: 'years',
                    navFnc: 'y',
                    navStep: 10
                },
                {
                    clsName: 'decades',
                    navFnc: 'y',
                    navStep: 100
                }
            ],
            viewModes = ['days', 'months', 'years', 'decades'],
            verticalModes = ['top', 'bottom', 'auto'],
            horizontalModes = ['left', 'right', 'auto'],
            toolbarPlacements = ['default', 'top', 'bottom'],
            keyMap = {
                'up': 38,
                38: 'up',
                'down': 40,
                40: 'down',
                'left': 37,
                37: 'left',
                'right': 39,
                39: 'right',
                'tab': 9,
                9: 'tab',
                'escape': 27,
                27: 'escape',
                'enter': 13,
                13: 'enter',
                'pageUp': 33,
                33: 'pageUp',
                'pageDown': 34,
                34: 'pageDown',
                'shift': 16,
                16: 'shift',
                'control': 17,
                17: 'control',
                'space': 32,
                32: 'space',
                't': 84,
                84: 't',
                'delete': 46,
                46: 'delete'
            },
            keyState = {},

            /********************************************************************************
             *
             * Private functions
             *
             ********************************************************************************/

            hasTimeZone = function () {
                return moment.tz !== undefined && options.timeZone !== undefined && options.timeZone !== null && options.timeZone !== '';
            },

            getMoment = function (d) {
                var returnMoment;

                if (d === undefined || d === null) {
                    returnMoment = moment(); //TODO should this use format? and locale?
                } else if (moment.isDate(d) || moment.isMoment(d)) {
                    // If the date that is passed in is already a Date() or moment() object,
                    // pass it directly to moment.
                    returnMoment = moment(d);
                } else if (hasTimeZone()) { // There is a string to parse and a default time zone
                    // parse with the tz function which takes a default time zone if it is not in the format string
                    returnMoment = moment.tz(d, parseFormats, options.useStrict, options.timeZone);
                } else {
                    returnMoment = moment(d, parseFormats, options.useStrict);
                }

                if (hasTimeZone()) {
                    returnMoment.tz(options.timeZone);
                }

                return returnMoment;
            },

            isEnabled = function (granularity) {
                if (typeof granularity !== 'string' || granularity.length > 1) {
                    throw new TypeError('isEnabled expects a single character string parameter');
                }
                switch (granularity) {
                    case 'y':
                        return actualFormat.indexOf('Y') !== -1;
                    case 'M':
                        return actualFormat.indexOf('M') !== -1;
                    case 'd':
                        return actualFormat.toLowerCase().indexOf('d') !== -1;
                    case 'h':
                    case 'H':
                        return actualFormat.toLowerCase().indexOf('h') !== -1;
                    case 'm':
                        return actualFormat.indexOf('m') !== -1;
                    case 's':
                        return actualFormat.indexOf('s') !== -1;
                    default:
                        return false;
                }
            },

            hasTime = function () {
                return (isEnabled('h') || isEnabled('m') || isEnabled('s'));
            },

            hasDate = function () {
                return (isEnabled('y') || isEnabled('M') || isEnabled('d'));
            },

            getDatePickerTemplate = function () {
                var headTemplate = [
                    '<thead>',
                        '<tr>',
                            '<th class="prev" data-action="previous">',
                                '<span class="'+options.icons.previous+'"/>',
                            '</th>',
                            '<th class="picker-switch" data-action="pickerSwitch" colspan="'+(options.calendarWeeks?'6':'5')+'"></th>',
                            '<th class="next" data-action="next">',
                                '<span class="'+options.icons.next+'"/>',
                            '</th>',
                        '</tr>',
                    '</thead>'
                ].join(''),
                contTemplate = [
                    '<tbody>',
                        '<tr>',
                            '<td colspan="'+(options.calendarWeeks?'8':'7')+'"/>',
                        '</tr>',
                    '<tbody>'
                ].join('');
                
                return [
                    new Element('div', {className:'datepicker-days'}).update([
                        '<table class="table-condensed">',
                            headTemplate,
                            '<tbody/>',
                        '</table>'
                    ].join('')),
                    new Element('div', {className:'datepicker-months'}).update([
                        '<table class="table-condensed">',
                            headTemplate,
                            contTemplate,
                        '</table>'
                    ].join('')),
                    new Element('div', {className:'datepicker-years'}).update([
                        '<table class="table-condensed">',
                            headTemplate,
                            contTemplate,
                        '</table>'
                    ].join('')),
                    new Element('div', {className:'datepicker-decades'}).update([
                        '<table class="table-condensed">',
                            headTemplate,
                            contTemplate,
                        '</table>'
                    ].join(''))
                ];
            },

            getTimePickerMainTemplate = function (){
                var topRow = ['<tr>'],
                    middleRow = ['<tr>'],
                    bottomRow = ['<tr>'];

                if (isEnabled('h')) {
                    topRow.splice(topRow.length, 0, '<td>',
                        '<a class="btn" href="#" tabindex="-1" title="'+options.tooltips.incrementHour+'" data-action="incrementHours">',
                        '<span class="'+options.icons.up+'"/>',
                        '</a>',
                        '</td>');
                    middleRow.splice(middleRow.length, 0, '<td>',
                        '<span class="timepicker-hour" data-time-component="hours" title="'+options.tooltips.pickHour+'" data-action="showHours"/>',
                        '</td>');
                    bottomRow.splice(bottomRow.length, 0, '<td>',
                        '<a class="btn" href="#" tab-index="-1" title="'+options.tooltips.decrementHour+'" data-action="decrementHours"/>',
                        '<span class="'+options.icons.down+'"/>',
                        '</a>',
                        '</td>');
                }

                if (isEnabled('m')) {
                    if (isEnabled('h')) {
                        topRow.push('<td class="separator"></td>');
                        middleRow.push('<td class="separator">:</td>');
                        bottomRow.push('<td class="separator"></td>');
                    }
                    topRow.splice(topRow.length, 0, '<td>',
                        '<a class="btn" href="#" tabindex="-1" title="'+options.tooltips.incrementMinute+'" data-action="incrementMinutes">',
                        '<span class="'+options.icons.up+'"/>',
                        '</a>',
                        '</td>');
                    middleRow.splice(middleRow.length, 0, '<td>',
                        '<span class="timepicker-minute" data-time-component="minute" title="'+options.tooltips.pickMinute+'" data-action="showMinutes"/>',
                        '</td>');
                    bottomRow.splice(bottomRow.length, 0, '<td>',
                        '<a class="btn" href="#" tab-index="-1" title="'+options.tooltips.decrementMinute+'" data-action="decrementMinutes"/>',
                        '<span class="'+options.icons.down+'"/>',
                        '</a>',
                        '</td>');
                }

                if (isEnabled('s')) {
                    if (isEnabled('m')) {
                        topRow.push('<td class="separator"></td>');
                        middleRow.push('<td class="separator">:</td>');
                        bottomRow.push('<td class="separator"></td>');
                    }
                    topRow.splice(topRow.length, 0, '<td>',
                        '<a class="btn" href="#" tabindex="-1" title="'+options.tooltips.incrementSecond+'" data-action="incrementSeconds">',
                        '<span class="'+options.icons.up+'"/>',
                        '</a>',
                        '</td>');
                    middleRow.splice(middleRow.length, 0, '<td>',
                        '<span class="timepicker-second" data-time-component="seconds" title="'+options.tooltips.pickSecond+'" data-action="showSeconds"/>',
                        '</td>');
                    bottomRow.splice(bottomRow.length, 0, '<td>',
                        '<a class="btn" href="#" tab-index="-1" title="'+options.tooltips.decrementSecond+'" data-action="decrementSeconds"/>',
                        '<span class="'+options.icons.down+'"/>',
                        '</a>',
                        '</td>');
                }

                if (!use24Hours){
                    topRow.push('<td class="separator"/>');
                    middleRow.splice(middleRow.length, 0, '<td>',
                        '<button class="btn btn-primary" data-action="togglePeriod" tabindex="-1"',
                        ' title="'+options.tooltips.togglePeriod+'"/>',
                        '</td>');
                    bottomRow.push('<td class="separator"/>');
                }

                topRow.push('</tr>')
                middleRow.push('</tr>')
                bottomRow.push('</tr>')

                var content = [
                    '<table class="table-condensed">',
                        topRow.join(''),
                        middleRow.join(''),
                        bottomRow.join(''),
                    '</table>'
                ].join('');
                return new Element('div', {className:'timepicker-picker'}).update(content);
            },

            getTimePickerTemplate = function () {
                var hoursView = new Element('div', {className:'timepicker-hours'}).update('<table class="table-condensed"></table>'),
                    minutesView = new Element('div', {className:'timepicker-minutes'}).update('<table class="table-condensed"></table>'),
                    secondsView = new Element('div', {className:'timepicker-seconds'}).update('<table class="table-condensed"></table>'),
                    ret = [getTimePickerMainTemplate()];

                if (isEnabled('h')) {
                    ret.push(hoursView);
                }
                if (isEnabled('m')) {
                    ret.push(minutesView);
                }
                if (isEnabled('s')) {
                    ret.push(secondsView);
                }

                return ret;
            },

            getToolbar = function () {
                var row = ['<tbody><tr>'];
                if (options.showTodayButton) {
                    row.splice(row.length, 0,
                        '<td>',
                            '<a data-action="today" title="'+options.tooltips.today+'">',
                                '<span class="'+options.icons.today+'"/>',
                            '</a>',
                        '</td>'
                        );
                }
                if (!options.sideBySide && hasDate() && hasTime()){
                    row.splice(row.length, 0,
                        '<td>',
                            '<a data-action="togglePicker" title="'+options.tooltips.selectTime+'">',
                                '<span class="'+options.icons.time+'"/>',
                            '</a>',
                        '</td>'
                        );
                }
                if (options.showClear) {
                    row.splice(row.length, 0,
                        '<td>',
                            '<a data-action="clear" title="'+options.tooltips.clear+'">',
                                '<span class="'+options.icons.clear+'"/>',
                            '</a>',
                        '</td>'
                        );
                }
                if (options.showClose) {
                    row.splice(row.length, 0,
                        '<td>',
                            '<a data-action="close" title="'+options.tooltips.close+'">',
                                '<span class="'+options.icons.close+'"/>',
                            '</a>',
                        '</td>'
                        );
                }
                row.push('</tr></tbody>')
                return new Element('table', { className: 'table-condensed' }).update(row.join(''));
            },

            getTemplate = function () {
                var template = new Element('div', {className: 'bootstrap-datetimepicker-widget dropdown-menu'}),
                    dateView = new Element('div', {className: 'datepicker'}),
                    timeView = new Element('div', {className: 'timepicker'}),
                    content = new Element('ul', {className: 'list-unstyled'}),
                    toolbar = new Element('li', {className: 'picker-switch' + (options.collapse ? ' accordion-toggle' : '')}).update(getToolbar());

                $A(getDatePickerTemplate()).each(function(el){
                    dateView.insert(el);
                });

                $A(getTimePickerTemplate()).each(function(el){
                    timeView.insert(el);
                });

                if (options.inline) {
                    template.removeClassName('dropdown-menu');
                }

                if (use24Hours) {
                    template.addClassName('usetwentyfour');
                }

                if (isEnabled('s') && !use24Hours) {
                    template.addClassName('wider');
                }

                if (options.sideBySide && hasDate() && hasTime()){
                    template.addClassName('timepicker-sbs');
                    if (options.toolbarPlacement === 'top') {
                        template.insert(toolbar);
                    }
                    template.insert(
                        new Element('div', {className:'row'})
                            .insert(dateView.addClassName('col-md-6'))
                            .insert(timeView.addClassName('col-md-6'))
                    );
                    if (options.toolbarPlacement === 'bottom'){
                        template.insert(toolbar);
                    }
                    return template;
                }

                if (options.toolbarPlacement === 'top'){
                    content.insert(toolbar);
                }
                if (hasDate()){
                    content.insert(new Element('li', {className: (options.collapse && hasTime() ? 'collapse in' : '')}).update(dateView));
                }
                if (options.toolbarPlacement === 'default'){
                    content.insert(toolbar);
                }
                if (hasTime()){
                    content.insert(new Element('li', {className: (options.collapse && hasDate() ? 'collapse' : '')}).update(timeView));
                }
                if (options.toolbarPlacement === 'bottom'){
                    content.insert(toolbar);
                }
                return template.insert(content);
            },

            dataToOptions = function(){
                var dateOptions,
                    dataOptions = {};

                if (element.match('input') || options.inline) {
                    dateOptions = element.retrieve('dateoptions');
                } else {
                    dateOptions = element.select('input').first().retrieve('dateoptions');
                }

                if (dateOptions && dateOptions instanceof Object) {
                    dataOptions = Object.extend(dataOptions, dateOptions);
                }

                $A(options).each(function (key){
                    var attributeName = 'date' + key.charAt(0).toUpperCase() + key.slice(1);
                    if (dateOptions[attributeName] !== undefined) {
                        dataOptions[key] = dateOptions[attributeName];
                    }
                });
                return dataOptions;
            },

            hasFocus = function (elem){
                return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && 
                    !!(elem.type || elem.href || ~elem.tabIndex);
            },

            falseFn = function (e){
                e.stop();
                return false;
            },

            place = function () {
                var eLayout = (component || element).getLayout(true),
                    position = { top: eLayout.get('top'), left: eLayout.get('left') },
                    offset = (component || element).cumulativeOffset(),
                    vertical = options.widgetPositioning.vertical,
                    horizontal = options.widgetPositioning.horizontal,
                    parent;

                /*if (options.widgetParent) {
                    parent = options.widgetParent.insert(widget);
                } else if (element.match('input')) {
                    parent = element.insert({after: widget}).up();
                } else if (options.inline) {
                    parent = element.insert(widget);
                    return;
                } else {
                    parent = element;
                    element.childElements().first().insert({after: widget});
                }*/
                component.insert(widget);
                parent = component;

                var windowSize = new WindowSize();
                var wLayout = widget.getLayout(true);
                var eOuterHeight = eLayout.get('height') + eLayout.get('border-box-height');
                var eOuterWidth = eLayout.get('width') + eLayout.get('border-box-width');
                // Top and bottom logic
                if (vertical === 'auto'){
                    if (offset.top + wLayout.get('height') * 1.5 >= windowSize.height() + windowSize.scrollTop() &&
                            wLayout.get('height') + eOuterHeight < offset.top){
                        vertical = 'top';
                    } else {
                        vertical = 'bottom';
                    }
                }

                var pLayout = parent.getLayout(true);
                var pOuterHeight = pLayout.get('height') + pLayout.get('border-box-height');
                var pOuterWidth = pLayout.get('width') + pLayout.get('border-box-width');
                // Left and right logic
                if (horizontal === 'auto'){
                    var outerWidth = wLayout.get('width') + wLayout.get('border-box-width');
                    if (pLayout.get('width') < offset.left + outerWidth / 2 &&
                            offset.left + outerWidth > windowSize.width()){
                        horizontal = 'right';
                    } else {
                        horizontal = 'left';
                    }
                }

                widget.addClassName('bottom');
                /*if (vertical === 'top') {
                    widget.addClassName('top').removeClassName('bottom');
                } else {
                    widget.addClassName('bottom').removeClassName('top');
                }*/

                widget.removeClassName('pull-right');
                /*
                if (horizontal === 'right') {
                    widget.addClassName('pull-right');
                } else {
                    widget.removeClassName('pull-right');
                }*/

                // find the first parent element that has a non-static css positioning
                if (parent.getStyle('position') === 'static'){
                    parent = parent.ancestors().filter(function (it) {
                        return $(it).getStyle('position') !== 'static';
                    }).first();
                }

                if (!parent) {
                    throw new Error('datetimepicker component should be placed within a non-static positioned container');
                }

                var parentsZindex = [0];
                widget.ancestors().each(function(a){
                    var itemZIndex = $(a).getStyle('z-index');
                    if (itemZIndex !== 'auto' && Number(itemZIndex) !== 0) parentsZindex.push(Number(itemZIndex));
                });
                var zIndex = Math.max.apply(Math, parentsZindex) + 10;
                //console.log([vertical, horizontal, position, eOuterHeight, pOuterHeight, pOuterWidth]);
                /*ToDo: Correct this to properly calculate positioning var style = {
                    top: vertical === 'top' ? 'auto' : (position.top + eOuterHeight)+'px',
                    bottom: vertical === 'top' ? (pOuterHeight - (parent === element ? 0 : position.top))+'px' : 'auto',
                    left: horizontal === 'left' ? (parent === element ? 0 : position.left)+'px' : 'auto',
                    right: horizontal === 'left' ? 'auto' : (pOuterWidth - eOuterWidth - (parent === element ? 0 : position.left))+'px',
                    zIndex: zIndex
                };*/

                var style = {
                    top: '26px',
                    left: 0,
                    right: 'auto',
                    bottom: 'auto',
                    zIndex: zIndex
                };
                //console.log(style);
                widget.setStyle(style);
            },

            notifyEvent = function (e) {
                if (e.type === 'dp:change' && ((e.date && e.date.isSame(e.oldDate)) || (!e.date && !e.oldDate))) {
                    return;
                }
                element.fire(e.type, e);
            },

            viewUpdate = function (e) {
                if (e === 'y') {
                    e = 'YYYY';
                }
                notifyEvent({
                    type: 'dp:update',
                    change: e,
                    viewDate: viewDate.clone()
                });
            },

            showMode = function (dir) {
                if (!widget) {
                    return;
                }
                if (dir){
                    currentViewMode = Math.max(minViewModeNumber, Math.min(3, currentViewMode + dir));
                }
                widget.select('.datepicker > div').each(function(el){
                    el.hide();
                    if (el.match('.datepicker-' + datePickerModes[currentViewMode].clsName)){
                        el.setStyle({display: 'block'});
                    }
                });
            },

            fillDow = function () {
                var row = new Element('tr'),
                    currentDate = viewDate.clone().startOf('w').startOf('d');

                if (options.calendarWeeks === true) {
                    row.insert(new Element('th', {className: 'cw'}).update('#'));
                }

                while (currentDate.isBefore(viewDate.clone().endOf('w'))) {
                    row.insert(new Element('th', {className: 'dow'}).update(currentDate.format('dd')));
                    currentDate.add(1, 'd');
                }
                widget.select('.datepicker-days thead').first().insert(row);
            },

            isInDisabledDates = function (testDate) {
                return options.disabledDates[testDate.format('YYYY-MM-DD')] === true;
            },

            isInEnabledDates = function (testDate) {
                return options.enabledDates[testDate.format('YYYY-MM-DD')] === true;
            },

            isInDisabledHours = function (testDate) {
                return options.disabledHours[testDate.format('H')] === true;
            },

            isInEnabledHours = function (testDate) {
                return options.enabledHours[testDate.format('H')] === true;
            },

            isValid = function (targetMoment, granularity) {
                if (!targetMoment.isValid()) {
                    return false;
                }
                if (options.disabledDates && granularity === 'd' && isInDisabledDates(targetMoment)) {
                    return false;
                }
                if (options.enabledDates && granularity === 'd' && !isInEnabledDates(targetMoment)) {
                    return false;
                }
                if (options.minDate && targetMoment.isBefore(options.minDate, granularity)) {
                    return false;
                }
                if (options.maxDate && targetMoment.isAfter(options.maxDate, granularity)) {
                    return false;
                }
                if (options.daysOfWeekDisabled && granularity === 'd' && options.daysOfWeekDisabled.indexOf(targetMoment.day()) !== -1) {
                    return false;
                }
                if (options.disabledHours && (granularity === 'h' || granularity === 'm' || granularity === 's') && isInDisabledHours(targetMoment)) {
                    return false;
                }
                if (options.enabledHours && (granularity === 'h' || granularity === 'm' || granularity === 's') && !isInEnabledHours(targetMoment)) {
                    return false;
                }
                if (options.disabledTimeIntervals && (granularity === 'h' || granularity === 'm' || granularity === 's')) {
                    var found = false;
                    $A(options.disabledTimeIntervals).each(function (it) {
                        if (targetMoment.isBetween(it[0], it[1])) {
                            found = true;
                            return false;
                        }
                    });
                    if (found) {
                        return false;
                    }
                }
                return true;
            },

            fillMonths = function () {
                var spans = [],
                    monthsShort = viewDate.clone().startOf('y').startOf('d'),
                    tdMonths = widget.select('.datepicker-months td').first();

                tdMonths.update('');
                while (monthsShort.isSame(viewDate, 'y')) {
                    //spans.push($('<span>').attr('data-action', 'selectMonth').addClassName('month').text(monthsShort.format('MMM')));
                    tdMonths.insert(new Element('span', {'data-action':'selectMonth', className: 'month'}).update(monthsShort.format('MMM')));
                    monthsShort.add(1, 'M');
                }
                //widget.find('.datepicker-months td').empty().append(spans);
            },

            updateMonths = function () {
                var monthsView = widget.select('.datepicker-months').first(),
                    monthsViewHeader = monthsView.select('th'),
                    months = monthsView.select('tbody').first().select('span');

                var mvh0 = Prototype.Selector.find(monthsViewHeader, 'th', 0);
                if (mvh0 && mvh0.down('span')) mvh0.down('span').writeAttribute('title', options.tooltips.prevYear);
                var mvh1 = Prototype.Selector.find(monthsViewHeader, 'th', 1);
                if (mvh1 && mvh1.down('span')) mvh1.down('span').writeAttribute('title', options.tooltips.selectYear);
                var mvh2 = Prototype.Selector.find(monthsViewHeader, 'th', 2);
                if (mvh2 && mvh2.down('span')) mvh2.down('span').writeAttribute('title', options.tooltips.nextYear);

                monthsView.select('.disabled').each(function(el){el.removeClassName('disabled');});

                if (!isValid(viewDate.clone().subtract(1, 'y'), 'y')) {
                    mvh0.addClassName('disabled');
                }

                mvh1.update(viewDate.year());

                if (!isValid(viewDate.clone().add(1, 'y'), 'y')) {
                    mvh2.addClassName('disabled');
                }

                months.each(function (el){el.removeClassName('active');});
                if (date.isSame(viewDate, 'y') && !unset) {
                    Prototype.Selector.find(months, 'span', date.month()).addClassName('active');
                }

                months.each(function (month, index) {
                    if (!isValid(viewDate.clone().month(index), 'M')) {
                        month.addClassName('disabled');
                    }
                });
            },

            updateYears = function () {
                var yearsView = widget.select('.datepicker-years').first(),
                    yearsViewHeader = yearsView.select('th'),
                    startYear = viewDate.clone().subtract(5, 'y'),
                    endYear = viewDate.clone().add(6, 'y'),
                    html = '';

                var yvh0 = Prototype.Selector.find(yearsViewHeader, 'th', 0);
                if (yvh0 && yvh0.down('span')) yvh0.down('span').writeAttribute('title', options.tooltips.prevDecade);
                var yvh1 = Prototype.Selector.find(yearsViewHeader, 'th', 1);
                if (yvh1 && yvh1.down('span')) yvh1.down('span').writeAttribute('title', options.tooltips.selectDecade);
                var yvh2 = Prototype.Selector.find(yearsViewHeader, 'th', 2);
                if (yvh1 && yvh2.down('span')) yvh2.down('span').writeAttribute('title', options.tooltips.nextDecade);

                yearsView.select('.disabled').each(function(el){el.removeClassName('disabled');});

                if (options.minDate && options.minDate.isAfter(startYear, 'y')) {
                    yvh0.addClassName('disabled');
                }

                yvh1.update(startYear.year() + '-' + endYear.year());

                if (options.maxDate && options.maxDate.isBefore(endYear, 'y')) {
                    yvh2.addClassName('disabled');
                }

                while (!startYear.isAfter(endYear, 'y')) {
                    html += '<span data-action="selectYear" class="year' + (startYear.isSame(date, 'y') && !unset ? ' active' : '') + (!isValid(startYear, 'y') ? ' disabled' : '') + '">' + startYear.year() + '</span>';
                    startYear.add(1, 'y');
                }

                yearsView.select('td').each(function(td){ td.update(html);});
            },

            updateDecades = function () {
                var decadesView = widget.select('.datepicker-decades').first(),
                    decadesViewHeader = decadesView.select('th'),
                    startDecade = moment({ y: viewDate.year() - (viewDate.year() % 100) - 1 }),
                    endDecade = startDecade.clone().add(100, 'y'),
                    startedAt = startDecade.clone(),
                    minDateDecade = false,
                    maxDateDecade = false,
                    endDecadeYear,
                    html = '';

                var dvh0 = Prototype.Selector.find(decadesViewHeader, 'th', 0);
                if (dvh0 && dvh0.down('span')) dvh0.down('span').writeAttribute('title', options.tooltips.prevCentury);
                var dvh1 = Prototype.Selector.find(decadesViewHeader, 'th', 1);
                var dvh2 = Prototype.Selector.find(decadesViewHeader, 'th', 2);
                if (dvh2 && dvh2.down('span')) dvh2.down('span').writeAttribute('title', options.tooltips.nextCentury);

                decadesView.select('.disabled').each(function(el){el.removeClassName('disabled');});

                if (startDecade.isSame(moment({ y: 1900 })) || (options.minDate && options.minDate.isAfter(startDecade, 'y'))) {
                    dvh0.addClassName('disabled');
                }

                dvh1.update(startDecade.year() + '-' + endDecade.year());

                if (startDecade.isSame(moment({ y: 2000 })) || (options.maxDate && options.maxDate.isBefore(endDecade, 'y'))) {
                    dvh2.addClassName('disabled');
                }

                while (!startDecade.isAfter(endDecade, 'y')) {
                    endDecadeYear = startDecade.year() + 12;
                    minDateDecade = options.minDate && options.minDate.isAfter(startDecade, 'y') && options.minDate.year() <= endDecadeYear;
                    maxDateDecade = options.maxDate && options.maxDate.isAfter(startDecade, 'y') && options.maxDate.year() <= endDecadeYear;
                    html += '<span data-action="selectDecade" class="decade' + (date.isAfter(startDecade) && date.year() <= endDecadeYear ? ' active' : '') +
                        (!isValid(startDecade, 'y') && !minDateDecade && !maxDateDecade ? ' disabled' : '') + '" data-selection="' + (startDecade.year() + 6) + '">' + (startDecade.year() + 1) + ' - ' + (startDecade.year() + 12) + '</span>';
                    startDecade.add(12, 'y');
                }
                html += '<span></span><span></span><span></span>'; //push the dangling block over, at least this way it's even

                decadesView.select('td').each(function(td){td.update(html);});
                dvh1.update((startedAt.year() + 1) + '-' + (startDecade.year()));
            },

            fillDate = function () {
                var daysView = widget.select('.datepicker-days').first(),
                    daysViewHeader = daysView.select('th'),
                    currentDate,
                    html = [],
                    row,
                    clsNames = [],
                    i;

                if (!hasDate()) {
                    return;
                }
                var dvh0 = Prototype.Selector.find(daysViewHeader, 'th', 0);
                if (dvh0 && dvh0.down('span')) dvh0.down('span').writeAttribute('title', options.tooltips.prevMonth);
                var dvh1 = Prototype.Selector.find(daysViewHeader, 'th', 1);
                if (dvh1 && dvh1.down('span')) dvh1.down('span').writeAttribute('title', options.tooltips.selectMonth);
                var dvh2 = Prototype.Selector.find(daysViewHeader, 'th', 2);
                if (dvh2 && dvh2.down('span')) dvh2.down('span').writeAttribute('title', options.tooltips.nextMonth);

                daysView.select('.disabled').each(function(el) { el.removeClassName('disabled');});
                dvh1.update(viewDate.format(options.dayViewHeaderFormat));

                if (!isValid(viewDate.clone().subtract(1, 'M'), 'M')) {
                    dvh0.addClassName('disabled');
                }
                if (!isValid(viewDate.clone().add(1, 'M'), 'M')) {
                    dvh2.addClassName('disabled');
                }

                currentDate = viewDate.clone().startOf('M').startOf('w').startOf('d');

                for (i = 0; i < 42; i++) { //always display 42 days (should show 6 weeks)
                    if (currentDate.weekday() === 0) {
                        row = new Element('tr');
                        if (options.calendarWeeks) {
                            row.insert('<td class="cw">' + currentDate.week() + '</td>');
                        }
                        html.push(row);
                    }
                    clsNames = ['day'];
                    if (currentDate.isBefore(viewDate, 'M')) {
                        clsNames.push('old');
                    }
                    if (currentDate.isAfter(viewDate, 'M')) {
                        clsNames.push('new');
                    }
                    if (currentDate.isSame(date, 'd') && !unset) {
                        clsNames.push('active');
                    }
                    if (!isValid(currentDate, 'd')) {
                        clsNames.push('disabled');
                    }
                    if (currentDate.isSame(getMoment(), 'd')) {
                        clsNames.push('today');
                    }
                    if (currentDate.day() === 0 || currentDate.day() === 6) {
                        clsNames.push('weekend');
                    }
                    notifyEvent({
                        type: 'dp:classify',
                        date: currentDate,
                        classNames: clsNames
                    });
                    row.insert('<td data-action="selectDay" data-day="' + currentDate.format('L') + '" class="' + clsNames.join(' ') + '">' + currentDate.date() + '</td>');
                    currentDate.add(1, 'd');
                }

                var tbody = daysView.select('tbody').first().update('');
                $A(html).each(function (it){
                    tbody.insert(it);
                })

                updateMonths();
                updateYears();
                updateDecades();
            },

            fillHours = function () {
                var table = widget.select('.timepicker-hours table').first(),
                    currentHour = viewDate.clone().startOf('d'),
                    html = [],
                    row = new Element('tr');

                if (viewDate.hour() > 11 && !use24Hours) {
                    currentHour.hour(12);
                }
                while (currentHour.isSame(viewDate, 'd') && (use24Hours || (viewDate.hour() < 12 && currentHour.hour() < 12) || viewDate.hour() > 11)) {
                    if (currentHour.hour() % 4 === 0) {
                        row = new Element('tr');
                        html.push(row);
                    }
                    row.insert('<td data-action="selectHour" class="hour' + (!isValid(currentHour, 'h') ? ' disabled' : '') + '">' + currentHour.format(use24Hours ? 'HH' : 'hh') + '</td>');
                    currentHour.add(1, 'h');
                }
                table.update('');
                $A(html).each(function (r){table.insert(r);});
            },

            fillMinutes = function () {
                var table = widget.select('.timepicker-minutes table').first(),
                    currentMinute = viewDate.clone().startOf('h'),
                    html = [],
                    row = new Element('tr'),
                    step = options.stepping === 1 ? 5 : options.stepping;

                while (viewDate.isSame(currentMinute, 'h')) {
                    if (currentMinute.minute() % (step * 4) === 0) {
                        row = new Element('tr');
                        html.push(row);
                    }
                    row.insert('<td data-action="selectMinute" class="minute' + (!isValid(currentMinute, 'm') ? ' disabled' : '') + '">' + currentMinute.format('mm') + '</td>');
                    currentMinute.add(step, 'm');
                }
                table.update('');
                $A(html).each(function(r){table.insert(r);});
            },

            fillSeconds = function () {
                var table = widget.select('.timepicker-seconds table').first(),
                    currentSecond = viewDate.clone().startOf('m'),
                    html = [],
                    row = new Element('tr');

                if (!table) return;

                while (viewDate.isSame(currentSecond, 'm')) {
                    if (currentSecond.second() % 20 === 0) {
                        row = new Element('tr');
                        html.push(row);
                    }
                    row.insert('<td data-action="selectSecond" class="second' + (!isValid(currentSecond, 's') ? ' disabled' : '') + '">' + currentSecond.format('ss') + '</td>');
                    currentSecond.add(5, 's');
                }

                table.update('');
                $A(html).each(function(r){table.insert(r);});
            },

            fillTime = function () {
                var toggle, newDate, timeComponents = widget.select('.timepicker span[data-time-component]');

                if (!use24Hours) {
                    toggle = widget.select('.timepicker [data-action=togglePeriod]').first();
                    newDate = date.clone().add((date.hours() >= 12) ? -12 : 12, 'h');

                    toggle.update(date.format('A'));

                    if (isValid(newDate, 'h')) {
                        toggle.removeClassName('disabled');
                    } else {
                        toggle.addClassName('disabled');
                    }
                }
                timeComponents.each(function(tc){
                    if (tc.match('[data-time-component=hours]')){
                        tc.update(date.format(use24Hours ? 'HH' : 'hh'));
                    }
                    if (tc.match('[data-time-component=minute]')){
                        tc.update(date.format('mm'));
                    }
                    if (tc.match('[data-time-component=seconds]')){
                        tc.update(date.format(date.format('ss')));
                    }
                })

                if (isEnabled('h')) fillHours();
                if (isEnabled('m')) fillMinutes();
                if (isEnabled('s')) fillSeconds();
            },

            update = function () {
                if (!widget) {
                    return;
                }
                fillDate();
                fillTime();
            },

            setValue = function (targetMoment) {
                var oldDate = unset ? null : date;

                // case of calling setValue(null or false)
                if (!targetMoment) {
                    unset = true;
                    input.setValue('');
                    input.store(date, '');
                    element.store('date', '');
                    notifyEvent({
                        type: 'dp:change',
                        date: false,
                        oldDate: oldDate
                    });
                    update();
                    return;
                }

                targetMoment = targetMoment.clone().locale(options.locale);

                if (hasTimeZone()) {
                    targetMoment.tz(options.timeZone);
                }

                if (options.stepping !== 1) {
                    targetMoment.minutes((Math.round(targetMoment.minutes() / options.stepping) * options.stepping)).seconds(0);

                    while (options.minDate && targetMoment.isBefore(options.minDate)) {
                        targetMoment.add(options.stepping, 'minutes');
                    }
                }

                if (isValid(targetMoment)) {
                    date = targetMoment;
                    viewDate = date.clone();
                    input.setValue(date.format(actualFormat));
                    element.store('date', date.format(actualFormat));
                    input.store('date', date.toISOString());
                    unset = false;
                    update();
                    notifyEvent({
                        type: 'dp:change',
                        date: date.clone(),
                        oldDate: oldDate
                    });
                } else {
                    if (!options.keepInvalid) {
                        Form.Element.setValue(input, unset ? '' : date.format(actualFormat));
                    } else {
                        notifyEvent({
                            type: 'dp:change',
                            date: targetMoment,
                            oldDate: oldDate
                        });
                    }
                    notifyEvent({
                        type: 'dp:error',
                        date: targetMoment,
                        oldDate: oldDate
                    });
                }
            },

            ///
            // Hides the widget. Possibly will emit dp:hide
            //
            hide = function () {
                var transitioning = false;
                if (!widget) {
                    return picker;
                }
                // Ignore event if in the middle of a picker transition
                widget.select('.collapse').each(function (it) {
                    var collapseData = it.retrieve('collapse');
                    if (collapseData && collapseData.transitioning) {
                        transitioning = true;
                        return false;
                    }
                    return true;
                });
                if (transitioning) {
                    return picker;
                }
                if (component && component.hasClassName('btn')) {
                    component.toggleClassName('active');
                }
                widget.hide();

                Event.stopObserving(window, 'resize', place);
                widget.stopObserving('click', doAction);
                widget.stopObserving('mousedown', falseFn);

                widget.remove();
                widget = false;

                notifyEvent({
                    type: 'dp:hide',
                    date: date.clone()
                });

                input.blur();

                viewDate = date.clone();

                return picker;
            },

            clear = function () {
                setValue(null);
            },

            parseInputDate = function (inputDate) {
                if (options.parseInputDate === undefined) {
                    if (!moment.isMoment(inputDate) || inputDate instanceof Date) {
                        inputDate = getMoment(inputDate);
                    }
                } else {
                    inputDate = options.parseInputDate(inputDate);
                }
                //inputDate.locale(options.locale);
                return inputDate;
            },

            /********************************************************************************
             *
             * Widget UI interaction functions
             *
             ********************************************************************************/
            
            actions = {
                next: function () {
                    var navFnc = datePickerModes[currentViewMode].navFnc;
                    viewDate.add(datePickerModes[currentViewMode].navStep, navFnc);
                    fillDate();
                    viewUpdate(navFnc);
                },

                previous: function () {
                    var navFnc = datePickerModes[currentViewMode].navFnc;
                    viewDate.subtract(datePickerModes[currentViewMode].navStep, navFnc);
                    fillDate();
                    viewUpdate(navFnc);
                },

                pickerSwitch: function () {
                    showMode(1);
                },

                selectMonth: function (e) {
                    //var month = $(e.target).closest('tbody').find('span').index($(e.target));
                    var month = $(e.target).previousSiblings().size(); 
                    viewDate.month(month);
                    if (currentViewMode === minViewModeNumber) {
                        setValue(date.clone().year(viewDate.year()).month(viewDate.month()));
                        if (!options.inline) {
                            hide();
                        }
                    } else {
                        showMode(-1);
                        fillDate();
                    }
                    viewUpdate('M');
                },

                selectYear: function (e) {
                    var year = parseInt($(e.target).innerText, 10) || 0;
                    viewDate.year(year);
                    if (currentViewMode === minViewModeNumber) {
                        setValue(date.clone().year(viewDate.year()));
                        if (!options.inline) {
                            hide();
                        }
                    } else {
                        showMode(-1);
                        fillDate();
                    }
                    viewUpdate('YYYY');
                },

                selectDecade: function (e) {
                    var year = parseInt($(e.target).readAttribute('data-selection'), 10) || 0;
                    viewDate.year(year);
                    if (currentViewMode === minViewModeNumber) {
                        setValue(date.clone().year(viewDate.year()));
                        if (!options.inline) {
                            hide();
                        }
                    } else {
                        showMode(-1);
                        fillDate();
                    }
                    viewUpdate('YYYY');
                },

                selectDay: function (e) {
                    var day = viewDate.clone();
                    if ($(e.target).match('.old')) {
                        day.subtract(1, 'M');
                    }
                    if ($(e.target).match('.new')) {
                        day.add(1, 'M');
                    }
                    setValue(day.date(parseInt($(e.target).innerText, 10)));
                    if (!hasTime() && !options.keepOpen && !options.inline) {
                        hide();
                    }
                },

                incrementHours: function () {
                    var newDate = date.clone().add(1, 'h');
                    if (isValid(newDate, 'h')) {
                        setValue(newDate);
                    }
                },

                incrementMinutes: function () {
                    var newDate = date.clone().add(options.stepping, 'm');
                    if (isValid(newDate, 'm')) {
                        setValue(newDate);
                    }
                },

                incrementSeconds: function () {
                    var newDate = date.clone().add(1, 's');
                    if (isValid(newDate, 's')) {
                        setValue(newDate);
                    }
                },

                decrementHours: function () {
                    var newDate = date.clone().subtract(1, 'h');
                    if (isValid(newDate, 'h')) {
                        setValue(newDate);
                    }
                },

                decrementMinutes: function () {
                    var newDate = date.clone().subtract(options.stepping, 'm');
                    if (isValid(newDate, 'm')) {
                        setValue(newDate);
                    }
                },

                decrementSeconds: function () {
                    var newDate = date.clone().subtract(1, 's');
                    if (isValid(newDate, 's')) {
                        setValue(newDate);
                    }
                },

                togglePeriod: function () {
                    setValue(date.clone().add((date.hours() >= 12) ? -12 : 12, 'h'));
                },

                togglePicker: function (e) {
                    var $this = $(e.target),
                        $parent = $this.up('ul'),
                        expanded = $parent.select('.in').first(),
                        closed = $parent.select('.collapse:not(.in)').first(),
                        collapseData;
                    
                    if (expanded) {
                        collapseData = expanded.retrieve('collapse');
                        if (collapseData && collapseData.transitioning) {
                            return;
                        }

                        expanded.removeClassName('in');
                        closed.addClassName('in');

                        if ($this.match('span')) {
                            $this.toggleClassName(options.icons.time + ' ' + options.icons.date);
                        } else {
                            $this.down('span').toggleClassName(options.icons.time + ' ' + options.icons.date);
                        }

                        // NOTE: uncomment if toggled state will be restored in show()
                        //if (component) {
                        //    component.find('span').toggleClass(options.icons.time + ' ' + options.icons.date);
                        //}
                    }
                },

                showPicker: function () {
                    widget.select('.timepicker > div:not(.timepicker-picker)').each(function(el){el.hide();});
                    widget.down('.timepicker .timepicker-picker').show();
                },

                showHours: function () {
                    widget.down('.timepicker .timepicker-picker').hide();
                    widget.down('.timepicker .timepicker-hours').show();
                },

                showMinutes: function () {
                    widget.down('.timepicker .timepicker-picker').hide();
                    widget.down('.timepicker .timepicker-minutes').show();
                },

                showSeconds: function () {
                    widget.down('.timepicker .timepicker-picker').hide();
                    widget.down('.timepicker .timepicker-seconds').show();
                },

                selectHour: function (e) {
                    var hour = parseInt($(e.target).innerText, 10);

                    if (!use24Hours) {
                        if (date.hours() >= 12) {
                            if (hour !== 12) {
                                hour += 12;
                            }
                        } else {
                            if (hour === 12) {
                                hour = 0;
                            }
                        }
                    }
                    setValue(date.clone().hours(hour));
                    actions.showPicker.call(picker);
                },

                selectMinute: function (e) {
                    setValue(date.clone().minutes(parseInt($(e.target).innerText, 10)));
                    actions.showPicker.call(picker);
                },

                selectSecond: function (e) {
                    setValue(date.clone().seconds(parseInt($(e.target).innerText, 10)));
                    actions.showPicker.call(picker);
                },

                clear: clear,

                today: function () {
                    var todaysDate = getMoment();
                    if (isValid(todaysDate, 'd')) {
                        setValue(todaysDate);
                    }
                },

                close: hide
            },

            doAction = function (e) {
                var actionEl = e.findElement('[data-action]');
                if (!actionEl) return false;
                if ($(e.target).match('.disabled')){
                    return false;
                }
                actions[actionEl.readAttribute('data-action')].apply(picker, arguments);
                return false;
            },

            ///
            // Shows the widget. Possibly will emit dp:show and dp:change
            ///
            show = function () {
                var currentMoment,
                    useCurrentGranularity = {
                        'year': function (m) {
                            return m.month(0).date(1).hours(0).seconds(0).minutes(0);
                        },
                        'month': function (m) {
                            return m.date(1).hours(0).seconds(0).minutes(0);
                        },
                        'day': function (m) {
                            return m.hours(0).seconds(0).minutes(0);
                        },
                        'hour': function (m) {
                            return m.seconds(0).minutes(0);
                        },
                        'minute': function (m) {
                            return m.seconds(0);
                        }
                    };

                if (input.readAttribute('disabled') || (!options.ignoreReadonly && input.readAttribute('readonly')) || widget) {
                    return picker;
                }
                var val = input.retrieve('date');
                if (!val){
                    val = $F(input);
                }

                if (val !== undefined && val.trim().length !== 0) {
                    setValue(parseInputDate(val.trim()));
                } else if (unset && options.useCurrent && (options.inline || (input.match('input') && val.trim().length === 0))) {
                    currentMoment = getMoment();
                    if (typeof options.useCurrent === 'string') {
                        currentMoment = useCurrentGranularity[options.useCurrent](currentMoment);
                    }
                    setValue(currentMoment);
                }
                widget = getTemplate();

                fillDow();
                fillMonths();

                widget.down('.timepicker-hours') && widget.down('.timepicker-hours').hide();
                widget.down('.timepicker-minutes') && widget.down('.timepicker-minutes').hide();
                widget.down('.timepicker-seconds') && widget.down('.timepicker-seconds').hide(); //ToDo: Enable this when safe

                update();
                showMode();

                Event.observe(window, 'resize', place);
                widget.observe('click', doAction); // this handles clicks on the widget
                widget.observe('mousedown', falseFn);

                if (component && component.hasClassName('btn')) {
                    component.toggleClassName('active');
                }
                place();
                if (options.focusOnShow && !hasFocus(input)) {
                    //return elem === document.activeElement && ( elem.type || elem.href );
                    input.focus();
                }

                notifyEvent({
                    type: 'dp:show'
                });
                return picker;
            },            
            ///
            // Shows or hides the widget
            ///            
            toggle = function () {
                return (widget ? hide() : show());
            },

            keydown = function (e) {
                var handler = null,
                    index,
                    index2,
                    pressedKeys = [],
                    pressedModifiers = {},
                    currentKey = e.which,
                    keyBindKeys,
                    allModifiersPressed,
                    pressed = 'p';

                keyState[currentKey] = pressed;

                for (index in keyState) {
                    if (keyState.hasOwnProperty(index) && keyState[index] === pressed) {
                        pressedKeys.push(index);
                        if (parseInt(index, 10) !== currentKey) {
                            pressedModifiers[index] = true;
                        }
                    }
                }

                for (index in options.keyBinds) {
                    if (options.keyBinds.hasOwnProperty(index) && typeof (options.keyBinds[index]) === 'function') {
                        keyBindKeys = index.split(' ');
                        if (keyBindKeys.length === pressedKeys.length && keyMap[currentKey] === keyBindKeys[keyBindKeys.length - 1]) {
                            allModifiersPressed = true;
                            for (index2 = keyBindKeys.length - 2; index2 >= 0; index2--) {
                                if (!(keyMap[keyBindKeys[index2]] in pressedModifiers)) {
                                    allModifiersPressed = false;
                                    break;
                                }
                            }
                            if (allModifiersPressed) {
                                handler = options.keyBinds[index];
                                break;
                            }
                        }
                    }
                }

                if (handler) {
                    handler.call(picker, widget);
                    e.stopPropagation();
                    e.preventDefault();
                }
            },

            keyup = function (e) {
                keyState[e.which] = 'r';
                e.stopPropagation();
                e.preventDefault();
            },

            change = function (e) {
                var val = $F($(e.target)).trim(),
                    parsedDate = val ? parseInputDate(val) : null;
                setValue(parsedDate);
                e.stopImmediatePropagation();
                return false;
            },

            attachDatePickerElementEvents = function () {
                input.observe('change', change);
                input.observe('blur', options.debug ? Prototype.emptyFunction : hide);
                input.observe('keydown', keydown);
                input.observe('keyup', keyup);
                input.observe('focus', options.allowInputToggle ? show : Prototype.emptyFunction);

                if (element.match('input')) {
                    input.observe('focus', show);
                } else if (component) {
                    component.observe('click', toggle);
                    component.observe('mousedown', falseFn);
                }
            },/*

            detachDatePickerElementEvents = function () {
                input.off({
                    'change': change,
                    'blur': blur,
                    'keydown': keydown,
                    'keyup': keyup,
                    'focus': options.allowInputToggle ? hide : ''
                });

                if (element.is('input')) {
                    input.off({
                        'focus': show
                    });
                } else if (component) {
                    component.off('click', toggle);
                    component.off('mousedown', false);
                }
            },

            indexGivenDates = function (givenDatesArray) {
                // Store given enabledDates and disabledDates as keys.
                // This way we can check their existence in O(1) time instead of looping through whole array.
                // (for example: options.enabledDates['2014-02-27'] === true)
                var givenDatesIndexed = {};
                $.each(givenDatesArray, function () {
                    var dDate = parseInputDate(this);
                    if (dDate.isValid()) {
                        givenDatesIndexed[dDate.format('YYYY-MM-DD')] = true;
                    }
                });
                return (Object.keys(givenDatesIndexed).length) ? givenDatesIndexed : false;
            },

            indexGivenHours = function (givenHoursArray) {
                // Store given enabledHours and disabledHours as keys.
                // This way we can check their existence in O(1) time instead of looping through whole array.
                // (for example: options.enabledHours['2014-02-27'] === true)
                var givenHoursIndexed = {};
                $.each(givenHoursArray, function () {
                    givenHoursIndexed[this] = true;
                });
                return (Object.keys(givenHoursIndexed).length) ? givenHoursIndexed : false;
            },*/

            initFormatting = function () {
                var format = options.format || 'L LT';
                actualFormat = format.replace(/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g, function (formatInput) {
                    var newinput = date.localeData().longDateFormat(formatInput) || formatInput;
                    return newinput.replace(/(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g, function (formatInput2) { //temp fix for #740
                        return date.localeData().longDateFormat(formatInput2) || formatInput2;
                    });
                });

                parseFormats = options.extraFormats ? options.extraFormats.slice() : [];
                if (parseFormats.indexOf(format) < 0 && parseFormats.indexOf(actualFormat) < 0){
                    parseFormats.push(actualFormat);
                }

                use24Hours = (actualFormat.toLowerCase().indexOf('a') < 1 && actualFormat.replace(/\[.*?\]/g, '').indexOf('h') < 1);

                if (isEnabled('y')){
                    minViewModeNumber = 2;
                }
                if (isEnabled('M')){
                    minViewModeNumber = 1;
                }
                if (isEnabled('d')){
                    minViewModeNumber = 0;
                }

                currentViewMode = Math.max(minViewModeNumber, currentViewMode);

                if (!unset) {
                    setValue(date);
                }
            };

        /********************************************************************************
         *
         * Public API functions
         * =====================
         *
         * Important: Do not expose direct references to private objects or the options
         * object to the outer world. Always return a clone when returning values or make
         * a clone when setting a private variable.
         *
         ********************************************************************************/
        picker.destroy = function () {
            ///<summary>Destroys the widget and removes all attached event listeners</summary>
            hide();
            detachDatePickerElementEvents();
            //element.removeData('DateTimePicker');
            //element.removeData('date');
        };

        picker.toggle = toggle;

        picker.show = show;

        picker.hide = hide;

        picker.disable = function () {
            ///<summary>Disables the input element, the component is attached to, by adding a disabled="true" attribute to it.
            ///If the widget was visible before that call it is hidden. Possibly emits dp:hide</summary>
            hide();
            if (component && component.hasClassName('btn')) {
                component.addClassName('disabled');
            }
            input.prop('disabled', true);
            return picker;
        };

        picker.enable = function () {
            ///<summary>Enables the input element, the component is attached to, by removing disabled attribute from it.</summary>
            if (component && component.hasClassName('btn')) {
                component.removeClassName('disabled');
            }
            input.prop('disabled', false);
            return picker;
        };

        picker.ignoreReadonly = function (ignoreReadonly) {
            if (arguments.length === 0) {
                return options.ignoreReadonly;
            }
            if (typeof ignoreReadonly !== 'boolean') {
                throw new TypeError('ignoreReadonly () expects a boolean parameter');
            }
            options.ignoreReadonly = ignoreReadonly;
            return picker;
        };

        picker.options = function (newOptions) {
            if (arguments.length === 0) {
                return Object.extend({}, options);
            }

            if (!(newOptions instanceof Object)) {
                throw new TypeError('options() options parameter should be an object');
            }
            Object.extend(options, newOptions);
            $H(options).each(function (pair) {
                if (picker[pair.key] !== undefined) {
                    picker[pair.key](pair.value);
                } else {
                    throw new TypeError('option ' + key + ' is not recognized!');
                }
            });
            return picker;
        };

        picker.date = function (newDate) {
            ///<signature helpKeyword="$.fn.datetimepicker.date">
            ///<summary>Returns the component's model current date, a moment object or null if not set.</summary>
            ///<returns type="Moment">date.clone()</returns>
            ///</signature>
            ///<signature>
            ///<summary>Sets the components model current moment to it. Passing a null value unsets the components model current moment. Parsing of the newDate parameter is made using moment library with the options.format and options.useStrict components configuration.</summary>
            ///<param name="newDate" locid="$.fn.datetimepicker.date_p:newDate">Takes string, Date, moment, null parameter.</param>
            ///</signature>
            if (arguments.length === 0) {
                if (unset) {
                    return null;
                }
                return date.clone();
            }

            if (newDate !== null && typeof newDate !== 'string' && !moment.isMoment(newDate) && !(newDate instanceof Date)) {
                throw new TypeError('date() parameter must be one of [null, string, moment or Date]');
            }

            setValue(newDate === null ? null : parseInputDate(newDate));
            return picker;
        };

        picker.format = function (newFormat) {
            ///<summary>test su</summary>
            ///<param name="newFormat">info about para</param>
            ///<returns type="string|boolean">returns foo</returns>
            if (arguments.length === 0) {
                return options.format;
            }

            if ((typeof newFormat !== 'string') && ((typeof newFormat !== 'boolean') || (newFormat !== false))) {
                throw new TypeError('format() expects a string or boolean:false parameter ' + newFormat);
            }

            options.format = newFormat;
            if (actualFormat) {
                initFormatting(); // reinit formatting
            }
            return picker;
        };

        picker.timeZone = function (newZone) {
            if (arguments.length === 0) {
                return options.timeZone;
            }

            if (typeof newZone !== 'string') {
                throw new TypeError('newZone() expects a string parameter');
            }

            options.timeZone = newZone;

            return picker;
        };

        picker.dayViewHeaderFormat = function (newFormat) {
            if (arguments.length === 0) {
                return options.dayViewHeaderFormat;
            }

            if (typeof newFormat !== 'string') {
                throw new TypeError('dayViewHeaderFormat() expects a string parameter');
            }

            options.dayViewHeaderFormat = newFormat;
            return picker;
        };

        picker.extraFormats = function (formats) {
            if (arguments.length === 0) {
                return options.extraFormats;
            }

            if (formats !== false && !(formats instanceof Array)) {
                throw new TypeError('extraFormats() expects an array or false parameter');
            }

            options.extraFormats = formats;
            if (parseFormats) {
                initFormatting(); // reinit formatting
            }
            return picker;
        };

        picker.disabledDates = function (dates) {
            ///<signature helpKeyword="$.fn.datetimepicker.disabledDates">
            ///<summary>Returns an array with the currently set disabled dates on the component.</summary>
            ///<returns type="array">options.disabledDates</returns>
            ///</signature>
            ///<signature>
            ///<summary>Setting this takes precedence over options.minDate, options.maxDate configuration. Also calling this function removes the configuration of
            ///options.enabledDates if such exist.</summary>
            ///<param name="dates" locid="$.fn.datetimepicker.disabledDates_p:dates">Takes an [ string or Date or moment ] of values and allows the user to select only from those days.</param>
            ///</signature>
            if (arguments.length === 0) {
                return (options.disabledDates ? Object.extend({}, options.disabledDates) : options.disabledDates);
            }

            if (!dates) {
                options.disabledDates = false;
                update();
                return picker;
            }
            if (!(dates instanceof Array)) {
                throw new TypeError('disabledDates() expects an array parameter');
            }
            options.disabledDates = indexGivenDates(dates);
            options.enabledDates = false;
            update();
            return picker;
        };

        picker.enabledDates = function (dates) {
            ///<signature helpKeyword="$.fn.datetimepicker.enabledDates">
            ///<summary>Returns an array with the currently set enabled dates on the component.</summary>
            ///<returns type="array">options.enabledDates</returns>
            ///</signature>
            ///<signature>
            ///<summary>Setting this takes precedence over options.minDate, options.maxDate configuration. Also calling this function removes the configuration of options.disabledDates if such exist.</summary>
            ///<param name="dates" locid="$.fn.datetimepicker.enabledDates_p:dates">Takes an [ string or Date or moment ] of values and allows the user to select only from those days.</param>
            ///</signature>
            if (arguments.length === 0) {
                return (options.enabledDates ? Object.extend({}, options.enabledDates) : options.enabledDates);
            }

            if (!dates) {
                options.enabledDates = false;
                update();
                return picker;
            }
            if (!(dates instanceof Array)) {
                throw new TypeError('enabledDates() expects an array parameter');
            }
            options.enabledDates = indexGivenDates(dates);
            options.disabledDates = false;
            update();
            return picker;
        };

        picker.daysOfWeekDisabled = function (daysOfWeekDisabled) {
            if (arguments.length === 0) {
                return options.daysOfWeekDisabled.splice(0);
            }

            if ((typeof daysOfWeekDisabled === 'boolean') && !daysOfWeekDisabled) {
                options.daysOfWeekDisabled = false;
                update();
                return picker;
            }

            if (!(daysOfWeekDisabled instanceof Array)) {
                throw new TypeError('daysOfWeekDisabled() expects an array parameter');
            }
            options.daysOfWeekDisabled = daysOfWeekDisabled.reduce(function (previousValue, currentValue) {
                currentValue = parseInt(currentValue, 10);
                if (currentValue > 6 || currentValue < 0 || isNaN(currentValue)) {
                    return previousValue;
                }
                if (previousValue.indexOf(currentValue) === -1) {
                    previousValue.push(currentValue);
                }
                return previousValue;
            }, []).sort();
            if (options.useCurrent && !options.keepInvalid) {
                var tries = 0;
                while (!isValid(date, 'd')) {
                    date.add(1, 'd');
                    if (tries === 31) {
                        throw 'Tried 31 times to find a valid date';
                    }
                    tries++;
                }
                setValue(date);
            }
            update();
            return picker;
        };

        picker.maxDate = function (maxDate) {
            if (arguments.length === 0) {
                return options.maxDate ? options.maxDate.clone() : options.maxDate;
            }

            if ((typeof maxDate === 'boolean') && maxDate === false) {
                options.maxDate = false;
                update();
                return picker;
            }

            if (typeof maxDate === 'string') {
                if (maxDate === 'now' || maxDate === 'moment') {
                    maxDate = getMoment();
                }
            }

            var parsedDate = parseInputDate(maxDate);

            if (!parsedDate.isValid()) {
                throw new TypeError('maxDate() Could not parse date parameter: ' + maxDate);
            }
            if (options.minDate && parsedDate.isBefore(options.minDate)) {
                throw new TypeError('maxDate() date parameter is before options.minDate: ' + parsedDate.format(actualFormat));
            }
            options.maxDate = parsedDate;
            if (options.useCurrent && !options.keepInvalid && date.isAfter(maxDate)) {
                setValue(options.maxDate);
            }
            if (viewDate.isAfter(parsedDate)) {
                viewDate = parsedDate.clone().subtract(options.stepping, 'm');
            }
            update();
            return picker;
        };

        picker.minDate = function (minDate) {
            if (arguments.length === 0) {
                return options.minDate ? options.minDate.clone() : options.minDate;
            }

            if ((typeof minDate === 'boolean') && minDate === false) {
                options.minDate = false;
                update();
                return picker;
            }

            if (typeof minDate === 'string') {
                if (minDate === 'now' || minDate === 'moment') {
                    minDate = getMoment();
                }
            }

            var parsedDate = parseInputDate(minDate);

            if (!parsedDate.isValid()) {
                throw new TypeError('minDate() Could not parse date parameter: ' + minDate);
            }
            if (options.maxDate && parsedDate.isAfter(options.maxDate)) {
                throw new TypeError('minDate() date parameter is after options.maxDate: ' + parsedDate.format(actualFormat));
            }
            options.minDate = parsedDate;
            if (options.useCurrent && !options.keepInvalid && date.isBefore(minDate)) {
                setValue(options.minDate);
            }
            if (viewDate.isBefore(parsedDate)) {
                viewDate = parsedDate.clone().add(options.stepping, 'm');
            }
            update();
            return picker;
        };

        picker.defaultDate = function (defaultDate) {
            ///<signature helpKeyword="$.fn.datetimepicker.defaultDate">
            ///<summary>Returns a moment with the options.defaultDate option configuration or false if not set</summary>
            ///<returns type="Moment">date.clone()</returns>
            ///</signature>
            ///<signature>
            ///<summary>Will set the picker's inital date. If a boolean:false value is passed the options.defaultDate parameter is cleared.</summary>
            ///<param name="defaultDate" locid="$.fn.datetimepicker.defaultDate_p:defaultDate">Takes a string, Date, moment, boolean:false</param>
            ///</signature>
            if (arguments.length === 0) {
                return options.defaultDate ? options.defaultDate.clone() : options.defaultDate;
            }
            if (!defaultDate) {
                options.defaultDate = false;
                return picker;
            }

            if (typeof defaultDate === 'string') {
                if (defaultDate === 'now' || defaultDate === 'moment') {
                    defaultDate = getMoment();
                } else {
                    defaultDate = getMoment(defaultDate);
                }
            }

            var parsedDate = parseInputDate(defaultDate);
            if (!parsedDate.isValid()) {
                throw new TypeError('defaultDate() Could not parse date parameter: ' + defaultDate);
            }
            if (!isValid(parsedDate)) {
                throw new TypeError('defaultDate() date passed is invalid according to component setup validations');
            }

            options.defaultDate = parsedDate;

            if ((options.defaultDate && options.inline) || input.val().trim() === '') {
                setValue(options.defaultDate);
            }
            return picker;
        };

        picker.locale = function (locale) {
            if (arguments.length === 0) {
                return options.locale;
            }

            if (!moment.localeData(locale)) {
                throw new TypeError('locale() locale ' + locale + ' is not loaded from moment locales!');
            }

            options.locale = locale;
            date.locale(options.locale);
            viewDate.locale(options.locale);

            if (actualFormat) {
                initFormatting(); // reinit formatting
            }
            if (widget) {
                hide();
                show();
            }
            return picker;
        };

        picker.stepping = function (stepping) {
            if (arguments.length === 0) {
                return options.stepping;
            }

            stepping = parseInt(stepping, 10);
            if (isNaN(stepping) || stepping < 1) {
                stepping = 1;
            }
            options.stepping = stepping;
            return picker;
        };

        picker.useCurrent = function (useCurrent) {
            var useCurrentOptions = ['year', 'month', 'day', 'hour', 'minute'];
            if (arguments.length === 0) {
                return options.useCurrent;
            }

            if ((typeof useCurrent !== 'boolean') && (typeof useCurrent !== 'string')) {
                throw new TypeError('useCurrent() expects a boolean or string parameter');
            }
            if (typeof useCurrent === 'string' && useCurrentOptions.indexOf(useCurrent.toLowerCase()) === -1) {
                throw new TypeError('useCurrent() expects a string parameter of ' + useCurrentOptions.join(', '));
            }
            options.useCurrent = useCurrent;
            return picker;
        };

        picker.collapse = function (collapse) {
            if (arguments.length === 0) {
                return options.collapse;
            }

            if (typeof collapse !== 'boolean') {
                throw new TypeError('collapse() expects a boolean parameter');
            }
            if (options.collapse === collapse) {
                return picker;
            }
            options.collapse = collapse;
            if (widget) {
                hide();
                show();
            }
            return picker;
        };

        picker.icons = function (icons) {
            if (arguments.length === 0) {
                return Object.extend({}, options.icons);
            }

            if (!(icons instanceof Object)) {
                throw new TypeError('icons() expects parameter to be an Object');
            }
            Object.extend(options.icons, icons);
            if (widget) {
                hide();
                show();
            }
            return picker;
        };

        picker.tooltips = function (tooltips) {
            if (arguments.length === 0) {
                return Object.extend({}, options.tooltips);
            }

            if (!(tooltips instanceof Object)) {
                throw new TypeError('tooltips() expects parameter to be an Object');
            }
            Object.extend(options.tooltips, tooltips);
            if (widget) {
                hide();
                show();
            }
            return picker;
        };

        picker.useStrict = function (useStrict) {
            if (arguments.length === 0) {
                return options.useStrict;
            }

            if (typeof useStrict !== 'boolean') {
                throw new TypeError('useStrict() expects a boolean parameter');
            }
            options.useStrict = useStrict;
            return picker;
        };

        picker.sideBySide = function (sideBySide) {
            if (arguments.length === 0) {
                return options.sideBySide;
            }

            if (typeof sideBySide !== 'boolean') {
                throw new TypeError('sideBySide() expects a boolean parameter');
            }
            options.sideBySide = sideBySide;
            if (widget) {
                hide();
                show();
            }
            return picker;
        };

        picker.viewMode = function (viewMode) {
            if (arguments.length === 0) {
                return options.viewMode;
            }

            if (typeof viewMode !== 'string') {
                throw new TypeError('viewMode() expects a string parameter');
            }

            if (viewModes.indexOf(viewMode) === -1) {
                throw new TypeError('viewMode() parameter must be one of (' + viewModes.join(', ') + ') value');
            }

            options.viewMode = viewMode;
            currentViewMode = Math.max(viewModes.indexOf(viewMode), minViewModeNumber);

            showMode();
            return picker;
        };

        picker.toolbarPlacement = function (toolbarPlacement) {
            if (arguments.length === 0) {
                return options.toolbarPlacement;
            }

            if (typeof toolbarPlacement !== 'string') {
                throw new TypeError('toolbarPlacement() expects a string parameter');
            }
            if (toolbarPlacements.indexOf(toolbarPlacement) === -1) {
                throw new TypeError('toolbarPlacement() parameter must be one of (' + toolbarPlacements.join(', ') + ') value');
            }
            options.toolbarPlacement = toolbarPlacement;

            if (widget) {
                hide();
                show();
            }
            return picker;
        };

        picker.widgetPositioning = function (widgetPositioning) {
            if (arguments.length === 0) {
                return Object.extend({}, options.widgetPositioning);
            }

            if (({}).toString.call(widgetPositioning) !== '[object Object]') {
                throw new TypeError('widgetPositioning() expects an object variable');
            }
            if (widgetPositioning.horizontal) {
                if (typeof widgetPositioning.horizontal !== 'string') {
                    throw new TypeError('widgetPositioning() horizontal variable must be a string');
                }
                widgetPositioning.horizontal = widgetPositioning.horizontal.toLowerCase();
                if (horizontalModes.indexOf(widgetPositioning.horizontal) === -1) {
                    throw new TypeError('widgetPositioning() expects horizontal parameter to be one of (' + horizontalModes.join(', ') + ')');
                }
                options.widgetPositioning.horizontal = widgetPositioning.horizontal;
            }
            if (widgetPositioning.vertical) {
                if (typeof widgetPositioning.vertical !== 'string') {
                    throw new TypeError('widgetPositioning() vertical variable must be a string');
                }
                widgetPositioning.vertical = widgetPositioning.vertical.toLowerCase();
                if (verticalModes.indexOf(widgetPositioning.vertical) === -1) {
                    throw new TypeError('widgetPositioning() expects vertical parameter to be one of (' + verticalModes.join(', ') + ')');
                }
                options.widgetPositioning.vertical = widgetPositioning.vertical;
            }
            update();
            return picker;
        };

        picker.calendarWeeks = function (calendarWeeks) {
            if (arguments.length === 0) {
                return options.calendarWeeks;
            }

            if (typeof calendarWeeks !== 'boolean') {
                throw new TypeError('calendarWeeks() expects parameter to be a boolean value');
            }

            options.calendarWeeks = calendarWeeks;
            update();
            return picker;
        };

        picker.showTodayButton = function (showTodayButton) {
            if (arguments.length === 0) {
                return options.showTodayButton;
            }

            if (typeof showTodayButton !== 'boolean') {
                throw new TypeError('showTodayButton() expects a boolean parameter');
            }

            options.showTodayButton = showTodayButton;
            if (widget) {
                hide();
                show();
            }
            return picker;
        };

        picker.showClear = function (showClear) {
            if (arguments.length === 0) {
                return options.showClear;
            }

            if (typeof showClear !== 'boolean') {
                throw new TypeError('showClear() expects a boolean parameter');
            }

            options.showClear = showClear;
            if (widget) {
                hide();
                show();
            }
            return picker;
        };

        picker.widgetParent = function (widgetParent) {
            if (arguments.length === 0) {
                return options.widgetParent;
            }

            if (typeof widgetParent === 'string') {
                widgetParent = $(widgetParent);
            }

            if (widgetParent !== null && (typeof widgetParent !== 'string' && !(widgetParent instanceof Element))) {
                throw new TypeError('widgetParent() expects a string or a Element object parameter');
            }

            options.widgetParent = widgetParent;
            if (widget) {
                hide();
                show();
            }
            return picker;
        };

        picker.keepOpen = function (keepOpen) {
            if (arguments.length === 0) {
                return options.keepOpen;
            }

            if (typeof keepOpen !== 'boolean') {
                throw new TypeError('keepOpen() expects a boolean parameter');
            }

            options.keepOpen = keepOpen;
            return picker;
        };

        picker.focusOnShow = function (focusOnShow) {
            if (arguments.length === 0) {
                return options.focusOnShow;
            }

            if (typeof focusOnShow !== 'boolean') {
                throw new TypeError('focusOnShow() expects a boolean parameter');
            }

            options.focusOnShow = focusOnShow;
            return picker;
        };

        picker.inline = function (inline) {
            if (arguments.length === 0) {
                return options.inline;
            }

            if (typeof inline !== 'boolean') {
                throw new TypeError('inline() expects a boolean parameter');
            }

            options.inline = inline;
            return picker;
        };

        picker.clear = function () {
            clear();
            return picker;
        };

        picker.keyBinds = function (keyBinds) {
            if (arguments.length === 0) {
                return options.keyBinds;
            }

            options.keyBinds = keyBinds;
            return picker;
        };

        picker.getMoment = function (d) {
            return getMoment(d);
        };

        picker.debug = function (debug) {
            if (typeof debug !== 'boolean') {
                throw new TypeError('debug() expects a boolean parameter');
            }

            options.debug = debug;
            return picker;
        };

        picker.allowInputToggle = function (allowInputToggle) {
            if (arguments.length === 0) {
                return options.allowInputToggle;
            }

            if (typeof allowInputToggle !== 'boolean') {
                throw new TypeError('allowInputToggle() expects a boolean parameter');
            }

            options.allowInputToggle = allowInputToggle;
            return picker;
        };

        picker.showClose = function (showClose) {
            if (arguments.length === 0) {
                return options.showClose;
            }

            if (typeof showClose !== 'boolean') {
                throw new TypeError('showClose() expects a boolean parameter');
            }

            options.showClose = showClose;
            return picker;
        };

        picker.keepInvalid = function (keepInvalid) {
            if (arguments.length === 0) {
                return options.keepInvalid;
            }

            if (typeof keepInvalid !== 'boolean') {
                throw new TypeError('keepInvalid() expects a boolean parameter');
            }
            options.keepInvalid = keepInvalid;
            return picker;
        };

        picker.datepickerInput = function (datepickerInput) {
            if (arguments.length === 0) {
                return options.datepickerInput;
            }

            if (typeof datepickerInput !== 'string') {
                throw new TypeError('datepickerInput() expects a string parameter');
            }

            options.datepickerInput = datepickerInput;
            return picker;
        };

        picker.parseInputDate = function (parseInputDate) {
            if (arguments.length === 0) {
                return options.parseInputDate;
            }

            if (typeof parseInputDate !== 'function') {
                throw new TypeError('parseInputDate() sholud be as function');
            }

            options.parseInputDate = parseInputDate;

            return picker;
        };

        picker.disabledTimeIntervals = function (disabledTimeIntervals) {
            ///<signature helpKeyword="$.fn.datetimepicker.disabledTimeIntervals">
            ///<summary>Returns an array with the currently set disabled dates on the component.</summary>
            ///<returns type="array">options.disabledTimeIntervals</returns>
            ///</signature>
            ///<signature>
            ///<summary>Setting this takes precedence over options.minDate, options.maxDate configuration. Also calling this function removes the configuration of
            ///options.enabledDates if such exist.</summary>
            ///<param name="dates" locid="$.fn.datetimepicker.disabledTimeIntervals_p:dates">Takes an [ string or Date or moment ] of values and allows the user to select only from those days.</param>
            ///</signature>
            if (arguments.length === 0) {
                return (options.disabledTimeIntervals ? Object.extend({}, options.disabledTimeIntervals) : options.disabledTimeIntervals);
            }

            if (!disabledTimeIntervals) {
                options.disabledTimeIntervals = false;
                update();
                return picker;
            }
            if (!(disabledTimeIntervals instanceof Array)) {
                throw new TypeError('disabledTimeIntervals() expects an array parameter');
            }
            options.disabledTimeIntervals = disabledTimeIntervals;
            update();
            return picker;
        };

        picker.disabledHours = function (hours) {
            ///<signature helpKeyword="$.fn.datetimepicker.disabledHours">
            ///<summary>Returns an array with the currently set disabled hours on the component.</summary>
            ///<returns type="array">options.disabledHours</returns>
            ///</signature>
            ///<signature>
            ///<summary>Setting this takes precedence over options.minDate, options.maxDate configuration. Also calling this function removes the configuration of
            ///options.enabledHours if such exist.</summary>
            ///<param name="hours" locid="$.fn.datetimepicker.disabledHours_p:hours">Takes an [ int ] of values and disallows the user to select only from those hours.</param>
            ///</signature>
            if (arguments.length === 0) {
                return (options.disabledHours ? Object.extend({}, options.disabledHours) : options.disabledHours);
            }

            if (!hours) {
                options.disabledHours = false;
                update();
                return picker;
            }
            if (!(hours instanceof Array)) {
                throw new TypeError('disabledHours() expects an array parameter');
            }
            options.disabledHours = indexGivenHours(hours);
            options.enabledHours = false;
            if (options.useCurrent && !options.keepInvalid) {
                var tries = 0;
                while (!isValid(date, 'h')) {
                    date.add(1, 'h');
                    if (tries === 24) {
                        throw 'Tried 24 times to find a valid date';
                    }
                    tries++;
                }
                setValue(date);
            }
            update();
            return picker;
        };

        picker.enabledHours = function (hours) {
            ///<signature helpKeyword="$.fn.datetimepicker.enabledHours">
            ///<summary>Returns an array with the currently set enabled hours on the component.</summary>
            ///<returns type="array">options.enabledHours</returns>
            ///</signature>
            ///<signature>
            ///<summary>Setting this takes precedence over options.minDate, options.maxDate configuration. Also calling this function removes the configuration of options.disabledHours if such exist.</summary>
            ///<param name="hours" locid="$.fn.datetimepicker.enabledHours_p:hours">Takes an [ int ] of values and allows the user to select only from those hours.</param>
            ///</signature>
            if (arguments.length === 0) {
                return (options.enabledHours ? Object.extend({}, options.enabledHours) : options.enabledHours);
            }

            if (!hours) {
                options.enabledHours = false;
                update();
                return picker;
            }
            if (!(hours instanceof Array)) {
                throw new TypeError('enabledHours() expects an array parameter');
            }
            options.enabledHours = indexGivenHours(hours);
            options.disabledHours = false;
            if (options.useCurrent && !options.keepInvalid) {
                var tries = 0;
                while (!isValid(date, 'h')) {
                    date.add(1, 'h');
                    if (tries === 24) {
                        throw 'Tried 24 times to find a valid date';
                    }
                    tries++;
                }
                setValue(date);
            }
            update();
            return picker;
        };
        /**
         * Returns the component's model current viewDate, a moment object or null if not set. Passing a null value unsets the components model current moment. Parsing of the newDate parameter is made using moment library with the options.format and options.useStrict components configuration.
         * @param {Takes string, viewDate, moment, null parameter.} newDate
         * @returns {viewDate.clone()}
         */
        picker.viewDate = function (newDate) {
            if (arguments.length === 0) {
                return viewDate.clone();
            }

            if (!newDate) {
                viewDate = date.clone();
                return picker;
            }

            if (typeof newDate !== 'string' && !moment.isMoment(newDate) && !(newDate instanceof Date)) {
                throw new TypeError('viewDate() parameter must be one of [string, moment or Date]');
            }

            viewDate = parseInputDate(newDate);
            viewUpdate();
            return picker;
        };

        // initializing element and component attributes
        if (element.match('input')) {
            input = element;
        } else {
            input = element.select(options.datepickerInput);
            if (input.length === 0) {
                input = element.select('input').first();
            } else if (!input.match('input')) {
                throw new Error('CSS class "' + options.datepickerInput + '" cannot be applied to non input element');
            }
        }

        if (element.hasClassName('input-group')) {
            // in case there is more then one 'input-group-addon' Issue #48
            if (element.select('.datepickerbutton').length === 0) {
                component = element.select('.input-group-addon').first();
            } else {
                component = element.select('.datepickerbutton').first();
            }
        }

        if (!options.inline && !input.match('input')) {
            throw new Error('Could not initialize DateTimePicker without an input element');
        }

        // Set defaults for date here now instead of in var declaration
        date = getMoment();
        viewDate = date.clone();

        Object.extend(options, dataToOptions());

        picker.options(options);

        initFormatting();

        attachDatePickerElementEvents();

        if (input.readAttribute('disabled')) {
            picker.disable();
        }

        var val = input.retrieve('date');
        if (!val) val = $F(input).trim();
        else val = moment(val);
        if (input.match('input') && val.length !== 0) {
            setValue(parseInputDate(val));
        }
        else if (options.defaultDate && (input.readAttribute('placeholder') === undefined || input.readAttribute('placeholder') === null)) {
            setValue(options.defaultDate);
        }
        if (options.inline) {
            show();
        }
        return picker;
    };

    /********************************************************************************
     *
     * jQuery plugin constructor and defaults object
     *
     ********************************************************************************/

    /**
    * See (http://jquery.com/).
    * @name jQuery
    * @class
    * See the jQuery Library  (http://jquery.com/) for full details.  This just
    * documents the function and classes that are added to jQuery by this plug-in.
    */
    /**
     * See (http://jquery.com/)
     * @name fn
     * @class
     * See the jQuery Library  (http://jquery.com/) for full details.  This just
     * documents the function and classes that are added to jQuery by this plug-in.
     * @memberOf jQuery
     */
    /**
     * Show comments
     * @class datetimepicker
     * @memberOf jQuery.fn
     */
    var dpDefaults = {
        timeZone: '',
        format: false,
        dayViewHeaderFormat: 'MMMM YYYY',
        extraFormats: false,
        stepping: 1,
        minDate: false,
        maxDate: false,
        useCurrent: true,
        collapse: true,
        locale: moment.locale(),
        defaultDate: false,
        disabledDates: false,
        enabledDates: false,
        icons: {
            time: 'glyphicon glyphicon-time',
            date: 'glyphicon glyphicon-calendar',
            up: 'glyphicon glyphicon-chevron-up',
            down: 'glyphicon glyphicon-chevron-down',
            previous: 'glyphicon glyphicon-chevron-left',
            next: 'glyphicon glyphicon-chevron-right',
            today: 'glyphicon glyphicon-screenshot',
            clear: 'glyphicon glyphicon-trash',
            close: 'glyphicon glyphicon-remove'
        },
        tooltips: {
            today: 'Go to today',
            clear: 'Clear selection',
            close: 'Close the picker',
            selectMonth: 'Select Month',
            prevMonth: 'Previous Month',
            nextMonth: 'Next Month',
            selectYear: 'Select Year',
            prevYear: 'Previous Year',
            nextYear: 'Next Year',
            selectDecade: 'Select Decade',
            prevDecade: 'Previous Decade',
            nextDecade: 'Next Decade',
            prevCentury: 'Previous Century',
            nextCentury: 'Next Century',
            pickHour: 'Pick Hour',
            incrementHour: 'Increment Hour',
            decrementHour: 'Decrement Hour',
            pickMinute: 'Pick Minute',
            incrementMinute: 'Increment Minute',
            decrementMinute: 'Decrement Minute',
            pickSecond: 'Pick Second',
            incrementSecond: 'Increment Second',
            decrementSecond: 'Decrement Second',
            togglePeriod: 'Toggle Period',
            selectTime: 'Select Time'
        },
        useStrict: false,
        sideBySide: false,
        daysOfWeekDisabled: false,
        calendarWeeks: false,
        viewMode: 'days',
        toolbarPlacement: 'default',
        showTodayButton: true,
        showClear: false,
        showClose: false,
        widgetPositioning: {
            horizontal: 'auto',
            vertical: 'auto'
        },
        widgetParent: null,
        ignoreReadonly: false,
        keepOpen: false,
        focusOnShow: true,
        inline: false,
        keepInvalid: false,
        datepickerInput: '.datepickerinput',
        keyBinds: {
            up: function (widget) {
                if (!widget) {
                    return;
                }
                var d = this.date() || this.getMoment();
                if (widget.down('.datepicker').visible()) {
                    this.date(d.clone().subtract(7, 'd'));
                } else {
                    this.date(d.clone().add(this.stepping(), 'm'));
                }
            },
            down: function (widget) {
                if (!widget) {
                    this.show();
                    return;
                }
                var d = this.date() || this.getMoment();
                if (widget.down('.datepicker').visible()) {
                    this.date(d.clone().add(7, 'd'));
                } else {
                    this.date(d.clone().subtract(this.stepping(), 'm'));
                }
            },
            'control up': function (widget) {
                if (!widget) {
                    return;
                }
                var d = this.date() || this.getMoment();
                if (widget.down('.datepicker').visible()) {
                    this.date(d.clone().subtract(1, 'y'));
                } else {
                    this.date(d.clone().add(1, 'h'));
                }
            },
            'control down': function (widget) {
                if (!widget) {
                    return;
                }
                var d = this.date() || this.getMoment();
                if (widget.down('.datepicker').visible()) {
                    this.date(d.clone().add(1, 'y'));
                } else {
                    this.date(d.clone().subtract(1, 'h'));
                }
            },
            left: function (widget) {
                if (!widget) {
                    return;
                }
                var d = this.date() || this.getMoment();
                if (widget.down('.datepicker').visible()) {
                    this.date(d.clone().subtract(1, 'd'));
                }
            },
            right: function (widget) {
                if (!widget) {
                    return;
                }
                var d = this.date() || this.getMoment();
                if (widget.down('.datepicker').visible()) {
                    this.date(d.clone().add(1, 'd'));
                }
            },
            pageUp: function (widget) {
                if (!widget) {
                    return;
                }
                var d = this.date() || this.getMoment();
                if (widget.down('.datepicker').visible()) {
                    this.date(d.clone().subtract(1, 'M'));
                }
            },
            pageDown: function (widget) {
                if (!widget) {
                    return;
                }
                var d = this.date() || this.getMoment();
                if (widget.down('.datepicker').visible()) {
                    this.date(d.clone().add(1, 'M'));
                }
            },
            enter: function () {
                this.hide();
            },
            escape: function () {
                this.hide();
            },
            //tab: function (widget) { //this break the flow of the form. disabling for now
            //    var toggle = widget.find('.picker-switch a[data-action="togglePicker"]');
            //    if(toggle.length > 0) toggle.click();
            //},
            'control space': function (widget) {
                if (!widget) {
                    return;
                }
                if (widget.down('.timepicker').visible()) {
                    widget.down('.btn[data-action="togglePeriod"]').click();
                }
            },
            t: function () {
                this.date(this.getMoment());
            },
            'delete': function () {
                this.clear();
            }
        },
        debug: false,
        allowInputToggle: false,
        disabledTimeIntervals: false,
        disabledHours: false,
        enabledHours: false,
        viewDate: false
    };

    Class.create('DateTimePicker', {
        picker: null,
        initialize: function (element, options) {
            var thisOptions = Object.extend({}, dpDefaults);
            thisOptions = Object.extend(thisOptions, options || {});
            this.picker = dateTimePicker(element, thisOptions);

/*
            var args = Array.prototype.slice.call(arguments, 1),
                isInstance = true,
                thisMethods = ['destroy', 'hide', 'show', 'toggle'],
                returnValue;

            if (typeof options === 'object') {
                return this.each(function () {
                    var $this = $(this),
                        _options;
                    if (!$this.data('DateTimePicker')) {
                        // create a private copy of the defaults object
                        _options = Object.extend(true, {}, $.fn.datetimepicker.defaults, options);
                        $this.data('DateTimePicker', dateTimePicker($this, _options));
                    }
                });
            } else if (typeof options === 'string') {
                this.each(function () {
                    var $this = $(this),
                        instance = $this.data('DateTimePicker');
                    if (!instance) {
                        throw new Error('bootstrap-datetimepicker("' + options + '") method was called on an element that is not using DateTimePicker');
                    }

                    returnValue = instance[options].apply(instance, args);
                    isInstance = returnValue === instance;
                });

                if (isInstance || $.inArray(options, thisMethods) > -1) {
                    return this;
                }

                return returnValue;
            }
            throw new TypeError('Invalid arguments for DateTimePicker: ' + options);
    */
        }
    });

})();