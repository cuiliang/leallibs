/**
 * Created by Leal on 2015/4/17.
 */
angular.module('publicDirectives')
.directive('ngMy97DatePicker', [
        '$filter',
        function($filter) {
            return {
                restrict: 'A',
                require: '?ngModel',
                link: function(scope, element, attrs, ngModel) {

                    element.bind('click', function () {
                        console.log('clicked');
                        WdatePicker({
                            lang: 'zh-cn',
                            dateFmt:'yyyy-MM-dd',
                            onpicked: function () { $(this).trigger('change'); },
                            oncleared: function () { $(this).trigger('change'); }
                        });
                    });

                    ngModel.$formatters.push(function (modelValue) {
                        //Model -> View
                        //return dateFilter(modelValue, inputDateFormat);
                        return $filter('date')(modelValue, "yyyy-MM-dd");
                    });

                    ngModel.$parsers.push(function (viewValue) {
                        //View -> Model
                        //return parseDateString(viewValue);
                        return viewValue;
                    });
                }
            };
        }
    ]);