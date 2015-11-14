/**
 * Created by Leal on 2015/4/13.
 * Generate form based on json schema
 */

/**
 * 关于字段的生成
 *  字段分为两个大的类别，一种是字段分组，一种是用于输入值的字段；
 *  分组字段需要从整体负责自己及所有子字段的生成； hander包含createField函数
 *  输入值的字段，主要提供生成输入控件的功能；   handler包含createInputControls函数
 */

(function () {
    'use strict';
    
    var helpers = {
        CamelToTitle: function (str) {
            return str
                .replace(/([A-Z])/g, ' $1')//CL:大写字母前插入空格
                .replace(/^./, function (str) {     //CL:首字母变成大写
                return str.toUpperCase();
            });
        },
        CamelToDash: function (str) {
            return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        },
        getLabelText: function (field) {
            return field.label || helpers.CamelToTitle(field.property);
        },
        PropertyClean: function (field) {
            return field.property && field.property.replace(/\[|\]|\./g, '');
        },
        //根据属性名获得输入控件的ID和name属性
        getInputIdName: function (field) {
            return field.property && field.property.replace(/\[|\]|\./g, '');
        },
        processAttrValue: function (value, field, directive) {
            if (typeof value === 'string') {
                return value
                    .replace(/\$form/g, directive.formStr)
                    .replace(/\$schema/g, directive.schemaStr)
                    .replace(/\$type/g, field.type || 'text')
                    .replace(/\$property_clean/g, helpers.PropertyClean(field))
                    .replace(/\$property/g, field.property)
                    .replace(/\$data/g, directive.dataStr)
                    .replace(/#\./g, directive.dataStr + '.');
            }
            
            return value;
        },
        getNgModelStr: function (field, directive) {
            return directive.dataStr + '.' + field.property;
        }
    };
    
    // 构造一个字段的各个部分
    //  .field-container
    //      .label-container
    //          field-label
    //          required-mark
    //      .input-container
    //          input controls
    //          validation controls
    //          helpblock
    var inputFieldPartBuilder = {
        //
        createFieldContainer: function (field, directive, quickFields) {
            var fieldContainer = angular.element('<div/>');
            fieldContainer.addClass('field-container');
            fieldContainer.addClass(directive.options.classes.fieldContainer.join(' '));
            
            fieldContainer.attr('ng-class', helpers.processAttrValue("{'invalid':$form.$property_clean.$invalid, " +
            "'dirty':$form.$property_clean.$dirty, " +
            "'touched':$form.$property_clean.$touched || $form.$submitted, " +
            "'valid':$form.$property_clean.$valid}", field, directive));
            
            //attrs = angular.extend({}, autofields.settings.attributes.container, attrs);
            //setAttributes(directive, field, fieldContainer, attrs);
            //
            //
            //if (angular.isDefined(field.fieldClasses))
            //{
            //    fieldContainer.addClass(field.fieldClasses);
            //}
            
            return fieldContainer;
        },
        createLabelContainer: function (field, directive, quickFields) {
            var labelContainer = angular.element('<div class="label-container"></div>');
            labelContainer.addClass(directive.options.classes.labelContainer.join(' '));
            
            
            
            return labelContainer;
        },
        createInputContainer: function (field, directive, quickFields) {
            var inputContainer = angular.element('<div class="input-container"></div>');
            inputContainer.addClass(directive.options.classes.inputContainer.join(' '));
            //TODO:
            return inputContainer;
        },
        // 创建Label元素并加入到lable-container中
        appendLabelControls: function (field, labelContainer, directive, quickFields) {
            //是否不在左侧显示标签？
            if (field.noLabel)
            {
                return;
            }

            var label = angular.element('<label/>');
            label.html(helpers.getLabelText(field ));
            if (field.property) {
                label.attr('for', helpers.getInputIdName(field));
            }
            
            labelContainer.append(label);
            
            //必填标识
            if (field.attr) {
                var requiredMark = angular.element('<span class="required-mark">*</span>');
                if (angular.isDefined(field.attr.ngRequired)) {
                    requiredMark.attr('ng-show', helpers.processAttrValue(field.attr.ngRequired, field, directive));
                    labelContainer.append(requiredMark);
                } else if (field.attr.required) {
                    labelContainer.append(requiredMark);
                }
            }
        },
        // 创建验证元素并加入input-container中
        appendValidationControls: function (field, inputContainer, directive, quickFields) {
            var enableValidation = directive.options.validation.enabled && field.validate !== false;
            if (!enableValidation) {
                //If not enabled, remove validation hooks
                //fieldElements.fieldContainer.removeAttr('ng-class');
                //return fieldElements;
                return;
            }
            
            if (!directive.options.validation.showMessages)
                return;
            
            // Get Error Messages
            var msgs = [];
            
            angular.forEach(angular.extend({}, directive.options.validation.defaultMsgs, field.msgs), function (message, error) {
                if (
                    (field.msgs && field.msgs[error]) ||
                    (field.type == error) ||
                    (field.attr &&
                        (field.attr[error] ||
                        field.attr['ng' + helpers.CamelToTitle(error)])
                    )
                ) {
                    //msgs.push('('+directive.formStr+'.'+field.property+'.$error.'+error+'? \''+message+'\' : \'\')');
                    msgs.push({
                        error: error,
                        //ngshow: directive.formStr + '.' + field.property + '.$error.' + error,
                        message: message
                    });
                }
            });
            // Get Valid Message
            //fieldElements.validMsg = (field.msgs && field.msgs.valid)? field.msgs.valid : directive.options.validation.defaultMsgs.valid;
            
            // Add validation attributes
            if (msgs.length) {
                var messages = angular.element('<div />');
                messages.attr('ng-messages', directive.formStr + '.' + field.property + '.$error');
                messages.attr('ng-show', directive.formStr + '.' + field.property + '.$touched || ' + directive.formStr + '.$submitted');
                //messages.attr('ng-show', directive.formStr + '.$submitted');
                //debugger;
                messages.addClass(directive.options.classes.validationBlock.join(' '));
                
                //
                angular.forEach(msgs, function (msg, index) {
                    var message = angular.element('<div/>');
                    message.attr('ng-message', msg.error);
                    message.html(msg.message);
                    
                    messages.append(message);
                });
                
                
                //
                inputContainer.append(messages);

                //// Add message display with ng-show/ng-hide
                //// using a mutator that requires 'validation'
                //var validationBlock = angular.element('<div/>');
                //validationBlock.addClass(directive.options.classes.validationBlock.join(' '));
                //var attrs = angular.extend({}, autofields.settings.attributes.validationBlock,
                //    {
                //        "ngShow": autofields.settings.validation.invalid
                //    });
                //setAttributes(directive, field, validationBlock, attrs);
                //
                ////
                //angular.forEach(msgs, function (msg, index) {
                //    var msgItem = angular.element('<small/>');
                //    msgItem.addClass('error');
                //    msgItem.attr('ng-show', msg.ngshow);
                //    msgItem.html(msg.message);
                //
                //    validationBlock.append(msgItem);
                //});
                //
                //return validationBlock;
            }

            //return "";
        },
        //创建并添加帮助元素
        appendHelpBlock: function (field, inputContainer, directive, quickFields) {
            if (!field.help) return;
            
            var helpBlock = angular.element('<p/>');
            
            //attrs = angular.extend({}, autofields.settings.attributes.helpBlock, attrs);
            //setAttributes(directive, field, helpBlock, attrs);
            
            helpBlock.addClass(directive.options.classes.helpBlock.join(' '));
            helpBlock.html(field.help);
            
            inputContainer.append(helpBlock);
        },

        //输入区的额外内容
        appendExtraBlock:function(field, inputContainer, directive, quickFields){
          if (!field.extra) return;
            var extraElement = angular.element(field.extra);

            inputContainer.append(extraElement);
        },

        //为输入控件添加通用的属性
        addCommonAttributes: function (el, field, directive) {
            var id = helpers.getInputIdName(field);
            el.attr('id', id);
            el.attr('name', id);
            //el.attr('type', field.type);
            el.attr('ng-model', helpers.getNgModelStr(field, directive));
        }
    };
    
    
    angular.module('quickFields.core', [])
        .provider('$quickFields', function () {
        var quickFields = {};
        var fieldTypeHandlers = {}; //字段类型注册
        
        //默认设置
        quickFields.settings = {
            defaultFieldType: 'text',
            containerTemplate: '<div class="quick-fields" ></div>',
            validation: {
                enabled: true,
                showMessages: true,
                defaultMsgs: {
                    required: 'This field is required',
                    minlength: 'This is under minimum length',
                    maxlength: 'This exceeds maximum length',
                    min: 'This is under the minumum value',
                    max: 'This exceeds the maximum value',
                    email: 'This is not a valid email address',
                    pattern: '值不符合规则',
                    match: '值不匹配',
                    valid: ''
                },
                invalid: '$form.$property_clean.$invalid && $form.$property_clean.$dirty',
                valid: '$form.$property_clean.$valid'
            },
            classes: {
                fieldContainer: ['form-group'],
                labelContainer: ['control-label', 'col-sm-2'],
                inputContainer: ['col-sm-10'],
                helpBlock: ['help-block'],
                
                input: ['form-control'],
                label: [''],
                validationBlock: ['error-container']
            },
            attributes: {
                container: {
                    //'class': '$type',
                    //'ng-class': "{'invalid':$form.$property_clean.$invalid && $form.$property_clean.$dirty, 'valid':$form.$property_clean.$valid}"
                    'ng-class': "{'invalid':$form.$property_clean.$invalid, 'valid':$form.$property_clean.$valid}"
                },
                input: {
                    id: '$property_clean',
                    name: '$property_clean',
                    type: '$type',
                    ngModel: '$data.$property',
                    placeholder: '$placeholder'
                },
                label: {}
                    //labelWrapper:{},
                    //inputWrapper:{},
                    //helpBlock:{}
            },
            emptyDrownDownText: '--请选择--'
        };
        
        // 字段类型注册.如果handler.createField 存在，那么是通用字段，调用createField,否则调用createInputControls
        quickFields.registerFieldType = function (fieldType, handler) {
            if (Array.isArray(fieldType)) {
                //传入的是个数组，表示多个字段类型都使用同一个handler
                angular.forEach(fieldType, function (type) {
                    fieldTypeHandlers[type] = handler;
                });
            } else {
                fieldTypeHandlers[fieldType] = handler;
            }

        };
        
        // 值字段类型注册,是registerFieldType的一种特殊形式
        quickFields.registerValueFieldType = function (fieldType, fnCreateInputControls) {
            quickFields.registerFieldType(fieldType, {
                createInputControls: fnCreateInputControls
            });
        };
        
        
        // 生成一个值字段 (字段, directive，$quickFields provider,创建生成输入控件的函数)
        quickFields.buildInputField = function (field, directive, fnCreateInputControls) {
            var fieldContainer = inputFieldPartBuilder.createFieldContainer(field, directive, quickFields);
            var labelContainer = inputFieldPartBuilder.createLabelContainer(field, directive, quickFields);
            var inputContainer = inputFieldPartBuilder.createInputContainer(field, directive, quickFields);
            
            //TODO: 创建label
            inputFieldPartBuilder.appendLabelControls(field, labelContainer, directive, quickFields);

            // 输入框
            fnCreateInputControls(field, inputContainer, directive);
            
            //TODO: 创建验证
            inputFieldPartBuilder.appendValidationControls(field, inputContainer, directive, quickFields);
            
            //TODO: 创建HelpBlock
            inputFieldPartBuilder.appendHelpBlock(field, inputContainer, directive, quickFields);

            //TODO: 创建额外信息
            inputFieldPartBuilder.appendExtraBlock(field, inputContainer, directive, quickFields);
            
            // 子字段
            if (field.fields) {
                angular.forEach(field.fields, function (childField) {
                    //group.append(autofields.createField(directive, cell, cellIndex));
                    quickFields.buildField(childField, inputContainer, directive);
                });
            }
            
            //
            fieldContainer.append(labelContainer).append(inputContainer);
            return fieldContainer;
        };
        
        
        // 生成一个字段并添加到表单container末尾
        quickFields.buildField = function (field, parentContainer, directive) {
            var fieldType = field.type || directive.options.defaultFieldType;
            var handler = fieldTypeHandlers[fieldType];
            var el; //生成的字段html元素
            if (handler) {
                if (handler.createField) { //通用字段
                    el = handler.createField(field, directive);
                } else if (handler.createInputControls) { //值字段
                    el = quickFields.buildInputField(field, directive, handler.createInputControls);
                } else {
                    el = angular.element('<div class="alert alert-warning" role="alert"><strong>' + field.type + '</strong> invalid handler.</div>');
                }
            } else {
                //不支持的字段类型
                el = angular.element('<div class="alert alert-warning" role="alert"><strong>' + field.type + '</strong> not supported - field ignored</div>');
            }
            
            // 字段本身的attr，应用到字段container上
            if (field.fieldAttr) {
                angular.forEach(field.fieldAttr, function (value, attr) {
                    el.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                });
            }
            
            parentContainer.append(el);
        };
        
        
        // Update scope with items attached in settings
        quickFields.updateScope = function (scope) {
            angular.forEach(quickFields.settings.scope, function (value, property) {
                if (typeof value == 'function') {
                    scope[property] = function () {
                        var args = Array.prototype.slice.call(arguments, 0);
                        args.unshift(scope);
                        value.apply(this, args);
                    };
                } else {
                    scope[property] = value;
                }
            });
        };
        
        quickFields.$get = function () {
            return {
                settings: quickFields.settings,
                buildField: quickFields.buildField,
                updateScope: quickFields.updateScope
            };
        };
        
        return quickFields;
    })
        .directive('quickFields', ['$quickFields', '$compile', function ($quickFields, $compile) {
            return {
                restrict: 'E',
                priority: 1,
                replace: true,
                compile: function () {
                    //console.log('compiling quickfields..');
                    return function ($scope, $element, $attr) {
                        // Scope Hooks
                        var directive = {
                            schemaStr: $attr.fields || $attr.quickFields,
                            optionsStr: $attr.options,
                            dataStr: $attr.data,
                            formStr: $attr.form || 'quickfields',
                            classes: $attr['class'],
                            formContainer: null,
                            formScope: null
                        };
                        
                        //Helper Functions
                        var helper = {
                            extendDeep: function (dst) {
                                angular.forEach(arguments, function (obj) {
                                    if (obj !== dst) {
                                        angular.forEach(obj, function (value, key) {
                                            if (dst[key] && dst[key].constructor && dst[key].constructor === Object) {
                                                helper.extendDeep(dst[key], value);
                                            } else {
                                                dst[key] = value;
                                            }
                                        });
                                    }
                                });
                                return dst;
                            }
                        };
                        
                        // Import Directive-wide Handler Default Settings Import
                        directive.options = angular.copy($quickFields.settings);
                        
                        // Build fields from schema using handlers
                        var build = function (schema) {
                            //console.log('build autofields.' + schema);
                            //debugger;
                            schema = schema || $scope[directive.schemaStr];
                            
                            // Create HTML
                            directive.formContainer.html('');
                            angular.forEach(schema, function (field, index) {
                                //var fieldEl = $autofields.createField(directive, field, index);
                                //directive.formContainer.append(fieldEl);
                                
                                $quickFields.buildField(field, directive.formContainer, directive);
                            });
                            
                            // Create Scope
                            if (directive.formScope) directive.formScope.$destroy();
                            directive.formScope = $scope.$new();
                            directive.formScope.data = $scope[directive.dataStr];
                            directive.formScope.fields = schema;
                            $quickFields.updateScope(directive.formScope);
                            
                            //directive.formContainer.append('<h3>This is for test</h3>');
                            // Compile Element with Scope
                            $compile(directive.formContainer)(directive.formScope);
                        };
                        
                        // Init and Watch
                        $scope.$watch(directive.optionsStr, function (newOptions, oldOptions) {
                            helper.extendDeep(directive.options, newOptions);
                            if (newOptions !== oldOptions) build();
                        }, true);
                        //$scope.$watch(directive.schemaStr, function (schema) {
                        //    console.log('schema changed,', schema);
                        //    build(schema);
                        //}, true);
                        $scope.$watchCollection(directive.schemaStr, function (schema) {
                            //console.log('schema changed,', schema);
                            build(schema);
                        });
                        $scope.$watch(directive.formStr, function (form) {
                            directive.formContainer.attr('name', directive.formStr);
                        });
                        $scope.$watch(function () {
                            return $attr['class'];
                        }, function (form) {
                            directive.classes = $attr['class'];
                            directive.formContainer.attr('class', directive.classes);
                        });
                        
                        directive.formContainer = angular.element(directive.options.containerTemplate);
                        directive.formContainer.attr('name', directive.formStr);
                        directive.formContainer.attr('class', directive.classes);
                        $element.replaceWith(directive.formContainer);
                    };
                }
            };
        }]);
    
    
    /**
     * 字段
     */
    angular.module('quickFields', ['quickFields.core'])
        .config(['$quickFieldsProvider', function ($quickFieldsProvider) {
            var quickFields = $quickFieldsProvider;
            
            // text input types
            quickFields.registerValueFieldType(['text', 'email', 'url', 'date', 'datetime-local', 'month', 'time', 'week', 'number', 'password', 'tel', 'color'], function (field, inputContainer, directive) {
                var input = angular.element('<input/>');
                
                
                //var inputAttrs = angular.extend({}, quickFields.settings.attributes.input, field.attrs);
                inputFieldPartBuilder.addCommonAttributes(input, field, directive);
                //var id = helpers.getInputIdName(field);
                //input.attr('id', id);
                //input.attr('name', id);
                //input.attr('ng-model', directive.dataStr + '.' + field.property);
                input.attr('type', field.type);
                if (field.placeholder) {
                    input.attr('placeholder', field.placeholder);
                }
                
                //TODO: Other attributes
                if (field.attr) {
                    angular.forEach(field.attr, function (value, attr) {
                        input.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                    });
                }

                
                //classes
                input.addClass(quickFields.settings.classes.input.join(' '));
                if (field.cssClass)
                {
                    input.addClass(field.cssClass);
                }
                
                inputContainer.append(input);
            }
            );
            
            //text area
            quickFields.registerValueFieldType('textarea', function (field, inputContainer, directive) {
                var el = angular.element('<textarea/>');
                
                inputFieldPartBuilder.addCommonAttributes(el, field, directive);
                //var id = helpers.getInputIdName(field);
                //el.attr('id', id);
                //el.attr('name', id);
                //el.attr('ng-model', directive.dataStr + '.' + field.property);
                if (field.placeholder) {
                    el.attr('placeholder', field.placeholder);
                }
                
                if (el.attr) {
                    angular.forEach(field.attr, function (value, attr) {
                        el.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                    });
                }
                
                //classes
                el.addClass(quickFields.settings.classes.input.join(' '));
                    if (field.cssClass)
                    {
                        el.addClass(field.cssClass);
                    }

                inputContainer.append(el);

            }
            );
            
            //select 下拉框
            quickFields.registerValueFieldType('select-dropdown', function (field, inputContainer, directive) {
                var emptyItem = field.emptyDrownDownText || directive.options.emptyDrownDownText;
                
                var el = angular.element('<select></select>');
                inputFieldPartBuilder.addCommonAttributes(el, field, directive);
                
                //var id = helpers.getInputIdName(field);
                //el.attr('id', id);
                //el.attr('name', id);
                //el.attr('ng-model', directive.dataStr + '.' + field.property);
                if (el.attr) {
                    angular.forEach(field.attr, function (value, attr) {
                        el.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                    });
                }
                //classes
                el.addClass(quickFields.settings.classes.input.join(' '));
                
                //option items
                if (emptyItem) {
                    el.append(angular.element('<option/>').attr('value', '').html(emptyItem));
                }
                
                if (angular.isDefined(field.list)) { //list 属性直接转换维护ng-options
                    el.attr('ng-options', field.list);
                } else if (angular.isDefined(field.options)) {
                    var optGroups = {};
                    
                    angular.forEach(field.options, function (option, index) {
                        var newChild = angular.element(angular.element('<option/>'));
                        newChild.attr('value', option.value);
                        if (angular.isDefined(option.disabled)) {
                            newChild.attr('ng-disabled', option.disabled);
                        }
                        //if (angular.isDefined(option.slaveTo)) {
                        //    newChild.attr('ng-selected', option.slaveTo);
                        //}
                        if (angular.isDefined(option.label)) {
                            newChild.html(option.label || option.value);
                        }
                        if (angular.isDefined(option.group)) {
                            
                            if (!angular.isDefined(optGroups[option.group])) {
                                optGroups[option.group] = angular.element('<optgroup/>');
                                optGroups[option.group].attr('label', option.group);
                            }
                            optGroups[option.group].append(newChild);
                        }
                        else {
                            el.append(newChild);
                        }
                    });
                    
                    if (!angular.equals(optGroups, {})) {
                        angular.forEach(optGroups, function (optGroup) {
                            el.append(optGroup);
                        });
                        optGroups = {};
                    }
                }
                
                inputContainer.append(el);
            });
            
            //checkbox
            quickFields.registerValueFieldType('checkbox', function (field, inputContainer, directive) {
               // var input = angular.element('<input type="checkbox" />');

                var div = angular.element('<div class="checkbox"></div>');
                var label = angular.element('<label></label>');
                var input = angular.element('<input type="checkbox" />');

                label.append(input);
                //label.append(field.label);
                div.append(label);
                //var inputAttrs = angular.extend({}, quickFields.settings.attributes.input, field.attrs);
                //var id = helpers.getInputIdName(field);
                //input.attr('id', id);
                //input.attr('name', id);
                //input.attr('type', field.type);
                //input.attr('ng-model', directive.dataStr + '.' + field.property);
                
                inputFieldPartBuilder.addCommonAttributes(input, field, directive);
                
                
                
                //TODO: Other attributes
                if (field.attr) {
                    angular.forEach(field.attr, function (value, attr) {
                        input.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                    });
                }
                
                //classes
                //input.addClass(quickFields.settings.classes.input.join(' '));
                
                
                inputContainer.append(div);
            });




            
            //radio list
            quickFields.registerValueFieldType('radio-list', function (field, inputContainer, directive) {
                var element = angular.element('<div class="radio-list"/>');
                
                //inputFieldPartBuilder.addCommonAttributes(element, field, directive);
                
                
                if (angular.isDefined(field.list)) {
                    var label = angular.element('<label/>');
                    label.attr('ng-repeat','item in ' + field.list + '  ').addClass('radio-inline');

                    var input = angular.element('<input/>');
                    inputFieldPartBuilder.addCommonAttributes(input, field, directive);
                    input.attr('type', 'radio');
                    if (field.valueTemplate)
                    {
                        input.attr('value', field.valueTemplate);
                    }else if (field.ngValueTemplate)
                    {
                        input.attr('ng-value', field.ngValueTemplate);
                    }

                    label.append(input);

                    label.append(angular.element('<span>' + field.labelTemplate + '</span>'));

                    element.append(label);


                    //element.attr('ng-options', field.list);
                    //var radioList = '<label data-ng-repeat="item in ' + field.list + '" class="radio-inline">';
                    //radioList += '<input  type="radio" ' + commonAttributes(field, index) + ' value="{{item.value}}"  />{{item.text}}</label>';

                } else if (angular.isDefined(field.options)) {


                    var buildOptions = function(optionArray)
                    {
                        angular.forEach(optionArray, function (option, index) {
                            var label = angular.element('<label/>');
                            label.addClass('radio-inline');
                            //label.attr('ng-repeat','item in ' + field.list + '  track by $index').addClass('radio-inline');

                            var input = angular.element('<input/>');
                            inputFieldPartBuilder.addCommonAttributes(input, field, directive);
                            input.attr('type', 'radio');
                            input.attr('value', option.value);
                            if (angular.isDefined(option.disabled)) {
                                input.attr('ng-disabled', option.disabled);
                            }

                            if (field.attr) {
                                angular.forEach(field.attr, function (value, attr) {
                                    input.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                                });
                            }

                            label.append(input);

                            label.append(angular.element('<span>' + option.label + '</span>'));

                            element.append(label);
                        });
                    };

                    if (Array.isArray(field.options))
                    {
                        buildOptions(field.options);
                    }else{
                        //如果是对象，转换成数组
                        var arr = [];
                        angular.forEach(field.options, function(value, key){
                           if (typeof value === 'string')
                           {
                               arr.push({value:key,label:value});
                           }else{
                               arr.push({value:key, label:value.label});
                           }
                        });
                        buildOptions(arr);
                    }

                    //angular.forEach(field.options, function (option, index) {
                    //    var label = angular.element('<label/>');
                    //    label.addClass('radio-inline');
                    //    //label.attr('ng-repeat','item in ' + field.list + '  track by $index').addClass('radio-inline');
                    //
                    //    var input = angular.element('<input/>');
                    //    inputFieldPartBuilder.addCommonAttributes(input, field, directive);
                    //    input.attr('type', 'radio');
                    //    input.attr('value', option.value);
                    //    if (angular.isDefined(option.disabled)) {
                    //        input.attr('ng-disabled', option.disabled);
                    //    }
                    //
                    //    if (field.attr) {
                    //        angular.forEach(field.attr, function (value, attr) {
                    //            input.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                    //        });
                    //    }
                    //
                    //    label.append(input);
                    //
                    //    label.append(angular.element('<span>' + option.label + '</span>'));
                    //
                    //    element.append(label);
                    //});

                }
                
                inputContainer.append(element);
            });
            
            //check box list
            quickFields.registerValueFieldType('check-list', function (field, inputContainer, directive) {
                var element = angular.element('<div class="check-list"/>');
                // var ngModelStr = autofields.getNgModelStr(directive, field);
                
                if (angular.isDefined(field.list)) {

                    var label = angular.element('<label/>');
                    label.attr('ng-repeat','item in ' + field.list + '  ').addClass('radio-inline');
                    label.attr('class','checkbox-inline');

                    var input = angular.element('<input/>');
                    inputFieldPartBuilder.addCommonAttributes(input, field, directive);
                    input.attr('type', 'checkbox');
                    input.attr('checklist-value', field.valueTemplate);
                    input.attr("checklist-model", helpers.getNgModelStr(field, directive));
                    input.removeAttr('ng-model');
                    label.append(input);

                    label.append(angular.element('<span>' + field.labelTemplate + '</span>'));

                    element.append(label);

                    //var label = angular.element('<label/>');
                    //label.attr('ng-repeat','item in ' + field.list + '  track by $index').addClass('checkbox-inline');
                    //
                    //var input = angular.element('<input/>');
                    ////autofields.setInputAttrs(directive, input, field);
                    //input.attr("checklist-model", ngModelStr);
                    //input.removeAttr('ng-model');
                    //input.attr('type', 'checkbox');
                    //input.attr('checklist-value', 'item.value');
                    //input.removeClass('form-control').removeAttr('required');
                    //label.append(input);
                    //
                    //label.append(angular.element('<span>{{item.label}}</span>'));
                    //
                    //element.append(label);


                    //element.attr('ng-options', field.list);
                    //var radioList = '<label data-ng-repeat="item in ' + field.list + '" class="radio-inline">';
                    //radioList += '<input  type="radio" ' + commonAttributes(field, index) + ' value="{{item.value}}"  />{{item.text}}</label>';

                } else if (angular.isDefined(field.options)) {
                    
                    angular.forEach(field.options, function (option, index) {
                        var label = angular.element('<label/>');
                        label.addClass('checkbox-inline');
                        //label.attr('ng-repeat','item in ' + field.list + '  track by $index').addClass('radio-inline');
                        
                        var input = angular.element('<input/>');
                        //autofields.setInputAttrs(directive, input, field);
                        
                        inputFieldPartBuilder.addCommonAttributes(input, field, directive);
                        input.attr("checklist-model", helpers.getNgModelStr(field, directive));
                        input.removeAttr('ng-model');
                        //input.attr('ng-model', field.property);
                        input.attr('type', 'checkbox');
                        input.attr('checklist-value', "'" + option.value + "'");
                        
                        label.append(input);
                        
                        label.append(angular.element('<span>' + option.label + '</span>'));
                        if (angular.isDefined(option.disabled)) {
                            input.attr('ng-disabled', option.disabled);
                        }
                        
                        if (field.attr) {
                            angular.forEach(field.attr, function (value, attr) {
                                input.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                            });
                        }
                        
                        element.append(label);
                    });

                }
                
                inputContainer.append(element);
            });
            
            
            //date picker
            quickFields.registerValueFieldType('datepicker-my97', function (field, inputContainer, directive) {
                var el = angular.element('<input  type="text" ng-my97-date-picker format="yyyy-MM-dd" />');
                
                inputFieldPartBuilder.addCommonAttributes(el, field, directive);
                //var id = helpers.getInputIdName(field);
                //el.attr('id', id);
                //el.attr('name', id);
                //el.attr('ng-model', directive.dataStr + '.' + field.property);
                if (field.placeholder) {
                    el.attr('placeholder', field.placeholder);
                }
                
                if (el.attr) {
                    angular.forEach(field.attr, function (value, attr) {
                        el.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                    });
                }
                
                //classes
                el.addClass(quickFields.settings.classes.input.join(' '));
                
                inputContainer.append(el);
            });

            //直接输出template里的内容
            quickFields.registerValueFieldType('template', function(field,inputContainer,directive){
                if (!field.template){
                    inputContainer.append('<p>EMPTY template </p>');
                }

                var ele = angular.element(field.template);

                inputContainer.append(ele);
            });


            quickFields.registerValueFieldType('static', function(field,inputContainer,directive){


                var ele = angular.element("<span/>");
                ele.attr('ng-bind', directive.dataStr + '.' + field.property);

                inputContainer.append(ele);
            });



            // block分区字段
            quickFields.registerFieldType('section', {
                createField: function (field, directive) {
                    var sectionHeader = angular.element('<div class="form-section-header"><span>' + field.label + '</span></div>');
                    var sectionBody = angular.element('<div class="form-section-body"></div>');
                    var section = angular.element('<div class="form-section"></div>');
                    
                    angular.forEach(field.fields, function (field) {
                        quickFields.buildField(field, sectionBody, directive);
                    });
                    
                    section.append(sectionHeader).append(sectionBody);
                    
                    return section;

                }
            });

            // 分行线
            quickFields.registerFieldType('line', {
                createField: function (field, directive) {
                    var line = angular.element('<div class="itemz-line"></div>');
                    return line;

                }
            });



            // checkbox ，标签和checkbox显示在一起
            quickFields.registerValueFieldType('checkbox-withlabel', function(field,inputContainer,directive){
                field.noLabel = true; //不在左侧显示标签

                var div = angular.element('<div class="checkbox"></div>');
                var label = angular.element('<label></label>');
                var input = angular.element('<input type="checkbox" />');

                label.append(input);
                label.append(field.label);
                div.append(label);



                //var inputAttrs = angular.extend({}, quickFields.settings.attributes.input, field.attrs);
                //var id = helpers.getInputIdName(field);
                //input.attr('id', id);
                //input.attr('name', id);
                //input.attr('type', field.type);
                //input.attr('ng-model', directive.dataStr + '.' + field.property);

                inputFieldPartBuilder.addCommonAttributes(input, field, directive);



                //TODO: Other attributes
                if (field.attr) {
                    angular.forEach(field.attr, function (value, attr) {
                        input.attr(helpers.CamelToDash(attr), helpers.processAttrValue(value, field, directive));
                    });
                }

                //classes
                //input.addClass(quickFields.settings.classes.input.join(' '));


                inputContainer.append(div);
            });

            //分组字段
            quickFields.registerValueFieldType('group', function (field, inputContainer, directive) {
               //do nothing, 
            });

        }]);
}());