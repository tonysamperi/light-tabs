angular.module("lightTabs", [])
	.run(function ($templateCache) {
        $templateCache.put('lightTabsIndicators.html', '<div class="lightTabs-switcher-container">\
					<div class="lightTabs-switcher"\
					    ng-repeat="pane in panes"\
						 ng-click="goTo($index)"\
						 ng-class="{\'selected\': pane.selected}"></div>\
				</div>');
				
		$templateCache.put('lightTabsDefault.html', '<div class="light-tabs-top-container">\
			<ul class="light-tabs animate-left">\
				<li ng-repeat="pane in panes track by $index"\
					ng-click="select($index)"\
					ng-class="{selected:pane.selected}" class="noSelect">\
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
		var visibleItemsSettings;
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
			var deviceWidth = ltWindow.width();
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

		var lightTabsCtrl = ['$scope', '$element', '$attrs', function ($scope, el, attrs) {
				el.addClass("noSelect");
				var panes = $scope.panes = [];
				$scope.selectedPaneIndex = 0;
				var topContainer = el.children().first();
				var carousel = topContainer.children("ul.light-tabs");
				var resizeTimeout, totalItems, maxScroll, canNavigate = true, itemWidth, visibleItems, currentLeftPosition;
				var force = attrs["forceVisible"] === "true";

				var showIndicators = function () {
					var indicators = $templateCache.get("lightTabsIndicators.html");
					indicators = $(indicators).addClass(attrs["showIndicators"]);
					topContainer.before(indicators);
					$compile(indicators)($scope);
				};

				var initializeItems = function () {
					if (!!attrs["showIndicators"]) {
						showIndicators();
					}
					if (!!attrs.skin) {
						el.addClass(attrs.skin);
					}
					carousel.children("li:last").addClass("last");
					totalItems = carousel.children().length;
					visibleItemsSettings = getVisibleItemsSettings(attrs, totalItems, force);
					visibleItems = updateVisibleItems();
					$scope.select(0);
					handleArrows();
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
					var outerWidth = topContainer.width();
					itemWidth = Math.ceil(outerWidth / visibleItems);
					childSet.outerWidth(itemWidth);
					var childSetWidth = childSet.outerWidth();
					maxScroll = (childSet.length * childSetWidth) - (visibleItems * childSetWidth);
					maxScroll *= -1;
					console.debug("maxScroll = ", maxScroll);
					console.debug("itemWidth = ", itemWidth);
					updateCurrentLeftPosition();
				};

				var updateCurrentLeftPosition = function () {
					currentLeftPosition = carousel.position().left;
					currentLeftPosition = Math.floor(currentLeftPosition / itemWidth) * itemWidth;
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
						setLeftPosition(finalPosition);
						$scope.select(index);
					}
				};

				var calculateBestPosition = function (steps) {
					updateCurrentLeftPosition();
					if (visibleItems > 1) {
						return  currentLeftPosition - (steps * itemWidth);
					}
					return 0 - ($scope.selectedPaneIndex + steps) * itemWidth;
				};

				$scope.scroll = function (steps) {
					if (canNavigate) {
						canNavigate = false;
						if (!steps)
							return canNavigate = true;
						updateCurrentLeftPosition();
						if (steps < 0 && currentLeftPosition >= 0)
							return canNavigate = true;
						if (steps > 0 && currentLeftPosition <= maxScroll)
							return canNavigate = true;
						var destination = calculateBestPosition(steps);
						setLeftPosition(destination, steps);
					}
				};

				$scope.goTo = navigate;

				$scope.select = function (index) {
					for (var i = 0; i < panes.length; i++) {
						panes[i].selected = false;
					}
					panes[index].selected = true;
					$scope.selectedPaneIndex = index;
					$timeout(function () {
						calcSharedValues();
					});
				};

				this.addPane = function (pane, last) {
					panes.push(pane);
					if (last) {
						$timeout(function () {
							initializeItems();
						});
					}
				};
				
				//RESIZE EVENT
				ltWindow.on("resize.lightTabs", function () {
					clearTimeout(resizeTimeout);
					resizeTimeout = setTimeout(function () {
						if (!visibleItemsSettings) {
							visibleItemsSettings = getVisibleItemsSettings(attrs, totalItems, true);
						}
						visibleItems = updateVisibleItems();
						calcSharedValues();
						setLeftPosition(calcFinalPosition($scope.selectedPaneIndex));
					}, 250);
				});

			}];

		return {
			restrict: 'E',
			scope: true,
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
			scope: true,
			link: function (scope, el, attrs, tabsCtrl) {
				scope.title = attrs.lightTabsTitle || "";
				tabsCtrl.addPane(scope, el.is(":last-child"));
			},
			template: '<div ng-show="selected" ng-transclude></div>'
		};
	});