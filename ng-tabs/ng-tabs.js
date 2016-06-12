angular.module("ngTabs",[])
	.run(function($templateCache) {

			$templateCache.put('indicators.html', '<div class="ngTabs-switcher-container">\
					<div class="ngTabs-switcher"\
					    ng-repeat="pane in panes"\
						 ng-click="goTo($index)"\
						 ng-class="{\'selected\': pane.selected}"></div>\
				</div>');

	})
	.directive("ngTabs", ["$templateCache", "$compile", "$timeout", function ($templateCache, $compile, $timeout) {
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
				else{
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
		
		var ngTabsCtrl = ['$scope', '$element', '$attrs', function($scope, el, attrs){
			el.addClass("noSelect");
            var panes = $scope.panes = [];
            var selectedPaneIndex = 0;
			var carousel = el.children("ul:first");
			var totalItems, maxScroll, canNavigate = true, itemWidth, visibleItems;
			var force = attrs["forceVisible"] === "true";
			var adjustScroll = function () {
				var childSet = carousel.children();
				itemWidth = Math.ceil(el.width() / visibleItems);
				childSet.outerWidth(itemWidth);
				var childSetWidth = childSet.outerWidth();
				maxScroll = (childSet.length * childSetWidth) - (visibleItems * childSetWidth);
				maxScroll *= -1;
			};
			var isSelectedTabVisible = function (selectedTabIndex, leftPosition) {
				var index = (leftPosition + itemWidth) / -itemWidth;
				return index === selectedTabIndex;
			};
			
			var getVisibleTabIndex = function(){
				var currentPositionLeft = carousel.position().left;
				return Math.abs((currentPositionLeft + itemWidth) / -itemWidth +1);
			};

			var checkScroll = function (leftPosition) {
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

			var moveLeft = function (left, index) {
				carousel.css("left", left);
				//$timeout(function () {
					//carousel.children("li:eq(" + index + ")").click();
                    $scope.select(panes[index]);
					canNavigate = true;
				//}, 250);
			};

			var navigate = function (currentPositionLeft, steps) {
				if (canNavigate === true) {
					canNavigate = false;
					var position = currentPositionLeft - itemWidth * steps;
					var index = (position + itemWidth) / -itemWidth;
					index++;
					moveLeft(position, index);
					checkScroll(position);
				}
			};

			var getStepsByIndex = function (index) {
				if (index > totalItems - 1) index = totalItems;
				if (index < 0) index = 0;
				var visibleTabIndex = getVisibleTabIndex();
				return index - visibleTabIndex;
			};

			$scope.scrollRight = function (steps, index) {
				if (steps === undefined)
					steps = 1;
				var carouselWidth = el.width();
				itemWidth = Math.ceil(carouselWidth / visibleItems);

				var difObject = itemWidth - carouselWidth;
				var currentPositionLeft = carousel.position().left;
				var objPosition = currentPositionLeft + (totalItems - visibleItems) * itemWidth - carouselWidth;

				if (difObject <= Math.ceil(objPosition)) {
					navigate(currentPositionLeft, steps);
				}
				else {
					$timeout(function () {
						if(index === undefined) index = 0;
						//carousel.children("li:eq(" + index + ")").click();
                        $scope.select(panes[index]);
						checkScroll(currentPositionLeft);
					});
				}
			};

			$scope.scrollLeft = function (steps, index) {
				if (steps === undefined)
					steps = -1;
				var currentPositionLeft = carousel.position().left;
				var innerWidth = el.width();
				itemWidth = Math.ceil(innerWidth / visibleItems);
				if (currentPositionLeft < 0) {
					navigate(currentPositionLeft, steps);
				}
				else {
					$timeout(function () {
						if(index === undefined) index = 0;
						carousel.children("li:eq(" + index + ")").click();
						checkScroll(currentPositionLeft);
					});
				}

			};

			$scope.goTo = function (index) {
				if (index === undefined){
					carousel.css("left", 0);
					checkScroll(0);
				}
				var steps = getStepsByIndex(index);
				if (steps > 0) {
					$scope.scrollRight(steps, index);
				}
				else {
					$scope.scrollLeft(steps, index);
				}
			};

			$scope.initializeItems = function () {
				carousel.children("li:last").addClass("last");
                if(attrs["showIndicators"]==="true"){
                    var indicators = $templateCache.get("indicators.html");
                    indicators = angular.element(indicators);
                    carousel.before(indicators);
                    $compile(indicators)($scope);
                }
				totalItems = carousel.children().length;
				visibleItemsSettings = getVisibleItemsSettings(attrs, totalItems, force);
				visibleItems = updateVisibleItems();
				adjustScroll();
				if (carousel.position().left <= maxScroll)
					carousel.css("left", 0);
				checkScroll(0);
			};

            $scope.select = function(pane) {
                angular.forEach(panes, function(pane) {
                    pane.selected = false;
                });
                pane.selected = true;
            };

            this.addPane = function(pane, last) {
                if (panes.length === 0) {
                    $scope.select(pane, last);
                }
                panes.push(pane);
                if(last){
                    $timeout(function(){
                        $scope.initializeItems();
                    });
                }
            };

			angular.element(window).off("resize.ngTabs").on("resize.ngTabs", function () {
				$timeout.cancel(resizeTimeout);
				var resizeTimeout = $timeout(function () {
					if (!visibleItemsSettings) {
						visibleItemsSettings = getVisibleItemsSettings(attrs, totalItems, true);
					}
					visibleItems = updateVisibleItems();
					adjustScroll();
					var currentLeftPosition = carousel.position().left;
					if (currentLeftPosition < maxScroll) {
						if (visibleItems < totalItems) {
							$scope.goTo(0);
						}
						else {
							carousel.css("left", 0);
							checkScroll(0);
						}
					}
					else {
						var selectedTabIndex = carousel.children(".selected").index();
						!isSelectedTabVisible(selectedTabIndex, currentLeftPosition) && $scope.goTo(selectedTabIndex);
					}

				}, 250);
			});
		}];
		
		return {
			restrict: 'E',
			scope: false,
            transclude: true,
			controller: ngTabsCtrl,
            templateUrl: "./ng-tabs/templates/tabs.html"
		};
	}])
	.directive("ngTabsPane", function(){
		return {
			require: "^^ngTabs",
			restrict: "E",
            transclude: true,
            replace: true,
            scope: true,
			link: function(scope, el, attrs, tabsCtrl){
                scope.title = attrs["ngTabsTitle"] || "";
				tabsCtrl.addPane(scope, el.is(":last-child"));
			},
            template: '<div class="ng-tabs-pane" ng-show="selected" ng-transclude></div>'
		};
	});
