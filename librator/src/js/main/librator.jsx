function getExpressions() {
    var comp = app.project.activeItem;
    if (comp == null || !(comp instanceof CompItem)) {
        return JSON.stringify([]);
    }

    var layer = comp.layer("ExpressionsLibrary");
    if (layer == null) {
        layer = comp.layers.addText("[]");
        layer.name = "ExpressionsLibrary";
        layer.enabled = false;
    }

    var expressions = layer.sourceText.value.text;
    return expressions;
}

function saveExpression(expression) {
    var comp = app.project.activeItem;
    if (comp == null || !(comp instanceof CompItem)) {
        return 'error';
    }

    var layer = comp.layer("ExpressionsLibrary");
    if (layer == null) {
        layer = comp.layers.addText("[]");
        layer.name = "ExpressionsLibrary";
        layer.enabled = false;
    }

    var expressions = JSON.parse(layer.sourceText.value.text);
    expressions.push(expression);
    layer.sourceText.setValue(JSON.stringify(expressions));
    return 'success';
}

function applyExpression(expression) {
    var comp = app.project.activeItem;
    if (comp == null || !(comp instanceof CompItem)) {
        return 'error';
    }

    var selectedProperties = comp.selectedProperties;
    if (selectedProperties.length == 0) {
        return 'error';
    }

    for (var i = 0; i < selectedProperties.length; i++) {
        selectedProperties[i].expression = expression;
    }
    return 'success';
}
