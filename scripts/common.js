/* global $ajax*/
/* jshint browser: true */
document.addEventListener("DOMContentLoaded", function (event) {
    var head = document.getElementsByTagName("head")[0];
    var body = document.getElementsByTagName("body")[0];
    
    var loadedJson,
        loadedComponent = {},
        loadedContent = {},
        loadedContentCSS = [],
        loadedContentJS = [];
    //Initialize page
    ajaxRefreshWith (document.getElementsByTagName("title")[0].dataset.json);
    
    function ajaxRefreshWith (json) {
        $ajax.sendGetRequest(json, function (request) {
            loadedJson = request;
            window.console.log("Page> JSON Loaded");
            body.dispatchEvent($ajax.makeEvent("jsonloaded"));
        }, true);
    }
    body.addEventListener("ajaxfinished", function (e) {
        if (e.message === "jsonloaded") {
            loadComponents();
            loadContents();
        }
    });
    
    var isAddingComponents = false;
    var isRemovingComponents = false;
    function loadComponents () {
        if (isAddingComponents || isRemovingComponents) {
            window.console.log("Components> Error: Running hasn't finished");
            return;
        } else {
            isAddingComponents = true;
            isRemovingComponents = true;
            window.console.log("Components> Now Loading");
        }
        var addQueue = [],
            removeQueue = [],
            waitingHTML = [],
            waitingJS = [],
            count = 0;
        //Initialize Add Queue
        for (var i = 0; i < loadedJson.components.length; i ++) {
            if (!loadedComponent[loadedJson.components[i]]) {
                addQueue.push(loadedJson.components[i]);
            }
        }
        window.console.log("Components> Add: " + addQueue);
        //Initialize Remove Queue
        for (var item in loadedComponent) {
            if (!loadedJson.components.includes(item)) {
                removeQueue.push(item);
            }
        }
        window.console.log("Components> Remove: " + removeQueue);
        //Run Add Queue
        for (var i = 0; i < addQueue.length; i ++) {
            var component = addQueue[i];
            //Directly insert CSS
            var css = document.createElement("link");
            css.href = "\/components\/" + component + "\/" + component + ".css";
            css.type = "text/css";
            css.rel = "stylesheet";
            head.appendChild(css);
            //Request HTML file, then insert JS
            $ajax.sendGetRequest("\/components\/" + component + "\/" + component + ".html", function (request) {
                //Parse Returned HTML File to Div Element and Add to Waiting Queue
                waitingHTML.push(parseStringToDivElement(request));
                
                var js = document.createElement("script");
                js.component = addQueue[count];
                js.src = "\/components\/" + addQueue[count] + "\/" + addQueue[count] + ".js";
                js.type = "text/javascript";
                waitingJS.push(js);
                
                count ++;
                if (count === addQueue.length) {
                    //Sort Waiting Queue with Add Queue
                    for (var j = 0; j < addQueue.length; j ++) {
                        for (var k = 0; k < waitingHTML.length; k ++) {
                            if (waitingHTML[k].id === addQueue[j]) {
                                body.appendChild(waitingHTML[k]);
                                head.appendChild(waitingJS[k]);
                                loadedComponent[addQueue[j]] = waitingHTML[k];
                                window.console.log("Components> Added: " + addQueue[j]);
                            }
                        }
                    }
                    isAddingComponents = false;
                }
            });
        }
        //Run Remove Queue
        for (var i = 0; i < removeQueue.length; i ++) {
            //Locate elements by id, then remove
            var component = document.getElementById(removeQueue[i]);
            component.innerHTML = "";
            component.parentNode.removeChild(component);
            //Locate elements by "component" property, then remove
            var links = document.getElementsByTagName("link");
            for (var j = 0; j < links.length; j ++) {
                if (links[j].component === removeQueue[i]) {
                    links[j].parentNode.removeChild(links[j]);
                }
            }
            //Locate elements by "component" property, then remove
            var scripts = document.getElementsByTagName("script");
            for (var j = 0; j < scripts.length; j ++) {
                if (scripts[j].component === removeQueue[i]) {
                    scripts[j].innerHTML = "";
                    scripts[j].parentNode.removeChild(scripts[j]);
                }
            }
            window.console.log("Components> Removed: " + removeQueue[i]);
        }
        isRemovingComponents = false;
    }
    
    
    var isAddingContents = false, 
        isRemovingContents = false;
    function loadContents () {
        if (!document.getElementById("content")) {
            body.innerHTML += "<div id=\"content\"></div>";
        }
        if (isAddingContents || isRemovingContents) {
            window.console.log("Contents> Error: Running hasn't finished");
            return;
        } else {
            isAddingContents = true;
            isRemovingContents = true;
            window.console.log("Contents> Now Loading");
        }
        var addQueue = [],
            removeQueue = [],
            waitingHTML = [],
            waitingJS = [],
            contentJson = [],
            wrapper = document.getElementById("content"),
            count = 0;
        //Initialize Add Queue
        for (var a = 0; a < loadedJson.contents.length; a ++) {
            if (!loadedContent[loadedJson.contents[a]]) addQueue.push(loadedJson.contents[a]);
        }
        window.console.log("Contents> Add: " + addQueue);
        //Initialize Remove Queue
        for (var item in loadedContent) {
            if (!loadedJson.contents.includes(item)) {
                removeQueue.push(item);
            }
        }
        window.console.log("Contents> Remove: " + removeQueue);
        //Run Add Queue
        for (var i = 0; i < addQueue.length; i ++) {
            var content = addQueue[i];
            //Request content JSON file
            $ajax.sendGetRequest("\/contents\/" + content + "\/" + content + ".json", function (request) {
                contentJson.push(request);
                count ++;
                if (count === loadedJson.contents.length) {
                    count = 0;
                    for (var j = 0; j < contentJson.length; j ++) {
                        //If CSS is not added, add
                        if (contentJson[j].stylesheet !== null && !loadedContentCSS[contentJson[j].stylesheet]) {
                            var css = document.createElement("link");
                            css.href = contentJson[j].stylesheet;
                            css.type = "text/css";
                            css.rel = "stylesheet";
                            head.appendChild(css);
                            loadedContentCSS.push(contentJson[j].stylesheet);
                        }
                        //Request HTML file, then insert JS
                        $ajax.sendGetRequest("\/contents\/" + contentJson[j].name + "\/" + contentJson[j].name + ".html", function (request) {
                            //Parse Returned HTML File to Div Element and Add to Waiting Queue
                            waitingHTML.push(parseStringToDivElement(request));
                            //If JS is not added, add
                            if (contentJson[count].script !== null && !loadedContentJS[contentJson[count].script]) {
                                var js = document.createElement("script");
                                js.content = addQueue[count];
                                js.src = contentJson[count].script;
                                js.type = "text/javascript";
                                waitingJS.push(js);
                            }
                            
                            count ++;
                            if (count === addQueue.length) {
                                //Sort Waiting Queue with Add Queue
                                for (var j = 0; j < addQueue.length; j ++) {
                                    for (var k = 0; k < waitingHTML.length; k ++) {
                                        if (waitingHTML[k].id === addQueue[j]) {
                                            wrapper.appendChild(waitingHTML[k]);
                                            loadedContent[addQueue[j]] = waitingHTML[k];
                                            window.console.log("Contents> Added: " + addQueue[j]);
                                        }
                                    }
                                    for (var k = 0; k < waitingJS.length; k ++) {
                                        if (waitingHTML[k].content === addQueue[j]) {
                                            head.appendChild(waitingJS[k]);
                                            loadedContentCSS.push(waitingJS[k].src);
                                        }
                                    }
                                }
                                isAddingContents = false;
                            }
                        });
                    }
                }
            }, true);
        }
        //Run Remove Queue, CSS and JS won't be removed
        for (var i = 0; i < removeQueue.length; i ++) {
            var content = document.getElementById(removeQueue[i]);
            content.innerHTML = "";
            content.parentNode.removeChild(content);
            
            window.console.log("Contents> Removed: " + removeQueue[i]);
        }
        isRemovingContents = false;
    }
    function parseStringToDivElement (htmlString) {
        var XMLWrapper = (new DOMParser()).parseFromString("", "text/html").getElementsByTagName("body")[0];
        XMLWrapper.innerHTML = htmlString;
        return XMLWrapper.getElementsByTagName("div")[0];
    }
});