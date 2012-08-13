(function($, R) {
	var eve = R.eve; // Raphael event manager
	var $container;
	var triggered = false;

	// first, some basic informative variables
	
	var paper;

	// http://www.colourlovers.com/palette/148712/Gamebookers
	// fill color, border color, (retweeted fill color)
	var colors = ['#ff9900', '#ff9900', '#3299bb'];
	var style = {
		'fill': colors[0],
		'stroke': colors[1],
		'stroke-width': 2,
		'stroke-dasharray': '.',
		'opacity': 0.5
	};
	var radius = 18;
	var max_radius = 64;

	/*R.el.emphasize = function ( retweets, avg, max_radius ) {
		if (retweets > avg) {
			this.attr( 'r', radius * (1 + (retweets - avg) / 1.2) );
		}
	};*/

	R.el.emphasize = function ( retweets, max, max_radius ) {
		var newSize = radius;
		var diff = max_radius - radius;
		var percentage = 0;
		var $node = $( this.node );

		if (retweets > 0) {
			percentage = ( retweets / max );
			newSize += diff * percentage;
		}
	
		if (percentage < 0.33) {
			$node.data( 'scale', 'small' );
		}
		else if (percentage < 0.66) {
			$node.data( 'scale', 'medium' );
		}
		else {
			$node.data( 'scale', 'large' );
		}

		console.log(retweets, max);
		this.attr( 'r', newSize );
		return this;
	}

	var init = function ( container ) {
		paper = R( container );
	}
	
	/**
	 * @param {object} data a twitter api response
	 */
	var drawCircles = function ( data ) {
		var per_row = 5;
		var offset = 0.2; // percentage of offset to each border
		var avg_retweets = 0;
		var max_retweets = 0;

		var circles = paper.set();
		
		// set up the animations
		var fade_in = R.animation({ 'opacity': style.opacity }, 1000);
		var mouse_over = R.animation({ 
			'opacity': 0.8,
			'stroke-width': style['stroke-width'] * 2,
			'stroke-dasharray': false
		}, 300);
		var mouse_out = R.animation({
			'opacity': style['opacity'],
			'stroke-width': style['stroke-width'],
			'stroke-dasharray': '.'
		}, 500);

		// is this a search query? adjust.
		if (typeof data.forEach != 'function') {
			data = data.results;
		}

		// first, get average and max retweets
		data.forEach(function ( tweet ) {
			var retweet_count = 0; 

			if (tweet.retweet_count) {
				retweet_count = tweet.retweet_count;
			}
			else if (tweet.metadata && tweet.metadata.recent_retweets) {
				retweet_count = tweet.metadata.recent_retweets;
			}

			max_retweets = Math.max( max_retweets, retweet_count );
			avg_retweets += retweet_count;
		});
		avg_retweets /= data.length;

		// then draw circles
		data.forEach(function (tweet) {
			var circle = paper.circle(
				// random across whole screen, scale to offset, add offset
				(Math.random() * paper.width) * (1 - 2 * offset) + paper.width * offset, 
				(Math.random() * paper.height) * (1 - 2 * offset) + paper.height * offset, 
				radius
			);

			var retweet_count = 0; 

			if (tweet.retweet_count) {
				retweet_count = tweet.retweet_count;
			}
			else if (tweet.metadata && tweet.metadata.recent_retweets) {
				retweet_count = tweet.metadata.recent_retweets;
			}

			circle
				.attr(style)
				.attr('opacity', 0)
				.animate(fade_in.delay(Math.random() * 500))
				.mouseover(function () {
					this.animate(mouse_over);
				})
				.mouseout(function () {
					this.animate(mouse_out);
				})
				.drag(
					function (a, b, x, y) {
						this.attr({
							'cx': x,
							'cy': y
						});
					},
					undefined,
					function () {
						// "open tweet" function
						var info = this.attr([ 'cx', 'r' ]);

						// center(x) - radius > 0 → not at the border
						console.log(info.cx - info.r, info.cx, info.r)
						if (info.cx - info.r <= 0) {
							$container.trigger('bubbles.left', {
								'id': tweet.id_str,
								'screenName': tweet.from_user || tweet.user.screen_name
							});
						}
					})
				.emphasize(retweet_count, max_retweets, max_radius);
			
			if (tweet.retweeted) {
				circle.attr('color', colors[2]);
			}


			// export tweet to jquery as data
			$( circle.node ).data('tweet', {
				'text': tweet.text,
				'date': tweet.created_at,
				'user': {
					'name': tweet.from_user_name || tweet.user.name
				}
			})

			circles.push( circle );
		});

		// fire event that circles have been appended
		if (!triggered) {
			$container.trigger('bubbles.done');
			triggered = true;
		}
	}	


	var getData = function ( identifier, type ) {
		var data = {
				include_rts: true,				
				include_entities: true,	
		};

		var options = {
			type: 'GET',
			dataType: 'jsonp',
			data: data,			
			success: drawCircles
		};
		
		if ( type == 'username' ) {
			$.extend(options, {
				'url': 'http://api.twitter.com/1/statuses/user_timeline.json/',
				'data': {
					'screen_name': identifier,
					'count': 50
				}
			});
		}
		else if ( type == 'search' ) {
			$.extend( options, {
				'url': 'http://search.twitter.com/search.json',
				'data': {
					'q': encodeURIComponent( identifier ),
					'rpp': 50,
					'result_type': 'mixed'
				}
			});
		}

		$.ajax( options );
	}

	/**
	 * @param {string} identifier the username or search-term
	 * @param {string} type defining the type to get; either 'hashtag' or 'username'
	 */
	$.fn.bubbles = function ( identifier, type ) {
		if ( !paper ) {
			$container = $( this );
			init( $container.attr('id') );
		} else {
			$container.animate({ 'opacity': 0 }, 500, function () {
				$container.find( 'circle' ).removeData();
				paper.clear();
				$container.animate({ 'opacity': 1 }, 500);
			})
		}
		
		getData( identifier, type );

		return this;
	}
})(jQuery, Raphael.ninja());
