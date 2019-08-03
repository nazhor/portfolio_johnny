var slideIndex = 0;
var used_slides = 0;
var showing_slides = 0;

var $event = $.event,
$special,
resizeTimeout;

$special = $event.special.debouncedresize = {
	setup: function() {
		$( this ).on( "resize", $special.handler );
	},
	teardown: function() {
		$( this ).off( "resize", $special.handler );
	},
	handler: function( event, execAsap ) {
		var context = this,
			args = arguments,
			dispatch = function() {
				event.type = "debouncedresize";
				$event.dispatch.apply( context, args );
			};

		if ( resizeTimeout ) {
			clearTimeout( resizeTimeout );
		}

		execAsap ?
			dispatch() :
			resizeTimeout = setTimeout( dispatch, $special.threshold );
	},
	threshold: 250
};

var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

$.fn.imagesLoaded = function( callback ) {
	var $this = this,
		deferred = $.isFunction($.Deferred) ? $.Deferred() : 0,
		hasNotify = $.isFunction(deferred.notify),
		$images = $this.find('img').add( $this.filter('img') ),
		loaded = [],
		proper = [],
		broken = [];

	if ($.isPlainObject(callback)) {
		$.each(callback, function (key, value) {
			if (key === 'callback') {
				callback = value;
			} else if (deferred) {
				deferred[key](value);
			}
		});
	}

	function doneLoading() {
		var $proper = $(proper),
			$broken = $(broken);

		if ( deferred ) {
			if ( broken.length ) {
				deferred.reject( $images, $proper, $broken );
			} else {
				deferred.resolve( $images );
			}
		}

		if ( $.isFunction( callback ) ) {
			callback.call( $this, $images, $proper, $broken );
		}
	}

	function imgLoaded( img, isBroken ) {
		if ( img.src === BLANK || $.inArray( img, loaded ) !== -1 ) {
			return;
		}

		loaded.push( img );

		if ( isBroken ) {
			broken.push( img );
		} else {
			proper.push( img );
		}

		$.data( img, 'imagesLoaded', { isBroken: isBroken, src: img.src } );

		if ( hasNotify ) {
			deferred.notifyWith( $(img), [ isBroken, $images, $(proper), $(broken) ] );
		}

		if ( $images.length === loaded.length ){
			setTimeout( doneLoading );
			$images.unbind( '.imagesLoaded' );
		}
	}

	if ( !$images.length ) {
		doneLoading();
	} else {
		$images.bind( 'load.imagesLoaded error.imagesLoaded', function( event ){
			imgLoaded( event.target, event.type === 'error' );
		}).each( function( i, el ) {
			var src = el.src;

			var cached = $.data( el, 'imagesLoaded' );
			if ( cached && cached.src === src ) {
				imgLoaded( el, cached.isBroken );
				return;
			}

			if ( el.complete && el.naturalWidth !== undefined ) {
				imgLoaded( el, el.naturalWidth === 0 || el.naturalHeight === 0 );
				return;
			}

			if ( el.readyState || el.complete ) {
				el.src = BLANK;
				el.src = src;
			}
		});
	}

	return deferred ? deferred.promise( $this ) : $this;
};

var Grid = (function() {

	var $grid = $( '*#og-grid' ),
		$items = $grid.children( 'li' ),
		current = -1,
		previewPos = -1,
		scrollExtra = 0,
		marginExpanded = 10,
		$window = $( window ), winsize,
		$body = $( 'html, body' ),
		transEndEventNames = {
			'WebkitTransition' : 'webkitTransitionEnd',
			'MozTransition' : 'transitionend',
			'OTransition' : 'oTransitionEnd',
			'msTransition' : 'MSTransitionEnd',
			'transition' : 'transitionend'
		},
		transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
		support = Modernizr.csstransitions,
		settings = {
			minHeight : 500,
			speed : 350,
			easing : 'ease'
		};

	function init( config ) {

		settings = $.extend( true, {}, settings, config );

		$grid.imagesLoaded( function() {

			saveItemInfo( true );
			getWinSize();
			initEvents();

		} );

	}

	function addItems( $newitems ) {

		$items = $items.add( $newitems );

		$newitems.each( function() {
			var $item = $( this );
			$item.data( {
				offsetTop : $item.offset().top,
				height : $item.height()
			} );
		} );

		initItemsEvents( $newitems );

	}

	function saveItemInfo( saveheight ) {
		$items.each( function() {
			var $item = $( this );
			$item.data( 'offsetTop', $item.offset().top );
			if( saveheight ) {
				$item.data( 'height', $item.height() );
			}
		} );
	}

	function initEvents() {

		initItemsEvents( $items );

		$window.on( 'debouncedresize', function() {

			scrollExtra = 0;
			previewPos = -1;
			saveItemInfo();
			getWinSize();
			var preview = $.data( this, 'preview' );
			if( typeof preview != 'undefined' ) {
				hidePreview();
			}

		} );

	}

	function initItemsEvents( $items ) {
		$items.on( 'click', 'span.og-close', function() {
			hidePreview();
			slideIndex = 1;
			return false;
		} ).children( 'a' ).on( 'click', function(e) {
			slideIndex = 1;
			var $item = $( this ).parent();
			current === Array.from($items).findIndex(d => d == $item[0]) ? hidePreview() : showPreview( $item );
			return false;
		} );
	}

	function getWinSize() {
		winsize = { width : $window.width(), height : $window.height() };
	}

	function showPreview( $item ) {

		var preview = $.data( this, 'preview' ),
			position = $item.data( 'offsetTop' );

		scrollExtra = 0;

		if( typeof preview != 'undefined' ) {

			if( previewPos !== position ) {
				if( position > previewPos ) {
					scrollExtra = preview.height;
				}
				hidePreview();
			}
			else {
				preview.update( $item );
				return false;
			}

		}

		previewPos = position;
		preview = $.data( this, 'preview', new Preview( $item ) );
		preview.open();

	}

	function hidePreview() {
		current = -1;
		var preview = $.data( this, 'preview' );
		preview.close();
		$.removeData( this, 'preview' );
	}

	function Preview( $item ) {
		this.$item = $item;
		this.expandedIdx = Array.from($items).findIndex(d => d == this.$item[0]);
		this.create();
		this.update();
	}

	Preview.prototype = {
		create : function( ) {
			this.$title = $( '<h3></h3>' );
			this.$description = $( '<p></p>' );
			this.$href = $( '<a href="#" target="_blank">Test</a>' );
			this.$details = $( '<div class="og-details"></div>' ).append( this.$title, this.$description, this.$href );
			this.$slide1 = $('<img class="nzSlides" src="" style="display: inline-block;">');
			this.$slide2 = $('<img class="nzSlides" src="" style="display: none;">');
			this.$slide3 = $('<img class="nzSlides" src="" style="display: none;">');
			this.$slide4 = $('<img class="nzSlides" src="" style="display: none;">');
			this.$slide5 = $('<img class="nzSlides" src="" style="display: none;">');
			this.$slide6 = $('<img class="nzSlides" src="" style="display: none;">');
			this.$slide7 = $('<img class="nzSlides" src="" style="display: none;">');
			this.$slide8 = $('<img class="nzSlides" src="" style="display: none;">');
			this.$buttons = $('<button class="w3-button w3-black w3-display-left" onclick="plusSlides(-1)">&#10094;</button><button class="w3-button w3-black w3-display-right" onclick="plusSlides(1)">&#10095;</button></div>');
			this.$slides_container = $('<div class="left_container"><div>').append( this.$slide1, this.$slide2, this.$slide3, this.$slide4, this.$slide5, this.$slide6, this.$slide7, this.$slide8, this.$buttons);
			this.$video_iframe = $('<iframe class="nzIframe" src="" frameborder="0"></iframe>');
			this.$video_container = $('<div class="left_container"></div>').append(this.$video_iframe);
			this.$closePreview = $( '<span class="og-close"></span>' );
			this.$previewInner = $( '<div class="og-expander-inner"></div>' ).append( this.$closePreview, this.$slides_container, this.$video_container, this.$details );
			this.$previewEl = $( '<div class="og-expander"></div>' ).append( this.$previewInner );
			this.$item.append( this.getEl() );
			if( support ) {
				this.setTransition();
			}
		},
		update : function( $item ) {

			if( $item ) {
				this.$item = $item;
			}

			if( current !== -1 ) {
				var $currentItem = $items.eq( current );
				$currentItem.removeClass( 'og-expanded' );
				this.$item.addClass( 'og-expanded' );
				this.positionPreview();
			}

			current = this.$item.index();

			//Esto recupera los data pasados como parm a la <a>
			var $itemEl = this.$item.children( 'a' ),
				eldata = {
					href : $itemEl.attr( 'href' ),
					title : $itemEl.data( 'title' ),
					description : $itemEl.data( 'description' ),
					buttontext : $itemEl.data( 'button_text' ),
					video : $itemEl.data( 'video' ),
					slide1 : $itemEl.data( 'slide1' ),
					slide2 : $itemEl.data( 'slide2' ),
					slide3 : $itemEl.data( 'slide3' ),
					slide4 : $itemEl.data( 'slide4' ),
					slide5 : $itemEl.data( 'slide5' ),
					slide6 : $itemEl.data( 'slide6' ),
					slide7 : $itemEl.data( 'slide7' ),
					slide8 : $itemEl.data( 'slide8' )
				};

			this.$title.html( eldata.title );
			this.$description.html( eldata.description );

			if(eldata.buttontext) {
				this.$href.text(eldata.buttontext);
				this.$href.show();
			}else {
				this.$href.hide();
			}

			this.$video_iframe.attr('src', eldata.video);

			if(eldata.slide1) {
				this.$slide1.attr('src', eldata.slide1);
				this.$slide1.show();
			} else {
				this.$slide1.attr('src', "");
				this.$slide1.hide();
			}
			if(eldata.slide2) {
				this.$slide2.attr('src', eldata.slide2);
				this.$slide2.show();
				this.$buttons.show();
			}else {
				this.$slide2.attr('src', "");
				this.$slide2.hide();
				this.$buttons.hide();
			}
			if(eldata.slide3) {
				this.$slide3.attr('src', eldata.slide3);
				this.$slide3.show();
			}else {
				this.$slide3.attr('src', "");
				this.$slide3.hide();
			}
			if(eldata.slide4) {
				this.$slide4.attr('src', eldata.slide4);
				this.$slide4.show();
			}else {
				this.$slide4.attr('src', "");
				this.$slide4.hide();
			}
			if(eldata.slide5) {
				this.$slide5.attr('src', eldata.slide5);
				this.$slide5.show();
			}else {
				this.$slide5.attr('src', "");
				this.$slide5.hide();
			}
			if(eldata.slide6) {
				this.$slide6.attr('src', eldata.slide6);
				this.$slide6.show();
			}else {
				this.$slide6.attr('src', "");
				this.$slide6.hide();
			}
			if(eldata.slide7) {
				this.$slide7.attr('src', eldata.slide7);
				this.$slide7.show();
			}else {
				this.$slide7.attr('src', "");
				this.$slide7.hide();
			}
			if(eldata.slide8) {
				this.$slide8.attr('src', eldata.slide8);
				this.$slide8.show();
			}else {
				this.$slide8.attr('src', "");
				this.$slide8.hide();
			}

			if(eldata.video) {
				this.$slides_container.hide();
				this.$video_container.show();
			}else {
				this.$video_container.hide();
				this.$slides_container.show();
			}

			var self = this;

		},
		open : function() {

			setTimeout( $.proxy( function() {
				this.setHeights();
				this.positionPreview();
			}, this ), 25 );

		},
		close : function() {

			var self = this,
				onEndFn = function() {
					if( support ) {
						$( this ).off( transEndEventName );
					}
					self.$item.removeClass( 'og-expanded' );
					self.$previewEl.remove();
				};

			setTimeout( $.proxy( function() {

				this.$previewEl.css( 'height', 0 );
				var $expandedItem = $items.eq( this.expandedIdx );
				$expandedItem.css( 'height', $expandedItem.data( 'height' ) ).on( transEndEventName, onEndFn );

				if( !support ) {
					onEndFn.call();
				}

			}, this ), 25 );

			return false;

		},
		calcHeight : function() {

			var heightPreview = winsize.height - this.$item.data( 'height' ) - marginExpanded,
				itemHeight = winsize.height;

			if( heightPreview < settings.minHeight ) {
				heightPreview = settings.minHeight;
				itemHeight = settings.minHeight + this.$item.data( 'height' ) + marginExpanded;
			}

			this.height = heightPreview;
			this.itemHeight = itemHeight;

		},
		setHeights : function() {

			var self = this,
				onEndFn = function() {
					if( support ) {
						self.$item.off( transEndEventName );
					}
					self.$item.addClass( 'og-expanded' );
				};

			this.calcHeight();
			this.$previewEl.css( 'height', this.height );
			this.$item.css( 'height', this.itemHeight ).on( transEndEventName, onEndFn );

			if( !support ) {
				onEndFn.call();
			}

		},
		positionPreview : function() {

			var position = this.$item.data( 'offsetTop' ),
				previewOffsetT = this.$previewEl.offset().top - scrollExtra,
				scrollVal = this.height + this.$item.data( 'height' ) + marginExpanded <= winsize.height ? position : this.height < winsize.height ? previewOffsetT - ( winsize.height - this.height ) : previewOffsetT;

			$body.animate( { scrollTop : scrollVal }, settings.speed );

		},
		setTransition  : function() {
			this.$previewEl.css( 'transition', 'height ' + settings.speed + 'ms ' + settings.easing );
			this.$item.css( 'transition', 'height ' + settings.speed + 'ms ' + settings.easing );
		},
		getEl : function() {
			return this.$previewEl;
		}
	}

	return {
		init : init,
		addItems : addItems
	};

})();


$(function() {
	Grid.init();
});


document.querySelector('#menu_all').onclick = function() {
	change_visibility('all', true);
	change_visibility('header_text', false);
	change_visibility('header_text_all', true);
	change_visibility('contact_container', false);
};
document.querySelector('#menu_img').onclick = function() {
	change_visibility('image', true);
	change_visibility('video', false);
	change_visibility('text', false);
	change_visibility('game', false);
	change_visibility('header_text', false);
	change_visibility('header_text_img', true);
	change_visibility('contact_container', false);
};
document.querySelector('#menu_vid').onclick = function() {
	change_visibility('image', false);
	change_visibility('video', true);
	change_visibility('text', false);
	change_visibility('game', false);
	change_visibility('header_text', false);
	change_visibility('header_text_vid', true);
	change_visibility('contact_container', false);
};
document.querySelector('#menu_txt').onclick = function() {
	change_visibility('image', false);
	change_visibility('video', false);
	change_visibility('text', true);
	change_visibility('game', false);
	change_visibility('header_text', false);
	change_visibility('header_text_txt', true);
	change_visibility('contact_container', false);
};
document.querySelector('#menu_vdg').onclick = function() {
	change_visibility('image', false);
	change_visibility('video', false);
	change_visibility('text', false);
	change_visibility('game', true);
	change_visibility('header_text', false);
	change_visibility('header_text_vdg', true);
	change_visibility('contact_container', false);
};
document.querySelector('#menu_cnt').onclick = function() {
	change_visibility('all', false);
	change_visibility('header_text', false);
	change_visibility('header_text_cnt', true);
	change_visibility('contact_container', true);
};

function change_visibility( $class_to_change, $state ) {
	if ( $state ) {
		$new_state = 'inline-block';
	}else {
		$new_state = 'none';
	}
	[].forEach.call(document.querySelectorAll('.' + $class_to_change), function (change) {
		change.style.display = $new_state;
	});
};

function change_text( $class_to_change, $state ) {

};

function setupSlides() {
	showing_slides = document.getElementsByClassName("nzSlides");
	used_slides = 0;
	for (i = 0; i < document.getElementsByClassName("nzSlides").length; i++) {
		var ext = showing_slides[i].src.split(".");
		if ( ext[1] == "jpg" ||
			 ext[1] == "png" ){
			used_slides++;
		}
	}
};

function plusSlides(n) {
	setupSlides();
	showSlides(slideIndex += n);
}

function showSlides(n) {
	var i;
	if (n > used_slides) {
		slideIndex = 1;
	}
	if (n < 1) {
		slideIndex = used_slides;
	}
	for (i = 0; i < used_slides; i++) {
		showing_slides[i].style.display = "none";
	}
	showing_slides[slideIndex - 1].style.display = "inline-block";
}


