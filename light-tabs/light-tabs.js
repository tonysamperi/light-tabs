angular.module("lightTabs", [])
    .run(function ($templateCache) {

        //M0,45 Q162,0 324,45
        $templateCache.put("lightTabsOddDecorator.html", '<svg class="lightTabsDecorator lightTabsDecoratorOdd" ng-attr-width="{{pathWidth*2}}">\
                <path ng-attr-d="M0,{{pathHeight}} Q{{pathWidth/2}},0 {{pathWidth}},{{pathHeight}}"\
                    stroke-dasharray="5"\
                    stroke="white"\
                    stroke-width="2"\
                    fill="none">\
                </path>\
            </svg>');
        //M0,22.5 Q162,67.5 324,22.5
        $templateCache.put("lightTabsEvenDecorator.html", '<svg class="lightTabsDecorator lightTabsDecoratorEven" ng-attr-width="{{pathWidth*2}}">\
                <path ng-attr-d="M0,0 Q{{pathWidth/2}},{{pathHeight}} {{pathWidth}},0"\
                    stroke-dasharray="5"\
                    stroke="white"\
                    stroke-width="2"\
                    fill="none">\
                </path>\
            </svg>');

        $templateCache.put('lightTabsIndicators.html', '<div class="lightTabs-switcher-container">\
					<div class="lightTabs-switcher"\
					    ng-repeat="pane in panes"\
						 ng-click="goTo($index)"\
						 ng-class="{\'selected\': pane.selected}"></div>\
				</div>');

        $templateCache.put("lightTabsDefault.html", '<div class="light-tabs-top-container">\
			<ul class="light-tabs animate-left">\
				<li ng-repeat="pane in panes track by $index"\
					ng-click="select($index)"\
					ng-class="{selected:pane.selected, disabled:pane.paneDisabled}" class="noSelect {{paneClass}}">\
					<div class="fakeRadio">\
						<div class="fakeRadioInner">\
						</div>\
					</div>\
					<div class="light-tabs-title" ng-bind="pane.title"></div>\
				</li>\
			</ul>\
		</div>\
		<div class="light-tabs-pane">\
			<a ng-show="showLeftArrow" class="arrowLeft light-tabs-arrows" ng-click="scroll(-1)"></a>\
			<a ng-show="showRightArrow" class="arrowRight light-tabs-arrows" ng-click="scroll(1)"></a>\
			<div ng-transclude>\
			</div>\
		</div>');

    })
    .directive("lightTabs", ["$templateCache", "$compile", "$timeout", function ($templateCache, $compile, $timeout) {
        //CREATES LOCAL REFERENCE TO JQUERY
        var $ = jQuery;
        var ltWindow = $(window);
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

        var lightTabsCtrl = ['$scope', '$element', '$attrs', function ($scope, el, attrs) {
            var uniqueId = attrs.id || ("lightTabs" + new Date().getTime());
            el.addClass("noSelect");
            var panes = $scope.panes = [];
            $scope.selectedPaneIndex = 0;
            $scope.pathWidth = 0;
            $scope.pathHeight = 0;
            var topContainer = el.children().first();
            var carousel = topContainer.children("ul.light-tabs");
            var resizeTimeout, totalItems, maxScroll, canNavigate = true, itemWidth, visibleItems, currentLeftPosition;
            var force = $scope.forceVisible === "true";
            var responsiveSettings = {
                visibleItemsDesktop: $scope.visibleItemsDesktop,
                visibleItemsTablet: $scope.visibleItemsTablet,
                visibleItemsMobile: $scope.visibleItemsMobile
            };

            var visibleItemsSettings;

            var setVisibleItems = function (device, responsiveSettings, total, force) {
                var tmp = responsiveSettings["visibleItems" + device];
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

            var getVisibleItemsSettings = function (responsiveSettings, total, force) {
                var result = {};
                if (!responsiveSettings || !total)
                    return shared.defaults;

                for (var device in shared.defaults) {
                    result[device] = setVisibleItems(device, responsiveSettings, total, force);
                }

                return result;
            };

            var updateVisibleItems = function () {
                //var deviceWidth = ltWindow.width();
                var deviceWidth = window.innerWidth;
                console.info("UPDATE VISIBLE ITEMS: WINDOW WIDTH = " + deviceWidth);
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

            var showIndicators = function () {
                var indicators = $templateCache.get("lightTabsIndicators.html");
                indicators = $(indicators).addClass($scope.showIndicators);
                topContainer.before(indicators);
                $compile(indicators)($scope);
            };

            var initializeItems = function () {
                if ($scope.showIndicators == true) {
                    showIndicators();
                }
                if (!!$scope.lightTabsSkin) {
                    el.addClass($scope.lightTabsSkin);
                }
                carousel.children("li:last").addClass("last");
                totalItems = carousel.children().length;
                visibleItemsSettings = getVisibleItemsSettings(responsiveSettings, totalItems, force);
                visibleItems = updateVisibleItems();
                $scope.select(0);
                handleArrows();
                if ($scope.showDecorators == "true") {
                    el.addClass("decorators");
                    addDecorators();
                }
            };

            var getMinLeftPositionByIndex = function (index) {
                var result = -1 * itemWidth * (index + 1 - visibleItems);
                if (result > 0)
                    return 0;
                return result;
            };

            var getMaxLeftPositionByIndex = function (index) {
                var result = -1 * itemWidth * index;
                if (result < maxScroll)
                    return maxScroll;
                return result;
            };

            var isTabVisible = function (index) {
                currentLeftPosition = Math.round(carousel.position().left);
                var minRange = getMinLeftPositionByIndex(index);
                var maxRange = getMaxLeftPositionByIndex(index);
                console.info("TAB " + (index + 1) + " RANGE: " + minRange + " <= offset <= " + maxRange);
                return currentLeftPosition >= maxRange && currentLeftPosition <= minRange;
            };

            var setLeftPosition = function (position, index, force) {
                carousel.css("left", position);
                handleArrows(position);
                $timeout(function () {
                    if (index !== undefined && (force || !isTabVisible($scope.selectedPaneIndex))) {
                        $scope.select(index);
                    }
                    canNavigate = true;
                }, 200);
            };

            var calcSharedValues = function () {
                var childSet = carousel.children();
                var outerWidth = topContainer.width();
                itemWidth = Math.ceil(outerWidth / visibleItems);
                $scope.pathWidth = (itemWidth - 40);
                $scope.pathHeight = (topContainer.height() - 40);
                childSet.outerWidth(itemWidth);
                var childSetWidth = childSet.outerWidth();
                maxScroll = 0;
                if (visibleItems < totalItems) {
                    maxScroll = (childSet.length * childSetWidth) - (visibleItems * childSetWidth);
                    maxScroll *= -1;
                }
                console.debug("maxScroll = ", maxScroll);
                console.debug("itemWidth = ", itemWidth);
                updateCurrentLeftPosition();
            };

            var updateCurrentLeftPosition = function () {
                currentLeftPosition = carousel.position().left;
                currentLeftPosition = Math.round(currentLeftPosition / itemWidth) * itemWidth;
            };

            var handleArrows = function (leftPosition) {
                leftPosition = leftPosition === undefined ? carousel.position().left : leftPosition;
                if (totalItems > visibleItems) {
                    $scope.showLeftArrow = leftPosition < 0;
                    $scope.showRightArrow = leftPosition > maxScroll || leftPosition === 0;
                    if (!topContainer.hasClass("hasArrows")) {
                        topContainer.addClass("hasArrows");
                        $timeout(function () {
                            calcSharedValues();
                        });
                    }
                }
                else {
                    $scope.showLeftArrow = $scope.showRightArrow = false;
                    if (topContainer.hasClass("hasArrows")) {
                        topContainer.removeClass("hasArrows");
                        $timeout(function () {
                            calcSharedValues();
                        });
                    }
                }
            };

            var addDecorators = function () {
                var evenDecorator = $templateCache.get("lightTabsEvenDecorator.html");
                var oddDecorator = $templateCache.get("lightTabsOddDecorator.html");
                carousel.children("li").each(function (i) {
                    var currentLi = $(this);
                    if (i >= totalItems - 1) {
                        return false;
                    }
                    if (i % 2 === 0) {
                        currentLi.children("div").append($compile(evenDecorator)($scope));

                    }
                    else {
                        currentLi.children("div").append($compile(oddDecorator)($scope));

                    }


                });
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
                    return $scope.select(index);
                }
                if (canNavigate === true) {
                    canNavigate = false;
                    var finalPosition = calcFinalPosition(index);
                    setLeftPosition(finalPosition, index, true);
                }
            };

            var calculateBestPosition = function (steps) {
                updateCurrentLeftPosition();
                return currentLeftPosition - (steps * itemWidth);
            };

            $scope.scroll = function (steps) {
                if (canNavigate) {
                    canNavigate = false;
                    if (!steps)
                        return canNavigate = true;
                    updateCurrentLeftPosition();
                    if (steps < 0 && currentLeftPosition >= 0) {
                        return canNavigate = true;
                    }
                    if (steps > 0 && currentLeftPosition <= maxScroll) {
                        return canNavigate = true;
                    }
                    var destination = calculateBestPosition(steps);
                    var destinationIndex = $scope.selectedPaneIndex + steps;
                    if (destinationIndex < 0) {
                        destinationIndex = 0;
                    }
                    if (destinationIndex > totalItems - 1) {
                        destinationIndex = totalItems - 1;
                    }
                    setLeftPosition(destination, destinationIndex);
                }
            };

            $scope.goTo = navigate;

            $scope.select = function (index) {
                if (panes[index].paneDisabled) {
                    return true;
                }
                for (var i = 0; i < panes.length; i++) {
                    panes[i].selected = false;
                }
                panes[index].selected = true;
                $scope.selectedPaneIndex = index;
                $timeout(function () {
                    calcSharedValues();
                    setLeftPosition(calculateBestPosition(0));
                });
            };

            $scope.$watch("selectedPaneIndex", function (newIndex, oldIndex) {
                if (!!panes[newIndex] && !panes[newIndex].paneDisabled) {
                    navigate(newIndex);
                }
                else {
                    $scope.selectedPaneIndex = oldIndex;
                }
            });

            this.addPane = function (pane, last) {
                panes.push(pane);
                if (last) {
                    $timeout(function () {
                        initializeItems();
                    });
                }
            };

            //RESIZE EVENT
            ltWindow.off("resize.lightTabs_" + uniqueId).on("resize.lightTabs_" + uniqueId, function () {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function () {
                    console.info("RESIZE FOR UNIQUEID:" + uniqueId);
                    if (!visibleItemsSettings) {
                        visibleItemsSettings = getVisibleItemsSettings(responsiveSettings, totalItems, true);
                    }
                    visibleItems = updateVisibleItems();
                    calcSharedValues();
                    setLeftPosition(calcFinalPosition($scope.selectedPaneIndex));
                }, 250);
            });

        }];

        return {
            restrict: 'E',
            scope: {
                selectedPaneIndex: "=?",
                visibleItemsDesktop: "@?",
                visibleItemsTablet: "@?",
                visibleItemsMobile: "@?",
                lightTabsSkin: "@?",
                showIndicators: "@?",
                showDecorators: "@?"
            },
            transclude: true,
            controller: lightTabsCtrl,
            templateUrl: "lightTabsDefault.html"
        };
    }])
    .directive("lightTabsPane", function () {
        return {
            require: "^^lightTabs",
            restrict: "E",
            transclude: true,
            replace: true,
            scope: {
                paneDisabled: "=",
                paneClass: "="
            },
            link: function (scope, el, attrs, tabsCtrl) {
                scope.title = attrs.lightTabsTitle || "";
                var isLast = el.is(":last-child");
                if (!!attrs.ngRepeat) {
                    isLast = el.scope("ngRepeat").$last;
                }
                tabsCtrl.addPane(scope, isLast);

            },
            template: '<div ng-show="selected" ng-transclude></div>'
        };
    });