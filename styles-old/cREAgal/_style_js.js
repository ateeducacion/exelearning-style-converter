var myTheme = {
    printButton : false,
    init : function(){
		var ie_v = $exe.isIE();
		if (ie_v && ie_v<8) return false;
        setTimeout(function(){
            $(window).resize(function() {
                myTheme.reset();
            });
        },1000);
		var tit = $exe_i18n.menu+" ("+$exe_i18n.hide.toLowerCase()+")";
		var navToggler = '<p id="header-options">';
				navToggler += '<a href="#" class="hide-nav" id="toggle-nav" title="'+tit+'">';
					navToggler += '<span>'+$exe_i18n.menu+'</span>';
				navToggler += '</a>';
				if (myTheme.printButton==true && typeof(window.print)=='function') {
					navToggler += '<a href="#" id="print-page">';
						navToggler += '<span>'+$exe_i18n.print+'</span>';
					navToggler += '</a>';
				}
			navToggler += '</p>';
        var l = $(navToggler);
        var nav = $("#siteNav");
		nav.before(l);
		$("#toggle-nav").click(function(){
			myTheme.toggleMenu(this);
			return false;
		});
		$("#print-page").click(function(){
			window.print();
			return false;
		});		
		if ( $("A",nav).attr("class").indexOf("active")==0 ) $("BODY").addClass("home-page");
        var url = window.location.href;
        url = url.split("?");
        if (url.length>1){
            if (url[1].indexOf("nav=false")!=-1) {
                myTheme.hideMenu();
            }
        }
		// Set the min-height for the content wrapper
		$("#main-wrapper").css("min-height",(nav.height()+25)+"px");
    },
    hideMenu : function(){
        $("#siteNav").hide();
        $(document.body).addClass("no-nav");
        myTheme.params("add");
		var tit = $exe_i18n.menu+" ("+$exe_i18n.show.toLowerCase()+")";
        $("#toggle-nav").attr("class","show-nav").attr("title",tit);
    },
    toggleMenu : function(e){
        if (typeof(myTheme.isToggling)=='undefined') myTheme.isToggling = false;
        if (myTheme.isToggling) return false;
        
        var l = $("#toggle-nav");
        
        if (!e && $(window).width()<900 && l.css("display")!='none') return false; // No reset in mobile view
        if (!e) {
            var tit = $exe_i18n.menu+" ("+$exe_i18n.show.toLowerCase()+")";
            l.attr("class","show-nav").attr("title",tit); // Reset
        }
        
        myTheme.isToggling = true;
        
        if (l.attr("class")=='hide-nav') {  
			var tit = $exe_i18n.menu+" ("+$exe_i18n.show.toLowerCase()+")";
            l.attr("class","show-nav").attr("title",tit);
            $("#siteFooter").hide();
			$("#siteNav").slideUp(400,function(){
                $(document.body).addClass("no-nav");
                $("#siteFooter").show();
                myTheme.isToggling = false;
            }); 
            myTheme.params("add");
        } else {
            var tit = $exe_i18n.menu+" ("+$exe_i18n.hide.toLowerCase()+")";
			l.attr("class","hide-nav").attr("title",tit);
            $(document.body).removeClass("no-nav");
			$("#siteNav").slideDown(400,function(){
                myTheme.isToggling = false;
            });
            myTheme.params("delete");            
        }
        
    },
    param : function(e,act) {
        if (act=="add") {
            var ref = e.href;
            var con = "?";
            if (ref.indexOf(".html?")!=-1) con = "&";
            var param = "nav=false";
            if (ref.indexOf(param)==-1) {
                ref += con+param;
                e.href = ref;                    
            }            
        } else {
            // This will remove all params
            var ref = e.href;
            ref = ref.split("?");
            e.href = ref[0];
        }
    },
    params : function(act){
        $("A",".pagination").each(function(){
            myTheme.param(this,act);
        });
    },
    reset : function() {
        myTheme.toggleMenu();        
    },
	inIframe : function(){
		try {
			return window.self !== window.top;
		} catch (e) {
			return true;
		}
	},	
	printContent : function(bodyClassName){
		if (bodyClassName.indexOf("exe-authoring-page")==0) {
			if (typeof(_)!='undefined') {
				eXe.app.alert(_("File") + " - " + _("Print") + " (Ctrl+P)");
				return false;
			}
		}
		if (!this.inIframe()) {
			window.print();
		} else {
			var isIE = navigator.appName.indexOf('Microsoft') !=-1;
			if (isIE) alert('Ctrl+P');
			var a = window.open(self.location.href);			
			if (!isIE) a.onload = function() { this.print() }
			a.focus();			
		}
	},
	common : {
		init : function(c){
			var iDevices = $(".iDevice_wrapper");
			var firstIsText = false;
			iDevices.each(function(i){
				if (iDevices.length>1 && i==0 && this.className.indexOf("FreeTextIdevice")!=-1) {
					$(".iDevice",this).css("margin-top",0);
					firstIsText = true;
				}
			});
			// Print button in authoring-page, SCORM and IMS
			if (myTheme.printButton==true && ($("body").hasClass("exe-authoring-page") || $("body").hasClass("exe-ims") || $("body").hasClass("exe-scorm"))) {
				var extra = '';
				if (iDevices.length>1 && !firstIsText) extra = ' class="with-toggler"';
				$("#nodeDecoration").after('<p id="printNode"'+extra+'><a href="#" title="'+$exe_i18n.print+'"><span>'+$exe_i18n.print+'</span></a></p>');
				$("#printNode a").click(function(e){
					myTheme.printContent(document.body.className);
				});
			}

			//Phase management
			var title = $("#nodeTitle")[0];
			var cadena = title.innerHTML;
			var patron = /^\d\.\d/;
	  
			if (cadena.match(patron)) {
			  $("#nodeDecoration").addClass("nodeSubSection nodeSubSection-" + title.innerHTML[0]);
			} else {
			  $("#nodeDecoration").addClass("nodeSection nodeSection-" + title.innerHTML[0]);
			}

			//Fake responsive management
			var title = $("#nodeTitle")
			var topPag = $("#topPagination")
			//check again on resize
			addEventListener("resize", (event) => {
				if ($("#headerContent").height() > 80){	
					topPag.addClass("longHeader")
				}
				else{
					topPag.removeClass("longHeader")
				}
			});

			addEventListener("load", (event) => {				
				if ($("#headerContent").height()> 80){	
					topPag.addClass("longHeader")
				}
				else{
					topPag.removeClass("longHeader")
				}
				
			}, {once: true})
		}
	}
}

$(function(){
	if ($("body").hasClass("exe-web-site")) {
		myTheme.init();
	}
	myTheme.common.init();
});

document.addEventListener("DOMContentLoaded", (event) => {
document.querySelectorAll('.udl-character-1 img').forEach(function(imx) {
	imx.setAttribute('title', 'Arela ');
	imx.setAttribute('alt', 'Arela');
});
document.querySelectorAll('.udl-character-2 img').forEach(function(imx) {
	imx.setAttribute('title', 'Bado ');
	imx.setAttribute('alt', 'Bado');
});
document.querySelectorAll('.udl-character-3 img').forEach(function(imx) {
	imx.setAttribute('title', 'Cheda ');
	imx.setAttribute('alt', 'Cheda');
});
document.querySelectorAll('.udl-character-4 img').forEach(function(imx) {
	imx.setAttribute('title', 'Luzada ');
	imx.setAttribute('alt', 'Luzada');
});
if (!document.body.classList.contains('exe-web-site')){
	
const personaxes = ["",	" Arela  "," Bado  ",	" Cheda  "," Luzada  "];
 var textlabel = null;
 for (var i=1;i<5;i++){
	 const labels = document.querySelectorAll('.udlContentFormBlockButtonTxtOptions  label[for$="-'+i+'"]');  
     labels.forEach((textlabel) => {
     textlabel.lastChild.textContent = personaxes[i];
  });
}

}
});


if (typeof $exeDevice !== "undefined") {
$exeDevice.characters = [
		"",
		"Arela",
		"Bado",
		"Cheda",
		"Luzada"
	]	
}
// H5P iframe Resizer
(function () {
	//|| window.h5pResizerInitialized
  if (!window.postMessage || !window.addEventListener  ) {
    return; // Not supported
  }
  window.h5pResizerInitialized = true;
  // Map actions to handlers
  var actionHandlers = {};

  /**
   * Prepare iframe resize.
   *
   * @private
   * @param {Object} iframe Element
   * @param {Object} data Payload
   * @param {Function} respond Send a response to the iframe
   */
  actionHandlers.hello = function (iframe, data, respond) {
    // Make iframe responsive
    iframe.style.width = '100%';

    // Bugfix for Chrome: Force update of iframe width. If this is not done the
    // document size may not be updated before the content resizes.
    iframe.getBoundingClientRect();

    // Tell iframe that it needs to resize when our window resizes
    var resize = function () {
      if (iframe.contentWindow) {
        // Limit resize calls to avoid flickering
        respond('resize');
      }
      else {
        // Frame is gone, unregister.
        window.removeEventListener('resize', resize);
      }
    };
    window.addEventListener('resize', resize, false);

    // Respond to let the iframe know we can resize it
    respond('hello');
  };

  /**
   * Prepare iframe resize.
   *
   * @private
   * @param {Object} iframe Element
   * @param {Object} data Payload
   * @param {Function} respond Send a response to the iframe
   */
  actionHandlers.prepareResize = function (iframe, data, respond) {
    // Do not resize unless page and scrolling differs
    if (iframe.clientHeight !== data.scrollHeight ||
        data.scrollHeight !== data.clientHeight) {

      // Reset iframe height, in case content has shrinked.
      iframe.style.height = (data.clientHeight+24) + 'px';
      respond('resizePrepared');
    }
  };

  /**
   * Resize parent and iframe to desired height.
   *
   * @private
   * @param {Object} iframe Element
   * @param {Object} data Payload
   * @param {Function} respond Send a response to the iframe
   */
  actionHandlers.resize = function (iframe, data) {
    // Resize iframe so all content is visible. Use scrollHeight to make sure we get everything
    iframe.style.height = (data.scrollHeight+24) + 'px';
  };

  /**
   * Keyup event handler. Exits full screen on escape.
   *
   * @param {Event} event
   */
  var escape = function (event) {
    if (event.keyCode === 27) {
      exitFullScreen();
    }
  };

  // Listen for messages from iframes
  window.addEventListener('message', function receiveMessage(event) {
    if (event.data.context !== 'h5p') {
      return; // Only handle h5p requests.
    }

    // Find out who sent the message
    var iframe, iframes = document.getElementsByTagName('iframe');
    for (var i = 0; i < iframes.length; i++) {
      if (iframes[i].contentWindow === event.source) {
        iframe = iframes[i];
        break;
      }
    }

    if (!iframe) {
      return; // Cannot find sender
    }

    // Find action handler handler
    if (actionHandlers[event.data.action]) {
      actionHandlers[event.data.action](iframe, event.data, function respond(action, data) {
        if (data === undefined) {
          data = {};
        }
        data.action = action;
        data.context = 'h5p';
        event.source.postMessage(data, event.origin);
      });
    }
  }, false);

  // Let h5p iframes know we're ready!
  var iframes = document.getElementsByTagName('iframe');
  var ready = {
    context: 'h5p',
    action: 'ready'
  };
  for (var i = 0; i < iframes.length; i++) {
    if (iframes[i].src.indexOf('h5p') !== -1) {
      iframes[i].contentWindow.postMessage(ready, '*');
    }
  }

})();
