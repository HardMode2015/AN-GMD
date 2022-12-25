'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsts = require('jsts/dist/jsts');

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

var id = 0;

function _classPrivateFieldLooseKey(name) {
  return "__private_" + id++ + "_" + name;
}

function _classPrivateFieldLooseBase(receiver, privateKey) {
  if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) {
    throw new TypeError("attempted to use private field on non-instance");
  }

  return receiver;
}

var CustomOverlayView =
/**
 * @param {string} content String with the inner HTML of the overlay
 * @param {google.maps.LatLng} position Google LatLng object with the position of the overlay on the map
 * @param {Function} callback Funcion to be called when click in the overlay
 */
function CustomOverlayView(content, _position, callback) {
  var _this = this;

  this.onAdd = function () {
    _this.div = document.createElement('div');
    _this.div.style.cssText = 'position: absolute; transform: translate(-50%, -50%);';
    _this.div.innerHTML = _this.content;

    if (_this.callback) {
      google.maps.event.addDomListener(_this.div, 'click', _this.callback);
    }

    _this.getPanes().floatPane.appendChild(_this.div);
  };

  this.onRemove = function () {
    if (_this.div) {
      google.maps.event.clearInstanceListeners(_this.div);

      _this.div.parentNode.removeChild(_this.div);

      delete _this.div;
    }
  };

  this.close = function () {
    _this.setMap(null);
  };

  this.draw = function () {
    var position = _this.position;

    var projection = _this.getProjection();

    if (!position || !projection) {
      return;
    }

    var point = projection.fromLatLngToDivPixel(position);

    if (_this.div) {
      _this.div.style.top = point.y + 'px';
      _this.div.style.left = point.x + 'px';
    }
  };

  this.show = function (map) {
    _this.setMap(map);

    _this.draw();
  };

  this.remove = function () {
    _this.close();
  };

  this.extend = function (type1, type2) {
    for (var property in type2.prototype) {
      type1.prototype[property] = type2.prototype[property];
    }
  };

  this.content = content;
  this.position = _position;
  this.callback = callback; // Typescript ReferenceError: google is not defined
  // It is not possible to directly extend a google.maps.* class since it actually isn't available

  this.extend(CustomOverlayView, google.maps.OverlayView);
};

var MapFunctions = function MapFunctions() {};

MapFunctions.getZoom = function (map) {
  return map.getZoom();
};

MapFunctions.getBounds = function (map) {
  var bounds = map.getBounds();
  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();
  return {
    nw: {
      lat: ne.lat(),
      lng: sw.lng()
    },
    se: {
      lat: sw.lat(),
      lng: ne.lng()
    }
  };
};

MapFunctions.pointToLatLng = function (map, point) {
  var clientRect = map.getDiv().getBoundingClientRect();
  var clientX = point.clientX - clientRect.left;
  var clientY = point.clientY - clientRect.top;
  var projection = map.getProjection();
  var bounds = map.getBounds();
  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();
  var topRight = projection.fromLatLngToPoint(ne);
  var bottomLeft = projection.fromLatLngToPoint(sw);
  var zoom = MapFunctions.getZoom(map);
  var scale = Math.pow(2, zoom);
  return projection.fromPointToLatLng(new google.maps.Point(clientX / scale + bottomLeft.x, clientY / scale + topRight.y));
};

MapFunctions.freezeMap = function (map, freeze) {
  map.setOptions({
    draggable: !freeze,
    scrollwheel: !freeze,
    draggableCursor: freeze ? 'pointer' : null,
    disableDoubleClickZoom: freeze
  });
};

MapFunctions.enableCrossair = function (map, enable) {
  map.setOptions({
    draggableCursor: enable ? 'crosshair' : null,
    disableDoubleClickZoom: enable
  });
};

var _simplifyPolygon = /*#__PURE__*/_classPrivateFieldLooseKey("simplifyPolygon");

var _convertFromJstsGeometry = /*#__PURE__*/_classPrivateFieldLooseKey("convertFromJstsGeometry");

var _convertFromJstsCoordinates = /*#__PURE__*/_classPrivateFieldLooseKey("convertFromJstsCoordinates");

var _validateGeometry = /*#__PURE__*/_classPrivateFieldLooseKey("validateGeometry");

var _addPolygon = /*#__PURE__*/_classPrivateFieldLooseKey("addPolygon");

var _addLineString = /*#__PURE__*/_classPrivateFieldLooseKey("addLineString");

var _toPolygonGeometry = /*#__PURE__*/_classPrivateFieldLooseKey("toPolygonGeometry");

var JstsHelper = function JstsHelper() {};

JstsHelper.processShape = function (shape, validate) {
  var polygons = [];

  if ((shape == null ? void 0 : shape.length) > 2) {
    var shapePolygons = [];
    var polygon = [];
    var firstCoordinate = null;

    for (var i = 0; i < shape.length; i++) {
      if (!firstCoordinate) {
        firstCoordinate = shape[i];
        polygon = [];
        polygon.push(validate ? new jsts.geom.Coordinate(shape[i].lng, shape[i].lat) : new google.maps.LatLng(shape[i].lat, shape[i].lng));
        continue;
      }

      polygon.push(validate ? new jsts.geom.Coordinate(shape[i].lng, shape[i].lat) : new google.maps.LatLng(shape[i].lat, shape[i].lng));

      if (firstCoordinate.lat === shape[i].lat && firstCoordinate.lng === shape[i].lng) {
        if (polygon.length > 3) {
          shapePolygons.push(polygon);
        }

        firstCoordinate = null;
      } else {
        if (i === shape.length - 1) {
          polygon.push(polygon[0]);

          if (polygon.length > 3) {
            shapePolygons.push(polygon);
          }
        }
      }
    }

    if (!validate) {
      polygons = shapePolygons;
    } else {
      if (shapePolygons.length > 0) {
        var geometryFactory = new jsts.geom.GeometryFactory();
        var jstsPolygons = shapePolygons.map(function (item) {
          var shell = geometryFactory.createLinearRing(item);
          return geometryFactory.createPolygon(shell);
        });
        var jstsPolygon = jstsPolygons.length > 1 ? geometryFactory.createMultiPolygon(jstsPolygons) : jstsPolygons[0];

        var validPolygon = _classPrivateFieldLooseBase(JstsHelper, _validateGeometry)[_validateGeometry](jstsPolygon);

        if (validPolygon && validPolygon.getCoordinates().length) {
          polygons = _classPrivateFieldLooseBase(JstsHelper, _convertFromJstsGeometry)[_convertFromJstsGeometry](validPolygon);
        }
      }
    }
  }

  return polygons;
};

JstsHelper.processPolygon = function (path, simplifyZoom) {
  var polygons = [];

  if ((path == null ? void 0 : path.length) > 2) {
    var coordinates = path.map(function (item) {
      return new jsts.geom.Coordinate(item.lng(), item.lat());
    });

    if (coordinates.length > 0) {
      coordinates.push(coordinates[0]);
    }

    var geometryFactory = new jsts.geom.GeometryFactory();
    var shell = geometryFactory.createLinearRing(coordinates);
    var jstsPolygon = geometryFactory.createPolygon(shell);

    if (simplifyZoom) {
      jstsPolygon = _classPrivateFieldLooseBase(JstsHelper, _simplifyPolygon)[_simplifyPolygon](jstsPolygon, simplifyZoom);
    }

    var validPolygon = _classPrivateFieldLooseBase(JstsHelper, _validateGeometry)[_validateGeometry](jstsPolygon);

    if (validPolygon && validPolygon.getCoordinates().length) {
      polygons = _classPrivateFieldLooseBase(JstsHelper, _convertFromJstsGeometry)[_convertFromJstsGeometry](validPolygon);
    }
  }

  return polygons;
};

Object.defineProperty(JstsHelper, _simplifyPolygon, {
  writable: true,
  value: function value(polygon, zoom) {
    var tolerance = 0.1;

    switch (zoom) {
      case 7:
      case 8:
      case 9:
        {
          tolerance = 0.01;
          break;
        }

      case 10:
      case 11:
      case 12:
      case 13:
        {
          tolerance = 0.001;
          break;
        }

      case 14:
      case 15:
      case 16:
      case 17:
        {
          tolerance = 0.0001;
          break;
        }

      case 18:
      case 19:
      case 20:
      case 21:
      case 22:
        {
          tolerance = 0.00001;
          break;
        }

      default:
        tolerance = 0.1;
    }

    return jsts.simplify.TopologyPreservingSimplifier.simplify(polygon, tolerance);
  }
});
Object.defineProperty(JstsHelper, _convertFromJstsGeometry, {
  writable: true,
  value: function value(geom) {
    var polygons = []; // Sets shape on clockwise order

    geom.normalize();

    if (geom instanceof jsts.geom.Polygon) {
      var polygon = _classPrivateFieldLooseBase(JstsHelper, _convertFromJstsCoordinates)[_convertFromJstsCoordinates](geom.getCoordinates());

      polygons.push(polygon);
    }

    if (geom instanceof jsts.geom.MultiPolygon) {
      for (var n = geom.getNumGeometries(); n > 0; n--) {
        var _polygon = _classPrivateFieldLooseBase(JstsHelper, _convertFromJstsCoordinates)[_convertFromJstsCoordinates](geom.getGeometryN(n - 1).getCoordinates());

        polygons.push(_polygon);
      }
    }

    return polygons;
  }
});
Object.defineProperty(JstsHelper, _convertFromJstsCoordinates, {
  writable: true,
  value: function value(coordinates) {
    var path = [];

    if (coordinates) {
      var lastCoordinate = null;

      for (var i = 0; i < coordinates.length; i++) {
        if (!lastCoordinate || !(lastCoordinate.x === coordinates[i].x && lastCoordinate.y === coordinates[i].y)) {
          lastCoordinate = coordinates[i];
          path.push(new google.maps.LatLng(lastCoordinate.y, lastCoordinate.x));
        }
      }
    }

    return path;
  }
});
Object.defineProperty(JstsHelper, _validateGeometry, {
  writable: true,
  value: function value(geom) {
    if (geom instanceof jsts.geom.Polygon) {
      if (geom.isValid()) {
        return geom;
      }

      var polygonizer = new jsts.operation.polygonize.Polygonizer();

      _classPrivateFieldLooseBase(JstsHelper, _addPolygon)[_addPolygon](geom, polygonizer);

      return _classPrivateFieldLooseBase(JstsHelper, _toPolygonGeometry)[_toPolygonGeometry](polygonizer.getPolygons());
    } else if (geom instanceof jsts.geom.MultiPolygon) {
      if (geom.isValid()) {
        return geom;
      }

      var _polygonizer = new jsts.operation.polygonize.Polygonizer();

      for (var n = geom.getNumGeometries(); n > 0; n--) {
        _classPrivateFieldLooseBase(JstsHelper, _addPolygon)[_addPolygon](geom.getGeometryN(n - 1), _polygonizer);
      }

      return _classPrivateFieldLooseBase(JstsHelper, _toPolygonGeometry)[_toPolygonGeometry](_polygonizer.getPolygons());
    } else {
      return geom;
    }
  }
});
Object.defineProperty(JstsHelper, _addPolygon, {
  writable: true,
  value: function value(polygon, polygonizer) {
    _classPrivateFieldLooseBase(JstsHelper, _addLineString)[_addLineString](polygon.getExteriorRing(), polygonizer);

    for (var n = polygon.getNumInteriorRing(); n > 0; n--) {
      _classPrivateFieldLooseBase(JstsHelper, _addLineString)[_addLineString](polygon.getInteriorRingN(n), polygonizer);
    }
  }
});
Object.defineProperty(JstsHelper, _addLineString, {
  writable: true,
  value: function value(lineString, polygonizer) {
    if (lineString instanceof jsts.geom.LinearRing) {
      lineString = lineString.getFactory().createLineString(lineString.getCoordinateSequence());
    }

    var point = lineString.getFactory().createPoint(lineString.getCoordinateN(0));
    var toAdd = lineString.union(point);
    polygonizer.add(toAdd);
  }
});
Object.defineProperty(JstsHelper, _toPolygonGeometry, {
  writable: true,
  value: function value(polygons) {
    switch (polygons.size()) {
      case 0:
        return null;

      case 1:
        return polygons.iterator().next();

      default:
        var iter = polygons.iterator();
        var ret = iter.next();

        while (iter.hasNext()) {
          ret = ret.symDifference(iter.next());
        }

        return ret;
    }
  }
});

var _setInitialDrawPoint = /*#__PURE__*/_classPrivateFieldLooseKey("setInitialDrawPoint");

var _setDeleteDrawPoint = /*#__PURE__*/_classPrivateFieldLooseKey("setDeleteDrawPoint");

var _getDrawnShapeHighestPoint = /*#__PURE__*/_classPrivateFieldLooseKey("getDrawnShapeHighestPoint");

var _initDraw = /*#__PURE__*/_classPrivateFieldLooseKey("initDraw");

var _draw = /*#__PURE__*/_classPrivateFieldLooseKey("draw");

var _drawComplete = /*#__PURE__*/_classPrivateFieldLooseKey("drawComplete");

var _getZoomByBounds = /*#__PURE__*/_classPrivateFieldLooseKey("getZoomByBounds");

var _clearDrawListeners = /*#__PURE__*/_classPrivateFieldLooseKey("clearDrawListeners");

var _initDrawFreeHand = /*#__PURE__*/_classPrivateFieldLooseKey("initDrawFreeHand");

var _drawFreeHand = /*#__PURE__*/_classPrivateFieldLooseKey("drawFreeHand");

var _drawFreeHandComplete = /*#__PURE__*/_classPrivateFieldLooseKey("drawFreeHandComplete");

var _clearDrawFreeHandListeners = /*#__PURE__*/_classPrivateFieldLooseKey("clearDrawFreeHandListeners");

var MapDrawShapeManager =
/**
 * @param {google.maps.Map} map Google Maps JavaScript API instance
 * @param {Function} callback Callback function that will be called when user draws or clears the draw
 * @param {boolean} drawingMode Flag indicating whether it should set Drawing Mode enabled
 * @param {boolean} drawFreeHandMode Flag indicating whether it should set Draw Free Hand Mode enabled
 * @param {object} polygonOptions Object containing the google polygon options to be used when drawing
 * @param {string} initialPointInnerHtml String with the inner HTML of the draw initial point overlay
 * @param {string} deletePointInnerHtml String with the inner HTML of the draw delete point overlay
 */
function MapDrawShapeManager(map, _callback, drawingMode, drawFreeHandMode, polygonOptions, initialPointInnerHtml, deletePointInnerHtml) {
  var _this = this;

  this.initDrawnShape = function (initialShape) {
    if ((initialShape == null ? void 0 : initialShape.length) > 0 && !_this.drawnShape) {
      var polygons = JstsHelper.processShape(initialShape);

      if (polygons.length > 0) {
        _this.drawnShape = [];
        polygons.forEach(function (p) {
          _this.drawnShape.push(new google.maps.Polygon(_extends({
            path: p
          }, _this.polygonOptions)));
        });

        _classPrivateFieldLooseBase(_this, _setDeleteDrawPoint)[_setDeleteDrawPoint]();
      }
    }
  };

  this.resetDrawnShape = function () {
    if (_this.drawnShape) _this.drawnShape.forEach(function (p) {
      return p.setMap(null);
    });
    if (_this.deleteDrawnShape) _this.deleteDrawnShape.remove();
    _this.drawnShape = null;
    _this.deleteDrawnShape = null;
  };

  this.setDrawFreeHandMode = function (enabled) {
    if (!_this.startedDrawing && !_this.startedDrawingFreeHand) {
      _this.drawFreeHandMode = enabled;
    }
  };

  this.setDrawingMode = function (enabled) {
    if (enabled) {
      if (_this.drawnShape) _this.drawnShape.forEach(function (p) {
        return p.setMap(null);
      });
      if (_this.deleteDrawnShape) _this.deleteDrawnShape.remove();

      if (_this.drawFreeHandMode) {
        _classPrivateFieldLooseBase(_this, _initDrawFreeHand)[_initDrawFreeHand]();
      } else {
        _classPrivateFieldLooseBase(_this, _initDraw)[_initDraw]();
      }
    } else {
      if (_this.initialDrawPoint) _this.initialDrawPoint.remove();
      _this.initialDrawPoint = null;

      if (_this.drawFreeHandMode) {
        if (_this.startedDrawingFreeHand) {
          _this.startedDrawingFreeHand = false;
          MapFunctions.freezeMap(_this.map, false);
          if (_this.drawnShape) _this.drawnShape.forEach(function (p) {
            return p.setMap(_this.map);
          });
          if (_this.deleteDrawnShape) _this.deleteDrawnShape.show(_this.map);

          _classPrivateFieldLooseBase(_this, _clearDrawFreeHandListeners)[_clearDrawFreeHandListeners]();
        }
      } else {
        if (_this.startedDrawing) {
          _this.startedDrawing = false;
          MapFunctions.enableCrossair(_this.map, false);
          if (_this.drawnPolylineDraft) _this.drawnPolylineDraft.setMap(null);
          if (_this.drawnPolygonDraft) _this.drawnPolygonDraft.setMap(null);
          _this.drawnPolylineDraft = null;
          _this.drawnPolygonDraft = null;
          if (_this.drawnShape) _this.drawnShape.forEach(function (p) {
            return p.setMap(_this.map);
          });
          if (_this.deleteDrawnShape) _this.deleteDrawnShape.show(_this.map);

          _classPrivateFieldLooseBase(_this, _clearDrawListeners)[_clearDrawListeners]();
        }
      }
    }
  };

  Object.defineProperty(this, _setInitialDrawPoint, {
    writable: true,
    value: function value(point, callback) {
      _this.initialDrawPoint = new CustomOverlayView(_this.initialPointInnerHtml, point, callback);

      _this.initialDrawPoint.show(_this.map);
    }
  });
  Object.defineProperty(this, _setDeleteDrawPoint, {
    writable: true,
    value: function value() {
      _this.deleteDrawnShape = new CustomOverlayView(_this.deletePointInnerHtml, _classPrivateFieldLooseBase(_this, _getDrawnShapeHighestPoint)[_getDrawnShapeHighestPoint](), function () {
        if (_this.drawnShape) _this.drawnShape.forEach(function (p) {
          return p.setMap(null);
        });
        if (_this.deleteDrawnShape) _this.deleteDrawnShape.remove();
        _this.drawnShape = null;
        _this.deleteDrawnShape = null;

        _this.callback([]);
      });

      if (!_this.startedDrawing && !_this.startedDrawingFreeHand) {
        _this.drawnShape.forEach(function (p) {
          return p.setMap(_this.map);
        });

        _this.deleteDrawnShape.show(_this.map);
      }
    }
  });
  Object.defineProperty(this, _getDrawnShapeHighestPoint, {
    writable: true,
    value: function value() {
      var highestPoint = null;
      var maxLat = 0;

      _this.drawnShape.forEach(function (polygon) {
        polygon.getPath().getArray().forEach(function (point) {
          var lat = point.lat();

          if (lat > maxLat) {
            maxLat = lat;
            highestPoint = point;
          }
        });
      });

      return highestPoint;
    }
  });
  Object.defineProperty(this, _initDraw, {
    writable: true,
    value: function value() {
      if (!_this.startedDrawing) {
        _this.startedDrawing = true;
        MapFunctions.enableCrossair(_this.map, true);

        _classPrivateFieldLooseBase(_this, _draw)[_draw]();
      }
    }
  });
  Object.defineProperty(this, _draw, {
    writable: true,
    value: function value() {
      _this.drawnPolylineDraft = new google.maps.Polyline(_extends({
        map: _this.map
      }, _this.polygonOptions));
      _this.drawnPolygonDraft = new google.maps.Polygon(_extends({
        map: _this.map
      }, _this.polygonOptions, {
        strokeOpacity: 0
      }));
      google.maps.event.addDomListener(_this.map.getDiv(), 'click', function (e) {
        var latLng = MapFunctions.pointToLatLng(_this.map, e);

        if (!_this.initialDrawPoint) {
          _classPrivateFieldLooseBase(_this, _setInitialDrawPoint)[_setInitialDrawPoint](latLng, function () {
            polylinePath.removeAt(polylinePath.length - 1);

            _classPrivateFieldLooseBase(_this, _drawComplete)[_drawComplete]();
          });
        }

        var polylinePath = _this.drawnPolylineDraft.getPath();

        if (polylinePath.length > 0) {
          polylinePath.removeAt(polylinePath.length - 1);
        }

        polylinePath.push(latLng);
        polylinePath.push(latLng);

        _this.drawnPolygonDraft.setPath(polylinePath);
      });
      google.maps.event.addDomListener(_this.map.getDiv(), 'mousemove', function (e) {
        var polylinePath = _this.drawnPolylineDraft.getPath();

        if (polylinePath.length > 0) {
          var latLng = MapFunctions.pointToLatLng(_this.map, e);
          polylinePath.setAt(polylinePath.length - 1, latLng);
        }
      });
      google.maps.event.addListenerOnce(_this.map, 'dblclick', function () {
        setTimeout(function () {
          _classPrivateFieldLooseBase(_this, _drawComplete)[_drawComplete]();
        }, 1);
      });
    }
  });
  Object.defineProperty(this, _drawComplete, {
    writable: true,
    value: function value() {
      _classPrivateFieldLooseBase(_this, _clearDrawListeners)[_clearDrawListeners]();

      _this.startedDrawing = false;
      MapFunctions.enableCrossair(_this.map, false);
      if (_this.initialDrawPoint) _this.initialDrawPoint.remove();
      _this.initialDrawPoint = null;

      _this.drawnPolylineDraft.setMap(null);

      _this.drawnPolygonDraft.setMap(null);

      var polygons = JstsHelper.processPolygon(_this.drawnPolygonDraft.getPath().getArray());
      console.log(_this.drawnPolygonDraft.getPath().getArray());

      if (polygons.length > 0) {
        _this.drawnShape = [];
        var shape = [];
        polygons.forEach(function (p) {
          _this.drawnShape.push(new google.maps.Polygon(_extends({
            path: p
          }, _this.polygonOptions)));

          shape = shape.concat(p.map(function (item) {
            return {
              lat: item.lat(),
              lng: item.lng()
            };
          }));
        });

        _classPrivateFieldLooseBase(_this, _setDeleteDrawPoint)[_setDeleteDrawPoint]();

        _this.callback(shape);
      } else {
        _classPrivateFieldLooseBase(_this, _initDraw)[_initDraw]();
      }
    }
  });
  Object.defineProperty(this, _getZoomByBounds, {
    writable: true,
    value: function value(bounds) {
      var MAX_ZOOM = _this.map.mapTypes.get(_this.map.getMapTypeId()).maxZoom || 21;
      var MIN_ZOOM = _this.map.mapTypes.get(_this.map.getMapTypeId()).minZoom || 0;

      var ne = _this.map.getProjection().fromLatLngToPoint(bounds.getNorthEast());

      var sw = _this.map.getProjection().fromLatLngToPoint(bounds.getSouthWest());

      var worldCoordWidth = Math.abs(ne.x - sw.x);
      var worldCoordHeight = Math.abs(ne.y - sw.y); //Fit padding in pixels

      var FIT_PAD = 40;

      for (var zoom = MAX_ZOOM; zoom >= MIN_ZOOM; --zoom) {
        if (worldCoordWidth * (1 << zoom) + 2 * FIT_PAD < $(_this.map.getDiv()).width() && worldCoordHeight * (1 << zoom) + 2 * FIT_PAD < $(_this.map.getDiv()).height()) return zoom;
      }

      return 0;
    }
  });
  Object.defineProperty(this, _clearDrawListeners, {
    writable: true,
    value: function value() {
      google.maps.event.clearListeners(_this.map.getDiv(), 'click');
      google.maps.event.clearListeners(_this.map.getDiv(), 'mousemove');
      google.maps.event.clearListeners(_this.map, 'dblclick');
    }
  });
  Object.defineProperty(this, _initDrawFreeHand, {
    writable: true,
    value: function value() {
      if (!_this.startedDrawingFreeHand) {
        _this.startedDrawingFreeHand = true;
        MapFunctions.freezeMap(_this.map, true);

        _classPrivateFieldLooseBase(_this, _drawFreeHand)[_drawFreeHand]();
      }
    }
  });
  Object.defineProperty(this, _drawFreeHand, {
    writable: true,
    value: function value() {
      _this.drawnPolylineDraft = new google.maps.Polyline(_extends({
        map: _this.map
      }, _this.polygonOptions));
      google.maps.event.addListenerOnce(_this.map, 'mousedown', function (e) {
        event.preventDefault(); // eslint-disable-line no-restricted-globals

        event.stopPropagation(); // eslint-disable-line no-restricted-globals

        if (!_this.initialDrawPoint) {
          _classPrivateFieldLooseBase(_this, _setInitialDrawPoint)[_setInitialDrawPoint](e.latLng);
        }

        _this.drawnPolylineDraft.getPath().push(e.latLng);

        google.maps.event.addListener(_this.map, 'mousemove', function (e) {
          _this.drawnPolylineDraft.getPath().push(e.latLng);
        });
        google.maps.event.addListenerOnce(_this.map, 'mouseup', function () {
          _classPrivateFieldLooseBase(_this, _drawFreeHandComplete)[_drawFreeHandComplete]();
        });
      });
    }
  });
  Object.defineProperty(this, _drawFreeHandComplete, {
    writable: true,
    value: function value() {
      _classPrivateFieldLooseBase(_this, _clearDrawFreeHandListeners)[_clearDrawFreeHandListeners]();

      _this.startedDrawingFreeHand = false;
      MapFunctions.freezeMap(_this.map, false);
      if (_this.initialDrawPoint) _this.initialDrawPoint.remove();
      _this.initialDrawPoint = null;

      _this.drawnPolylineDraft.setMap(null);

      var polygons = JstsHelper.processPolygon(_this.drawnPolylineDraft.getPath().getArray(), MapFunctions.getZoom(_this.map));

      if (polygons.length > 0) {
        _this.drawnShape = [];
        var shape = [];
        polygons.forEach(function (p) {
          _this.drawnShape.push(new google.maps.Polygon(_extends({
            path: p
          }, _this.polygonOptions)));

          shape = shape.concat(p.map(function (item) {
            return {
              lat: item.lat(),
              lng: item.lng()
            };
          }));
        });

        _classPrivateFieldLooseBase(_this, _setDeleteDrawPoint)[_setDeleteDrawPoint]();

        _this.callback(shape);
      } else {
        _classPrivateFieldLooseBase(_this, _initDrawFreeHand)[_initDrawFreeHand]();
      }
    }
  });
  Object.defineProperty(this, _clearDrawFreeHandListeners, {
    writable: true,
    value: function value() {
      google.maps.event.clearListeners(_this.map, 'mousedown');
      google.maps.event.clearListeners(_this.map, 'mousemove');
      google.maps.event.clearListeners(_this.map, 'mouseup');
    }
  });
  this.map = map;
  this.callback = _callback;
  this.drawFreeHandMode = drawFreeHandMode;
  this.polygonOptions = polygonOptions;
  this.initialPointInnerHtml = initialPointInnerHtml;
  this.deletePointInnerHtml = deletePointInnerHtml;
  this.initialDrawPoint = null;
  this.startedDrawing = false;
  this.startedDrawingFreeHand = false;
  this.drawnPolylineDraft = null;
  this.drawnPolygonDraft = null;
  this.drawnShape = null;
  this.deleteDrawnShape = null;
  this.setDrawingMode(drawingMode);
}
/**
 * It draws a shape on the map using the provided shape
 * @param {object[]} initialShape Array of objects that contain lat lng values
 */
;

exports.default = MapDrawShapeManager;
//# sourceMappingURL=google-maps-draw-shape-lib.cjs.development.js.map
