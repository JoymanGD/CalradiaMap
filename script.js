var mapExtent = [0.00000000, -3200.00000000, 4000.00000000, 0.00000000];
var viewSize = [mapExtent[2], -mapExtent[1]];
var mapMinZoom = 0;
var mapMaxZoom = 4;
var mapMaxResolution = 1.00000000;
var tileExtent = [0.00000000, -3200.00000000, 4000.00000000, 0.00000000];

var mapResolutions = [];
for (var z = 0; z <= mapMaxZoom; z++) {
  mapResolutions.push(Math.pow(2, mapMaxZoom - z) * mapMaxResolution);
}

var mapTileGrid = new ol.tilegrid.TileGrid({
  extent: tileExtent,
  minZoom: mapMinZoom,
  resolutions: mapResolutions
});

var layer = new ol.layer.Tile({
  source: new ol.source.XYZ({
    projection: 'PIXELS',
    tileGrid: mapTileGrid,
    tilePixelRatio: 1.00000000,
    url: "Tiles/{z}/{x}/{y}.jpg"
  })
});

class MapView extends ol.View {
  constructor(mapExtent, mapMinZoom, mapTileGrid) {
    const center = ol.extent.getCenter(mapExtent);
    const projection = ol.proj.get('PIXELS');
    const extent = mapExtent;
    const maxResolution = mapTileGrid.getResolution(mapMinZoom);
    const constrainOnlyCenter = false;

    super({
      center: center,
      projection: projection,
      extent: extent,
      maxResolution: maxResolution,
      constrainOnlyCenter: constrainOnlyCenter
    });
  }
}

var mapView = new MapView(mapExtent, mapMinZoom, mapTileGrid);

class CustomDragPan extends ol.interaction.DragPan {
    constructor(options) {
        super(options);
        this.setKinetic(null); // Disable kinetic effect
    }
    handleDragEvent(evt) {
        super.handleDragEvent(evt);

        // Get the map view and current center
        const mapView = this.getMap().getView();
        const mapSize = this.getMap().getSize();
        const currentCenter = mapView.getCenter();
        const resolution = mapView.getResolution();

        // Calculate the bounds based on the current view
        const currentExtent = ol.extent.buffer(
            mapView.calculateExtent(mapSize),
            resolution
        );

        // Restrict the map center within the extent bounds
        const constrainedCenter = [
            Math.max(mapExtent[0] + (mapSize[0] / 2) * resolution, Math.min(mapExtent[2] - (mapSize[0] / 2) * resolution, currentCenter[0])),
            Math.max(mapExtent[1] + (mapSize[1] / 2) * resolution, Math.min(mapExtent[3] - (mapSize[1] / 2) * resolution, currentCenter[1]))
        ];

        // Update the map view's center to the constrained center
        if (!ol.coordinate.equals(currentCenter, constrainedCenter)) {
            mapView.setCenter(constrainedCenter);
        }
    }

    // Disable kinetic behavior
    setKinetic(kinetic) {
        this.kinetic = kinetic;
    }
}

var map = new ol.Map({
    target: 'map',
    layers: [
        layer,
    ],
    view: mapView,
    controls: ol.control.defaults(),        // Default map controls
    interactions: [
        new CustomDragPan(),
        new ol.interaction.DragZoom(),
        new ol.interaction.PinchZoom(),
        new ol.interaction.MouseWheelZoom()
    ]
});

// Create a vector source to hold the marker features
const vectorSource = new ol.source.Vector({
    features: [] // Start with an empty array
});

// Create a vector layer to display the markers
const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: new ol.style.Style({
        image: new ol.style.Icon({
            src: 'https://openlayers.org/en/latest/examples/data/icon.png', // Example marker image
            scale: 1 // Scale the icon to adjust its size
        })
    })
});

// Add the vector layer to the map
map.addLayer(vectorLayer);

const popup = new ol.Overlay({
    element: document.getElementById('popup'),
    positioning: 'bottom-center',
    offset: [-30, -100]
});

map.addOverlay(popup);

// Function to add a marker with a description
function addMarker(pixelCoord, description) {
    // Convert pixel coordinates to map coordinates
    const mapSize = viewSize;
    const view = map.getView();
    const pixel = [pixelCoord[0], -pixelCoord[1]];
    const mapCoord = map.getCoordinateFromPixel(pixel);

    // Create a marker feature with a custom property for description
    const markerFeature = new ol.Feature({
        geometry: new ol.geom.Point(pixel),
        description: description // Store the description in the feature
    });

    // Add the marker feature to the vector source
    vectorSource.addFeature(markerFeature);
};

map.on('singleclick', function (evt) {
    const feature = map.getFeaturesAtPixel(evt.pixel)[0];
    if (feature) {
        const coordinate = feature.getGeometry().getCoordinates();
        const description = feature.get('description');
        popup.setPosition(coordinate);
        document.getElementById('popup').innerHTML = description;
        popup.getElement().style.display = 'block';
    } else {
        popup.getElement().style.display = 'none';
    }
});

map.getView().fit(mapExtent, map.getSize());

// Add markers
addMarker([2000, 900], 'Castle #1');
addMarker([1000, 1000], 'Castle #2');
addMarker([3500, 2500], 'Castle #3');