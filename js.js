function pad2(num) {
	return (num<10 ? '0' : '') + num;
}

function msec2txt(msec, floor) {
	var secs = (floor ? Math.ceil : Math.floor)(msec / 1000);

	var min = pad2(Math.floor(secs / 60));
	var sec = pad2(Math.floor(secs % 60));

	return (min + ':' + sec);
}

$(window).resize(function() {
	$('.resrel').css('z-index', '0')
})


function delayedOnInput(selector, delay, fun) {
	selector.on('input', function(e) {
		clearTimeout(selector.data('inputTimeout'));
		selector.data('inputTimeout', setTimeout(function() {fun(e);}, delay))
	})
}

function selectLogo(side, url) {
	var elem = $({l: '#til', r: '#tir'}[side]);
	elem.css("background-image", "url(" + url + ")");
}

!(function() {
	delayedOnInput($('#ilpu,#irpu'), 1000, function(e) {
		var nurl = $(e.target).val();
		var s = e.target.id[1];
		nurl = nurl.replace(/[<>"'].*/, "");

		$.event.trigger('setLogo', {s: s, url: nurl, skipInput: true});
	})

	delayedOnInput($('#itimer'), 2000, function() {
		var t = $('#itimer').val().split(':');

		var min = parseInt(t[0] || '0');
		var sec = parseInt(t[1] || '0');

		if (!isNaN(min) && !isNaN(sec)) {
			var msec = min * 60000 + sec * 1000;
			$.event.trigger('setTimerDuration', msec);
		}
	});

	$('#showElapsed').on('click', function() {
		$.event.trigger('setShowElapsed', this.checked);
	});		

	$('#binv').on('click', function() {
		$.event.trigger('invertLogos');
	});
}());

!(function() {
	var logos = {l: null, r: null};

	$(document).on('setLogo', function(e, o) {
		logos[o.s] = o.url;
		localStorage['jst_' + o.s + 'pu'] = o.url;
		selectLogo(o.s, o.url);
		if (!o.skipInput) {
			$('#i' + o.s + 'pu').val(o.url);
		}
	});

	$(document).on('invertLogos', function() {
		var l = logos.l;
		var r = logos.r;

		logos = {l: r, r: l};

		['l', 'r'].forEach(function(s) {
			$.event.trigger('setLogo', {s: s, url: logos[s]});
		});
	});

	$(document).on('setTimerDuration', function(e, msec) {
		localStorage.jst_dur = msec;
		$('#itimer').val(msec2txt(msec));
	});
	
	$(document).on('setShowElapsed', function(e, show) {
		localStorage.jst_showElapsed = show;
		$('#timeElapsed').toggleClass('hide', !show);
		$('#showElapsed').prop('checked', show);
	});
}());





function Counter(elem) {
	var curr = 0;

	function write() {
		elem.text(pad2(curr));
	}

	return {
		up: function() {
			curr++;
			write();
		},
		down: function() {
			curr--;
			if (curr < 0) curr = 0;
			write();
		},
		reset: function() {
			curr = 0;
			write();
		}
	}
}

function initCounters() {
	['l','r'].forEach(function(s) {
		var cnt = new Counter($('#punt' + s));

		$('#b' + s + 'p').on('click', cnt.up);
		$('#b' + s + 'm').on('click', cnt.down);
		$('#breset')     .on('click', cnt.reset);

		Mousetrap.bind({l: 'c', r: 'm'}[s], cnt.up);
		Mousetrap.bind({l: 'd', r: 'k'}[s], cnt.down);
	});
}


function Timer(timer, elapsed, timerDuration) {
	var running = false;
	var remaining = timerDuration;
	var end = null;
	var intervalSet = null;

	$(document).on('setTimerDuration', function(e, t) {
		timerDuration = t;

		if (!running) {
			write(timerDuration);
			remaining = timerDuration;
			clear();
		}
	});

	var onEnd = function () {}; 

	function write(msec) {
		timer.text(msec2txt(msec));
		elapsed.text(msec2txt(timerDuration - msec, true));
	}

	function tick() {
		remaining = end.getTime() - (new Date()).getTime();

		if (remaining <= 0) {
			write(0);
			remaining = timerDuration;
			clear();
			onEnd();

		} else {
			write(remaining);
		}
	}

	function clear() {
		running = false;
		end = null;
		if (intervalSet) {
			clearInterval(intervalSet);
			intervalSet = null;
		}
	}

	write(remaining);

	return {
		start: function() {
			end = new Date((new Date).getTime() + remaining);
			running = true;

			tick();

			intervalSet = setInterval(tick, 100);
		},

		stop: function() {
			remaining = end.getTime() - (new Date()).getTime();
			clear();
		},

		reset: function() {
			remaining = timerDuration;
			clear();
			write(remaining);
		},

		setOnEnd: function(f) {
			onEnd = f;
		},

		isRunning: function() {
			return running;
		}
	}
}

function initTimer(initialDuration) {
	var tim = new Timer($('#timer'), $('#timeElapsed'), initialDuration);

	function play() {
		$('#bstartstop>span').removeClass('glyphicon-pause');
		$('#bstartstop>span').addClass   ('glyphicon-play');		
	}

	function pause() {
		$('#bstartstop>span').removeClass('glyphicon-play');
		$('#bstartstop>span').addClass   ('glyphicon-pause');		
	}

	tim.setOnEnd(function() {
		play();
	});

	function startstop() {
		if (tim.isRunning()) {
			tim.stop();
			play();
		} else {
			tim.start();
			pause();
		}
	}

	function reset() {
		tim.reset();
		play();
	}

	$('#bstartstop').on('click', startstop);
	$('#breset').on('click', reset);

	Mousetrap.bind('space', startstop);
}



!(function() {
	var o = {
		l : localStorage.jst_lpu || 'http://upload.wikimedia.org/wikipedia/commons/5/5a/Basketball_ball.svg',
		r : localStorage.jst_rpu || 'http://upload.wikimedia.org/wikipedia/commons/3/36/Tennis_ball_3.svg'
	};

	['l', 'r'].forEach(function(s) {
		$.event.trigger('setLogo', {s: s, url: o[s]});
	});

	var timerDuration = parseInt(localStorage.jst_dur || 1200000);
	$.event.trigger('setTimerDuration', timerDuration);

	var showElapsed = (localStorage.jst_showElapsed === 'true') || false;
	$.event.trigger('setShowElapsed', showElapsed);

	initCounters();
	initTimer(timerDuration);
}());
