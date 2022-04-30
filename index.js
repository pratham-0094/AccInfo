function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(updateMap);
  } else {
    console.log("error");
  }
}

onClick = (e) => {
  var popup = document.getElementById(`myPopup_${e}`);
  popup.classList.toggle("show");
};

const fetchLocationName = async (lat, lng) => {
  await fetch(
    "https://www.mapquestapi.com/geocoding/v1/reverse?key=z9tSNYYUmjTQRHH6AJTQTSHBrD50LGN6&location=" +
      lat +
      "%2C" +
      lng +
      "&outFormat=json&thumbMaps=false"
  )
    .then((response) => response.json())
    .then((responseJson) => {
      // console.log(responseJson); //address
      address = responseJson.results[0].locations[0].adminArea3;
      return address;
    });
};

function updateMap(position) {
  currlat = position.coords.latitude;
  currlong = position.coords.longitude;

  mapboxgl.accessToken =
    "pk.eyJ1IjoicHJha2hhci0yMDM5IiwiYSI6ImNrdXprdWJsZzJydTIydWxua3dndXdrOGMifQ.230CGpqLIXY3Z3ySPUTMYQ";
  var map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/prakhar-2039/ckvtl5wnq24hv14l5xcxp5nj3",
    zoom: 6.5,
    center: [position.coords.longitude, position.coords.latitude],
  });

  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      // When active the map will receive updates to the device's location as it changes.
      trackUserLocation: true,
      // Draw an arrow next to the location dot to indicate which direction the device is heading.
      showUserHeading: true,
    })
  );
  // When the user clicks on <div>, open the popup

  // console.log(position);
  // console.log(position.coords);
  new mapboxgl.Marker({
    draggable: false,
    color: "BLACK",
  })
    .setLngLat([currlong, currlat])
    .addTo(map);
  address = fetchLocationName(currlat, currlong);
  fetch("./data.json")
    .then((response) => response.json())
    .then((rsp) => {
      map.on("load", async () => {
        for (index in rsp.data) {
          country = rsp.data[index];
          // console.log(country); //all city name
          // console.log(index); //key name
          // console.log(Object.keys(rsp.data)); //all key name inside data
          if (index == address) {
            for (city in country) {
              longitude = country[city].longitude;
              latitude = country[city].latitude;
              // console.log(country[city].latitude); //latitude
              // console.log(country[city].longitude); //longitude
              // console.log(Object.keys(rsp.data));
              // console.log(country[city].id);
              // console.log(city);
              // console.log(country[city].description);
              code = country[city].id;
              desc = country[city].description;
              type = country[city].type;
              loc = country[city].location;
              alt = country[city].city;
              time = country[city].time;
              image = country[city].image;

              await map.addSource(`places_${code}`, {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: [
                    {
                      type: "Feature",
                      properties: {
                        description: `<div style="font-size:14px;margin:4px;">${desc}<br><br><b>Location</b> : ${loc} ,${alt}<br><b>Time</b> : ${time}<br><br>
                        <img src=${image} alt="" srcset="" width="210px"></div>
                        `,
                        heading: `${type}`,
                      },
                      geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude],
                      },
                    },
                  ],
                },
              });

              // Add a layer showing the places.
              map.addLayer({
                id: `places_${code}`,
                type: "circle",
                source: `places_${code}`,
                paint: {
                  "circle-color": "RED",
                  "circle-radius": 6,
                  "circle-stroke-width": 2,
                  "circle-stroke-color": "#ffffff",
                },
              });

              map.on("click", `places_${code}`, (e) => {
                // Copy coordinates array.
                const coordinates = e.features[0].geometry.coordinates.slice();
                const description = e.features[0].properties.description;

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                  coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                new mapboxgl.Popup()
                  .setLngLat(coordinates)
                  .setHTML(description)
                  .addTo(map);
              });

              // Create a popup, but don't add it to the map yet.
              const popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
              });

              map.on("mouseenter", `places_${code}`, (e) => {
                // Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = "pointer";

                // Copy coordinates array.
                const coordinates = e.features[0].geometry.coordinates.slice();
                const description = `<div style="font-size:12px;margin:4px;"><b>${
                  e.features[0].properties.heading
                }</b> : ${e.features[0].properties.description.slice(40, 56)}
                  ...</div>`;

                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                  coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                // Populate the popup and set its coordinates
                // based on the feature found.
                popup.setLngLat(coordinates).setHTML(description).addTo(map);
              });

              map.on("mouseleave", `places_${code}`, () => {
                map.getCanvas().style.cursor = "";
                popup.remove();
              });
            }
          }
        }
      });
    });
}
getLocation();
