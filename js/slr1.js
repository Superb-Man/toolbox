/*jslint browser: true*/
/*global $, initLRParserPage, createSLR1Builder, genAutomatonSLR1*/

$(document).ready(function () {
    'use strict';
    initLRParserPage(createSLR1Builder, genAutomatonSLR1);
});
