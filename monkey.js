"use strict";
#import "gen-ext.js"

var target = UIATarget.localTarget();
var app = target.frontMostApp();
target.pushTimeout(0);
//target.frontMostApp().mainWindow().logElementTree();
//target.frontMostApp().mainWindow().logUI();
//log(target.frontMostApp() instanceof UIAElement);

//log(target.frontMostApp().bundleID());
//target.delay(0.5);
//log(target.frontMostApp().bundleID());
//target.deactivateAppForDuration(0.1);
var monkey = new Monkey(target);
while(true)
	monkey.jump();
//monkey.getTargets();
//log(monkey.globalEvent(tget.frontMostApp().mainWindow().buttons()[0]));
//sv.buttons()[0].scrollToVisible();
//sv.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
target.popTimeout();
