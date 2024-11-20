LeafletWidget.methods.extendLayerControl = function(viewSettings, homeSettings, setviewonselect, opacityControl, includelegends) {
  const map = this;

  // Handle view settings for each layer on 'overlayadd' or 'baselayerchange'
  map.on('overlayadd baselayerchange', function(e) {
    let setting = viewSettings[e.name];
    if (setting && setviewonselect) handleView(map, setting);
  });

  // Handle home buttons
  if (homeSettings) {
    setTimeout(() => {
      Object.entries(homeSettings).forEach(([layer, options]) => {
        let homeButton = document.createElement('span');
        Object.assign(homeButton.style, {
          cursor: options.cursor || 'pointer',
          cssText: options.styles || 'float: inline-end;'
        });
        homeButton.className = options.class || 'leaflet-home-btn';
        homeButton.dataset.layer = layer;
        homeButton.innerHTML = options.text || '🏠';

        appendToLabelHome(layer, homeButton);

        homeButton.addEventListener('click', function(event) {
          event.preventDefault();
          event.stopPropagation();
          let setting = viewSettings[this.dataset.layer];
          if (setting) handleView(map, setting);
        });
      });
    }, 20);
  }

  // Handle opacity control
  if (opacityControl) {
    // Helper function to check if the layer is active
    function isLayerActive(layerName) {
      return Object.keys(map.layerManager._groupContainers).some(function(layer) {
        return layer === layerName;
      });
    }

    setTimeout(() => {
      Object.entries(opacityControl).forEach(([layer, options]) => {
        let sliderContainer = document.createElement('div');
        let slider = document.createElement('input');
        Object.assign(slider, {
          type: 'range',
          min: options.min || 0,
          max: options.max || 1,
          step: options.step || 0.1,
          value: options.default || 1,
          style: `width: ${options.width || '100%'};`
        });
        slider.className = options.class || 'leaflet-opacity-slider';
        sliderContainer.style.display = 'none';
        sliderContainer.appendChild(slider);

        appendToLabel(layer, sliderContainer);

        slider.addEventListener('input', function() {
          let opacityVal = parseFloat(this.value);
          Object.values(map.layerManager._byGroup[layer]).forEach(layer => {
            if (layer.setOpacity) {
              layer.setOpacity(opacityVal);
            } else if (layer.setStyle) {
              layer.setStyle({ opacity: opacityVal, fillOpacity: opacityVal });
            }
          });
        });

        // Initialize slider visibility based on the current state of the layer
        if (isLayerActive(layer)) {
          sliderContainer.style.display = 'block';
        }

        // Handle layer visibility
        map.on('overlayadd overlayremove baselayerchange', function(e) {
          if (e.name === layer) {
            sliderContainer.style.display = (e.type === 'overlayadd' || e.type === 'baselayerchange') ? 'block' : 'none';
          }
        });

      });
    }, 30);
  }

  // Handle legends
  if (includelegends) {
    function moveLegends() {
      Object.entries(map.controls._controlsById).forEach(([controlId, control]) => {
        let legendContainer = control._container;
        if (legendContainer) {
          appendToLabel(controlId, legendContainer)
        }
      });

      // Fix for leaflegend package
      let elements = document.querySelectorAll('[class*="leaflegend-group"]');
      elements.forEach(function(element) {
        // Find the class that starts with 'leaflegend-group-'
        let groupClass = Array.from(element.classList).find(cls => cls.startsWith('leaflegend-group-'));

        if (groupClass) {
          // Extract everything after 'leaflegend-group-'
          let groupName = groupClass.split('leaflegend-group-')[1];
          appendToLabel(groupName, element)
        }
      });

    }
    setTimeout(moveLegends, 40);
    map.on('overlayadd baselayerchange', () => setTimeout(moveLegends, 20));
  }
};



// function to handle setting view or bounds
function handleView(map, setting) {
  if (setting.coords) {
    const method = setting.fly ? 'flyTo' : 'setView';
    map[method]([setting.coords[1], setting.coords[0]], setting.zoom, setting.options);
  } else if (setting.bounds) {
    const method = setting.fly ? 'flyToBounds' : 'fitBounds';
    const bounds = [[setting.bounds[1], setting.bounds[0]], [setting.bounds[3], setting.bounds[2]]];
    map[method](bounds, setting.options);
  }
}

// function to find the correct label element
function findLabel(layerName) {
  return Array.from(document.querySelectorAll('.leaflet-control-layers label:not([class])')).find(label =>
    $(label).find("span")[0].textContent.trim() === layerName
  );
}

// function to append a child to the label element
function appendToLabel(layer, childElement) {
  const label = findLabel(layer);
  if (label) {
    let labelDiv = label.querySelector('div') || document.createElement('div');
    labelDiv.appendChild(childElement);
    label.appendChild(labelDiv);
  }
}

// function to append a child to the label element
function appendToLabelHome(layer, childElement) {
  const label = findLabel(layer);
  if (label) {
    let labelDiv = label.querySelector('div')
    if (labelDiv) {
      labelDiv.appendChild(childElement);
    } else {
      label.appendChild(childElement);
    }
  }
}