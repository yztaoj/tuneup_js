//TODO list
//skip last 8 operation
//don't catch exceptions
//drag/flick random path improve
//flick buttom
//page by page covery
#import "config.js"
function extend(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
}

function log(content){
	var out = content.toString();
	if(typeof content == "object")
		out += " :"+JSON.stringify(content);

	UIALogger.logMessage(out);
}

extend(UIATarget.prototype, {
	waitReaction: function(preDelay){
		this.pushTimeout(0);

		var oldBID = this.frontMostApp().bundleID();
		
		if(preDelay) this.delay(preDelay);

		var counter = 300; //half second
		while(counter--){
			var app = this.frontMostApp();
			var newBID = app.bundleID();
			if(newBID != oldBID) {
				this.popTimeout();
				throw "app jumped out!!! "+newBID;
			}

			try{
				if(!app.mainWindow().inProgress())
					break;
				else
					this.delay(0.1);
			}
			catch(err){
				log(err);
				break;
			}
		}

		if (counter == 0) log("waitReaction timeout!");
		
		this.popTimeout();
	}
});

extend(UIAElement.prototype, {
	findButton: function(name){
		function finder(element){
			if(element instanceof UIAButton &&
				element.name() == name) return true;
			return false;
		}
		return this.traverse(finder);
	},
	findTextField: function(){
		function finder(element){
			if(element instanceof UIATextField) return true;
			return false;
		}
		return this.traverse(finder);
	},
	inspect: function (){
		var elements = this.elements();
		var len = elements.length;
		for(var i = 0; i < len; i++){
			if(elements[i].isVisible())
				elements[i].inspect();
		}
		this.logElement();
	},
	isFullScreen: function(){
		var rect = this.rect();
		var screenRect = this.ancestry()[0].rect();
		return (rect.size.x == screenRect.size.x && 
			rect.size.y == screenRect.size.y)
	},
	accessible: function (){
		if (!this.isEnabled() ||
			this.isIndicator() ||
			this instanceof UIAKey ||
			this instanceof UIAWebView
			)
			return false;

		if(!this.isVisible() &&
			(!(this instanceof UIAScrollView) || 
				!this.isFullScreen())
			)
			return false;

		var name = this.name();
		if(name && name.match("notap$")) return false;

		var childs = this.elements();
		if(childs.isValid()){
			if(this instanceof UIATableView ||
				this instanceof UIAScrollView)
				return true;
		}
		else{//leaf node
			var size = this.rect().size;
			if(size.width < 28 || size.height < 18) return false;
			if(this instanceof UIAStaticText &&
				size.x < 40 &&
				size.y < 40){
				return false;
			}

			var rect = this.hitpoint();
			if(rect && rect.y > 20){
				return true;
			}
		}

		return false;
	},
	isIndicator: function(){
		if(this instanceof UIAProgressIndicator ||
			this instanceof UIAActivityIndicator ||
			this instanceof UIAPageIndicator)
			return true;
		return false;
	},
	traverse: function(func){
		if(func(this)) return this;

		var elements = this.elements();
		if(elements instanceof UIAElementNil) return false;

		for(var i=0; i<elements.length; i++){
			var ret = elements[i].traverse(func);
			if(ret) return ret;
		}
		return false;
	},
	inProgress: function(){
		return this.traverse(function(element){
			if(!element.isVisible()) return false;

			if(element instanceof UIAActivityIndicator ||
				element instanceof UIAProgressIndicator){
				return true;
			}

			return false;
		});
	},
	signature: function(){
		var ancestry = this.ancestry();
		var parent = ancestry[ancestry.length-2];
		var tmp = "";
		var position = parent.childPosition(this);
		for(var i = 0; i< ancestry.length; i++){
			tmp += ancestry[i].toString()+"->";
		}
		return tmp+"name:"+this.name()+position;//+":"+this.value()+":"+this.label();
	},
	sameElement: function(target){
		if(this.toString() != this.toString() ||
			this.name() != target.name() ||
			this.value() != target.value() ||
			this.label() != target.label())
			return false;

		//UI element with same location
		var selfRect = this.rect();
		var targetRect = target.rect();
		if(selfRect.size.width != targetRect.size.width ||
			selfRect.size.height != targetRect.size.height ||
			selfRect.origin.x != targetRect.origin.x ||
			selfRect.origin.y != targetRect.origin.y)
			return false;

		var childsL = this.elements();
		var childsR = target.elements();
		var len = childsL.length;
		if(len != childsR.length) return false;

		for(var i = 0; i < len; i++){
			if(!childsL[i].sameElement(childsR[i])) return false;
		}

		return true;
	},
	childPosition: function(child){
		var childs = this.elements();
		var len = childs.length;
		var i = 0;
		for(; i < len; i++){
			if(child.sameElement(childs[i])){
				i++;
				break;
			}
		}
		return i+"/"+len;
	}
});


function Monkey(target){
	this.device = target;
	this.app = target.frontMostApp();
	this.his = {};
	this.targets = [];
	this.config = config;
	return this;
}
extend(Monkey.prototype, {
	memWarn: function(){
		if(this.device.model() != "iPhone Simulator") return false;

		var cmd = "on memWarn()\n"+
					"tell application \"System Events\"\n"+
						"tell process \"iOS 模拟器\"\n"+
							"set frontmost to true\n"+
							"keystroke \"M\" using {command down, shift down}\n"+
						"end tell\n"+
					"end tell\n"+
				"end memWarn\n"+
				"memWarn()";
		var host = this.device.host();
		return host.performTaskWithPathArgumentsTimeout("/usr/bin/osascript",
			["-e", cmd], 1);
	},
	dismissWelcome: function(){
		this.device.pushTimeout(0.5);
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.app.flickInsideWithOptions({startOffset:{x:1,y:0.5},endOffset:{x:0,y:0.5}});
		this.device.popTimeout();
	},
	findHistory: function(element){
		//element.logElement();
		var key = element.signature(element);

		if (this.his[key]){
			this.his[key] = (this.his[key] + 1) % 4;
			return this.his[key]?true:false;
		}
		else{
			if(this.his[key] != 0)
				log("new key: "+key);
			this.his[key] = 1;
			return false;
		}
	},
	getTargets: function(){
		function addTarget(element){
			if(element.accessible()){
				//element.logElement();
				self.targets.push(element);
			}
		}

		this.targets = [];
		var self = this;
		this.app.traverse(addTarget);
	},
	selectTarget: function(){
		var len = this.targets.length;
		if (!len) {
			this.app = this.device.frontMostApp();			
			throw 'no UI targets!!!!';
		}

		for(var i = 0; i < len; i++){
			var element = this.targets[i];
			if(element instanceof UIASecureTextField &&
				this.tryLogin(element) != "impossible")
				return null;
		}

		var position = Math.floor(Math.random()*len);
		while(this.findHistory(this.targets[position])){
			position = Math.floor(Math.random()*len);
		}

		return this.targets[position];
	},
	jump: function(){
		this.device.pushTimeout(0);

		if(!this.globalEvent(target)){
			try{
				//this.app.logElementTree();
				this.getTargets();
				var target = this.selectTarget();
				if(target)
					this.operate(target);
			}
			catch(err){
				log(err);
			}
		}
		this.device.waitReaction(0.4);
		this.device.popTimeout();
	},
	operate: function(element){
		if(element instanceof UIASwitch){
			element.setValue(element.value()?0:1);
		} 
		else if(element instanceof UIATextView ||
			element instanceof UIATextField ||
			element instanceof UIASearchBar){
			element.setValue(this.randomString());
		}
		else if (element instanceof UIASecureTextField){
			element.setValue(this.randomString());
		}
		else if (element instanceof UIAScrollView){
			element.flickInsideWithOptions(this.randomPath(element));
		}else{
			element.tapWithOptions({tapOffset: this.randomPoint(element)});
		}
	},
	tryLogin: function(secureTextField){
		if(!this.config || this.config.usr == "") return "impossible";
		if(this.config.loginFailure){
			this.config.loginFailure--;
			return "impossible";
		}

		var ret = true;
		var mainWindow = this.app.mainWindow();
		var parent = secureTextField.parent();
		var textField = parent.textFields().firstWithPredicate("isEnabled == 1");
		if(!textField.isValid()){
			//taobao login treatment
			parent = parent.parent();
			textField = parent.findTextField();
		}

		var loginButton = mainWindow.findButton("登录");
		if(!loginButton) loginButton = mainWindow.findButton(null);

		if(textField && 
			textField.isValid() &&
			textField.isVisible() &&
			loginButton &&
			loginButton.isVisible()){

			textField.setValue(this.config.login.usr);

			secureTextField.tap();
			this.device.delay(0.5);
			var keyboard = this.app.keyboard();
			if(keyboard.isValid() && secureTextField.hasKeyboardFocus()){
				secureTextField.setValue("");
				keyboard.typeString(this.config.login.psw);
			}
			else{
				secureTextField.setValue(this.config.login.psw);
			}
			loginButton.tap();

			this.device.pushTimeout(4);
			if(!loginButton.waitForInvalid()){
				this.config.loginFailure = 100;
				ret = false;
			}
			this.device.popTimeout();

			var cancelButton = mainWindow.buttons()["返回"];
			if(cancelButton.isValid()) cancelButton.tap();
			return ret;
		}
		else{
			return "impossible";
		}
	},
	randomString: function(len){
		var chars="0123456789qwertyuioplkjhgfdsazxcvbnm";
		var out="";
		var length = Math.floor(Math.random()*(len?len:20));
		for(var i = 0;i < length;i++){
			out += chars.charAt(Math.floor(Math.random()*chars.length));
		}
		return out;		
	},
	deltaRect: function(element){
		var rect = element.rect();
		var origin = rect.origin;
		var size = rect.size;
		var screenRect = this.app.rect();
		var x1 = Math.max(origin.x, 0);
		var x2 = Math.min(origin.x + size.width, screenRect.size.width);
		var y1 = Math.max(origin.y, 0);
		var y2 = Math.min(origin.y + size.height, screenRect.size.height);

		return {
			offset: {x: (x1-origin.x)/size.width, y: (y1-origin.y)/size.height},
			size: {x: (x2-x1)/size.width, y: (y2-y1)/size.height}
		};
	},
	randomPoint: function(element){
		var deltaRect = this.deltaRect(element);
		var x = (Math.random() * deltaRect.size.x + deltaRect.offset.x).toFixed(4);
		var y = (Math.random() * deltaRect.size.y + deltaRect.offset.y).toFixed(4);

		return {x:x,y:y};
	},
	randomPath: function(element){
		var p1 = this.randomPoint(element);
		var p2 = this.randomPoint(element);
		return {startOffset:p1, endOffset:p2};
	},
	globalEvent: function(){
		try{
			var key = Math.floor(Math.random()*50);
			switch(key){
				case 0:
					var orientations = [
						UIA_DEVICE_ORIENTATION_PORTRAIT,
						UIA_DEVICE_ORIENTATION_PORTRAIT_UPSIDEDOWN,
						UIA_DEVICE_ORIENTATION_LANDSCAPELEFT,
						UIA_DEVICE_ORIENTATION_LANDSCAPERIGHT
					];

					var i = Math.floor(Math.random() * orientations.length);
					var newOrientation = orientations[i];
					this.device.setDeviceOrientation(newOrientation);
					return true;
				case 1:
					this.device.clickVolumeUp();
					return true;
				case 2:
					this.device.clickVolumeDown();
					return true;
				case 3:
					this.device.shake();
					return true;
				case 4:
					this.device.deactivateAppForDuration(1+Math.random());
					return true;
				default:
					return false;
			}
		}
		catch(err){
			log(err);
		}
	}
});

