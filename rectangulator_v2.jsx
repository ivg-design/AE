// rectangulator_v2.jsx
// Script to convert a parametric rectangle to a bezier path with individual corner rounding controls

//=====================================================================
// DEPENDENCIES
//=====================================================================

// Include required modules
//@include "./modules/RefManager.js"
//@include "./modules/ApplyFFX.js"
//@include "rectangulator_expressions.js"

// PRODUCTION: Replace @include with inline minified code
// RefManager minified code (will be added in production)
var RefManagerMinified = null; /* PLACEHOLDER_REFMANAGER_MINIFIED */

(function () {
    //=====================================================================
    // BINARY DATA FOR PSEUDO CONTROLLERS
    //=====================================================================

    // Binary data for rectangulator controller (will be added in production)
    var rectangulatorControllerBinary = "RIFX\x00\x00\x12\u00D4FaFXhead\x00\x00\x00\x10\x00\x00\x00\x03\x00\x00\x00D\x00\x00\x00\x01\x01\x00\x00\x00LIST\x00\x00\x12\u00B0bescbeso\x00\x00\x008\x00\x00\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00]\u00A8\x00\x1D\u00F8R\x00\x00\x00\x00\x00d\x00d\x00d\x00d?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FFLIST\x00\x00\x00\u00ACtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x02LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE Effect Parade\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdsn\x00\x00\x00\x17Rectangulator Controls\x00\x00LIST\x00\x00\x00dtdsptdot\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdpl\x00\x00\x00\x04\x00\x00\x00\x01LIST\x00\x00\x00@tdsitdix\x00\x00\x00\x04\u00FF\u00FF\u00FF\u00FFtdmn\x00\x00\x00(ADBE End of path sentinel\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x11$sspcfnam\x00\x00\x000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x06\u00DEparTparn\x00\x00\x00\x04\x00\x00\x00\btdmn\x00\x00\x00(Pseudo/PEM Matchname-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x0E\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\u00FF\u00FF\u00FF\u00FF\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nRectangle Width (px)\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00It$\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nRectangle Height (px)\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00It$\x00\x00\x00\x00\x00B\u00C8\x00\x00B\u00C8\x00\x00\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nTop Left Corner Rounding\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nTop Right Corner Rounding\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nBottom Right Left Corner Rounding\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\nBottom Left Corner Rounding\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00B\u00C8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pard\x00\x00\x00\u0094\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x07Anchor Point \x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x05\x00\x03\x00\x05\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00pdnm\x00\x00\x00eTop Left|Top Center|Top Right|Center Left|Center|Center Right|Bottom Left|Bottom Center|Bottom Right\x00\x00LIST\x00\x00\t\u00FAtdgptdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x17Rectangulator Controls\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0000\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x03tdsn\x00\x00\x00\x01\x00\x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\x00\x00\x00\x02X?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\u00C0\u00C0\u00C0\u00FF\u00C0\u00C0\u00C0\x00\x00\x00\x00\u0080\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdpi\x00\x00\x00\x04\x00\x00\x00\x0Etdmn\x00\x00\x00(Pseudo/PEM Matchname-0001\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x02tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x15Rectangle Width (px)\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0002\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x02tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x16Rectangle Height (px)\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@Y\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0003\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x06tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x19Top Left Corner Rounding\x00\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0004\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x06tdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1ATop Right Corner Rounding\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0005\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\x0Etdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\"Bottom Right Left Corner Rounding\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0006\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x01\btdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x1CBottom Left Corner Rounding\x00tdb4\x00\x00\x00|\u00BD\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdum\x00\x00\x00\b\x00\x00\x00\x00\x00\x00\x00\x00tduM\x00\x00\x00\b@Y\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(Pseudo/PEM Matchname-0007\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00LIST\x00\x00\x00\u00DAtdbstdsb\x00\x00\x00\x04\x00\x00\x00\x01tdsn\x00\x00\x00\x0EAnchor Point \x00tdb4\x00\x00\x00|\u00DB\u0099\x00\x01\x00\x01\x00\x00\x00\x01\x00\u00FF\x00\x00]\u00A8?\x1A6\u00E2\u00EB\x1CC-?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00?\u00F0\x00\x00\x00\x00\x00\x00\x00\x00\x00\x04\x04\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00cdat\x00\x00\x00(@\x14\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00tdmn\x00\x00\x00(ADBE Group End\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00{\"controlName\":\"Rectangulator Controls\",\"matchname\":\"Pseudo/PEM Matchname\",\"controlArray\":[{\"name\":\"Rectangle Width (px)\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":4775142704,\"hold\":false,\"default\":100,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":1000000,\"validMin\":0,\"precision\":2,\"percent\":false,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Rectangle Height (px)\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":8131555788,\"hold\":false,\"default\":100,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":1000000,\"validMin\":0,\"precision\":2,\"percent\":false,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Top Left Corner Rounding\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":9062449761,\"hold\":false,\"default\":0,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":0,\"percent\":true,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Top Right Corner Rounding\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":9570975152,\"hold\":false,\"default\":0,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":0,\"percent\":true,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Bottom Right Left Corner Rounding\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":2486514823,\"hold\":false,\"default\":0,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":0,\"percent\":true,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Bottom Left Corner Rounding\",\"type\":\"slider\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":2606985400,\"hold\":false,\"default\":0,\"sliderMax\":100,\"sliderMin\":0,\"validMax\":100,\"validMin\":0,\"precision\":0,\"percent\":true,\"pixel\":false,\"open\":false,\"errors\":[\n\n],\"error\":[\n\n]},{\"name\":\"Anchor Point \",\"type\":\"popup\",\"canHaveKeyframes\":true,\"canBeInvisible\":true,\"invisible\":false,\"keyframes\":true,\"id\":2054346431,\"hold\":false,\"default\":5,\"content\":\"Top Left|Top Center|Top Right|Center Left|Center|Center Right|Bottom Left|Bottom Center|Bottom Right\",\"error\":[\n\n]}],\"version\":3}";
    var rectangulatorControllerMatchName = "Rectangulator";
    var rectangulatorControllerVersion = "1.0.1";
    var rectangulatorControllerName = "Rectangulator Controls";


    //=====================================================================
    // HELPER FUNCTIONS
    //=====================================================================

    /**
     * Get the composite position of a property including parent transforms
     * @param {Property} prop - The property to get position for
     * @return {Array} - [x, y] position array
     */
    function getCompositePosition(prop) {
        var position = [0, 0];
        var parent = prop.parentProperty;

        // If this is a shape property with its own position
        try {
            if (prop.property && prop.property("ADBE Vector Rect Position")) {
                position = prop.property("ADBE Vector Rect Position").value;
            }
        } catch (e) { }

        // Traverse up the hierarchy to accumulate transforms
        while (parent) {
            try {
                if (parent.property && parent.property("ADBE Vector Transform Group")) {
                    var transform = parent.property("ADBE Vector Transform Group");
                    if (transform.property("ADBE Vector Position")) {
                        var parentPos = transform.property("ADBE Vector Position").value;
                        position = [position[0] + parentPos[0], position[1] + parentPos[1]];
                    }
                }
            } catch (e) { }

            parent = parent.parentProperty;
        }

        return position;
    }

    /**
     * Find a rectangle shape in a property and its children
     * @param {Property} property - The property to search
     * @param {Object} results - Object to store search results
     * @return {Boolean} - True if rectangle found
     */
    function findRectangle(property, results) {
        if (results.found) return true;

        try {
            // Direct match for rectangle shape
            if (property && property.matchName === "ADBE Vector Shape - Rect") {
                results.path = property;
                results.found = true;

                // Store a reference to the rectangle
                results.ref = RefManager.store(property);

                // Store rectangle properties
                try {
                    if (property.property("ADBE Vector Rect Size")) {
                        results.props.size = property.property("ADBE Vector Rect Size").value;
                    }
                } catch (e) { }

                try {
                    if (property.property("ADBE Vector Rect Position")) {
                        results.props.position = property.property("ADBE Vector Rect Position").value;
                    }
                } catch (e) { }

                try {
                    if (property.property("ADBE Vector Rect Roundness")) {
                        results.props.roundness = property.property("ADBE Vector Rect Roundness").value;
                    }
                } catch (e) { }

                // Get the full composite position including all parent transforms
                results.position = getCompositePosition(property);

                // Find and store the containing group
                var parent = property.parentProperty;
                while (parent && parent.matchName !== "ADBE Vector Group") {
                    parent = parent.parentProperty;
                }

                if (parent) {
                    results.groupRef = RefManager.store(parent);
                }

                return true;
            }

            // Special case for groups named "Rectangle" or containing "Rectangle"
            if (property && property.name && property.name.indexOf("Rectangle") !== -1) {
                // This might be a group containing a rectangle, check its contents
                if (property.property("ADBE Vectors Group")) {
                    var contents = property.property("ADBE Vectors Group");
                    for (var r = 1; r <= contents.numProperties; r++) {
                        try {
                            var contentProp = contents.property(r);
                            if (contentProp && contentProp.matchName === "ADBE Vector Shape - Rect") {
                                results.path = contentProp;
                                results.found = true;

                                // Store a reference to the rectangle
                                results.ref = RefManager.store(contentProp);

                                // Store rectangle properties
                                try {
                                    if (contentProp.property("ADBE Vector Rect Size")) {
                                        results.props.size = contentProp.property("ADBE Vector Rect Size").value;
                                    }
                                } catch (e) { }

                                try {
                                    if (contentProp.property("ADBE Vector Rect Position")) {
                                        results.props.position = contentProp.property("ADBE Vector Rect Position").value;
                                    }
                                } catch (e) { }

                                try {
                                    if (contentProp.property("ADBE Vector Rect Roundness")) {
                                        results.props.roundness = contentProp.property("ADBE Vector Rect Roundness").value;
                                    }
                                } catch (e) { }

                                // Get the full composite position including all parent transforms
                                results.position = getCompositePosition(contentProp);

                                // Store the containing group
                                results.groupRef = RefManager.store(property);

                                return true;
                            }
                        } catch (e) { }
                    }
                }
            }

            // Check if it's a group that might contain a rectangle
            if (property && (property.propertyType === PropertyType.INDEXED_GROUP ||
                property.propertyType === PropertyType.NAMED_GROUP)) {
                for (var i = 1; i <= property.numProperties; i++) {
                    try {
                        var subProp = property.property(i);
                        if (subProp) {
                            if (findRectangle(subProp, results)) {
                                return true;
                            }
                        }
                    } catch (e) { }
                }
            }
        } catch (e) { }

        return false;
    }

    /**
     * Get fill, stroke and transform properties from a shape group
     * @param {Property} group - The shape group to analyze
     * @return {Object} - Object containing fills, strokes and transform properties
     */
    function getShapeProperties(group) {
        var result = {
            fills: [],
            strokes: [],
            transform: null
        };

        try {
            if (group && group.property("ADBE Vectors Group")) {
                var vectorsGroup = group.property("ADBE Vectors Group");

                // Check for fill and store its properties
                for (var j = 1; j <= vectorsGroup.numProperties; j++) {
                    try {
                        var prop = vectorsGroup.property(j);
                        if (prop && prop.matchName === "ADBE Vector Graphic - Fill") {
                            var fillObj = {
                                color: prop.property("ADBE Vector Fill Color").value,
                                opacity: prop.property("ADBE Vector Fill Opacity").value,
                                blendMode: prop.property("ADBE Vector Fill Rule").value,
                                enabled: prop.enabled
                            };
                            result.fills.push(fillObj);
                        }
                    } catch (e) { }
                }

                // Check for stroke and store its properties
                for (var k = 1; k <= vectorsGroup.numProperties; k++) {
                    try {
                        var strokeProp = vectorsGroup.property(k);
                        if (strokeProp && strokeProp.matchName === "ADBE Vector Graphic - Stroke") {
                            var strokeObj = {
                                color: strokeProp.property("ADBE Vector Stroke Color").value,
                                opacity: strokeProp.property("ADBE Vector Stroke Opacity").value,
                                width: strokeProp.property("ADBE Vector Stroke Width").value,
                                lineCap: strokeProp.property("ADBE Vector Stroke Line Cap").value,
                                lineJoin: strokeProp.property("ADBE Vector Stroke Line Join").value,
                                miterLimit: strokeProp.property("ADBE Vector Stroke Miter Limit").value,
                                enabled: strokeProp.enabled
                            };
                            result.strokes.push(strokeObj);
                        }
                    } catch (e) { }
                }

                // Get transform properties
                try {
                    if (group.property("ADBE Vector Transform Group")) {
                        var transform = group.property("ADBE Vector Transform Group");
                        result.transform = {
                            position: transform.property("ADBE Vector Position").value,
                            anchorPoint: transform.property("ADBE Vector Anchor Point").value,
                            scale: transform.property("ADBE Vector Scale").value,
                            rotation: transform.property("ADBE Vector Rotation").value,
                            opacity: transform.property("ADBE Vector Group Opacity").value,
                            skew: transform.property("ADBE Vector Skew").value,
                            skewAxis: transform.property("ADBE Vector Skew Axis").value
                        };
                    }
                } catch (e) { }
            }
        } catch (e) { }

        return result;
    }

    /**
     * Apply fill and stroke properties to a shape group
     * @param {Property} vectorsGroup - The vectors group to apply properties to
     * @param {Array} fills - Array of fill property objects
     * @param {Array} strokes - Array of stroke property objects
     */
    function applyFillAndStroke(vectorsGroup, fills, strokes) {
        // Add fills with the same properties
        for (var f = 0; f < fills.length; f++) {
            try {
                var fill = fills[f];
                var newFill = vectorsGroup.addProperty("ADBE Vector Graphic - Fill");
                newFill.property("ADBE Vector Fill Color").setValue(fill.color);
                newFill.property("ADBE Vector Fill Opacity").setValue(fill.opacity);
                newFill.property("ADBE Vector Fill Rule").setValue(fill.blendMode);
                newFill.enabled = fill.enabled;
            } catch (e) { }
        }

        // Add strokes with the same properties
        for (var s = 0; s < strokes.length; s++) {
            try {
                var stroke = strokes[s];
                var newStroke = vectorsGroup.addProperty("ADBE Vector Graphic - Stroke");
                newStroke.property("ADBE Vector Stroke Color").setValue(stroke.color);
                newStroke.property("ADBE Vector Stroke Opacity").setValue(stroke.opacity);
                newStroke.property("ADBE Vector Stroke Width").setValue(stroke.width);
                newStroke.property("ADBE Vector Stroke Line Cap").setValue(stroke.lineCap);
                newStroke.property("ADBE Vector Stroke Line Join").setValue(stroke.lineJoin);
                newStroke.property("ADBE Vector Stroke Miter Limit").setValue(stroke.miterLimit);
                newStroke.enabled = stroke.enabled;
            } catch (e) { }
        }

        // If no fill or stroke was found, add defaults
        if (fills.length === 0) {
            try {
                vectorsGroup.addProperty("ADBE Vector Graphic - Fill");
            } catch (e) { }
        }

        if (strokes.length === 0) {
            try {
                vectorsGroup.addProperty("ADBE Vector Graphic - Stroke");
            } catch (e) { }
        }
    }

    /**
     * Apply transform properties to a transform group
     * @param {Property} transformGroup - The transform group to apply properties to
     * @param {Object} props - Object containing transform properties
     */
    function applyTransformProperties(transformGroup, props) {
        if (!props) return;

        try {
            transformGroup.property("ADBE Vector Position").setValue(props.position);
            transformGroup.property("ADBE Vector Anchor Point").setValue(props.anchorPoint);
            transformGroup.property("ADBE Vector Scale").setValue(props.scale);
            transformGroup.property("ADBE Vector Rotation").setValue(props.rotation);
            transformGroup.property("ADBE Vector Group Opacity").setValue(props.opacity);
            transformGroup.property("ADBE Vector Skew").setValue(props.skew);
            transformGroup.property("ADBE Vector Skew Axis").setValue(props.skewAxis);
        } catch (e) { }
    }

    //=====================================================================
    // MAIN SCRIPT EXECUTION
    //=====================================================================

    // Check if a composition is active
    if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        alert("Please open a composition first.");
        return;
    }

    var comp = app.project.activeItem;
    var selectedLayers = comp.selectedLayers;

    // Check if a layer is selected
    if (selectedLayers.length === 0) {
        alert("Please select a shape layer with a rectangle.");
        return;
    }

    var layer = selectedLayers[0];

    // Check if the selected layer is a shape layer
    if (!(layer instanceof ShapeLayer)) {
        alert("Please select a shape layer with a rectangle.");
        return;
    }

    // Prepare results object to store rectangle search results
    var rectResults = {
        found: false,
        path: null,
        ref: null,
        groupRef: null,
        props: {
            size: [100, 100],
            position: [0, 0],
            roundness: 0
        },
        position: [0, 0]
    };

    // Search for rectangle in shape layer
    try {
        var rootVectors = layer.property("ADBE Root Vectors Group");

        if (rootVectors) {
            for (var i = 1; i <= rootVectors.numProperties; i++) {
                try {
                    var prop = rootVectors.property(i);
                    if (prop && findRectangle(prop, rectResults)) {
                        break;
                    }
                } catch (e) { }
            }
        }

        if (!rectResults.found) {
            alert("No rectangle found in the selected shape layer.");
            return;
        }

        // Begin undo group
        app.beginUndoGroup("Rectangulator");

        // Get original shape properties
        var rectGroup = RefManager.resolve(rectResults.groupRef);
        var shapeProps = getShapeProperties(rectGroup);

        // Create a new shape group
        var contents = layer.property("ADBE Root Vectors Group");
        var newGroup = contents.addProperty("ADBE Vector Group");
        newGroup.name = "Parametric Rectangle";
        var newVectorsGroup = newGroup.property("ADBE Vectors Group");

        // Add the path to the group
        var shapePath = newVectorsGroup.addProperty("ADBE Vector Shape - Group");
        var shapePathRef = RefManager.store(shapePath);

        // Apply fill and stroke properties from the original rectangle
        applyFillAndStroke(newVectorsGroup, shapeProps.fills, shapeProps.strokes);

        // Apply transform properties if available
        if (shapeProps.transform) {
            applyTransformProperties(newGroup.property("ADBE Vector Transform Group"), shapeProps.transform);
        }

        // Apply the pseudo effect to the layer for custom controls
        ApplyFFX.config(
            layer,
            rectangulatorControllerBinary,
            rectangulatorControllerMatchName,
            rectangulatorControllerVersion,
            rectangulatorControllerName
        );

        // Set initial values from the original rectangle
        // These will be handled by the pseudo effect in production
        var effectsProperty = layer.property("ADBE Effect Parade");

        // Apply expressions and link to the controller
        var freshShapePath = RefManager.resolve(shapePathRef);
        if (freshShapePath) {
            freshShapePath.property("ADBE Vector Shape").expression = expressions.path;
        }

        var transformGroup = newGroup.property("ADBE Vector Transform Group");
        if (transformGroup) {
            // Find anchor point and position properties
            var anchorPointProp = transformGroup.property("ADBE Vector Anchor Point");
            var positionProp = transformGroup.property("ADBE Vector Position");

            // Set initial values
            anchorPointProp.setValue([0, 0]);
            positionProp.setValue(rectResults.position);

            // Apply expressions
            anchorPointProp.expression = expressions.anchorPoint;
            positionProp.expression = expressions.position;
        }

        // Remove or hide the original rectangle group
        try {
            var verifyRectGroup = RefManager.resolve(rectResults.groupRef);
            if (verifyRectGroup) {
                try {
                    RefManager.remove(rectResults.groupRef);
                } catch (e1) {
                    try {
                        var parent = verifyRectGroup.parentProperty;
                        if (parent) {
                            for (var r = 1; r <= parent.numProperties; r++) {
                                if (parent.property(r) === verifyRectGroup) {
                                    parent.property(r).remove();
                                    break;
                                }
                            }
                        }
                    } catch (e2) {
                        try {
                            verifyRectGroup.enabled = false;
                        } catch (e3) { }
                    }
                }
            }
        } catch (e) { }

    } catch (err) {
        alert("Error: " + err.toString());
    } finally {
        app.endUndoGroup();
    }
})();