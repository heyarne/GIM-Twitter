/**
 * @author Arne Schlüter
 */

(function ($, w, d) {
	var $tooltip = $( d.createElement('div') ).addClass('tooltip');

	/**
	 * @param {string} text the displayed text
	 * @param {object} position ['top', 'bottom']
	 */
	$.fn.tooltip = function ( text, options ) {
		var $positionElement = this;
		var $tooltipElement = $tooltip.clone().html( text );
		var offset = $positionElement.offset();

		/*
		 * procedure:
		 *	- check position
		 *		- if it's too close to the right, append class "flip-horizontal"
		 *		- if it's too close to the bottom, append class "flip-vertical"
		 *	- append tooltip element
		 */
		
		if (options.class) {
			$tooltipElement.addClass( options.class );
		}

		$tooltipElement.css({
			'opacity': 0
		});

		$( d.body ).append( $tooltipElement );
		
		var position = (function(){
			var left, top;
			var width = $positionElement.outerWidth() || $positionElement[0].width;
			var height = $positionElement.outerHeight() || $positionElement[0].height;
			var radius = parseInt( $positionElement.attr('r'), 10 ); // svg 'circle' elements do not have width or height

			// currently only position = above-center

			// center at the hovered element
			left = offset.left;
			left += (width) ? width / 2 : radius;

			top = offset.top;
			top += (height) ? height / 2 : radius;

			// pull up

			return {
				'left': left, 
				'top': top
			};
		})();
		
		$tooltipElement
			.css( position )
			.css( 'marginTop', ($tooltipElement.outerHeight() + 53)  * (-1) ) // dirty hack... find a better way maybe
			.animate({ 'opacity': 1 }, 250);

		// check this is also removed
		options.hide = options.hide || 'mouseout'; 
		
		if ( typeof options.hide == 'string' ) {
			$positionElement.on( options.hide, function () {
				$tooltipElement.animate({
					'opacity': 0
				}, 250, function () {
					$tooltipElement.remove();
				});
			});
		}
		else if ( typeof options.hide.push == 'function' ) { // is this an array?
			options.hide.forEach(function (evt) {
				$positionElement.on( evt, function () {
					$tooltipElement.animate({
						'opacity': 0
					}, 250, function () {
						$tooltipElement.remove();
					});
				});
			});
		}

		return this;
	}
})(jQuery, window, document)
