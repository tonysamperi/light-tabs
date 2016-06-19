ng-tabs
============

Simple and cool **Angular** widget to create responsive tabs!

# Index

  - [Introduction](#introduction)
  - [Requirements](#requirements)
  - [Usage](#usage)
  - [License](#license)

# Introduction

**ngTabs** is an AngularJS module, that lets you easily create responsive tabs in your website!
When there are more items then visible, arrows will be shown and let you navigate!
See the demo at tonysamperi.github.io/ng-tabs

# Requirements

The only requirement needed is [AngularJS](https://angularjs.org/) that you can install it via [Bower](http://bower.io/).

# Usage

Simply include the ng-tabs JS and CSS
```html
<html>
    <head>
        <script type="text/javascript" src="path-to/ng-tabs.js"></script>
        <link type="text/css" rel="stylesheet" href="path-to/ng-tabs.css" />
    </head>
</html>
```
Inject ngTabs in your app:
```js
var app = angular.module("myApp", ["ngTabs"]);
```
Remember to bootstrap your app by using the ng-app directive or the bootstrap method!
Put this simple snippet where you want the widget to appear
```html
<ng-tabs>
	<ng-tabs-pane ng-tabs-title="TAB 1 TITLE">
	</ng-tabs-pane>
</ng-tabs>
```
**Params**

| Option | Description | Type | Default value |
| --- | --- | --- | --- |
| **visible-items-desktop** | Number of elements to display on desktop (width > 992px) | String | 3 |
| **visible-items-tablet** | Number of elements to display on tablet (768px <= width >= 992px) | String | 3 |
| **visible-items-mobile** | Number of elements to display on mobile (width < 768px) | String | 1 |
| **force-visible** | 	By default, ng-tabs will control if visible items is higher than the number of tabs. if force-visible is "true", the control will be skipped. | String | false |
| **ng-tabs-title** | This param is to put on the <ng-tabs-pane> element. The title will be put in the tab toggle | String | null |

# License

Check out LICENSE file (MIT)
