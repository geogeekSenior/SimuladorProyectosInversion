require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/Graphic",
  "esri/geometry/Point"
], function(
  Map, 
  SceneView, 
  FeatureLayer, 
  GraphicsLayer, 
  Graphic, 
  Point
) {
  const config = {
      initialCamera: {
          position: {
              longitude: -74.5795,
              latitude: 4.4326,
              z: 100000
          },
          heading: 0,
          tilt: 45
      },
      budget: 15000
  };

  class FeatureSet {
      constructor() {
          this.features = [];
          this.allAttributes = [];
      }

      agregarFeature(graphic) {
          this.features.push(graphic);
      }

      setAllAttributes(attributes) {
          this.allAttributes = attributes;
      }

      obtenerAtributos() {
          return this.features.map(feature => feature.attributes);
      }

      obtenerGeometrias() {
          return this.features.map(feature => ({
              id: feature.attributes.objectid,
              longitude: feature.geometry.longitude,
              latitude: feature.geometry.latitude
          }));
      }

      filtrarAtributos(condicion) {
          return this.features
              .map(feature => feature.attributes)
              .filter(condicion);
      }

      obtenerAtributosOriginales() {
          return this.allAttributes;
      }

      resumenProyectos() {
          const atributos = this.obtenerAtributos();
          return {
              totalProyectos: atributos.length,
              totalInversion: atributos.reduce((total, attr) => total + attr.valorinversion, 0),
              proyectosMayores5000: atributos.filter(attr => attr.valorinversion > 5000).length
          };
      }
  }

  const appState = {
      proyectos: [],
      puntosProyectos: [],
      detallesPuntos: [],
      proyectosUsados: new Set(),
      proyectoSeleccionado: null,
      mapClickMode: false,
      presupuestoDisponible: config.budget,
      miFeatureSet: new FeatureSet()
  };

  const map = new Map({
      basemap: "satellite",
      ground: "world-elevation"
  });

  const view = new SceneView({
      container: "viewDiv",
      map: map,
      camera: config.initialCamera,
      ui: {
          components: []
      }
  });

  view.popupEnabled = true;

  const userPointsLayer = new GraphicsLayer({
      title: "Puntos de Proyectos"
  });

  map.add(userPointsLayer);

  function normalizarAtributos(attributes) {
      return Object.keys(attributes).reduce((acc, key) => {
          acc[key.toLowerCase()] = attributes[key];
          return acc;
      }, {});
  }

  function actualizarPresupuesto() {
      const presupuestoElement = document.getElementById('presupuestoTotal');
      if (presupuestoElement) {
          presupuestoElement.textContent = `Presupuesto Disponible: $${appState.presupuestoDisponible.toLocaleString()}`;
      }
  }

  view.on('click', (event) => {
      if (!appState.mapClickMode) {
          return;
      }

      const mapInstructions = document.getElementById('map-instructions');
      mapInstructions.style.display = 'none';

      const proyectoSeleccionado = appState.proyectoSeleccionado;
      
      if (!proyectoSeleccionado) {
          return;
      }

      const proyectoAttr = proyectoSeleccionado.attributes;
      
      if (proyectoAttr.valorinversion > appState.presupuestoDisponible) {
          alert(`Presupuesto insuficiente. El proyecto requiere $${proyectoAttr.valorinversion.toLocaleString()}`);
          return;
      }

      const puntoCreado = crearPuntoProyecto(proyectoAttr, event.mapPoint);
      if (puntoCreado) {
          appState.presupuestoDisponible -= proyectoAttr.valorinversion;
          actualizarPresupuesto();

          const projectDiv = document.querySelector(`[data-id="${proyectoAttr.objectid}"]`);
          if (projectDiv) {
              projectDiv.classList.add('disabled');
              projectDiv.setAttribute('disabled', 'true');
          }

          appState.mapClickMode = false;
          appState.proyectoSeleccionado = null;
      }
  });

  function crearPuntoProyecto(proyecto, coordenadas) {
      const proyectoNormalizado = normalizarAtributos(proyecto);

      if (!proyectoNormalizado.objectid || 
          !coordenadas?.longitude || 
          !coordenadas?.latitude || 
          appState.proyectosUsados.has(proyectoNormalizado.objectid)) {
          return null;
      }

      try {
          const punto = new Point({
              longitude: coordenadas.longitude,
              latitude: coordenadas.latitude
          });

          const puntoGraphic = new Graphic({
              geometry: punto,
              symbol: {
                  type: "point-3d",
                  symbolLayers: [{
                      type: "icon",
                      size: 15,
                      resource: { primitive: "circle" },
                      material: { color: [76, 175, 80, 0.8] }
                  }]
              },
              attributes: proyectoNormalizado,
              popupTemplate: {
                  title: proyectoNormalizado.proyecto,
                  content: [
                      {
                          type: "text",
                          text: `
                              <div style="padding: 10px;">
                                  <h3>${proyectoNormalizado.proyecto}</h3>
                                  <p><strong>ID del Proyecto:</strong> ${proyectoNormalizado.objectid}</p>
                                  <p><strong>Valor de Inversión:</strong> $${proyectoNormalizado.valorinversion.toLocaleString()}</p>
                              </div>
                          `
                      }
                  ]
              }
          });

          userPointsLayer.add(puntoGraphic);

          const detallePunto = {
              id: proyectoNormalizado.objectid,
              nombre: proyectoNormalizado.proyecto,
              coordenadas: {
                  longitud: coordenadas.longitude,
                  latitud: coordenadas.latitude
              },
              valorInversion: proyectoNormalizado.valorinversion,
              atributos: proyectoNormalizado
          };

          appState.miFeatureSet.agregarFeature(puntoGraphic);
          appState.puntosProyectos.push(puntoGraphic);
          appState.detallesPuntos.push(detallePunto);
          appState.proyectosUsados.add(proyectoNormalizado.objectid);

          view.goTo({ target: puntoGraphic, zoom: 12 }).catch(console.error);

          return puntoGraphic;
      } catch (error) {
          console.error("Error al crear punto de proyecto:", error);
          return null;
      }
  }

  const proyectosLayer = new FeatureLayer({
      url: "https://geospatialcenter.bd.esri.com/server/rest/services/Hosted/ProyectosPesos/FeatureServer/0"
  });

  proyectosLayer.queryFeatures({
      where: "1=1",
      outFields: ["*"],
      returnGeometry: true
  }).then(function(results) {
      appState.miFeatureSet.setAllAttributes(
          results.features.map(feature => normalizarAtributos(feature.attributes))
      );

      appState.proyectos = results.features.map(feature => ({
          attributes: normalizarAtributos(feature.attributes),
          geometry: feature.geometry
      }));

      const projectListDiv = document.getElementById('projectList');
      const loadingIndicator = document.getElementById('loadingIndicator');
      loadingIndicator.style.display = 'none';

      appState.proyectos.forEach(proyecto => {
          const projectDiv = document.createElement('div');
          projectDiv.className = 'project-item';
          
          const superaPresupuesto = proyecto.attributes.valorinversion > appState.presupuestoDisponible;
          
          if (superaPresupuesto) {
              projectDiv.classList.add('disabled');
              projectDiv.setAttribute('disabled', 'true');
          }

          projectDiv.innerHTML = `
              <h3>${proyecto.attributes.proyecto}</h3>
              <p>ID: ${proyecto.attributes.objectid}</p>
              <p>Valor Inversión: $${proyecto.attributes.valorinversion.toLocaleString()}</p>
              ${superaPresupuesto ? '<p class="excede-presupuesto">Presupuesto Insuficiente</p>' : ''}
          `;

          const handleProyectoClick = () => {
              if (appState.proyectosUsados.has(proyecto.attributes.objectid) || 
                  proyecto.attributes.valorinversion > appState.presupuestoDisponible) {
                  return;
              }

              const mapInstructions = document.getElementById('map-instructions');
              mapInstructions.style.display = 'block';
              mapInstructions.textContent = `Haz clic en el mapa para ubicar el proyecto: ${proyecto.attributes.proyecto}`;

              appState.mapClickMode = true;
              appState.proyectoSeleccionado = proyecto;
          };

          projectDiv.addEventListener('click', handleProyectoClick);
          projectDiv.setAttribute('data-id', proyecto.attributes.objectid);
          projectListDiv.appendChild(projectDiv);
      });

      actualizarPresupuesto();
      window.miFeatureSet = appState.miFeatureSet;

  }).catch(function(error) {
      console.error("Error al cargar proyectos:", error);
      const loadingIndicator = document.getElementById('loadingIndicator');
      loadingIndicator.textContent = 'Error al cargar los proyectos';
      loadingIndicator.style.color = 'red';
  });
});