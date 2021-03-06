// This is probably (hopefully?) just a temporary place-holder for
// shared/common functions (20101101/straup)

// a bare-bones helper function that assumes you've defined a
// 'draw_map' function before you call it.

function utils_load_map(args){

	 if (_dotspotting.js_loadlib == true){
	 	draw_map(args);
		return;
	 }

	 setTimeout(function(){
		utils_load_map(args);
	 }, 500);
}

function utils_scrub_map(){

	// just blow away the map (if a datatable is filtered)

	var mom = $("#map");
	var kids = mom.children();

	if (kids.length){
		kids.remove();
	}
}

function utils_tile_provider(){

    var template = _dotspotting.maptiles_template_url;
    var hosts = _dotspotting.maptiles_template_hosts;

    var static_tiles = 0;

    // can has URL template?
    // there should be querystring object by this stage...
    var	qs = (_dotspotting && _dotspotting.hashobj) ? _dotspotting.hashobj : null;
    if(qs){
    	var t = (qs.contains('template')) ? qs.get('template') : null;
    	var p = (qs.contains('provider')) ? qs.get('provider') : null;

    	// See that? We're redefining 'p' and 't' on the fly

    	if ((p) && (p = ensure_valid_url_template_provider(p))){

    		template = p['template'];
    		hosts = p['hosts'];
    		static_tiles = p['static'];
    	}

    	else if ((t) && (t = ensure_valid_url_template(t))){

    		template = t;
    		hosts = null;
    		static_tiles = (qs.contains('static')) ? 1 : 0;
    	}
    }


    var rsp = {
	'template' : template,
	'hosts' : hosts,
	'static' : static_tiles
    };

    return rsp;
}

function ensure_valid_url_template_provider(p){

	// The valid_providers hash is defined here because it's
	// just the simplest thing to do right now. It may / should
	// be moved in to a more global scope so that other parts
	// of the site can access it. That being said nothing else
	// is using it right now so it stays here for now.
	// (20110706/straup)

	// 'static' is a flag that indicated these tiles are being
	// served using raw tilestache cache-style URLs

	var cm_key = '1a1b06b230af4efdbb989ea99e9841af';
	var cm_hosts = ['a','b','c','d'];

	var mq_hosts = [1,2,3,4];

	var valid_providers = {

		// bing (todo)

		// cloudmade
		'lynch' : { 'template': 'http://{S}.tile.cloudmade.com/' + cm_key + '/2241/256/{Z}/{X}/{Y}.png', 'hosts' : cm_hosts, 'static' : 0 },
		'midnightcommander' : { 'template': 'http://{S}.tile.cloudmade.com/' + cm_key + '/999/256/{Z}/{X}/{Y}.png', 'hosts' : cm_hosts, 'static' : 0 },
		'paledawn' : { 'template': 'http://{S}.tile.cloudmade.com/' + cm_key + '/998/256/{Z}/{X}/{Y}.png', 'hosts' : cm_hosts, 'static' : 0 },

		// google (todo)

		// mapquest
		'mapquest-road' : { 'template': 'http://otile{S}.mqcdn.com/tiles/1.0.0/osm/{Z}/{X}/{Y}.jpg', 'hosts' : mq_hosts, 'static' : 0 },
		'mapquest-aerial' : { 'template': 'http://oatile{S}.mqcdn.com/naip/{Z}/{X}/{Y}.jpg', 'hosts' : mq_hosts, 'static' : 0 },

		// osm
		'openstreetmap' : { 'template' : 'http://{S}.tile.openstreetmap.org/{Z}/{X}/{Y}.png', 'hosts' : ['a','b','c'], 'static': 0 },

		// stamen
		'prettymaps' : { 'template' : 'http://prettymaps.stamen.com/201008/tiles/isola/{Z}/{X}/{Y}.png', 'hosts' : null, 'static' : 1 },

		// acetate
		'acetate' : {'template': 'http://acetate.geoiq.com/tiles/acetate/{Z}/{X}/{Y}.png', 'hosts': null, 'static': 0},
	};

	valid_providers['bourne'] = valid_providers['midnightcommander'];
	valid_providers['osm'] = valid_providers['openstreetmap'];

	return valid_providers[p];
}

function ensure_valid_url_template(t){

    uri = parseUri(t);

    if (uri.protocol != 'http'){
	return null;
    }

    if (! uri.path.match(/\/{Z}\/{X}\/{Y}\.(?:jpg|png)$/) ){
	return null;
    }

    var parts = uri.path.split(/\/{Z}\/{X}\/{Y}\.(jpg|png)$/);

    var path = parts[0].split('/');
    var ext = parts[1];

    var clean = [];

    for (i in path){
	clean.push(encodeURIComponent(path[i]));
    }

    var template =
	uri.protocol + '://' + uri.host +
	clean.join('/') +
	'/{Z}/{X}/{Y}' +
	'.' + ext;

    return template;
}

function utils_polymap(map_id, more){

	var svg = org.polymaps.svg("svg");

	var div = document.getElementById(map_id);
	div.appendChild(svg);

	var map = org.polymaps.map();
	map.container(svg);


 	if(more && more['justzoom']){
		$('#pan_left').remove();
		$('#pan_right').remove();
		$('#pan_up').remove();
		$('#pan_down').remove();
		$('#reset_bounds').remove();
		$('#zoom_in').css('left','0px');
		$('#zoom_out').css('left','0px');
	}else if(more && more['static']){
		$('#map_controls').remove();
	}else{
		//	inital attempt to add touch support to polymaps
		if(_dotspotting.enable_touch_support){
			var touch = org.polymaps.touch();
			map.add(touch);
		}else{
			var drag = org.polymaps.drag();
			map.add(drag);

			var dblclick = org.polymaps.dblclick();
			map.add(dblclick);
		}

		utils_hash(map,"po");

	}

	var tp = utils_tile_provider();

	var url = (tp['static']) ? tilestache(tp['template']) : org.polymaps.url(tp['template']);

	if (tp['hosts']){
		url.hosts(tp['hosts']);
	}

	var tileset = org.polymaps.image();
	tileset.url(url);

	map.add(tileset);

	// we add the map compass on a case-by-case
	return map;
}


function utils_polymaps_add_compass(map){
	/* using our own buttons, but want the shift-click zoomy thing */
	var compass = org.polymaps.compass();
	compass.pan('none');
	compass.zoom('none');
	map.add(compass);
}

// non-kirby
function std_utils_polymaps_assign_dot_properties(e){

	var count = e.features.length;

	if (! count){
		return;
	}

	for (var i=0; i < count; i++){


		var f = e.features[i];

		var data = f.data;

		var to_process = new Array(
			[ f.element, data.properties ]
		);

		// Okay! Go!!
		var count_process = to_process.length;

		for (var k = 0; k < count_process; k ++){

			var el = to_process[k][0];
			var props = to_process[k][1];


			var classes = ['dot'];

			if (props && props.permissions){
				classes.push('dot_' + props.permissions);
			}

			//	just add the hover class for single dot pages
			//	clicking on them doesn't do anything anyways
			if(props && props.is_page_dot){
				classes.push('dotHover');
			}


			el.setAttribute('class', classes.join(' '));
			el.setAttribute('r', 8);

			if (props && props.id){

		    		el.setAttribute('id', 'dot_' + props.id);
					utils_svg_title(el,props.id);

				if (props.is_interactive){
		    			var enc_id = encodeURIComponent(props.id);
	    				el.setAttribute('onmouseover', 'dot_onmouseover(' + enc_id + ',true);return false');
	    				el.setAttribute('onmouseout', 'dot_onmouseout(' + enc_id + ');return false');
						el.setAttribute('onclick', 'dot_onclick(' + enc_id + ','+f.data.geometry.coordinates[0]+','+f.data.geometry.coordinates[1]+');return false');

					//	$(el).bind('click', {props: props, geo: f.data.geometry}, dot_onclick);
				}
			}

		}
	}

}

function clusterMarkers(markers) {

    // Quantize a number by a divisor
    function quantize(n, q) {
        return Math.round(n / q) * q;
    }


    //el.setAttribute('id', 'dot_' + id);
	//clone.setAttribute('id', 'dot_u_' + id);

    /**
     * Quantize the location of the marker to determine its "corner".
     * Note: we should probably avoid offsetting markers with
     * more explicit locations.
     */
    function getCorner(marker) {
        var loc = marker.location,
            prec = .001,
            x = Number(loc.lon),
            y = Number(loc.lat);

        try {
            return quantize(x, prec)+ "," + quantize(y, prec);
        } catch (e) {
            return "bad";
        }
    }

    var corners = {},
        len = markers.length;
    for (var i = 0; i < len; i++) {
        var marker = markers[i];

        var marker = markers[i],
            loc = marker.location,
            corner = getCorner(marker);
        if (loc.lat != 0 && loc.lon != 0) {

            marker._coord = marker.coord.copy();

            if (corner in corners) {
                corners[corner].push(marker);
            } else {
                corners[corner] = [marker];
            }
        }
    }


    for (var corner in corners) {
        var m = corners[corner];
        if (m.length > 1) {
            //.0000004,
            var r = .0000004,
                // TODO: use the center instead?
                c = m[0]._coord,
                a = Math.PI / 40,
                step = Math.PI * 2 / m.length;
            for (var i = 0; i < m.length; i++) {
                var mark = m[i],
                    offset = {
                        row: Math.cos(a) * r,
                        col: Math.sin(a) * r
                    };

                mark.coord.row += offset.row;
                mark.coord.column += offset.col;
                a += step;
            }
        }
    }
}



// kirby enabled
function utils_polymaps_assign_dot_properties(e){

    // Quantize a number by a divisor
    function quantize(n, q) {
        return Math.round(n / q) * q;
    }

    /**
     * Quantize the location of the marker to determine its "corner".
     * Note: we should probably avoid offsetting markers with
     * more explicit locations.
     */
    function getCorner(marker,loc) {
        var prec = .001,
            x = Number(loc[0]),
            y = Number(loc[1]);

        try {
            return quantize(x, prec)+ "," + quantize(y, prec);
        } catch (e) {
            return "bad";
        }
    }


	var count = e.features.length,
	    corners = {};

	if (! count){
		return;
	}


    //ugh, more nodes....
    // create 2 groups for kirby dots -- over & under
    if(!e.features[0].element)return;
    var master = e.features[0].element.parentNode;
	var g1 = org.polymaps.svg("g");
	var g2 = org.polymaps.svg("g");
	master.appendChild(g1);
	master.appendChild(g2);


	for (var i=0; i < count; i++){


		var f = e.features[i];

		var data = f.data;

		var to_process = new Array(
			[ f.element, data.properties ]
		);

		// Okay! Go!!
		var count_process = to_process.length;




		for (var k = 0; k < count_process; k ++){

			var el = to_process[k][0];
			var props = to_process[k][1];


			var classes = ['dot'];

			if (props && props.permissions){
				classes.push('dot_' + props.permissions);
			}

			//	just add the hover class for single dot pages
			//	clicking on them doesn't do anything anyways
			if(props && props.is_page_dot){
				classes.push('over_hover');
			}


			if (props && props.id){

        		   var thedots =  utils_kirby_me(props.id,el,g1,g2,classes);

        		   var loc = f.data.geometry.coordinates,
       			    corner = getCorner(f,loc);


           			if(loc[0] != 0 && loc[1] !=0){

           			    if (corner in corners) {
                               corners[corner].push([el,{row:f.data.geometry.coordinates.x,col:f.data.geometry.coordinates.y},thedots[1]]);
                           } else {
                               corners[corner] = [[el,{row:f.data.geometry.coordinates.x,col:f.data.geometry.coordinates.y},thedots[1]]];
                           }

           			}

					utils_svg_title(el,props.id);


				if (props.is_interactive){
		    			var enc_id = encodeURIComponent(props.id);
	    				el.setAttribute('onmouseover', 'dot_onmouseover(' + enc_id + ',true);return false');
	    				el.setAttribute('onmouseout', 'dot_onmouseout(' + enc_id + ');return false');
						el.setAttribute('onclick', 'dot_onclick(' + enc_id + ','+f.data.geometry.coordinates[0]+','+f.data.geometry.coordinates[1]+');return false');

					//	$(el).bind('click', {props: props, geo: f.data.geometry}, dot_onclick);
				}
			}

		}
	}


	for (var corner in corners) {
        var m = corners[corner];

        if (m.length > 1) {
            //.0000004,
            var r = 6,
                // TODO: use the center instead?
                c = m[0][1];
                a = Math.PI / 40,
                step = Math.PI * 2 / m.length;
            for (var i = 0; i < m.length; i++) {
                var mark = m[i],
                    offset = {
                        row: Math.cos(a) * r,
                        col: Math.sin(a) * r
                    };

                mark[1].row += offset.row;
                mark[1].col += offset.col;

                mark[0].setAttributeNS(null,"transform","translate("+mark[1].row+","+mark[1].col+")");
                mark[2].setAttributeNS(null,"transform","translate("+mark[1].row+","+mark[1].col+")");
                a += step;
            }
        }

    }





}

// how a dot becomes Kirby,
function utils_kirby_me(id,el,g1,g2,classes){
    var clone =  el.cloneNode(false);
	//
	g1.appendChild(clone);
	clone.setAttribute('class', 'under');
	clone.setAttribute('r', 12);
	//
	g2.appendChild(el);
	//classes.push("over");
	el.setAttribute('class', classes.join(' '));
	el.setAttribute('r', 6);


	//g.setAttribute('class', classes.join(' '));
	el.setAttribute('id', 'dot_' + id);
	clone.setAttribute('id', 'dot_u_' + id);

	return [el,clone];
}


function utils_polymaps_assign_sheet_properties (e){

	var count = e.features.length;

	if (! count){
		return;
	}

	for (var i=0; i < count; i++){

		var f = e.features[i];
		var data = f.data;

		var to_process = new Array(
			[ f.element, data.properties ]
		);

		// Okay! Go!!

		var count_process = to_process.length;

		for (var k = 0; k < count_process; k ++){

			var el = to_process[k][0];
			var props = to_process[k][1];

			/* Move dot to bottom of group */

			el.parentNode.appendChild(el);


			el.setAttribute('class', 'sheet');

			if (props && props.id){

				var enc_id = encodeURIComponent(props.id);

				el.setAttribute('id', 'sheet_' + data.properties.id);
				el.setAttribute('onmouseover', 'sheet_onmouseover(' + enc_id + ');return false');
				el.setAttribute('onmouseout', 'sheet_onmouseout(' + enc_id + ');return false');
				el.setAttribute('onclick', 'sheet_onclick(' + enc_id + ');return false');
				utils_svg_title(el,props.label);
			}

		}
	}
}

// add title to svg elements (dots, sheets)
function utils_svg_title(el,title){
	el.setAttribute('title', title);
	el.appendChild( document.createElementNS(org.polymaps.svg.ns, "title") ).appendChild(document.createTextNode(title));
}

function utils_modestmap(map_id, more){

	if(more && more['static']){
		$('#map_controls').remove();
	}else if(more && more['justzoom']){
		$('#pan_left').remove();
		$('#pan_right').remove();
		$('#pan_up').remove();
		$('#pan_down').remove();
		$('#reset_bounds').remove();
		$('#zoom_in').css('left','0px');
		$('#zoom_out').css('left','0px');
	}else{
		//
	}
	var tp = utils_tile_provider();

	var provider = null;


	if (tp['static']){
	    provider = new com.modestmaps.TileStacheStaticMapProvider(tp['template'], tp['hosts']);
	}
	else {
	    provider = new com.modestmaps.TemplatedMapProvider(tp['template'], tp['hosts']);
	}

	var dims = undefined;

	var handlers = [
			// how to disable the scroll wheel ?
			new com.modestmaps.MouseHandler()
	];

	var map = new com.modestmaps.Map(map_id, provider, dims, handlers);

	utils_hash(map,"mm");
	return map;
}

function utils_modestmaps_add_compass(map){
    //com.modestmaps.Compass(map);
}

function utils_modestmaps_add_kirbydots(layer,features,more){
    if (! more){
		more = {};
	}
	var drawn = new Array();
	var drawn_back = new Array();

	var count_features = features.length;

	for (var i = 0; i < count_features; i++){
	    var f = features[i],
	    props = f.properties,
	    geom = (f.geometry.type == 'GeometryCollection') ? f.geometry.geometries : [ f.geometry ],
        coords = geom[0]['coordinates'],
        loc = new com.modestmaps.Location(coords[1],coords[0]);

        var more_front = {
           style: more['attrs'],
           id: "dot_"+props.id,
           radius:6
       };
       var more_back = {
              style: more['attrs_back'],
              radius:12
        };

        var _front = layer.addMarker(more_front,loc);
		var _back = layer.addMarker(more_back,loc);
        _back.toBack();
        drawn.push(_front);

        //
        if(more['onload'])more['onload'](_front, props);


	}
	return drawn;
}

// quick and dirty function to tweak the extents of a bounding
// box so that dots don't get cropped by the edge of the map.
// this will undoubtedly require finesse-ing over time...
// (20101027/straup)

function utils_adjust_bbox(bbox){

    var sw = new LatLon(bbox[0]['lat'], bbox[0]['lon']);
	var ne = new LatLon(bbox[1]['lat'], bbox[1]['lon']);

	var offset = 0;
	var dist = sw.distanceTo(ne);

	if (dist >= 10){
		offset = .5;
	}

	else if (dist >= 100){
		offset = 1;
	}

	else if (dist >= 500){
		offset = 2;
	}

	else {}

	// not sure if there is good way of doing this while trying to achieve
	// a max scale and integer zoom levels, at the same time.
	offset = 0;
	bbox[0]['lat'] -= offset;
	bbox[0]['lon'] -= offset;
	bbox[1]['lat'] += offset;
	bbox[1]['lon'] += offset;


	return bbox;
}


////////////// seanc dumping ground //////////////////
function get_mm_dot_styles(){

    var over = {
   		'fill' : 'rgb(11,189,255)',
   		'fill-opacity' : 1,
   		'stroke' : 'rgb(11,189,255)',
   		'stroke-width' : 1
   	};

   	var under = {
   		'fill' : 'rgb(255,255,255)',
   		'fill-opacity' : .8,
   		'stroke' : 'rgb(204,204,204)',
   		'stroke-width' : 1
   	};

   	var over_hover = {
   		'fill' : 'rgb(0,0,0)',
   		'fill-opacity' : 1,
   		'stroke':'rgb(11,189,255)',
   		'stroke-width' : 4
   	};
   	return([over,under,over_hover]);

}

function get_mm_sheet_styles(){
	var attrs = {
		'fill' : 'rgb('+_dotspotting['sheet_color']['fill'][0]+','+_dotspotting['sheet_color']['fill'][1]+','+_dotspotting['sheet_color']['fill'][2]+')',
		'fill-opacity' : _dotspotting['sheet_color']['fill'][3],
		'stroke' : 'rgb('+_dotspotting['sheet_color']['stroke'][0]+','+_dotspotting['sheet_color']['stroke'][1]+','+_dotspotting['sheet_color']['stroke'][2]+')',
		'stroke-width' : _dotspotting['sheet_color']['stroke_width'],
		'stroke-opacity' :_dotspotting['sheet_color']['stroke'][3]
	};

	var attrs_hover = {
		'fill' : 'rgb('+_dotspotting['sheet_color']['fill_hover'][0]+','+_dotspotting['sheet_color']['fill_hover'][1]+','+_dotspotting['sheet_color']['fill_hover'][2]+')',
		'fill-opacity' : _dotspotting['sheet_color']['fill_hover'][3],
		'stroke' : 'rgb('+_dotspotting['sheet_color']['stroke_hover'][0]+','+_dotspotting['sheet_color']['stroke_hover'][1]+','+_dotspotting['sheet_color']['stroke_hover'][2]+')',
		'stroke-width' : _dotspotting['sheet_color']['stroke_width'],
		'stroke-opacity' :_dotspotting['sheet_color']['stroke_hover'][3]
	};
	return([attrs,attrs_hover]);
}



//
function utils_set_embed_params(){
	var _out = "";
	var _id = (_dotspotting.embed_props.uid) ? _dotspotting.embed_props.uid : -1;
	var _sht = (_dotspotting.embed_props.sid) ? _dotspotting.embed_props.sid : -1;
	var _coord = (_dotspotting.embed_props.c) ? _dotspotting.embed_props.c : "";
	if(_id >= 0 && _sht >= 0){
		_out = "<div>";
		_out += "<script src='";
		_out += _dotspotting.abs_root_url+"embed/dotspotting_embedwidget.js?sid="+_sht+"&uid="+_id;
		_out += (_coord.length) ? "&xyz="+_coord : "";
		_out += "'></script>";
		_out += "</div>";
	}
	return _out;
}

// create handlers for map controls
function utils_add_map_controls(map,map_type,extent){

	$('#map_controls').fadeIn();
	$("#map_controls a").each(function(){
		$(this).click(function(e){
			e.preventDefault();
			var type = $(this).attr("id");
			if(type && type.length){
				switch(type){
					case "zoom_in":
						(map_type == "mm") ? map.zoomIn() : map.zoomBy(1);
					break;
					case "zoom_out":
						(map_type == "mm") ? map.zoomOut() : map.zoomBy(-1);
					break;
					case "pan_left":
						(map_type == "mm") ? map.panBy(100,0) : map.panBy({x:100,y:0});
					break;
					case "pan_right":
						(map_type == "mm") ? map.panBy(-100,0) : map.panBy({x:-100,y:0});
					break;
					case "pan_up":
						(map_type == "mm") ? map.panBy(0,100) : map.panBy({x:0,y:100});
					break;
					case "pan_down":
						(map_type == "mm") ? map.panBy(0,-100) : map.panBy({x:0,y:-100});
					break;
					case "reset_bounds":
						if(map_type == "mm"){
							map.setExtent(extent);
						}
						else
						{
							map.extent(extent);
							map.zoom(Math.floor(map.zoom()));
						}
					break;
					case "embed_map":
						if($('#embed_map_box').is(':visible'))
						{
							$("#embed_map_box").hide();
						}
						else
						{
							var _ebd = utils_set_embed_params();
							if(_ebd.length){
								$("#embed_map_box p").html("<strong>Copy the below code and paste it inside HTML body:</strong>");
								$("#embed_map_box textarea").val(_ebd);
								$("#embed_map_box").show();
							}else{
								$("#embed_map_box p").html("Sorry could not create an embed code!");
								$("#embed_map_box textarea").val("");
								$("#embed_map_box").show();
							}

						}

					break;
					default:
					//
					break;

				}
			}
		})
	});
	/*
	$('.closehelperbutton').click(function(){
		$("#helper_btn").trigger( 'click' );
	});
	*/
}


// map toggle size button
function utils_map_toggle_size(map,map_type,tallSize,markers){
	var map_size = "small";

	$("#mapsizeToggler").click(function(e){
		e.preventDefault();
		var _this = $(this);
		var _w = Math.round($("#map").width());
		if(map_size == "small"){
			map_size = "large";
			$("#map").animate({
			    height: tallSize
			  }, 100, function() {
				$(_this).text("Shorter map").removeClass('taller').addClass('shorter');
				if(map_type == "mm"){
					map.setSize(_w,tallSize);
					markers.forceAresize();
				}
				else
				{
					map.resize();
				}

			  });
		}else{
			map_size = "small";
			$("#map").animate({
			    height: 300
			  }, 100, function() {
				$(_this).text("Taller map").removeClass('shorter').addClass('taller');
			    if(map_type == "mm"){
					map.setSize(_w,300);
					markers.forceAresize();
				}
				else
				{
					map.resize();
				}
			  });
		}
	});
}

/*
	Add ToolTip & bind marker click event to #map
	not activated on sheet views, only dots view

	** modified from Portland crime map: https://github.com/Caged/portlandcrime **

	@param 	map			reference to either modestmap or polymap instance
	@param	mapel		jQuery object of map parent
	@parem	map_type	either "mm" , "po"
*/
function utils_add_map_tooltip(map,mapel,map_type){

	$(".maptip").each(function(){
		$(this).remove();
	});

	$("#map").unbind('markerclick');
	$("#map").bind('markerclick', function(e,dotid) {

		if(mapel.length == 0) return;

		var dot = dot_getinfo_json(dotid);
		if(!dot.latitude && !dot.longitude) return;

		var props = new Object();
		props.location = (map_type == "mm") ? new com.modestmaps.Location(dot.latitude,dot.longitude) : {lat: dot.latitude, lon: dot.longitude};
		props.map = map;
		props.id = dotid;
		props.map_type = map_type;

		 mapel.maptip(this)
		  .data(props)
	      .map(map)
	      .location(props.location)
	      .classNames(function(d) {
	        return d.code
	      })
	      .top(function(tip) {
	        var point = tip.props.map.locationPoint(this.props.location)
	        return parseFloat(point.y)
	      }).left(function(tip) {
	        var radius = tip.target.getAttribute('r'),
	            point = tip.props.map.locationPoint(this.props.location)

	        return parseFloat(point.x + (radius / 2.0) + 20)
	      }).content(function(d) {

			var _timer,
			_clickTime,
			_tip = null;

	        var self = this,
	            props = d,
	            cnt = $('<div/>'),
	            hdr = $('<h2/>'),
	            bdy = $('<p/>'),

	            close = $('<span/>').addClass('close').html('<img src="'+_dotspotting.abs_root_url+'images/x.png"/>')
		        hdr.html(dot_tip_header(props.id));
		        //hdr.append(close);

				cnt.append(close);

		        bdy.html(dot_tip_body(props.id))

		        cnt.append($('<div/>').addClass('nub'))
		        cnt.append(hdr).append(bdy)

		        close.click(function() {
					closeTip(self);
		        })


				/* 	attempt to allow clicking anywhere on map as a way to close tooltip
					seems to be working
				*/
				/*
				// put a delay on creating handlers
				_timer = setInterval(function(){
					setupMapCloseHandlers();
					//console.log("timer: ",_timer);
					clearInterval(_timer);
				}, 1000);
				*/

				function setupMapCloseHandlers(){
					_tip = self;


					$('#map').unbind('mousedown');
					$('#map').unbind('mouseup');

					 $("#map").mousedown(function () {
						_clickTime = new Date();
					});

					$("#map").mouseup(function (e) {
						// check to see if mouseup came from dot
						// if so, don't execute
						if(dotHasClass(e.target,"dot"))return;

						// no clickTime, no go
						if(!_clickTime)return;

						//calculate time between mousedown & mouseup
						var _endTime = new Date();
						var _diff = _endTime.getTime() - _clickTime.getTime();

						// check to see if this is a click or drag
						if(_tip && (_diff < 150) ){
							closeTip(_tip);
						}
					});
				}



				function closeTip(_tipRef){
					if(!_tipRef)return;
					if(_timer){
						clearInterval(_timer);
						_timer = null;
					}
					$('#map').unbind('mousedown');
					$('#map').unbind('mouseup');
					_tipRef.hide();

					dot_unselect(props.id);
					_dotspotting.selected_dot = null;
				}



	        	return cnt;
	      }).render()


	});

	/* 	could do something like this if you wanted a selected dot to stay active during filtering
		would also need to check if dot is bound box
		and also not reset _dotspotting.selected_dot global to null during draw_map_... function


	if(_dotspotting.selected_dot){
		console.log("DOT ID: ",_dotspotting.selected_dot);
		var _tmp = _dotspotting.selected_dot;
		_dotspotting.selected_dot = null;
		dot_onclick(_tmp);
	}
	*/
}

// Hash functions
function utils_hash(map,type){
	this.coords = '';
	this.search = '';
	this.hashInterval = null;
	this.currentHash = '';
	this.perm = document.getElementById('permalink');
	var self = this;

	if(type == "po"){
		map.on("move", function() {
			self.coords = self.hashCoordFormatter( map.center(), map.zoom());
			self.doDrawn();
		});

	}else if(type == "mm"){
		map.addCallback("drawn", function(){
			self.coords = self.hashCoordFormatter( map.getCenter(), map.getZoom());
			self.doDrawn();
		});
	}

	this.doDrawn = function(){
		clearInterval(this.hashInterval);
		this.hashInterval = setInterval(function(){self.updateHash();}, 100);
	}

	this.updateHash = function(){
		clearInterval(this.hashInterval);
		//console.log(this.coords,this.search);
		this.search = (!_dotspotting.datatables_query) ? '': _dotspotting.datatables_query;

		var newHash = '';
		if(_dotspotting.fullscreen_flag){
		    newHash += "ff=1";
		}
		if(this.search.length){
			newHash  += "s="+this.search;
		}
		if(this.coords.length){
			newHash  += (newHash.length) ? "&" : "";
			newHash  += "c="+this.coords;
		}

		if(this.currentHash != newHash && newHash.length){
			window.location.hash = newHash;
			this.currentHash = newHash;

			_dotspotting.embed_props.c = this.coords;
			_dotspotting.embed_props.s = this.search;

			// set permalink
			if(this.pm)this.pm.setAttribute('href', location.href);
		}
	}

	// formats coordinates for hash
	this.hashCoordFormatter = function(center,zoom){
		var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));
		return zoom.toFixed(2)
	         + "/" + center.lat.toFixed(precision)
	         + "/" + center.lon.toFixed(precision);
	}

	this.setSearch = function(str){
		this.search = str;
		this.updateHash();
	}

}

/* Client-side access to querystring name=value pairs
	Version 1.3
	28 May 2008

	License (Simplified BSD):
	http://adamv.com/dev/javascript/qslicense.txt
*/
// we're smashing both the hash & search location properties together
function Querystring() {
	var params = {};

	var _hash = (window.location.hash != '') ? window.location.hash.substring(1) : '';
	var _search = window.location.search.substring(1);

	if(_hash)parseIt(_hash);
	if(_search)parseIt(_search);

	function parseIt(stuff){
	    stuff = stuff.replace(/\+/g, ' ');
    	var args = stuff.split('&'); // parse out name/value pairs separated via &

    	// split out each name=value pair
    	for (var i = 0; i < args.length; i++) {
    		var pair = args[i].split('=');
    		var name = decodeURIComponent(pair[0]);

    		var value = (pair.length==2)
    			? decodeURIComponent(pair[1])
    			: name;

    		params[name] = value;
    	}
	}

	return {
	    get: function(key, default_) {
    		var value = params[key];
    		return (value != null) ? value : default_;
    	},
    	contains: function(key) {
    		var value = params[key];
    		return (value != null);
    	}

	}

}
// probably don't need this, call Querystring on it's own
// left incase needed to do anything else during this phase (seanc | 03112011)
function doHashSetup(){
    /*
	qs = (window.location.hash != '') ? window.location.hash.substring(1) : window.location.search.substring(1);

    if (qs){
		qs = new Querystring(qs);
	}else{
		qs = null;
	}
	return qs;
	*/
}

////
/* fix for missing Array methods in IE */
if (!Array.prototype.map) {
    Array.prototype.map= function(mapper, that /*opt*/) {
        var other= new Array(this.length);
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this)
                other[i]= mapper.call(that, this[i], i, this);
        return other;
    };
}
if (!Array.prototype.some) {
    Array.prototype.some = function(tester, that /*opt*/) {
        for (var i= 0, n= this.length; i<n; i++)
            if (i in this && tester.call(that, this[i], i, this))
                return true;
        return false;
    };
}
if (!Array.prototype.indexOf)
{
  Array.prototype.indexOf = function(searchElement /*, fromIndex */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (len === 0)
      return -1;

    var n = 0;
    if (arguments.length > 0)
    {
      n = Number(arguments[1]);
      if (n !== n) // shortcut for verifying if it's NaN
        n = 0;
      else if (n !== 0 && n !== (1 / 0) && n !== -(1 / 0))
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }

    if (n >= len)
      return -1;

    var k = n >= 0
          ? n
          : Math.max(len - Math.abs(n), 0);

    for (; k < len; k++)
    {
      if (k in t && t[k] === searchElement)
        return k;
    }
    return -1;
  };
}


function defer(fn, ms, context) {
    if (!ms) ms = 10;
    return function() {
        var args = arguments, that = context || this;
        if (fn.timeout) clearTimeout(fn.timeout);
        return fn.timeout = setTimeout(function() {
            if (typeof fn === "function") {
                fn.apply(that, args);
            }
        }, ms);
    };
}

