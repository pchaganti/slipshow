import { cloneNoSubslip, myQueryAll, replaceSubslips } from './util'

export default function (name, fullName, actionL, ng, options) {

    // ******************************
    // Action List
    // ******************************
    let actionList = actionL || this.generateActionList();
    this.setAction = (actionL) => {actionList = actionL;};
    this.getActionList = () => {
	let ret = [];
	for(let i = 0;i <= this.getMaxNext(); i++) {
	    if(typeof actionList[i] == "function" || actionList[i] instanceof Slip)
		ret[i] = actionList[i];
	    else
		ret[i] = () => {};
	}
	return ret;
    };
    this.setNthAction = (n,action) => {actionList[n] = action;};
    this.getSubSlipList = function () {
	return actionList.filter((action) => action instanceof Slip);
    };
    this.generateActionList = () => {
	this.queryAll(".slip");
    };

    // ******************************
    // Action Index
    // ******************************
    let actionIndex = -1;
    this.setActionIndex = (actionI) => actionIndex = actionI;
    this.getActionIndex = () => actionIndex;
    this.getMaxNext = () => {
	if(this.maxNext)
	    return this.maxNext;
	let maxTemp = actionList.length;
	["mk-visible-at",
	 "mk-hidden-at",
	 "mk-emphasize-at",
	 "mk-unemphasize-at",
	 "emphasize-at",
	 "chg-visib-at",
	 "up-at",
	 "down-at",
	 "center-at",
	 "static-at",
	 "exec-at",
	].forEach((attr) => {
	     this.queryAll("*["+attr+"]").forEach((elem) => {
		 elem.getAttribute(attr).split(" ").forEach((strMax) => {
		     maxTemp = Math.max(Math.abs(parseInt(strMax)),maxTemp);
		 });
	     });
	});
	let sumArray = this.queryAll("*[pause]").map((elem) => { if(elem.getAttribute("pause") != "") return parseInt(elem.getAttribute("pause")); return 1; });
	maxTemp = Math.max(maxTemp, sumArray.reduce((a,b) => a+b, 0));
	this.maxNext = maxTemp;
	return maxTemp;	
    };
    
    // ******************************
    // Queries
    // ******************************
    this.queryAll = (quer) => {
	let allElem = Array.from(this.element.querySelectorAll(quer));
	let other = Array.from(this.element.querySelectorAll("#"+name+" .slip "+quer));
	return allElem.filter(value => !other.includes(value));
    };
    this.query = (quer) => {
	return this.queryAll(quer)[0];
    };
    
    // ******************************
    // Coordinates
    // ******************************
    this.findSlipCoordinate = () => { // rename to getCoordInUniverse
	let coord = engine.getCoordinateInUniverse(this.element);
	console.log("debug findslipcoordinate", coord);
	coord.scale *= this.scale;
	coord.y = coord.y + 0.5*coord.scale;
	coord.x = coord.centerX;
	console.log("debug findslipcoordinate", coord);
	return coord;
    };


    // ******************************
    // Pause functions
    // ******************************
    this.updatePauseAncestors = () => {
	this.queryAll(".pauseAncestor").forEach((elem) => {elem.classList.remove("pauseAncestor");});
	let pause = this.query("[pause]");
	while(pause && !pause.classList.contains("slip")) {
	    pause.classList.add("pauseAncestor");
	    pause = pause.parentElement;
	};
    };
    this.incrPause = () => {
	let pause = this.query("[pause]");
	if(pause) {
	    if(!pause.getAttribute("pause")) 
		pause.setAttribute("pause", 1);
	    let d = pause.getAttribute("pause");
	    if (d <= 1){
		pause.removeAttribute("pause");
		if(pause.hasAttribute("down-at-unpause")) {
		    if(pause.getAttribute("down-at-unpause") == "")
			this.moveDownTo(pause, 1);
		    else
			this.moveDownTo("#"+pause.getAttribute("down-at-unpause"), 1);			
		}
		if(pause.hasAttribute("up-at-unpause")) {
		    if(pause.getAttribute("up-at-unpause") == "")
			this.moveUpTo(pause, 1);
		    else
			this.moveUpTo("#"+pause.getAttribute("up-at-unpause"), 1);
		}
		if(pause.hasAttribute("center-at-unpause"))
		    this.moveCenterTo(pause, 1);
	    } else
		pause.setAttribute("pause", d-1);
	    this.updatePauseAncestors();
	}
    };

    // ******************************
    // Next functions
    // ******************************
    this.doAttributes = () => {
	this.queryAll("*[mk-hidden-at]").forEach((elem) => {
	    let hiddenAt = elem.getAttribute("mk-hidden-at").split(" ").map((str) => parseInt(str));
	    if(hiddenAt.includes(actionIndex))
		elem.style.opacity = "0";});	
	this.queryAll("*[mk-visible-at]").forEach((elem) => {
	    let visibleAt = elem.getAttribute("mk-visible-at").split(" ").map((str) => parseInt(str));
	    if(visibleAt.includes(actionIndex))
		elem.style.opacity = "1";});	
	this.queryAll("*[mk-emphasize-at]").forEach((elem) => {
	    let emphAt = elem.getAttribute("mk-emphasize-at").split(" ").map((str) => parseInt(str));
	    if(emphAt.includes(actionIndex))
		elem.classList.add("emphasize");});	
	this.queryAll("*[mk-unemphasize-at]").forEach((elem) => {
	    let unemphAt = elem.getAttribute("mk-unemphasize-at").split(" ").map((str) => parseInt(str));
	    if(unemphAt.includes(actionIndex))
		elem.classList.remove("emphasize");});	
	this.queryAll("*[emphasize-at]").forEach((elem) => {
	    let emphAt = elem.getAttribute("emphasize-at").split(" ").map((str) => parseInt(str));
	    if(emphAt.includes(actionIndex))
		elem.classList.add("emphasize");
	    else
		elem.classList.remove("emphasize");
	});	
	this.queryAll("*[chg-visib-at]").forEach((elem) => {
	    let visibAt = elem.getAttribute("chg-visib-at").split(" ").map((str) => parseInt(str));
	    if(visibAt.includes(actionIndex))
		elem.style.opacity = "1";
	    if(visibAt.includes(-actionIndex))
		elem.style.opacity = "0";
	});	
	this.queryAll("*[static-at]").forEach((elem) => {
	    let staticAt = elem.getAttribute("static-at").split(" ").map((str) => parseInt(str));
	    if(staticAt.includes(-actionIndex)){
		elem.style.position = "absolute";
		elem.style.visibility = "hidden";
	    }
	    if(staticAt.includes(actionIndex)) {
		elem.style.position = "static";
		elem.style.visibility = "visible";
	    }
	});	    
	this.queryAll("*[down-at]").forEach((elem) => {
	    let goDownTo = elem.getAttribute("down-at").split(" ").map((str) => parseInt(str));
	    if(goDownTo.includes(actionIndex))
		this.moveDownTo(elem, 1);
	});
	this.queryAll("*[up-at]").forEach((elem) => {
	    let goTo = elem.getAttribute("up-at").split(" ").map((str) => parseInt(str));
	    if(goTo.includes(actionIndex))
		this.moveUpTo(elem, 1);});
	this.queryAll("*[center-at]").forEach((elem) => {
	    let goDownTo = elem.getAttribute("center-at").split(" ").map((str) => parseInt(str));
	    if(goDownTo.includes(actionIndex))
		this.moveCenterTo(elem, 1);});	
	this.queryAll("*[exec-at]").forEach((elem) => {
	    let toExec = elem.getAttribute("exec-at").split(" ").map((str) => parseInt(str));
	    if(toExec.includes(actionIndex))
		(new Function("slip",elem.innerHTML))(this);});	
    };
    this.incrIndex = () => {
	console.log("incrIndex");
	actionIndex = actionIndex+1;
	this.doAttributes();
	if(actionIndex>0)
	    this.incrPause();
	this.updateToC();
    };
    this.next = function () {
	if(actionIndex >= this.getMaxNext())
	    return false;
	this.incrIndex();
	if(typeof actionList[actionIndex] == "function") {
	    actionList[actionIndex](this);
	}
	if(actionList[actionIndex] instanceof Slip){
	    return actionList[actionIndex];
	}
	return true;
    };
    this.previous = () => {
	let savedActionIndex = this.getActionIndex();
	this.doRefresh();
	if(savedActionIndex == -1)
	    return false;
 	let toReturn;
	while(this.getActionIndex()<savedActionIndex-1)
	    toReturn = this.next();
	return toReturn;
    };

    // ******************************
    // ToC functions
    // ******************************
    this.setTocElem = (tocElem) => {this.tocElem = tocElem;};
    this.updateToC = () => {
	if(!this.tocElem)
	    return;
	if(!this.ToCList)
	    this.ToCList = myQueryAll(this.tocElem, "li", "li");
	let i;
	for(i=0;i<this.getActionIndex(); i++) {
	    this.ToCList[i].classList.remove("before", "after", "current");
	    this.ToCList[i].classList.add("before");	    
	}
	if(i<=this.getActionIndex()) {
	    this.ToCList[i].classList.remove("before", "after", "current");
	    this.ToCList[i].classList.add("current");
	    i++;
	}
	for(i;i<=this.getMaxNext(); i++) {
	    this.ToCList[i].classList.remove("before", "after", "current");
	    this.ToCList[i].classList.add("after");
	}	
    };
    this.firstVisit = () => {
	this.updateToC();
	if(options.firstVisit)
	    options.firstVisit(this);
    };
    this.init = () => {
	this.queryAll("*[chg-visib-at]").forEach((elem) => {
	    elem.style.opacity = "0";
	});	
	this.queryAll("*[static-at]").forEach((elem) => {
	    elem.style.position = "absolute";
	    elem.style.visibility = "hidden";
	});	
	this.doAttributes();
	this.updatePauseAncestors();
	if(options.init)
	    options.init(this);
    };

    // ******************************
    // Refreshes
    // ******************************
    this.refresh = () => {
	if(actionList[actionIndex] instanceof Slip)
	    actionList[actionIndex].refresh();
	else
	    this.doRefresh();
    };
    this.refreshAll = () => {
	actionList.filter((elem) => elem instanceof Slip).forEach((subslip) => { subslip.refreshAll();});
	this.doRefresh();
    };
    this.doRefresh = () => {
	this.setActionIndex(-1);
	let subSlipList = myQueryAll(this.element, ".slip");;
	let clone = clonedElement.cloneNode(true);
	replaceSubslips(clone, subSlipList);
	this.element.replaceWith(clone);
	this.element = clone;
	this.init();
	this.firstVisit();
	delete(this.currentX);
	delete(this.currentY);
	engine.gotoSlip(this);
    };

    // ******************************
    // Movement and hide/show
    // ******************************
    this.moveUpTo = (selector, delay,  offset) => {
	setTimeout(() => {
	    let elem;
	    if(typeof selector == "string") elem = this.query(selector);
	    else elem = selector;
	    if (typeof offset == "undefined") offset = 0.0125;
	    let coord = this.findSlipCoordinate();
	    let d = ((elem.offsetTop)/1080-offset)*coord.scale;
	    this.currentX = coord.x;
	    this.currentY = coord.y+d;
	    engine.moveWindow(coord.x, coord.y+d, coord.scale, this.rotate, delay);
	},0);
    };
    this.moveDownTo = (selector, delay, offset) => {
	setTimeout(() => {
	    let elem;
	    if(typeof selector == "string") elem = this.query(selector);
	    else elem = selector;
	    if (typeof offset == "undefined") offset = 0.0125;
	    let coord = this.findSlipCoordinate();
	    let d = ((elem.offsetTop+elem.offsetHeight)/1080 - 1 + offset)*coord.scale;
	    this.currentX = coord.x;
	    this.currentY = coord.y+d;
	    engine.moveWindow(coord.x, coord.y+d, coord.scale, this.rotate, delay);
	},0);
    };
    this.moveCenterTo = (selector, delay, offset) => {
	setTimeout(() => {
	    let elem;
	    if(typeof selector == "string") elem = this.query(selector);
	    else elem = selector;
	    if (typeof offset == "undefined") offset = 0;
	    let coord = this.findSlipCoordinate();
	    let d = ((elem.offsetTop+elem.offsetHeight/2)/1080-1/2+offset)*coord.scale;
	    this.currentX = coord.x;
	    this.currentY = coord.y+d;
	    engine.moveWindow(coord.x, coord.y+d, coord.scale, this.rotate, delay);
	},0);
    };
    this.reveal = (selector) => {
	this.query(selector).style.opacity = "1";
    };
    this.revealAll = (selector) => {
	this.queryAll(selector).forEach((elem) => { elem.style.opacity = "1";});
    };
    this.hide = (selector) => {
	this.query(selector).style.opacity = "0";
    };
    this.hideAll = (selector) => {
	this.queryAll(selector).forEach((elem) => { elem.style.opacity = "0";});
    };

    // ******************************
    // Initialisation of the object
    // ******************************
    // names    
    this.fullName = fullName;
    this.name = name;
    // engine
    let engine = ng;
    this.getEngine = () => engine;
    this.setEngine = (ng) => engine = ng;
    // element
    this.element = document.querySelector("#"+name);
    // clonedElement
    let clonedElement;
    if(typeof MathJax != "undefined")
	MathJax.startup.promise.then(() => {
	    setTimeout(() => {clonedElement = cloneNoSubslip(this.element);},0);
	});
    this.getCloned = () => clonedElement;
    this.setCloned = (c) => clonedElement = c;
    // scale, rotate, delay
    this.scale = parseFloat(this.element.getAttribute("scale"));
    if(typeof this.scale == "undefined" || isNaN(this.scale)) this.scale = 1;
    this.rotate = parseFloat(this.element.getAttribute("rotate")) || 0;
    this.delay = isNaN(parseFloat(this.element.getAttribute("delay"))) ? 0 : (parseFloat(this.element.getAttribute("delay")));
    // coord
    let coord = this.findSlipCoordinate();
    console.log(coord);
    this.x = coord.x;
    this.y = coord.y;
    // Preparing the slip
    this.init(this, engine);

}