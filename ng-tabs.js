angular.module("ngTabs", [])
    .run(function ($templateCache) {

        $templateCache.put('indicators.html', '<div class="ngTabs-switcher-container">\
					<div class="ngTabs-switcher"\
					    ng-repeat="pane in panes"\
						 ng-click="goTo($index)"\
						 ng-class="{\'selected\': pane.selected}"></div>\
				</div>');

    })
    .directive("ngTabs", ["$templateCache", "$compile", "$timeout", "$sce", function ($templateCache, $compile, $timeout, $sce) {
        var visibleItemsSettings;
        var shared = {
            breakpoints: {
                desktop: 1200,
                tablet: 992,
                mobile: 768
            },
            defaults: {
                Desktop: 3,
                Tablet: 3,
                Mobile: 1
            }
        };

        var setVisibleItems = function (device, attrs, total, force) {
            var tmp = attrs["visibleItems" + device];
            if (typeof tmp !== "undefined") {
                tmp = parseInt(tmp);
                if (tmp <= total && !force) {
                    return tmp;
                }
                else {
                    return shared.defaults[device];
                }
            }
            else {
                if (total > shared.defaults[device]) {
                    return shared.defaults[device];
                }
            }
            return total;
        };

        var getVisibleItemsSettings = function (attrs, total, force) {
            var result = {};
            if (!attrs || !total)
                return shared.defaults;

            for (var device in shared.defaults) {
                result[device] = setVisibleItems(device, attrs, total, force);
            }

            return result;
        };

        var updateVisibleItems = function () {
            var deviceWidth = angular.element(window).width();
            var visibleItems;
            if (deviceWidth < shared.breakpoints.mobile) {
                visibleItems = visibleItemsSettings.Mobile;
            }
            if (deviceWidth > shared.breakpoints.mobile && deviceWidth < shared.breakpoints.tablet) {
                visibleItems = visibleItemsSettings.Tablet;
            }
            if (deviceWidth > shared.breakpoints.tablet) {
                visibleItems = visibleItemsSettings.Desktop;
            }

            return visibleItems;
        };

        var ngTabsCtrl = ['$scope', '$element', '$attrs', function ($scope, el, attrs) {
            el.addClass("noSelect");
            var panes = $scope.panes = [];
            $scope.selectedPaneIndex = 0;
            var carousel = el.children("ul:first");
            var totalItems, maxScroll, canNavigate = true, itemWidth, visibleItems, currentLeftPosition;
            var force = attrs["forceVisible"] === "true";

            var showIndicators = function () {
                var indicators = $templateCache.get("indicators.html");
                indicators = angular.element(indicators);
                carousel.before(indicators);
                $compile(indicators)($scope);
            };

            var initializeItems = function () {
                if (attrs["showIndicators"] === "true") {
                    showIndicators();
                }
                carousel.children("li:last").addClass("last");
                totalItems = carousel.children().length;
                visibleItemsSettings = getVisibleItemsSettings(attrs, totalItems, force);
                visibleItems = updateVisibleItems();
                $scope.select(0);
                calcSharedValues();
                handleArrows();
            };

            var getMinLeftPositionByIndex = function (index) {
                var result = -1 * itemWidth * (index + 1 - visibleItems);
                if (result > 0) return 0;
                return result;
            };

            var getMaxLeftPositionByIndex = function (index) {
                var result = -1 * itemWidth * index;
                if (result < maxScroll) return maxScroll;
                return result;
            };

            var isTabVisible = function (index) {
                currentLeftPosition = carousel.position().left;
                var minRange = getMinLeftPositionByIndex(index);
                var maxRange = getMaxLeftPositionByIndex(index);
                console.info("TAB " + (index + 1) + " RANGE: " + minRange + " <= offset <= " + maxRange);
                return currentLeftPosition >= maxRange && currentLeftPosition <= minRange;
            };

            var setLeftPosition = function (position, steps) {
                carousel.css("left", position);
                handleArrows(position);
                $timeout(function () {
                    if (steps !== undefined && !isTabVisible($scope.selectedPaneIndex)) {
                        $scope.select($scope.selectedPaneIndex + steps);
                    }
                    canNavigate = true;
                }, 200);
            };

            var calcSharedValues = function () {
                var childSet = carousel.children();
                itemWidth = Math.ceil(el.width() / visibleItems);
                childSet.outerWidth(itemWidth);
                var childSetWidth = childSet.outerWidth();
                maxScroll = (childSet.length * childSetWidth) - (visibleItems * childSetWidth);
                maxScroll *= -1;
                console.debug("maxScroll = ", maxScroll);
                console.debug("itemWidth = ", itemWidth);
            };

            var handleArrows = function (leftPosition) {
                leftPosition = leftPosition || leftPosition === 0 || carousel.position().left;
                if (totalItems > visibleItems) {
                    $scope.showLeftArrow = leftPosition < 0;
                    $scope.showRightArrow = leftPosition > maxScroll;
                    carousel.addClass("hasArrows");
                }
                else {
                    $scope.showLeftArrow = $scope.showRightArrow = false;
                    carousel.removeClass("hasArrows");
                }
            };

            var calcFinalPosition = function (index) {
                itemWidth = itemWidth || 0;
                index = index || 0;
                if (index >= $scope.selectedPaneIndex) {
                    return getMinLeftPositionByIndex(index);
                }
                else {
                    return getMaxLeftPositionByIndex(index);
                }
            };

            var navigate = function (index) {
                if (isTabVisible(index)) {
                    $scope.select(index);
                    handleArrows();
                    return;
                }
                if (canNavigate === true) {
                    canNavigate = false;
                    var finalPosition = calcFinalPosition(index);
                    $scope.select(index);
                    setLeftPosition(finalPosition);
                }
            };

            $(window).on("resize.lightTabs", function () {
                clearTimeout(resizeTimeout);
                var resizeTimeout = setTimeout(function () {
                    if (!visibleItemsSettings) {
                        visibleItemsSettings = getVisibleItemsSettings(attrs, totalItems, true);
                    }
                    visibleItems = updateVisibleItems();
                    calcSharedValues();
                    navigate($scope.selectedPaneIndex);
                }, 250);
            });

            $scope.scroll = function (steps) {
                if (canNavigate) {
                    canNavigate = false;
                    if (!steps) return canNavigate = true;
                    currentLeftPosition = carousel.position().left;
                    if (steps < 0 && currentLeftPosition >= 0) return canNavigate = true;
                    if (steps > 0 && currentLeftPosition <= maxScroll) return canNavigate = true;
                    var destination = currentLeftPosition - (steps * itemWidth);
                    setLeftPosition(destination, steps);
                }
            };

            $scope.goTo = function (index) {
                if (!isTabVisible(index)) {
                    return navigate(index);
                }
                $scope.select(index);
            };

            $scope.select = function (index) {
                for (var i = 0; i < panes.length; i++) {
                    panes[i].selected = false;
                }
                panes[index].selected = true;
                $scope.selectedPaneIndex = index;
            };

            this.addPane = function (pane, last) {
                panes.push(pane);
                if (last) {
                    $timeout(function () {
                        initializeItems();
                    });
                }
            };

        }];

        return {
            restrict: 'E',
            scope: true,
            transclude: true,
            controller: ngTabsCtrl,
            templateUrl: "./ng-tabs/templates/tabs.html"
        };
    }])
    .directive("ngTabsPane", function () {
        return {
            require: "^^ngTabs",
            restrict: "E",
            transclude: true,
            replace: true,
            scope: true,
            link: function (scope, el, attrs, tabsCtrl) {
                scope.title = attrs["ngTabsTitle"] || "";
                tabsCtrl.addPane(scope, el.is(":last-child"));
            },
            template: '<div class="ng-tabs-pane" ng-show="selected" ng-transclude></div>'
        };
    });
