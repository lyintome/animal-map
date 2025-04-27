document.addEventListener('DOMContentLoaded', () => {
    // 1) School center & bounds (~±0.0035° ≈ 400 m)
    const center = [-37.85002, 144.72234];
    const bounds = L.latLngBounds(
      [center[0] - 0.0035, center[1] - 0.0035],
      [center[0] + 0.0035, center[1] + 0.0035]
    );
  
    // 2) Initialize map
    const map = L.map('map', {
      center,
      zoom: 17,
      minZoom: 16,
      maxZoom: 19,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0
    });
  
    // 3) Add Esri satellite imagery + labels
    L.esri.basemapLayer('Imagery').addTo(map);
    L.esri.basemapLayer('ImageryLabels').addTo(map);
  
    // 4) Static building markers (custom labels)
    const buildings = [
      { name: 'Horsburgh Centre', coords: [-37.8485, 144.7230] },
      { name: 'Andrew Park Oval', coords:  [-37.8490, 144.7215] },
      { name: 'Science Block',     coords:  [-37.8508, 144.7228] },
      { name: 'Library',           coords:  [-37.8502, 144.7235] }
    ];
    buildings.forEach(b => {
      L.marker(b.coords)
       .addTo(map)
       .bindPopup(`<b>${b.name}</b>`);
    });
  
    // 5) Student tags layer & toggle control
    const tags = L.layerGroup().addTo(map);
    let tagsVisible = true;
    document.getElementById('toggleTags').addEventListener('click', () => {
      tagsVisible = !tagsVisible;
      tagsVisible ? tags.addTo(map) : tags.removeFrom(map);
      document.getElementById('toggleTags').textContent =
        tagsVisible ? 'Hide Tags' : 'Show Tags';
    });
  
    // 6) Animal Name Input Box & Adding Tags
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
  
      // Create an input box for the animal name
      const animalName = prompt("Enter the animal name:");
  
      if (!animalName) return;
  
      // Add marker
      const marker = L.marker([lat, lng]).addTo(tags);
  
      // Save marker with the animal name in Firestore
      db.collection("tags").add({
        lat,
        lng,
        animalName,
      });
  
      // Bind popup with animal name input
      const popupHtml = `
        <div>
          <b>Student Tag</b><br>
          Animal: ${animalName}<br>
          Lat: ${lat.toFixed(5)}<br>
          Lng: ${lng.toFixed(5)}
          <button class="remove-btn">Remove Tag</button>
        </div>
      `;
      marker.bindPopup(popupHtml).openPopup();
  
      marker.on('popupopen', () => {
        document.querySelector('.remove-btn').onclick = () => {
          // Remove tag from Firestore
          db.collection("tags").where("lat", "==", lat).where("lng", "==", lng).get()
            .then(querySnapshot => {
              querySnapshot.forEach(doc => doc.ref.delete());
            });
          tags.removeLayer(marker);
        };
      });
    });
  
    // 7) Load all tags from Firestore on page load
    db.collection("tags").get().then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const marker = L.marker([data.lat, data.lng]).addTo(tags);
        const popupHtml = `
          <div>
            <b>Student Tag</b><br>
            Animal: ${data.animalName}<br>
            Lat: ${data.lat.toFixed(5)}<br>
            Lng: ${data.lng.toFixed(5)}
            <button class="remove-btn">Remove Tag</button>
          </div>
        `;
        marker.bindPopup(popupHtml);
      });
    });
  
    console.log('✅ Firebase setup with persistent tags loaded.');
  });
  