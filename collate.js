$(document).ready(function(){
    //detect column support
    var yesCol = testColumns();
    if (! yesCol){
        $("#page").css("width","33em");
    } 

    collate();
    
    if ('ontouchstart' in window) {
        //We've got a touch device here
        $("#instruct").css("display","none");
    }
    
    $(document).keypress(function(event) {
        handleKeyPress(event);
    });
    window.onresize = collate;
});

function testColumns() {
    //Blatantly stolen from Modernizr's code: http://www.modernizr.com/
    var modEl = document.createElement("div");
    var m_style = modEl.style;
    var domPrefixes = 'Webkit Moz O ms Khtml'.split(' ');
    var prop = "columnCount"
    var uc_prop = prop.charAt(0).toUpperCase() + prop.substr(1)
    var props = (prop + ' ' + domPrefixes.join(uc_prop + ' ') + uc_prop).split(' ');

    for (var i in props){
        if ( m_style[ props[i] ] !== undefined  ) {
             return true;
        }
    }
    return false;
}

function collate() {
    var all_readables = $(".collate");
    var currentEmSize = getEmSize(all_readables[0]);
    
    var bigReadable;
    var lastFakeMatch;
    for (i=0; i < all_readables.length; i++){ 
        var readable = all_readables[i];
        var fakeMatch = readable.className.match(/fake\d+/);
        var oldDiv;
        if (fakeMatch){
            if (lastFakeMatch != fakeMatch[0]){
                lastFakeMatch = fakeMatch[0];
                oldDiv = document.createElement("div");
                oldDiv.className = "collate";
                readable.parentNode.appendChild(oldDiv);
            }
            while (readable.children.length > 0) {
                oldDiv.appendChild(readable.children[0]);
            }
            readable.parentNode.removeChild(readable);
        }
    }
    // Excepting the first time, we've changed the lay of the land. 
    all_readables = $(".collate");

    // If we are now thin, having only one column, kill collate.
    if (window.innerWidth < (currentEmSize * 42)){
        return;
    }

    var target_height = window.innerHeight - (currentEmSize * 6)

    for (i=0; i<all_readables.length; i++) {
        var readable = all_readables[i];

        var readable_height = readable.offsetHeight;

        var page_ratio = target_height / readable_height;
        if (page_ratio >= 1){
            readable.className += " page";
            continue;
        }

        var firstDiv = document.createElement("div");
        //tag the collateing div with fake and a number so we can recreate it.
        firstDiv.className = "collate page fake" + i.toString();
        readable.parentNode.appendChild(firstDiv);
        var currentChild;
        while (readable.children.length > 0){
            currentChild = readable.children[0];
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
                firstDiv.className = "collate page fake" + i.toString();
                readable.parentNode.appendChild(firstDiv);
                if (headingGuy){
                    firstDiv.appendChild(headingGuy);
                    headingGuy = null;
                }
                firstDiv.appendChild(currentChild);
            }
        }
        console.log(readable);
        readable.parentNode.removeChild(readable);
        firstDiv.style.height = target_height.toString() + "px";

    }

}


//http://eriwen.com/javascript/measure-ems-for-layout/
function getEmSize(el) {
    var tempDiv = document.createElement("div");
    tempDiv.style.height = "1em";
    el.appendChild(tempDiv);
    var emSize = tempDiv.offsetHeight;
    el.removeChild(tempDiv);
    return emSize;
}

//http://radio.javaranch.com/pascarello/2005/01/09/1105293729000.html
//Make it fuzzy, back up by a couple em.
function scrollToElement(theElement){
    //console.log(theElement);
    var origElement = theElement;

    var offsetY = getDivTop(theElement);
    //console.log(offsetY);

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
        $("#instruct").css("opacity",0);
        scrollDown();
    }
    if (e.which == 107 || ( e.which == 32 && e.shiftKey) || e.which == 119){
        //console.log("k");
        $("#instruct").css("opacity",0);
        scrollUp();
    }

}

function scrollDown(){
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
        $.scrollTo('+=1000px',100);
        //$.scrollTo('+=10px',100);
        //$.scrollTo('-=10px',100);
        return;
    }

    scrollToElement(nextDiv);

}

function scrollUp(){
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
