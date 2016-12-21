light-tabs
============

Simple and cool **Angular** widget to create responsive tabs!

# Index

  - [Introduction](#introduction)
  - [Requirements](#requirements)
  - [Usage](#usage)
  - [License](#license)

# Introduction

**lightTabs** is an AngularJS module, that lets you easily create responsive tabs in your website!
When there are more items then visible, arrows will be shown and let you navigate!
See the demo at tonysamperi.github.io/ng-tabs

# Requirements

The only requirement needed is [AngularJS](https://angularjs.org/) that you can install it via [Bower](http://bower.io/).

# Usage

Simply include the light-tabs JS and CSS
```html
<html>
    <head>
        <script type="text/javascript" src="path-to/light-tabs.js"></script>
        <link type="text/css" rel="stylesheet" href="path-to/light-tabs.css" />
	<!-- OPTIONAL STYLE FOR decorators skin. Add show-decorators="true" to light-tabs attributes to activate it -->
	<link type="text/css" rel="stylesheet" href="path-to/light-tabs-decorator.css" />
    </head>
</html>
```
Inject lightTabs in your app:
```js
var app = angular.module("myApp", ["lightTabs"]);
```
Remember to bootstrap your app by using the ng-app directive or the bootstrap method!
Put this simple snippet where you want the widget to appear
```html
<light-tabs>
	<light-tabs-pane light-tabs-title="TAB 1 TITLE">
	</light-tabs-pane>
</light-tabs>
```
**Params**

| Option | Description | Type | Default value |
| --- | --- | --- | --- |
| **skin** | An optional class which will be added to light-tabs | String | null |
| **show-decorators** | This activates a special skin with decorators when its value is "true" | String | null |
| **visible-items-desktop** | Number of elements to display on desktop (width > 992px) | String | 3 |
| **visible-items-tablet** | Number of elements to display on tablet (768px <= width >= 992px) | String | 3 |
| **visible-items-mobile** | Number of elements to display on mobile (width < 768px) | String | 1 |
| **force-visible** | 	By default, ng-tabs will control if visible items is higher than the number of tabs. if force-visible is "true", the control will be skipped. | String | false |
| **light-tabs-title** | This param is to put on the <ng-tabs-pane> element. The title will be put in the tab toggle | String | null |

# License

Check out LICENSE file (MIT)
