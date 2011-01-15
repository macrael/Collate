var pageLocked = false;
var recentScroll = false;

$(document).ready(function(){

    collate();
    
    if (Modernizr.touch) {
        $("#pagedn").css("display","none");
    }

    if (Modernizr.localstorage){
        if (localStorage["did_instruct_down"]){
            $("#pagedn").css("display","none");
        }
    }

    Modernizr.addTest('hyphens',testHypenation);
    
    $(document).keypress(function(event) {
        handleKeyPress(event);
    });
    window.onresize = collate;
});

function testHypenation() {
    //Blatantly stolen from Modernizr's code: http://www.modernizr.com/
    var modEl = document.createElement("div");
    var m_style = modEl.style;
    var domPrefixes = 'Webkit Moz O ms Khtml'.split(' ');
    var prop = "hyphens"
    var uc_prop = prop.charAt(0).toUpperCase() + prop.substr(1)
    var props = (prop + ' ' + domPrefixes.join(uc_prop + ' ') + uc_prop).split(' ');

    for (var i in props){
        if ( m_style[ props[i] ] !== undefined  ) {
            //for some reason this passes on chrome when it shouldn't
            if (navigator.userAgent.match(/Chrome\/8/)) {
                return false;
            }
            return true;
        }
    }
    return false;
}

function setupInstruction(){
    var instructDown = $("<div>").html("Use &lt;space&gt; to scroll down.");
    var instructUp   = $("<div>").html("&lt;shift&gt; + &lt;space&gt;");
    
    instructDown.attr( "pagedn");
    instructUp.attr( "pageup");

    instructDown.className = "instruct";
    instructUp.className = "instruct";

    $("#page").append(instructDown);
    $("#page").append(instructUp);
}

function collate() {
    if (pageLocked){
        return;
    }
    pageLocked = true;
    var all_readables = $(".collate");
    for (i=0; i<all_readables.length; i++) {
        var readable = all_readables[i];
        //have to do this before deleting fakes or scroll position is lost. 
        readable.style.display = "block";
    }

    //kill all fakes
    var all_fakes = $(".fake");
    for (var i = 0; i < all_fakes.length; i ++){
        var fake = all_fakes[i];
        fake.parentNode.removeChild(fake);
    }

    var currentEmSize = getEmSize($("#page")[0]);

    var target_height = window.innerHeight - (currentEmSize * 6)

    for (i=0; i<all_readables.length; i++) {
        var readable = all_readables[i];

        if (window.innerWidth < (currentEmSize * 42)){
            continue;
        }
        
        var readable_height = readable.offsetHeight;

        var page_ratio = target_height / readable_height;
        if (page_ratio >= 1){
            //TODO: this blows away any other classes you may have given the
            //collate div. You probably shouldn't do that, but still. 
            readable.className = "collate page";
            readable.style.height = target_height.toString() + "px";

            continue;
        }
        readable.className = "collate";

        var firstDiv = document.createElement("div");
        firstDiv.className = "collate page fake"; 
        readable.parentNode.appendChild(firstDiv);
        var currentChild;
        for (var k=0; k < readable.children.length ; k++ ){
            currentChild = readable.children[k].cloneNode(true);
            firstDiv.appendChild(currentChild);
            if (firstDiv.offsetHeight > target_height){
                firstDiv.removeChild(currentChild);
                var headingGuy;
                //To keep from having an orphaned heading.
                //TODO: could include other node types there. (blockquote?)
                // This causes complete breakage in Firefox 3.6.3
                if (firstDiv.children[firstDiv.children.length - 1].nodeName == "H2"){
                    headingGuy = firstDiv.children[firstDiv.children.length -1 ];
                    firstDiv.removeChild(headingGuy);
                }
                //TODO: If element granularity is not enough, we could split up
                //smaller elements. (might have to write an html parser for
                //that).
                firstDiv = document.createElement("div");
                firstDiv.className = "collate page fake";
                readable.parentNode.appendChild(firstDiv);
                if (headingGuy){
                    firstDiv.appendChild(headingGuy);
                    headingGuy = null;
                }
                firstDiv.appendChild(currentChild);
            }
        }
        firstDiv.style.height = target_height.toString() + "px";
        readable.style.display = "none";

    }
    pageLocked = false;

}


//http://stackoverflow.com/questions/4571813/why-is-this-javascript-function-so-slow-on-firefox
function getEmSize(el) {
    return Number(getComputedStyle(el, "").fontSize.match(/(\d+)px/)[1]);
}

//http://radio.javaranch.com/pascarello/2005/01/09/1105293729000.html
//Make it fuzzy, back up by a couple em.
function scrollToElement(theElement){
    var origElement = theElement;

    var offsetY = getDivTop(theElement);

    //window.scrollTo(selectedPosX, selectedPosY - 4 * getEmSize(origElement));
    $.scrollTo(offsetY - 4 * getEmSize(origElement), 400);
}

function getDivTop(the_div){
    var theElement = the_div;
    var selectedPosY = 0; 

    while (theElement != null) {
        selectedPosY += theElement.offsetTop;
        theElement = theElement.offsetParent;
    }

    return selectedPosY;

}

function handleKeyPress(e) {
    var all_readables = $(".collate");
    var currentEmSize = getEmSize(all_readables[0]);
    if (window.innerWidth < (currentEmSize * 42)){
        return;
    }

    if (e.which == 32){
        e.preventDefault();
    }

    if (e.which == 106 || (e.which == 32 && ! e.shiftKey) || e.which == 115){
        scrollDown();
    }
    if (e.which == 107 || ( e.which == 32 && e.shiftKey) || e.which == 119){
        scrollUp();
    }

}

function scrollDown(){
    $("#pagedn").css("opacity",0);
    if (Modernizr.localstorage){
        localStorage["did_instruct_down"] = true;
    }

    if (recentScroll){
        instructUp();
    }
    recentScroll = true;
    setTimeout(function() { recentScroll = false; } , 10000);
    
    var all_pages = document.getElementsByClassName("page"); 
    if (window.pageYOffset == 0){
        scrollToElement(all_pages[0]);
        return;
    }
    
    var nextDiv;
    for (i = 0; i < all_pages.length; i++){
        var thisElement = all_pages[i];
        var dtop = getDivTop(thisElement);
        var dbot = dtop + thisElement.offsetHeight;
        if (dtop > window.pageYOffset){
            if (dbot < window.pageYOffset + window.innerHeight){
                if (i + 1 == all_pages.length){
                    nextDiv = null;
                } else {
                    nextDiv = all_pages[i+1];
                }
                break;
            }
            nextDiv = thisElement;
            break;
        }
    }
    if (nextDiv == null){
        $.scrollTo('100%',400);
        instructUp();
        return;
    }

    scrollToElement(nextDiv);

}

function scrollUp(){
    $("#pageup").css("opacity",0);
    if (Modernizr.localstorage){
        localStorage["did_instruct_up"] = true;
    }

    var all_pages = document.getElementsByClassName("page"); 
    var nextDiv;
    for (i = all_pages.length - 1; i >= 0; i--){
        var thisElement = all_pages[i];
        var dtop = getDivTop(thisElement);
        var dbot = dtop + thisElement.offsetHeight;
        if (dbot < window.pageYOffset + window.innerHeight){
            if (dtop > window.pageYOffset){
                if (i-1 < 0){
                    nextDiv = null;
                }else{
                    nextDiv = all_pages[i-1];
                }
                break;
            }
            nextDiv = thisElement;
            break;
        }
    }
    if (nextDiv == null){
        $.scrollTo(0,200);
        return;
    }

    scrollToElement(nextDiv);
}


function instructUp(){
    if (Modernizr.localstorage){
        if (localStorage["did_instruct_up"]){
            return;
        }
        localStorage["did_instruct_up"] = true;
    }

    $("#pageup").css("opacity",1);
    setTimeout(function() {$("#pageup").css("opacity",0);} , 2000);

}

