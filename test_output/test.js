
(function getSelectedLayerType() {
  /**
   * Gets the type of a given layer
   *
   * @param {Layer} layer Layer to check
   * @return {string}     Layer type
   */
  function getLayerType(layer) {
    switch (layer.matchName) {
      case "ADBE Vector Layer":
        return layer.matchName;
      case "ADBE Text Layer":
        return layer.matchName;
      case "ADBE Camera Layer":
        return layer.matchName;
      case "ADBE Light Layer":
        return layer.matchName;
      case "ADBE AV Layer":
        if (layer.nullLayer === true) {
          return "Null";
        } else if (layer.adjustmentLayer === true) {
          return "Adjustment";
        } else if (layer.guideLayer === true) {
          return "Guide";
        } else if (layer.source instanceof CompItem) {
          return "Precomp";
        } else if (layer.source.mainSource instanceof SolidSource) {
          return "Solid";
        } else if (layer.source.mainSource instanceof PlaceholderSource) {
          return "Placeholder";
        } else if (layer.source.mainSource instanceof FileSource) {
          if (layer.source.footageMissing == true) {
            return "Missing Footage";
          }

          var priorLayerState = layer.enabled;
          layer.enabled = true;
          var importIsData = layer.enabled == false;
          layer.enabled = priorLayerState;

          if (importIsData) {
            return "Data";
          }

          if (!layer.source.hasVideo && layer.source.hasAudio) {
            return "Audio";
          }

          return "Image";
        }

        return "Invalid";
    }
  }

  var comp = app.project.activeItem;
  var layer = comp.selectedLayers[0];
  $.writeln(getLayerType(layer));
})();
